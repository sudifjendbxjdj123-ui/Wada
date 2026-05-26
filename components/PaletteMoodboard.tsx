"use client";
import type { DictionaryEntry } from "@/lib/data";
import { dictionary } from "@/lib/data";
import { ink, paper, subtle, sectionLabel, mojo } from "@/lib/styles";
import PantoneCard from "./PantoneCard";
import WadaVisual from "./WadaVisual";

interface PaletteMoodboardProps {
  entry: DictionaryEntry;
}

/**
 * PaletteMoodboard — collage éditorial Pantone-style d'une palette WADA.
 *
 * En l'absence de vraies photos produit (PA-API non encore activé), on
 * compose l'identité visuelle de chaque palette comme un mood-board :
 *   - Cartes Pantone (1 par couleur de la palette)
 *   - Photos éditoriales (du pack v2/, tinté selon la palette)
 *   - Blocs textures (gradient, marbré, points, etc.)
 *   - Grand bloc "couleur dominante" centré
 *
 * Le tout dans une grille CSS irrégulière (cell span) qui simule
 * l'esthétique Pantone collage des refs Pinterest.
 *
 * La sélection des photos est déterministe (basée sur le numéro de
 * palette) — pas de surprise au refresh, c'est l'identité fixe de la palette.
 */
export default function PaletteMoodboard({ entry }: PaletteMoodboardProps) {
  // Sélection déterministe de 2 palettes voisines (pour les visuels WADA-natifs)
  const seed = parseInt(entry.number, 10);
  const sibling = dictionary.find((d) => d.number === String((seed % 30) + 1).padStart(3, "0")) || entry;

  // Couleur dominante (la première de la palette)
  const dominant = entry.colors[0]?.hex || "#1F1B16";

  return (
    <section style={{ background: paper }}>
      {/* Header section */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>Mood-board</p>
        <h2 style={{
          fontSize: 36, fontStyle: "italic", fontWeight: 500, margin: "0 0 10px",
          fontFamily: "'Fredoka', sans-serif",
          letterSpacing: "-0.015em", color: ink, lineHeight: 1.1,
        }}>
          L'identité visuelle de {entry.name}.
        </h2>
        <p style={{
          fontSize: 14, color: subtle, fontStyle: "italic",
          margin: "0 auto", maxWidth: 540,
          fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
        }}>
          La palette devient un univers — couleurs Pantone, textures, photos. Cliquez en bas pour acheter les pièces qui l'incarnent.
        </p>
      </div>

      {/* Collage grid */}
      <div
        className="wada-moodboard-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: "160px",
          gap: 12,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Cell 1 : visuel WADA-natif — OutfitAvatar dans cette palette, span 2x2 */}
        <div
          className="wada-moodboard-photo"
          style={{
            gridColumn: "span 2",
            gridRow: "span 2",
            overflow: "hidden",
            position: "relative",
            background: paper,
            border: `1px solid rgba(31, 27, 22, 0.15)`,
          }}
        >
          <WadaVisual kind="outfit-stack" entry={entry} minHeight={320} />
        </div>

        {/* Pantone cards — 1 par couleur (max 4 visibles) */}
        {entry.colors.slice(0, Math.min(entry.colors.length, 4)).map((c, i) => (
          <div key={c.hex} style={{ gridRow: "span 2", display: "flex", justifyContent: "center", alignItems: "stretch" }}>
            <div style={{ width: "100%", display: "flex" }}>
              <PantoneCardCell
                hex={c.hex}
                name={c.name}
                paletteNumber={entry.number}
                index={i + 1}
              />
            </div>
          </div>
        ))}

        {/* Cell texture marbrée — gradient inspiré de la palette */}
        <div
          style={{
            gridColumn: "span 2",
            background: `linear-gradient(135deg, ${entry.colors[0]?.hex || "#1F1B16"} 0%, ${entry.colors[1]?.hex || "#F4EFE6"} 50%, ${entry.colors[entry.colors.length - 1]?.hex || "#1F1B16"} 100%)`,
            position: "relative",
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          {/* Texture noise overlay pour effet papier */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.8' /></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/></svg>\")",
            mixBlendMode: "overlay",
            opacity: 0.55,
          }} />
          <span style={{
            position: "absolute", bottom: 12, left: 16,
            fontFamily: "'Inter', sans-serif", fontSize: 9,
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.95)", fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            Gradient · {entry.name}
          </span>
        </div>

        {/* Cell 2 : bandes verticales chromatiques (palette display, span 2) */}
        <div
          style={{
            gridColumn: "span 2",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <WadaVisual kind="palette-bands" colors={entry.colors.map((c) => c.hex)} minHeight={160} />
        </div>

        {/* Cell pattern à carreaux — référence Pantone moodboard */}
        <div
          style={{
            gridRow: "span 2",
            position: "relative",
            background: entry.colors[Math.min(2, entry.colors.length - 1)]?.hex || "#F4EFE6",
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          <svg
            width="100%" height="100%"
            viewBox="0 0 80 80"
            preserveAspectRatio="xMidYMid slice"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              <pattern id={`grid-${entry.number}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${entry.number})`} />
          </svg>
          <span style={{
            position: "absolute", bottom: 12, left: 12,
            fontFamily: "'Inter', sans-serif", fontSize: 8,
            letterSpacing: "0.35em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.95)", fontWeight: 600,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            Texture
          </span>
        </div>

        {/* Cell numéro de palette grand format — référence livre Sanzo Wada */}
        <div
          style={{
            background: paper,
            border: `1px solid rgba(31, 27, 22, 0.15)`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            position: "relative",
          }}
        >
          <p style={{
            fontSize: 9, letterSpacing: "0.45em", textTransform: "uppercase",
            color: subtle, fontFamily: "'Inter', sans-serif", margin: 0, fontWeight: 600,
          }}>
            No.
          </p>
          <p style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 56, fontWeight: 500, fontStyle: "italic",
            color: ink, margin: "4px 0 0", lineHeight: 1,
            letterSpacing: "-0.02em",
          }}>
            {entry.number}
          </p>
        </div>

        {/* Cell culture / origine */}
        {entry.culture && (
          <div style={{
            background: ink,
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: "'Noto Serif JP', 'Fredoka', sans-serif",
              fontSize: 32, margin: 0, lineHeight: 1.1,
              color: "#FFFFFF",
            }}>
              和田
            </p>
            <p style={{
              fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              fontFamily: "'Inter', sans-serif", margin: "8px 0 0", fontWeight: 600,
            }}>
              {entry.culture}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Cellule wrapper qui fait remplir le card Pantone à 100 % de la cellule grid. */
function PantoneCardCell(props: { hex: string; name: string; paletteNumber: string; index: number }) {
  return (
    <article style={{
      width: "100%",
      background: "#FFFFFF",
      boxShadow: "0 2px 8px rgba(31, 27, 22, 0.08)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ background: props.hex, flex: 1, minHeight: 60 }} aria-hidden="true" />
      <div style={{ padding: 14, color: "#1F1B16" }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 4px" }}>
          PANTONE<sup style={{ fontSize: "0.55em", verticalAlign: "super" }}>®</sup>
        </p>
        <p style={{ fontSize: 9, letterSpacing: "0.05em", margin: "0 0 8px", fontWeight: 500 }}>
          {tcxFromHex(props.hex)}
        </p>
        <p style={{
          fontSize: 14,
          fontFamily: "'Fredoka', sans-serif",
          fontStyle: "italic", fontWeight: 500, margin: "0 0 4px",
          lineHeight: 1.2, letterSpacing: "-0.01em",
        }}>
          {props.name}
        </p>
        <p style={{
          fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(31, 27, 22, 0.5)", margin: 0, fontWeight: 600,
        }}>
          No. {props.paletteNumber} · {String(props.index).padStart(2, "0")}
        </p>
      </div>
    </article>
  );
}

/** Code TCX éditorial déterministe depuis un hex — same hex → same code. */
function tcxFromHex(hex: string): string {
  const c = hex.replace("#", "").padStart(6, "0");
  const sum = c.split("").reduce((a, ch) => a + parseInt(ch, 16), 0);
  const block1 = String((sum % 22) + 1).padStart(2, "0");
  const block2 = (
    parseInt(c.slice(0, 2), 16) * 16 +
    parseInt(c.slice(2, 4), 16) * 4 +
    parseInt(c.slice(4, 6), 16)
  ).toString().slice(0, 4).padStart(4, "0");
  return `${block1}-${block2} TCX`;
}
