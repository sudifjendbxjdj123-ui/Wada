import Link from "next/link";
import { memo } from "react";
import type { DictionaryEntry } from "@/lib/data";
import { cultureLabels } from "@/lib/data";
import { ink, paper, subtle, border, cardBg } from "@/lib/styles";
import PaletteCardMatisse from "@/components/PaletteCardMatisse";
// OutfitAvatar / PieceIcon retirés : on remplace les silhouettes mannequin
// par le moodboard Matisse compact (formes organiques + Pantone overlay).

type Variant = "default" | "compact" | "minimal";

interface PaletteCardProps {
  entry: DictionaryEntry;
  variant?: Variant;
  showColorsName?: boolean;
}

const titleSizeByVariant: Record<Variant, number> = {
  default: 22,
  compact: 18,
  minimal: 16,
};

function PaletteCardInner({
  entry,
  variant = "default",
  showColorsName = true,
}: PaletteCardProps) {
  const titleSize = titleSizeByVariant[variant];
  const showOutfit = variant === "default";

  if (showOutfit) {
    return (
      <Link href={`/palette/${entry.number}`} style={{ textDecoration: "none", color: ink }}>
        <article
          className="wada-palette-card-outfit wada-lift"
          style={{ cursor: "pointer", background: paper, border: `1px solid ${border}`, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "16px 0 10px", textAlign: "center" }}>
            No. {entry.number}
          </p>
          <div className="wada-palette-bands" style={{ display: "flex", height: 50, marginInline: 18 }}>
            {entry.colors.map((c) => (
              <div key={c.hex} style={{ flex: 1, background: c.hex }} />
            ))}
          </div>
          {/* Moodboard Matisse compact — formes organiques + Pantone overlay */}
          <div style={{ minHeight: 280 }}>
            <PaletteCardMatisse entry={entry} height={280} />
          </div>
          <div style={{ padding: "16px 18px 22px", textAlign: "center", borderTop: `1px solid ${border}`, background: cardBg, marginTop: "auto" }}>
            <h3 style={{ fontSize: titleSize, fontStyle: "italic", fontWeight: 400, margin: "0 0 6px", lineHeight: 1.2, fontFamily: "'Inter', sans-serif" }}>
              {entry.name}
            </h3>
            {entry.culture && (
              <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "0 0 8px" }}>
                {cultureLabels[entry.culture] || entry.culture}
              </p>
            )}
            {showColorsName && (
              <p style={{ fontSize: 11, color: subtle, fontStyle: "italic", margin: 0, fontFamily: "'Inter', sans-serif" }}>
                {entry.colors.map((c) => c.name).join(" · ")}
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  const bandHeight = variant === "compact" ? 180 : 140;
  const padding = variant === "minimal" ? 12 : 18;

  return (
    <Link href={`/palette/${entry.number}`} style={{ textDecoration: "none", color: ink }}>
      <article
        className="wada-lift"
        style={{ cursor: "pointer", background: paper, border: `1px solid ${border}`, padding, height: "100%", display: "flex", flexDirection: "column" }}
      >
        <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "0 0 12px", textAlign: "center" }}>
          No. {entry.number}
        </p>
        <div className="wada-palette-bands" style={{ display: "flex", height: bandHeight, flex: variant === "minimal" ? 1 : "none" }}>
          {entry.colors.map((c) => (
            <div key={c.hex} style={{ flex: 1, background: c.hex }} />
          ))}
        </div>
        <div style={{ paddingTop: 14, textAlign: "center" }}>
          <h3 style={{ fontSize: titleSize, fontStyle: "italic", fontWeight: 400, margin: "0 0 6px", lineHeight: 1.2, fontFamily: "'Inter', sans-serif" }}>
            {entry.name}
          </h3>
          {entry.culture && (
            <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "0 0 8px" }}>
              {cultureLabels[entry.culture] || entry.culture}
            </p>
          )}
          {showColorsName && variant !== "minimal" && (
            <p style={{ fontSize: 11, color: subtle, fontStyle: "italic", margin: 0, fontFamily: "'Inter', sans-serif" }}>
              {entry.colors.map((c) => c.name).join(" · ")}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
/* React.memo : la card ne re-render que si entry/variant/showColorsName changent —
   indispensable pour /palettes qui rend ~30 cards et chaque toggle de filtre. */
const PaletteCard = memo(PaletteCardInner);
export default PaletteCard;
