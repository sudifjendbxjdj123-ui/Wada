/**
 * Système de filtres catégorie complet (brief 2026-06-09
 * « WADA-filtres-categorie-complets-spec »).
 *
 * Source de vérité PARTAGÉE entre :
 *   - l'UI sidebar (components/category/*)
 *   - l'endpoint /api/products/search
 *   - l'endpoint /api/categories/[category]/counts
 *
 * Adaptation à la réalité WADA (vs la spec qui présume Prisma + colonnes
 * dédiées) :
 *   - Données = `ProduitAwin` du KV store (lib/productStore), pas de DB SQL.
 *   - Pas de colonnes `type` / `season` / `material` / `is_on_sale` /
 *     `matching_palette_ids` → on les DÉRIVE par mots-clés / ΔE à la volée.
 *   - Match palette = ΔE2000 entre la couleur produit et les couleurs de
 *     l'accord Sanzō Wada (seuil 30), calculé à la requête (pas de ré-index
 *     des 36k produits nécessaire).
 */
import type { ProduitAwin } from "@/lib/schema";
import { deltaEHex, hexToLab } from "@/lib/colorDistance";
import { dictionary, type DictionaryEntry } from "@/lib/data";

/* ──────────────────────────────────────────────────────────────────────
   ÉTAT DES FILTRES
   ────────────────────────────────────────────────────────────────────── */
export interface CategoryFilters {
  palettes: string[];   // numéros d'accord Sanzō Wada (« 003 »)
  types: string[];      // sous-catégories (« Sneakers »)
  genres: string[];     // « femme » | « homme » | « mixte »
  brands: string[];
  colors: string[];     // familles de couleur (« Noir »)
  sizes: string[];
  priceMin: number;
  priceMax: number;
  styles: string[];     // MacroStyle (« minimaliste »)
  seasons: string[];    // « ete » | « mi-saison » | « hiver »
  materials: string[];
  onSale: boolean;
  sort: string;         // "" | "prix-asc" | "prix-desc" | "nouveau"
}

export const PRICE_MIN = 0;
export const PRICE_MAX = 2000;

export function getDefaultFilters(): CategoryFilters {
  return {
    palettes: [], types: [], genres: [], brands: [], colors: [], sizes: [],
    priceMin: PRICE_MIN, priceMax: PRICE_MAX,
    styles: [], seasons: [], materials: [], onSale: false, sort: "",
  };
}

export const FILTERS_STORAGE_KEY = "wada.categoryFilters";

/* ──────────────────────────────────────────────────────────────────────
   CATALOGUES D'OPTIONS
   ────────────────────────────────────────────────────────────────────── */

/** Sous-types par catégorie + regex de détection dans le nom produit. */
export const TYPES_BY_CATEGORY: Record<string, { label: string; re: RegExp }[]> = {
  chaussures: [
    { label: "Sneakers", re: /sneaker|basket|tennis/i },
    { label: "Mocassins", re: /mocassin|loafer/i },
    { label: "Derbies", re: /derby|derbies|richelieu|brogue/i },
    { label: "Bottines", re: /bottine|boot|chelsea/i },
    { label: "Sandales", re: /sandale|nu-pied|tong|claquette/i },
    { label: "Espadrilles", re: /espadrille/i },
  ],
  vetements: [
    { label: "T-shirts", re: /t-?shirt|tee/i },
    { label: "Chemises", re: /chemise|chemisier/i },
    { label: "Polos", re: /polo/i },
    { label: "Pulls", re: /pull|maille|sweat|cardigan|hoodie/i },
    { label: "Vestes", re: /veste|blazer|surchemise/i },
    { label: "Manteaux", re: /manteau|parka|trench|doudoune/i },
    { label: "Pantalons", re: /pantalon|chino|jogging/i },
    { label: "Jeans", re: /jean|denim/i },
    { label: "Robes", re: /robe/i },
    { label: "Jupes", re: /jupe/i },
    { label: "Shorts", re: /short|bermuda/i },
  ],
  sacs: [
    { label: "Sacs à main", re: /sac à main|sac main|tote|cabas|hand ?bag/i },
    { label: "Sacs à dos", re: /sac à dos|backpack/i },
    { label: "Pochettes", re: /pochette|clutch/i },
    { label: "Bananes", re: /banane|belt ?bag|cross-?body/i },
  ],
  accessoires: [
    { label: "Ceintures", re: /ceinture|belt/i },
    { label: "Foulards", re: /foulard|écharpe|echarpe|scarf/i },
    { label: "Chapeaux", re: /chapeau|bob|casquette|bonnet|hat|cap/i },
    { label: "Lunettes", re: /lunette|solaire|sunglass/i },
    { label: "Cravates", re: /cravate|nœud|noeud papillon|tie/i },
    { label: "Gants", re: /gant|glove/i },
  ],
  bijoux: [
    { label: "Bagues", re: /bague|ring/i },
    { label: "Colliers", re: /collier|pendentif|necklace/i },
    { label: "Boucles d'oreilles", re: /boucle|earring/i },
    { label: "Bracelets", re: /bracelet|manchette|jonc/i },
  ],
};

