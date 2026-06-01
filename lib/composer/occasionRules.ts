/**
 * lib/composer/occasionRules.ts
 *
 * Brief URGENT 2026-06-01 Nemanja — Règle 3 « Table occasion → slots autorisés
 * + types interdits ».
 *
 * Empêche le composer de proposer une absurdité contextuelle (short de bain
 * en bureau, sneakers de sport en cérémonie, costume 3 pièces en weekend).
 *
 * Le check se fait par mots-clés dans `product_name` (peu fiable mais marche
 * pour le 90 % des cas courants).
 *
 * Aussi : WHITELIST_SOURCES — seules les marques affiliées WADA passent le
 * filtre. Si un produit arrive d'un marchand non whitelisté (Veja, COS,
 * Zara), il est rejeté avant même le scoring.
 */

/* Slugs marchand (cf. slugMerchant() dans lib/awinFeed.ts). Doit matcher
   exactement le `marchandSlug` côté ProduitAwin. */
export const WHITELIST_SOURCES = new Set<string>([
  "muji-france",
  "the-business-fashion",
  "suitable-fr",
  /* À ajouter quand intégrés : "the-shirt-company", "armor-lux", … */
]);

/**
 * Mots-clés FR + EN à exclure du `product_name` selon l'occasion. Si le nom
 * contient une de ces chaînes (insensible casse), le produit est rejeté.
 *
 * Conventions : les chaînes peuvent contenir des espaces, accents, ou tirets.
 * Le match est strict `String.prototype.includes()` après lowercase.
 */
export const FORBIDDEN_TYPES: Record<string, string[]> = {
  bureau: [
    "short de bain", "swim short", "swim trunks",
    "short ", "shorts ",
    "survêtement", "jogging", "track pant", "track suit",
    "sneakers de sport", "running shoe", "sport shoe",
    "casquette", "bonnet", "beanie",
    "tongs", "flip flop", "flip-flop",
    "t-shirt", "tee-shirt", "tee shirt",
  ],
  quotidien: [
    "short de bain", "swim short", "swim trunks",
    "smoking", "tuxedo", "costume de cérémonie", "wedding suit",
    "frac", "queue de pie",
  ],
  soiree: [
    "short de bain", "swim short", "swim trunks",
    "short ", "shorts ",
    "sneakers de sport", "running shoe", "sport shoe",
    "casquette", "bonnet", "beanie",
    "tongs", "flip flop", "flip-flop",
    "survêtement", "jogging",
  ],
  weekend: [
    "costume 3 pièces", "three piece suit",
    "cravate", "necktie",
    "short de bain", "swim short", "swim trunks",
    "frac", "smoking", "tuxedo",
  ],
  voyage: [
    "short de bain", "swim short", "swim trunks",
    "costume de cérémonie", "wedding suit", "smoking", "tuxedo",
    "sneakers de sport", "running shoe", "sport shoe",
    "frac", "queue de pie",
  ],
  rendez_vous: [
    "short de bain", "swim short", "swim trunks",
    "survêtement", "jogging",
    "casquette", "bonnet", "beanie",
  ],
  ceremonie: [
    "short ", "shorts ", "short de bain",
    "sneakers", "trainers",
    "jean", "jeans", "denim",
    "t-shirt", "tee-shirt", "tee shirt",
    "casquette", "bonnet", "beanie",
    "tongs", "flip flop", "flip-flop",
    "survêtement", "jogging", "track pant",
  ],
};

/**
 * True si le produit est compatible avec l'occasion. Cherche un mot-clé
 * interdit dans `product_name`. False sur match (rejet).
 *
 * `t-shirt` exclu de `bureau` : pour un bureau formel, on préfère chemise.
 * Si tu veux du smart-casual t-shirt-blazer, choisis l'occasion `quotidien`.
 */
export function isProductOkForOccasion(productName: string, occasion: string): boolean {
  const forbidden = FORBIDDEN_TYPES[occasion];
  if (!forbidden || forbidden.length === 0) return true;
  const name = productName.toLowerCase();
  for (const ban of forbidden) {
    if (name.includes(ban)) return false;
  }
  return true;
}

/** True si la source est une marque affiliée WADA. */
export function isAffiliated(source: string): boolean {
  return WHITELIST_SOURCES.has(source);
}
