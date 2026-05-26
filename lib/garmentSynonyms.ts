/**
 * garmentSynonyms — table de synonymes FR/EN pour pièces et couleurs.
 *
 * Brief 2026-05-22 §5 : la recherche / le matching doit comprendre
 *   pull → pull, sweater, maille, knit
 *   sneakers → baskets, sneakers, tennis
 * etc. Aujourd'hui la query envoyée aux marchands est littérale (« hoodie
 * oversized fer »), donc un marchand qui n'utilise pas « hoodie » dans
 * ses tags rate la recherche.
 *
 * Utilisation :
 *   - lib/merchantSearch.ts (buildMerchantUrl) → enrichit la query
 *   - futur lib/productFeed.ts (matching local sur flux) → multi-champ
 */

/* ──────────────────────────────────────────────────────────────────────
   SYNONYMES DE TYPES DE PIÈCES
   ──────────────────────────────────────────────────────────────────────
   Clé = mot canonique français court. Valeur = liste de synonymes
   exploitables côté marchand (FR + EN courants en e-commerce mode).
   L'ordre importe peu côté recherche, mais on met d'abord les variantes
   les plus larges pour maximiser le rappel. */

export const GARMENT_SYNONYMS: Record<string, string[]> = {
  // ─── HAUT ─────────────────────────────────────────────────────────
  "pull":     ["pull", "sweater", "maille", "knit", "pull-over"],
  "hoodie":   ["hoodie", "sweat à capuche", "sweat capuche", "sweatshirt"],
  "sweat":    ["sweat", "sweatshirt", "molleton", "crewneck"],
  "tshirt":   ["t-shirt", "tee", "tee-shirt", "tshirt"],
  "polo":     ["polo", "piqué", "polo shirt"],
  "chemise":  ["chemise", "shirt", "oxford", "popeline"],
  "blouse":   ["blouse", "shirt", "top"],
  "cardigan": ["cardigan", "gilet"],
  "henley":   ["henley", "tee henley"],
  "marinière":["marinière", "breton", "striped tee"],

  // ─── BAS ──────────────────────────────────────────────────────────
  "pantalon": ["pantalon", "trousers", "pants", "slacks"],
  "chino":    ["chino", "chinos", "trousers"],
  "jean":     ["jean", "jeans", "denim"],
  "cargo":    ["cargo", "cargo pant", "pantalon cargo"],
  "jogging":  ["jogging", "joggers", "sweatpants", "track pant"],
  "short":    ["short", "shorts", "bermuda"],
  "jupe":     ["jupe", "skirt"],

  // ─── VESTE / OUTERWEAR ────────────────────────────────────────────
  "blazer":   ["blazer", "veste tailleur", "tailored jacket"],
  "veste":    ["veste", "jacket"],
  "manteau":  ["manteau", "coat", "overcoat"],
  "trench":   ["trench", "trench coat", "trenchcoat"],
  "doudoune": ["doudoune", "puffer", "down jacket"],
  "bomber":   ["bomber", "bomber jacket"],
  "parka":    ["parka", "parka coat"],
  "cardigan-outer": ["cardigan", "gilet"],
  "surchemise":     ["surchemise", "overshirt", "shirt jacket", "shacket"],
  "coupe-vent":     ["coupe-vent", "windbreaker", "windcheater"],

  // ─── CHAUSSURES ───────────────────────────────────────────────────
  "sneakers":   ["sneakers", "baskets", "tennis", "trainers"],
  "derbies":    ["derbies", "derby", "derby shoes"],
  "mocassins":  ["mocassins", "loafers", "penny loafers"],
  "richelieu":  ["richelieu", "oxford shoes"],
  "bottines":   ["bottines", "ankle boots", "chelsea boots"],
  "bottes":     ["bottes", "boots"],
  "espadrilles":["espadrilles", "espadrille"],
  "sandales":   ["sandales", "sandals"],
  "ballerines": ["ballerines", "ballet flats", "flats"],
  "escarpins":  ["escarpins", "pumps", "heels"],
  "mules":      ["mules", "mule"],

  // ─── ACCESSOIRES ──────────────────────────────────────────────────
  "ceinture":  ["ceinture", "belt"],
  "foulard":   ["foulard", "scarf", "silk scarf"],
  "écharpe":   ["écharpe", "scarf"],
  "casquette": ["casquette", "cap", "baseball cap"],
  "bonnet":    ["bonnet", "beanie"],
  "chapeau":   ["chapeau", "hat"],
  "sac":       ["sac", "bag"],
  "sacoche":   ["sacoche", "messenger bag", "shoulder bag"],
  "pochette":  ["pochette", "clutch"],
  "tote":      ["tote", "tote bag", "cabas"],
  "banane":    ["sacoche banane", "banane", "fanny pack", "bum bag"],
};

