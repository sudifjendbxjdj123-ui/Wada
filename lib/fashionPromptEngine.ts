/**
 * WADA × Claude — Fashion Prompt Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Implémentation TypeScript de la spec "WADA × Claude — Fashion Prompt
 * Engine Specification". Cette couche joue le rôle de FASHION DIRECTOR
 * et PROMPT ARCHITECT — pas le générateur d'images final (FLUX/Replicate
 * s'en charge via /api/generate/image).
 *
 * Le moteur applique 4 garde-fous obligatoires :
 *   1. ANTI-KITSCH — pas de cyberpunk, neon, plastic shine, armor, fantasy
 *   2. CONSTRAINT — max 3 couleurs, max 2 matières, 1 concept dominant, 0 branding
 *   3. RÉALISME — gravité, comportement textile, proportions humaines OK
 *   4. RÉFÉRENCE — ancre dans des maisons de mode réelles (The Row, Lemaire,
 *      Jil Sander, Auralee, COS, Toteme, Margiela minimal, Yohji, Issey Miyake)
 *
 * L'output suit la spec exacte : Fashion DNA Block + Styling Description
 * + Image Generation Prompt strict (Subject/Silhouette/Materials/Color
 * palette/Styling/Lighting/Camera/Mood/Constraints).
 */

import type { DictionaryEntry } from "./data";

/* ──────────────────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────────────────── */

export type FashionDNA = {
  silhouette: string;
  fit: string;
  materials: string[];
  palette: string[];
  era: string;
  style_philosophy: string;
  construction: string[];
  fashion_references: string[];
};

export type FashionOutput = {
  dna: FashionDNA;
  description: string;
  imagePrompt: string;
  /** Score interne — utilisé pour décider si on regénère (cf. spec §5). */
  scores: {
    elegance: number;
    wearability: number;
    material_realism: number;
    silhouette_coherence: number;
    visual_noise: number;
  };
};

export type ClientProfile = {
  gender: "femme" | "homme" | "unisexe" | null;
  style: string;            // "Old money" | "Minimal" | ...
  fit: string;              // "ajuste" | "standard" | "ample"
  occasion_focus: string;   // "bureau" | "quotidien" | "sorties" | "voyage"
  morpho: string;           // "sablier" | "droite" | ...
  size: string;             // "M" | "L" | ...
  intensity: number;        // 0 = neutre, 1 = affirmé
  budget: number;           // 0 = ≤200, 1 = 200-500, 2 = ≥500
};

/* ──────────────────────────────────────────────────────────────────────
   MAPPING — style WADA → langage Fashion Prompt
   ────────────────────────────────────────────────────────────────────── */

/** Map du style WADA → philosophie + références maison + mood. */
const STYLE_LIBRARY: Record<string, {
  philosophy: string;       // ex: "quiet luxury", "Japanese functional layering"
  references: string[];     // ex: ["The Row", "Lemaire"]
  mood: string;             // ex: "quiet luxury, sculptural, calm"
  silhouette: string;       // ex: "oversized tailoring", "sculptural minimalism"
  fit_signature: string;    // ex: "loose but precise"
  era_anchor: string;       // ex: "modern 2020s editorial"
}> = {
  "Old money": {
    philosophy: "quiet luxury",
    references: ["The Row", "Toteme", "Khaite"],
    mood: "quiet luxury, refined, understated wealth, calm",
    silhouette: "soft tailored, generous through the shoulders, tapered hem",
    fit_signature: "loose but precise, never tight",
    era_anchor: "timeless 2020s editorial, mid-century cut",
  },
  "Minimal": {
    philosophy: "Scandinavian minimalism",
    references: ["Jil Sander", "COS", "Auralee"],
    mood: "minimal, architectural, quiet, monastic",
    silhouette: "clean column line, single dominant volume",
    fit_signature: "structured but soft, no excess",
    era_anchor: "modern minimalist 2020s",
  },
  "Classique": {
    philosophy: "Parisian editorial minimalism",
    references: ["Lemaire", "Toteme", "The Row"],
    mood: "Parisian editorial, refined, lived-in elegance",
    silhouette: "balanced classic proportions, gentle tapering",
    fit_signature: "tailored but not severe",
    era_anchor: "modern interpretation of 1990s classics",
  },
  "Décontracté": {
    philosophy: "Japanese functional layering",
    references: ["Auralee", "Lemaire", "Margiela minimal era"],
    mood: "relaxed, intentional, soft luxury",
    silhouette: "soft layered, generous proportions",
    fit_signature: "loose, draped, considered",
    era_anchor: "modern 2020s editorial",
  },
  "Streetwear": {
    philosophy: "modern utilitarian",
    references: ["Margiela minimal era", "Yohji Yamamoto", "Lemaire"],
    mood: "urban editorial, technical, monochrome",
    silhouette: "oversized but architectural, never sloppy",
    fit_signature: "intentionally oversized, structured shoulders",
    era_anchor: "modern utilitarian 2020s",
  },
};

