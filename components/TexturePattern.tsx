interface TexturePatternProps {
  /** Type de motif. */
  variant?: "dots" | "weave" | "marble" | "graphic" | "linen" | "grid";
  /** Couleur principale du motif. */
  color?: string;
  /** Couleur de fond. Défaut crème WADA. */
  background?: string;
  /** Largeur en px. Défaut 100. */
  width?: number;
  /** Hauteur en px. Défaut = largeur (carré). */
  height?: number;
  /** Bordure fine autour du carré. */
  bordered?: boolean;
}

/**
 * TexturePattern — petits carrés de motif imprimé, pour enrichir les palettes.
 *
 * Inspiré des planches du dictionnaire de Sanzo Wada qui mêlent aplats unis
 * et carrés de textile (pointillé, motif graphique, marbre, tissage). Chaque
 * pattern est un SVG inline avec un `<pattern>` répété — taille indépendante
 * du conteneur, couleur paramétrable, fond crème par défaut.
 *
 * Toutes les paths sont originales WADA. Cinq variantes :
 *   - dots    → pointillé fin (régulier)
 *   - weave   → micro-tissage diagonal
 *   - marble  → veines libres façon papier marbré
 *   - graphic → motif géométrique répété (étoile schématique)
 *   - linen   → lin tissé orthogonal
 *   - grid    → trame pointillée orthogonale
 */
export default function TexturePattern({
  variant = "dots",
  color = "#1F1B16",
  background = "#F4EFE6",
  width = 100,
  height,
  bordered = true,
}: TexturePatternProps) {
  const h = height ?? width;
  const id = `wada-pat-${variant}-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        {variant === "dots" && (
          <pattern id={id} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.4" fill={color} />
          </pattern>
        )}

        {variant === "weave" && (
          <pattern id={id} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M0 4 L8 4 M4 0 L4 8" stroke={color} strokeWidth="0.6" opacity="0.7" />
            <path d="M0 0 L8 8" stroke={color} strokeWidth="0.4" opacity="0.4" />
          </pattern>
        )}

        {variant === "marble" && (
          <pattern id={id} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M -10 30 Q 20 10 40 30 T 90 30" stroke={color} strokeWidth="0.5" fill="none" opacity="0.45" />
            <path d="M -10 50 Q 20 65 45 50 T 90 50" stroke={color} strokeWidth="0.4" fill="none" opacity="0.35" />
            <path d="M 10 70 Q 30 60 50 75 T 90 65" stroke={color} strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M 5 10 Q 25 25 50 12 T 95 18" stroke={color} strokeWidth="0.4" fill="none" opacity="0.5" />
            <circle cx="20" cy="40" r="1" fill={color} opacity="0.4" />
            <circle cx="55" cy="20" r="0.8" fill={color} opacity="0.5" />
            <circle cx="70" cy="55" r="1.2" fill={color} opacity="0.3" />
          </pattern>
        )}

        {variant === "graphic" && (
          <pattern id={id} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 10 4 L 11 9 L 16 10 L 11 11 L 10 16 L 9 11 L 4 10 L 9 9 Z"
              fill={color}
              opacity="0.85"
            />
          </pattern>
        )}

        {variant === "linen" && (
          <pattern id={id} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="0.5" opacity="0.55" />
            <line x1="3" y1="0" x2="3" y2="6" stroke={color} strokeWidth="0.3" opacity="0.35" />
            <line x1="0" y1="3" x2="6" y2="3" stroke={color} strokeWidth="0.3" opacity="0.35" />
          </pattern>
        )}

        {variant === "grid" && (
          <pattern id={id} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="0.9" fill={color} />
            <circle cx="11" cy="3" r="0.9" fill={color} />
            <circle cx="3" cy="11" r="0.9" fill={color} />
            <circle cx="11" cy="11" r="0.9" fill={color} />
          </pattern>
        )}
      </defs>

      {/* Fond crème */}
      <rect x="0" y="0" width={width} height={h} fill={background} />
      {/* Motif appliqué */}
      <rect x="0" y="0" width={width} height={h} fill={`url(#${id})`} />
      {/* Bordure fine éditoriale */}
      {bordered && (
        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={h - 1}
          fill="none"
          stroke="rgba(31,27,22,0.18)"
          strokeWidth="1"
        />
      )}
    </svg>
  );
}
