/**
 * lib/composer/scoreTenue.ts
 *
 * NOTE DE TENUE SUR 100 — barème du brief client.
 *
 *   Harmonie des couleurs      25
 *   Proportions / silhouettes  20
 *   Cohérence des styles       15
 *   Occasion                   15
 *   Matières / textures        10
 *   Saison / météo             10
 *   Détails & accessoires       5
 *                             ───
 *                             100
 *
 * Ce que ça change par rapport à l'existant
 * ─────────────────────────────────────────
 * `scoreOutfit.ts` note déjà des tenues, mais uniquement sur des produits
 * marchands réels (ComposerProduct) et sur d'autres critères — registre,
 * marques d'inspiration, slots remplis. Il ne regarde JAMAIS les volumes.
 * La tenue que le brief donne en contre-exemple — « pantalon large gris +
 * énorme hoodie + grosses sneakers + manteau très ample » — y obtient la
 * note maximale, puisque ses couleurs sont bonnes.
 *
 * Ce module-ci note le PLAN de tenue (RegistreOutfit), donc avant même
 * d'aller chercher les produits, et il évalue les proportions. Les deux sont
 * complémentaires : ici on juge la composition, là-bas on juge le casting.
 *
 * Chaque critère renvoie sa note ET sa raison en français, pour que la note
 * soit explicable au client plutôt que d'être un chiffre opaque.
 */

import type { RegistreOutfit, SlotKey, Fit, Occasion } from "@/lib/registreEngine";
import { lireVolumes, noterProportions, chaussureStructurante } from "./proportions";
import {
  MATIERES_2026, COULEURS_2026, TENDANCES_2026,
  type SaisonTendance, type Formalite,
} from "@/lib/tendances2026";
import { deltaEHex } from "@/lib/colorDistance";

export type Critere = {
  cle: string;
  libelle: string;
  note: number;
  max: number;
  raison: string;
};

export type NoteTenue = {
  total: number;
  criteres: Critere[];
  /** Le point faible : le critère qui perd le plus de points. */
  aTravailler: Critere | null;
};

/* ══════════════════════════════════════════════════════════════════════
   Outils couleur
   ══════════════════════════════════════════════════════════════════════ */

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function chroma(hex: string): number {
  try { const [r, g, b] = rgb(hex); return Math.max(r, g, b) - Math.min(r, g, b); }
  catch { return 0; }
}
function luminance(hex: string): number {
  try { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b; }
  catch { return 0; }
}
/** Au-delà, la couleur « se voit » et ne peut plus jouer le rôle de neutre. */
const SEUIL_VIVE = 60;

/* ══════════════════════════════════════════════════════════════════════
   1. HARMONIE DES COULEURS — 25 points
   ══════════════════════════════════════════════════════════════════════
   Règle 2 du brief : « Limite la palette à 2–4 couleurs. 1 dominante +
   1 secondaire + 1 accent. » Et la règle implicite qui va avec : une seule
   couleur vive, sinon les pièces se disputent l'attention. */
