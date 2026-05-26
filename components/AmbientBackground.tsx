"use client";

/**
 * AmbientBackground — couche atmosphérique fixe derrière toute l'app.
 *
 * Inspiration unique : pages du livre Sanzo Wada (1933). On laisse
 * dériver verticalement 8 swatches de palette à 3 couleurs — comme si
 * les pages du dictionnaire flottaient doucement derrière le contenu.
 *
 * Tout en CSS pur, opacity faible, pointer-events: none, z-index: 0.
 * Respecte prefers-reduced-motion (animations stoppées si demandé).
 */
export default function AmbientBackground() {
  const swatches: Swatch[] = [
    { left: "6%",  top: "8%",  delay: 0,    duration: 110, colors: ["#1B4A6B", "#6FA9C8", "#E8DFC8"] }, // KONSEI
    { left: "82%", top: "16%", delay: -25,  duration: 92,  colors: ["#A8B2BD", "#F4EFE6", "#5A7C8A"] }, // ASAGI
    { left: "12%", top: "62%", delay: -10,  duration: 75,  colors: ["#C44E3A", "#E8C9B5", "#9C3E2E"] }, // KARAKURENAI
    { left: "78%", top: "70%", delay: -45,  duration: 130, colors: ["#F2C49B", "#FFFFFF", "#C8A88C"] }, // USUTOMO
    { left: "44%", top: "30%", delay: -60,  duration: 100, colors: ["#9CAF88", "#E8C9C5", "#F4EFE0"] }, // Jardin
    { left: "30%", top: "88%", delay: -15,  duration: 88,  colors: ["#1F1B16", "#3A4555", "#D4A24E"] }, // Pluie de Tokyo
    { left: "92%", top: "44%", delay: -35,  duration: 120, colors: ["#F4EFE6", "#C8B187", "#3A6B7A"] }, // Riviera
    { left: "2%",  top: "38%", delay: -55,  duration: 105, colors: ["#5C2018", "#E8DFC8", "#3A3A3A"] }, // Bordeaux
  ];

  return (
    <div
      className="wada-ambient"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {swatches.map((s, i) => (
        <SwatchSpot key={`s-${i}`} {...s} />
      ))}
    </div>
  );
}

type Swatch = {
  left: string;
  top: string;
  delay: number;
  duration: number;
  colors: [string, string, string];
};

function SwatchSpot({ left, top, delay, duration, colors }: Swatch) {
  return (
    <div
      className="wada-ambient-swatch"
      style={{
        position: "absolute",
        left,
        top,
        width: 92,
        height: 22,
        display: "flex",
        opacity: 0.18,
        animation: `wada-drift-up ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        willChange: "transform, opacity",
        boxShadow: "0 2px 12px rgba(31, 27, 22, 0.06)",
      }}
    >
      {colors.map((c, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            background: c,
            border: "0.5px solid rgba(31, 27, 22, 0.18)",
          }}
        />
      ))}
    </div>
  );
}
