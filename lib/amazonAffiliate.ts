/**
 * WADA — Amazon Associates (Amazon FR · tag wadastyle-21)
 * ─────────────────────────────────────────────────────────────────────────
 * Module distinct du wrapper Awin (lib/affiliate.ts) car le tracking Amazon
 * passe par un simple paramètre `tag` en query-string, pas par un domaine
 * tiers comme awin1.com. Pas besoin d'env var — le tag est public.
 *
 * Sources :
 *   - Brand Stores : pages marque officielles sur Amazon (Adidas, Lacoste…)
 *   - Luxury Store : Amazon Luxury (multi-marques premium)
 *   - Discovery Feeds : recherches curées par catégorie (servent à /decouverte)
 *
 * Toutes les URLs incluent déjà le tag `wadastyle-21` à la racine — donc on
 * peut les utiliser telles quelles. Pour les recherches générées dynamiquement
 * (smartQuery), on passe par `amazonSearch()` qui rajoute le tag.
 * ─────────────────────────────────────────────────────────────────────── */

/** Tag affilié Amazon Associates — appliqué à toutes les URLs sortantes. */
export const AMAZON_TAG = "wadastyle-21";

/**
 * Brand Stores Amazon FR — URLs officielles fournies par Amazon Associates.
 * Chaque entrée pointe vers la page marque dédiée, où l'utilisateur peut
 * explorer toute la collection de la marque sur Amazon.
 *
 * Note : ces URLs ne supportent pas de paramètre `?k=query` pour filtrer.
 * Pour rechercher un item spécifique chez une marque, utiliser
 * `amazonBrandSearch(brand, query)` qui passe par /s?rh=p_89:Brand.
 */
export const amazonBrandStores: Record<string, string> = {
  "Adidas":         "https://www.amazon.fr/stores/adidas/page/BF82DD17-8FEC-409B-92AB-3233DE4ECF08?_encoding=UTF8&pf_rd_p=7487506d-e399-4c5f-b8d0-c9b3173be40e&pf_rd_r=742EENTN7HASTG2701FR&linkCode=ll2&tag=wadastyle-21",
  "Calvin Klein":   "https://www.amazon.fr/stores/CalvinKlein/page/DC3AB819-017A-4F81-ABFC-54839481DE90?lp_asin=B0CQLSD8L6&linkCode=ll2&tag=wadastyle-21",
  "Scotch & Soda":  "https://www.amazon.fr/stores/ScotchSoda/page/B1622BB6-F4FD-4D57-B430-56A29C4B9B32?linkCode=ll2&tag=wadastyle-21",
  "Salomon":        "https://www.amazon.fr/stores/Salomon/page/A7BCD5D8-BAA8-472C-8822-FC34B112DD24?linkCode=ll2&tag=wadastyle-21",
  "Napapijri":      "https://www.amazon.fr/stores/Napapijri/page/802AC98D-C2E1-46B8-845C-CB20B7373DF7?linkCode=ll2&tag=wadastyle-21",
  "GEOX":           "https://www.amazon.fr/stores/GEOX/page/670F7AC2-C603-49AF-BC74-B01C2E9C2B20?linkCode=ll2&tag=wadastyle-21",
  "Tommy Hilfiger": "https://www.amazon.fr/stores/TommyHilfiger/page/9EB0B30A-89D8-4F43-8D18-C2AC5CC9A369?linkCode=ll2&tag=wadastyle-21",
  "Lacoste":        "https://www.amazon.fr/stores/Lacoste/page/F4727FBA-A97A-4C8F-80F1-6643449A080D?linkCode=ll2&tag=wadastyle-21",
  "Michael Kors":   "https://www.amazon.fr/stores/MichaelKors/page/A1D26498-CF3C-4353-9C71-B7386B35FB6C?linkCode=ll2&tag=wadastyle-21",
  "Diesel":         "https://www.amazon.fr/s?srs=83309400031&rh=p_89%3ADiesel&linkCode=ll2&tag=wadastyle-21",
  "HUGO":           "https://www.amazon.fr/stores/HUGO/page/E28C8153-E1D0-4C38-8249-D53F7E66E15E?linkCode=ll2&tag=wadastyle-21",
  "AIGLE":          "https://www.amazon.fr/stores/AIGLE/page/CF49FEE3-F4A2-47FE-89E1-56AEFD0FDA01?linkCode=ll2&tag=wadastyle-21",
  "DREAM PAIRS":    "https://www.amazon.fr/stores/DREAMPAIRS/page/481093DC-A562-4322-A069-AF0331E74CAE?linkCode=ll2&tag=wadastyle-21",
};