/* Garde-fou affichage 2026-06-09 (« Derby jumper » dans les chaussures) :
   un produit classé dans un slot mais dont le NOM crie une autre catégorie
   (ex. « Derby jumper » mis en chaussures car « derby » matchait) est écarté
   du pool de ce slot. Corrige l'affichage sans réingérer le KV (le fix racine
   est dans inferCategoryFromProductName, appliqué aux prochaines ingestions).
   Liste stricte : pas de « top »/« low-top », « knit »/« denim » (existent en
   baskets), ni « polo » (= marque). */
const SLOT_NAME_MISMATCH: Partial<Record<string, RegExp>> = {
  chaussures: /\b(jumper|sweater|sweatshirt|pullover|cardigan|hoodie|t[\s-]?shirt|tee|chemise|trousers?|pantalon|jeans?|chinos?|shorts?|bermuda|blazer|jacket|coat|manteau|parka|robe|dress|skirt|jupe|blouse)\b/i,
  /* veste : écarte les PANTALONS mal classés en veste — ex. « Anzughose »
     (pantalon de costume K&Ö) tombait sous le chemin « Anzüge » → veste.
     « hose » en sous-chaîne capte les composés allemands (Anzughose,
     Stoffhose…). 2026-06-10. */
  veste: /hose|\bpantalon\b|\btrousers?\b/i,
};

/** false si le produit est manifestement mal classé dans son slot (nom ≠ slot). */
export function isSlotNameConsistent(p: { categorie?: string; nom?: string }): boolean {
  const re = SLOT_NAME_MISMATCH[p.categorie || ""];
  return re ? !re.test(p.nom || "") : true;
}

/** Familles de couleur — pastilles + mots-clés + hex de référence (pour ΔE). */
export const COLOR_FAMILIES: { name: string; hex: string; kws: RegExp }[] = [
  { name: "Noir", hex: "#1a1a1a", kws: /noir|black|encre|anthracite/i },
  { name: "Blanc", hex: "#ffffff", kws: /blanc|white|écru|ecru|ivoire|ivory|optique/i },
  { name: "Gris", hex: "#c9c4ba", kws: /gris|grey|gray|ardoise|charbon/i },
  { name: "Beige", hex: "#d4ccc0", kws: /beige|sable|sand|taupe|grège|grege|nude/i },
  { name: "Crème", hex: "#ede4d4", kws: /crème|creme|cream|os|lin naturel/i },
  { name: "Marron", hex: "#5a4530", kws: /marron|brun|brown|chocolat|tabac|moka|noyer|noisette|cognac|camel/i },
  { name: "Bordeaux", hex: "#6e3b32", kws: /bordeaux|burgundy|bourgogne|lie de vin|grenat/i },
  { name: "Bleu", hex: "#2c4a5c", kws: /bleu|blue|marine|navy|indigo|cobalt|pétrole|petrole|denim/i },
  { name: "Vert", hex: "#8b9579", kws: /vert|green|kaki|khaki|olive|sauge|sapin|mousse|émeraude|emeraude/i },
  { name: "Rouge", hex: "#b23a2e", kws: /rouge|red|brique|tomate|carmin|écarlate/i },
  { name: "Rose", hex: "#d99aa6", kws: /rose|pink|blush|poudré|fuchsia/i },
  { name: "Jaune", hex: "#d8b54a", kws: /jaune|yellow|moutarde|or |doré|dore|ocre|safran/i },
];

