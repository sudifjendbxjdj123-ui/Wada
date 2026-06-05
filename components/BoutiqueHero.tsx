"use client";
/**
 * BoutiqueHero — Hero affiche de la page /boutique.
 * Brief 2026-06-05 : remplace le HomeHero éditorial par le visuel « Boutique »
 * (sac sur fond ciel + labels manuscrits). L'image porte le texte ; on pose
 * par-dessus des zones cliquables transparentes (positionnées en %) pour que
 * chaque catégorie navigue réellement. L'image garde son ratio 3/4, donc les
 * hotspots restent alignés à toutes les tailles.
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
    <section style={{ margin: "16px 16px 0", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          aspectRatio: "3 / 4",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
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
            style={{
              position: "absolute",
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.w}%`,
              height: `${h.h}%`,
              transform: "translate(-50%, -50%)",
              borderRadius: 999,
              display: "block",
            }}
          />
        ))}
      </div>
    </section>
  );
}
