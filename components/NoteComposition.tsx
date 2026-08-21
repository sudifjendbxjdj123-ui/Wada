"use client";
import { useState } from "react";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import {
  ink, seal, border, cardBg, textSecondary,
  fontHeading, fontBody, fontLabel, cardRadius,
} from "@/lib/styles";

/**
 * NoteComposition — « Compatibilité WADA » + « Pourquoi ça marche ».
 *
 * Remplace le badge « ✓ Tenue validée par le styliste WADA ». Retour client
 * 2026-08-21 : « Ça sonne légèrement comme une IA qui s'auto-certifie. Je
 * transformerais ça en quelque chose d'utile. » Il a raison — le badge
 * affirmait sans rien montrer, et il était binaire : validé ou absent.
 *
 * Ce bloc dit la même chose en chiffres vérifiables, et surtout il EXPLIQUE.
 * Le client demandait les deux : le pourcentage détaillé par critère, et un
 * « Pourquoi cette tenue fonctionne ? » en français. C'est ce que
 * scoreTenue produit déjà — chaque critère porte sa raison rédigée.
 *
 * Les quatre critères mis en avant sont ceux du brief (couleurs, silhouette,
 * style, occasion). Matières et saison restent dans le détail : ce sont des
 * conditions, pas des arguments de vente.
 */

const CLES_EN_AVANT = ["couleurs", "proportions", "styles", "occasion"] as const;

/* Libellés courts pour les barres — « Proportions / silhouettes » ne tient
   pas sur une ligne de 393 px à côté de son pourcentage. */
const COURT: Record<string, string> = {
  couleurs: "Couleurs",
  proportions: "Silhouette",
  styles: "Style",
  occasion: "Occasion",
  matieres: "Matières",
  saison: "Saison",
  details: "Détails",
};

const ICONE: Record<string, string> = {
  couleurs: "◍",
  proportions: "◐",
  styles: "◈",
  occasion: "◎",
  matieres: "◇",
  saison: "☀",
  details: "✧",
};

function pourcent(note: number, max: number): number {
  return Math.round((note / max) * 100);
}

function couleurNote(total: number): string {
  /* Trois paliers seulement — un dégradé continu donnerait une fausse
     précision à un score qui n'en a pas. */
  if (total >= 85) return "var(--wada-mojo-5)";
  if (total >= 70) return "var(--wada-mojo-3)";
  return "var(--wada-neutral-5)";
}

export default function NoteComposition({ note }: { note: NoteTenue }) {
  const [ouvert, setOuvert] = useState(false);
  const accent = couleurNote(note.total);
  const enAvant = CLES_EN_AVANT
    .map((cle) => note.criteres.find((c) => c.cle === cle))
    .filter((c): c is NonNullable<typeof c> => !!c);

  return (
    <div
      style={{
        maxWidth: 720, margin: "0 auto", background: cardBg,
        border: `1px solid ${border}`, borderRadius: cardRadius,
        padding: "18px 20px",
      }}
    >
      {/* ── En-tête : le chiffre ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
          textTransform: "uppercase", color: textSecondary,
        }}>
          Compatibilité WADA
        </span>
        <span style={{ fontFamily: fontHeading, fontSize: 30, lineHeight: 1, color: accent }}>
          {note.total}%
        </span>
      </div>

      {/* ── Les quatre critères, en barres ────────────────────────────── */}
      <div style={{ marginTop: 14, display: "grid", gap: 9 }}>
        {enAvant.map((c) => {
          const pc = pourcent(c.note, c.max);
          return (
            <div key={c.cle} style={{ display: "grid", gridTemplateColumns: "84px 1fr 38px", gap: 10, alignItems: "center" }}>
              <span style={{ fontFamily: fontBody, fontSize: 13, color: seal }}>
                {COURT[c.cle] ?? c.libelle}
              </span>
              <span
                aria-hidden
                style={{
                  height: 4, borderRadius: 999, background: border,
                  position: "relative", overflow: "hidden",
                }}
              >
                <span style={{
                  position: "absolute", inset: 0, width: `${pc}%`,
                  background: accent, borderRadius: 999,
                }} />
              </span>
              <span style={{
                fontFamily: fontLabel, fontSize: 12, color: textSecondary,
                textAlign: "right",
              }}>
                {pc}%
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Pourquoi ça marche ────────────────────────────────────────── */}
      <p style={{
        fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
        textTransform: "uppercase", color: textSecondary,
        margin: "20px 0 10px",
      }}>
        Pourquoi ça marche
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {(ouvert ? note.criteres : note.criteres.slice(0, 3)).map((c) => (
          <li key={c.cle} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span aria-hidden style={{
              fontSize: 13, lineHeight: "1.5", color: accent, flexShrink: 0, width: 14,
            }}>
              {ICONE[c.cle] ?? "·"}
            </span>
            <span style={{ fontFamily: fontBody, fontSize: 13.5, color: seal, lineHeight: 1.55 }}>
              <strong style={{ fontWeight: 600, color: ink }}>{COURT[c.cle] ?? c.libelle} — </strong>
              {c.raison}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{
          marginTop: 12, background: "none", border: "none", padding: 0,
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".1em",
          textTransform: "uppercase", color: textSecondary, cursor: "pointer",
        }}
      >
        {ouvert ? "Voir moins" : "Tout voir"}
      </button>
    </div>
  );
}