/** Amazon Luxury Store — multi-marques premium. */
export const AMAZON_LUXURY_STORE_URL =
  "https://www.amazon.fr/stores/luxury/page/6E0AE8CF-86B5-4B63-85AD-3C663960F22F?linkCode=ll2&tag=wadastyle-21";

/**
 * Produits individuels curés (featured) — pour mise en avant éditoriale.
 * Le tag est déjà inclus dans l'URL.
 */
export const amazonFeaturedProducts: { brand: string; name: string; url: string; price?: string; tier: string }[] = [
  {
    brand: "Larroudé",
    name: "Sandale compensée Miso Brut",
    url:  "https://www.amazon.fr/Larroud%C3%A9-Sandale-Compens%C3%A9e-Miso-Brut/dp/B0CGXLLXNY?th=1&psc=1&linkCode=ll2&tag=wadastyle-21",
    tier: "Luxe",
  },
];

/**
 * Discovery Feeds — recherches Amazon curées par catégorie.
 * Servent de "découverte" sur les pages /decouverte et /palettes.
 * Le tag wadastyle-21 est déjà inclus.
 */
export const amazonDiscoveryFeeds: { label: string; url: string }[] = [
  { label: "Feed 1 — Mode tendance", url: "https://www.amazon.fr/s?bbn=88706280031&rh=n%3A88706280031%2Cp_123%3A3878&linkCode=ll2&tag=wadastyle-21" },
  { label: "Feed 2 — Sélection éditoriale", url: "https://www.amazon.fr/s?bbn=88706280031&rh=n%3A88706280031%2Cp_123%3A230590&linkCode=ll2&tag=wadastyle-21" },
  { label: "Feed 3 — Capsule luxe", url: "https://www.amazon.fr/s?bbn=88706280031&rh=n%3A88706280031%2Cp_85%3A20934937031&linkCode=ll2&tag=wadastyle-21" },
];

/* ──────────────────────────────────────────────────────────────────────
   Helpers — génération d'URLs Amazon avec le tag affilié
   ────────────────────────────────────────────────────────────────────── */

/**
 * Construit une URL de recherche Amazon FR avec tag affilié.
 *   amazonSearch("pull bordeaux")
 *   → https://www.amazon.fr/s?k=pull+bordeaux&tag=wadastyle-21
 */
export function amazonSearch(query: string): string {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
}

/**
 * Recherche Amazon FR biaisée vers le segment luxe — injecte "luxe" comme
 * keyword dans la query plutôt que d'utiliser le filtre `i=luxury-stores`.
 *
 * Le filtre `i=luxury-stores` cause des redirects vers la home quand la
 * combinaison query + département ne match aucun produit (cas fréquent
 * avec les queries éditoriales WADA très précises). En injectant "luxe"
 * comme keyword, on garantit des résultats — Amazon ranke les items
 * premium en haut grâce à son algo.
 *
 *   amazonLuxurySearch("bottes chelsea gris perle homme")
 *   → /s?k=bottes+homme+luxe&tag=wadastyle-21
 *   → Top results : bottes homme premium, multi-marques
 *
 * La query est aussi simplifiée (cf. simplifyForBrand) pour la même
 * raison que pour les marques individuelles.
 */
