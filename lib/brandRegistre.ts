/**
 * brandBrandRegistre — table de correspondance MARQUE → REGISTRE.
 *
 * Brief 2026-05-30 « logique de composition d'une tenue cohérente »
 * §1 : une tenue a UN registre, on ne mélange pas. La table ci-dessous
 * mappe chaque marque connue à son registre principal pour permettre
 * au composer de filtrer cohérent.
 *
 * Source : table V1 du brief client. À enrichir au fur et à mesure des
 * marchands ajoutés au catalogue (TBF a 522 marques, on couvre les plus
 * fréquentes ici).
 *
 * Marques non listées → fallback `classique` (le moins risqué).
 * Une marque peut techniquement appartenir à plusieurs registres
 * (ex. Comme des Garçons fait du minimaliste ET du streetwear via
 * COMME DES GARÇONS PLAY) — on choisit le registre dominant pour la V1.
 */

export type BrandRegistre =
  | "classique"        // Brunello, Tom Ford, Zegna, Loro Piana, Polo Ralph Lauren…
  | "streetwear"       // Amiri, Off-White, Palm Angels, AMI, A Bathing Ape…
  | "minimaliste"      // Jacquemus, Lemaire, Acne Studios, COS, A.P.C., Norse Projects…
  | "decontracte"      // MUJI, Uniqlo, Armor Lux, American Vintage, Birkenstock…
  | "outdoor"          // The North Face, Patagonia, Arc'teryx, Snow Peak, Salomon…
  | "avant_garde"      // Rick Owens, Yohji Yamamoto, Issey Miyake, Junya Watanabe, Sacai,
                       // Comme des Garçons, Maison Margiela. Brief 2026-06-01 : registre
                       // distinct car ces marques ont une grammaire formelle (drapés,
                       // déconstruction, mono-couleur) qui ne s'associe pas avec
                       // classique tailoring ni avec MUJI/casual basique.
  | "heritage_country" // Barbour, Burberry, Mackintosh, Belstaff, Filson. Brief 2026-06-01 :
                       // wax/quilted/trench heritage UK. Plus précis qu'outdoor. Adjacent
                       // à classique (warn) mais pas à minimaliste/streetwear/avant-garde.
  | "apres_ski";       // Moon Boot, Sorel, doudounes-cabines, fourrures synthétiques.
                       // Brief 2026-06-01 : registre saisonnier hiver uniquement.

/* Brief 2026-05-31 (user bug Studio danois) : outdoor + apres_ski + heritage_country
   sont des registres fonctionnels qui ne s'habillent PAS avec du tailoring /
   minimaliste / streetwear urbain par défaut. La matrice de compat (lib/composer/
   registreCompat) gère finement quels couples « ok / warn / no » sont admissibles.
   Avant le brief 06-01 ces 3 cas étaient regroupés sous « outdoor » fourre-tout. */

/* Table BRAND → REGISTRE. Les clés sont normalisées (lowercase, accents
   retirés, espaces preserves) pour permettre un lookup robuste depuis
   raw.brand_name (qui peut arriver en CAPS ou avec accents). */
