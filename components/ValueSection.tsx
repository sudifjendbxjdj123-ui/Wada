import type { ReactNode } from "react";
import { ink, subtle, seal, border, textSecondary, sectionLabel } from "@/lib/styles";

interface ValueSectionProps {
  /** Surtitre numéroté ou label de chapitre. */
  label: string;
  /** Titre principal de la section. */
  title: string;
  /** Texte de soutien (1-3 phrases). */
  description: string;
  /** Visuel à droite (ou à gauche si reverse). ReactNode pour intégrer SVG WADA. */
  visual: ReactNode;
  /** Inverser l'ordre : visuel à gauche, texte à droite. */
  reverse?: boolean;
  /** CTA optionnel — libellé + href. */
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * ValueSection — bloc value-prop alternant texte/visuel.
 *
 * Inspiré du pattern Figma SaaS-landing : grand titre, paragraphe court,
 * visuel WADA-native à côté (palette bands, avatar, shop chips — pas de
 * photos). Sur mobile, le visuel passe au-dessus du texte automatiquement.
 *
 * Les visuels sont passés en prop pour rester flexibles — on injecte
 * directement les composants WADA (OutfitAvatar, PaletteCard mini, etc.).
 */
export default function ValueSection({
  label,
  title,
  description,
  visual,
  reverse = false,
  ctaLabel,
  ctaHref,
}: ValueSectionProps) {
  return (
    <section
      className="wada-value-section"
      style={{
        margin: "80px auto",
        maxWidth: 1100,
        padding: "0 32px",
      }}
    >
      <div
        className="wada-value-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          alignItems: "center",
          direction: reverse ? "rtl" : "ltr",
        }}
      >
        {/* Texte */}
        <div style={{ direction: "ltr" }}>
          <p
            style={{
              ...sectionLabel,
              color: seal,
              marginBottom: 14,
            }}
          >
            {label}
          </p>
          <h2
            className="wada-section-title"
            style={{
              fontSize: 40,
              fontStyle: "italic",
              fontWeight: 400,
              margin: "0 0 22px",
              fontFamily: "'Fredoka', sans-serif",
              lineHeight: 1.08,
              letterSpacing: "-0.018em",
              color: ink,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 17,
              fontStyle: "italic",
              color: textSecondary,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 480,
            }}
          >
            {description}
          </p>
          {ctaLabel && ctaHref && (
            <a
              href={ctaHref}
              className="wada-lift-sm"
              style={{
                display: "inline-block",
                marginTop: 28,
                fontSize: 11,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: ink,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                textDecoration: "none",
                borderBottom: `1px solid ${ink}`,
                paddingBottom: 4,
              }}
            >
              {ctaLabel} →
            </a>
          )}
        </div>

        {/* Visuel WADA-native */}
        <div
          style={{
            direction: "ltr",
            background: "rgba(255, 255, 255, 0.5)",
            border: `1px solid ${border}`,
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          {visual}
        </div>
      </div>
    </section>
  );
}
