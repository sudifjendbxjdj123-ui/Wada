"use client";
/**
 * /decouverte — Refonte 2026-05-23 (maquette brief).
 * Featured brand de la semaine + archive grid 4 cols + bloc newsletter.
 * Préserve la logique métier : featuredBrands, getCurrentWeekIndex.
 */
import { featuredBrands, getCurrentWeekIndex } from "@/lib/data";
import BackButton from "@/components/BackButton";
import ExternalLink from "@/components/ExternalLink";
import Newsletter from "@/components/Newsletter";

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
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};
const SOFT = "0 10px 40px rgba(30,30,30,.07)";

export default function DecouvertePage() {
  const weekIdx = getCurrentWeekIndex();
  const featured = featuredBrands[weekIdx % featuredBrands.length];
  // Les 8 précédentes — archive grid 4 cols × 2 lignes
  const others = featuredBrands
    .filter((_, i) => i !== weekIdx % featuredBrands.length)
    .slice(0, 8);

  // Gradient de couverture pour la featured card — composé des 2 premières couleurs
  const featuredGradient = `linear-gradient(150deg, ${featured.palette[0]}, ${featured.palette[1] || featured.palette[0]} 70%, ${featured.palette[2] || featured.palette[0]})`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.beige,
        color: palette.ink,
        fontFamily: fonts.sans,
        lineHeight: 1.6,
      }}
    >
            <BackButton />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "46px 24px 80px" }}>
        {/* HEAD */}
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: palette.bordeaux,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Chaque dimanche
          </p>
          <h1
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: "clamp(32px, 6vw, 44px)",
              lineHeight: 1.04,
              margin: "10px 0 4px",
              color: palette.ink,
            }}
          >
            Découverte
          </h1>
          <p style={{ color: palette.inkSoft, margin: 0 }}>
            Une jeune maison mise en lumière chaque semaine — et l'archive de
            toutes les précédentes.
          </p>
        </div>

        {/* FEATURED CARD */}
        <article
          className="wada-discover-feature"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: 0,
            border: `1px solid ${palette.line}`,
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: SOFT,
            background: palette.cream,
          }}
        >
          {/* IMG side — brief moodboard 2026-05-24 :
              moodboard-8 (homme veste camel rue Tokyo) → lien Japon +
              registre streetwear chic, cohérent avec l'héritage Sanzo Wada.
              Le voile dark préserve la lisibilité de la pill « Cette semaine ». */}
          <div
            className="wada-media-bg"
            style={{
              minHeight: 340,
              position: "relative",
              // @ts-ignore CSS var
              "--media-image": "url(/hero/moodboard-8.webp)",
            } as React.CSSProperties}
            aria-hidden
          >
            <div
              className="wada-media-scrim"
              style={{
                background: `linear-gradient(135deg, ${featured.palette[0]}40, ${featured.palette[1] || featured.palette[0]}60 70%, rgba(25,22,18,.45))`,
              }}
            />
            <span
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                background: palette.bordeaux,
                color: palette.beige,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "6px 12px",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              Cette semaine
            </span>
          </div>
          {/* INFO side */}
          <div
            style={{
              padding: "38px 34px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: palette.olive,
                margin: 0,
                fontWeight: 600,
              }}
            >
              Marque de la semaine · {featured.city}
            </p>
            <h2
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: "clamp(26px, 4vw, 34px)",
                margin: "6px 0 10px",
                color: palette.ink,
                lineHeight: 1.1,
              }}
            >
              {featured.name}
            </h2>
            <p
              style={{
                color: palette.inkSoft,
                fontSize: 15,
                maxWidth: "40ch",
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {featured.story}
            </p>
            {/* Palette circles */}
            <div style={{ display: "flex", gap: 8, margin: "18px 0 0" }}>
              {featured.palette.slice(0, 5).map((c, i) => (
                <span
                  key={i}
                  aria-hidden
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "2px solid #fff",
                    background: c,
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                  }}
                />
              ))}
            </div>
            {/* Signature */}
            <p
              style={{
                marginTop: 14,
                fontSize: 12,
                color: palette.inkSoft,
                fontStyle: "italic",
              }}
            >
              Pièce signature : <strong style={{ color: palette.ink }}>{featured.signature}</strong>
            </p>
            <ExternalLink
              href={featured.url}
              style={{
                marginTop: 24,
                alignSelf: "flex-start",
                fontFamily: fonts.sans,
                fontSize: 14,
                padding: "13px 24px",
                borderRadius: 999,
                background: palette.ink,
                color: palette.cream,
                textDecoration: "none",
                display: "inline-block",
                fontWeight: 500,
              }}
            >
              Voir le site & palettes →
            </ExternalLink>
          </div>
        </article>

        {/* ARCHIVE */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: palette.olive,
            margin: "48px 0 18px",
            fontWeight: 600,
          }}
        >
          Les semaines précédentes
        </p>
        <div
          className="wada-discover-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 18,
          }}
        >
          {others.map((b, i) => {
            const cardGradient = `linear-gradient(135deg, ${b.palette[0]}, ${b.palette[1] || b.palette[0]})`;
            const weekNum = weekIdx - i - 1;
            return (
              <ExternalLink
                key={b.name}
                href={b.url}
                style={{ textDecoration: "none", color: palette.ink }}
              >
                <article
                  style={{
                    background: palette.cream,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: SOFT,
                    cursor: "pointer",
                    transition: "transform .3s cubic-bezier(.22,1,.36,1)",
                  }}
                  onMouseEnter={(ev) => {
                    ev.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(ev) => {
                    ev.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ height: 120, background: cardGradient }} aria-hidden />
                  <div style={{ padding: "14px 15px" }}>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: palette.olive,
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      Sem. {String(Math.max(1, weekNum)).padStart(2, "0")}
                    </p>
                    <p
                      style={{
                        fontFamily: fonts.display,
                        fontWeight: 700,
                        fontSize: 16,
                        margin: "3px 0 2px",
                        color: palette.ink,
                        lineHeight: 1.15,
                      }}
                    >
                      {b.name}
                    </p>
                    <p style={{ fontSize: 12, color: palette.inkSoft, margin: 0 }}>
                      {b.signature} · {b.city}
                    </p>
                  </div>
                </article>
              </ExternalLink>
            );
          })}
        </div>

        {/* NEWSLETTER */}
        <div style={{ marginTop: 60 }}>
          <Newsletter />
        </div>
      </div>

      {/* Responsive : 2 cols ≤ 820px, 1 col ≤ 520px */}
      <style jsx>{`
        @media (max-width: 820px) {
          :global(.wada-discover-feature) {
            grid-template-columns: 1fr !important;
          }
          :global(.wada-discover-grid) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 520px) {
          :global(.wada-discover-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

          </main>
  );
}
