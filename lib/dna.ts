/**
 * WADA — Calcul de l'ADN d'une tenue
 * ─────────────────────────────────────────────────────────────────────────
 * Étant donnée une DictionaryEntry (palette + composition + saisons + culture),
 * cette fonction extrait :
 *
 *   - Le **caractère chromatique** (cool/warm/earthy/neutral/vibrant, muted/saturated)
 *   - Les **tags structurés** (fabrics, contexte, ambiance) lisibles par IA
 *   - Un **score de compatibilité** pour chaque style (0-100)
 *   - Un **score de cohérence interne** de la palette (0-100)
 *   - Les **3 styles dominants** — pour afficher l'ADN dans l'UI
 *
 * Tout est déterministe (pas d'appel IA). Une vraie IA pourra plus tard
 * utiliser ces tags comme features pour de la recommandation perso.
 * ─────────────────────────────────────────────────────────────────────── */

import type { DictionaryEntry } from "./data";
import { styleProfiles, realStyles, type ColorBias } from "./styleGrammar";
import type { StyleModeKey } from "./data";

/* ──────────────────────────────────────────────────────────────────────
   Outils colorimétriques
   ────────────────────────────────────────────────────────────────────── */

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh = 0;
  if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) hh = ((b - r) / d + 2);
  else hh = ((r - g) / d + 4);
  return [hh * 60, s, l];
}

/** Classifie la palette en "froide / chaude / terre / neutre / vibrante". */
function paletteCharacter(colors: { hex: string }[]): { bias: ColorBias; saturation: "muted" | "saturated" } {
  if (colors.length === 0) return { bias: "neutral", saturation: "muted" };
  let totalSat = 0;
  let warmCount = 0, coolCount = 0, earthyCount = 0;
  for (const c of colors) {
    const [h, s] = hexToHsl(c.hex);
    totalSat += s;
    // h en degrés : 0=rouge, 60=jaune, 120=vert, 180=cyan, 240=bleu, 300=magenta
    if (h >= 180 && h <= 280) coolCount++;          // bleus, cyans, violets froids
    else if (h >= 20 && h <= 60) {
      if (s < 0.45) earthyCount++;                  // beige, ocre, terre
      else warmCount++;                              // oranges saturés
    }
    else if (h >= 0 && h < 20) warmCount++;          // rouges chauds
    else if (h > 60 && h < 180) earthyCount++;       // verts/jaunes terre
  }
  const avgSat = totalSat / colors.length;
  const saturation = avgSat > 0.45 ? "saturated" : "muted";

  let bias: ColorBias = "neutral";
  if (coolCount > warmCount && coolCount > earthyCount) bias = "cool";
  else if (warmCount > coolCount && warmCount > earthyCount) bias = "warm";
  else if (earthyCount >= warmCount && earthyCount >= coolCount) bias = "earthy";
  if (avgSat > 0.6 && bias !== "earthy") bias = "vibrant";
  return { bias, saturation };
}

/** Cohérence interne — basée sur l'écart maximal de luminosité entre couleurs. */
function paletteCoherence(colors: { hex: string }[]): number {
  if (colors.length <= 1) return 100;
  const lums = colors.map((c) => hexToHsl(c.hex)[2]);
  const min = Math.min(...lums), max = Math.max(...lums);
  // Une bonne palette éditoriale a des valeurs étagées, ni trop plates ni trop chaotiques
  const spread = max - min;
  // On vise un spread de 0.35-0.55 — au-delà ou en deçà, on pénalise
  const ideal = 0.45;
  const distance = Math.abs(spread - ideal);
  return Math.max(60, Math.round(100 - distance * 80));
}

/* ──────────────────────────────────────────────────────────────────────
   Extraction de tags depuis la composition
   ────────────────────────────────────────────────────────────────────── */

