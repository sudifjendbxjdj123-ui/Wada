"use client";
/**
 * BoutiqueHero — Hero de la page /boutique.
 * Brief 2026-06-06 : affiche le visuel « Boutique numero 2 » (boutique-2.png)
 * en plein écran, bord à bord, mais FONDU dans la page : un léger dégradé en
 * haut et en bas dissout les bords de l'image dans le fond crème — l'image
 * fait partie de la page au lieu d'être un rectangle rapporté.
 */

const PAGE_BG = "#FAF8F4";          // = fond <main> de /boutique
const PAGE_BG_0 = "rgba(250,248,244,0)";

export function BoutiqueHero() {
  return (
    <section className="wada-bh-section" aria-label="Boutique">
      {/* H1 accessible / SEO — le titre visuel est dans l'image */}
      <h1 style={{
        position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
        overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
      }}>
        Boutique
      </h1>

      <div className="wada-bh-wrap">
        <img
          src="/hero/boutique-2.png"
          alt="Boutique WADA — sélection de pièces par palette Sanzō Wada"
          className="wada-bh-img"
        />
        {/* Fondus haut / bas pour intégrer l'image au fond de page */}
        <div className="wada-bh-fade wada-bh-fade-top" aria-hidden />
        <div className="wada-bh-fade wada-bh-fade-bottom" aria-hidden />
      </div>

      <style>{`
        /* Double-classe pour battre les paddings globaux !important de
           globals.css → full-bleed réel (image bord à bord). */
        .wada-bh-section.wada-bh-section {
          display: block;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          background: ${PAGE_BG};
        }
        .wada-bh-wrap {
          position: relative;
          width: 100%;
          line-height: 0;
        }
        .wada-bh-img {
          display: block;
          width: 100%;
          height: auto;
        }
        .wada-bh-fade {
          position: absolute;
          left: 0;
          right: 0;
          pointer-events: none;
        }
        .wada-bh-fade-top {
          top: 0;
          height: 7%;
          background: linear-gradient(${PAGE_BG}, ${PAGE_BG_0});
        }
        .wada-bh-fade-bottom {
          bottom: 0;
          height: 8%;
          background: linear-gradient(${PAGE_BG_0}, ${PAGE_BG});
        }
      `}</style>
    </section>
  );
}
