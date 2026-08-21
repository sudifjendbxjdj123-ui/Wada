"use client";
import { useEffect, useRef, useState } from "react";
/* Brief 2026-05-31 (user demande verbatim « supprime cette option ») :
   bande « REPRENDRE — {palette} » retirée. Le composant ResumeBanner
   et son hook useLastPalette restent dans le repo pour ré-activation
   éventuelle, mais ne sont plus montés sur la home. */
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
    /* La classe est posée sur <html> AUSSI depuis le 2026-08-21 : le rebond
       élastique d'iOS se produit sur l'élément de défilement du document,
       c'est-à-dire <html>. Sans sélecteur sur lui, impossible de le neutraliser
       (cf. .wada-home-immersive dans globals.css). */
    document.documentElement.classList.add("wada-home-immersive");
    document.body.classList.add("wada-home-immersive");
    return () => {
      document.documentElement.classList.remove("wada-home-immersive");
      document.body.classList.remove("wada-home-immersive");
    };
  }, []);

  /* ═══ Stratégie hybride 2026-05-29 — image + vidéo en progressive enhancement ═══
     Le client veut le mannequin animé. Mais la vidéo .mp4 (22 Mo) bloquait
     en PWA iOS standalone. Solution : on charge TOUJOURS l'image .webp
     en fond (152 Ko, instantané), et on monte la vidéo par-dessus
     UNIQUEMENT quand elle est prête à jouer. Si la vidéo échoue (iOS PWA,
     Low Power Mode, réseau), l'image reste et le visiteur ne voit aucun
     bug — juste la home statique au lieu d'animée.

     Flow :
       1. Image .webp affichée immédiatement en z-index 0
       2. Vidéo .mp4 rendue par-dessus en z-index 1 avec opacity 0
       3. Event `playing` → fade-in opacity 1 (0.6s) → la vidéo prend le relais
       4. Si `playing` ne se déclenche jamais → opacity reste 0 → image visible

     Retries identiques à v41 : backoff, canplay, visibilitychange,
     pageshow, first-tap. Le « cap d'échec gracieux » est désormais
     impossible à percevoir côté visiteur. */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  /* Fix 2026-08-21 « LCP 7,1 s » : la source vidéo (21,6 Mo) n'est plus dans
     le HTML. Elle est attachée seulement quand deux conditions sont réunies :
     la page a fini de charger — l'image du hero, qui EST l'élément LCP, a donc
     eu la bande passante pour elle — et la connexion peut l'encaisser. */
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    /* Connexion lente ou mode économie de données : on s'en tient à l'image.
       Le hero reste parfaitement présentable — c'est le principe de la couche 1,
       et 21,6 Mo sur un forfait mobile serait de toute façon indéfendable.
       navigator.connection n'existe pas sur Safari : sans information, on
       charge (comportement d'avant ce correctif). */
    const conn = (navigator as unknown as {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType)) return;

    let cancelled = false;
    const attach = () => {
      if (cancelled) return;
      setVideoSrc("/hero/femme-wada-bg.mp4");
    };
    /* Après l'évènement `load`, puis en temps mort du navigateur.
       requestIdleCallback est absent des vieux Safari → repli sur setTimeout. */
    const schedule = () => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
      }).requestIdleCallback;
      if (ric) ric(attach, { timeout: 3000 });
      else window.setTimeout(attach, 600);
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;

    const tryPlay = () => {
      if (!v.paused) return;
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    /* `playing` event = la vidéo a vraiment commencé à jouer (pas juste
       chargée). C'est le signal qui déclenche le fade-in par-dessus
       l'image. Si jamais reçu → l'image reste visible (pas de bug). */
    const onPlaying = () => setVideoReady(true);
    v.addEventListener("playing", onPlaying);

    /* La source vient d'être attachée en JS sur un élément en preload="none" :
       on demande explicitement le chargement avant de tenter la lecture.
       Safari iOS ne rafraîchit pas toujours la source tout seul. */
    v.load();
    tryPlay();
    const onCanPlay = () => tryPlay();
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("loadeddata", onCanPlay);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) tryPlay();
    };
    window.addEventListener("pageshow", onPageShow);

    /* Backoff retry — 5 tentatives échelonnées pour cold start lent. */
    const backoffDelays = [100, 300, 800, 2000, 5000];
    const backoffTimers: number[] = [];
    backoffDelays.forEach((ms) => {
      const t = window.setTimeout(() => tryPlay(), ms);
      backoffTimers.push(t);
    });

    /* First-tap fallback : iOS PWA débloque toujours play() après gesture. */
    const onFirstGesture = () => {
      tryPlay();
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("touchstart", onFirstGesture);
    };
    document.addEventListener("pointerdown", onFirstGesture, { passive: true });
    document.addEventListener("touchstart", onFirstGesture, { passive: true });

    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadeddata", onCanPlay);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("pointerdown", onFirstGesture);
      document.removeEventListener("touchstart", onFirstGesture);
      backoffTimers.forEach((t) => clearTimeout(t));
    };
    /* Dépend de videoSrc : tant qu'aucune source n'est attachée, il n'y a rien
       à lire ; l'effet se (re)lance dès qu'elle l'est. */
  }, [videoSrc]);

  return (
    <main
      style={{
        /* Fix 2026-08-20 « cadrage accueil » : le hero était en height:100svh
           alors qu'il est posé SOUS le header (~72px, dans le flux) et
           AU-DESSUS de la tab bar fixe (le body réserve 64px + safe-area en
           ≤880px). Le bloc dépassait donc l'écran d'environ 135px : tout le
           bas de la photo — le kimono déployé et le tatami — tombait sous la
           ligne de flottaison, et la page gagnait un scroll parasite de la
           même hauteur qui emportait le bandeau crème avec lui.
           Le body étant déjà `flex flex-col`, on laisse le hero prendre
           EXACTEMENT la place restante entre le header et la tab bar : plus
           de débordement, plus de scroll, le bandeau reste en haut et la
           photo entière tient dans l'écran. */
        flex: "1 1 auto",
        minHeight: 0,
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

      {/* Bande Resume retirée 2026-05-31 (user feedback) — l'option
          « REPRENDRE — Mirage du désert » polluait le hero. Le composant
          ResumeBanner reste dans le repo mais n'est plus monté. */}

      {/* ════════════════════════════════════════════════════════════════
          HERO PLEIN ÉCRAN — image + vidéo en progressive enhancement
          Brief 2026-05-29 : on garde la vidéo mais on ne dépend plus
          d'elle. L'image .webp (152 Ko) charge instantanément en fond,
          la vidéo .mp4 se monte par-dessus en fade-in QUAND elle est
          prête. Si la vidéo échoue (PWA iOS / Low Power / réseau),
          l'image reste affichée — aucun bug visible côté client.
          ════════════════════════════════════════════════════════════════ */}

      {/* COUCHE 1 : image toujours présente, z-index 0 */}
      <img
        className="wada-hero-media"
        /* Fix 2026-08-21 (PageSpeed : « Améliorer l'affichage des images —
           116 Kio », et LCP à 7,1 s dont cette image est l'élément).
           On servait un seul fichier de 1600 px de large (152 Ko) pour un
           affichage d'environ 400 px CSS. Trois tailles sont désormais
           proposées et le navigateur choisit selon la largeur d'écran et la
           densité de pixels : 800 px (54 Ko) suffit à un téléphone en 2×,
           1200 px couvre le 3×, 1600 px reste pour les grands écrans.
           `fetchPriority=high` sort cette image de la file d'attente basse
           par défaut — c'est l'élément LCP, il doit partir en premier
           (audit « Détection de la requête LCP »). */
        src="/hero/femme-wada-bg-photo-800.webp"
        srcSet="/hero/femme-wada-bg-photo-800.webp 800w, /hero/femme-wada-bg-photo-1200.webp 1200w, /hero/femme-wada-bg-photo.webp 1600w"
        sizes="100vw"
        fetchPriority="high"
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          /* Le cadrage (object-position) vit dans globals.css — il diffère
             entre mobile et desktop, ce qu'un style inline ne peut pas
             exprimer. Cf. `.wada-hero-media`. */
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* COUCHE 2 : vidéo par-dessus, opacity 0→1 quand elle joue.
          Tant que `playing` ne s'est pas déclenché, opacity reste 0 et
          l'image en dessous fait le rendu — c'est la garantie zéro-bug. */}
      <video
        className="wada-hero-media"
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        /* Fix 2026-08-21 : `preload="auto"` sur un fichier de 21,6 Mo. Sur la
           « 4G lente » du test PageSpeed, le navigateur se jetait dessus et
           saturait le lien — l'image du hero, elle, attendait son tour. D'où
           un Speed Index à 3,3 s (la page a l'air prête) mais un LCP à 7,1 s
           (l'élément principal n'est peint que 4 s plus tard).
           La source n'est plus posée dans le HTML : elle est attachée en JS
           une fois la page chargée (cf. useEffect), et jamais sur connexion
           lente. `poster` est retiré car inutile — la vidéo reste en
           opacity:0 jusqu'à ce qu'elle joue, son poster n'a donc jamais été
           visible, et l'image de la couche 1 fait déjà ce travail. */
        preload="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          /* Même cadrage que l'image de fond (`.wada-hero-media`) pour une
             transition image→vidéo sans saut. */
          zIndex: 1,
          pointerEvents: "none",
          opacity: videoReady ? 1 : 0,
          transition: "opacity 0.6s ease-out",
        }}
        src={videoSrc ?? undefined}
      />

      {/* ────────────────────────────────────────────────────────────────
          OVERLAY GRADIENT — assombrissement bas pour lisibilité du texte
          Top reste presque transparent (laisse voir le visage du mannequin).
          z-index 2 (au-dessus image z=0 et vidéo z=1). Contenu texte
          repassé en z-index 3. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          /* Brief 2026-06-07 (média hero) — dégradé plus cinématographique :
             léger voile en HAUT (0.22→0 sur le premier quart) qui encadre
             le sujet et donne de la profondeur, milieu transparent (le
             mannequin reste visible), et bas un peu plus profond (0.42/0.72)
             pour que le kicker + H1 + CTAs ressortent nettement. */
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 24%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.72) 100%)",
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
          // Distance depuis le bas : bloc texte remonté (demande user 2026-06-10
          // « lève le texte ») de 140 → 200px, pour que le H1 + les 2 CTAs
          // (dont « Notre histoire ») soient bien au-dessus de la MobileTabBar
          // et non rognés. + safe-area-inset-bottom.
          bottom: "calc(200px + env(safe-area-inset-bottom, 0px))",
          zIndex: 3,
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
