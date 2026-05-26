/* ════════════════════════════════════════════════════════════════════════
   WADA — Catalogue de garments (1000 entrées générées par combinatoire)
   ──────────────────────────────────────────────────────────────────────
   Chaque entrée est UNE variante précise d'une pièce : type × coupe ×
   matière × couleur × style × genre. La table est générée une fois au
   chargement, avec des IDs stables — on peut donc l'utiliser pour des
   liens directs (/garment/427), des filtres avancés, etc.
   ──────────────────────────────────────────────────────────────────────
   La forme du nom canonique : "{type}_{cut}_{material}_{color}_{style}".
   Exemple : "tshirt_oversize_linen_ecru_minimaliste"
   Les champs cut / material / style peuvent être absents quand non
   pertinents (par exemple une bague n'a pas de coupe).
   ════════════════════════════════════════════════════════════════════ */

export type GarmentCategory = "tops" | "bottoms" | "outerwear" | "shoes" | "accessories";

export type Cut =
  | "regular" | "oversize" | "slim" | "fitted" | "crop"
  | "wide" | "long" | "short" | "midi" | "mini" | "maxi" | "tailored" | "zip";

export type Material =
  | "cotton" | "linen" | "wool" | "cashmere" | "denim" | "leather" | "silk"
  | "fleece" | "polyester" | "nylon" | "velvet" | "satin" | "tweed" | "knit";

export type Style =
  | "minimaliste" | "streetwear" | "chic" | "casual" | "formel"
  | "estival" | "hivernal" | "y2k" | "préppy" | "biker"
  | "luxe-discret" | "classique" | "soirée" | "sport"
  | "bohème" | "vintage" | "bourgeoisie" | "romantique";

export type Gender = "femme" | "homme" | "unisexe";

export interface Garment {
  id: number;
  /** Slug canonique unique : tshirt_oversize_linen_ecru_minimaliste */
  slug: string;
  /** Label éditorial français : "T-shirt oversize en lin écru" */
  label: string;
  category: GarmentCategory;
  /** Slug du PieceIcon correspondant — assure le rendu visuel cohérent. */
  type: string;
  cut?: Cut;
  material?: Material;
  color: { name: string; hex: string };
  style?: Style;
  gender: Gender;
}

/* ─── PALETTE ÉDITORIALE WADA ──────────────────────────────────────── */
const PALETTE: { name: string; hex: string }[] = [
  { name: "noir",          hex: "#1F1B16" },
  { name: "écru",          hex: "#E8DFD0" },
  { name: "blanc",         hex: "#F4EFE6" },
  { name: "beige",         hex: "#D9C9A8" },
  { name: "camel",         hex: "#B8946A" },
  { name: "gris ardoise",  hex: "#3A4555" },
  { name: "marine",        hex: "#1B2840" },
  { name: "indigo délavé", hex: "#3A4F6B" },
  { name: "bordeaux",      hex: "#5C2018" },
  { name: "olive",         hex: "#5C5A3C" },
  { name: "moutarde",      hex: "#C9A24A" },
  { name: "terracotta",    hex: "#A8624A" },
  { name: "sauge",         hex: "#7A8F73" },
  { name: "rose poudré",   hex: "#E8C9C5" },
  { name: "prune",         hex: "#3D1A2C" },
];

