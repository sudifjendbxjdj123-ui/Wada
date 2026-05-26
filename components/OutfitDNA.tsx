"use client";
import type { OutfitDNA } from "@/lib/dna";
import { ink, paper, subtle, border, seal, sectionLabel } from "@/lib/styles";

interface OutfitDNAProps {
  dna: OutfitDNA;
  /** Mode compact pour les cartes — pas de barres, juste ADN + tags. */
  compact?: boolean;
}

/**
 * Bloc ADN d'une tenue — affiché sur /palette/[number].
 *
 * Style éditorial COS : tout en CAPS Inter, barres horizontales fines,
 * pourcentages discrets, tags en pills crème. Donne à l'utilisateur
 * (et à l'IA) une lecture structurée du caractère de la palette.
 *
 *   ADN
 *   Minimaliste · Old money · Scandinave
 *
 *   COHÉRENCE PALETTE                            94 %
 *   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *   COMPATIBILITÉ
 *   Minimaliste              ███████░  91 %
 *   Old money                █████░    72 %
 *   Streetwear               ██░       24 %
 *
 *   TAGS
 *   [ Palette froide ] [ Laine ] [ Bureau ] [ Hiver ]
 */
export default function OutfitDNA({ dna, compact = false }: OutfitDNAProps) {
  return (
    <section
      style={{
        border: `1px solid ${border}`,
        background: "rgba(255, 255, 255, 0.55)",
        padding: compact ? 20 : "28px 32px",
        fontFamily: "'Inter', sans-serif",
      }}
      aria-label="ADN de la tenue"
    >
      {/* Header ─ ADN texte court */}
      <div style={{ paddingBottom: 18, borderBottom: `1px solid ${border}` }}>
        <p style={{ ...sectionLabel, color: seal, marginBottom: 8, fontWeight: 600 }}>ADN</p>
        <p
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: compact ? 18 : 24,
            fontStyle: "italic",
            color: ink,
            margin: 0,
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {dna.adnText}
        </p>
      </div>

      {/* Cohérence palette ─ une barre */}
      <div style={{ paddingTop: 18, paddingBottom: compact ? 0 : 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ ...sectionLabel, color: ink, fontSize: 9, fontWeight: 600 }}>
            Cohérence palette
          </span>
          <span style={{ fontSize: 12, fontFamily: "'Inter', sans-serif", color: ink, fontWeight: 600 }}>
            {dna.paletteCoherence} %
          </span>
        </div>
        <ScoreBar value={dna.paletteCoherence} />
      </div>

      {/* Compatibilité par style — 3 barres */}
      {!compact && (
        <div style={{ paddingTop: 12, paddingBottom: 18, borderTop: `1px solid ${border}` }}>
          <p style={{ ...sectionLabel, color: ink, fontSize: 9, fontWeight: 600, marginBottom: 14 }}>
            Compatibilité
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dna.dominantStyles.map((s) => (
              <div key={s.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span
                    style={{
                      fontFamily: "'Fredoka', sans-serif",
                      fontSize: 15,
                      fontStyle: "italic",
                      color: ink,
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </span>
                  <span style={{ fontSize: 11, color: subtle, fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em" }}>
                    {s.score} %
                  </span>
                </div>
                <ScoreBar value={s.score} />
                {/* ADN court du style en bas */}
                <p style={{ fontSize: 10, color: subtle, fontStyle: "italic", margin: "4px 0 0", fontFamily: "'Inter', sans-serif" }}>
                  {s.adn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags ─ pills crème */}
      {dna.tags.length > 0 && (
        <div style={{ paddingTop: compact ? 12 : 4, borderTop: compact ? `1px solid ${border}` : "none" }}>
          {!compact && (
            <p style={{ ...sectionLabel, color: ink, fontSize: 9, fontWeight: 600, marginBottom: 12 }}>
              Tags
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {dna.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  border: `1px solid ${border}`,
                  background: paper,
                  fontSize: 9,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: ink,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/** Barre de score minimale — trait fin, ink sur border, animée au mount. */
function ScoreBar({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        width: "100%",
        height: 3,
        background: border,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: ink,
          transition: "width 0.8s cubic-bezier(0.2, 0.7, 0.2, 1)",
        }}
      />
    </div>
  );
}
