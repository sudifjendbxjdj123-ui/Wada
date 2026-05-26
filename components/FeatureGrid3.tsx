import Link from "next/link";
import { ink, subtle, seal, border, textSecondary, sectionLabel } from "@/lib/styles";
import HandArrow from "@/components/HandArrow";

interface Feature {
  href: string;
  label: string;     // surtitre
  title: string;     // titre principal
  description: string;
  /** Lettre/glyphe pour l'icône — Sanzo Wada style (un caractère simple). */
  glyph: string;
}

const FEATURES: Feature[] = [
  {
    href: "/scanner",
    label: "01 · L'œil",
    title: "Scanner intelligent",
    description:
      "Photographiez une couleur — un mur, un ciel, une fleur. Wada retrouve les palettes du dictionnaire qui s'en approchent.",
    glyph: "◐",
  },
  {
    href: "/stylist",
    label: "02 · La parole",
    title: "Suggestions sans effort",
    description:
      "Décrivez l'occasion en quelques mots — un mariage en juin, un voyage à Tokyo. Wada propose les palettes qui résonnent.",
    glyph: "✎",
  },
  {
    href: "/favoris",
    label: "03 · La mémoire",
    title: "Garde-robe organisée",
    description:
      "Sauvegardez vos palettes, retrouvez votre garde-robe en un clic, suivez ce qui vous va vraiment.",
    glyph: "❒",
  },
];

/**
 * FeatureGrid3 — section "Ce que WADA fait" avec trois cartes capacités produit.
 *
 * Inspirée du pattern Relume / Figma SaaS-landing, traduite en DA WADA :
 * surtitre numéroté avec point médian (typographie Sanzo Wada), titre Fraunces
 * italique, description serif, glyphe unique en haut-gauche, flèche dessinée à
 * la main en pied. Pas d'icône SVG complexe — juste un caractère typographique
 * pour rester sobre.
 */
export default function FeatureGrid3() {
  return (
    <section
      style={{
        margin: "100px auto 80px",
        maxWidth: 1100,
        padding: "0 32px",
      }}
      aria-label="Capacités du produit"
    >
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ ...sectionLabel, color: seal, marginBottom: 14 }}>
          Ce que Wada fait
        </p>
        <h2
          className="wada-section-title"
          style={{
            fontSize: 38,
            fontStyle: "italic",
            fontWeight: 400,
            margin: 0,
            fontFamily: "'Fredoka', sans-serif",
            letterSpacing: "-0.015em",
          }}
        >
          Trois gestes, un même livre.
        </h2>
      </div>

      <div
        className="wada-feature-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
        }}
      >
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="wada-lift"
            style={{
              textDecoration: "none",
              color: ink,
              background: "rgba(255, 255, 255, 0.55)",
              border: `1px solid ${border}`,
              padding: "32px 28px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              minHeight: 280,
            }}
          >
            {/* Glyphe — gros caractère typographique en accent */}
            <span
              aria-hidden="true"
              style={{
                fontSize: 40,
                color: seal,
                fontFamily: "'Fredoka', sans-serif",
                lineHeight: 1,
                fontWeight: 400,
              }}
            >
              {f.glyph}
            </span>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: subtle,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {f.label}
              </p>
              <h3
                style={{
                  fontSize: 24,
                  fontStyle: "italic",
                  fontWeight: 400,
                  margin: 0,
                  fontFamily: "'Fredoka', sans-serif",
                  lineHeight: 1.15,
                  letterSpacing: "-0.005em",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: textSecondary,
                  fontStyle: "italic",
                  margin: 0,
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.6,
                }}
              >
                {f.description}
              </p>
            </div>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 10,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: ink,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                paddingTop: 12,
                borderTop: `1px solid ${border}`,
              }}
            >
              Essayer
              <HandArrow size={26} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
