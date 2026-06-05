"use client";
/**
 * BoutiqueHero — Hero de /boutique, même traitement que la home (app/page.tsx) :
 * photo plein cadre + dégradé bas + contenu superposé (kicker + titre Fredoka
 * + 2 boutons). Brief 2026-06-06 « rends bien comme la home ».
 *
 * Photo : boutique-hero-photo.png (sandales sur tissu, propre, sans texte cuit).
 */
import Link from "next/link";

const CREAM = "#FAF8F4";

/* Catégories affichées en pills dans le hero. */
const CATEGORIES: Array<{ label: string; href: string }> = [
  { label: "Nouveautés",  href: "/vetements" },
  { label: "Chaussures",  href: "/chaussures" },
  { label: "Sacs",        href: "/sacs" },
  { label: "Accessoires", href: "/accessoires" },
  { label: "Marques",     href: "/marques" },
];

export function BoutiqueHero() {
  return (
    <section className="wada-bh-section" aria-label="Boutique">
      <div className="wada-bh-hero">
        <img
          src="/hero/boutique-hero-photo.png"
          alt=""
          aria-hidden="true"
          className="wada-bh-img"
        />

        {/* Dégradé bas pour la lisibilité du texte (comme la home) */}
        <div className="wada-bh-scrim" aria-hidden />

        {/* Contenu superposé */}
        <div className="wada-bh-content">
          <p className="wada-bh-kicker">Inspiré de Sanzō Wada · 1933</p>
          <h1 className="wada-bh-title">Boutique</h1>
          <p className="wada-bh-sub">Chaque pièce, sa couleur.</p>

          <nav className="wada-bh-cats" aria-label="Catégories">
            {CATEGORIES.map((c) => (
              <Link key={c.label} href={c.href} className="wada-bh-cat">
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <style>{`
        /* Double-classe : bat les paddings globaux !important → full-bleed. */
        .wada-bh-section.wada-bh-section {
          display: block;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          background: ${CREAM};
        }
        .wada-bh-hero {
          position: relative;
          width: 100%;
          height: 82vh;
          max-height: 760px;
          min-height: 440px;
          overflow: hidden;
        }
        .wada-bh-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 32%;
        }
        .wada-bh-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg,
            rgba(0,0,0,0) 0%, rgba(0,0,0,0) 38%,
            rgba(0,0,0,0.34) 70%, rgba(0,0,0,0.6) 100%);
        }
        .wada-bh-content {
          position: absolute;
          left: 0; right: 0;
          bottom: calc(40px + env(safe-area-inset-bottom, 0px));
          padding: 0 22px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
        }
        .wada-bh-kicker {
          margin: 0 0 14px;
          font-family: 'Inter', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: #F4EFE7; text-shadow: 0 1px 6px rgba(0,0,0,0.6);
        }
        .wada-bh-title {
          margin: 0;
          font-family: 'Fredoka', sans-serif; font-weight: 600;
          font-size: clamp(44px, 12vw, 72px); line-height: 1;
          color: #fff; letter-spacing: -0.01em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
        }
        .wada-bh-sub {
          margin: 12px 0 0;
          font-family: 'Inter', sans-serif; font-size: 15px;
          color: #f4efe2; text-shadow: 0 1px 8px rgba(0,0,0,0.55);
        }
        .wada-bh-cats {
          margin-top: 24px;
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 10px; max-width: 430px;
        }
        .wada-bh-cat {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 11px 20px; border-radius: 999px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          text-decoration: none;
          background: rgba(250,248,244,0.16);
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          color: #fff; border: 1.5px solid rgba(255,255,255,0.5);
          transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-cat:hover {
            transform: translateY(-1px);
            background: rgba(250,248,244,0.92); color: #1a1a1a; border-color: ${CREAM};
          }
        }
        /* Desktop : un peu moins haut, photo bien cadrée */
        @media (min-width: 760px) {
          .wada-bh-hero { height: 78vh; }
        }
      `}</style>
    </section>
  );
}
