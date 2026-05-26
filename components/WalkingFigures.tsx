"use client";

interface WalkingFiguresProps {
  /** Hauteur de la frise en px. Défaut 70. */
  height?: number;
  /** Couleur du trait. Hérite de currentColor par défaut. */
  color?: string;
}

/* Une procession de petits 2D walkers — toutes les figures sont définies
   en coordonnées relatives, balayées dans un viewBox horizontal. La piste
   est doublée pour que l'animation translate boucle sans saut. */

interface Walker {
  scale: number;       // taille relative (1 = standard)
  hat?: "fedora" | "beret" | "cap" | null; // accessoire éditorial
  briefcase?: boolean; // tient une mallette ?
}

/* Tous des enfants — silhouettes plus petites, pas de chapeau ni mallette.
   Variation douce de taille pour suggérer une bande de gosses qui courent. */
const WALKERS: Walker[] = [
  { scale: 0.60 },
  { scale: 0.55 },
  { scale: 0.65 },
  { scale: 0.50 },
  { scale: 0.62 },
  { scale: 0.58 },
  { scale: 0.66 },
  { scale: 0.52 },
  { scale: 0.60 },
  { scale: 0.56 },
  { scale: 0.64 },
  { scale: 0.54 },
];

function FigureSVG({ w, idx }: { w: Walker; idx: number }) {
  const { scale, hat, briefcase } = w;
  const baseY = 64; // ligne du sol
  const headY = baseY - 50 * scale;
  const cx = 0;

  return (
    <g
      className="wada-walker"
      style={{
        animationDelay: `${(idx * 0.13).toFixed(2)}s`,
        transformOrigin: "0px 64px",
      }}
    >
      {/* Chapeau (optionnel) */}
      {hat === "fedora" && (
        <path
          d={`M ${cx - 5 * scale} ${headY - 5} L ${cx + 5 * scale} ${headY - 5} L ${cx + 6 * scale} ${headY - 2} L ${cx - 6 * scale} ${headY - 2} Z`}
          fill="currentColor"
        />
      )}
      {hat === "beret" && (
        <ellipse
          cx={cx}
          cy={headY - 2}
          rx={5 * scale}
          ry={2.4 * scale}
          fill="currentColor"
        />
      )}
      {hat === "cap" && (
        <>
          <path
            d={`M ${cx - 4 * scale} ${headY - 1} L ${cx + 4 * scale} ${headY - 1} L ${cx + 7 * scale} ${headY + 1} L ${cx - 4 * scale} ${headY + 1} Z`}
            fill="currentColor"
          />
        </>
      )}

      {/* Tête */}
      <circle cx={cx} cy={headY + 2} r={3 * scale} fill="currentColor" />

      {/* Tronc */}
      <line
        x1={cx}
        y1={headY + 5}
        x2={cx}
        y2={headY + 22 * scale}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Bras (un en avant, un en arrière — marche balancée) */}
      <line
        x1={cx}
        y1={headY + 10 * scale}
        x2={cx - 7 * scale}
        y2={headY + 18 * scale}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={headY + 10 * scale}
        x2={cx + 7 * scale}
        y2={headY + 16 * scale}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />

      {/* Mallette (optionnelle) au bout du bras avant */}
      {briefcase && (
        <rect
          x={cx + 5 * scale}
          y={headY + 14 * scale}
          width={5 * scale}
          height={4 * scale}
          fill="currentColor"
        />
      )}

      {/* Jambes en pose de marche (une avant, une arrière) */}
      <line
        x1={cx}
        y1={headY + 22 * scale}
        x2={cx - 6 * scale}
        y2={baseY}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={headY + 22 * scale}
        x2={cx + 6 * scale}
        y2={baseY}
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * WalkingFigures — frise éditoriale de bonhommes 2D qui traversent la page.
 *
 * Inspiration : les processions urbaines de Saul Steinberg, ou les frises
 * des planches de mode 1920s — silhouettes stylisées qui rythment la page.
 * Tailles, chapeaux et accessoires varient pour donner l'impression d'une
 * petite foule, pas de clones. Le tout avance à pied lent (90s par cycle)
 * de gauche à droite, en boucle infinie.
 *
 * À placer sous une section éditoriale, sur fond crème — apporte du
 * mouvement humain sans exiger d'attention.
 */
export default function WalkingFigures({ height = 70, color }: WalkingFiguresProps) {
  // Piste doublée pour boucle continue
  const track = [...WALKERS, ...WALKERS];

  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        color: color || "var(--wada-ink)",
        position: "relative",
      }}
    >
      <div
        className="wada-walkers-track"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 50,
          height: "100%",
          width: "max-content",
          paddingLeft: 40,
        }}
      >
        {track.map((w, i) => (
          <svg
            key={i}
            viewBox="-15 0 30 70"
            width={30}
            height={70}
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0, overflow: "visible" }}
          >
            <FigureSVG w={w} idx={i % WALKERS.length} />
          </svg>
        ))}
      </div>

      {/* Ligne de sol — la "rue" sur laquelle ils marchent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 6,
          height: 1,
          background: "var(--wada-border)",
        }}
      />
    </div>
  );
}
