/**
 * registreEngine — WADA × Brief profil 2026-05-22
 * ─────────────────────────────────────────────────────────────────────────
 * But : que les réglages « Affiner à votre style » changent VRAIMENT la
 * tenue. Aujourd'hui, le moteur prend les pièces depuis `entry.composition`
 * du dictionnaire — fixes par palette. Conséquence : choisir « Streetwear »
 * ne change pas le blazer en bomber, ne change pas les derbies en sneakers.
 *
 * Principe de séparation imposé par le brief :
 *   - COULEURS    → palette Wada (jamais touchées par le profil)
 *   - TYPES + FIT → registre + occasion + coupe (calculés ici)
 *   - MARCHANDS   → budget (géré dans ma-tenue/page.tsx — pas ici)
 *
 * Sortie : 5 slots `{ slot, type, fit, color, materials, registre }` +
 * un texte « direction artistique » en français aligné au registre.
 */

import type { DictionaryEntry } from "./data";
import { hexToPlainName } from "./colorNames";

/* ──────────────────────────────────────────────────────────────────────
   TYPES
   ────────────────────────────────────────────────────────────────────── */

export type SlotKey = "haut" | "bas" | "veste" | "chaussures" | "accent";

export type Registre = "Minimal" | "Classique" | "Old money" | "Décontracté" | "Streetwear";
export type Fit = "ajuste" | "standard" | "ample";
export type Occasion = "bureau" | "quotidien" | "sorties" | "voyage";

export type RegistreSlot = {
  slot: SlotKey;
  /** Libellé pièce final, en français, registre-aligné (ex: « Hoodie oversized »). */
  type: string;
  /** Fit appliqué (ajusté / regular / oversized / relaxed). */
  fit: string;
  /** Couleur palette Wada (hex + nom FR). */
  color: { hex: string; name: string };
  /** Matières probables — informatif seulement (FLUX prompt utilise la palette). */
  materials: string[];
  /** Mots-clés pour la recherche marchand (ex: « hoodie oversized homme »). */
  searchKeywords: string;
};

export type RegistreOutfit = {
  registre: Registre;
  occasion: Occasion;
  fit: Fit;
  /** 5 slots dans l'ordre canonique : haut, bas, veste, chaussures, accent. */
  slots: RegistreSlot[];
  /** Texte de direction artistique en français, vocabulaire registre. */
  description: string;
  /** Référence éditoriale (maison de mode) cohérente avec le registre. */
  reference: string;
};

export type ProfileForRegistre = {
  style: string;
  fit: string;
  occasion_focus: string;
  gender: "femme" | "homme" | "unisexe" | null;
};

/* ──────────────────────────────────────────────────────────────────────
   VOCABULAIRE PAR REGISTRE — table de correspondance du brief §1
   ──────────────────────────────────────────────────────────────────────
   Pour chaque registre × slot, une liste de pièces réelles. On choisit
   par index `palette.number % length` pour avoir une variété cohérente
   d'une palette à l'autre, sans randomisation (résultat stable). */

const VOCAB: Record<Registre, Record<SlotKey, string[]>> = {
  "Minimal": {
    haut:       ["T-shirt épais col rond", "Pull fin col rond", "Marinière épurée"],
    bas:        ["Pantalon droit épuré", "Pantalon ample minimal", "Jean droit brut"],
    veste:      ["Surchemise en laine", "Blazer non structuré", "Manteau droit"],
    chaussures: ["Sneakers minimalistes blanches", "Derbies épurés", "Mocassins suède"],
    accent:     ["Tote en toile", "Ceinture cuir fin", "Foulard fin"],
  },
  "Classique": {
    haut:       ["Chemise oxford", "Pull fin maille", "Polo maille fine"],
    bas:        ["Chino droit", "Pantalon de costume", "Pantalon à pinces"],
    veste:      ["Blazer structuré", "Manteau croisé", "Trench"],
    chaussures: ["Derbies cuir", "Mocassins cuir", "Richelieu"],
    accent:     ["Ceinture cuir lisse", "Écharpe en laine", "Cravate fine"],
  },
  "Old money": {
    haut:       ["Polo maille cachemire", "Chemise oxford boutonnée", "Pull cachemire col rond"],
    bas:        ["Pantalon à pinces", "Chino sable", "Bermuda en lin (été)"],
    veste:      ["Blazer cachemire", "Cardigan ample", "Trench beige"],
    chaussures: ["Loafers cuir", "Mocassins daim", "Derbies daim"],
    accent:     ["Foulard soie", "Ceinture cuir tressé", "Pochette en lin"],
  },
  "Décontracté": {
    haut:       ["T-shirt coton épais", "Chemise lin", "Sweat fin"],
    bas:        ["Chino lavé", "Jean droit", "Pantalon en lin"],
    veste:      ["Surchemise denim", "Veste légère non doublée", "Cardigan"],
    chaussures: ["Sneakers minimales", "Mocassins souples", "Espadrilles"],
    accent:     ["Casquette souple en toile", "Tote en coton", "Bracelet cuir"],
  },
  "Streetwear": {
    // Règle dure brief §1 : sneakers + volumes amples, jamais blazer/derbies.
    haut:       ["Hoodie oversized", "Sweat oversize col rond", "T-shirt graphique large"],
    bas:        ["Cargo large", "Jogging tech", "Jean large"],
    veste:      ["Bomber", "Parka technique", "Coupe-vent zippé"],
    chaussures: ["Sneakers running", "Sneakers chunky", "Sneakers basses minimales"],
    accent:     ["Casquette baseball", "Sacoche banane", "Bonnet en maille"],
  },
};

