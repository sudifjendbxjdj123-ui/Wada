"use client";
/**
 * /stylist — Refonte v4 (2026-05-27 mockup chat client-side).
 *
 * Brief : remplacer le flow LLM (/api/stylist) par un state machine
 * DÉTERMINISTE côté client. Plus rapide, plus prédictible, pas d'appel
 * réseau. Le styliste pose des questions à chips, l'utilisateur clique,
 * la tenue s'affiche.
 *
 * 2 voies au départ :
 *   1. ANCHOR (« J'ai déjà une pièce ») → demande la pièce, sa couleur,
 *      le style autour, l'occasion → recompose autour de cette ancre
 *   2. FULL  (« Composez-moi une tenue complète ») → genre, couleur,
 *      style, occasion → 5 pièces générées
 *
 * Après composition :
 *   - Affiche les 5 pièces avec SlotCard rich (marque + via Amazon + prix
 *     + bouton Acheter) — pattern unifié avec /ma-tenue
 *   - « Pourquoi ça marche » : explication courte selon la couleur
 *   - Chips d'ajustement : plus chaud / sans veste / décontracté /
 *     autre couleur / parfait
 *
 * Visuel mockup :
 *   - Header simple kicker + h1 Fredoka
 *   - Chat bubbles (bot crème à gauche / me bordeaux à droite)
 *   - Chips area séparée du chat (s'efface au clic)
 *   - Composer pill (input + bouton Envoyer)
 *   - Bouton « Recommencer » visible après composition
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { useSavedOutfits, type SavedOutfit } from "@/hooks/useSavedOutfits";
import { showToast } from "@/lib/toast";
import { amazonSearch } from "@/lib/amazonAffiliate";
import { dictionary, type DictionaryEntry } from "@/lib/data";
import { analyzeColor } from "@/lib/colorEngine";

/** Hook qui fetch un vrai produit MUJI pour ce slot+couleur via /api/products.
 *  Brief 2026-05-28 : aligne /stylist sur /ma-tenue → vraies photos MUJI
 *  dans le chat avec image / nom / prix réels + Acheter. Null en cas d'absence
 *  (la card retombe alors sur le swatch + lien Amazon générique). */
