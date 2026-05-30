/**
 * coherenceScore — calcule un score 0-100 de cohérence pour une tenue.
 *
 * Brief 2026-05-30 « logique de composition tenue cohérente » §score.
 * Le composer rejette les tenues < 70 et tente une recomposition.
 *
 * Critères pondérés :
 *   +20  tous les slots remplis (5/5)
 *   +15  registre unique (toutes pièces même brandRegistre)
 *   +15  une seule couleur forte (les autres neutres) — calcul saturation
 *   +10  saison palette compatible
 *   +10  toutes pièces ≤ plafond budget profil
 *   +10  genre cohérent sur toutes les pièces
 *   +10  matériaux cohérents (pas de lin + cachemire ensemble)
 *   +10  toutes les images chargent (pas de noimage placeholder)
 *
 * Un score < 70 indique une tenue à recomposer. Un score 90+ = tenue
 * idéale, on peut afficher avec confiance.
 */

import { hexToLab } from "./colorDistance";
import type { ProduitAwin } from "./schema";
import { detectSeason, isSeasonCompatible, type Season } from "./seasonDetect";

export interface CoherenceContext {
  /** Saisons de la palette WADA (ex. ["hiver", "automne"]). */
  paletteSeasons?: string[];
  /** Plafond prix par pièce selon le profil (150, 400, ou Infinity). */
  maxPricePerPiece?: number;
  /** Genre cible du profil (« femme » | « homme »). */
  targetGenre?: string;
}

export interface CoherenceResult {
  score: number;
  breakdown: {
    slotsRemplis: number;
    registreUnique: number;
    couleurForteUnique: number;
    saisonCompatible: number;
    budgetRespecte: number;
    genreCoherent: number;
    materiauxCoherents: number;
    imagesOk: number;
  };
  /** Liste lisible des défauts détectés — utile pour logs/debug. */
  warnings: string[];
}

/** Calcule la saturation d'une couleur depuis Lab. Plus c'est élevé,
 *  plus la couleur est « forte » / saturée. */
function saturation(hex: string): number {
  const [, a, b] = hexToLab(hex);
  return Math.sqrt(a * a + b * b);
}

/** Compte combien de produits ont une couleur « forte » (saturation > 25). */
function strongColorCount(products: ProduitAwin[]): number {
  return products.filter((p) => saturation(p.hex) > 25).length;
}

export function scoreOutfit(
  outfit: ProduitAwin[],
  ctx: CoherenceContext = {},
): CoherenceResult {
  const breakdown = {
    slotsRemplis: 0,
    registreUnique: 0,
    couleurForteUnique: 0,
    saisonCompatible: 0,
    budgetRespecte: 0,
    genreCoherent: 0,
    materiauxCoherents: 0,
    imagesOk: 0,
  };
  const warnings: string[] = [];

  /* +20 si tous les slots remplis (5 pièces : haut / bas / veste /
     chaussures / accent). */
  if (outfit.length === 5) {
    breakdown.slotsRemplis = 20;
  } else {
    warnings.push(`Tenue incomplète : ${outfit.length}/5 pièces`);
    breakdown.slotsRemplis = Math.round((outfit.length / 5) * 20);
  }

  /* +15 si registre unique (tous brandRegistre identiques). Marques
     non-classées (brandRegistre undefined) ne pénalisent pas. */
  const registres = new Set(outfit.map((p) => p.brandRegistre).filter(Boolean));
  if (registres.size <= 1) {
    breakdown.registreUnique = 15;
  } else {
    warnings.push(`Mix registres : ${Array.from(registres).join(", ")}`);
    breakdown.registreUnique = 0;
  }

  /* +15 si UNE seule couleur forte. Brief « one statement color » :
     dans une tenue il doit y avoir un seul point d'attention chromatique. */
  const strong = strongColorCount(outfit);
  if (strong <= 1) {
    breakdown.couleurForteUnique = 15;
  } else if (strong === 2) {
    breakdown.couleurForteUnique = 7;
    warnings.push(`${strong} couleurs fortes (idéal : 1)`);
  } else {
    breakdown.couleurForteUnique = 0;
    warnings.push(`${strong} couleurs fortes (idéal : 1)`);
  }

  /* +10 si saison palette compatible. On vérifie chaque pièce. */
  if (ctx.paletteSeasons && ctx.paletteSeasons.length > 0) {
    const incompat = outfit.filter((p) => {
      const s = detectSeason(p.nom, p.description);
      return !isSeasonCompatible(s, ctx.paletteSeasons!);
    });
    if (incompat.length === 0) {
      breakdown.saisonCompatible = 10;
    } else {
      breakdown.saisonCompatible = Math.max(0, 10 - incompat.length * 3);
      warnings.push(`${incompat.length} pièces hors saison palette`);
    }
  } else {
    breakdown.saisonCompatible = 10; // pas de contrainte saison
  }

  /* +10 si toutes pièces ≤ plafond budget profil. */
  if (ctx.maxPricePerPiece !== undefined && ctx.maxPricePerPiece < Infinity) {
    const over = outfit.filter((p) => p.prix > ctx.maxPricePerPiece!);
    if (over.length === 0) {
      breakdown.budgetRespecte = 10;
    } else {
      breakdown.budgetRespecte = Math.max(0, 10 - over.length * 3);
      warnings.push(`${over.length} pièces > ${ctx.maxPricePerPiece}€`);
    }
  } else {
    breakdown.budgetRespecte = 10;
  }

  /* +10 si genre cohérent (toutes pièces == targetGenre ou unisexe). */
  if (ctx.targetGenre) {
    const t = ctx.targetGenre.toLowerCase();
    const wrong = outfit.filter((p) => {
      const g = p.genre?.toLowerCase();
      return g && g !== t && g !== "unisexe" && g !== "inconnu";
    });
    if (wrong.length === 0) {
      breakdown.genreCoherent = 10;
    } else {
      breakdown.genreCoherent = 0;
      warnings.push(`${wrong.length} pièces autre genre`);
    }
  } else {
    breakdown.genreCoherent = 10;
  }

  /* +10 matériaux cohérents (pas de lin + cachemire dans la même tenue). */
  const materials = new Set<Season>();
  for (const p of outfit) {
    const s = detectSeason(p.nom, p.description);
    if (s !== "any") materials.add(s);
  }
  /* Si on a à la fois "hiver" ET "été" dans la même tenue → incohérent. */
  if (materials.has("hiver") && materials.has("été")) {
    breakdown.materiauxCoherents = 0;
    warnings.push("Mix matières hiver + été");
  } else {
    breakdown.materiauxCoherents = 10;
  }

  /* +10 si toutes images chargent (filtre noimage). */
  const broken = outfit.filter((p) => {
    const img = p.imageLocal || p.largeImage || p.image || "";
    return !img || img === "-" || /noimage\./i.test(img);
  });
  if (broken.length === 0) {
    breakdown.imagesOk = 10;
  } else {
    breakdown.imagesOk = 0;
    warnings.push(`${broken.length} pièces sans photo`);
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { score, breakdown, warnings };
}

/** Seuil minimum pour qu'une tenue soit affichable au client. */
export const COHERENCE_THRESHOLD = 70;
