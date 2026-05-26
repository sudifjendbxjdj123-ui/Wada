import { ink } from "@/lib/styles";

interface EditorialPosterProps {
  /** Titre principal en capitales (Fraunces). Ex : "WADA", "PRINTEMPS". */
  title?: string;
  /** Kanji en haut à gauche (sous-titre japonais). */
  topKanji?: string;
  /** Kanji en bas à droite (signature). */
  bottomKanji?: string;
  /** Petite légende sous le titre. */
  caption?: string;
}

/**
 * Planche éditoriale WADA — affiche vintage à la Sanzo Wada / Kinfolk.
 *
 * Cadre crème vieilli, titre serif en capitales (Fraunces), kanji en accent,
 * illustration SVG originale d'un saule pleureur avec branches retombantes.
 *
 * Toutes les illustrations sont des chemins SVG originaux dans la palette WADA
 * (sauge, olive, mousse, écorce). Aucun fichier image externe.
 */
export default function EditorialPoster({
  title = "WADA",
  topKanji = "和田",
  bottomKanji = "色彩",
  caption,
}: EditorialPosterProps) {
  // 80 branches retombantes générées de façon déterministe (pas aléatoire pour SSR-safe)
  const branches = Array.from({ length: 72 }, (_, i) => {
    const startX = 60 + i * 6.0; // étalé de x=60 à x=486
    const sway = Math.sin(i * 0.83) * 14; // légère sinusoïde
    const length = 130 + (Math.sin(i * 1.7) + Math.cos(i * 0.5)) * 60;
    const endY = 250 + length;
    return {
      d: `M ${startX} 230 Q ${startX + sway * 0.4} 320, ${startX + sway} ${endY}`,
      opacity: 0.45 + Math.abs(Math.sin(i * 0.7)) * 0.4,
    };
  });

  return (
    <article
      className="wada-poster"
      style={{
        position: "relative",
        background: "#EDE5D2",
        boxShadow:
          "inset 0 0 60px rgba(120, 95, 60, 0.12), 0 1px 2px rgba(31, 27, 22, 0.06)",
        padding: 0,
        margin: "0 auto",
        maxWidth: 480,
        width: "100%",
        aspectRatio: "2 / 3",
        overflow: "hidden",
      }}
    >
      {/* Cadre intérieur fin (référence à l'imprimé éditorial) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 14,
          border: "1px solid rgba(31, 27, 22, 0.22)",
          pointerEvents: "none",
        }}
      />

      {/* Titre + kanji haut */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 32,
          right: 32,
          display: "flex",
          alignItems: "flex-start",
          gap: 18,
          zIndex: 2,
        }}
      >
        <span
          className="wada-jp"
          style={{
            fontSize: 14,
            color: ink,
            fontWeight: 600,
            lineHeight: 1.3,
            paddingTop: 14,
            letterSpacing: "0.04em",
          }}
        >
          {topKanji}
        </span>
        <h2
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: "clamp(44px, 9vw, 72px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            margin: 0,
            color: ink,
            lineHeight: 0.9,
            flex: 1,
            textAlign: "left",
          }}
        >
          {title}
        </h2>
      </div>

      {/* Saule pleureur — illustration SVG originale */}
      <svg
        viewBox="0 0 500 700"
        preserveAspectRatio="xMidYMid meet"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
        aria-hidden="true"
      >
        {/* Tronc — silhouette organique */}
        <path
          d="M 244 690
             Q 244 540, 248 410
             Q 250 320, 246 240
             L 254 240
             Q 252 320, 254 410
             Q 256 540, 256 690 Z"
          fill="#5A3F26"
        />

        {/* Texture du tronc — stries verticales */}
        <path
          d="M 247 320 Q 252 420 248 560"
          stroke="#3A2615"
          strokeWidth="1"
          fill="none"
          opacity="0.55"
        />
        <path
          d="M 253 300 Q 247 420 254 580"
          stroke="#3A2615"
          strokeWidth="1"
          fill="none"
          opacity="0.45"
        />
        <path
          d="M 250 350 Q 250 440 252 520"
          stroke="#3A2615"
          strokeWidth="0.6"
          fill="none"
          opacity="0.35"
        />

        {/* Couronne de feuillage — masses superposées */}
        <ellipse cx="250" cy="195" rx="230" ry="100" fill="#3E5234" opacity="0.45" />
        <ellipse cx="245" cy="215" rx="210" ry="85" fill="#56714B" opacity="0.55" />
        <ellipse cx="255" cy="235" rx="190" ry="70" fill="#7C9067" opacity="0.6" />

        {/* Branches retombantes du saule — courbes organiques */}
        <g
          stroke="#56714B"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        >
          {branches.map((b, i) => (
            <path key={i} d={b.d} opacity={b.opacity} />
          ))}
        </g>

        {/* Couches de feuilles claires sur les branches (touches lumineuses) */}
        <g fill="#A8BC92" opacity="0.55">
          {Array.from({ length: 35 }, (_, i) => {
            const x = 70 + i * 12.5;
            const y = 280 + Math.sin(i * 1.3) * 80 + 60;
            const r = 8 + Math.cos(i * 0.9) * 4;
            return <ellipse key={`l-${i}`} cx={x} cy={y} rx={r} ry={r * 0.5} />;
          })}
        </g>

        {/* Quelques feuilles plus sombres en avant-plan */}
        <g fill="#3E5234" opacity="0.65">
          {Array.from({ length: 22 }, (_, i) => {
            const x = 90 + i * 19;
            const y = 360 + Math.cos(i * 1.7) * 60;
            const r = 5 + Math.sin(i * 0.5) * 3;
            return <ellipse key={`d-${i}`} cx={x} cy={y} rx={r} ry={r * 0.45} />;
          })}
        </g>

        {/* Sol — ligne d'horizon discrète */}
        <path
          d="M 30 690 L 470 690"
          stroke="rgba(31, 27, 22, 0.18)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>

      {/* Caption sous le titre, optionnelle */}
      {caption && (
        <p
          style={{
            position: "absolute",
            bottom: 84,
            left: 32,
            right: 90,
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            fontStyle: "italic",
            fontSize: 13,
            color: "rgba(31, 27, 22, 0.7)",
            zIndex: 2,
            lineHeight: 1.5,
          }}
        >
          {caption}
        </p>
      )}

      {/* Kanji en bas à droite — signature */}
      <span
        className="wada-jp"
        style={{
          position: "absolute",
          bottom: 32,
          right: 36,
          fontSize: 44,
          color: ink,
          fontWeight: 700,
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        {bottomKanji}
      </span>
    </article>
  );
}
