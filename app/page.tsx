"use client";
/**
 * Home WADA — version BEIGE (revert 2026-05-27).
 *
 * Brief : annuler la refonte Relume (hero vidéo prune / Trois gestes /
 * Comment ça marche / CTA band) et remettre la version aboutie beige
 * chaleureuse, avec :
 *   1. Hero photo mannequin + voile léger crème
 *      - kicker bordeaux « Inspiré de Sanzo Wada · 1933 »
 *      - h1 Fredoka 700 « Trouvez la couleur. Trouvez votre style. »
 *      - lead italique
 *      - 2 CTAs : « Entrer dans l'atelier » + « Notre histoire »
 *   2. Bloc Atelier : 4 cards (Scanner / Composer / Stylist / Dressing)
 *      → reprend les 4 portes du parcours WADA
 *   3. Grille Palettes : 6 accords Sanzo Wada en avant via PaletteCard
 *      (cards à 3 bandes verticales + nom + culture)
 *   4. Manifeste éditorial : pourquoi WADA existe, en serif italique
 *   5. Footer global (dark, brief 2026-05-27 conservé)
 *
 * Conservé (« correctifs validés ») :
 *   - <Nav /> global avec float/solid (la home est dans HERO_DARK_PATHS)
 *   - favicon WADA (cf. /public/wada-favicon-*)
 *   - fond unique beige (plus de RouteBackgroundVideo)
 */
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────
   Palette beige WADA (identité chaleureuse)
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",       // bg main
  cream: "#FAF8F4",       // cards
  olive: "#A8B29A",       // accents calmes
  oliveDark: "#7d8a6e",
  sable: "#D8C9B2",
  bordeaux: "#6B3A32",    // CTAs primaires, kickers
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  serif: "'Inter', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const ease = "cubic-bezier(.22,1,.36,1)";

