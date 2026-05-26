/**
 * PieceIconBold — silhouettes graphiques pleines pour les icônes WADA.
 *
 * Style : silhouette solide remplie + détails internes en cutout (couleur
 * du fond passée en prop). Inspiré des icon sets graphiques pleins —
 * lisible à toutes les tailles, fonctionne sur tous les fonds.
 *
 * 24 types couverts. Tous via une seule prop "type" en kebab-case.
 *
 *   <PieceIconBold type="tshirt" size={64} fillColor="#FFF" bgColor="#A8B2BD" />
 */

export type BoldIconType =
  | "tshirt" | "tank" | "polo" | "shirt" | "shirt-buttoned"
  | "pull" | "cardigan" | "hoodie" | "turtleneck"
  | "jeans" | "trousers" | "shorts" | "joggers"
  | "skirt" | "dress"
  | "blazer" | "jacket" | "coat" | "trench" | "leather-jacket" | "denim-jacket"
  | "sneaker" | "boot" | "loafer" | "sandal" | "flipflop" | "heel"
  | "cap" | "hat" | "watch" | "glasses" | "belt" | "bag" | "scarf" | "tie"
  | "underwear";

interface PieceIconBoldProps {
  type: string;
  size?: number;
  /** Couleur de la silhouette pleine. Défaut #FFFFFF. */
  fillColor?: string;
  /** Couleur des "cutouts" internes (négatif). Défaut #1F1B16. */
  bgColor?: string;
}

const VB = "0 0 100 100";

/* ──────────────────────────────────────────────────────────────────────
   Helper — rend un SVG avec fill + bg pour les cutouts
   ────────────────────────────────────────────────────────────────────── */

