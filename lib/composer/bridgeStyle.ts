/**
 * lib/composer/bridgeStyle.ts
 *
 * Bridge entre BrandRegistre (catégorie MARQUE) et MacroStyle (catégorie PIÈCE).
 *
 * Sans auto-tagging GPT-4o Vision (futur §9 de la spec), on utilise une
 * heuristique : un produit hérite du macro-style de son registre marque,
 * raffiné par des mots-clés dans son nom.
 *
 * Précision estimée ~75% — suffisant pour le scoring et les kill-switches.
 * Le vrai tagging par Vision peut être ajouté plus tard (script one-shot).
 */

import type { BrandRegistre } from "@/lib/brandRegistre";
import type { MacroStyle } from "./styles";
import { STYLE_KEYWORDS } from "./styles";

/** Mapping par défaut registre-marque → macro-style pièce. */
const REGISTRE_DEFAULT_STYLE: Record<BrandRegistre, MacroStyle> = {
  classique:        "academia",     // Brunello, Paul Smith, Suitable → tailored/academia
  minimaliste:      "minimaliste",  // COS, Lemaire, MUJI → clean/épuré
  streetwear:       "streetwear",   // Carhartt, Stüssy → urban/casual
  decontracte:      "minimaliste",  // MUJI basics → leans minimaliste
  avant_garde:      "edgy",         // Rick Owens, CDG → dark/avant-garde
  heritage_country: "country",      // Barbour, Burberry → tweed/heritage
  outdoor:          "sport",        // North Face, Arc'teryx → technical
  apres_ski:        "sport",        // Moon Boot → après-ski/sport
};

/**
 * Inférer le macro-style d'un produit depuis son nom + registre marque.
 * Priorité : 1. mot-clé dans le nom → 2. registre marque → 3. minimaliste (fallback).
 */
export function inferMacroStyle(
  productName: string,
  brandRegistre: BrandRegistre | undefined | null,
): MacroStyle {
  const name = productName.toLowerCase();

  /* 1. Détection par mots-clés du nom (plus fiable pour les cas extrêmes) */
  for (const [style, pattern] of Object.entries(STYLE_KEYWORDS) as [MacroStyle, RegExp][]) {
    if (pattern.test(name)) return style;
  }

  /* 2. Fallback sur le registre de la marque */
  if (brandRegistre && REGISTRE_DEFAULT_STYLE[brandRegistre]) {
    return REGISTRE_DEFAULT_STYLE[brandRegistre];
  }

  /* 3. Fallback absolu */
  return "minimaliste";
}