const FABRIC_TERMS = ["laine", "merino", "mérinos", "cachemire", "lin", "coton", "soie", "denim", "cuir", "daim", "tweed", "flanelle", "velours", "popeline", "oxford", "piqué", "jersey", "nylon", "molleton"];
const CONTEXT_HINTS: Record<string, string> = {
  "smoking": "soirée",
  "robe": "soirée",
  "blazer": "bureau",
  "costume": "bureau",
  "chinos": "bureau",
  "loafers": "bureau",
  "polo": "weekend",
  "sneakers": "weekend",
  "hoodie": "weekend",
  "joggers": "weekend",
  "trench": "voyage",
  "doudoune": "hiver",
  "manteau": "hiver",
  "lin": "été",
  "espadrille": "été",
};

function extractFabrics(composition: { item: string }[]): string[] {
  const text = composition.map((c) => c.item.toLowerCase()).join(" ");
  const found = new Set<string>();
  for (const term of FABRIC_TERMS) {
    if (text.includes(term)) found.add(term);
  }
  return Array.from(found);
}

function extractContext(composition: { item: string }[]): string[] {
  const text = composition.map((c) => c.item.toLowerCase()).join(" ");
  const found = new Set<string>();
  for (const [hint, ctx] of Object.entries(CONTEXT_HINTS)) {
    if (text.includes(hint)) found.add(ctx);
  }
  return Array.from(found);
}

/* ──────────────────────────────────────────────────────────────────────
   Scoring — compatibilité d'une tenue avec un style
   ────────────────────────────────────────────────────────────────────── */

export function scoreStyle(entry: DictionaryEntry, styleKey: StyleModeKey): number {
  const profile = styleProfiles[styleKey];
  if (!profile || styleKey === "all") return 50;

  let score = 50;
  const text = entry.composition.map((c) => c.item.toLowerCase()).join(" ");
  const colorNames = entry.colors.map((c) => c.name.toLowerCase()).join(" ");
  const { bias, saturation } = paletteCharacter(entry.colors);

  // ── Bonus : pièces iconiques détectées ──
  for (const piece of profile.iconicPieces) {
    if (text.includes(piece.toLowerCase())) score += 8;
  }
  // ── Malus : pièces interdites ──
  for (const piece of profile.forbiddenPieces) {
    if (text.includes(piece.toLowerCase())) score -= 18;
  }
  // ── Bonus : tissus préférés ──
  for (const fabric of profile.fabrics) {
    if (text.includes(fabric.toLowerCase())) score += 4;
  }
  // ── Bonus / malus : couleurs ──
  for (const term of profile.preferredColorTerms) {
    if (colorNames.includes(term.toLowerCase())) score += 3;
  }
  for (const term of profile.avoidedColorTerms) {
    if (colorNames.includes(term.toLowerCase())) score -= 10;
  }
  // ── Bonus : color bias match ──
  if (profile.colorBias === bias) score += 12;
  else if (profile.colorBias === "any") score += 0;
  else score -= 5;
  // ── Bonus : saturation match ──
  if (profile.saturation === saturation) score += 6;
  else if (profile.saturation === "any") score += 0;

  return Math.max(0, Math.min(100, score));
}

/* ──────────────────────────────────────────────────────────────────────
   Composition complète de l'ADN — point d'entrée public
   ────────────────────────────────────────────────────────────────────── */

export type OutfitDNA = {
  /** ADN texte court — 3 styles dominants joints en "·" (ex: "Minimaliste · Old money · Scandinave"). */
  adnText: string;
  /** Top 3 styles avec leur score. */
  dominantStyles: { key: StyleModeKey; label: string; score: number; adn: string }[];
  /** Score de cohérence de la palette (0-100). */
  paletteCoherence: number;
  /** Caractère chromatique. */
  colorBias: ColorBias;
  saturation: "muted" | "saturated";
  /** Tags structurés visibles dans l'UI. */
  tags: string[];
  /** Compatibilité complète : un score par style — utile pour debug / JSON. */
  allScores: Record<StyleModeKey, number>;
};

