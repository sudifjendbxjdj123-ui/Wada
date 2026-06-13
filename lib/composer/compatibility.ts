/**
 * lib/composer/compatibility.ts
 *
 * Matrice de compatibilité entre les 10 macro-styles.
 * 1.0 = même style · 0.8 = très compatible · 0.5 = avec précaution · 0.0 = JAMAIS
 */

import type { MacroStyle } from "./styles";

export const STYLE_COMPATIBILITY: Record<MacroStyle, Record<MacroStyle, number>> = {
  minimaliste: {
    minimaliste: 1.0, romantique: 0.8, streetwear: 0.5, boheme: 0.5,
    edgy: 0.5, academia: 0.8, country: 0.5, soiree: 0.7, plage: 0.7, sport: 0.3,
  },
  romantique: {
    minimaliste: 0.8, romantique: 1.0, streetwear: 0.3, boheme: 0.7,
    edgy: 0.0, academia: 0.7, country: 0.4, soiree: 0.8, plage: 0.6, sport: 0.0,
  },
  streetwear: {
    minimaliste: 0.5, romantique: 0.3, streetwear: 1.0, boheme: 0.3,
    edgy: 0.6, academia: 0.4, country: 0.5, soiree: 0.0, plage: 0.4, sport: 0.8,
  },
  boheme: {
    minimaliste: 0.5, romantique: 0.7, streetwear: 0.3, boheme: 1.0,
    edgy: 0.3, academia: 0.4, country: 0.7, soiree: 0.3, plage: 0.8, sport: 0.0,
  },
  edgy: {
    minimaliste: 0.5, romantique: 0.0, streetwear: 0.6, boheme: 0.3,
    edgy: 1.0, academia: 0.4, country: 0.5, soiree: 0.5, plage: 0.0, sport: 0.3,
  },
  academia: {
    minimaliste: 0.8, romantique: 0.7, streetwear: 0.4, boheme: 0.4,
    edgy: 0.4, academia: 1.0, country: 0.5, soiree: 0.5, plage: 0.0, sport: 0.0,
  },
  country: {
    minimaliste: 0.5, romantique: 0.4, streetwear: 0.5, boheme: 0.7,
    edgy: 0.5, academia: 0.5, country: 1.0, soiree: 0.0, plage: 0.4, sport: 0.3,
  },
  soiree: {
    minimaliste: 0.7, romantique: 0.8, streetwear: 0.0, boheme: 0.3,
    edgy: 0.5, academia: 0.5, country: 0.0, soiree: 1.0, plage: 0.0, sport: 0.0,
  },
  plage: {
    minimaliste: 0.7, romantique: 0.6, streetwear: 0.4, boheme: 0.8,
    edgy: 0.0, academia: 0.0, country: 0.4, soiree: 0.0, plage: 1.0, sport: 0.4,
  },
  sport: {
    minimaliste: 0.3, romantique: 0.0, streetwear: 0.8, boheme: 0.0,
    edgy: 0.3, academia: 0.0, country: 0.3, soiree: 0.0, plage: 0.4, sport: 1.0,
  },
};

/** Score moyen de compatibilité pour un ensemble de styles. */
export function macroCompatibilityScore(styles: MacroStyle[]): number {
  if (styles.length <= 1) return 1.0;
  let total = 0, pairs = 0;
  for (let i = 0; i < styles.length; i++) {
    for (let j = i + 1; j < styles.length; j++) {
      const score = STYLE_COMPATIBILITY[styles[i]]?.[styles[j]];
      if (typeof score === "number") {
        total += score;
        pairs++;
      }
    }
  }
  return pairs > 0 ? total / pairs : 1.0;
}

/** Paires de styles INTERDITES — kill-switch immédiat. */
export const FORBIDDEN_STYLE_PAIRS: Array<{ a: MacroStyle; b: MacroStyle; reason: string }> = [
  { a: "streetwear", b: "soiree",    reason: "Hoodie + paillettes : registres incompatibles" },
  { a: "romantique", b: "edgy",      reason: "Robe pastel + perfecto clouté : clash total" },
  { a: "sport",      b: "soiree",    reason: "Legging + satin : antinomique" },
  { a: "country",    b: "soiree",    reason: "Bottes cowboy + robe satin : ne va pas" },
  { a: "academia",   b: "plage",     reason: "Tweed + caftan : saisons opposées" },
  { a: "sport",      b: "romantique",reason: "Compression + dentelle : opposés" },
  { a: "sport",      b: "academia",  reason: "Leggings + tweed : ne va pas" },
  { a: "boheme",     b: "sport",     reason: "Robe longue + brassière sport" },
  { a: "edgy",       b: "plage",     reason: "Cuir lourd + lin estival" },
  { a: "country",    b: "romantique",reason: "Denim rugged + dentelle pastel : clash" },
];

/** Retourne null si OK, ou la raison du rejet si forbidden. */
export function checkForbiddenStyles(styles: MacroStyle[]): string | null {
  for (const { a, b, reason } of FORBIDDEN_STYLE_PAIRS) {
    if (styles.includes(a) && styles.includes(b)) return reason;
  }
  return null;
}
