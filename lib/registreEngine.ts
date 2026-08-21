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
import { equilibrerVolumes, chaussureStructurante, coupeNeutralisee } from "./composer/proportions";
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

export type Morphologie = "Rectangle" | "Triangle" | "Sablier" | "Rond" | "Athlétique";

export type ProfileForRegistre = {
  style: string;
  fit: string;
  occasion_focus: string;
  gender: "femme" | "homme" | "unisexe" | null;
  /** Optionnelle — ajuste la coupe SLOT PAR SLOT.
      Accepte les DEUX vocabulaires du site (voir normaliserMorphologie) :
      les libellés de /compte (« Sablier ») et les slugs du panneau de
      personnalisation (« sablier », « poire »…). */
  morphologie?: string | null;
};

/* Deux écrans demandent la morphologie avec deux vocabulaires différents :
   /compte enregistre `wada.profile.morphologie` en libellés (« Rectangle »,
   « Triangle », « Sablier », « Rond », « Athlétique ») et le panneau de
   personnalisation enregistre `wada-prefs.morpho` en slugs (« droite »,
   « poire », « ronde », « athletique »…). C'est la même information : on
   ramène les deux à un seul jeu de valeurs plutôt que d'ignorer l'un ou
   l'autre selon la page d'où vient le client.
   « poire » = hanches plus larges que les épaules = Triangle. */
const ALIAS_MORPHO: Record<string, Morphologie> = {
  rectangle: "Rectangle", droite: "Rectangle",
  triangle: "Triangle",   poire: "Triangle",
  sablier: "Sablier",
  rond: "Rond",           ronde: "Rond",
  athletique: "Athlétique", athletique_: "Athlétique",
};

/** Ramène une morphologie écrite dans l'un ou l'autre vocabulaire à la
    valeur canonique, ou null si la valeur est vide / inconnue. */
export function normaliserMorphologie(raw?: string | null): Morphologie | null {
  if (!raw || typeof raw !== "string") return null;
  const cle = raw
    .trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");   // « athlétique » → « athletique »
  return ALIAS_MORPHO[cle] ?? null;
}

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

/* ── MATIÈRE PAR PIÈCE (2026-08-21) ──────────────────────────────────────
   Les cinq pièces recevaient la MÊME liste de matières — celle du registre.
   Une tenue Minimal annonçait donc « coton épais, laine fine » sur le
   t-shirt, sur le pantalon, sur le manteau ET sur les chaussures.

   La règle 5 du brief demande l'inverse : « Mélange 2–3 matières. C'est ce
   qui évite qu'une tenue paraisse plate. » Une matière répétée cinq fois
   n'est pas un mélange, c'est une seule matière.

   On déduit donc la matière du TYPE de la pièce — un jean est en denim, un
   mocassin en cuir, un manteau en laine — et on retombe sur la liste du
   registre quand le type ne dit rien. La liste du registre est alors
   distribuée pièce par pièce plutôt que répétée, ce qui donne mécaniquement
   2 à 3 matières sur la tenue. */
const MATIERE_PAR_TYPE: Array<{ motif: RegExp; matiere: string }> = [
  { motif: /jean|denim/i,                          matiere: "denim" },
  { motif: /cachemire/i,                           matiere: "cachemire" },
  { motif: /\blin\b/i,                             matiere: "lin" },
  { motif: /daim|su[eè]de/i,                       matiere: "daim" },
  { motif: /cuir|loafer|derb|richelieu|mocassin/i, matiere: "cuir" },
  { motif: /maille|pull|cardigan|bonnet|polo maille/i, matiere: "maille" },
  { motif: /laine|manteau|blazer|trench|[ée]charpe/i,  matiere: "laine" },
  { motif: /hoodie|sweat|jogging|molleton/i,       matiere: "molleton" },
  { motif: /tech|parka|coupe-vent|imperm/i,        matiere: "tissu technique" },
  { motif: /soie|foulard|cravate/i,                matiere: "soie" },
  { motif: /toile|tote|espadrille|casquette/i,     matiere: "toile" },
  { motif: /oxford|chemise|t-shirt|marini[èe]re|coton/i, matiere: "coton" },
  { motif: /sneakers?|baskets?/i,                  matiere: "cuir" },
];

const ORDRE_SLOTS_MATIERE: SlotKey[] = ["haut", "bas", "veste", "chaussures", "accent"];

/** Une matière, déduite du type de la pièce ; à défaut, la liste du
    registre distribuée par slot plutôt que répétée à l'identique. */
