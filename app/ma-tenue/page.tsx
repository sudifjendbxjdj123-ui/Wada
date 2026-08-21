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
import Image from "next/image";
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
  type RegistreOutfit, type RegistreSlot, type SlotKey,
} from "@/lib/registreEngine";
import { scoreTenue } from "@/lib/composer/scoreTenue";
import type { SaisonTendance } from "@/lib/tendances2026";
import { merchantsForPiece } from "@/lib/merchantsForPiece";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, paper, subtle, border, mojo, seal, cardBg,
  textSecondary, fontHeading, fontBody, fontLabel,
  cardRadius, sectionLabel,
} from "@/lib/styles";
import ExternalLink from "@/components/ExternalLink";
import Reveal from "@/components/Reveal";
import { type ProduitLook } from "@/components/LookComplet";
import TenueHero from "@/components/TenueHero";
import ListePieces from "@/components/ListePieces";
import RemplacerDrawer from "@/components/RemplacerDrawer";
import ShopperLaTenue from "@/components/ShopperLaTenue";
import { AccordeonPourquoi, UtilisationPalette } from "@/components/TenueSections";
import VariantesTenue from "@/components/VariantesTenue";
import SimilairesTenue from "@/components/SimilairesTenue";
import { showToast } from "@/lib/toast";
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

/* Repères affichés sous la palette : « Minimal · Casual chic · Regular ».
   Le vocabulaire interne (« quotidien », « sorties ») n'est pas celui qu'on
   montre à un client. */
/* Libellé de saison affiché en pastille. Le profil stocke « Hiver » / « Été »
   / « Mi-saison » ; on montre la période, plus parlante qu'un mot seul. */
const SAISON_CHIP: Record<string, string> = {
  "Hiver": "Automne / Hiver",
  "Été": "Printemps / Été",
  "Mi-saison": "Mi-saison",
  "Toute saison": "Toute saison",
};

