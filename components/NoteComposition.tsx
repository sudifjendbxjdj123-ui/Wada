"use client";
import { useState } from "react";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import {
  ink, seal, border, cardBg, textSecondary,
  fontHeading, fontBody, fontLabel, cardRadius,
} from "@/lib/styles";

/**
 * NoteComposition — la note de composition de la tenue, sur 100.
 *
 * Brief client 2026-08-21 : « Pour une application de stylisme comme
 * WADA.style, je ferais évaluer chaque tenue sur 100 [...] Ainsi, l'IA ne
 * ferait pas simplement "bleu va avec beige". »
 *
 * Le parti pris d'affichage : la note seule ne sert à rien. Ce qui est utile
 * au client, c'est POURQUOI — d'où le point faible affiché d'emblée, et le
 * détail des sept critères en un clic. Une tenue à 78 avec « les volumes ne
 * se répondent pas » lui apprend quelque chose ; « 78/100 » tout seul, non.
 */

function couleurNote(total: number): string {
  /* Trois paliers seulement — un dégradé continu donnerait une fausse
     précision à un score qui n'en a pas. */
  if (total >= 85) return "var(--wada-mojo-5)";
  if (total >= 70) return "var(--wada-mojo-3)";
  return "var(--wada-neutral-5)";
}

function mention(total: number): string {
  if (total >= 90) return "Composition juste";
  if (total >= 80) return "Bonne composition";
  if (total >= 70) return "Composition correcte";
  return "Composition perfectible";
}

export default function NoteComposition({ note }: { note: NoteTenue }) {
  const [ouvert, setOuvert] = useState(false);
  const accent = couleurNote(note.total);

  return (
    <div
      style={{
        maxWidth: 720, margin: "0 auto", background: cardBg,
        border: `1px solid ${border}`, borderRadius: cardRadius,
        padding: "18px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontFamily: fontHeading, fontSize: 34, lineHeight: 1, color: accent }}>
          {note.total}
        </span>
        <span style={{ fontFamily: fontLabel, fontSize: 12, color: textSecondary, letterSpacing: ".08em" }}>
          / 100
        </span>
        <span style={{ fontFamily: fontHeading, fontSize: 16, color: ink }}>
          {mention(note.total)}
        </span>
      </div>

      {note.aTravailler && (
        <p style={{
          fontFamily: fontBody, fontSize: 14, color: seal,
          lineHeight: 1.55, margin: "10px 0 0",
        }}>
          <strong style={{ fontWeight: 600 }}>{note.aTravailler.libelle} — </strong>
          {note.aTravailler.raison}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{
          marginTop: 12, background: "none", border: "none", padding: 0,
          fontFamily: fontLabel, fontSize: 12, letterSpacing: ".08em",
          textTransform: "uppercase", color: textSecondary, cursor: "pointer",
        }}
      >
        {ouvert ? "Masquer le détail" : "Voir le détail"}
      </button>

      {ouvert && (
        <ul style={{ listStyle: "none", padding: 0, margin: "14px 0 0" }}>
          {note.criteres.map((c) => (
            <li
              key={c.cle}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                gap: "2px 12px", padding: "9px 0",
                borderTop: `1px solid ${border}`,
              }}
            >
              <span style={{ fontFamily: fontHeading, fontSize: 14, color: ink }}>
                {c.libelle}
              </span>
              <span style={{
                fontFamily: fontLabel, fontSize: 13,
                color: c.note === c.max ? accent : textSecondary,
                whiteSpace: "nowrap",
              }}>
                {c.note} / {c.max}
              </span>
              <span style={{
                gridColumn: "1 / -1", fontFamily: fontBody, fontSize: 13,
                color: textSecondary, lineHeight: 1.5,
              }}>
                {c.raison}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
