"use client";
/**
 * BoutiqueHero — Hero de /boutique.
 * Brief 2026-06-06 : fond = MUR de vêtements des marques affiliées qui défile
 * verticalement (entrée par le haut → sortie en bas, boucle infinie), voile
 * sombre + titre Fredoka « Boutique » + pills catégories par-dessus.
 *
 * Le nombre de colonnes est DYNAMIQUE (selon la largeur d'écran) pour que le
 * mur remplisse toujours toute la largeur — autant de <div.col> que de
 * colonnes de grille. Marquee CSS (translateY, contenu dupliqué = boucle
 * sans couture). Images = vrais produits du flux affilié via /api/products.
 */
import { useEffect, useState } from "react";
import Link from "next/link";

const CREAM = "#FAF8F4";
const BORDEAUX = "#6B3A32";
const BORDEAUX_DARK = "#52261f";

const CATEGORIES: Array<{ label: string; href: string }> = [
  { label: "Nouveautés",  href: "/vetements" },
  { label: "Chaussures",  href: "/chaussures" },
  { label: "Sacs",        href: "/sacs" },
  { label: "Accessoires", href: "/accessoires" },
  { label: "Marques",     href: "/marques" },
];

export function BoutiqueHero() {
  const [images, setImages] = useState<string[]>([]);
  const [cols, setCols] = useState(4);

  /* Nombre de colonnes adapté à la largeur (≈1 colonne / 260px). */
  useEffect(() => {
    const update = () => setCols(Math.max(3, Math.round(window.innerWidth / 260)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const slots = ["haut", "bas", "veste"];
      const results = await Promise.all(
        slots.map((s) =>
          fetch(`/api/products?slot=${s}&limit=32`)
            .then((r) => r.json())
            .catch(() => ({ products: [] })),
        ),
      );
      const imgs: string[] = results.flatMap((r) =>
        (r.products ?? [])
          .map((p: { image?: string; largeImage?: string }) => p.image || p.largeImage)
          .filter(Boolean),
      );
      const uniq = Array.from(new Set(imgs)).slice(0, 60);
      if (alive) setImages(uniq);
    })();
    return () => { alive = false; };
  }, []);

  const columns = Array.from({ length: cols }, (_, c) =>
    images.filter((_, i) => i % cols === c),
  );

  return (
    <section className="wada-bh-section" aria-label="Boutique">
      <div className="wada-bh-hero">
        {/* Mur de vêtements défilant (décoratif) */}
        <div
          className="wada-bh-wall"
          aria-hidden="true"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {columns.map((col, ci) => (
            <div
              key={ci}
              className="wada-bh-col"
              style={{ animationDuration: `${30 + (ci % 4) * 7}s`, animationDelay: `-${(ci % 5) * 6}s` }}
            >
              {col.length > 0 &&
                [...col, ...col].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" loading="lazy" decoding="async" />
                ))}
            </div>
          ))}
        </div>

        {/* Voile sombre pour la lisibilité */}
        <div className="wada-bh-scrim" aria-hidden="true" />

        {/* Contenu superposé */}
        <div className="wada-bh-content">
          <p className="wada-bh-kicker">Inspiré de Sanzō Wada · 1933</p>
          <h1 className="wada-bh-title">Boutique</h1>
          <p className="wada-bh-sub">Les pièces de tes marques, par palette.</p>

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
        .wada-bh-section.wada-bh-section {
          display: flex;
          flex: 1 1 auto;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          background: ${CREAM};
        }
        .wada-bh-hero {
          position: relative;
          width: 100%;
          flex: 1 1 auto;
          min-height: 460px;
          overflow: hidden;
          background: #2a2420;
        }
        /* ── Mur défilant ── */
        .wada-bh-wall {
          position: absolute;
          inset: -8px 0;
          display: grid;
          gap: 8px;
          padding: 0 8px;
        }
        .wada-bh-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: max-content;
          animation-name: wada-bh-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .wada-bh-col img {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          border-radius: 10px;
          background: #efeae2;
          display: block;
        }
        /* contenu dupliqué → boucle sans couture, sens HAUT → BAS */
        @keyframes wada-bh-scroll {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wada-bh-col { animation: none; }
        }

        /* ── Voile ── */
        .wada-bh-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg,
            rgba(28,22,18,0.50) 0%, rgba(28,22,18,0.36) 42%,
            rgba(20,14,11,0.72) 100%);
        }

        /* ── Contenu ── */
        .wada-bh-content {
          position: absolute; left: 0; right: 0;
          bottom: calc(92px + env(safe-area-inset-bottom, 0px));
          padding: 0 22px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .wada-bh-kicker {
          margin: 0 0 14px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: #F4EFE7; text-shadow: 0 1px 8px rgba(0,0,0,0.7);
        }
        .wada-bh-title {
          margin: 0;
          font-family: 'Fredoka', sans-serif; font-weight: 600;
          font-size: clamp(44px, 12vw, 72px); line-height: 1;
          color: #fff; letter-spacing: -0.01em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.6);
        }
        .wada-bh-sub {
          margin: 12px 0 0;
          font-family: 'Inter', sans-serif; font-size: 15px;
          color: #f4efe2; text-shadow: 0 1px 10px rgba(0,0,0,0.65);
        }
        .wada-bh-cats {
          margin-top: 24px;
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 10px; max-width: 430px;
        }
        .wada-bh-cat {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 13px 24px; border-radius: 999px;
          font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
          letter-spacing: 0.01em; text-decoration: none;
          background: ${BORDEAUX}; color: ${CREAM};
          border: 1.5px solid rgba(255,255,255,0.45);
          box-shadow: 0 8px 22px rgba(0,0,0,0.4);
          transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-cat:hover {
            transform: translateY(-2px);
            background: ${BORDEAUX_DARK};
            box-shadow: 0 12px 28px rgba(0,0,0,0.5);
          }
        }
      `}</style>
    </section>
  );
}
