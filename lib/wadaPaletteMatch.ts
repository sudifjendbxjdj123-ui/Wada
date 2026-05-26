/**
 * wadaPaletteMatch — trouve l'accord Sanzo Wada le plus proche d'un hex.
 *
 * Brief 2026-05-27 Muji integration :
 *   À l'ingestion d'un produit (couleur du marchand → hex), on cherche
 *   parmi les 348 accords du dictionnaire celui dont une des couleurs est
 *   la plus PROCHE en perception (ΔE2000 en Lab). Stocké sur le produit
 *   comme `paletteRef` (« 094 ») + `paletteDistance` (1.8) pour :
 *     - le filtre « les pièces qui vont avec cet accord »
 *     - le matching de l'assistant IA (couleur → tenue + produits réels)
 *     - les recommandations « visuellement similaires »
 *
 * Performances : on pré-calcule les Lab des couleurs du dictionnaire une
 * seule fois au chargement (memo). À 348 palettes × 3-4 couleurs ≈ 1200
 * comparaisons par produit, c'est ~1 ms sur Node moderne. Acceptable pour
 * l'ingestion d'un flux de ~3 700 lignes (3-4 secondes total).
 */

import { dictionary } from "./data";
import { hexToLab, deltaE2000 } from "./colorDistance";

interface PaletteColorRef {
  number: string;
  hex: string;
  lab: [number, number, number];
}

/* Cache des Lab pré-calculés pour toutes les couleurs du dictionnaire.
   Lazy init au premier appel (évite le coût au boot quand la fonction n'est
   pas utilisée). */
let _cache: PaletteColorRef[] | null = null;

function loadCache(): PaletteColorRef[] {
  if (_cache) return _cache;
  const out: PaletteColorRef[] = [];
  for (const entry of dictionary) {
    for (const c of entry.colors) {
      out.push({
        number: entry.number,
        hex: c.hex,
        lab: hexToLab(c.hex),
      });
    }
  }
  _cache = out;
  return out;
}

/**
 * Retourne la palette Sanzo Wada la plus proche d'un hex donné.
 *
 * @param hex - couleur du produit, ex. « #4A6B82 »
 * @returns { paletteRef, distance } ou null si hex invalide.
 *   - paletteRef : numéro de palette (« 094 »)
 *   - distance   : ΔE2000 à la couleur la plus proche
 *
 * Convention d'usage :
 *   - distance < 15 → match strict, on peut écrire « la teinte exacte
 *     de Vert Olive » dans l'UI
 *   - 15-25 → approchant, « teinte proche de Vert Olive »
 *   - > 25 → éloigné, on évite d'afficher l'accord (ou on prévient)
 */
export function nearestWadaPalette(hex: string): { paletteRef: string; distance: number } | null {
  if (!/^#?[0-9a-f]{6}$/i.test(hex.trim())) return null;
  const cache = loadCache();
  if (cache.length === 0) return null;

  const lab = hexToLab(hex);
  let bestRef = cache[0].number;
  let bestDist = deltaE2000(lab, cache[0].lab);

  for (let i = 1; i < cache.length; i++) {
    const d = deltaE2000(lab, cache[i].lab);
    if (d < bestDist) {
      bestDist = d;
      bestRef = cache[i].number;
    }
  }

  return { paletteRef: bestRef, distance: bestDist };
}
