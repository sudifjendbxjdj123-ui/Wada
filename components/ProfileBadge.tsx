"use client";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ProfileSwitcher from "@/components/ProfileSwitcher";

/**
 * ProfileBadge — pastille profil dans la nav (avatar bordeaux F/H + label).
 *
 * Brief 2026-05-29 §3 :
 *   - Avatar rond bordeaux avec initiale du genre (F ou H)
 *   - Libellé en clair : « Femme · 150–400€ · Minimaliste »
 *   - Petit chevron qui suggère qu'on peut cliquer
 *   - Clic → ouvre ProfileSwitcher
 *
 * Visible uniquement après hydratation (sinon flash SSR/CSR).
 * Sur ≤880px on cache le libellé pour ne garder que l'avatar (header
 * mobile décongestionné).
 */

const BORDEAUX = "#6B3A32";
const CREAM = "#FAF8F4";
const INK = "#1E1E1E";

export default function ProfileBadge() {
  const { effective, hydrated } = useProfile();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  if (!hydrated) return null;

  const initial = effective.genre[0]; // "F" ou "H"

  return (
    <>
      <button
        type="button"
        onClick={() => setSwitcherOpen(true)}
        aria-label={`Profil : ${effective.genre} · ${effective.budget} · ${effective.style}. Cliquez pour modifier.`}
        className="wada-profile-badge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 10px 5px 5px",
          borderRadius: 999,
          background: "transparent",
          border: "1px solid var(--wada-border, rgba(30,30,30,.12))",
          cursor: "pointer",
          transition: "background 0.18s ease, border-color 0.18s ease",
          fontFamily: "'Inter', sans-serif",
        }}
        onMouseEnter={(ev) => {
          ev.currentTarget.style.background = "rgba(107,58,50,0.06)";
          ev.currentTarget.style.borderColor = BORDEAUX;
        }}
        onMouseLeave={(ev) => {
          ev.currentTarget.style.background = "transparent";
          ev.currentTarget.style.borderColor = "var(--wada-border, rgba(30,30,30,.12))";
        }}
      >
        {/* Avatar rond bordeaux avec initiale */}
        <span
          aria-hidden
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: BORDEAUX, color: CREAM,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600, fontSize: 13,
            lineHeight: 1,
          }}
        >
          {initial}
        </span>

        {/* Label en clair — caché ≤880px */}
        <span
          className="wada-profile-badge-label"
          style={{
            fontSize: 12, fontWeight: 500,
            color: "var(--wada-ink, " + INK + ")",
            whiteSpace: "nowrap",
            letterSpacing: "0.005em",
          }}
        >
          {effective.genre} · {effective.budget} · {effective.style}
        </span>

        {/* Chevron */}
        <span
          aria-hidden
          style={{
            fontSize: 10,
            color: "var(--wada-subtle, #6a6259)",
            marginRight: 2,
          }}
        >
          ▾
        </span>

        <style jsx>{`
          /* Mobile : on cache le label pour ne garder que l'avatar
             cliquable (gain de place dans le header). L'aria-label
             reste lu par les lecteurs d'écran. */
          @media (max-width: 880px) {
            :global(.wada-profile-badge-label) {
              display: none !important;
            }
          }
        `}</style>
      </button>

      <ProfileSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}
