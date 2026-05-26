import type { DictionaryEntry } from "./data";

/**
 * Génère un code de référence WADA depuis un hex.
 *
 * Brief P0 confiance (28/05) + brief « Remplacer PANTONE » (25/05) :
 * On n'utilise plus le préfixe « PANTONE® … TCX » (marque déposée + codes
 * inventés qu'on n'a pas le droit d'attribuer). À la place, code maison
 * « WADA XX-XXXX-XXXX » qui suit la même structure visuelle (rassurante,
 * « scientifique ») mais clairement de notre identité.
 *
 * Cette fonction est l'implémentation de référence — TOUS les composants
 * qui affichent une référence couleur doivent l'utiliser au lieu d'inline.
 *
 * Exemple : "#D4B888" → "WADA 212-0184-1853"
 */
export function wadaRefCode(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const block1 = `${r.toString().padStart(2, "0")}-${g.toString().padStart(4, "0").slice(0, 4)}`;
  const block2 = `${(g * 100 + b).toString().slice(0, 4).padStart(4, "0")}`;
  return `WADA ${block1}-${block2}`;
}

/**
 * Find the closest matching color in a palette for a given clothing item.
 * Looks for the first color whose first word appears in the item description.
 * Falls back to the palette's primary (first) color when nothing matches.
 */
