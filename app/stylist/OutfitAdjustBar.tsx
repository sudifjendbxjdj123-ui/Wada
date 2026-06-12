"use client";
/**
 * OutfitAdjustBar — Chips d'ajustement organisées.
 * Sections : Garder (primary) | Ajustements | Recommencer
 */

import { useState } from "react";

interface OutfitAdjustBarProps {
  onAdjust: (label: string) => void;
  loading?: boolean;
}

const BORDEAUX = "#6B3A32";

const ADJUSTMENTS = [
  { label: "Plus chaud", help: "Ajoute une touche chaleureuse à l'accord" },
  { label: "Sans veste", help: "Retire la couche externes pour un look plus léger" },
  { label: "Plus décontracté", help: "Rend l'ensemble plus casual et relaxe" },
  { label: "Une autre couleur", help: "Explore une palette différente" },
];

export function OutfitAdjustBar({ onAdjust, loading = false }: OutfitAdjustBarProps) {
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 16 }}>
      {/* KEEP THIS OUTFIT */}
      <button
        onClick={() => onAdjust("Garder cette tenue")}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: BORDEAUX,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "background 0.2s, opacity 0.2s",
          fontFamily: "'Inter'",
          marginBottom: 12,
        }}
        onMouseEnter={(e) => {
          if (!loading) (e.currentTarget as HTMLElement).style.background = "#553120";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = BORDEAUX;
        }}
      >
        {loading ? "Chargement…" : "✓ Garder cette tenue"}
      </button>

      {/* ADJUSTMENTS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, position: "relative" }}>
        {ADJUSTMENTS.map((adj) => (
          <div key={adj.label} style={{ position: "relative" }}>
            <button
              onClick={() => onAdjust(adj.label)}
              disabled={loading}
              style={{
                padding: "8px 12px",
                background: "#fff",
                border: "1px solid #d4ccc0",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.2s",
                fontFamily: "'Inter'",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.borderColor = "#8a7a68";
                  setHoveredTooltip(adj.label);
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#d4ccc0";
                setHoveredTooltip(null);
              }}
            >
              {adj.label}
            </button>

            {/* TOOLTIP */}
            {hoveredTooltip === adj.label && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: 11,
                  padding: "6px 8px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  marginBottom: 6,
                  fontFamily: "'Inter'",
                }}
              >
                {adj.help}
                <div
                  style={{
                    position: "absolute",
                    bottom: -3,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "3px solid transparent",
                    borderRight: "3px solid transparent",
                    borderTop: "3px solid #1a1a1a",
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RESTART */}
      <button
        onClick={() => onAdjust("Recommencer")}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#fff",
          border: "1px solid #d4ccc0",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          color: "#5a5a5a",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.2s",
          fontFamily: "'Inter'",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.borderColor = "#8a7a68";
            (e.currentTarget as HTMLElement).style.color = "#1a1a1a";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#d4ccc0";
          (e.currentTarget as HTMLElement).style.color = "#5a5a5a";
        }}
      >
        ↻ Recommencer
      </button>
    </div>
  );
}
