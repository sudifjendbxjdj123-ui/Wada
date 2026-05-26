import Link from "next/link";
import { ink, paper, seal, border, sectionLabel } from "@/lib/styles";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";

/**
 * FinalCTA — bandeau final avant le mot personnel.
 *
 * Une seule action proposée : entrer dans le catalogue. Pas de menu,
 * pas de choix multiples — c'est l'invitation explicite à commencer.
 * Style éditorial sobre : titre Fraunces italique, sous-titre serif, un
 * bouton primaire avec flèche dessinée à la main et un lien secondaire
 * vers les cultures pour ceux qui hésitent encore.
 */
export default function FinalCTA() {
  return (
    <section
      style={{
        margin: "100px auto 40px",
        maxWidth: 880,
        padding: "72px 48px 80px",
        background: "rgba(255, 255, 255, 0.5)",
        border: `1px solid ${border}`,
        textAlign: "center",
      }}
      aria-label="Commencer à utiliser WADA"
    >
      <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>
        Le commencement
      </p>
      <h2
        className="wada-section-title"
        style={{
          fontSize: 52,
          fontStyle: "italic",
          fontWeight: 400,
          margin: "0 0 20px",
          fontFamily: "'Fredoka', sans-serif",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: ink,
        }}
      >
        Commencez à construire<br />votre style.
      </h2>
      <p
        style={{
          fontSize: 17,
          fontStyle: "italic",
          color: "var(--wada-text-secondary)",
          margin: "0 auto 40px",
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.7,
          maxWidth: 540,
        }}
      >
        Choisissez une palette, voyez la tenue, achetez sur la boutique qui
        vous ressemble. Trois minutes — pas plus.
      </p>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 28,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          href="/palettes"
          className="wada-lift-sm"
          style={{
            background: ink,
            color: paper,
            padding: "18px 36px",
            fontSize: 12,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          Voir les 348 tenues
          <HandArrow size={32} color={paper} />
        </Link>

        <Link
          href="/cultures"
          className="wada-lift-sm"
          style={{
            color: ink,
            fontSize: 11,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <SketchUnderline>Ou explorer par culture</SketchUnderline>
          <HandArrow size={28} />
        </Link>
      </div>
    </section>
  );
}