function matieresDuSlot(slot: SlotKey, registre: Registre, type: string): string[] {
  for (const { motif, matiere } of MATIERE_PAR_TYPE) {
    if (motif.test(type)) return [matiere];
  }
  const liste = MATERIALS_BY_REGISTRE[registre];
  const idx = Math.max(0, ORDRE_SLOTS_MATIERE.indexOf(slot));
  return [liste[idx % liste.length]];
}

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

/* ── MORPHOLOGIE → coupe par pièce (2026-08-21) ──────────────────────────
   Le champ `morphologie` était demandé au client sur /compte et n'était lu
   nulle part : il n'entrait dans aucune décision de composition.

   La difficulté est qu'une coupe ne se choisit pas globalement. La règle de
   base de l'habillement est l'ÉQUILIBRE des volumes : on met du volume là où
   la silhouette en manque, et on reste droit là où elle en a déjà. Une coupe
   unique appliquée aux cinq pièces — ce que faisait le moteur — ne peut pas
   exprimer ça : « ample » sur une carrure déjà large l'élargit encore.

   Ce sont des principes d'habillement stables, pas des tendances de saison :
     Triangle (hanches plus larges que les épaules)
        volume et structure en haut, ligne droite et sobre en bas
     Athlétique (épaules larges, taille peu marquée)
        fluide en haut pour adoucir la carrure, un peu de volume en bas
     Rectangle (peu de taille marquée)
        marquer la taille : haut ajusté, veste cintrée
     Sablier (taille marquée)
        suivre la ligne : ajusté, l'ample efface justement ce qui fait la forme
     Rond (volume sur le torse)
        coupes droites et verticales ; ni ajusté sur le torse ni ample, qui
        ajoutent l'un et l'autre du volume

   La coupe choisie par le client reste la référence : la morphologie ne
   s'applique QUE s'il n'a rien précisé (fit « standard »). S'il a demandé de
   l'oversized, on ne le contredit pas. */
const MORPHO_FIT: Record<Morphologie, Partial<Record<SlotKey, Fit>>> = {
  Triangle:     { haut: "ample",    veste: "standard", bas: "standard" },
  "Athlétique": { haut: "standard", veste: "standard", bas: "ample" },
  Rectangle:    { haut: "ajuste",   veste: "ajuste",   bas: "standard" },
  Sablier:      { haut: "ajuste",   veste: "ajuste",   bas: "ajuste" },
  Rond:         { haut: "standard", veste: "standard", bas: "standard" },
};

/* ── PROPORTIONS PAR REGISTRE (2026-08-21) ───────────────────────────────
   Mesuré sur les 6 960 tenues que le moteur produit (348 palettes × 5
   registres × 4 occasions) : les proportions étaient le point FAIBLE de
   44 % d'entre elles, avec une moyenne de 16/20. La cause est mécanique —
   sans coupe demandée et sans morphologie, les cinq pièces sortaient toutes
   en « standard », donnant une silhouette droite : juste, mais plate.

   Or la règle 3 du brief est un contraste : « haut ample → bas droit »,
   « bas large → haut structuré ». Une tenue sans opposition de volumes ne
   la satisfait jamais.

   Chaque registre reçoit donc sa proportion par défaut, tirée des tendances
   qui le caractérisent (cf. lib/tendances2026.ts) :
     Minimal / Classique / Old money → volume en BAS (pantalon à pinces,
       pantalon fluide, jupe colonne : la ligne 2026 du tailoring)
     Décontracté / Streetwear → volume en HAUT (surchemise, hoodie), la
       silhouette workwear et street, avec un bas qui reste droit.

   Ce n'est qu'un défaut : il ne s'applique que si le client n'a rien demandé
   ET que la morphologie ne dit rien. */
const PROPORTION_PAR_REGISTRE: Record<Registre, Partial<Record<SlotKey, Fit>>> = {
  "Minimal":     { bas: "ample" },
  "Classique":   { bas: "ample" },
  "Old money":   { bas: "ample" },
  "Décontracté": { haut: "ample" },
  "Streetwear":  { haut: "ample" },
};

/* Quelle pièce PORTE le volume dans chaque registre — la « pièce principale »
   de la règle 1 du brief. C'est elle qui reçoit l'ample quand le client en
   demande ; l'autre extrémité du corps tient la ligne. */
const SLOT_PORTEUR: Record<Registre, SlotKey> = {
  "Minimal": "bas", "Classique": "bas", "Old money": "bas",
  "Décontracté": "haut", "Streetwear": "haut",
};

/** Coupe retenue pour un slot donné.
    Priorité : choix explicite du client > morphologie > défaut du registre. */
