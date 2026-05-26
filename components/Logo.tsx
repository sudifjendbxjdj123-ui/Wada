import { ink } from "@/lib/styles";

type Variant = "mark" | "wordmark" | "lockup";

interface LogoProps {
  /** Taille de référence en pixels (du wordmark). Défaut 24. */
  size?: number;
  /** "mark" = juste le logomark · "wordmark" = juste "Wada" · "lockup" = les deux. */
  variant?: Variant;
  /** Couleur d'override pour le wordmark et la bordure du mark. */
  color?: string;
  /** Affiche les caractères japonais 和田 sous le wordmark. */
  showJp?: boolean;
  /** Mark monochrome (toutes les bandes en une seule couleur — version sobre). */
  monochrome?: boolean;
}

/* Référence directe aux palettes du livre de Sanzo Wada — trois couleurs
   qui marchent ensemble. Bordeaux · Olive · Indigo (les accents WADA). */
const ACCENT_COLORS = ["#5C2018", "#5C5A3C", "#1B4A6B"];

/**
 * Logo WADA — logomark + wordmark + kanji.
 *
 * @example
 * <Logo size={28} />              // Lockup complet (par défaut)
 * <Logo variant="mark" size={32} /> // Juste le logomark (favicon, app icon)
 * <Logo monochrome />              // Mark en une seule couleur (sober)
 */
export default function Logo({
  size = 24,
  variant = "lockup",
  color,
  showJp = true,
  monochrome = false,
}: LogoProps) {
  const inkColor = color || ink;
  const bands = monochrome ? [inkColor, inkColor, inkColor] : ACCENT_COLORS;

  const markHeight = (size * 38) / 30; // ratio 30:38 du logomark
  const Mark = (
    <svg
      viewBox="0 0 30 38"
      width={size}
      height={markHeight}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
      role="presentation"
    >
      {/* Cadre extérieur fin (référence à la page de livre) */}
      <rect
        x="0.4"
        y="0.4"
        width="29.2"
        height="37.2"
        fill="none"
        stroke={inkColor}
        strokeWidth="0.8"
      />
      {/* Trois bandes verticales = trois couleurs d'une palette */}
      <rect x="2.4" y="2.4" width="8.4" height="33.2" fill={bands[0]} />
      <rect x="10.8" y="2.4" width="8.4" height="33.2" fill={bands[1]} />
      <rect x="19.2" y="2.4" width="8.4" height="33.2" fill={bands[2]} />
    </svg>
  );

  if (variant === "mark") return Mark;

  const Wordmark = (
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
      <span
        style={{
          // Brief charte typo 2026-05-26 — logo en Fredoka (chubby),
          // décision client : « Logo en chubby cohérent avec les titres ».
          // Plus aucune référence Fraunces/serif sur le logo, partout (header,
          // footer, partage social).
          fontFamily: "'Fredoka', 'Bagel Fat One', sans-serif",
          fontStyle: "normal",
          fontSize: size,
          color: inkColor,
          letterSpacing: "0.02em",
          // Brief « un seul poids de chubby » : 500 (medium, posé).
          fontWeight: 500,
        }}
      >
        WADA
      </span>
      {showJp && (
        <span
          className="wada-jp"
          style={{
            fontSize: Math.max(8, size * 0.34),
            letterSpacing: "0.45em",
            color: inkColor,
            opacity: 0.65,
            marginTop: 3,
            fontWeight: 500,
          }}
        >
          和田
        </span>
      )}
    </div>
  );

  if (variant === "wordmark") return Wordmark;

  // Lockup : mark + wordmark côte à côte
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.max(8, size * 0.4) }}>
      {Mark}
      {Wordmark}
    </div>
  );
}
