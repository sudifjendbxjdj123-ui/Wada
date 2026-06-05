"use client";
/**
 * HomeSelections — 6 cards de catégories horizontales.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 */
import Link from "next/link";

const SELECTIONS = [
  { label: "Nouveautés", href: "/vetements", color: "#d4c9b8", emoji: "✨" },
  { label: "Boutique", href: "/boutique", color: "#c8d4c0", emoji: "👔" },
  { label: "Chaussures", href: "/chaussures", color: "#c8c0d4", emoji: "👟" },
  { label: "Sacs", href: "/sacs", color: "#d4c0c0", emoji: "👜" },
  { label: "Accessoires", href: "/accessoires", color: "#c0d4d4", emoji: "🕶" },
  { label: "Marques", href: "/marques", color: "#2c2c2a", emoji: "◆" },
];

export function HomeSelections() {
  return (
    <section style={{ padding: "32px 16px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 14,
      }}>
        <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
          Nos sélections
        </h2>
        <Link href="/vetements" style={{ fontSize: 13, color: "#6e3b32", textDecoration: "underline", fontFamily: "'Inter'" }}>
          Voir tout
        </Link>
      </div>

      <div className="wada-selections-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
      }}>
        {SELECTIONS.map((sel) => (
          <Link key={sel.label} href={sel.href} style={{ textDecoration: "none" }}>
            <div style={{
              aspectRatio: "3/4",
              background: sel.color,
              borderRadius: 14,
              overflow: "hidden",
              position: "relative",
              display: "flex",
              alignItems: "flex-end",
            }}>
              {/* Emoji placeholder — à remplacer par vraie image */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -60%)",
                fontSize: 36, opacity: sel.label === "Marques" ? 0.6 : 0.4,
                color: sel.label === "Marques" ? "#f5efe2" : "#1a1a1a",
              }}>
                {sel.emoji}
              </div>
              <div style={{
                width: "100%",
                background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                padding: "20px 10px 10px",
              }}>
                <span style={{
                  color: "#fff", fontSize: 12, fontWeight: 600,
                  fontFamily: "'Inter'", letterSpacing: "0.02em",
                  textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                }}>
                  {sel.label}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .wada-selections-grid {
            grid-template-columns: repeat(6, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