export function pickColorForItem(
  item: string,
  colors: DictionaryEntry["colors"],
): DictionaryEntry["colors"][number] {
  const lc = item.toLowerCase();
  return (
    colors.find((c) => lc.includes(c.name.toLowerCase().split(" ")[0])) ||
    colors[0]
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Genre — classification heuristique d'une palette à partir de sa composition.
   ────────────────────────────────────────────────────────────────────── */

const FEMME_KEYWORDS = /robe|jupe|escarpin|ballerine|talon|blouse fine|maillot|bralette|brassiere|kebaya|sari|huipil|abaya|kebaya|caftan|kaftan|cheongsam|qipao|wrap dress|dress\b|pump\b/i;
const HOMME_KEYWORDS = /costume trois-pieces|cravate|noeud papillon|smoking|sherwani|guayabera|thawb|dashiki|kurta\b|hakama|chinos homme|polo homme/i;

export type Gender = "femme" | "homme" | "unisexe";

export function paletteGender(composition: { item: string }[]): Gender {
  const text = composition.map((c) => c.item).join(" ");
  const fem = FEMME_KEYWORDS.test(text);
  const masc = HOMME_KEYWORDS.test(text);
  if (fem && !masc) return "femme";
  if (masc && !fem) return "homme";
  return "unisexe";
}

/** Translate an internal piece slug (Top, Bottom…) to its French label. */
export const pieceLabelFr: Record<string, string> = {
  Top: "Haut",
  Bottom: "Bas",
  Outer: "Veste",
  Shoes: "Chaussures",
  Accent: "Accent",
  Shirt: "Chemise",
};

/* ──────────────────────────────────────────────────────────────────────
   Normalisation des couleurs poétiques Sanzo Wada → couleurs e-commerce courantes.
   Les marchands taggent leurs produits avec des couleurs basiques (rouge, bleu, vert)
   — pas avec les noms du dictionnaire (vermillon, carmin, indigo, prussien).
   Cette table mappe chaque couleur Wada vers sa famille commune pour maximiser
   le hit rate sur les recherches site:.
   ────────────────────────────────────────────────────────────────────── */

const COLOR_NORMALIZE: Record<string, string> = {
  // Rouges
  vermillon: "rouge", carmin: "rouge", garance: "rouge", cinabre: "rouge",
  ecarlate: "rouge", rubicond: "rouge", grenat: "rouge", brique: "rouge",
  rouge: "rouge",
  // Rose / Magenta
  magenta: "rose", fuchsia: "rose", framboise: "rose", cerise: "rose",
  rose: "rose", saumon: "saumon", corail: "corail", peche: "rose",
  // Pourpre / Bordeaux
  pourpre: "bordeaux", bordeaux: "bordeaux", vinasse: "bordeaux",
  // Violet / Mauve
  mauve: "violet", prune: "violet", aubergine: "violet", lilas: "violet",
  parme: "violet", violet: "violet", amethyste: "violet", lavande: "lavande",
  // Orange / Terracotta
  terracotta: "terracotta", terre: "terracotta", ocre: "moutarde",
  safran: "moutarde", moutarde: "moutarde", curcuma: "moutarde",
  abricot: "orange", mandarine: "orange", orange: "orange",
  cuivre: "cuivre", bronze: "cuivre",
  // Jaune
  jonquille: "jaune", citron: "jaune", paille: "jaune",
  jaune: "jaune", canari: "jaune", ambre: "jaune",
  // Vert
  celadon: "vert", pistache: "vert", absinthe: "vert", menthe: "menthe",
  emeraude: "vert", jade: "vert", sapin: "vert", mousse: "vert",
  bouteille: "vert", olive: "kaki", kaki: "kaki", vert: "vert",
  // Bleu
  indigo: "marine", prussien: "marine", marine: "marine", cobalt: "bleu",
  azur: "bleu", ciel: "bleu", saphir: "bleu", denim: "bleu", bleu: "bleu",
  turquoise: "turquoise", canard: "petrole", petrole: "petrole",
  // Marron
  sienne: "marron", tabac: "marron", cacao: "marron", caramel: "marron",
  noisette: "marron", chataigne: "marron", chocolat: "marron", marron: "marron",
  havane: "marron", bistre: "marron",
  // Beige / Crème
  chamois: "beige", sable: "beige", ivoire: "ivoire", creme: "creme",
  ecru: "ecru", beige: "beige", lin: "beige", coquille: "beige",
  champagne: "champagne",
  // Gris
  anthracite: "gris", ardoise: "gris", taupe: "taupe", gris: "gris",
  argent: "argent", platine: "argent",
  // Noir / Blanc
  ebene: "noir", jais: "noir", noir: "noir",
  blanc: "blanc",
};

/**
 * Normalise un nom de couleur poétique (Sanzo Wada) en couleur e-commerce courante.
 * Si la couleur n'est pas mappée, retourne le premier mot tel quel.
 *   "Vermillon"      → "rouge"
 *   "Indigo"         → "marine"
 *   "Pistache"       → "vert"
 *   "Bleu de Prusse" → "marine" (premier mot mappé)
 *   "Terracotta"     → "terracotta" (déjà commun)
 */
export function normalizeColorName(colorName?: string): string {
  if (!colorName) return "";
  const first = colorName.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/\s+/)[0];
  return COLOR_NORMALIZE[first] || first;
}

/** Liste des pièces — ordre = priorité (plus spécifiques d'abord). */
export const PIECE_KEYWORDS = [
  "sneakers", "baskets", "loafers", "mocassins", "oxford", "derbies", "brogues",
  "chelsea", "bottines", "boots", "bottes", "espadrilles", "sandales",
  "ballerines", "escarpins", "mules", "tongs", "geta", "richelieu",
  "tennis", "runners",
  "tshirt", "t-shirt", "polo", "henley", "tank", "debardeur",
  "pull", "sweat", "hoodie", "cardigan", "gilet",
  "chemise", "blouse", "marinière", "mariniere",
  "robe",
  "trench", "manteau", "blazer", "veste", "doudoune", "caban", "kimono", "teddy",
  "jean", "jeans", "pantalon", "chinos", "cargo", "short", "bermuda",
  "jupe",
  "legging", "jogging", "joggers",
  "echarpe", "écharpe", "foulard", "chapeau", "casquette", "beret", "bonnet",
  "sac", "cabas", "pochette", "ceinture",
  "lunettes", "montre", "cravate",
];

/** Extrait le mot-clé pièce d'un item textuel. */
export function extractPiece(item: string): string {
  const lc = item.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const w of PIECE_KEYWORDS) {
    const stripped = w.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (lc.includes(stripped)) return w;
  }
  return item.split(/\s+/)[0].toLowerCase();
}

/**
 * Construit une requête shopping COURTE + COMMUNE :
 *   "Pull lambswool bordeaux"     → "pull bordeaux"
 *   "Mocassins suède vermillon"   → "mocassins rouge"  (vermillon → rouge)
 *   "Chemise oxford indigo"       → "chemise marine"   (indigo → marine)
 *   "Sneakers cuir blanc minimal" → "sneakers blanc"
 *
 * Le pari : les marchands taggent leurs produits avec des couleurs courantes.
 * "rouge" matche beaucoup plus de produits que "vermillon" ou "carmin".
 * La couleur poétique reste affichée dans le hero éditorial — ici on cherche
 * juste à maximiser le hit rate des liens site:.
 */
export function smartQuery(item: string, colorName?: string): string {
  const piece = extractPiece(item);
  const color = normalizeColorName(colorName);
  return color ? `${piece} ${color}` : piece;
}

/** Variante qui garde la couleur poétique d'origine (pour affichage éditorial). */
export function smartQueryPoetic(item: string, colorName?: string): string {
  const piece = extractPiece(item);
  const color = colorName
    ? colorName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/)[0]
    : "";
  return color ? `${piece} ${color}` : piece;
}

