"use client";
import { useEffect } from "react";
import { useProfile, type Genre, type Budget, type Style } from "@/hooks/useProfile";

/**
 * ProfileSwitcher — modal léger pour changer le profil à la volée.
 *
 * Brief 2026-05-29 §4 :
 *   - Overlay sombre + carte beige centrée (PAS une page entière)
 *   - 3 segmented controls (un clic = sélection, modification visible immédiatement)
 *   - Bouton « Appliquer » et X en haut
 *   - Au changement : badge + chips/tenue se mettent à jour en direct (state React,
 *     pas de reload)
 *
 * Le hook useProfile dispatche automatiquement le changement à tous les
 * composants abonnés via storage event + setState — donc « appliquer »
 * est en fait optionnel : chaque clic met déjà à jour. Le bouton sert
 * de feedback de fermeture (« j'ai validé, je sors »).
 */

const GENRES: Genre[] = ["Femme", "Homme"];
const BUDGETS: Budget[] = ["< 150€", "150–400€", "Premium"];
const STYLES: Style[] = ["Minimaliste", "Classique", "Streetwear", "Décontracté"];

const BORDEAUX = "#6B3A32";
const BORDEAUX_DARK = "#5a3029";
const CREAM = "#FAF8F4";
const BEIGE = "#F4EFE7";
const INK = "#1E1E1E";
const INK_SOFT = "#6a6259";
const LINE = "rgba(30,30,30,.10)";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileSwitcher({ open, onClose }: Props) {
  const { effective, save } = useProfile();

  /* Échap ferme le modal + bloque scroll body pendant ouverture. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wada-switcher-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "rgba(0,0,0,0.42)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "wada-switcher-fade 0.18s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: BEIGE,
          borderRadius: 24,
          padding: "28px 28px 24px",
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 30px 60px rgba(0,0,0,0.28)",
          animation: "wada-switcher-slide 0.22s cubic-bezier(.22,1,.36,1)",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <h2
            id="wada-switcher-title"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700, fontSize: 22,
              color: INK, margin: 0,
              letterSpacing: "-0.005em",
            }}
          >
            Changer le profil
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "rgba(30,30,30,0.06)",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: INK_SOFT,
              lineHeight: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Segmented controls */}
        <Segment<Genre>
          label="Pour qui"
          options={GENRES}
          value={effective.genre}
          onChange={(v) => save({ genre: v })}
        />
        <Segment<Budget>
          label="Budget"
          options={BUDGETS}
          value={effective.budget}
          onChange={(v) => save({ budget: v })}
        />
        <Segment<Style>
          label="Style"
          options={STYLES}
          value={effective.style}
          onChange={(v) => save({ style: v })}
        />

        {/* CTA Appliquer */}
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: BORDEAUX,
            color: CREAM,
            border: "none",
            borderRadius: 999,
            padding: "13px 26px",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14, fontWeight: 600,
            letterSpacing: "0.02em",
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
            transition: "background 0.18s ease",
          }}
          onMouseEnter={(ev) => { ev.currentTarget.style.background = BORDEAUX_DARK; }}
          onMouseLeave={(ev) => { ev.currentTarget.style.background = BORDEAUX; }}
        >
          <span>Appliquer</span>
          <span aria-hidden style={{ fontSize: 15 }}>→</span>
        </button>

        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: INK_SOFT,
          margin: "14px 0 0",
          textAlign: "center", fontStyle: "italic",
        }}>
          Les propositions de tenues se mettent à jour automatiquement.
        </p>
      </div>

      <style jsx>{`
        @keyframes wada-switcher-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes wada-switcher-slide {
          from { transform: translateY(12px); opacity: 0.5; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────── Sub-component Segment ─────────────────── */
function Segment<T extends string>({ label, options, value, onChange }: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: INK_SOFT, margin: "0 0 10px",
      }}>
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                minWidth: 90,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: active ? 600 : 500,
                padding: "11px 14px",
                borderRadius: 12,
                border: `1.5px solid ${active ? BORDEAUX : LINE}`,
                background: active ? BORDEAUX : CREAM,
                color: active ? CREAM : INK,
                cursor: "pointer",
                transition: "all 0.18s ease",
                letterSpacing: 0,
                whiteSpace: "nowrap",
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