export function amazonLuxurySearch(query: string): string {
  const simplified = simplifyForBrand(query);
  const withLuxe = `${simplified} luxe`.trim();
  return `https://www.amazon.fr/s?k=${encodeURIComponent(withLuxe)}&tag=${AMAZON_TAG}`;
}

/**
 * URL Amazon brand store pour une marque connue, ou null si absente.
 *   amazonBrandStore("Adidas")  →  "https://www.amazon.fr/stores/adidas/..."
 *   amazonBrandStore("Hermès")  →  null
 */
export function amazonBrandStore(brand: string): string | null {
  return amazonBrandStores[brand] || null;
}

/**
 * Simplifie une query WADA-éditoriale ("pantalon ample en lin encre femme")
 * en une query Amazon-friendly ("pantalon femme") qui a de bonnes chances
 * d'avoir des résultats dans un catalogue de marque limité.
 *
 * Les catalogues Amazon de marques individuelles (Lacoste, Tommy, etc.)
 * contiennent ~100-2000 SKU — il est très improbable qu'ils aient la
 * combinaison exacte de couleur/matière demandée par la palette WADA.
 * Si on filtre trop, Amazon retourne 0 résultat et redirige sur la home,
 * laissant le client perdu.
 *
 * Stratégie : garder uniquement le mot principal (type de pièce) + un
 * indicateur de genre s'il est présent.
 *
 *   "pantalon ample en lin encre femme"    → "pantalon femme"
 *   "chemise oxford blanche homme"          → "chemise homme"
 *   "bottes chelsea gris perle"             → "bottes"
 *   "pull torsadé en cachemire"             → "pull"
 */
function simplifyForBrand(query: string): string {
  const words = query.toLowerCase().trim().split(/\s+/);
  if (words.length === 0) return query;
  const piece = words[0];
  const gender = words.find(
    (w) => w === "femme" || w === "homme" || w === "fille" || w === "garçon" || w === "enfant"
  );
  return gender ? `${piece} ${gender}` : piece;
}

/**
 * Recherche Amazon ciblée sur une marque — la marque est intégrée à la
 * query elle-même plutôt qu'utilisée comme filtre `p_89`.
 *
 * Pourquoi pas le filtre `rh=p_89%3ABrand` ? En théorie c'est le bon
 * filtre Amazon "Brand" mais il nécessite l'ID interne de la marque
 * dans la base Amazon — pas le nom lisible. Avec juste le nom, le
 * filtre tombe souvent sur 0 match, ce qui déclenche un redirect vers
 * la home Amazon. Le client se retrouve perdu sur amazon.fr accueil.
 *
 * La solution fiable : injecter le nom de la marque comme keyword
 * dans la recherche. Amazon ranke alors les items de cette marque en
 * haut grâce à son algo de pertinence, et la requête a toujours des
 * résultats (jamais de redirect home).
 *
 *   amazonBrandSearch("Lacoste", "pull torsadé en cachemire femme")
 *   → /s?k=pull+femme+lacoste&tag=wadastyle-21
 *   → Top results : pulls Lacoste femme
 *
 * La query est aussi simplifiée (cf. simplifyForBrand) pour retirer
 * les détails couleur/matière qui réduisent encore les résultats.
 */
export function amazonBrandSearch(brand: string, query: string): string {
  const simplified = simplifyForBrand(query);
  const withBrand = `${simplified} ${brand}`.trim();
  return `https://www.amazon.fr/s?k=${encodeURIComponent(withBrand)}&tag=${AMAZON_TAG}`;
}

/**
 * Garantit qu'une URL Amazon est trackée — utile si on hérite d'une URL
 * Amazon sans tag depuis une autre source.
 */
export function ensureAmazonTag(url: string): string {
  if (!/amazon\.(fr|com|de|it|es|co\.uk)/.test(url)) return url;
  if (url.includes(`tag=${AMAZON_TAG}`)) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}tag=${AMAZON_TAG}`;
}

/** Liste plate des marques avec un brand store Amazon — utile pour debug. */
export const amazonBrandList = Object.keys(amazonBrandStores);
