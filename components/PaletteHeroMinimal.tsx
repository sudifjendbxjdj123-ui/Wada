"use client";
import type { DictionaryEntry } from "@/lib/data";
import { ink, paper, subtle, border, fontHeading, fontLabel } from "@/lib/styles";

interface PaletteHeroMinimalProps {
  entry: DictionaryEntry;
  /** Hauteur minimale. */
  minHeight?: number;
}

/**
 * PaletteHeroMinimal — visuel hero épuré style COS / Zara / H&M.
 *
 * Pas de Matisse cut-outs, pas de patterns, pas de noise. Juste les
 * couleurs de la palette en bandes verticales pleines, plus 1 carte
 * Pantone discrète positionnée en bas-gauche.
 *
 * Esprit : grande surface de couleur, espace blanc, métadonnée minimale.
 * Le sujet est la palette elle-même — pas une mise en scène.
 */
export default function PaletteHeroMinimal({
  entry, minHeight = 560,
}: PaletteHeroMinimalProps) {
  const cs = entry.colors;

  /* Code TCX éditorial déterministe — utilisé sur la carte unique */
  const primary = cs[0];
  const code = (() => {
    const c = primary.hex.replace("#", "").padStart(6, "0");
    const sum = c.split("").reduce((a, ch) => a + parseInt(ch, 16), 0);
    const b1 = String((sum % 22) + 1).padStart(2, "0");
    const b2 = (
      parseInt(c.slice(0, 2), 16) * 16 +
      parseInt(c.slice(2, 4), 16) * 4 +
      parseInt(c.slice(4, 6), 16)
    ).toString().slice(0, 4).padStart(4, "0");
    return `${b1}-${b2} TCX`;
  })();

  return (
    <div
      style={{
        position: "relative",
        minHeight,
        display: "flex",
        background: paper,
      }}
      aria-label={`Visuel de la palette ${entry.name}`}
    >
      {/* Bandes verticales pleines — 1 par couleur, sans bordure */}
      {cs.map((c) => (
        <div
          key={c.hex}
          style={{ flex: 1, background: c.hex, minHeight }}
          aria-hidden="true"
        />
      ))}

      {/* Carte Pantone unique en bas-gauche — discret, COS-style */}
      <article
        style={{
          position: "absolute",
          bottom: 32, left: 32,
          background: paper,
          padding: "14px 18px 16px",
          minWidth: 180,
          fontFamily: fontLabel,
          color: ink,
          boxShadow: "0 4px 16px rgba(31, 27, 22, 0.10)",
        }}
        aria-hidden="true"
      >
        <div style={{ background: primary.hex, height: 80, marginInline: -18, marginTop: -14, marginBottom: 12 }} />
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 2px" }}>
          PANTONE<sup style={{ fontSize: "0.6em" }}>®</sup>
        </p>
        <p style={{ fontSize: 9, letterSpacing: "0.04em", margin: "0 0 6px", fontWeight: 500, color: subtle }}>
          {code}
        </p>
        <p style={{
          fontFamily: fontHeading, fontSize: 14, fontStyle: "italic", fontWeight: 500,
          margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
        }}>
          {primary.name}
        </p>
      </article>

      {/* Label numéro palette en bas-droite — repère discret */}
      <p
        style={{
          position: "absolute",
          bottom: 32, right: 32,
          margin: 0,
          fontFamily: fontLabel, fontSize: 10,
          letterSpacing: "0.4em", textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.85)", fontWeight: 600,
          textShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        No. {entry.number}
      </p>
    </div>
  );
}
