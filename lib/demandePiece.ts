/**
 * lib/demandePiece.ts
 *
 * COMPRENDRE « je veux un pantalon cargo ».
 *
 * Brief client 2026-08-22 : « qu'elle comprenne les questions "je veux un
 * pantalon cargo" → voici des pantalons cargo, avec ceci un haut qui irait
 * bien puis des chaussures adaptées, pour quel prix, quelle taille. »
 *
 * Ce que ça corrige
 * ─────────────────
 * Le Styliste dépend aujourd'hui entièrement d'un appel LLM. Quand celui-ci
 * répond, le libellé de slot passe par `extractTypeKeyword` et un mot-clé
 * atteint /api/products. Quand il ne répond pas — pas de clé, quota, panne,
 * latence — il ne reste que l'interprète local, qui lit le style, la couleur
 * et l'occasion mais AUCUNE pièce, AUCUN prix, AUCUNE taille. « Je veux un
 * pantalon cargo » y devient une intention de style, et le client reçoit une
 * tenue sans cargo.
 *
 * Ce module est déterministe et sans réseau. Il tourne AVANT le LLM et lui
 * survit : ce qu'il a compris est réinjecté après coup, pour qu'une pièce
 * nommée par le client ne puisse jamais être perdue en route.
 *
 * Il ne remplace pas le LLM — il garantit un plancher.
 */

export type SlotDemande = "haut" | "bas" | "veste" | "chaussures" | "accent";

export type PieceDemandee = {
  /** Mot-clé envoyé à /api/products en `q=` — « cargo », « trench »… */
  motCle: string;
  slot: SlotDemande;
  /** Libellé lisible, qualificatifs compris : « pantalon cargo kaki ample ». */
  libelle: string;
};

export type Demande = {
  /** Pièces explicitement nommées, dans l'ordre d'apparition. */
  pieces: PieceDemandee[];
  /** Couleur nommée, telle qu'écrite (« kaki », « bordeaux »). */
  couleur?: string;
  /** Matière nommée (« lin », « cuir »). */
  matiere?: string;
  /** Coupe demandée. */
  coupe?: "ajuste" | "standard" | "ample";
  /** Plafond de prix en euros, toutes formulations confondues. */
  budgetMax?: number;
  /** Taille de haut (XS…XXL), de bas (34…54) ou pointure (35…48). */
  tailleHaut?: string;
  tailleBas?: string;
  pointure?: string;
  /** Genre explicite dans la phrase (« pour homme »). */
  genre?: "femme" | "homme";
  /** Vrai si la phrase dit « j'ai » / « je porte » plutôt que « je veux ». */
  possede: boolean;
};

/* ══════════════════════════════════════════════════════════════════════
   VOCABULAIRE DES PIÈCES
   ══════════════════════════════════════════════════════════════════════
   L'ordre compte : les termes les plus spécifiques d'abord. « pantalon
   cargo » doit sortir « cargo » et non « pantalon », sinon /api/products
   renvoie n'importe quel pantalon — exactement le défaut signalé. */
