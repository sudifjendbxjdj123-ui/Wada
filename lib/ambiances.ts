/**
 * lib/ambiances.ts
 *
 * DES COULEURS À UNE AMBIANCE.
 *
 * Brief client 2026-08-22 : « N°001 / Scandinave / N°002 / Française donne
 * une sensation assez encyclopédique. C'est intéressant pour respecter
 * l'œuvre de Wada, mais pas très émotionnel pour quelqu'un qui cherche
 * comment s'habiller. » Et le changement de cadrage qu'il propose :
 *
 *   avant   « Voici 348 palettes. Choisissez-en une. »
 *   après   « Quelle atmosphère voulez-vous porter aujourd'hui ? »
 *
 * Le dictionnaire ne porte aucune notion d'ambiance : il a des couleurs, des
 * styles, des saisons, une phrase d'occasions. Ce module la DÉDUIT — de la
 * clarté, de la saturation et de la teinte des couleurs, croisées avec les
 * styles déclarés. Rien n'est inventé à la main palette par palette : 348
 * classements écrits en dur seraient invérifiables et se contrediraient.
 *
 * Une palette porte plusieurs ambiances (« Rosée du matin » est à la fois
 * douce et naturelle). C'est voulu : les pastilles filtrent, elles ne
 * rangent pas.
 */

import type { DictionaryEntry } from "./data";

export type Ambiance =
  | "naturelle" | "elegante" | "audacieuse"
  | "douce" | "sombre" | "lumineuse" | "romantique";

export const AMBIANCES: Array<{ cle: Ambiance; label: string }> = [
  { cle: "naturelle",  label: "Naturelle" },
  { cle: "elegante",   label: "Élégante" },
  { cle: "audacieuse", label: "Audacieuse" },
  { cle: "douce",      label: "Douce" },
  { cle: "sombre",     label: "Sombre" },
  { cle: "lumineuse",  label: "Lumineuse" },
  { cle: "romantique", label: "Romantique" },
];

/* ── Mesures sur un hex ────────────────────────────────────────────────── */

function rgb(hex: string): [number, number, number] {
  const h = (hex || "").replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}