/* Matières probables par registre + budget (informatif, pas pour l'image). */
const MATERIALS_BY_REGISTRE: Record<Registre, string[]> = {
  "Minimal":     ["coton épais", "laine fine"],
  "Classique":   ["laine peignée", "coton popeline"],
  "Old money":   ["cachemire", "lin", "daim"],
  "Décontracté": ["coton", "lin", "denim"],
  "Streetwear":  ["molleton", "tissu technique", "denim brut"],
};

/* Référence maison de mode par registre. */
const HOUSE_REF: Record<Registre, string> = {
  "Minimal":     "COS",
  "Classique":   "Margaret Howell",
  "Old money":   "Loro Piana",
  "Décontracté": "A.P.C.",
  "Streetwear":  "Carhartt WIP",
};

/* Mots-clés FR pour la direction artistique par registre — brief §7. */
/* Fix 2026-06-07 (design/contenu) — les descripteurs ne doivent PAS répéter
   le mot d'accroche du lead (cf. buildFrenchDescription). Avant : Classique
   donnait « Tailoring net … : tailoring net, … » et Old money « Quiet luxury
   … : quiet luxury, … » (doublon visible). Premiers tokens reformulés. */
const VOCAB_FR: Record<Registre, string> = {
  "Minimal":     "épuré, lignes nettes, sans excès",
  "Classique":   "intemporel, sobre, lignes propres",
  "Old money":   "discret, matières nobles, tomber impeccable",
  "Décontracté": "casual, facile, intentionnel",
  "Streetwear":  "volumes amples, sneakers nettes, urbain",
};

/* ──────────────────────────────────────────────────────────────────────
   MAPPING — slot dictionnaire → slot registre
   ────────────────────────────────────────────────────────────────────── */

/** Le dictionnaire utilise « Top / Bottom / Outer / Shoes / Accent » (et
   parfois Belt, Bag, Hat). On normalise vers nos 5 slots canoniques. */
function normalizeSlot(rawPiece: string): SlotKey {
  const p = rawPiece.toLowerCase().trim();
  if (p === "top" || p === "haut")     return "haut";
  if (p === "bottom" || p === "bas")   return "bas";
  if (p === "outer" || p === "veste" || p === "jacket" || p === "manteau") return "veste";
  if (p === "shoes" || p === "chaussures" || p === "footwear") return "chaussures";
  // Tout le reste (Accent, Bag, Belt, Hat, Scarf…) → accent
  return "accent";
}

/* ──────────────────────────────────────────────────────────────────────
   COUPE → adjectif fit
   ────────────────────────────────────────────────────────────────────── */

function fitAdjective(fitKey: string, registre: Registre): string {
  // Brief §3 : Streetwear cohérent = oversized ; Classique + ample = relaxed tailoring.
  if (fitKey === "ajuste")   return "ajustée";
  if (fitKey === "ample")    return registre === "Streetwear" ? "oversized" : registre === "Classique" ? "relaxed tailoring" : "ample";
  return "regular";
}

/* ──────────────────────────────────────────────────────────────────────
   OCCASION — modificateur (+1 formalité bureau, +1 chic sorties)
   ──────────────────────────────────────────────────────────────────────
   On applique des règles dures qui surclassent le registre sur certains
   slots clés. Exemple : Streetwear + Bureau ⇒ « smart casual » (le sweat
   net + pantalon droit + sneakers minimal — pas de cargo, pas de chunky). */

