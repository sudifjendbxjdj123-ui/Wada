"use client";
import { useState } from "react";
import type { RegistreOutfit } from "@/lib/registreEngine";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import { legendePalette, libelleRole } from "@/lib/composer/rolesCouleurs";
import NoteComposition from "@/components/NoteComposition";
import {
  ink, seal, border, textSecondary,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * Sections secondaires de /ma-tenue (refonte 2026-08-23) :
 *
 *  - AccordeonPourquoi — « Pourquoi cette tenue fonctionne ? », FERMÉ au
 *    chargement (brief §9 : « ne pas afficher trop de texte par défaut »).
 *    Il abrite la phrase de direction artistique et la note de composition,
 *    qui occupaient chacune leur section pleine page.
 *
 *  - UtilisationPalette — « Crème → Haut » : quelle teinte de la palette
 *    habille quelle pièce (brief §10). Dérivé du même rolesCouleurs que le
 *    composeur : la légende dit ce que le moteur a réellement fait.
 */

export function AccordeonPourquoi({
  description,
  note,
}: {
  description?: string | null;
  note: NoteTenue | null;
}) {
  const [ouvert, setOuvert] = useState(false);
  if (!description && !note) return null;

  return (
    <div style={{
      maxWidth: 980, margin: "0 auto",
      background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10,
          padding: "14px 16px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".13em",
          textTransform: "uppercase", color: ink, fontWeight: 600,
        }}>
          Pourquoi cette tenue fonctionne ?
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            color: textSecondary, flexShrink: 0,
            transform: ouvert ? "rotate(180deg)" : "none", transition: "transform .18s ease",
          }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {ouvert && (
        <div style={{ padding: "0 16px 16px" }}>
          {description && (
            <p style={{
              fontFamily: fontBody, fontStyle: "italic", fontSize: 14.5,
              color: seal, lineHeight: 1.55, margin: "0 0 14px",
            }}>
              {description}
            </p>
          )}
          {note && <NoteComposition note={note} />}
        </div>
      )}
    </div>
  );
}

export function UtilisationPalette({ outfit }: { outfit: RegistreOutfit }) {
  const lignes = legendePalette(outfit);
  if (lignes.length === 0) return null;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: ink, fontWeight: 600,
        margin: "0 0 10px",
      }}>
        Utilisation de la palette
      </p>
      <div style={{
        background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
        padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 9,
      }}>
        {lignes.map((l) => (
          <div key={l.hex} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span aria-hidden style={{
              width: 26, height: 26, borderRadius: 8, background: l.hex,
              boxShadow: "inset 0 0 0 1px rgba(30,30,30,.1)", flexShrink: 0,
            }} />
            <span style={{
              fontFamily: fontBody, fontSize: 13, color: ink,
              minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {l.nom}
              <span aria-hidden style={{ color: textSecondary, margin: "0 7px" }}>→</span>
              {l.pieces.join(" · ")}
            </span>
            <span style={{
              marginLeft: "auto", flexShrink: 0,
              fontFamily: fontLabel, fontSize: 9.5, letterSpacing: ".1em",
              textTransform: "uppercase", color: textSecondary,
            }}>
              {libelleRole(l.role)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
