import { accentOf, lighten, darken } from "@/lib/utils";

interface OutfitPiece {
  type: string;
  color: string;
}

/** Coupes de cheveux disponibles — voir réf. WADA System Avatar. */
export type HairStyle = "short" | "mid" | "curly" | "long";

/** Teintes de peau — voir réf. WADA System Avatar (3 tons documentés). */
export type SkinTone = "light" | "medium" | "tan" | "dark";

/** Morphologie — discrète, ajuste épaules et bassin. */
export type Morphology = "slim" | "athletic" | "feminine";

interface OutfitAvatarProps {
  /** Hauteur de l'avatar en px. Largeur calculée selon ratio 2:5. */
  height?: number;
  top?: OutfitPiece;
  bottom?: OutfitPiece;
  shoes?: OutfitPiece;
  /** Couleur de la chemise intérieure visible dans le V (si applicable). */
  innerColor?: string;
  /**
   * Teinte de peau. Accepte soit un mot-clé (light/medium/tan/dark),
   * soit un hex direct pour un contrôle fin.
   */
  skinTone?: SkinTone | string;
  /** Couleur des cheveux. Défaut encre WADA. */
  hairTone?: string;
  /** Coupe de cheveux — défaut "short". */
  hairStyle?: HairStyle;
  /** Morphologie — défaut "slim". "feminine" épaules légèrement plus étroites, taille marquée. */
  morphology?: Morphology;
}

/* ──────────────────────────────────────────────────────────────────────
   Mapping teintes de peau (4 tons + custom)
   ────────────────────────────────────────────────────────────────────── */
const SKIN_PRESETS: Record<SkinTone, string> = {
  light:  "#F0D4B6",
  medium: "#E5C9A8",
  tan:    "#C99A6B",
  dark:   "#7A4F32",
};

function resolveSkin(tone?: SkinTone | string): string {
  if (!tone) return SKIN_PRESETS.medium;
  if (tone.startsWith("#")) return tone;
  return SKIN_PRESETS[tone as SkinTone] || SKIN_PRESETS.medium;
}

/**
 * OutfitAvatar — silhouette humaine éditoriale, neutre et modulaire.
 *
 * Référence WADA System Avatar : proportions humaines (épaules larges,
 * bras visibles le long du corps, jambes distinctes, baskets blanches).
 * Pas de visage — la neutralité reste signature. Habillé par la palette
 * de chaque tenue : top, bottom, shoes. Les baskets restent blanches par
 * défaut quand aucune chaussure n'est passée (réf.).
 *
 * Toutes les paths SVG sont originales. Style flat-anatomique.
 */
