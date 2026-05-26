import type { ReactNode, CSSProperties } from "react";

interface SketchUnderlineProps {
  children: ReactNode;
  /** Couleur du soulignement. Hérite de currentColor par défaut. */
  color?: string;
  /** Style additionnel sur le span englobant. */
  style?: CSSProperties;
}

/**
 * Soulignement esquissé "au crayon" — ligne irrégulière qui hésite, comme
 * tracée à la main par quelqu'un qui veut souligner un mot mais sans règle.
 * Caractéristiques :
 *
 *  - Path SVG avec amplitude variable (le crayon "tremble" à plusieurs
 *    moments, pas une sinusoïde régulière)
 *  - Légère épaisseur variable via `<filter feTurbulence>` qui déforme
 *    le tracé → impression papier/crayon
 *  - Petit overshoot à droite (le trait dépasse de quelques pixels) puis
 *    revient — comme quand on souligne et que la main continue par inertie
 *  - Animation `stroke-dashoffset` de l'apparition : l'encre se dessine
 *    en 900ms — le mouvement de la main qui trace
 *
 * À utiliser sur un mot ou phrase courte dans un H1/H2 éditorial pour
 * lui donner du poids sans le mettre en gras.
 */
export default function SketchUnderline({ children, color, style }: SketchUnderlineProps) {
  // Filter ID unique pour éviter les collisions si plusieurs SketchUnderline
  // dans un même DOM (sinon ils partagent la même seed turbulence).
  const filterId = `sketch-rough-${Math.random().toString(36).slice(2, 9)}`;
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
      <svg
        viewBox="0 0 110 14"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-3%",
          right: "-3%",
          bottom: -8,
          width: "106%",
          height: 14,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <defs>
          {/* Turbulence légère pour donner le côté "crayon papier" : déforme
              légèrement le tracé en sous-pixels (effet rough, pas vector net). */}
          <filter id={filterId} x="-2%" y="-50%" width="104%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 1.2" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="1.4" />
          </filter>
        </defs>

        {/* Trait principal — Bézier qui hésite (amplitudes irrégulières) avec
            un petit overshoot à droite puis retour. Le path commence légèrement
            avant le mot (M -2) et finit légèrement après (L 112). */}
        <path
          d="
            M -2 7
            Q 12 5, 25 6.5
            T 48 5.2
            Q 62 7.8, 75 5.8
            T 96 6.5
            Q 105 6, 108 7.5
            L 110 7
            Q 109 6, 105 6.8
          "
          stroke={color || "currentColor"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${filterId})`}
          style={{
            strokeDasharray: 230,
            strokeDashoffset: 230,
            animation: "wada-ink-draw 0.9s 0.25s cubic-bezier(0.3, 0.8, 0.3, 1) forwards",
          }}
        />
      </svg>
    </span>
  );
}