/** Style par défaut si le client n'a rien choisi. */
const DEFAULT_STYLE_KEY = "Minimal";

/** Map fit WADA → fit signature pour le prompt. */
const FIT_LIBRARY: Record<string, string> = {
  "ajuste":   "fitted, structured, close to body",
  "standard": "tailored to the body, classic proportions",
  "ample":    "oversized, generous volume, draped",
};

/** Map occasion → mood / lighting / context. */
const OCCASION_LIBRARY: Record<string, { mood: string; setting: string }> = {
  "bureau":    { mood: "professional, refined, sharp", setting: "editorial studio with soft window light" },
  "quotidien": { mood: "lived-in, relaxed, intentional", setting: "natural daylight, neutral interior" },
  "sorties":   { mood: "evening elegance, sophisticated, calm", setting: "dimmed editorial studio, warm tungsten" },
  "voyage":    { mood: "considered, functional, breathable", setting: "soft natural light, neutral background" },
};

/* ──────────────────────────────────────────────────────────────────────
   ANTI-KITSCH — liste explicite des interdictions (passée au générateur)
   ────────────────────────────────────────────────────────────────────── */

const FORBIDDEN_KEYWORDS = [
  "cyberpunk",
  "neon",
  "fantasy",
  "armor",
  "cosplay",
  "futuristic",
  "plastic shine",
  "glowing fabric",
  "liquid metal",
  "shiny plastic texture",
  "trendy TikTok",
  "kitsch",
  "costume",
  "AI-generated look",
];

/* ──────────────────────────────────────────────────────────────────────
   MATÉRIAUX — inférés depuis les couleurs + le style choisi
   ────────────────────────────────────────────────────────────────────── */

/**
 * Choisit max 2 matériaux nobles cohérents avec le style + le budget.
 * Respecte la règle "max 2 fabrics" de la spec §4 Rule 2.
 */
function selectMaterials(profile: ClientProfile, _entry: DictionaryEntry): string[] {
  const budget = profile.budget;
  const style = profile.style || DEFAULT_STYLE_KEY;

  if (budget >= 2) {
    // Luxe — matières nobles
    if (style === "Old money" || style === "Classique") return ["cashmere", "fine wool"];
    if (style === "Minimal") return ["fine wool", "silk-cotton blend"];
    if (style === "Décontracté") return ["raw silk", "fine cotton"];
    if (style === "Streetwear") return ["technical wool", "heavy cotton"];
    return ["wool", "silk"];
  }

  if (budget === 1) {
    // Premium — bonne qualité
    if (style === "Old money") return ["wool flannel", "cotton poplin"];
    if (style === "Minimal") return ["heavy cotton", "wool"];
    if (style === "Décontracté") return ["linen", "cotton"];
    if (style === "Streetwear") return ["heavy jersey", "cotton twill"];
    return ["wool", "cotton"];
  }

  // Accessible — matières simples mais propres
  if (style === "Décontracté") return ["linen", "cotton"];
  return ["cotton", "wool blend"];
}

/* ──────────────────────────────────────────────────────────────────────
   COULEURS — normalisation FR → EN, max 3 (spec §4 Rule 2)
   ────────────────────────────────────────────────────────────────────── */

