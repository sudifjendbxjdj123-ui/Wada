/**
 * colorNames — source unique de noms de couleurs FR fidèles au hex.
 *
 * Brief 2026-05-22 §1A : « Nom de couleur ≠ couleur » (un vert nommé
 * « Or vieilli », un camel nommé « Crème »). Le bug venait du fait que
 * les palettes Wada utilisent des noms poétiques qui ne décrivent pas
 * toujours la couleur réelle du hex (« Crème » pour un camel #C9A14E).
 *
 * Ici on dérive le nom UNIQUEMENT depuis le hex (HSL → famille). Un
 * vert est toujours « vert/olive/sauge », un camel est toujours « camel ».
 *
 * À utiliser dans tous les modules qui affichent un nom de couleur :
 *   - lib/registreEngine.ts (slots du outfit composer)
 *   - lib/outfitComposer.ts (déjà la version locale, à remplacer)
 *   - app/ma-tenue/page.tsx (chips de pièces)
 *   - app/stylist/page.tsx (composed_outfit cards)
 */

/** Conversion hex → HSL. Renvoie h en 0-360, s/l en 0-1. */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

/**
 * Déduit un nom FR fidèle à partir d'un hex.
 *
 * Critères :
 *   - lightness < 0.12       → Noir
 *   - lightness < 0.22       → Anthracite
 *   - L > 0.92 & saturation faible → Blanc cassé
 *   - L > 0.82 & saturation faible → Crème
 *   - saturation < 0.14      → Gris perle / Gris ardoise
 *   - sinon : hue → famille colorée (orange/jaune/vert/bleu/rouge/prune)
 *     × lightness → ton (clair/profond)
 */
export function hexToPlainName(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (l < 0.12) return "Noir";
  // Anthracite : très foncé + peu saturé (couvre les gris/bruns sombres
  // type #3F3A35 qui sont perceptibles comme « anthracite », pas terracotta).
  if (l < 0.30 && s < 0.22) return "Anthracite";
  // Whites — tolère la chaleur (sneakers blanches = souvent warm white,
  // saturation jusqu'à 0.35 reste perçue blanc/crème).
  if (l > 0.92 && s < 0.35) return "Blanc cassé";
  if (l > 0.80 && s < 0.40) return "Crème";
  // Brief §1A : avant de tomber en « gris », on capture les pastels et
  // sages teintés (Sauge #A8B29A a s≈0.10 mais c'est PERCEPTIBLEMENT vert).
  // Si on est dans la plage verte/olive ET qu'il y a un soupçon de teinte
  // (s ≥ 0.07), on garde la couleur — pas gris.
  if (s < 0.08) return l > 0.55 ? "Gris perle" : "Gris ardoise";
  // Familles chromatiques par hue
  if (h >= 15 && h < 35)   return l > 0.55 ? "Sable" : l > 0.35 ? "Camel" : "Terracotta";
  if (h >= 35 && h < 48)   return l > 0.55 ? "Beige doré" : "Moutarde";
  if (h >= 48 && h < 95)   return l > 0.55 ? "Olive clair" : "Olive";
  if (h >= 95 && h < 170)  return l > 0.55 ? "Vert sauge" : "Vert profond";
  if (h >= 170 && h < 215) return l > 0.55 ? "Bleu pierre" : "Marine";
  if (h >= 215 && h < 260) return l > 0.55 ? "Bleu" : "Indigo";
  if (h >= 260 && h < 320) return "Prune";
  // 320-15 = rouge / bordeaux / rose pâle (selon lightness × saturation)
  // Rose : pâle et doux (high L, moderate S). Rouge : vif. Bordeaux : foncé.
  if (l > 0.65) return "Rose";
  return l > 0.5 ? "Rouge" : "Bordeaux";
}
