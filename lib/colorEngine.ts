/**
 * WADA — AI Color Stylist Engine
 * ─────────────────────────────────────────────────────────────────────────
 * Moteur de scoring qui implémente la spec "AI Color Stylist Engine".
 *
 * Responsabilités :
 *   1. Analyser une couleur (hex → temperature, saturation, lightness, emotion)
 *   2. Vérifier la compatibilité de deux couleurs (rules d'harmonie)
 *   3. Scorer un outfit/palette sur 4 dimensions (color/style/season/trend)
 *   4. Matcher une intention utilisateur (mood + style + season) à une palette
 *
 * Principe : on ne ré-encode PAS les couleurs à la main (380 entries dans
 * data.ts). On les analyse DYNAMIQUEMENT à partir du hex via HSL.
 * Ainsi quand on ajoute une palette dans data.ts, elle est automatiquement
 * scorée sans setup manuel.
 *
 * Inspiré du Dictionary of Color Combinations de Sanzo Wada (1933) :
 *   - règle des 3 couleurs (jamais plus, jamais moins)
 *   - harmony triadique / analogue / monochrome / complémentaire
 *   - équilibre clair / médium / sombre
 * ─────────────────────────────────────────────────────────────────────── */

import type { DictionaryEntry } from "./data";

/* ────────────────────────────────────────────────────────────────────── */
/*  1. ANALYSE D'UNE COULEUR — hex → metadata structurée                  */
/* ────────────────────────────────────────────────────────────────────── */

export type ColorMeta = {
  hex: string;
  name: string;
  hue: number;        // 0-360
  saturation: number; // 0-1
  lightness: number;  // 0-1
  temperature: "warm" | "cool" | "neutral";
  saturationLevel: "low" | "medium" | "high";
  lightnessLevel: "dark" | "medium" | "light";
  emotion: string[];
};

/** Convertit un hex (#RRGGBB ou #RGB) en HSL [hue 0-360, sat 0-1, lig 0-1] */
export function hexToHsl(hex: string): [number, number, number] {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return [h, s, l];
}

/** Analyse complète d'une couleur — point d'entrée principal */
export function analyzeColor(hex: string, name = ""): ColorMeta {
  const [hue, saturation, lightness] = hexToHsl(hex);

  // Température : warm (jaune-rouge), cool (bleu-cyan), neutral (faible sat)
  const temperature: ColorMeta["temperature"] =
    saturation < 0.10 ? "neutral" :
    (hue >= 0 && hue < 70) || (hue >= 310 && hue <= 360) ? "warm" :
    (hue >= 170 && hue < 270) ? "cool" :
    (hue >= 70 && hue < 170) ? "neutral" : // verts = perçus comme neutres en mode
    "neutral";

  const saturationLevel: ColorMeta["saturationLevel"] =
    saturation < 0.18 ? "low" : saturation < 0.50 ? "medium" : "high";

  const lightnessLevel: ColorMeta["lightnessLevel"] =
    lightness < 0.30 ? "dark" : lightness < 0.70 ? "medium" : "light";

  // Émotions dérivées (multi-tag — une couleur peut être à la fois "calm" et "elegant")
  const emotion: string[] = [];
  if (saturationLevel === "low" && lightnessLevel === "medium") emotion.push("calm", "quiet", "luxury");
  if (saturationLevel === "low" && lightnessLevel === "light") emotion.push("airy", "fresh", "soft");
  if (saturationLevel === "low" && lightnessLevel === "dark") emotion.push("elegant", "discreet");
  if (saturationLevel === "high" && lightnessLevel === "medium") emotion.push("bold", "energetic");
  if (saturationLevel === "high" && lightnessLevel === "dark") emotion.push("powerful", "intense");
  if (saturationLevel === "high" && lightnessLevel === "light") emotion.push("playful", "vivid");
  if (temperature === "warm" && lightnessLevel === "light") emotion.push("welcoming");
  if (temperature === "warm" && lightnessLevel === "dark") emotion.push("grounded");
  if (temperature === "cool" && lightnessLevel === "dark") emotion.push("authoritative");
  if (temperature === "cool" && lightnessLevel === "light") emotion.push("serene");
  if (temperature === "neutral") emotion.push("versatile");
  if (lightnessLevel === "dark") emotion.push("formal");
  if (lightnessLevel === "light" && saturationLevel === "low") emotion.push("minimal");

  return {
    hex, name, hue, saturation, lightness,
    temperature, saturationLevel, lightnessLevel,
    emotion: Array.from(new Set(emotion)),
  };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  2. COMPATIBILITÉ DE DEUX COULEURS — rules d'harmonie                  */
/* ────────────────────────────────────────────────────────────────────── */

export type CompatibilityResult = {
  compatible: boolean;
  score: number; // 0-1 (1 = parfaite harmonie)
  rule: "monochrome" | "analogous" | "complementary" | "triadic" | "split-complement" | "neutral-mix" | "tonal" | "conflict";
};

/** Distance angulaire entre deux hues (0-180) */
function hueDistance(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2);
  return d > 180 ? 360 - d : d;
}

