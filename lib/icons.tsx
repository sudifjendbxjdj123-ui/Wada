import type { JSX } from "react";
import { ink } from "./styles";
import { accentOf } from "./utils";

/* ════════════════════════════════════════════════════════════════════════
   WADA — Bibliothèque d'illustrations vêtements
   ──────────────────────────────────────────────────────────────────────
   Style : flat editorial × fiche modélisme × pinceau japonais
   ──────────────────────────────────────────────────────────────────────
   Principes de design :
   1. Aplat unique — chaque pièce est une seule couleur principale
   2. Ton-sur-ton — les accents (col, plis, coutures) utilisent une
      nuance ~18% plus foncée calculée automatiquement par accentOf()
   3. Proportions e-commerce — viewBox 100×120, ratio constant
   4. Fond de bibliothèque — `fill="none"` par défaut, devient un aplat
      dès qu'on passe `fillColor`
   5. Aucune texture, aucun gradient, aucune ombre 3D
   ──────────────────────────────────────────────────────────────────── */

const VIEWBOX = "0 0 100 120";
const STROKE = 1;
const ACCENT_STROKE = 0.7;
const DETAIL_STROKE = 0.5;
const FALLBACK_FILL = "#E8DFD0";

/* ──────────────────────────────────────────────────────────────────────
   Figure culturelle (page Cultures)
   ──────────────────────────────────────────────────────────────────── */

interface CulturalFigureProps {
  type: string;
  size?: number;
}

export const CulturalFigure = ({ type, size = 140 }: CulturalFigureProps): JSX.Element => {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 120 160",
    fill: "none" as const,
    stroke: ink,
    strokeWidth: 1,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "english":
      return (<svg {...c}><circle cx="60" cy="30" r="11"/><path d="M52 38 L48 50 L42 90 L56 90 L60 60 L64 90 L78 90 L72 50 L68 38"/><path d="M58 38 L62 38 L62 58 L58 58 Z"/><path d="M48 90 L46 130 L56 130 L58 100"/><path d="M72 90 L74 130 L64 130 L62 100"/></svg>);
    case "french":
      return (<svg {...c}><circle cx="60" cy="28" r="10"/><path d="M52 36 L48 48 L44 70 L52 130 L68 130 L76 70 L72 48 L68 36"/><path d="M44 70 L36 100 L40 102"/><path d="M76 70 L84 100 L80 102"/></svg>);
    case "japanese":
      return (<svg {...c}><circle cx="60" cy="28" r="10"/><path d="M52 38 L40 60 L36 110 L48 130 L60 100 L72 130 L84 110 L80 60 L68 38"/><rect x="48" y="80" width="24" height="10"/></svg>);
    case "african":
      return (<svg {...c}><circle cx="60" cy="32" r="10"/><path d="M48 22 L45 12 L55 18 L60 10 L65 18 L75 12 L72 22 Q70 28 60 28 Q50 28 48 22 Z"/><path d="M52 40 L46 60 L42 130 L78 130 L74 60 L68 40"/></svg>);
    case "indian":
      return (<svg {...c}><circle cx="60" cy="28" r="10"/><path d="M52 38 L48 60 L52 130 L68 130 L72 60 L68 38"/><path d="M48 60 L36 100 Q34 130 50 130"/><path d="M72 60 L84 100 Q86 130 70 130"/></svg>);
    case "mexican":
      return (<svg {...c}><circle cx="60" cy="30" r="10"/><path d="M40 30 Q60 18 80 30 L82 36 L38 36 Z"/><path d="M40 50 L30 90 L50 95 L60 60 L70 95 L90 90 L80 50 Z"/></svg>);
    default:
      return (<svg {...c}><circle cx="60" cy="30" r="10"/><path d="M50 38 L42 130 L78 130 L70 38 Z"/></svg>);
  }
};

/* ──────────────────────────────────────────────────────────────────────
   PieceIcon — composant principal
   ──────────────────────────────────────────────────────────────────── */

interface PieceIconProps {
  type: string;
  size?: number;
  /** Couleur principale du vêtement (aplat). Défaut : crème. */
  fillColor?: string;
}

