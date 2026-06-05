"use client";
/**
 * BoutiqueHero — Hero affiche de la page /boutique.
 * Brief 2026-06-05 : visuel « Boutique » (sac sur fond ciel + labels
 * manuscrits). L'image porte le texte ; on pose par-dessus des zones
 * cliquables transparentes (positionnées en %) pour que chaque catégorie
 * navigue réellement. L'image garde son ratio 3/4 → hotspots alignés à
 * toutes les tailles.
 *
 * Amélioration 2026-06-05 (présentation, image inchangée) :
 *   - full-bleed : l'image prend TOUTE la largeur (bord à bord), plus de
 *     poster centré ni de marges
 *   - ratio 3/4 conservé (aucun label coupé)
 *   - survol révélant les zones cliquables
 */
import Link from "next/link";

/* Zones cliquables — coordonnées en % du cadre (centre de chaque label). */
const HOTSPOTS: Array<{ label: string; href: string; x: number; y: number; w: number; h: number }> = [
  { label: "Chaussures", href: "/chaussures",  x: 16, y: 27, w: 30, h: 8 },
  { label: "Accessoires", href: "/accessoires", x: 85, y: 41, w: 32, h: 8 },
  { label: "Marques",     href: "/marques",     x: 12, y: 52, w: 28, h: 8 },
  { label: "Nouveautés",  href: "/vetements",   x: 50, y: 76, w: 38, h: 9 },
  { label: "Sacs",        href: "/sacs",         x: 30, y: 95, w: 24, h: 8 },
  { label: "Vêtements",   href: "/vetements",   x: 74, y: 95, w: 28, h: 8 },
];

export function BoutiqueHero() {
  return (
    <section className="wada-bh-section">
      <div className="wada-bh-poster">
        {/* H1 accessible / SEO — le titre visuel est dans l'image */}
        <h1 style={{
          position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
          overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
        }}>
          Boutique
        </h1>

        <img
          src="/hero/boutique-hero.png"
          alt="Boutique WADA — sélection de pièces par palette Sanzō Wada"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {/* Zones cliquables par catégorie */}
        {HOTSPOTS.map((h) => (
          <Link
            key={h.label}
            href={h.href}
            aria-label={h.label}
            title={h.label}
            className="wada-bh-hot"
            style={{
              position: "absolute",
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.w}%`,
              height: `${h.h}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      <style>{`
        /* Double-classe pour battre les paddings globaux !important de
           globals.css (section{padding:5%}, main>section{padding:48px 4vw},
           :first-of-type{padding-top:64px}) → full-bleed réel. */
        .wada-bh-section.wada-bh-section {
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
        }
        /* Full-bleed : l'image occupe toute la largeur, bord à bord */
        .wada-bh-poster {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }
        .wada-bh-hot {
          display: block;
          border-radius: 999px;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }
        /* Halo UNIQUEMENT sur appareils à vrai pointeur (souris). Au toucher,
           le :hover « colle » après un tap et affiche un cadre blanc sur le
           label — donc on l'exclut du tactile. */
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-hot:hover,
          .wada-bh-hot:focus-visible {
            background: rgba(255, 255, 255, 0.16);
            box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.6);
            outline: none;
          }
        }
      `}</style>
    </section>
  );
}