/** Matières + regex de détection. */
export const MATERIALS: { label: string; re: RegExp }[] = [
  { label: "Coton", re: /coton|cotton/i },
  { label: "Laine", re: /laine|wool|mérinos|merinos/i },
  { label: "Lin", re: /\blin\b|linen/i },
  { label: "Cuir", re: /cuir|leather|nubuck|veau/i },
  { label: "Daim", re: /daim|suède|suede/i },
  { label: "Cachemire", re: /cachemire|cashmere/i },
  { label: "Soie", re: /soie|silk/i },
  { label: "Denim", re: /denim|jean/i },
  { label: "Velours", re: /velours|velvet|velours côtelé/i },
];

/** Saisons — 3 buckets de la spec → mots-clés / mois implicites. */
export const SEASONS: { value: string; label: string; re: RegExp }[] = [
  { value: "ete", label: "Été", re: /été|ete|summer|lin|short|sandale|maillot/i },
  { value: "mi-saison", label: "Mi-saison", re: /mi-saison|printemps|automne|spring|autumn|fall|trench|chino/i },
  { value: "hiver", label: "Hiver", re: /hiver|winter|laine|cachemire|manteau|parka|doudoune|polaire/i },
];

export const STYLES: { value: string; label: string }[] = [
  { value: "minimaliste", label: "Minimaliste" },
  { value: "academia", label: "Classique" },
  { value: "streetwear", label: "Streetwear" },
  { value: "boheme", label: "Bohème" },
  { value: "edgy", label: "Avant-garde" },
  { value: "country", label: "Décontracté" },
  { value: "romantique", label: "Romantique" },
  { value: "soiree", label: "Soirée" },
  { value: "plage", label: "Plage" },
  { value: "sport", label: "Sport" },
];

/* ──────────────────────────────────────────────────────────────────────
   PRÉDICATS (un produit passe-t-il un filtre donné ?)
   ────────────────────────────────────────────────────────────────────── */

/* Seuil de match couleur ⇄ accord. La spec proposait 30, mais ΔE2000 < 30
   est PERCEPTIVEMENT très large : sur un accord de neutres (gris/beige/marine)
   ça matche ~tout le catalogue. Le schéma WADA lui-même note < 15 = match
   strict, 15-25 = approchant. On retient 16 → sélectif et cohérent, tout en
   laissant les accords distinctifs (indigo, ocre…) ramener une vraie famille. */
const PALETTE_DELTA_E = 16;

/** Texte de matching = nom + couleur + description (lowercased). */
function haystack(p: ProduitAwin): string {
  return `${p.nom} ${p.couleurNom || ""} ${p.description || ""}`.toLowerCase();
}

/* Couleurs SIGNATURE d'un accord = celles qui portent son identité
   chromatique (chromatiques OU sombres OU franchement claires), par
   opposition aux gris/beiges pâles « de remplissage » qui matchent tout le
   catalogue. On matche un produit sur ces couleurs-là. Mémoïsé par accord. */
const _signatureCache = new Map<string, string[]>();
function signatureColors(entry: DictionaryEntry): string[] {
  const cached = _signatureCache.get(entry.number);
  if (cached) return cached;
  const sig = entry.colors.filter((c) => {
    const [L, a, b] = hexToLab(c.hex);
    const chroma = Math.sqrt(a * a + b * b);
    return chroma >= 18 || L <= 38 || L >= 93; // chromatique, sombre, ou très clair
  }).map((c) => c.hex);
  /* Si l'accord est 100% neutre pâle, on retombe sur toutes ses couleurs. */
  const result = sig.length ? sig : entry.colors.map((c) => c.hex);
  _signatureCache.set(entry.number, result);
  return result;
}

/** Un produit matche-t-il l'accord Sanzō Wada `entry` (par ΔE sur ses
 *  couleurs signature) ? */
export function productMatchesPalette(p: ProduitAwin, entry: DictionaryEntry): boolean {
  if (!p.hex) return false;
  /* Court-circuit : paletteRef pré-calculé à l'ingestion = match certain. */
  if (p.paletteRef && p.paletteRef === entry.number) return true;
  for (const hex of signatureColors(entry)) {
    if (deltaEHex(p.hex, hex) < PALETTE_DELTA_E) return true;
  }
  return false;
}

export function matchType(p: ProduitAwin, category: string, types: string[]): boolean {
  if (types.length === 0) return true;
  const defs = TYPES_BY_CATEGORY[category] || [];
  const hay = haystack(p);
  return types.some((t) => {
    const def = defs.find((d) => d.label === t);
    return def ? def.re.test(hay) : false;
  });
}

