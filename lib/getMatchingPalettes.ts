import { dictionaryMinimal } from "@/lib/data-client";
import { deltaEHex, DELTA_E_LOOSE } from "@/lib/colorDistance";

export interface MatchPalette {
  number: string;
  name: string;
  swatch: string;
  colors: string[];
  culture?: string;
}

const _paletteMatchCache = new Map<string, MatchPalette[]>();

export function getMatchingPalettes(hex?: string): MatchPalette[] {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return [];
  const cached = _paletteMatchCache.get(hex);
  if (cached) return cached;
  const matches: Array<MatchPalette & { dE: number }> = [];
  for (const pal of dictionaryMinimal) {
    let best = Infinity;
    let bestHex = pal.colors[0]?.hex || "#999";
    for (const c of pal.colors) {
      const dE = deltaEHex(hex, c.hex);
      if (dE < best) {
        best = dE;
        bestHex = c.hex;
      }
    }
    if (best < DELTA_E_LOOSE) {
      matches.push({
        number: pal.number,
        name: pal.name,
        swatch: bestHex,
        colors: pal.colors.map((c) => c.hex),
        culture: pal.culture,
        dE: best,
      });
    }
  }
  matches.sort((a, b) => a.dE - b.dE);
  const result = matches.map(({ number, name, swatch, colors, culture }) => ({
    number,
    name,
    swatch,
    colors,
    culture,
  }));
  _paletteMatchCache.set(hex, result);
  return result;
}
