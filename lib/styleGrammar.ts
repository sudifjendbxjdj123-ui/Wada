/**
 * WADA — Grammaire stylistique formelle (lecture humaine ET machine)
 * ─────────────────────────────────────────────────────────────────────────
 * Chaque style WADA possède un "ADN" structuré : fabrics, silhouette, color
 * bias, contexte, pièces iconiques. C'est cette table qui permet à une IA
 * (ou à un score déterministe) de raisonner sur la compatibilité d'une
 * tenue avec un style donné.
 *
 * Inspiration : éditorial COS (minimalisme structuré) + dictionnaire Sanzo
 * Wada (chaque palette a un caractère nommé). Plus une fashion-DSL qu'un
 * catalogue d'image.
 * ─────────────────────────────────────────────────────────────────────── */

import type { StyleModeKey } from "./data";

export type ColorBias =
  | "cool"      // bleus, gris froid, ardoise
  | "warm"      // ocres, beige chaud, brique
  | "earthy"    // terracotta, kaki, sépia
  | "neutral"   // crème, ivoire, ink
  | "vibrant"   // saturé, jamais éteint
  | "any";

export type Saturation = "muted" | "saturated" | "any";
export type Silhouette = "structured" | "fluid" | "oversize" | "fitted" | "any";

export type StyleProfile = {
  /** Identifiant du style — correspond à StyleModeKey (cf. lib/data.ts). */
  key: StyleModeKey;
  /** Nom court éditorial — affiché dans l'UI. */
  label: string;
  /** ADN court — 3-4 mots qui caractérisent le style. */
  adn: string;
  /** Description longue — utilisée dans les tooltips, l'aide, l'IA-prompting. */
  manifesto: string;
  /** Mots-clés tissus préférés (lana, mérinos, lin, oxford…) — sert au scoring. */
  fabrics: string[];
  /** Pièces iconiques — celles qui définissent le style à elles seules. */
  iconicPieces: string[];
  /** Pièces qui le tuent — disqualifient ou pénalisent fortement. */
  forbiddenPieces: string[];
  /** Couleurs préférées (mots-clés sur le NOM de la couleur, pas le hex). */
  preferredColorTerms: string[];
  /** Couleurs à éviter. */
  avoidedColorTerms: string[];
  /** Biais chromatique principal. */
  colorBias: ColorBias;
  /** Saturation préférée. */
  saturation: Saturation;
  /** Silhouette préférée. */
  silhouette: Silhouette;
  /** Contextes d'usage typiques — sert au filtre Occasion. */
  context: string[];
  /** Mood emotional — sert au matching utilisateur. */
  mood: string[];
};

/* ──────────────────────────────────────────────────────────────────────
   Table des profils — la "grammaire" complète
   ────────────────────────────────────────────────────────────────────── */

