/**
 * outfitComposer — Compose une tenue complète à partir d'une couleur ancre.
 *
 * Brief 2026-05-20 (specs "Tenue depuis photo" + "Stylist IA conversationnel") :
 *   - Convertit une couleur quelconque (hex) en sa famille (warm/olive/dark...)
 *   - Trouve la palette Sanzo Wada (sur 348) la plus proche de cette couleur
 *   - Compose une tenue 4 slots (HAUT / BAS / VESTE / CHAUSSURES / ACCENT)
 *     en utilisant les couleurs de CETTE palette Wada
 *   - Respecte la pièce déjà possédée (ne la repropose pas)
 *   - Règles de goût : 1 seule couleur "forte" max, cuir brun > noir pur
 *
 * Source de vérité = `dictionary` (348 palettes Wada) défini dans lib/data.ts.
 */
import { dictionary, colorDistance, type DictionaryEntry } from "./data";
import { hexToPlainName as sharedHexToPlainName } from "./colorNames";

/* ──────────────────────────────────────────────────────────────────────
   FAMILLES DE COULEURS — classification depuis HSL (spec §3)
   ────────────────────────────────────────────────────────────────────── */

export type ColorFamily =
  | "dark"      // L<0.18 — noir, anthracite
  | "light"     // L>0.82 & S<0.22 — écru, blanc cassé
  | "gray"      // S<0.16 — gris neutre
  | "warm"      // H:15-48 — sable, ocre, terracotta
  | "olive"     // H:48-95 — kaki, moutarde
  | "green"     // H:95-170 — vert, sauge
  | "cool"      // H:170-255 — bleu
  | "red";      // reste — rouge, bordeaux, magenta

export type Slot = "haut" | "bas" | "veste" | "chaussures" | "accent";

/* Conversion hex → HSL (renvoie h en 0-360, s/l en 0-1) */
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

/** Classe une couleur dans sa famille selon spec §3. */
export function colorFamily(hex: string): ColorFamily {
  const { h, s, l } = hexToHsl(hex);
  if (l < 0.18) return "dark";
  if (l > 0.82 && s < 0.22) return "light";
  if (s < 0.16) return "gray";
  if (h >= 15 && h < 48) return "warm";
  if (h >= 48 && h < 95) return "olive";
  if (h >= 95 && h < 170) return "green";
  if (h >= 170 && h < 255) return "cool";
  return "red";
}

/* ──────────────────────────────────────────────────────────────────────
   MATCHING — couleur ancre → palette Wada
   ────────────────────────────────────────────────────────────────────── */

export interface PaletteMatch {
  entry: DictionaryEntry;
  matchedColor: { hex: string; name: string };
  distance: number;
}

/**
 * Trouve la palette Sanzo Wada dont une couleur est la plus proche de
 * la couleur ancre fournie. Renvoie la palette + la couleur exacte qui
 * a matché + la distance (en RGB Euclidienne, suffisant pour v1).
 *
 * En v2, remplacer par distance Lab (perceptivement plus précise).
 */
export function findClosestPalette(anchorHex: string): PaletteMatch {
  let bestEntry: DictionaryEntry = dictionary[0];
  let bestColor = dictionary[0].colors[0];
  let bestDist = Infinity;

  for (const entry of dictionary) {
    for (const c of entry.colors) {
      const dist = colorDistance(c.hex, anchorHex);
      if (dist < bestDist) {
        bestDist = dist;
        bestEntry = entry;
        bestColor = c;
      }
    }
  }

  return { entry: bestEntry, matchedColor: bestColor, distance: bestDist };
}

/* ──────────────────────────────────────────────────────────────────────
   COMPOSITION D'OUTFIT à partir d'une palette + slot ancre
   ────────────────────────────────────────────────────────────────────── */

