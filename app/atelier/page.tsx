"use client";
/**
 * /atelier — Sommaire éditorial (refonte 2026-05-20, v3).
 *
 * Changements vs v2 :
 *   - Police titres = Bagel Fat One (= police home WADA, fontHeading)
 *     au lieu de Fraunces serif. Cohérence d'identité brand sitewide.
 *   - Fond vidéo CONSERVÉ (femme-wada-bg.mp4 fixé global) + voile crème
 *     dense (0.78→0.62) selon règle scrim brief 2026-05.
 *   - Page transparente — le contenu flotte sur la vidéo voilée.
 *   - Tiles 2×2 inchangées (4 portes : Scanner / Composer / Assistant IA / Dressing)
 */
import Link from "next/link";
import BackButton from "@/components/BackButton";

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  sable: "#D8C9B2",
  line: "rgba(30,30,30,.10)",
};

// Police home WADA — Bagel Fat One (chubby/rounded) pour TOUS les titres
// du sommaire et numéros. Fraunces serif reste pour le corps long mais
// pas pour les headlines (cohérence avec la home).
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const shadow = "0 12px 48px rgba(30,30,30,.10)";
const shadowHover = "0 20px 60px rgba(30,30,30,.16)";

interface ToolTile {
  n: string;
  title: string;
  desc: string;
  href: string;
  meta: string;
  wash: "olive" | "sable" | "ink" | "bordeaux";
  /** Photo cover du wash header (brief 2026-05-25). */
  photo: string;
  icon: string;
  iaBadge?: boolean;
}

const TOOLS: ToolTile[] = [
  {
    n: "01",
    title: "Scanner une couleur",
    desc: "Photographiez une teinte — un mur, une fleur, un vêtement. WADA compose la tenue qui s'accorde.",
    href: "/scanner",
    meta: "348 palettes prêtes",
    wash: "olive",
    photo: "/hero/photo-mood-1.png",
    icon: "⬡",
  },
  {
    // Refonte 2026-05-21 : "Composer une tenue" ouvre désormais la GRILLE
    // des 348 palettes (et plus l'upload photo). Parcours attendu :
    //   atelier → /palettes → /palette/[n] → "Composer ma tenue avec cet accord"
    // L'upload photo "Une pièce que vous avez" vit uniquement dans /scanner
    // via le ScanModeToggle (mode "Un vêtement" → /composer).
    /* Brief audit N6 (2026-05-28) : libellé recadré. « Composer une tenue »
       laissait croire qu'on uploadait des pièces ; en réalité on ouvre la
       grille des 348 palettes. Renommé en « Explorer les palettes ».
       L'upload réel « Un vêtement » vit dans /scanner (tab) → /composer. */
    n: "02",
    title: "Explorer les palettes",
    desc: "Parcourez les 348 accords du dictionnaire Sanzo Wada. Choisissez celui qui vous parle, WADA compose la tenue autour.",
    href: "/palettes",
    meta: "348 accords",
    wash: "sable",
    photo: "/hero/photo-mood-2.png",
    icon: "⌂",
  },
  {
    n: "03",
    title: "Assistant",
    desc: "Dites une pièce, une humeur, une occasion. Un styliste calme compose autour, jamais robotique.",
    href: "/stylist",
    meta: "Conversation",
    wash: "ink",
    photo: "/hero/photo-mood-3.png",
    icon: "❝",
    iaBadge: true,
  },
  {
    /* Brief audit N5 (2026-05-28) : libellé clarifié. Le link pointe vers
       /favoris (le slug court — /garde-robe redirige 308 dessus). Pour ne
       pas tromper le client qui s'attend à un vrai dressing (avec pièces
       photo, gestion taille), on annonce honnêtement « palettes favorites ». */
    n: "04",
    title: "Mes favoris",
    desc: "Vos palettes coup de cœur, sauvegardées localement pour les retrouver d'une visite à l'autre.",
    href: "/favoris",
    meta: "Vos palettes sauvegardées",
    wash: "bordeaux",
    photo: "/hero/photo-mood-4.png",
    icon: "♡",
  },
];

const WASH_GRADIENT: Record<ToolTile["wash"], string> = {
  olive:    `linear-gradient(135deg, ${palette.olive}, #7d8a6e)`,
  sable:    `linear-gradient(135deg, ${palette.sable}, #bda680)`,
  ink:      `linear-gradient(135deg, #39342f, ${palette.ink})`,
  bordeaux: `linear-gradient(135deg, #8a554e, ${palette.bordeaux})`,
};

