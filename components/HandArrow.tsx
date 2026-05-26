import type { CSSProperties } from "react";

interface HandArrowProps {
  /** Largeur en pixels — la hauteur suit le ratio 5:2. */
  size?: number;
  /** Couleur du tracé. Hérite de currentColor par défaut. */
  color?: string;
  /** Direction. Défaut "right". */
  direction?: "right" | "left" | "down" | "up";
  /** Style additionnel (margins, alignement…). */
  style?: CSSProperties;
}

/**
 * Flèche dessinée à la main — courbe très légère, pas symétrique, embout
 * qui hésite. Remplace les → typographiques pour les CTAs où on veut sentir
 * une main humaine plutôt qu'une typo générique.
 *
 * Inspiration toucher humain (tendance 2026) — les bons sites ajoutent
 * volontairement des micro-imperfections qui signalent un humain derrière.
 */
export default function HandArrow({
  size = 48,
  color,
  direction = "right",
  style,
}: HandArrowProps) {
  const rotations: Record<string, string> = {
    right: "0deg", left: "180deg", down: "90deg", up: "-90deg",
  };
  return (
    <svg
      width={size}
      height={size * 0.4}
      viewBox="0 0 60 24"
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        transform: `rotate(${rotations[direction]})`,
        ...style,
      }}
    >
      {/* Tige légèrement onduleuse — pas un trait droit parfait */}
      <path d="M2 11.7 Q15 12.4, 28 11.8 Q41 11.3, 52 12.1" fill="none" />
      {/* Pointe de flèche dessinée d'un seul geste */}
      <path d="M44 6.6 Q49 9.6, 52.4 12.1 Q49 14.6, 43.6 17.4" fill="none" />
    </svg>
  );
}
