/**
 * schema.ts — types canoniques WADA (brief 2026-05-22 « schéma de données »).
 *
 * Source de vérité documentaire pour les 4 entités principales :
 *   - Palette  (×348, contenu cœur)
 *   - Product  (importé des flux Awin)
 *   - Profil   (utilisateur)
 *   - Tenue    (sortie du moteur de composition)
 *
 * Les modules existants (lib/data.ts, lib/productMatching.ts, lib/registreEngine.ts)
 * utilisent des noms anglais hérités (DictionaryEntry, Product…). Ce fichier
 * définit l'équivalent français selon le brief — utilisé pour les nouvelles
 * features (UI bilingue, contrats API publics, futur backend) et comme
 * référence pour aligner les types existants à terme.
 *
 * Aucun comportement runtime ; pur typage et constantes.
 */

/* ──────────────────────────────────────────────────────────────────────
   1. PALETTE — accord Sanzo Wada (×348)
   ──────────────────────────────────────────────────────────────────────
   Un accord chromatique avec ses 3 (parfois 4) couleurs nommées, son
   numéro Wada, sa culture, sa famille colorée et ses tags d'usage. */

export type PaletteFamily =
  | "neutres" | "chauds" | "froids" | "terreux" | "vifs" | "pastels" | "sombres";

export interface PaletteColor {
  /** Nom français fidèle au hex (ex. « Olive », « Sable »). */
  nom: string;
  /** Référence Pantone TCX si connue (optionnel). */
  pantone?: string;
  /** Code hexadécimal. */
  hex: string;
  /** Coordonnées Lab pré-calculées pour le matching couleur (L, a, b). */
  lab?: [number, number, number];
}

export interface Palette {
  /** Numéro Sanzo Wada padé sur 3 chiffres (« 094 »). */
  no: string;
  /** Nom de l'accord en français (« Béton & Lin »). */
  nom: string;
  /** Culture d'origine (« Scandinave », « Japonaise », « Marocaine »…). */
  culture?: string;
  /** Famille colorée pour les filtres. */
  famille: PaletteFamily;
  /** Description courte éditoriale. */
  description?: string;
  /** Tags d'usage (« Minimal », « Urbain », « Été »…). */
  tags?: string[];
  /** % d'harmonie chromatique calculé (0-100). */
  harmonie?: number;
  /** 3-4 couleurs constitutives. */
  couleurs: PaletteColor[];
  /** URL d'un visuel éditorial (optionnel). */
  imageMotif?: string;
}

/* ──────────────────────────────────────────────────────────────────────
   2. PRODUCT — entrée importée d'un flux marchand (Awin Datafeed)
   ──────────────────────────────────────────────────────────────────────
   Schéma aligné sur les champs standard Awin. Quand l'ingestion sera
   branchée, chaque ligne CSV deviendra un objet `ProduitAwin`. */

export type ProductCategorie = "haut" | "bas" | "veste" | "chaussures" | "accent";
/**
 * Brief « Page Tenue maître » P0-1 (24/05) : ajout du sentinel `inconnu`.
 * Avant, parseGender retombait sur "unisexe" quand aucun signal n'était
 * trouvé dans la CSV → tous les produits sans tag explicite étaient
 * acceptés pour Homme ET pour Femme. Désormais, sans signal explicite,
 * un produit est marqué `inconnu` et exclu quand l'utilisateur a choisi
 * un genre. Seuls les vrais `unisexe` (tag "Unisex" dans le CSV) sont
 * acceptés pour les deux.
 */
export type ProductGenre = "homme" | "femme" | "unisexe" | "inconnu";
export type ProductTier = "accessible" | "milieu" | "premium";