const OCCASION_LABEL: Record<string, string> = {
  quotidien: "Casual chic",
  bureau: "Bureau",
  sorties: "Sortie",
  voyage: "Voyage",
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

/** Nom de la tenue, éditable au crayon (maquette 2026-08-23). Par défaut le
    nom de la palette ; le nom choisi est mémorisé par palette et survit au
    rechargement. Le champ vide restaure le défaut plutôt que d'afficher un
    titre blanc. */
function NomTenueEditable({ cle, defaut }: { cle: string; defaut: string }) {
  const [nom, setNom] = useState(defaut);
  const [edition, setEdition] = useState(false);

  useEffect(() => {
    try {
      const memorise = localStorage.getItem(cle);
      if (memorise) setNom(memorise);
    } catch {}
  }, [cle]);

  const valider = (v: string) => {
    const propre = v.trim().slice(0, 60);
    setEdition(false);
    if (!propre || propre === defaut) {
      setNom(defaut);
      try { localStorage.removeItem(cle); } catch {}
      return;
    }
    setNom(propre);
    try { localStorage.setItem(cle, propre); } catch {}
  };

  const styleTitre: React.CSSProperties = {
    fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
    fontSize: "clamp(30px, 5.4vw, 52px)",
    letterSpacing: "-0.02em", color: ink, lineHeight: 1.05,
  };

  if (edition) {
    return (
      <input
        autoFocus
        defaultValue={nom}
        aria-label="Nom de la tenue"
        maxLength={60}
        onBlur={(e) => valider(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") valider((e.target as HTMLInputElement).value);
          if (e.key === "Escape") setEdition(false);
        }}
        style={{
          ...styleTitre, width: "100%", textAlign: "center",
          background: "transparent", border: "none", outline: "none",
          borderBottom: `2px solid ${border}`, margin: "0 0 6px", padding: 0,
        }}
      />
    );
  }

  return (
    <h1 style={{ ...styleTitre, margin: "0 0 6px" }}>
      {nom}
      <button
        type="button"
        onClick={() => setEdition(true)}
        aria-label="Renommer la tenue"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: textSecondary, marginLeft: 10, padding: 4,
          verticalAlign: "middle",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
    </h1>
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
  /* Fix 2026-08-21 : `?genre=` était construit par le questionnaire de
     /palette/[number] et par les liens catégorie, mais jamais lu ici — la
     réponse « Pour qui » du client était donc perdue, et la tenue composée
     avec le genre du profil. Le commentaire de la résolution du genre, plus
     bas, affirmait pourtant que « les query params explicites gagnent ». On
     applique ce qui était annoncé. */
  const overrideGenre = searchParams.get("genre");
  /* Questionnaire /palette/[number] (spec 2026-08-21) : budget plafond,
     niveau d'audace traduit en `envie`, et « une chose à éviter ». Aucun des
     trois n'était transmis jusqu'ici — les réponses étaient collectées puis
     perdues. Ils descendent maintenant jusqu'à /api/products. */
  const overrideMaxPrice = searchParams.get("maxPrice");
  const overrideEnvie = searchParams.get("envie");
  const overrideExclude = searchParams.get("exclude");

  const [prefs, setPrefs] = useState<WadaPrefs>(DEFAULT_PREFS);
  /* Saison déclarée par le client (questionnaire /palette/[number] ou
     /compte). Lue une fois au mount avec le reste du profil ; sert à noter
     la cohérence saisonnière des matières de la tenue. */
  const [profileSaison, setProfileSaison] = useState<string | null>(null);
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

  /* PERF 2026-06-11 (« attente trop longue ») — préfetch de TOUTE la tenue en
     UNE requête /api/outfit, au lieu des 5 fetches /api/products simultanés
     que lançaient les 5 cartes (5 cold starts serverless → mur ~5s). Chaque
     carte reçoit son produit pré-résolu via la prop `prefetched` et n'émet
     plus son propre fetch. Si /api/outfit échoue, `outfitPrefetch` reste null
     → les cartes fetchent elles-mêmes (fallback legacy). Type produit = produit
     formaté /api/products (identique à ce que chaque carte recevait). */
  type PrefetchedProduct = {
    id: string; nom: string; marque?: string; marchand?: string;
    marchandSlug?: string; tailles?: string[]; imageLocal?: string; largeImage?: string;
    image?: string; prix: number; devise: string; urlProduit: string;
    couleurNom?: string; hex: string;
  };
  const [outfitPrefetch, setOutfitPrefetch] = useState<Record<string, PrefetchedProduct> | null>(null);
  /* Tant que le préfetch tenue est EN COURS, les cartes ne lancent PAS leur
     propre fetch (sinon on relance les 5 GET /api/products = le cold-start
     qu'on veut justement éviter). Passe à false dès que /api/outfit répond
     (succès OU échec) ou au timeout de secours → fallback fetch par carte. */
  const [prefetchPending, setPrefetchPending] = useState(true);
  const prefetchSigRef = useRef<string>("");

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
      const parsed = JSON.parse(raw);
      // Validate anchor data structure
      if (
        parsed &&
        typeof parsed.slot === "string" &&
        typeof parsed.type === "string" &&
        typeof parsed.couleur === "string"
      ) {
        setAnchor(parsed as AnchorData);
      }
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
      /* Morphologie : deux écrans la demandent, avec deux vocabulaires.
         `wada-prefs.morpho` (panneau de personnalisation, slugs) est
         prioritaire car c'est le réglage le plus récent du client ; sinon on
         reprend celle de /compte (`wada.profile.morphologie`, libellés).
         Object.assign ci-dessus écrase toujours `morpho`, même avec une
         chaîne vide — d'où ce repli placé APRÈS, et non avant. */
      if (!initial.morpho && typeof profile?.morphologie === "string") {
        initial.morpho = profile.morphologie;
      }
      if (typeof profile?.saison === "string") setProfileSaison(profile.saison);
      // Overrides URL — gagnent sur localStorage pour cette session
      if (overrideStyle) initial.style = overrideStyle;
      if (overrideOccasion) initial.occasion_focus = overrideOccasion;
      if (overrideGenre === "femme" || overrideGenre === "homme" || overrideGenre === "unisexe") {
        initial.gender = overrideGenre;
      }
      const mp = parseInt(overrideMaxPrice || "", 10);
      if (Number.isFinite(mp) && mp > 0) initial.budget = mp;
      setPrefs(initial);
    } catch { /* ignore */ }
    setHydrated(true);
  }, [overrideStyle, overrideOccasion, overrideGenre, overrideMaxPrice]);

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
      /* Le moteur normalise lui-même les deux vocabulaires (slug ou
         libellé) — on lui passe la valeur telle qu'elle est stockée. */
      morphologie: prefs.morpho || null,
    });
    // Validation dev — Streetwear ne doit jamais avoir blazer/derbies
    if (typeof window !== "undefined") {
      const v = validateOutfit(out);
      if (!v.ok) console.warn("[registreEngine] violations :", v.errors);
    }
    return out;
  }, [entry, prefs.style, prefs.fit, prefs.occasion_focus, prefs.gender, prefs.morpho]);

  /* Note de composition sur 100 (barème brief 2026-08-21). Elle juge le PLAN
     de tenue — couleurs, proportions, styles, occasion, matières, saison,
     accessoire — donc avant même d'aller chercher les produits marchands.
     Affichée au client avec son point faible : une note sans explication ne
     sert à rien. */
  const noteTenue = useMemo(() => {
    if (!registreOutfit) return null;
    const saison: SaisonTendance | null =
      profileSaison === "Hiver" ? "AH"
      : profileSaison === "Été" ? "PE"
      : null;   // « Mi-saison » et « Toute saison » ne tranchent pas
    return scoreTenue(registreOutfit, { saison });
  }, [registreOutfit, profileSaison]);

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

  /* Remplacements manuels : slot → produit choisi par le client via ↻.
     Ils PRIMENT sur le préfetch — c'est un choix explicite, il ne doit pas
     être écrasé au prochain rendu. Vidés quand la palette change, sinon on
     garderait une veste choisie pour une autre tenue. */
  const [remplacements, setRemplacements] = useState<Partial<Record<SlotKey, PrefetchedProduct>>>({});
  const [favorisPieces, setFavorisPieces] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRemplacements({});
  }, [entry?.number]);

  /* « Remplacer une pièce » — demande explicite du client : « et surtout, le
     reste de la tenue ne change pas ». On refait donc UNE requête, pour CE
     slot seulement, en excluant le produit courant et en changeant la graine.
     Les mêmes paliers de relâchement que les cartes : sans eux, un slot
     étroit (couleur rare) renvoyait vide et le ↻ semblait cassé. */
  /* ── Refonte 2026-08-23 : état de la page « Shop the Look » ── */
  /* Tailles choisies par slot — rappelées dans le récap d'achat. */
  const [taillesChoisies, setTaillesChoisies] = useState<Partial<Record<SlotKey, string>>>({});
  const choisirTaille = useCallback((slot: SlotKey, t: string) => {
    setTaillesChoisies((prev) => ({ ...prev, [slot]: t }));
  }, []);
  /* Slot dont le tiroir « Remplacer » est ouvert. */
  const [slotDrawer, setSlotDrawer] = useState<SlotKey | null>(null);
  /* Signal d'ouverture du récap d'achat depuis le CTA du hero. */
  const [signalShopper, setSignalShopper] = useState(0);
  /* Tenue sauvegardée (localStorage) — le marque-page du hero. */
  const [sauvegardee, setSauvegardee] = useState(false);

  /* L'ancien remplacement « à l'aveugle » (remplacerPiece) est parti avec la
     refonte 2026-08-23 : le tiroir RemplacerDrawer laisse le client CHOISIR
     parmi des alternatives, au lieu de subir la pièce suivante du classement. */

  const basculerFavori = useCallback((id: string) => {
    setFavorisPieces((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id); else suivant.add(id);
      return suivant;
    });
  }, []);

  /* Produits résolus, indexés par slot — la vue « look complet » et la barre
     d'achat lisent le MÊME préfetch que les fiches détaillées, pour qu'un
     prix affiché en haut soit celui de la carte plus bas. Tant que le
     préfetch n'a pas répondu, les vignettes montrent la teinte prévue. */
  const produitsParSlot = useMemo<Partial<Record<SlotKey, ProduitLook | null>>>(() => {
    const out: Partial<Record<SlotKey, ProduitLook | null>> = {};
    for (const [slot, p] of Object.entries(outfitPrefetch ?? {})) {
      if (p) out[slot as SlotKey] = p as ProduitLook;
    }
    /* Un remplacement manuel écrase le produit pré-résolu de son slot. */
    for (const [slot, p] of Object.entries(remplacements)) {
      if (p) out[slot as SlotKey] = p as ProduitLook;
    }
    return out;
  }, [outfitPrefetch, remplacements]);

  /* Repli si /api/outfit a échoué (refonte 2026-08-23) : avant, chaque
     grande fiche re-fetchait son produit — ces fiches n'existent plus. Si le
     préfetch aboutit à rien, on refait le travail ici, slot par slot, pour
     que le hero ne reste pas en squelette. */
  const fallbackLance = useRef(false);
  useEffect(() => {
    if (prefetchPending || outfitPrefetch || fallbackLance.current) return;
    if (!entry || composition.length === 0) return;
    fallbackLance.current = true;
    let cancelled = false;
    (async () => {
      const map: Record<string, PrefetchedProduct> = {};
      for (const piece of composition) {
        const color = piece._slot?.color || entry.colors[0];
        const sp = new URLSearchParams({
          slot: piece.piece, limit: "1", palette: entry.number,
          seed: `${entry.number}-${piece.piece}-fallback`,
        });
        if (color?.hex) sp.set("color", color.hex);
        if (userGender) sp.set("genre", userGender);
        if (prefs.style) sp.set("style", prefs.style);
        try {
          const r = await fetch(`/api/products?${sp}`);
          if (!r.ok) continue;
          const d = await r.json();
          if (d?.products?.[0]) map[piece.piece] = d.products[0];
        } catch { /* réseau : slot suivant */ }
        if (cancelled) return;
      }
      if (!cancelled && Object.keys(map).length > 0) setOutfitPrefetch(map);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchPending, outfitPrefetch, entry?.number, composition.length]);



  /* PERF 2026-06-11 — déclenche le préfetch tenue (1 requête /api/outfit) dès
     que la composition est prête. On réplique EXACTEMENT les params que chaque
     carte aurait envoyés (slot, color=_slot.color.hex, seed, + saison/occasion/
     envie partagés), pour que les produits pré-résolus soient identiques à un
     fetch par carte. Re-fetch seulement si la signature (palette/genre/style/
     slots) change. La re-sélection tier (outlier prix) reste gérée par carte. */
  useEffect(() => {
    /* Pas encore prête (entry/dico en cours) : on NE touche PAS à
       prefetchPending. Aucune carte n'est montée tant que composition est
       vide, et on doit garder le gate FERMÉ (pending=true initial) pour que,
       quand les cartes montent, elles attendent le préfetch au lieu de
       lancer leurs 5 GET. On ne débloque QUE via un vrai aboutissement de
       /api/outfit (succès/échec/timeout) ci-dessous. */
    if (!entry || composition.length === 0) return;
    const sig = JSON.stringify({
      p: entry.number, g: userGender, s: prefs.style || "",
      slots: composition.map((c) => c.piece),
    });
    if (prefetchSigRef.current === sig) return;
    prefetchSigRef.current = sig;

    let cancelled = false;
    setPrefetchPending(true);
    /* Filet de sécurité : si /api/outfit traîne (> 8s, ex. cold start lent),
       on débloque les cartes pour qu'elles fetchent elles-mêmes plutôt que
       rester en skeleton indéfiniment. */
    const safety = setTimeout(() => { if (!cancelled) setPrefetchPending(false); }, 8000);
    const done = () => { if (!cancelled) { clearTimeout(safety); setPrefetchPending(false); } };
    let season: string | undefined, occasion: string | undefined, envie: string | undefined;
    try {
      const profileRaw = localStorage.getItem("wada.profile");
      if (profileRaw) {
        const pr = JSON.parse(profileRaw);
        if (pr?.saison === "Hiver") season = "hiver,automne";
        else if (pr?.saison === "Été") season = "été,printemps";
        else if (pr?.saison === "Mi-saison") season = "automne,printemps";
      }
    } catch {}
    try {
      const urlOcc = new URLSearchParams(window.location.search).get("occasion");
      if (urlOcc) occasion = urlOcc;
    } catch {}
    try {
      const moodRaw = localStorage.getItem("wada.mood");
      if (moodRaw) {
        const mood = JSON.parse(moodRaw);
        const today = new Date().toISOString().slice(0, 10);
        if (mood?.date === today && mood?.perception) {
          const ENVIE_MAP: Record<string, string> = {
            "Élégant": "elegant", "Créatif": "creatif", "Accessible": "confortable",
            "Autoritaire": "affirme", "Séduisant": "affirme", "Mystérieux": "discret",
          };
          envie = ENVIE_MAP[mood.perception];
        }
      }
    } catch {}
    /* Le niveau d'audace choisi dans le questionnaire est plus explicite
       qu'un mood chip posé un autre jour : il l'emporte. */
    if (overrideEnvie) envie = overrideEnvie;

    const slots = composition.map((piece) => {
      const s = piece._slot;
      const color = s?.color || entry.colors[0];
      return {
        slot: piece.piece,
        color: color?.hex,
        seed: `${entry.number}-${piece.piece}-${prefs.style || "default"}`,
      };
    });
    const body = {
      slots, palette: entry.number,
      genre: userGender || undefined,
      style: prefs.style || undefined,
      season, occasion, envie,
      /* Budget TOTAL de la tenue : /api/outfit le répartit entre les slots et
         recalcule après chaque pièce. On n'envoie plus `maxPrice`, qui était
         un plafond PAR PIÈCE — le total annoncé pouvait être dépassé d'un
         facteur 5. */
      budgetTotal: prefs.budget && prefs.budget > 1 ? prefs.budget : undefined,
      exclude: overrideExclude || undefined,
    };
    fetch("/api/outfit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { slots?: Array<{ slot: string; product: PrefetchedProduct | null }> } | null) => {
        if (cancelled) return;
        if (d?.slots) {
          const map: Record<string, PrefetchedProduct> = {};
          for (const s of d.slots) if (s.product) map[s.slot] = s.product;
          setOutfitPrefetch(map);
        }
        done();
      })
      .catch(() => { done(); /* échec → cartes en fallback fetch */ });
    return () => { cancelled = true; clearTimeout(safety); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.number, userGender, prefs.style, composition.length]);

  /* Refonte 2026-08-23 : les PieceCards qui remontaient prix et méta par
     callback n'existent plus. Les mêmes états sont désormais dérivés de la
     source unique `produitsParSlot`, pour que la validation LLM (Couche 6)
     et le plafond de tier continuent de fonctionner à l'identique. */
  useEffect(() => {
    for (const [slot, prod] of Object.entries(produitsParSlot)) {
      if (!prod) continue;
      handlePriceResolved(slot, prod.prix || 0);
      handlePieceResolved(slot, {
        slot,
        type: prod.nom,
        marque: prod.marque || "",
        couleur: prod.couleurNom || "",
        prix_eur: prod.prix || 0,
      });
    }
  }, [produitsParSlot, handlePriceResolved, handlePieceResolved]);

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
      {/* Compacté (retour client 2026-08-21) : « le texte prend beaucoup de
          place et repousse les vêtements très bas. Sur mobile, l'utilisateur
          doit scroller avant même de comprendre à quoi ressemble la tenue. »
          Le kicker et les marges passent de 48/18/22 px à 28/10/14, et les
          swatches de 84×50 à 60×38 — la tenue remonte d'environ 120 px. */}
      <section className="wada-tenue-tete" style={{ padding: "28px 5% 0" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: mojo, fontWeight: 700, letterSpacing: "0.4em", marginBottom: 10 }}>
              Votre tenue, sélectionnée pour vous
            </p>
            {/* Nom de la tenue, ÉDITABLE (maquette : crayon à côté du nom).
                Par défaut le nom de la palette — déjà une signature — et le
                nom choisi survit au rechargement, par palette. */}
            <NomTenueEditable cle={`wada.tenue.nom.${entry.number}`} defaut={entry.name} />

            {/* Brief 2026-06-07 (design) — barre nuancier : remplace
                l'ancien sous-titre italique « X · Y · Z » + les pastilles
                rondes flottantes (redondants) par une rangée de swatches
                NOMMÉS, type carte nuancier de coloriste. */}
            <div style={{
              display: "flex", justifyContent: "center", flexWrap: "wrap",
              gap: 10, marginTop: 14,
            }}>
              {entry.colors.slice(0, 5).map((c, i) => (
                <div key={`${c.hex}-${i}`} style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                }}>
                  <span aria-hidden style={{
                    width: 60, height: 38, borderRadius: 10,
                    background: c.hex,
                    boxShadow: "inset 0 0 0 1px rgba(30,30,30,.08), 0 6px 16px -12px rgba(30,30,30,.5)",
                  }} />
                  <span style={{
                    fontFamily: fontLabel, fontSize: 9.5,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: textSecondary, fontWeight: 600,
                  }}>
                    {c.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Ligne de repères demandée par le client : « Minimal · Casual
                chic · Regular », juste sous la palette. Elle remplace le
                paragraphe éditorial en tête de page, qui disait la même
                chose en quatre lignes. */}
            {/* Repères en pastilles (maquette 2026-08-22) plutôt qu'une ligne
                de texte : c'est cliquable à l'œil, ça se lit en diagonale, et
                la saison y trouve sa place — elle était collectée par le
                questionnaire et n'apparaissait nulle part sur cette page. */}
            {registreOutfit && (
              <div style={{
                display: "flex", justifyContent: "center", flexWrap: "wrap",
                gap: 6, margin: "12px 0 0",
              }}>
                {[
                  registreOutfit.registre,
                  OCCASION_LABEL[registreOutfit.occasion] ?? registreOutfit.occasion,
                  registreOutfit.slots.find((sl) => sl.slot === "haut")?.fit,
                  profileSaison ? SAISON_CHIP[profileSaison] ?? profileSaison : null,
                ].filter(Boolean).map((t) => (
                  <span key={String(t)} style={{
                    /* Serrées pour tenir sur UNE ligne en 393 px : à 12,5 px
                       et 13 px de padding, la quatrième pastille passait à la
                       ligne et cassait le rythme sous la palette. */
                    padding: "5px 10px", borderRadius: 999,
                    border: `1px solid ${border}`, background: "rgba(255,255,255,.5)",
                    fontFamily: fontBody, fontSize: 11.5, color: seal,
                    textTransform: "capitalize", whiteSpace: "nowrap",
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          AI EDITORIAL — image(s) générées via FLUX avec prompt WADA × Claude
          (Fashion Director / Anti-kitsch). Sert de hero visuel principal —
          montre concrètement la tenue construite, pas juste une grille de
          photos détourées.
          ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
          NOTE DE COMPOSITION — brief client 2026-08-21.
          Placée après la phrase de direction artistique et AVANT les pièces :
          le client lit d'abord l'intention, puis ce qu'elle vaut, puis le
          détail des pièces.
          ═══════════════════════════════════════════════════════════════ */}
      {registreOutfit && (
        <section className="wada-tenue-look" style={{ padding: "0 5% 20px" }} id="votre-tenue">
          <Reveal offset={0}>
            {/* id `tenue-hero` : la barre sticky de ShopperLaTenue attend que
                ce bloc soit sorti de l'écran avant d'apparaître — deux CTA
                identiques à quelques pixels d'écart font doublon. */}
            <div id="tenue-hero">
              <TenueHero
                outfit={registreOutfit}
                produits={produitsParSlot}
                note={noteTenue}
                onShopper={() => setSignalShopper((n) => n + 1)}
                sauvegardee={sauvegardee}
                onSauvegarder={() => {
                  /* Marque-page local : la tenue re-composable (palette,
                     style, pièces du moment). Pas de compte requis. */
                  try {
                    const cle = "wada.tenues.sauvees";
                    const brut = localStorage.getItem(cle);
                    const liste: Array<{ palette: string }> = brut ? JSON.parse(brut) : [];
                    const deja = liste.findIndex((t) => t.palette === entry.number);
                    if (sauvegardee && deja >= 0) {
                      liste.splice(deja, 1);
                      localStorage.setItem(cle, JSON.stringify(liste));
                      setSauvegardee(false);
                      return;
                    }
                    if (deja < 0) {
                      liste.unshift({
                        palette: entry.number,
                        nom: entry.name,
                        date: new Date().toISOString(),
                        pieces: Object.entries(produitsParSlot)
                          .filter(([, p]) => p)
                          .map(([slot, p]) => ({
                            slot, nom: p!.nom, marque: p!.marque,
                            prix: p!.prix, url: p!.urlProduit,
                          })),
                      } as never);
                      localStorage.setItem(cle, JSON.stringify(liste.slice(0, 30)));
                    }
                    setSauvegardee(true);
                    showToast("Tenue sauvegardée ✓");
                  } catch { /* stockage indisponible */ }
                }}
                onVoirPiece={(slot) => {
                  document.getElementById(`piece-${slot}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            </div>
          </Reveal>
        </section>
      )}

      {/* Liste compacte des pièces (maquette 2026-08-22) : une ligne par
          pièce, avec ♡ et ↻. Les fiches détaillées restent plus bas pour qui
          veut comparer les marchands. */}
      {registreOutfit && (
        <section className="wada-tenue-note" style={{ padding: "0 5% 14px" }} id="liste-pieces">
          <Reveal offset={0}>
            <ListePieces
              produits={produitsParSlot}
              couleurs={Object.fromEntries(
                registreOutfit.slots.map((sl) => [sl.slot, sl.color.hex]),
              )}
              favoris={favorisPieces}
              onFavori={basculerFavori}
              /* « Remplacer » ouvre le tiroir d'alternatives (refonte
                 2026-08-23) au lieu de tirer une pièce à l'aveugle : le
                 client choisit, le reste de la tenue ne bouge pas. */
              onRemplacer={(slot) => setSlotDrawer(slot)}
              enRemplacement={null}
              tailles={taillesChoisies}
              onTaille={choisirTaille}
            />
          </Reveal>
        </section>
      )}

      {/* « Pourquoi cette tenue fonctionne ? » — accordéon FERMÉ (brief §9).
          Il abrite la phrase de direction artistique et la note détaillée,
          qui occupaient chacune une section pleine page. */}
      {(noteTenue || registreOutfit?.description) && (
        <section className="wada-tenue-note" style={{ padding: "0 5% 14px" }}>
          <Reveal offset={0}>
            <AccordeonPourquoi
              description={registreOutfit?.description || fashionOutput?.description || null}
              note={noteTenue}
            />
          </Reveal>
        </section>
      )}

      {/* « Utilisation de la palette » — quelle teinte habille quelle pièce
          (brief §10). */}
      {registreOutfit && (
        <section className="wada-tenue-note" style={{ padding: "0 5% 24px" }}>
          <Reveal offset={0}>
            <UtilisationPalette outfit={registreOutfit} />
          </Reveal>
        </section>
      )}

      {/* La grille des cinq grandes fiches « Comparer les marchands » a
          été retirée (refonte 2026-08-23) : « la page doit ressembler à un
          vrai Shop the Look, pas à une liste de fiches produit ». La liste
          compacte ci-dessus porte l'achat, le panier et le remplacement ;
          le choix du marchand se fait sur sa page produit. */}

      {/* « Variantes de cette tenue » (brief §11) — trois recompositions
          réelles de la même palette : plus décontractée, plus habillée,
          moins chère. Chargées quand la section approche de l'écran. */}
      {registreOutfit && entry && (
        <section style={{ padding: "0 5% 24px" }}>
          <VariantesTenue
            slots={registreOutfit.slots.map((sl) => ({ slot: sl.slot, color: sl.color.hex }))}
            palette={entry.number}
            genre={userGender}
            styleActuel={prefs.style || null}
            totalActuel={Object.values(produitsParSlot)
              .reduce((a, p) => a + (p?.prix || 0), 0)}
          />
        </section>
      )}

      {/* « Vous pourriez aussi aimer » (brief §12) — pièces du catalogue
          accordées à la même palette, hors celles déjà dans la tenue. */}
      {entry && (
        <section style={{ padding: "0 5% 96px" }}>
          <SimilairesTenue
            palette={entry.number}
            genre={userGender}
            excludeIds={Object.values(produitsParSlot)
              .filter((p): p is ProduitLook => !!p)
              .map((p) => p.id)}
          />
        </section>
      )}

      {/* Barre d'achat permanente (retour client 2026-08-21 : « c'est
          probablement ce qui manque le plus commercialement »). Rendue en
          portail sur document.body — voir le commentaire du composant. */}
      <ShopperLaTenue
        produits={produitsParSlot}
        tailles={taillesChoisies}
        ouvrirSignal={signalShopper}
        apresId="tenue-hero"
      />

      {/* Tiroir « Remplacer » — alternatives filtrables du slot choisi. */}
      {slotDrawer && registreOutfit && entry && produitsParSlot[slotDrawer] && (
        <RemplacerDrawer
          slot={slotDrawer}
          libelleSlot={{
            veste: "Veste", haut: "Haut", bas: "Bas",
            chaussures: "Chaussures", accent: "Accessoire",
          }[slotDrawer]}
          hexSlot={registreOutfit.slots.find((sl) => sl.slot === slotDrawer)?.color.hex || entry.colors[0].hex}
          produitActuel={produitsParSlot[slotDrawer]!}
          paletteNumber={entry.number}
          genre={userGender}
          style={prefs.style || null}
          onChoisir={(p) => {
            setRemplacements((prev) => ({ ...prev, [slotDrawer]: p as never }));
            showToast("Pièce remplacée ✓");
          }}
          onFermer={() => setSlotDrawer(null)}
        />
      )}

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
        </section>
      )}

          </main>
  );
}

/* Les fonctions CompleteTheLook, FlatLayCollage, PieceLine, PieceCard,
   useMujiProduct et leurs aides (brandLabel, AmazonAaChip, priceEstimate,
   viaLabel, pieceToSlot…) ont été retirées avec la refonte 2026-08-23 :
   la page « Shop the Look » n'affiche plus de grandes fiches par pièce.
   Le hero (TenueHero), la liste compacte (ListePieces), le tiroir
   (RemplacerDrawer) et les carrousels (VariantesTenue, SimilairesTenue)
   couvrent l'affichage ; /api/outfit reste l'unique source produits. */

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
