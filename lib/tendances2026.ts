/**
 * lib/tendances2026.ts
 *
 * BASE DE TENDANCES — Automne/Hiver 2026-27, arrêtée au 21 août 2026.
 *
 * Pourquoi ce fichier existe
 * ──────────────────────────
 * Le moteur de composition ne connaissait que des principes intemporels
 * (équilibre des volumes, une seule couleur vive). C'est solide mais ça ne
 * date pas : la même tenue serait sortie en 2019. Il manquait la couche
 * « ce qui se porte maintenant ».
 *
 * Structure demandée par le client :
 *   tendance → genre → pièces → couleurs → matières → coupe → saison → niveau
 *
 * Ce que ce fichier N'EST PAS
 * ───────────────────────────
 * Ce n'est pas une source qui se met à jour toute seule. C'est un instantané
 * daté. `SAISON_DE_REFERENCE` porte cette date : quand elle est dépassée de
 * plus d'un an, les niveaux « pointue » sont à revoir en premier — ce sont
 * eux qui se périment le plus vite. Les « socle » tiennent des années.
 *
 * Les couleurs portent un hex pour pouvoir être comparées aux palettes Sanzō
 * Wada en ΔE2000. C'est le pont entre les deux : la tendance dit « merlot est
 * fort cette saison », la palette dit quelles teintes elle contient, et le
 * moteur peut répondre « cette palette a une teinte à ΔE 12 du merlot ».
 */

import type { SlotKey, Fit } from "./registreEngine";

export const SAISON_DE_REFERENCE = "AH 2026-27";
export const DATE_DE_RELEVE = "2026-08-21";

export type GenreTendance = "homme" | "femme" | "mixte";

/** Durée de vie estimée d'une tendance — pilote le poids dans le score.
 *    socle   : structurel, tient plusieurs années (tailoring, denim)
 *    forte   : dominante cette saison, tiendra 2-3 saisons (bordeaux, cuir)
 *    pointue : signature de saison, se périme vite (maillot de foot, y2k) */
export type NiveauTendance = "socle" | "forte" | "pointue";

/** PE = printemps/été · AH = automne/hiver · toute = sans saison marquée. */
export type SaisonTendance = "PE" | "AH" | "toute";

/** Niveau de formalité, même échelle que le profil client (0 très casual
    → 4 très habillé). Sert à vérifier que les pièces « dialoguent ». */
export type Formalite = 0 | 1 | 2 | 3 | 4;

/* ══════════════════════════════════════════════════════════════════════
   COULEURS 2026 — avec hex, pour le pont vers les palettes Wada
   ══════════════════════════════════════════════════════════════════════
   « base » = peut occuper une grande surface (pantalon, manteau).
   « accent » = une seule pièce, sinon la tenue crie.

   Le brun chocolat et l'olive sont classés en base : c'est précisément le
   mouvement de cette saison, ils remplacent le gris et le marine comme
   neutres par défaut. */
export type RoleCouleur = "base" | "accent";

export type CouleurTendance = {
  cle: string;
  nom: string;
  hex: string;
  role: RoleCouleur;
  niveau: NiveauTendance;
  genres: GenreTendance[];
};

