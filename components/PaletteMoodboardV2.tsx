"use client";
import type { DictionaryEntry } from "@/lib/data";

interface PaletteMoodboardV2Props {
  entry: DictionaryEntry;
  /** Hauteur minimale du moodboard. Défaut 600px. */
  minHeight?: number;
}

/* Banque de textures/photos Unsplash — sélectionnées pour leur grain
   éditorial. Toutes tintées à la volée par les couleurs de la palette via
   mix-blend-mode: color. Cela évite la dépendance à une exacte
   correspondance hex/photo : N'IMPORTE quelle texture devient "dans la
   palette" via la tinte CSS. */
const TEXTURE_PHOTOS = [
  "photo-1583847268964-b28dc8f51f92", // cuir
  "photo-1502691876148-a84978e59af8", // eau / surface bleue
  "photo-1556228720-195a672e8a03",    // tissu lin
  "photo-1517292987719-0369a794ec0f", // papier blanc
  "photo-1551244072-5d12893278ab",    // peinture / texture
  "photo-1538806690586-c8b08d3f02f7", // textile
  "photo-1605714196241-00bb0ee6483f", // grain alimentaire
  "photo-1611080626919-7cf5a9395c7d", // food close-up
  "photo-1528821128474-25f5e8d76685", // close food
  "photo-1610136649454-46cb56f6e6e4", // bois texture
  "photo-1602810318383-e386cc2a3ccf", // textile détail
  "photo-1568430462989-44163eb1c0c1", // terracotta
];

const unsplash = (id: string, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/* Patterns SVG d'overlay pour textures CSS — donnent du grain
   à un bloc de couleur plate sans avoir besoin d'une photo. */
const NOISE_PATTERN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' /></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>";
const CROCO_PATTERN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 0 L20 8 L40 0 M0 16 L20 24 L40 16 M0 32 L20 40 L40 32' stroke='rgba(0,0,0,0.15)' fill='none' stroke-width='0.5'/></svg>";

/**
 * PaletteMoodboardV2 — collage style Pinterest pour chaque palette.
 *
 * Génère un grid irrégulier 6 colonnes × auto-rows 80px où alternent :
 *   - flats de couleur palette (CSS pur — fiable et instantané)
 *   - flats avec pattern noise / croco / waves (CSS pur + SVG inline)
 *   - photos texture Unsplash tintées par mix-blend-mode color
 *
 * Sélection déterministe : même palette → même moodboard à chaque visite.
 *
 * Inspiration : moodboards Pace Creative, Pantone Color of the Year.
 */
export default function PaletteMoodboardV2({ entry, minHeight = 600 }: PaletteMoodboardV2Props) {
  // Seed déterministe pour rotation des photos
  const seed = parseInt(entry.number, 10) || 0;
  const cs = entry.colors;

  // Sélection de 4 photos texture (rotation déterministe)
  const pickPhoto = (i: number) => unsplash(TEXTURE_PHOTOS[(seed * 7 + i * 3) % TEXTURE_PHOTOS.length]);

  // Composition des cells — pattern asymétrique
  // Chaque cell : { type, color/photo, span: [cols, rows] }
  type Cell =
    | { kind: "flat";      color: string;            cols: number; rows: number }
    | { kind: "pattern";   color: string; pattern: string; cols: number; rows: number }
    | { kind: "photo";     photo: string; tint: string; cols: number; rows: number };

  const cells: Cell[] = [
    // Row 1 — 6 cols, 3 rows
    { kind: "flat",     color: cs[0]?.hex || "#5C5A3C",                                  cols: 2, rows: 3 },
    { kind: "pattern",  color: cs[1]?.hex || "#A8AC6B", pattern: CROCO_PATTERN,          cols: 1, rows: 3 },
    { kind: "photo",    photo: pickPhoto(0),            tint: cs[2]?.hex || "#1F1B16",   cols: 2, rows: 3 },
    { kind: "pattern",  color: cs[3]?.hex || cs[0]?.hex || "#1F1B16", pattern: CROCO_PATTERN, cols: 1, rows: 3 },

    // Row 2 — 6 cols, 4 rows
    { kind: "photo",    photo: pickPhoto(1),            tint: cs[1]?.hex || "#A8AC6B",   cols: 2, rows: 4 },
    { kind: "flat",     color: cs[2]?.hex || cs[0]?.hex || "#3A4555",                    cols: 2, rows: 2 },
    { kind: "flat",     color: cs[3]?.hex || cs[1]?.hex || "#9CAF88",                    cols: 1, rows: 4 },
    { kind: "pattern",  color: cs[0]?.hex || "#5C5A3C", pattern: NOISE_PATTERN,          cols: 1, rows: 4 },
    { kind: "flat",     color: cs[1]?.hex || "#E8DFC8",                                  cols: 2, rows: 2 },

    // Row 3 — 6 cols, 3 rows
    { kind: "pattern",  color: cs[0]?.hex || "#5C2018", pattern: NOISE_PATTERN,          cols: 2, rows: 3 },
    { kind: "photo",    photo: pickPhoto(2),            tint: cs[0]?.hex || "#5C2018",   cols: 2, rows: 3 },
    { kind: "flat",     color: cs[1]?.hex || cs[0]?.hex || "#3A4555",                    cols: 1, rows: 3 },
    { kind: "flat",     color: cs[2]?.hex || cs[0]?.hex || "#1F1B16",                    cols: 1, rows: 3 },
  ];

  return (
    <div
      className="wada-moodboard-v2"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gridAutoRows: "80px",
        gap: 0,
        minHeight,
        width: "100%",
      }}
      aria-label={`Moodboard ${entry.name}`}
    >
      {cells.map((cell, i) => {
        const style: React.CSSProperties = {
          gridColumn: `span ${cell.cols}`,
          gridRow: `span ${cell.rows}`,
          position: "relative",
          overflow: "hidden",
        };
        if (cell.kind === "flat") {
          return <div key={i} style={{ ...style, background: cell.color }} aria-hidden="true" />;
        }
        if (cell.kind === "pattern") {
          return (
            <div key={i} style={{ ...style, background: cell.color }} aria-hidden="true">
              <div
                style={{
                  position: "absolute", inset: 0,
                  backgroundImage: `url("${cell.pattern}")`,
                  mixBlendMode: "multiply",
                  opacity: 0.5,
                }}
              />
            </div>
          );
        }
        // kind === "photo"
        return (
          <div key={i} style={{ ...style, background: cell.tint }} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cell.photo}
              alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", display: "block",
                filter: "saturate(0.85) contrast(1.05)",
              }}
            />
            <div
              style={{
                position: "absolute", inset: 0,
                background: cell.tint,
                opacity: 0.45, mixBlendMode: "color",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
