/**
 * lib/composer/scoreOutfit.ts
 *
 * Brief 2026-06-01 « Composer IA » §7.
 * Score 0-100 d'une tenue 5 pièces avec 8 critères + disqualifications.
 *
 * Une tenue est CRÉDIBLE si :
 *   - Registre unique (ou 2 max compatibles) — sinon disqualifiant
 *   - Maximum 1 couleur forte (ΔE<30 vs palette principale) — sinon disqualifiant
 *   - Aucune matière interdite par la palette — sinon disqualifiant
 *
 * Au-delà des disqualifiants, le score additionne des points pour la cohérence
 * de saison, de genre, de présence d'une marque inspiration, du remplissage
 * complet des 5 slots, et de l'alignement couleur global.
 *
 * Seuil opérationnel : un score ≥ 75 est considéré bon. Sous 75, le composer
 * régénère en excluant le produit le moins aligné (cf. composeOutfit.ts).
 */

import type { ComposerProduct, PaletteIdentity, ComposerProfile, Slot } from "./types";
import { deltaEHex } from "@/lib/colorDistance";
import { isAcceptable } from "./registreCompat";

/** Alias local : la pile composer utilise deltaE2000(hex, hex) directement. */
const deltaE2000 = deltaEHex;

const COLOR_STRONG_THRESHOLD = 30;
const COLOR_PALETTE_THRESHOLD = 80;

export function scoreOutfit(
  outfit: Partial<Record<Slot, ComposerProduct>>,
  palette: PaletteIdentity,
  profile: ComposerProfile,
): number {
  const pieces = Object.values(outfit).filter(Boolean) as ComposerProduct[];
  if (pieces.length < 4) return 0; // au moins 4 pièces requises

  let score = 0;

  /* 1. Registre unique ou 2 compatibles (25 pts max, sinon disqualifiant) */
  const registres = new Set(pieces.map((p) => p.registre));
  if (registres.size === 1) {
    score += 25;
  } else if (registres.size === 2) {
    // 2 registres OK uniquement s'ils sont mutuellement acceptables
    const [a, b] = Array.from(registres);
    if (isAcceptable(a, b) && isAcceptable(b, a)) {
      score += 15;
    } else {
      return 0; // disqualifiant
    }
  } else {
    return 0; // 3+ registres = disqualifiant
  }

  /* 2. Une seule couleur forte (15 pts, disqualifiant si 3+) */
  const fortColors = pieces.filter(
    (p) => deltaE2000(p.couleur_principale.hex, palette.couleur_principale) < COLOR_STRONG_THRESHOLD,
  ).length;
  if (fortColors <= 1) score += 15;
  else if (fortColors === 2) score += 5;
  else return 0;

  /* 3. Toutes couleurs dans la palette (ΔE2000 < 80) — 10 pts */
  const allColors = [palette.couleur_principale, ...palette.couleurs_neutres];
  const allInPalette = pieces.every((p) =>
    allColors.some((pal) => deltaE2000(p.couleur_principale.hex, pal) < COLOR_PALETTE_THRESHOLD),
  );
  if (allInPalette) score += 10;

  /* 4. Aucune matière interdite (10 pts, disqualifiant si présente) */
  if (palette.matieres_interdites.length > 0) {
    const hasForbidden = pieces.some((p) => {
      const hay = `${p.matiere || ""} ${p.product_name || ""}`.toLowerCase();
      return palette.matieres_interdites.some((m) => hay.includes(m.toLowerCase()));
    });
    if (hasForbidden) return 0;
  }
  score += 10;

  /* 5. Toutes pièces compatibles saison (10 pts) */
  const seasonOk = pieces.every(
    (p) =>
      p.saison.includes("toute_saison") || p.saison.some((s) => palette.saison.includes(s)),
  );
  if (seasonOk) score += 10;

  /* 6. Genre cohérent (10 pts) */
  const genreOk = pieces.every(
    (p) => p.genre === profile.genre || p.genre === "unisexe" || p.genre === "mixte",
  );
  if (genreOk) score += 10;

  /* 7. Au moins 1 marque inspiration de la palette (10 pts si renseigné) */
  if (palette.marques_inspiration.length > 0) {
    const hasInspiration = pieces.some((p) =>
      palette.marques_inspiration.some(
        (m) => m.toLowerCase() === p.brand_name.toLowerCase(),
      ),
    );
    if (hasInspiration) score += 10;
  } else {
    // Pas de marque inspiration définie pour cette palette → on neutralise le critère
    score += 5; // demi-point pour ne pas pénaliser arbitrairement
  }

  /* 8. Les 5 slots sont remplis (10 pts) */
  const SLOTS_ATTENDUS: Slot[] = ["haut", "bas", "veste", "chaussures", "accent"];
  const slotsRemplis = SLOTS_ATTENDUS.filter((s) => outfit[s]).length;
  if (slotsRemplis === 5) score += 10;
  else if (slotsRemplis === 4) score += 6;
  else score += 2;

  return Math.min(score, 100);
}

/**
 * Identifie le produit le moins aligné avec la palette (couleur la plus
 * éloignée du ΔE2000 principal). Utilisé par composeOutfit() pour exclure
 * la pièce problématique avant un retry.
 */
export function findWorstProduct(
  outfit: Partial<Record<Slot, ComposerProduct>>,
  palette: PaletteIdentity,
): ComposerProduct | null {
  const pieces = Object.values(outfit).filter(Boolean) as ComposerProduct[];
  if (pieces.length === 0) return null;
  return pieces.reduce<ComposerProduct>((worst, p) => {
    const d = deltaE2000(p.couleur_principale.hex, palette.couleur_principale);
    const wd = deltaE2000(worst.couleur_principale.hex, palette.couleur_principale);
    return d > wd ? p : worst;
  }, pieces[0]);
}