export interface OutfitSlot {
  slot: Slot;
  role: "owned" | "suggested" | "accent";
  label: string;        // ex: "Pantalon plissé taupe"
  hex: string;          // couleur du slot
  colorName: string;    // ex: "Taupe"
  wadaRef?: string;     // ex: "No. 016" — référence palette Wada
  /* Brief 2026-05-26 « gender consistency » : genre du slot (femme/homme/
     unisexe). Le LLM le pose par slot, le serveur le propage ici, le
     frontend l'envoie à /api/products pour filtrer correctement les
     produits MUJI. Avant : si state.genre était null (free-text user),
     les produits leakaient sur les 2 genres → pantalon femme dans une
     tenue homme. */
  genre?: string;
  /* Brief 2026-05-26 « matching description ↔ produit » : mot-clé de
     type extrait du libellé LLM (« chemise » de « Chemise fluide beige »,
     « blazer » de « Blazer cachemire camel »). Passé à /api/products
     comme `q=` → restreint la recherche aux produits dont le nom contient
     ce mot. Évite les substitutions floues (Chemise → Pull) qui rendaient
     incohérente la description vs la photo. */
  typeKeyword?: string;
  // Brief « couche achat » 2026-05-25 : URLs attachées par le serveur
  // (jamais par le LLM). Le UI lit ces champs en priorité pour les boutons.
  lienAchat?: string;   // recherche Amazon pré-remplie + tag wadastyle-21
  mujiLien?: string;    // deep-link Awin vers Muji si la pièce est minimal/basique
}

export interface ComposedOutfit {
  anchorHex: string;
  anchorSlot: Slot;
  family: ColorFamily;
  palette: PaletteMatch;
  slots: OutfitSlot[];
  verdict: string;      // 1 phrase éditoriale
}

/* ──────────────────────────────────────────────────────────────────────
   LABELS REGISTRE-SPÉCIFIQUES — bug fix 2026-05-22
   ──────────────────────────────────────────────────────────────────────
   Quand l'ancre est un sneaker (Nike, Adidas, Veja…), on ne doit JAMAIS
   sortir trench + mules cuir camel. Brief §3 (cohérence registre) :
   sneakers blanches → casual/streetwear → hoodie/cargo/bomber/casquette.
   On bascule alors sur ces labels au lieu des labels génériques. */

type LabelMap = Record<Slot, Partial<Record<ColorFamily, string[]>>>;

const LABELS_STREETWEAR: LabelMap = {
  haut: {
    dark:   ["Hoodie oversized noir", "Sweat large noir"],
    light:  ["Hoodie oversized blanc cassé", "T-shirt graphique large"],
    gray:   ["Hoodie oversized gris", "Sweat oversize gris"],
    warm:   ["Hoodie oversized camel", "Sweat oversize sable"],
    olive:  ["Hoodie oversized olive", "Sweat large kaki"],
    green:  ["Hoodie oversized vert", "Sweat large vert"],
    cool:   ["Hoodie oversized bleu", "Sweat large indigo"],
    red:    ["Hoodie oversized bordeaux", "Sweat large rouille"],
  },
  bas: {
    dark:   ["Cargo large noir", "Jean large noir"],
    light:  ["Cargo large écru", "Jean large blanc cassé"],
    gray:   ["Jogging tech gris", "Cargo large gris"],
    warm:   ["Cargo large sable", "Jogging tech beige"],
    olive:  ["Cargo large olive", "Jogging tech kaki"],
    green:  ["Cargo large vert", "Jogging tech vert"],
    cool:   ["Jean large indigo", "Cargo large bleu"],
    red:    ["Cargo large bordeaux", "Jogging tech brique"],
  },
  veste: {
    dark:   ["Bomber noir", "Coupe-vent noir"],
    light:  ["Bomber écru", "Coupe-vent blanc cassé"],
    gray:   ["Parka technique gris", "Bomber gris"],
    warm:   ["Parka technique camel", "Bomber sable"],
    olive:  ["Parka technique olive", "Bomber kaki"],
    green:  ["Parka technique vert", "Bomber vert"],
    cool:   ["Bomber bleu", "Parka technique marine"],
    red:    ["Bomber bordeaux", "Coupe-vent rouille"],
  },
  // Streetwear avec sneaker en ancre : on ne propose JAMAIS d'autres
  // chaussures. Mais si la composition demande malgré tout ce slot, on
  // reste sur des sneakers (jamais derbies/mules/escarpins).
  chaussures: {
    dark:   ["Sneakers chunky noires"],
    light:  ["Sneakers running blanches"],
    gray:   ["Sneakers chunky grises"],
    warm:   ["Sneakers running beige"],
    olive:  ["Sneakers running olive"],
    green:  ["Sneakers running vert"],
    cool:   ["Sneakers running bleu"],
    red:    ["Sneakers running bordeaux"],
  },
  accent: {
    dark:   ["Casquette baseball noire", "Sacoche banane noire"],
    light:  ["Casquette baseball écru", "Tote oversize"],
    gray:   ["Bonnet maille gris", "Sacoche banane grise"],
    warm:   ["Casquette baseball camel", "Sacoche banane camel"],
    olive:  ["Casquette baseball olive", "Sacoche banane olive"],
    green:  ["Casquette baseball vert", "Sacoche banane vert"],
    cool:   ["Casquette baseball bleu", "Sacoche banane indigo"],
    red:    ["Casquette baseball bordeaux", "Bonnet maille rouille"],
  },
};