const PIECES: Array<{ motCle: string; slot: SlotDemande; re: RegExp }> = [
  /* ── Bas — spécifiques avant génériques ── */
  { motCle: "cargo",     slot: "bas", re: /\bcargos?\b/i },
  { motCle: "jogging",   slot: "bas", re: /\bjogging(?:s)?\b|\bpantalons?\s+de\s+surv[ee]tement\b/i },
  { motCle: "chino",     slot: "bas", re: /\bchinos?\b/i },
  { motCle: "jean",      slot: "bas", re: /\bjeans?\b/i },
  { motCle: "bermuda",   slot: "bas", re: /\bbermudas?\b/i },
  { motCle: "short",     slot: "bas", re: /\bshorts?\b/i },
  { motCle: "jupe",      slot: "bas", re: /\bjupes?\b/i },
  { motCle: "legging",   slot: "bas", re: /\bleggings?\b/i },
  { motCle: "pantalon",  slot: "bas", re: /\bpantalons?\b/i },

  /* ── Haut ── */
  { motCle: "hoodie",    slot: "haut", re: /\bhoodies?\b|\bsweat\s+[aa]\s+capuche\b/i },
  { motCle: "sweat",     slot: "haut", re: /\bsweat(?:shirt)?s?\b/i },
  { motCle: "t-shirt",   slot: "haut", re: /\bt[\s-]?shirts?\b|\btee[\s-]?shirts?\b/i },
  { motCle: "polo",      slot: "haut", re: /\bpolos?\b/i },
  { motCle: "chemise",   slot: "haut", re: /\bchemises?\b/i },
  { motCle: "marinière", slot: "haut", re: /\bmarini[ee]res?\b/i },
  { motCle: "débardeur", slot: "haut", re: /\bd[ee]bardeurs?\b/i },
  { motCle: "col roulé", slot: "haut", re: /\bcols?\s+roul[ee]s?\b/i },
  { motCle: "pull",      slot: "haut", re: /\bpull(?:over)?s?\b/i },
  { motCle: "blouse",    slot: "haut", re: /\bblouses?\b/i },
  { motCle: "caraco",    slot: "haut", re: /\bcaracos?\b/i },
  { motCle: "body",      slot: "haut", re: /\bbodys?\b|\bbodies\b/i },
  { motCle: "robe",      slot: "haut", re: /\brobes?\b/i },

  /* ── Veste ── */
  { motCle: "surchemise",slot: "veste", re: /\bsurchemises?\b/i },
  { motCle: "trench",    slot: "veste", re: /\btrench(?:[\s-]?coat)?s?\b/i },
  { motCle: "bomber",    slot: "veste", re: /\bbombers?\b/i },
  { motCle: "parka",     slot: "veste", re: /\bparkas?\b/i },
  { motCle: "doudoune",  slot: "veste", re: /\bdoudounes?\b/i },
  { motCle: "blazer",    slot: "veste", re: /\bblazers?\b/i },
  { motCle: "cardigan",  slot: "veste", re: /\bcardigans?\b/i },
  { motCle: "caban",     slot: "veste", re: /\bcabans?\b/i },
  { motCle: "manteau",   slot: "veste", re: /\bmanteaux?\b/i },
  { motCle: "veste",     slot: "veste", re: /\bvestes?\b/i },

  /* ── Chaussures ── */
  { motCle: "sneakers",  slot: "chaussures", re: /\bsneakers?\b|\bbaskets?\b|\btennis\b/i },
  { motCle: "mocassins", slot: "chaussures", re: /\bmocassins?\b|\bloafers?\b/i },
  { motCle: "derbies",   slot: "chaussures", re: /\bderbies?\b|\bderbys?\b|\brichelieux?\b/i },
  { motCle: "bottines",  slot: "chaussures", re: /\bbottines?\b|\bchelsea\b/i },
  { motCle: "bottes",    slot: "chaussures", re: /\bbottes?\b/i },
  { motCle: "escarpins", slot: "chaussures", re: /\bescarpins?\b/i },
  { motCle: "ballerines",slot: "chaussures", re: /\bballerines?\b/i },
  { motCle: "sandales",  slot: "chaussures", re: /\bsandales?\b/i },

  /* ── Accessoire ── */
  { motCle: "ceinture",  slot: "accent", re: /\bceintures?\b/i },
  { motCle: "foulard",   slot: "accent", re: /\bfoulards?\b/i },
  { motCle: "écharpe",   slot: "accent", re: /\b[ee]charpes?\b/i },
  { motCle: "casquette", slot: "accent", re: /\bcasquettes?\b/i },
  { motCle: "bonnet",    slot: "accent", re: /\bbonnets?\b/i },
  { motCle: "sac",       slot: "accent", re: /\bsacs?\b|\bcabas\b|\btote\b/i },
  { motCle: "montre",    slot: "accent", re: /\bmontres?\b/i },
  { motCle: "lunettes",  slot: "accent", re: /\blunettes?\b/i },
];

const COULEURS: Array<{ nom: string; re: RegExp }> = [
  { nom: "noir",     re: /\bnoirs?e?s?\b/i },
  { nom: "blanc",    re: /\bblanche?s?\b/i },
  { nom: "écru",     re: /\b[ee]crus?\b/i },
  { nom: "crème",    re: /\bcr[ee]mes?\b/i },
  { nom: "beige",    re: /\bbeiges?\b/i },
  { nom: "kaki",     re: /\bkakis?\b/i },
  { nom: "olive",    re: /\bolives?\b/i },
  { nom: "marine",   re: /\bmarines?\b|\bnavy\b/i },
  { nom: "bleu",     re: /\bbleus?e?s?\b/i },
  { nom: "gris",     re: /\bgrise?s?\b/i },
  { nom: "marron",   re: /\bmarrons?\b|\bbruns?\b/i },
  { nom: "chocolat", re: /\bchocolats?\b/i },
  { nom: "camel",    re: /\bcamels?\b/i },
  { nom: "bordeaux", re: /\bbordeaux\b|\bmerlots?\b/i },
  { nom: "rouge",    re: /\brouges?\b/i },
  { nom: "vert",     re: /\bverts?e?s?\b/i },
  { nom: "sauge",    re: /\bsauges?\b/i },
  { nom: "rose",     re: /\broses?\b/i },
  { nom: "violet",   re: /\bviolets?te?s?\b|\bprunes?\b/i },
  { nom: "jaune",    re: /\bjaunes?\b/i },
  { nom: "orange",   re: /\boranges?\b/i },
];

