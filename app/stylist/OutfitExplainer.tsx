"use client";
/**
 * OutfitExplainer — Section "Pourquoi ça marche" avec explication détaillée optionnelle.
 */

interface OutfitExplainerProps {
  pourquoi: string;
  explication?: {
    palette?: string;
    pieces?: string;
    profil?: string;
  };
  colors?: Array<{ hex: string; name: string }>;
}

const BORDEAUX = "#6B3A32";

export function OutfitExplainer({
  pourquoi,
  explication,
  colors,
}: OutfitExplainerProps) {
  return (
    <div
      style={{
        background: "rgba(168, 178, 154, 0.08)",
        borderLeft: `3px solid ${BORDEAUX}`,
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 16,
      }}
    >
      {/* TITLE */}
      <p
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600,
          fontSize: 13,
          letterSpacing: "0.04em",
          color: BORDEAUX,
          margin: "0 0 8px 0",
          textTransform: "uppercase",
        }}
      >
        Pourquoi ça marche
      </p>

      {/* MAIN TEXT */}
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: "#1a1a1a",
          margin: 0,
          fontFamily: "'Inter'",
        }}
      >
        {pourquoi}
      </p>

      {/* PALETTE SWATCHES */}
      {colors && colors.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginLeft: 8, marginTop: 8, flexWrap: "wrap" }}>
          {colors.slice(0, 5).map((c) => (
            <span
              key={c.hex}
              title={c.name}
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: c.hex,
                border: "1px solid rgba(30,30,30,.15)",
              }}
            />
          ))}
        </div>
      )}

      {/* EN DÉTAIL section */}
      {explication && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(168, 178, 154, 0.2)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: BORDEAUX,
              margin: "0 0 6px 0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "'Inter'",
            }}
          >
            En détail
          </p>

          {explication.palette && (
            <p
              style={{
                fontSize: 13,
                margin: "4px 0",
                lineHeight: 1.45,
                color: "#1a1a1a",
                fontFamily: "'Inter'",
              }}
            >
              <strong style={{ color: BORDEAUX }}>Palette :</strong> {explication.palette}
            </p>
          )}

          {explication.pieces && (
            <p
              style={{
                fontSize: 13,
                margin: "4px 0",
                lineHeight: 1.45,
                color: "#1a1a1a",
                fontFamily: "'Inter'",
              }}
            >
              <strong style={{ color: BORDEAUX }}>Pièces :</strong> {explication.pieces}
            </p>
          )}

          {explication.profil && (
            <p
              style={{
                fontSize: 13,
                margin: "4px 0",
                lineHeight: 1.45,
                color: "#1a1a1a",
                fontFamily: "'Inter'",
              }}
            >
              <strong style={{ color: BORDEAUX }}>Pour toi :</strong> {explication.profil}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
