"use client";
import { useState } from "react";
import {
  useMoodOfDay,
  type Perception,
  type Humeur,
  type Objectif,
} from "@/hooks/useMoodOfDay";

/**
 * <MoodChips> — Vision Pt B (2026-05-31).
 *
 * Trois questions optionnelles affichées avant la génération d'une tenue :
 *   - Comment veux-tu être perçu ?
 *   - Quelle est ton humeur ?
 *   - Quel est ton objectif aujourd'hui ?
 *
 * Une seule sélection par question (toggle off si reclic). Les choix
 * sont injectés dans le prompt LLM via /api/stylist sous forme de
 * contexte « envie du jour ».
 *
 * Trois variantes d'affichage :
 *   - "expanded" : 3 questions visibles dépliées (page /palette/[n])
 *   - "compact"  : 1 ligne « Ton envie : … » + bouton « Préciser »
 *                  qui ouvre les 3 questions (page /stylist)
 *   - "inline"   : pour insertion dans flux (toggle dépliable)
 */

const palette = {
  cream: "#FAF8F4",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  bordeaux: "#6B3A32",
  olive: "#A8B29A",
  line: "rgba(30,30,30,.12)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const PERCEPTIONS: Array<{ key: Perception; icon: string }> = [
  { key: "Élégant", icon: "🎯" },
  { key: "Créatif", icon: "🎨" },
  { key: "Accessible", icon: "🤝" },
  { key: "Autoritaire", icon: "👔" },
  { key: "Séduisant", icon: "💫" },
  { key: "Mystérieux", icon: "🌑" },
];
const HUMEURS: Array<{ key: Humeur; icon: string }> = [
  { key: "Énergique", icon: "⚡" },
  { key: "Calme", icon: "🌊" },
  { key: "Confiant", icon: "🔥" },
  { key: "Discret", icon: "🌫" },
];
const OBJECTIFS: Array<{ key: Objectif; icon: string }> = [
  { key: "Travail", icon: "💼" },
  { key: "Sortir", icon: "🥂" },
  { key: "Voyage", icon: "✈️" },
  { key: "Dîner", icon: "🍷" },
  { key: "Journée normale", icon: "☕" },
  { key: "Rendez-vous", icon: "❤️" },
];

export interface MoodChipsProps {
  variant?: "expanded" | "compact" | "inline";
  /* Callback optionnel quand l'utilisateur change quelque chose
     (utile pour /stylist qui veut re-déclencher la génération). */
  onChange?: () => void;
}

export default function MoodChips({ variant = "expanded", onChange }: MoodChipsProps) {
  const { mood, save, hydrated } = useMoodOfDay();
  const [expanded, setExpanded] = useState(variant === "expanded");

  if (!hydrated) {
    return (
      <div style={{ minHeight: variant === "compact" ? 48 : 200 }}>
        <div className="wada-skeleton" style={{ height: 14, width: "30%", marginBottom: 10, borderRadius: 4 }} />
        <div className="wada-skeleton" style={{ height: 36, marginBottom: 14, borderRadius: 999 }} />
      </div>
    );
  }

  const handlePick = <T,>(
    key: "perception" | "humeur" | "objectif",
    value: T,
    current: T | undefined,
  ) => {
    save({ [key]: current === value ? undefined : value } as never);
    onChange?.();
  };

  /* Variante COMPACT : juste un résumé + bouton déplier. */
  if (variant === "compact" && !expanded) {
    const summary = [mood.perception, mood.humeur, mood.objectif].filter(Boolean).join(" · ");
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 999,
        fontFamily: fonts.sans,
        fontSize: 13,
        color: palette.inkSoft,
      }}>
        <span style={{ flex: 1 }}>
          {summary ? <>Ton envie aujourd'hui · <strong style={{ color: palette.ink }}>{summary}</strong></> : "Ajoute ton envie du jour"}
        </span>
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: "transparent",
            border: "none",
            color: palette.bordeaux,
            cursor: "pointer",
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {summary ? "Modifier" : "Préciser"} →
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: palette.cream,
      border: `1px solid ${palette.line}`,
      borderRadius: 18,
      padding: 18,
      fontFamily: fonts.sans,
    }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 14,
      }}>
        <h3 style={{
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 16,
          margin: 0,
          color: palette.ink,
        }}>
          Ton envie aujourd'hui
        </h3>
        {variant === "compact" && (
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: "transparent",
              border: "none",
              color: palette.inkSoft,
              cursor: "pointer",
              fontSize: 18,
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Replier"
          >×</button>
        )}
      </div>

      <p style={{
        fontSize: 12,
        color: palette.inkSoft,
        margin: "0 0 16px",
        lineHeight: 1.5,
      }}>
        Optionnel. Précise l'humeur, WADA adapte sa proposition au moment.
      </p>

      {/* PERCEPTION */}
      <div style={fieldGroup}>
        <div style={fieldLabel}>Comment veux-tu être perçu·e ?</div>
        <div style={chipRow}>
          {PERCEPTIONS.map(({ key, icon }) => (
            <MoodChip
              key={key}
              icon={icon}
              label={key}
              active={mood.perception === key}
              onClick={() => handlePick("perception", key, mood.perception)}
            />
          ))}
        </div>
      </div>

      {/* HUMEUR */}
      <div style={fieldGroup}>
        <div style={fieldLabel}>Ton humeur</div>
        <div style={chipRow}>
          {HUMEURS.map(({ key, icon }) => (
            <MoodChip
              key={key}
              icon={icon}
              label={key}
              active={mood.humeur === key}
              onClick={() => handlePick("humeur", key, mood.humeur)}
            />
          ))}
        </div>
      </div>

      {/* OBJECTIF */}
      <div style={{ ...fieldGroup, marginBottom: 0 }}>
        <div style={fieldLabel}>Ton objectif</div>
        <div style={chipRow}>
          {OBJECTIFS.map(({ key, icon }) => (
            <MoodChip
              key={key}
              icon={icon}
              label={key}
              active={mood.objectif === key}
              onClick={() => handlePick("objectif", key, mood.objectif)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MoodChip({
  icon, label, active, onClick,
}: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        background: active ? palette.ink : "#fff",
        color: active ? palette.cream : palette.ink,
        border: `1px solid ${active ? palette.ink : palette.line}`,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: fonts.sans,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transition: "all .15s ease",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>
      {label}
    </button>
  );
}

const fieldGroup: React.CSSProperties = {
  marginBottom: 16,
};
const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: palette.inkSoft,
  fontWeight: 500,
  marginBottom: 8,
};
const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};
