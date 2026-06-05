"use client";
/**
 * BoutiqueHero — Hero de /boutique, même traitement que la home (app/page.tsx) :
 * photo plein cadre + dégradé bas + contenu superposé (kicker + titre Fredoka
 * + 2 boutons). Brief 2026-06-06 « rends bien comme la home ».
 *
 * Photo : boutique-hero-photo.png (sandales sur tissu, propre, sans texte cuit).
 */
import Link from "next/link";

const BORDEAUX = "#6B3A32";
const CREAM = "#FAF8F4";

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

          <div className="wada-bh-cta">
            <Link href="/vetements" className="wada-bh-btn wada-bh-btn-primary">
              <span>Découvrir les pièces</span>
              <span aria-hidden style={{ fontSize: 17 }}>→</span>
            </Link>
            <Link href="/scanner" className="wada-bh-btn wada-bh-btn-ghost">
              Scanner une couleur
            </Link>
          </div>
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
        .wada-bh-cta {
          margin-top: 26px;
          display: flex; flex-direction: column; gap: 12px;
          align-items: center; width: 100%; max-width: 330px;
        }
        .wada-bh-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 10px; width: 100%;
          padding: 15px 30px; border-radius: 999px;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
          text-decoration: none; transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, color 0.3s ease;
        }
        .wada-bh-btn-primary {
          background: ${BORDEAUX}; color: ${CREAM};
          box-shadow: 0 14px 40px rgba(0,0,0,0.35);
        }
        .wada-bh-btn-ghost {
          background: rgba(250,248,244,0.18);
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          color: #fff; border: 1.5px solid rgba(255,255,255,0.55);
        }
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 18px 48px rgba(0,0,0,0.42); }
          .wada-bh-btn-ghost:hover { background: rgba(250,248,244,0.92); color: #1a1a1a; border-color: ${CREAM}; }
        }
        /* Desktop : un peu moins haut, photo bien cadrée */
        @media (min-width: 760px) {
          .wada-bh-hero { height: 78vh; }
        }
      `}</style>
    </section>
  );
}