function useMujiForSlot(
  slot: string | null,
  colorHex: string | null,
  style: string | null,
  genre: string | null,
  seed: string | null,
  /* Brief 2026-05-26 « matching description ↔ produit » : type-keyword
     extrait du libellé LLM côté serveur. Si fourni, on l'envoie comme
     q= à /api/products → la recherche full-text restreint aux produits
     dont le nom contient ce mot. Plus de Pull retourné quand le LLM
     dit Chemise. */
  typeKeyword?: string | null,
) {
  const [product, setProduct] = useState<{
    nom: string;
    marque: string;
    image: string;
    prix: number;
    devise: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!slot || !colorHex) return;
    let cancelled = false;
    const params = new URLSearchParams({
      slot,
      merchant: "muji-france",
      color: colorHex,
      limit: "1",
    });
    if (style) params.set("style", style);
    /* Brief audit live 2026-05-28 : on normalise en lowercase parce que
       les chips du /stylist renvoient « Femme »/« Homme »/« Unisexe »
       (capitalisés) alors que l'API filtre en lowercase. Sans ça, un
       homme reçoit des jupes femme. */
    if (genre) params.set("genre", genre.toLowerCase());
    if (seed) params.set("seed", seed);
    /* Brief 2026-05-26 « matching description ↔ produit » : si on a
       extrait un type-keyword côté serveur (chemise, blazer, sneakers…),
       on le passe en q= → /api/products applique son filtre full-text
       AND sur les tokens, restreint aux produits dont le nom le contient. */
    if (typeKeyword) params.set("q", typeKeyword);

    fetch(`/api/products?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.products?.length) return;
        const p = data.products[0];
        /* Brief « Page Tenue maître » P0-2 (24/05) :
           priorité d'image hi-res :
             1. imageLocal — Blob mirroré (depuis le fix cron, en hi-res)
             2. largeImage — CDN MUJI ~1280px, proxy via /api/img
             3. image — aw_image_url ~200px, proxy /api/img (dernier recours) */
        const displayImage = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";
        setProduct({
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          image: displayImage,
          prix: p.prix,
          devise: p.devise,
          url: p.urlProduit,
        });
      })
      .catch(() => { /* silencieux — fallback Amazon */ });
    return () => { cancelled = true; };
  }, [slot, colorHex, style, genre, seed, typeKeyword]);

  return product;
}

/** Map role canonique (« Haut », « Bas »…) → slot API (« haut », « bas »…). */
function roleToApiSlot(role: string): string | null {
  const map: Record<string, string> = {
    Haut: "haut", Bas: "bas", Veste: "veste",
    Chaussures: "chaussures", Accent: "accent",
  };
  return map[role] || null;
}

/* ──────────────────────────────────────────────────────────────────────
   Design tokens — alignés sur le mockup
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', Arial, sans-serif",
};
const SOFT = "0 8px 36px rgba(30,30,30,.06)";

/* ──────────────────────────────────────────────────────────────────────
   Brief « Styliste IA — relier la composition aux 348 accords » (24/05).
   Avant ce patch, les slots support (haut/bas/chaussures/accent) avaient
   des hex en dur dans STYLES (écru / sable / cuir / brun) IDENTIQUES quelle
   que soit la couleur signature de l'utilisateur. Conséquence : les
   348 accords Sanzo Wada n'étaient JAMAIS utilisés sur /stylist, alors
   que c'est la promesse centrale de WADA.
   Fix : on dérive les couleurs des slots support d'un VRAI accord Wada
   qui contient (ou s'accorde avec) la couleur signature. On garde les
   TYPES de vêtements de STYLES, on remplace juste les hex.
   ────────────────────────────────────────────────────────────────────── */

/** Distance angulaire entre deux teintes (0-180). */
function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b);
  return d > 180 ? 360 - d : d;
}

/**
 * Choisit l'accord Sanzo Wada qui contient le mieux la couleur signature
 * et colle au style demandé.
 *
 * Stratégie :
 * - Si la signature est neutre (saturation basse / temperature neutral) :
 *   on score sur la clarté entre les neutres de chaque accord.
 * - Sinon : on score sur la proximité de teinte (hue) avec les couleurs
 *   saturées de l'accord.
 * - Bonus +0.3 si l'accord déclare ce style dans ses tags.
 */
function accordForColor(signatureHex: string, style: string | null): DictionaryEntry {
  const sig = analyzeColor(signatureHex);
  const styleKey = (style || "").toLowerCase().replace(/\s+/g, "-");
  let best = dictionary[0];
  let bestScore = -Infinity;
  for (const e of dictionary) {
    let colorScore = 0;
    for (const c of e.colors) {
      const m = analyzeColor(c.hex);
      if (sig.temperature === "neutral" || sig.saturationLevel === "low") {
        // signature neutre → on matche sur la clarté entre neutres
        if (m.saturationLevel === "low") {
          colorScore = Math.max(colorScore, 1 - Math.abs(m.lightness - sig.lightness));
        }
      } else if (m.saturation > 0.12) {
        // signature colorée → proximité de teinte
        colorScore = Math.max(colorScore, 1 - hueDist(m.hue, sig.hue) / 180);
      }
    }
    const styleScore = e.styles?.some((st) => {
      const k = st.toLowerCase().replace(/\s+/g, "-");
      return k.includes(styleKey) || (styleKey && styleKey.includes(k));
    }) ? 0.3 : 0;
    const score = colorScore + styleScore;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best;
}

/**
 * Répartit les couleurs d'un accord sur les slots support :
 *   - haut    = couleur la plus claire (base lumineuse)
 *   - bas     = couleur médiane (tonalité de jonction)
 *   - chauss  = couleur la plus sombre (ancrage)
 *   - accent  = couleur la plus chaude si présente, sinon la plus sombre
 *               (la touche qui réchauffe)
 *
 * Retourne null si l'accord est vide (cas garde-fou).
 */
function supportColorsFromAccord(accord: DictionaryEntry) {
  const cols = accord.colors.map((c) => ({ hex: c.hex, name: c.name, m: analyzeColor(c.hex) }));
  if (cols.length === 0) return null;
  const byLight = [...cols].sort((a, b) => b.m.lightness - a.m.lightness);
  const lightest = byLight[0];
  const darkest = byLight[byLight.length - 1];
  const mid = byLight[Math.floor(byLight.length / 2)];
  const warm = cols.find((c) => c.m.temperature === "warm") || darkest;
  return {
    haut:   { hex: lightest.hex, nom: lightest.name },
    bas:    { hex: mid.hex,      nom: mid.name },
    chauss: { hex: darkest.hex,  nom: darkest.name },
    accent: { hex: warm.hex,     nom: warm.name },
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Catalogue couleurs et styles (mockup figé)
   ──────────────────────────────────────────────────────────────────────
   Couleurs : 7 teintes signature, chacune avec hex + nom français.
   Styles : 4 registres, chacun défini par 5 slots (haut, bas, chauss,
   veste, accent) — chaque slot = [type, hex].
   Note : les hex de STYLES servent uniquement de FALLBACK pour
   `supportColorsFromAccord` (en cas d'accord vide). En usage normal,
   les couleurs viennent désormais d'un accord Wada (cf. helpers ci-dessus).
*/
const COULEURS: Record<string, string> = {
  "Bleu":        "#33586B",
  "Beige":       "#C7A06A",
  "Noir":        "#1E1E1E",
  "Marron":      "#6B4A33",
  "Blanc":       "#ECE4D6",
  "Vert olive":  "#7D8A4A",
  "Bordeaux":    "#6B3A32",
};

type SlotPair = [string, string]; // [type, hex]
type StyleSet = {
  haut: SlotPair; bas: SlotPair; chauss: SlotPair;
  veste: SlotPair; accent: SlotPair;
};
const STYLES: Record<string, StyleSet> = {
  "Minimal": {
    haut:   ["Tee col rond",   "#ECE4D6"],
    bas:    ["Pantalon droit", "#C9B79C"],
    chauss: ["Sneakers cuir",  "#E8E2D6"],
    veste:  ["Surchemise",     "#8E9A82"],
    accent: ["Tote en cuir",   "#6B4A33"],
  },
  "Classique": {
    haut:   ["Chemise oxford",  "#F0E9DB"],
    bas:    ["Chino",           "#C9B79C"],
    chauss: ["Derbies cuir",    "#5A4636"],
    veste:  ["Blazer",          "#33586B"],
    accent: ["Ceinture cuir",   "#6B4A33"],
  },
  "Old money": {
    haut:   ["Polo cachemire",       "#F0E9DB"],
    bas:    ["Pantalon à pinces",    "#CDBB9B"],
    chauss: ["Mocassins",            "#5A4636"],
    veste:  ["Blazer croisé",        "#33586B"],
    accent: ["Foulard",              "#6B3A32"],
  },
  "Décontracté": {
    haut:   ["Tee coton",       "#ECE4D6"],
    bas:    ["Chino souple",    "#C9B79C"],
    chauss: ["Sneakers",        "#E8E2D6"],
    veste:  ["Surchemise",      "#8E9A82"],
    accent: ["Casquette",       "#6B4A33"],
  },
};

/* ──────────────────────────────────────────────────────────────────────
   Brief « Styliste IA — accords Wada » §5 (24/05) — petites retouches
   à fort impact dans la machine à états.
   ────────────────────────────────────────────────────────────────────── */

/**
 * Occasions contextuelles au style choisi : plutôt qu'une liste figée
 * (Bureau / Sorties / Quotidien / Voyage), on propose ce qui colle au
 * registre — Streetwear ne demande pas « cérémonie », Old money pas
 * « concert ». Fallback générique si style inconnu.
 */
const OCCASIONS_PAR_STYLE: Record<string, string[]> = {
  "Streetwear":  ["Tous les jours", "Sortir entre amis", "Voyage", "Concert"],
  "Old money":   ["Bureau", "Déjeuner", "Réception", "Week-end"],
  "Classique":   ["Bureau", "Dîner", "Cérémonie", "Week-end"],
  "Décontracté": ["Tous les jours", "Brunch", "Voyage", "Balade"],
  "Minimal":     ["Bureau", "Dîner", "Galerie", "Tous les jours"],
};

/**
 * Sous-nuances par famille de couleur : quand l'utilisateur clique
 * « Bleu », on lui propose Marine / Pétrole / Clair avant de passer au
 * style — plus précis pour le choix d'accord (un marine ≠ un bleu clair
 * côté harmonie Wada). Les familles purement neutres (Noir, Blanc) et
 * les couleurs déjà spécifiques (Bordeaux) ne sont pas re-déclinées.
 */
const NUANCES_PAR_COULEUR: Record<string, Array<{ label: string; hex: string }>> = {
  "Bleu": [
    { label: "Marine",    hex: "#1F3A5F" },
    { label: "Pétrole",   hex: "#2E5C5C" },
    { label: "Bleu clair", hex: "#6B8FA6" },
  ],
  "Vert olive": [
    { label: "Olive",  hex: "#7D8A4A" },
    { label: "Forêt",  hex: "#2E4A30" },
    { label: "Sauge",  hex: "#9CAF88" },
  ],
  "Beige": [
    { label: "Sable",  hex: "#D9C9A8" },
    { label: "Crème",  hex: "#EFE7D6" },
    { label: "Camel",  hex: "#B8956A" },
  ],
  "Marron": [
    { label: "Tabac",     hex: "#8B5E3C" },
    { label: "Chocolat",  hex: "#4A3526" },
    { label: "Cognac",    hex: "#9A6038" },
  ],
};

const POURQUOI: Record<string, string> = {
  "Bleu":       "Le bleu est froid : on le réchauffe avec des neutres sable et un cuir brun, pour qu'il respire sans durcir.",
  "Beige":      "Le beige est doux : on lui donne du relief avec une touche sombre et une matière mate, sinon tout s'efface.",
  "Noir":       "Le noir appelle la chaleur — sable et cuir brun l'adoucissent, le bordeaux le réchauffe. Jamais noir sur noir.",
  "Marron":     "Le marron est terreux : on reste dans la même famille chaude et on éclaire avec de l'écru.",
  "Blanc":      "Le blanc est lumineux : on l'ancre avec un neutre plus profond et une matière, pour éviter l'effet clinique.",
  "Vert olive": "L'olive aime les neutres chauds (sable, cuir) et une pointe de bordeaux pour la profondeur.",
  "Bordeaux":   "Le bordeaux est riche : une seule pièce forte suffit, le reste en sourdine (beige, brun).",
};
const POURQUOI_DEFAULT =
  "On garde une seule couleur forte et on l'entoure de neutres chauds : c'est ce qui rend une tenue juste.";

/**
 * Brief §5 (24/05) — comme on accepte maintenant des nuances précises
 * (« Marine », « Pétrole »…), la table POURQUOI keyée par famille
 * (« Bleu ») ne matche plus. On fait un reverse lookup via
 * NUANCES_PAR_COULEUR pour retrouver la famille parent et son explication.
 */
function pourquoiFor(couleur: string | null): string {
  if (!couleur) return POURQUOI_DEFAULT;
  if (POURQUOI[couleur]) return POURQUOI[couleur];
  for (const [family, nuances] of Object.entries(NUANCES_PAR_COULEUR)) {
    if (nuances.some((n) => n.label === couleur)) {
      return POURQUOI[family] || POURQUOI_DEFAULT;
    }
  }
  return POURQUOI_DEFAULT;
}

/* ──────────────────────────────────────────────────────────────────────
   Types et bulles
   ────────────────────────────────────────────────────────────────────── */
type Mode = "anchor" | "full" | null;
type Role = "Haut" | "Bas" | "Chaussures" | "Veste" | "Accent";

interface OutfitPiece {
  /** Étiquette en haut de la card (« Proposé », « Signature », « Touche », « Votre pièce »). */
  badge: string;
  /** Rôle canonique de la pièce dans la silhouette. */
  role: Role;
  /** Type FR (« Chemise oxford », « Pantalon droit »…). */
  type: string;
  /** Couleur hex de la pièce. */
  hex: string;
  /** Nom de la couleur pour l'affichage et la search query. */
  couleurNom: string;
  /** True si c'est la pièce existante du client (« à vous ✓ »). */
  ancre: boolean;
  /** Brief 2026-05-26 « gender consistency » : genre du slot (femme/homme
   *  /unisexe). Vient du LLM via composed_outfit.slots[].genre. Passé à
   *  useMujiForSlot pour filtrer correctement les produits MUJI et éviter
   *  les mismatches « T-shirt homme + pantalon femme » dans la même tenue. */
  genre?: string;
  /** Brief 2026-05-26 « matching description ↔ produit » : mot-clé de type
   *  extrait du libellé LLM (« chemise », « blazer », « sneakers »…) côté
   *  serveur. Passé à /api/products comme q= → filtre full-text restreint
   *  aux produits dont le nom contient ce mot. Évite que « Chemise fluide
   *  beige » du LLM renvoie un Pull. */
  typeKeyword?: string;
}

/* Brief V3 (2026-05-26) — `transient` permet d'afficher un placeholder
   « Le styliste réfléchit… » pendant l'appel LLM, qu'on retire au moment
   où la vraie réponse arrive. Effet streaming sans implémenter de vrai
   streaming (qui demande du parsing JSON incrémental côté serveur). */
/* Brief 2026-05-26 « continue d'ameliorer » : nouveau bubble type "accord"
   pour rendre la palette Sanzo Wada du LLM comme une mini-carte cliquable.
   Pont éditorial direct entre la tenue composée et la page palette. */
type Bubble =
  | { who: "bot"; html: string; transient?: boolean }
  | { who: "me"; text: string }
  | { who: "outfit"; pieces: OutfitPiece[] }
  | { who: "accord"; ref: string; name: string; colors: Array<{ hex: string; name: string }>; nomTenue?: string };

interface State {
  mode: Mode;
  genre: string | null;
  piece: string | null;        // libellé de la pièce ancre (« Loro Piana », « Pull », …)
  anchorRole: Role | null;     // dans quel slot insérer la pièce ancre
  couleur: string | null;
  couleurHex: string | null;
  style: string | null;
  occasion: string | null;
  pieces: OutfitPiece[] | null;
  /* Brief « Styliste IA — accords Wada » (24/05) : on stocke l'accord
     calculé pour la composition courante afin de pouvoir l'afficher
     (« Accord No. 094 — Béton & Lin ») et le ré-afficher après un
     ajustement. Calculé dans `compose()`, propagé via setState. */
  accordNumber: string | null;
  accordName: string | null;
  /* Brief 2026-05-26 « ameliore la logique IA » :
     - avoid : couleurs / pièces refusées par l'user (persistant inter-sessions
       via localStorage wada-avoid) → le LLM ne les propose JAMAIS
     - recentPieces : 10 dernières pièces proposées (anti-répétition sur
       ajustements rapprochés) */
  avoid: { colors: string[]; pieces: string[] };
  recentPieces: string[];
}

function emptyState(): State {
  return {
    mode: null, genre: null, piece: null, anchorRole: null,
    couleur: null, couleurHex: null, style: null, occasion: null,
    pieces: null,
    accordNumber: null, accordName: null,
    avoid: { colors: [], pieces: [] },
    recentPieces: [],
  };
}

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */

/** Génère un lien d'achat Amazon affilié pour une pièce + couleur + genre. */
function buyLinkFor(p: OutfitPiece, genre: string | null): string {
  if (p.ancre) return "#"; // pas de lien pour l'ancre client
  const parts = [p.type, p.couleurNom?.toLowerCase(), genre?.toLowerCase()].filter(Boolean);
  return amazonSearch(parts.join(" "));
}

/** Map role → slot canonique de STYLES (haut/bas/chauss/veste/accent). */
function roleToSlotKey(role: Role): keyof StyleSet {
  switch (role) {
    case "Haut":        return "haut";
    case "Bas":         return "bas";
    case "Chaussures":  return "chauss";
    case "Veste":       return "veste";
    case "Accent":      return "accent";
  }
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function StylistPage() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [chips, setChips] = useState<{ label: string; primary?: boolean }[]>([]);
  const [state, setState] = useState<State>(emptyState());
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Brief 2026-05-26 « ameliore le encore » — historique conversationnel.
     Le LLM voit maintenant les tours précédents (« sans la veste » sait
     de quelle veste on parle, « plus chaud » sait quelle tenue ajuster).
     Format OpenAI chat completions : array de {role: user|assistant, content}.
     On limite à 8 derniers tours (cap token + pertinence). */
  const chatHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  function pushHistory(role: "user" | "assistant", content: string) {
    chatHistoryRef.current.push({ role, content });
    if (chatHistoryRef.current.length > 16) {
      chatHistoryRef.current = chatHistoryRef.current.slice(-16);
    }
  }

  /* Brief 2026-05-26 perf — AbortController : si l'user envoie un nouveau
     message alors que le précédent est encore en streaming, on annule
     l'ancien appel. Évite les race conditions où un delta tardif viendrait
     écraser la bulle de la NOUVELLE conversation. */
  const inFlightAbortRef = useRef<AbortController | null>(null);

  /* Brief 2026-05-26 « ameliore tout le reste possible » — save outfits.
     Hook qui persiste les tenues dans localStorage (wada-saved-outfits)
     + sync inter-onglets. La dernière tenue composée est gardée en ref
     pour que le chip « Garder cette tenue » sache quoi sauver. */
  const { save: saveOutfit } = useSavedOutfits();
  const lastComposedRef = useRef<Omit<SavedOutfit, "id" | "savedAt"> | null>(null);

  /* Scroll vers le bas à chaque nouvelle bulle */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [bubbles, chips]);

  /* Démarre la conversation au mount */
  useEffect(() => { start(); /* eslint-disable-next-line */ }, []);

  /* Brief 2026-05-26 « ameliore la logique IA » — hydrate l'avoid list
     depuis localStorage au mount. Les couleurs/pièces refusées par l'user
     persistent entre les sessions : si on a dit « je déteste le jaune »
     lundi, le LLM ne proposera pas de jaune mardi non plus.
     Cap à 20 entries par catégorie pour éviter l'inflation infinie. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wada-avoid");
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (stored && typeof stored === "object") {
        setState((s) => ({
          ...s,
          avoid: {
            colors: Array.isArray(stored.colors) ? stored.colors.slice(0, 20) : [],
            pieces: Array.isArray(stored.pieces) ? stored.pieces.slice(0, 20) : [],
          },
        }));
      }
    } catch { /* localStorage indispo (private mode etc.), on continue sans */ }
  }, []);

  /** Persiste l'avoid list dans localStorage à chaque update. */
  function persistAvoid(avoid: { colors: string[]; pieces: string[] }) {
    try {
      localStorage.setItem("wada-avoid", JSON.stringify(avoid));
    } catch { /* silent */ }
  }

  function addBot(html: string) {
    setBubbles((prev) => [...prev, { who: "bot", html }]);
  }
  function addMe(text: string) {
    setBubbles((prev) => [...prev, { who: "me", text }]);
  }
  function addOutfit(pieces: OutfitPiece[]) {
    setBubbles((prev) => [...prev, { who: "outfit", pieces }]);
  }
  function addAccord(ref: string, name: string, colors: Array<{ hex: string; name: string }>, nomTenue?: string) {
    setBubbles((prev) => [...prev, { who: "accord", ref, name, colors, nomTenue }]);
  }
  function botDelay(fn: () => void) {
    setTimeout(fn, 450);
  }

  /* ─── Étape 0 : reset + question d'ouverture ───
     Brief 2026-05-26 « continue d'ameliorer » : on remplace le message
     d'accueil vague (« On compose ensemble. Vous avez déjà une pièce
     ou vous partez de zéro ? ») par une invitation concrète + 5
     suggestions cliquables qui couvrent les cas typiques. L'user voit
     immédiatement ce qu'on peut lui demander, sans avoir à inventer
     la formulation. Une suggestion = un prompt direct envoyé au LLM. */
  function start() {
    setBubbles([]);
    setChips([]);
    setState(emptyState());
    setDone(false);
    chatHistoryRef.current = [];
    addBot("Dites-moi tout. Une occasion, une pièce, une humeur — je compose autour.");
    setChips([
      { label: "Bureau lundi" },
      { label: "J'ai un pull noir" },
      { label: "Soirée samedi" },
      { label: "Surprends-moi", primary: true },
      { label: "J'ai déjà une pièce" },
    ]);
    /* Hijack du prochain clic : les 4 suggestions concrètes envoient
       directement le texte au LLM. « J'ai déjà une pièce » garde
       l'ancien flow chip (utilisateurs qui préfèrent le guidage). */
    setNextChipHandler(() => (label: string) => {
      if (label === "J'ai déjà une pièce") {
        return onMode(label);
      }
      addMe(label);
      pushHistory("user", label);
      callLLM(label);
    });
  }

  /* ─── Étape 1 : choix mode ─── */
  function onMode(t: string) {
    addMe(t);
    setChips([]);
    if (/complet|zéro|zero|compos/i.test(t)) {
      setState((s) => ({ ...s, mode: "full" }));
      botDelay(() => {
        addBot("Parfait, je pars de zéro. Pour qui je compose ?");
        setChips([{ label: "Femme" }, { label: "Homme" }, { label: "Unisexe" }]);
      });
    } else {
      setState((s) => ({ ...s, mode: "anchor" }));
      botDelay(() => {
        addBot("Très bien. Dites-moi la pièce que vous voulez garder.");
        setChips([
          { label: "Mes Loro Piana" },
          { label: "Un pull noir" },
          { label: "Une chemise" },
          { label: "Autre…" },
        ]);
      });
    }
  }

  /* ─── Étape 2A (full) : genre ─── */
  function onGenre(t: string) {
    addMe(t);
    setChips([]);
    setState((s) => ({ ...s, genre: t }));
    botDelay(() => {
      addBot("Sur quelle couleur on construit ? Ce sera la teinte signature.");
      setChips(Object.keys(COULEURS).map((c) => ({ label: c })));
    });
  }

  /* ─── Étape 2B (anchor) : pièce ─── */
  function onPiece(t: string) {
    addMe(t);
    setChips([]);
    let piece = t, role: Role = "Haut";
    if (/loro|piana/i.test(t)) {
      piece = "Loro Piana"; role = "Chaussures";
    } else if (/pull/i.test(t)) {
      piece = "Pull"; role = "Haut";
    } else if (/chemise/i.test(t)) {
      piece = "Chemise"; role = "Haut";
    } else if (/chaussure|derby|basket|sneaker|mocassin/i.test(t)) {
      role = "Chaussures";
    } else if (/pantalon|chino|jean/i.test(t)) {
      role = "Bas";
    } else if (/veste|blazer|manteau/i.test(t)) {
      role = "Veste";
    } else if (/autre/i.test(t)) {
      piece = "votre pièce"; role = "Haut";
    }
    setState((s) => ({ ...s, piece, anchorRole: role }));
    botDelay(() => {
      const intro =
        piece === "Loro Piana"
          ? "Très beau choix — le luxe discret, le daim. De quelle couleur sont-elles ?"
          : "Notée. De quelle couleur est-elle ?";
      addBot(intro);
      setChips(Object.keys(COULEURS).map((c) => ({ label: c })));
    });
  }

  /* ─── Étape 3 : couleur ───
     Brief §5 (24/05) — si la couleur a des sous-nuances (Bleu, Vert olive,
     Beige, Marron), on demande la précision avant de passer au style ;
     un marine ne va pas dans le même accord qu'un bleu clair. Validation
     explicite dans la question suivante (« Du bordeaux, parfait — … »). */
  function onCouleur(t: string) {
    addMe(t);
    setChips([]);
    const nuances = NUANCES_PAR_COULEUR[t];
    if (nuances && nuances.length > 0) {
      // Pré-remplit avec la valeur générique de la famille en attendant
      // la précision (évite l'état null transitoire).
      setState((s) => ({ ...s, couleur: t, couleurHex: COULEURS[t] || "#888" }));
      botDelay(() => {
        addBot(`Du ${t.toLowerCase()} — quelle nuance ?`);
        setChips(nuances.map((n) => ({ label: n.label })));
        // Hijack le prochain clic pour traiter la nuance puis enchaîner.
        setNextChipHandler(() => (c: string) => {
          addMe(c);
          setChips([]);
          const picked = nuances.find((n) => n.label === c) || nuances[0];
          // On utilise le label nuancé comme `couleur` (« Marine ») et le hex précis.
          setState((s) => ({ ...s, couleur: picked.label, couleurHex: picked.hex }));
          botDelay(() => {
            addBot(`${picked.label}, parfait — quel style autour ?`);
            setChips(Object.keys(STYLES).map((k) => ({ label: k })));
          });
        });
      });
      return;
    }
    // Pas de nuances pour cette couleur — on enchaîne directement le style.
    setState((s) => ({ ...s, couleur: t, couleurHex: COULEURS[t] || "#888" }));
    botDelay(() => {
      addBot(`Du ${t.toLowerCase()}, parfait — quel style autour ?`);
      setChips(Object.keys(STYLES).map((c) => ({ label: c })));
    });
  }

  /* ─── Étape 4 : style ───
     Brief §5 (24/05) — occasions contextuelles au style (cf. carte
     OCCASIONS_PAR_STYLE) au lieu d'une liste générique. Streetwear
     ne demande plus « cérémonie », Old money ne demande plus « concert ». */
  function onStyle(t: string) {
    addMe(t);
    setChips([]);
    setState((s) => ({ ...s, style: t }));
    botDelay(() => {
      addBot(`${t} — et pour quelle occasion ?`);
      const occasions = OCCASIONS_PAR_STYLE[t]
        || ["Bureau", "Dîner", "Voyage", "Week-end"];
      setChips(occasions.map((c) => ({ label: c })));
    });
  }

  /* ─── Étape 5 : occasion → compose ─── */
  function onOccasion(t: string) {
    addMe(t);
    setChips([]);
    setState((s) => {
      const next = { ...s, occasion: t };
      // Compose immédiatement avec le state final (s'évite un useEffect)
      botDelay(() => compose(next));
      return next;
    });
  }

  /* ─── Compose la tenue ───
     Brief « Styliste IA — accords Wada » (24/05) : on calcule l'accord
     dérivé de la couleur signature et on l'affiche en chat. Les pièces
     viennent ensuite de buildFull/buildAnchor qui utilisent ce même accord
     (les helpers le re-calculent mais c'est pur, donc idempotent). */
  function compose(s: State) {
    let pieces: OutfitPiece[];
    const sigHex = s.couleurHex || COULEURS[s.couleur || "Beige"] || "#C7A06A";
    const accord = accordForColor(sigHex, s.style);
    if (s.mode === "full") {
      pieces = buildFull(s);
      addBot(
        `Voilà une tenue complète <b>${s.style?.toLowerCase()}</b> pour <b>${s.occasion?.toLowerCase()}</b> (${s.genre?.toLowerCase()}) : le ${s.couleur?.toLowerCase()} en signature, le reste sur l'accord <b>No. ${accord.number} — ${accord.name}</b>.`
      );
    } else {
      pieces = buildAnchor(s);
      const anchorName = s.piece === "Loro Piana" ? "Loro Piana" : s.piece?.toLowerCase();
      addBot(
        `Voilà : autour de vos/votre ${anchorName}, un look <b>${s.style?.toLowerCase()}</b> pour <b>${s.occasion?.toLowerCase()}</b> — accord <b>No. ${accord.number} — ${accord.name}</b>.`
      );
    }
    setState((prev) => ({
      ...prev,
      pieces,
      accordNumber: accord.number,
      accordName: accord.name,
    }));
    addOutfit(pieces);
    botDelay(() => {
      addBot(`<b>Pourquoi ça marche</b> — ${pourquoiFor(s.couleur)}`);
    });
    setTimeout(() => {
      addBot("Je peux l'ajuster — dites-moi.");
      setChips([
        { label: "Plus chaud" },
        { label: "Sans veste" },
        { label: "Plus décontracté" },
        { label: "Une autre couleur" },
        { label: "C'est parfait", primary: true },
      ]);
      setDone(true);
    }, 950);
  }

  /* ─── Composition mode FULL ───
     Brief « Styliste IA — accords Wada » (24/05) : on dérive les couleurs
     des slots support d'un VRAI accord Wada qui contient la couleur
     signature. On garde les types de vêtements de STYLES. Si l'accord
     est vide (cas garde-fou improbable), on retombe sur les hex figés. */
  function buildFull(s: State): OutfitPiece[] {
    const setStyles = STYLES[s.style || "Classique"];
    const sigHex = s.couleurHex || COULEURS[s.couleur || "Beige"] || "#C7A06A";
    const accord = accordForColor(sigHex, s.style);
    const sup = supportColorsFromAccord(accord);

    const pieces: OutfitPiece[] = [
      { badge: "Proposé",   role: "Haut",       type: setStyles.haut[0],   hex: sup?.haut.hex   ?? setStyles.haut[1],   couleurNom: sup?.haut.nom   ?? "écru",   ancre: false },
      { badge: "Proposé",   role: "Bas",        type: setStyles.bas[0],    hex: sup?.bas.hex    ?? setStyles.bas[1],    couleurNom: sup?.bas.nom    ?? "sable",  ancre: false },
      { badge: "Proposé",   role: "Chaussures", type: setStyles.chauss[0], hex: sup?.chauss.hex ?? setStyles.chauss[1], couleurNom: sup?.chauss.nom ?? "cuir",   ancre: false },
      { badge: "Signature", role: "Veste",      type: setStyles.veste[0],  hex: setStyles.veste[1],  couleurNom: "neutre", ancre: false },
      { badge: "Touche",    role: "Accent",     type: setStyles.accent[0], hex: sup?.accent.hex ?? setStyles.accent[1], couleurNom: sup?.accent.nom ?? "brun",   ancre: false },
    ];
    // La veste devient la pièce signature dans la couleur choisie
    const vesteIdx = pieces.findIndex((p) => p.role === "Veste");
    if (vesteIdx !== -1 && s.couleur && s.couleurHex) {
      pieces[vesteIdx] = {
        ...pieces[vesteIdx],
        type: `${pieces[vesteIdx].type} ${s.couleur.toLowerCase()}`,
        hex: s.couleurHex,
        couleurNom: s.couleur,
      };
    }
    return pieces;
  }

  /* ─── Composition mode ANCHOR ───
     Brief « Styliste IA — accords Wada » (24/05) : idem buildFull, on
     dérive les hex des slots non-ancre d'un vrai accord Wada qui contient
     la couleur de la pièce ancre. La pièce ancre garde sa couleur exacte.
     L'accord est choisi sur la couleur de la pièce ancre car c'est elle
     qui dicte l'harmonie. */
  function buildAnchor(s: State): OutfitPiece[] {
    const setStyles = STYLES[s.style || "Classique"];
    const sigHex = s.couleurHex || COULEURS[s.couleur || "Beige"] || "#C7A06A";
    const accord = accordForColor(sigHex, s.style);
    const sup = supportColorsFromAccord(accord);

    const anchorLabel =
      s.piece === "Loro Piana"
        ? `Loro Piana (${s.couleur?.toLowerCase()})`
        : `${s.piece ? s.piece.charAt(0).toUpperCase() + s.piece.slice(1) : "Pièce"} ${s.couleur?.toLowerCase()}`;
    // Base proposée selon le style + couleurs dérivées de l'accord Wada
    const base: Record<Role, OutfitPiece> = {
      Haut:       { badge: "Proposé", role: "Haut",       type: setStyles.haut[0],   hex: sup?.haut.hex   ?? setStyles.haut[1],   couleurNom: sup?.haut.nom   ?? "écru",   ancre: false },
      Bas:        { badge: "Proposé", role: "Bas",        type: setStyles.bas[0],    hex: sup?.bas.hex    ?? setStyles.bas[1],    couleurNom: sup?.bas.nom    ?? "sable",  ancre: false },
      Chaussures: { badge: "Proposé", role: "Chaussures", type: setStyles.chauss[0], hex: sup?.chauss.hex ?? setStyles.chauss[1], couleurNom: sup?.chauss.nom ?? "cuir",   ancre: false },
      Veste:      { badge: "Proposé", role: "Veste",      type: setStyles.veste[0],  hex: setStyles.veste[1],  couleurNom: "neutre", ancre: false },
      Accent:     { badge: "Touche",  role: "Accent",     type: setStyles.accent[0], hex: sup?.accent.hex ?? setStyles.accent[1], couleurNom: sup?.accent.nom ?? "brun",   ancre: false },
    };
    if (s.anchorRole && s.couleur && s.couleurHex) {
      base[s.anchorRole] = {
        badge: "Votre pièce",
        role: s.anchorRole,
        type: anchorLabel,
        hex: s.couleurHex,
        couleurNom: s.couleur,
        ancre: true,
      };
    }
    return [base.Haut, base.Bas, base.Chaussures, base.Veste, base.Accent];
  }

  /* ─── Ajustements après composition ─── */
  function onAdjust(t: string) {
    addMe(t);
    setChips([]);
    if (/parfait/i.test(t)) {
      botDelay(() => addBot("Très bien. Je l'ajoute à votre dressing ✓"));
      return;
    }
    if (/autre couleur/i.test(t)) {
      botDelay(() => {
        addBot("On change la teinte signature — laquelle ?");
        setChips(Object.keys(COULEURS).map((c) => ({ label: c })));
        // Hijack le handler — au prochain clic chip, on relance compose
        setNextChipHandler(() => (c: string) => {
          addMe(c);
          setChips([]);
          setState((prev) => {
            const next = { ...prev, couleur: c, couleurHex: COULEURS[c] || "#888" };
            botDelay(() => compose(next));
            return next;
          });
        });
      });
      return;
    }
    setState((prev) => {
      if (!prev.pieces) return prev;
      let next = [...prev.pieces];
      if (/chaud/i.test(t)) {
        next = applyHotter(next);
        addBot("Plus chaud : une terracotta et du brun.");
      } else if (/sans veste/i.test(t)) {
        next = next.filter((p) => p.role !== "Veste");
        addBot("Sans veste : on allège, plus épuré.");
      } else if (/décontract/i.test(t)) {
        next = applyCasual(next);
        addBot("Plus décontracté : tee, chino et sneakers, mêmes couleurs.");
      }
      addOutfit(next);
      botDelay(() => {
        setChips([
          { label: "Plus chaud" },
          { label: "Sans veste" },
          { label: "Plus décontracté" },
          { label: "Une autre couleur" },
          { label: "C'est parfait", primary: true },
        ]);
      });
      return { ...prev, pieces: next };
    });
  }

  function applyHotter(pieces: OutfitPiece[]): OutfitPiece[] {
    return pieces.map((p) => {
      if (p.role === "Veste" && !p.ancre) return { ...p, type: "Surveste terracotta", hex: "#B5613F", couleurNom: "terracotta" };
      if (p.role === "Accent" && !p.ancre) return { ...p, type: "Touche brun chaud", hex: "#8a5a3a", couleurNom: "brun" };
      return p;
    });
  }
  function applyCasual(pieces: OutfitPiece[]): OutfitPiece[] {
    return pieces.map((p) => {
      if (p.role === "Haut" && !p.ancre) return { ...p, type: "Tee coton", hex: "#ECE4D6", couleurNom: "écru" };
      if (p.role === "Bas" && !p.ancre) return { ...p, type: "Chino souple", hex: "#C9B79C", couleurNom: "sable" };
      if (p.role === "Chaussures" && !p.ancre) return { ...p, type: "Sneakers", hex: "#E8E2D6", couleurNom: "écru" };
      return p;
    });
  }

  /* ─── Routage du clic chip selon la phase ─── */
  const nextChipHandlerRef = useRef<((t: string) => void) | null>(null);
  function setNextChipHandler(getter: () => (t: string) => void) {
    nextChipHandlerRef.current = getter();
  }
  function onChip(t: string) {
    if (nextChipHandlerRef.current) {
      const fn = nextChipHandlerRef.current;
      nextChipHandlerRef.current = null;
      fn(t);
      return;
    }
    // Route selon l'état courant
    if (state.mode === null) return onMode(t);
    if (state.mode === "full" && state.genre === null) return onGenre(t);
    if (state.mode === "anchor" && state.piece === null) return onPiece(t);
    if (state.couleur === null) return onCouleur(t);
    if (state.style === null) return onStyle(t);
    if (state.occasion === null) return onOccasion(t);
    return onAdjust(t);
  }

  /* ─── Saisie libre ───
     Brief client 2026-05-26 verbatim : « L'assistant doit lire et
     comprendre le message (thème, occasion, humeur, pièce possédée,
     contraintes) et répondre pertinemment. Poser une question seulement
     si une info manque vraiment. Jamais un "de quelle couleur ?"
     automatique sur une demande déjà claire. »

     Avant : `send()` aiguillait sur des regex hardcodées (`onPieceFreeText`)
     qui répondait toujours « Notée. De quelle couleur est-elle ? » quel
     que soit le contenu — l'utilisateur tapait « soirée pirate », le bot
     ignorait le thème et demandait la couleur. Bug critique.

     Maintenant : TOUTE saisie libre passe par /api/stylist (LLM gpt-4o-mini
     + SYSTEM_PROMPT_V2 mis à jour). Le LLM renvoie soit `mode: "tenue"`
     (compose direct) soit `mode: "question"` (UNE seule question, options
     contextuelles). Le state machine à chips reste opérationnel pour les
     clics sur les chips initiaux. */
  function send() {
    const v = input.trim();
    if (!v) return;
    setInput("");
    addMe(v);
    pushHistory("user", v);
    callLLM(v);
  }

  /** Lit les préférences localStorage pour les envoyer au LLM (genre +
   *  style préféré + budget). Permet au styliste de personnaliser sans
   *  reposer la question (cf. brief : « ne demande JAMAIS le STYLE si
   *  déjà connu via le profil »). */
  function readUserPrefs(): {
    gender?: "femme" | "homme" | "unisexe" | null;
    style?: string;
    budget?: number;
    morpho?: string;
    size?: string;
  } {
    try {
      const prefs = JSON.parse(localStorage.getItem("wada-prefs") || "{}");
      const genderRaw = localStorage.getItem("wada-gender");
      const gender = (genderRaw === "femme" || genderRaw === "homme" || genderRaw === "unisexe")
        ? genderRaw
        : null;
      return {
        gender: gender || state.genre?.toLowerCase() as "femme" | "homme" | "unisexe" | null,
        style: state.style || prefs.style,
        budget: prefs.budget,
        morpho: prefs.morpho,
        size: prefs.size,
      };
    } catch {
      return {};
    }
  }

  /** Convertit un slot LLM ("haut"|"bas"|...) vers le Role frontend. */
  function slotToRole(slot: string): Role {
    const map: Record<string, Role> = {
      haut: "Haut", bas: "Bas", chaussures: "Chaussures",
      veste: "Veste", accent: "Accent",
    };
    return map[slot.toLowerCase()] || "Haut";
  }

  /** Extrait la valeur en cours du champ `reponse` depuis un JSON incomplet
   *  (en cours de streaming). Indispensable pour afficher le texte de la
   *  réponse mot par mot pendant que le LLM stream les chunks suivants.
   *
   *  Algo : trouve "reponse":, saute la guillemet ouvrante, accumule
   *  les caractères jusqu'à la guillemet fermante non-échappée. Gère les
   *  escapes JSON (\n, \", \\). Retourne null si le champ n'est pas
   *  encore commencé ou si JSON malformé. */
  function extractStreamingReponse(streamingText: string): string | null {
    const idx = streamingText.indexOf('"reponse":');
    if (idx === -1) return null;
    let i = idx + '"reponse":'.length;
    // Saute le whitespace
    while (i < streamingText.length && /\s/.test(streamingText[i])) i++;
    if (streamingText[i] !== '"') return null;
    i++; // past opening quote

    let result = "";
    while (i < streamingText.length) {
      const c = streamingText[i];
      if (c === '\\' && i + 1 < streamingText.length) {
        const next = streamingText[i + 1];
        if (next === 'n') result += '\n';
        else if (next === 't') result += '\t';
        else if (next === '"') result += '"';
        else if (next === '\\') result += '\\';
        else if (next === '/') result += '/';
        else result += next; // unicode escapes etc — best effort
        i += 2;
      } else if (c === '"') {
        // Guillemet fermante : champ terminé
        return result;
      } else {
        result += c;
        i++;
      }
    }
    // Pas encore de fermante → on retourne ce qu'on a (en cours)
    return result;
  }

  /** Met à jour la dernière bulle bot transient avec le texte de réponse
   *  en cours de streaming. Si pas de bulle transient, on en crée une.
   *  À la fin du streaming (complete event), clearTransient() la remplace
   *  par la version finale. */
  function updateStreamingText(text: string) {
    setBubbles((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.who === "bot" && last.transient) {
        // Remplace le contenu de la bulle transient (dots → texte streamé)
        return [
          ...prev.slice(0, -1),
          { who: "bot", html: text.replace(/\n/g, "<br/>"), transient: true },
        ];
      }
      return [...prev, { who: "bot", html: text.replace(/\n/g, "<br/>"), transient: true }];
    });
  }

  /** Appelle le LLM /api/stylist avec la saisie libre + l'état conversationnel
   *  accumulé. Route la réponse vers question (chips d'options) ou tenue
   *  (rendu outfit + chips d'ajustement). Fallback sur message générique
   *  en cas d'erreur réseau. */
  /** Retire toutes les bulles transient (« réfléchit… ») avant d'ajouter
   *  la vraie réponse. Évite que le placeholder reste affiché. */
  function clearTransient() {
    setBubbles((prev) => prev.filter((b) => !(b.who === "bot" && b.transient)));
  }

  /** Traitement du payload final (event "complete" SSE OU réponse JSON
   *  legacy). Identique dans les 2 cas — partagé entre le path stream
   *  et le path legacy. */
  function handleComplete(data: {
    collecte?: {
      piece?: string|null; couleur?: string|null; style?: string|null; occasion?: string|null;
      accord?: { ref?: string; nom?: string } | null;
      avoid?: { colors?: string[]; pieces?: string[] };
      recent_pieces?: string[];
    };
    mode?: "question" | "tenue";
    reponse?: string;
    options?: string[];
    composed_outfit?: {
      slots?: Array<{ slot: string; role: string; label: string; hex: string; colorName: string; genre?: string; typeKeyword?: string }>;
      palette?: { entry?: { number?: string; name?: string; colors?: Array<{ hex: string; name: string }> } };
    };
    pourquoi?: string;
    variation?: string;
    nom_tenue?: string;
    entities?: { styling_advice?: string };
  }) {
    /* Propage la collecte LLM dans le state local — incluant les nouveaux
       champs accord/avoid. Le LLM peut ajouter à avoid si l'user a dit
       « je déteste X » dans son dernier message ; on absorbe et on persiste. */
    if (data.collecte) {
      const newAvoid = data.collecte.avoid && (data.collecte.avoid.colors?.length || data.collecte.avoid.pieces?.length)
        ? {
            colors: Array.from(new Set([...(state.avoid.colors), ...(data.collecte.avoid.colors || [])])).slice(0, 20),
            pieces: Array.from(new Set([...(state.avoid.pieces), ...(data.collecte.avoid.pieces || [])])).slice(0, 20),
          }
        : state.avoid;
      if (newAvoid !== state.avoid) persistAvoid(newAvoid);

      setState((s) => ({
        ...s,
        piece: data.collecte!.piece ?? s.piece,
        couleur: data.collecte!.couleur ?? s.couleur,
        style: data.collecte!.style ?? s.style,
        occasion: data.collecte!.occasion ?? s.occasion,
        avoid: newAvoid,
      }));
    }

    /* Mode "question" : UNE question + chips d'options contextuelles */
    if (data.mode === "question" && data.reponse) {
      clearTransient();
      addBot(data.reponse);
      pushHistory("assistant", data.reponse);
      if (Array.isArray(data.options) && data.options.length) {
        setChips(data.options.map((o: string) => ({ label: o })));
      }
      return;
    }

    /* Mode "tenue" : compose à partir de composed_outfit serveur */
    const composed = data.composed_outfit;
    if (composed?.slots?.length) {
      /* Brief 2026-05-26 « gender consistency » : on récupère le genre
         dominant de la tenue. Priorité : 1. genre majoritaire des slots
         (LLM a posé), 2. state.genre (chip flow), 3. userPrefs.gender
         (localStorage). Sert de fallback pour les slots où le LLM a
         oublié de poser le genre. */
      const slotGenres = composed.slots.map((s) => s.genre).filter((g): g is string => !!g);
      const dominantGenre = slotGenres[0]
        || state.genre?.toLowerCase()
        || (typeof window !== "undefined" ? localStorage.getItem("wada-gender") : null)
        || null;

      const pieces: OutfitPiece[] = composed.slots.map((s) => ({
        badge: s.role === "owned" ? "Votre pièce" : s.role === "accent" ? "Touche" : "Proposé",
        role: slotToRole(s.slot),
        type: s.label,
        hex: s.hex,
        couleurNom: s.colorName,
        ancre: s.role === "owned",
        /* Genre par slot, avec fallback vers le dominant pour garantir
           la cohérence à travers toute la tenue. */
        genre: s.genre || dominantGenre || undefined,
        /* Type-keyword extrait par le serveur depuis le libellé LLM. */
        typeKeyword: s.typeKeyword || undefined,
      }));
      const reponse = data.reponse || data.entities?.styling_advice || "Voilà ce que je composerais.";
      const accordRef = composed.palette?.entry?.number || null;
      const accordName = composed.palette?.entry?.name || null;

      /* Brief 2026-05-26 « save outfits » : on stocke la tenue complète
         dans une ref pour que le chip « Garder cette tenue » puisse
         l'archiver dans localStorage sans passer par le state React. */
      lastComposedRef.current = {
        nomTenue: data.nom_tenue || reponse.split(".")[0].trim() || "Tenue",
        accordRef: accordRef || undefined,
        accordName: accordName || undefined,
        accordColors: (composed.palette?.entry?.colors as Array<{ hex: string; name: string }> | undefined) || [],
        pieces: pieces.map((p) => ({
          role: p.role,
          type: p.type,
          hex: p.hex,
          couleurNom: p.couleurNom,
          ancre: p.ancre,
          genre: p.genre,
        })),
        reponse: data.reponse,
        pourquoi: data.pourquoi,
      };

      clearTransient();
      /* Brief 2026-05-26 « continue d'ameliorer » : la bulle nom_tenue
         est maintenant un VRAI accord-card cliquable. Le user voit en
         un coup d'œil la palette Sanzo Wada qui ancre la tenue +
         peut cliquer pour aller sur /palette/[number]. Pont éditorial
         direct entre /stylist et le dictionnaire des accords. */
      const accordColorsForBubble = composed.palette?.entry?.colors;
      if (accordRef && accordName && accordColorsForBubble?.length) {
        addAccord(accordRef, accordName, accordColorsForBubble, data.nom_tenue || undefined);
      } else if (data.nom_tenue && typeof data.nom_tenue === "string") {
        /* Fallback : pas de palette détectée → bulle nom_tenue HTML simple. */
        addBot(`<div style="display:flex;flex-direction:column;gap:4px;padding:4px 0"><span style="font-family:'Inter',sans-serif;font-size:9px;letter-spacing:0.4em;text-transform:uppercase;color:#6B3A32;font-weight:600">La tenue</span><span style="font-family:'Fredoka',sans-serif;font-size:22px;font-weight:600;color:#1E1E1E;line-height:1.1;letter-spacing:-0.005em">${data.nom_tenue}</span></div>`);
      }
      addBot(reponse);
      addOutfit(pieces);
      /* Brief « ameliore la logique IA » : on push les types de pièces
         proposées dans recentPieces (capé à 10), pour l'anti-répétition
         au tour suivant. Le LLM verra "déjà proposé : chemise écru,
         pantalon brun, gilet cuir..." et variera. */
      const newPieceTypes = pieces.filter((p) => !p.ancre).map((p) => p.type);
      setState((s) => ({
        ...s,
        pieces,
        accordNumber: accordRef,
        accordName,
        recentPieces: [...newPieceTypes, ...s.recentPieces].slice(0, 10),
      }));

      const pourquoiText = data.pourquoi || pourquoiFor(state.couleur);
      const variationText = data.variation;

      const tenueSummary = pieces.map((p) => `${p.role.toLowerCase()}: ${p.type} (${p.couleurNom})`).join(" · ");
      pushHistory(
        "assistant",
        `${reponse} | TENUE: ${tenueSummary} | POURQUOI: ${pourquoiText}${variationText ? " | VARIATION: " + variationText : ""}`
      );

      const accordColors = composed.palette?.entry?.colors;
      const swatchesHtml = accordColors && accordColors.length > 0
        ? `<span style="display:inline-flex;gap:6px;margin-left:8px;vertical-align:middle">${accordColors.slice(0, 5).map((c) => `<span title="${c.name}" style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c.hex};border:1px solid rgba(30,30,30,0.15)"></span>`).join("")}</span>`
        : "";

      setTimeout(() => {
        addBot(`<b>Pourquoi ça marche</b> — ${pourquoiText}${swatchesHtml}`);
        if (variationText) {
          setTimeout(() => {
            addBot(`<b>Ou plus audacieux</b> — <i>${variationText}</i>`);
          }, 450);
        }
        setTimeout(() => {
          addBot("Je peux l'ajuster — dites-moi.");
          /* Brief 2026-05-26 « continue d'ameliorer » : ajout d'un chip
             « Recommencer » en fin de liste qui reset la conversation à
             zéro sans recharger la page. Utile quand l'utilisateur veut
             changer de scénario complet (« là c'était une soirée, je
             veux maintenant un look bureau »). */
          /* Brief 2026-05-26 « save outfits » : nouveau chip primary
             « Garder cette tenue » → archive dans localStorage + toast.
             Placé en tête car c'est l'action positive après validation.
             Si l'user veut ajuster, les autres chips restent dispo. */
          const adjustChips: { label: string; primary?: boolean }[] = [
            { label: "Garder cette tenue", primary: true },
            { label: "Plus chaud" },
            { label: "Sans veste" },
            { label: "Plus décontracté" },
            { label: "Une autre couleur" },
            { label: "Moins cher" },
            { label: "Recommencer" },
          ];
          if (variationText) {
            /* Variation prend la place du primary, garder reste secondaire */
            adjustChips[0] = { label: "Essayer la variation", primary: true };
            adjustChips.splice(1, 0, { label: "Garder cette tenue" });
          }
          setChips(adjustChips);
          setNextChipHandler(() => (label: string) => {
            if (label === "Garder cette tenue") {
              if (lastComposedRef.current) {
                saveOutfit(lastComposedRef.current);
                showToast("Tenue gardée — retrouvez-la dans vos favoris ✓");
              }
              return;
            }
            if (label === "Recommencer") {
              start();
              return;
            }
            if (label === "Essayer la variation" && variationText) {
              addMe("Essayer la variation");
              pushHistory("user", `Essaie cette variation : ${variationText}`);
              callLLM(`Essaie cette variation : ${variationText}`);
              return;
            }
            onAdjust(label);
          });
          setDone(true);
        }, variationText ? 950 : 650);
      }, 450);
      return;
    }

    /* Pas de tenue exploitable et pas de question : message générique */
    clearTransient();
    const fallback = data.reponse || data.entities?.styling_advice ||
      "J'ai bien noté. Vous pouvez préciser un peu — une occasion, une couleur, une pièce que vous avez déjà ?";
    addBot(fallback);
    pushHistory("assistant", fallback);
  }

  async function callLLM(query: string) {
    setChips([]);
    const userPrefs = readUserPrefs();
    /* Brief « ameliore la logique IA » : on envoie collecte enrichie au LLM :
       - accord en cours (gardée sur ajustements)
       - avoid colors/pieces (jamais reproposées)
       - recent_pieces (anti-répétition sur ajustements rapprochés) */
    const collecte = {
      piece: state.piece,
      couleur: state.couleur,
      style: state.style,
      occasion: state.occasion,
      accord: state.accordNumber
        ? { ref: state.accordNumber, nom: state.accordName || undefined }
        : null,
      avoid: state.avoid,
      recent_pieces: state.recentPieces,
    };

    /* Annule la requête précédente si l'user envoie un nouveau message
       avant la fin du stream précédent. */
    if (inFlightAbortRef.current) {
      inFlightAbortRef.current.abort();
    }
    const abortController = new AbortController();
    inFlightAbortRef.current = abortController;

    /* Effet « réfléchit » : 3 points qui pulsent. Reste affiché jusqu'à
       l'arrivée du PREMIER delta SSE, après quoi il sera REMPLACÉ par
       le texte streamé (via updateStreamingText). */
    setBubbles((prev) => [...prev, {
      who: "bot",
      html: "<span class=\"wada-thinking-dots\" aria-label=\"Le styliste réfléchit\"><span>•</span><span>•</span><span>•</span></span>",
      transient: true,
    }]);

    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userPrefs, collecte, history: chatHistoryRef.current }),
        signal: abortController.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      const isStream = contentType.includes("event-stream");

      if (!isStream || !res.body) {
        /* ─── Legacy path : pas de stream, ancien JSON direct ─── */
        const data = await res.json();
        handleComplete(data);
        return;
      }

      /* ─── Streaming SSE path ───────────────────────────────────────
         Boucle de lecture du ReadableStream + parsing des évènements
         SSE. Pour chaque delta on extrait le `reponse` field du JSON
         partiel et on remplace la bulle transient (dots → texte qui
         pousse). Sur complete on appelle handleComplete pour la suite
         (outfit, pourquoi, etc.). */
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      let accumulatedJson = "";
      let finalPayload: Parameters<typeof handleComplete>[0] | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() || "";

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "delta" && typeof data.content === "string") {
              accumulatedJson += data.content;
              const partialReponse = extractStreamingReponse(accumulatedJson);
              if (partialReponse) {
                updateStreamingText(partialReponse);
              }
            } else if (data.type === "complete") {
              finalPayload = data;
            } else if (data.type === "error") {
              throw new Error("stream-error");
            }
          } catch (parseErr) {
            // Évènement mal formé, on ignore (rare)
            console.warn("[stylist] SSE parse skip:", parseErr);
          }
        }
      }

      if (finalPayload) {
        handleComplete(finalPayload);
      } else {
        clearTransient();
        addBot("Petit souci technique de mon côté. Vous pouvez réessayer ?");
      }
    } catch (err) {
      // Annulation volontaire (user a envoyé un nouveau msg) → silent.
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[stylist] callLLM error:", err);
      clearTransient();
      addBot("Petit souci technique de mon côté. Vous pouvez réessayer ?");
    } finally {
      // Libère la référence si c'est bien CE controller qui était in-flight
      if (inFlightAbortRef.current === abortController) {
        inFlightAbortRef.current = null;
      }
    }
  }

  /* Legacy onPieceFreeText supprimé — la saisie libre passe désormais par
     callLLM() qui gère thèmes/occasions/pièces sans script rigide. */

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.beige,
        color: palette.ink,
        fontFamily: fonts.sans,
        lineHeight: 1.55,
      }}
    >
            <BackButton fallback="/atelier" />

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "34px 20px 60px" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
            color: palette.olive, fontWeight: 500, margin: 0,
          }}>
            Le styliste · WADA AI
          </p>
          <h1 style={{
            fontFamily: fonts.display, fontWeight: 700,
            fontSize: 30, marginTop: 6,
            color: palette.ink,
          }}>
            Composons votre tenue.
          </h1>
        </div>

        {/* CHAT — brief audit A1 : role="log" + aria-live="polite" pour
            que les lecteurs d'écran annoncent les nouveaux messages du bot
            au fur et à mesure. aria-atomic=false : on n'annonce QUE les
            additions, pas toute la conversation à chaque update. */}
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Conversation avec l'assistant styliste"
          style={{
          display: "flex", flexDirection: "column", gap: 12,
          minHeight: 200,
        }}>
          {bubbles.map((b, i) => {
            if (b.who === "outfit") {
              return <OutfitBubble key={i} pieces={b.pieces} genre={state.genre} style={state.style} />;
            }
            if (b.who === "accord") {
              return <AccordBubble key={i} accordRef={b.ref} accordName={b.name} colors={b.colors} nomTenue={b.nomTenue} />;
            }
            if (b.who === "me") {
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "82%",
                    padding: "13px 17px",
                    fontSize: 15, lineHeight: 1.5,
                    borderRadius: 18,
                    borderBottomRightRadius: 5,
                    background: palette.bordeaux,
                    color: "#FAF8F4",
                  }}
                >
                  {b.text}
                </div>
              );
            }
            return (
              <div
                key={i}
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "82%",
                  padding: "13px 17px",
                  fontSize: 15, lineHeight: 1.5,
                  borderRadius: 18,
                  borderBottomLeftRadius: 5,
                  background: palette.cream,
                  border: `1px solid ${palette.line}`,
                  color: palette.ink,
                }}
              >
                <div style={{
                  fontSize: 10, letterSpacing: "0.16em",
                  textTransform: "uppercase", color: palette.olive,
                  marginBottom: 4, fontWeight: 600,
                }}>
                  WADA
                </div>
                <div dangerouslySetInnerHTML={{ __html: b.html }} />
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* CHIPS AREA */}
        {chips.length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8,
            marginTop: 12,
          }}>
            {chips.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChip(c.label)}
                style={{
                  fontFamily: fonts.sans, fontSize: 14,
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${c.primary ? palette.bordeaux : palette.line}`,
                  background: c.primary ? palette.bordeaux : palette.cream,
                  color: c.primary ? "#FAF8F4" : palette.ink,
                  cursor: "pointer",
                  transition: "all .2s ease",
                }}
                onMouseEnter={(ev) => {
                  if (c.primary) {
                    ev.currentTarget.style.background = "#5a3029";
                  } else {
                    ev.currentTarget.style.background = "#fff";
                    ev.currentTarget.style.borderColor = palette.olive;
                  }
                }}
                onMouseLeave={(ev) => {
                  if (c.primary) {
                    ev.currentTarget.style.background = palette.bordeaux;
                  } else {
                    ev.currentTarget.style.background = palette.cream;
                    ev.currentTarget.style.borderColor = palette.line;
                  }
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* COMPOSER PILL */}
        <div style={{
          display: "flex", gap: 8, marginTop: 16,
          background: palette.cream,
          border: `1px solid ${palette.line}`,
          borderRadius: 999,
          padding: "6px 6px 6px 18px",
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Décrivez ce que vous avez, ou ce que vous cherchez…"
            style={{
              flex: 1, border: "none", background: "transparent",
              /* Brief audit M2 : 16px évite le zoom iOS au focus.
                 A2 : outline:none retiré ; le focus ring global a11y joue
                 (cf. globals.css :focus-visible). */
              fontFamily: fonts.sans, fontSize: 16, color: palette.ink,
            }}
          />
          <button
            type="button"
            onClick={send}
            style={{
              fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
              background: palette.ink, color: palette.cream,
              border: "none", borderRadius: 999,
              padding: "10px 18px", cursor: "pointer",
              fontFamily: fonts.sans, fontWeight: 600,
            }}
          >
            Envoyer
          </button>
        </div>

        {/* RECOMMENCER */}
        {done && (
          <button
            type="button"
            onClick={start}
            style={{
              marginTop: 14,
              fontSize: 13, color: palette.bordeaux,
              background: "none", border: "none",
              cursor: "pointer", textDecoration: "underline",
              fontFamily: fonts.sans,
            }}
          >
            ↺ Recommencer
          </button>
        )}
      </div>

          </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   OutfitBubble — affiche la tenue composée dans une bulle bot étendue.
   Réutilise le pattern SlotCard (marque + via Amazon + prix + Acheter)
   pour cohérence avec /ma-tenue.
   ══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════════
   AccordBubble — carte cliquable montrant l'accord Sanzo Wada de la
   tenue + nom de tenue en titre. Pont vers /palette/[number].
   Brief 2026-05-26 « continue d'ameliorer » : connection éditoriale
   directe entre la tenue composée et la page palette source.
   ══════════════════════════════════════════════════════════════════════ */
function AccordBubble({
  accordRef, accordName, colors, nomTenue,
}: {
  accordRef: string;
  accordName: string;
  colors: Array<{ hex: string; name: string }>;
  nomTenue?: string;
}) {
  return (
    <Link
      href={`/palette/${accordRef}`}
      style={{
        alignSelf: "stretch",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        padding: "18px 20px",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.transform = "translateY(-2px)";
        ev.currentTarget.style.boxShadow = "0 12px 32px rgba(30,30,30,.10)";
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.transform = "translateY(0)";
        ev.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Header : kicker LA TENUE + nom_tenue Fredoka */}
      {nomTenue && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
          <span style={{
            fontFamily: fonts.sans, fontSize: 9, letterSpacing: "0.4em",
            textTransform: "uppercase", color: palette.bordeaux, fontWeight: 600,
          }}>
            La tenue
          </span>
          <span style={{
            fontFamily: fonts.display, fontSize: 22, fontWeight: 600,
            color: palette.ink, lineHeight: 1.1, letterSpacing: "-0.005em",
          }}>
            {nomTenue}
          </span>
        </div>
      )}

      {/* Mini palette : bandes pleines des couleurs de l'accord */}
      <div style={{
        display: "flex", height: 48, borderRadius: 10, overflow: "hidden",
        border: `1px solid ${palette.line}`,
      }}>
        {colors.slice(0, 5).map((c) => (
          <span
            key={c.hex}
            title={`${c.name} · ${c.hex}`}
            style={{ flex: 1, background: c.hex }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Footer : ref accord + indicateur clic */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 12, gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <span style={{
            fontFamily: fonts.sans, fontSize: 9, letterSpacing: "0.32em",
            textTransform: "uppercase", color: palette.inkSoft, fontWeight: 600,
          }}>
            Sanzo Wada · No. {accordRef}
          </span>
          <div style={{
            fontFamily: fonts.display, fontSize: 15, fontWeight: 600,
            color: palette.ink, marginTop: 2, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {accordName}
          </div>
        </div>
        <span style={{
          fontSize: 11, color: palette.bordeaux, fontWeight: 600,
          letterSpacing: "0.04em", whiteSpace: "nowrap",
        }}>
          Voir l&apos;accord →
        </span>
      </div>
    </Link>
  );
}

function OutfitBubble({ pieces, genre, style }: { pieces: OutfitPiece[]; genre: string | null; style: string | null }) {
  return (
    <div
      style={{
        alignSelf: "stretch",
        maxWidth: "100%",
        padding: "16px 18px",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        borderBottomLeftRadius: 5,
        boxShadow: SOFT,
      }}
    >
      <p style={{
        fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: palette.olive,
        marginBottom: 10, fontWeight: 600,
      }}>
        La tenue
      </p>
      <div
        className="wada-stylist-outfit"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {pieces.map((p, i) => (
          <PieceCard
            key={i}
            piece={p}
            amzUrl={p.ancre ? undefined : buyLinkFor(p, genre)}
            style={style}
            genre={genre}
          />
        ))}
      </div>
      {/* Strip palette en bas */}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {pieces.map((p, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              flex: 1, height: 24, borderRadius: 6,
              background: p.hex,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @media (max-width: 400px) {
          :global(.wada-stylist-outfit) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   PieceCard — pattern marque + Amazon "a" + prix + Acheter (idem /ma-tenue)
   ────────────────────────────────────────────────────────────────────── */
function PieceCard({
  piece, amzUrl, style, genre,
}: {
  piece: OutfitPiece;
  amzUrl?: string;
  style?: string | null;
  genre?: string | null;
}) {
  /* Brief 2026-05-28 : on tente un vrai produit MUJI matchant slot +
     couleur précise (piece.hex) + style + genre. Si trouvé → vraie photo
     + nom MUJI + prix réel + Acheter sur MUJI. Sinon → swatch couleur +
     Amazon générique (placeholder honnête). */
  /* Brief 2026-05-28 (variété) : seed unique par (couleur+style+role)
     pour que deux tenues stylist différentes ne donnent pas les mêmes
     produits MUJI. Stable au reload, varié entre tenues. */
  /* Brief 2026-05-26 « gender consistency » : on prend d'abord le genre
     POSÉ PAR LE LLM sur le slot lui-même (piece.genre), puis fallback
     sur le genre passé en prop (state.genre du chat). Avant : on ne
     prenait QUE le prop → si state.genre était null (free-text user),
     les produits MUJI leakaient sur les 2 genres. */
  const effectiveGenre = piece.genre || genre || null;
  const seed = piece.ancre ? null : `${piece.hex}-${piece.role}-${style || ""}-${effectiveGenre || ""}-${piece.typeKeyword || ""}`;
  const mujiProduct = useMujiForSlot(
    piece.ancre ? null : roleToApiSlot(piece.role),
    piece.ancre ? null : piece.hex,
    style || null,
    effectiveGenre,
    seed,
    /* Brief « matching description ↔ produit » : on passe le type-keyword
       extrait par le serveur. Le seed inclut maintenant le keyword pour
       que 2 ajustements avec types différents (chemise → pull) donnent
       des produits différents au même slot. */
    piece.typeKeyword || null,
  );

  return (
    <div
      style={{
        background: palette.cream,
        border: piece.ancre ? `1.5px solid ${palette.bordeaux}` : `1px solid ${palette.line}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: SOFT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* JSON-LD Product schema — idem /ma-tenue (brief P4.19). */}
      {mujiProduct && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: mujiProduct.nom,
              image: mujiProduct.image,
              description: `${piece.role} ${piece.couleurNom} — ${mujiProduct.marque}`,
              brand: { "@type": "Brand", name: mujiProduct.marque },
              category: piece.role,
              color: piece.couleurNom,
              offers: {
                "@type": "Offer",
                price: mujiProduct.prix,
                priceCurrency: mujiProduct.devise,
                availability: "https://schema.org/InStock",
                url: mujiProduct.url,
              },
            }),
          }}
        />
      )}

      {/* Visuel top — photo MUJI réelle si trouvée, sinon swatch couleur.
          Brief « Page Tenue maître » P0-2 + P2-5 (24/05) :
          - objectFit: cover edge-to-edge (était contain + padding 14 = trous)
          - objectPosition: center 20% pour cadrer le buste du mannequin
          - source = imageLocal (Blob hi-res depuis P0-2 fix mirror) →
            largeImage proxifié /api/img si pas de mirror local → image
            (200px) en dernier recours. Aligné sur ma-tenue/PieceCard. */}
      {mujiProduct ? (
        <div
          aria-hidden
          style={{
            aspectRatio: "4 / 5",
            background: "#FBF9F5",
            overflow: "hidden",
            borderBottom: `1px solid ${palette.line}`,
          }}
        >
          <img
            src={mujiProduct.image}
            alt={mujiProduct.nom}
            loading="lazy"
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 20%",
              display: "block",
            }}
          />
        </div>
      ) : (
        /* Brief finition (24/05) §2 — chargement : avant on rendait
           juste un block plein de la teinte (height:96). Maintenant on
           garde le même aspect-ratio 4/5 que la version avec produit et
           on superpose un overlay shimmer (.wada-skeleton défini dans
           globals.css) pour signaler le chargement actif sans saut de
           layout quand le produit MUJI arrive. */
        <div
          aria-hidden
          className="wada-skeleton"
          style={{
            aspectRatio: "4 / 5",
            background: piece.hex,
            opacity: 0.85,
            borderBottom: `1px solid ${palette.line}`,
          }}
        />
      )}

      <div style={{ padding: "11px 13px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{
          fontSize: 9, letterSpacing: "0.18em",
          textTransform: "uppercase", margin: 0, fontWeight: 700,
          color: piece.ancre ? palette.bordeaux : palette.olive,
        }}>
          {piece.badge} <span style={{ color: palette.inkSoft, fontWeight: 500 }}>· {piece.role}</span>
        </p>
        <p
          style={{
            fontFamily: fonts.display, fontWeight: 600,
            fontSize: 14, margin: "3px 0 0",
            lineHeight: 1.2, color: palette.ink,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "calc(1.2em * 2)",
          }}
        >
          {mujiProduct ? mujiProduct.nom : piece.type}
        </p>

        <div style={{ marginTop: "auto", paddingTop: 10 }}>
          {piece.ancre ? (
            <p style={{
              fontSize: 12, color: palette.inkSoft,
              textAlign: "center", margin: 0,
              fontStyle: "italic",
            }}>
              à vous ✓
            </p>
          ) : mujiProduct ? (
            /* Bloc MUJI réel : marque + via Awin + prix réel + Acheter MUJI */
            <div style={{
              background: "rgba(255,255,255,0.65)",
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}>
              <p style={{
                fontFamily: fonts.sans, fontSize: 15, fontWeight: 700,
                color: palette.ink, margin: 0, lineHeight: 1.1,
              }}>
                {mujiProduct.marque}
              </p>
              <span style={{
                display: "inline-block", marginTop: 4,
                fontSize: 11, color: palette.inkSoft,
                fontStyle: "italic", fontFamily: fonts.sans,
              }}>
                via Awin · MUJI partenaire
              </span>
              <p style={{
                fontFamily: fonts.sans, fontSize: 14, fontWeight: 700,
                color: palette.bordeaux, margin: "6px 0 0",
              }}>
                {mujiProduct.prix.toFixed(2)} {mujiProduct.devise === "EUR" ? "€" : mujiProduct.devise}
              </p>
              <a
                href={mujiProduct.url}
                target="_blank"
                rel="noopener nofollow sponsored"
                style={{
                  display: "block", marginTop: 8,
                  textAlign: "center",
                  fontFamily: fonts.sans,
                  fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                  background: palette.ink, color: palette.cream,
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                Acheter sur MUJI →
              </a>
            </div>
          ) : amzUrl ? (
            /* Fallback Amazon générique (placeholder honnête tant qu'il
               n'y a pas de produit MUJI matchant). */
            <div style={{
              background: "rgba(255,255,255,0.65)",
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}>
              <p style={{
                fontFamily: fonts.sans, fontSize: 15, fontWeight: 700,
                color: palette.ink, margin: 0, lineHeight: 1.1,
              }}>
                Amazon
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                marginTop: 4,
              }}>
                <span
                  aria-label="via Amazon"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 14, height: 14, borderRadius: 3,
                    background: "#FF9900", color: "#1E1E1E",
                    fontFamily: fonts.sans, fontWeight: 800,
                    fontSize: 9, letterSpacing: 0, lineHeight: 1,
                  }}
                >
                  a
                </span>
                <span style={{
                  fontSize: 11, color: palette.inkSoft,
                  fontStyle: "italic", fontFamily: fonts.sans,
                }}>
                  Recherche multi-marques
                </span>
              </div>
              <p style={{
                fontFamily: fonts.sans, fontSize: 14, fontWeight: 700,
                color: palette.bordeaux, margin: "8px 0 0",
              }}>
                ~55 €
              </p>
              <a
                href={amzUrl}
                target="_blank"
                rel="noopener nofollow sponsored"
                style={{
                  display: "block", marginTop: 8,
                  textAlign: "center",
                  fontFamily: fonts.sans,
                  fontSize: 12, fontWeight: 600,
                  textDecoration: "none",
                  background: palette.ink, color: palette.cream,
                  borderRadius: 999,
                  padding: "8px 12px",
                }}
              >
                Acheter →
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
