"use client";
import { ink, subtle, sectionLabel, seal } from "@/lib/styles";

/**
 * Pause — interlude contemplatif sur la home.
 *
 * Inspiré du rythme des apps de méditation et des sites éditoriaux silencieux
 * (SOM, 9to5studio, body-scan apps) : trois bandes de couleur qui respirent
 * lentement, en décalage, sous une prose courte. Pas de scroll, pas de CTA —
 * juste un moment de respiration entre deux sections plus denses.
 *
 * L'animation est gérée via la classe CSS `.wada-breathe` (keyframes dans
 * globals.css). Les délais d'animation décalent les trois bandes pour
 * créer une vague — comme une inspiration qui traverse la palette.
 */
export default function Pause() {
  const bands = [
    { color: "#5C2018", delay: "0s",   name: "bordeaux" },
    { color: "#5C5A3C", delay: "0.6s", name: "olive" },
    { color: "#1B4A6B", delay: "1.2s", name: "indigo" },
  ];

  return (
    <section
      aria-label="Une pause"
      style={{
        maxWidth: 720,
        margin: "120px auto",
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <p style={{ ...sectionLabel, color: subtle, marginBottom: 36 }}>
        Une pause
      </p>

      {/* Trois bandes verticales qui respirent — référence directe au logomark
          mais en grand format, animées. */}
      <div
        aria-hidden="true"
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          margin: "0 auto 48px",
          maxWidth: 280,
          height: 180,
        }}
      >
        {bands.map((b) => (
          <div
            key={b.name}
            className="wada-breathe"
            style={{
              flex: 1,
              background: b.color,
              animationDelay: b.delay,
              transformOrigin: "center",
            }}
          />
        ))}
      </div>

      <p
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontStyle: "italic",
          fontSize: 30,
          lineHeight: 1.5,
          color: ink,
          margin: 0,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        Trois couleurs.<br />
        Une intention.<br />
        Le temps de respirer.
      </p>

      <p
        style={{
          marginTop: 28,
          fontSize: 11,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: seal,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
        }}
      >
        Sanzo Wada · 1933
      </p>
    </section>
  );
}