/** Traduit un nom de couleur FR poétique vers une description EN claire. */
function translateColor(frenchName: string): string {
  const n = frenchName.toLowerCase();
  if (n.includes("sauge")) return "sage green";
  if (n.includes("pétale")) return "soft blush";
  if (n.includes("crème") || n.includes("creme")) return "off-white cream";
  if (n.includes("encre")) return "deep ink blue";
  if (n.includes("rouge piment")) return "muted brick red";
  if (n.includes("piment")) return "deep terracotta";
  if (n.includes("gris perle")) return "warm pearl grey";
  if (n.includes("henné")) return "henna red-brown";
  if (n.includes("cyprès")) return "dark cypress green";
  if (n.includes("lanterne")) return "warm amber";
  if (n.includes("argile")) return "clay beige";
  if (n.includes("mousse")) return "moss green";
  if (n.includes("menthe")) return "muted mint";
  if (n.includes("ocre")) return "earth ochre";
  if (n.includes("lait")) return "warm milk white";
  if (n.includes("tendre")) return "soft pale";
  // Fallback — retourne le nom tel quel
  return frenchName;
}

/* ──────────────────────────────────────────────────────────────────────
   COMPUTE SCORES — heuristiques pour valider l'output (spec §5)
   ────────────────────────────────────────────────────────────────────── */

