"use client";
import { useEffect, useState } from "react";
import { useProfile, type Genre, type Budget, type Style } from "@/hooks/useProfile";

/**
 * OnboardingOverlay — 3 questions au premier accès WADA.
 *
 * Brief 2026-05-29 « Onboarding + profil + switcher » : pour qui ?
 * budget ? style ? Stocké dans localStorage `wada.profile`.
 *
 * UX :
 *   - 3 questions, 10s max
 *   - Boutons grands chubby, 1 clic = sélection (pas de validation)
 *   - « Commencer » s'active seulement quand les 3 sont répondues
 *   - Lien discret « Passer pour cette fois » → défaut Femme · 150–400€ · Minimaliste
 *   - Disparaît avec transition douce
 *
 * Affichage :
 *   - Plein écran, fond crème, z-index 200 (au-dessus du Nav z=50 + drawer z=100)
 *   - S'affiche uniquement si profile === null ET hydrated === true
 *   - Bloque scroll body pendant l'affichage
 */

const GENRES: Genre[] = ["Femme", "Homme"];
const BUDGETS: Budget[] = ["< 150€", "150–400€", "Premium"];
const STYLES: Style[] = ["Minimaliste", "Classique", "Streetwear", "Décontracté"];

const BORDEAUX = "#6B3A32";
const BORDEAUX_DARK = "#5a3029";
const CREAM = "#FAF8F4";
const INK = "#1E1E1E";
const INK_SOFT = "#6a6259";
const LINE = "rgba(30,30,30,.10)";

export default function OnboardingOverlay() {
  const { profile, hydrated, save, skip } = useProfile();
  /* Sélections locales du flow (pas encore commit en localStorage). */
  const [genre, setGenre] = useState<Genre | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [closing, setClosing] = useState(false);

  const shouldShow = hydrated && profile === null;

  /* Bloque scroll body pendant l'affichage. */
  useEffect(() => {
    if (!shouldShow) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [shouldShow]);

  if (!shouldShow) return null;

  const allAnswered = genre !== null && budget !== null && style !== null;

  const commit = () => {
    if (!allAnswered) return;
    /* Transition douce 0.3s avant unmount. */
    setClosing(true);
    setTimeout(() => {
      save({ genre: genre!, budget: budget!, style: style! });
    }, 300);
  };

  const skipDefault = () => {
    setClosing(true);
    setTimeout(() => skip(), 300);
  };

  return (
    <div
      className="wada-onboarding"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wada-onboarding-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#F4EFE7",
        overflowY: "auto",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "max(60px, env(safe-area-inset-top, 0px) + 40px) 24px 60px",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700, fontSize: 28, letterSpacing: "0.02em",
            color: INK,
          }}>
            WADA<span style={{ marginLeft: 4, opacity: 0.55 }}>和田</span>
          </span>
        </div>

        {/* Titre */}
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: BORDEAUX, margin: "0 0 14px",
          }}>
            Bienvenue
          </p>
          <h1
            id="wada-onboarding-title"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700, fontSize: "clamp(28px, 5.4vw, 38px)",
              color: INK, letterSpacing: "-0.01em",
              margin: 0, lineHeight: 1.1,
            }}
          >
            3 questions pour vos tenues sur mesure.
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15, color: INK_SOFT,
            margin: "14px auto 0", maxWidth: 420,
            lineHeight: 1.55,
          }}>
            Pour qui composer, à quel budget, dans quel style. 10 secondes,
            modifiable à tout moment.
          </p>
        </div>

        {/* Question 1 — Genre */}
        <Question
          label="Pour qui ?"
          options={GENRES}
          value={genre}
          onChange={setGenre}
        />

        {/* Question 2 — Budget */}
        <Question
          label="Budget par tenue ?"
          options={BUDGETS}
          value={budget}
          onChange={setBudget}
        />

        {/* Question 3 — Style */}
        <Question
          label="Style ?"
          options={STYLES}
          value={style}
          onChange={setStyle}
        />

        {/* CTAs */}
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={commit}
            disabled={!allAnswered}
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              fontFamily: "'Inter', sans-serif",
              fontSize: 15, fontWeight: 600,
              letterSpacing: "0.02em",
              padding: "16px 40px",
              borderRadius: 999,
              border: "none",
              background: allAnswered ? BORDEAUX : "rgba(107,58,50,0.35)",
              color: CREAM,
              cursor: allAnswered ? "pointer" : "not-allowed",
              transition: "background 0.2s ease, transform 0.2s ease",
              minWidth: 220,
              justifyContent: "center",
              boxShadow: allAnswered ? "0 10px 28px rgba(107,58,50,0.32)" : "none",
            }}
            onMouseEnter={(ev) => { if (allAnswered) ev.currentTarget.style.background = BORDEAUX_DARK; }}
            onMouseLeave={(ev) => { if (allAnswered) ev.currentTarget.style.background = BORDEAUX; }}
          >
            <span>Commencer</span>
            <span aria-hidden style={{ fontSize: 16 }}>→</span>
          </button>

          <button
            type="button"
            onClick={skipDefault}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13, fontWeight: 500,
              color: INK_SOFT, background: "transparent", border: "none",
              cursor: "pointer", textDecoration: "underline",
              textUnderlineOffset: 4, padding: "8px 16px",
            }}
          >
            Passer pour cette fois
          </button>
        </div>

        {/* Sécurité visuelle : confidentialité */}
        <p style={{
          textAlign: "center",
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: INK_SOFT,
          margin: 0, fontStyle: "italic",
          opacity: 0.8,
        }}>
          Vos réponses restent sur votre appareil. Modifiable à tout moment depuis votre profil.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────── Sub-component Question ─────────────────── */
function Question<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: INK_SOFT, margin: "0 0 14px",
      }}>
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              style={{
                flex: "1 1 auto",
                minWidth: 110,
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 16, fontWeight: 500,
                padding: "16px 18px",
                borderRadius: 16,
                border: `1.5px solid ${active ? BORDEAUX : LINE}`,
                background: active ? BORDEAUX : CREAM,
                color: active ? CREAM : INK,
                cursor: "pointer",
                transition: "all 0.18s ease",
                letterSpacing: "-0.005em",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
