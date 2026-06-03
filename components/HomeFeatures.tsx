"use client";
/**
 * HomeFeatures — 3 cards Inspiration · Scanner · Dressing.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 */
import Link from "next/link";

const FEATURES = [
  {
    icon: "✦",
    title: "Inspiration personnalisée",
    text: "Des tenues créées pour ton style et ta palette",
    href: "/stylist",
    bg: "#f5efe2",
  },
  {
    icon: "◉",
    title: "Scanne & trouve",
    text: "Scanne une couleur et découvre les palettes Sanzō Wada",
    href: "/scanner",
    bg: "#f5efe2",
  },
  {
    icon: "☰",
    title: "Mon dressing",
    text: "Tes favoris organisés en tenues portables",
    href: "/favoris",
    bg: "#f5efe2",
  },
];

export function HomeFeatures() {
  return (
    <section style={{ padding: "32px 16px 24px" }}>
      <div className="wada-features-grid" style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 10,
      }}>
        {FEATURES.map((feat) => (
          <Link key={feat.href} href={feat.href} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "18px 20px",
              background: feat.bg,
              borderRadius: 16,
              transition: "background 0.15s",
            }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#ede4d4")}
              onMouseOut={(e) => (e.currentTarget.style.background = feat.bg)}
            >
              <span style={{
                fontSize: 24, flexShrink: 0, width: 40, textAlign: "center",
                color: "#6B3A32",
              }}>
                {feat.icon}
              </span>
              <div>
                <p style={{
                  margin: "0 0 3px",
                  fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                  fontWeight: 700, color: "#1a1a1a", fontFamily: "'Inter'",
                }}>
                  {feat.title}
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#5a5a5a", fontFamily: "'Inter'", lineHeight: 1.4 }}>
                  {feat.text}
                </p>
              </div>
              <span style={{ marginLeft: "auto", color: "#8a7a68", fontSize: 18 }}>›</span>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .wada-features-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