export const COULEURS_2026: CouleurTendance[] = [
  /* ── Nouveaux neutres — le grand mouvement AH26 ─────────────────────── */
  { cle: "chocolat", nom: "Brun chocolat", hex: "#4A3428", role: "base", niveau: "forte", genres: ["mixte"] },
  { cle: "brun",     nom: "Brun",          hex: "#6B4E37", role: "base", niveau: "forte", genres: ["mixte"] },
  { cle: "olive",    nom: "Olive",         hex: "#5C5A3C", role: "base", niveau: "forte", genres: ["mixte"] },
  { cle: "terre",    nom: "Ton terre",     hex: "#8B6F52", role: "base", niveau: "forte", genres: ["femme", "mixte"] },
  /* ── Neutres structurels — ne se démodent pas ───────────────────────── */
  { cle: "noir",     nom: "Noir",          hex: "#141414", role: "base", niveau: "socle", genres: ["mixte"] },
  { cle: "marine",   nom: "Bleu marine",   hex: "#1F2A44", role: "base", niveau: "socle", genres: ["mixte"] },
  { cle: "gris",     nom: "Gris",          hex: "#8A8A8A", role: "base", niveau: "socle", genres: ["mixte"] },
  { cle: "creme",    nom: "Crème",         hex: "#F0E9DA", role: "base", niveau: "socle", genres: ["mixte"] },
  { cle: "ecru",     nom: "Écru",          hex: "#DCD3C0", role: "base", niveau: "socle", genres: ["mixte"] },
  { cle: "blanc",    nom: "Blanc",         hex: "#F7F5F0", role: "base", niveau: "socle", genres: ["mixte"] },
  /* ── Accents — la couleur de la saison ──────────────────────────────── */
  { cle: "merlot",   nom: "Merlot / bordeaux", hex: "#5C1F2B", role: "accent", niveau: "forte", genres: ["mixte"] },
  { cle: "violet",   nom: "Violet",        hex: "#5B3A78", role: "accent", niveau: "forte", genres: ["femme", "mixte"] },
  { cle: "prune",    nom: "Prune",         hex: "#4A2438", role: "accent", niveau: "forte", genres: ["femme"] },
  { cle: "rouge",    nom: "Rouge vif",     hex: "#C0392B", role: "accent", niveau: "forte", genres: ["mixte"] },
  { cle: "cobalt",   nom: "Bleu cobalt / royal", hex: "#1B4FA0", role: "accent", niveau: "forte", genres: ["mixte"] },
  { cle: "beurre",   nom: "Jaune beurre",  hex: "#EDD9A3", role: "accent", niveau: "pointue", genres: ["mixte"] },
  { cle: "kelly",    nom: "Vert Kelly",    hex: "#2E8B57", role: "accent", niveau: "pointue", genres: ["homme", "mixte"] },
  { cle: "teal",     nom: "Teal",          hex: "#2A6F73", role: "accent", niveau: "pointue", genres: ["homme"] },
  { cle: "orange",   nom: "Orange",        hex: "#D2691E", role: "accent", niveau: "pointue", genres: ["homme"] },
];

/* ══════════════════════════════════════════════════════════════════════
   MATIÈRES 2026
   ══════════════════════════════════════════════════════════════════════
   `poids` sert à la règle « 2-3 matières, pas 5-6 » : une matière lourde
   (velours, fourrure, cuir croco) compte double dans le compte des
   textures. Deux matières lourdes dans une tenue, c'est déjà beaucoup. */
export type MatiereTendance = {
  cle: string;
  nom: string;
  poids: 1 | 2;
  saisons: SaisonTendance[];
  niveau: NiveauTendance;
  genres: GenreTendance[];
};

export const MATIERES_2026: MatiereTendance[] = [
  { cle: "laine",     nom: "laine",              poids: 1, saisons: ["AH"],    niveau: "socle",   genres: ["mixte"] },
  { cle: "coton",     nom: "coton",              poids: 1, saisons: ["toute"], niveau: "socle",   genres: ["mixte"] },
  { cle: "lin",       nom: "lin",                poids: 1, saisons: ["PE"],    niveau: "socle",   genres: ["mixte"] },
  { cle: "denim",     nom: "denim",              poids: 1, saisons: ["toute"], niveau: "socle",   genres: ["mixte"] },
  { cle: "maille",    nom: "maille",             poids: 1, saisons: ["AH"],    niveau: "forte",   genres: ["mixte"] },
  { cle: "cuir",      nom: "cuir",               poids: 2, saisons: ["AH"],    niveau: "forte",   genres: ["mixte"] },
  { cle: "daim",      nom: "daim",               poids: 2, saisons: ["AH"],    niveau: "forte",   genres: ["mixte"] },
  { cle: "velours",   nom: "velours",            poids: 2, saisons: ["AH"],    niveau: "forte",   genres: ["mixte"] },
  { cle: "satin",     nom: "satin",              poids: 2, saisons: ["toute"], niveau: "forte",   genres: ["femme"] },
  { cle: "tweed",     nom: "tweed",              poids: 2, saisons: ["AH"],    niveau: "forte",   genres: ["mixte"] },
  { cle: "cachemire", nom: "cachemire",          poids: 1, saisons: ["AH"],    niveau: "socle",   genres: ["mixte"] },
  { cle: "dentelle",  nom: "dentelle",           poids: 2, saisons: ["toute"], niveau: "forte",   genres: ["femme"] },
  { cle: "mesh",      nom: "transparence / mesh", poids: 2, saisons: ["toute"], niveau: "pointue", genres: ["femme"] },
  { cle: "jacquard",  nom: "jacquard",           poids: 2, saisons: ["AH"],    niveau: "pointue", genres: ["femme"] },
  { cle: "croco",     nom: "cuir effet croco",   poids: 2, saisons: ["AH"],    niveau: "pointue", genres: ["femme"] },
  { cle: "fourrure",  nom: "fourrure synthétique", poids: 2, saisons: ["AH"],  niveau: "forte",   genres: ["mixte"] },
  { cle: "molleton",  nom: "molleton",           poids: 1, saisons: ["AH"],    niveau: "socle",   genres: ["mixte"] },
  { cle: "technique", nom: "tissu technique",    poids: 1, saisons: ["toute"], niveau: "forte",   genres: ["homme", "mixte"] },
  { cle: "crochet",   nom: "crochet",            poids: 2, saisons: ["PE"],    niveau: "pointue", genres: ["femme"] },
  { cle: "shearling", nom: "shearling",          poids: 2, saisons: ["AH"],    niveau: "forte",   genres: ["homme", "mixte"] },
];