export function matchGenre(p: ProduitAwin, genres: string[]): boolean {
  if (genres.length === 0) return true;
  return genres.some((g) => {
    if (g === "mixte") return p.genre === "unisexe";
    return p.genre === g || p.genre === "unisexe";
  });
}

export function matchColor(p: ProduitAwin, colors: string[]): boolean {
  if (colors.length === 0) return true;
  const hay = `${p.couleurNom || ""} ${p.nom}`.toLowerCase();
  return colors.some((name) => {
    const fam = COLOR_FAMILIES.find((f) => f.name === name);
    if (!fam) return false;
    if (fam.kws.test(hay)) return true;
    /* Fallback ΔE sur le hex produit (couleurNom parfois absent/« - »).
       Seuil strict (15) pour éviter confusion marron↔rouge, bordeaux↔noir. */
    return p.hex ? deltaEHex(p.hex, fam.hex) < 15 : false;
  });
}

export function matchMaterial(p: ProduitAwin, materials: string[]): boolean {
  if (materials.length === 0) return true;
  const hay = haystack(p);
  return materials.some((m) => {
    const def = MATERIALS.find((d) => d.label === m);
    return def ? def.re.test(hay) : false;
  });
}

export function matchSeason(p: ProduitAwin, seasons: string[]): boolean {
  if (seasons.length === 0) return true;
  const hay = haystack(p);
  return seasons.some((s) => {
    const def = SEASONS.find((d) => d.value === s);
    return def ? def.re.test(hay) : false;
  });
}

export function matchStyle(p: ProduitAwin, styles: string[]): boolean {
  if (styles.length === 0) return true;
  /* On s'appuie sur brandRegistre (proxy de macro-style de la marque) +
     quelques mots-clés du nom. Mapping souple registre → macro. */
  const REG_TO_MACRO: Record<string, string> = {
    classique: "academia", minimaliste: "minimaliste", streetwear: "streetwear",
    decontracte: "country", outdoor: "country", avant_garde: "edgy",
    heritage_country: "country", apres_ski: "sport",
  };
  const reg = p.brandRegistre ? REG_TO_MACRO[p.brandRegistre] : undefined;
  const hay = haystack(p);
  return styles.some((s) => {
    if (reg === s) return true;
    if (s === "streetwear" && /hoodie|sweat|jogging|sneaker|cargo/i.test(hay)) return true;
    if (s === "minimaliste" && /uni|essentiel|basique|col rond/i.test(hay)) return true;
    if (s === "soiree" && /satin|sequin|paillette|smoking/i.test(hay)) return true;
    if (s === "plage" && /lin|maillot|short de bain|paréo/i.test(hay)) return true;
    if (s === "academia" && /blazer|oxford|tweed|chino|maille/i.test(hay)) return true;
    return false;
  });
}

export function matchSale(p: ProduitAwin, onSale: boolean): boolean {
  if (!onSale) return true;
  /* Pas de champ solde dans le flux → best-effort par mots-clés. */
  return /solde|promo|outlet|\-\d{2}\s?%|destockage|déstockage/i.test(haystack(p));
}

/* ──────────────────────────────────────────────────────────────────────
   APPLICATION COMPLÈTE
   ────────────────────────────────────────────────────────────────────── */

/** Filtre un pool de produits (déjà restreint à la catégorie) selon les filtres. */
export function applyCategoryFilters(
  products: ProduitAwin[],
  filters: CategoryFilters,
  category: string,
): ProduitAwin[] {
  /* Pré-résout les entries de palette sélectionnées (une seule fois). */
  const selectedPalettes = filters.palettes.length
    ? dictionary.filter((d) => filters.palettes.includes(d.number))
    : [];

  return products.filter((p) => {
    if (filters.priceMin > PRICE_MIN && (p.prix ?? 0) < filters.priceMin) return false;
    if (filters.priceMax < PRICE_MAX && (p.prix ?? 0) > filters.priceMax) return false;
    if (filters.brands.length && !filters.brands.includes((p.marque || p.marchand || "").trim())) return false;
    if (filters.sizes.length && !(p.tailles || []).some((t) => filters.sizes.includes(t))) return false;
    if (!matchGenre(p, filters.genres)) return false;
    if (!matchType(p, category, filters.types)) return false;
    if (!matchColor(p, filters.colors)) return false;
    if (!matchMaterial(p, filters.materials)) return false;
    if (!matchSeason(p, filters.seasons)) return false;
    if (!matchStyle(p, filters.styles)) return false;
    if (!matchSale(p, filters.onSale)) return false;
    if (selectedPalettes.length && !selectedPalettes.some((e) => productMatchesPalette(p, e))) return false;
    return true;
  });
}

