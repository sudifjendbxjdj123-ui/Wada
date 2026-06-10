/**
 * lib/composer/microTypes.ts
 *
 * Brief 2026-06-01 urgent — Trou 2 : cohérence intra-tenue au niveau du type
 * de pièce.
 *
 * Problème : un short de sport Lacoste + cardigan oversize + Birkenstock
 * Arizona = 3 références incompatibles stylistiquement même si chaque pièce
 * passe les filtres registre / genre / couleur / occasion séparément.
 *
 * Solution : table de règles MICRO_TYPE qui détectent le sous-type de pièce
 * depuis le product_name et appliquent des incompatibilités pairwise.
 *
 * Usage dans /api/products et lib/composer/filterPool :
 *   1. detectMicroType(nom) → string[]  (liste des étiquettes du produit)
 *   2. isMicroTypeCompatible(slotA, typesA, slotB, typesB) → bool
 *      (pour vérifier 2 pièces déjà sélectionnées)
 *   3. filterBySlotColor(pool, slot, paletteColors) → pool filtré
 *      (garde STRICT par couleur de slot avant tout pick)
 */

/* ─── DÉTECTION DE MICRO-TYPE depuis product_name ─── */

export type MicroType =
  | "short"           // short en général (sport, déco, bermuda)
  | "short_sport"     // short de sport / mesh / gym
  | "chino"
  | "jean"
  | "pantalon"        // pantalon tailleur / costume / droit
  | "cardigan"
  | "pull_fin"        // pull fin / mailles fines / col-v formel
  | "pull_over"       // pull épais / grosse maille
  | "sweat"
  | "chemise"
  | "polo"
  | "tshirt"
  | "blazer"
  | "veste_sport"     // veste de jogging / training jacket
  | "sneaker_sport"   // running / trainer de sport
  | "sneaker_casual"  // sneaker lifestyle / toile / cuir
  | "sandal_plage"    // tong / flip-flop / nu-pied de plage
  | "sandal_casual"   // Birkenstock / huarache / sandale de ville
  | "derby"           // derby / oxford / richelieu
  | "mocassin"
  | "sac_sport"       // sac de gym / duffle bag
  | "sac_ville";      // tote / fourre-tout / sac à main de ville

const MICRO_TYPE_PATTERNS: Array<[RegExp, MicroType]> = [
  // Ordre : du plus spécifique au moins spécifique
  [/\b(short\s+de\s+bain|swim\s+short|swim\s+trunk|maillot\s+de\s+bain)/i,     "short_sport"],
  [/\b(running\s+short|gym\s+short|mesh\s+short|athletic\s+short|sport\s+short)/i, "short_sport"],
  [/\b(jogging|track\s+pant|surv[êe]tement|training\s+pant)/i,                  "veste_sport"],
  [/\b(bermuda|short\b)/i,                                                        "short"],
  [/\b(chino|chi[nñ]o)/i,                                                         "chino"],
  [/\b(jean|denim)/i,                                                              "jean"],
  [/\b(pantalon|trousers?|slacks?|dress\s+pant)/i,                               "pantalon"],
  [/\b(blazer|veste\s+de\s+costume|suit\s+jacket|sport\s+coat)/i,               "blazer"],
  [/\b(training\s+jacket|veste\s+de\s+sport|track\s+jacket)/i,                  "veste_sport"],
  [/\b(cardigan|strickjacke|gilet\s+(?:en\s+)?maille)/i,                          "cardigan"],
  [/\b(pull\s+fin|mailles?\s+fines?|fine[\s-]knit|lightweight\s+knit|polo\s+knit)/i, "pull_fin"],
  [/\b(polo\b)/i,                                                                  "polo"],
  [/\b(pull|pullover|sweatshirt|jumper|sweater|maille|knit|strickpullover|strickpulli)/i, "pull_over"],
  [/\b(sweat\b|hoodie|hooded)/i,                                                  "sweat"],
  [/\b(chemise|shirt\b|oxford\s+shirt|dress\s+shirt)/i,                          "chemise"],
  [/\b(t[\s-]?shirt|tee\b|tee-shirt)/i,                                          "tshirt"],
  [/\b(flip[\s-]?flop|tong|nu[\s-]pied\s+de\s+plage|thong\s+sandal)/i,         "sandal_plage"],
  [/\b(birkenstock|huarache|sandale|sandal|mule\b)/i,                            "sandal_casual"],
  [/\b(running\s+shoe|trainer|athletic\s+shoe|sneakers?\s+de\s+sport|sport\s+shoe)/i, "sneaker_sport"],
  [/\b(sneakers?|baskets?|tennis\b|toile)/i,                                     "sneaker_casual"],
  [/\b(derby|oxford\b|richelieu|brogues?)/i,                                     "derby"],
  [/\b(mocassin|loafer|slip[\s-]?on)/i,                                          "mocassin"],
  [/\b(sac\s+de\s+sport|gym\s+bag|duffle|sport\s+bag)/i,                        "sac_sport"],
  [/\b(tote|fourre[\s-]?tout|sac\s+(?:à|a)\s+main|sac\s+de\s+ville)/i,         "sac_ville"],
];

