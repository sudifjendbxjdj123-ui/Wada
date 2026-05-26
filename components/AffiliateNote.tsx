"use client";
import { useState } from "react";
import { subtle, mojo, paper, ink, border, fontLabel, fontBody } from "@/lib/styles";

interface AffiliateNoteProps {
  /** Position du popover. Défaut "top-right". */
  position?: "top-right" | "bottom-right" | "inline";
}

/**
 * AffiliateNote — petit tag de transparence sur les liens marchands.
 *
 * Affiche une icône discrète "ⓘ via affiliation" qui, au hover/click,
 * explique : "WADA gagne une commission qui finance le site, sans coût
 * supplémentaire pour vous."
 *
 * Recommandé partout où l'utilisateur clique sur un lien tracké :
 * page palette (boutons boutiques), panier, fiche marque.
 *
 * Inspiré des bandeaux de transparence d'éditeurs comme The Wirecutter,
 * Reuters Reviews — c'est la norme légale et éthique en e-commerce affilié.
 */
export default function AffiliateNote({ position = "top-right" }: AffiliateNoteProps) {
  const [open, setOpen] = useState(false);

  const pos: React.CSSProperties = position === "inline"
    ? { display: "inline-flex", position: "relative" }
    : { position: "absolute", top: 10, right: 10, zIndex: 5 };

  return (
    <span
      style={pos}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
    >
      <button
        aria-label="Transparence sur l'affiliation"
        type="button"
        style={{
          background: "transparent",
          border: `1px solid ${border}`,
          padding: "3px 8px",
          fontFamily: fontLabel,
          fontSize: 9,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: subtle,
          fontWeight: 600,
          cursor: "help",
          borderRadius: 12,
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          lineHeight: 1.1,
        }}
      >
        <span aria-hidden style={{ fontSize: 10 }}>ⓘ</span>
        <span>Affiliation</span>
      </button>

      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            top: position === "inline" ? "calc(100% + 8px)" : 32,
            right: 0,
            width: 260,
            background: paper,
            border: `1px solid ${ink}`,
            padding: 14,
            zIndex: 100,
            boxShadow: "0 6px 20px rgba(31, 27, 22, 0.18)",
          }}
        >
          <p style={{
            fontFamily: fontLabel,
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: mojo,
            margin: "0 0 6px",
            fontWeight: 700,
          }}>
            Transparence
          </p>
          <p style={{
            fontFamily: fontBody,
            fontSize: 12,
            color: ink,
            margin: 0,
            lineHeight: 1.5,
          }}>
            WADA gagne une petite commission quand vous achetez via ces liens.
            <strong style={{ color: ink }}> Aucun coût supplémentaire pour vous</strong> —
            c'est ce qui finance la curation éditoriale et garde le site gratuit.
          </p>
        </span>
      )}
    </span>
  );
}