/* ──────────────────────────────────────────────────────────────────────
   SYNONYMES DE COULEURS (FR ↔ EN)
   ──────────────────────────────────────────────────────────────────────
   Mappés vers le mot français canonique. Les marchands étrangers utilisent
   l'anglais — il faut donc envoyer les deux variantes pour ratisser large. */

export const COLOR_SYNONYMS: Record<string, string[]> = {
  "noir":        ["noir", "black", "jet"],
  "blanc":       ["blanc", "white"],
  "blanc cassé": ["blanc cassé", "off-white", "ivory", "écru"],
  "crème":       ["crème", "cream", "ecru", "écru"],
  "anthracite":  ["anthracite", "charcoal", "graphite"],
  "gris":        ["gris", "grey", "gray"],
  "marine":      ["marine", "navy", "bleu marine"],
  "indigo":      ["indigo", "denim"],
  "bleu":        ["bleu", "blue"],
  "bordeaux":    ["bordeaux", "burgundy", "wine"],
  "rouge":       ["rouge", "red"],
  "rose":        ["rose", "pink", "blush"],
  "sauge":       ["sauge", "sage", "sage green"],
  "olive":       ["olive", "olive green"],
  "kaki":        ["kaki", "khaki"],
  "vert":        ["vert", "green"],
  "camel":       ["camel", "tan", "fauve"],
  "sable":       ["sable", "beige", "sand", "taupe"],
  "terracotta":  ["terracotta", "rust", "brique"],
  "moutarde":    ["moutarde", "mustard", "ocre", "ochre"],
  "marron":      ["marron", "brown", "chocolate"],
  "prune":       ["prune", "plum", "aubergine"],
};

/* ──────────────────────────────────────────────────────────────────────
   HELPERS
   ────────────────────────────────────────────────────────────────────── */

/**
 * Extrait le mot canonique d'un libellé de pièce.
 * « Hoodie oversized » → « hoodie » ; « Pantalon à pinces » → « pantalon ».
 */
export function canonicalGarment(label: string): string | null {
  const norm = label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const key of Object.keys(GARMENT_SYNONYMS)) {
    const keyNorm = key.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    // Match si le label contient le mot canonique
    if (new RegExp(`\\b${keyNorm}s?\\b`, "i").test(norm)) return key;
    // Match aussi sur les synonymes
    for (const syn of GARMENT_SYNONYMS[key]) {
      const synNorm = syn.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (new RegExp(`\\b${synNorm}\\b`, "i").test(norm)) return key;
    }
  }
  return null;
}

/**
 * Construit une requête de recherche enrichie en multi-synonymes.
 * « pull blanc homme » → « pull blanc homme » + variantes
 *
 * On garde la requête principale (la plus précise) en premier ; les
 * synonymes vont en réserve si le marchand supporte les opérateurs « OR ».
 * Pour un usage URL search standard, on utilise juste la requête primaire.
 */
export function buildSearchQuery(piece: {
  type: string;
  couleurNom?: string;
  genre?: string;
}): { primary: string; expanded: string[] } {
  const primary = [piece.type, piece.couleurNom, piece.genre]
    .filter(Boolean)
    .map((s) => s!.trim())
    .filter((s) => s.length > 0)
    .join(" ");

  // Génère des variantes via synonymes (jamais utilisées pour l'URL
  // mais utiles pour le matching local sur un flux produit)
  const expanded: string[] = [primary];
  const typeKey = canonicalGarment(piece.type);
  if (typeKey) {
    const typeSyns = GARMENT_SYNONYMS[typeKey];
    for (const ts of typeSyns) {
      const variant = [ts, piece.couleurNom, piece.genre].filter(Boolean).join(" ");
      if (variant && !expanded.includes(variant)) expanded.push(variant);
    }
  }
  return { primary, expanded };
}
