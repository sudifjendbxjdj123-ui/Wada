/**
 * lib/algolia.ts — helpers pour l'intégration Algolia.
 *
 * Statut : SCAFFOLD prêt à l'activation. Pour activer :
 *
 *   1. npm install algoliasearch
 *   2. Renseigner les variables NEXT_PUBLIC_ALGOLIA_* dans .env.local
 *   3. Lancer : node scripts/indexAlgolia.mjs
 *   4. Le composant SearchBar.tsx utilisera Algolia automatiquement
 *
 * Ce module n'importe PAS algoliasearch directement — il fournit uniquement
 * les types et les transformers pour préparer les records. L'utilisation
 * effective se fait dans scripts/indexAlgolia.mjs (Node) et components/SearchBar.tsx
 * (client). Tant qu'aucune variable n'est définie, isAlgoliaConfigured() retourne
 * false et le SearchBar fait du fallback local sur lib/data.dictionary.
 */

import { dictionary, type DictionaryEntry } from "./data";

/* ──────────────────────────────────────────────────────────────────────
   Détection de config
   ────────────────────────────────────────────────────────────────────── */

export function isAlgoliaConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID &&
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
  );
}

export const ALGOLIA_APP_ID    = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID    || "";
export const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || "";
export const INDEX_PALETTES    = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_PALETTES || "wada_palettes";
export const INDEX_BRANDS      = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_BRANDS   || "wada_brands";

/* ──────────────────────────────────────────────────────────────────────
   Types des records indexés
   ────────────────────────────────────────────────────────────────────── */

export type PaletteRecord = {
  objectID: string;                  // requis par Algolia — utilise le numéro
  number: string;                    // "002"
  name: string;                      // "Brunch à Brooklyn"
  culture?: string;                  // "Américaine"
  colors: { name: string; hex: string }[];
  colorNames: string[];              // pour faciliter le search ("terracotta", "indigo")
  colorHexes: string[];              // pour les filtres facettes
  composition: { piece: string; item: string }[];
  pieceItems: string[];              // ["Cardigan terracotta", "Jean droit denim doux", ...]
  searchableText: string;            // tout assemblé pour le search full-text
};

export type BrandRecord = {
  objectID: string;                  // slug normalisé du label
  label: string;                     // "Sézane"
  sub: string;                       // "Premium FR"
  tier: string;                      // "Premium"
  url: string;                       // URL de recherche base
  vibes?: string[];
  eco?: boolean;
  priceLevel?: string;
  categories?: string[];
};

/* ──────────────────────────────────────────────────────────────────────
   Transformers — préparent les records pour l'indexation
   ────────────────────────────────────────────────────────────────────── */

/**
 * Convertit une palette du dictionnaire en record Algolia.
 * Crée un champ `searchableText` qui agrège tous les termes recherchables.
 */
export function paletteToRecord(entry: DictionaryEntry): PaletteRecord {
  const colorNames = entry.colors.map((c) => c.name);
  const colorHexes = entry.colors.map((c) => c.hex.toLowerCase());
  const pieceItems = entry.composition.map((c) => c.item);
  return {
    objectID: entry.number,
    number: entry.number,
    name: entry.name,
    culture: entry.culture,
    colors: entry.colors.map((c) => ({ name: c.name, hex: c.hex })),
    colorNames,
    colorHexes,
    composition: entry.composition.map((c) => ({ piece: c.piece, item: c.item })),
    pieceItems,
    searchableText: [
      entry.number,
      entry.name,
      entry.culture,
      ...colorNames,
      ...pieceItems,
    ].filter(Boolean).join(" "),
  };
}

/** Convertit tout le dictionnaire WADA en records prêts à indexer. */
export function buildPaletteRecords(): PaletteRecord[] {
  return dictionary.map(paletteToRecord);
}

/**
 * Convertit un objet shop link en record Algolia brand.
 * Note : `shopOptions(q)` génère des URLs dynamiques selon `q` — pour l'index
 * Algolia on stocke la marque elle-même (sans la query). L'URL est reconstruite
 * côté UI au moment du clic via shopOptions(query).
 */
export type BrandSeed = {
  label: string;
  sub: string;
  tier: string;
  baseUrl: string;
  vibes?: string[];
  eco?: boolean;
  priceLevel?: string;
  categories?: string[];
};

export function brandToRecord(b: BrandSeed): BrandRecord {
  const slug = b.label.toLowerCase()
    .replace(/[àáâãä]/g, "a").replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i").replace(/[óòôõö]/g, "o")
    .replace(/[úùûü]/g, "u").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    objectID: slug,
    label: b.label,
    sub: b.sub,
    tier: b.tier,
    url: b.baseUrl,
    vibes: b.vibes,
    eco: b.eco,
    priceLevel: b.priceLevel,
    categories: b.categories,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Settings recommandés pour l'index — appliqués par scripts/indexAlgolia.mjs
   ────────────────────────────────────────────────────────────────────── */

export const PALETTE_INDEX_SETTINGS = {
  // Champs cherchés par ordre de priorité décroissante
  searchableAttributes: [
    "name",                    // titre de la palette
    "unordered(colorNames)",   // noms des couleurs
    "unordered(pieceItems)",   // pièces de la tenue
    "culture",                 // culture d'origine
    "number",                  // numéro de palette
  ],
  // Facettes pour les filtres UI
  attributesForFaceting: [
    "filterOnly(colorHexes)",
    "searchable(culture)",
    "searchable(colorNames)",
  ],
  // Typo : 2 caractères avant 1 typo, 5 avant 2 typos (fuzzy matching)
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 6,
  // Highlight HTML
  highlightPreTag: '<mark class="wada-highlight">',
  highlightPostTag: "</mark>",
};

export const BRAND_INDEX_SETTINGS = {
  searchableAttributes: [
    "label",                   // nom de marque
    "unordered(tier)",
    "unordered(sub)",
    "unordered(vibes)",
  ],
  attributesForFaceting: [
    "tier",
    "vibes",
    "priceLevel",
    "categories",
    "eco",
  ],
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 6,
  highlightPreTag: '<mark class="wada-highlight">',
  highlightPostTag: "</mark>",
};
