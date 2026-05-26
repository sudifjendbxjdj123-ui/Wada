import type { CSSProperties } from "react";

interface PageMarkProps {
  /** Numéro de page — chiffres arabes ou romains au choix. */
  num: string | number;
  /** Position au coin de la section. Défaut "tr" (top-right). */
  position?: "tl" | "tr" | "bl" | "br";
  /** Style additionnel (offset par exemple). */
  style?: CSSProperties;
}

const positions: Record<NonNullable<PageMarkProps["position"]>, CSSProperties> = {
  tl: { top: 0, left: 0 },
  tr: { top: 0, right: 0 },
  bl: { bottom: 0, left: 0 },
  br: { bottom: 0, right: 0 },
};

/**
 * PageMark — pagination discrète en coin de section, façon dictionnaire.
 *
 * Inspiration directe du livre de Sanzo Wada : les pages portent un numéro
 * en italique léger, dans la marge. Sur le site on rappelle ce détail pour
 * que chaque section soit "une page" du livre WADA. À utiliser avec parcimonie
 * — un par grande section, pas partout.
 *
 * À placer dans un parent en `position: relative`.
 *
 * @example
 * <section style={{ position: "relative" }}>
 *   <PageMark num="II" />
 *   …
 * </section>
 */
export default function PageMark({ num, position = "tr", style }: PageMarkProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        fontSize: 10,
        letterSpacing: "0.4em",
        textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif",
        color: "var(--wada-subtle)",
        opacity: 0.7,
        fontWeight: 600,
        ...positions[position],
        ...style,
      }}
    >
      p. {num}
    </span>
  );
}