function luminance(hex: string): number {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
function chroma(hex: string): number {
  const [r, g, b] = rgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}
/** Teinte en degrés (0 = rouge, 120 = vert, 240 = bleu). */
function teinte(hex: string): number {
  const [r0, g0, b0] = rgb(hex);
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function moyenne(v: number[]): number {
  return v.length ? v.reduce((a, x) => a + x, 0) / v.length : 0;
}

/* ── Seuils ────────────────────────────────────────────────────────────
   Calibrés sur les 348 palettes du dictionnaire pour qu'aucune pastille ne
   soit vide et qu'aucune n'en absorbe la quasi-totalité — une pastille qui
   rend 300 résultats ne filtre rien. */
/* Ces seuils ont été calibrés en mesurant la couverture réelle sur les 348
   palettes, pas choisis à vue. Cible : entre ~10 % et ~45 % par pastille —
   au-delà elle ne filtre plus rien, en deçà elle paraît cassée. */
const SOMBRE_MAX_LUM = 95;
const LUMINEUSE_MIN_LUM = 168;
const AUDACIEUSE_MIN_CHROMA = 132;
const DOUCE_MAX_CHROMA = 55;
const DOUCE_MIN_LUM = 150;
/* Bande de teintes « terre et végétal » : des jaunes-ocres aux verts. */
const NATURELLE_TEINTE = [25, 150] as const;

/** Styles déclarés qui pèsent dans le classement — un accord catalogué
    « formel » est élégant même si ses teintes sont sourdes. */
const STYLE_VERS_AMBIANCE: Record<string, Ambiance> = {
  "formel": "elegante",
  "bourgeoisie": "elegante",
  "luxe discret": "elegante",
  "romantique": "romantique",
  "bohème": "naturelle",
  "avant-garde": "audacieuse",
  "streetwear": "audacieuse",
  /* « minimaliste » (83 palettes) et « vintage » (105) sont volontairement
     absents. Mesuré : avec eux, « Élégante » remontait 72 % du dictionnaire
     et « Naturelle » 68 % — une pastille qui rend 250 résultats sur 348 ne
     filtre rien. Et le rapprochement était douteux : minimal n'est pas
     habillé, vintage n'est pas végétal. */
};

/** Les ambiances portées par une palette. Jamais vide : voir le repli. */
export function ambiancesDe(entry: DictionaryEntry): Ambiance[] {
  const hexes = (entry.colors ?? []).map((c) => c.hex).filter(Boolean);
  if (hexes.length === 0) return ["douce"];

  const lums = hexes.map(luminance);
  const chromas = hexes.map(chroma);
  const lumMoy = moyenne(lums);
  const chromaMax = Math.max(...chromas);
  const chromaMoy = moyenne(chromas);

  const out = new Set<Ambiance>();

  if (lumMoy <= SOMBRE_MAX_LUM) out.add("sombre");
  if (lumMoy >= LUMINEUSE_MIN_LUM) out.add("lumineuse");
  if (chromaMax >= AUDACIEUSE_MIN_CHROMA) out.add("audacieuse");
  if (chromaMoy <= DOUCE_MAX_CHROMA && lumMoy >= DOUCE_MIN_LUM) out.add("douce");

  /* Naturelle : au moins deux teintes dans la bande terre/végétal, avec une
     saturation contenue. Une seule couleur verte ne fait pas une palette
     naturelle — un vert fluo sur du noir est audacieux, pas naturel. */
  const dansLaBande = hexes.filter((h) => {
    const t = teinte(h);
    return chroma(h) > 12 && t >= NATURELLE_TEINTE[0] && t <= NATURELLE_TEINTE[1];
  }).length;
  if (dansLaBande >= 2 && chromaMoy < 68) out.add("naturelle");

  /* Romantique : rosés et mauves — la bande des magentas. */
  const rosés = hexes.filter((h) => {
    const t = teinte(h);
    return chroma(h) > 18 && (t >= 290 || t <= 20);
  }).length;
  if (rosés >= 2 && lumMoy > 120) out.add("romantique");

  /* Élégante : peu de couleur, mais du contraste — la définition même du
     sobre habillé. */
  const ecartLum = Math.max(...lums) - Math.min(...lums);
  if (chromaMoy < 42 && ecartLum > 100) out.add("elegante");

  /* Renfort par les styles catalogués. */
  for (const s of entry.styles ?? []) {
    const a = STYLE_VERS_AMBIANCE[s.toLowerCase()];
    if (a) out.add(a);
  }

  /* Repli : une palette sans ambiance ne serait jamais trouvable.
     La première version tranchait sur la seule clarté (« > 140 → lumineuse,
     sinon sombre ») et se trompait visiblement : la palette 055 « Aube sur
     Berlin » — cuir naturel, terracotta, camel, clarté moyenne 133 — sortait
     classée SOMBRE et remontait en tête quand on cliquait sur cette pastille.
     Trois bruns chauds ne sont pas une palette sombre.
     On regarde donc les propriétés dans l'ordre où elles sautent aux yeux :
     vraiment foncée, sinon terreuse, sinon vraiment claire, sinon douce. */
  if (out.size === 0) {
    if (lumMoy <= 120) out.add("sombre");
    else if (dansLaBande >= 2) out.add("naturelle");
    else if (lumMoy >= 150) out.add("lumineuse");
    else out.add("douce");
  }
  return [...out];
}

export function aPourAmbiance(entry: DictionaryEntry, a: Ambiance): boolean {
  return ambiancesDe(entry).includes(a);
}

/* ══════════════════════════════════════════════════════════════════════
   MOTS D'AMBIANCE — « Doux · Naturel · Minimal »
   ══════════════════════════════════════════════════════════════════════
   Trois adjectifs sous le nom, comme dans la maquette. On part des styles
   déclarés (fidèles à l'œuvre) et on complète par l'ambiance déduite. */

const MOT_AMBIANCE: Record<Ambiance, string> = {
  naturelle: "Naturel", elegante: "Élégant", audacieuse: "Audacieux",
  douce: "Doux", sombre: "Profond", lumineuse: "Lumineux", romantique: "Romantique",
};

const MOT_STYLE: Record<string, string> = {
  "minimaliste": "Minimal", "formel": "Habillé", "bourgeoisie": "Classique",
  "luxe discret": "Discret", "romantique": "Romantique", "bohème": "Bohème",
  "vintage": "Vintage", "streetwear": "Urbain", "avant-garde": "Affirmé",
  "préppy": "Preppy",
};

export function motsAmbiance(entry: DictionaryEntry, max = 3): string[] {
  const vus = new Set<string>();
  const out: string[] = [];
  /* L'ambiance déduite passe en premier : c'est elle qui dit l'atmosphère,
     le style dit plutôt le vestiaire. */
  for (const a of ambiancesDe(entry)) {
    const m = MOT_AMBIANCE[a];
    if (m && !vus.has(m)) { vus.add(m); out.push(m); }
    if (out.length >= max) return out;
  }
  for (const s of entry.styles ?? []) {
    const m = MOT_STYLE[s.toLowerCase()];
    if (m && !vus.has(m)) { vus.add(m); out.push(m); }
    if (out.length >= max) return out;
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════
   « IDÉAL POUR »
   ══════════════════════════════════════════════════════════════════════
   Point 5 du brief : « Tu ne vends plus une combinaison RGB. Tu vends une
   ambiance et une occasion. »

   Le champ `occasions` du dictionnaire est une phrase libre (« Bureau.
   Matins froids. »). On la découpe, on garde les deux premiers segments, et
   on ajoute la saison. Rien n'est inventé : ce sont les mots de l'auteur. */

const SAISON_LISIBLE: Record<string, string> = {
  printemps: "Printemps", "été": "Été", automne: "Automne",
  hiver: "Hiver", any: "Toute saison",
};

export function idealPour(entry: DictionaryEntry, max = 3): string[] {
  const out: string[] = [];
  for (const seg of (entry.occasions || "").split(/[.·•]/)) {
    const s = seg.trim();
    if (s) out.push(s);
    if (out.length >= max - 1) break;
  }
  const saison = (entry.seasons ?? [])[0];
  if (saison && SAISON_LISIBLE[saison]) out.push(SAISON_LISIBLE[saison]);
  return out.slice(0, max);
}

/* ══════════════════════════════════════════════════════════════════════
   CE QUE LA PALETTE PERMET
   ══════════════════════════════════════════════════════════════════════
   La maquette demande « 12 tenues créées avec cette harmonie ». Mesuré : le
   moteur compose 20 tenues valides à partir de PRESQUE TOUTES les palettes
   (médiane 20, maximum 20, sur 348). Afficher un nombre qui varie alors
   qu'il ne varie pas serait inventer une donnée — et le client s'en
   apercevrait en comparant deux cartes.

   Ce qui varie vraiment, et que le moteur sait calculer, c'est la MEILLEURE
   tenue que la palette permet : de 80 à 98 sur 100 selon les accords, avec
   sept valeurs distinctes. On affiche donc ça, plus le registre et
   l'occasion qui l'atteignent — une information vraie, différente d'une
   palette à l'autre, et directement actionnable.

   Coût mesuré : 1,1 ms par palette. On ne l'appelle que pour les quelques
   palettes réellement affichées, jamais pour les 348. */

import { composeOutfitFromProfile, type Registre } from "./registreEngine";
import { scoreTenue } from "./composer/scoreTenue";

const REGISTRES: Registre[] = ["Minimal", "Classique", "Old money", "Décontracté", "Streetwear"];
const OCCASIONS = ["quotidien", "bureau", "sorties", "voyage"] as const;

const OCCASION_LISIBLE: Record<string, string> = {
  quotidien: "au quotidien", bureau: "au bureau",
  sorties: "en soirée", voyage: "en voyage",
};

export type MeilleureTenue = {
  score: number;
  registre: Registre;
  occasion: string;
  /** « 98 % en Old money, au quotidien » */
  resume: string;
};

const cache = new Map<string, MeilleureTenue>();

export function meilleureTenue(entry: DictionaryEntry): MeilleureTenue {
  const cle = entry.number;
  const dejaVu = cache.get(cle);
  if (dejaVu) return dejaVu;

  let best: MeilleureTenue = {
    score: 0, registre: "Minimal", occasion: "quotidien",
    resume: "",
  };
  for (const registre of REGISTRES) {
    for (const occasion of OCCASIONS) {
      const tenue = composeOutfitFromProfile(entry, {
        style: registre, fit: "standard", occasion_focus: occasion, gender: null,
      });
      const note = scoreTenue(tenue, { saison: null });
      if (note.total > best.score) {
        best = { score: note.total, registre, occasion, resume: "" };
      }
    }
  }
  best.resume = `${best.score} % en ${best.registre}, ${OCCASION_LISIBLE[best.occasion] ?? best.occasion}`;
  cache.set(cle, best);
  return best;
}
