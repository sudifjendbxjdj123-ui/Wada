/**
 * seasonDetect — détermine la saisonnalité d'un produit depuis son nom +
 * description. Sert au composer pour ne pas proposer du cachemire en
 * juillet ou du lin en décembre.
 *
 * Brief 2026-05-30 « logique de composition tenue cohérente » §3 :
 *   Hiver (Nov-Mars) → laine, cachemire, mohair, cuir épais, denim épais.
 *                      PAS de lin, soie, popeline fine.
 *   Été  (Juin-Août) → coton léger, lin, soie. PAS de laine, cachemire,
 *                      denim épais.
 *   Mi-saison        → coton, laine légère, denim, jersey. Polyvalent.
 *
 * On infère la saison via patterns sur le nom + description du produit.
 * Si rien ne matche → "any" (polyvalent, ne sera pas filtré).
 */

export type Season = "hiver" | "été" | "automne" | "printemps" | "any";

/** Matières et coupes typiques d'hiver. */
const WINTER_PATTERNS = /\b(cashmere|cachemire|mohair|wool|laine|alpaca|alpaga|tweed|flannel|flanelle|sherpa|fleece|polaire|teddy|shearling|merino|m[ée]rinos|down|duvet|puffer|doudoune|parka|peacoat|caban|overcoat|manteau|trench|coat\s+long|knit\s+heavy|gros\s+pull|maille\s+\épaisse|corduroy|velours\s+c[ô]tel|leather\s+(jacket|coat|boots?))/i;

/** Matières et coupes typiques d'été. */
const SUMMER_PATTERNS = /\b(linen|lin\b|seersucker|chambray|popeline|poplin|silk|soie|gauze|gaze|cotton\s+light|coton\s+l[ée]ger|tencel|lyocell|short|bermuda|sandals?|sandales|tongs?|espadrilles?|swim|maillot|tank|d[ée]bardeur|breath|a[ée]r[ée])/i;

/** Marqueurs explicites « pour l'hiver » / « pour l'été » dans nom/desc. */
const WINTER_EXPLICIT = /\b(winter|hiver|cold|froid|warm|chaud|thermal|insulated)/i;
const SUMMER_EXPLICIT = /\b(summer|[ée]t[ée]|hot|warm\s+weather|beach|plage|tropical|breathable)/i;

/** Détermine la saison principale d'un produit. */
export function detectSeason(name: string, description: string = ""): Season {
  const hay = `${name} ${description}`.toLowerCase();

  /* Priorité aux marqueurs explicites (rares mais sûrs). */
  if (WINTER_EXPLICIT.test(hay)) return "hiver";
  if (SUMMER_EXPLICIT.test(hay)) return "été";

  /* Matières hiver. */
  if (WINTER_PATTERNS.test(hay)) return "hiver";

  /* Matières été. */
  if (SUMMER_PATTERNS.test(hay)) return "été";

  /* Sinon, polyvalent (jersey, coton standard, denim moyen…). */
  return "any";
}

/**
 * Vérifie si une saison produit est compatible avec une saison palette.
 * Règles :
 *   - any est compatible avec tout
 *   - hiver matche hiver + automne
 *   - été matche été + printemps
 *   - automne/printemps matchent leur saison + any
 */
export function isSeasonCompatible(productSeason: Season, paletteSeasons: string[]): boolean {
  if (productSeason === "any") return true;
  if (!paletteSeasons || paletteSeasons.length === 0) return true; // pas de saison palette → pas de filtre

  /* Normalise les seasons palette (lowercase, retire accents). */
  const norm = paletteSeasons.map((s) => s.toLowerCase().trim());

  if (productSeason === "hiver") {
    /* Un produit hiver est OK pour palette hiver ou automne. Refusé en
       palette été pure (« été » sans autre saison). */
    return norm.includes("hiver") || norm.includes("automne");
  }
  if (productSeason === "été") {
    return norm.includes("été") || norm.includes("printemps");
  }
  /* automne / printemps : tolérants. */
  return norm.includes(productSeason) || norm.includes("any");
}
