"use client";
import MurDeVetements from "@/components/MurDeVetements";
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
  /* La photo de fond et la vidéo de 21,6 Mo qui tenaient ce hero sont
     retirées (client 2026-08-22 : « à la place du mannequin on va mettre le
     fond qu'il y a dans boutique »). Avec elles disparaissent l'élément le
     plus lourd du site, la logique de repli image→vidéo, et ses six
     mécanismes de relance (backoff, canplay, visibilitychange, pageshow,
     premier appui) — tout cela n'existait que pour qu'une vidéo qui refuse de
     démarrer sur iOS ne laisse pas un écran noir. Le mur de vêtements n'a
     aucun de ces problèmes : ce sont des <img>. */

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

      {/* ════════════════════════════════════════════════════════════════
          FOND — mur de vêtements défilant (client 2026-08-22)
          ════════════════════════════════════════════════════════════════
          Remplace la photo + la vidéo qui tenaient ce fond. Le client veut
          voir des VÊTEMENTS sur l'accueil, pas un mannequin — et c'est aussi
          l'occasion de supprimer un fichier vidéo de 21,6 Mo qui, même chargé
          après coup, restait le plus gros téléchargement du site.

          Le mur est le même composant que la boutique utilisait : images du
          catalogue, cache localStorage pour un premier rendu immédiat, une
          seule requête réseau. Voile sombre conservé : le titre est en blanc.
          ════════════════════════════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          overflow: "hidden", pointerEvents: "none",
        }}
      >
        <MurDeVetements />
      </div>


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
          {/* CTA principal — connexion (client 2026-08-22 : « remets le login
              avec le logo à la place de Scanner une couleur »). Le scanner
              reste accessible : c'est le bouton central de la barre d'onglets,
              présent sur toutes les pages, alors que la connexion n'avait
              aucune porte d'entrée depuis l'accueil.
              `?tab=login` ouvre directement l'onglet Connexion de /compte —
              sans ce paramètre la page s'ouvrait toujours sur « Créer un
              compte », et un client déjà inscrit devait chercher l'onglet. */}
          <Link
            href="/compte?tab=login"
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
            <span
              aria-hidden
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "0.02em",
                lineHeight: 1,
              }}
            >
              WADA<span style={{ marginLeft: 3 }}>和田</span>
            </span>
            <span>Se connecter</span>
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