const MATIERES: Array<{ nom: string; re: RegExp }> = [
  { nom: "lin",       re: /\blin\b/i },
  { nom: "coton",     re: /\bcotons?\b/i },
  { nom: "laine",     re: /\blaines?\b/i },
  { nom: "cachemire", re: /\bcachemires?\b/i },
  { nom: "cuir",      re: /\bcuirs?\b/i },
  { nom: "daim",      re: /\bdaims?\b|\bsu[ee]des?\b/i },
  { nom: "denim",     re: /\bdenims?\b/i },
  { nom: "velours",   re: /\bvelours\b/i },
  { nom: "satin",     re: /\bsatins?\b/i },
  { nom: "maille",    re: /\bmailles?\b|\btricots?\b/i },
  { nom: "soie",      re: /\bsoies?\b/i },
];

const COUPES: Array<{ cle: "ajuste" | "standard" | "ample"; re: RegExp }> = [
  { cle: "ample",    re: /\bamples?\b|\boversized?\b|\blarges?\b|\bloose\b|\bbaggy\b/i },
  { cle: "ajuste",   re: /\bajust[ee]e?s?\b|\bslims?\b|\bcintr[ee]e?s?\b|\bpr[ee]s\s+du\s+corps\b|\bskinny\b/i },
  { cle: "standard", re: /\bdroite?s?\b|\bregular\b|\bclassiques?\b/i },
];

/**
 * Minuscules, accents retirés, espaces normalisés.
 *
 * Le retrait des accents n'est pas cosmétique, c'est une correction. En
 * JavaScript, `\b` se définit par rapport à `\w` = [A-Za-z0-9_], et « é »
 * n'en fait pas partie : entre une espace et un « é », il n'y a donc AUCUNE
 * limite de mot, et `/\bécru\b/` ne matche jamais un mot commençant par un
 * accent. Mesuré : « une chemise en lin écru » ne rendait pas la couleur.
 * Le même piège frappait « écharpe ».
 *
 * On normalise donc le texte une fois, et tous les motifs ci-dessous sont
 * écrits SANS accent.
 */
