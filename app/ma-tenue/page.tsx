"use client";
/**
 * /ma-tenue — Page "Ma tenue, faite pour moi"
 *
 * Flux : le client remplit son profil sur le panneau PersonalizationPanel
 * (style / occasion / coupe / budget / silhouette / taille), clique
 * "Découvrir la collection" → atterrit ici.
 *
 * Cette page ne montre PAS un catalogue. Elle propose UNE tenue complète
 * (5 pièces) directement, sélectionnée pour matcher le profil. Chaque
 * pièce a une photo + le top 3 marchands en accès direct (1 clic → site
 * marchand avec la pièce préfiltrée).
 *
 * Si le client n'aime pas la tenue proposée → bouton "Voir une autre
 * tenue" qui cycle vers la palette suivante du score.
 */
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  dictionary, shopOptionsAffiliated, filterAndRankBrandsByProfile,
  type DictionaryEntry, type ShopLink, type WadaProfile,
} from "@/lib/data";
import { smartQuery, paletteGender } from "@/lib/utils";
import {
  findBestPalettesWithFallback, type UserIntent,
} from "@/lib/colorEngine";
import {
  generateFashionOutput, type FashionOutput, type ClientProfile,
} from "@/lib/fashionPromptEngine";
import {
  composeOutfitFromProfile, validateOutfit,
  type RegistreOutfit, type RegistreSlot,
} from "@/lib/registreEngine";
import { merchantsForPiece } from "@/lib/merchantsForPiece";
import {
  ink, paper, subtle, border, mojo, seal, cardBg,
  textSecondary, fontHeading, fontBody, fontLabel,
  cardRadius, sectionLabel,
} from "@/lib/styles";
import ExternalLink from "@/components/ExternalLink";
import Reveal from "@/components/Reveal";
/* Brief « appli efficace » §6 (2026-05-29) : repère « Ensuite : … ». */
import NextStepHint from "@/components/NextStepHint";

/* Mapping piece-slot → fichier image flat-lay dans /public/hero/items/.
   Le client voit une vraie photo, pas un SVG dessin. */
function photoForPiece(piece: string, gender: string | null): string {
  const g = gender === "homme" ? "homme" : "femme";
  switch (piece) {
    case "Top":
    case "Shirt":  return `/hero/items/haut-${g}.jpg`;
    case "Bottom": return `/hero/items/bas-${g}.jpg`;
    case "Outer":  return `/hero/items/veste-${g}.jpg`;
    case "Shoes":  return `/hero/items/chaussures-${g}.jpg`;
    case "Accent":
    default:       return `/hero/items/accent-${g}.jpg`;
  }
}

/* Lecture du profil sauvegardé (cf. PersonalizationPanel). */
type WadaPrefs = {
  gender: "femme" | "homme" | "unisexe" | null;
  style: string;
  budget: number;
  morpho: string;
  size: string;
  intensity: number;
  fit: string;
  occasion_focus: string;
};

const DEFAULT_PREFS: WadaPrefs = {
  gender: null, style: "", budget: 1, morpho: "", size: "",
  intensity: 0.5, fit: "", occasion_focus: "",
};

const PIECE_LABELS: Record<string, string> = {
  // Anciennes clés dictionnaire (laissées pour rétro-compat)
  Top: "Haut", Shirt: "Chemise", Outer: "Veste",
  Bottom: "Bas", Shoes: "Chaussures", Accent: "Accent",
  // Nouvelles clés registreEngine (refonte 2026-05-22) — slots FR lowercase
  haut: "Haut", bas: "Bas", veste: "Veste",
  chaussures: "Chaussures", accent: "Accent",
};

/* Map occasion WADA → saison/contexte UserIntent.
   Un peu approximatif mais ça aiguille le scoring. */
function occasionToContext(occ: string): Partial<UserIntent> {
  switch (occ) {
    case "bureau":     return { occasion: "Bureau" };
    case "quotidien":  return { occasion: "Quotidien" };
    case "sorties":    return { occasion: "Soirée" };
    case "voyage":     return { occasion: "Voyage" };
    default:           return {};
  }
}

/* Tabs variations (Safe / Audacieuse / Accessible) retirés — styles
   tabActiveStyle/tabIdleStyle supprimés avec (user 2026-06-07). */

/**
 * Wrapper de page — Suspense obligatoire autour de useSearchParams pour
 * que Next.js puisse prerender la page statique avec un fallback.
 */
export default function MaTenuePage() {
  return (
    <Suspense fallback={<MaTenueLoader />}>
      <MaTenueContent />
    </Suspense>
  );
}

/* Couleurs de repli pour le loader quand la palette n'est pas encore connue
   (cas du fallback Suspense de useSearchParams). Gamme chaude WADA. */
const LOADER_FALLBACK_COLORS = ["#E8C8A0", "#A8B29A", "#C9A06A", "#6B3A32", "#7A8B5A"];

/**
 * Écran de chargement /ma-tenue — refonte 2026-06-07 (design).
 * Avant : un simple « On vous prépare ça… » centré, plat. Maintenant :
 * un loader éditorial WADA — rangée de swatches couleur qui « respirent »
 * en vague décalée (la signature de la marque, c'est la couleur). Si la
 * palette est déjà connue (entry), on anime SES couleurs ; sinon une gamme
 * chaude de repli. Respecte prefers-reduced-motion.
 */
