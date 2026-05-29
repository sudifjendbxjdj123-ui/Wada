"use client";
import { useEffect, useRef } from "react";
/* Brief « appli efficace » §3 (2026-05-29) : bande Resume flottante au-
   dessus de la vidéo hero si l'user a déjà visité une palette ou sauvé
   une tenue. Le composant ne rend rien si pas d'état à reprendre. */
import ResumeBanner from "@/components/ResumeBanner";
/**
 * Home WADA — refonte 2026-05-26 (brief client).
 *
 * Brief verbatim : « l'accueil = la vidéo du mannequin en plein écran,
 * qui tourne en boucle » + « Retirer le footer de la page d'accueil
 * uniquement ».
 *
 * Composition :
 *   - <video autoplay muted loop playsinline poster="…webp"> couvrant
 *     100svh × 100vw, object-fit: cover
 *   - Overlay translucide en bas pour porter kicker + H1 + 2 CTAs
 *   - Respecte les safe areas iOS (encoche haut, home indicator bas)
 *   - PWA / Capacitor : muted+playsinline OBLIGATOIRES pour autoplay
 *
 * Aucun footer (filtré par <ConditionalFooter /> dans layout.tsx).
 * Le Nav reste sticky en haut + MobileTabBar reste en bas (≤880px).
 */
import Link from "next/link";