const LABELS_OLDMONEY: LabelMap = {
  haut: {
    dark:   ["Pull cachemire col rond noir"],
    light:  ["Polo maille cachemire écru", "Chemise oxford boutonnée"],
    gray:   ["Pull cachemire gris perle"],
    warm:   ["Pull cachemire camel", "Polo maille cachemire sable"],
    olive:  ["Pull cachemire olive"],
    green:  ["Polo maille cachemire vert sauge"],
    cool:   ["Chemise oxford bleu pâle"],
    red:    ["Pull cachemire bordeaux"],
  },
  bas: {
    dark:   ["Pantalon à pinces noir"],
    light:  ["Chino sable", "Pantalon à pinces écru"],
    gray:   ["Pantalon à pinces gris flanelle"],
    warm:   ["Pantalon à pinces camel", "Chino sable"],
    olive:  ["Pantalon à pinces olive"],
    green:  ["Pantalon à pinces vert sourd"],
    cool:   ["Pantalon à pinces marine"],
    red:    ["Pantalon à pinces bordeaux"],
  },
  veste: {
    dark:   ["Blazer cachemire noir"],
    light:  ["Cardigan ample écru", "Trench beige"],
    gray:   ["Blazer cachemire gris"],
    warm:   ["Trench beige", "Blazer cachemire camel"],
    olive:  ["Blazer cachemire olive"],
    green:  ["Cardigan ample vert sauge"],
    cool:   ["Blazer cachemire marine"],
    red:    ["Blazer cachemire bordeaux"],
  },
  chaussures: {
    dark:   ["Loafers cuir noir"],
    light:  ["Mocassins daim écru"],
    gray:   ["Mocassins daim gris"],
    warm:   ["Loafers cuir camel", "Mocassins daim camel"],
    olive:  ["Mocassins daim olive"],
    green:  ["Mocassins daim vert sauge"],
    cool:   ["Loafers cuir marine"],
    red:    ["Loafers cuir bordeaux"],
  },
  accent: {
    dark:   ["Foulard soie noir", "Ceinture cuir tressé noir"],
    light:  ["Pochette en lin écru", "Foulard soie crème"],
    gray:   ["Foulard soie gris perle"],
    warm:   ["Ceinture cuir tressé camel", "Foulard soie camel"],
    olive:  ["Foulard soie olive"],
    green:  ["Foulard soie vert sauge"],
    cool:   ["Foulard soie marine"],
    red:    ["Foulard soie bordeaux"],
  },
};

/* Registre supporté pour la composition. Si non précisé, le composer
   utilise les LABELS_DEFAULT (vocabulaire éditorial minimaliste). */
export type ComposerRegistre = "Streetwear" | "Décontracté" | "Old money" | "Classique" | "Minimal" | null;

/* Mapping role + couleurs disponibles → label item plausible.
   Pour chaque combinaison slot × famille, on suggère un nom de pièce
   crédible. En v2, on tirera ça du dictionnaire d'items existants. */
