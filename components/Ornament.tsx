import type { CSSProperties } from "react";

interface OrnamentProps {
  /** Variante visuelle. Défaut "dots" (· · ·). */
  variant?: "dots" | "rule" | "double-rule";
  style?: CSSProperties;
}

/**
 * Ornament — séparateur de chapitre éditorial entre deux sections de la home.
 *
 * Trois variantes, toutes très légères pour ne jamais voler la vedette au
 * contenu : trois points centrés (le plus discret, défaut), un trait fin,
 * ou un double trait à l'ancienne. Inspiré des ornements de fin de chapitre
 * dans les livres reliés du XXᵉ siècle — l'œil se repose un instant avant
 * de tourner la page.
 *
 * À utiliser avec retenue : entre 2-3 sections sur une longue home, pas plus.
 */
export default function Ornament({ variant = "dots", style }: OrnamentProps) {
  const baseStyle: CSSProperties = {
    display: "block",
    margin: "60px auto",
    width: "100%",
    maxWidth: 320,
    color: "var(--wada-subtle)",
    textAlign: "center",
    ...style,
  };

  if (variant === "rule") {
    return (
      <hr
        aria-hidden="true"
        style={{
          ...baseStyle,
          height: 1,
          border: "none",
          background: "var(--wada-border)",
        }}
      />
    );
  }

  if (variant === "double-rule") {
    return (
      <div aria-hidden="true" style={baseStyle}>
        <div style={{ height: 1, background: "var(--wada-border)" }} />
        <div style={{ height: 1, background: "var(--wada-border)", marginTop: 4 }} />
      </div>
    );
  }

  // Trois points italiques — défaut, le plus discret
  return (
    <div
      aria-hidden="true"
      style={{
        ...baseStyle,
        fontFamily: "'Fredoka', sans-serif",
        fontStyle: "italic",
        fontSize: 24,
        letterSpacing: "0.6em",
        opacity: 0.5,
        userSelect: "none",
      }}
    >
      · · ·
    </div>
  );
}