/** Extrait les micro-types depuis le nom du produit. Un produit peut avoir
 *  plusieurs étiquettes (ex. "short cardigan" → ["short", "cardigan"]). */
export function detectMicroTypes(productName: string): MicroType[] {
  const result: MicroType[] = [];
  const seen = new Set<MicroType>();
  for (const [pattern, type] of MICRO_TYPE_PATTERNS) {
    if (pattern.test(productName) && !seen.has(type)) {
      result.push(type);
      seen.add(type);
    }
  }
  return result;
}

/* ─── INCOMPATIBILITÉS INTRA-TENUE ─── */

/**
 * Paires de micro-types INCOMPATIBLES dans une tenue.
 * Format : [typeA, typeB] — l'ordre n'a pas d'importance (check symétrique).
 *
 * Règles :
 *  - short + cardigan oversize : visuellement incohérent (longueurs opposées)
 *  - short_sport + derby/mocassin : sport pants + chaussures de ville
 *  - short_sport + blazer : sport shorts + tailoring
 *  - veste_sport + derby/mocassin : training jacket + chaussures formelles
 *  - veste_sport + blazer : double couche sport vs tailoring
 *  - sneaker_sport + blazer : running shoe + tailoring
 *  - sneaker_sport + derby : double chaussures formelles (pas une incompatibilité
 *    en soi, mais on laisse passer car on ne peut avoir 2 chaussures)
 *  - sandal_plage + cardigan : plage + chandail = mismatch saison
 *  - sandal_plage + blazer : plage + tailoring
 *  - sac_sport + blazer : gym bag + tailoring
 *  - sac_sport + derby : gym bag + chaussures formelles
 *  - pull_fin + short_sport : chemisier formel + short de sport
 */
const INCOMPATIBLE_PAIRS: Array<[MicroType, MicroType]> = [
  /* Deux mailles dans une tenue — brief 2026-06-10 (user « pull + cardigan ») :
     un pull/sweat (HAUT) + un cardigan (VESTE, incl. « Strickjacke » DE) =
     superposition de mailles redondante → on l'interdit. La veste se résout
     alors sur une pièce structurée (blazer, manteau, surchemise…). */
  ["pull_over",    "cardigan"],
  ["pull_fin",     "cardigan"],
  ["sweat",        "cardigan"],
  ["short",        "cardigan"],
  ["short",        "blazer"],
  ["short",        "derby"],
  ["short",        "mocassin"],
  ["short_sport",  "cardigan"],
  ["short_sport",  "blazer"],
  ["short_sport",  "derby"],
  ["short_sport",  "mocassin"],
  ["short_sport",  "pull_fin"],
  ["veste_sport",  "derby"],
  ["veste_sport",  "mocassin"],
  ["veste_sport",  "blazer"],
  ["sandal_plage", "cardigan"],
  ["sandal_plage", "blazer"],
  ["sandal_plage", "derby"],
  ["sandal_plage", "mocassin"],
  ["sandal_plage", "pull_fin"],
  ["sneaker_sport","blazer"],
  ["sneaker_sport","derby"],
  ["sac_sport",    "blazer"],
  ["sac_sport",    "derby"],
  ["sac_sport",    "mocassin"],
];

/**
 * True si les deux ensembles de micro-types sont compatibles ensemble dans
 * une même tenue. False si l'une des paires incompatibles est détectée.
 */
export function areMicroTypesCompatible(typesA: MicroType[], typesB: MicroType[]): boolean {
  for (const [ta, tb] of INCOMPATIBLE_PAIRS) {
    if (
      (typesA.includes(ta) && typesB.includes(tb)) ||
      (typesA.includes(tb) && typesB.includes(ta))
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Vérifie si un produit candidat (newTypes) est compatible avec TOUS les
 * produits déjà sélectionnés dans la tenue courante.
 */
export function isCompatibleWithOutfit(
  newProductName: string,
  selectedProducts: Array<{ nom: string }>,
): boolean {
  const newTypes = detectMicroTypes(newProductName);
  for (const sel of selectedProducts) {
    const selTypes = detectMicroTypes(sel.nom);
    if (!areMicroTypesCompatible(newTypes, selTypes)) return false;
  }
  return true;
}