function generateItemLabel(slot: Slot, family: ColorFamily, colorName: string, gender: "femme" | "homme" | "unisexe", registre?: ComposerRegistre): string {
  // Refonte 2026-05-22 : si un registre est fourni (déduit du brand/owned),
  // on utilise les labels de ce registre — garantit que Streetwear ne sort
  // jamais de trench/mules, et Old money ne sort jamais de hoodie/cargo.
  if (registre === "Streetwear") {
    const opt = LABELS_STREETWEAR[slot]?.[family];
    if (opt && opt.length > 0) return opt[0];
  }
  if (registre === "Old money") {
    const opt = LABELS_OLDMONEY[slot]?.[family];
    if (opt && opt.length > 0) return opt[0];
  }
  const isMen = gender === "homme";

  const labels: Record<Slot, Partial<Record<ColorFamily, string[]>>> = {
    haut: {
      dark:   [isMen ? "Pull col rond noir" : "Pull fin noir col rond", "T-shirt noir essentiel"],
      light:  [isMen ? "Chemise oxford écru" : "Blouse soie écru", "Pull cachemire blanc cassé"],
      gray:   [isMen ? "Pull fin gris perle" : "Top maille gris perle"],
      warm:   [isMen ? "Pull cachemire sable" : "Chemise lin sable"],
      olive:  [isMen ? "Pull col rond olive" : "Top maille olive"],
      green:  [isMen ? "Pull vert sauge" : "Blouse soie vert sauge"],
      cool:   [isMen ? "Chemise oxford bleu pâle" : "Chemise soie bleu pierre"],
      red:    [isMen ? "Pull col rond bordeaux" : "Top maille bordeaux"],
    },
    bas: {
      dark:   [isMen ? "Pantalon tailleur noir" : "Pantalon de tailleur noir"],
      light:  [isMen ? "Pantalon écru en lin" : "Pantalon palazzo écru"],
      gray:   [isMen ? "Pantalon flanelle gris" : "Pantalon plissé gris"],
      warm:   [isMen ? "Pantalon plissé taupe" : "Pantalon large taupe"],
      olive:  [isMen ? "Chino olive" : "Pantalon large olive"],
      green:  [isMen ? "Pantalon vert sourd" : "Jupe midi vert sauge"],
      cool:   [isMen ? "Jean droit indigo profond" : "Jean droit indigo"],
      red:    [isMen ? "Pantalon laine bordeaux" : "Jupe midi bordeaux"],
    },
    veste: {
      dark:   [isMen ? "Manteau long noir" : "Trench noir mat"],
      light:  [isMen ? "Veste lin écru" : "Trench beige clair"],
      gray:   [isMen ? "Manteau long gris perle" : "Manteau long gris"],
      warm:   [isMen ? "Trench beige classique" : "Manteau long camel"],
      olive:  [isMen ? "Veste utility olive" : "Veste oversize kaki"],
      green:  [isMen ? "Veste workwear vert" : "Cardigan vert sauge"],
      cool:   [isMen ? "Veste denim brut" : "Veste blazer marine"],
      red:    [isMen ? "Veste velours bordeaux" : "Blazer velours bordeaux"],
    },
    chaussures: {
      dark:   [isMen ? "Bottines cuir noir" : "Bottines cuir noires"],
      light:  [isMen ? "Sneakers blanches minimal" : "Sneakers blanches cuir"],
      gray:   [isMen ? "Mocassins suède gris" : "Mocassins penny suède"],
      warm:   [isMen ? "Mocassins penny daim camel" : "Mules cuir camel"],
      olive:  [isMen ? "Derbies cuir olive" : "Ballerines cuir olive"],
      green:  [isMen ? "Sneakers vert sauge" : "Sandales cuir vert"],
      cool:   [isMen ? "Derbies cuir marine" : "Ballerines cuir marine"],
      red:    [isMen ? "Bottines bordeaux" : "Bottines bordeaux"],
    },
    accent: {
      dark:   [isMen ? "Ceinture cuir noir" : "Pochette cuir noir"],
      light:  [isMen ? "Pochette toile écru" : "Foulard soie crème"],
      gray:   [isMen ? "Sac bandoulière gris" : "Sac structuré gris perle"],
      warm:   [isMen ? "Casquette toile camel" : "Sac panier en paille"],
      olive:  [isMen ? "Sac messager olive" : "Foulard olive"],
      green:  [isMen ? "Bracelet cuir vert" : "Sac bandoulière vert"],
      cool:   [isMen ? "Montre cuir marine" : "Foulard soie bleu pierre"],
      red:    [isMen ? "Pochette cuir bordeaux" : "Sac structuré bordeaux"],
    },
  };

  const options = labels[slot]?.[family] || [`${slot} ${colorName.toLowerCase()}`];
  return options[0];
}

/* Phrase de verdict éditoriale par famille de couleur ancre. */
function generateVerdict(family: ColorFamily, palette: PaletteMatch): string {
  const pName = palette.entry.name;
  const map: Record<ColorFamily, string> = {
    dark:   `Un noir, c'est une grammaire. On le réchauffe avec des neutres profonds — ${pName} pose ce ton avec retenue.`,
    light:  `Du clair sur du clair, c'est exigeant. ${pName} donne le squelette d'une silhouette feutrée.`,
    gray:   `Le gris, c'est l'élégance qui se tait. ${pName} apporte la nuance qui empêche le froid.`,
    warm:   `Une teinte chaude qui appelle d'autres chaleurs. ${pName} est exactement ce dialogue de neutres.`,
    olive:  `L'olive porte sa propre matière. ${pName} l'ancre dans une palette de jardin discret.`,
    green:  `Le vert tisse avec les neutres végétaux. ${pName} compose ce paysage sans le forcer.`,
    cool:   `Un bleu retient. ${pName} l'équilibre avec des terres et des écrus — pas de chaud-froid.`,
    red:    `Une couleur qui parle haut. ${pName} l'entoure de neutres qui la posent sans l'éteindre.`,
  };
  return map[family];
}