function normaliser(v: string): string {
  return v.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ══════════════════════════════════════════════════════════════════════
   PRIX
   ══════════════════════════════════════════════════════════════════════
   Formulations couvertes : « moins de 80 € », « max 120 », « budget 200 »,
   « jusqu'à 90 euros », « sous les 50 », « autour de 100 », « pas cher ».
   Un simple /\d+/ ne suffit pas : « pantalon 501 » et « je fais du 42 » sont
   des nombres qui ne sont pas des prix. */
const RE_PRIX: RegExp[] = [
  /\bmoins\s+de\s+(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bmax(?:imum)?\s*\.?\s*(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bbudget\s*(?:de|:)?\s*(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bjusqu'?[aa]\s+(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bsous\s+(?:les\s+)?(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bautour\s+de\s+(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /\bpas\s+plus\s+de\s+(\d{1,4})\s*(?:€|eur|euros?|chf|francs?)?/i,
  /(\d{1,4})\s*(?:€|eur|euros?|chf)\s*max(?:imum)?\b/i,
];
/* « pas cher » n'est pas un chiffre : on lui donne un plafond conventionnel
   plutôt que de l'ignorer. 60 € couvre la plupart des basiques du catalogue. */
const RE_PAS_CHER = /\bpas\s+cher\b|\b[ee]conomique\b|\bpetit\s+budget\b|\babordable\b/i;

function extraireBudget(t: string): number | undefined {
  for (const re of RE_PRIX) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      /* Bornes de bon sens : « moins de 5 » n'est pas un budget vêtement,
         « moins de 90000 » non plus. */
      if (Number.isFinite(n) && n >= 10 && n <= 5000) return n;
    }
  }
  if (RE_PAS_CHER.test(t)) return 60;
  return undefined;
}

/* ══════════════════════════════════════════════════════════════════════
   TAILLES
   ══════════════════════════════════════════════════════════════════════ */
const TAILLES_HAUT = ["XS", "S", "M", "L", "XL", "XXL"];

function extraireTailles(t: string): Pick<Demande, "tailleHaut" | "tailleBas" | "pointure"> {
  const out: Pick<Demande, "tailleHaut" | "tailleBas" | "pointure"> = {};

  /* Haut : « taille M », « je fais du L ». On EXIGE le mot déclencheur —
     un « M » isolé dans une phrase est presque toujours autre chose. */
  const mh = t.match(/\b(?:taille|je\s+fais\s+du|je\s+porte\s+du|en)\s+(xxl|xl|[xsml])\b/i);
  if (mh) {
    const v = mh[1].toUpperCase();
    if (TAILLES_HAUT.includes(v)) out.tailleHaut = v;
  }

  /* Pointure : 35 à 48, avec son mot déclencheur ou le mot « pointure ». */
  const mp = t.match(/\b(?:pointure|chausse|je\s+chausse\s+du|je\s+fais\s+du)\s*(3[5-9]|4[0-8])\b/i)
    || t.match(/\b(3[5-9]|4[0-8])\s*(?:de\s+)?pointure\b/i);
  if (mp) out.pointure = mp[1];

  /* Bas : tailles françaises paires 34 à 54. Attention au recouvrement avec
     les pointures (35-48) : on ne retient un nombre comme taille de bas que
     s'il est PAIR et qu'aucune pointure n'a été trouvée sur ce nombre. */
  const mb = t.match(/\b(?:taille|je\s+fais\s+du|je\s+porte\s+du|en)\s+(3[4-9]|4\d|5[0-4])\b/i);
  if (mb) {
    const n = parseInt(mb[1], 10);
    if (n % 2 === 0 && n >= 34 && n <= 54 && out.pointure !== mb[1]) out.tailleBas = String(n);
    else if (!out.pointure && n >= 35 && n <= 48) out.pointure = String(n);
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════
   ANALYSE
   ══════════════════════════════════════════════════════════════════════ */

/* « J'ai un pull noir » ≠ « je veux un pull noir ». Le premier est une pièce
   à intégrer, le second une pièce à acheter. Le bouton « J'ai un pull noir »
   de l'écran Styliste envoie exactement cette phrase. */
const RE_POSSEDE = /\bj'?ai\b|\bje\s+poss[ee]de\b|\bje\s+porte\b|\bavec\s+mes?\b|\bmon\b|\bma\b|\bmes\b/i;

export function analyserDemande(texte: string): Demande {
  const t = normaliser(texte || "");
  if (!t) return { pieces: [], possede: false };

  /* Pièces, dans l'ordre où elles apparaissent dans la phrase — « un cargo
     avec un pull » doit donner cargo puis pull. Une seule pièce par slot :
     la première nommée gagne. */
  const trouvees: Array<PieceDemandee & { index: number }> = [];
  const slotsPris = new Set<SlotDemande>();
  for (const p of PIECES) {
    const m = t.match(p.re);
    if (!m || m.index === undefined) continue;
    if (slotsPris.has(p.slot)) continue;
    slotsPris.add(p.slot);
    trouvees.push({ motCle: p.motCle, slot: p.slot, libelle: m[0], index: m.index });
  }
  trouvees.sort((a, b) => a.index - b.index);

  const couleur = COULEURS.find((c) => c.re.test(t))?.nom;
  const matiere = MATIERES.find((m) => m.re.test(t))?.nom;
  const coupe = COUPES.find((c) => c.re.test(t))?.cle;

  /* Un qualificatif appartient à la pièce qu'il suit, pas à toute la phrase.
     « une chemise en lin écru et un chino » donnait « chemise écru » ET
     « chino écru » — le chino n'a jamais été dit écru. On découpe donc la
     phrase en segments, un par pièce : le segment d'une pièce va de sa
     position à celle de la suivante. Le premier segment part du début de la
     phrase, pour attraper un qualificatif placé avant (« je veux du kaki,
     un cargo »).

     Le libellé se construit sur `motCle` et non sur le texte trouvé : celui-ci
     vient de la chaîne normalisée, donc sans accent — « marinière » s'y lit
     « mariniere », ce qu'on ne veut pas afficher au client. */
  const pieces: PieceDemandee[] = trouvees.map((p, i) => {
    const segment = t.slice(i === 0 ? 0 : p.index, trouvees[i + 1]?.index ?? t.length);
    const c = COULEURS.find((x) => x.re.test(segment))?.nom;
    const f = COUPES.find((x) => x.re.test(segment))?.cle;
    return {
      motCle: p.motCle,
      slot: p.slot,
      libelle: [p.motCle, c, f === "ample" ? "ample" : f === "ajuste" ? "ajusté" : null]
        .filter(Boolean).join(" "),
    };
  });

  const genre = /\bpour\s+homme\b|\bhomme\b/i.test(t) ? "homme"
    : /\bpour\s+femme\b|\bfemme\b/i.test(t) ? "femme"
    : undefined;

  return {
    pieces,
    couleur,
    matiere,
    coupe,
    budgetMax: extraireBudget(t),
    ...extraireTailles(t),
    genre,
    possede: RE_POSSEDE.test(t),
  };
}

/** Vrai si la phrase nomme au moins une pièce — le signal qui fait basculer
    le Styliste en « composer autour de cette pièce ». */
export function nommeUnePiece(texte: string): boolean {
  return analyserDemande(texte).pieces.length > 0;
}
