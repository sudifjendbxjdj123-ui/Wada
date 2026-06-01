/**
 * lib/composer/filterPool.ts
 *
 * Brief 2026-06-01 « Composer IA » §5.
 * Filtre dur du pool de produits selon palette + profil + budget.
 *
 * Étapes :
 *   1. in_stock = true
 *   2. brand non blacklistée (do-not-use)
 *   3. genre compatible (homme | femme | mixte | unisexe)
 *   4. prix <= budget plafond pièce
 *   5. registre compatible avec palette (isAcceptable)
 *   6. marque non interdite par la palette
 *   7. matière non interdite par la palette
 *   8. couleur proche d'une couleur de palette (ΔE2000 < threshold)
 *   9. couleur non interdite par la palette
 *  10. saison compatible
 *
 * Un produit qui échoue UN seul critère est dropped. La version loose
 * (cf. composeOutfit) ré-applique le même filtre mais avec un threshold
 * couleur plus large + adjacence registre étendue.
 */

import type { ComposerProduct, PaletteIdentity, ComposerProfile, Occasion } from "./types";
import { isAcceptable } from "./registreCompat";
import { deltaEHex } from "@/lib/colorDistance";

const COLOR_MATCH_THRESHOLD = 60;
const COLOR_FORBIDDEN_THRESHOLD = 50;

function colorMatchesPalette(productHex: string, palette: PaletteIdentity, threshold = COLOR_MATCH_THRESHOLD): boolean {
  const all = [palette.couleur_principale, ...palette.couleurs_neutres];
  return all.some((palHex) => deltaEHex(productHex, palHex) < threshold);
}

function colorIsForbidden(productHex: string, palette: PaletteIdentity): boolean {
  return palette.couleurs_interdites_hex.some((forbidden) => deltaEHex(productHex, forbidden) < COLOR_FORBIDDEN_THRESHOLD);
}

function isBrandBlacklisted(brand_name: string): boolean {
  const lower = brand_name.toLowerCase();
  return lower.includes("(do not use)") || lower.includes("discontinued");
}

export interface FilterOptions {
  budget_max_par_piece: number;
  occasion?: Occasion;
  /** Si true, threshold couleur élargi à 100 (au lieu de 60) pour grossir le pool
   *  quand le filtre strict retourne moins de 5 produits. */
  loose?: boolean;
}

export function filterPool(
  pool: ComposerProduct[],
  palette: PaletteIdentity,
  profile: ComposerProfile,
  options: FilterOptions,
): ComposerProduct[] {
  const colorThreshold = options.loose ? 100 : COLOR_MATCH_THRESHOLD;

  return pool.filter((p) => {
    /* 1. Stock */
    if (!p.in_stock) return false;

    /* 2. Brand non blacklistée */
    if (isBrandBlacklisted(p.brand_name)) return false;

    /* 3. Genre compatible — accepte mixte/unisexe ET le genre demandé */
    if (
      p.genre !== profile.genre &&
      p.genre !== "mixte" &&
      p.genre !== "unisexe" &&
      profile.genre !== "mixte" &&
      profile.genre !== "unisexe"
    ) {
      return false;
    }

    /* 4. Prix sous plafond pièce */
    if (p.prix_eur > options.budget_max_par_piece) return false;

    /* 5. Registre compatible (ok ou warn) */
    if (!isAcceptable(palette.registre, p.registre)) return false;

    /* 6. Marque non interdite par la palette */
    if (palette.marques_interdites.some((m) => p.brand_name.toLowerCase().includes(m.toLowerCase()))) {
      return false;
    }

    /* 6b. Marque non disliked par le profil */
    if (profile.dislikes_marques?.some((m) => p.brand_name.toLowerCase().includes(m.toLowerCase()))) {
      return false;
    }

    /* 7. Matière non interdite */
    if (
      palette.matieres_interdites.length > 0 &&
      palette.matieres_interdites.some((m) => `${p.matiere} ${p.product_name}`.toLowerCase().includes(m.toLowerCase()))
    ) {
      return false;
    }

    /* 8. Couleur dans la palette */
    if (!colorMatchesPalette(p.couleur_principale.hex, palette, colorThreshold)) return false;

    /* 9. Couleur non interdite */
    if (colorIsForbidden(p.couleur_principale.hex, palette)) return false;

    /* 10. Saison compatible */
    const seasonOk = p.saison.includes("toute_saison") || p.saison.some((s) => palette.saison.includes(s));
    if (!seasonOk) return false;

    return true;
  });
}
