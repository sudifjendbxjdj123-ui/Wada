"use client";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import ProfileSwitcher from "@/components/ProfileSwitcher";

/**
 * ProfileChip — badge « Composées pour vous · {profil} ».
 *
 * Brief 2026-05-29 « Onboarding + profil + switcher » §3 :
 * « Sur les pages palette/tenue, un petit badge ambre indique au visiteur
 * que tout ce qu'il voit est filtré pour lui. Clic → ouvre le switcher. »
 *
 * Visuel : pill ambre/bordeaux discret (NE PAS rivaliser avec les CTAs
 * principaux de la page). Petit pictogramme `★` pour signifier « curé ».
 *
 * Visible uniquement après hydratation pour éviter flash SSR/CSR.
 */

const BORDEAUX = "#6B3A32";
const AMBER_BG = "rgba(201, 165, 103, 0.14)"; // doré WADA dilué
const AMBER_BORDER = "rgba(201, 165, 103, 0.45)";
const INK = "#1E1E1E";

interface Props {
  /** Variante visuelle : "compact" pour les coins de page, "block" pour
   *  centré avec un peu plus de respiration (sous le hero). */
  variant?: "compact" | "block";
  /** Texte custom à la place du défaut « Composées pour vous · …». */
  label?: string;
}

export default function ProfileChip({ variant = "block", label }: Props) {
  const { effective, hydrated } = useProfile();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  if (!hydrated) return null;

  const display = label
    ?? `Composées pour vous · ${effective.genre} · ${effective.budget} · ${effective.style}`;

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: variant === "compact" ? "6px 12px" : "8px 14px",
    borderRadius: 999,
    background: AMBER_BG,
    border: `1px solid ${AMBER_BORDER}`,
    color: INK,
    fontFamily: "'Inter', sans-serif",
    fontSize: variant === "compact" ? 11.5 : 12.5,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.18s ease, border-color 0.18s ease",
    whiteSpace: "nowrap",
    letterSpacing: "0.005em",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setSwitcherOpen(true)}
        aria-label={`${display}. Cliquer pour modifier le profil.`}
        style={baseStyle}
        onMouseEnter={(ev) => {
          ev.currentTarget.style.background = "rgba(201, 165, 103, 0.22)";
          ev.currentTarget.style.borderColor = BORDEAUX;
        }}
        onMouseLeave={(ev) => {
          ev.currentTarget.style.background = AMBER_BG;
          ev.currentTarget.style.borderColor = AMBER_BORDER;
        }}
      >
        <span aria-hidden style={{ color: BORDEAUX, fontSize: 13 }}>★</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{display}</span>
        <span aria-hidden style={{ fontSize: 10, color: "var(--wada-subtle, #6a6259)" }}>▾</span>
      </button>

      <ProfileSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}
