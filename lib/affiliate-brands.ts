/**
 * affiliate-brands — WHITELIST stricte des marques réellement affiliées.
 *
 * Bug critique 2026-05-31 (capture « Béton & Lin ») : le composeur proposait
 * des tenues COS / Veja / Amazon avec le libellé « Lien partenaire — prix
 * identique chez le marchand » alors qu'AUCUNE de ces marques n'est partenaire
 * affilié de WADA. Conséquences : le client achète, WADA ne touche rien, et le
 * libellé est trompeur (RGPD / transparence des plateformes de recommandation).
 *
 * Règle absolue (brief règle 1) : si une marque n'appartient pas à cette
 * whitelist, elle n'est JAMAIS proposée comme lien d'achat. Point.
 *
 * Source de vérité unique — référencée par :
 *   - lib/data.ts            → shopOptionsAffiliated() filtre par cette liste
 *   - lib/merchantsForPiece.ts → ne pousse que des marchands whitelistés
 *   - app/affiliation/page.tsx → affichage des partenaires réels
 *
 * Pour ajouter une marque NOUVELLEMENT acceptée sur Awin :
 *   1. Vérifier que le Merchant ID est actif (Awin → Annuaire des annonceurs)
 *   2. L'ajouter dans `awin` ci-dessous (le nom doit matcher le `merchant_name`
 *      du flux et/ou le label affiché)
 *   3. Renseigner son Merchant ID dans AWIN_MERCHANT_IDS sur Vercel (cf.
 *      lib/affiliate.ts) pour que le lien soit réellement tracké
 */

export const AFFILIATE_BRANDS = {
  // ─── Awin — Publisher 2879911 ───────────────────────────────────────────
  awin: [
    "MUJI",                 // ID 84713 — actif
    "The Shirt Company",    // ID 115010 — actif
    "The Business Fashion", // ID 78164 (UE) — actif (revend multi-marques, cf. TBF_RESELLER_BRANDS)
    // Marques en attente d'acceptation — décommenter une fois le MID actif :
    // "Atelier du diamant",
    // "ANITA & ZAHA",
  ],
  // ─── Amazon Associates (tag wadastyle-21) ───────────────────────────────
  // VIDE tant que le compte n'est pas validé + conformité RGPD/affichage faite.
  // Voir AMAZON_ASSOCIATES_ACTIVE ci-dessous.
  amazon: [] as string[],
  // ─── Contrats directs (aucun pour l'instant) ────────────────────────────
  direct: [] as string[],
} as const;

/**
 * Flag global Amazon : tant que le programme Amazon Associates (tag
 * wadastyle-21) n'est pas configuré + conforme, AUCUN lien Amazon n'est
 * affilié → on ne propose pas Amazon comme marchand. Passer à `true`
 * une fois le compte validé ET les marques ajoutées dans AFFILIATE_BRANDS.amazon.
 */
export const AMAZON_ASSOCIATES_ACTIVE = false;

/**
 * Marques multi-marques revendues PAR The Business Fashion (TBF).
 *
 * Règle 2 du brief : quand un produit Brunello/Tom Ford/Amiri vient du flux
 * TBF, on AFFICHE la vraie marque (`brand_name`) mais le lien d'achat passe
 * par TBF (`aw_deep_link`). La marque affichée ≠ la source affiliée — ces
 * produits sont donc légitimes même si « Brunello Cucinelli » n'est pas dans
 * `awin` directement. Les produits réels arrivent via le flux Awin
 * (lib/awinFeed.ts → /api/products) qui ne contient QUE des marchands
 * affiliés, donc ils sont déjà whitelistés par construction. Cette liste
 * sert aux vérifications explicites (ex. un lien construit à la main).
 */
export const TBF_RESELLER_BRANDS = [
  "Brunello Cucinelli", "Tom Ford", "Amiri", "Loro Piana", "Brioni",
  "Kiton", "Zegna", "Ermenegildo Zegna", "Stefano Ricci", "Cucinelli",
  "A Bathing Ape", "Bape", "Off-White", "Palm Angels", "Fear of God",
];

