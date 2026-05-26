"use client";
import { useState } from "react";
import BackButton from "@/components/BackButton";

/* ──────────────────────────────────────────────────────────────────────
   Design tokens — refonte 2026-05-22 (maquette FAQ brief).
   Palette + Bagel Fat One/Fredoka pour les titres (cohérence sitewide).
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  body: "'Inter', sans-serif",
};
const SOFT = "0 8px 36px rgba(30,30,30,.06)";

const QUESTIONS: Array<{ q: string; a: string }> = [
  {
    q: "Comment fonctionne WADA ?",
    a: "WADA part d'une couleur : vous la scannez (un mur, un vêtement, une fleur) ou choisissez une palette parmi les 348 de Sanzo Wada. WADA compose alors une tenue qui s'accorde, chaque pièce achetable chez sa marque.",
  },
  {
    q: "Combien coûtent les vêtements ?",
    a: "WADA ne vend rien directement. Vous êtes redirigé vers les boutiques (COS, Sézane, Vinted, Net-a-Porter…) au prix de la marque. WADA touche une petite commission d'affiliation, sans surcoût pour vous.",
  },
  {
    q: "Faut-il un compte pour commencer ?",
    a: "Non. Vous explorez toutes les palettes et achetez sans inscription. Le compte sert uniquement à synchroniser vos favoris entre appareils et à accéder à WADA Premium.",
  },
  {
    q: "Qu'est-ce que WADA Premium ?",
    a: "Un abonnement (1,99 €/mois, ou 17,99 €/an) qui ajoute les looks du jour, les inspirations par culture, l'exploration par teinte et des recommandations personnalisées. Essai 7 jours sans carte, annulable en un clic.",
  },
  {
    q: "Mes photos sont-elles envoyées à WADA ?",
    a: "Non. Le scanner analyse la couleur directement dans votre navigateur ; la photo ne quitte pas votre appareil. Vos favoris restent aussi sur votre appareil tant que vous n'avez pas de compte.",
  },
  {
    q: "Le scanner couleur est-il vraiment illimité ?",
    a: "Oui, gratuit comme premium. C'est le cœur de l'outil ; il ne sera jamais bridé.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, à tout moment, sans justification. Vos données restent accessibles et vos favoris conservés.",
  },
  {
    q: "Pourquoi 348 palettes ?",
    a: "C'est le nombre exact d'accords chromatiques publiés par Sanzo Wada dans A Dictionary of Color Combinations en 1933. WADA reprend chacun et le traduit en tenue contemporaine.",
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.beige,
        color: palette.ink,
        fontFamily: fonts.sans,
        lineHeight: 1.6,
      }}
    >
            <BackButton />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* HEAD */}
        <header style={{ textAlign: "center", marginBottom: 34 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: palette.bordeaux,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Aide
          </p>
          <h1
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: "clamp(32px, 6vw, 42px)",
              lineHeight: 1.04,
              margin: "10px 0 4px",
              color: palette.ink,
            }}
          >
            Questions fréquentes
          </h1>
          <p style={{ color: palette.inkSoft, fontSize: 15, margin: 0 }}>
            Tout ce qu'il faut savoir sur WADA, en bref.
          </p>
        </header>

        {/* ACCORDION */}
        <div>
          {QUESTIONS.map((qa, i) => {
            const open = openIdx === i;
            return (
              <article
                key={i}
                style={{
                  background: palette.cream,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 14,
                  marginBottom: 12,
                  overflow: "hidden",
                  boxShadow: SOFT,
                  transition: "border-color .2s ease",
                }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                    padding: "18px 20px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: fonts.sans,
                    color: palette.ink,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: fonts.display,
                      fontWeight: 700,
                      fontSize: 16,
                      margin: 0,
                      lineHeight: 1.3,
                      color: palette.ink,
                    }}
                  >
                    {qa.q}
                  </h3>
                  <span
                    aria-hidden
                    style={{
                      fontSize: 20,
                      color: palette.olive,
                      transition: "transform .3s cubic-bezier(.22,1,.36,1)",
                      transform: open ? "rotate(45deg)" : "rotate(0)",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: open ? 500 : 0,
                    overflow: "hidden",
                    transition: "max-height .35s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <p
                    style={{
                      padding: "0 20px 18px",
                      fontSize: 14,
                      color: palette.inkSoft,
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {qa.a}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* CONTACT */}
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            fontSize: 14,
            color: palette.inkSoft,
          }}
        >
          Une autre question ?{" "}
          <a
            href="mailto:hello@wada.style"
            style={{ color: palette.bordeaux, textDecoration: "none" }}
          >
            Écrivez-nous
          </a>{" "}
          — hello@wada.style
        </div>
      </div>

          </main>
  );
}
