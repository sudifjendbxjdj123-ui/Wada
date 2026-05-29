"use client";
import Link from "next/link";

/**
 * NextStepHint — repère discret « Ensuite : … » qui guide l'utilisateur
 * vers l'étape suivante du tunnel WADA.
 *
 * Brief « appli efficace » §6 (2026-05-29) : « le parcours cœur doit
 * être un flux, pas des pages isolées. À chaque étape, montrer ce qui
 * vient après. Le client doit sentir qu'il avance dans un tunnel clair. »
 *
 * Tunnel :
 *   Scan couleur → palettes assorties → tenue à acheter → favoris/scan
 *
 * Usage :
 *   <NextStepHint
 *     kicker="Ensuite"
 *     label="Choisir un look · Voir la tenue"
 *     href="/ma-tenue?palette=094"
 *   />
 *
 * Visuel : ligne centrée, fond translucide bordeaux, hover lift discret.
 * Volontairement DISCRET (pas un gros CTA) — c'est un panneau de
 * signalisation, pas l'action principale de la page.
 */

interface Props {
  kicker?: string;
  label: string;
  href: string;
}

export default function NextStepHint({
  kicker = "Ensuite",
  label,
  href,
}: Props) {
  return (
    <div
      className="wada-nextstep"
      style={{
        textAlign: "center",
        padding: "32px 22px 8px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Link
        href={href}
        className="wada-nextstep-link"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          borderRadius: 999,
          background: "rgba(107, 58, 50, 0.06)",
          border: "1px solid rgba(107, 58, 50, 0.16)",
          color: "#1E1E1E",
          textDecoration: "none",
          fontSize: 13,
          transition: "background 0.2s ease, transform 0.2s ease",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6B3A32",
          }}
        >
          {kicker}
        </span>
        <span aria-hidden style={{ color: "#6B3A32", opacity: 0.5 }}>·</span>
        <span style={{ fontWeight: 500, color: "#1E1E1E" }}>{label}</span>
        <span aria-hidden style={{ fontSize: 15, color: "#6B3A32" }}>→</span>
      </Link>
      <style jsx>{`
        :global(.wada-nextstep-link:hover) {
          background: rgba(107, 58, 50, 0.1) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