/* Normalise un label/nom de marque pour comparaison robuste :
   minuscules, sans accents, sans ponctuation décorative, espaces compactés.
   « MUJI France » → « muji france » ; « The Business Fashion » → idem. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .replace(/[·•|]/g, " ")          // séparateurs décoratifs → espace
    .replace(/[^a-z0-9& ]/g, " ")     // ponctuation → espace
    .replace(/\s+/g, " ")
    .trim();
}

/* Liste des noms whitelistés normalisés (awin + direct + sous-marques TBF +
   alias). Construite une fois au chargement du module. */
const WHITELIST_NORMS: string[] = [
  ...AFFILIATE_BRANDS.awin,
  ...AFFILIATE_BRANDS.direct,
  ...(AMAZON_ASSOCIATES_ACTIVE ? AFFILIATE_BRANDS.amazon : []),
  ...TBF_RESELLER_BRANDS,
  // alias courants
  "TBF", // The Business Fashion
].map(normalize);

/* Match token-aware : le label correspond à une marque whitelistée s'il EST
   ce nom, ou commence par ce nom suivi d'un espace (suffixe région : « MUJI
   France », « The Business Fashion UK »). On exige la frontière de mot (« + »
   espace) pour éviter qu'un nom partageant un préfixe ne passe par erreur —
   ex. « The North Face » ne matche PAS « The Business Fashion ». */
function matchesWhitelist(norm: string): boolean {
  for (const b of WHITELIST_NORMS) {
    if (norm === b || norm.startsWith(b + " ")) return true;
  }
  return false;
}

/** True si l'URL/le label passe par Amazon (générique ou « Amazon · X »). */
export function isAmazonLabel(label: string): boolean {
  return /^amazon\b/i.test(label.trim());
}

/**
 * Cœur de la whitelist : true si CETTE marque est réellement affiliée.
 *
 * @param brand  Label marchand (« COS », « Muji », « Amazon · HUGO »,
 *               « The Business Fashion », « MUJI France »…)
 *
 * Logique :
 *   1. Tout label Amazon → affilié SEULEMENT si AMAZON_ASSOCIATES_ACTIVE
 *      ET que la marque (après « Amazon · ») est dans AFFILIATE_BRANDS.amazon.
 *      Aujourd'hui Amazon est inactif → toujours false.
 *   2. Sinon → match exact normalisé OU 1er mot whitelisté (« MUJI France »).
 */
export function isAffiliatedBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const label = brand.trim();
  if (!label) return false;

  // 1. Cas Amazon (générique ou « Amazon · MARQUE »)
  if (isAmazonLabel(label)) {
    if (!AMAZON_ASSOCIATES_ACTIVE) return false;
    const sub = label.replace(/^amazon\s*[·•:|.\-]?\s*/i, "").trim();
    if (!sub || /^(fr|luxury)$/i.test(sub)) return false; // « Amazon FR », « Amazon Luxury »
    return new Set(AFFILIATE_BRANDS.amazon.map(normalize)).has(normalize(sub));
  }

  // 2. Marques directes / Awin (match exact ou préfixe région token-aware)
  return matchesWhitelist(normalize(label));
}

/**
 * Filtre une liste de marchands pour ne garder QUE les marques affiliées.
 * Helper générique utilisé par shopOptionsAffiliated() et merchantsForPiece().
 */
export function filterAffiliatedShopLinks<T extends { label: string }>(
  links: T[]
): T[] {
  return links.filter((l) => isAffiliatedBrand(l.label));
}

/** Liste plate des marques affiliées actives — pour l'UI (footer, /affiliation). */
export function activeAffiliateBrands(): string[] {
  return [
    ...AFFILIATE_BRANDS.awin,
    ...AFFILIATE_BRANDS.direct,
    ...(AMAZON_ASSOCIATES_ACTIVE ? AFFILIATE_BRANDS.amazon : []),
  ];
}
