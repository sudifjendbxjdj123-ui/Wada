/**
 * OrganicShape — banque de formes SVG style cut-outs Matisse.
 *
 * 6 formes abstraites organiques (corail, fleur, vague, feuille, splash,
 * blob). Chacune prend une couleur de remplissage. Utilisable comme
 * "papier découpé" — plat, expressif, signature WADA.
 *
 * Toutes les paths sont originales, dessinées à la Bezier-main. Inspiration :
 * Henri Matisse "Algues bleues", "Jazz". Les courbes restent organiques,
 * jamais trop régulières.
 */

export type ShapeKind = "coral" | "flower" | "wave" | "leaf" | "splash" | "blob";

interface OrganicShapeProps {
  kind: ShapeKind;
  /** Couleur de remplissage (le découpage). */
  fill: string;
  /** Couleur de fond optionnelle (le papier). */
  background?: string;
  /** Largeur/hauteur en px. Défaut 100% du conteneur. */
  width?: number | string;
  height?: number | string;
  /** Rotation appliquée à la forme (0-360). Permet de varier les compositions. */
  rotate?: number;
  /** Décale la forme dans son viewBox pour effets de débordement. */
  offsetX?: number;
  offsetY?: number;
}

export default function OrganicShape({
  kind, fill, background, width = "100%", height = "100%",
  rotate = 0, offsetX = 0, offsetY = 0,
}: OrganicShapeProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      preserveAspectRatio="xMidYMid slice"
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {background && <rect width="500" height="500" fill={background} />}
      <g
        transform={`translate(${offsetX} ${offsetY}) rotate(${rotate} 250 250)`}
        style={{ transformOrigin: "center" }}
      >
        {SHAPES[kind]({ fill })}
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Paths — chaque shape rend un <path> ou un groupe avec fill
   ────────────────────────────────────────────────────────────────────── */

const SHAPES: Record<ShapeKind, (props: { fill: string }) => React.ReactElement> = {

  /* CORAL — algue branchée style Matisse "Algues bleues" */
  coral: ({ fill }) => (
    <path
      fill={fill}
      d="M 230 480
         L 230 380
         Q 200 350 195 310
         Q 190 270 215 240
         Q 240 210 230 175
         Q 218 145 250 110
         Q 280 130 285 165
         Q 290 200 270 230
         Q 250 260 275 295
         Q 300 330 285 365
         Q 275 400 270 480
         Z
         M 195 320
         Q 165 310 145 280
         Q 130 250 155 235
         Q 175 245 185 270
         Q 190 295 195 320
         Z
         M 290 320
         Q 320 308 345 280
         Q 360 250 335 240
         Q 315 250 305 275
         Q 295 300 290 320
         Z"
    />
  ),

  /* FLOWER — cluster de pétales arrondis (Matisse "Jazz" style) */
  flower: ({ fill }) => (
    <g fill={fill}>
      {/* Pétale supérieur */}
      <path d="M 250 250 Q 200 130 250 90 Q 300 130 250 250 Z" />
      {/* Pétale droite */}
      <path d="M 250 250 Q 370 200 410 250 Q 370 300 250 250 Z" />
      {/* Pétale inférieur */}
      <path d="M 250 250 Q 300 370 250 410 Q 200 370 250 250 Z" />
      {/* Pétale gauche */}
      <path d="M 250 250 Q 130 300 90 250 Q 130 200 250 250 Z" />
      {/* Pétale diagonal 1 */}
      <path d="M 250 250 Q 350 160 380 180 Q 360 280 250 250 Z" />
      {/* Pétale diagonal 2 */}
      <path d="M 250 250 Q 150 340 120 320 Q 140 220 250 250 Z" />
      {/* Cœur central */}
      <circle cx="250" cy="250" r="22" fill={fill} opacity="0.85" />
    </g>
  ),

  /* WAVE — flux ondulant */
  wave: ({ fill }) => (
    <path
      fill={fill}
      d="M 0 280
         Q 80 200 160 250
         Q 240 300 320 240
         Q 400 180 500 230
         L 500 500
         L 0 500
         Z
         M 0 180
         Q 100 130 200 170
         Q 300 200 380 150
         Q 440 120 500 140
         L 500 100
         Q 420 60 320 110
         Q 220 150 130 100
         Q 60 70 0 90
         Z"
    />
  ),

  /* LEAF — feuille pointée */
  leaf: ({ fill }) => (
    <g fill={fill}>
      <path
        d="M 250 60
           Q 360 130 380 250
           Q 380 380 250 440
           Q 120 380 120 250
           Q 140 130 250 60 Z"
      />
      {/* Nervure centrale — légère cutout */}
      <path
        d="M 250 80
           Q 260 200 250 380
           Q 240 380 240 380"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),

  /* SPLASH — multi-blob organique éparpillé */
  splash: ({ fill }) => (
    <g fill={fill}>
      <path d="M 120 180 Q 140 90 220 130 Q 290 170 260 250 Q 230 320 150 290 Q 80 260 120 180 Z" />
      <path d="M 340 320 Q 380 280 420 310 Q 460 350 420 400 Q 380 440 340 410 Q 300 380 340 320 Z" />
      <path d="M 90 380 Q 110 340 150 360 Q 180 390 160 420 Q 130 440 100 420 Q 70 400 90 380 Z" />
      <path d="M 360 90 Q 400 60 430 100 Q 450 140 410 160 Q 370 170 360 130 Q 350 100 360 90 Z" />
    </g>
  ),

  /* BLOB — grande forme arrondie organique avec léger creux */
  blob: ({ fill }) => (
    <path
      fill={fill}
      d="M 100 240
         Q 110 130 220 100
         Q 330 80 400 150
         Q 460 220 420 320
         Q 380 410 280 420
         Q 180 430 130 360
         Q 80 290 100 240 Z"
    />
  ),
};
