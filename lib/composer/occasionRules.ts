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
  "new-era", // Brief New Era 2026-06-09 — ~5 500 casquettes/textile
  "kastner-ohler", // Brief K&Ö 2026-06-09 — ~30k produits, 520 marques premium
  /* Brief La Redoute 2026-06-14 — grand magasin FR multi-marques : Nike,
     Adidas, Puma, Hugo Boss, Levi's, Superdry… Ouvre l'accès à ces marques
     que K&Ö propose déjà mais uniquement pour la Suisse (geo-gate CHF). */
  "la-redoute",
  /* Brief Spartoo 2026-07-16 — pure player FR chaussures + apparel léger.
     Complète La Redoute côté chaussures et lifestyle (Vans, Dr. Martens,
     Timberland…). Approbation Awin plus rapide → sert de plan B rapide. */
  "spartoo",
  /* Fix 2026-08-23 « installer toutes les marques » : The Shirt Company
     (Awin ID 115010) est rejointe depuis le 28/05, listée « active » dans
     AFFILIATE_BRANDS, citée comme partenaire par le pied de page et la page
     /affiliation — mais son slug manquait ICI, et cette liste rejette tout
     produit d'un marchand absent avant même le tri. Ses 757 produits ne
     pouvaient donc jamais s'afficher. 100 % femme, GBP converti à
     l'ingestion, livraison monde : rien d'autre à adapter. */
  "the-shirt-company",
]);

/* ── Marchands déclarés dans AWIN_DATAFEED_URLS ─────────────────────────────
   Le même oubli se serait reproduit à CHAQUE nouveau flux : la promesse
   « installer une marque = ajouter son flux à la variable d'environnement,
   sans déploiement » était fausse tant que cette liste ne se mettait à jour
   qu'à la main. Un slug déclaré dans AWIN_DATAFEED_URLS est donc désormais
   affilié d'office : un flux n'y entre que si le programme Awin est rejoint,
   c'est précisément le critère de la liste.

   La liste codée reste nécessaire : plusieurs marchands ont un slug
   CANONIQUE différent de celui du flux (muji → muji-france, K&Ö →
   kastner-ohler)— pour eux, c'est elle qui fait foi. Lue paresseusement et
   mise en cache : ce prédicat est appelé une fois par produit du catalogue. */
let slugsEnv: Set<string> | null = null;
function slugsDeclaresEnv(): Set<string> {
  if (slugsEnv) return slugsEnv;
  slugsEnv = new Set<string>();
  try {
    const feeds: Array<{ slug?: string }> = JSON.parse(process.env.AWIN_DATAFEED_URLS || "[]");
    for (const f of feeds) {
      if (f?.slug) slugsEnv.add(String(f.slug).toLowerCase().trim());
    }
  } catch { /* env absente ou illisible : la liste codée suffit */ }
  return slugsEnv;
}

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
  return WHITELIST_SOURCES.has(source) || slugsDeclaresEnv().has(source);
}
