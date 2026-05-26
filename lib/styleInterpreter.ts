/**
 * WADA — Style Interpreter (couche locale gratuite)
 * ─────────────────────────────────────────────────────────────────────────
 * Parse une requête utilisateur en langage naturel (FR) et la traduit en
 * entités exploitables par le moteur de recommandation.
 *
 * Architecture en cascade :
 *   1. Match exact dans `intentions` (phrases pré-écrites)
 *   2. Match regex dans `conflict_rules` (hybrides "simple mais stylé")
 *   3. Décomposition mot-à-mot via `contexts`, `synonyms`, `human_vocabulary`
 *   4. Application des `intensity_map` aux modulateurs détectés
 *   5. Fallback safe si rien ne match
 *
 * Avantages vs. appel direct OpenAI :
 *   - Latence ~0ms (vs 600-1500ms LLM)
 *   - Coût zéro (vs ~$0.0001/req)
 *   - Déterministe (mêmes inputs = mêmes outputs)
 *   - Fonctionne hors ligne / si l'API OpenAI tombe
 *
 * Limite : si la requête est trop "créative", on tombe en fallback.
 * Dans ce cas, l'API stylist appelle quand même OpenAI en arrière-plan
 * pour une analyse plus fine (cf. `/api/stylist/route.ts`).
 * ─────────────────────────────────────────────────────────────────────── */

import dict from "./styleDictionary.fr.json";

export type InterpretResult = {
  occasion?: string;
  style?: string;
  formality?: number;
  comfort?: number;
  color_mood?: string;
  intensity?: number;
  effort_level?: number;
  confidence?: number;
  mood?: string;
  /** Matières/tissus détectés (lin, soie, cachemire, denim, velours…) */
  materials?: string[];
  /** Pièces spécifiques demandées (chemise, pantalon, robe…) */
  specific_items?: string[];
  /** Choses à exclure : couleurs, matières, items refusés ("pas de noir") */
  excluded?: {
    colors?: string[];
    materials?: string[];
    items?: string[];
    features?: string[];  // "talon", "manche longue", "logo"…
  };
  /** Contraintes pratiques (météo, voyage, confort spécifique) */
  practical?: {
    weather?: "froid" | "chaud" | "pluie" | "neige" | "vent";
    activity?: string;     // "voyage avion", "vélo", "marche"
    body_focus?: string;   // "cacher ventre", "jambes mises en valeur"
  };
  /** Vêtements ou marques que l'utilisateur POSSÈDE déjà et autour
      desquels il veut construire la tenue. Ex : "avec mes Loro Piana",
      "ma chemise blanche", "mon jean droit", "avec mon Hermès". */
  owned_items?: Array<{
    brand?: string;        // marque détectée (Loro Piana, COS, Sézane...)
    item?: string;         // pièce détectée si nommée (mocassins, chemise...)
    raw: string;           // segment original capturé
  }>;
  matched_via: "intention" | "conflict" | "vocabulary" | "fallback";
  explanation: string;
};

/** Normalise une string pour match insensible accents/casse/ponctuation + emojis.
    Convertit aussi les tirets en espaces pour que "t-shirt" matche "t shirt". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // Retire les emojis (range Unicode des pictogrammes)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[!?.,;:'"()…«»\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ──────────────────────────────────────────────────────────────────────
   DICTIONNAIRES — extraction d'entités fines
   ────────────────────────────────────────────────────────────────────── */

/** Matières/tissus reconnus. Mapping forme normalisée → label canonique. */
const MATERIALS: Record<string, string> = {
  "lin": "lin",
  "lin lave": "lin lavé",
  "soie": "soie",
  "satin": "satin",
  "cachemire": "cachemire",
  "kashmir": "cachemire",
  "laine": "laine",
  "mohair": "mohair",
  "alpaga": "alpaga",
  "coton": "coton",
  "coton bio": "coton bio",
  "popeline": "popeline",
  "denim": "denim",
  "jean": "denim",
  "velours": "velours",
  "velvet": "velours",
  "daim": "daim",
  "suede": "daim",
  "cuir": "cuir",
  "cuir vegan": "cuir vegan",
  "viscose": "viscose",
  "rayonne": "viscose",
  "lyocell": "lyocell",
  "tencel": "lyocell",
  "modal": "modal",
  "polyester": "polyester",
  "elasthane": "elasthane",
  "tweed": "tweed",
  "flanelle": "flanelle",
  "gabardine": "gabardine",
  "popline": "popeline",
  "jersey": "jersey",
  "polaire": "polaire",
  "duvet": "duvet",
  "shearling": "shearling",
  "mouton": "shearling",
  "neoprene": "néoprène",
};