export const PieceIcon = ({ type, size = 56, fillColor }: PieceIconProps): JSX.Element => {
  const fill = fillColor || FALLBACK_FILL;
  const accent = accentOf(fill, 0.22); // ~22 % plus foncé pour le contour
  const detail = accentOf(fill, 0.12); // ~12 % pour les plis subtils

  const baseProps = {
    width: size,
    height: size * 1.2,
    viewBox: VIEWBOX,
    fill,
    stroke: accent,
    strokeWidth: STROKE,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    /* ── HAUTS ──────────────────────────────────────────────────────── */

    case "tshirt":
      return (
        <svg {...baseProps}>
          <path d="M22 22 L36 16 Q42 22 50 22 Q58 22 64 16 L78 22 L88 38 L74 42 L74 100 L26 100 L26 42 L12 38 Z" />
          <path d="M42 22 Q50 30 58 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M28 96 L72 96" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M14 38 Q20 36 26 42" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M86 38 Q80 36 74 42" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "crewneck":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L36 14 Q42 18 50 18 Q58 18 64 14 L80 22 L88 40 L74 44 L74 102 L26 102 L26 44 L12 40 Z" />
          <path d="M42 18 Q50 26 58 18" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M26 46 L74 46" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M28 92 L72 92" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
          <path d="M28 98 L72 98" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "henley":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L36 14 Q42 18 50 18 Q58 18 64 14 L80 22 L88 40 L74 44 L74 102 L26 102 L26 44 L12 40 Z" />
          <path d="M50 18 L50 52" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="30" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="40" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="50" r="1" fill={detail} stroke="none" />
        </svg>
      );

    case "polo":
      return (
        <svg {...baseProps}>
          <path d="M22 22 L36 18 L40 24 L40 30 L60 30 L60 24 L64 18 L78 22 L88 38 L74 42 L74 96 L26 96 L26 42 L12 38 Z" />
          <path d="M40 24 L50 30 L60 24" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="38" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="46" r="1" fill={detail} stroke="none" />
        </svg>
      );

    case "turtleneck":
      return (
        <svg {...baseProps}>
          <path d="M20 26 L34 18 L36 26 L40 26 L40 18 Q40 12 50 12 Q60 12 60 18 L60 26 L64 26 L66 18 L80 26 L88 42 L74 46 L74 100 L26 100 L26 46 L12 42 Z" />
          <path d="M40 20 L60 20" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M40 24 L60 24" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "shirt":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L34 14 L40 22 L46 28 L54 28 L60 22 L66 14 L80 22 L80 102 L20 102 Z" />
          <path d="M46 28 L50 34 L54 28" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 34 L50 102" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="50" cy="46" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="58" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="70" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="82" r="1" fill={detail} stroke="none" />
          <circle cx="50" cy="94" r="1" fill={detail} stroke="none" />
          <path d="M30 32 L30 50 L24 52" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M70 32 L70 50 L76 52" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "blouse":
      return (
        <svg {...baseProps}>
          <path d="M22 22 L34 16 L42 22 Q50 30 58 22 L66 16 L78 22 L74 32 L74 102 Q50 106 26 102 L26 32 Z" />
          <path d="M50 30 L50 102" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M30 36 Q50 42 70 36" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "tank":
      return (
        <svg {...baseProps}>
          <path d="M30 18 L34 32 L34 102 L66 102 L66 32 L70 18 L60 24 Q50 28 40 24 Z" />
          <path d="M40 24 Q50 30 60 24" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "cardigan":
      return (
        <svg {...baseProps}>
          <path d="M22 24 L36 16 L46 22 L46 102 L22 102 Z" />
          <path d="M78 24 L64 16 L54 22 L54 102 L78 102 Z" />
          <circle cx="50" cy="36" r="1.1" fill={detail} stroke="none" />
          <circle cx="50" cy="50" r="1.1" fill={detail} stroke="none" />
          <circle cx="50" cy="64" r="1.1" fill={detail} stroke="none" />
          <circle cx="50" cy="78" r="1.1" fill={detail} stroke="none" />
          <circle cx="50" cy="92" r="1.1" fill={detail} stroke="none" />
          <path d="M50 22 L50 102" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 1" />
        </svg>
      );

    case "hoodie":
      return (
        <svg {...baseProps}>
          <path d="M18 32 L26 22 Q34 12 50 12 Q66 12 74 22 L82 32 L88 44 L74 48 L74 102 L26 102 L26 48 L12 44 Z" />
          <path d="M30 18 Q50 26 70 18" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M44 48 L44 62 L56 62 L56 48" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 48 L50 62" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M28 96 L72 96" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "sweatshirt":
      return (
        <svg {...baseProps}>
          <path d="M20 24 L36 18 Q42 22 50 22 Q58 22 64 18 L80 24 L88 42 L74 46 L74 100 L26 100 L26 46 L12 42 Z" />
          <path d="M42 22 Q50 28 58 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M28 94 L72 94" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
          <path d="M14 42 Q20 40 26 46" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M86 42 Q80 40 74 46" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    /* ── BAS ────────────────────────────────────────────────────────── */

    case "trousers":
      return (
        <svg {...baseProps}>
          <path d="M28 14 L72 14 L74 22 L66 112 L52 112 L50 38 L48 112 L34 112 L26 22 Z" />
          <path d="M28 22 L72 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 38 L50 112" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M34 28 L40 28" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M60 28 L66 28" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "jeans":
      return (
        <svg {...baseProps}>
          <path d="M28 14 L72 14 L74 22 L66 114 L52 114 L50 40 L48 114 L34 114 L26 22 Z" />
          <path d="M28 20 L72 20" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="32" y="24" width="8" height="6" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="60" y="24" width="8" height="6" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M50 14 L50 38" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="42" cy="20" r="0.7" fill={detail} stroke="none" />
        </svg>
      );

    case "joggers":
      return (
        <svg {...baseProps}>
          <path d="M30 14 L70 14 L70 20 L66 102 Q60 108 54 102 L52 50 L48 50 L46 102 Q40 108 34 102 L30 20 Z" />
          <path d="M30 20 L70 20" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M36 98 Q42 102 46 98" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M54 98 Q60 102 64 98" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M48 18 Q50 22 52 18" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "shorts":
      return (
        <svg {...baseProps}>
          <path d="M26 22 L74 22 L72 70 L52 70 L50 38 L48 70 L28 70 Z" />
          <path d="M26 28 L74 28" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 38 L50 70" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "skirt":
      return (
        <svg {...baseProps}>
          <path d="M34 22 L66 22 L80 102 L20 102 Z" />
          <path d="M34 30 L66 30" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M30 96 L70 96" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "skirt-mini":
      return (
        <svg {...baseProps}>
          <path d="M34 22 L66 22 L74 60 L26 60 Z" />
          <path d="M34 28 L66 28" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "skirt-midi":
      return (
        <svg {...baseProps}>
          <path d="M34 22 L66 22 L78 90 L22 90 Z" />
          <path d="M34 28 L66 28" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "skirt-pleated":
      return (
        <svg {...baseProps}>
          <path d="M34 22 L66 22 L80 102 L20 102 Z" />
          <path d="M34 22 L28 102 M40 22 L36 102 M46 22 L44 102 M50 22 L50 102 M54 22 L56 102 M60 22 L64 102 M66 22 L72 102" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M34 28 L66 28" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "leggings":
      return (
        <svg {...baseProps}>
          <path d="M36 14 L64 14 L66 22 L60 112 L54 112 L50 44 L46 112 L40 112 L34 22 Z" />
          <path d="M36 22 L64 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    /* ── ROBES ──────────────────────────────────────────────────────── */

    case "dress":
      return (
        <svg {...baseProps}>
          <path d="M34 18 L40 22 Q50 28 60 22 L66 18 L72 32 L82 110 L18 110 L28 32 Z" />
          <path d="M40 22 Q50 30 60 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M28 32 L72 32" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "dress-mini":
      return (
        <svg {...baseProps}>
          <path d="M34 18 L40 22 Q50 28 60 22 L66 18 L72 32 L78 70 L22 70 L28 32 Z" />
          <path d="M40 22 Q50 30 60 22" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "dress-midi":
      return (
        <svg {...baseProps}>
          <path d="M34 16 L40 20 Q50 26 60 20 L66 16 L72 30 L80 96 L20 96 L28 30 Z" />
          <path d="M40 20 Q50 28 60 20" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "dress-maxi":
      return (
        <svg {...baseProps}>
          <path d="M34 14 L40 18 Q50 24 60 18 L66 14 L74 30 L88 116 L12 116 L26 30 Z" />
          <path d="M40 18 Q50 26 60 18" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M22 80 L78 80" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "wrap-dress":
      return (
        <svg {...baseProps}>
          <path d="M34 18 L40 22 Q50 28 60 22 L66 18 L72 32 L82 110 L18 110 L28 32 Z" />
          <path d="M28 32 L72 52 L72 32" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="68" cy="48" r="1.5" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "shirt-dress":
      return (
        <svg {...baseProps}>
          <path d="M34 18 L40 22 L42 28 L58 28 L60 22 L66 18 L72 32 L80 110 L20 110 L28 32 Z" />
          <path d="M50 28 L50 110" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="50" cy="42" r="0.9" fill={detail} stroke="none" />
          <circle cx="50" cy="56" r="0.9" fill={detail} stroke="none" />
          <circle cx="50" cy="70" r="0.9" fill={detail} stroke="none" />
        </svg>
      );

    /* ── EXTÉRIEUR ──────────────────────────────────────────────────── */

    case "blazer":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L34 14 L42 24 L50 28 L58 24 L66 14 L80 22 L80 104 L20 104 Z" />
          <path d="M50 28 L50 104" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="28" y="56" width="14" height="6" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="58" y="56" width="14" height="6" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M34 14 L42 24 L34 36" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M66 14 L58 24 L66 36" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="44" cy="52" r="0.8" fill={detail} stroke="none" />
        </svg>
      );

    case "coat":
      return (
        <svg {...baseProps}>
          <path d="M18 22 L34 14 L42 24 L50 28 L58 24 L66 14 L82 22 L88 38 L74 42 L74 114 L26 114 L26 42 L12 38 Z" />
          <path d="M50 28 L50 114" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="56" cy="46" r="1.4" fill={detail} stroke="none" />
          <circle cx="56" cy="62" r="1.4" fill={detail} stroke="none" />
          <circle cx="56" cy="78" r="1.4" fill={detail} stroke="none" />
          <circle cx="56" cy="94" r="1.4" fill={detail} stroke="none" />
          <path d="M34 14 L42 24" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M66 14 L58 24" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "trench":
      return (
        <svg {...baseProps}>
          <path d="M16 22 L34 14 L42 24 L50 28 L58 24 L66 14 L84 22 L88 38 L74 42 L74 114 L26 114 L26 42 L12 38 Z" />
          <path d="M16 32 L84 32" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 28 L50 114" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="56" cy="42" r="1" fill={detail} stroke="none" />
          <circle cx="44" cy="42" r="1" fill={detail} stroke="none" />
          <circle cx="56" cy="58" r="1" fill={detail} stroke="none" />
          <circle cx="44" cy="58" r="1" fill={detail} stroke="none" />
          <path d="M16 72 L84 72" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="40" y="74" width="20" height="6" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "peacoat":
      return (
        <svg {...baseProps}>
          <path d="M18 22 L34 14 L42 24 L50 28 L58 24 L66 14 L82 22 L82 102 L18 102 Z" />
          <path d="M50 28 L50 102" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="56" cy="44" r="1.5" fill={detail} stroke="none" />
          <circle cx="44" cy="44" r="1.5" fill={detail} stroke="none" />
          <circle cx="56" cy="62" r="1.5" fill={detail} stroke="none" />
          <circle cx="44" cy="62" r="1.5" fill={detail} stroke="none" />
          <path d="M28 30 L34 14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M72 30 L66 14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "puffer":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L36 16 Q42 18 50 18 Q58 18 64 16 L80 22 L88 38 L74 42 L74 110 L26 110 L26 42 L12 38 Z" />
          <path d="M16 38 L84 38 M16 54 L84 54 M16 70 L84 70 M16 86 L84 86 M16 102 L84 102" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M50 18 L50 110" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "leather-jacket":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L34 14 L42 22 L42 28 L58 28 L58 22 L66 14 L80 22 L80 98 L20 98 Z" />
          <path d="M36 36 L64 36" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M50 28 L50 98" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M66 50 L72 56 L66 62" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M30 70 L42 70 L42 84 L30 84 Z" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M58 70 L70 70 L70 84 L58 84 Z" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "denim-jacket":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L34 14 L40 22 L42 28 L58 28 L60 22 L66 14 L80 22 L80 90 L20 90 Z" />
          <path d="M50 28 L50 90" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="32" y="36" width="14" height="10" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="54" y="36" width="14" height="10" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="46" cy="36" r="0.8" fill={detail} stroke="none" />
          <circle cx="46" cy="50" r="0.8" fill={detail} stroke="none" />
          <circle cx="46" cy="64" r="0.8" fill={detail} stroke="none" />
        </svg>
      );

    case "chorecoat":
      return (
        <svg {...baseProps}>
          <path d="M20 24 L36 18 L42 24 L58 24 L64 18 L80 24 L80 102 L20 102 Z" />
          <path d="M50 24 L50 102" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="28" y="46" width="14" height="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="58" y="46" width="14" height="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="28" y="76" width="14" height="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="58" y="76" width="14" height="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "jacket":
      return (
        <svg {...baseProps}>
          <path d="M20 22 L34 14 L42 22 L58 22 L66 14 L80 22 L88 38 L74 42 L74 94 L26 94 L26 42 L12 38 Z" />
          <path d="M28 90 L72 90" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "teddy":
      return (
        <svg {...baseProps}>
          <path d="M20 24 Q22 20 26 20 L74 20 Q78 20 80 24 L80 106 L20 106 Z" />
          <path d="M20 30 L80 30" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "kimono":
      return (
        <svg {...baseProps}>
          <path d="M14 22 L30 14 L42 24 L50 22 L58 24 L70 14 L86 22 L80 102 L20 102 Z" />
          <path d="M50 22 L50 102" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M22 36 L34 36" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M66 36 L78 36" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M30 60 L70 60" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    /* ── CHAUSSURES ─────────────────────────────────────────────────── */

    case "sneaker":
      return (
        <svg {...baseProps}>
          {/* Semelle épaisse (signature sneaker) */}
          <path d="M4 96 L4 106 L96 106 L96 96 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Corps de la chaussure */}
          <path d="M6 96 Q6 64 22 56 L34 50 L60 56 Q82 60 94 76 L94 96 Z" />
          {/* Liseré semelle bouclette */}
          <path d="M6 88 L94 88" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Lacets : 4 paires */}
          <path d="M30 60 L48 64 M32 68 L48 72 M34 76 L48 80 M36 84 L48 88" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Bouclette de tirette */}
          <path d="M48 64 L48 88" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Logo / point de couture latéral */}
          <ellipse cx="76" cy="80" rx="5" ry="2.5" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "sneaker-chunky":
      return (
        <svg {...baseProps}>
          {/* Semelle XL en deux couches */}
          <path d="M2 86 L2 110 L98 110 L98 86 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          <path d="M2 96 L98 96" stroke="#F4EFE6" strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Corps */}
          <path d="M8 86 Q10 56 30 50 L62 54 Q86 58 94 76 L94 86 Z" />
          {/* Stries de la semelle */}
          <path d="M16 100 L16 108 M28 100 L28 108 M40 100 L40 108 M52 100 L52 108 M64 100 L64 108 M76 100 L76 108 M88 100 L88 108" stroke="#F4EFE6" strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Lacets */}
          <path d="M30 64 L52 64 M32 72 L52 72 M34 80 L52 80" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "loafer":
      return (
        <svg {...baseProps}>
          {/* Semelle visible */}
          <path d="M6 96 L6 104 L94 104 L94 96 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Corps du mocassin (toe pointe à gauche, talon à droite) */}
          <path d="M8 96 Q8 60 30 56 L66 54 Q90 56 92 78 L92 96 Z" />
          {/* Saddle band — signature loafer */}
          <path d="M28 74 Q50 70 72 74 L72 82 Q50 78 28 82 Z" fill={detail} stroke={accent} strokeWidth={ACCENT_STROKE} opacity="0.55" />
          {/* Penny slot au centre */}
          <path d="M44 78 L56 78" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Couture du bout (toe stitching) */}
          <path d="M14 70 Q22 66 32 66" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Liseré de la semelle */}
          <path d="M8 92 L92 92" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "oxford":
      return (
        <svg {...baseProps}>
          {/* Semelle fine (oxford = chaussure habillée) */}
          <path d="M8 98 L8 104 L92 104 L92 98 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Corps */}
          <path d="M10 98 Q10 60 30 56 L66 54 Q88 58 90 78 L90 98 Z" />
          {/* Toe cap (signature oxford) */}
          <path d="M18 78 Q22 72 30 72" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M16 84 L34 84" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Lacets : 5 traits horizontaux */}
          <path d="M44 70 L62 70 M44 76 L62 76 M44 82 L62 82 M44 88 L62 88" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Œillets */}
          <circle cx="44" cy="70" r="0.8" fill={detail} stroke="none" />
          <circle cx="62" cy="70" r="0.8" fill={detail} stroke="none" />
          <circle cx="44" cy="88" r="0.8" fill={detail} stroke="none" />
          <circle cx="62" cy="88" r="0.8" fill={detail} stroke="none" />
        </svg>
      );

    case "boot":
      return (
        <svg {...baseProps}>
          {/* Tige montante */}
          <path d="M28 14 L66 14 L66 76 L86 78 L86 92 L22 92 L22 22 Z" />
          {/* Semelle épaisse */}
          <path d="M20 92 L20 104 L88 104 L88 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Lacets centraux */}
          <path d="M48 28 L48 70" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="48" cy="32" r="0.9" fill={accent} stroke="none" />
          <circle cx="48" cy="44" r="0.9" fill={accent} stroke="none" />
          <circle cx="48" cy="56" r="0.9" fill={accent} stroke="none" />
          <circle cx="48" cy="68" r="0.9" fill={accent} stroke="none" />
          {/* Liseré de la tige */}
          <path d="M22 88 L86 88" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "chelsea-boot":
      return (
        <svg {...baseProps}>
          {/* Bottine */}
          <path d="M30 22 L62 22 L66 70 L84 76 L84 92 L22 92 L22 28 Z" />
          {/* Élastique latéral (signature Chelsea) */}
          <rect x="60" y="46" width="22" height="20" fill={detail} stroke={accent} strokeWidth={ACCENT_STROKE} opacity="0.5" />
          <path d="M62 52 L82 52 M62 58 L82 58 M62 64 L82 64" stroke={accent} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Patte de tirage à l'arrière */}
          <rect x="34" y="22" width="10" height="6" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Semelle */}
          <path d="M20 92 L20 104 L86 104 L86 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
        </svg>
      );

    case "ankle-boot":
      return (
        <svg {...baseProps}>
          {/* Bottine basse */}
          <path d="M30 36 L62 36 L66 72 L84 76 L84 92 L22 92 L22 44 Z" />
          {/* Couture latérale */}
          <path d="M22 70 L84 70" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Semelle */}
          <path d="M20 92 L20 104 L86 104 L86 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Petit zip */}
          <path d="M40 44 L40 88" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 1" />
        </svg>
      );

    case "pump":
      return (
        <svg {...baseProps}>
          {/* Corps de l'escarpin avec talon haut */}
          <path d="M14 76 Q14 44 38 40 Q64 40 80 50 L92 78 L92 88 L74 88 L68 104 L62 88 L14 88 Z" />
          {/* Talon visible */}
          <path d="M68 88 L68 104 L74 104 L74 88 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Liseré semelle */}
          <path d="M14 86 L74 86" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Embout du toe */}
          <path d="M16 60 Q22 56 30 56" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "ballet":
      return (
        <svg {...baseProps}>
          {/* Corps de la ballerine */}
          <path d="M8 92 Q10 56 36 50 Q72 50 92 70 L94 92 Z" />
          {/* Nœud signature */}
          <path d="M30 60 Q36 56 42 60 Q36 64 30 60 Z" fill={detail} stroke={accent} strokeWidth={ACCENT_STROKE} />
          <circle cx="36" cy="60" r="1.5" fill={accent} stroke="none" />
          {/* Échancrure du dessus */}
          <path d="M30 70 Q50 64 70 70" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Semelle fine */}
          <path d="M8 92 L8 102 L94 102 L94 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
        </svg>
      );

    case "mule":
      return (
        <svg {...baseProps}>
          {/* Corps de la mule (talon ouvert) */}
          <path d="M8 92 Q10 50 32 46 L72 48 Q90 52 92 78 L92 92 Z" />
          {/* Bride avant */}
          <path d="M28 56 Q50 50 72 56" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Couture talon */}
          <path d="M86 60 L86 88" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Semelle */}
          <path d="M8 92 L8 102 L92 102 L92 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
        </svg>
      );

    case "sandal":
      return (
        <svg {...baseProps}>
          {/* Semelle prononcée (sandale = sole-first) */}
          <path d="M6 84 Q8 78 22 76 L78 76 Q92 78 94 84 L94 100 L6 100 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          {/* Lanières principales */}
          <path d="M22 76 L28 50" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" strokeLinecap="round" />
          <path d="M48 76 L50 44" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" strokeLinecap="round" />
          <path d="M72 76 L74 50" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" strokeLinecap="round" />
          {/* Bride transversale */}
          <path d="M28 50 Q50 44 74 50" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          {/* Texture semelle */}
          <path d="M10 92 L94 92" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" opacity="0.5" />
        </svg>
      );

    case "espadrille":
      return (
        <svg {...baseProps}>
          {/* Toile / dessus */}
          <path d="M8 84 Q10 56 32 52 L72 54 Q90 58 92 84 L92 92 L8 92 Z" />
          {/* Liseré toile */}
          <path d="M16 64 Q50 60 84 64" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          {/* Semelle en jute (signature espadrille) */}
          <path d="M6 92 Q8 100 16 102 L84 102 Q92 100 94 92 Z" fill={accent} stroke={accent} strokeWidth={DETAIL_STROKE} />
          <path d="M10 96 L92 96" stroke="#F4EFE6" strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 1" />
          <path d="M14 100 L88 100" stroke="#F4EFE6" strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 1" />
        </svg>
      );

    case "geta":
      return (
        <svg {...baseProps}>
          <path d="M22 64 L78 64 L74 78 L26 78 Z" />
          <path d="M30 78 L30 96 M70 78 L70 96" stroke={accent} strokeWidth={STROKE} fill="none" />
          <path d="M50 64 L50 70" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    /* ── ACCESSOIRES ────────────────────────────────────────────────── */

    case "watch":
      return (
        <svg {...baseProps}>
          <rect x="38" y="40" width="24" height="40" rx="3" />
          <rect x="36" y="20" width="28" height="22" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="36" y="78" width="28" height="22" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="60" r="3" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <circle cx="50" cy="60" r="0.8" fill={detail} stroke="none" />
        </svg>
      );

    case "scarf":
      return (
        <svg {...baseProps}>
          <path d="M28 20 Q40 28 50 28 Q60 28 72 20 L72 26 Q60 32 50 32 Q40 32 28 26 Z" />
          <path d="M40 32 L34 100 L44 96 L46 60 L54 60 L56 96 L66 100 L60 32" />
          <path d="M40 50 L60 50" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "foulard":
      return (
        <svg {...baseProps}>
          <rect x="28" y="36" width="44" height="44" />
          <path d="M28 80 L40 60 L52 80 L64 60 L72 80" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M36 44 L64 44" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" strokeDasharray="2 1" />
        </svg>
      );

    case "tie":
      return (
        <svg {...baseProps}>
          <path d="M40 20 L60 20 L56 32 L60 40 L56 100 L44 100 L40 40 L44 32 Z" />
          <path d="M44 32 L56 32" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M48 50 L52 50" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "belt":
      return (
        <svg {...baseProps}>
          <rect x="6" y="50" width="88" height="14" />
          <rect x="42" y="44" width="20" height="26" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="49" cy="57" r="1" fill={detail} stroke="none" />
          <path d="M6 60 L94 60" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "glasses":
      return (
        <svg {...baseProps}>
          <circle cx="30" cy="60" r="14" />
          <circle cx="70" cy="60" r="14" />
          <path d="M44 60 L56 60" stroke={accent} strokeWidth={STROKE} fill="none" />
        </svg>
      );

    case "sunglasses":
      return (
        <svg {...baseProps}>
          <path d="M10 50 L46 50 Q46 72 30 72 Q14 72 10 56 Z" />
          <path d="M54 50 L90 50 Q86 72 70 72 Q54 72 54 56 Z" />
          <path d="M46 50 L54 50" stroke={accent} strokeWidth={STROKE} fill="none" />
        </svg>
      );

    case "hat":
      return (
        <svg {...baseProps}>
          <ellipse cx="50" cy="80" rx="44" ry="6" />
          <path d="M22 80 Q24 40 50 40 Q76 40 78 80" />
          <path d="M22 72 L78 72" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "panama":
      return (
        <svg {...baseProps}>
          <ellipse cx="50" cy="76" rx="40" ry="6" />
          <path d="M24 76 Q26 40 50 40 Q74 40 76 76" />
          <path d="M28 64 L72 64" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "fedora":
      return (
        <svg {...baseProps}>
          <ellipse cx="50" cy="80" rx="42" ry="6" />
          <path d="M22 80 Q28 50 50 50 Q72 50 78 80" />
          <path d="M40 56 Q50 52 60 56" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "beret":
      return (
        <svg {...baseProps}>
          <ellipse cx="50" cy="60" rx="30" ry="20" />
          <circle cx="50" cy="42" r="2" fill={detail} stroke="none" />
        </svg>
      );

    case "beanie":
      return (
        <svg {...baseProps}>
          <path d="M22 60 Q22 30 50 30 Q78 30 78 60 L78 76 L22 76 Z" />
          <path d="M22 72 L78 72" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M22 64 L78 64" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M22 56 L78 56" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "cap":
      return (
        <svg {...baseProps}>
          <path d="M26 62 Q26 42 50 42 Q74 42 74 62 L74 72 L26 72 Z" />
          <path d="M74 72 L92 72 L92 68 L74 68" stroke={accent} strokeWidth={STROKE} fill="none" />
          <path d="M50 42 L50 72" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    /* ── SACS ───────────────────────────────────────────────────────── */

    case "bag":
      return (
        <svg {...baseProps}>
          <path d="M26 42 L74 42 L70 100 L30 100 Z" />
          <path d="M36 42 Q36 24 50 24 Q64 24 64 42" stroke={accent} strokeWidth={STROKE} fill="none" />
          <path d="M30 50 L70 50" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "tote":
      return (
        <svg {...baseProps}>
          <path d="M22 42 L78 42 L74 100 L26 100 Z" />
          <path d="M36 42 L36 24 L46 24 L46 42" stroke={accent} strokeWidth={STROKE} fill="none" />
          <path d="M54 42 L54 24 L64 24 L64 42" stroke={accent} strokeWidth={STROKE} fill="none" />
        </svg>
      );

    case "bucket":
      return (
        <svg {...baseProps}>
          <path d="M28 42 L72 42 L74 96 Q74 100 70 100 L30 100 Q26 100 26 96 Z" />
          <path d="M26 42 L74 42" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M36 24 Q36 18 50 18 Q64 18 64 24 L64 42" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" strokeDasharray="2 2" />
        </svg>
      );

    case "crossbody":
      return (
        <svg {...baseProps}>
          <rect x="28" y="48" width="44" height="34" />
          <path d="M28 48 Q22 30 50 22 Q78 30 72 48" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="64" r="2.5" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <path d="M28 70 L72 70" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "clutch":
      return (
        <svg {...baseProps}>
          <rect x="14" y="52" width="72" height="22" />
          <path d="M14 60 L86 60" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="66" r="1.5" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "backpack":
      return (
        <svg {...baseProps}>
          <path d="M30 32 L70 32 Q76 32 76 38 L76 100 L24 100 L24 38 Q24 32 30 32 Z" />
          <path d="M36 24 Q36 18 42 18 L58 18 Q64 18 64 24 L64 32" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M24 60 L76 60" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
          <rect x="38" y="38" width="24" height="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "pouch":
      return (
        <svg {...baseProps}>
          <rect x="20" y="48" width="60" height="24" rx="2" />
          <circle cx="78" cy="60" r="1.5" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M20 56 L80 56" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    /* ── BIJOUX ─────────────────────────────────────────────────────── */

    case "ring":
      return (
        <svg {...baseProps}>
          <circle cx="50" cy="68" r="18" />
          <path d="M50 50 L42 36 L50 28 L58 36 Z" />
          <circle cx="50" cy="68" r="14" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "earring":
      return (
        <svg {...baseProps}>
          <circle cx="50" cy="32" r="3" />
          <path d="M50 36 L50 52" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <circle cx="50" cy="64" r="11" />
        </svg>
      );

    case "necklace":
      return (
        <svg {...baseProps}>
          <path d="M14 32 Q50 76 86 32" stroke={accent} strokeWidth={STROKE} fill="none" />
          <circle cx="50" cy="58" r="4" />
        </svg>
      );

    case "bracelet":
      return (
        <svg {...baseProps}>
          <ellipse cx="50" cy="60" rx="32" ry="12" />
          <circle cx="32" cy="60" r="2" fill={detail} stroke="none" />
          <circle cx="50" cy="60" r="2" fill={detail} stroke="none" />
          <circle cx="68" cy="60" r="2" fill={detail} stroke="none" />
        </svg>
      );

    case "cufflinks":
      return (
        <svg {...baseProps}>
          <circle cx="32" cy="60" r="10" />
          <circle cx="68" cy="60" r="10" />
          <circle cx="32" cy="60" r="3" fill={detail} stroke="none" />
          <circle cx="68" cy="60" r="3" fill={detail} stroke="none" />
        </svg>
      );

    /* ── DIVERS ─────────────────────────────────────────────────────── */

    case "pocketsquare":
      return (
        <svg {...baseProps}>
          <path d="M22 36 L78 36 L72 96 L28 96 Z" />
          <path d="M36 36 L40 64 L60 64 L64 36" stroke={detail} strokeWidth={ACCENT_STROKE} fill="none" />
        </svg>
      );

    case "umbrella":
      return (
        <svg {...baseProps}>
          <path d="M10 56 Q50 12 90 56 Z" />
          <path d="M50 56 L50 96 Q50 102 56 102" stroke={accent} strokeWidth={STROKE} fill="none" />
          <path d="M30 56 Q40 46 50 56 Q60 46 70 56" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "notebook":
      return (
        <svg {...baseProps}>
          <rect x="26" y="22" width="48" height="76" />
          <path d="M34 22 L34 98" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M42 36 L66 36 M42 48 L66 48 M42 60 L66 60 M42 72 L66 72" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    case "perfume":
      return (
        <svg {...baseProps}>
          <rect x="34" y="36" width="32" height="56" />
          <rect x="42" y="20" width="16" height="14" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <rect x="38" y="32" width="24" height="6" stroke={accent} strokeWidth={ACCENT_STROKE} fill="none" />
          <path d="M40 50 L60 50" stroke={detail} strokeWidth={DETAIL_STROKE} fill="none" />
        </svg>
      );

    /* ── DEFAULT ────────────────────────────────────────────────────── */

    default:
      return (
        <svg {...baseProps}>
          <rect x="22" y="22" width="56" height="76" />
        </svg>
      );
  }
};

/* ════════════════════════════════════════════════════════════════════════
   iconForItem — résolution texte → slug
   ════════════════════════════════════════════════════════════════════════ */

const RULES: Array<[RegExp, string]> = [
  // Outerwear (priorité haute pour éviter les faux positifs)
  [/cuir.*veste|leather.*jacket|veste.*cuir|jacket.*leather/, "leather-jacket"],
  [/jean.*veste|denim.*veste|veste.*jean|veste.*denim/, "denim-jacket"],
  [/trench/, "trench"],
  [/peacoat|caban/, "peacoat"],
  [/parka|doudoune|puffer/, "puffer"],
  [/teddy/, "teddy"],
  [/chore|surchemise|workwear|agbada|haori/, "chorecoat"],
  [/kimono/, "kimono"],
  [/manteau|coat\b|caftan|châle|shawl|rebozo/, "coat"],
  [/blazer|tailleur|veston/, "blazer"],
  [/coupe-vent|veste|jacket|cape|poncho|gilet/, "jacket"],

  // Robes
  [/robe maxi|maxi dress/, "dress-maxi"],
  [/robe midi|midi dress/, "dress-midi"],
  [/robe mini|mini dress/, "dress-mini"],
  [/wrap dress|robe portefeuille/, "wrap-dress"],
  [/shirt dress|robe chemise/, "shirt-dress"],
  [/robe|dress|huipil/, "dress"],

  // Tops
  [/hoodie|capuche/, "hoodie"],
  [/sweatshirt|sweat\b/, "sweatshirt"],
  [/cardigan/, "cardigan"],
  [/turtleneck|col rou/, "turtleneck"],
  [/henley/, "henley"],
  [/polo/, "polo"],
  [/blouse|kurta|guayabera|tunique/, "blouse"],
  [/tank|débardeur|bralette|brassière/, "tank"],
  [/col rond|crewneck|pull|sweater|knit|merinos|cachemire|cashmere|lambswool/, "crewneck"],
  [/t-shirt|tee\b|maillot/, "tshirt"],
  [/chemise|button-down|oxford shirt|shirt\b/, "shirt"],

  // Bottoms
  [/jogging|jogg\b|tracksuit|sweatpants/, "joggers"],
  [/jean|denim|selvedge/, "jeans"],
  [/legging/, "leggings"],
  [/short|bermuda/, "shorts"],
  [/jupe.*plissé|pleated skirt/, "skirt-pleated"],
  [/jupe.*midi|midi skirt/, "skirt-midi"],
  [/jupe.*mini|mini skirt/, "skirt-mini"],
  [/jupe|skirt|hakama/, "skirt"],
  [/pantalon|trousers|chinos|cargo|churidar|sarouel|saroual|palazzo/, "trousers"],

  // Shoes
  [/geta|tabi/, "geta"],
  [/sneaker.*chunky|chunky sneaker|salomon|on running/, "sneaker-chunky"],
  [/runner|samba|stan smith|air force|air max|tn\b|jordan|shox|sneaker|tennis|baskets?/, "sneaker"],
  [/chelsea/, "chelsea-boot"],
  [/ankle boot|bottine/, "ankle-boot"],
  [/bottes?|boot/, "boot"],
  [/mocassin|loafer|juttis|babouches|huaraches/, "loafer"],
  [/oxford|derby|brogue|richelieu/, "oxford"],
  [/escarpin|pump/, "pump"],
  [/ballerine|ballet/, "ballet"],
  [/mule|sabot/, "mule"],
  [/espadrille/, "espadrille"],
  [/sandale|sandal/, "sandal"],

  // Bags
  [/cabas|tote|panier|fourre-tout|fourre tout/, "tote"],
  [/bucket|seau/, "bucket"],
  [/crossbody|bandoulière|messenger/, "crossbody"],
  [/pochette|clutch/, "clutch"],
  [/backpack|sac à dos/, "backpack"],
  [/banane|pouch/, "pouch"],
  [/sac|bag/, "bag"],

  // Jewelry
  [/collier|necklace/, "necklace"],
  [/boucle.*oreille|earring/, "earring"],
  [/bague|ring/, "ring"],
  [/bracelet|manchette|cuff|jonc/, "bracelet"],
  [/cufflink|boutons? de manchette/, "cufflinks"],

  // Accessories
  [/écharpe|scarf|gele/, "scarf"],
  [/foulard/, "foulard"],
  [/montre|watch/, "watch"],
  [/sunglasses|lunettes? de soleil/, "sunglasses"],
  [/lunettes|glasses/, "glasses"],
  [/béret|beret/, "beret"],
  [/casquette|cap\b/, "cap"],
  [/bonnet|beanie|chapka/, "beanie"],
  [/panama/, "panama"],
  [/fedora/, "fedora"],
  [/chapeau|hat|sombrero/, "hat"],
  [/cravate|tie\b/, "tie"],
  [/ceinture|belt/, "belt"],
  [/pochette de costume|pocket square/, "pocketsquare"],
  [/parapluie|umbrella/, "umbrella"],
];

/**
 * Détermine le slug d'icône à partir du libellé d'une pièce.
 * Pattern matching ordonné — la première règle qui matche gagne.
 * Retombe sur un fallback raisonnable selon le slot (Top, Bottom…).
 */
export function iconForItem(item: string, piece: string): string {
  const s = item.toLowerCase();
  for (const [re, slug] of RULES) {
    if (re.test(s)) return slug;
  }
  switch (piece) {
    case "Top": return "crewneck";
    case "Bottom": return "trousers";
    case "Outer": return "coat";
    case "Shirt": return "shirt";
    case "Shoes": return "loafer";
    default: return "watch";
  }
}

/* ════════════════════════════════════════════════════════════════════════
   Labels FR pour l'UI
   ════════════════════════════════════════════════════════════════════════ */

export const pieceLabels: Record<string, string> = {
  Top: "Haut",
  Bottom: "Bas",
  Outer: "Veste",
  Shoes: "Chaussures",
  Accent: "Accent",
  Shirt: "Chemise",
};

export const pieceFR: Record<string, string> = {
  // Tops
  crewneck: "Col rond", turtleneck: "Col roule", henley: "Henley", tshirt: "T-shirt",
  polo: "Polo", tank: "Debardeur", blouse: "Blouse", cardigan: "Cardigan",
  hoodie: "Sweat a capuche", sweatshirt: "Sweat", shirt: "Chemise",
  // Bottoms
  trousers: "Pantalon", jeans: "Jean", joggers: "Jogging", shorts: "Short",
  leggings: "Legging", skirt: "Jupe",
  "skirt-mini": "Mini-jupe", "skirt-midi": "Jupe midi", "skirt-pleated": "Jupe plissee",
  // Dresses
  dress: "Robe", "dress-mini": "Mini-robe", "dress-midi": "Robe midi",
  "dress-maxi": "Robe maxi", "wrap-dress": "Robe portefeuille", "shirt-dress": "Robe chemise",
  // Outerwear
  blazer: "Blazer", coat: "Manteau", trench: "Trench", peacoat: "Caban",
  puffer: "Doudoune", "leather-jacket": "Veste cuir", "denim-jacket": "Veste denim",
  chorecoat: "Chore coat", jacket: "Veste", teddy: "Teddy", kimono: "Kimono",
  // Shoes
  sneaker: "Sneakers", "sneaker-chunky": "Sneakers chunky", loafer: "Mocassin",
  oxford: "Oxford", boot: "Bottes", "chelsea-boot": "Chelsea", "ankle-boot": "Bottines",
  pump: "Escarpin", ballet: "Ballerine", mule: "Mule", sandal: "Sandale",
  espadrille: "Espadrille", geta: "Geta",
  // Accessories
  watch: "Montre", scarf: "Echarpe", foulard: "Foulard", tie: "Cravate",
  belt: "Ceinture", glasses: "Lunettes", sunglasses: "Lunettes de soleil",
  hat: "Chapeau", panama: "Panama", fedora: "Fedora", beret: "Beret",
  beanie: "Bonnet", cap: "Casquette",
  // Bags
  bag: "Sac", tote: "Cabas", bucket: "Sac seau", crossbody: "Bandouliere",
  clutch: "Pochette", backpack: "Sac a dos", pouch: "Banane",
  // Jewelry
  ring: "Bague", earring: "Boucle d'oreille", necklace: "Collier",
  bracelet: "Bracelet", cufflinks: "Boutons de manchette",
  // Misc
  pocketsquare: "Pochette de costume", umbrella: "Parapluie",
  notebook: "Carnet", perfume: "Parfum",
};