function fitForSlot(
  fitKey: Fit, slot: SlotKey, morpho: Morphologie | null, registre: Registre,
): Fit {
  /* Le client demande de l'ample. On le lui donne — mais sur la pièce où le
     volume se lit, pas sur les cinq. Propagé partout, « ample » produisait
     haut ET bas amples : exactement le contre-exemple du brief (« volumes
     amples partout »), noté 14/20 au mieux. Porté par une seule extrémité,
     c'est un vrai look oversize, et un contraste de volumes à 20/20.
     Mesuré : 33 % des tenues tombaient dans ce cas. */
  if (fitKey === "ample") {
    if (slot === SLOT_PORTEUR[registre] || slot === "veste") return "ample";
    if (slot === "haut" || slot === "bas") return "standard";
    return "standard";
  }
  /* L'ajusté intégral n'est PAS corrigé : le brief le déclare viable
     (« peut fonctionner, mais donne une esthétique complètement différente »). */
  if (fitKey !== "standard") return fitKey;      // choix explicite du client
  if (morpho) {
    const m = MORPHO_FIT[morpho]?.[slot];
    /* La morphologie a la main dès qu'elle dit quelque chose pour ce slot ;
       sinon le défaut du registre reprend, pour ne pas retomber à plat. */
    if (m) return m;
  }
  return PROPORTION_PAR_REGISTRE[registre]?.[slot] ?? fitKey;
}

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

/* ── PLACEMENT DES COULEURS (refonte 2026-08-21) ─────────────────────────
   Chaque palette du dictionnaire porte une `composition` écrite à la main :
   cinq pièces, avec la couleur nommée dans le texte (« Cargo bleu ardoise »,
   « Hoodie technique noir »). C'est le placement voulu par l'auteur de la
   palette — la vraie proposition Wada.

   Le moteur l'ignorait. Il rangeait mécaniquement les couleurs par clarté et
   posait TOUJOURS la plus claire en haut, la plus foncée en bas. Mesuré sur
   les 348 palettes du dictionnaire :
     • haut       63 % de désaccord avec la composition d'origine
     • bas        70 %
     • veste      73 %
     • 19 palettes sur 348 seulement étaient placées comme prévu
     • et la veste reprenait EXACTEMENT la couleur du haut sur 348/348 —
       un manteau de la teinte du pull qu'il recouvre, sur toutes les tenues.

   On lit donc d'abord la composition. Les libellés « Top / Bottom / Outer »
   donnent le slot, et le nom de couleur retrouvé dans le texte donne la
   teinte. 282 palettes sur 348 (81 %) résolvent ainsi leurs trois vêtements ;
   pour les autres, on retombe sur la règle claire-en-haut d'avant, corrigée
   pour que la veste ne copie plus le haut.

   Chaussures et accent restent hors composition : les compositions d'origine
   n'y mettent quasiment jamais une couleur de la palette (10 fois sur 348
   pour les chaussures) — l'auteur les laisse en noir, tan, ivoire. On garde
   donc la règle du moteur : le ton le plus foncé ancre les chaussures, le
   plus vif fait l'accent. */

const PIECE_VERS_SLOT: Record<string, SlotKey> = {
  Top: "haut", Shirt: "haut", Bottom: "bas", Outer: "veste",
};