function OutfitLoadingState({ colors }: { colors?: string[] }) {
  const swatches = (colors && colors.length ? colors : LOADER_FALLBACK_COLORS).slice(0, 5);
  return (
    <main style={{
      minHeight: "100vh", background: paper, color: ink,
      fontFamily: fontBody, display: "flex", flexDirection: "column",
    }}>
      {/* Bouton retour (brief audit 2026-05-28 §5 : toujours un retour
          visible même pendant le chargement). */}
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 5% 0" }}>
        <Link
          href="/palettes"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: ink, textDecoration: "none",
            fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "40px 5% 120px",
      }}>
        <p style={{ ...sectionLabel, color: mojo, marginBottom: 18 }}>
          Composition de votre tenue
        </p>
        <h1 style={{
          fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(30px, 5vw, 48px)", margin: 0, letterSpacing: "-0.01em",
        }}>
          On vous prépare ça…
        </h1>
        <p style={{ marginTop: 14, color: textSecondary, maxWidth: "42ch", lineHeight: 1.6 }}>
          WADA croise vos préférences avec les 348 palettes du dictionnaire.
        </p>

        {/* Swatches animés — la couleur qui « respire ». */}
        <div style={{ display: "flex", gap: 12, marginTop: 34 }} aria-hidden>
          {swatches.map((hex, i) => (
            <span
              key={`${hex}-${i}`}
              className="wada-loader-swatch"
              style={{
                width: 44, height: 56, borderRadius: 12, background: hex,
                boxShadow: "inset 0 0 0 1px rgba(30,30,30,.08), 0 8px 20px -12px rgba(30,30,30,.5)",
                animationDelay: `${i * 0.13}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes wada-loader-pulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50%      { opacity: 1;   transform: translateY(-8px); }
        }
        .wada-loader-swatch {
          animation: wada-loader-pulse 1.4s ease-in-out infinite;
          will-change: opacity, transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .wada-loader-swatch { animation: none; opacity: 0.85; }
        }
      `}</style>
    </main>
  );
}

/** Loader minimal pendant l'hydratation de useSearchParams (~10ms). */
function MaTenueLoader() {
  return <OutfitLoadingState />;
}

/**
 * État « palette introuvable » (design 2026-06-07).
 * Avant : une palette demandée par ?palette=<n> mais inexistante retombait
 * SILENCIEUSEMENT sur une palette matchée par profil (« Bibliothèque »…) —
 * trompeur (le client croit voir la tenue de la palette demandée). Maintenant
 * on affiche un message honnête + un chemin pour repartir (jamais bloqué).
 */
function PaletteNotFound({ number }: { number: string }) {
  return (
    <main style={{
      minHeight: "100vh", background: paper, color: ink,
      fontFamily: fontBody, display: "flex", flexDirection: "column",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 5% 0" }}>
        <Link
          href="/palettes"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: ink, textDecoration: "none",
            fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "40px 5% 120px",
      }}>
        <p style={{ ...sectionLabel, color: mojo, marginBottom: 18 }}>
          Palette introuvable
        </p>
        <h1 style={{
          fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
          fontSize: "clamp(30px, 5vw, 48px)", margin: 0, letterSpacing: "-0.01em",
        }}>
          Cette palette n’existe pas
        </h1>
        <p style={{ marginTop: 14, color: textSecondary, maxWidth: "42ch", lineHeight: 1.6 }}>
          La palette N°&nbsp;{number} n’est pas dans le dictionnaire WADA.
          Parcourez les 348 accords pour en choisir une.
        </p>
        <Link
          href="/palettes"
          style={{
            marginTop: 28,
            display: "inline-block",
            fontFamily: fontLabel, fontSize: 14, fontWeight: 600,
            textDecoration: "none",
            background: "#6B3A32", color: "#FAF8F4",
            borderRadius: 999, padding: "13px 26px",
          }}
        >
          Voir toutes les palettes →
        </Link>
      </div>
    </main>
  );
}

function MaTenueContent() {
  const searchParams = useSearchParams();
  // Palette imposée via URL param (?palette=037) — quand le client arrive
  // depuis une page /palette/[number], on respecte SON choix au lieu de
  // scorer une autre palette via le profil.
  const requestedPaletteNumber = searchParams.get("palette");
  // Overrides « variantes de look » (brief 2026-05-27 §1) : la page palette
  // envoie ?style=Classique&occasion=quotidien pour les 3 variantes. Ces
  // params overrident les prefs localStorage pour cette navigation, sans
  // les écraser durablement.
  const overrideStyle = searchParams.get("style");
  const overrideOccasion = searchParams.get("occasion");

  const [prefs, setPrefs] = useState<WadaPrefs>(DEFAULT_PREFS);
  const [matchIndex, setMatchIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  /* Fix 2026-05-31 (user screenshot « ~275€ » alors que somme = 2414€) :
     les vrais prix produits sont fetchés par chaque PieceCard via
     useMujiProduct. Le total doit additionner ces prix réels, pas les
     tiers estimate du marchand. On collecte via callback ; clé = piece.piece. */
  const [realPrices, setRealPrices] = useState<Record<string, number>>({});
  const handlePriceResolved = useCallback((pieceId: string, price: number) => {
    setRealPrices((prev) => prev[pieceId] === price ? prev : { ...prev, [pieceId]: price });
  }, []);

  /* Brief 2026-06-07 COHÉRENCE DE TIER (user) — empêcher qu'une pièce écrase
     la tenue par son prix (ex. blazer 1855€ à côté d'un chino 103€ et d'une
     ceinture 60€). On NE baisse PAS les caps marchands (les marques premium
     restent dispo) : on impose une contrainte RELATIVE. Une fois tous les
     prix « idéaux » résolus, toute pièce > 5× la médiane des AUTRES pièces
     est considérée outlier ; on lui fixe un plafond = 5× cette médiane et la
     PieceCard re-pioche une alternative du même slot/couleur sous ce plafond.
     Si toute la tenue est premium (médiane haute), aucun plafond ne tombe →
     les tenues luxe restent intactes. Calculé UNE fois (ref garde) pour
     éviter l'oscillation prix↔plafond. */
  const [tierCeilings, setTierCeilings] = useState<Record<string, number>>({});
  const tierComputedRef = useRef(false);

  /* Brief 2026-05-31 v8 (Logique IA composer renforcée — Couche 6) :
     état de validation LLM. Filet de sécurité ultime contre les tenues
     absurdes même quand mes filtres serveur ratent un cas (ex. Moon Boot
     + Barbour + NSE sur tenue Minimal). On collecte chaque produit résolu
     via callback, on appelle /api/validate-outfit quand les 5 sont là,
     et on bloque l'affichage si verdict = INCOHERENT. */
  type ResolvedPiece = {
    slot: string;
    type: string;
    marque: string;
    couleur: string;
    matiere?: string;
    prix_eur: number;
  };
  const [resolvedPieces, setResolvedPieces] = useState<Record<string, ResolvedPiece>>({});
  /** Collage flat lay : images résolues par slot (haut/bas/veste/chaussures/accent). */
  const [collageImages, setCollageImages] = useState<Record<string, string>>({});
  const handleImageResolved = useCallback((slot: string, imageUrl: string) => {
    if (!imageUrl) return;
    setCollageImages((prev) => prev[slot] === imageUrl ? prev : { ...prev, [slot]: imageUrl });
  }, []);
  /* Brief 2026-06-01 v3 (user) : « propose TOUJOURS une tenue ».
     L'état `incoherent` qui masquait la grille est supprimé — la tenue
     s'affiche dans tous les cas. La validation LLM continue de tourner
     côté serveur pour le monitoring, mais son verdict n'a plus d'effet
     bloquant côté UI. Le badge « ✓ Tenue validée par le styliste WADA »
     reste affiché tant que la requête a abouti (state "coherent"). */
  const [validation, setValidation] = useState<{
    state: "idle" | "loading" | "coherent";
    raison?: string;
    piece?: string | null;
  }>({ state: "idle" });

  const handlePieceResolved = useCallback((pieceId: string, data: ResolvedPiece) => {
    setResolvedPieces((prev) => {
      const existing = prev[pieceId];
      if (existing && existing.marque === data.marque && existing.prix_eur === data.prix_eur) {
        return prev; // pas de changement → pas de re-render
      }
      return { ...prev, [pieceId]: data };
    });
  }, []);

  /* Scanner Phase 2+3 (2026-05-31) — ancre stockée par /composer en
     sessionStorage après une Vision API réussie. Le slot ancré est exclu
     du composer (le client a déjà cette pièce) et affiché en 1ère carte
     avec badge « Ta pièce ». */
  type AnchorData = {
    thumb: string;
    slot: "haut" | "bas" | "veste" | "chaussures" | "accent";
    type: string;
    marque: string | null;
    modele: string | null;
    couleur: { nom: string; hex: string };
    registre: string;
    piecePicked: string | null;
    detectedHex: string | null;
  };
  const [anchor, setAnchor] = useState<AnchorData | null>(null);
  useEffect(() => {
    /* Le flag ?anchor=1 dans l'URL signale qu'il faut lire le sessionStorage.
       Sans flag, on ignore le storage même si présent (évite qu'une ancre
       d'une session précédente s'incruste sur une visite via /palette/N). */
    if (searchParams.get("anchor") !== "1") {
      setAnchor(null);
      return;
    }
    try {
      const raw = sessionStorage.getItem("wada.anchor");
      if (!raw) return;
      const parsed = JSON.parse(raw) as AnchorData;
      if (parsed?.slot && parsed?.type) setAnchor(parsed);
    } catch {}
  }, [searchParams]);

  const clearAnchor = useCallback(() => {
    try { sessionStorage.removeItem("wada.anchor"); } catch {}
    setAnchor(null);
  }, []);
  // Images générées par l'API Replicate via le prompt WADA × Claude
  // Brief 2026-05-28 : la génération d'image IA en haut de page (aiImages,
  // imageLoading, imageError) est retirée — les vraies photos MUJI suffisent
  // et faisaient doublon avec un visuel générique. Voir bloc supprimé plus bas.

  /* Lecture du profil depuis localStorage au mount.
     Pas de SSR ici — on attend l'hydratation pour éviter le flash de
     contenu côté serveur vs client. Les overrides URL (?style/?occasion)
     surchargent localStorage uniquement pour cette navigation. */
  useEffect(() => {
    try {
      /* Brief « Onboarding + profil + switcher » Phase 3 (2026-05-29) :
         le nouveau profil `wada.profile` (genre/budget/style) prime sur
         les anciennes clés `wada-gender` / `wada-prefs`. Mapping :
           profile.genre "Femme"/"Homme" → wada-gender lowercase
           profile.style "Minimaliste"/"Classique"/... → prefs.style
           profile.budget label → prefs.budget numeric (150 / 400 / 2000)
         Si query params explicites (?genre, ?style) → ils gagnent. */
      const profileRaw = localStorage.getItem("wada.profile");
      const profile = profileRaw ? JSON.parse(profileRaw) : null;
      const g = localStorage.getItem("wada-gender");
      const p = localStorage.getItem("wada-prefs");
      const initial: WadaPrefs = { ...DEFAULT_PREFS };
      /* Genre : query (?genre) > profile > legacy. La query param est
         lue plus bas via searchParams, on touche pas ici. */
      const profileGender = profile?.genre === "Femme" ? "femme"
        : profile?.genre === "Homme" ? "homme"
        : null;
      if (profileGender) initial.gender = profileGender;
      else if (g === "femme" || g === "homme" || g === "unisexe") initial.gender = g;
      if (profile?.style) initial.style = profile.style;
      if (profile?.budget) {
        initial.budget = profile.budget === "< 150€" ? 150
          : profile.budget === "150–400€" ? 400
          : 2000;
      }
      if (p) {
        const parsed = JSON.parse(p);
        Object.assign(initial, parsed);
      }
      // Overrides URL — gagnent sur localStorage pour cette session
      if (overrideStyle) initial.style = overrideStyle;
      if (overrideOccasion) initial.occasion_focus = overrideOccasion;
      setPrefs(initial);
    } catch { /* ignore */ }
    setHydrated(true);
  }, [overrideStyle, overrideOccasion]);

  /* Trouve les palettes qui matchent — calcul memoisé pour ne pas relancer
     le scoring à chaque render.
     PRIORITÉ ABSOLUE : si une palette est demandée via ?palette=NUMBER
     (client vient depuis /palette/[number]), on respecte SON choix et on
     l'utilise TELLE QUELLE — sans la remplacer par un score "soi-disant
     meilleur" via le profil. Le profil influence les marchands, pas la palette.
     Sinon (entrée libre sur /ma-tenue), fallback en cascade :
       1. Score sur intent (style + occasion) avec seuil 7.5
       2. Fallback automatique du moteur (seuil 6.5, intent relaxé)
       3. Si toujours rien → 6 palettes au hasard (jamais bloqué). */
  const matchedEntries = useMemo<DictionaryEntry[]>(() => {
    if (!hydrated) return [];

    // 1. Palette explicitement demandée → respect du choix client
    if (requestedPaletteNumber) {
      const requested = dictionary.find((d) => d.number === requestedPaletteNumber);
      if (requested) {
        // On retourne cette palette en premier, suivie des alternatives
        // matchées par profil pour que "Voir une autre tenue" cycle vers
        // des suggestions cohérentes.
        const intent: UserIntent = {
          style: prefs.style || undefined,
          ...occasionToContext(prefs.occasion_focus),
        };
        const others = findBestPalettesWithFallback(dictionary, intent, 6).matches
          .map((m) => m.entry)
          .filter((e) => e.number !== requestedPaletteNumber);
        return [requested, ...others];
      }
    }

    // 2. Score profil normal
    const intent: UserIntent = {
      style: prefs.style || undefined,
      ...occasionToContext(prefs.occasion_focus),
    };
    const result = findBestPalettesWithFallback(dictionary, intent, 6);
    if (result.matches.length > 0) {
      return result.matches.map((m) => m.entry);
    }

    // 3. Filet de sécurité — palettes aléatoires
    const shuffled = [...dictionary].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [hydrated, prefs, requestedPaletteNumber]);

  /* Palette courante (par défaut la 1ère, "Voir une autre" cycle). */
  const entry: DictionaryEntry | null = matchedEntries[matchIndex] ?? null;

  /* ─── REGISTRE ENGINE — brief 2026-05-22 ───
     Au lieu de prendre les pièces fixes du dictionnaire, on les recompose
     dynamiquement selon le profil (registre + occasion + coupe). Garantit
     que « Streetwear » donne hoodie+cargo+bomber+sneakers+casquette, et que
     « Old money » donne pull cachemire+pinces+blazer+loafers+foulard.
     Les COULEURS restent celles de la palette Wada. */
  const registreOutfit: RegistreOutfit | null = useMemo(() => {
    if (!entry) return null;
    const out = composeOutfitFromProfile(entry, {
      style: prefs.style || "Minimal",
      fit: prefs.fit || "standard",
      occasion_focus: prefs.occasion_focus || "quotidien",
      gender: prefs.gender,
    });
    // Validation dev — Streetwear ne doit jamais avoir blazer/derbies
    if (typeof window !== "undefined") {
      const v = validateOutfit(out);
      if (!v.ok) console.warn("[registreEngine] violations :", v.errors);
    }
    return out;
  }, [entry, prefs.style, prefs.fit, prefs.occasion_focus, prefs.gender]);

  // Composition utilisée pour le rendu = slots du registre engine,
  // mappés au format attendu par PieceLine (piece + item + color).
  // Scanner Phase 2 (2026-05-31) : si l'utilisateur a scanné une pièce
  // ancrée, on EXCLUT son slot — il a déjà cette pièce, WADA n'a pas à
  // lui en proposer une autre. La carte « Ta pièce » est rendue
  // séparément en 1ère position (juste après le hero).
  const compositionAll = registreOutfit?.slots.map((s) => ({
    piece: s.slot,        // haut / bas / veste / chaussures / accent
    item: s.type,
    _slot: s,
  })) ?? [];
  const composition = anchor
    ? compositionAll.filter((p) => p.piece !== anchor.slot)
    : compositionAll;

  /* Genre du client (priorité au choix explicite, fallback sur la palette). */
  const userGender = prefs.gender || (entry ? paletteGender(entry.composition) : null);

  /* Brief 2026-05-31 v8 — Couche 6 : validation LLM de la tenue assemblée.
     Déclenchée quand TOUTES les pièces de composition sont résolues. Envoie
     palette + profil + tenue à /api/validate-outfit. Si verdict INCOHERENT,
     on bloque l'affichage et on montre le message de dégradation gracieuse.

     Fail-open : si l'API renvoie une erreur, on laisse afficher (pas de
     régression UX si OpenAI est down). */
  useEffect(() => {
    if (!entry) return;
    const expectedCount = composition.length;
    if (expectedCount === 0) return;
    const resolvedCount = Object.keys(resolvedPieces).filter(
      (k) => composition.some((c) => c.piece === k),
    ).length;
    if (resolvedCount < expectedCount) return;
    /* Toutes les pièces sont résolues. On déclenche la validation
       (une seule fois par combinaison palette+pieces). */
    if (validation.state === "loading") return;
    setValidation({ state: "loading" });
    const payload = {
      palette: {
        nom: entry.name,
        ref: entry.number,
        couleurs: entry.colors.slice(0, 5).map((c) => c.hex),
        registre: prefs.style || "non précisé",
      },
      profil: {
        genre: userGender || "non précisé",
        budget: prefs.budget ? String(prefs.budget) : "non précisé",
        style: prefs.style || "non précisé",
      },
      occasion: overrideOccasion || prefs.occasion_focus || "quotidien",
      tenue: composition
        .map((c) => resolvedPieces[c.piece])
        .filter((p): p is ResolvedPiece => !!p),
    };
    let cancelled = false;
    fetch("/api/validate-outfit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        /* Brief 2026-06-01 v3 (user) : on n'utilise plus le verdict pour
           bloquer l'affichage. Si INCOHERENT, on log juste la raison en
           console (pour debug) et on passe à coherent. La tenue s'affiche
           toujours. */
        if (data?.verdict === "INCOHERENT" && data?.raison) {
          // eslint-disable-next-line no-console
          console.info("[WADA validator]", data.raison);
        }
        setValidation({ state: "coherent" });
      })
      .catch(() => {
        if (cancelled) return;
        /* Fail-open : on affiche la tenue malgré l'erreur réseau. */
        setValidation({ state: "coherent" });
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    entry?.number,
    Object.keys(resolvedPieces).sort().join("|"),
    composition.length,
  ]);

  /* ─── COHÉRENCE DE TIER (Brief 2026-06-07) ───
     Quand tous les prix « idéaux » sont résolus, on repère les pièces dont
     le prix dépasse 5× la médiane des AUTRES pièces et on leur fixe un
     plafond. La PieceCard re-pioche alors une alternative sous ce plafond.
     Calcul UNE seule fois (ref garde) pour éviter l'oscillation prix↔plafond
     après le re-fetch. */
  useEffect(() => {
    if (tierComputedRef.current) return;
    if (composition.length < 3) return; // pas pertinent sous 3 pièces
    const entries = composition
      .map((c) => ({ piece: c.piece, prix: realPrices[c.piece] || 0 }))
      .filter((e) => e.prix > 0);
    if (entries.length < composition.length) return; // attendre tous les prix

    const median = (vals: number[]): number => {
      if (vals.length === 0) return 0;
      const s = [...vals].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    };

    const TIER_FACTOR = 5;     // une pièce ne doit pas dépasser 5× la médiane des autres
    const CEILING_FLOOR = 200; // ne jamais plafonner sous 200€ (évite de tout réduire à MUJI)
    const ceilings: Record<string, number> = {};
    for (const e of entries) {
      const others = entries.filter((o) => o.piece !== e.piece).map((o) => o.prix);
      const med = median(others);
      if (med <= 0) continue;
      const ceiling = Math.max(CEILING_FLOOR, Math.round(med * TIER_FACTOR));
      if (e.prix > ceiling) {
        ceilings[e.piece] = ceiling;
      }
    }

    tierComputedRef.current = true; // figé : une seule passe
    if (Object.keys(ceilings).length > 0) {
      setTierCeilings(ceilings);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    composition.length,
    composition.map((c) => realPrices[c.piece] || 0).join("|"),
  ]);

  /* Reset de la garde tier quand la palette/composition change (nouvelle
     tenue → nouveau calcul de cohérence de tier). */
  useEffect(() => {
    tierComputedRef.current = false;
    setTierCeilings({});
  }, [entry?.number, composition.length, userGender, prefs.style]);

  /* ─── WADA × CLAUDE — Fashion DNA + prompt éditorial ───
     Memoise pour ne recalculer que si l'entry ou les prefs changent. */
  const fashionOutput: FashionOutput | null = useMemo(() => {
    if (!entry) return null;
    const profile: ClientProfile = {
      gender: prefs.gender,
      style: prefs.style,
      fit: prefs.fit,
      occasion_focus: prefs.occasion_focus,
      morpho: prefs.morpho,
      size: prefs.size,
      intensity: prefs.intensity,
      budget: prefs.budget,
    };
    return generateFashionOutput(entry, profile);
  }, [entry, prefs]);

  /* Brief 2026-05-28 : génération IA via /api/generate/image RETIRÉE.
     Le visuel généré faisait doublon avec les vraies photos MUJI et
     n'était plus cohérent (le flat-lay ne montrait pas les vraies pièces
     achetables). On économise aussi un appel Replicate par vue. */

  /* Palette demandée explicitement mais absente du dictionnaire → message
     honnête « introuvable » (avant : repli silencieux sur une autre palette).
     On attend l'hydratation pour ne pas flasher l'état sur le shell SSR. */
  if (hydrated && requestedPaletteNumber &&
      !dictionary.some((d) => d.number === requestedPaletteNumber)) {
    return <PaletteNotFound number={requestedPaletteNumber} />;
  }

  /* Page de chargement avant hydratation — loader éditorial WADA.
     Si la palette est déjà résolue, on anime SES couleurs. */
  if (!hydrated || !entry) {
    return <OutfitLoadingState colors={entry?.colors.map((c) => c.hex)} />;
  }

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
      
      {/* Bouton retour intelligent — brief audit 2026-05-28 §2 :
          /ma-tenue est une page profonde (arrivée depuis /palette/[n] →
          « Voir la tenue »). Le retour utilise history.back() pour ramener
          au contexte d'arrivée. Repli sur /palette/<entry> si on a une
          palette en URL, sinon /palettes (grille). */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 5% 0" }}>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else if (requestedPaletteNumber) {
              window.location.href = `/palette/${requestedPaletteNumber}`;
            } else {
              window.location.href = "/palettes";
            }
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: ink, textDecoration: "none",
            fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
            cursor: "pointer",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HEADER — annonce de la tenue choisie + récap profil
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "48px 5% 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: mojo, fontWeight: 700, letterSpacing: "0.4em", marginBottom: 18 }}>
              Votre tenue, sélectionnée pour vous
            </p>
            <h1 style={{
              fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(36px, 6vw, 60px)", margin: "0 0 6px",
              letterSpacing: "-0.02em", color: ink, lineHeight: 1.05,
            }}>
              {entry.name}
            </h1>

            {/* Brief 2026-06-07 (design) — barre nuancier : remplace
                l'ancien sous-titre italique « X · Y · Z » + les pastilles
                rondes flottantes (redondants) par une rangée de swatches
                NOMMÉS, type carte nuancier de coloriste. */}
            <div style={{
              display: "flex", justifyContent: "center", flexWrap: "wrap",
              gap: 12, marginTop: 22,
            }}>
              {entry.colors.slice(0, 5).map((c, i) => (
                <div key={`${c.hex}-${i}`} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 8,
                }}>
                  <span aria-hidden style={{
                    width: 84, height: 50, borderRadius: 12,
                    background: c.hex,
                    boxShadow: "inset 0 0 0 1px rgba(30,30,30,.08), 0 8px 20px -12px rgba(30,30,30,.5)",
                  }} />
                  <span style={{
                    fontFamily: fontLabel, fontSize: 10,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: textSecondary, fontWeight: 600,
                  }}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AI EDITORIAL — image(s) générées via FLUX avec prompt WADA × Claude
          (Fashion Director / Anti-kitsch). Sert de hero visuel principal —
          montre concrètement la tenue construite, pas juste une grille de
          photos détourées.
          ═══════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════
          DIRECTION ARTISTIQUE — brief 2026-05-28 (retrait flat-lay IA) :
          plus de visuel généré en haut. À la place, fine bande de pastilles
          couleur (identité visuelle de la palette) + texte DA + chips
          registre/coupe/matières. Les vraies photos MUJI prennent le relais
          juste en dessous, agrandies, sur 2 colonnes.
          ════════════════════════════════════════════════════════════════ */}
      {fashionOutput && (
        <section style={{ padding: "8px 5% 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <Reveal>
              {/* Pastilles rondes flottantes retirées (design 2026-06-07) :
                  remplacées par la barre nuancier nommée du hero ci-dessus.
                  Kicker « Direction artistique » retiré aussi — la phrase
                  éditoriale se suffit comme chapô sous le nuancier. */}
              <div style={{ textAlign: "center", padding: "0 12px" }}>
                <p style={{
                  fontFamily: fontBody, fontStyle: "italic", fontSize: 18,
                  color: seal, lineHeight: 1.6, margin: "0 auto",
                  maxWidth: "44ch", letterSpacing: 0,
                }}>
                  {registreOutfit?.description || fashionOutput.description}
                </p>
                {/* Tags techniques (Registre · Coupe · Matières · Réf)
                    retirés — brief « Page tenue V2 » : on supprime le jargon
                    technique au profit d'une lecture éditoriale épurée. */}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          GRILLE 5 PIÈCES — chaque pièce a sa propre carte avec photo +
          top 3 marchands en accès direct (lien externe immédiat).
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "16px 5% 64px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Tabs variations (Safe / Audacieuse / Accessible) retirés
              (user 2026-06-07) : les variantes V2/V3 n'étaient pas
              fonctionnelles (« Bientôt ») → bruit visuel. La tenue Safe est
              la seule composition, inutile de l'annoncer comme un onglet. */}

          {/* Brief 2026-06-01 (mockup) — Tenue Total head card.
              Mini résumé : nom de la tenue + nombre de pièces + score
              cohérence du LLM validateur (si dispo). Total prix rendu
              séparément plus bas (somme realPrices). */}
          {/* Carte d'en-tête « Tenue Safe — la composition centrée » retirée
              (brief Page tenue V2 : doublon avec le titre éditorial et les
              tabs ci-dessus). Le statut « validée par le styliste » reste
              porté par le badge plus bas. */}

          {/* En-tête de section — divider éditorial (filets + label) avec le
              badge de validation intégré dessous (design 2026-06-07). */}
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 16, maxWidth: 520, margin: "0 auto",
            }}>
              <span aria-hidden style={{ flex: 1, height: 1, background: border }} />
              <span style={{
                ...sectionLabel, color: mojo, fontWeight: 700,
                letterSpacing: "0.3em", whiteSpace: "nowrap",
              }}>
                La tenue complète
              </span>
              <span aria-hidden style={{ flex: 1, height: 1, background: border }} />
            </div>

            {/* Badge « ✓ Validée par le styliste WADA » quand cohérent. */}
            {validation.state === "coherent" && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", marginTop: 14,
                background: "rgba(168, 178, 154, 0.18)",
                border: "1px solid rgba(168, 178, 154, 0.4)",
                borderRadius: 999,
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, color: "#5a6849",
                fontWeight: 600, letterSpacing: "0.04em",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#A8B29A",
                }} />
                Tenue validée par le styliste WADA
              </div>
            )}
          </div>

          {/* Scanner Phase 3 (2026-05-31) — Carte « Ta pièce » :
              affiche la pièce scannée par le client en 1ère position, avec
              un badge vert « ANCRE · TA PIÈCE » et la mention « tu l'as
              déjà ». Le composer a exclu son slot des 4 autres cartes.
              Pas de prix, pas de CTA Acheter — c'est la pièce du client. */}
          {anchor && (
            <div style={{
              marginBottom: 22,
              background: "#FAF8F4",
              border: `1px solid rgba(168,178,154,0.45)`,
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 4px 14px -8px rgba(30,30,30,0.12)",
              position: "relative",
            }}>
              {/* Badge ANCRE */}
              <div style={{
                position: "absolute",
                top: 14,
                left: 14,
                zIndex: 5,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px 5px 8px",
                background: "#A8B29A",
                color: "#fff",
                borderRadius: 999,
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: "0 2px 8px -2px rgba(30,30,30,0.2)",
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#fff",
                }} />
                Ta pièce
              </div>

              {/* Bouton Re-scanner discret en haut à droite */}
              <button
                type="button"
                onClick={clearAnchor}
                aria-label="Re-scanner une autre pièce"
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  zIndex: 5,
                  width: 30, height: 30,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid rgba(30,30,30,0.1)",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#6a6259",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                ↻
              </button>

              {/* Image + métadonnées en 2 colonnes desktop, 1 sur mobile */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) 1.2fr", gap: 0 }}>
                {/* Photo scannée */}
                <div style={{
                  background: "#1E1E1E",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {anchor.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={anchor.thumb}
                      alt={`${anchor.marque || ""} ${anchor.type}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{
                      width: 80, height: 80,
                      borderRadius: 20,
                      background: anchor.couleur?.hex || "#888",
                      border: "2px solid rgba(255,255,255,0.2)",
                    }} />
                  )}
                </div>

                {/* Métadonnées */}
                <div style={{ padding: "26px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#6a6259",
                    fontWeight: 600,
                    margin: 0,
                  }}>
                    {anchor.slot} · {anchor.couleur?.nom || "—"}
                  </p>
                  <p style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600,
                    fontSize: 22,
                    color: "#1E1E1E",
                    margin: "6px 0 2px",
                    lineHeight: 1.15,
                  }}>
                    {anchor.marque
                      ? `${anchor.marque}${anchor.modele ? " " + anchor.modele : ""}`
                      : anchor.type.charAt(0).toUpperCase() + anchor.type.slice(1)}
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                    color: "#6a6259",
                    margin: "4px 0 0",
                    lineHeight: 1.5,
                  }}>
                    {/* Fix 2026-05-31 : éviter doublon « sneakers · Sneakers »
                        (type Vision lowercase ≈ piece picker capitalized).
                        On compare en lowercase trimmed. */}
                    {(() => {
                      const t = anchor.type.trim();
                      const p = (anchor.piecePicked || "").trim();
                      const dup = !p || p.toLowerCase() === t.toLowerCase();
                      return dup ? t : `${t} · ${p}`;
                    })()}
                  </p>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: "italic",
                    fontSize: 12.5,
                    color: "#6B3A32",
                    margin: "14px 0 0",
                    lineHeight: 1.5,
                  }}>
                    Tu l'as déjà — WADA compose la tenue autour.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Brief 2026-05-28 (harmonisation) — grille « 1 vedette + 4 en 2×2 » :
              la première pièce occupe une carte pleine largeur (signature),
              les 4 suivantes se rangent dans une grille 2 colonnes.
              Plus de trou orphelin pour la 5ème pièce.
              CSS Grid : on définit explicitement 2 colonnes et la 1ère
              card s'étend sur `grid-column: 1 / -1`. */}
          {/* Brief 2026-06-01 v3 (user) : grille TOUJOURS visible. Le
              fallback INCOHERENT a été supprimé — on propose toujours
              une tenue, quitte à ce qu'elle ne soit pas parfaite. */}
          <div
            className="wada-tenue-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 22,
            }}
          >
          {composition.map((piece, pieceIndex) => {
            // Refonte 2026-05-22 : couleur + mots-clés viennent du
            // registreEngine, plus du matching par index. Le type de
            // pièce (« Hoodie oversized » pour Streetwear, « Pull
            // cachemire » pour Old money) influence la recherche
            // marchand → on cherche réellement la bonne pièce.
            const slot: RegistreSlot | undefined = piece._slot;
            const color = slot?.color || entry.colors[0];

            // Query : type registre-aligné + couleur + genre
            // (ex : « hoodie oversized fer homme » au lieu de
            //  « surchemise coton plâtre homme »)
            const q = smartQuery(slot?.searchKeywords || piece.item, color.name)
              + (userGender ? ` ${userGender}` : "");

            // Marchands rankés par profil — large pool puis diversification
            // par tier de prix pour éviter "Vinted/Zara/Lacoste partout".
            const profileForRanking: WadaProfile = {
              gender: prefs.gender,
              style: prefs.style || undefined,
              budget: prefs.budget,
              morpho: prefs.morpho || undefined,
              intensity: prefs.intensity,
            };
            const ranked = filterAndRankBrandsByProfile(
              shopOptionsAffiliated(q, piece.piece),
              profileForRanking,
              50 // pool très large pour la diversification 6-8 marques
            );
            // Diversification : on pioche jusqu'à 1 marque par tier de prix
            // dans l'ordre selon le budget client. Brief mobile 2026-05-21 :
            // cible 3-4 marchands MAX par pièce (le mur « Amazon · X · Amazon
            // · Y… » répétait Amazon 6-7 fois et faisait bon marché).
            const MAX_MERCHANTS = 4;
            const PER_TIER = 1;
            // Dédup-key par MARQUE (pas par label) — on extrait le nom de
            // marque depuis « Amazon · HUGO » → « HUGO ». Empêche d'avoir
            // 2× le même brand (depuis Amazon et depuis le marchand direct)
            // ET d'empiler 6× le préfixe « Amazon ».
            const brandKey = (m: ShopLink) =>
              (m.label.replace(/^Amazon\s*[·•:-]?\s*/i, "").trim() || m.label)
                .toLowerCase();
            const seenBrands = new Set<string>();
            const merchants: ShopLink[] = [];
            let amazonCount = 0;
            const AMAZON_MAX = 1; // brief mobile 2026-05-21 : Amazon une seule fois max

            const budgetIdx = prefs.budget ?? 1;
            const tierOrder: ShopLink["priceLevel"][] =
              budgetIdx === 2 ? ["luxe", "premium", "mid", "budget"]
              : budgetIdx === 0 ? ["budget", "mid", "premium", "luxe"]
              : ["premium", "mid", "luxe", "budget"];

            const isAmazon = (m: ShopLink) => /^Amazon\b/i.test(m.label);
            const tryPush = (m: ShopLink) => {
              const k = brandKey(m);
              if (seenBrands.has(k)) return false;
              if (isAmazon(m) && amazonCount >= AMAZON_MAX) return false;
              merchants.push(m);
              seenBrands.add(k);
              if (isAmazon(m)) amazonCount++;
              return true;
            };

            /* ─── Bug fix 2026-05-24 « JACK & JONES partout » ─────────────
               PRIORITÉ ABSOLUE : merchantsForPiece() retourne 2-4 marchands
               variés et pertinents pour CETTE pièce (Amazon générique avec
               query type+couleur+genre + Muji si minimal + 1-2 directs
               selon le slot). Évite que la sélection retombe sur l'unique
               « Amazon · JACK & JONES » polyvalent en tier budget. */
            const piecePriority = merchantsForPiece({
              type: slot?.type || piece.item,
              couleurNom: color.name,
              genre: prefs.gender,
              slot: slot?.slot,
            });
            for (const m of piecePriority) {
              if (merchants.length >= MAX_MERCHANTS) break;
              tryPush(m);
            }

            // 1ère passe (legacy) : jusqu'à PER_TIER marques par tier dans l'ordre du budget
            for (const tier of tierOrder) {
              let pickedFromTier = 0;
              for (const m of ranked) {
                if (pickedFromTier >= PER_TIER) break;
                if (merchants.length >= MAX_MERCHANTS) break;
                if (m.priceLevel === tier && tryPush(m)) pickedFromTier++;
              }
              if (merchants.length >= MAX_MERCHANTS) break;
            }

            // 2ème passe : complète avec le ranking normal si on n'a pas atteint MAX
            for (const m of ranked) {
              if (merchants.length >= MAX_MERCHANTS) break;
              tryPush(m);
            }

            /* Brief 2026-05-28 (variété par palette) :
               Seed unique par (palette + slot + style) → garantit que :
               - Même palette / même style → MÊME tenue (stable au reload)
               - Palette différente → produits DIFFÉRENTS (rotation pool top-12)
               - Style différent (Classique vs Minimal vs Old money) → tirage
                 différent → variantes Look distinctes
               Dedup intra-tenue inutile : chaque slot a sa propre catégorie
               (haut/bas/veste/chaussures/accent), donc pas de collision possible. */
            const variantSeed = `${entry.number}-${piece.piece}-${prefs.style || "default"}`;
            /* La première pièce (signature) prend toute la largeur :
               grid-column: 1 / -1. Les 4 suivantes se rangent en 2×2 — pas
               de trou orphelin pour la 5ème. */
            const featured = pieceIndex === 0;
            return (
              <div
                key={piece.item}
                style={{ gridColumn: featured ? "1 / -1" : undefined }}
              >
                <PieceCard
                  piece={piece.piece}
                  itemName={piece.item}
                  color={color}
                  merchants={merchants}
                  paletteRef={entry.number}
                  genre={userGender}
                  style={prefs.style || null}
                  seed={variantSeed}
                  featured={featured}
                  onPriceResolved={handlePriceResolved}
                  onPieceMetaResolved={handlePieceResolved}
                  onImageResolved={handleImageResolved}
                  /* Brief URGENT 2026-06-01 MICRO_TYPES : noms des pièces
                     déjà résolues dans la tenue → filtre de cohérence
                     intra-tenue côté API (short + cardigan NO, etc.). */
                  selectedNamesStr={
                    Object.values(resolvedPieces)
                      .filter((rp) => rp.type)
                      .map((rp) => encodeURIComponent(rp.type))
                      .join("|") || undefined
                  }
                  /* Brief 2026-06-07 COHÉRENCE DE TIER : plafond imposé si
                     cette pièce est un outlier de prix dans la tenue. */
                  tierMaxPrice={tierCeilings[piece.piece] ?? null}
                />
              </div>
            );
          })}
          </div>

          {/* Brief UX client (26/05) — Total estimé de la tenue.
              Fix 2026-05-31 (user screenshot « ~275€ » avec somme = 2414€) :
              le calcul utilisait priceEstimateNum() basé sur le priceLevel
              tier du marchand (~25/55/120/280 par défaut), pas les vrais
              prix produits affichés sur les cards. Maintenant : agrégé via
              callback onPriceResolved des PieceCard → state realPrices.
              Total = somme arrondie des vrais prix MUJI/TBF affichés. */}
          {(() => {
            const resolved = composition
              .map((p) => realPrices[p.piece] || 0)
              .filter((v) => v > 0);
            /* Si TOUS les prix réels sont arrivés → total exact.
               Sinon (chargement en cours) → on n'affiche rien plutôt qu'un
               total faux qui se met à jour visiblement. */
            if (resolved.length < composition.length) return null;
            const total = Math.round(resolved.reduce((a, b) => a + b, 0));
            if (total === 0) return null;

            /* Brief 2026-06-01 « Toujours proposer une tenue » :
               calcul de l'overshoot vs budget profil pour afficher le
               badge transparent. 4 scénarios :
                 A (≤10%)  → pas de badge
                 B (10-30%) → badge ambre « Dépasse votre budget de X% »
                 C (30-100%) → badge orange « investissement notable »
                 D (>100%)   → badge bordeaux « palette luxe » */
            let budgetCible: number | null = null;
            try {
              const profileRaw = typeof window !== "undefined" ? localStorage.getItem("wada.profile") : null;
              if (profileRaw) {
                const profile = JSON.parse(profileRaw);
                /* Budget profil → cible TOTAL tenue (≈ 4-5 pièces × cap pièce).
                   On utilise les fourchettes du brief : <150€ → cible 600€,
                   150-400€ → 1500€, Premium → null (jamais d'overshoot). */
                if (profile?.budget === "< 150€") budgetCible = 600;
                else if (profile?.budget === "150–400€") budgetCible = 1500;
              }
            } catch {}
            const overshoot = budgetCible !== null && total > budgetCible
              ? (total - budgetCible) / budgetCible
              : 0;
            let badgeColors: { bg: string; fg: string } | null = null;
            let badgeLabel = "";
            if (overshoot > 1.0) {
              badgeColors = { bg: "#f5d9d4", fg: "#6e3b32" };
              badgeLabel = `Palette luxe — ${Math.round(overshoot * 100)}% au-dessus de ton budget`;
            } else if (overshoot > 0.3) {
              badgeColors = { bg: "#fbd4a8", fg: "#7e4a16" };
              badgeLabel = `Dépasse ton budget de ${Math.round(overshoot * 100)}%`;
            } else if (overshoot > 0.1) {
              badgeColors = { bg: "#fbe9c5", fg: "#8a6608" };
              badgeLabel = `Dépasse ton budget de ${Math.round(overshoot * 100)}%`;
            }

            return (
              <div style={{
                marginTop: 28,
                padding: "18px 24px",
                background: "rgba(107, 58, 50, 0.06)",
                border: `1px solid rgba(107, 58, 50, 0.15)`,
                borderRadius: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 10,
              }}>
                <div>
                  <p style={{
                    fontSize: 11, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: textSecondary,
                    margin: 0, fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  }}>
                    {anchor ? "Les 4 pièces à acheter" : "Total de la tenue"}
                  </p>
                  <p style={{
                    fontSize: 13, color: textSecondary,
                    margin: "4px 0 0", fontStyle: "italic",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {anchor
                      ? "Hors ta pièce ancrée — prix réels chez chaque marchand au clic"
                      : "Estimation — prix réels chez chaque marchand au clic"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{
                    fontFamily: "'Fredoka', sans-serif",
                    fontWeight: 600, fontSize: 28,
                    color: "#6B3A32",
                    margin: 0, lineHeight: 1,
                  }}>
                    ~{total} €
                  </p>
                  {badgeColors && (
                    <span style={{
                      display: "inline-block",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 10.5,
                      letterSpacing: "0.04em",
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      marginTop: 8,
                      background: badgeColors.bg,
                      color: badgeColors.fg,
                    }}>
                      {badgeLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Note du styliste (carte 和) retirée (user 2026-06-07). */}

          {/* Brief 2026-06-01 (mockup) — Stylist CTA « Quelque chose ne te
              plaît pas ? » → invite à dialoguer avec le styliste IA. */}
          {validation.state === "coherent" && entry && (
            <Link
              href={`/stylist?palette=${entry.number}`}
              style={{
                background: "#1E1E1E",
                color: "#fff",
                border: "none",
                borderRadius: 18,
                padding: 20,
                marginTop: 18, marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                textDecoration: "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <h4 style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 15, fontWeight: 500,
                  margin: "0 0 4px", color: "#fff",
                }}>
                  Quelque chose ne te plaît pas&nbsp;?
                </h4>
                <p style={{
                  fontSize: 12.5, color: "rgba(255,255,255,.7)",
                  lineHeight: 1.4, margin: 0,
                }}>
                  Dis-moi en mots ce que tu veux changer — je recompose autour.
                </p>
              </div>
              <span style={{
                background: "#6B3A32", color: "#fff",
                borderRadius: 999,
                padding: "10px 16px",
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 12, fontWeight: 500,
                flex: "0 0 auto",
              }}>
                Discuter →
              </span>
            </Link>
          )}

          {/* Bottom CTAs — brief mockup 2026-05-25 */}
          <div style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginTop: 32,
            flexWrap: "wrap",
          }}>
            <button
              type="button"
              onClick={() => {
                // Ajoute les 5 pièces de la tenue au panier localStorage
                try {
                  const raw = localStorage.getItem("wada-cart") || "[]";
                  const cart = JSON.parse(raw);
                  for (const piece of composition) {
                    const slot = piece._slot;
                    const color = slot?.color || entry.colors[0];
                    cart.push({
                      id: `${entry.number}-${piece.piece}-${Date.now()}`,
                      piece: piece.piece,
                      item: piece.item,
                      colorName: color.name,
                      colorHex: color.hex,
                      query: slot?.searchKeywords || piece.item,
                      fromEntry: entry.number,
                      addedAt: Date.now(),
                    });
                  }
                  localStorage.setItem("wada-cart", JSON.stringify(cart));
                  window.dispatchEvent(new Event("storage"));
                  alert(`${composition.length} pièces ajoutées à votre panier.`);
                } catch (err) {
                  console.error("Add to cart failed:", err);
                }
              }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                padding: "13px 24px",
                borderRadius: 999,
                background: "#6B3A32",
                color: "#FAF8F4",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Ajouter à mon dressing
            </button>
            {/* Bouton « Tout chercher sur Amazon » retiré (user 2026-06-07). */}
          </div>

          {/* Bloc réassurance (Paiement sécurisé / Achat direct / Prix
              identique) retiré (user 2026-06-07). */}

          <p style={{
            maxWidth: 720,
            margin: "12px auto 0",
            fontSize: 12,
            color: textSecondary,
            textAlign: "center",
          }}>
            Liens partenaires (Muji via Awin · Amazon Partenaires) — WADA peut toucher une commission, sans coût supplémentaire pour vous.{" "}
            <Link href="/cgv" style={{ color: "inherit", textDecoration: "underline" }}>CGV</Link>
            {" · "}
            <Link href="/confidentialite" style={{ color: "inherit", textDecoration: "underline" }}>Confidentialité</Link>
          </p>

          {/* Brief 2026-05-28 (harmonisation) :
              - 2 cols → 1 col ≤ 640px (cards pleine largeur)
              - hover discret : translateY(-3px) + image scale(1.03) pour
                inviter au clic, sans surcharger
              - réassurance passe aussi en colonne sur mobile */}
          <style jsx>{`
            /* Fix 2026-05-31 v2 (user screenshot iPhone : cartes trop
               grandes en 1 colonne stretch) : on garde la grille 2
               colonnes même sur mobile, comme le desktop. La pièce
               vedette continue de spanner les 2 colonnes via grid-column:
               1 / -1. Les 4 autres en 2×2 compactes. Le client voit
               4 cartes lisibles d'un seul scroll au lieu d'1 carte par
               écran. Gap réduit pour gagner de la place. */
            @media (max-width: 640px) {
              :global(.wada-tenue-grid) {
                gap: 12px !important;
              }
            }
            @media (max-width: 540px) {
              :global(.wada-reassurance) {
                grid-template-columns: 1fr !important;
                gap: 14px !important;
                text-align: left !important;
              }
            }
            /* Brief 2026-06-07 (design héro) — la pièce centrale est un
               héro 2 colonnes (image | détails) sur desktop. Sous 720px,
               on repasse en colonne pour garder une image lisible. */
            @media (max-width: 720px) {
              :global(.wada-piece-card--featured) {
                flex-direction: column !important;
              }
              :global(.wada-piece-card--featured .wada-piece-photo),
              :global(.wada-piece-card--featured .wada-skeleton) {
                flex: none !important;
                width: 100% !important;
                border-radius: 16px 16px 0 0 !important;
              }
            }
            :global(.wada-piece-card:hover) {
              transform: translateY(-3px);
              box-shadow: 0 14px 40px rgba(30, 30, 30, .10) !important;
            }
            :global(.wada-piece-card:hover .wada-piece-photo img) {
              transform: scale(1.03);
            }
            @media (prefers-reduced-motion: reduce) {
              :global(.wada-piece-card),
              :global(.wada-piece-card:hover),
              :global(.wada-piece-card .wada-piece-photo img) {
                transform: none !important;
                transition: none !important;
              }
            }
          `}</style>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA — Voir une autre tenue (cycle dans les matches)
          ═══════════════════════════════════════════════════════════════ */}
      {matchedEntries.length > 1 && (
        <section style={{ padding: "0 5% 96px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setMatchIndex((i) => (i + 1) % matchedEntries.length)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              padding: "16px 32px",
              background: ink, color: paper,
              fontFamily: fontLabel, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.3em", textTransform: "uppercase",
              borderRadius: 999, border: "none", cursor: "pointer",
              boxShadow: "0 6px 20px rgba(31,27,22,0.18)",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(ev) => { ev.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span>Voir une autre tenue</span>
            <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>↻</span>
          </button>
          <p style={{ marginTop: 18, fontSize: 13, color: textSecondary, fontStyle: "italic" }}>
            {matchIndex + 1} / {matchedEntries.length} tenues pour votre profil
          </p>
        </section>
      )}

      {/* Brief « appli efficace » §6 (2026-05-29) : repère « Ensuite »
          pour ne jamais laisser le client en cul-de-sac. Après la tenue,
          on propose la suite logique : sauver dans favoris ou scanner
          une autre couleur. */}
      <section style={{ padding: "0 5% 24px" }}>
        <NextStepHint
          label="Garder cette tenue · Voir mes favoris"
          href="/favoris"
        />
      </section>

      {/* Lien retour vers le profil pour ajuster */}
      <section style={{ padding: "0 5% 80px", textAlign: "center" }}>
        <Link
          href="/atelier"
          style={{
            fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: textSecondary, textDecoration: "underline",
          }}
        >
          Ajuster mon profil
        </Link>
      </section>

          </main>
  );
}

/* ─────────────────── FlatLayCollage ───────────────────
   Composition CSS des 5 photos produit en style éditorial.
   Layout (sur mobile : colonne simple) :
     ┌──────────┬───────────┐
     │   HAUT   │  VESTE    │
     ├────┬─────┴─┬─────────┤
     │BAS │ CHSS  │ ACCENT  │
     └────┴───────┴─────────┘
────────────────────────────────────────────────────── */

function FlatLayCollage({
  images,
  pieces,
}: {
  images: Record<string, string>;
  pieces: Array<{ slot: string; id: string; nom: string; marque: string; prix: number; url: string; name?: string; type?: string }>;
}) {
  const slots = ["haut", "veste", "bas", "chaussures", "accent"];
  const has = (s: string) => !!images[s];
  const count = slots.filter(has).length;

  /* État : null = chargement, string = URL générée, "fallback" = CSS */
  const [generatedUrl, setGeneratedUrl] = useState<string | null | "fallback">(null);
  const [positions, setPositions] = useState<Array<{ slot: string; cx: number; cy: number }>>([]);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [buyModal, setBuyModal] = useState(false);

  /* Charge l'état liked depuis localStorage */
  useEffect(() => {
    try {
      const key = `wada.liked.${Object.values(images).join(",").slice(0, 40)}`;
      setLiked(!!localStorage.getItem(key));
    } catch {}
  }, [images]);

  /* Appelle /api/flatlay quand 4+ images disponibles */
  useEffect(() => {
    if (count < 4 || !process.env.NEXT_PUBLIC_SITE_URL) {
      /* Fallback CSS si pas assez d'images ou env non configuré */
      if (count >= 3) setGeneratedUrl("fallback");
      return;
    }

    const flatPieces = pieces
      .filter((p) => images[p.slot])
      .map((p) => ({
        id: p.id,
        slot: p.slot as "veste" | "haut" | "bas" | "chaussures" | "accent",
        name: p.nom,
        image_url: images[p.slot],
        marque: p.marque,
        nom: p.nom,
        prix: p.prix,
        url_buy: p.url,
      }));

    fetch("/api/flatlay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pieces: flatPieces }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.url) {
          setGeneratedUrl(data.url);
          setPositions(data.positions || []);
        } else {
          setGeneratedUrl("fallback");
        }
      })
      .catch(() => setGeneratedUrl("fallback"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (count < 3) return null;

  const toggleLike = () => {
    try {
      const key = `wada.liked.${Object.values(images).join(",").slice(0, 40)}`;
      if (liked) localStorage.removeItem(key);
      else localStorage.setItem(key, "1");
      setLiked(!liked);
    } catch {}
  };

  const total = pieces.reduce((s, p) => s + (p.prix || 0), 0);
  const activePiece = activeHotspot ? pieces.find((p) => p.slot === activeHotspot) : null;

  /* Style partagé : fond blanc, ombre légère, objectFit contain. */
  const cellStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(30,30,30,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    ...extra,
  });
  const imgEl2 = (slot: string): React.ReactNode => (
    <img
      src={images[slot]} alt={slot}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
    />
  );

  const cellStyle2 = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: "#fff", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 1px 6px rgba(30,30,30,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center", ...extra,
  });
  const imgEl3 = (slot: string): React.ReactNode => (
    <img src={images[slot]} alt={slot} loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
  );

  return (
    <div style={{ marginBottom: 32 }}>
      {/* ── Image générée Replicate + hotspots ── */}
      {generatedUrl && generatedUrl !== "fallback" ? (
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "#F2EDE4", border: "1px solid rgba(30,30,30,0.07)" }}>
          <img src={generatedUrl} alt="Tenue complète flat lay"
            style={{ width: "100%", display: "block" }} />

          {/* Hotspots SVG overlay */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
            viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet">
            {positions.map((pos) => (
              <g key={pos.slot}
                onClick={() => setActiveHotspot(activeHotspot === pos.slot ? null : pos.slot)}
                style={{ cursor: "pointer" }}>
                <circle cx={pos.cx} cy={pos.cy} r={28} fill="white" opacity={0.9} />
                <text x={pos.cx} y={pos.cy + 7} textAnchor="middle"
                  fontSize={32} fontWeight={300} fill="#6B3A32">+</text>
              </g>
            ))}
          </svg>

          {/* Barre info hotspot actif */}
          {activePiece && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)",
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
              borderTop: "1px solid rgba(30,30,30,0.08)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6B3A32", textTransform: "uppercase", letterSpacing: "0.08em" }}>{activePiece.marque}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#1E1E1E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activePiece.nom}</p>
              </div>
              <span style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, color: "#6B3A32", flexShrink: 0 }}>{typeof activePiece.prix === "number" ? `${activePiece.prix.toFixed(2)} €` : "Prix sur le site"}</span>
              {activePiece.url ? (
                <a href={activePiece.url} target="_blank" rel="noopener sponsored"
                style={{ flexShrink: 0, background: "#1E1E1E", color: "#FAF8F4", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontFamily: "'Fredoka'", textDecoration: "none" }}>
                Acheter ↗
              </a>
              ) : null}
            </div>
          )}
        </div>
      ) : generatedUrl === null ? (
        /* Chargement */
        <div style={{ background: "#F2EDE4", borderRadius: 18, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#A89880", fontSize: 13, fontFamily: "'Inter'", fontStyle: "italic" }}>
            Composition de la tenue en cours…
          </p>
        </div>
      ) : (
        /* Fallback CSS (si pas assez d'images ou erreur) */
        <div style={{ marginBottom: 0, borderRadius: 18, overflow: "hidden", background: "#F2EDE4", border: "1px solid rgba(30,30,30,0.07)", padding: "14px 10px 10px" }}>
          <p style={{ textAlign: "center", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", color: "#A89880", margin: "0 0 10px", fontFamily: "'Inter'" }}>
            La tenue · composition
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 6 }}>
            <div style={cellStyle2({ gridColumn: "1/2", gridRow: "1/3", aspectRatio: "4/5", minHeight: 180 })}>{has("haut") ? imgEl3("haut") : <span style={{ color: "#D0C8BC" }}>◻</span>}</div>
            <div style={cellStyle2({ aspectRatio: "3/4" })}>{has("veste") ? imgEl3("veste") : null}</div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 6 }}>
              <div style={cellStyle2({ aspectRatio: "3/2" })}>{has("chaussures") ? imgEl3("chaussures") : null}</div>
              {has("accent") && <div style={cellStyle2({ aspectRatio: "3/2" })}>{imgEl3("accent")}</div>}
            </div>
          </div>
          {has("bas") && <div style={{ ...cellStyle2({}), marginTop: 6, aspectRatio: "4/2" }}>{imgEl3("bas")}</div>}
        </div>
      )}

      {/* ── Boutons Aimer + Acheter tout ── */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        {/* Cœur */}
        <button type="button" onClick={toggleLike}
          style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: liked ? "#FEE2E2" : "#F2EDE4",
            border: `1px solid ${liked ? "#F87171" : "rgba(30,30,30,0.12)"}`,
            fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label={liked ? "Retirer des favoris" : "Aimer cette tenue"}>
          {liked ? "❤️" : "🤍"}
        </button>

        {/* Acheter tout */}
        <button type="button" onClick={() => setBuyModal(true)}
          style={{
            flex: 1, background: "#1E1E1E", color: "#FAF8F4", border: "none",
            borderRadius: 14, fontFamily: "'Fredoka'", fontSize: 16, fontWeight: 500,
            cursor: "pointer", padding: "0 16px",
          }}>
          Acheter cette tenue · {total > 0 ? `${Math.round(total)} €` : "…"}
        </button>
      </div>

      {/* ── Modal Buy All ── */}
      {buyModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setBuyModal(false)}>
          <div style={{
            background: "#FAF8F4", borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 600, padding: "24px 20px 36px",
            maxHeight: "80vh", overflowY: "auto",
          }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20, fontWeight: 500, margin: "0 0 18px", textAlign: "center" }}>
              Acheter la tenue complète
            </p>

            {pieces.map((p) => p.url && (
              <div key={p.slot} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 14px", background: "#fff", borderRadius: 12, border: "1px solid rgba(30,30,30,0.07)" }}>
                {images[p.slot] && <img src={images[p.slot]} alt={p.slot} loading="lazy" decoding="async" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#6B3A32", textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.marque}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nom}</p>
                </div>
                <span style={{ fontFamily: "'Fredoka'", fontSize: 15, color: "#6B3A32", flexShrink: 0 }}>{typeof p.prix === "number" ? `${p.prix.toFixed(2)} €` : "—"}</span>
                <a href={p.url} target="_blank" rel="noopener sponsored"
                  style={{ background: "#6B3A32", color: "#FAF8F4", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontFamily: "'Fredoka'", textDecoration: "none", flexShrink: 0 }}>
                  ↗
                </a>
              </div>
            ))}

            <button type="button"
              onClick={() => {
                pieces.forEach((p) => { if (p.url) window.open(p.url, "_blank"); });
                setBuyModal(false);
              }}
              style={{
                width: "100%", background: "#1E1E1E", color: "#FAF8F4", border: "none",
                borderRadius: 14, fontFamily: "'Fredoka'", fontSize: 16, fontWeight: 500,
                cursor: "pointer", padding: "16px", marginTop: 8,
              }}>
              Ouvrir les {pieces.filter((p) => p.url).length} liens marchands →
            </button>

            <button type="button" onClick={() => setBuyModal(false)}
              style={{ width: "100%", background: "transparent", border: "none", color: "#9B8B78", fontFamily: "'Inter'", fontSize: 13, cursor: "pointer", padding: "12px", marginTop: 4 }}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── PieceCard ───────────────────
   Une carte = 1 pièce de la tenue.
   Structure : photo (fond colored palette + mix-blend-multiply) +
   nom de la pièce + 3 boutons marchands directs.
   ───────────────────────────────────────────────── */
/**
 * PieceLine — version compacte texte-only (remplace l'ancien PieceCard avec
 * photos). Demandée par le client : "juste des mots en dessous, où trouver
 * ce type de pantalon / pull / mocassins". L'image FLUX en haut de page
 * sert de référence visuelle pour TOUTE la tenue ; ici on liste juste les
 * pièces + les marchands où les trouver.
 *
 * Layout :
 *   ┌───────────────────────────────────────────────────────┐
 *   │ ● HAUT                                          DUNE  │
 *   │ T-shirt coton dune                                    │
 *   │ Où trouver → Depop · Levi's · Vinted                  │
 *   └───────────────────────────────────────────────────────┘
 */
function PieceLine({
  piece, itemName, color, merchants,
}: {
  piece: string;
  itemName: string;
  color: { name: string; hex: string };
  merchants: ShopLink[];
}) {
  return (
    <article style={{
      padding: "22px 0",
      borderBottom: `1px solid ${border}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {/* Ligne 1 : label catégorie + swatch couleur + nom couleur (à droite) */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 14,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{
            display: "inline-block",
            width: 12, height: 12, borderRadius: "50%",
            background: color.hex,
            border: `1px solid rgba(0,0,0,0.1)`,
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: fontLabel, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.35em", textTransform: "uppercase",
            color: mojo,
          }}>
            {PIECE_LABELS[piece] || piece}
          </span>
        </div>
        <span style={{
          fontFamily: fontLabel, fontSize: 9, fontWeight: 600,
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: subtle,
        }}>
          {color.name}
        </span>
      </div>

      {/* Ligne 2 : nom de l'item, en serif italique éditorial */}
      <p style={{
        fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
        fontSize: 22, color: ink, margin: 0,
        lineHeight: 1.2, letterSpacing: "-0.01em",
      }}>
        {itemName}
      </p>

      {/* Ligne 3 : où trouver — marchands en PASTILLES (brief mobile 2026-05-21)
          Plus de mur « Amazon · X · Amazon · Y » : Amazon est limité à 1 max,
          les labels « Amazon · HUGO » sont affichés « HUGO » (pastille avec
          pictogramme A pour signaler l'origine Amazon). Cible : 3-4 chips
          lisibles, cliquables, cible tactile 44px. */}
      {merchants.length > 0 ? (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          alignItems: "center", margin: "8px 0 0",
        }}>
          <span style={{
            fontFamily: fontLabel, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: subtle, marginRight: 4,
          }}>
            Où trouver →
          </span>
          {merchants.map((m, idx) => {
            const isAmz = /^Amazon\b/i.test(m.label);
            const cleanLabel = isAmz
              ? m.label.replace(/^Amazon\s*[·•:-]?\s*/i, "").trim() || "Amazon"
              : m.label;
            return (
              <ExternalLink
                key={`${m.label}-${idx}`}
                href={m.url}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 14px",
                  background: cardBg,
                  border: `1px solid ${border}`,
                  borderRadius: 999,
                  color: ink,
                  fontFamily: fontBody, fontSize: 14, fontWeight: 500,
                  textDecoration: "none",
                  lineHeight: 1.2,
                  minHeight: 36,
                  transition: "border-color .2s ease, background .2s ease",
                }}
              >
                {isAmz && (
                  <span
                    aria-label="via Amazon"
                    title="via Amazon"
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 16, height: 16, borderRadius: 4,
                      background: "#FF9900", color: "#1E1E1E",
                      fontFamily: fontLabel, fontSize: 9, fontWeight: 800,
                      letterSpacing: 0, lineHeight: 1,
                    }}
                  >
                    a
                  </span>
                )}
                <span>{cleanLabel}</span>
              </ExternalLink>
            );
          })}
        </div>
      ) : (
        <p style={{
          fontFamily: fontBody, fontStyle: "italic", fontSize: 13,
          color: textSecondary, margin: "4px 0 0",
        }}>
          Aucun marchand pour cet item — ajustez votre profil.
        </p>
      )}
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   PieceCard — refonte « marque + prix + Acheter » (brief 2026-05-27 §2)
   ──────────────────────────────────────────────────────────────────────
   Avant : bouton générique « Amazon → » qui ne disait ni la marque ni le
   prix. Confus pour le client (« je clique sur quoi ? »).

   Après : carte plus grande, avec un BLOC marchand explicite :
     - MARQUE en gros (« COS », « Muji », « HUGO », « Amazon »)
     - prix en accent (~55 €) — estimation par tier (faute d'API prix)
     - mention « via Amazon » / « via Awin » discrète
     - bouton « Acheter → » clair
     - « + N autres marchands » repliable

   Layout :
     ┌────────────────────────────┐
     │ [color swatch — 110px]     │
     ├────────────────────────────┤
     │ HAUT · MARINE              │
     │ Pull col rond marine       │
     │                            │
     │ ┌────────────────────────┐ │
     │ │ COS                    │ │
     │ │ ~55 €     via Amazon   │ │
     │ │ [   Acheter →   ]      │ │
     │ └────────────────────────┘ │
     │ + 3 autres marchands ▾     │
     └────────────────────────────┘
   ────────────────────────────────────────────────────────────────────── */

/** Extrait un nom de marque propre depuis un label de marchand :
 *   « Amazon · HUGO » → « HUGO »
 *   « Amazon »        → « Amazon »
 *   « COS »           → « COS »
 *   « Muji »          → « Muji »
 */
function brandLabel(m: ShopLink): string {
  const cleaned = m.label.replace(/^Amazon\s*[·•:\-]\s*/i, "").trim();
  return cleaned || m.label;
}

/** True si le marchand est l'Amazon GÉNÉRIQUE (pas un brand affilié via
 *  Amazon comme « Amazon · HUGO » qui devient « HUGO »). Sert à le pousser
 *  en bas du classement — on veut afficher la VRAIE marque en headline,
 *  pas le nom de la place de marché. */
function isPureAmazon(m: ShopLink): boolean {
  return m.label.trim().toLowerCase() === "amazon";
}

/** True si le lien passe par Amazon (générique ou brand affilié).
 *  Sert à afficher le petit logo « a » orange + « via Amazon ». */
function isAmazonLinked(m: ShopLink): boolean {
  return /^Amazon\b/i.test(m.label);
}

/** Pastille orange « a » — signature visuelle Amazon dans les UI WADA.
 *  Utilisée à côté du « via Amazon » pour signaler l'origine du lien
 *  sans monopoliser la headline. */
function AmazonAaChip({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-label="via Amazon"
      title="via Amazon"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size, height: size, borderRadius: 4,
        background: "#FF9900", color: "#1E1E1E",
        fontFamily: "'Inter', sans-serif", fontWeight: 800,
        fontSize: Math.round(size * 0.6), letterSpacing: 0, lineHeight: 1,
        flexShrink: 0,
      }}
    >
      a
    </span>
  );
}

/** Libellé prix d'un marchand de recherche (fallback).
 *
 *  Bug critique 2026-05-31 : avant, on affichait un prix factice par tier
 *  (« ~55 € » pour TOUT marchand « mid »), ce qui donnait Hoodie ~55€ /
 *  Cargo ~55€ / Sneakers ~55€ — visiblement faux. Un lien de RECHERCHE n'a
 *  pas de prix produit. Règle 4 du brief : on affiche « Prix sur le site »
 *  plutôt qu'un montant inventé. Le vrai prix (MUJI / TBF) vient de la fiche
 *  produit /api/products et est affiché directement (mujiProduct.prix), pas
 *  via cette fonction. */
function priceEstimate(_m: ShopLink): string {
  return "Prix sur le site";
}

/** Brief 2026-06-07 (design cartes) — format prix épuré : on masque les
 *  décimales « .00 » (80.00 € → 80 €) tout en gardant les centimes réels
 *  quand ils existent (248.85 € → 248,85 €). Virgule décimale FR. Le prix
 *  exact reste celui du marchand (mention « prix identique » sous le CTA). */
function formatPrice(prix: number): string {
  const rounded = Math.round(prix * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(".", ",");
}

/** Mention discrète « via Amazon / via Awin » pour signaler la couche
 *  d'affiliation sans la rendre criante. Renvoie null si la marque est
 *  affichée en direct (Amazon brut ou marchand direct). */
function viaLabel(m: ShopLink): string | null {
  // Cas "Amazon · HUGO" → on affiche HUGO + "via Amazon"
  if (/^Amazon\b/i.test(m.label) && m.label.trim().toLowerCase() !== "amazon") {
    return "via Amazon";
  }
  // Muji passe par Awin (cf. lib/affiliate.ts + merchantsForPiece.ts)
  if (/^Muji$/i.test(m.label)) return "via Awin";
  return null;
}

/** Slot canonique pour l'API /api/products. Map les clés legacy
 *  (« Top »/« Bottom »/…) vers les slots FR utilisés par le flux Awin. */
function pieceToSlot(piece: string): string | null {
  const map: Record<string, string> = {
    Top: "haut", Shirt: "haut", haut: "haut",
    Bottom: "bas", bas: "bas",
    Outer: "veste", veste: "veste",
    Shoes: "chaussures", chaussures: "chaussures",
    Accent: "accent", accent: "accent",
  };
  return map[piece] || null;
}

/** Hook léger : tente de charger un produit MUJI réel pour ce slot+palette.
 *  Renvoie null en cas d'absence (catalogue vide, aucun match, erreur).
 *  Le UI bascule alors sur le placeholder Amazon.
 *
 *  Brief Muji 2026-05-28 (cohérence matching) : passe aussi `style` à l'API
 *  pour exclure les sous-types incohérents avec le registre (jogging en
 *  Classique, pantoufles en Tailoring…). */
/** Hook : tente de charger un produit MUJI réel pour ce slot.
 *
 *  Brief 2026-05-28 (variété par palette) :
 *    - On passe `colorHex` (la VRAIE couleur de la palette assignée à ce slot)
 *      → tri ΔE2000 vs cette couleur → produit qui match VRAIMENT la teinte
 *    - On passe `seed` (palette + slot + style) → rotation dans le top-12
 *      pour avoir des produits différents entre palettes
 *    - On passe `excludeIds` → dedup intra-tenue (un produit ne réapparaît
 *      pas sur 2 slots de la même tenue)
 *
 *  Quand un produit est trouvé, on appelle `onPicked(id)` pour que le parent
 *  l'ajoute aux excludeIds des slots suivants.
 */
function useMujiProduct(
  slot: string | null,
  colorHex: string | null,
  paletteRef: string | null,
  genre: string | null,
  style: string | null,
  seed: string | null,
  excludeIds: string[],
  onPicked?: (id: string) => void,
  /** Brief URGENT 2026-06-01 MICRO_TYPES — noms des pièces déjà sélectionnées
   *  dans la tenue, encodés "|" séparés. Transmis à /api/products pour le
   *  filtre de cohérence intra-tenue (short + cardigan NO, etc.). */
  selectedNamesStr?: string,
  /** Brief 2026-06-07 COHÉRENCE DE TIER — plafond prix imposé a posteriori
   *  quand cette pièce est un outlier de prix dans la tenue (> 5× la médiane
   *  des autres pièces). null = pas de contrainte (pick idéal). Quand fourni,
   *  l'API re-sélectionne une pièce ≤ ce plafond dans le même slot/couleur,
   *  ramenant la tenue dans un tier de prix homogène. */
  tierMaxPrice?: number | null,
) {
  const [product, setProduct] = useState<{
    id: string;
    nom: string;
    marque: string;
    /* Brief 2026-05-30 : marchand exposé pour afficher le bon label
       « via Awin · {marchand} partenaire » (MUJI ou The Business
       Fashion ou autre flux futur). */
    marchand?: string;
    image: string;
    prix: number;
    devise: string;
    url: string;
    /* Brief UX client (26/05) — la couleur RÉELLE du produit MUJI
       (« Bleu Marine Foncé », « Beige Sable »), pas la couleur cible
       de la palette WADA. Utilisée par la PieceCard pour afficher
       le bon nom de couleur dans le badge (cohérence visuelle). */
    couleurNom?: string;
    /* Brief UX client v2 (26/05) — hex inféré du flux Awin (couleurNom
       → hex), utilisé pour la pastille à côté du label. Évite le cas
       où le label dit « NOIR » mais la pastille est crème (intention
       palette) et la photo est beige (produit réel). Pastille + label
       + photo viennent maintenant TOUS de la même source. */
    couleurHex?: string;
  } | null>(null);

  // Brief : on utilise excludeIds joined en string pour la dep useEffect —
  // évite des re-fetches inutiles à chaque render du parent (les arrays
  // sont des références).
  const excludeKey = excludeIds.join(",");

  useEffect(() => {
    if (!slot) return;
    void selectedNamesStr; // inclus dans les deps ci-dessous
    let cancelled = false;
    /* Fix 2026-05-30 « toujours pas de photo TBF » : avant on hardcodait
       merchant=muji-france, ce qui exclut TBF (et tout autre flux futur)
       du résultat. Maintenant on laisse l'API choisir le meilleur produit
       toutes marques confondues, trié par proximité couleur (min ΔE2000
       vers la palette demandée). MUJI reste dominant sur les palettes
       neutres, TBF apparaît sur les palettes sombres/luxury. */
    const params = new URLSearchParams({ slot, limit: "1" });
    /* Brief 2026-06-01 « Toujours proposer une tenue » : on n'applique
       PLUS le maxPrice strict du profil sur le pick principal. Le
       composer ramène la tenue IDÉALE pour la palette/registre — quitte
       à dépasser le budget profil de 10-100%. L'UI affiche ensuite un
       badge « Dépasse votre budget de X% » et offre une porte de sortie
       (alternative strict, ajustement styliste, augmenter budget).
       Le soft cap par REGISTRE reste appliqué côté API (Décontracté
       600€, Streetwear 800€, Minimaliste 1000€, Classique 2000€) pour
       garder une fourchette réaliste sans laisser des Brioni 5000€
       passer par défaut.

       La saison reste propagée — c'est une contrainte de cohérence
       (lin en hiver = pas idéal), pas un compromis budget. */
    if (typeof window !== "undefined") {
      try {
        const profileRaw = localStorage.getItem("wada.profile");
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (profile?.saison === "Hiver") params.set("season", "hiver,automne");
          else if (profile?.saison === "Été") params.set("season", "été,printemps");
          else if (profile?.saison === "Mi-saison") params.set("season", "automne,printemps");
        }
      } catch {}
    }
    if (colorHex) params.set("color", colorHex);
    if (paletteRef) params.set("palette", paletteRef);
    if (genre) params.set("genre", genre);
    if (style) params.set("style", style);
    if (seed) params.set("seed", seed);
    if (excludeKey) params.set("excludeIds", excludeKey);

    /* Brief 2026-06-07 COHÉRENCE DE TIER : plafond prix appliqué uniquement
       aux pièces outlier (cf. parent). On passe `tierCap` (et NON `maxPrice`)
       pour que l'API l'applique en filtre DUR final, sans la majoration +50%
       du soft-cap budget réservée aux slots non-MUJI. Force une re-sélection
       du même slot/couleur sous ce plafond → tenue homogène en tier. */
    if (tierMaxPrice != null && tierMaxPrice > 0) {
      params.set("tierCap", String(Math.round(tierMaxPrice)));
    }

    /* Brief URGENT 2026-06-01 Nemanja — Règle 3 : propager `occasion` à
       l'API pour activer les FORBIDDEN_TYPES (short_bain interdit en
       voyage/bureau, sneakers_sport en cérémonie, etc.). */
    if (typeof window !== "undefined") {
      try {
        const urlOcc = new URLSearchParams(window.location.search).get("occasion");
        if (urlOcc) params.set("occasion", urlOcc);
      } catch {}
    }

    /* Brief URGENT 2026-06-01 MICRO_TYPES : pièces déjà sélectionnées dans
       la tenue. Permet à /api/products de rejeter les incompatibilités
       intra-tenue (short + cardigan NO, sandal plage + blazer NO, etc.). */
    if (selectedNamesStr) params.set("selectedNames", selectedNamesStr);

    /* Brief 2026-06-01 « dimensions IA » §1 — traduit wada.mood.perception
       en param `envie` API. Mapping :
         Élégant     → elegant
         Créatif     → creatif
         Accessible  → confortable
         Autoritaire → affirme
         Séduisant   → affirme
         Mystérieux  → discret
       Pas envoyé si l'user n'a pas configuré de mood du jour. */
    if (typeof window !== "undefined") {
      try {
        const moodRaw = localStorage.getItem("wada.mood");
        if (moodRaw) {
          const mood = JSON.parse(moodRaw);
          const today = new Date().toISOString().slice(0, 10);
          if (mood?.date === today && mood?.perception) {
            const ENVIE_MAP: Record<string, string> = {
              "Élégant": "elegant",
              "Créatif": "creatif",
              "Accessible": "confortable",
              "Autoritaire": "affirme",
              "Séduisant": "affirme",
              "Mystérieux": "discret",
            };
            const envie = ENVIE_MAP[mood.perception];
            if (envie) params.set("envie", envie);
          }
        }
      } catch {}
    }

    fetch(`/api/products?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.products?.length) return;
        const p = data.products[0];
        /* Brief 2026-05-28 (image plein cadre 4/5) :
           - priorité 1 : imageLocal (Vercel Blob CDN, déjà mirroré)
           - priorité 2 : largeImage proxifié — meilleur rendu sur card vedette
           - priorité 3 : image standard 200×200 proxifié (peut paraître flou
             en grand mais évite la card vide). */
        const sourceUrl = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";
        const picked = {
          id: p.id,
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          /* Brief 2026-05-30 : marchand exposé pour le label
             « via Awin · {marchand} partenaire » dynamique. */
          marchand: p.marchand,
          image: sourceUrl,
          prix: p.prix,
          devise: p.devise,
          url: p.urlProduit,
          couleurNom: p.couleurNom,
          couleurHex: p.hex,
        };
        setProduct(picked);
        onPicked?.(p.id);
      })
      .catch(() => { /* silencieux — fallback Amazon */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, colorHex, paletteRef, genre, style, seed, excludeKey, selectedNamesStr, tierMaxPrice]);

  return product;
}

function PieceCard({
  piece, itemName, color, merchants, paletteRef, genre, style,
  seed, excludeIds, onPicked, featured, onPriceResolved, onPieceMetaResolved,
  selectedNamesStr, onImageResolved, tierMaxPrice,
}: {
  piece: string;
  itemName: string;
  color: { name: string; hex: string };
  merchants: ShopLink[];
  paletteRef?: string | null;
  genre?: string | null;
  style?: string | null;
  seed?: string | null;
  excludeIds?: string[];
  onPicked?: (id: string) => void;
  /** Brief URGENT 2026-06-01 MICRO_TYPES : noms des pièces déjà sélectionnées
   *  "|"-séparés. Transmis à useMujiProduct puis à /api/products. */
  selectedNamesStr?: string;
  /** Brief 2026-06-02 flat lay : remonte l'URL image résolue au parent pour le collage. */
  onImageResolved?: (slot: string, imageUrl: string) => void;
  /** Brief 2026-05-28 (vedette) : carte 1ère pièce pleine largeur,
   *  ratio image 16/10 plus paysage que portrait pour bien remplir.
   *  Les autres restent en 4/5 portrait. */
  featured?: boolean;
  /** Fix 2026-05-31 (user screenshot bug total) : remonte le vrai
   *  prix du produit dès qu'il est résolu, pour que le total agrégé
   *  soit calculé sur les VRAIS prix et pas sur les tiers estimate. */
  onPriceResolved?: (pieceId: string, price: number) => void;
  /** Brief 2026-05-31 v8 (validation LLM) : remonte les métadonnées
   *  produit (marque/type/couleur/prix) pour permettre au parent de
   *  valider la cohérence globale de la tenue auprès de /api/validate-outfit. */
  onPieceMetaResolved?: (pieceId: string, meta: {
    slot: string;
    type: string;
    marque: string;
    couleur: string;
    prix_eur: number;
  }) => void;
  /** Brief 2026-06-07 COHÉRENCE DE TIER — plafond prix imposé par le parent
   *  quand cette pièce est un outlier (> 5× la médiane des autres). null sinon. */
  tierMaxPrice?: number | null;
}) {
  // Tentative MUJI réel — brief variété : on passe la VRAIE couleur de la
  // palette assignée à ce slot (color.hex) + un seed unique par slot.
  const mujiProduct = useMujiProduct(
    pieceToSlot(piece),
    color.hex,
    paletteRef || null,
    genre || null,
    style || null,
    seed || null,
    excludeIds || [],
    onPicked,
    selectedNamesStr,
    tierMaxPrice,
  );
  /* Quand le produit est résolu (prix réel arrivé), on remonte au parent. */
  useEffect(() => {
    if (mujiProduct?.prix && onPriceResolved) {
      onPriceResolved(piece, mujiProduct.prix);
    }
  }, [mujiProduct?.prix, piece, onPriceResolved]);

  /* Brief 2026-06-02 flat lay : remonte l'URL image au parent pour le collage CSS. */
  useEffect(() => {
    const slot = pieceToSlot(piece);
    const img = mujiProduct?.image;
    if (slot && img && onImageResolved) {
      onImageResolved(slot, img);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mujiProduct?.image, piece]);

  /* Brief 2026-05-31 v8 (Couche 6 validation LLM) : remonte les
     métadonnées complètes du produit (marque, type, couleur) pour que
     le parent puisse valider la tenue globale. */
  useEffect(() => {
    if (mujiProduct?.prix && onPieceMetaResolved) {
      onPieceMetaResolved(piece, {
        slot: pieceToSlot(piece) || piece,
        type: itemName,
        marque: mujiProduct.marque,
        couleur: mujiProduct.couleurNom || color.name,
        prix_eur: mujiProduct.prix,
      });
    }
  }, [mujiProduct?.prix, mujiProduct?.marque, mujiProduct?.couleurNom, piece, itemName, color.name, onPieceMetaResolved]);
  // Brief 2026-05-27 « afficher la VRAIE marque » :
  // On re-trie pour pousser les marchands directs (COS, Muji, Veja, Uniqlo,
  // Amazon · HUGO → HUGO…) en premier. L'Amazon GÉNÉRIQUE (label « Amazon »
  // tout court, sans brand) tombe en dernier — il ne servira qu'à défaut.
  // Conséquence : la headline est presque toujours une marque réelle.
  const sortedMerchants = [...merchants].sort((a, b) => {
    const aPure = isPureAmazon(a) ? 1 : 0;
    const bPure = isPureAmazon(b) ? 1 : 0;
    return aPure - bPure;
  });
  const primary = sortedMerchants[0];
  const others = sortedMerchants.slice(1);

  /* Règle 3 (brief 2026-05-31) — slot sans candidat affilié :
     aucune fiche produit affiliée réelle (mujiProduct) ET aucun marchand de
     recherche affilié (primary) → on NE remplit PAS le slot avec un faux lien
     (COS / Amazon / ~55 €). On affiche un état honnête : « pas encore chez nos
     partenaires », ce qui est vrai et pousse le client à revenir. */
  if (!mujiProduct && !primary) {
    /* Brief 2026-06-07 (design) — état vide adouci : avant, un aplat de
       couleur pleine saturation (110px) faisait « card cassée ». Maintenant
       un fond crème dégradé très léger teinté de la couleur cible + une
       pastille discrète + un libellé « Bientôt », pour signaler un
       placeholder honnête plutôt qu'un produit raté. */
    return (
      <article style={{
        background: "#FBF9F5",
        border: `1px dashed ${color.hex}55`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(30,30,30,.05)",
        display: "flex", flexDirection: "column",
        aspectRatio: featured ? undefined : "4 / 5",
      }}>
        <div aria-hidden style={{
          flex: 1,
          minHeight: 120,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 10,
          background: `linear-gradient(180deg, #fff 0%, ${color.hex}14 100%)`,
        }}>
          <span style={{
            width: 40, height: 40, borderRadius: "50%",
            background: color.hex, opacity: 0.85,
            boxShadow: "0 0 0 4px #ffffffcc, 0 2px 10px -2px rgba(30,30,30,.25)",
          }} />
          <span style={{
            fontFamily: "'Inter', sans-serif", fontSize: 9.5,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: textSecondary, fontWeight: 600,
          }}>
            Bientôt
          </span>
        </div>
        <div style={{ padding: "14px 16px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#A8B29A", margin: 0, fontWeight: 700 }}>
            {PIECE_LABELS[piece] || piece}
          </p>
          <p style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17, margin: "4px 0 0", lineHeight: 1.25, color: ink }}>
            {itemName}
          </p>
          <p style={{ marginTop: 8, fontSize: 12, color: textSecondary, fontStyle: "italic", lineHeight: 1.45 }}>
            Pas encore chez nos partenaires — on enrichit le catalogue chaque
            semaine.
          </p>
        </div>
      </article>
    );
  }

  // primary peut être absent si mujiProduct est présent (fiche produit réelle).
  // On garde tout accès à `primary` sous garde pour ne jamais déréférencer null.
  const brand = primary ? brandLabel(primary) : "";
  // Marchand de recherche = pas de prix produit → « Prix sur le site » (jamais
  // un montant inventé). Le vrai prix MUJI/TBF est affiché via mujiProduct.prix.
  const price = primary ? priceEstimate(primary) : "Prix sur le site";
  const via = primary ? viaLabel(primary) : null;

  return (
    <article
      className={featured ? "wada-piece-card wada-piece-card--featured" : "wada-piece-card"}
      style={{
        position: "relative",
        background: "#FBF9F5",
        border: `1px solid ${border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(30,30,30,.06)",
        display: "flex",
        /* Brief 2026-06-07 (design) — la pièce centrale passe en HÉRO
           2 colonnes (image | détails) sur desktop au lieu d'une image
           16/10 pleine largeur qui laissait le packshot flotter dans un
           grand vide. Sur mobile, on retombe en colonne (cf. media query). */
        flexDirection: featured ? "row" : "column",
        transition: "transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s ease",
      }}
    >
      {/* Tag « Pièce centrale » sur la vedette (brief Page tenue V2 §7). */}
      {featured && (
        <span style={{
          position: "absolute", top: 14, left: 14, zIndex: 6,
          background: "#6B3A32", color: "#fff",
          fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "5px 11px", borderRadius: 999,
          boxShadow: "0 2px 8px -2px rgba(30,30,30,0.3)",
        }}>
          Pièce centrale
        </span>
      )}
      {/* JSON-LD Product schema — brief maître 2026-05-28 P4.19 :
          Google Shopping enriche les résultats avec image + prix + dispo.
          On émet un Product par card quand un vrai produit MUJI est posé. */}
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
              description: `${PIECE_LABELS[piece] || piece} ${color.name} — ${mujiProduct.marque}`,
              brand: { "@type": "Brand", name: mujiProduct.marque },
              category: PIECE_LABELS[piece] || piece,
              color: color.name,
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
      {/* Visuel top — brief 2026-05-28 (harmonisation) :
          ratio 4/5 identique pour TOUTES les cards, image edge-to-edge
          via object-fit:cover (plus de padding qui créait l'effet
          « boîte dans une boîte »). object-position: center 20% recadre
          sur le buste/vêtement pour les photos mannequin. Fond #FBF9F5
          uniforme — les packshots détourés se fondent dans la card. */}
      {mujiProduct ? (
        <div
          className="wada-piece-photo"
          aria-hidden
          style={{
            // Brief 2026-06-07 (design héro) — Vedette : colonne image à
            // largeur fixe (~46%) et ratio portrait 4/5, à côté des détails.
            // Card normale : 4/5 portrait pleine largeur.
            ...(featured
              ? { flex: "0 0 46%", aspectRatio: "4 / 5", borderRadius: "16px 0 0 16px" }
              : { aspectRatio: "4 / 5", borderRadius: "16px 16px 0 0" }),
            // Fond dégradé blanc → couleur dominante de la pièce
            // (brief Page tenue V2 §7) : le fond « raconte » le produit.
            background: `linear-gradient(180deg, #fff 0%, ${(mujiProduct?.couleurHex || color.hex)}26 100%)`,
            overflow: "hidden",
          }}
        >
          <img
            src={mujiProduct.image}
            alt={mujiProduct.nom}
            loading="lazy"
            style={{
              width: "100%", height: "100%",
              /* Brief 2026-05-30 : passé de `cover` à `contain` pour
                 préserver l'intégralité de la photo. Les shoots TBF
                 sont des portraits full-body (modèle), avec `cover` le
                 crop tombait sur le visage du modèle au lieu du
                 vêtement (ex. hoodie Bathing Ape camo où on voyait
                 surtout le visage). `contain` garde toute la photo
                 visible — les bandes éventuelles se fondent dans le
                 background crème #FBF9F5 de la card. */
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              padding: "8px",
              transition: "transform 0.35s cubic-bezier(.22,1,.36,1)",
            }}
          />
        </div>
      ) : (
        /* Brief 2026-06-01 (audit point 9 — squelettes loading) :
           pendant que useMujiProduct fetch le produit (1-2s sur réseau
           normal), on affichait un aplat couleur palette. Maintenant :
           skeleton shimmer + pastille couleur palette en watermark
           subtil au centre. Donne un signal visuel clair « chargement
           en cours » au lieu d'une carte qui semble figée. */
        <div
          aria-hidden
          className="wada-skeleton"
          style={{
            /* Brief 2026-06-07 (design héro) — skeleton aligné sur le
               nouveau layout : colonne 46% ratio 4/5 pour la vedette. */
            ...(featured
              ? { flex: "0 0 46%", aspectRatio: "4 / 5", borderRadius: "16px 0 0 16px" }
              : { aspectRatio: "4 / 5", borderRadius: "16px 16px 0 0" }),
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 48, height: 48,
            borderRadius: "50%",
            background: color.hex,
            transform: "translate(-50%, -50%)",
            opacity: 0.35,
            border: "1px solid rgba(255,255,255,0.4)",
          }} />
        </div>
      )}

      {/* Body — Brief 2026-06-07 (design héro) : sur la vedette, le bloc
          détails occupe la colonne droite et se centre verticalement avec
          plus d'air. Sur les cards normales, comportement inchangé. */}
      <div style={{
        padding: featured ? "28px clamp(20px, 3vw, 36px)" : "14px 16px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: featured ? "center" : "flex-start",
        minWidth: 0,
      }}>
        {/* Brief Muji §9 : si on a un vrai produit MUJI, on affiche son
            NOM RÉEL en headline (« T-shirt à manches courtes col rond »)
            plutôt que le libellé générique du moteur (« Chemise oxford »).
            Sinon on garde le libellé moteur. La pastille de couleur reste
            en petit, à côté du label catégorie. */}
        <p style={{
          fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "#A8B29A", margin: 0, fontWeight: 700,
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          {/* Pastille couleur — brief §9 : « garder la pastille de couleur
              en petit, à côté du nom »

              Brief UX client v2 (26/05) — verbatim : « erreur de couleur
              proposer ». Si on a un VRAI produit MUJI, la pastille prend
              la couleur du produit (couleurHex inféré du flux Awin), PAS
              celle de la palette intent. Sinon l'utilisateur voit une
              pastille noire à côté d'un pull beige → confusion totale. */}
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 10, height: 10, borderRadius: "50%",
              background: mujiProduct?.couleurHex || color.hex,
              boxShadow: "0 0 0 1px rgba(30,30,30,.12)",
              flexShrink: 0,
            }}
          />
          <span>{PIECE_LABELS[piece] || piece}</span>
          {/* Brief UX client v2 (26/05) — l'étiquette affichait
              « HAUT · NOIR » alors que le produit MUJI réel était beige.
              Règle : quand mujiProduct est chargé, on n'affiche le nom de
              couleur QUE si couleurNom est non-vide (sinon l'utilisateur
              voit l'intention palette qui ne correspond pas à la photo).
              Sans mujiProduct chargé, on retombe sur l'intention palette
              comme avant (état placeholder cohérent). */}
          {(mujiProduct ? mujiProduct.couleurNom : color.name) && (
            <span style={{ color: textSecondary, fontWeight: 500 }}>
              · {/* Brief 2026-06-01 : certains flux TBF ont couleurNom =
                   "BROWN D4B35,ENCRE" (deux couleurs concaténées). On prend
                   le premier mot/segment avant la virgule ou le code hex. */
                (mujiProduct?.couleurNom || color.name)
                  .split(/,|\s+[0-9A-F]{4,}/i)[0]
                  .trim()
              }
            </span>
          )}
        </p>
        {/* Nom — réel quand MUJI dispo, générique sinon. 2 lignes max. */}
        <p
          className="wada-piece-name"
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 500, fontSize: 17, margin: "4px 0 0",
            lineHeight: 1.25, color: ink,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "calc(1.25em * 2)",
          }}
        >
          {mujiProduct ? mujiProduct.nom : itemName}
        </p>

        {/* ─── Bloc marchand primaire — brique structurée ─── */}
        {/* Brief 2026-06-07 (design héro) : sur la vedette (layout row,
            corps centré verticalement), on NE pousse PAS le bloc marchand
            en bas (marginTop auto) — sinon un grand vide se crée entre le
            nom et le bouton. On le garde groupé avec le titre, le tout
            centré. Sur les cards normales, marginTop auto aligne les
            boutons en bas de carte. */}
        <div style={{
          marginTop: featured ? 16 : "auto",
          paddingTop: 12,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.65)",
            border: `1px solid ${border}`,
            borderRadius: 12,
            padding: "12px 14px",
          }}>
            {/* Ligne 1 : MARQUE en gros — quand un VRAI produit MUJI est
                trouvé via /api/products, on l'affiche en headline. Sinon
                on retombe sur le brand extrait du ranking Amazon
                (« HUGO », « COS », etc.) ou « Amazon » en dernier ressort. */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 17, fontWeight: 700,
              color: ink, margin: 0, lineHeight: 1.1,
              letterSpacing: "-0.005em",
            }}>
              {mujiProduct ? mujiProduct.marque : brand}
            </p>
            {/* Brief Muji §9 : le nom MUJI est désormais le headline de la
                card (au-dessus). Plus de subtitle redondant ici. */}
            {/* Ligne 2 : origine — soit « via Awin » pour MUJI réel,
                soit pastille Amazon « a » + « via Amazon » sinon. */}
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              marginTop: 4,
            }}>
              {mujiProduct ? (
                <span style={{
                  fontSize: 11, color: textSecondary,
                  fontStyle: "italic", fontFamily: "'Inter', sans-serif",
                }}>
                  {/* Brief 2026-05-30 : label dynamique selon le vrai
                      marchand (MUJI France ou The Business Fashion ou
                      autre flux futur). Fallback « MUJI » si pas dispo. */}
                  via Awin · {mujiProduct.marchand || "MUJI"} partenaire
                </span>
              ) : (isAmazonLinked(primary) || via) ? (
                <>
                  {isAmazonLinked(primary) && <AmazonAaChip size={14} />}
                  <span style={{
                    fontSize: 11, color: textSecondary,
                    fontStyle: "italic", fontFamily: "'Inter', sans-serif",
                  }}>
                    {isAmazonLinked(primary) ? "via Amazon" : via}
                  </span>
                </>
              ) : null}
            </div>
            {/* Ligne 3 : prix accent — réel (MUJI) ou estimation (Amazon) */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 16, fontWeight: 700,
              color: mojo, margin: "8px 0 0",
              letterSpacing: "-0.005em",
            }}>
              {mujiProduct
                ? `${formatPrice(mujiProduct.prix)} ${mujiProduct.devise === "EUR" ? "€" : mujiProduct.devise}`
                : price}
            </p>
            {/* Ligne 4 : bouton Acheter — deep-link MUJI (rel sponsored) ou
                lien Amazon affilié selon la source. */}
            <a
              href={mujiProduct ? mujiProduct.url : primary.url}
              target="_blank"
              rel="noopener nofollow sponsored"
              style={{
                display: "block",
                marginTop: 10,
                textAlign: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                background: ink, color: "#FAF8F4",
                borderRadius: 999,
                padding: "10px 14px",
                letterSpacing: "0.01em",
              }}
            >
              {/* Brief 2026-05-30 : label dynamique selon le marchand réel.
                  Avant : « Acheter sur MUJI » même pour les produits TBF
                  (Brunello, Tom Ford…) → confusion utilisateur qui pensait
                  cliquer sur MUJI et atterrissait sur The Business Fashion.
                  Maintenant : « Acheter sur {marchand} » qui reflète le
                  marchand affilié réel. */}
              {mujiProduct
                ? `Acheter sur ${mujiProduct.marchand || "MUJI"} →`
                : "Acheter →"}
            </a>
            {/* Brief finition (24/05) §7 — transparence affiliation :
                la divulgation footer ne suffit pas, on indique aussi
                directement sous chaque CTA d'achat que le lien est
                tracké en partenariat. Discret (10px gris), pas
                d'astérisque ni de pop-up. */}
            <p style={{
              margin: "6px 0 0",
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
              fontSize: 10,
              fontStyle: "italic",
              color: textSecondary,
              letterSpacing: "0.02em",
            }}>
              Lien partenaire — prix identique chez le marchand
            </p>
          </div>

          {/* « + autres marchands » repliable — brief 2026-05-27 :
              option discrète pour comparer sans dominer la carte. */}
          {others.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{
                fontSize: 12, color: textSecondary, cursor: "pointer",
                listStyle: "none",
                fontFamily: "'Inter', sans-serif",
              }}>
                + {others.length} autre{others.length > 1 ? "s" : ""} marchand{others.length > 1 ? "s" : ""}
              </summary>
              <ul style={{
                listStyle: "none", padding: "8px 0 0", margin: 0,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                {others.map((m, i) => {
                  const b = brandLabel(m);
                  const p = priceEstimate(m);
                  const amz = isAmazonLinked(m);
                  return (
                    <li key={i}>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener nofollow sponsored"
                        style={{
                          display: "flex", justifyContent: "space-between",
                          alignItems: "center", gap: 8,
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.45)",
                          border: `1px solid ${border}`,
                          borderRadius: 10,
                          color: ink, textDecoration: "none",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12.5,
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {amz && <AmazonAaChip size={13} />}
                          <span style={{ fontWeight: 600 }}>{b}</span>
                        </span>
                        <span style={{ color: textSecondary }}>{p}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}

/* ReassuranceItem retiré avec le bloc réassurance (user 2026-06-07). */

const chipReadOnlyStyle = {
  fontFamily: fontLabel, fontSize: 11, fontWeight: 500,
  letterSpacing: "0.04em", color: ink, padding: "2px 0",
};

/** Chip "DNA" pour la section direction artistique — silhouette, matières,
    référence. Plus structuré que chipReadOnlyStyle (a un fond + bordure). */
const dnaChipStyle = {
  fontFamily: fontLabel, fontSize: 11, fontWeight: 500,
  letterSpacing: "0.03em", color: ink,
  padding: "6px 12px",
  border: `1px solid ${border}`,
  borderRadius: 999,
  background: "rgba(255,255,255,0.6)",
  whiteSpace: "nowrap" as const,
} as const;
