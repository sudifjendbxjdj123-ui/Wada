"use client";
import { useState } from "react";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import {
  ink, seal, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * NoteComposition — « Pourquoi cette tenue fonctionne ? »
 *
 * Deux retours successifs ont façonné ce bloc.
 *
 * 21/08 : « Tenue validée par le styliste WADA sonne comme une IA qui
 * s'auto-certifie. Je transformerais ça en quelque chose d'utile. » → le
 * badge binaire est devenu un score détaillé, explicable.
 *
 * 22/08, maquette : le score chiffré remonte dans la carte « Votre tenue »
 * (WADA MATCH + les quatre critères en icônes), et l'explication redescend
 * ici, REPLIÉE. C'est le bon arbitrage : le chiffre se lit en passant, la
 * justification n'intéresse que ceux qui la cherchent — et dépliée par
 * défaut, elle repoussait les produits hors de l'écran.
 */

const COURT: Record<string, string> = {
  couleurs: "Couleurs",
  proportions: "Proportions",
  styles: "Style",
  occasion: "Occasion",
  matieres: "Matières",
  saison: "Saison",
  details: "Détails",
};

export default function NoteComposition({ note }: { note: NoteTenue }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto",
      background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 11,
          padding: "14px 15px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit",
        }}
      >
        <span style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          border: `1px solid ${border}`, color: mojo,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden
            fill="currentColor">
            <path d="M12 2.5 13.9 9l6.6 1.9-6.6 1.9L12 19.4 10.1 12.8 3.5 10.9 10.1 9 12 2.5Z" />
          </svg>
        </span>
        <span style={{
          flex: 1, fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".12em",
          textTransform: "uppercase", color: ink, fontWeight: 600,
        }}>
          Pourquoi cette tenue fonctionne&nbsp;?
        </span>
        <span aria-hidden style={{
          color: textSecondary, display: "inline-flex", flexShrink: 0,
          transform: ouvert ? "rotate(180deg)" : "none",
          transition: "transform .2s ease",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {ouvert && (
        <ul style={{
          listStyle: "none", padding: "0 15px 15px", margin: 0,
          display: "grid", gap: 9,
        }}>
          {note.criteres.map((c) => (
            <li key={c.cle} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span aria-hidden style={{
                width: 5, height: 5, borderRadius: "50%", marginTop: 7,
                background: c.note === c.max ? mojo : border, flexShrink: 0,
              }} />
              <span style={{ fontFamily: fontBody, fontSize: 13, color: seal, lineHeight: 1.55 }}>
                <strong style={{ fontWeight: 600, color: ink }}>
                  {COURT[c.cle] ?? c.libelle}&nbsp;—{" "}
                </strong>
                {c.raison}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