/* ══════════════════════════════════════════════════════════════════════
   LES TENDANCES
   ══════════════════════════════════════════════════════════════════════ */

export type Tendance = {
  cle: string;
  nom: string;
  /** Une phrase — c'est ce qui peut s'afficher au client. */
  resume: string;
  genres: GenreTendance[];
  niveau: NiveauTendance;
  saisons: SaisonTendance[];
  formalite: Formalite;
  /** Pièces caractéristiques, par slot. Vocabulaire produit, pas marketing. */
  pieces: Partial<Record<SlotKey, string[]>>;
  /** Clés de COULEURS_2026. */
  couleurs: string[];
  /** Clés de MATIERES_2026. */
  matieres: string[];
  /** Coupe attendue par slot. Un slot absent = pas d'exigence. */
  coupe: Partial<Record<SlotKey, Fit>>;
};

export const TENDANCES_2026: Tendance[] = [
  {
    cle: "tailoring-moderne",
    nom: "Tailoring moderne",
    resume: "Le costume desserré : pantalon à pinces, blazer non rigide, jamais guindé.",
    genres: ["mixte"], niveau: "socle", saisons: ["toute"], formalite: 3,
    pieces: {
      haut: ["chemise", "pull col V", "col roulé fin", "top drapé"],
      bas: ["pantalon à pinces", "tailored trousers", "pantalon fluide"],
      veste: ["blazer relax", "blazer croisé", "blazer structuré", "blazer oversized"],
      chaussures: ["mocassins", "derbies", "loafers", "slingbacks"],
      accent: ["ceinture cuir", "montre", "cummerbund"],
    },
    couleurs: ["marine", "gris", "chocolat", "noir", "creme", "merlot"],
    matieres: ["laine", "coton", "cachemire"],
    coupe: { veste: "standard", bas: "ample" },
  },
  {
    cle: "preppy",
    nom: "Modern preppy",
    resume: "Cardigan, polo, mocassins — le vestiaire scolaire remis au propre.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH", "toute"], formalite: 2,
    pieces: {
      haut: ["cardigan ajusté", "polo en maille", "pull col V", "chemise rayée", "pull sans manches"],
      bas: ["pantalon à pinces", "jean droit", "jupe crayon", "bermuda habillé"],
      veste: ["bomber preppy", "harrington", "blazer relax", "veste preppy"],
      chaussures: ["mocassins", "bateaux", "ballerines", "mary janes"],
      accent: ["foulard", "ceinture cuir", "perles"],
    },
    couleurs: ["marine", "creme", "chocolat", "rouge", "cobalt"],
    matieres: ["maille", "coton", "laine"],
    coupe: { haut: "ajuste", bas: "standard" },
  },
  {
    cle: "heritage-carreaux",
    nom: "Heritage & carreaux",
    resume: "Tartan, tweed, laine — les pièces qui traversent les décennies.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 2,
    pieces: {
      haut: ["chemise à carreaux", "pull sans manches", "maille texturée"],
      bas: ["pantalon à carreaux", "jupe midi", "pantalon à pinces"],
      veste: ["manteau à carreaux", "veste workwear", "field jacket", "blazer croisé"],
      chaussures: ["boots en cuir", "derbies", "chelsea boots"],
      accent: ["foulard", "broche", "ceinture large"],
    },
    couleurs: ["chocolat", "olive", "merlot", "creme", "gris"],
    matieres: ["tweed", "laine", "cachemire"],
    coupe: { veste: "standard" },
  },
  {
    cle: "cuir",
    nom: "Cuir",
    resume: "Blouson, bomber, veste — la pièce forte de la saison.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 2,
    pieces: {
      haut: ["t-shirt légèrement boxy", "col roulé fin", "caraco", "débardeur minimal"],
      bas: ["jean droit", "jean cigarette", "jupe crayon", "tailored trousers"],
      veste: ["blouson cuir", "leather bomber", "veste cuir", "bomber cuir"],
      chaussures: ["boots en cuir", "boots pointues", "chelsea boots"],
      accent: ["ceinture large", "gros bijoux"],
    },
    couleurs: ["noir", "chocolat", "brun", "merlot"],
    matieres: ["cuir", "coton", "maille"],
    coupe: { veste: "ajuste", haut: "standard" },
  },
  {
    cle: "daim",
    nom: "Daim",
    resume: "Plus doux que le cuir, la matière qui réchauffe une tenue sobre.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 2,
    pieces: {
      haut: ["polo en maille", "col roulé fin", "pull col V"],
      bas: ["pantalon à pinces", "jean droit", "jupe midi"],
      veste: ["veste en daim", "blouson daim"],
      chaussures: ["mocassins", "boots en cuir", "loafers"],
      accent: ["ceinture cuir", "sac"],
    },
    couleurs: ["chocolat", "brun", "terre", "creme", "olive"],
    matieres: ["daim", "maille", "coton"],
    coupe: { veste: "standard" },
  },
  {
    cle: "sport-tailoring",
    nom: "Sport chic",
    resume: "Une pièce sportive dans une tenue habillée — le contraste volontaire.",
    genres: ["mixte"], niveau: "forte", saisons: ["toute"], formalite: 1,
    pieces: {
      haut: ["quarter-zip", "maillot de football vintage", "t-shirt légèrement boxy", "polo en maille"],
      bas: ["pantalon à pinces", "pantalon track", "tailored trousers"],
      veste: ["track jacket", "blazer relax", "coupe-vent technique", "bomber"],
      chaussures: ["sneakers rétro fines", "sneakers running rétro"],
      accent: ["casquette", "montre", "sac"],
    },
    couleurs: ["marine", "gris", "creme", "cobalt", "kelly", "rouge"],
    matieres: ["technique", "molleton", "laine"],
    coupe: { haut: "standard", bas: "ample" },
  },
  {
    cle: "workwear",
    nom: "Workwear raffiné",
    resume: "Chore jacket, denim, boots — le vêtement de travail en belles matières.",
    genres: ["homme", "mixte"], niveau: "forte", saisons: ["AH", "toute"], formalite: 1,
    pieces: {
      haut: ["surchemise", "chemise ample", "t-shirt légèrement boxy"],
      bas: ["denim brut", "jean droit", "pantalon cargo plus propre"],
      veste: ["veste workwear", "field jacket", "surchemise"],
      chaussures: ["boots en cuir", "derbies"],
      accent: ["ceinture cuir", "montre"],
    },
    couleurs: ["olive", "chocolat", "marine", "ecru", "gris"],
    matieres: ["denim", "coton", "laine"],
    coupe: { haut: "ample", bas: "standard" },
  },
  {
    cle: "minimal-premium",
    nom: "Minimalisme premium",
    resume: "Peu de pièces, formes simples, matières qui font toute la différence.",
    genres: ["mixte"], niveau: "socle", saisons: ["toute"], formalite: 2,
    pieces: {
      haut: ["col roulé fin", "t-shirt légèrement boxy", "maille fine", "débardeur minimal"],
      bas: ["tailored trousers", "pantalon fluide", "jupe colonne", "jean droit"],
      veste: ["manteau long", "manteau cocon", "blazer relax"],
      chaussures: ["mocassins", "ballerines", "boots en cuir", "sneakers rétro fines"],
      accent: ["montre", "sac", "ceinture cuir"],
    },
    couleurs: ["noir", "creme", "gris", "chocolat", "ecru"],
    matieres: ["cachemire", "laine", "coton"],
    coupe: { haut: "standard", bas: "standard" },
  },
  {
    cle: "rock-chic",
    nom: "Rock chic",
    resume: "Noir, cuir, bottes — la silhouette resserrée.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 1,
    pieces: {
      haut: ["t-shirt graphique", "col roulé fin", "top dentelle", "caraco"],
      bas: ["jean cigarette", "jean droit", "mini-jupe", "leggings travaillés"],
      veste: ["blouson cuir", "veste cuir", "blazer structuré"],
      chaussures: ["boots en cuir", "boots pointues", "chelsea boots"],
      accent: ["ceinture large", "gros bijoux", "broche"],
    },
    couleurs: ["noir", "merlot", "prune", "gris"],
    matieres: ["cuir", "denim", "maille"],
    coupe: { haut: "ajuste", bas: "ajuste" },
  },
  {
    cle: "modern-romantic",
    nom: "Modern romantic",
    resume: "Dentelle, nœuds, volants — le décoratif assumé, sans niaiserie.",
    genres: ["femme"], niveau: "forte", saisons: ["toute"], formalite: 3,
    pieces: {
      haut: ["blouse satinée", "top dentelle", "chemise fluide", "bustier"],
      bas: ["jupe midi", "jupe colonne", "pantalon fluide"],
      veste: ["veste courte", "blazer structuré", "cape"],
      chaussures: ["ballerines satin", "mary janes", "kitten heels"],
      accent: ["nœud", "perles", "bijoux vintage", "foulard"],
    },
    couleurs: ["merlot", "prune", "violet", "creme", "chocolat"],
    matieres: ["satin", "dentelle", "velours"],
    coupe: { haut: "ajuste", bas: "ample" },
  },
  {
    cle: "power-dressing",
    nom: "Power dressing",
    resume: "Épaules nettes, taille marquée, silhouette qui occupe l'espace.",
    genres: ["femme"], niveau: "forte", saisons: ["AH", "toute"], formalite: 4,
    pieces: {
      haut: ["chemise masculine oversized", "top drapé", "bustier", "chemise fluide"],
      bas: ["tailored trousers", "jupe crayon", "pantalon large"],
      veste: ["blazer structuré", "blazer oversized", "manteau long"],
      chaussures: ["slingbacks", "boots pointues", "kitten heels"],
      accent: ["ceinture large", "gros bijoux", "sac"],
    },
    couleurs: ["noir", "merlot", "marine", "creme", "rouge"],
    matieres: ["laine", "cuir", "satin"],
    coupe: { veste: "standard", bas: "ample" },
  },
  {
    cle: "new-boho",
    nom: "New boho",
    resume: "Franges, crochet, tons terre — le bohème sans le costume de festival.",
    genres: ["femme"], niveau: "forte", saisons: ["PE", "toute"], formalite: 1,
    pieces: {
      haut: ["blouse satinée", "chemise fluide", "top drapé"],
      bas: ["jupe midi", "pantalon large", "pantalon fluide"],
      veste: ["veste en daim", "faux fur", "cape"],
      chaussures: ["bottes hautes", "sandales fines", "mocassins"],
      accent: ["franges", "bijoux vintage", "ceinture large", "foulard"],
    },
    couleurs: ["terre", "chocolat", "olive", "creme", "merlot"],
    matieres: ["daim", "crochet", "coton"],
    coupe: { haut: "ample", bas: "ample" },
  },
  {
    cle: "balletcore",
    nom: "Balletcore mature",
    resume: "Ballerines, maille fine, cache-cœur — le vestiaire de danse, version adulte.",
    genres: ["femme"], niveau: "pointue", saisons: ["toute"], formalite: 2,
    pieces: {
      haut: ["cardigan court", "baby V-neck tee", "top drapé", "maille fine"],
      bas: ["jupe midi", "leggings travaillés", "jupe colonne"],
      veste: ["cardigan ajusté", "veste courte"],
      chaussures: ["ballerines", "ballerines satin", "mary janes"],
      accent: ["nœud", "foulard", "perles"],
    },
    couleurs: ["creme", "blanc", "gris", "chocolat", "prune"],
    matieres: ["maille", "satin", "coton"],
    coupe: { haut: "ajuste", bas: "standard" },
  },
  {
    cle: "office-core",
    nom: "Office-core",
    resume: "Le vestiaire de bureau porté au premier degré, jusqu'au dehors.",
    genres: ["femme", "mixte"], niveau: "forte", saisons: ["toute"], formalite: 3,
    pieces: {
      haut: ["chemise fluide", "chemise masculine oversized", "pull col V", "polo en maille"],
      bas: ["tailored trousers", "jupe crayon", "pantalon large"],
      veste: ["blazer structuré", "manteau long", "trench"],
      chaussures: ["mocassins", "slingbacks", "derbies"],
      accent: ["ceinture cuir", "sac", "montre"],
    },
    couleurs: ["marine", "gris", "chocolat", "creme", "noir"],
    matieres: ["laine", "coton", "cuir"],
    coupe: { veste: "standard", bas: "ample" },
  },
  {
    cle: "denim-travaille",
    nom: "Denim travaillé",
    resume: "Le jean sort du basique : délavages, couleurs, coupes marquées.",
    genres: ["mixte"], niveau: "socle", saisons: ["toute"], formalite: 1,
    pieces: {
      haut: ["t-shirt légèrement boxy", "chemise rayée", "pull col V", "caraco"],
      bas: ["jean droit", "jean large", "jean cigarette", "denim délavé", "denim distressed", "denim coloré"],
      veste: ["veste workwear", "blouson court", "harrington"],
      chaussures: ["sneakers rétro fines", "boots en cuir", "mocassins"],
      accent: ["ceinture cuir", "foulard"],
    },
    couleurs: ["marine", "ecru", "creme", "chocolat", "cobalt"],
    matieres: ["denim", "coton", "maille"],
    coupe: { bas: "standard" },
  },
  {
    cle: "layering",
    nom: "Layering",
    resume: "Superposer sans empiler : chaque couche doit se voir.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 2,
    pieces: {
      haut: ["chemise ample", "col roulé fin", "débardeur sous veste", "pull sans manches"],
      bas: ["pantalon à pinces", "jean droit", "jupe midi"],
      veste: ["surchemise", "manteau long", "blazer relax", "field jacket"],
      chaussures: ["boots en cuir", "derbies", "sneakers rétro fines"],
      accent: ["foulard", "ceinture cuir"],
    },
    couleurs: ["chocolat", "olive", "creme", "gris", "marine"],
    matieres: ["laine", "coton", "maille"],
    coupe: { haut: "standard", veste: "ample" },
  },
  {
    cle: "maille-retro",
    nom: "Maille rétro",
    resume: "Pull sans manches, quarter-zip, torsades — la maille qui a du relief.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 2,
    pieces: {
      haut: ["pull sans manches", "quarter-zip", "maille texturée", "pull col V", "polo en maille"],
      bas: ["pantalon à pinces", "jean droit", "jupe midi"],
      veste: ["blazer relax", "manteau long", "harrington"],
      chaussures: ["mocassins", "boots en cuir", "sneakers rétro fines"],
      accent: ["foulard", "montre"],
    },
    couleurs: ["chocolat", "creme", "olive", "merlot", "marine"],
    matieres: ["maille", "cachemire", "laine"],
    coupe: { haut: "standard" },
  },
  {
    cle: "velours",
    nom: "Velours",
    resume: "La matière tactile de la saison — une seule pièce suffit.",
    genres: ["mixte"], niveau: "forte", saisons: ["AH"], formalite: 3,
    pieces: {
      haut: ["blouse satinée", "col roulé fin", "bustier"],
      bas: ["pantalon fluide", "jupe midi", "tailored trousers"],
      veste: ["blazer structuré", "veste courte", "blazer croisé"],
      chaussures: ["mocassins", "kitten heels", "boots pointues"],
      accent: ["nœud", "broche", "bijoux vintage"],
    },
    couleurs: ["merlot", "prune", "violet", "chocolat", "noir"],
    matieres: ["velours", "satin", "laine"],
    coupe: { veste: "standard" },
  },
  {
    cle: "transparence",
    nom: "Transparence",
    resume: "Voile, mesh, dentelle — superposés, jamais seuls.",
    genres: ["femme"], niveau: "pointue", saisons: ["toute"], formalite: 3,
    pieces: {
      haut: ["top transparent", "top dentelle", "blouse satinée", "caraco"],
      bas: ["jupe transparente superposée", "jupe colonne", "pantalon fluide"],
      veste: ["blazer structuré", "veste courte"],
      chaussures: ["kitten heels", "slingbacks", "ballerines satin"],
      accent: ["gros bijoux", "ceinture large"],
    },
    couleurs: ["noir", "creme", "prune", "merlot"],
    matieres: ["mesh", "dentelle", "satin"],
    coupe: { haut: "ajuste", bas: "ample" },
  },
  {
    cle: "accessoires-visibles",
    nom: "Accessoires visibles",
    resume: "Bijoux larges, ceintures marquées, foulards — l'accessoire n'est plus discret.",
    genres: ["mixte"], niveau: "forte", saisons: ["toute"], formalite: 2,
    pieces: {
      haut: ["col roulé fin", "chemise fluide", "t-shirt légèrement boxy"],
      bas: ["tailored trousers", "jean droit", "jupe midi"],
      veste: ["blazer relax", "manteau long"],
      chaussures: ["mocassins", "boots en cuir", "ballerines"],
      accent: ["gros bijoux", "ceinture large", "foulard", "broche", "bijoux vintage", "cummerbund"],
    },
    couleurs: ["chocolat", "creme", "noir", "merlot", "beurre"],
    matieres: ["cuir", "laine", "maille"],
    coupe: {},
  },
];