function applyOccasionModifier(
  slot: SlotKey,
  baseType: string,
  registre: Registre,
  occasion: Occasion
): string {
  // Bureau : Streetwear → smart casual
  if (occasion === "bureau" && registre === "Streetwear") {
    if (slot === "haut")       return "Sweat col rond fin (smart casual)";
    if (slot === "bas")        return "Pantalon droit (smart casual)";
    if (slot === "veste")      return "Surchemise structurée";
    if (slot === "chaussures") return "Sneakers minimales blanches";
    if (slot === "accent")     return "Sacoche cuir souple";
  }
  // Bureau : Décontracté → +1 formalité
  if (occasion === "bureau" && registre === "Décontracté") {
    if (slot === "chaussures") return "Mocassins cuir";
    if (slot === "veste")      return "Blazer non structuré";
  }
  // Sorties : +1 chic — matières nobles, chaussures habillées
  if (occasion === "sorties") {
    if (registre === "Décontracté" && slot === "chaussures") return "Mocassins cuir";
    if (registre === "Streetwear" && slot === "chaussures")  return "Sneakers basses cuir";
  }
  // Voyage : confort — chaussures faciles
  if (occasion === "voyage") {
    if (slot === "chaussures" && registre === "Classique") return "Mocassins cuir confort";
    if (slot === "chaussures" && registre === "Old money") return "Mocassins daim confort";
  }
  return baseType;
}

/* ──────────────────────────────────────────────────────────────────────
   PIVOT — slot → couleur palette Wada — refonte cohérence 2026-06-10
   ──────────────────────────────────────────────────────────────────────
   Avant : attribution POSITIONNELLE (haut=color[0], bas=color[1]…). Quand
   la couleur la plus VIVE de la palette tombait en color[1], elle finissait
   sur le BAS (grande pièce) → ex. « chino ROUGE » dans une tenue sobre,
   incohérent (user : « améliore la cohérence »).

   Maintenant : attribution par RÔLE (principe de style que le commentaire
   d'origine énonçait déjà mais que le code ne faisait pas) :
   - la couleur la plus SATURÉE = le « pop » → réservée au petit ACCESSOIRE
     (un seul point de couleur fort dans la tenue),
   - les NEUTRES habillent les grandes pièces : plus clairs en haut
     (haut, veste), plus foncés au sol (bas, chaussures). */

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
}
function chroma(hex: string): number { const [r, g, b] = hexRgb(hex); return Math.max(r, g, b) - Math.min(r, g, b); }
function luminance(hex: string): number { const [r, g, b] = hexRgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; }

function pickColors(entry: DictionaryEntry): Record<SlotKey, { hex: string; name: string }> {
  const fallback = { hex: "#1E1E1E", name: "ink" };
  const cols = entry.colors.length ? entry.colors : [fallback];
  // Couleur la plus vive = pop (accent). Le reste = neutres, triés clair→foncé.
  const bySaturation = [...cols].sort((a, b) => chroma(b.hex) - chroma(a.hex));
  const pop = bySaturation[0];
  const neutrals = (bySaturation.length > 1 ? bySaturation.slice(1) : cols)
    .slice()
    .sort((a, b) => luminance(b.hex) - luminance(a.hex)); // clair → foncé
  const light = neutrals[0] || pop;
  const dark = neutrals[neutrals.length - 1] || light;
  return {
    haut:       light,   // clair en haut
    veste:      light,   // veste neutre (ton du haut)
    bas:        dark,     // neutre plus foncé pour ancrer
    chaussures: dark,     // chaussures = ton le plus foncé/neutre
    accent:     pop,      // l'unique point de couleur vif
  };
}

/* ──────────────────────────────────────────────────────────────────────
   CHOIX DU TYPE DE PIÈCE — déterministe par PROFIL UNIQUEMENT
   ──────────────────────────────────────────────────────────────────────
   Brief §8 (test de validation) :
   « Changer la palette → seules les couleurs changent, pas les types de
     pièces. »
   Donc on prend toujours le 1er item du vocab pour chaque slot. Changer
   de palette ne touche pas aux types ; changer le registre les change tous. */

function pickFromVocab(slotVocab: string[], _paletteNumber: string, _slotIdx: number): string {
  return slotVocab[0];
}

/* ──────────────────────────────────────────────────────────────────────
   ORCHESTRATEUR — composeOutfitFromProfile
   ────────────────────────────────────────────────────────────────────── */