export const styleProfiles: Record<StyleModeKey, StyleProfile> = {

  // ── "Tous styles" — placeholder neutre ──
  "all": {
    key: "all",
    label: "Tous styles",
    adn: "Sans filtre",
    manifesto: "Aucun caractère imposé. La palette suffit.",
    fabrics: [], iconicPieces: [], forbiddenPieces: [],
    preferredColorTerms: [], avoidedColorTerms: [],
    colorBias: "any", saturation: "any", silhouette: "any",
    context: [], mood: [],
  },

  // ── Minimal clean ──
  "minimal": {
    key: "minimal",
    label: "Minimal clean",
    adn: "Lignes pures · monochrome · architecture",
    manifesto: "Le moins possible, le mieux possible. Coupes droites, palettes monochromes, attention obsessionnelle au tissu. Acne · COS · Lemaire · Toteme.",
    fabrics: ["laine", "merino", "cachemire", "coton fin", "oxford", "popeline", "wool", "twill", "cotton"],
    iconicPieces: ["pull col rond", "chemise oxford", "trench beige", "pantalon droit", "sneakers blanches", "tshirt blanc", "blazer noir"],
    forbiddenPieces: ["maillot foot", "imprimé floral", "wax", "guayabera", "huipil", "kente"],
    preferredColorTerms: ["ivoire", "crème", "noir", "ink", "blanc", "gris", "ardoise", "givre", "anthracite", "marine", "kaki"],
    avoidedColorTerms: ["fuchsia", "écarlate", "néon", "violet"],
    colorBias: "neutral", saturation: "muted", silhouette: "structured",
    context: ["bureau", "weekend", "voyage", "galerie", "diner"],
    mood: ["calme", "intemporel", "épuré", "sobre"],
  },

  // ── Old money ──
  "old-money": {
    key: "old-money",
    label: "Old money",
    adn: "Bourgeoisie discrète · laine · tailoring",
    manifesto: "L'élégance qui ne s'annonce pas. Cachemire, laine, lin, polos en piqué. Loro Piana · Brunello Cucinelli · Khaite · Ralph Lauren.",
    fabrics: ["cachemire", "laine", "lin", "tweed", "soie", "piqué", "lambswool", "flanelle", "merino"],
    iconicPieces: ["pull cachemire", "polo piqué", "loafers", "chinos beige", "blazer marine", "trench camel", "chemise oxford", "jupe plissée"],
    forbiddenPieces: ["sweat oversize", "sneakers néon", "doudoune logo", "joggers", "hoodie"],
    preferredColorTerms: ["camel", "marine", "bordeaux", "beige", "crème", "ivoire", "kaki", "tweed", "brun"],
    avoidedColorTerms: ["néon", "fluo", "fuchsia", "violet électrique"],
    colorBias: "warm", saturation: "muted", silhouette: "structured",
    context: ["bureau", "diner", "cérémonie", "week-end campagne", "voyage"],
    mood: ["confiant", "intemporel", "raffiné", "discret"],
  },

  // ── Streetwear ──
  "streetwear": {
    key: "streetwear",
    label: "Streetwear",
    adn: "Rue · oversize · hype",
    manifesto: "Le confort revendiqué. Sweat oversize, joggers, sneakers, casquette. Carhartt · Stüssy · Supreme · Aimé Leon Dore · Stone Island.",
    fabrics: ["coton lourd", "molleton", "denim", "nylon", "ripstop", "fleece", "jersey"],
    iconicPieces: ["hoodie", "sweat oversize", "joggers", "cargo", "sneakers", "casquette", "tshirt graphique", "tote", "doudoune"],
    forbiddenPieces: ["costume trois-pieces", "smoking", "cravate", "escarpins"],
    preferredColorTerms: ["noir", "gris", "kaki", "olive", "écarlate", "marine", "blanc cassé", "indigo"],
    avoidedColorTerms: ["rose poudré", "ivoire", "écru"],
    colorBias: "any", saturation: "muted", silhouette: "oversize",
    context: ["weekend", "concert", "skate", "café", "voyage"],
    mood: ["cool", "décontracté", "expressif", "urbain"],
  },

  // ── Sport chic ──
  "sport-chic": {
    key: "sport-chic",
    label: "Sport chic",
    adn: "Athleisure · performance · sneakers",
    manifesto: "Le sport sublimé. Technique mais coupé. Lululemon · Lacoste · Y-3 · Stone Island · Salomon.",
    fabrics: ["nylon", "tech", "merino", "softshell", "ripstop", "stretch", "polyamide"],
    iconicPieces: ["polo piqué", "veste coupe-vent", "sneakers", "pantalon chino sport", "doudoune fine", "sweat zip", "shorts"],
    forbiddenPieces: ["smoking", "cravate", "robe de soirée", "talons"],
    preferredColorTerms: ["blanc", "marine", "gris", "noir", "kaki", "bleu glacier"],
    avoidedColorTerms: ["bordeaux profond", "violet", "ivoire fragile"],
    colorBias: "cool", saturation: "muted", silhouette: "fitted",
    context: ["weekend", "voyage", "sport", "café", "bureau décontracté"],
    mood: ["dynamique", "moderne", "technique", "propre"],
  },

  // ── Bohème ──
  "bohème": {
    key: "bohème",
    label: "Bohème",
    adn: "Fleuri · texturé · rêveur",
    manifesto: "Le souffle nomade. Imprimés, broderies, dentelles, jupes longues. Sézane · Ba&sh · Free People · Antik Batik.",
    fabrics: ["lin", "coton broderie", "dentelle", "soie", "velours", "wax", "ikat", "denim usé"],
    iconicPieces: ["robe longue imprimée", "blouse brodée", "jupe plissée", "espadrilles", "sandales cuir", "chemise oversize", "kimono"],
    forbiddenPieces: ["costume strict", "sneakers tech", "cuir verni"],
    preferredColorTerms: ["terracotta", "ocre", "sauge", "crème", "indigo", "rose poudré", "moutarde"],
    avoidedColorTerms: ["noir total", "anthracite glacial"],
    colorBias: "earthy", saturation: "muted", silhouette: "fluid",
    context: ["brunch", "weekend", "voyage", "vernissage", "été"],
    mood: ["rêveur", "doux", "expressif", "naturel"],
  },

  // ── Avant-garde ──
  "avant-garde": {
    key: "avant-garde",
    label: "Avant-garde",
    adn: "Conceptuel · sculptural · créateur",
    manifesto: "Le vêtement comme idée. Asymétrie, déconstruction, palette graphite. Rick Owens · Maison Margiela · Comme des Garçons · Yohji.",
    fabrics: ["jersey lourd", "néoprène", "laine bouillie", "cuir, daim", "sergé technique"],
    iconicPieces: ["robe asymétrique", "veste déstructurée", "boots sculpturales", "pantalon ample", "manteau long noir", "sneakers Salomon"],
    forbiddenPieces: ["polo basique", "chinos beige", "loafers traditionnels"],
    preferredColorTerms: ["noir", "graphite", "ardoise", "ivoire", "écru", "carbone"],
    avoidedColorTerms: ["pastel", "rose poudré", "bordeaux traditionnel"],
    colorBias: "neutral", saturation: "muted", silhouette: "oversize",
    context: ["galerie", "soirée", "événement créatif", "studio"],
    mood: ["intellectuel", "radical", "graphique", "froid"],
  },

  // ── Preppy ──
  "preppy": {
    key: "preppy",
    label: "Preppy",
    adn: "Campus US · piqué · loafers",
    manifesto: "L'Ivy League sans ironie. Polo piqué, blazer marine, mocassins, jean droit. Lacoste · Ralph Lauren · Tommy Hilfiger.",
    fabrics: ["piqué", "oxford", "denim", "twill", "lambswool", "cuir lisse"],
    iconicPieces: ["polo piqué", "chemise oxford rayée", "blazer marine", "loafers", "jupe plissée", "chinos beige", "pull jacquard"],
    forbiddenPieces: ["sweat oversize", "sneakers tech", "robe bohème"],
    preferredColorTerms: ["marine", "blanc", "bordeaux", "crème", "rouge", "kaki", "beige"],
    avoidedColorTerms: ["néon", "fluo", "noir total"],
    colorBias: "cool", saturation: "saturated", silhouette: "fitted",
    context: ["campus", "diner", "bureau", "club"],
    mood: ["jovial", "classique", "frais", "iconique"],
  },

  // ── Sustainable (filtre, pas un style à proprement parler) ──
  "sustainable": {
    key: "sustainable",
    label: "Durable",
    adn: "Slow · matières nobles · seconde main",
    manifesto: "Acheter mieux, acheter moins. Veja · Patagonia · Reformation · Sézane · Stella McCartney · Vinted.",
    fabrics: ["lin", "coton bio", "laine recyclée", "tencel", "lyocell", "cuir tanné végétal"],
    iconicPieces: ["sneakers éco", "trench coton bio", "pull laine recyclée", "jean upcyclé"],
    forbiddenPieces: ["polyester fast fashion", "fourrure synthétique"],
    preferredColorTerms: ["écru", "naturel", "ivoire", "sauge", "terre"],
    avoidedColorTerms: [],
    colorBias: "earthy", saturation: "muted", silhouette: "any",
    context: ["partout"],
    mood: ["engagé", "responsable", "lent"],
  },

  // ── Second-hand (filtre) ──
  "second-hand": {
    key: "second-hand",
    label: "Seconde main",
    adn: "Vintage curé · histoire · patine",
    manifesto: "Chaque pièce a déjà vécu. Vinted · Vestiaire Collective · Depop · 1stDibs.",
    fabrics: ["all"],
    iconicPieces: ["vintage", "archive", "rare"],
    forbiddenPieces: [],
    preferredColorTerms: [],
    avoidedColorTerms: [],
    colorBias: "any", saturation: "any", silhouette: "any",
    context: ["partout"],
    mood: ["nostalgique", "unique", "intelligent"],
  },

  // ── Budget (filtre) ──
  "budget": {
    key: "budget",
    label: "Sous 100€",
    adn: "Accessible · basique · efficace",
    manifesto: "Le style sans dépenser. H&M · Uniqlo · Pull&Bear · Vinted.",
    fabrics: ["coton", "synthétique léger", "denim"],
    iconicPieces: ["basique", "tshirt blanc", "jean droit", "pull simple"],
    forbiddenPieces: [],
    preferredColorTerms: [],
    avoidedColorTerms: [],
    colorBias: "any", saturation: "any", silhouette: "any",
    context: ["partout"],
    mood: ["pratique", "accessible"],
  },
};

/** Liste plate des styles "réels" (sans les filtres techniques sustainable/secondhand/budget). */
export const realStyles: StyleProfile[] = [
  styleProfiles.minimal,
  styleProfiles["old-money"],
  styleProfiles.streetwear,
  styleProfiles["sport-chic"],
  styleProfiles.bohème,
  styleProfiles["avant-garde"],
  styleProfiles.preppy,
];