/** Pièces vestimentaires reconnues. */
const SPECIFIC_ITEMS: Record<string, string> = {
  "chemise": "chemise",
  "chemisier": "chemisier",
  "polo": "polo",
  "t shirt": "t-shirt",
  "tee shirt": "t-shirt",
  "tshirt": "t-shirt",
  "tee": "t-shirt",
  "debardeur": "débardeur",
  "haut": "haut",
  "blouse": "blouse",
  "pull": "pull",
  "pull over": "pull",
  "sweat": "sweat",
  "sweater": "sweat",
  "hoodie": "hoodie",
  "cardigan": "cardigan",
  "gilet": "gilet",
  "veste": "veste",
  "blazer": "blazer",
  "manteau": "manteau",
  "trench": "trench",
  "trenchcoat": "trench",
  "doudoune": "doudoune",
  "puffer": "doudoune",
  "parka": "parka",
  "bomber": "bomber",
  "kimono": "kimono",
  "cape": "cape",
  "poncho": "poncho",
  "pantalon": "pantalon",
  "jean": "jean",
  "jeans": "jean",
  "chino": "chino",
  "short": "short",
  "bermuda": "bermuda",
  "jupe": "jupe",
  "mini jupe": "mini-jupe",
  "midi": "jupe midi",
  "robe": "robe",
  "robe longue": "robe longue",
  "maxi robe": "robe longue",
  "combinaison": "combinaison",
  "salopette": "salopette",
  "costume": "costume",
  "smoking": "smoking",
  "tailleur": "tailleur",
  "chaussures": "chaussures",
  "baskets": "sneakers",
  "sneakers": "sneakers",
  "tennis": "sneakers",
  "derbies": "derbies",
  "mocassins": "mocassins",
  "loafers": "mocassins",
  "boots": "boots",
  "bottines": "bottines",
  "bottes": "bottes",
  "escarpins": "escarpins",
  "talons": "escarpins",
  "ballerines": "ballerines",
  "sandales": "sandales",
  "mules": "mules",
  "espadrilles": "espadrilles",
  "sac": "sac",
  "sac a main": "sac à main",
  "sac a dos": "sac à dos",
  "tote": "tote",
  "cabas": "cabas",
  "pochette": "pochette",
  "ceinture": "ceinture",
  "echarpe": "écharpe",
  "foulard": "foulard",
  "chapeau": "chapeau",
  "casquette": "casquette",
  "beret": "béret",
  "lunettes": "lunettes",
  "lunettes de soleil": "lunettes de soleil",
  "montre": "montre",
  "collier": "collier",
  "bracelet": "bracelet",
  "bague": "bague",
  "boucles d oreilles": "boucles d'oreilles",
};