const BRAND_REGISTRE: Record<string, BrandRegistre> = {
  // ─── CLASSIQUE / TAILORING ───
  "brunello cucinelli": "classique",
  "tom ford": "classique",
  "canali": "classique",
  "ermenegildo zegna": "classique",
  "zegna": "classique",
  "loro piana": "classique",
  "paul smith": "classique",
  "polo ralph lauren": "classique",
  "ralph lauren": "classique",
  "hugo boss": "classique",
  "eton": "classique",
  "sezane": "classique",
  "sezane.": "classique",
  "sézane": "classique",
  "sandro": "classique",
  "maje": "classique",
  "the kooples": "classique",
  "suitsupply": "classique",
  "the shirt company": "classique",
  "ami paris": "classique", // ambigu mais penche tailoring soft
  /* "givenchy" déplacé en AVANT_GARDE plus bas. */
  "dolce & gabbana": "classique",
  /* "alexander mcqueen" déplacé en AVANT_GARDE (corps couture, drapés). */
  /* "burberry" déplacé en HERITAGE_COUNTRY (trench + check Nova, signature UK). */
  "saint laurent": "classique",
  "ysl": "classique",
  "valentino": "classique",
  "kiton": "classique",
  "santoni": "classique",
  "lanvin": "classique",
  /* "belstaff" + "barbour" + "mackintosh" : HERITAGE_COUNTRY (cf. plus bas). */
  /* "givenchy" déplacé en AVANT_GARDE (Tisci/Williams direction couture). */
  "church's": "classique",
  "churchs": "classique",
  /* "canada goose" / "moose knuckles" déplacés en OUTDOOR (doudounes). */
  "etro": "classique",
  "berluti": "classique",
  /* "moncler" déplacé en OUTDOOR plus bas (down jackets / outerwear technique). */
  "celine": "classique",
  "céline": "classique",
  "hermes": "classique",
  "hermès": "classique",
  "prada": "classique",
  "gucci": "classique",
  "dior": "classique",
  "fendi": "classique",
  "veja": "classique",
  /* "objects iv life" déplacé en STREETWEAR plus bas (esthétique urbaine). */
  /* "kaptain sunshine" déplacé en OUTDOOR plus bas (workwear heritage). */
  "margaret howell": "classique",
  "drake's": "classique",
  "loro piana interiors": "classique",

  // ─── STREETWEAR / CASUAL CHIC ───
  "amiri": "streetwear",
  /* "rick owens" déplacé en AVANT_GARDE (drapés / déconstruction noir). */
  "off-white": "streetwear",
  "off white": "streetwear",
  "palm angels": "streetwear",
  /* "stone island" déplacé en OUTDOOR (technique imperméable, military). */
  "icecream": "streetwear",
  "billionaire boys club": "streetwear",
  "neighborhood": "streetwear",
  "a bathing ape": "streetwear",
  "a bathing ape®": "streetwear",
  "anti social social club": "streetwear",
  /* "boris bidjan saberi" / "bianca saunders" / "charles jeffrey loverboy"
     déplacés en AVANT_GARDE plus bas (esthétique déconstructive). */
  "fear of god": "streetwear",
  "fear of god essentials": "streetwear",
  "essentials": "streetwear",
  "kith": "streetwear",
  "supreme": "streetwear",
  "stüssy": "streetwear",
  "stussy": "streetwear",
  "carhartt wip": "streetwear",
  "carhartt": "streetwear",
  "y-3": "streetwear",
  "adidas": "streetwear",
  "nike": "streetwear",
  "asics": "streetwear",
  "new balance": "streetwear",
  "on running": "streetwear",
  "bape": "streetwear",
  "kenzo": "streetwear",
  "evisu": "streetwear",
  "needles": "streetwear",
  "wtaps": "streetwear",
  "human made": "streetwear",
  "marni": "streetwear",
  /* "raf simons" déplacé en AVANT_GARDE plus bas. */
  "balenciaga": "streetwear",
  "vetements": "streetwear",
  "represent": "streetwear",
  "msftsrep": "streetwear",
  "purple brand": "streetwear",
  "true religion": "streetwear",
  "diesel": "streetwear",
  "ksubi": "streetwear",
  "rhude": "streetwear",
  "gallery dept.": "streetwear",
  "chrome hearts": "streetwear",
  "thom browne": "streetwear", // ambigu mais penche fashion-street

  // ─── MINIMALISTE / ARCHITECTURAL ───
  "jacquemus": "minimaliste",
  "lemaire": "minimaliste",
  /* "comme des garçons" + "comme des garçons shirt" déplacés en AVANT_GARDE.
     "comme des garçons play" reste streetwear (cf. plus bas — t-shirts cœur). */
  "ann demeulemeester": "minimaliste",
  "cos": "minimaliste",
  "acne studios": "minimaliste",
  "acne": "minimaliste",
  /* "maison margiela" + "margiela" déplacés en AVANT_GARDE (héritage CDG family). */
  "the row": "minimaliste",
  "khaite": "minimaliste",
  "totême": "minimaliste",
  "toteme": "minimaliste",
  "studio nicholson": "minimaliste",
  "the frankie shop": "minimaliste",
  "auralee": "minimaliste",
  "our legacy": "minimaliste",
  "jil sander": "minimaliste",
  /* "issey miyake" déplacé en AVANT_GARDE (pleats / 132 5. / Bao Bao). */
  "uniform experiment": "minimaliste",
  "post archive faction (paf)": "minimaliste",
  "paf": "minimaliste",
  "_j.l-a.l_": "minimaliste",
  "polène": "minimaliste",
  "polene": "minimaliste",

  // ─── DÉCONTRACTÉ / BASIQUE ───
  "muji": "decontracte",
  "muji france": "decontracte",
  "armor lux": "decontracte",
  "armor-lux": "decontracte",
  "american vintage": "decontracte",
  "faguo": "decontracte",
  "eden park": "decontracte",
  "birkenstock": "decontracte",
  "saucony": "decontracte",
  "champion": "decontracte",
  "russell athletic": "decontracte",
  "fila": "decontracte",
  "lacoste": "decontracte", // borderline classique/decontracte → on choisit decontracte
  "ben sherman": "decontracte",
  "fred perry": "decontracte",
  "ddrake's": "decontracte",
  "danner": "decontracte",
  "diemme": "decontracte",
  "salomon": "decontracte",
  "uggs": "decontracte",
  "ugg": "decontracte",

  // ─── OUTDOOR / HERITAGE / APRÈS-SKI ───
  // Brief 2026-05-31 (user bug Studio danois) : ces marques sont
  // fonctionnelles (outdoor/heritage/après-ski/country). Elles
  // arrivent souvent depuis le flux TBF mais ne s'habillent pas avec
  // les autres registres mode. Exclues par défaut de toutes les
  // tenues classique/minimaliste/streetwear/décontracté.
  "the north face": "outdoor",
  "north face": "outdoor",
  "patagonia": "outdoor",
  "arc'teryx": "outdoor",
  "arcteryx": "outdoor",
  "snow peak": "outdoor",
  "moncler": "outdoor",
  "canada goose": "outdoor",
  "moose knuckles": "outdoor",
  "klattermusen": "outdoor",
  "klättermusen": "outdoor",
  "fjallraven": "outdoor",
  "fjällräven": "outdoor",
  "and wander": "outdoor",
  "and-wander": "outdoor",
  /* "barbour" + "belstaff" + "filson" déplacés en HERITAGE_COUNTRY (cf. plus bas). */
  /* "moon boot" + "moonboot" + "sorel" déplacés en APRES_SKI (cf. plus bas). */
  "merrell": "outdoor",
  "columbia": "outdoor",
  "hiking patrol": "outdoor",
  "rocky mountain featherbed": "outdoor",
  "goldwin": "outdoor",
  "snow peak apparel": "outdoor",
  "maharishi": "outdoor", // camo/military aesthetic
  "c.p. company": "outdoor", // tech outerwear
  "stone island": "outdoor", // tech outerwear, military-inspired
  "engineered garments": "outdoor", // workwear/outdoor
  "kaptain sunshine": "outdoor", // workwear heritage
  "maison mihara yasuhiro": "streetwear", // garde streetwear (urbain)
  "post archive faction": "streetwear", // garde streetwear (urbain)
  "heliot emil": "streetwear",
  "44 label group": "streetwear",
  "objects iv life": "streetwear",

  // ─── AVANT-GARDE / DÉCONSTRUCTION ─── Brief 2026-06-01
  // Drapés, déconstruction, mono-couleur (souvent noir), couture asymétrique.
  // Famille japonaise (Rei Kawakubo / Yamamoto / Miyake / Watanabe / Sacai /
  // Undercover) + Anvers (Margiela / Demeulemeester) + ramifications Givenchy,
  // McQueen, Rick Owens. Compat : avec minimaliste en WARN, avec streetwear en
  // WARN, avec classique/outdoor/heritage_country/apres_ski → NO.
  "rick owens": "avant_garde",
  "yohji yamamoto": "avant_garde",
  "yohji": "avant_garde",
  "issey miyake": "avant_garde",
  "pleats please": "avant_garde",
  "homme plissé issey miyake": "avant_garde",
  "junya watanabe": "avant_garde",
  "junya watanabe man": "avant_garde",
  "sacai": "avant_garde",
  "undercover": "avant_garde",
  "comme des garçons": "avant_garde",
  "comme des garcons": "avant_garde",
  "comme des garçons shirt": "avant_garde",
  "comme des garcons shirt": "avant_garde",
  "comme des garçons homme plus": "avant_garde",
  "comme des garçons play": "streetwear",
  "comme des garcons play": "streetwear",
  "maison margiela": "avant_garde",
  "margiela": "avant_garde",
  "mm6 maison margiela": "avant_garde",
  "mm6": "avant_garde",
  "givenchy": "avant_garde",
  "alexander mcqueen": "avant_garde",
  "alexandermcqueen": "avant_garde",
  "raf simons": "avant_garde",
  "boris bidjan saberi": "avant_garde",
  "bianca saunders": "avant_garde",
  "charles jeffrey loverboy": "avant_garde",

  // ─── HERITAGE COUNTRY ─── Brief 2026-06-01
  // Heritage UK : wax / quilted / trench / tweed / nova check. Pas outdoor
  // technique. Compat : warn avec classique (un trench Burberry + costume
  // classique fonctionne), no avec tout le reste sauf decontracte (warn).
  "barbour": "heritage_country",
  "burberry": "heritage_country",
  "burberry london": "heritage_country",
  "mackintosh": "heritage_country",
  "mackintosh philosophy": "heritage_country",
  "belstaff": "heritage_country",
  "filson": "heritage_country",
  "ralph lauren rrl": "heritage_country",
  "rrl": "heritage_country",
  "drake's london": "heritage_country",
  "private white v.c.": "heritage_country",

  // ─── APRES_SKI / SAISONNIER HIVER ─── Brief 2026-06-01
  // Moon Boot, doudounes-cabines, fourrures synthétiques, mukluks. Tenue de
  // chalet, pas tenue de ville. Compat : ne va avec PERSONNE (sauf weekend
  // ski explicite). Le registre est exclu de toutes les tenues par défaut.
  "moon boot": "apres_ski",
  "moonboot": "apres_ski",
  "sorel": "apres_ski",
  /* "merrell" reste outdoor (rando, pas chalet) — déjà déclaré plus haut. */
  "fendi ski": "apres_ski",
  "moncler grenoble": "apres_ski",
  "perfect moment": "apres_ski",
  "bogner": "apres_ski",

  // ─── SUITABLE FR (Awin mid 34175 — menswear formel + business casual) ───
  // Brief 2026-06-01 : intégration flux Suitable FR (19 591 produits, 58
  // marques). Shop dominé par chemises/pantalons/polos formels. Toutes
  // les marques sont taggées explicitement car le fallback global est
  // désormais `outdoor` (qui exclut) — sans tag, ces marques disparaissent.
  // Classification : tailoring/business → classique ; jeans/casual/sport
  // → decontracte ; outerwear technique → outdoor.
  "suitable": "classique",
  "olymp": "classique",
  "profuomo": "classique",
  "meyer": "classique",
  "desoto": "classique",
  "casamoda": "classique",
  "boss": "classique", // alias de "hugo boss" déjà classique
  "pierre cardin": "classique",
  "gant": "classique",
  "slater": "classique",
  "william lockie": "classique",
  "r2 amsterdam": "classique",
  "pure": "classique",
  "alberto": "classique",
  "gardeur": "classique",
  "mcgregor": "classique",
  "fynch-hatton": "classique",
  "blue industry": "classique",
  "giorgio": "classique",
  "michaelis": "classique",
  "ledub": "classique",
  "venti": "classique",
  "seidensticker": "classique",
  "eterna": "classique",
  // Décontracté (jeans / casual / sportswear-leisure)
  "pme legend": "decontracte",
  "vanguard": "decontracte",
  "state of art": "decontracte",
  "steppin' out": "decontracte",
  "steppin out": "decontracte",
  "no excess": "decontracte",
  "tommy hilfiger": "decontracte",
  "mac": "decontracte",
  "garage": "decontracte",
  "cast iron": "decontracte",
  "sun68": "decontracte",
  "bjorn borg": "decontracte",
  "björn borg": "decontracte",
  "lyle and scott": "decontracte",
  "lyle & scott": "decontracte",
  "scotch and soda": "decontracte",
  "scotch & soda": "decontracte",
  "king essentials": "decontracte",
  "alan red": "decontracte",
  "marc o'polo": "decontracte",
  "marc o polo": "decontracte",
  "new zealand auckland": "decontracte",
  "nza": "decontracte",
  "superdry": "decontracte",
  "shiwi": "decontracte",
  "dstrezzed": "decontracte",
  "knowledgecotton apparel": "decontracte",
  "knowledge cotton apparel": "decontracte",
  "petrol": "decontracte",
  "petrol industries": "decontracte",
  "supply & co": "decontracte",
  "supply and co": "decontracte",
  "hoff": "decontracte",
  "greyder lab": "decontracte",
  "reset": "decontracte",
  "mey": "decontracte",
  // Classique additions Suitable
  "sir redman": "classique",
  "cavallaro napoli": "classique",
  "cavallaro": "classique",
  "sebago": "classique",
  // Streetwear additions Suitable
  "new era": "streetwear",
  // Outdoor (puffers / outerwear technique)
  "save the duck": "outdoor",
  "tenson": "outdoor",
  "didriksons": "outdoor",
};