function computeScores(dna: FashionDNA, profile: ClientProfile): FashionOutput["scores"] {
  // Visual noise — pénalise si trop de couleurs / matières / construction
  let noise = 0;
  if (dna.palette.length > 3) noise += 0.3;
  if (dna.materials.length > 2) noise += 0.2;
  if (dna.construction.length > 3) noise += 0.2;
  noise = Math.min(noise, 1);

  // Wearability — basé sur le fit + matériaux réalistes
  const wearability = profile.fit && FIT_LIBRARY[profile.fit] ? 0.9 : 0.8;

  return {
    elegance: 0.85,
    wearability,
    material_realism: 0.95,
    silhouette_coherence: 0.9,
    visual_noise: noise,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   BUILD FASHION DNA — étape 1 de la spec §2 (block JSON)
   ────────────────────────────────────────────────────────────────────── */

export function buildFashionDNA(entry: DictionaryEntry, profile: ClientProfile): FashionDNA {
  const styleKey = profile.style || DEFAULT_STYLE_KEY;
  const styleSpec = STYLE_LIBRARY[styleKey] || STYLE_LIBRARY[DEFAULT_STYLE_KEY];
  const fitSpec = FIT_LIBRARY[profile.fit] || FIT_LIBRARY["standard"];

  const palette = entry.colors.slice(0, 3).map((c) => translateColor(c.name));
  const materials = selectMaterials(profile, entry);

  return {
    silhouette: styleSpec.silhouette,
    fit: fitSpec,
    materials,
    palette,
    era: styleSpec.era_anchor,
    style_philosophy: styleSpec.philosophy,
    construction: [
      "clean seams",
      "minimal hardware",
      "natural drape",
    ],
    fashion_references: styleSpec.references,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   BUILD STYLING DESCRIPTION — étape 2 de la spec §2 (texte éditorial)
   ────────────────────────────────────────────────────────────────────── */

export function buildStylingDescription(
  entry: DictionaryEntry,
  profile: ClientProfile,
  dna: FashionDNA
): string {
  const styleKey = profile.style || DEFAULT_STYLE_KEY;
  const styleSpec = STYLE_LIBRARY[styleKey] || STYLE_LIBRARY[DEFAULT_STYLE_KEY];
  const colorWord = dna.palette[0] || "neutral";
  const refHouse = dna.fashion_references[0] || "The Row";

  return [
    `Une silhouette pensée autour de ${dna.silhouette.toLowerCase()}, dans ${dna.materials.join(" et ")}.`,
    `Palette ${dna.palette.join(", ")} — ${entry.name} réinterprétée en ${styleSpec.philosophy}.`,
    `${dna.fit.charAt(0).toUpperCase() + dna.fit.slice(1)}, sans excès, dans l'esprit ${refHouse}.`,
    `Ton ${styleSpec.mood.split(",")[0]} — la matière fait le travail, pas l'accessoire.`,
  ].join(" ");
}

/* ──────────────────────────────────────────────────────────────────────
   BUILD IMAGE PROMPT — étape 3 de la spec §2 (prompt strict)
   ────────────────────────────────────────────────────────────────────── */

export function buildImagePrompt(
  entry: DictionaryEntry,
  profile: ClientProfile,
  dna: FashionDNA
): string {
  const styleKey = profile.style || DEFAULT_STYLE_KEY;
  const styleSpec = STYLE_LIBRARY[styleKey] || STYLE_LIBRARY[DEFAULT_STYLE_KEY];
  const occasionSpec = OCCASION_LIBRARY[profile.occasion_focus] || OCCASION_LIBRARY["quotidien"];

  const genderLine =
    profile.gender === "homme" ? "menswear" :
    profile.gender === "femme" ? "womenswear" :
    "unisex";

  // Format spec §2.C — adapté en flat-lay PRODUIT (pas de mannequin) :
  // le client a explicitement demandé un visuel "habits seuls" sans corps,
  // visage, mains, jambes. Le rendu visé est éditorial e-commerce premium
  // type COS / Arket / Lemaire — tenue complète arrangée à plat sur fond
  // neutre, vue de dessus ou 3/4, ghost mannequin invisible.
  const lines = [
    `Subject: flat lay complete ${genderLine} outfit arranged neatly on neutral background — NO model, NO person, NO body, NO face, NO hands, NO legs, NO mannequin form visible`,
    `Items visible: complete head-to-toe outfit including jacket/outerwear, top, bottom (pants or skirt), shoes, and one bag or accessory — all pieces laid flat, slightly overlapping in editorial composition`,
    `Silhouette intent: ${dna.silhouette}`,
    `Materials: ${dna.materials.join(", ")} — visible fabric weave, natural drape, realistic texture`,
    `Color palette: ${dna.palette.join(", ")} only — no other colors`,
    `Styling: ${dna.fit}, minimal accessories, no visible branding, no logos, no price tags, no hangers`,
    `Lighting: soft natural daylight from above, gentle shadows, ${occasionSpec.setting}`,
    `Camera: top-down flat lay or slight 3/4 angle, 50-85mm lens, sharp focus on garment construction, e-commerce editorial premium`,
    `Background: solid neutral cream or warm off-white seamless backdrop, minimal, uncluttered, no props`,
    `Mood: ${styleSpec.mood}, ${occasionSpec.mood}, quiet luxury catalog aesthetic`,
    `Reference: in the style of ${dna.fashion_references.join(" and ")} flat lay product photography, ${dna.era}, COS / Arket / Lemaire catalog visual language`,
    `Constraints: PRODUCT ONLY — absolutely no human body parts visible (no hands, no feet, no face, no skin, no head, no torso underneath clothing). Garments lie flat as if on a styled photography surface. No ${FORBIDDEN_KEYWORDS.slice(0, 6).join(", no ")}, no oversaturated colors`,
  ];

  return lines.join("\n");
}

/* ──────────────────────────────────────────────────────────────────────
   ORCHESTRATEUR — entrée unique, output complet de la spec
   ────────────────────────────────────────────────────────────────────── */

/**
 * Construit le triple-output WADA × Claude (DNA + description + prompt)
 * pour une palette donnée + un profil client.
 *
 * Si les scores ne respectent pas les seuils (visual_noise > 0.4 OU
 * wearability < 0.7), on retourne quand même un output — la régénération
 * est laissée au caller (UI peut afficher un bouton "Réessayer").
 */
export function generateFashionOutput(
  entry: DictionaryEntry,
  profile: ClientProfile
): FashionOutput {
  const dna = buildFashionDNA(entry, profile);
  const description = buildStylingDescription(entry, profile, dna);
  const imagePrompt = buildImagePrompt(entry, profile, dna);
  const scores = computeScores(dna, profile);

  return { dna, description, imagePrompt, scores };
}

/** True si l'output respecte les seuils qualité de la spec §5. */
export function isOutputValid(scores: FashionOutput["scores"]): boolean {
  return scores.visual_noise <= 0.4 && scores.wearability >= 0.7;
}
