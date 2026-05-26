"use client";
import type { DictionaryEntry } from "@/lib/data";
import { wadaRefCode } from "@/lib/utils";
import OrganicShape, { type ShapeKind } from "./OrganicShape";

interface PaletteOrganicMoodboardProps {
  entry: DictionaryEntry;
  /** Hauteur minimale du moodboard. */
  minHeight?: number;
}

/**
 * PaletteOrganicMoodboard — collage Matisse cut-outs pour chaque palette.
 *
 * Grille asymétrique avec :
 *   - cellules "papier découpé" : forme organique remplie d'une couleur
 *     palette, posée sur une autre couleur palette (papier)
 *   - cartes Pantone superposées, chaque carte montrant une couleur de
 *     la palette avec son code TCX éditorial
 *
 * Le tout déterministe — même palette → même composition à chaque visite.
 * Inspiration : Henri Matisse "Jazz", Pace Creative palette collages.
 */
export default function PaletteOrganicMoodboard({
  entry, minHeight = 600,
}: PaletteOrganicMoodboardProps) {
  const cs = entry.colors;
  const seed = parseInt(entry.number, 10) || 0;

  // Sélection rotative de shapes (déterministe par palette)
  const SHAPE_POOL: ShapeKind[] = ["coral", "flower", "wave", "leaf", "splash", "blob"];
  const pick = (i: number): ShapeKind => SHAPE_POOL[(seed + i * 2) % SHAPE_POOL.length];

  // Récupère couleur n (cycle si la palette en a moins)
  const col = (i: number) => cs[i % cs.length]?.hex || "#1F1B16";

  /* Composition : 6 cellules dans un grid 2×3 asymétrique.
     Chaque cell définit (shape, fill, bg, rotate optionnel). */
  type Cell = {
    shape: ShapeKind;
    fill: string;       // couleur de la forme découpée
    background: string; // couleur du "papier" derrière
    rotate?: number;
    offsetX?: number;
    offsetY?: number;
  };

  const cells: Cell[] = [
    { shape: pick(0), fill: col(0), background: col(1), rotate: 0 },
    { shape: pick(1), fill: col(2), background: col(0), rotate: 15 },
    { shape: pick(2), fill: col(1), background: col(3), rotate: 0 },
    { shape: pick(3), fill: col(3), background: col(2), rotate: -10 },
    { shape: pick(4), fill: col(0), background: col(2), rotate: 25 },
    { shape: pick(5), fill: col(2), background: col(1), rotate: 0 },
  ];

  return (
    <div
      className="wada-organic-moodboard"
      style={{
        position: "relative",
        minHeight,
        background: col(0),
        overflow: "hidden",
      }}
      aria-label={`Moodboard de la palette ${entry.name}`}
    >
      {/* Grille des cellules cut-out */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        height: "100%", minHeight,
      }}>
        {cells.map((cell, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <OrganicShape
              kind={cell.shape}
              fill={cell.fill}
              background={cell.background}
              rotate={cell.rotate}
              offsetX={cell.offsetX || 0}
              offsetY={cell.offsetY || 0}
            />
          </div>
        ))}
      </div>

      {/* Cartes Pantone superposées — 1 par couleur de la palette,
          positionnées en colonne centrale verticale */}
      <div
        className="wada-pantone-overlay"
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", gap: 12,
          zIndex: 10, pointerEvents: "none",
        }}
      >
        {entry.colors.slice(0, Math.min(entry.colors.length, 5)).map((c, i) => (
          <WadaOverlayCard
            key={c.hex}
            hex={c.hex}
            name={c.name}
            paletteNumber={entry.number}
            index={i + 1}
          />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Carte Pantone éditoriale — style cut-out simple
   ────────────────────────────────────────────────────────────────────── */

function WadaOverlayCard({
  hex, name, paletteNumber, index,
}: {
  hex: string; name: string; paletteNumber: string; index: number;
}) {
  /* Brief « Remplacer PANTONE » (25/05) : format WADA au lieu de
     PANTONE® TCX (marque déposée + codes inventés). Cohérent avec
     /palette/[n] et les autres composants WADA. */
  const code = wadaRefCode(hex).replace(/^WADA\s+/, "");

  return (
    <article style={{
      // Brief WADA : pas de #FFF pur → cream pour la chaleur éditoriale.
      background: "var(--wada-cream)",
      boxShadow: "var(--shadow-soft-2)",
      width: 130,
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Swatch couleur — réduit pour ne pas dominer la composition */}
      <div style={{ background: hex, height: 75, width: "100%" }} aria-hidden="true" />
      {/* Métadonnées */}
      <div style={{ padding: "7px 10px 9px", color: "#1F1B16" }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
          margin: "0 0 2px",
        }}>
          WADA
        </p>
        <p style={{ fontSize: 7.5, letterSpacing: "0.04em", margin: "0 0 4px", fontWeight: 500 }}>
          {code}
        </p>
        <p style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 11, fontStyle: "italic", fontWeight: 500,
          margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em",
        }}>
          {name}
        </p>
      </div>
    </article>
  );
}
