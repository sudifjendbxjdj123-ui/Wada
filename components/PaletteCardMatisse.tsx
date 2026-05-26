"use client";
import type { DictionaryEntry } from "@/lib/data";
import { ink, border } from "@/lib/styles";

interface PaletteCardMatisseProps {
  entry: DictionaryEntry;
  /** Hauteur du moodboard. Défaut 280. */
  height?: number;
}

/**
 * PaletteCardMatisse — affichage palette éditorial, bandes de couleur pleines.
 *
 * Brief UX client (26/05) — verbatim : « tu ma remis les palettes Pantones
 * efface les pour de bon celles la et mes les nouvelles ».
 *
 * L'ancienne version (cellules organiques cut-out + mini-cartes crème
 * superposées avec code « WADA XX-XXXX-XXXX ») rappelait visuellement les
 * nuanciers Pantone collés sur Matisse — exactement ce que le client
 * refuse depuis le début. Plus de cut-outs SVG, plus de mini-cartes
 * flottantes, plus de codes overlay.
 *
 * Nouvelle composition (alignée sur la hero /palette/[n]) :
 *   - Bandes verticales pleines, une par couleur de la palette
 *   - Légende discrète en bas : noms des couleurs séparés par ·
 *
 * Pas de cellules organiques, pas d'overlay carte, pas de code Pantone-like.
 * On garde le nom du composant pour ne pas casser les imports existants
 * (PaletteCard, WadaVisual, app/about, etc.).
 */
export default function PaletteCardMatisse({ entry, height = 280 }: PaletteCardMatisseProps) {
  const cs = entry.colors;

  return (
    <div
      className="wada-zoom"
      style={{
        position: "relative",
        height,
        background: cs[0]?.hex || "#1F1B16",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      aria-label={`Palette ${entry.name} — ${cs.map((c) => c.name).join(", ")}`}
    >
      {/* Bandes pleines — flex 1 chacune, séparées par 1px de border pour
          la lisibilité quand 2 teintes proches se touchent. */}
      <div
        className="wada-palette-bands"
        style={{
          display: "flex",
          flex: 1,
        }}
      >
        {cs.map((c, i) => (
          <div
            key={c.hex + i}
            style={{
              flex: 1,
              background: c.hex,
              borderRight: i < cs.length - 1 ? `1px solid rgba(255,255,255,0.06)` : "none",
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Légende discrète — noms des couleurs en bas, fond crème translucide
          pour la lisibilité quelle que soit la palette (claire ou sombre). */}
      <div
        style={{
          padding: "10px 14px",
          background: "rgba(250, 248, 244, 0.92)",
          borderTop: `1px solid ${border}`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: ink,
            fontStyle: "italic",
            margin: 0,
            fontFamily: "'EB Garamond', Georgia, serif",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cs.map((c) => c.name).join(" · ")}
        </p>
      </div>
    </div>
  );
}
