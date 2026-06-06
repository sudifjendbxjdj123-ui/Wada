/**
 * Image Quality Scoring — préférer les PACKSHOTS (produit seul, fond blanc,
 * vue de face) aux photos MANNEQUIN et aux photos de DOS.
 *
 * Contexte (brief user 2026-06-07 « pas de mannequin, pas de photos de dos ») :
 * Le catalogue n'a qu'UNE image par produit (cf. lib/schema.ts — pas de
 * tableau de vues). lib/awinFeed.ts fait déjà de son mieux à l'ingestion
 * (extraction CDN flat, Suitable -1.jpg), mais il reste des cas où la seule
 * image accessible d'un produit TBF est un shoot mannequin — parfois de dos.
 *
 * Plutôt que de masquer ces produits (on perdrait des slots entiers), on
 * SCORE l'image au moment de la sélection : entre deux candidats de couleur
 * comparable, on remonte celui dont la photo est un packshot propre. Le score
 * est exprimé en « ΔE-équivalent » pour s'additionner directement à la
 * distance couleur dans le tri de /api/products (ΔE typique 0-60).
 *
 * Échelle de pénalité (additionnée au ΔE couleur) :
 *   0   — packshot propre (idéal)
 *   +12 — probablement un mannequin (shoot éditorial)
 *   +45 — vue de dos détectée (à éviter fortement)
 *
 * Toutes les heuristiques sont CONSERVATRICES : on ne pénalise que sur des
 * signaux nets (tokens d'URL/nom, marchand connu). En cas de doute → 0, pour
 * ne jamais dégrader un bon match couleur sur une fausse détection.
 */

export const BACK_VIEW_PENALTY = 45;
export const MODEL_SHOT_PENALTY = 12;

/** Produit minimal nécessaire au scoring (sous-ensemble de ProduitAwin). */
export interface ImageScorable {
  nom?: string;
  image?: string;
  largeImage?: string;
  imageLocal?: string;
  marchandSlug?: string;
}

/* ── Détection VUE DE DOS ──────────────────────────────────────────────
   Conventions e-commerce courantes (Shopify, BigCommerce, feeds Awin) :
   un suffixe de vue dans le nom de fichier ou le nom produit. On exige des
   limites de mot / séparateurs pour éviter les faux positifs (« blackberry »
   ne doit pas matcher « back », « rearrange » ne doit pas matcher « rear »). */
const BACK_VIEW_RE =
  /(?:[-_/]|\b)(back|rear|behind|dos|derriere|arriere|reverse|backside)(?:[-_./]|\b|\d)/i;

/* Suffixes de fichier typiques d'une vue de dos : « ..._b.jpg », « ...-b2.jpg ».
   Très spécifique (lettre b isolée avant l'extension) pour limiter le bruit. */
const BACK_FILE_SUFFIX_RE = /[-_]b\d?\.(jpe?g|png|webp)(?:$|\?)/i;

/* ── Détection MANNEQUIN / SHOOT ÉDITORIAL ─────────────────────────────
   Tokens explicites de photo portée. Les feeds mode les utilisent parfois
   dans le slug d'image (« ..._model_2.jpg », « ...-worn.jpg », « lookbook »). */
const MODEL_SHOT_RE =
  /(?:[-_/]|\b)(model|worn|on-?body|onbody|lookbook|outfit|lifestyle|editorial|porte|portee|street|campaign)(?:[-_./]|\b|\d)/i;

/**
 * Marchands dont l'image accessible est, par construction, un shoot mannequin
 * (cf. lib/awinFeed.ts §711-742 : pour TBF la seule URL CDN exploitable est
 * souvent un mannequin en pied). On applique une petite pénalité de base pour
 * qu'à couleur égale un packshot MUJI/Suitable passe devant un mannequin TBF —
 * SANS exclure TBF (l'user le veut visible quand il n'y a pas mieux).
 */
const MODEL_HEAVY_MERCHANTS = new Set(["the-business-fashion"]);

/**
 * Calcule la pénalité d'image d'un produit (ΔE-équivalent, ≥ 0).
 * Plus c'est haut, moins l'image est désirable.
 */
export function imageQualityPenalty(p: ImageScorable): number {
  const haystack = `${p.imageLocal || ""} ${p.largeImage || ""} ${p.image || ""} ${p.nom || ""}`.toLowerCase();

  // 1. Vue de dos — signal le plus fort, à éviter en priorité.
  if (BACK_VIEW_RE.test(haystack) || BACK_FILE_SUFFIX_RE.test(haystack)) {
    return BACK_VIEW_PENALTY;
  }

  // 2. Mannequin détecté explicitement dans l'URL/nom.
  if (MODEL_SHOT_RE.test(haystack)) {
    return MODEL_SHOT_PENALTY;
  }

  // 3. Marchand à dominante shoot mannequin (pénalité de base douce).
  if (p.marchandSlug && MODEL_HEAVY_MERCHANTS.has(p.marchandSlug)) {
    return MODEL_SHOT_PENALTY;
  }

  // Packshot présumé propre.
  return 0;
}

/**
 * Helper booléen : l'image est-elle probablement une vue de dos ?
 * (utile pour un filtre dur côté UI si besoin, ex. exclure du collage flat-lay).
 */
export function isLikelyBackView(p: ImageScorable): boolean {
  const haystack = `${p.imageLocal || ""} ${p.largeImage || ""} ${p.image || ""} ${p.nom || ""}`.toLowerCase();
  return BACK_VIEW_RE.test(haystack) || BACK_FILE_SUFFIX_RE.test(haystack);
}
