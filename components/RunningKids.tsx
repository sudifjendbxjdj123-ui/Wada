"use client";
import Link from "next/link";

/** ABONNEMENT — 10 lettres, distribuées par paires sur 5 enfants. */
const PAIRS: ReadonlyArray<string> = ["AB", "ON", "NE", "ME", "NT"];

/**
 * RunningKids — frise éditoriale qui remplace la bordure noire haute du Footer.
 *
 * Cinq enfants stylisés (silhouettes très simples — tête + tronc + bras
 * levés + jambes en course) avancent de gauche à droite sur une ligne. Chacun
 * porte deux lettres du mot ABONNEMENT au-dessus de ses mains levées.
 *
 * Le tout est un seul Link cliquable vers /tarifs. Animation `wada-kid-bounce`
 * sur les figures (rebond vertical 2px), décalée par enfant pour simuler la
 * cadence d'une course. La ligne en bas est la "rue" sur laquelle ils courent.
 */
export default function RunningKids() {
  return (
    <Link
      href="/tarifs"
      aria-label="Abonnement WADA — cliquez pour voir les tarifs"
      style={{ display: "block", textDecoration: "none", color: "inherit", marginTop: 0 }}
    >
      <svg
        viewBox="0 0 500 70"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", display: "block", overflow: "visible" }}
      >
        {/* Ligne / sol — la "borderTop" du footer devient cette ligne */}
        <line
          x1="0"
          y1="64"
          x2="500"
          y2="64"
          stroke="currentColor"
          strokeWidth="1"
        />

        {PAIRS.map((pair, i) => {
          const x = 50 + i * 100;
          return (
            <g
              key={pair + i}
              className="wada-kid"
              style={{ animationDelay: `${(i * 0.12).toFixed(2)}s` }}
            >
              {/* Lettres au-dessus des mains levées */}
              <text
                x={x}
                y="10"
                textAnchor="middle"
                fontFamily="'Inter', sans-serif"
                fontSize="11"
                fontWeight={700}
                letterSpacing="0.18em"
                fill="currentColor"
              >
                {pair}
              </text>

              {/* Bras levés en V (les mains tiennent les lettres) */}
              <path
                d={`M ${x - 8} 16 L ${x} 30 L ${x + 8} 16`}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Tête */}
              <circle cx={x} cy="34" r="3.2" fill="currentColor" />

              {/* Tronc */}
              <line
                x1={x}
                y1="37"
                x2={x}
                y2="50"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />

              {/* Jambes en pose de course (une avant, une arrière) */}
              <path
                d={`M ${x} 50 L ${x - 5} 62  M ${x} 50 L ${x + 5} 58`}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          );
        })}
      </svg>
    </Link>
  );
}