export default function AtelierPage() {
  // Refonte 2026-05-25 : la vidéo .mp4 est devenue une <img> .webp (gain
  // perf majeur : 3-5 MB → ~190 KB). Plus besoin de videoRef ni de l'autoplay
  // programmatique iOS Safari.
  return (
    <main style={{
      fontFamily: fonts.sans,
      color: palette.ink,
      lineHeight: 1.6,
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
      // Brief 2026-05-25 : main = beige opaque. L'image hero est CONFINÉE
      // à sa zone, ne déborde plus derrière le contenu/footer.
      background: "#F4EFE7",
      position: "relative",
    }}>
            <BackButton />

      {/* ═══ ZONE HERO CONTENUE (overflow:hidden) ═══
          Image + voile en position:absolute À L'INTÉRIEUR — plus de fixed.
          Quand le wrapper se ferme, l'image disparaît, le footer voit
          du beige propre. */}
      <div style={{
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      }}>
        <img
          src="/hero/femme-wada-bg-photo.webp"
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
        {/* Voile crème dense — brief scrim 2026-05 (contraste AA 4.5:1) */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(244,239,231,.78) 0%, rgba(244,239,231,.62) 50%, rgba(244,239,231,.78) 100%)",
          zIndex: 1, pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1000, margin: "0 auto", padding: "60px 28px 90px" }}>
        {/* HEADER — police Bagel Fat One (= home WADA) */}
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.34em", textTransform: "uppercase",
            color: palette.bordeaux, fontWeight: 500,
          }}>
            Sommaire
          </p>
          <h1 style={{
            fontFamily: fonts.display, fontWeight: 700,
            fontSize: "clamp(42px, 6.5vw, 62px)",
            lineHeight: 1.02,
            margin: "14px 0 10px",
            letterSpacing: "0.01em",
            color: palette.ink,
          }}>
            L'atelier WADA
          </h1>
          <div style={{
            color: palette.olive,
            letterSpacing: "0.5em", fontSize: 13,
          }}>
            ✦ &nbsp; ✦ &nbsp; ✦
          </div>
        </div>

        {/* GRID 2×2 */}
        <div className="wada-atelier-grid" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
        }}>
          {TOOLS.map((t) => (
            <Tile key={t.n} tile={t} />
          ))}
        </div>
      </div>
      </div>{/* /hero-wrapper overflow:hidden (brief 2026-05-25) */}

      
      <style jsx>{`
        @media (max-width: 760px) {
          :global(.wada-atelier-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function Tile({ tile }: { tile: ToolTile }) {
  return (
    <Link
      href={tile.href}
      style={{
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        boxShadow: shadow,
        cursor: "pointer",
        transition: "transform 0.4s cubic-bezier(.22,1,.36,1), box-shadow 0.4s cubic-bezier(.22,1,.36,1)",
        minHeight: 260,
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: palette.ink,
      }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.transform = "translateY(-4px)";
        ev.currentTarget.style.boxShadow = shadowHover;
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.transform = "translateY(0)";
        ev.currentTarget.style.boxShadow = shadow;
      }}
    >
      {/* WASH header avec PHOTO + voile + icône + numéro (brief 2026-05-25).
          Photo `object-fit: cover` pour éviter les bandes noires sur les
          formats portrait. Gradient de fond conservé en fallback si la
          photo échoue à charger. Voile sombre par-dessus pour garantir le
          contraste de l'icône blanche et du numéro. */}
      <div style={{
        height: 150,
        position: "relative",
        overflow: "hidden",
        background: WASH_GRADIENT[tile.wash],
        display: "flex",
        alignItems: "flex-end",
        padding: "18px 22px",
      }}>
        {/* Photo cover */}
        <img
          src={tile.photo}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            zIndex: 0,
          }}
        />
        {/* Voile sombre 18→42% pour lisibilité de l'icône blanche et du numéro */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            background: "linear-gradient(180deg, rgba(20,18,16,.18) 0%, rgba(20,18,16,.42) 100%)",
          }}
        />
        {/* Icône (badge blanc) — z-index 2 pour rester nette au-dessus du voile */}
        <div aria-hidden style={{
          position: "relative", zIndex: 2,
          width: 46, height: 46,
          borderRadius: 12,
          background: "rgba(255,255,255,.92)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          color: palette.ink,
          boxShadow: "0 2px 12px rgba(0,0,0,.18)",
        }}>
          {tile.icon}
        </div>
        {tile.iaBadge ? (
          <span style={{
            position: "absolute", top: 14, right: 20, zIndex: 2,
            background: palette.ink, color: palette.cream,
            fontSize: 10, letterSpacing: "0.16em",
            padding: "5px 10px",
            borderRadius: 999,
          }}>
            IA
          </span>
        ) : (
          <span style={{
            position: "absolute", top: 14, right: 20, zIndex: 2,
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 18,
            color: "rgba(255,255,255,.98)",
            textShadow: "0 2px 8px rgba(0,0,0,.4)",
          }}>
            {tile.n}
          </span>
        )}
      </div>

      {/* Body — titre en police display, description en sans */}
      <div style={{
        padding: "22px 24px 26px",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        <h3 style={{
          fontFamily: fonts.display, fontWeight: 600,
          fontSize: 27,
          marginBottom: 8,
          color: palette.ink,
        }}>
          {tile.title}
        </h3>
        <p style={{
          color: palette.inkSoft, fontSize: 15,
          maxWidth: "34ch",
        }}>
          {tile.desc}
        </p>
        <div style={{
          fontSize: 12, color: palette.olive,
          letterSpacing: "0.06em", marginTop: "auto",
          paddingTop: 16,
        }}>
          {tile.meta}
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          marginTop: 12, fontSize: 13, letterSpacing: "0.04em",
          color: palette.ink,
        }}>
          Ouvrir <span aria-hidden style={{ transition: "transform 0.35s ease" }}>→</span>
        </span>
      </div>
    </Link>
  );
}
