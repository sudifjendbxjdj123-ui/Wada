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
import { brandToRegistre } from "./brandRegistre";

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
  /** Brief New Era 2026-06-09 : large_image est VIDE à 100 % dans le flux
   *  New Era, mais alternate_image est rempli à 99,9 %. On l'ajoute donc à
   *  la cascade d'images (utilisé en fallback, cf. resolveImageUrls). */
  alternate_image?: string;
  alternate_image_two?: string;
  alternate_image_three?: string;
  alternate_image_four?: string;
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
  /** Brief 2026-06-01 (Suitable FR) : libellé catégorie côté marchand,
   *  en FRANÇAIS pour Suitable (« Chemises », « Pantalons », « Vestes »…).
   *  Suitable a `category_name` vide pour TOUS les produits, donc on lit
   *  merchant_category à la place. MUJI ne l'utilise pas. */
  merchant_category?: string;
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
  /* Fix 2026-06-06 : avec le match à frontière de mot, les libellés
     composés en un seul mot (« handbags ») ne matchent plus la clé
     « bags ». On ajoute les compounds courants en EN pour qu'ils
     résolvent par match exact/mot-entier au lieu d'être droppés. */
  "handbags": "accent", "shoulder bags": "accent", "crossbody bags": "accent",
  "tote bags": "accent", "backpacks": "accent", "wallets": "accent",
  "cardholders": "accent", "watches": "accent", "jewellery": "accent",
  "jewelry": "accent", "ties": "accent", "caps": "accent", "beanies": "accent",

  // ─── Suitable FR (merchant_category en FRANÇAIS) ─── Brief 2026-06-01
  // Le flux Suitable FR a `category_name` VIDE pour les 19 591 produits.
  // On utilise `merchant_category` à la place (cf. branche dédiée dans
  // normalizeAwinProduct). Les libellés sont en français.
  // Note : "polos", "t-shirts", "shorts" sont déjà mappés plus haut (EN) → on
  // ne les redéclare pas ici (TS1117 : duplicate keys).
  "chemises": "haut",
  "pulls et sweats": "haut",
  "pantalons": "bas",
  "vestes": "veste",
  "vestes & blazers": "veste",
  "gilets": "veste",
  "costumes": "veste", // suit set → fallback veste (slot le plus pertinent)
  "costume de soirée": "veste",
  "costumes de cérémonie & accessoires": "veste",
  "costumes de mariage": "veste",
  "smoking": "veste",
  "chaussures": "chaussures",
  "ceintures": "accent",
  "cravates": "accent",
  "noeuds papillon & ceintures de smoking": "accent",
  "bretelles": "accent",
  "boutons de manchette": "accent",
  "pochettes de costume": "accent",
  "casquettes et chapeaux": "accent",
  "bonnets": "accent",
  "écharpes": "accent",
  "echarpes": "accent",
  "gants": "accent",
  "sacs": "accent",

  // ─── Allemand (K&Ö) ─── Brief K&Ö 2026-06-09. category_name vide ; on
  // mappe merchant_product_category_path (« Herren > Bekleidung > Jeans >
  // Straight »). parseCategory teste chaque mot du chemin → on map les
  // sous-catégories DE. Les macros (Bekleidung) restent non mappées (trop
  // génériques) : c'est la sous-catégorie qui décide du slot.
  "hemden": "haut", "blusen": "haut", "tuniken": "haut",
  "poloshirts": "haut", "hoodies": "haut",
  "pullover": "haut", "strick": "haut", "kleider": "haut",
  "jacken": "veste", "mäntel": "veste", "maentel": "veste", "westen": "veste",
  "anzüge": "veste", "anzuege": "veste", "sakkos": "veste", "strickjacken": "veste",
  "blazer": "veste",
  "hosen": "bas", "röcke": "bas", "roecke": "bas", "leggings": "bas",
  "schuhe": "chaussures", "sneaker": "chaussures", "stiefel": "chaussures",
  "stiefeletten": "chaussures", "halbschuhe": "chaussures", "pumps": "chaussures",
  "sandalen": "chaussures",
  "taschen": "accent", "accessoires": "accent", "schmuck": "accent",
  "gürtel": "accent", "guertel": "accent", "mützen": "accent", "muetzen": "accent",
  "schals": "accent", "tücher": "accent", "tuecher": "accent", "uhren": "accent",
  "sonnenbrillen": "accent",
};