/* Refonte 2026-05-22 : on importe `hexToPlainName` depuis lib/colorNames.ts
   (source unique pour tout le projet). Plus de duplication entre modules. */
const hexToPlainName = sharedHexToPlainName;

/**
 * Compose une tenue complète à partir d'une couleur ancre + le slot que
 * cette couleur occupe (la pièce que le client possède).
 *
 * @param anchorHex   Couleur de la pièce ancre (ex: "#F5F2EC" pour des Nike blanches)
 * @param anchorSlot  Quel slot la pièce ancre occupe ("haut", "bas", etc.)
 * @param gender      Genre du client — pour adapter les labels d'items
 * @param opts        Options optionnelles :
 *                    - registre : force le vocabulaire (Streetwear / Old money…)
 *                    - ownedLabel : label exact de la pièce possédée
 *                                   (« Vos Nike blanches » au lieu de « Votre chaussures »)
 *                    - anchorColorName : nom de couleur explicite pour l'ancre
 *                                        (« Blanc cassé » au lieu de « Plâtre » poétique)
 */
export function composeOutfitFromColor(
  anchorHex: string,
  anchorSlot: Slot,
  gender: "femme" | "homme" | "unisexe" = "unisexe",
  opts?: {
    registre?: ComposerRegistre;
    ownedLabel?: string;
    anchorColorName?: string;
  }
): ComposedOutfit {
  const family = colorFamily(anchorHex);
  const palette = findClosestPalette(anchorHex);
  const paletteColors = palette.entry.colors;
  const wadaRef = `No. ${palette.entry.number}`;
  const registre = opts?.registre ?? null;

  // Tous les slots possibles d'une tenue complète
  const ALL_SLOTS: Slot[] = ["haut", "bas", "veste", "chaussures", "accent"];
  // Slots à composer = tous SAUF l'ancre
  const toCompose = ALL_SLOTS.filter((s) => s !== anchorSlot);

  // Le 1er slot composé prend l'autre couleur principale de la palette
  // (la 2ème couleur Wada, qui contraste avec l'ancre par construction).
  // Le 2ème slot prend la 3ème couleur.
  // L'accent prend une 4ème couleur si dispo, sinon répète la 2ème.
  const slots: OutfitSlot[] = [];

  // L'ancre est ajoutée en premier (marquée owned).
  // Refonte 2026-05-22 : on garde l'item exact possédé (« Vos Nike blanches »)
  // et la couleur réelle de l'ancre — JAMAIS la couleur poétique de la palette.
  const ownedLabel = opts?.ownedLabel || `Votre ${anchorSlot}`;
  const anchorColorName = opts?.anchorColorName || hexToPlainName(anchorHex);
  slots.push({
    slot: anchorSlot,
    role: "owned",
    label: ownedLabel,
    hex: anchorHex,
    colorName: anchorColorName,
    wadaRef,
  });

  // Pour les slots à composer, on prend les couleurs restantes de la palette
  // (en évitant la couleur déjà matchée par l'ancre)
  const otherColors = paletteColors.filter((c) => c.hex !== palette.matchedColor.hex);
  let colorIdx = 0;
  const pickColor = () => {
    if (otherColors.length === 0) return palette.matchedColor;
    const c = otherColors[colorIdx % otherColors.length];
    colorIdx++;
    return c;
  };

  for (const slot of toCompose) {
    const color = pickColor();
    const slotFamily = colorFamily(color.hex);
    // Refonte 2026-05-22 : colorName ALIGNÉ sur le hex (« Camel » pour un
    // hex camel), plus le nom poétique de la palette qui pouvait mentir.
    const trueColorName = hexToPlainName(color.hex);
    slots.push({
      slot,
      role: slot === "accent" ? "accent" : "suggested",
      label: generateItemLabel(slot, slotFamily, trueColorName, gender, registre),
      hex: color.hex,
      colorName: trueColorName,
      wadaRef,
    });
  }

  return {
    anchorHex,
    anchorSlot,
    family,
    palette,
    slots,
    verdict: generateVerdict(family, palette),
  };
}
