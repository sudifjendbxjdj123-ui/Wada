"use client";
/**
 * OutfitLayout — Organise les 5 pièces de la tenue dans un layout asymétrique.
 *
 * Structure :
 * - Accent (petit, top-right)
 * - Grid 2×2 : Haut | Chaussures / Bas | Veste
 * - Palette strip en bas
 * - Explainer (Pourquoi ça marche)
 * - Adjust bar (chips d'ajustement)
 */

import { OutfitSlotCard } from "./OutfitSlotCard";
import { OutfitExplainer } from "./OutfitExplainer";
import { OutfitAdjustBar } from "./OutfitAdjustBar";
import type { OutfitPiece } from "@/lib/composer/microTypes";

export interface OutfitLayoutProps {
  pieces: OutfitPiece[];
  genre?: string | null;
  style?: string | null;
  pourquoi?: string;
  explication?: {
    palette?: string;
    pieces?: string;
    profil?: string;
  };
  paletteColors?: Array<{ hex: string; name: string }>;
  onAdjust?: (label: string) => void;
  loading?: boolean;
}

const BORDEAUX = "#6B3A32";

export function OutfitLayout({
  pieces,
  genre,
  style,
  pourquoi,
  explication,
  paletteColors,
  onAdjust,
  loading = false,
}: OutfitLayoutProps) {
  const piecesMap = Object.fromEntries(
    pieces.map((p) => [p.role, p])
  );

  return (
    <div style={{ marginTop: 24 }}>
      {/* HEADER */}
      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a68", margin: "0 0 8px 0", fontFamily: "'Inter'" }}>
        La tenue
      </p>

      {/* MAIN GRID — Asymétrique */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "auto auto auto",
          gap: 14,
          position: "relative",
          marginBottom: 16,
        }}
      >
        {/* ACCENT — petit, top-right */}
        {piecesMap.Accent && (
          <div
            style={{
              gridColumn: "1 / 3",
              gridRow: 1,
              maxWidth: 160,
              justifySelf: "end",
              marginRight: -8,
              marginTop: -12,
              zIndex: 2,
            }}
          >
            <OutfitSlotCard
              piece={piecesMap.Accent}
              size="small"
              genre={genre}
              style={style}
              loading={loading}
            />
          </div>
        )}

        {/* HAUT — top-left */}
        {piecesMap.Haut && (
          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <OutfitSlotCard
              piece={piecesMap.Haut}
              size="large"
              genre={genre}
              style={style}
              loading={loading}
            />
          </div>
        )}

        {/* CHAUSSURES — top-right */}
        {piecesMap.Chaussures && (
          <div style={{ gridColumn: 2, gridRow: 2 }}>
            <OutfitSlotCard
              piece={piecesMap.Chaussures}
              size="large"
              genre={genre}
              style={style}
              loading={loading}
            />
          </div>
        )}

        {/* BAS — bottom-left */}
        {piecesMap.Bas && (
          <div style={{ gridColumn: 1, gridRow: 3 }}>
            <OutfitSlotCard
              piece={piecesMap.Bas}
              size="large"
              genre={genre}
              style={style}
              loading={loading}
            />
          </div>
        )}

        {/* VESTE — bottom-right */}
        {piecesMap.Veste && (
          <div style={{ gridColumn: 2, gridRow: 3 }}>
            <OutfitSlotCard
              piece={piecesMap.Veste}
              size="large"
              genre={genre}
              style={style}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* PALETTE STRIP */}
      {paletteColors && paletteColors.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            height: 12,
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {paletteColors.slice(0, 5).map((c) => (
            <div
              key={c.hex}
              title={c.name}
              style={{
                flex: 1,
                background: c.hex,
                border: `1px solid rgba(30,30,30,.08)`,
              }}
            />
          ))}
        </div>
      )}

      {/* EXPLAINER */}
      {pourquoi && (
        <OutfitExplainer
          pourquoi={pourquoi}
          explication={explication}
          colors={paletteColors}
        />
      )}

      {/* ADJUST BAR */}
      {onAdjust && <OutfitAdjustBar onAdjust={onAdjust} />}

      {/* RESPONSIVE STYLES */}
      <style>{`
        @media (max-width: 640px) {
          [data-outfit-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
