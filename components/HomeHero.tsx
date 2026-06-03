"use client";
/**
 * HomeHero — Section hero éditoriale de l'accueil WADA.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 * Fond crème · Titre serif · CTA noir · Image éditoriale optionnelle.
 */
import Link from "next/link";

export function HomeHero() {
  return (
    <section style={{
      background: "#f5efe2",
      borderRadius: 20,
      margin: "16px 16px 0",
      overflow: "hidden",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        minHeight: 320,
      }}
        className="wada-hero-grid"
      >
        {/* Texte gauche */}
        <div style={{ padding: "48px 36px" }} className="wada-hero-text">
          <p style={{
            fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase",
            color: "#1a1a1a", marginBottom: 16, fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          }}>
            Nouveautés
          </p>
          <h1 style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: "clamp(28px, 3.5vw, 46px)",
            fontWeight: 500,
            lineHeight: 1.1,
            color: "#1a1a1a",
            margin: "0 0 14px",
          }}>
            Les pièces<br />
            incontournables<br />
            du moment
          </h1>
          <p style={{
            fontSize: 14, color: "#5a5a5a",
            lineHeight: 1.6, margin: "0 0 24px",
            maxWidth: 240, fontFamily: "'Inter', sans-serif",
          }}>
            Sélectionnées pour ton style, filtrables par palette Sanzō Wada.
          </p>
          <Link href="/vetements" style={{
            display: "inline-block",
            background: "#1a1a1a", color: "#ffffff",
            padding: "12px 28px", borderRadius: 999,
            fontSize: 14, fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            textDecoration: "none",
          }}>
            Découvrir
          </Link>
        </div>

        {/* Image droite — fond dégradé crème/beige comme placeholder éditorial */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, #e8ddd0 0%, #d5c9b8 100%)",
          minHeight: 320,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
          className="wada-hero-img"
        >
          {/* Placeholder typographique — à remplacer par vraie photo */}
          <div style={{ textAlign: "center", opacity: 0.4 }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 40, color: "#6B3A32" }}>和田</p>
            <p style={{ fontFamily: "'Inter'", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B3A32" }}>
              Sanzō Wada · 1933
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .wada-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .wada-hero-img {
            order: -1;
            min-height: 200px !important;
          }
          .wada-hero-text {
            padding: 28px 20px !important;
          }
        }
      `}</style>
    </section>
  );
}
