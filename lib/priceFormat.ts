/**
 * priceFormat — formatage prix produit pour l'affichage (brief 2026-06-09).
 *
 * Certains marchands publient dans une autre devise et WADA convertit en €
 * à TAUX FIXE à l'ingestion (cf. lib/awinFeed.ts) :
 *   - The Business Fashion : GBP → EUR ×1.17
 *   - Kastner & Öhler       : CHF → EUR ×1.03
 * Ces prix € sont donc des ESTIMATIONS (le vrai prix payé est chez le
 * marchand, dans sa devise). Pour ne pas afficher un faux prix exact (ex.
 * « 992,56 € »), on les arrondit à l'euro et on les préfixe de « ≈ ».
 *
 * Les marchands nativement en € (MUJI, Suitable FR, New Era) gardent le prix
 * exact.
 *
 * NB : après conversion, `devise` vaut "EUR" pour TOUS → on ne peut pas s'y
 * fier pour détecter une conversion ; on détecte par `marchandSlug`.
 */

/** Marchands dont le prix € est une conversion à taux fixe → prix approximatif. */
const CONVERTED_MERCHANTS = new Set<string>([
  "the-business-fashion", // GBP → EUR
  "kastner-ohler",        // CHF → EUR
]);

export function isConvertedMerchant(marchandSlug?: string | null): boolean {
  return !!marchandSlug && CONVERTED_MERCHANTS.has(marchandSlug);
}

/**
 * Formate un prix produit pour l'UI.
 *   - marchand converti → « ≈ 990 € » (arrondi entier + signe approximatif)
 *   - marchand natif €   → « 992,56 € » (exact)
 *   - prix absent        → « Prix sur le site »
 */
export function formatProductPrice(
  prix: number | null | undefined,
  marchandSlug?: string | null,
  devise?: string | null,
): string {
  if (typeof prix !== "number" || !Number.isFinite(prix)) return "Prix sur le site";
  const cur = !devise || devise === "EUR" ? "€" : devise;
  if (isConvertedMerchant(marchandSlug)) {
    return `≈ ${Math.round(prix).toLocaleString("fr-FR")} ${cur}`;
  }
  return `${prix.toLocaleString("fr-FR")} ${cur}`;
}

/**
 * Prix de catalogue : deux décimales, comme sur les fiches produit des
 * grandes boutiques (« 89,00 € » et non « 89 € »). Le format court de
 * `formatProductPrice` reste celui des récapitulatifs et des totaux, où
 * les centimes ajoutent du bruit.
 */
export function formatPrixCatalogue(
  prix: number | null | undefined,
  devise?: string | null,
): string {
  if (typeof prix !== "number" || !Number.isFinite(prix)) return "Prix sur le site";
  const cur = !devise || devise === "EUR" ? "€" : devise;
  return `${prix.toLocaleString("fr-FR", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })} ${cur}`;
}