/** Tri d'un pool selon `filters.sort`. */
export function sortProducts(products: ProduitAwin[], sort: string): ProduitAwin[] {
  const out = [...products];
  if (sort === "prix-asc") out.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
  else if (sort === "prix-desc") out.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
  /* "nouveau" : pas d'horodatage produit fiable → ordre catalogue conservé. */
  return out;
}

/* ──────────────────────────────────────────────────────────────────────
   COMPTEURS DE FACETTES (pour /counts + griser les options vides)
   ────────────────────────────────────────────────────────────────────── */
export function computeCounts(
  products: ProduitAwin[],
  category: string,
  dimension: "type" | "color" | "brand" | "size" | "material" | "season" | "genre",
): Record<string, number> {
  const counts: Record<string, number> = {};
  const bump = (k: string) => { counts[k] = (counts[k] || 0) + 1; };

  for (const p of products) {
    const hay = haystack(p);
    if (dimension === "type") {
      for (const d of (TYPES_BY_CATEGORY[category] || [])) if (d.re.test(hay)) bump(d.label);
    } else if (dimension === "color") {
      const cc = `${p.couleurNom || ""} ${p.nom}`.toLowerCase();
      for (const f of COLOR_FAMILIES) if (f.kws.test(cc)) bump(f.name);
    } else if (dimension === "brand") {
      const b = (p.marque || p.marchand || "").trim(); if (b) bump(b);
    } else if (dimension === "size") {
      for (const t of (p.tailles || [])) bump(t);
    } else if (dimension === "material") {
      for (const d of MATERIALS) if (d.re.test(hay)) bump(d.label);
    } else if (dimension === "season") {
      for (const d of SEASONS) if (d.re.test(hay)) bump(d.value);
    } else if (dimension === "genre") {
      const g = p.genre === "unisexe" ? "mixte" : p.genre; bump(g);
    }
  }
  return counts;
}

/* ──────────────────────────────────────────────────────────────────────
   SÉRIALISATION URL  ⇄  filtres
   ────────────────────────────────────────────────────────────────────── */
export function filtersToParams(f: CategoryFilters): URLSearchParams {
  const p = new URLSearchParams();
  const csv = (k: string, arr: string[]) => { if (arr.length) p.set(k, arr.join(",")); };
  csv("palettes", f.palettes);
  csv("types", f.types);
  csv("genres", f.genres);
  csv("brands", f.brands);
  csv("colors", f.colors);
  csv("sizes", f.sizes);
  csv("styles", f.styles);
  csv("seasons", f.seasons);
  csv("materials", f.materials);
  if (f.priceMin > PRICE_MIN) p.set("priceMin", String(f.priceMin));
  if (f.priceMax < PRICE_MAX) p.set("priceMax", String(f.priceMax));
  if (f.onSale) p.set("onSale", "1");
  if (f.sort) p.set("sort", f.sort);
  return p;
}

export function paramsToFilters(sp: URLSearchParams): CategoryFilters {
  const arr = (k: string) => { const v = sp.get(k); return v ? v.split(",").filter(Boolean) : []; };
  const num = (k: string, dflt: number) => { const v = parseFloat(sp.get(k) || ""); return Number.isFinite(v) ? v : dflt; };
  return {
    palettes: arr("palettes"), types: arr("types"), genres: arr("genres"),
    brands: arr("brands"), colors: arr("colors"), sizes: arr("sizes"),
    priceMin: num("priceMin", PRICE_MIN), priceMax: num("priceMax", PRICE_MAX),
    styles: arr("styles"), seasons: arr("seasons"), materials: arr("materials"),
    onSale: sp.get("onSale") === "1", sort: sp.get("sort") || "",
  };
}

/** Nombre de filtres actifs (pour le badge mobile). */
export function activeFilterCount(f: CategoryFilters): number {
  return (
    f.palettes.length + f.types.length + f.genres.length + f.brands.length +
    f.colors.length + f.sizes.length + f.styles.length + f.seasons.length +
    f.materials.length + (f.onSale ? 1 : 0) +
    (f.priceMin > PRICE_MIN || f.priceMax < PRICE_MAX ? 1 : 0)
  );
}