/** ISO-week-of-year — used by Découverte rotation. */
export function getWeekOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = (d.getTime() - start.getTime()) / 86_400_000;
  return Math.floor((diff + start.getDay() + 1) / 7);
}

/** Pure deterministic hash — used to pick a daily palette. */
export function dateSeed(d: Date = new Date()): number {
  return d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/* ──────────────────────────────────────────────────────────────────────
   Manipulation de couleurs — ton-sur-ton
   ────────────────────────────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function darken(hex: string, amount = 0.18): string {
  const [r, g, b] = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lighten(hex: string, amount = 0.18): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

export function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.5;
}

export function accentOf(hex: string, amount = 0.18): string {
  return isDark(hex) ? lighten(hex, amount * 1.4) : darken(hex, amount);
}

/* ──────────────────────────────────────────────────────────────────────
   AVATAR VARIATIONS — variété déterministe pour OutfitAvatar
   ─────────────────────────────────────────────────────────────────────
   Chaque palette tire toujours le MÊME avatar (cohérence d'expérience),
   mais le pool d'avatars est varié (différentes coupes, teintes de peau,
   morphologies) pour éviter le "tous les mêmes" dans une grille.
   ────────────────────────────────────────────────────────────────────── */

export type HairStyleVariation = "short" | "mid" | "curly" | "long";
export type SkinToneVariation  = "light" | "medium" | "tan" | "dark";
export type MorphologyVariation = "slim" | "athletic" | "feminine";

const HAIR_POOL: HairStyleVariation[] = ["short", "mid", "curly", "long"];
const SKIN_POOL: SkinToneVariation[]  = ["light", "medium", "tan", "dark"];

/**
 * Hint de teintes de peau plausibles par culture — pas une assignation
 * forcée (chaque culture contient toutes les peaux), juste un biais de
 * représentation cohérent avec l'origine éditoriale de la palette.
 */
const CULTURE_SKIN_HINT: Record<string, SkinToneVariation[]> = {
  african:        ["dark", "tan"],
  indian:         ["tan", "medium", "dark"],
  moroccan:       ["tan", "medium"],
  mexican:        ["tan", "medium"],
  "south-american": ["tan", "medium"],
  cuban:          ["tan", "medium"],
  japanese:       ["light", "medium"],
  asian:          ["light", "medium"],
  ottoman:        ["tan", "medium"],
  english:        ["light", "medium"],
  french:         ["light", "medium"],
  italian:        ["medium", "tan"],
  scandinavian:   ["light"],
  austrian:       ["light"],
  german:         ["light"],
  portuguese:     ["medium", "light"],
  russian:        ["light"],
  american:       ["light", "medium", "tan", "dark"],
  australian:     ["tan", "light"],
  dutch:          ["light"],
  international:  ["light", "medium", "tan", "dark"],
};

/** Hash stable d'une chaîne (djb2-ish). */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

/**
 * Renvoie une variation d'avatar pour une palette : cheveux, peau,
 * morphologie. Déterministe (même palette → même avatar), mais varié
 * d'une palette à l'autre.
 *
 *  - hairStyle : 4 variantes cyclées sur le hash du numéro
 *  - skinTone  : guidé par la culture si dispo, sinon cyclé sur les 4 tons
 *  - morphology : déduit de la composition (robe/jupe → feminine,
 *                 costume/blazer → athletic, sinon slim)
 */
export function avatarVariationFor(entry: {
  number: string;
  culture?: string;
  composition: { item: string }[];
}): {
  hairStyle: HairStyleVariation;
  skinTone: SkinToneVariation;
  morphology: MorphologyVariation;
} {
  const h = hashStr(entry.number);

  const hairStyle = HAIR_POOL[h % HAIR_POOL.length];

  const composition = entry.composition.map((c) => c.item.toLowerCase()).join(" ");
  let morphology: MorphologyVariation = "slim";
  if (/\brobe\b|jupe|kimono|sari|kurta|caftan|huipil|tunique|abaya/.test(composition)) {
    morphology = "feminine";
  } else if (/\bblazer\b|costume|veston|tailleur|smoking|3-pièces|trois-pièces/.test(composition)) {
    morphology = "athletic";
  }

  let skinTone: SkinToneVariation = SKIN_POOL[h % SKIN_POOL.length];
  if (entry.culture) {
    const hints = CULTURE_SKIN_HINT[entry.culture];
    if (hints && hints.length > 0) skinTone = hints[h % hints.length];
  }

  return { hairStyle, skinTone, morphology };
}
