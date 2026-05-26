"use client";
import Link from "next/link";

/* ──────────────────────────────────────────────────────────────────────
   404 — Page introuvable (refonte 2026-05-22, brief « États d'interface »).
   Ton WADA : calme, humain. Toujours une issue (accueil, palettes, scanner).
   Pas la 404 brute de Vercel/Next ; design cohérent sitewide.
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
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

// Palette « du brouillard » — 3 gris brumeux pour illustrer la perte
const LOST_COLORS = ["#E0DCD2", "#A89A85", "#7E7166"];

export default function NotFound() {
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
      
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px 80px", textAlign: "center" }}>
        {/* KICKER */}
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
          Erreur · 404
        </p>

        {/* H1 */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: "clamp(36px, 8vw, 56px)",
            lineHeight: 1.04,
            margin: "12px 0 14px",
            color: palette.ink,
            letterSpacing: "0.005em",
          }}
        >
          Cette page n'existe pas
          <br />(ou plus).
        </h1>

        {/* TEXTE */}
        <p
          style={{
            fontSize: 17,
            color: palette.inkSoft,
            maxWidth: "44ch",
            margin: "0 auto",
          }}
        >
          Elle a peut-être été déplacée, supprimée — ou n'a jamais existé. Comme
          une palette qui n'aurait pas su trouver son nom.
        </p>

        {/* PALETTE DU BROUILLARD */}
        <figure style={{ margin: "48px auto", maxWidth: 480 }}>
          <div
            style={{
              display: "flex",
              height: 180,
              borderRadius: 14,
              overflow: "hidden",
              border: `1px solid ${palette.line}`,
              boxShadow: "0 8px 36px rgba(30,30,30,.08)",
            }}
          >
            {LOST_COLORS.map((c) => (
              <div key={c} style={{ flex: 1, background: c }} aria-hidden />
            ))}
          </div>
          <figcaption
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: palette.inkSoft,
              marginTop: 12,
              fontWeight: 500,
            }}
          >
            Palette du brouillard
          </figcaption>
        </figure>

        {/* ACTIONS */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              padding: "14px 26px",
              borderRadius: 999,
              background: palette.bordeaux,
              color: palette.cream,
              textDecoration: "none",
              fontWeight: 500,
              display: "inline-block",
            }}
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/palettes"
            style={{
              fontFamily: fonts.sans,
              fontSize: 14,
              padding: "13px 26px",
              borderRadius: 999,
              background: "transparent",
              color: palette.ink,
              textDecoration: "none",
              border: `1px solid ${palette.ink}`,
              fontWeight: 500,
              display: "inline-block",
            }}
          >
            Voir les 348 palettes
          </Link>
        </div>

        <p
          style={{
            fontSize: 13,
            color: palette.inkSoft,
            marginTop: 28,
            fontStyle: "italic",
          }}
        >
          Si un lien vous a amené ici et que vous pensez qu'il est cassé,{" "}
          <a href="mailto:hello@wada.style" style={{ color: palette.bordeaux }}>
            écrivez-nous
          </a>
          .
        </p>
      </div>

          </main>
  );
}
