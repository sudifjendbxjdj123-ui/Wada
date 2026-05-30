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
  | "classique"     // Brunello, Tom Ford, Zegna, Loro Piana, Polo Ralph Lauren…
  | "streetwear"    // Amiri, Rick Owens, Off-White, Palm Angels, AMI, A Bathing Ape…
  | "minimaliste"   // Jacquemus, Lemaire, Comme des Garçons, Acne Studios…
  | "decontracte";  // MUJI, Armor Lux, American Vintage, Birkenstock…

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
  "givenchy": "classique",
  "dolce & gabbana": "classique",
  "alexander mcqueen": "classique",
  "burberry": "classique",
  "saint laurent": "classique",
  "ysl": "classique",
  "valentino": "classique",
  "kiton": "classique",
  "santoni": "classique",
  "lanvin": "classique",
  "belstaff": "classique",
  "barbour": "classique",
  "church's": "classique",
  "churchs": "classique",
  "canada goose": "classique",
  "moose knuckles": "classique",
  "etro": "classique",
  "berluti": "classique",
  "moncler": "classique",
  "celine": "classique",
  "céline": "classique",
  "hermes": "classique",
  "hermès": "classique",
  "prada": "classique",
  "gucci": "classique",
  "dior": "classique",
  "fendi": "classique",
  "veja": "classique",
  "objects iv life": "classique",
  "kaptain sunshine": "classique",
  "margaret howell": "classique",
  "drake's": "classique",
  "loro piana interiors": "classique",

  // ─── STREETWEAR / CASUAL CHIC ───
  "amiri": "streetwear",
  "rick owens": "streetwear",
  "off-white": "streetwear",
  "off white": "streetwear",
  "palm angels": "streetwear",
  "stone island": "streetwear",
  "icecream": "streetwear",
  "billionaire boys club": "streetwear",
  "neighborhood": "streetwear",
  "a bathing ape": "streetwear",
  "a bathing ape®": "streetwear",
  "anti social social club": "streetwear",
  "boris bidjan saberi": "streetwear",
  "bianca saunders": "streetwear",
  "charles jeffrey loverboy": "streetwear",
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
  "raf simons": "streetwear",
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
  "comme des garçons": "minimaliste",
  "comme des garcons": "minimaliste",
  "comme des garçons shirt": "minimaliste",
  "comme des garçons play": "minimaliste",
  "ann demeulemeester": "minimaliste",
  "cos": "minimaliste",
  "acne studios": "minimaliste",
  "acne": "minimaliste",
  "maison margiela": "minimaliste",
  "margiela": "minimaliste",
  "the row": "minimaliste",
  "khaite": "minimaliste",
  "totême": "minimaliste",
  "toteme": "minimaliste",
  "studio nicholson": "minimaliste",
  "the frankie shop": "minimaliste",
  "auralee": "minimaliste",
  "our legacy": "minimaliste",
  "jil sander": "minimaliste",
  "issey miyake": "minimaliste",
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
 * registre côté API). Les marques inconnues tombent en classique (le
 * moins risqué — un produit luxe inconnu est plus souvent classique
 * qu'autre chose).
 */
export function brandToRegistreOrFallback(brand: string | undefined | null): BrandRegistre {
  return brandToRegistre(brand) || "classique";
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