/** Minuscules sans accents — « Gris givré » et « gris givre » doivent matcher. */
function sansAccents(v: string): string {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Bornes de mot autour d'un terme, sur du texte déjà normalisé.
    Sans elles, la couleur « Os » matcherait « mocassins » et « Lin »
    matcherait « linge ». */
function motPresent(terme: string, texte: string): boolean {
  if (!terme) return false;
  const echappe = terme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${echappe}([^a-z0-9]|$)`).test(texte);
}

/** Couleurs placées par l'auteur de la palette, slot par slot. Vide si la
    composition ne nomme aucune couleur reconnaissable. */
function couleursDeLaComposition(
  entry: DictionaryEntry
): Partial<Record<SlotKey, { hex: string; name: string }>> {
  const out: Partial<Record<SlotKey, { hex: string; name: string }>> = {};
  const noms = entry.colors.map((c) => sansAccents(c.name || ""));

  for (const piece of entry.composition ?? []) {
    const slot = PIECE_VERS_SLOT[piece.piece];
    /* Premier gagnant : « Top » prime sur « Shirt » quand les deux existent. */
    if (!slot || out[slot]) continue;
    const texte = sansAccents(piece.item || "");
    if (!texte) continue;

    /* 1. Nom complet — le cas franc : « gris givré » dans « Pull gris givré ». */
    const exact = noms.findIndex((n) => n && motPresent(n, texte));
    if (exact >= 0) { out[slot] = entry.colors[exact]; continue; }

    /* 2. Premier mot du nom. Les palettes nomment souvent leurs teintes en
       deux mots (« Sauge tendre », « Ardoise profonde », « Indigo profond »)
       mais les compositions n'en citent qu'un : « Pantalon ample sauge ».
       Exiger le nom entier faisait manquer 44 placements — dont la palette
       002 « Rosée du matin », où le pantalon sauge tombait sur la teinte
       mousse, la même que le cardigan.
       Deux garde-fous : au moins 4 lettres (« Os », « Or » matcheraient
       n'importe quoi) et une seule couleur candidate — si deux teintes de
       la palette commencent par le même mot, on ne devine pas. */
    const candidats: number[] = [];
    noms.forEach((n, i) => {
      const premier = n.split(/\s+/)[0];
      if (premier && premier.length >= 4 && motPresent(premier, texte)) candidats.push(i);
    });
    const uniques = [...new Set(candidats)];
    if (uniques.length === 1) out[slot] = entry.colors[uniques[0]];
  }
  return out;
}

function pickColors(entry: DictionaryEntry): Record<SlotKey, { hex: string; name: string }> {
  const fallback = { hex: "#1E1E1E", name: "ink" };
  const cols = entry.colors.length ? entry.colors : [fallback];
  // Couleur la plus vive = pop (accent). Le reste = neutres, triés clair→foncé.
  const bySaturation = [...cols].sort((a, b) => {
    try {
      return chroma(b.hex) - chroma(a.hex);
    } catch {
      return 0;
    }
  });
  const pop = bySaturation[0] ?? fallback;
  const neutrals = (bySaturation.length > 1 ? bySaturation.slice(1) : cols)
    .slice()
    .sort((a, b) => {
      try {
        return luminance(b.hex) - luminance(a.hex);
      } catch {
        return 0;
      }
    });
  const light = neutrals[0] ?? pop ?? fallback;
  const dark = neutrals[neutrals.length - 1] ?? light ?? fallback;

  const curee = couleursDeLaComposition(entry);

  /* On pose d'abord ce que l'auteur a décidé, PUIS on comble les trous avec
     une teinte encore libre. Sans cette réservation, un slot non curé
     reprenait la teinte d'un slot curé voisin : palette 037, l'auteur met le
     cargo en bleu ardoise, le haut n'est pas curé (« hoodie noir », hors
     palette) et le repli « le plus clair » retombait sur ce même bleu — haut
     et bas identiques. */
  const place: Partial<Record<SlotKey, { hex: string; name: string }>> = {};
  const pris = new Set<string>();
  for (const slot of ["haut", "bas", "veste"] as const) {
    const c = curee[slot];
    if (c) { place[slot] = c; pris.add(c.hex); }
  }
  /* Le pool de repli exclut la teinte vive : elle est réservée à l'accent,
     seul point de couleur de la tenue. */
  const trier = (sens: "clair" | "fonce") =>
    [...neutrals].sort((a, b) => {
      try {
        return sens === "clair"
          ? luminance(b.hex) - luminance(a.hex)
          : luminance(a.hex) - luminance(b.hex);
      } catch {
        return 0;
      }
    });
  const combler = (slot: SlotKey, sens: "clair" | "fonce", eviter?: string) => {
    if (place[slot]) return;
    const ordre = trier(sens);
    /* Si toutes les neutres sont déjà portées (palette de 3 teintes dont une
       est réservée à l'accent), on assume la reprise — mais pas n'importe
       laquelle : un haut ton sur ton avec le bas est un ensemble tonal, une
       veste ton sur ton avec le haut efface le haut qu'elle recouvre. D'où
       `eviter`. */
    place[slot] =
      ordre.find((c) => !pris.has(c.hex)) ??
      ordre.find((c) => c.hex !== eviter) ??
      ordre[0] ??
      fallback;
    pris.add(place[slot]!.hex);
  };
  combler("haut", "clair");
  combler("bas", "fonce");
  combler("veste", "fonce", place.haut?.hex);

  return {
    haut: place.haut ?? light,
    veste: place.veste ?? dark,
    bas: place.bas ?? dark,
    chaussures: dark,   // ton le plus foncé : ancre la silhouette
    accent: pop,        // l'unique point de couleur vif
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

  // Type de base par slot (déterministe par palette), AVANT modifier d'occasion.
  const baseTypes: Record<SlotKey, string> = {} as Record<SlotKey, string>;
  SLOTS.forEach((slot, idx) => {
    baseTypes[slot] = pickFromVocab(VOCAB[registre][slot], entry.number, idx);
  });
  /* Cohérence 2026-06-10 (user « pull + cardigan ») : pas DEUX mailles —
     un pull/maille/sweat en HAUT + un cardigan en VESTE = superposition
     redondante. Si c'est le cas, on remplace la veste par la 1ʳᵉ option
     NON-maille de son vocabulaire registre (blazer, manteau, surchemise…). */
  if (/pull|maille|tricot|knit|cardigan|sweat/i.test(baseTypes.haut) && /cardigan|maille|tricot|knit|strick/i.test(baseTypes.veste)) {
    const nonKnit = VOCAB[registre].veste.find((t) => !/cardigan|maille|tricot|knit|strick/i.test(t));
    if (nonKnit) baseTypes.veste = nonKnit;
  }

  /* Une seule normalisation pour toute la tenue — les cinq slots lisent la
     même valeur canonique. */
  const morpho = normaliserMorphologie(profile.morphologie);

  /* Types finaux d'abord : la chaussure décide si une silhouette tout-ample
     reste tenue (un mocassin ferme la ligne, une grosse sneaker l'alourdit). */
  const typesFinaux = {} as Record<SlotKey, string>;
  for (const slot of SLOTS) {
    typesFinaux[slot] = applyOccasionModifier(slot, baseTypes[slot], registre, occasion);
  }

  /* Coupe propre à CHAQUE pièce : la morphologie peut demander du volume en
     haut et de la ligne droite en bas, ce qu'une coupe globale ne sait pas
     dire. Chaussures et accent ne sont pas concernés — leur coupe ne joue
     pas sur l'équilibre de la silhouette. */
  const fits = {} as Record<SlotKey, Fit>;
  for (const slot of SLOTS) {
    /* Une chaussure ou une ceinture n'a pas de « coupe ample » : la coupe
       demandée par le client ne doit pas leur être propagée, sous peine de
       libellés absurdes et d'une requête marchand « sneakers … oversized ». */
    fits[slot] = coupeNeutralisee(slot)
      ? "standard"
      : fitForSlot(fitKey, slot, morpho, registre);
  }

  /* Garde-fou de proportions (règle 3 du brief). Quand le client demande de
     l'ample, les CINQ pièces le devenaient : « volumes amples partout, sans
     rien pour structurer » — la tenue que le brief donne justement en
     contre-exemple. On garde ses volumes sur le haut et le bas, et on rend
     la veste structurée : c'est elle qui tient la silhouette. */
  const { fits: fitsEquilibres } = equilibrerVolumes(
    fits, chaussureStructurante(typesFinaux.chaussures),
  );

  const slots: RegistreSlot[] = SLOTS.map((slot) => {
    const finalType = typesFinaux[slot];
    const paletteColor = colors[slot];
    // Brief §1A : nom de couleur DÉRIVÉ DU HEX (jamais le nom poétique
    // de la palette Wada). « Crème » sur un hex camel devient « Camel ».
    const trueColorName = hexToPlainName(paletteColor.hex);
    const color = { hex: paletteColor.hex, name: trueColorName };
    const slotFitKey = fitsEquilibres[slot];
    // Mots-clés de recherche marchand : type + couleur (hex-fidèle) + fit
    const fitKw = slotFitKey === "ample" ? " oversized" : slotFitKey === "ajuste" ? " slim" : "";
    const searchKeywords = `${finalType}${fitKw} ${trueColorName}`.toLowerCase().replace(/\s+/g, " ").trim();
    return {
      slot,
      type: finalType,
      fit: fitAdjective(slotFitKey, registre),
      color,
      materials: matieresDuSlot(slot, registre, finalType),
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

  /* Règles ajoutées 2026-08-21 — filet de sécurité sur ce que le planificateur
     garantit déjà. Si l'une saute, c'est une régression du planificateur, pas
     une tenue à corriger après coup. */
  if ((outfit.registre === "Classique" || outfit.registre === "Old money") &&
      /sneakers?|baskets?|runners?/i.test(allTypes)) {
    errors.push(`${outfit.registre} contient des sneakers`);
  }
  const haut = outfit.slots.find((s) => s.slot === "haut")?.type ?? "";
  const veste = outfit.slots.find((s) => s.slot === "veste")?.type ?? "";
  const maille = /pull|maille|tricot|knit|cardigan|sweat/i;
  if (haut && veste && maille.test(haut) && maille.test(veste)) {
    errors.push("Deux mailles superposées (haut + veste)");
  }
  return { ok: errors.length === 0, errors };
}