/* ══════════════════════════════════════════════════════════════════════
   ACCÈS
   ══════════════════════════════════════════════════════════════════════ */

const parCle = new Map(TENDANCES_2026.map((t) => [t.cle, t]));
const couleurParCle = new Map(COULEURS_2026.map((c) => [c.cle, c]));
const matiereParCle = new Map(MATIERES_2026.map((m) => [m.cle, m]));

export function tendance(cle: string): Tendance | null { return parCle.get(cle) ?? null; }
export function couleurTendance(cle: string): CouleurTendance | null { return couleurParCle.get(cle) ?? null; }
export function matiereTendance(cle: string): MatiereTendance | null { return matiereParCle.get(cle) ?? null; }

/** Une tendance « mixte » s'applique à tout le monde ; une tendance
    genrée seulement au genre concerné. */
export function convientAuGenre(t: Tendance, genre: GenreTendance | null): boolean {
  if (!genre || genre === "mixte") return true;
  return t.genres.includes(genre) || t.genres.includes("mixte");
}

export function convientALaSaison(t: Tendance, saison: SaisonTendance | null): boolean {
  if (!saison || saison === "toute") return true;
  return t.saisons.includes(saison) || t.saisons.includes("toute");
}

/** Poids d'une tendance dans les scores : un socle est une valeur sûre,
    une tendance pointue rapporte plus mais vieillit vite. */
export const POIDS_NIVEAU: Record<NiveauTendance, number> = {
  socle: 1, forte: 1.25, pointue: 1.5,
};

/** Toutes les pièces citées par au moins une tendance, pour un slot donné —
    utilisé pour repérer si une pièce du catalogue est « de saison ». */
export function piecesTendance(slot: SlotKey, genre?: GenreTendance | null): string[] {
  const vus = new Set<string>();
  for (const t of TENDANCES_2026) {
    if (!convientAuGenre(t, genre ?? null)) continue;
    for (const p of t.pieces[slot] ?? []) vus.add(p.toLowerCase());
  }
  return [...vus];
}