/* Mapping style profil utilisateur → registre catalogue.
   Profil contient « Minimaliste | Classique | Streetwear | Décontracté »
   (cf. types Profile dans useProfile). Le styliste LLM utilise aussi
   « Old money », « Minimal » qu'on alias. */
const STYLE_TO_REGISTRE: Record<string, BrandRegistre> = {
  "classique": "classique",
  "old money": "classique",
  "tailoring": "classique",
  "formel": "classique",
  "luxe discret": "classique",
  "bourgeoisie": "classique",

  "streetwear": "streetwear",
  "street": "streetwear",

  "minimaliste": "minimaliste",
  "minimal": "minimaliste",
  "architectural": "minimaliste",

  "decontracte": "decontracte",
  "décontracté": "decontracte",
  "casual": "decontracte",
  "basique": "decontracte",
};

/** Normalise une chaîne pour le lookup brand : lowercase + trim + retire
 *  les espaces multiples. Conserve accents et caractères spéciaux (la
 *  table BRAND_REGISTRE les a déjà écrits ainsi). */
function normalizeBrandKey(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Retourne le registre d'une marque, ou null si inconnue.
 * Les marques inconnues retournent null pour qu'on puisse logger /
 * compter / décider de la stratégie de fallback côté caller.
 */
export function brandToRegistre(brand: string | undefined | null): BrandRegistre | null {
  if (!brand) return null;
  const key = normalizeBrandKey(brand);
  return BRAND_REGISTRE[key] || null;
}

/**
 * Retourne le registre d'une marque avec fallback `classique`.
 * Utiliser cette version quand on doit ABSOLUMENT classer (filter par
 * registre côté API).
 *
 * Brief 2026-05-31 v8 (user bug Studio danois) : avant, le fallback
 * était `classique` (« le moins risqué »). Conséquence : Moon Boot,
 * The North Face, Barbour qui n'étaient pas dans la table tombaient
 * en classique → passaient l'adjacence sur bas/veste/chaussures pour
 * Minimal → arrivaient dans une tenue Studio Danois. Bug majeur.
 *
 * Maintenant : fallback `outdoor`. Outdoor est EXCLU de tous les
 * autres registres → une marque inconnue est rejetée par défaut.
 * Plus sûr : on préfère manquer un Brunello inconnu (rare) que
 * laisser passer une marque outdoor non taggée.
 *
 * Ajouter explicitement les marques classique dans BRAND_REGISTRE
 * pour qu'elles passent les filtres.
 */
export function brandToRegistreOrFallback(brand: string | undefined | null): BrandRegistre {
  return brandToRegistre(brand) || "outdoor";
}

/**
 * Convertit un style de profil utilisateur (« Minimaliste », « Old money »…)
 * en registre catalogue. Retourne null si le style n'est pas mappé.
 */
export function styleToRegistre(style: string | undefined | null): BrandRegistre | null {
  if (!style) return null;
  const key = style.toLowerCase().trim();
  return STYLE_TO_REGISTRE[key] || null;
}

/**
 * Brief 2026-05-31 — Vision Pt A : liste des marques connues pour
 * l'autocomplete « Marques favorites » sur /compte. Renvoie les
 * noms d'affichage Title Case (et non les clés normalisées).
 */
export function listKnownBrands(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of Object.keys(BRAND_REGISTRE)) {
    const display = key
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    if (!seen.has(display)) {
      seen.add(display);
      out.push(display);
    }
  }
  return out.sort();
}