/* Brief 2026-05-27 « efface ca » : les constantes ATELIER (4 cards) et
   FEATURED_NUMBERS (sélection de palettes) ont été retirées avec leur
   section JSX correspondante. La home est désormais minimale : hero +
   footer. */

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: fonts.sans,
        background: palette.beige,
        color: palette.ink,
        lineHeight: 1.6,
        position: "relative",
        isolation: "isolate",
      }}
    >
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
            <div id="main-content" />

      {/* ════════════════════════════════════════════════════════════════
          HERO — photo mannequin + voile crème + h1 Fredoka centré
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="wada-fade-to-beige"
        style={{
          minHeight: "calc(100vh - 64px)",
          padding: "80px 22px 96px",
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <img
          src="/hero/hero-banner-photo.webp"
          alt=""
          aria-hidden
          loading="eager"
          className="wada-bg-video"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            zIndex: 0, pointerEvents: "none",
            background: "#3a2820",
          }}
        />
        {/* Voile crème — brief « voile léger » : mannequin visible, texte lisible.
            Brief « bugs visuels mobile » BUG #1 (24/05) :
            l'ancien gradient avait une opacité .55 en TOP, combiné avec le
            Nav sticky rgba(255,255,255,0.92) au-dessus, produisait l'effet
            visuel d'une « bande grise » qui mangeait le quart supérieur
            du hero. Le top descend à .22 (assez pour porter le texte du
            kicker/H1 quand on scroll), le milieu reste à .35 (lisibilité
            du h1 + CTAs), le bas garde .55 pour le fondu vers le footer. */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(244,239,231,.22) 0%, rgba(244,239,231,.35) 50%, rgba(244,239,231,.55) 100%)",
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          maxWidth: 880, margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.34em", textTransform: "uppercase",
            /* Brief UX client (26/05) — le bordeaux #6B3A32 sur photo dark
               mannequin était illisible sur le top du hero. Switch en
               ivoire crème + text-shadow léger : reste discret, lit
               sur n'importe quelle zone de la photo (sombre comme claire). */
            color: "#F4EFE7",
            textShadow: "0 1px 4px rgba(0,0,0,0.35)",
            fontWeight: 600, margin: 0,
          }}>
            Inspiré de Sanzo Wada · 1933
          </p>
          <h1
            className="wada-hero-h1"
            style={{
              fontFamily: fonts.display, fontWeight: 700,
              fontSize: "clamp(40px, 7vw, 84px)",
              lineHeight: 1.04, letterSpacing: "-0.005em",
              margin: "18px 0 0",
              color: palette.ink,
              maxWidth: "16ch",
              /* Brief mobile hero (25/05) — léger text-shadow blanc
                 garantit la lisibilité du titre même quand il passe
                 au-dessus de la silhouette sombre du mannequin. Subtle
                 (1px blur, 50% white), invisible sur les zones claires,
                 sauveur sur les zones sombres. */
              textShadow: "0 1px 8px rgba(244, 239, 231, 0.55)",
            }}
          >
            Trouvez la couleur.<br />Trouvez votre style.
          </h1>
          {/* Brief 2026-05-28 : sous-titre lead retiré. Hero épuré :
              kicker + h1 + 2 CTAs uniquement. */}

          {/* 2 CTAs centraux */}
          <div style={{
            marginTop: 34,
            display: "flex", flexDirection: "column",
            gap: 12, alignItems: "center",
          }}>
            <Link
              href="/scanner"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "16px 32px", borderRadius: 999,
                background: palette.bordeaux, color: "#FAF8F4",
                fontFamily: fonts.sans, fontSize: 15, fontWeight: 600,
                letterSpacing: "0.02em",
                textDecoration: "none",
                minWidth: 240,
                boxShadow: "0 12px 36px rgba(107,58,50,.28)",
                transition: `transform 0.35s ${ease}, box-shadow 0.35s ${ease}`,
              }}
              onMouseEnter={(ev) => {
                ev.currentTarget.style.transform = "translateY(-2px)";
                ev.currentTarget.style.boxShadow = "0 16px 44px rgba(107,58,50,.34)";
              }}
              onMouseLeave={(ev) => {
                ev.currentTarget.style.transform = "translateY(0)";
                ev.currentTarget.style.boxShadow = "0 12px 36px rgba(107,58,50,.28)";
              }}
            >
              {/* Brief UX client (26/05) — « Entrer dans l'atelier »
                  était abstrait : le visiteur ne savait pas ce qui
                  l'attendait. Remplacé par l'action cœur du produit :
                  scanner une couleur (vraie magie de WADA, plus parlant
                  qu'un mot-fourre-tout). « Notre histoire » reste en
                  secondary pour ceux qui veulent comprendre la marque. */}
              <span>Scanner une couleur</span>
              <span aria-hidden style={{ fontSize: 17 }}>→</span>
            </Link>
            <Link
              href="/about"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 30px", borderRadius: 999,
                /* Brief mobile hero (25/05) — « Notre histoire » était quasi
                   invisible sur la photo (border rgba(30,30,30,.10) + bg
                   transparent disparaissait sur les zones sombres de la
                   silhouette). Maintenant :
                   - background semi-transparent crème (lisible sur dark ET light)
                   - backdrop-filter blur pour fondre proprement
                   - border bordeaux solide (visible quelle que soit la photo)
                   Effet : bouton secondary distinctement cliquable, même au
                   premier coup d'œil mobile. */
                background: "rgba(250,248,244,0.80)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: palette.ink,
                border: `1.5px solid ${palette.bordeaux}`,
                fontFamily: fonts.sans, fontSize: 14, fontWeight: 500,
                textDecoration: "none",
                minWidth: 240,
                transition: `all 0.3s ${ease}`,
              }}
              onMouseEnter={(ev) => {
                ev.currentTarget.style.background = palette.bordeaux;
                ev.currentTarget.style.color = "#FAF8F4";
              }}
              onMouseLeave={(ev) => {
                ev.currentTarget.style.background = "rgba(250,248,244,0.80)";
                ev.currentTarget.style.color = palette.ink;
              }}
            >
              Notre histoire
            </Link>
          </div>
        </div>
      </section>

      {/* Brief 2026-05-27 « efface ca » : les sections Atelier (4 cards),
          Palettes vedette (grille 6) et Manifeste ont été RETIRÉES de la
          home. Seul subsiste le hero (above) + le Footer global. Les
          parcours restent accessibles via Nav (Palettes, Scanner, À propos)
          et le bouton « Entrer dans l'atelier » du hero. */}

      
    </main>
  );
}