const palette = {
  beige:    "#F4EFE7",
  cream:    "#FAF8F4",
  bordeaux: "#6B3A32",
  ink:      "#1E1E1E",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  sans:    "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const ease = "cubic-bezier(.22,1,.36,1)";

export default function Home() {
  /* Brief client « la vidéo du mannequin en plein écran » → on masque
     les overlays globaux body::before (wash radial) et body::after
     (grain papier) qui sinon passent au-dessus de la vidéo (z-index 2,
     position:fixed → ils échappent à isolation:isolate). Le toggle est
     scopé à la home : autres pages gardent leurs overlays comme avant. */
  useEffect(() => {
    document.body.classList.add("wada-home-immersive");
    return () => document.body.classList.remove("wada-home-immersive");
  }, []);

  /* Fix bug 2026-05-29 : « la vidéo ne démarre pas parfois sur l'appli ».
     Cas connus où l'attribut autoPlay HTML rate silencieusement :
       - WebView Capacitor (iOS) au cold start de la PWA
       - Onglet inactif au moment du mount (page chargée en background)
       - iOS Low Power Mode (impossible à contourner, on tente quand même)
       - Réseau lent : la vidéo n'est pas chargée avant le play() implicite
       - BFcache iOS au retour back/forward → vidéo restaurée pause
     Stratégie : on garde autoPlay (le « happy path » couvre 95 %), on
     ajoute un retry programmatique sur 3 events qui couvrent les autres
     cas. play() retourne une Promise — on catch pour ne pas crasher
     l'app avec « NotAllowedError ». Si tous les retries ratent, le
     poster reste affiché (déjà en place) : pas de page « morte ».  */
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const tryPlay = () => {
      if (!v.paused) return; // déjà en cours
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* Échec silencieux — le poster reste visible. On ne logge
             pas en console pour ne pas polluer la prod. Les retries
             ci-dessous tenteront à nouveau quand les conditions
             changent (canplay, visibilité, pageshow). */
        });
      }
    };

    /* 1er essai immédiat au mount (en plus de l'autoPlay HTML). */
    tryPlay();

    /* canplay = vidéo a assez de buffer pour démarrer. Important sur
       réseau lent : autoPlay rate parfois parce que le 1er frame n'est
       pas prêt au moment où le browser tente. */
    const onCanPlay = () => tryPlay();
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("loadeddata", onCanPlay);

    /* visibilitychange : l'utilisateur revient sur l'onglet (ou ouvre
       la PWA depuis le multitâche). iOS pause souvent la vidéo en
       background — au retour, elle doit reprendre. */
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* pageshow avec event.persisted = restauration BFcache iOS Safari
       (back/forward depuis une autre page). La vidéo est gelée — il
       faut explicitement la rejouer. */
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) tryPlay();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onCanPlay);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <main
      style={{
        // 100svh = small viewport height (mobile-safe : prend la zone
        // visible HORS chrome navigateur, pas de saut quand l'adresse
        // bar disparaît). Fallback dvh pour les browsers plus anciens.
        minHeight: "100svh",
        height: "100svh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        background: "#1a1410", // fond foncé pendant le chargement vidéo
        fontFamily: fonts.sans,
        color: "#fff",
        // Pas de scroll sur la home : la vidéo couvre TOUT.
        // Si l'utilisateur veut explorer, il passe par le Nav ou les CTAs.
      }}
    >
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
      <div id="main-content" />

      {/* Bande Resume flottante — au-dessus de la vidéo (z-index 40 <
          Nav 50). Ne rend rien si l'user n'a ni palette visitée ni
          tenue sauvée, ou s'il a dismissé la bande pour la session. */}
      <ResumeBanner />

      {/* ════════════════════════════════════════════════════════════════
          VIDÉO MANNEQUIN PLEIN ÉCRAN
          - autoplay + muted + playsinline = autoplay garanti iOS/Android/PWA
          - loop = boucle infinie sans bouton replay
          - poster = image webp affichée IMMÉDIATEMENT (avant le 1er frame
            vidéo) + en fallback si le browser refuse l'autoplay
          - preload="auto" = télécharge la vidéo dès le mount (la home est
            la 1ère impression, on veut qu'elle joue tout de suite)
          - object-fit: cover = couvre tout l'écran, recadre intelligemment
          ════════════════════════════════════════════════════════════════ */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        // disablePictureInPicture = pas de bouton PiP sur la vidéo de fond
        disablePictureInPicture
        // controlsList empêche le download via menu contextuel
        controlsList="nodownload nofullscreen noremoteplayback"
        poster="/hero/femme-wada-bg-photo.webp"
        preload="auto"
        aria-hidden="true"
        /* Fix 2026-05-29 « vidéo ne démarre pas parfois sur l'appli ».
           onLoadedData : trigger un play() supplémentaire dès que la 1ère
           frame est prête — sécurise les cas où autoPlay HTML rate parce
           que la vidéo n'était pas encore décodée au mount.  */
        onLoadedData={(e) => {
          const v = e.currentTarget;
          if (v.paused) {
            const p = v.play();
            if (p && typeof p.catch === "function") p.catch(() => {});
          }
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <source src="/hero/femme-wada-bg.mp4" type="video/mp4" />
        {/* Fallback texte si la balise video n'est pas supportée
            (browsers très anciens) — le poster s'affiche quand même
            via l'attribut poster ci-dessus. */}
      </video>

      {/* ────────────────────────────────────────────────────────────────
          OVERLAY GRADIENT — assombrissement bas pour lisibilité du texte
          Top reste presque transparent (laisse voir le visage du mannequin).
          ──────────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* ────────────────────────────────────────────────────────────────
          CONTENU TEXTE — kicker + H1 + CTAs, positionné dans le tiers bas
          Respecte les safe areas (env(safe-area-inset-bottom)) pour ne
          pas être mangé par l'iPhone home indicator ou la MobileTabBar.
          ──────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // Distance depuis le bas : 96px de marge + safe-area-inset-bottom
          // + 64px pour laisser respirer au-dessus de la MobileTabBar (qui
          // fait ~64px de hauteur sur mobile ≤880px).
          bottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
          zIndex: 2,
          padding: "0 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          // Permet aux liens d'être cliquables même si le parent a pointer-events:none
          // (ils n'en ont pas mais par sécurité)
          pointerEvents: "auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "#F4EFE7",
            textShadow: "0 1px 6px rgba(0,0,0,0.6)",
            fontWeight: 600,
            margin: 0,
            fontFamily: fonts.sans,
          }}
        >
          Inspiré de Sanzo Wada · 1933
        </p>

        <h1
          className="wada-hero-h1"
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            // Brief charte typo : titres Fredoka, échelle hero ~56px desktop / 40px mobile.
            // clamp limite à 56px max (au lieu des anciens 84px qui faisaient « lourd »).
            fontSize: "clamp(36px, 6.5vw, 56px)",
            lineHeight: 1.04,
            letterSpacing: "-0.01em",
            margin: "16px 0 0",
            color: "#fff",
            maxWidth: "16ch",
            // Text-shadow plus marqué qu'avant car le fond est maintenant
            // une vidéo dynamique (les zones claires varient sur la timeline).
            textShadow: "0 2px 14px rgba(0,0,0,0.55)",
          }}
        >
          Trouvez la couleur.<br />Trouvez votre style.
        </h1>

        {/* 2 CTAs — primaire bordeaux + secondaire ghost */}
        <div
          style={{
            marginTop: 30,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Link
            href="/scanner"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "16px 32px",
              borderRadius: 999,
              background: palette.bordeaux,
              color: palette.cream,
              fontFamily: fonts.sans,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.02em",
              textDecoration: "none",
              width: "100%",
              boxShadow: "0 14px 40px rgba(0,0,0,.35)",
              transition: `transform 0.35s ${ease}, box-shadow 0.35s ${ease}`,
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.transform = "translateY(-2px)";
              ev.currentTarget.style.boxShadow = "0 18px 48px rgba(0,0,0,.42)";
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.transform = "translateY(0)";
              ev.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,.35)";
            }}
          >
            <span>Scanner une couleur</span>
            <span aria-hidden style={{ fontSize: 17 }}>→</span>
          </Link>

          <Link
            href="/about"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 30px",
              borderRadius: 999,
              // Ghost button avec backdrop-blur : lisible sur n'importe
              // quelle frame de la vidéo (claire ou sombre).
              background: "rgba(250,248,244,0.18)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#fff",
              border: `1.5px solid rgba(255,255,255,0.55)`,
              fontFamily: fonts.sans,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
              width: "100%",
              transition: `all 0.3s ${ease}`,
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.background = "rgba(250,248,244,0.92)";
              ev.currentTarget.style.color = palette.ink;
              ev.currentTarget.style.borderColor = palette.cream;
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.background = "rgba(250,248,244,0.18)";
              ev.currentTarget.style.color = "#fff";
              ev.currentTarget.style.borderColor = "rgba(255,255,255,0.55)";
            }}
          >
            Notre histoire
          </Link>
        </div>
      </div>
    </main>
  );
}