/** Vérifie si deux couleurs forment une harmonie reconnue */
export function colorsCompatible(c1: ColorMeta, c2: ColorMeta): CompatibilityResult {
  const dist = hueDistance(c1.hue, c2.hue);
  const lightDiff = Math.abs(c1.lightness - c2.lightness);
  const satMaxLow = c1.saturation < 0.18 && c2.saturation < 0.18;

  // Neutral mix — au moins une couleur très peu saturée (gris/beige/crème)
  if (satMaxLow || c1.temperature === "neutral" || c2.temperature === "neutral") {
    return { compatible: true, score: 0.90, rule: "neutral-mix" };
  }

  // Monochrome — même hue (±15°), différentes lightness
  if (dist <= 15 && lightDiff > 0.10) {
    return { compatible: true, score: 0.95, rule: "monochrome" };
  }

  // Tonal — même hue, peu de différence de lightness mais saturation différente
  if (dist <= 15 && lightDiff <= 0.10) {
    return { compatible: true, score: 0.85, rule: "tonal" };
  }

  // Analogous — hues proches (15-50°)
  if (dist > 15 && dist <= 50) {
    return { compatible: true, score: 0.88, rule: "analogous" };
  }

  // Complementary — hues opposées (~180°, tolérance ±20°)
  if (dist >= 160 && dist <= 200) {
    return { compatible: true, score: 0.82, rule: "complementary" };
  }

  // Split-complement — ~150-160° (un peu décalé du complémentaire)
  if (dist >= 130 && dist < 160) {
    return { compatible: true, score: 0.78, rule: "split-complement" };
  }

  // Triadic — 120° entre eux
  if (dist >= 100 && dist < 130) {
    return { compatible: true, score: 0.75, rule: "triadic" };
  }

  // Zone de conflit : 50-100° (ni analogue ni triadique) sans saturation faible
  // → harmonie incertaine, score plus bas
  if (dist > 50 && dist < 100) {
    return { compatible: false, score: 0.45, rule: "conflict" };
  }

  // Cas par défaut (rares)
  return { compatible: true, score: 0.60, rule: "tonal" };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  3. SCORING D'UNE PALETTE (spec WADA — 4 dimensions, 0-10)             */
/* ────────────────────────────────────────────────────────────────────── */

export type OutfitScore = {
  colorHarmony: number;
  styleConsistency: number;
  seasonFit: number;
  trendRelevance: number;
  overallScore: number;
  /** Détails par règle pour debug/affichage transparence */
  details: {
    rules: CompatibilityResult["rule"][];
    palette_mood: string[];
    styles: string[];
  };
};

/** Tags style considérés "trend" en 2026 (mise à jour annuelle) */
const TREND_TAGS_2026 = new Set([
  "minimaliste", "old-money", "bourgeoisie", "quiet-luxury",
  "minimal", "preppy", "sport-chic", "bohème",
]);

export function scoreOutfit(entry: DictionaryEntry): OutfitScore {
  const colorMetas = entry.colors.map((c) => analyzeColor(c.hex, c.name));

  // 1. COLOR HARMONY — moyenne des paires (3 couleurs = 3 paires)
  const rules: CompatibilityResult["rule"][] = [];
  let harmonySum = 0;
  let pairCount = 0;
  for (let i = 0; i < colorMetas.length; i++) {
    for (let j = i + 1; j < colorMetas.length; j++) {
      const compat = colorsCompatible(colorMetas[i], colorMetas[j]);
      harmonySum += compat.score;
      rules.push(compat.rule);
      pairCount++;
    }
  }
  const colorHarmony = (harmonySum / Math.max(1, pairCount)) * 10;

  // 2. STYLE CONSISTENCY — basé sur le nombre de styles overlap dans `styles[]`
  // Plus la palette a un style cohérent (1-2 tags max), plus c'est cohérent.
  // Bonus si la composition mentionne des matières qui matchent (lin/laine/etc.).
  const styles = entry.styles || [];
  const styleConsistency = Math.min(10,
    styles.length === 1 ? 9 :
    styles.length === 2 ? 8 :
    styles.length === 3 ? 7 :
    styles.length === 0 ? 6 :
    5
  );

  // 3. SEASON FIT — saisons multiples = polyvalent. "any" = top score.
  const seasons = entry.seasons || [];
  const seasonFit =
    seasons.includes("any") ? 10 :
    seasons.length >= 3 ? 9 :
    seasons.length === 2 ? 8.5 :
    seasons.length === 1 ? 7 :
    6;

  // 4. TREND RELEVANCE — basé sur le nombre de tags style dans TREND_TAGS_2026
  const trendMatches = styles.filter((s) => TREND_TAGS_2026.has(s)).length;
  const trendRelevance = Math.min(10,
    trendMatches >= 2 ? 9 :
    trendMatches === 1 ? 7.5 :
    6
  );

  const overallScore = Number(((colorHarmony + styleConsistency + seasonFit + trendRelevance) / 4).toFixed(2));

  // Mood agrégé des couleurs
  const palette_mood = Array.from(new Set(colorMetas.flatMap((c) => c.emotion))).slice(0, 6);

  return {
    colorHarmony: Number(colorHarmony.toFixed(2)),
    styleConsistency,
    seasonFit,
    trendRelevance,
    overallScore,
    details: {
      rules,
      palette_mood,
      styles,
    },
  };
}

/* ────────────────────────────────────────────────────────────────────── */
/*  4. MATCH USER INTENT → PALETTE                                        */
/* ────────────────────────────────────────────────────────────────────── */

export type UserIntent = {
  occasion?: string;        // "Mariage", "Bureau"...
  style?: string;           // "Old money", "Minimal"...
  season?: string;          // "Printemps", "Été"...
  culture?: string;         // "french", "japanese"...
  mood?: string[];          // ["calm", "elegant"]
  preferred_temperature?: "warm" | "cool" | "neutral";
  preferred_lightness?: "dark" | "medium" | "light";
  avoid_colors?: string[];
  /** Couleur explicitement demandée par l'utilisateur, en hex.
      Amélioration styliste 2026-05-24 : avant, la couleur voulue
      ("je veux du bordeaux") n'entrait PAS dans le scoring des palettes —
      le moteur pouvait donc recommander un accord sans la couleur demandée.
      Désormais elle booste les accords qui la contiennent vraiment. */
  target_color_hex?: string;
};

export type IntentMatch = {
  entry: DictionaryEntry;
  score: number;       // 0-10
  outfit: OutfitScore;
  match_reasons: string[];
};

/** Score d'une palette face à une intention utilisateur.
    Combine : score outfit intrinsèque + match contextuel (style/saison/culture). */
export function scorePaletteForIntent(entry: DictionaryEntry, intent: UserIntent): IntentMatch {
  const outfit = scoreOutfit(entry);
  let contextScore = 0;
  let contextMax = 0;
  const reasons: string[] = [];

  // Style match
  if (intent.style) {
    contextMax += 3;
    const intentStyleNormalized = intent.style.toLowerCase().replace(/\s+/g, "-");
    if (entry.styles?.some((s) =>
      s.toLowerCase().replace(/\s+/g, "-") === intentStyleNormalized ||
      intentStyleNormalized.includes(s.toLowerCase()) ||
      s.toLowerCase().includes(intentStyleNormalized)
    )) {
      contextScore += 3;
      reasons.push(`Style "${intent.style}" matche`);
    }
  }

  // Season match
  if (intent.season) {
    contextMax += 2;
    if (entry.seasons?.includes(intent.season.toLowerCase()) || entry.seasons?.includes("any")) {
      contextScore += 2;
      reasons.push(`Saison ${intent.season} OK`);
    }
  }

  // Culture match
  if (intent.culture) {
    contextMax += 2;
    if (entry.culture === intent.culture) {
      contextScore += 2;
      reasons.push(`Culture ${intent.culture}`);
    }
  }

  // Mood match — overlap entre intent.mood et outfit.details.palette_mood
  if (intent.mood?.length) {
    contextMax += 2;
    const moodOverlap = intent.mood.filter((m) =>
      outfit.details.palette_mood.includes(m.toLowerCase())
    ).length;
    if (moodOverlap > 0) {
      contextScore += Math.min(2, moodOverlap);
      reasons.push(`Mood ${moodOverlap} en commun`);
    }
  }

  // Température préférée
  if (intent.preferred_temperature) {
    contextMax += 1;
    const colorMetas = entry.colors.map((c) => analyzeColor(c.hex));
    if (colorMetas.some((c) => c.temperature === intent.preferred_temperature)) {
      contextScore += 1;
    }
  }

  // Couleur DEMANDÉE — booste les palettes qui la contiennent réellement.
  // Pour une couleur saturée : proximité de teinte (hue). Pour un neutre
  // (blanc/crème/noir/gris) : la teinte n'a pas de sens → on matche sur la
  // proximité de clarté entre neutres. C'est ce qui aligne enfin l'accord
  // Wada recommandé sur la couleur que l'utilisateur a réclamée.
  if (intent.target_color_hex) {
    contextMax += 3;
    const target = analyzeColor(intent.target_color_hex);
    const metas = entry.colors.map((c) => analyzeColor(c.hex));
    let best = 0;
    for (const c of metas) {
      if (target.temperature === "neutral" || target.saturationLevel === "low") {
        if (c.saturationLevel === "low" && Math.abs(c.lightness - target.lightness) <= 0.18) best = Math.max(best, 3);
        else if (c.saturationLevel === "low") best = Math.max(best, 1.5);
      } else {
        const d = hueDistance(c.hue, target.hue);
        if (d <= 22 && c.saturation > 0.12) best = Math.max(best, 3);
        else if (d <= 45 && c.saturation > 0.12) best = Math.max(best, 1.5);
      }
    }
    if (best > 0) {
      contextScore += best;
      reasons.push(best >= 3 ? "Contient la couleur demandée" : "Couleur proche de la demande");
    }
  }

  // Couleurs à éviter
  if (intent.avoid_colors?.length) {
    const avoidLow = intent.avoid_colors.map((c) => c.toLowerCase());
    const hasAvoided = entry.colors.some((c) =>
      avoidLow.some((avoid) => c.name.toLowerCase().includes(avoid))
    );
    if (hasAvoided) {
      contextScore -= 2; // pénalité
      reasons.push("⚠️ contient couleur à éviter");
    }
  }

  // Score final : moyenne pondérée outfit intrinsèque + match contextuel
  const contextNormalized = contextMax > 0 ? (contextScore / contextMax) * 10 : 7; // neutre si pas d'intent
  const finalScore = Number(((outfit.overallScore * 0.6) + (contextNormalized * 0.4)).toFixed(2));

  return { entry, score: finalScore, outfit, match_reasons: reasons };
}

/**
 * Trouve les meilleures palettes pour une intention donnée.
 * Filtre les palettes avec score < threshold (7.5 par défaut comme dans la spec).
 */
export function findBestPalettes(
  catalog: DictionaryEntry[],
  intent: UserIntent,
  options: { threshold?: number; limit?: number } = {}
): IntentMatch[] {
  const { threshold = 7.5, limit = 12 } = options;
  return catalog
    .map((entry) => scorePaletteForIntent(entry, intent))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/* ────────────────────────────────────────────────────────────────────── */
/*  5. FALLBACK — si aucun match ≥ 7.5, on baisse les exigences           */
/* ────────────────────────────────────────────────────────────────────── */

export function findBestPalettesWithFallback(
  catalog: DictionaryEntry[],
  intent: UserIntent,
  desired = 8
): { matches: IntentMatch[]; fallback_used: boolean } {
  // Tentative 1 : seuil strict 7.5
  let matches = findBestPalettes(catalog, intent, { threshold: 7.5, limit: desired });
  if (matches.length >= desired / 2) return { matches, fallback_used: false };

  // Fallback : on baisse le seuil + on neutralise certaines contraintes
  const relaxedIntent: UserIntent = {
    ...intent,
    avoid_colors: undefined, // ignore les exclusions
    mood: undefined,
  };
  matches = findBestPalettes(catalog, relaxedIntent, { threshold: 6.5, limit: desired });

  return { matches, fallback_used: true };
}
