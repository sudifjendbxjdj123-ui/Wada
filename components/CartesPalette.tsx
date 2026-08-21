"use client";
import Link from "next/link";
import { useMemo } from "react";
import type { DictionaryEntry } from "@/lib/data";
import { motsAmbiance, idealPour, meilleureTenue } from "@/lib/ambiances";
import {
  ink, seal, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * CartesPalette — la grande carte « Palette du jour » et les petites cartes
 * « Autres palettes pour vous ».
 *
 * Maquette client 2026-08-22, et son raisonnement : « Les palettes ne
 * devraient pas donner l'impression d'être un catalogue de 348 rectangles de
 * couleurs. La page devrait provoquer : cette ambiance me plaît → je veux
 * voir comment m'habiller avec. »
 *
 * D'où trois partis pris :
 *
 *  1. Chaque couleur porte son NOM et son HEX. Un rectangle muet ne dit rien ;
 *     « Sauge tendre #A8B69A » se retient et se cherche.
 *  2. Sous les couleurs, ce que la palette PERMET — les mots d'ambiance, les
 *     occasions, et le meilleur accord que le moteur sait en tirer.
 *  3. Un seul CTA, explicite : « Créer une tenue avec cette palette ». Le
 *     brief le dit — « on ne sait pas forcément ce qui va se passer lorsqu'on
 *     touche une palette ».
 */

function IconeCoeur({ plein }: { plein: boolean }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden
      fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 22l7.4-7.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

function Fleche({ taille = 15 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" aria-hidden fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function boutonCoeur(actif: boolean, onClick: () => void, label: string) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      aria-pressed={actif}
      aria-label={label}
      style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        border: "none", background: "transparent", cursor: "pointer",
        color: actif ? mojo : textSecondary,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <IconeCoeur plein={actif} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PALETTE DU JOUR
   ══════════════════════════════════════════════════════════════════════ */

export function PaletteDuJour({
  entry, favori, onFavori,
}: {
  entry: DictionaryEntry;
  favori: boolean;
  onFavori: () => void;
}) {
  const mots = useMemo(() => motsAmbiance(entry), [entry]);
  const occasions = useMemo(() => idealPour(entry), [entry]);
  const meilleure = useMemo(() => meilleureTenue(entry), [entry]);

  return (
    <article style={{
      background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 20,
      padding: 16, boxShadow: "0 12px 34px -26px rgba(30,30,30,.45)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: fontLabel, fontSize: 12, color: mojo, margin: 0,
            letterSpacing: ".06em",
          }}>
            N°{entry.number}
          </p>
          <h3 style={{
            fontFamily: fontHeading, fontSize: 24, color: ink,
            margin: "3px 0 0", lineHeight: 1.15,
          }}>
            {entry.name}
          </h3>
          <p style={{
            fontFamily: fontBody, fontSize: 14, color: textSecondary,
            margin: "5px 0 0",
          }}>
            {mots.join(" · ")}
          </p>
        </div>
        {boutonCoeur(favori, onFavori, favori ? "Retirer des favoris" : "Ajouter aux favoris")}
      </div>

      {/* ── Les couleurs, nommées ──────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(1, entry.colors.length)}, minmax(0, 1fr))`,
        gap: 8, margin: "14px 0 0",
      }}>
        {entry.colors.map((c) => (
          <div key={c.hex} style={{ minWidth: 0 }}>
            <span aria-hidden style={{
              display: "block", height: 72, borderRadius: 10,
              background: c.hex,
              boxShadow: "inset 0 0 0 1px rgba(30,30,30,.09)",
            }} />
            <span style={{
              display: "block", fontFamily: fontLabel, fontSize: 10,
              letterSpacing: ".04em", textTransform: "uppercase", color: ink,
              margin: "7px 0 1px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {c.name}
            </span>
            {/* Le hex n'est pas du jargon ici : c'est la référence exacte que
                le client peut chercher chez un marchand ou noter. */}
            <span style={{
              display: "block", fontFamily: fontBody, fontSize: 10.5,
              color: textSecondary,
            }}>
              {c.hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* ── Idéal pour ─────────────────────────────────────────────────── */}
      {occasions.length > 0 && (
        <p style={{
          /* `ink` : `seal` vaut #1B4A6B, un bleu — cette ligne d'information
             se lisait comme un lien alors qu'elle n'est pas cliquable. */
          fontFamily: fontBody, fontSize: 13.5, color: ink,
          margin: "16px 0 0", lineHeight: 1.5,
        }}>
          <span style={{
            fontFamily: fontLabel, fontSize: 10, letterSpacing: ".12em",
            textTransform: "uppercase", color: textSecondary,
            display: "block", marginBottom: 3,
          }}>
            Idéal pour
          </span>
          {occasions.join(" · ")}
        </p>
      )}

      {/* ── Ce que le moteur en tire ───────────────────────────────────── */}
      <p style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: fontBody, fontSize: 13, color: textSecondary,
        margin: "12px 0 0",
      }}>
        <span aria-hidden style={{ display: "inline-flex", color: mojo }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3 4 5.5 5.5 10 8 9v11h8V9l2.5 1L20 5.5 16 3a4 4 0 0 1-8 0Z" />
          </svg>
        </span>
        Meilleure tenue&nbsp;: <strong style={{ color: ink, fontWeight: 600 }}>{meilleure.resume}</strong>
      </p>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, margin: "16px 0 0", flexWrap: "wrap" }}>
        <Link
          href={`/ma-tenue?palette=${entry.number}`}
          style={{
            flex: "1 1 190px", display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: 8, padding: "14px 16px",
            borderRadius: 999, background: mojo, color: "#fff",
            textDecoration: "none", fontFamily: fontLabel, fontSize: 12,
            fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
            textAlign: "center", lineHeight: 1.25,
          }}
        >
          Créer une tenue
          <Fleche />
        </Link>
        <Link
          href={`/palette/${entry.number}`}
          style={{
            flex: "0 1 auto", display: "inline-flex", alignItems: "center",
            justifyContent: "center", padding: "14px 20px", borderRadius: 999,
            border: `1px solid ${border}`, background: "transparent",
            color: seal, textDecoration: "none",
            fontFamily: fontBody, fontSize: 13.5, whiteSpace: "nowrap",
          }}
        >
          Voir la palette
        </Link>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CARTE SECONDAIRE
   ══════════════════════════════════════════════════════════════════════ */

export function CartePaletteCompacte({
  entry, favori, onFavori,
}: {
  entry: DictionaryEntry;
  favori: boolean;
  onFavori: () => void;
}) {
  const mots = useMemo(() => motsAmbiance(entry, 2), [entry]);

  return (
    <article style={{
      background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 6, padding: "9px 10px 7px",
      }}>
        <span style={{ fontFamily: fontLabel, fontSize: 11, color: textSecondary }}>
          N°{entry.number}
        </span>
        {boutonCoeur(favori, onFavori, favori ? "Retirer des favoris" : "Ajouter aux favoris")}
      </div>

      <div aria-hidden style={{ display: "flex", height: 76 }}>
        {entry.colors.map((c) => (
          <span key={c.hex} style={{ flex: 1, background: c.hex }} />
        ))}
      </div>

      <div style={{ padding: "11px 12px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{
          fontFamily: fontHeading, fontSize: 15, color: ink, margin: 0,
          lineHeight: 1.2,
        }}>
          {entry.name}
        </h3>
        <p style={{
          fontFamily: fontBody, fontSize: 12, color: textSecondary,
          margin: "4px 0 0", flex: 1,
        }}>
          {mots.join(" · ")}
        </p>
        <Link
          href={`/ma-tenue?palette=${entry.number}`}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            gap: 6, marginTop: 11, padding: "9px 12px", borderRadius: 999,
            border: `1px solid ${border}`, color: seal, textDecoration: "none",
            fontFamily: fontBody, fontSize: 12.5,
          }}
        >
          Découvrir
          <Fleche taille={13} />
        </Link>
      </div>
    </article>
  );
}
