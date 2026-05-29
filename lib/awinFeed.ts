/**
 * awinFeed — parseur + normalisateur de flux produits Awin Datafeed.
 *
 * Brief 2026-05-23 (item 2 du sprint 90+) : ingérer les vrais flux produits
 * Awin pour afficher image+prix+stock sur la page /ma-tenue et /panier au
 * lieu de seulement linker vers une recherche.
 *
 * Pipeline :
 *   1. Awin Datafeed → CSV (UTF-8, virgule, quotes doubles, ~30 colonnes)
 *   2. parseAwinCsv() → Array<RawAwinProduct>
 *   3. normalizeAwinProduct() → ProduitAwin (notre schema canonique)
 *   4. matchProductsForSlot() consomme ProduitAwin[] (lib/productMatching.ts)
 *
 * Spec officielle Awin Datafeed :
 *   https://wiki.awin.com/index.php/Publisher_Datafeed
 *
 * On reste défensif : si une colonne manque ou contient une valeur invalide,
 * le produit est dropped (pas crash) avec un log info pour debug.
 */

import type { ProduitAwin, ProductCategorie, ProductGenre } from "./schema";
import { nearestWadaPalette } from "./wadaPaletteMatch";

/* ──────────────────────────────────────────────────────────────────────
   Schema CSV Awin — colonnes utilisées (sur ~30 disponibles)
   ──────────────────────────────────────────────────────────────────────
   Voir doc Awin Datafeed pour la liste complète. On capture les champs
   essentiels au matching : nom, image, prix, stock, deeplink, marchand,
   couleur, genre, catégorie. Les autres (description longue, ean, weight…)
   sont ignorées. */

export interface RawAwinProduct {
  aw_product_id?: string;
  /** ID variant marchand — varie par taille (Muji feed l'utilise pour
   *  distinguer les tailles d'un même modèle). */
  merchant_product_id?: string;
  product_name?: string;
  description?: string;
  aw_deep_link?: string;
  /** Image principale (Muji feed) — 200×200 détourée fond blanc. */
  aw_image_url?: string;
  /** Miniature 70×70 (Muji feed). */
  aw_thumb_url?: string;
  /** Image grand format (Awin standard) — bien plus large que 200×200,
   *  utilisée pour les cards en vedette plein cadre 4/5 sans flou. */
  large_image?: string;
  /** Image hébergée par le marchand (autres feeds). */
  merchant_image_url?: string;
  search_price?: string;
  store_price?: string;
  currency?: string;
  in_stock?: string;
  /** Signal alternatif (Muji feed) — `1` = à afficher. */
  is_for_sale?: string;
  merchant_name?: string;
  merchant_id?: string;
  category_name?: string;
  category_id?: string;
  /** Chemin catégorie marchand. Souvent vide chez Muji, mais utilisé en
   *  fallback pour détecter le genre par d'autres marchands (Sézane, COS…). */
  merchant_product_category_path?: string;
  colour?: string;
  product_size?: string;
  brand_name?: string;
  custom_1?: string; // gender ou autre, selon le marchand
  display_price?: string;
  last_updated?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   PARSER CSV — simple, robuste aux quotes
   ──────────────────────────────────────────────────────────────────────
   Awin renvoie du CSV standard RFC 4180 :
   - séparateur virgule
   - champs entourés de double-quotes si contiennent virgule ou retour ligne
   - quotes échappées par double-quote ("")
   On évite une dépendance npm (papaparse, csv-parse) ; 30 lignes ici suffisent
   et tournent en Edge Runtime sans souci. */

export function parseAwinCsv(csvText: string): RawAwinProduct[] {
  const lines = splitCsvLines(csvText);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: RawAwinProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length && j < cells.length; j++) {
      row[headers[j]] = cells[j];
    }
    rows.push(row as RawAwinProduct);
  }
  return rows;
}

/** Sépare le texte CSV en lignes en respectant les quotes (les retours
    ligne dans les quotes ne sont PAS des fins de ligne). */