function Frame({ children, size }: { children: React.ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={VB}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {children}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Composant principal — switch sur le type
   ────────────────────────────────────────────────────────────────────── */

export default function PieceIconBold({
  type, size = 64, fillColor = "#FFFFFF", bgColor = "#1F1B16",
}: PieceIconBoldProps) {
  const F = fillColor; // forme
  const B = bgColor;   // cutouts

  switch (type) {

    /* ═══ HAUTS ═══ */

    case "tshirt":
      return <Frame size={size}>
        <path fill={F} d="M28 22 L40 16 Q50 22 50 22 Q50 22 60 16 L72 22 L84 30 L78 42 L72 38 L72 86 L28 86 L28 38 L22 42 L16 30 Z" />
        <path fill={B} d="M40 16 Q50 26 60 16 L60 18 Q50 24 40 18 Z" />
      </Frame>;

    case "tank":
      return <Frame size={size}>
        <path fill={F} d="M36 20 L38 30 Q42 24 50 24 Q58 24 62 30 L64 20 L72 26 L72 86 L28 86 L28 26 Z" />
        <path fill={B} d="M40 26 Q50 32 60 26 L60 28 Q50 36 40 28 Z" />
      </Frame>;

    case "polo":
      return <Frame size={size}>
        <path fill={F} d="M28 22 L40 18 L42 24 L42 30 L58 30 L58 24 L60 18 L72 22 L84 30 L78 42 L72 38 L72 86 L28 86 L28 38 L22 42 L16 30 Z" />
        <path fill={B} d="M42 24 L50 30 L58 24 L58 28 L50 34 L42 28 Z" />
        <circle fill={B} cx="50" cy="40" r="1.5" />
        <circle fill={B} cx="50" cy="48" r="1.5" />
      </Frame>;

    case "shirt":
    case "shirt-buttoned":
      return <Frame size={size}>
        <path fill={F} d="M28 22 L40 14 L46 22 L50 26 L54 22 L60 14 L72 22 L80 30 L76 38 L72 36 L72 88 L28 88 L28 36 L24 38 L20 30 Z" />
        <path fill={B} d="M46 22 L50 28 L54 22 L52 26 L50 26 L48 26 Z" />
        <path d="M50 28 L50 88" strokeWidth="1.5" stroke={B} fill="none" />
        <circle fill={B} cx="50" cy="40" r="1.2" />
        <circle fill={B} cx="50" cy="52" r="1.2" />
        <circle fill={B} cx="50" cy="64" r="1.2" />
        <circle fill={B} cx="50" cy="76" r="1.2" />
      </Frame>;

    case "pull":
    case "crewneck":
      return <Frame size={size}>
        <path fill={F} d="M26 22 L40 14 Q50 20 50 20 Q50 20 60 14 L74 22 L86 32 L80 44 L74 40 L74 88 L26 88 L26 40 L20 44 L14 32 Z" />
        <path fill={B} d="M40 14 Q50 22 60 14 L60 18 Q50 26 40 18 Z" />
        <line x1="26" y1="40" x2="74" y2="40" stroke={B} strokeWidth="1" />
      </Frame>;

    case "cardigan":
      return <Frame size={size}>
        <path fill={F} d="M26 24 L38 16 L42 22 L42 86 L26 86 L26 40 L20 44 L16 32 Z" />
        <path fill={F} d="M58 22 L62 16 L74 24 L84 32 L80 44 L74 40 L74 86 L58 86 Z" />
        <path fill={B} d="M42 22 L42 86 L46 86 L46 22 Z" />
        <path fill={B} d="M54 22 L54 86 L58 86 L58 22 Z" />
        <circle fill={B} cx="46" cy="34" r="1.2" />
        <circle fill={B} cx="46" cy="48" r="1.2" />
        <circle fill={B} cx="46" cy="62" r="1.2" />
        <circle fill={B} cx="46" cy="76" r="1.2" />
      </Frame>;

    case "hoodie":
    case "sweatshirt":
      return <Frame size={size}>
        <path fill={F} d="M26 30 Q30 16 50 14 Q70 16 74 30 L86 36 L80 48 L74 44 L74 88 L26 88 L26 44 L20 48 L14 36 Z" />
        <path fill={B} d="M36 26 Q50 18 64 26 Q56 30 50 30 Q44 30 36 26 Z" />
        <line x1="50" y1="32" x2="50" y2="50" stroke={B} strokeWidth="1.5" />
      </Frame>;

    case "turtleneck":
      return <Frame size={size}>
        <path fill={F} d="M28 22 L40 16 Q40 8 50 8 Q60 8 60 16 L72 22 L84 30 L78 42 L72 38 L72 86 L28 86 L28 38 L22 42 L16 30 Z" />
        <line x1="40" y1="14" x2="60" y2="14" stroke={B} strokeWidth="1" />
        <line x1="40" y1="18" x2="60" y2="18" stroke={B} strokeWidth="1" />
      </Frame>;

    /* ═══ BAS ═══ */

    case "trousers":
    case "pants":
    case "chinos":
      return <Frame size={size}>
        <path fill={F} d="M32 18 L68 18 L70 28 L66 90 L54 90 L52 36 L50 36 L48 36 L46 90 L34 90 L30 28 Z" />
        <line x1="50" y1="20" x2="50" y2="36" stroke={B} strokeWidth="1" />
        <path fill={B} d="M32 22 L68 22 L68 24 L32 24 Z" />
      </Frame>;

    case "jeans":
      return <Frame size={size}>
        <path fill={F} d="M32 18 L68 18 L70 30 L66 92 L54 92 L52 38 L48 38 L46 92 L34 92 L30 30 Z" />
        <path fill={B} d="M32 22 L68 22 L68 26 L32 26 Z" />
        <line x1="50" y1="28" x2="50" y2="38" stroke={B} strokeWidth="1" />
        {/* Poches */}
        <path fill={B} d="M36 28 L36 36 L40 36 L40 28 Z" />
        <path fill={B} d="M60 28 L60 36 L64 36 L64 28 Z" />
        {/* Boutons rivets */}
        <circle fill={B} cx="36" cy="22" r="1" />
        <circle fill={B} cx="64" cy="22" r="1" />
      </Frame>;

    case "shorts":
      return <Frame size={size}>
        <path fill={F} d="M30 30 L70 30 L72 38 L68 64 L54 64 L52 46 L48 46 L46 64 L32 64 L28 38 Z" />
        <path fill={B} d="M30 34 L70 34 L70 36 L30 36 Z" />
        <line x1="50" y1="36" x2="50" y2="46" stroke={B} strokeWidth="1" />
      </Frame>;

    case "joggers":
      return <Frame size={size}>
        <path fill={F} d="M32 20 L68 20 L70 30 Q68 60 64 88 L54 88 L52 42 L48 42 L46 88 L36 88 Q32 60 30 30 Z" />
        <path fill={B} d="M32 24 L68 24 L68 28 L32 28 Z" />
        <line x1="50" y1="28" x2="50" y2="42" stroke={B} strokeWidth="1" />
        <path fill={B} d="M44 24 L46 28 L48 24 Z" />
        <path fill={B} d="M52 24 L54 28 L56 24 Z" />
      </Frame>;

    case "skirt":
      return <Frame size={size}>
        <path fill={F} d="M34 20 L66 20 L78 78 L22 78 Z" />
        <path fill={B} d="M34 24 L66 24 L66 26 L34 26 Z" />
      </Frame>;

    case "dress":
      return <Frame size={size}>
        <path fill={F} d="M34 14 L66 14 L70 28 L74 86 L26 86 L30 28 Z" />
        <path fill={B} d="M34 16 Q50 22 66 16 L64 22 Q50 26 36 22 Z" />
        <line x1="50" y1="28" x2="50" y2="42" stroke={B} strokeWidth="0.8" />
      </Frame>;

    /* ═══ VESTES ═══ */

    case "blazer":
      return <Frame size={size}>
        <path fill={F} d="M24 22 L40 14 L46 30 L46 86 L24 86 L20 38 L16 28 Z" />
        <path fill={F} d="M54 30 L60 14 L76 22 L84 28 L80 38 L76 86 L54 86 Z" />
        <path fill={B} d="M46 30 L50 36 L54 30 L54 86 L46 86 Z" />
        <path fill={B} d="M40 14 L46 30 L44 32 Z" />
        <path fill={B} d="M60 14 L54 30 L56 32 Z" />
        <circle fill={B} cx="46" cy="50" r="1.4" />
        <circle fill={B} cx="46" cy="62" r="1.4" />
        <line x1="32" y1="58" x2="38" y2="58" stroke={B} strokeWidth="1" />
      </Frame>;

    case "jacket":
      return <Frame size={size}>
        <path fill={F} d="M26 22 L40 16 L42 26 L42 86 L24 86 L20 38 L16 30 Z" />
        <path fill={F} d="M58 26 L60 16 L74 22 L84 30 L80 38 L76 86 L58 86 Z" />
        <path fill={B} d="M42 26 L46 30 L50 28 L54 30 L58 26 L58 86 L50 86 L42 86 Z" />
        <line x1="50" y1="30" x2="50" y2="86" stroke={B} strokeWidth="0.8" />
        {/* Détails zip */}
        <circle fill={B} cx="50" cy="40" r="0.8" />
        <circle fill={B} cx="50" cy="52" r="0.8" />
        <circle fill={B} cx="50" cy="64" r="0.8" />
        <circle fill={B} cx="50" cy="76" r="0.8" />
      </Frame>;

    case "coat":
    case "trench":
      return <Frame size={size}>
        <path fill={F} d="M26 20 L40 14 L46 28 L46 92 L24 92 L20 38 L16 28 Z" />
        <path fill={F} d="M54 28 L60 14 L74 20 L84 28 L80 38 L76 92 L54 92 Z" />
        <path fill={B} d="M46 28 L50 34 L54 28 L54 92 L46 92 Z" />
        <path fill={B} d="M40 14 L46 28 L44 30 Z" />
        <path fill={B} d="M60 14 L54 28 L56 30 Z" />
        <line x1="32" y1="60" x2="68" y2="60" stroke={B} strokeWidth="1" />
        <circle fill={B} cx="40" cy="50" r="1.4" />
        <circle fill={B} cx="40" cy="70" r="1.4" />
        <circle fill={B} cx="60" cy="50" r="1.4" />
        <circle fill={B} cx="60" cy="70" r="1.4" />
      </Frame>;

    case "leather-jacket":
      return <Frame size={size}>
        <path fill={F} d="M26 22 L40 14 L48 28 L48 88 L24 88 L20 38 L16 30 Z" />
        <path fill={F} d="M52 28 L60 14 L74 22 L84 30 L80 38 L76 88 L52 88 Z" />
        <path fill={B} d="M48 28 L50 34 L52 28 L52 88 L48 88 Z" />
        <path fill={B} d="M40 14 L48 28 L44 30 Z" />
        <path fill={B} d="M60 14 L52 28 L56 30 Z" />
        <line x1="48" y1="40" x2="40" y2="46" stroke={B} strokeWidth="1.2" />
        <line x1="52" y1="40" x2="60" y2="46" stroke={B} strokeWidth="1.2" />
      </Frame>;

    case "denim-jacket":
      return <Frame size={size}>
        <path fill={F} d="M26 22 L40 16 L44 28 L44 86 L24 86 L20 38 L16 30 Z" />
        <path fill={F} d="M56 28 L60 16 L74 22 L84 30 L80 38 L76 86 L56 86 Z" />
        <path fill={B} d="M44 28 L50 32 L56 28 L56 86 L44 86 Z" />
        <line x1="50" y1="32" x2="50" y2="86" stroke={B} strokeWidth="0.8" />
        <path fill={B} d="M30 40 L34 40 L34 48 L30 48 Z" />
        <path fill={B} d="M66 40 L70 40 L70 48 L66 48 Z" />
        <circle fill={B} cx="50" cy="42" r="1" />
        <circle fill={B} cx="50" cy="54" r="1" />
        <circle fill={B} cx="50" cy="66" r="1" />
      </Frame>;

    /* ═══ CHAUSSURES ═══ */

    case "sneaker":
      // Sneaker profil de côté — talon haut à droite, toe-box bas à gauche, semelle épaisse
      return <Frame size={size}>
        {/* Semelle épaisse dominante */}
        <path fill={F} d="M6 76 L94 76 L94 86 L6 86 Z" />
        {/* Corps : courbe basse (toe) qui monte vers le talon */}
        <path fill={F} d="M6 76 Q6 56 22 50 L40 44 Q50 40 58 46 L78 56 Q94 62 94 76 Z" />
        {/* Cutout langue + zone lacets */}
        <path fill={B} d="M42 46 L60 52 L60 66 L48 68 Q42 60 42 50 Z" />
        {/* 3 lacets visibles */}
        <line x1="44" y1="54" x2="58" y2="56" stroke={F} strokeWidth="2.5" />
        <line x1="44" y1="60" x2="58" y2="62" stroke={F} strokeWidth="2.5" />
        <line x1="44" y1="66" x2="56" y2="68" stroke={F} strokeWidth="2.5" />
        {/* Tirette du talon */}
        <path fill={B} d="M82 58 L90 60 L90 70 L82 68 Z" />
        {/* Ligne de la semelle (sépare upper / sole) */}
        <line x1="6" y1="78" x2="94" y2="78" stroke={B} strokeWidth="1.5" />
      </Frame>;

    case "boot":
    case "ankle-boot":
      return <Frame size={size}>
        <path fill={F} d="M30 30 L54 30 L54 60 L82 60 Q86 60 86 64 L86 74 L24 74 L24 64 Q24 60 28 60 L30 60 Z" />
        <path fill={B} d="M24 70 L86 70 L86 72 L24 72 Z" />
        <line x1="40" y1="38" x2="40" y2="52" stroke={B} strokeWidth="1" />
      </Frame>;

    case "loafer":
      return <Frame size={size}>
        <path fill={F} d="M16 58 Q16 52 24 50 L48 48 Q60 48 72 54 L82 60 Q86 62 86 68 L86 72 L16 72 Z" />
        <path fill={B} d="M16 68 L86 68 L86 70 L16 70 Z" />
        <path fill={B} d="M44 54 L56 54 L56 56 L44 56 Z" />
      </Frame>;

    case "sandal":
      return <Frame size={size}>
        <path fill={F} d="M22 62 Q22 58 26 58 L74 58 Q78 58 78 62 L78 70 L22 70 Z" />
        <line x1="40" y1="50" x2="50" y2="62" stroke={F} strokeWidth="4" strokeLinecap="round" />
        <line x1="60" y1="50" x2="50" y2="62" stroke={F} strokeWidth="4" strokeLinecap="round" />
      </Frame>;

    case "flipflop":
      return <Frame size={size}>
        <path fill={F} d="M28 62 Q28 56 36 54 L66 54 Q72 54 72 62 L72 68 L28 68 Z" />
        <line x1="50" y1="44" x2="44" y2="60" stroke={F} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="44" x2="56" y2="60" stroke={F} strokeWidth="3" strokeLinecap="round" />
      </Frame>;

    case "heel":
    case "pump":
      return <Frame size={size}>
        <path fill={F} d="M18 60 Q22 50 36 48 L60 46 Q72 46 78 52 L82 60 L82 66 L18 66 Z" />
        <path fill={F} d="M72 60 L76 66 L76 80 L72 82 L70 80 L70 66 Z" />
        <path fill={B} d="M18 64 L82 64 L82 66 L18 66 Z" />
      </Frame>;

    /* ═══ ACCESSOIRES ═══ */

    case "cap":
    case "hat":
      return <Frame size={size}>
        <path fill={F} d="M20 60 Q20 36 50 32 Q80 36 80 60 L80 64 L20 64 Z" />
        <path fill={F} d="M80 60 L92 64 L92 68 L80 66 Z" />
        <path fill={B} d="M20 58 L80 58 L80 60 L20 60 Z" />
      </Frame>;

    case "watch":
      return <Frame size={size}>
        <circle fill={F} cx="50" cy="50" r="22" />
        <circle fill={B} cx="50" cy="50" r="16" />
        <circle fill={F} cx="50" cy="50" r="13" />
        <line x1="50" y1="50" x2="50" y2="40" stroke={B} strokeWidth="1.5" />
        <line x1="50" y1="50" x2="58" y2="50" stroke={B} strokeWidth="1.5" />
        <rect fill={F} x="44" y="18" width="12" height="12" />
        <rect fill={F} x="44" y="70" width="12" height="12" />
      </Frame>;

    case "glasses":
      return <Frame size={size}>
        <circle fill="none" stroke={F} strokeWidth="3.5" cx="32" cy="52" r="14" />
        <circle fill="none" stroke={F} strokeWidth="3.5" cx="68" cy="52" r="14" />
        <line x1="46" y1="52" x2="54" y2="52" stroke={F} strokeWidth="3.5" />
      </Frame>;

    case "belt":
      return <Frame size={size}>
        <rect fill={F} x="10" y="46" width="80" height="10" />
        <rect fill={F} x="40" y="42" width="20" height="18" />
        <rect fill={B} x="44" y="46" width="12" height="10" />
        <rect fill={B} x="48" y="44" width="4" height="14" />
      </Frame>;

    case "bag":
    case "tote":
      // Tote bag — 2 anses arquées séparées + corps trapézoïdal légèrement évasé
      return <Frame size={size}>
        {/* Anse gauche */}
        <path fill="none" stroke={F} strokeWidth="3.5" d="M28 38 Q28 14 38 14 Q48 14 48 38" />
        {/* Anse droite */}
        <path fill="none" stroke={F} strokeWidth="3.5" d="M52 38 Q52 14 62 14 Q72 14 72 38" />
        {/* Corps du sac — rectangle légèrement évasé vers le bas */}
        <path fill={F} d="M18 36 L82 36 L80 88 L20 88 Z" />
        {/* Couture haute du sac */}
        <line x1="22" y1="42" x2="78" y2="42" stroke={B} strokeWidth="1.5" />
      </Frame>;

    case "scarf":
    case "foulard":
      return <Frame size={size}>
        <path fill={F} d="M30 22 L70 22 Q72 30 70 38 L46 38 L42 84 L52 84 L56 38 L70 38 Q72 50 70 60 L40 60 L36 84 L46 84" />
      </Frame>;

    case "tie":
      return <Frame size={size}>
        <path fill={F} d="M44 18 L56 18 L54 30 L60 76 L50 86 L40 76 L46 30 Z" />
        <path fill={B} d="M44 18 L56 18 L56 22 L44 22 Z" />
      </Frame>;

    case "underwear":
    case "brief":
      return <Frame size={size}>
        <path fill={F} d="M22 44 L78 44 L74 60 Q66 70 50 66 Q34 70 26 60 Z" />
      </Frame>;

    /* ═══ BIJOUX ═══ */

    case "earring":
    case "earrings":
      return <Frame size={size}>
        {/* 2 boucles d'oreilles symétriques : crochet + pendentif goutte */}
        <path d="M34 30 Q34 24 38 22 Q42 24 42 30 L42 36" stroke={F} strokeWidth="2" fill="none" />
        <circle fill={F} cx="38" cy="48" r="6" />
        <path stroke={F} strokeWidth="2" d="M58 30 Q58 24 62 22 Q66 24 66 30 L66 36" fill="none" />
        <circle fill={F} cx="62" cy="48" r="6" />
      </Frame>;

    case "necklace":
      return <Frame size={size}>
        {/* Chaîne en arc + pendentif central */}
        <path fill="none" stroke={F} strokeWidth="3" d="M22 26 Q50 70 78 26" strokeLinecap="round" />
        <circle fill={F} cx="50" cy="62" r="6" />
      </Frame>;

    case "ring":
      return <Frame size={size}>
        {/* Anneau avec pierre */}
        <circle fill="none" stroke={F} strokeWidth="5" cx="50" cy="58" r="20" />
        <path fill={F} d="M44 26 L56 26 L60 38 L50 44 L40 38 Z" />
      </Frame>;

    case "bracelet":
      return <Frame size={size}>
        {/* Bracelet ovale + breloque */}
        <ellipse fill="none" stroke={F} strokeWidth="4" cx="50" cy="50" rx="28" ry="18" />
        <circle fill={F} cx="50" cy="32" r="4" />
      </Frame>;

    case "cufflinks":
      return <Frame size={size}>
        {/* 2 boutons de manchette */}
        <circle fill={F} cx="32" cy="50" r="10" />
        <circle fill={B} cx="32" cy="50" r="4" />
        <circle fill={F} cx="68" cy="50" r="10" />
        <circle fill={B} cx="68" cy="50" r="4" />
        <line x1="42" y1="50" x2="58" y2="50" stroke={F} strokeWidth="2" />
      </Frame>;

    /* ═══ VESTES / MANTEAUX (variantes additionnelles) ═══ */

    case "peacoat":
      return <Frame size={size}>
        <path fill={F} d="M26 20 L40 14 L44 28 L44 90 L24 90 L20 38 L16 28 Z" />
        <path fill={F} d="M56 28 L60 14 L74 20 L84 28 L80 38 L76 90 L56 90 Z" />
        <path fill={B} d="M44 28 L50 34 L56 28 L56 90 L44 90 Z" />
        {/* Double rangée boutons */}
        <circle fill={B} cx="42" cy="44" r="1.6" />
        <circle fill={B} cx="42" cy="58" r="1.6" />
        <circle fill={B} cx="42" cy="72" r="1.6" />
        <circle fill={B} cx="58" cy="44" r="1.6" />
        <circle fill={B} cx="58" cy="58" r="1.6" />
        <circle fill={B} cx="58" cy="72" r="1.6" />
      </Frame>;

    case "puffer":
      return <Frame size={size}>
        <path fill={F} d="M24 22 L40 16 L44 28 L44 88 L22 88 L18 38 L14 28 Z" />
        <path fill={F} d="M56 28 L60 16 L76 22 L86 28 L82 38 L78 88 L56 88 Z" />
        <path fill={B} d="M44 28 L50 32 L56 28 L56 88 L44 88 Z" />
        {/* Lignes horizontales pour le matelassage */}
        <line x1="22" y1="40" x2="78" y2="40" stroke={B} strokeWidth="1.2" />
        <line x1="22" y1="52" x2="78" y2="52" stroke={B} strokeWidth="1.2" />
        <line x1="22" y1="64" x2="78" y2="64" stroke={B} strokeWidth="1.2" />
        <line x1="22" y1="76" x2="78" y2="76" stroke={B} strokeWidth="1.2" />
      </Frame>;

    case "teddy":
      return <Frame size={size}>
        <path fill={F} d="M26 22 L40 14 L44 26 L44 88 L24 88 L20 38 L16 28 Z" />
        <path fill={F} d="M56 26 L60 14 L74 22 L84 28 L80 38 L76 88 L56 88 Z" />
        <path fill={B} d="M44 26 L50 30 L56 26 L56 88 L44 88 Z" />
        {/* Bordure varsity en bas */}
        <rect fill={B} x="22" y="80" width="56" height="3" />
        {/* Bordure des manches */}
        <rect fill={B} x="16" y="34" width="8" height="3" />
        <rect fill={B} x="76" y="34" width="8" height="3" />
      </Frame>;

    case "chorecoat":
      return <Frame size={size}>
        <path fill={F} d="M26 20 L40 14 L46 28 L46 88 L24 88 L20 38 L16 28 Z" />
        <path fill={F} d="M54 28 L60 14 L74 20 L84 28 L80 38 L76 88 L54 88 Z" />
        <path fill={B} d="M46 28 L50 32 L54 28 L54 88 L46 88 Z" />
        {/* 4 poches plaquées (chore coat signature) */}
        <rect fill={B} x="30" y="40" width="12" height="14" />
        <rect fill={B} x="58" y="40" width="12" height="14" />
        <rect fill={B} x="30" y="62" width="12" height="16" />
        <rect fill={B} x="58" y="62" width="12" height="16" />
      </Frame>;

    case "kimono":
      return <Frame size={size}>
        {/* Manches larges + corps droit + col en V profond */}
        <path fill={F} d="M14 24 L26 22 L26 50 L22 92 L34 92 L36 46 L48 30 L48 92 L52 92 L52 30 L64 46 L66 92 L78 92 L74 50 L74 22 L86 24 L88 32 L78 36 L78 88 L22 88 L22 36 L12 32 Z" />
        <path fill={B} d="M48 30 L50 36 L52 30 L52 92 L48 92 Z" />
      </Frame>;

    /* ═══ HAUTS (variantes additionnelles) ═══ */

    case "henley":
      return <Frame size={size}>
        <path fill={F} d="M28 22 L40 16 Q50 22 50 22 Q50 22 60 16 L72 22 L84 30 L78 42 L72 38 L72 86 L28 86 L28 38 L22 42 L16 30 Z" />
        <line x1="50" y1="22" x2="50" y2="48" stroke={B} strokeWidth="1.5" />
        <circle fill={B} cx="50" cy="30" r="1.4" />
        <circle fill={B} cx="50" cy="38" r="1.4" />
        <circle fill={B} cx="50" cy="46" r="1.4" />
      </Frame>;

    case "blouse":
      return <Frame size={size}>
        <path fill={F} d="M30 24 L40 14 L46 24 Q50 28 54 24 L60 14 L70 24 L78 32 L72 88 L28 88 L22 32 Z" />
        {/* Volants au col */}
        <path fill={B} d="M40 24 Q46 30 50 28 Q54 30 60 24 Q56 32 50 32 Q44 32 40 24 Z" />
        <path d="M50 32 L50 88" strokeWidth="0.8" stroke={B} fill="none" />
      </Frame>;

    /* ═══ BAS (variantes additionnelles) ═══ */

    case "leggings":
      return <Frame size={size}>
        {/* Pantalon moulant, très ajusté */}
        <path fill={F} d="M36 18 L64 18 L64 28 L60 90 L54 90 L52 38 L48 38 L46 90 L40 90 L36 28 Z" />
        <path fill={B} d="M36 22 L64 22 L64 24 L36 24 Z" />
      </Frame>;

    case "skirt-pleated":
      return <Frame size={size}>
        <path fill={F} d="M34 20 L66 20 L78 78 L22 78 Z" />
        {/* Plis verticaux */}
        <line x1="36" y1="26" x2="32" y2="76" stroke={B} strokeWidth="0.8" />
        <line x1="42" y1="26" x2="40" y2="76" stroke={B} strokeWidth="0.8" />
        <line x1="50" y1="26" x2="50" y2="76" stroke={B} strokeWidth="0.8" />
        <line x1="58" y1="26" x2="60" y2="76" stroke={B} strokeWidth="0.8" />
        <line x1="64" y1="26" x2="68" y2="76" stroke={B} strokeWidth="0.8" />
      </Frame>;

    case "skirt-mini":
    case "skirt-midi":
      // Pour mini et midi on utilise la jupe standard
      return <Frame size={size}>
        <path fill={F} d="M34 20 L66 20 L78 78 L22 78 Z" />
        <path fill={B} d="M34 24 L66 24 L66 26 L34 26 Z" />
      </Frame>;

    /* ═══ ROBES (variantes additionnelles) ═══ */

    case "dress-mini":
    case "dress-midi":
    case "dress-maxi":
    case "wrap-dress":
    case "shirt-dress":
      // Toutes les robes utilisent l'icône dress par défaut
      return <Frame size={size}>
        <path fill={F} d="M34 14 L66 14 L70 28 L74 86 L26 86 L30 28 Z" />
        <path fill={B} d="M34 16 Q50 22 66 16 L64 22 Q50 26 36 22 Z" />
        <line x1="50" y1="28" x2="50" y2="42" stroke={B} strokeWidth="0.8" />
      </Frame>;

    /* ═══ CHAUSSURES (variantes additionnelles) ═══ */

    case "sneaker-chunky":
      return <Frame size={size}>
        {/* Plus volumineuse que sneaker classique */}
        <path fill={F} d="M12 50 Q12 44 22 42 L40 40 Q52 40 62 46 L80 52 Q88 54 88 62 L88 72 L12 72 Z" />
        <rect fill={B} x="12" y="66" width="76" height="6" />
        <line x1="32" y1="48" x2="40" y2="56" stroke={B} strokeWidth="1.5" />
        <line x1="44" y1="46" x2="52" y2="56" stroke={B} strokeWidth="1.5" />
        <line x1="56" y1="46" x2="64" y2="56" stroke={B} strokeWidth="1.5" />
      </Frame>;

    case "chelsea-boot":
      return <Frame size={size}>
        {/* Bottine avec élastique latéral signature */}
        <path fill={F} d="M30 30 L52 30 L52 60 L80 60 Q86 60 86 66 L86 76 L24 76 L24 66 Q24 60 30 60 Z" />
        <rect fill={B} x="36" y="40" width="10" height="20" />
        <path fill={B} d="M24 72 L86 72 L86 74 L24 74 Z" />
      </Frame>;

    case "oxford":
      return <Frame size={size}>
        {/* Chaussure habillée classique avec laces */}
        <path fill={F} d="M16 56 Q16 50 24 48 L48 46 Q60 46 72 52 L82 58 Q86 60 86 66 L86 70 L16 70 Z" />
        <path fill={B} d="M16 66 L86 66 L86 68 L16 68 Z" />
        {/* Laces */}
        <line x1="40" y1="50" x2="48" y2="56" stroke={B} strokeWidth="1" />
        <line x1="44" y1="50" x2="52" y2="56" stroke={B} strokeWidth="1" />
        <line x1="48" y1="50" x2="56" y2="56" stroke={B} strokeWidth="1" />
      </Frame>;

    case "ballet":
    case "mule":
      // Chaussure plate type ballerine ou mule
      return <Frame size={size}>
        <path fill={F} d="M18 60 Q24 50 38 48 L60 46 Q72 46 78 52 L82 60 L82 66 L18 66 Z" />
        <path fill={B} d="M18 64 L82 64 L82 66 L18 66 Z" />
      </Frame>;

    case "espadrille":
      return <Frame size={size}>
        {/* Forme + semelle corde */}
        <path fill={F} d="M22 56 Q22 50 32 48 L58 46 Q70 46 76 52 L80 58 L80 62 L22 62 Z" />
        {/* Semelle corde = lignes diagonales */}
        <path fill={B} d="M22 60 L80 60 L80 70 L22 70 Z" />
        <line x1="26" y1="62" x2="34" y2="70" stroke={F} strokeWidth="0.8" />
        <line x1="34" y1="62" x2="42" y2="70" stroke={F} strokeWidth="0.8" />
        <line x1="42" y1="62" x2="50" y2="70" stroke={F} strokeWidth="0.8" />
        <line x1="50" y1="62" x2="58" y2="70" stroke={F} strokeWidth="0.8" />
        <line x1="58" y1="62" x2="66" y2="70" stroke={F} strokeWidth="0.8" />
        <line x1="66" y1="62" x2="74" y2="70" stroke={F} strokeWidth="0.8" />
      </Frame>;

    case "geta":
      // Sandale japonaise traditionnelle
      return <Frame size={size}>
        <rect fill={F} x="22" y="50" width="56" height="10" rx="2" />
        {/* 2 supports en bois */}
        <rect fill={F} x="28" y="60" width="6" height="14" />
        <rect fill={F} x="66" y="60" width="6" height="14" />
        {/* Lanières */}
        <line x1="50" y1="38" x2="38" y2="50" stroke={F} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="38" x2="62" y2="50" stroke={F} strokeWidth="3" strokeLinecap="round" />
      </Frame>;

    /* ═══ SACS (variantes additionnelles) ═══ */

    case "bucket":
      // Sac seau
      return <Frame size={size}>
        <path fill={F} d="M28 40 L72 40 L74 84 L26 84 Z" />
        <path fill="none" stroke={F} strokeWidth="3" d="M36 40 Q36 26 50 26 Q64 26 64 40" />
        <line x1="28" y1="48" x2="72" y2="48" stroke={B} strokeWidth="1" />
      </Frame>;

    case "crossbody":
      // Sac bandoulière (forme rectangulaire + sangle longue)
      return <Frame size={size}>
        <path fill="none" stroke={F} strokeWidth="2.5" d="M22 24 L48 56 L78 24" />
        <rect fill={F} x="28" y="50" width="44" height="32" rx="3" />
        <rect fill={B} x="32" y="56" width="36" height="3" />
      </Frame>;

    case "clutch":
      // Pochette rectangulaire allongée
      return <Frame size={size}>
        <rect fill={F} x="14" y="42" width="72" height="20" rx="2" />
        <circle fill={B} cx="50" cy="52" r="2" />
      </Frame>;

    case "backpack":
      // Sac à dos
      return <Frame size={size}>
        <path fill={F} d="M30 30 L70 30 Q76 30 76 38 L78 80 Q78 86 72 86 L28 86 Q22 86 22 80 L24 38 Q24 30 30 30 Z" />
        <path fill="none" stroke={F} strokeWidth="2.5" d="M34 30 Q34 20 42 20 L58 20 Q66 20 66 30" />
        <rect fill={B} x="36" y="50" width="28" height="22" rx="2" />
      </Frame>;

    case "pouch":
      // Banane / pochette
      return <Frame size={size}>
        <path fill={F} d="M16 50 Q16 42 26 42 L74 42 Q84 42 84 50 L84 64 Q84 70 78 70 L22 70 Q16 70 16 64 Z" />
        <line x1="20" y1="56" x2="80" y2="56" stroke={B} strokeWidth="1.2" />
      </Frame>;

    /* ═══ ACCESSOIRES (variantes additionnelles) ═══ */

    case "sunglasses":
      // Lunettes de soleil = verres pleins (pas just contour)
      return <Frame size={size}>
        <circle fill={F} cx="32" cy="52" r="14" />
        <circle fill={F} cx="68" cy="52" r="14" />
        <line x1="46" y1="52" x2="54" y2="52" stroke={F} strokeWidth="3.5" />
      </Frame>;

    case "beret":
      // Béret rond et plat
      return <Frame size={size}>
        <ellipse fill={F} cx="50" cy="46" rx="28" ry="14" />
        <circle fill={F} cx="64" cy="36" r="3" />
      </Frame>;

    case "beanie":
      // Bonnet
      return <Frame size={size}>
        <path fill={F} d="M28 56 Q28 32 50 30 Q72 32 72 56 L72 64 L28 64 Z" />
        <rect fill={B} x="28" y="56" width="44" height="3" />
      </Frame>;

    case "panama":
    case "fedora":
      // Chapeau classique avec bord large
      return <Frame size={size}>
        <ellipse fill={F} cx="50" cy="56" rx="36" ry="6" />
        <path fill={F} d="M34 32 Q34 22 50 22 Q66 22 66 32 L66 56 L34 56 Z" />
        <rect fill={B} x="34" y="42" width="32" height="3" />
      </Frame>;

    case "pocketsquare":
      // Pochette de costume — petit carré tissu plié
      return <Frame size={size}>
        <rect fill={F} x="28" y="36" width="44" height="28" rx="1" />
        <path fill={B} d="M28 36 L50 28 L72 36 Z" />
      </Frame>;

    case "umbrella":
      return <Frame size={size}>
        <path fill={F} d="M14 50 Q14 24 50 24 Q86 24 86 50 L78 48 L70 50 L62 48 L54 50 L46 48 L38 50 L30 48 L22 50 Z" />
        <line x1="50" y1="50" x2="50" y2="82" stroke={F} strokeWidth="3" />
        <path d="M44 82 Q44 88 50 88 Q56 88 56 82" stroke={F} strokeWidth="2" fill="none" />
      </Frame>;

    /* ═══ DÉFAUT ═══ */

    default:
      // Fallback : silhouette générique simple (carré arrondi)
      return <Frame size={size}>
        <rect fill={F} x="28" y="22" width="44" height="60" rx="4" />
      </Frame>;
  }
}