/* ─── HELPERS ──────────────────────────────────────────────────────── */
const cutLabelFr: Record<Cut, string> = {
  regular: "", oversize: "oversize", slim: "slim", fitted: "ajusté",
  crop: "court", wide: "ample", long: "long", short: "court",
  midi: "midi", mini: "mini", maxi: "maxi", tailored: "taillé",
  zip: "zippé",
};
const matLabelFr: Record<Material, string> = {
  cotton: "coton", linen: "lin", wool: "laine", cashmere: "cachemire",
  denim: "denim", leather: "cuir", silk: "soie", fleece: "molleton",
  polyester: "polyester", nylon: "nylon", velvet: "velours",
  satin: "satin", tweed: "tweed", knit: "maille",
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

interface Spec {
  type: string;
  base: string;        // label de base : "T-shirt"
  cuts: Cut[];
  materials: Material[];
  styles: Style[];
  genders: Gender[];
  colorIndices?: number[]; // sous-ensemble de PALETTE, sinon les 8 premiers
}

/* ─── TOPS — ~330 garments ─────────────────────────────────────────── */
const TOPS: Spec[] = [
  { type: "tshirt",     base: "T-shirt",      cuts: ["regular", "oversize", "slim", "crop"], materials: ["cotton", "linen"],         styles: ["minimaliste", "streetwear", "casual"],    genders: ["femme", "homme", "unisexe"], colorIndices: [0,1,2,3,8,11] },
  { type: "polo",       base: "Polo",         cuts: ["regular", "fitted"],                  materials: ["cotton", "knit"],          styles: ["préppy", "casual"],                       genders: ["femme", "homme"],            colorIndices: [1,3,4,8,11,13] },
  { type: "henley",     base: "Henley",       cuts: ["regular", "fitted"],                  materials: ["cotton"],                  styles: ["casual"],                                  genders: ["femme", "homme"],            colorIndices: [0,1,3,5,8] },
  { type: "tank",       base: "Débardeur",    cuts: ["regular", "crop"],                    materials: ["cotton", "silk"],          styles: ["estival", "y2k", "minimaliste"],          genders: ["femme"],                     colorIndices: [0,1,2,8,13] },
  { type: "shirt",      base: "Chemise",      cuts: ["regular", "oversize", "fitted"],      materials: ["cotton", "linen", "silk"], styles: ["formel", "casual", "bourgeoisie"],         genders: ["femme", "homme", "unisexe"], colorIndices: [1,2,3,7,8,9] },
  { type: "blouse",     base: "Blouse",       cuts: ["regular", "oversize"],                materials: ["silk", "linen", "cotton"], styles: ["romantique", "chic"],                      genders: ["femme"],                     colorIndices: [1,2,8,11,13,14] },
  { type: "crewneck",   base: "Pull col rond",cuts: ["regular", "oversize"],                materials: ["wool", "cashmere", "knit"],styles: ["bourgeoisie", "minimaliste", "luxe-discret"], genders: ["femme", "homme", "unisexe"], colorIndices: [0,3,4,5,8,11,12,13] },
  { type: "turtleneck", base: "Pull col roulé",cuts: ["regular", "fitted"],                 materials: ["wool", "cashmere"],        styles: ["chic", "minimaliste", "luxe-discret"],     genders: ["femme", "homme", "unisexe"], colorIndices: [0,2,3,5,7,8,11] },
  { type: "cardigan",   base: "Cardigan",     cuts: ["regular", "oversize"],                materials: ["wool", "knit", "cashmere"],styles: ["bourgeoisie", "vintage", "préppy"],        genders: ["femme", "homme"],            colorIndices: [3,5,8,9,11,12,13] },
  { type: "hoodie",     base: "Hoodie",       cuts: ["regular", "oversize", "zip"],         materials: ["fleece", "cotton"],        styles: ["streetwear", "casual", "sport"],          genders: ["unisexe"],                   colorIndices: [0,2,5,7,8,11] },
  { type: "sweatshirt", base: "Sweat",        cuts: ["regular", "oversize"],                materials: ["fleece", "cotton"],        styles: ["streetwear", "casual"],                    genders: ["unisexe"],                   colorIndices: [0,2,3,5,8,11,13] },
];

/* ─── BOTTOMS — ~250 garments ──────────────────────────────────────── */
const BOTTOMS: Spec[] = [
  { type: "trousers",       base: "Pantalon",          cuts: ["regular", "slim", "wide", "tailored"], materials: ["wool", "cotton", "linen"], styles: ["formel", "minimaliste", "bourgeoisie"], genders: ["femme", "homme", "unisexe"], colorIndices: [0,3,5,7,9,11] },
  { type: "jeans",          base: "Jean",              cuts: ["slim", "wide", "regular"],            materials: ["denim"],                   styles: ["casual", "streetwear", "vintage"],     genders: ["femme", "homme", "unisexe"], colorIndices: [0,7] },
  { type: "joggers",        base: "Jogging",           cuts: ["regular", "slim"],                    materials: ["fleece", "cotton"],        styles: ["sport", "streetwear", "casual"],       genders: ["unisexe"],                   colorIndices: [0,2,3,5,7,8] },
  { type: "shorts",         base: "Short",             cuts: ["regular", "short"],                   materials: ["cotton", "linen"],         styles: ["estival", "casual", "sport"],          genders: ["femme", "homme", "unisexe"], colorIndices: [0,1,3,4,9,11] },
  { type: "skirt",          base: "Jupe",              cuts: ["midi", "mini", "maxi"],               materials: ["cotton", "wool"],          styles: ["chic", "y2k", "bohème"],               genders: ["femme"],                     colorIndices: [0,3,4,8,11,13] },
  { type: "skirt-pleated",  base: "Jupe plissée",      cuts: ["midi", "mini"],                       materials: ["polyester", "wool"],       styles: ["préppy", "y2k"],                       genders: ["femme"],                     colorIndices: [0,3,5,8] },
];

/* ─── OUTERWEAR — ~150 garments ─────────────────────────────────────── */
const OUTERWEAR: Spec[] = [
  { type: "blazer",         base: "Blazer",          cuts: ["regular", "tailored", "oversize"], materials: ["wool", "tweed", "linen"], styles: ["formel", "bourgeoisie", "chic"],          genders: ["femme", "homme", "unisexe"], colorIndices: [0,3,5,7,8,9] },
  { type: "coat",           base: "Manteau",         cuts: ["long", "regular"],                 materials: ["wool", "cashmere"],       styles: ["chic", "luxe-discret"],                   genders: ["femme", "homme", "unisexe"], colorIndices: [0,3,4,5,7,8] },
  { type: "trench",         base: "Trench",          cuts: ["regular", "long"],                 materials: ["cotton"],                 styles: ["classique", "bourgeoisie"],               genders: ["femme", "homme", "unisexe"], colorIndices: [3,4,5] },
  { type: "peacoat",        base: "Caban",           cuts: ["regular"],                         materials: ["wool"],                   styles: ["classique", "vintage"],                   genders: ["femme", "homme", "unisexe"], colorIndices: [0,5,6,7] },
  { type: "puffer",         base: "Doudoune",        cuts: ["short", "long"],                   materials: ["nylon"],                  styles: ["hivernal", "sport", "streetwear"],         genders: ["unisexe"],                   colorIndices: [0,2,5,8,12] },
  { type: "leather-jacket", base: "Veste cuir",      cuts: ["regular", "fitted"],               materials: ["leather"],                styles: ["biker", "vintage", "streetwear"],         genders: ["femme", "homme", "unisexe"], colorIndices: [0,8] },
  { type: "denim-jacket",   base: "Veste denim",     cuts: ["regular", "oversize"],             materials: ["denim"],                  styles: ["casual", "vintage"],                       genders: ["femme", "homme", "unisexe"], colorIndices: [7] },
  { type: "chorecoat",      base: "Chore coat",      cuts: ["regular"],                         materials: ["cotton"],                 styles: ["vintage", "casual"],                       genders: ["femme", "homme", "unisexe"], colorIndices: [4,5,7,9,11] },
];

/* ─── SHOES — ~130 garments ─────────────────────────────────────────── */
const SHOES: Spec[] = [
  { type: "sneaker",         base: "Sneakers",          cuts: ["regular"],     materials: ["leather"], styles: ["casual", "minimaliste", "streetwear"],   genders: ["unisexe"], colorIndices: [0,1,2,3,5] },
  { type: "sneaker-chunky",  base: "Sneakers chunky",   cuts: ["regular"],     materials: ["leather"], styles: ["streetwear", "y2k"],                      genders: ["unisexe"], colorIndices: [0,2,5,7,8] },
  { type: "loafer",          base: "Mocassins",         cuts: ["regular"],     materials: ["leather"], styles: ["bourgeoisie", "préppy", "vintage"],       genders: ["femme", "homme"], colorIndices: [0,4,8,9] },
  { type: "oxford",          base: "Oxford",            cuts: ["regular"],     materials: ["leather"], styles: ["formel", "classique"],                    genders: ["femme", "homme"], colorIndices: [0,8,9] },
  { type: "boot",            base: "Bottes",            cuts: ["long", "regular"], materials: ["leather"], styles: ["chic", "biker", "vintage"],          genders: ["femme", "homme", "unisexe"], colorIndices: [0,4,8] },
  { type: "chelsea-boot",    base: "Chelsea",           cuts: ["regular"],     materials: ["leather"], styles: ["chic", "minimaliste", "bourgeoisie"],     genders: ["femme", "homme", "unisexe"], colorIndices: [0,4,8] },
  { type: "ankle-boot",      base: "Bottines",          cuts: ["regular"],     materials: ["leather"], styles: ["chic", "casual"],                         genders: ["femme", "homme", "unisexe"], colorIndices: [0,4,8] },
  { type: "ballet",          base: "Ballerines",        cuts: ["regular"],     materials: ["leather", "satin"], styles: ["chic", "minimaliste", "romantique"], genders: ["femme"],     colorIndices: [0,1,3,8,11,13] },
  { type: "pump",            base: "Escarpins",         cuts: ["regular"],     materials: ["leather", "satin"], styles: ["soirée", "chic", "formel"],     genders: ["femme"],          colorIndices: [0,8,11,13] },
  { type: "sandal",          base: "Sandales",          cuts: ["regular"],     materials: ["leather"], styles: ["estival", "bohème"],                      genders: ["femme", "homme", "unisexe"], colorIndices: [0,3,4,8,11] },
  { type: "espadrille",      base: "Espadrilles",       cuts: ["regular"],     materials: ["cotton"],  styles: ["estival", "casual"],                      genders: ["femme", "homme", "unisexe"], colorIndices: [1,2,3,4,7] },
  { type: "mule",            base: "Mules",             cuts: ["regular"],     materials: ["leather"], styles: ["chic", "minimaliste"],                    genders: ["femme"],          colorIndices: [0,1,3,8,13] },
];

/* ─── ACCESSORIES — ~140 garments ───────────────────────────────────── */
interface AccessorySpec {
  type: string;
  base: string;
  colorIndices: number[];
  styles?: Style[];
  genders?: Gender[];
}
const ACCESSORIES: AccessorySpec[] = [
  { type: "watch",      base: "Montre",              colorIndices: [0,4,5],          styles: ["classique", "luxe-discret"],  genders: ["femme", "homme", "unisexe"] },
  { type: "scarf",      base: "Écharpe",             colorIndices: [0,3,5,7,8,11,12],styles: ["hivernal", "classique"],      genders: ["femme", "homme", "unisexe"] },
  { type: "foulard",    base: "Foulard",             colorIndices: [0,8,11,13,14],   styles: ["chic", "bourgeoisie"],        genders: ["femme"] },
  { type: "tie",        base: "Cravate",             colorIndices: [0,6,7,8,9],      styles: ["formel", "classique"],        genders: ["homme"] },
  { type: "belt",       base: "Ceinture",            colorIndices: [0,4,8],          styles: ["classique"],                  genders: ["femme", "homme", "unisexe"] },
  { type: "glasses",    base: "Lunettes",            colorIndices: [0,4,8],          styles: ["minimaliste", "classique"],   genders: ["unisexe"] },
  { type: "sunglasses", base: "Lunettes de soleil",  colorIndices: [0,4,8],          styles: ["estival", "luxe-discret"],    genders: ["unisexe"] },
  { type: "panama",     base: "Panama",              colorIndices: [1,3,4],          styles: ["estival", "bourgeoisie"],     genders: ["femme", "homme"] },
  { type: "fedora",     base: "Fedora",              colorIndices: [0,4,5,8],        styles: ["classique", "vintage"],       genders: ["femme", "homme"] },
  { type: "beret",      base: "Béret",               colorIndices: [0,3,5,8,9],      styles: ["chic", "classique"],          genders: ["femme"] },
  { type: "beanie",     base: "Bonnet",              colorIndices: [0,1,2,5,8,11],   styles: ["hivernal", "casual"],         genders: ["unisexe"] },
  { type: "cap",        base: "Casquette",           colorIndices: [0,1,5,6,7,8],    styles: ["streetwear", "sport"],        genders: ["unisexe"] },
  { type: "tote",       base: "Cabas",               colorIndices: [0,1,3,4,5,8],    styles: ["minimaliste", "casual"],      genders: ["femme", "unisexe"] },
  { type: "bucket",     base: "Sac seau",            colorIndices: [0,4,5,8,11],     styles: ["chic", "vintage"],            genders: ["femme"] },
  { type: "crossbody",  base: "Sac bandoulière",     colorIndices: [0,4,5,8,11],     styles: ["chic", "casual"],             genders: ["femme", "unisexe"] },
  { type: "clutch",     base: "Pochette",            colorIndices: [0,8,11,13],      styles: ["soirée", "chic"],             genders: ["femme"] },
  { type: "backpack",   base: "Sac à dos",           colorIndices: [0,4,5,7,8],      styles: ["casual", "sport"],            genders: ["unisexe"] },
  { type: "ring",       base: "Bague",               colorIndices: [0,4,10],         styles: ["luxe-discret", "chic"],       genders: ["unisexe"] },
  { type: "earring",    base: "Boucles d'oreille",   colorIndices: [0,4,10],         styles: ["chic", "soirée"],             genders: ["femme"] },
  { type: "necklace",   base: "Collier",             colorIndices: [0,4,10],         styles: ["minimaliste", "chic"],        genders: ["femme", "unisexe"] },
];

/* ─── GÉNÉRATEUR ───────────────────────────────────────────────────── */
function buildLabel(base: string, cut?: Cut, material?: Material, color?: { name: string }): string {
  const parts: string[] = [base];
  if (cut && cutLabelFr[cut]) parts.push(cutLabelFr[cut]);
  if (material) parts.push("en " + matLabelFr[material]);
  if (color) parts.push(color.name);
  return parts.join(" ");
}

function buildSlug(type: string, cut?: Cut, material?: Material, color?: { name: string }, style?: Style): string {
  return [type, cut, material, color && slugify(color.name), style && slugify(style)].filter(Boolean).join("_");
}

const garments: Garment[] = [];
let idCounter = 1;

function emitClothing(specs: Spec[], category: GarmentCategory) {
  for (const s of specs) {
    const cols = (s.colorIndices || [0,1,2,3,4,5,6,7]).map((i) => PALETTE[i]);
    for (const cut of s.cuts) {
      for (const mat of s.materials) {
        for (const col of cols) {
          for (const style of s.styles) {
            for (const gender of s.genders) {
              garments.push({
                id: idCounter++,
                slug: buildSlug(s.type, cut, mat, col, style),
                label: buildLabel(s.base, cut, mat, col),
                category,
                type: s.type,
                cut,
                material: mat,
                color: col,
                style,
                gender,
              });
            }
          }
        }
      }
    }
  }
}

function emitAccessories(specs: AccessorySpec[]) {
  for (const s of specs) {
    const cols = s.colorIndices.map((i) => PALETTE[i]);
    const styles = s.styles || ["classique"];
    const genders = s.genders || ["unisexe"];
    for (const col of cols) {
      for (const style of styles) {
        for (const gender of genders) {
          garments.push({
            id: idCounter++,
            slug: buildSlug(s.type, undefined, undefined, col, style),
            label: buildLabel(s.base, undefined, undefined, col),
            category: "accessories",
            type: s.type,
            color: col,
            style,
            gender,
          });
        }
      }
    }
  }
}

emitClothing(TOPS,      "tops");
emitClothing(BOTTOMS,   "bottoms");
emitClothing(OUTERWEAR, "outerwear");
emitClothing(SHOES,     "shoes");
emitAccessories(ACCESSORIES);

/* On capote à 1000 max — coupe le surplus, garde la diversité par
   catégorie via tranches proportionnelles. */
const CAP = 1000;
function trimToCap(list: Garment[], cap: number): Garment[] {
  if (list.length <= cap) return list;
  // Échantillonnage uniforme : prendre 1 garment toutes les `step`
  const step = list.length / cap;
  const out: Garment[] = [];
  for (let i = 0; i < cap; i++) out.push(list[Math.floor(i * step)]);
  // Réindexation propre
  return out.map((g, i) => ({ ...g, id: i + 1 }));
}

export const garmentCatalog: Garment[] = trimToCap(garments, CAP);

/* ─── HELPERS DE QUERY ─────────────────────────────────────────────── */

export function findGarmentById(id: number): Garment | undefined {
  return garmentCatalog.find((g) => g.id === id);
}

export function findGarmentBySlug(slug: string): Garment | undefined {
  return garmentCatalog.find((g) => g.slug === slug);
}

export interface GarmentFilters {
  category?: GarmentCategory;
  type?: string;
  cut?: Cut;
  material?: Material;
  style?: Style;
  gender?: Gender;
  colorName?: string;
}
export function filterGarments(f: GarmentFilters): Garment[] {
  return garmentCatalog.filter((g) => {
    if (f.category && g.category !== f.category) return false;
    if (f.type && g.type !== f.type) return false;
    if (f.cut && g.cut !== f.cut) return false;
    if (f.material && g.material !== f.material) return false;
    if (f.style && g.style !== f.style) return false;
    if (f.gender && g.gender !== "unisexe" && g.gender !== f.gender) return false;
    if (f.colorName && !g.color.name.toLowerCase().includes(f.colorName.toLowerCase())) return false;
    return true;
  });
}

export const catalogStats = {
  total: garmentCatalog.length,
  byCategory: garmentCatalog.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {}),
};