export default function OutfitAvatar({
  height = 320,
  top,
  bottom,
  shoes,
  innerColor,
  skinTone,
  hairTone = "#1F1B16",
  hairStyle = "short",
  morphology = "slim",
}: OutfitAvatarProps) {
  const width = height * 0.42; // ratio légèrement plus large que 2:5 pour plus d'humanité

  // ── Couleurs dérivées ──
  const skin       = resolveSkin(skinTone);
  const skinShade  = darken(skin, 0.10);

  const topColor    = top?.color    || "#FFFFFF";
  const bottomColor = bottom?.color || "#9BA88A";
  const shoesColor  = shoes?.color  || "#FFFFFF";
  const topAccent    = accentOf(topColor, 0.14);
  const bottomAccent = accentOf(bottomColor, 0.18);
  const shoesAccent  = accentOf(shoesColor, 0.22);
  const inner = innerColor || lighten(topColor, 0.55);

  // ── Morphologie : largeur épaules + bassin ──
  const shoulderW = morphology === "feminine" ? 36 : morphology === "athletic" ? 46 : 41;
  const hipW      = morphology === "feminine" ? 35 : morphology === "athletic" ? 40 : 37;

  // ── Repères clés (système 200×500 viewBox) ──
  const cx = 100;
  const headTop = 22;
  const headCx = cx;
  const headCy = 52;
  const headRx = 22;
  const headRy = 27;
  const neckTop = 78;
  const neckBot = 100;
  const shoulderY = 110;
  const waistY = 280;
  const hipY = 290;
  const kneeY = 380;
  const ankleY = 466;
  const footY = 494;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      <g
        className="wada-avatar-life"
        style={{ transformOrigin: "100px 495px", transformBox: "fill-box" } as React.CSSProperties}
      >

        {/* ════════════════════════════════════════════════════════
            TÊTE — ovale neutre, sans traits du visage
            ════════════════════════════════════════════════════════ */}
        <ellipse cx={headCx} cy={headCy} rx={headRx} ry={headRy} fill={skin} />

        {/* Sous-ombre subtile mâchoire — donne du volume sans dessiner les traits */}
        <path
          d={`M ${cx - 18} ${headCy + 18} Q ${cx} ${headCy + 28} ${cx + 18} ${headCy + 18}`}
          stroke={skinShade}
          strokeWidth="0.7"
          fill="none"
          opacity="0.4"
        />

        {/* ════════════════════════════════════════════════════════
            CHEVEUX — varie selon hairStyle
            ════════════════════════════════════════════════════════ */}
        {hairStyle === "short" && (
          <path
            d={`M ${cx - 21} ${headTop + 16} Q ${cx - 22} ${headTop + 2} ${cx} ${headTop - 2} Q ${cx + 22} ${headTop + 2} ${cx + 21} ${headTop + 16} Q ${cx + 18} ${headTop + 6} ${cx} ${headTop + 4} Q ${cx - 18} ${headTop + 6} ${cx - 21} ${headTop + 16} Z`}
            fill={hairTone}
          />
        )}
        {hairStyle === "mid" && (
          <path
            d={`M ${cx - 23} ${headTop + 22} Q ${cx - 25} ${headTop} ${cx} ${headTop - 5} Q ${cx + 25} ${headTop} ${cx + 23} ${headTop + 22} Q ${cx + 22} ${headTop + 12} ${cx + 14} ${headTop + 10} Q ${cx} ${headTop + 8} ${cx - 14} ${headTop + 10} Q ${cx - 22} ${headTop + 12} ${cx - 23} ${headTop + 22} Z`}
            fill={hairTone}
          />
        )}
        {hairStyle === "curly" && (
          <>
            <ellipse cx={cx - 14} cy={headTop + 8} rx="8" ry="9" fill={hairTone} />
            <ellipse cx={cx} cy={headTop} rx="10" ry="10" fill={hairTone} />
            <ellipse cx={cx + 14} cy={headTop + 8} rx="8" ry="9" fill={hairTone} />
            <ellipse cx={cx - 20} cy={headTop + 18} rx="6" ry="7" fill={hairTone} />
            <ellipse cx={cx + 20} cy={headTop + 18} rx="6" ry="7" fill={hairTone} />
          </>
        )}
        {hairStyle === "long" && (
          <>
            {/* Calotte */}
            <path
              d={`M ${cx - 24} ${headTop + 20} Q ${cx - 26} ${headTop} ${cx} ${headTop - 4} Q ${cx + 26} ${headTop} ${cx + 24} ${headTop + 20} Z`}
              fill={hairTone}
            />
            {/* Cheveux longs qui descendent derrière les épaules */}
            <path
              d={`M ${cx - 24} ${headTop + 20} L ${cx - 26} ${shoulderY + 30} Q ${cx - 22} ${shoulderY + 40} ${cx - 18} ${shoulderY + 30} L ${cx - 16} ${headTop + 30} Z`}
              fill={hairTone}
              opacity="0.85"
            />
            <path
              d={`M ${cx + 24} ${headTop + 20} L ${cx + 26} ${shoulderY + 30} Q ${cx + 22} ${shoulderY + 40} ${cx + 18} ${shoulderY + 30} L ${cx + 16} ${headTop + 30} Z`}
              fill={hairTone}
              opacity="0.85"
            />
          </>
        )}

        {/* ════════════════════════════════════════════════════════
            COU — trapèze fin, raccord tête/épaules
            ════════════════════════════════════════════════════════ */}
        <path
          d={`M ${cx - 9} ${neckTop} L ${cx + 9} ${neckTop} L ${cx + 11} ${neckBot} L ${cx - 11} ${neckBot} Z`}
          fill={skin}
        />
        {/* Ombre cou (cottage) */}
        <path
          d={`M ${cx - 9} ${neckTop + 2} L ${cx + 9} ${neckTop + 2}`}
          stroke={skinShade}
          strokeWidth="0.6"
          opacity="0.4"
        />

        {/* ════════════════════════════════════════════════════════
            CORPS BASE — torso et bras en skin, recouverts ensuite par le top
            On dessine le corps complet d'abord, le top viendra masquer.
            ════════════════════════════════════════════════════════ */}

        {/* Torso (épaules → taille) — sera caché par le top */}
        <path
          d={`M ${cx - shoulderW} ${shoulderY} L ${cx + shoulderW} ${shoulderY} L ${cx + shoulderW - 5} ${waistY} L ${cx - shoulderW + 5} ${waistY} Z`}
          fill={skin}
          opacity={top ? 0 : 0.6}
        />

        {/* Bras gauche — épaule → poignet, le long du corps */}
        <path
          d={`M ${cx - shoulderW + 2} ${shoulderY}
              Q ${cx - shoulderW - 4} ${shoulderY + 60} ${cx - shoulderW - 2} ${shoulderY + 130}
              Q ${cx - shoulderW + 2} ${shoulderY + 175} ${cx - shoulderW + 6} ${shoulderY + 180}
              Q ${cx - shoulderW + 10} ${shoulderY + 130} ${cx - shoulderW + 8} ${shoulderY + 60}
              L ${cx - shoulderW + 12} ${shoulderY} Z`}
          fill={skin}
        />
        {/* Bras droit — miroir */}
        <path
          d={`M ${cx + shoulderW - 2} ${shoulderY}
              Q ${cx + shoulderW + 4} ${shoulderY + 60} ${cx + shoulderW + 2} ${shoulderY + 130}
              Q ${cx + shoulderW - 2} ${shoulderY + 175} ${cx + shoulderW - 6} ${shoulderY + 180}
              Q ${cx + shoulderW - 10} ${shoulderY + 130} ${cx + shoulderW - 8} ${shoulderY + 60}
              L ${cx + shoulderW - 12} ${shoulderY} Z`}
          fill={skin}
        />

        {/* Mains — petites ellipses au bout des bras */}
        <ellipse cx={cx - shoulderW + 1} cy={shoulderY + 185} rx="6" ry="8" fill={skin} />
        <ellipse cx={cx + shoulderW - 1} cy={shoulderY + 185} rx="6" ry="8" fill={skin} />

        {/* Jambes (hanche → chevilles) — visible jusqu'à ce que le bottom recouvre */}
        <rect x={cx - hipW} y={hipY} width={hipW * 2} height={ankleY - hipY} fill={skin} opacity={bottom ? 0 : 0.7} />

        {/* Chevilles — entre pantalon et chaussure, toujours visible */}
        <ellipse cx={cx - 16} cy={ankleY + 2} rx="6" ry="4" fill={skin} />
        <ellipse cx={cx + 16} cy={ankleY + 2} rx="6" ry="4" fill={skin} />

        {/* ════════════════════════════════════════════════════════
            TOP — sans manches par défaut (style réf. WADA), ou avec
            blazer en V si l'item est explicitement "blazer"/"veste".
            ════════════════════════════════════════════════════════ */}
        {top && (
          <g>
            {(top.type === "blazer" || top.type === "jacket") ? (
              <>
                {/* Pan gauche du blazer */}
                <path
                  d={`M ${cx - 8} ${neckBot} L ${cx - shoulderW} ${shoulderY + 8} L ${cx - shoulderW + 4} ${waistY} L ${cx} ${waistY} L ${cx} ${neckBot + 50} L ${cx - 8} ${neckBot + 45} Z`}
                  fill={topColor}
                  stroke={topAccent}
                  strokeWidth="0.8"
                />
                {/* Pan droit */}
                <path
                  d={`M ${cx + 8} ${neckBot} L ${cx + shoulderW} ${shoulderY + 8} L ${cx + shoulderW - 4} ${waistY} L ${cx} ${waistY} L ${cx} ${neckBot + 50} L ${cx + 8} ${neckBot + 45} Z`}
                  fill={topColor}
                  stroke={topAccent}
                  strokeWidth="0.8"
                />
                {/* Chemise intérieure visible dans le V */}
                <path
                  d={`M ${cx - 8} ${neckBot} L ${cx} ${neckBot + 50} L ${cx + 8} ${neckBot} L ${cx + 6} ${neckBot - 1} L ${cx - 6} ${neckBot - 1} Z`}
                  fill={inner}
                />
                {/* Boutons */}
                <circle cx={cx} cy={waistY - 60} r="1.4" fill={topAccent} />
                <circle cx={cx} cy={waistY - 30} r="1.4" fill={topAccent} />
              </>
            ) : (
              <>
                {/* Top sans manches — silhouette de chemise blanche réf. */}
                <path
                  d={`M ${cx - shoulderW} ${shoulderY}
                      Q ${cx - shoulderW - 2} ${shoulderY + 4} ${cx - shoulderW + 2} ${shoulderY + 10}
                      L ${cx - shoulderW + 6} ${waistY}
                      L ${cx + shoulderW - 6} ${waistY}
                      L ${cx + shoulderW - 2} ${shoulderY + 10}
                      Q ${cx + shoulderW + 2} ${shoulderY + 4} ${cx + shoulderW} ${shoulderY}
                      L ${cx + 12} ${neckBot}
                      L ${cx + 6} ${neckBot + 8}
                      L ${cx - 6} ${neckBot + 8}
                      L ${cx - 12} ${neckBot} Z`}
                  fill={topColor}
                  stroke={topAccent}
                  strokeWidth="0.6"
                />
                {/* Placket central — bandeau de boutonnage subtil */}
                <line
                  x1={cx} y1={neckBot + 10}
                  x2={cx} y2={waistY - 4}
                  stroke={topAccent} strokeWidth="0.5" opacity="0.45"
                />
                {/* Boutons discrets */}
                <circle cx={cx} cy={neckBot + 40} r="0.9" fill={topAccent} opacity="0.5" />
                <circle cx={cx} cy={neckBot + 80} r="0.9" fill={topAccent} opacity="0.5" />
                <circle cx={cx} cy={neckBot + 120} r="0.9" fill={topAccent} opacity="0.5" />
              </>
            )}
          </g>
        )}

        {/* ════════════════════════════════════════════════════════
            PANTALON — 2 jambes distinctes, gap visible
            ════════════════════════════════════════════════════════ */}
        {bottom && (
          <g>
            {/* Ceinture / taille */}
            <rect x={cx - hipW} y={waistY} width={hipW * 2} height={6} fill={bottomAccent} opacity="0.7" />
            {/* Jambe gauche */}
            <path
              d={`M ${cx - hipW} ${waistY + 6}
                  L ${cx - 2} ${waistY + 6}
                  L ${cx - 4} ${kneeY}
                  L ${cx - 10} ${ankleY}
                  L ${cx - 22} ${ankleY}
                  L ${cx - hipW + 2} ${kneeY} Z`}
              fill={bottomColor}
              stroke={bottomAccent}
              strokeWidth="0.7"
            />
            {/* Jambe droite */}
            <path
              d={`M ${cx + hipW} ${waistY + 6}
                  L ${cx + 2} ${waistY + 6}
                  L ${cx + 4} ${kneeY}
                  L ${cx + 10} ${ankleY}
                  L ${cx + 22} ${ankleY}
                  L ${cx + hipW - 2} ${kneeY} Z`}
              fill={bottomColor}
              stroke={bottomAccent}
              strokeWidth="0.7"
            />
            {/* Plis verticaux subtils */}
            <line x1={cx - 18} y1={waistY + 10} x2={cx - 14} y2={ankleY - 4} stroke={bottomAccent} strokeWidth="0.3" opacity="0.4" />
            <line x1={cx + 18} y1={waistY + 10} x2={cx + 14} y2={ankleY - 4} stroke={bottomAccent} strokeWidth="0.3" opacity="0.4" />
            {/* Revers de bas de jambe */}
            <line x1={cx - 22} y1={ankleY - 2} x2={cx - 10} y2={ankleY - 2} stroke={bottomAccent} strokeWidth="0.5" opacity="0.5" />
            <line x1={cx + 10} y1={ankleY - 2} x2={cx + 22} y2={ankleY - 2} stroke={bottomAccent} strokeWidth="0.5" opacity="0.5" />
          </g>
        )}

        {/* ════════════════════════════════════════════════════════
            CHAUSSURES — baskets style réf. (blanches par défaut)
            ════════════════════════════════════════════════════════ */}
        <g>
          {/* Sneaker gauche */}
          <path
            d={`M ${cx - 22} ${ankleY}
                Q ${cx - 24} ${ankleY + 8} ${cx - 26} ${ankleY + 18}
                L ${cx - 26} ${footY}
                L ${cx - 5} ${footY}
                L ${cx - 5} ${ankleY + 18}
                Q ${cx - 7} ${ankleY + 4} ${cx - 10} ${ankleY}
                Z`}
            fill={shoesColor}
            stroke={shoesAccent}
            strokeWidth="0.8"
          />
          {/* Semelle gauche */}
          <rect x={cx - 26} y={footY - 5} width={21} height={5} fill={darken(shoesColor, 0.08)} opacity="0.8" />
          {/* Lacets gauche */}
          <line x1={cx - 20} y1={ankleY + 8} x2={cx - 10} y2={ankleY + 8} stroke={shoesAccent} strokeWidth="0.6" opacity="0.6" />
          <line x1={cx - 19} y1={ankleY + 14} x2={cx - 11} y2={ankleY + 14} stroke={shoesAccent} strokeWidth="0.6" opacity="0.6" />

          {/* Sneaker droite */}
          <path
            d={`M ${cx + 22} ${ankleY}
                Q ${cx + 24} ${ankleY + 8} ${cx + 26} ${ankleY + 18}
                L ${cx + 26} ${footY}
                L ${cx + 5} ${footY}
                L ${cx + 5} ${ankleY + 18}
                Q ${cx + 7} ${ankleY + 4} ${cx + 10} ${ankleY}
                Z`}
            fill={shoesColor}
            stroke={shoesAccent}
            strokeWidth="0.8"
          />
          <rect x={cx + 5} y={footY - 5} width={21} height={5} fill={darken(shoesColor, 0.08)} opacity="0.8" />
          <line x1={cx + 10} y1={ankleY + 8} x2={cx + 20} y2={ankleY + 8} stroke={shoesAccent} strokeWidth="0.6" opacity="0.6" />
          <line x1={cx + 11} y1={ankleY + 14} x2={cx + 19} y2={ankleY + 14} stroke={shoesAccent} strokeWidth="0.6" opacity="0.6" />
        </g>

      </g>
    </svg>
  );
}