function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      // double-quote échappée
      if (inQuotes && text[i + 1] === '"') {
        current += '""';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (current) lines.push(current);
      current = "";
      // skip \r\n combo
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Parse une ligne CSV en tableau de cellules. Respecte les quotes. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

/* ──────────────────────────────────────────────────────────────────────
   NORMALISATEUR — RawAwinProduct → ProduitAwin (schema canonique WADA)
   ──────────────────────────────────────────────────────────────────────
   Mapping :
   - aw_product_id    → id (préfixé par slug-marchand pour unicité globale)
   - product_name     → nom
   - aw_deep_link     → urlProduit (DÉJÀ trackée Awin, ne pas re-wrapper)
   - merchant_image_url → image
   - search_price     → prix (number)
   - currency         → devise
   - in_stock         → enStock (true/false)
   - merchant_name    → marchand
   - colour           → couleurNom (+ inférence hex)
   - category_name    → categorie (mapping vers nos 5 catégories)
   - custom_1/brand   → genre (homme/femme/unisexe) */

const CATEGORY_MAPPING: Record<string, ProductCategorie> = {
  // Top
  "tops": "haut", "t-shirts": "haut", "shirts": "haut", "knitwear": "haut",
  "polos": "haut", "sweatshirts": "haut", "blouses": "haut", "tee-shirts": "haut",
  "dresses & skirts": "haut", "robes": "haut", // robes = "haut" (à défaut d'un slot dédié)
  // Bottom
  "trousers": "bas", "pants": "bas", "jeans": "bas", "shorts": "bas",
  "skirts": "bas", "chinos": "bas",
  // Outerwear
  "jackets": "veste", "coats": "veste", "blazers": "veste", "outerwear": "veste",
  "puffer-jackets": "veste",
  // Shoes
  "shoes": "chaussures", "sneakers": "chaussures", "boots": "chaussures",
  "loafers": "chaussures", "sandals": "chaussures",
  "footwear": "chaussures",
  // Accent
  "accessories": "accent", "bags": "accent", "belts": "accent", "hats": "accent",
  "scarves": "accent", "sunglasses": "accent",
};

/** Catégories Muji explicitement EXCLUES de l'affichage public — brief
 *  2026-05-27 §4 « rester tenue de ville ». normalizeAwinProduct() drop
 *  ces lignes au lieu de les normaliser. */
const EXCLUDED_CATEGORIES = new Set(["underwear", "nightwear"]);

function isExcludedCategory(categoryName?: string): boolean {
  if (!categoryName) return false;
  const norm = categoryName.toLowerCase().trim();
  for (const ex of EXCLUDED_CATEGORIES) {
    if (norm.includes(ex)) return true;
  }
  return false;
}

/**
 * Brief « Page Tenue maître » P0-1 v2 (24/05) — bug critique de matching :
 * la version précédente faisait `norm.includes(k)`, ce qui causait deux
 * faux positifs énormes :
 *   - "men" est inclus dans "women" → tous les women's products tombaient
 *     en "homme" (854/854 produits MUJI étaient classés homme, 0 femme !)
 *   - "male" est inclus dans "female" → idem
 *
 * Fix : on utilise des regex avec word boundaries (`\b`) sur des mots
 * propres, et on teste les genres dans l'ordre du plus spécifique au
 * moins spécifique pour neutraliser tout faux positif résiduel.
 *
 * Ordre testé : unisexe → femme → homme. Le "femme" passe avant "homme"
 * pour s'assurer qu'une catégorie "Women's Men-Style Tops" (improbable
 * mais possible) ne soit pas mal classée.
 */
const GENDER_PATTERNS: Array<[RegExp, ProductGenre]> = [
  [/\b(unisex|unisexe|mixte)\b/i, "unisexe"],
  [/\b(women|womens|woman|female|femme|ladies)\b|women's/i, "femme"],
  [/\b(men|mens|man|male|homme|gents)\b|men's/i, "homme"],
];

/** Mapping mot couleur (FR + EN) → hex de référence. Réutilise la table
    de COLOR_HINTS du stylist mais en module séparé pour clarté. */
const COLOR_TO_HEX: Record<string, string> = {
  // Neutres
  "noir": "#1E1E1E", "black": "#1E1E1E",
  "blanc": "#F5F2EC", "white": "#F5F2EC", "ivoire": "#EFE7D6", "ivory": "#EFE7D6",
  "crème": "#EFE7D6", "creme": "#EFE7D6", "cream": "#EFE7D6", "écru": "#EFE7D6", "ecru": "#EFE7D6",
  "gris": "#9B9B96", "grey": "#9B9B96", "gray": "#9B9B96",
  "anthracite": "#2E2E30", "charcoal": "#2E2E30",
  // Bleus
  "marine": "#1F3A5F", "navy": "#1F3A5F",
  "indigo": "#2F4665", "denim": "#2F4665",
  "bleu": "#5A7A95", "blue": "#5A7A95",
  // Verts
  "olive": "#7D8A4A", "olive green": "#7D8A4A", "kaki": "#7D8A4A", "khaki": "#7D8A4A",
  "sauge": "#A8B29A", "sage": "#A8B29A",
  "vert": "#5A6F4A", "green": "#5A6F4A",
  // Chauds
  "camel": "#A8784A", "tan": "#A8784A", "fauve": "#A8784A",
  "sable": "#C9B79C", "beige": "#C9B79C", "sand": "#C9B79C", "taupe": "#C9B79C",
  "terracotta": "#A8503A", "rust": "#A8503A", "brique": "#A8503A",
  "moutarde": "#C9A24A", "mustard": "#C9A24A", "ocre": "#C9A24A",
  "marron": "#6B4A33", "brown": "#6B4A33", "chocolate": "#6B4A33",
  // Rouges
  "rouge": "#9B2D20", "red": "#9B2D20",
  "bordeaux": "#6B3A32", "burgundy": "#6B3A32", "wine": "#6B3A32",
  "rose": "#D6A8A8", "pink": "#D6A8A8",
};

function colorNameToHex(colour?: string): string {
  if (!colour) return "#9B9B96"; // gris par défaut
  const norm = colour.toLowerCase().trim();
  // Match exact
  if (COLOR_TO_HEX[norm]) return COLOR_TO_HEX[norm];
  // Match partiel (« navy blue », « warm beige »…)
  for (const [k, hex] of Object.entries(COLOR_TO_HEX)) {
    if (norm.includes(k)) return hex;
  }
  return "#9B9B96";
}

function parseFloatSafe(s?: string): number | null {
  if (!s) return null;
  // Awin renvoie "29.99" ou "29,99" selon le marchand
  const cleaned = s.replace(/[^\d.,-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseGender(...candidates: (string | undefined)[]): ProductGenre {
  for (const c of candidates) {
    if (!c) continue;
    const norm = c.toLowerCase().trim();
    /* On itère sur les patterns dans l'ordre unisexe → femme → homme.
       Les regex utilisent \b pour éviter le piège "women".includes("men")
       qui faisait passer 100 % des women's products en "homme". */
    for (const [pattern, gender] of GENDER_PATTERNS) {
      if (pattern.test(norm)) return gender;
    }
  }
  /* Brief « Page Tenue maître » P0-1 (24/05) — bug critique :
     l'ancien défaut "unisexe" leakait dans les deux genres tout produit
     sans tag explicite (très fréquent dans les CSV partenaires). On
     retourne désormais "inconnu" qui sera exclu côté API quand un genre
     est demandé. Les VRAIS unisexes (tag "Unisex"/"Mixte" dans le CSV)
     gardent leur classification correcte via la boucle ci-dessus. */
  return "inconnu";
}

function parseCategory(categoryName?: string): ProductCategorie | null {
  if (!categoryName) return null;
  const norm = categoryName.toLowerCase().trim();
  // Match exact en kebab-case
  const key = norm.replace(/\s+/g, "-");
  if (CATEGORY_MAPPING[key]) return CATEGORY_MAPPING[key];
  // Match partiel — « Women's T-Shirts » contient « t-shirts »
  for (const [k, v] of Object.entries(CATEGORY_MAPPING)) {
    if (norm.includes(k)) return v;
  }
  return null;
}

/**
 * Brief 2026-05-29 (intégration TBF) : certains flux Awin n'ont pas de
 * `category_name` exploitable (TBF a "Home Accessories" pour tous, ce qui
 * est faux). On infère alors le slot depuis le nom du produit via une
 * liste de mots-clés. Si même ça ne matche pas → null, le produit est
 * dropped (vraiment hors mode).
 *
 * Mapping minimaliste piloté par brief TBF : t-shirt/shirt/polo/hoodie/
 * sweater/knit/tee/top → haut ; pants/jeans/trousers/shorts → bas ;
 * jacket/coat/blazer/parka/vest → veste ; sneakers/shoes/boots/loafers/
 * sandals → chaussures ; bracelet/necklace/bag/wallet/sunglasses/belt/
 * hat/cap/scarf → accent.
 */
const PRODUCT_NAME_TO_SLOT: Array<[RegExp, ProductCategorie]> = [
  /* Ordre : on teste les plus spécifiques d'abord pour éviter qu'un
     « jean shirt » tombe en bas (jean). */
  [/\b(blazer|sport[\s-]?coat|tuxedo|smoking|veste|jacket|coat|parka|trench|puffer|gilet|vest|cardigan|overcoat|peacoat)\b/i, "veste"],
  [/\b(sneakers?|trainers?|shoes?|boots?|loafers?|sandals?|derbies|derbys?|oxford\s+shoes?|moccasins?|brogues?|chaussures?)\b/i, "chaussures"],
  [/\b(t[\s-]?shirt|tee|polo|shirt|hoodie|sweater|sweatshirt|jumper|knit|knitwear|pullover|cardigan|blouse|tank|top|chemise|chemisier|pull)\b/i, "haut"],
  [/\b(pants|trousers?|jeans?|chinos?|shorts?|bermuda|leggings?|joggers?|slacks?|pantalon)\b/i, "bas"],
  [/\b(bracelet|necklace|chain|ring|earrings?|bag|tote|backpack|clutch|pouch|wallet|cardholder|sunglasses?|eyewear|belt|hat|cap|beanie|scarf|tie|bowtie|pocket\s*square|cufflinks?|watch|sac|ceinture|chapeau|montre|cravate)\b/i, "accent"],
];

function inferCategoryFromProductName(name: string): ProductCategorie | null {
  if (!name) return null;
  for (const [pattern, slot] of PRODUCT_NAME_TO_SLOT) {
    if (pattern.test(name)) return slot;
  }
  return null;
}

/** Slug marchand depuis le nom (« Sézane » → « sezane »). */
function slugMerchant(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Convertit une ligne brute Awin en ProduitAwin canonique.
 * Retourne null si le produit n'est pas exploitable (champ critique manquant).
 */
export function normalizeAwinProduct(raw: RawAwinProduct): ProduitAwin | null {
  if (!raw.aw_product_id || !raw.product_name || !raw.aw_deep_link) return null;
  if (!raw.merchant_name) return null;

  /* Brief TBF 2026-05-29 — exclure les brands « (do not use)* » :
     The Business Fashion a une entrée bizarre "(do not use)COMME DES
     GARÇONS BLACK" qu'il faut filtrer. */
  if (raw.brand_name && /^\(do[\s-]?not[\s-]?use\)/i.test(raw.brand_name.trim())) {
    return null;
  }

  // Brief Muji 2026-05-27 §4 — exclure underwear/nightwear de l'affichage public
  if (isExcludedCategory(raw.category_name)) return null;

  const merchantSlug = slugMerchant(raw.merchant_name);

  /* Brief TBF 2026-05-29 — fallback slot par inférence :
     TBF a `category_name` vide ou « Home Accessories » pour TOUS les
     produits → parseCategory retourne null → tout serait dropped.
     Fallback : inférer le slot depuis product_name (mots-clés t-shirt/
     pants/jacket/sneakers/bag…). Pour MUJI le parseCategory matche
     correctement donc on n'utilise pas le fallback. */
  let category = parseCategory(raw.category_name);
  if (!category) {
    category = inferCategoryFromProductName(raw.product_name);
  }
  if (!category) return null; // produit hors mode (ex. accessoires électroniques)

  const rawPrice = parseFloatSafe(raw.search_price || raw.store_price || raw.display_price);
  if (rawPrice === null) return null;
  /* Brief TBF 2026-05-29 — conversion GBP → EUR :
     The Business Fashion publie en GBP. WADA affiche tout en EUR pour
     cohérence sitewide. Taux fixe 1.17 (moyenne lissée 2024-2026). À
     remplacer par un fetch xchange-rates si on veut un taux dynamique
     (mais 1.17 ± 3 % toléré pour un usage produit pas comptable). */
  const isGBP = (raw.currency || "").toUpperCase() === "GBP";
  const price = isGBP ? Math.round(rawPrice * 1.17 * 100) / 100 : rawPrice;
  const hex = colorNameToHex(raw.colour);
  /* Brief audit live 2026-05-28 — bug genre :
     Avant on regardait `custom_1`, `brand_name`, `product_name` — mais le
     flux Muji a ces 3 champs souvent vides ou neutres, donc la quasi-totalité
     des produits étaient classés en « unisexe » par défaut → un homme
     recevait des jupes/écharpes femme.
     Fix : on prend `category_name` en PREMIER (« Men's Tops », « Women's
     Trousers » sont 100 % fiables côté Muji), puis les anciens candidats. */
  let gender = parseGender(
    raw.category_name,
    raw.merchant_product_category_path,
    raw.custom_1,
    raw.brand_name,
    raw.product_name,
  );
  /* Brief TBF 2026-05-29 — TBF est officiellement « Luxury Menswear » :
     `Fashion:suitable_for` est vide pour TOUS les produits, donc le
     parseGender ci-dessus retourne « inconnu » → un homme avec un
     profil filtré ne verrait JAMAIS de produits TBF. Fix : on force
     genre=homme si le produit vient de TBF (slug = the-business-fashion)
     et que parseGender n'a rien trouvé. Quelques pièces unisex
     (Birkenstock, Comme des Garçons) sont déjà captées par le pattern
     « unisex » dans parseGender — sinon homme par défaut. */
  if (merchantSlug === "the-business-fashion" && gender === "inconnu") {
    gender = "homme";
  }
  const sizes = raw.product_size
    ? raw.product_size.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
    : undefined;
  /* In-stock signal — brief Muji 2026-05-27 :
     - flux Muji utilise `is_for_sale=1` (1 = afficher)
     - autres flux Awin utilisent `in_stock=1` ou `true`
     On accepte les deux + fallback true si aucun n'est fourni. */
  const stockSignal = raw.is_for_sale ?? raw.in_stock;
  const inStock = stockSignal
    ? /^(1|true|yes|y|in.?stock)$/i.test(stockSignal.trim())
    : true;

  /* Brand — brief Muji 2026-05-27 + polish 2026-05-28 :
     `brand_name` est souvent VIDE dans le flux Muji. On retombe sur le
     nom du marchand, en retirant le suffixe pays (« MUJI France » → « MUJI »)
     pour que la headline reste propre sur les cartes WADA. */
  const rawBrand = (raw.brand_name && raw.brand_name.trim()) || raw.merchant_name;
  const marque = rawBrand.replace(/\s+(France|Europe|UK|US|Italia|España|Deutschland|Nederland)$/i, "");

  /* Match Sanzo Wada — brief Muji §5 :
     hex → ΔE2000 vers les 348 accords → palette la plus proche.
     Permet « les pièces qui vont avec cet accord » + ranking IA. */
  const match = nearestWadaPalette(hex);

  /* Brief 2026-05-28 (KV chunking) : on tronque agressivement description
     pour économiser de l'espace dans KV (Upstash 1MB/value limit).
     Les descriptions Muji font 200-1000 chars avec HTML entities — la card
     d'affichage n'en utilise pas. On garde 140 chars max nettoyés. */
  /* Décodage HTML entities — le flux Muji envoie souvent des doubles
     encodages comme « &amp;eacute; » qu'on décode en 2 passes :
       1) &amp; → &  (un-double-encode)
       2) &eacute;/&nbsp;/... → mapping connu OU strip
     Puis on retire tags HTML et tronque pour KV. */
  const cleanDescription = (raw.description || "")
    .replace(/&amp;/gi, "&")
    .replace(/&eacute;/gi, "é")
    .replace(/&egrave;/gi, "è")
    .replace(/&ecirc;/gi, "ê")
    .replace(/&agrave;/gi, "à")
    .replace(/&acirc;/gi, "â")
    .replace(/&ocirc;/gi, "ô")
    .replace(/&ucirc;/gi, "û")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&icirc;/gi, "î")
    .replace(/&ccedil;/gi, "ç")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z#0-9]+;/gi, "") // strip restant
    .replace(/<[^>]+>/g, "")        // tags HTML
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  return {
    id: `${merchantSlug}:${raw.aw_product_id}`,
    marchand: raw.merchant_name,
    marchandSlug: merchantSlug,
    awinMid: raw.merchant_id,
    marque,
    nom: raw.product_name,
    description: cleanDescription,
    categorie: category,
    genre: gender,
    couleurNom: raw.colour,
    hex,
    prix: price,
    /* Brief TBF 2026-05-29 : si le flux était en GBP, on a converti le
       prix en EUR au-dessus → on tagge devise=EUR pour cohérence
       d'affichage. Autres devises restent comme telles. */
    devise: isGBP ? "EUR" : ((raw.currency as "EUR" | "CHF" | "USD" | "GBP") || "EUR"),
    tailles: sizes,
    enStock: inStock,
    /* Image principale : brief Muji utilise `aw_image_url` (200×200 détouré).
       Autres flux utilisent `merchant_image_url`. On essaie les deux. */
    image: raw.aw_image_url || raw.merchant_image_url || "",
    thumb: raw.aw_thumb_url,
    /* Brief 2026-05-28 (cards plein cadre) : on garde la source large
       quand elle existe — évite le flou à l'agrandissement 4/5.
       Brief « Page Tenue maître » P0-2 (24/05) — bug critique :
       MUJI N'A PAS de colonne `large_image` dans son CSV → largeImage
       était toujours vide → frontend retombait sur image (200px) →
       photos floues sur toutes les cartes. Fallback sur
       `merchant_image_url` qui est l'URL CDN directe ~1280px côté MUJI.
       Pour les marchands qui ont vraiment `large_image`, on garde la
       priorité dessus. Pour MUJI, on utilise merchant_image_url. */
    largeImage: raw.large_image || raw.merchant_image_url || "",
    urlProduit: raw.aw_deep_link, // déjà tracké Awin, on ne re-wrappe pas
    paletteRef: match?.paletteRef,
    paletteDistance: match?.distance,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   DÉDUP — 1 ligne par taille → 1 carte par (nom, couleur)
   ──────────────────────────────────────────────────────────────────────
   Brief Muji §3 : le flux liste UNE LIGNE PAR TAILLE (~3 746 lignes ≈
   386 modèles × couleurs × tailles). Pour l'affichage WADA, on veut UNE
   CARTE par modèle dans une couleur, avec la liste des tailles dispo.

   Algo :
     1. Grouper les normalized ProduitAwin par clé `${nom}::${couleurNom}`
     2. Pour chaque groupe : garder la 1ère ligne, agréger les tailles,
        OR les flags `enStock` (en stock si ≥ 1 taille en stock)
     3. Garder l'ID de la 1ère ligne pour stabilité

   Pour des produits SANS variantes de taille (genre accessoires), la dédup
   est neutre (1 ligne → 1 carte).
*/
function dedupByModelAndColour(products: ProduitAwin[]): ProduitAwin[] {
  const groups = new Map<string, ProduitAwin[]>();
  for (const p of products) {
    /* Brief TBF 2026-05-29 — clé enrichie avec la marque :
       Sur MUJI, tous les produits ont marque="MUJI" donc la clé ne
       change pas (comportement identique). Sur TBF (522 marques),
       deux produits avec le même `nom` mais marques différentes
       (rare mais possible : « Cashmere Sweater » Brunello vs Tom
       Ford) ne sont plus dédupés à tort. */
    const key = `${(p.marque || "").toLowerCase()}::${p.nom.toLowerCase()}::${(p.couleurNom || "").toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const out: ProduitAwin[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      out.push(group[0]);
      continue;
    }
    // Plusieurs tailles d'un même modèle/couleur → on fusionne.
    const first = group[0];
    const allSizes = new Set<string>();
    for (const p of group) {
      if (p.tailles) for (const t of p.tailles) allSizes.add(t);
    }
    out.push({
      ...first,
      tailles: allSizes.size > 0 ? Array.from(allSizes) : first.tailles,
      enStock: group.some((p) => p.enStock),
    });
  }
  return out;
}

/**
 * Pipeline complet : CSV text → produits normalisés + dédupés.
 *
 * Stats retournées pour monitoring (lignes brutes, normalisées, après dédup,
 * top raisons de drop). Utilisé par le cron quotidien `/api/cron/refresh-awin-feed`.
 */
export function ingestAwinCsv(csvText: string): {
  products: ProduitAwin[];
  stats: { totalLines: number; parsed: number; dropped: number; afterDedup: number };
} {
  const raw = parseAwinCsv(csvText);
  const normalized: ProduitAwin[] = [];
  let dropped = 0;
  for (const r of raw) {
    const p = normalizeAwinProduct(r);
    if (p) normalized.push(p);
    else dropped++;
  }
  const products = dedupByModelAndColour(normalized);
  return {
    products,
    stats: {
      totalLines: raw.length,
      parsed: normalized.length,
      dropped,
      afterDedup: products.length,
    },
  };
}
