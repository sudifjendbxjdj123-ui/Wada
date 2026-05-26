/**
 * colorDistance — distance perceptuelle entre couleurs (brief 2026-05-22 §4).
 *
 * Remplace l'ancien `colorDistance` RGB Euclidien (lib/data.ts) qui ne
 * reflétait pas la perception humaine — deux verts proches en hex pouvaient
 * sortir avec ΔRGB > 80 alors que l'œil les voit identiques.
 *
 * Pipeline :
 *   hex → sRGB linéarisé → XYZ (D65) → CIE Lab → ΔE CIEDE2000
 *
 * ΔE de référence (à connaître pour calibrer les seuils) :
 *   < 1   : indiscernable à l'œil nu
 *   1-2   : différence à peine perceptible
 *   2-10  : différence claire mais couleurs proches (ton-sur-ton)
 *   10-20 : différence évidente, même famille
 *   > 30  : couleurs distinctes
 *
 * Seuils brief §4 :
 *   ΔE ≤ 15 → match acceptable
 *   ΔE ≤ 25 → fallback élargi
 *   ΔE > 25 → afficher « teinte approchante » ou rien
 */

/* ──────────────────────────────────────────────────────────────────────
   CONVERSIONS — hex → sRGB → XYZ → Lab
   ────────────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** sRGB → linear RGB (decompression gamma). */
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** RGB linéarisé → XYZ (D65, sRGB working space). */
function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  // Matrice sRGB → XYZ (D65) standard
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;
  return [x * 100, y * 100, z * 100];
}

/** XYZ → CIE Lab. Référence blanc D65. */
function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const Xn = 95.047, Yn = 100.0, Zn = 108.883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(x / Xn);
  const fy = f(y / Yn);
  const fz = f(z / Zn);
  return [
    116 * fy - 16,         // L
    500 * (fx - fy),       // a
    200 * (fy - fz),       // b
  ];
}

/** Helper de bout-en-bout : hex → Lab. */
export function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/* ──────────────────────────────────────────────────────────────────────
   ΔE — CIEDE2000 (la meilleure formule perceptuelle disponible)
   ──────────────────────────────────────────────────────────────────────
   Implémentation suivant Sharma, Wu & Dalal 2005 — formule officielle
   recommandée par la CIE pour les distances couleur en industrie. */

export function deltaE2000(lab1: [number, number, number], lab2: [number, number, number]): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const kL = 1, kC = 1, kH = 1;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt((Cbar ** 7) / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const h1p = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
  const h2p = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
    else if (h2p - h1p > 180) dhp = h2p - h1p - 360;
    else dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * (Math.PI / 180));

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p) / 2;
  }

  const T = 1
    - 0.17 * Math.cos(((hbarp - 30) * Math.PI) / 180)
    + 0.24 * Math.cos(((2 * hbarp) * Math.PI) / 180)
    + 0.32 * Math.cos(((3 * hbarp + 6) * Math.PI) / 180)
    - 0.20 * Math.cos(((4 * hbarp - 63) * Math.PI) / 180);
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt((Cbarp ** 7) / (Cbarp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin((2 * dTheta * Math.PI) / 180) * Rc;

  return Math.sqrt(
    (dLp / (kL * Sl)) ** 2
    + (dCp / (kC * Sc)) ** 2
    + (dHp / (kH * Sh)) ** 2
    + Rt * (dCp / (kC * Sc)) * (dHp / (kH * Sh))
  );
}

/** Helper : ΔE entre deux hex directement. */
export function deltaEHex(h1: string, h2: string): number {
  return deltaE2000(hexToLab(h1), hexToLab(h2));
}

/* ──────────────────────────────────────────────────────────────────────
   SEUILS — utilisés par le matching produit (brief §4)
   ────────────────────────────────────────────────────────────────────── */

export const DELTA_E_TIGHT = 15;   // match strict (couleur fidèle)
export const DELTA_E_LOOSE = 25;   // fallback élargi (teinte proche)

/** Catégorise une distance ΔE en niveau de match (UI badge). */
export type ColorMatchLevel = "exact" | "proche" | "approchant" | "different";
export function colorMatchLevel(dE: number): ColorMatchLevel {
  if (dE < 5) return "exact";
  if (dE <= DELTA_E_TIGHT) return "proche";
  if (dE <= DELTA_E_LOOSE) return "approchant";
  return "different";
}