/** Catégories Muji explicitement EXCLUES de l'affichage public — brief
 *  2026-05-27 §4 « rester tenue de ville ». normalizeAwinProduct() drop
 *  ces lignes au lieu de les normaliser.
 *
 *  Brief 2026-06-01 (Suitable FR) : ajout des catégories FR équivalentes
 *  (boxers, shorts de bain, peignoirs, chaussettes) — hors mode de ville. */
const EXCLUDED_CATEGORIES = new Set([
  "underwear",
  "nightwear",
  // Suitable FR — libellés français
  "boxers",
  "shorts de bain",
  "peignoirs de bain",
  "chaussettes",
  /* Bug 2026-06-02 : "Noeuds papillon & ceintures de smoking" contient
     le mot "smoking" qui match la règle partielle CATEGORY_MAPPING → catégorie
     "veste" (smoking = tuxedo jacket). Le noeud papillon finissait dans le
     slot veste au lieu d'accent. Fix : on exclut cette catégorie entièrement —
     le slot accent retombera sur sac/chapeau/ceinture à la place. */
  "noeuds papillon & ceintures de smoking",
  "costumes de cérémonie & accessoires",
  "costumes de mariage",
  "smoking",
  /* ─── Allemand (K&Ö) ─── Brief K&Ö 2026-06-09. K&Ö est un grand magasin :
     il vend aussi beauté/parfums, enfant, lingerie, bain — hors périmètre
     mode adulte WADA. On exclut sur le merchant_product_category_path
     (match par sous-chaîne via isExcludedCategory). NB : « smoking » (déjà
     présent) exclut aussi les smokings DE (tuxedos) — perte mineure acceptée. */
  "beauty", "düfte", "duefte", "parfum", "parfüm", "kosmetik", "pflege", "fragrance",
  "make-up", "schminke",
  "unterwäsche", "unterwaesche", "wäsche", "waesche", "dessous", "nachtwäsche", "nachtwaesche",
  "bademode", "bikini", "badeanzug",
  "socken", "strümpfe", "struempfe", "strumpfhosen",
  "kinder", "baby", "kids",
  /* ─── La Redoute ─── Brief 2026-06-14. La Redoute est un grand magasin
     multi-catégories (mode + maison + déco + puériculture + jardin). On
     n'ingère QUE la mode adulte — le reste est hors périmètre WADA. Les
     libellés sont en français, on match par sous-chaîne sur `category_name`
     et `merchant_product_category_path`. Sport ambigu (Nike/Adidas
     sportswear légitime) → on ne l'exclut PAS ; on garde la logique par
     nom/slot pour trier ce qui est vêtement vs matériel. */
  "maison", "meubles", "meuble", "salon", "chambre", "cuisine", "salle de bain", "salle à manger",
  "déco", "deco", "décoration", "decoration", "linge de maison", "linge de lit", "linge de bain",
  "rideaux", "tapis", "luminaire", "luminaires", "art de la table", "vaisselle",
  "électroménager", "electromenager", "appareils", "gros électroménager", "petit électroménager",
  "high-tech", "high tech", "informatique", "téléphonie", "telephonie", "tv & son", "tv et son",
  "puériculture", "puericulture", "bébé", "bebe",
  "jardin", "outillage", "bricolage", "auto", "moto", "camping",
  "jouets", "jouet", "jeux",
  "papeterie", "loisirs créatifs", "loisirs creatifs",
  "animalerie", "animal",
  "hygiène", "hygiene",
]);

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
  /* « damen » (femme) AVANT « herren » (homme). \bmen\b ne matche pas
     « damen » (pas de frontière entre « a » et « men ») → pas de faux
     positif homme. Brief K&Ö 2026-06-09. */
  [/\b(women|womens|woman|female|femme|ladies|damen)\b|women's/i, "femme"],
  [/\b(men|mens|man|male|homme|gents|herren)\b|men's/i, "homme"],
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
  // Brief 2026-06-01 (Suitable FR) — libellés français/EN manquants
  "violet": "#6B4A8A", "purple": "#6B4A8A", "lilas": "#9A85B0",
  "jaune": "#D6BE6B", "yellow": "#D6BE6B",
  "orange": "#C97A3A",
  "cognac": "#8A5A33",
  "argenté": "#B8B8B8", "argente": "#B8B8B8", "silver": "#B8B8B8",
  "doré": "#B89A4A", "dore": "#B89A4A", "gold": "#B89A4A",
  "multicoloré": "#9B9B96", "multicolore": "#9B9B96", "multi": "#9B9B96",
  "turquoise": "#4A9A9A",
  /* ─── Allemand (K&Ö) ─── Brief K&Ö 2026-06-09. Couleurs 100% en DE.
     Mappées vers les hex WADA existants pour rester cohérent avec le
     matching palette Sanzō Wada. Clés déjà présentes en EN/FR (beige,
     khaki, bordeaux, pink, orange, camel, taupe, gold…) non redéclarées.
     « keine farbe » non mappé → gris défaut. */
  "schwarz": "#1E1E1E",
  "weiss": "#F5F2EC", "weiß": "#F5F2EC",
  "blau": "#5A7A95", "dunkelblau": "#1F3A5F", "hellblau": "#8AB4D4",
  "grau": "#9B9B96", "hellgrau": "#C8C8C4", "dunkelgrau": "#2E2E30",
  "braun": "#6B4A33", "oliv": "#7D8A4A",
  "grün": "#5A6F4A", "gruen": "#5A6F4A", "dunkelgrün": "#2A4A28", "hellgrün": "#A4C890",
  "rot": "#9B2D20", "weinrot": "#6B3A32",
  "rosa": "#D6A8A8",
  "gelb": "#D6BE6B", "lila": "#6B4A8A", "türkis": "#4A9A9A", "tuerkis": "#4A9A9A",
  "silber": "#B8B8B8", "bronze": "#A87844",
  "petrol": "#2A5A6A", "bunt": "#9B9B96", "natur": "#E8DFC4",
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
  /* Bug 2026-06-06 « erreur de prix » : l'ancienne version
     `replace(/[^\d.,-]/g,"").replace(",",".")` cassait sur deux cas :
       1. Séparateur de milliers US « 1,299.00 » → ne remplaçait QUE la
          première virgule → « 1.299.00 » → parseFloat = 1.299 (un article
          à 1 299 € s'affichait 1,30 €).
       2. Fourchettes « 29.99-30.50 » → parseFloat s'arrête au tiret = 29.99
          (acceptable) mais le tiret pouvait aussi venir d'un signe négatif.
     Nouveau parseur : détecte le séparateur décimal réel (le dernier entre
     « . » et « , »), retire l'autre comme séparateur de milliers. */
  // Fourchette de prix « 49.99-59.99 » → on garde la première valeur.
  const firstSegment = s.split(/[-–—]/)[0];
  // Ne garder que chiffres, point, virgule.
  let t = firstSegment.replace(/[^\d.,]/g, "");
  if (!t) return null;

  const lastDot = t.lastIndexOf(".");
  const lastComma = t.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    // Les deux présents → le dernier est le séparateur décimal.
    if (lastComma > lastDot) {
      // Format EU « 1.299,00 » : point = milliers, virgule = décimale.
      t = t.replace(/\./g, "").replace(",", ".");
    } else {
      // Format US « 1,299.00 » : virgule = milliers, point = décimale.
      t = t.replace(/,/g, "");
    }
  } else if (lastComma !== -1) {
    // Virgule seule : décimale si 1-2 chiffres après, sinon milliers.
    const decimals = t.length - lastComma - 1;
    t = decimals <= 2 ? t.replace(",", ".") : t.replace(/,/g, "");
  }
  // (point seul → déjà au bon format, rien à faire)

  const n = parseFloat(t);
  return isNaN(n) || n < 0 ? null : n;
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

/* Clés de CATEGORY_MAPPING triées de la plus longue à la plus courte :
   le match partiel doit privilégier la clé la PLUS spécifique. Sinon
   « vestes & blazers » pouvait matcher « blazers » avant « vestes »
   (même résultat ici, mais le tri évite les surprises pour les futurs
   ajouts type « robes » vs « robes de soirée »). Calculé une seule fois. */
const CATEGORY_KEYS_BY_LENGTH = Object.entries(CATEGORY_MAPPING).sort(
  (a, b) => b[0].length - a[0].length,
);

function parseCategory(categoryName?: string): ProductCategorie | null {
  if (!categoryName) return null;
  const norm = categoryName.toLowerCase().trim();
  // Match exact en kebab-case
  const key = norm.replace(/\s+/g, "-");
  if (CATEGORY_MAPPING[key]) return CATEGORY_MAPPING[key];
  /* Match partiel à FRONTIÈRES DE MOT — Bug 2026-06-06 « habits dans la
     mauvaise catégorie ». L'ancien `norm.includes(k)` matchait n'importe
     quelle sous-chaîne : la clé « tops » matchait « laptops », « shoes »
     matchait « shoe care » (cirage → chaussures), « hats » dans un libellé
     non vestimentaire, etc. On exige désormais que la clé apparaisse comme
     un mot entier (bordée par début/fin ou non-lettre). On teste les clés
     les plus longues d'abord pour préférer la catégorie la plus précise. */
  for (const [k, v] of CATEGORY_KEYS_BY_LENGTH) {
    // Échappe les métacaractères regex de la clé (« & », « . »…).
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const wordRe = new RegExp(`(^|[^a-zà-ÿ])${escaped}([^a-zà-ÿ]|$)`, "i");
    if (wordRe.test(norm)) return v;
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

/* Noms de VÊTEMENTS explicites — Brief 2026-06-09 (« Derby jumper » dans
   les chaussures). Les mots de STYLE de chaussure (« derby », « brogue »,
   « oxford », « richelieu », « monk ») apparaissent aussi dans des noms de
   vêtements (« Derby jumper », « Oxford shirt »…). Si le nom contient un de
   ces vrais noms de vêtement, on l'utilise EN PRIORITÉ et on ignore le slot
   chaussures pour ne pas ranger un pull dans les chaussures. Liste tenue
   stricte (pas de « top »/« low-top », pas de « polo »=marque, pas de
   « knit »/« denim » qui existent en baskets). */
const APPAREL_NOUN = /\b(jumper|sweater|sweatshirt|pullover|cardigan|hoodie|t[\s-]?shirt|tee|chemise|chemisier|trousers?|pantalon|jeans?|chinos?|leggings?|joggers?|shorts?|bermuda|blazer|jacket|coat|manteau|parka|trench|gilet|robe|dress|skirt|jupe|blouse)\b/i;

function inferCategoryFromProductName(name: string): ProductCategorie | null {
  if (!name) return null;
  if (APPAREL_NOUN.test(name)) {
    for (const [pattern, slot] of PRODUCT_NAME_TO_SLOT) {
      if (slot === "chaussures") continue; // un vêtement n'est jamais une chaussure
      if (pattern.test(name)) return slot;
    }
  }
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
 * Suitable FR — transforme une URL CDN en image plate (produit seul, sans mannequin).
 * Sur cdn.suitableshop.net, le pattern est :
 *   {nom-produit}--full--{id}-{N}.jpg  où N=1 = photo plate, N>1 = mannequin/détail.
 * On remplace le numéro de fin par 1.
 * Exemple :
 *   alan-red--full--62255-13.jpg → alan-red--full--62255-1.jpg  (image plate confirmée)
 */
function suitableFlatImage(url: string): string {
  if (!url) return "";
  // Extrait l'URL CDN depuis le proxy Awin si nécessaire
  const extracted = extractFromAwinProxy(url);
  const cdnUrl = extracted || url;
  // Remplace -N.jpg (N = chiffres) par -1.jpg
  const flat = cdnUrl.replace(/-(\d+)\.jpg($|\?)/, "-1.jpg$2");
  return flat;
}

/**
 * Extrait l'URL CDN directe depuis une URL proxy Awin (images2.productserve.com).
 * Format : https://images2.productserve.com/?...&url=ssl%3Acdn.shopify.com%2F...
 * → https://cdn.shopify.com/...
 * Retourne null si l'URL n'est pas une URL proxy Awin ou si l'extraction échoue.
 */
function extractFromAwinProxy(proxyUrl: string | undefined): string | null {
  if (!proxyUrl || !proxyUrl.includes("productserve.com")) return null;
  try {
    const urlMatch = /[?&]url=([^&]+)/.exec(proxyUrl);
    if (!urlMatch) return null;
    const extracted = decodeURIComponent(urlMatch[1]).replace(/^ssl:/, "https://");
    return extracted.startsWith("https://") ? extracted : null;
  } catch {
    return null;
  }
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

  /* Brief New Era 2026-06-09 — détection robuste du marchand New Era.
     Le flux New Era arrive sous des noms de marchand variables
     (« New Era Cap », « UK NewEraCap »…). On normalise tout vers le slug
     canonique « new-era » pour : un id stable, une page /marques/new-era
     unique, et la marque affichée « New Era ». */
  const isNewEra =
    /new[\s-]?era/i.test(raw.merchant_name || "") ||
    /new[\s-]?era/i.test(raw.brand_name || "");
  /* Brief K&Ö 2026-06-09 — Kastner & Öhler : flux allemand multi-marques
     (520 marques sous UN marchand). Slug canonique « kastner-ohler » ; la
     marque affichée reste brand_name (Polo Ralph Lauren, Boss…), donc
     /marques liste bien les 520 marques (groupées par `marque`). */
  const isKO = /kastner|öhler|oehler|ohler/i.test(raw.merchant_name || "");
  /* Brief La Redoute 2026-06-14 — grand magasin FR multi-marques (Nike,
     Adidas, Puma, Hugo Boss, Levi's, Superdry, Only, Vero Moda, La Redoute
     Collections…). Flux Awin en français, EUR, livraison FR. brand_name est
     rempli par produit (contrairement à K&Ö qui le remplit aussi ↔ /marques
     groupe déjà correctement par marque). Slug canonique « la-redoute ». */
  const isLaRedoute = /la[\s-]?redoute/i.test(raw.merchant_name || "");
  const merchantSlug = isNewEra ? "new-era"
    : isKO ? "kastner-ohler"
    : isLaRedoute ? "la-redoute"
    : slugMerchant(raw.merchant_name);

  /* K&Ö : 42% du flux est is_for_sale=0 (invendable, 31k lignes). On drop
     dès l'ingestion pour ne pas gonfler le KV de produits non achetables. */
  if (isKO && raw.is_for_sale !== "1") return null;

  /* Brief Muji 2026-05-27 §4 — exclure underwear/nightwear de l'affichage
     public. Brief 2026-06-01 (Suitable FR) : Suitable utilise
     `merchant_category` au lieu de `category_name` (vide). Brief K&Ö
     2026-06-09 : K&Ö a category_name vide aussi → on exclut beauté/enfant/
     lingerie/bain sur le merchant_product_category_path (100% rempli, en DE). */
  const categorySourceForExclusion =
    merchantSlug === "suitable-fr"
      ? (raw as RawAwinProduct & { merchant_category?: string }).merchant_category
      : isKO
      ? raw.merchant_product_category_path
      : raw.category_name;
  if (isExcludedCategory(categorySourceForExclusion)) return null;
  /* Brief La Redoute 2026-06-14 : le layout exact du flux Awin n'est pas
     figé (grand magasin multi-catégories → colonnes riches). On teste
     l'exclusion sur TOUTES les colonnes catégorie disponibles pour ne pas
     laisser passer un canapé ou un aspirateur si l'une est renseignée et
     pas l'autre. Coût : une passe supplémentaire par produit — négligeable. */
  if (isLaRedoute) {
    const lrCatSources = [
      raw.category_name,
      raw.merchant_product_category_path,
      (raw as RawAwinProduct & { merchant_category?: string }).merchant_category,
    ];
    for (const src of lrCatSources) {
      if (isExcludedCategory(src)) return null;
    }
  }

  /* Brief TBF 2026-05-29 — slot par inférence depuis product_name :
     TBF a `category_name = "Home Accessories"` MENSONGER pour TOUS les
     produits (vérifié ingestion 30/05 : ce string matchait CATEGORY_MAPPING
     "accessories"→"accent" et faisait tomber sneakers/pulls/pantalons en
     accent). Fix : pour TBF on IGNORE complètement category_name et on
     passe DIRECTEMENT à l'inférence par mots-clés du nom. Pour les autres
     marchands (MUJI) on garde le pipeline standard parseCategory → fallback.

     Brief 2026-06-01 (Suitable FR) : Suitable a `category_name` VIDE pour
     les 19 591 produits mais `merchant_category` en FRANÇAIS (« Chemises »,
     « Pantalons », « Vestes & Blazers », « Costumes »…). On lit donc
     merchant_category en priorité pour ce marchand. CATEGORY_MAPPING a
     été enrichi avec les libellés FR (cf. plus haut). */
  let category: ProductCategorie | null;
  if (isNewEra) {
    /* Brief New Era 2026-06-09 — `category_name` ET
       `merchant_product_category_path` sont VIDES à 100 % dans ce flux.
       Le catalogue est très majoritairement des couvre-chefs, mais contient
       AUSSI du textile (t-shirts, sweats…). On classe donc finement :
         1. couvre-chef explicite (libellés FR + modèles New Era 9FIFTY/
            59FIFTY/9FORTY/9TWENTY/39THIRTY + EN cap/hat) → slot `accent`
            (slot WADA des chapeaux/casquettes, cf. CATEGORY_MAPPING).
            Indispensable car « Casquette 9FORTY … » ne matche ni « cap »
            ni « hat » via l'inférence standard.
         2. sinon inférence standard du nom (« T-shirt … » → haut, etc.).
         3. sinon défaut `accent` (le catalogue est surtout des casquettes). */
    /* Les noms New Era commencent TOUJOURS par le type de produit
       (« Casquette 9FORTY … », « T-shirt … », « Sweat à Capuche … »,
       « Short … »). On classe donc sur le MOT DE TÊTE, ce qui évite le
       piège des t-shirts graphiques qui mentionnent « Fitted Cap » dans
       leur design, et celui du suffixe de marque « … New Era Cap unisex »
       (le « Cap » de marque n'est jamais en tête). On retire quand même
       ce suffixe par sécurité avant de matcher. */
    const nameForType = (raw.product_name || "")
      .replace(/\bnew\s*era(\s*cap)?\b/gi, " ")
      .replace(/\bunisex(e)?\b/gi, " ")
      .trimStart();
    const NE_HEADWEAR_LEAD = /^\s*(casquette|bob|bonnet|chapeau|visi[èe]re|cap|hat|beanie|bucket)\b/i;
    const NE_APPAREL_LEAD: Array<[RegExp, ProductCategorie]> = [
      [/^\s*(veste|blouson|manteau|coupe[-\s]?vent|parka|doudoune|gilet)\b/i, "veste"],
      [/^\s*(short|pantalon|jean|bermuda|jogging|legging)\b/i, "bas"],
      [/^\s*(t[-\s]?shirt|tee|d[ée]bardeur|polo|chemise|top|sweat|hoodie|pull|maille|sweatshirt|crewneck|cardigan)\b/i, "haut"],
    ];
    if (NE_HEADWEAR_LEAD.test(nameForType)) {
      category = "accent";
    } else {
      category = null;
      for (const [re, c] of NE_APPAREL_LEAD) {
        if (re.test(nameForType)) { category = c; break; }
      }
      /* Défaut `accent` : le catalogue New Era est très majoritairement des
         couvre-chefs, donc un nom non reconnu est plus probablement une
         casquette qu'autre chose. */
      if (!category) category = "accent";
    }
  } else if (isKO) {
    /* Brief K&Ö 2026-06-09 — catégories 100% en allemand dans
       merchant_product_category_path (« Herren > Bekleidung > Jeans >
       Straight »), category_name vide. parseCategory matche les mots du
       chemin via les libellés DE ajoutés à CATEGORY_MAPPING ; fallback sur
       l'inférence par le nom du produit si le chemin ne résout rien.

       Fix 2026-06-10 (user « Anzughose en veste ») : le chemin « Anzüge »
       (costumes) regroupe les VESTES de costume (Sakko) ET les PANTALONS
       (Anzughose) → parseCategory classait les deux en veste. Le NOM
       tranche : tout « …hose » (Anzughose, Stoffhose…) est un BAS. On le
       teste AVANT le chemin. (« Strumpfhose »/bain déjà exclus en amont.) */
    if (/hose/i.test(raw.product_name || "")) {
      category = "bas";
    } else {
      category = parseCategory(raw.merchant_product_category_path)
        || inferCategoryFromProductName(raw.product_name);
    }
  } else if (merchantSlug === "the-business-fashion") {
    category = inferCategoryFromProductName(raw.product_name);
  } else if (merchantSlug === "suitable-fr") {
    const merchantCat = (raw as RawAwinProduct & { merchant_category?: string }).merchant_category;
    category = parseCategory(merchantCat) || parseCategory(raw.category_name);
    if (!category) {
      category = inferCategoryFromProductName(raw.product_name);
    }
  } else if (isLaRedoute) {
    /* Brief La Redoute 2026-06-14 : catégories en français. On tente les 3
       colonnes classiques (category_name, merchant_category, path) dans
       l'ordre, puis fallback inférence par nom. Les libellés FR sont déjà
       dans CATEGORY_MAPPING (chemises, pantalons, vestes, chaussures,
       ceintures, sacs, etc. — ajoutés via Suitable). */
    const lrMerchantCat = (raw as RawAwinProduct & { merchant_category?: string }).merchant_category;
    category =
      parseCategory(raw.category_name)
      || parseCategory(lrMerchantCat)
      || parseCategory(raw.merchant_product_category_path);
    if (!category) {
      category = inferCategoryFromProductName(raw.product_name);
    }
  } else {
    category = parseCategory(raw.category_name);
    if (!category) {
      category = inferCategoryFromProductName(raw.product_name);
    }
  }
  if (!category) return null; // produit hors mode (ex. accessoires électroniques)

  const rawPrice = parseFloatSafe(raw.search_price || raw.store_price || raw.display_price);
  if (rawPrice === null) return null;
  /* Brief TBF 2026-05-29 — conversion GBP → EUR :
     The Business Fashion publie en GBP. WADA affiche tout en EUR pour
     cohérence sitewide. Taux fixe 1.17 (moyenne lissée 2024-2026). À
     remplacer par un fetch xchange-rates si on veut un taux dynamique
     (mais 1.17 ± 3 % toléré pour un usage produit pas comptable). */
  /* Brief K&Ö 2026-06-09 — conversion CHF → EUR : K&Ö publie en francs
     suisses. WADA affiche tout en EUR (l'UI ignore le champ devise). Taux
     fixe 1.03 (CHF→EUR lissé 2024-2026). Le prix réel reste celui de K&Ö ;
     c'est un prix indicatif d'affichage. */
  const currencyUp = (raw.currency || "").toUpperCase();
  const isGBP = currencyUp === "GBP";
  const isCHF = currencyUp === "CHF";
  const price = isGBP ? Math.round(rawPrice * 1.17 * 100) / 100
    : isCHF ? Math.round(rawPrice * 1.03 * 100) / 100
    : rawPrice;
  /* Brief TBF 2026-05-30 — extraction couleur depuis product_name :
     TBF a `colour="-"` ou vide pour tous les produits. Sans hex valide,
     paletteRef tombe sur 094 (gris défaut) pour TOUT TBF → invisible
     dans le matching palette (ex. Tweed & Encre n°162). Fix : si colour
     manquant/vide/"-", on cherche un mot de couleur dans product_name +
     description (« Black sneakers », « navy chino », « burgundy knit »).
     Pour MUJI, raw.colour est toujours rempli → fallback ne s'active pas. */
  let resolvedColour: string | undefined = raw.colour && raw.colour.trim() && raw.colour.trim() !== "-"
    ? raw.colour
    : undefined;
  if (!resolvedColour) {
    const haystack = `${raw.product_name || ""} ${raw.description || ""}`.toLowerCase();
    /* Mots de couleur courants (EN+FR), ordre du plus spécifique au moins.
       \b pour éviter qu'un « blackberry » devienne « black ». */
    const COLOR_KEYWORDS = [
      "burgundy", "bordeaux", "navy", "marine", "charcoal", "anthracite",
      "camel", "taupe", "mustard", "moutarde", "olive", "kaki", "khaki",
      "ivory", "ivoire", "ecru", "écru", "cream", "crème", "sand", "sable",
      "beige", "tan", "brown", "marron", "rust", "terracotta", "brique",
      "black", "noir", "white", "blanc", "grey", "gray", "gris",
      "blue", "bleu", "red", "rouge", "green", "vert", "pink", "rose",
      "yellow", "jaune", "purple", "violet",
    ];
    for (const k of COLOR_KEYWORDS) {
      if (new RegExp(`\\b${k}\\b`, "i").test(haystack)) {
        resolvedColour = k;
        break;
      }
    }
  }
  const hex = colorNameToHex(resolvedColour);
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
  /* Brief 2026-06-01 (Suitable FR) : 100 % menswear (« Suitable Menswear »
     dans le nom du feed). Aucune colonne ne tag explicitement le genre
     dans le CSV → parseGender retourne « inconnu » → exclu pour un homme
     filtré. Fix : on force homme pour Suitable comme on l'a fait pour TBF. */
  if (merchantSlug === "suitable-fr" && gender === "inconnu") {
    gender = "homme";
  }
  /* Brief New Era 2026-06-09 — les casquettes New Era sont unisexes et le
     flux ne tague aucun genre → parseGender retourne « inconnu » (donc
     exclu pour un homme/une femme filtré·e). On force « unisexe » pour
     qu'elles apparaissent pour tout le monde. */
  if (isNewEra && gender === "inconnu") {
    gender = "unisexe";
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
  /* Brief New Era 2026-06-09 — marque canonique « New Era » quel que soit
     le libellé du flux (« New Era Cap », « UK NewEraCap »…). */
  const marque = isNewEra
    ? "New Era"
    /* Brief K&Ö 2026-06-09 — on retire les symboles ®/™ des marques
       (« LEVI'S® » → « LEVI'S ») pour des libellés et slugs propres. */
    : rawBrand
        .replace(/\s+(France|Europe|UK|US|Italia|España|Deutschland|Nederland)$/i, "")
        .replace(/[®™]/g, "")
        .trim();

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
    /* Brief 2026-05-30 : on stocke la couleur résolue (depuis colour ou
       depuis product_name pour TBF) au lieu de raw.colour. Empêche
       l'affichage UI de « - » comme nom de couleur sur les cards. */
    couleurNom: resolvedColour || raw.colour,
    hex,
    prix: price,
    /* Brief TBF 2026-05-29 : si le flux était en GBP, on a converti le
       prix en EUR au-dessus → on tagge devise=EUR pour cohérence
       d'affichage. Autres devises restent comme telles. */
    devise: (isGBP || isCHF) ? "EUR" : ((raw.currency as "EUR" | "CHF" | "USD" | "GBP") || "EUR"),
    tailles: sizes,
    enStock: inStock,
    /* Image principale — Brief 2026-06-01 FIX PHOTOS + 2026-06-02 SANS MANNEQUIN :
       L'utilisateur préfère les images PRODUIT SEUL (fond blanc, pas de modèle).
       - aw_image_url = image officielle Awin = photo produit seul (flat/ghost),
         mais passe par images2.productserve.com qui bloque le Referer wada.style.
         Solution : on extrait l'URL CDN directe depuis le paramètre `url=` du proxy.
       - merchant_image_url / large_image = photo éditoriale avec mannequin (à éviter).
       - Suitable FR : toutes les images sont sur cdn.suitableshop.net (pas de modèle
         en général). On conserve merchant_image_url pour Suitable.
       Pour TBF : on extrait l'URL Shopify depuis aw_image_url (plat, sans mannequin).
       Pour MUJI : merchant_image_url est le CDN BigCommerce (images propres, pas de modèle).
       Pour Suitable FR : merchant_image_url = cdn.suitableshop.net. */
    /* Image — Brief 2026-06-02 SANS MANNEQUIN (user) : toutes marques.
       Stratégie par marchand :
       - MUJI / TBF : aw_image_url → extraction CDN directe → image flat (fond blanc) ✅
       - Suitable FR : n'a QUE des photos mannequin (--full-- dans l'URL CDN).
         On garde l'URL proxy Awin (images2.productserve.com) qui applique
         bg=white + trim + letterbox → fond blanc uniforme côté serveur via /api/img. */
    image: merchantSlug === "suitable-fr"
      /* Suitable FR : remplace le numéro d'image par -1 → image principale
         plate (vêtement seul) plutôt que l'image éditoriale avec mannequin.
         Confirmé : cdn.suitableshop.net image -1.jpg = photo plate,
         image -N.jpg (N>1) = mannequin ou détail. */
      ? suitableFlatImage(raw.merchant_image_url || raw.aw_image_url || "")
      /* MUJI : extrait URL CDN directe (images BigCommerce, plates) */
      /* TBF  : garde proxy Awin (bg=white + letterbox → fond blanc uniforme)
               car les images Shopify TBF sont souvent des mannequins en pied.
               Le proxy rogne autour du vêtement et uniformise. */
      /* MUJI / TBF : images2.productserve.com retourne 403 même côté serveur.
         On extrait TOUJOURS l'URL CDN directe (Shopify/BigCommerce) qui est
         accessible sans restriction. Pour TBF ça peut montrer un mannequin
         mais au moins l'image s'affiche. */
      /* New Era + K&Ö — Brief 2026-06-09 : large_image VIDE (0 %),
         alternate_image rempli (New Era 99,9 % / K&Ö 89 %). On ajoute
         alternate_image à la cascade. New Era = packshots fond blanc ;
         K&Ö = grand magasin, on garde l'image dispo même si portée
         (décision user « tout garder »). */
      : (isNewEra || isKO)
      ? (extractFromAwinProxy(raw.aw_image_url)
          || raw.aw_image_url
          || raw.alternate_image
          || raw.merchant_image_url
          || "")
      : (extractFromAwinProxy(raw.aw_image_url) || raw.merchant_image_url || ""),
    thumb: raw.aw_thumb_url,
    largeImage: merchantSlug === "suitable-fr"
      ? suitableFlatImage(raw.merchant_image_url || raw.aw_image_url || "")
      : (isNewEra || isKO)
      ? (raw.large_image
          || extractFromAwinProxy(raw.aw_image_url)
          || raw.alternate_image
          || raw.merchant_image_url
          || "")
      : (raw.large_image
          || extractFromAwinProxy(raw.aw_image_url)
          || raw.merchant_image_url
          || ""),
    urlProduit: raw.aw_deep_link, // déjà tracké Awin, on ne re-wrappe pas
    paletteRef: match?.paletteRef,
    paletteDistance: match?.distance,
    /* Brief 2026-05-30 §1 : tag registre depuis la marque réelle.
       Marques inconnues → undefined (le composer pourra utiliser un
       fallback ou exclure du sort selon le contexte). */
    brandRegistre: brandToRegistre(marque) || undefined,
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
