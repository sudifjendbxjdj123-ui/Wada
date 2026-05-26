import { ink, subtle, seal, border, textSecondary, sectionLabel } from "@/lib/styles";

/**
 * Testimonials — section « Trois certitudes » sur la home.
 *
 * Refonte 2026-05-22 : remplace les anciennes citations Émilie/Marc/Léa
 * (qui pouvaient être perçues comme inventées) par TROIS FAITS RÉELS et
 * vérifiables sur WADA. On revient à de vrais témoignages clients quand
 * on en aura collecté (favoris, newsletter…).
 *
 * Trois colonnes : un chiffre éditorial + une phrase qui le contextualise.
 * Toujours en serif italique pour rester dans le ton éditorial du site.
 */

interface Fact {
  /** Chiffre ou label éditorial (« 348 », « 1933 »…). Grand caractère. */
  number: string;
  /** 2-3 mots qui complètent le chiffre. */
  unit: string;
  /** Phrase courte qui explique l'engagement. */
  text: string;
  /** Source / précision (en bas, petit caps). */
  source: string;
}

const FACTS: Fact[] = [
  {
    number: "348",
    unit: "palettes",
    text: "Les 348 accords chromatiques de Sanzo Wada — chacun pensé comme une silhouette portable, pas une simple combinaison de couleurs.",
    source: "Dictionnaire 1933",
  },
  {
    number: "64",
    unit: "marchands",
    text: "Recherche directe vers la fiche produit chez 64 marchands partenaires — sneakers, prêt-à-porter, luxe, seconde main, vintage.",
    source: "Liens deep-link Awin",
  },
  {
    number: "1933",
    unit: "héritage",
    text: "Le livre original de Sanzo Wada édité à Tokyo. Référence des coloristes mode et déco depuis quatre-vingts ans.",
    source: "A Dictionary of Color Combinations",
  },
];

export default function Testimonials() {
  return (
    <section
      style={{
        margin: "120px auto 100px",
        maxWidth: 1100,
        padding: "0 32px",
      }}
      aria-label="Trois faits sur WADA"
    >
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ ...sectionLabel, color: seal, marginBottom: 14 }}>
          Trois certitudes
        </p>
        <h2
          className="wada-section-title"
          style={{
            fontSize: 40,
            fontStyle: "italic",
            fontWeight: 400,
            margin: 0,
            fontFamily: "'Fredoka', sans-serif",
            letterSpacing: "-0.015em",
            color: ink,
          }}
        >
          Ce qui fait WADA.
        </h2>
      </div>

      <div
        className="wada-testimonials-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 28,
        }}
      >
        {FACTS.map((f, i) => (
          <article
            key={i}
            style={{
              padding: "36px 32px 32px",
              background: "rgba(255, 255, 255, 0.5)",
              border: `1px solid ${border}`,
              display: "flex",
              flexDirection: "column",
              gap: 22,
              minHeight: 260,
            }}
          >
            {/* Chiffre éditorial en gros caractère serif italique */}
            <div style={{ lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 64,
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: ink,
                  letterSpacing: "-0.02em",
                  display: "block",
                }}
              >
                {f.number}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: seal,
                  fontWeight: 600,
                  display: "block",
                  marginTop: 8,
                }}
              >
                {f.unit}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontStyle: "italic",
                lineHeight: 1.6,
                color: textSecondary,
                fontFamily: "'Inter', sans-serif",
                flex: 1,
              }}
            >
              {f.text}
            </p>

            <footer style={{ borderTop: `1px solid ${border}`, paddingTop: 16 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: subtle,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {f.source}
              </p>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