function noterCouleurs(outfit: RegistreOutfit): Critere {
  const parSlot = new Map(outfit.slots.map((s) => [s.slot, s.color.hex]));
  const hexes = [...parSlot.values()];
  const distinctes = new Set(hexes).size;

  let note = 25;
  const reproches: string[] = [];

  /* Nombre de teintes. Le brief fixe la cible à « 2 à 4 couleurs » : quatre
     est DANS la cible, pas à sa limite. Le pénaliser faisait perdre 3 points
     à trois des quatre tenues que le brief lui-même donne en exemple réussi. */
  if (distinctes === 1) { note -= 6; reproches.push("une seule teinte sur toute la tenue"); }
  else if (distinctes === 5) { note -= 6; reproches.push("cinq teintes, la tenue commence à se disperser"); }
  else if (distinctes >= 6) { note -= 10; reproches.push(`${distinctes} teintes, la tenue se disperse`); }

  /* Une seule couleur vive. Les chaussures comptent : une chaussure vive
     dans une tenue qui a déjà un accent vif fait deux points d'attention. */
  const vives = new Set(
    ["haut", "bas", "veste", "chaussures", "accent"]
      .map((s) => parSlot.get(s as SlotKey))
      .filter((h): h is string => !!h && chroma(h) > SEUIL_VIVE),
  ).size;
  if (vives >= 3) { note -= 10; reproches.push("trois couleurs vives ou plus"); }
  else if (vives === 2) { note -= 5; reproches.push("deux couleurs vives se disputent l'attention"); }

  /* La veste recouvre le haut : même teinte = le haut disparaît. */
  const haut = parSlot.get("haut"), veste = parSlot.get("veste");
  if (haut && veste && haut === veste && distinctes > 2) {
    note -= 5; reproches.push("la veste reprend exactement la teinte du haut");
  }

  /* Contraste haut/bas : sans écart de clarté, la silhouette s'aplatit. */
  const bas = parSlot.get("bas");
  if (haut && bas && Math.abs(luminance(haut) - luminance(bas)) < 12 && haut !== bas) {
    note -= 3; reproches.push("haut et bas trop proches en clarté");
  }

  note = Math.max(0, Math.min(25, note));
  return {
    cle: "couleurs", libelle: "Harmonie des couleurs", note, max: 25,
    raison: reproches.length
      ? reproches[0].charAt(0).toUpperCase() + reproches[0].slice(1) + "."
      : `${distinctes} teintes qui se répondent, un seul point de couleur.`,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   2. PROPORTIONS — 20 points  (délégué à proportions.ts)
   ══════════════════════════════════════════════════════════════════════ */

/** Le moteur stocke la coupe en adjectif affichable (« oversized »,
    « ajustée »…). On revient à la clé de coupe pour raisonner dessus. */
export function fitDepuisAdjectif(adj: string): Fit {
  const a = (adj || "").toLowerCase();
  if (/ajust|slim|cintr|près du corps/.test(a)) return "ajuste";
  if (/ample|oversiz|relaxed|loose|large/.test(a)) return "ample";
  return "standard";
}

function noterProportionsCritere(outfit: RegistreOutfit): Critere {
  const fits: Partial<Record<SlotKey, Fit>> = {};
  for (const s of outfit.slots) fits[s.slot] = fitDepuisAdjectif(s.fit);

  const chaussures = outfit.slots.find((s) => s.slot === "chaussures")?.type ?? "";
  const structurant =
    chaussureStructurante(chaussures) ||
    fits.veste === "ajuste" || fits.veste === "standard";

  const lecture = lireVolumes(fits, structurant);
  return {
    cle: "proportions", libelle: "Proportions / silhouettes",
    note: noterProportions(lecture), max: 20, raison: lecture.explication,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   3. COHÉRENCE DES STYLES — 15 points
   ══════════════════════════════════════════════════════════════════════
   Règle 4 du brief : « Les pièces n'ont pas besoin d'être du même style,
   mais elles doivent dialoguer. Un pantalon à pinces + sneakers rétro
   fonctionne. Un costume + running ultra-technique est plus difficile. »

   On mesure donc l'ÉCART de formalité entre la pièce la plus habillée et la
   plus décontractée. Un écart de 1 ou 2 est le contraste voulu ; au-delà,
   les pièces ne se parlent plus. */

const FORMALITE_PIECE: Array<{ motif: RegExp; niveau: Formalite }> = [
  { motif: /smoking|costume\s*3|queue.de.pie/i, niveau: 4 },
  { motif: /escarpin|slingback|kitten|oxford|richelieu|vernie/i, niveau: 4 },
  { motif: /blazer|costume|tailored|à pinces|crayon|bustier|satin|velours|cummerbund/i, niveau: 3 },
  { motif: /chemise|derby|mocassin|loafer|manteau|trench|col roulé|jupe|robe|ballerine|mary\s*jane|cape/i, niveau: 3 },
  { motif: /pull|maille|cardigan|polo|surchemise|harrington|bomber|chelsea|boots|foulard|montre|ceinture|daim/i, niveau: 2 },
  { motif: /jean|denim|sneakers?|baskets?|bateau|field|workwear|chore|blouson/i, niveau: 1 },
  { motif: /hoodie|sweat|jogging|track|cargo|coupe-vent|molleton|runner|casquette|banane|maillot/i, niveau: 0 },
];

export function formalitePiece(type: string): Formalite | null {
  const t = (type || "").toLowerCase();
  if (!t) return null;
  for (const { motif, niveau } of FORMALITE_PIECE) if (motif.test(t)) return niveau;
  return null;
}

/* La formalité se lit sur les VÊTEMENTS. L'accessoire est justement le
   moyen de créer le contraste (règle 6 du brief) : une casquette dans une
   tenue preppy est voulue, pas une faute. La compter faisait tomber à 7/15
   la tenue « bomber marine + chemise rayée + jean écru + sneakers rétro +
   casquette » que le brief donne en exemple réussi. */
function niveauxVetements(outfit: RegistreOutfit): Formalite[] {
  return outfit.slots
    .filter((s) => s.slot !== "accent")
    .map((s) => formalitePiece(s.type))
    .filter((n): n is Formalite => n !== null);
}

function noterStyles(outfit: RegistreOutfit): Critere {
  const niveaux = niveauxVetements(outfit);

  if (niveaux.length < 2) {
    return { cle: "styles", libelle: "Cohérence des styles", note: 10, max: 15,
      raison: "Trop peu de pièces identifiées pour juger le dialogue des styles." };
  }

  const min = Math.min(...niveaux), max = Math.max(...niveaux);
  const ecart = max - min;
  const note = ecart === 0 ? 13 : ecart === 1 ? 15 : ecart === 2 ? 12 : ecart === 3 ? 7 : 3;

  const raison =
    ecart === 0 ? "Toutes les pièces au même niveau — cohérent, sans relief."
    : ecart === 1 ? "Un écart d'un cran entre les pièces : le contraste juste."
    : ecart === 2 ? "Contraste marqué entre les pièces, assumé."
    : `Écart de ${ecart} crans entre la pièce la plus habillée et la plus décontractée : elles ne se parlent plus.`;

  return { cle: "styles", libelle: "Cohérence des styles", note, max: 15, raison };
}

/* ══════════════════════════════════════════════════════════════════════
   4. OCCASION — 15 points
   ══════════════════════════════════════════════════════════════════════
   La formalité MOYENNE de la tenue doit correspondre à ce que l'occasion
   attend. Une tenue de bureau à formalité 0 ou un quotidien à 4 ratent
   la cible, même si tout le reste est juste. */

/* Le quotidien visé par WADA est un « casual chic », pas un jogging : à 1,
   les deux tenues de jour que le brief donne en exemple réussi (polo maille +
   pantalon à pinces + veste daim + mocassins) étaient jugées « trop
   habillées ». Le voyage reste à 1 : là, le confort prime vraiment. */
const FORMALITE_ATTENDUE: Record<Occasion, Formalite> = {
  bureau: 3, sorties: 3, quotidien: 2, voyage: 1,
};

function noterOccasion(outfit: RegistreOutfit): Critere {
  const niveaux = niveauxVetements(outfit);
  const attendu = FORMALITE_ATTENDUE[outfit.occasion] ?? 2;

  if (niveaux.length === 0) {
    return { cle: "occasion", libelle: "Occasion", note: 8, max: 15,
      raison: "Pièces non identifiées, occasion non vérifiable." };
  }

  const moyenne = niveaux.reduce<number>((a, n) => a + n, 0) / niveaux.length;
  const ecart = Math.abs(moyenne - attendu);
  const note = ecart <= 0.75 ? 15 : ecart <= 1.25 ? 12 : ecart <= 1.75 ? 9 : ecart <= 2.25 ? 6 : 2;

  /* Deux formulations, parce que « à » ne s'élide pas de la même façon que
     « pour » : « correspond à LE bureau » se lisait tel quel à l'écran. */
  const AVEC_A: Record<Occasion, string> = {
    bureau: "au bureau", sorties: "à une sortie",
    quotidien: "au quotidien", voyage: "à un voyage",
  };
  const AVEC_POUR: Record<Occasion, string> = {
    bureau: "le bureau", sorties: "une sortie",
    quotidien: "le quotidien", voyage: "un voyage",
  };
  const raison = ecart <= 1.25
    ? `Le niveau de la tenue correspond ${AVEC_A[outfit.occasion] ?? "à l'occasion"}.`
    : moyenne > attendu
      ? `Trop habillée pour ${AVEC_POUR[outfit.occasion] ?? "l'occasion"}.`
      : `Trop décontractée pour ${AVEC_POUR[outfit.occasion] ?? "l'occasion"}.`;

  return { cle: "occasion", libelle: "Occasion", note, max: 15, raison };
}

/* ══════════════════════════════════════════════════════════════════════
   5. MATIÈRES — 10 points
   ══════════════════════════════════════════════════════════════════════
   Règle 5 du brief : « Mélange 2–3 matières. C'est ce qui évite qu'une tenue
   paraisse plate. En revanche, accumuler 5–6 textures fortes crée vite trop
   d'informations. » D'où le poids : velours, cuir, satin, croco comptent
   double — deux d'entre elles suffisent à saturer. */

function matieresDeLaTenue(outfit: RegistreOutfit): { cles: string[]; charge: number } {
  /* Les chaussures sont exclues du compte : elles sont en cuir dans la quasi
     totalité des tenues, et personne ne les compte comme une texture du
     mélange. Les inclure faisait basculer en « trop de matières » l'exemple
     même que le brief donne comme réussi (veste daim + polo maille +
     pantalon laine + loafers cuir). */
  const hay = outfit.slots
    .filter((s) => s.slot !== "chaussures")
    .map((s) => `${s.type} ${(s.materials ?? []).join(" ")}`)
    .join(" ")
    .toLowerCase();
  const cles: string[] = [];
  let charge = 0;
  for (const m of MATIERES_2026) {
    if (hay.includes(m.nom.toLowerCase()) || hay.includes(m.cle)) {
      cles.push(m.cle);
      charge += m.poids;
    }
  }
  return { cles, charge };
}

function noterMatieres(outfit: RegistreOutfit): Critere {
  const { cles, charge } = matieresDeLaTenue(outfit);
  const n = cles.length;

  let note: number;
  let raison: string;
  if (n === 0) { note = 4; raison = "Aucune matière identifiée."; }
  else if (n === 1) { note = 5; raison = "Une seule matière : la tenue risque de paraître plate."; }
  else if (n <= 3) { note = 10; raison = `${n} matières qui se répondent — du relief sans surcharge.`; }
  else if (n === 4) { note = 7; raison = "Quatre matières : ça commence à faire beaucoup d'informations."; }
  else { note = 3; raison = `${n} matières : trop de textures, la tenue se brouille.`; }

  /* Deux matières lourdes (velours, cuir, satin, croco…) saturent même à
     deux ou trois matières comptées. */
  if (charge - n >= 2) {
    note = Math.max(0, note - 3);
    raison = "Plusieurs matières fortes en même temps — une seule suffirait.";
  }

  return { cle: "matieres", libelle: "Matières / textures", note, max: 10, raison };
}

/* ══════════════════════════════════════════════════════════════════════
   6. SAISON — 10 points
   ══════════════════════════════════════════════════════════════════════
   Du lin en janvier ou du velours en juillet : la tenue peut être parfaite
   par ailleurs, elle ne se portera pas. */

function noterSaison(outfit: RegistreOutfit, saison: SaisonTendance | null): Critere {
  if (!saison || saison === "toute") {
    return { cle: "saison", libelle: "Saison / météo", note: 8, max: 10,
      raison: "Sans saison précisée, la tenue est jugée toutes saisons." };
  }
  const { cles } = matieresDeLaTenue(outfit);
  if (cles.length === 0) {
    return { cle: "saison", libelle: "Saison / météo", note: 7, max: 10,
      raison: "Matières non identifiées, saison non vérifiable." };
  }

  const horsSaison = cles.filter((cle) => {
    const m = MATIERES_2026.find((x) => x.cle === cle);
    if (!m) return false;
    return !m.saisons.includes("toute") && !m.saisons.includes(saison);
  });

  const note = horsSaison.length === 0 ? 10 : horsSaison.length === 1 ? 6 : 2;
  const nomSaison = saison === "AH" ? "l'automne-hiver" : "le printemps-été";
  const raison = horsSaison.length === 0
    ? `Toutes les matières conviennent à ${nomSaison}.`
    : `${horsSaison.length} matière${horsSaison.length > 1 ? "s" : ""} hors saison pour ${nomSaison}.`;

  return { cle: "saison", libelle: "Saison / météo", note, max: 10, raison };
}

/* ══════════════════════════════════════════════════════════════════════
   7. DÉTAILS & ACCESSOIRES — 5 points
   ══════════════════════════════════════════════════════════════════════
   Règle 6 du brief : « Termine par les chaussures et accessoires. Ils
   doivent soit continuer la tenue, soit créer volontairement le contraste.
   Une ceinture, montre, sac, bijoux ou foulard peut reprendre une couleur
   déjà présente. » */

function noterDetails(outfit: RegistreOutfit): Critere {
  const accent = outfit.slots.find((s) => s.slot === "accent");
  if (!accent) {
    return { cle: "details", libelle: "Détails & accessoires", note: 1, max: 5,
      raison: "Pas d'accessoire — la tenue s'arrête aux vêtements." };
  }

  /* L'accessoire reprend-il une couleur déjà portée, ou tranche-t-il
     franchement ? Les deux sont voulus par le brief ; l'entre-deux (une
     teinte proche mais pas identique) est ce qui donne l'air négligé. */
  const autres = outfit.slots.filter((s) => s.slot !== "accent").map((s) => s.color.hex);
  const reprend = autres.includes(accent.color.hex);
  const ecarts = autres.map((h) => {
    try { return deltaEHex(accent.color.hex, h); } catch { return 100; }
  });
  const ecartMin = ecarts.length ? Math.min(...ecarts) : 100;

  if (reprend) {
    return { cle: "details", libelle: "Détails & accessoires", note: 5, max: 5,
      raison: "L'accessoire reprend une couleur de la tenue." };
  }
  if (ecartMin > 30) {
    return { cle: "details", libelle: "Détails & accessoires", note: 5, max: 5,
      raison: "L'accessoire tranche franchement — le contraste est voulu." };
  }
  /* Sous ΔE 10 l'œil lit un rappel ton sur ton, pas une erreur : c'est le
     « continuer la tenue » du brief. La zone bâtarde est entre les deux —
     assez proche pour qu'on cherche l'accord, trop loin pour qu'il tienne. */
  if (ecartMin < 10) {
    return { cle: "details", libelle: "Détails & accessoires", note: 4, max: 5,
      raison: "L'accessoire fait un rappel ton sur ton de la tenue." };
  }
  return { cle: "details", libelle: "Détails & accessoires", note: 2, max: 5,
    raison: "L'accessoire est dans une teinte proche sans être la même — ça se voit." };
}

/* ══════════════════════════════════════════════════════════════════════
   ASSEMBLAGE
   ══════════════════════════════════════════════════════════════════════ */

export function scoreTenue(
  outfit: RegistreOutfit,
  options: { saison?: SaisonTendance | null } = {},
): NoteTenue {
  const criteres: Critere[] = [
    noterCouleurs(outfit),
    noterProportionsCritere(outfit),
    noterStyles(outfit),
    noterOccasion(outfit),
    noterMatieres(outfit),
    noterSaison(outfit, options.saison ?? null),
    noterDetails(outfit),
  ];

  const total = criteres.reduce((a, c) => a + c.note, 0);
  const aTravailler = criteres.reduce<Critere | null>((pire, c) => {
    if (c.note === c.max) return pire;
    if (!pire) return c;
    return (c.max - c.note) > (pire.max - pire.note) ? c : pire;
  }, null);

  return { total: Math.max(0, Math.min(100, Math.round(total))), criteres, aTravailler };
}

/* Une pièce ne « touche » une tendance que si elle est citée POUR SON SLOT.
   Sans ça, « montre » et « ceinture cuir » — présentes dans presque toutes
   les tendances comme accessoire — faisaient matcher 14 tendances sur 20 à
   n'importe quelle tenue. On exige aussi deux slots concordants : une seule
   pièce commune est une coïncidence, pas une direction de style. */
const MINIMUM_SLOTS_CONCORDANTS = 2;

function citeLaPiece(vocabulaire: string[], type: string): boolean {
  const t = (type || "").toLowerCase();
  if (!t) return false;
  return vocabulaire.some((p) => {
    const mot = p.toLowerCase();
    /* Bornes de mot des deux côtés : « bomber » ne doit pas matcher
       « bombers déstructuré » par hasard sur une sous-chaîne. */
    return new RegExp(`(^|[^a-zà-ÿ])${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t);
  });
}

/** Les tendances 2026 que la tenue exprime. Informatif — n'entre pas dans la
    note sur 100, qui juge la composition, pas la mode. */
export function tendancesTouchees(outfit: RegistreOutfit): string[] {
  const touchees: string[] = [];
  for (const t of TENDANCES_2026) {
    let concordants = 0;
    for (const s of outfit.slots) {
      const vocab = t.pieces[s.slot];
      if (vocab && citeLaPiece(vocab, s.type)) concordants += 1;
    }
    if (concordants >= MINIMUM_SLOTS_CONCORDANTS) touchees.push(t.nom);
  }
  return touchees;
}

/* Seuil de correspondance couleur. ΔE 25 (le « fallback élargi » de
   colorDistance) est bien trop large ici : mesuré, un quasi-noir #1F1B16
   tombait à ΔE 20,5 du prune et 22,7 du merlot, et un gris chaud à 23,9 du
   rouge vif — 17 des 19 couleurs 2026 étaient « touchées » par une tenue
   entièrement grise. À 12, on reste dans « différence évidente mais même
   famille », ce qui est le sens voulu. */
const DELTA_E_TENDANCE = 12;
/* Et un garde-fou que la distance seule ne donne pas : une teinte grise
   n'est pas « du rouge », quelle que soit sa distance. Une couleur d'accent
   ne peut correspondre qu'à une teinte elle-même colorée. */
const CHROMA_MINIMUM_ACCENT = 35;

/** Les couleurs 2026 que la tenue porte réellement. */
export function couleursTendanceTouchees(outfit: RegistreOutfit): string[] {
  const hexes = [...new Set(outfit.slots.map((s) => s.color.hex))];
  const touchees = new Set<string>();
  for (const c of COULEURS_2026) {
    for (const h of hexes) {
      if (c.role === "accent" && chroma(h) < CHROMA_MINIMUM_ACCENT) continue;
      try {
        if (deltaEHex(h, c.hex) < DELTA_E_TENDANCE) { touchees.add(c.nom); break; }
      } catch { /* hex invalide */ }
    }
  }
  return [...touchees];
}
