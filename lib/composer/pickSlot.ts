/**
 * lib/composer/pickSlot.ts
 *
 * Brief 2026-06-01 « Composer IA » §6.
 * Sélection scorée du meilleur candidat pour un slot donné.
 *
 * Score d'un produit pour un slot :
 *   - Marque inspiration palette  +30
 *   - Matière attendue palette    +20
 *   - Couleur ΔE2000 < 30        +15
 *   - Couleur ΔE2000 < 60        +5
 *   - Envie boost matière        +0 à +20
 *   - Couleur aimée par profil   +5
 *   - Marque dislikée            −50  (déjà filtrée dans filterPool, sécurité)
 *
 * pickForSlot() retourne le candidat avec le score le plus élevé, en excluant
 * les produits déjà sélectionnés sur d'autres slots (set `excluded`).
 */

import type { ComposerProduct, PaletteIdentity, ComposerProfile, Slot, Envie } from "./types";
import { deltaEHex } from "@/lib/colorDistance";
import { envieBoostFor } from "./envieBoosts";

function scoreProductForSlot(
  p: ComposerProduct,
  palette: PaletteIdentity,
  profile: ComposerProfile,
  envie: Envie | undefined,
): number {
  let score = 0;

  /* Marque inspiration palette */
  if (palette.marques_inspiration.some((m) => p.brand_name.toLowerCase() === m.toLowerCase())) {
    score += 30;
  }

  /* Matière attendue par la palette */
  if (
    p.matiere &&
    palette.matieres_attendues.some((m) => `${p.matiere} ${p.product_name}`.toLowerCase().includes(m.toLowerCase()))
  ) {
    score += 20;
  }

  /* Couleur proche de la dominante palette */
  const dPrincipale = deltaEHex(p.couleur_principale.hex, palette.couleur_principale);
  if (dPrincipale < 30) score += 15;
  else if (dPrincipale < 60) score += 5;

  /* Envie boost matière */
  score += envieBoostFor(p.matiere, p.product_name, envie);

  /* Profil — couleurs aimées */
  if (profile.likes_couleurs?.some((c) => p.couleur_principale.nom.toLowerCase().includes(c.toLowerCase()))) {
    score += 5;
  }

  /* Profil — marques disliked (sécurité, normalement déjà filtré) */
  if (profile.dislikes_marques?.some((m) => p.brand_name.toLowerCase().includes(m.toLowerCase()))) {
    score -= 50;
  }

  return score;
}

export function pickForSlot(
  pool: ComposerProduct[],
  slot: Slot,
  palette: PaletteIdentity,
  profile: ComposerProfile,
  excluded: Set<string> = new Set(),
): ComposerProduct | null {
  const candidates = pool.filter((p) => p.slot === slot && !excluded.has(p.id));
  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((p) => ({ p, score: scoreProductForSlot(p, palette, profile, profile.envie) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0].p;
}

/** Variante : retourne le top-N candidats triés. Utile pour le retry. */
export function pickTopForSlot(
  pool: ComposerProduct[],
  slot: Slot,
  palette: PaletteIdentity,
  profile: ComposerProfile,
  n: number = 3,
  excluded: Set<string> = new Set(),
): ComposerProduct[] {
  const candidates = pool.filter((p) => p.slot === slot && !excluded.has(p.id));
  const ranked = candidates
    .map((p) => ({ p, score: scoreProductForSlot(p, palette, profile, profile.envie) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p);
  return ranked;
}