export interface ProduitAwin {
  /** Identifiant stable (`{slug-marchand}:{id-produit-marchand}`). */
  id: string;
  /** Label marchand (« H&M », « Sézane »). */
  marchand: string;
  /** Slug marchand (`merchantSearch.MerchantKey`). */
  marchandSlug?: string;
  /** ID annonceur Awin (`awinmid` dans cread.php). */
  awinMid?: string;
  /** Nom du produit (« Pull col rond coton »). */
  nom: string;
  /** Description longue (utilisée pour matching synonymes). */
  description?: string;
  /** Catégorie de slot. */
  categorie: ProductCategorie;
  /** Genre destiné. */
  genre: ProductGenre;
  /** Nom de couleur fourni par le marchand (« écru », « ivory »). */
  couleurNom?: string;
  /** Code hex de la couleur produit. */
  hex: string;
  /** Coordonnées Lab pré-calculées (depuis hex) — accélère le matching. */
  lab?: [number, number, number];
  /** Prix en numérique. */
  prix: number;
  /** Devise ISO. */
  devise: "EUR" | "CHF" | "USD" | "GBP";
  /** Tailles disponibles (« S »/« M »/« L »…). */
  tailles?: string[];
  /** En stock — strict ; les ruptures sont filtrées côté UI. */
  enStock: boolean;
  /** URL image produit principale chez le marchand (référence, jamais
   *  affichée en hotlink — utilisée seulement pour décider si on
   *  re-télécharge). Brief Muji 2026-05-27 : Muji/Awin bloquent l'affichage
   *  cross-domain. */
  image: string;
  /** URL d'image PROXY hébergée sur NOTRE CDN (Vercel Blob). C'est cette
   *  URL qui doit être affichée sur le site — pas `image`. Posée par le
   *  cron `/api/cron/refresh-awin-feed` après download + upload Blob. */
  imageLocal?: string;
  /** URL miniature 70×70 (Muji feed `aw_thumb_url`). */
  thumb?: string;
  /** Source image plus grande quand disponible (Awin `large_image`). Sert
   *  à éviter le flou quand on agrandit (cards en vedette 4/5 pleine
   *  largeur). Fallback : `image` (200×200). */
  largeImage?: string;
  /** URL produit deep-link (déjà tracké Awin, ne pas re-wrapper). */
  urlProduit: string;
  /** Tier de prix de la marque pour le filtre budget. */
  marqueTier?: ProductTier;
  /** Score de popularité 0-1 (optionnel — alimente le ranking). */
  popularite?: number;
  /** Marque pour affichage carte (« MUJI », « COS », « Sézane »). Quand
   *  `brand_name` du flux est vide, on injecte le nom du marchand. */
  marque?: string;
  /** Référence d'accord Sanzo Wada le plus proche par ΔE2000 (« 094 »).
   *  Calculée à l'ingestion via lib/colorDistance.ts. Permet « les pièces
   *  qui vont avec cet accord » + matching dans l'assistant IA. */
  paletteRef?: string;
  /** Distance ΔE2000 à la couleur la plus proche de la palette de
   *  référence. < 15 = match strict, 15-25 = approchant, > 25 = éloigné. */
  paletteDistance?: number;
  /** Brief 2026-05-30 « logique de composition tenue cohérente » §1 :
   *  registre stylistique de la MARQUE (différent du registre du SLOT).
   *  Calculé à l'ingestion via lib/brandRegistre.ts depuis brand_name.
   *  5 valeurs : classique | streetwear | minimaliste | decontracte | outdoor.
   *  Le composer filtre par registre pour ne pas mélanger Brunello
   *  Cucinelli (classique) avec Amiri (streetwear) dans la même tenue.
   *  Brief 2026-05-31 v8 (user bug Studio danois) : ajout `outdoor`
   *  pour exclure North Face / Barbour / Moon Boot / Patagonia des
   *  tenues mode. Outdoor n'est jamais dans l'adjacence. */
  brandRegistre?: "classique" | "streetwear" | "minimaliste" | "decontracte" | "outdoor";
}

/* ──────────────────────────────────────────────────────────────────────
   3. PROFIL — préférences utilisateur
   ──────────────────────────────────────────────────────────────────────
   Aligné sur l'UI PersonalizationPanel (registre/coupe/occasion/budget).
   Vocabulaire en français pour cohérence avec le LLM V2. */

export type Registre = "minimal" | "classique" | "old money" | "décontracté" | "streetwear";
export type Coupe = "près du corps" | "standard" | "ample";
export type Budget = "<=200" | "200-500" | ">=500";
export type Occasion = "bureau" | "quotidien" | "sorties" | "voyage";

export interface Profil {
  genre?: ProductGenre;
  registre?: Registre;
  occasion?: Occasion;
  coupe?: Coupe;
  budget?: Budget;
}

/* ──────────────────────────────────────────────────────────────────────
   4. TENUE — sortie composée du moteur (brief §4)
   ────────────────────────────────────────────────────────────────────── */

export type SlotName = "haut" | "bas" | "veste" | "chaussures" | "accent";

export interface PieceAncre {
  slot: SlotName;
  /** Label exact préservé (« Vos Nike blanches »). */
  label: string;
  /** Hex couleur de la pièce possédée. */
  hex: string;
}

export interface TenueSlot {
  slot: SlotName;
  /** Type de pièce français (ex. « Hoodie oversized », « Pantalon à pinces »). */
  type: string;
  /** Nom de couleur fidèle au hex. */
  couleurNom: string;
  /** Hex de la couleur. */
  hex: string;
  /** True si c'est la pièce ancre (possédée par l'utilisateur). */
  ancre: boolean;
  /** Top 3 produits matchés via lib/productMatching (vide tant que le
      flux Awin n'est pas branché). */
  produits?: Array<{
    id: string;
    deepLink: string;
    /** Distance couleur ΔE2000 par rapport au hex cible. */
    deltaE?: number;
  }>;
}

export interface TenueComposee {
  /** Référence palette Wada (« 094 »). */
  paletteRef: string;
  /** Profil utilisé pour la composition. */
  profil?: Profil;
  /** Pièce ancre si l'utilisateur en a cité une. */
  pieceAncre?: PieceAncre;
  /** Texte styliste éditorial (réponse LLM). */
  texte: string;
  /** Question de précision si une info utile manque (sinon ""). */
  preciser?: string;
  /** 5 slots de la tenue. */
  slots: TenueSlot[];
}

/* ──────────────────────────────────────────────────────────────────────
   FAVORI — alias documentaire (modèle déjà géré en localStorage today,
   schéma à dupliquer côté serveur quand le backend sera là).
   ────────────────────────────────────────────────────────────────────── */

export interface Favori {
  /** ID userprovider (Firebase / Supabase). */
  userId: string;
  /** Numéro de palette favorisé. */
  paletteNo: string;
  /** Timestamp ISO. */
  ajoutLe: string;
}

/* ──────────────────────────────────────────────────────────────────────
   CONSTANTES D'INDEXATION RECOMMANDÉES (brief §6, pour mise en base)
   ──────────────────────────────────────────────────────────────────────
   Quand l'ingestion produit sera branchée, créer ces index dans la DB
   pour garantir des matchings < 50ms même sur 100k+ produits. */

export const RECOMMENDED_INDEXES = {
  products: ["categorie", "genre", "enStock", "marqueTier", "lab"],
  palettes: ["famille", "culture", "tags"],
  favorites: ["userId", "paletteNo"],
} as const;
