/**
 * lib/composer/paletteStyleMap.ts
 *
 * Mapping palette Sanzō Wada → styles compatibles/interdits.
 * 8 palettes concrètes (celles de la spec) + règles génériques pour les 340 restantes.
 *
 * Pour générer les 348 identités automatiquement : script GPT-4o (§ spec, $3-5 total).
 * Ce fichier est le fallback synchrone — pas de latence, pas de coût.
 */

import type { MacroStyle } from "./styles";

export interface PaletteStyleProfile {
  preferred: MacroStyle[];   // styles compatibles avec l'esprit de la palette
  forbidden: MacroStyle[];   // styles qui trahissent l'esprit de la palette
}

/** Mapping nom palette (lowercase, slugifié) → profil stylistique. */
const PALETTE_STYLE_MAP: Record<string, PaletteStyleProfile> = {
  "rosee-du-matin": {
    preferred: ["minimaliste", "boheme", "romantique"],
    forbidden: ["edgy", "soiree", "sport"],
  },
  "pluie-de-tokyo": {
    preferred: ["minimaliste", "academia", "edgy"],
    forbidden: ["plage", "romantique", "country"],
  },
  "bal-au-palais": {
    preferred: ["soiree", "romantique", "edgy"],
    forbidden: ["sport", "plage", "streetwear", "country"],
  },
  "osaka-au-the": {
    preferred: ["boheme", "minimaliste", "country"],
    forbidden: ["soiree", "sport", "streetwear"],
  },
  "sumi-e": {
    preferred: ["minimaliste", "edgy", "academia"],
    forbidden: ["plage", "soiree", "romantique", "country"],
  },
  "aube-sur-berlin": {
    preferred: ["minimaliste", "edgy", "academia"],
    forbidden: ["plage", "country", "romantique"],
  },
  "studio-danois": {
    preferred: ["minimaliste", "academia"],
    forbidden: ["edgy", "streetwear", "soiree", "plage", "sport"],
  },
  "jardin-de-kyoto": {
    preferred: ["academia", "minimaliste", "boheme"],
    forbidden: ["sport", "plage", "soiree"],
  },
  "lumiere-de-beyrouth": {
    preferred: ["academia", "minimaliste", "romantique"],
    forbidden: ["sport", "plage", "streetwear"],
  },
  "brume-du-matin": {
    preferred: ["minimaliste", "academia"],
    forbidden: ["soiree", "plage", "sport"],
  },
  "tweed-ombre": {
    preferred: ["academia", "country", "edgy"],
    forbidden: ["plage", "sport", "soiree"],
  },
  "rosee-matin": { // alias
    preferred: ["minimaliste", "boheme", "romantique"],
    forbidden: ["edgy", "soiree", "sport"],
  },
};

/** Slugifie un nom de palette pour le lookup. */
function slugPalette(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Retourne le profil stylistique d'une palette.
 * Si la palette n'est pas dans la map, retourne un profil générique
 * basé sur les couleurs dominantes (dérivé dans paletteIdentity.ts).
 */
export function getPaletteStyleProfile(paletteName: string): PaletteStyleProfile {
  const slug = slugPalette(paletteName);
  if (PALETTE_STYLE_MAP[slug]) return PALETTE_STYLE_MAP[slug];

  /* Fallback générique : toutes les palettes autorisent minimaliste + academia,
     interdisent sport/plage/soiree (qui nécessitent des indices clairs). */
  return {
    preferred: ["minimaliste", "academia", "country"],
    forbidden: ["sport", "plage", "soiree"],
  };
}