/**
 * Construit la tenue 5-slot pour une palette × un profil.
 *
 * Garantit :
 *   - Streetwear ⇒ sneakers + volumes amples (jamais blazer/derbies)
 *   - Changer la coupe modifie visiblement le fit affiché
 *   - Changer la palette ne change QUE les couleurs (pas les types)
 *   - Texte de DA en FR uniquement, registre-aligné
 */
export function composeOutfitFromProfile(
  entry: DictionaryEntry,
  profile: ProfileForRegistre
): RegistreOutfit {
  const registre: Registre = (VOCAB as Record<string, unknown>)[profile.style] ? (profile.style as Registre) : "Minimal";
  const fitKey = (profile.fit || "standard") as Fit;
  const occasion = (profile.occasion_focus || "quotidien") as Occasion;

  const fit = fitAdjective(fitKey, registre);
  const colors = pickColors(entry);
  const SLOTS: SlotKey[] = ["haut", "bas", "veste", "chaussures", "accent"];

  const slots: RegistreSlot[] = SLOTS.map((slot, idx) => {
    const slotVocab = VOCAB[registre][slot];
    const baseType = pickFromVocab(slotVocab, entry.number, idx);
    const finalType = applyOccasionModifier(slot, baseType, registre, occasion);
    const paletteColor = colors[slot];
    // Brief §1A : nom de couleur DÉRIVÉ DU HEX (jamais le nom poétique
    // de la palette Wada). « Crème » sur un hex camel devient « Camel ».
    const trueColorName = hexToPlainName(paletteColor.hex);
    const color = { hex: paletteColor.hex, name: trueColorName };
    // Mots-clés de recherche marchand : type + couleur (hex-fidèle) + fit
    const fitKw = fitKey === "ample" ? " oversized" : fitKey === "ajuste" ? " slim" : "";
    const searchKeywords = `${finalType}${fitKw} ${trueColorName}`.toLowerCase().replace(/\s+/g, " ").trim();
    return {
      slot,
      type: finalType,
      fit,
      color,
      materials: MATERIALS_BY_REGISTRE[registre],
      searchKeywords,
    };
  });

  const description = buildFrenchDescription(registre, occasion, fitKey, entry);
  const reference = HOUSE_REF[registre];

  return { registre, occasion, fit: fitKey, slots, description, reference };
}

/* ──────────────────────────────────────────────────────────────────────
   TEXTE DE DIRECTION ARTISTIQUE — FRANÇAIS UNIQUEMENT (brief §7)
   ────────────────────────────────────────────────────────────────────── */

function buildFrenchDescription(
  registre: Registre,
  occasion: Occasion,
  fit: Fit,
  entry: DictionaryEntry
): string {
  const vocab = VOCAB_FR[registre];
  /* Cohérence 2026-06-10 (user « améliore la cohérence ») : on utilise les
     VRAIS noms de la palette (entry.colors[].name) — ceux affichés sous les
     pastilles (« Mousse », « Érable rouge », « Pierre ») — au lieu de noms
     génériques dérivés du hex (hexToPlainName donnait « anthracite, bordeaux,
     moutarde » → le texte décrivait des couleurs absentes des pastilles). */
  const colorNames = entry.colors.map((c) => c.name.toLowerCase()).slice(0, 3).join(", ");
  const fitFr = fit === "ample" ? "volumes amples" : fit === "ajuste" ? "coupe ajustée" : "coupe regular";
  const occasionFr: Record<Occasion, string> = {
    bureau: "pour le bureau",
    quotidien: "au quotidien",
    sorties: "pour une sortie",
    voyage: "en voyage",
  };

  // Phrase d'accroche registre-spécifique
  let lead: string;
  switch (registre) {
    case "Streetwear":
      lead = `Streetwear assumé ${occasionFr[occasion]} : ${vocab}.`;
      break;
    case "Classique":
      lead = `Tailoring net ${occasionFr[occasion]} : ${vocab}.`;
      break;
    case "Old money":
      lead = `Quiet luxury ${occasionFr[occasion]} : ${vocab}.`;
      break;
    case "Décontracté":
      lead = `Vestiaire décontracté ${occasionFr[occasion]} : ${vocab}.`;
      break;
    case "Minimal":
    default:
      lead = `Vestiaire minimal ${occasionFr[occasion]} : ${vocab}.`;
  }

  return `${lead} ${fitFr.charAt(0).toUpperCase() + fitFr.slice(1)}, palette ${colorNames}.`;
}