/** Compose l'ADN complet d'une tenue. Déterministe, sans IA. */
export function computeOutfitDNA(entry: DictionaryEntry): OutfitDNA {
  const character = paletteCharacter(entry.colors);
  const coherence = paletteCoherence(entry.colors);

  // Score tous les styles
  const allScores: Partial<Record<StyleModeKey, number>> = {};
  for (const profile of realStyles) {
    allScores[profile.key] = scoreStyle(entry, profile.key);
  }
  // Ajoute aussi les filtres (eco, second-hand, budget) à 50 par défaut
  allScores["sustainable"] = 50;
  allScores["second-hand"] = 50;
  allScores["budget"] = 50;
  allScores["all"] = 100;

  // Trie les styles réels par score décroissant
  const sorted = realStyles
    .map((p) => ({ key: p.key, label: p.label, adn: p.adn, score: allScores[p.key] || 50 }))
    .sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  // Construit les tags
  const tags: string[] = [];
  // 1. Caractère chromatique
  const biasLabel: Record<ColorBias, string> = {
    cool: "Palette froide", warm: "Palette chaude", earthy: "Palette terre",
    neutral: "Palette neutre", vibrant: "Palette vibrante", any: "",
  };
  if (biasLabel[character.bias]) tags.push(biasLabel[character.bias]);
  // 2. Saturation
  tags.push(character.saturation === "muted" ? "Tons feutrés" : "Tons saturés");
  // 3. Fabrics détectés
  const fabrics = extractFabrics(entry.composition);
  if (fabrics.includes("laine") || fabrics.includes("merino") || fabrics.includes("mérinos")) tags.push("Laine");
  if (fabrics.includes("cachemire")) tags.push("Cachemire");
  if (fabrics.includes("lin")) tags.push("Lin");
  if (fabrics.includes("denim")) tags.push("Denim");
  if (fabrics.includes("cuir")) tags.push("Cuir");
  if (fabrics.includes("soie")) tags.push("Soie");
  // 4. Contexte d'usage
  const ctx = extractContext(entry.composition);
  ctx.forEach((c) => tags.push(c.charAt(0).toUpperCase() + c.slice(1)));
  // 5. Saisons
  if (entry.seasons && entry.seasons.length > 0) {
    entry.seasons.forEach((s) => {
      if (s !== "any") tags.push(s.charAt(0).toUpperCase() + s.slice(1));
    });
  }
  // 6. Culture
  if (entry.culture) {
    const label = entry.culture.charAt(0).toUpperCase() + entry.culture.slice(1);
    tags.push(label);
  }
  // Dedupe + cap à 8 tags
  const uniqueTags = Array.from(new Set(tags)).slice(0, 8);

  // ADN text — top 3 styles concaténés
  const adnText = top3.map((s) => s.label).join(" · ");

  return {
    adnText,
    dominantStyles: top3,
    paletteCoherence: coherence,
    colorBias: character.bias,
    saturation: character.saturation,
    tags: uniqueTags,
    allScores: allScores as Record<StyleModeKey, number>,
  };
}

/**
 * Sortie JSON IA-ready — pour qu'un LLM ou un système externe puisse
 * raisonner sur la tenue. Utilisé pour le futur endpoint /api/dna/[number].
 */
export function outfitToAIObject(entry: DictionaryEntry, dna: OutfitDNA) {
  return {
    id: `look_${entry.number}`,
    name: entry.name,
    culture: entry.culture,
    palette: Object.fromEntries(
      entry.colors.map((c) => [c.name.toLowerCase().replace(/\s+/g, "_"), c.hex])
    ),
    composition: entry.composition.map((c) => ({ piece: c.piece, item: c.item })),
    seasons: entry.seasons || [],
    dna: dna.dominantStyles.map((s) => s.key),
    tags: dna.tags,
    color_bias: dna.colorBias,
    saturation: dna.saturation,
    palette_coherence: dna.paletteCoherence,
    compatibility: dna.allScores,
  };
}
