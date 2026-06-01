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
import { isAcceptable, isCompatible } from "./registreCompat";
import { deltaEHex } from "@/lib/colorDistance";
import { isAffiliated, isProductOkForOccasion } from "./occasionRules";

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
  /** Brief URGENT 2026-06-01 Nemanja : par défaut, registre STRICT (= compat
   *  "ok" seulement, jamais "warn"). Empêche le mix outdoor+minimaliste et
   *  les absurdités tailoring + sneakers de sport. Mettre `false` pour
   *  retomber sur l'adjacency permissive (= ok+warn). */
  strictRegistre?: boolean;
  /** Brief URGENT 2026-06-01 : whitelist source affiliée. True par défaut
   *  pour ne montrer QUE des produits qu'on peut monétiser via Awin. */
  affiliatedOnly?: boolean;
}

export function filterPool(
  pool: ComposerProduct[],
  palette: PaletteIdentity,
  profile: ComposerProfile,
  options: FilterOptions,
): ComposerProduct[] {
  const colorThreshold = options.loose ? 100 : COLOR_MATCH_THRESHOLD;
  const strictRegistre = options.strictRegistre !== false; // default TRUE
  const affiliatedOnly = options.affiliatedOnly !== false; // default TRUE

  return pool.filter((p) => {
    /* 1. Stock */
    if (!p.in_stock) return false;

    /* 2. Brand non blacklistée */
    if (isBrandBlacklisted(p.brand_name)) return false;

    /* 3. Source AFFILIÉE (Brief URGENT 2026-06-01) — whitelist MUJI / TBF /
       Suitable FR. Empêche le composer de proposer Veja/COS/Zara qui ne
       génèrent aucune commission. */
    if (affiliatedOnly && !isAffiliated(p.source)) return false;

    /* 4. Genre compatible — accepte mixte/unisexe ET le genre demandé */
    if (
      p.genre !== profile.genre &&
      p.genre !== "mixte" &&
      p.genre !== "unisexe" &&
      profile.genre !== "mixte" &&
      profile.genre !== "unisexe"
    ) {
      return false;
    }

    /* 5. Prix sous plafond pièce */
    if (p.prix_eur > options.budget_max_par_piece) return false;

    /* 6. Registre — STRICT par défaut (Brief URGENT 2026-06-01 « Une marque
       = un registre. Pas de mix »). Sur option strictRegistre=false on
       relâche à isAcceptable (= ok + warn) pour des cas où l'utilisateur
       veut explicitement du smart casual cross-registre. */
    const registreOk = strictRegistre
      ? isCompatible(palette.registre, p.registre)
      : isAcceptable(palette.registre, p.registre);
    if (!registreOk) return false;

    /* 7. Marque non interdite par la palette */
    if (palette.marques_interdites.some((m) => p.brand_name.toLowerCase().includes(m.toLowerCase()))) {
      return false;
    }

    /* 7b. Marque non disliked par le profil */
    if (profile.dislikes_marques?.some((m) => p.brand_name.toLowerCase().includes(m.toLowerCase()))) {
      return false;
    }

    /* 8. Matière non interdite */
    if (
      palette.matieres_interdites.length > 0 &&
      palette.matieres_interdites.some((m) => `${p.matiere} ${p.product_name}`.toLowerCase().includes(m.toLowerCase()))
    ) {
      return false;
    }

    /* 9. Couleur dans la palette */
    if (!colorMatchesPalette(p.couleur_principale.hex, palette, colorThreshold)) return false;

    /* 10. Couleur non interdite */
    if (colorIsForbidden(p.couleur_principale.hex, palette)) return false;

    /* 11. Saison compatible */
    const seasonOk = p.saison.includes("toute_saison") || p.saison.some((s) => palette.saison.includes(s));
    if (!seasonOk) return false;

    /* 12. OCCASION compatible (Brief URGENT 2026-06-01 — Règle 3) :
       rejette les produits dont product_name contient un mot-clé interdit
       pour l'occasion (ex. « short de bain » exclu de voyage + bureau +
       soirée). Liste exhaustive dans occasionRules.FORBIDDEN_TYPES. */
    if (options.occasion && !isProductOkForOccasion(p.product_name, options.occasion)) {
      return false;
    }

    return true;
  });
}