/* ──────────────────────────────────────────────────────────────────────
   IMAGE PROMPT — brief §4B (image ↔ pièces ↔ texte = même calcul)
   ──────────────────────────────────────────────────────────────────────
   Avant : `fashionPromptEngine.buildImagePrompt` générait un prompt
   générique en anglais (« oversized but architectural », « modern
   utilitarian ») qui ne mentionnait pas les pièces concrètes. Du coup
   l'image pouvait montrer un tailleur alors que la liste disait sport.
   Maintenant : on liste explicitement les 5 pièces de l'outfit
   registre-aligné, plus le registre et la palette. FLUX a un brief
   précis et l'image colle aux pièces affichées.
   Reste en anglais car FLUX est plus précis sur du prompt anglais. */

const REGISTRE_TO_EN: Record<Registre, { mood: string; refs: string }> = {
  "Minimal":     { mood: "Scandinavian minimalism, architectural, quiet",   refs: "COS, Jil Sander, Auralee" },
  "Classique":   { mood: "Parisian editorial, refined tailoring, timeless",  refs: "Margaret Howell, The Row, Lemaire" },
  "Old money":   { mood: "quiet luxury, understated wealth, calm",           refs: "Loro Piana, Brunello Cucinelli, The Row" },
  "Décontracté": { mood: "Japanese functional layering, soft luxury",        refs: "A.P.C., Lemaire, Auralee" },
  "Streetwear":  { mood: "modern utilitarian streetwear, urban editorial",    refs: "Carhartt WIP, Margiela MM6, Y-3" },
};

export function buildImagePromptFromOutfit(outfit: RegistreOutfit, entry: DictionaryEntry, gender: "femme" | "homme" | "unisexe"): string {
  const r = REGISTRE_TO_EN[outfit.registre];
  const genderLine = gender === "homme" ? "menswear" : gender === "femme" ? "womenswear" : "unisex";
  const items = outfit.slots
    .filter((s) => s.slot !== "accent" || /sacoche|casquette|tote|bonnet|foulard|écharpe|ceinture/i.test(s.type))
    .map((s) => s.type) // déjà en français mais FLUX comprend (« Hoodie oversized », « Cargo large »…)
    .join(", ");
  const colors = entry.colors.slice(0, 4).map((c) => `${c.hex}`).join(", ");

  return [
    `Subject: flat lay complete ${genderLine} outfit on neutral background — NO model, NO body, NO face, NO hands, NO mannequin, NO person visible`,
    `Outfit pieces (must all appear, arranged editorial flat lay): ${items}`,
    `Registre: ${outfit.registre}. Mood: ${r.mood}.`,
    `Color palette (strict, no other colors): ${colors}`,
    `Fit: ${outfit.fit === "ample" ? "intentionally oversized, relaxed volumes" : outfit.fit === "ajuste" ? "fitted, structured, close to body" : "tailored regular, classic proportions"}`,
    `Lighting: soft natural daylight from above, gentle shadows`,
    `Camera: top-down or slight 3/4 angle, 50-85mm, sharp focus on garment construction`,
    `Background: solid neutral cream seamless backdrop, no props, no hangers, no price tags`,
    `Reference: in the style of ${r.refs} flat lay product photography, COS / Arket catalog visual language`,
    `Constraints: PRODUCT ONLY, no human body parts visible (no skin, no head, no hands, no feet). No cyberpunk, no neon, no plastic shine, no logos, no branding, no oversaturated colors`,
  ].join("\n");
}

/* ──────────────────────────────────────────────────────────────────────
   ASSERTION DEV — validation brief §8
   ──────────────────────────────────────────────────────────────────────
   Tests rapides exécutés en dev pour garantir les règles dures :
   - Streetwear ne doit JAMAIS contenir blazer / derbies / chapeau classique
   - Bureau + Streetwear ⇒ pas de cargo / chunky */

export function validateOutfit(outfit: RegistreOutfit): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const allTypes = outfit.slots.map((s) => s.type.toLowerCase()).join(" | ");

  if (outfit.registre === "Streetwear") {
    if (/\bblazer\b/.test(allTypes) && outfit.occasion !== "bureau") {
      errors.push("Streetwear contient blazer (interdit hors smart casual bureau)");
    }
    if (/\bderbies\b|\brichelieu\b/.test(allTypes)) {
      errors.push("Streetwear contient derbies/richelieu (interdit)");
    }
    if (outfit.occasion === "bureau" && /\bcargo\b|chunky/.test(allTypes)) {
      errors.push("Streetwear + Bureau ne doit pas contenir cargo ni chunky");
    }
  }
  return { ok: errors.length === 0, errors };
}