/** Mots déclencheurs de négation — précèdent une entité à exclure. */
const NEGATION_TRIGGERS = [
  /pas (?:de |d'?|trop )?/g,
  /sans /g,
  /j(?:'| ?ai)? ?(?:pas )?envie de /g,
  /j(?:'| ?)evite /g,
  /jamais (?:de |d'?)?/g,
  /aucun(?:e)? /g,
  /surtout pas (?:de |d'?)?/g,
  /rien (?:de |d'?)?(?:qui )?/g,
];

/** Mots météo / contexte pratique. */
const WEATHER_KEYWORDS: Record<string, "froid" | "chaud" | "pluie" | "neige" | "vent"> = {
  "pluie": "pluie",
  "il pleut": "pluie",
  "averse": "pluie",
  "neige": "neige",
  "il neige": "neige",
  "froid": "froid",
  "frais": "froid",
  "polaire": "froid",
  "glagla": "froid",
  "caniculaire": "chaud",
  "canicule": "chaud",
  "chaleur": "chaud",
  "etouffant": "chaud",
  "humide": "chaud",
  "vent": "vent",
  "venteux": "vent",
  "mistral": "vent",
};

const BODY_FOCUS_KEYWORDS: Record<string, string> = {
  "cacher ventre": "atténuer le ventre",
  "cacher mon ventre": "atténuer le ventre",
  "ventre plat": "atténuer le ventre",
  "mettre en valeur les jambes": "valoriser les jambes",
  "valoriser mes jambes": "valoriser les jambes",
  "jambes": "valoriser les jambes",
  "mettre en valeur la taille": "valoriser la taille",
  "taille fine": "valoriser la taille",
  "epaules": "structurer les épaules",
  "decollete": "valoriser le décolleté",
  "poitrine": "couvrir la poitrine",
  "hanches": "harmoniser les hanches",
  "fesses": "valoriser les fesses",
};

/** Marques reconnues — pour la détection "j'ai un X que je veux porter".
    Toutes en minuscules + normalisées (sans accents). Mapping forme → label canonique. */
const BRANDS: Record<string, string> = {
  // Luxe
  "loro piana": "Loro Piana",
  "loropiana": "Loro Piana",
  "brunello cucinelli": "Brunello Cucinelli",
  "brunello": "Brunello Cucinelli",
  "cucinelli": "Brunello Cucinelli",
  "hermes": "Hermès",
  "chanel": "Chanel",
  "louis vuitton": "Louis Vuitton",
  "lv": "Louis Vuitton",
  "dior": "Dior",
  "gucci": "Gucci",
  "prada": "Prada",
  "bottega": "Bottega Veneta",
  "bottega veneta": "Bottega Veneta",
  "saint laurent": "Saint Laurent",
  "ysl": "Saint Laurent",
  "celine": "Celine",
  "céline": "Celine",
  "balenciaga": "Balenciaga",
  "fendi": "Fendi",
  "burberry": "Burberry",
  "valentino": "Valentino",
  "miu miu": "Miu Miu",
  "loewe": "Loewe",
  "the row": "The Row",
  "row": "The Row",
  "khaite": "Khaite",
  "maison margiela": "Maison Margiela",
  "margiela": "Maison Margiela",
  "mm6": "Maison Margiela",
  "rick owens": "Rick Owens",
  "ann demeulemeester": "Ann Demeulemeester",
  "stella mccartney": "Stella McCartney",
  "jacquemus": "Jacquemus",
  "lemaire": "Lemaire",
  "toteme": "Toteme",
  "tot ême": "Toteme",
  "common projects": "Common Projects",
  // Premium
  "cos": "COS",
  "arket": "Arket",
  "and other stories": "& Other Stories",
  "& other stories": "& Other Stories",
  "stories": "& Other Stories",
  "massimo dutti": "Massimo Dutti",
  "sezane": "Sézane",
  "sézane": "Sézane",
  "sandro": "Sandro",
  "maje": "Maje",
  "kooples": "The Kooples",
  "the kooples": "The Kooples",
  "ba&sh": "Ba&sh",
  "bash": "Ba&sh",
  "zadig": "Zadig & Voltaire",
  "zadig & voltaire": "Zadig & Voltaire",
  "claudie pierlot": "Claudie Pierlot",
  "rouje": "Rouje",
  "polene": "Polène",
  "polène": "Polène",
  "soeur": "Soeur",
  "officine generale": "Officine Générale",
  "officine générale": "Officine Générale",
  "aime leon dore": "Aimé Leon Dore",
  "aimé leon dore": "Aimé Leon Dore",
  "ald": "Aimé Leon Dore",
  "reformation": "Reformation",
  "ganni": "Ganni",
  // Mid-range / accessible
  "uniqlo": "Uniqlo",
  "muji": "MUJI",
  "zara": "Zara",
  "mango": "Mango",
  "h&m": "H&M",
  "hm": "H&M",
  "pull&bear": "Pull&Bear",
  "bershka": "Bershka",
  "lacoste": "Lacoste",
  "levi's": "Levi's",
  "levis": "Levi's",
  "tommy hilfiger": "Tommy Hilfiger",
  "tommy": "Tommy Hilfiger",
  "weekday": "Weekday",
  "polo ralph lauren": "Polo Ralph Lauren",
  "ralph lauren": "Polo Ralph Lauren",
  "rl": "Polo Ralph Lauren",
  "veja": "Veja",
  "salomon": "Salomon",
  "new balance": "New Balance",
  "nb": "New Balance",
  "adidas": "Adidas",
  "nike": "Nike",
  "converse": "Converse",
  "vans": "Vans",
  "birkenstock": "Birkenstock",
  "dr martens": "Dr. Martens",
  "doc martens": "Dr. Martens",
  // Vintage / luxe seconde main
  "vestiaire collective": "Vestiaire Collective",
  "vestiaire": "Vestiaire Collective",
  "vinted": "Vinted",
  // Maroquinerie
  "longchamp": "Longchamp",
  "le tanneur": "Le Tanneur",
  // Bijoux / accessoires
  "cartier": "Cartier",
  "tiffany": "Tiffany & Co",
  "swatch": "Swatch",
};

/** Patterns possessifs — déclencheurs qui signalent un vêtement possédé.
    Capturent le segment après le déclencheur jusqu'à une frontière.
    Inclut les verbes "accorder / coordonner / associer / matcher" qui
    impliquent qu'un item existant doit être marié à d'autres. */
const OWNERSHIP_PATTERNS = [
  /\bavec mes? \b/g,
  /\bavec mon \b/g,
  /\bavec ma \b/g,
  /\bporter (?:mes?|mon|ma) \b/g,
  /\bj['e ]?ai (?:un|une|des|mon|ma|mes) \b/g,
  /\bje poss[èe]de (?:un|une|des|mon|ma|mes) \b/g,
  /\bj['e ]?ai d[éee]j[àa] (?:un|une|des|mon|ma|mes) \b/g,
  /\bmes? \w+ (?:que j['e ]?ai|de l['e ]ann[ée]e)/g,
  // Verbes "construire autour de" — l'utilisateur a déjà l'item et veut
  // l'accorder avec autre chose. Très fréquent en langage naturel.
  /\baccord[éee]r (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bcoordonner (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bassocier (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bmatcher (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bcombiner (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bquoi mettre avec (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bque mettre avec (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\bcomment porter (?:mes?|mon|ma|un|une|des|le|la|les) \b/g,
  /\btenue autour (?:de |du |des |d['e ])(?:mon|ma|mes|un|une|le|la|les) \b/g,
];

/** Couleurs reconnaissables — utilisées pour matérialiser les exclusions. */
const COLORS = [
  "noir", "blanc", "creme", "ecru", "beige", "marron", "chocolat",
  "marine", "bleu", "bleu marine", "bleu ciel", "indigo", "denim",
  "vert", "kaki", "olive", "sauge", "menthe", "emeraude",
  "rouge", "bordeaux", "brique", "framboise", "coquelicot",
  "rose", "poudre", "fuchsia",
  "jaune", "moutarde", "or", "ocre",
  "orange", "terracotta", "abricot", "saumon",
  "violet", "lavande", "lilas", "prune",
  "gris", "anthracite", "argent", "souris",
  "camel", "tan", "cognac",
  "monochrome", "neutre", "pastel", "vif", "sombre", "fonce", "clair",
];

/** Interprète une requête FR libre → entités stylistiques */
export function interpret(rawQuery: string): InterpretResult {
  const query = normalize(rawQuery);
  if (!query) return fallbackResult();

  // ─── 1. Match exact dans intentions ────────────────────────────────
  for (const [phrase, payload] of Object.entries(dict.intentions)) {
    if (query.includes(normalize(phrase))) {
      return {
        ...payload,
        matched_via: "intention",
        explanation: payload.explanation,
      };
    }
  }

  // ─── 2. Conflict rules (regex sur hybrides) ────────────────────────
  for (const rule of dict.conflict_rules) {
    try {
      const re = new RegExp(rule.pattern, "i");
      if (re.test(query)) {
        return {
          style: rule.interpretation.style,
          matched_via: "conflict",
          explanation: rule.interpretation.notes,
        };
      }
    } catch {
      /* regex invalide dans le JSON → skip */
    }
  }

  // ─── 3. Décomposition mot-à-mot ────────────────────────────────────
  const tokens = query.split(" ");
  const result: InterpretResult = {
    matched_via: "vocabulary",
    explanation: "",
  };
  const explanationParts: string[] = [];

  // 3a. Contexte (boulot → Bureau)
  for (const token of tokens) {
    const ctx = (dict.contexts as Record<string, string>)[token];
    if (ctx && !result.occasion) {
      result.occasion = ctx;
      explanationParts.push(`"${token}" → ${ctx}`);
    }
  }

  // 3b. Vocabulaire vernaculaire (vite fait, effortless…)
  for (const [expr, payload] of Object.entries(dict.human_vocabulary)) {
    if (query.includes(normalize(expr))) {
      Object.assign(result, payload.triggers);
      explanationParts.push(`"${expr}" : ${payload.meaning}`);
    }
  }

  // 3c. Modulateurs d'intensité (très, un peu, pas trop…)
  for (const [modifier, level] of Object.entries(dict.intensity_map)) {
    if (query.includes(normalize(modifier))) {
      result.intensity = level;
      explanationParts.push(`intensité "${modifier}" = ${level}`);
      break;  // une seule intensité par requête
    }
  }

  // 3d. Matières / tissus détectés
  const materials: string[] = [];
  for (const [keyword, canonical] of Object.entries(MATERIALS)) {
    if (query.includes(keyword)) {
      if (!materials.includes(canonical)) materials.push(canonical);
    }
  }
  if (materials.length) {
    result.materials = materials;
    explanationParts.push(`matières : ${materials.join(", ")}`);
  }

  // 3e. Pièces vestimentaires spécifiques demandées
  const specificItems: string[] = [];
  for (const [keyword, canonical] of Object.entries(SPECIFIC_ITEMS)) {
    if (query.includes(keyword)) {
      if (!specificItems.includes(canonical)) specificItems.push(canonical);
    }
  }
  if (specificItems.length) {
    result.specific_items = specificItems;
    explanationParts.push(`pièces : ${specificItems.join(", ")}`);
  }

  // 3f. Négations / exclusions ("sans noir", "pas de talon", "j'évite le cuir")
  const excluded: NonNullable<InterpretResult["excluded"]> = {};
  for (const trigger of NEGATION_TRIGGERS) {
    trigger.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = trigger.exec(query)) !== null) {
      // Capture le segment APRÈS le déclencheur (jusqu'à 4 mots max)
      const afterIdx = m.index + m[0].length;
      const tail = query.slice(afterIdx, afterIdx + 60).split(/[,;.!?]| et | mais |je veux|je cherche/)[0];
      // Cherche couleur / matière / item dans le segment
      for (const color of COLORS) {
        if (tail.includes(color)) {
          excluded.colors ??= [];
          if (!excluded.colors.includes(color)) excluded.colors.push(color);
        }
      }
      for (const [keyword, canonical] of Object.entries(MATERIALS)) {
        if (tail.includes(keyword)) {
          excluded.materials ??= [];
          if (!excluded.materials.includes(canonical)) excluded.materials.push(canonical);
        }
      }
      for (const [keyword, canonical] of Object.entries(SPECIFIC_ITEMS)) {
        if (tail.includes(keyword)) {
          excluded.items ??= [];
          if (!excluded.items.includes(canonical)) excluded.items.push(canonical);
        }
      }
      // Mots-features ("talon", "manche longue", "logo", "imprime")
      const features = ["talon", "talons", "manches longues", "decollete", "decolleté", "logo", "imprime", "imprimé", "transparent", "moulant", "court", "long", "ample", "serre", "serré"];
      for (const feat of features) {
        if (tail.includes(feat)) {
          excluded.features ??= [];
          if (!excluded.features.includes(feat)) excluded.features.push(feat);
        }
      }
    }
  }
  if (Object.keys(excluded).length) {
    result.excluded = excluded;
    const summary = Object.values(excluded).flat().slice(0, 3).join(", ");
    explanationParts.push(`éviter : ${summary}`);
  }

  // 3g. Contraintes pratiques (météo, voyage, corps)
  const practical: NonNullable<InterpretResult["practical"]> = {};
  for (const [keyword, weather] of Object.entries(WEATHER_KEYWORDS)) {
    if (query.includes(keyword)) {
      practical.weather = weather;
      explanationParts.push(`météo : ${weather}`);
      break;
    }
  }
  // Activités pratiques
  const ACTIVITY_PATTERNS: Array<[RegExp, string]> = [
    [/voyage.*avion|avion|aeroport|airport/, "voyage avion"],
    [/voyage.*train|tgv/, "voyage train"],
    [/velo|bicyclette/, "vélo"],
    [/marche|marcher|randonnee|rando/, "marche"],
    [/course|courir|running|jogging/, "running"],
    [/yoga|pilates|stretch/, "yoga"],
    [/concert|festival|live/, "concert"],
  ];
  for (const [pattern, activity] of ACTIVITY_PATTERNS) {
    if (pattern.test(query)) {
      practical.activity = activity;
      explanationParts.push(`activité : ${activity}`);
      break;
    }
  }
  // Body focus
  for (const [keyword, focus] of Object.entries(BODY_FOCUS_KEYWORDS)) {
    if (query.includes(keyword)) {
      practical.body_focus = focus;
      explanationParts.push(`corps : ${focus}`);
      break;
    }
  }
  if (Object.keys(practical).length) {
    result.practical = practical;
  }

  // 3h. Vêtements / marques déjà possédés ("avec mes Loro Piana",
  //     "ma chemise blanche", "mon jean") — IMPORTANT pour qu'on
  //     construise AUTOUR au lieu de proposer une pièce neuve.
  const owned: NonNullable<InterpretResult["owned_items"]> = [];

  // Stratégie 1 : déclencheur possessif → segment après → cherche marque + item
  for (const pattern of OWNERSHIP_PATTERNS) {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(query)) !== null) {
      const after = query.slice(m.index + m[0].length, m.index + m[0].length + 50);
      // Coupe au prochain connecteur fort
      const segment = after.split(/[,;.!?]| pour | mais | et puis | parce/)[0].trim();
      if (!segment) continue;

      let brand: string | undefined;
      let item: string | undefined;

      // Cherche marque dans le segment (greedy : on prend la plus longue)
      const brandKeys = Object.keys(BRANDS).sort((a, b) => b.length - a.length);
      for (const key of brandKeys) {
        if (segment.includes(key)) {
          brand = BRANDS[key];
          break;
        }
      }
      // Cherche item dans le segment
      const itemKeys = Object.keys(SPECIFIC_ITEMS).sort((a, b) => b.length - a.length);
      for (const key of itemKeys) {
        if (segment.includes(key)) {
          item = SPECIFIC_ITEMS[key];
          break;
        }
      }

      if (brand || item) {
        owned.push({ brand, item, raw: segment });
      }
    }
  }

  // Stratégie 2 : si une marque est mentionnée + le mot "mes/mon/ma" est
  // anywhere dans la query (même sans regex parfaite), on capte.
  if (!owned.length && /\b(?:mes?|mon|ma)\b/.test(query)) {
    const brandKeys = Object.keys(BRANDS).sort((a, b) => b.length - a.length);
    for (const key of brandKeys) {
      if (query.includes(key)) {
        owned.push({ brand: BRANDS[key], raw: key });
        break;
      }
    }
  }

  if (owned.length) {
    result.owned_items = owned;
    const summary = owned.map((o) => o.brand || o.item || o.raw).join(", ");
    explanationParts.push(`possédé : ${summary}`);
  }

  // Si on a au moins une info concrète → renvoie le partial
  if (
    result.occasion || result.style ||
    result.effort_level !== undefined ||
    result.materials || result.specific_items ||
    result.excluded || result.practical || result.owned_items
  ) {
    result.explanation = explanationParts.join(" · ");
    return result;
  }

  // ─── 4. Fallback ───────────────────────────────────────────────────
  return fallbackResult();
}

function fallbackResult(): InterpretResult {
  const fb = dict.fallback_interpretation;
  return {
    occasion: fb.occasion,
    style: fb.style,
    formality: fb.formality,
    comfort: fb.comfort,
    matched_via: "fallback",
    explanation: fb.reasoning,
  };
}

/** Statistiques du dictionnaire chargé — utile pour /admin et /diagnostic */
export function dictStats() {
  return {
    synonyms: Object.keys(dict.synonyms).length,
    intentions: Object.keys(dict.intentions).length,
    contexts: Object.keys(dict.contexts).length,
    intensity_map: Object.keys(dict.intensity_map).length,
    conflict_rules: dict.conflict_rules.length,
    human_vocabulary: Object.keys(dict.human_vocabulary).length,
    total:
      Object.keys(dict.synonyms).length +
      Object.keys(dict.intentions).length +
      Object.keys(dict.contexts).length +
      Object.keys(dict.intensity_map).length +
      dict.conflict_rules.length +
      Object.keys(dict.human_vocabulary).length,
  };
}
