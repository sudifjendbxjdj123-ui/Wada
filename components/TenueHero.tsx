"use client";
import { useMemo } from "react";
import type { RegistreOutfit, SlotKey } from "@/lib/registreEngine";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import type { ProduitLook } from "@/components/LookComplet";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * TenueHero — la carte « Shop the Look » qui ouvre /ma-tenue.
 *
 * Refonte client 2026-08-23 : « la page doit ressembler à un vrai Shop the
 * Look, pas à une liste de fiches produit. La tenue doit être le produit
 * principal. » La carte remplace LookComplet, qui alignait cinq vignettes
 * égales : ici les pièces sont COMPOSÉES en flat lay — tailles inégales,
 * léger chevauchement — pour que l'œil lise une tenue, pas un inventaire.
 *
 * Large écran : composition à gauche (~58 %), infos et CTA à droite.
 * Téléphone : composition pleine largeur, infos dessous. Le bascule se fait
 * en CSS pur (grille auto-fit) — pas de mesure JS, pas de saut d'hydratation.
 *
 * Le WADA MATCH reste petit et en coin, comme sur la maquette : « le WADA
 * Match doit rester secondaire par rapport à la tenue. » Le détail par
 * critère vit dans l'accordéon « Pourquoi cette tenue fonctionne » plus bas ;
 * ici, une seule ligne discrète.
 */

const ORDRE: SlotKey[] = ["veste", "haut", "bas", "chaussures", "accent"];

function visuel(p: ProduitLook | null | undefined): string | null {
  if (!p) return null;
  return p.imageLocal || p.largeImage || p.image || null;
}

/* Cellule du flat lay : photo détourée sur fond blanc cassé, ou la teinte
   prévue par la palette tant que le produit n'est pas résolu — la carte a la
   même géométrie pendant le chargement qu'après. */
function Cellule({
  image, hex, libelle, grande = false, onClick,
}: {
  image: string | null;
  hex: string;
  libelle: string;
  grande?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Voir ${libelle}`}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", padding: 0, cursor: onClick ? "pointer" : "default",
        background: "#FFFFFF", borderRadius: 12, overflow: "hidden",
        minWidth: 0, minHeight: 0, width: "100%", height: "100%",
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image} alt={libelle} loading={grande ? "eager" : "lazy"} decoding="async"
          style={{
            width: "100%", height: "100%", objectFit: "contain",
            padding: grande ? 10 : 6,
          }}
        />
      ) : (
        <span aria-hidden className="wada-skeleton" style={{
          display: "block", width: "70%", height: "70%",
          borderRadius: 10, background: hex, opacity: .5,
        }} />
      )}
    </button>
  );
}

export default function TenueHero({
  outfit,
  produits,
  note,
  onShopper,
  onSauvegarder,
  sauvegardee,
  onVoirPiece,
}: {
  outfit: RegistreOutfit;
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
  note: NoteTenue | null;
  /** Ouvre le récapitulatif d'achat (feuille de ShopperLaTenue). */
  onShopper: () => void;
  onSauvegarder: () => void;
  sauvegardee: boolean;
  onVoirPiece?: (slot: SlotKey) => void;
}) {
  const pieces = useMemo(() => ORDRE
    .map((slot) => {
      const s = outfit.slots.find((x) => x.slot === slot);
      return s ? { slot, hex: s.color.hex, type: s.type, produit: produits[slot] ?? null } : null;
    })
    .filter((p): p is NonNullable<typeof p> => !!p), [outfit, produits]);

  const resolus = pieces.map((p) => p.produit).filter((p): p is ProduitLook => !!p);
  const total = resolus.reduce((a, p) => a + (p.prix || 0), 0);
  const devise = resolus[0]?.devise || "EUR";
  const totalPret = resolus.length === pieces.length && total > 0;

  const cellule = (slot: SlotKey, grande = false) => {
    const p = pieces.find((x) => x.slot === slot);
    if (!p) return <span aria-hidden style={{ background: "#F4F1EA", borderRadius: 12 }} />;
    return (
      <Cellule
        image={visuel(p.produit)} hex={p.hex} libelle={p.type} grande={grande}
        onClick={onVoirPiece ? () => onVoirPiece(slot) : undefined}
      />
    );
  };

  return (
    <div style={{
      maxWidth: 980, margin: "0 auto", position: "relative",
      background: "#FFFDFA", border: `1px solid ${border}`,
      borderRadius: 20, padding: 14,
      /* « très peu d'ombres » (brief §15) : un seul voile doux. */
      boxShadow: "0 12px 34px -28px rgba(30,30,30,.45)",
      display: "grid",
      /* ≥ ~700 px : composition | infos. En dessous : une colonne. */
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 16, alignItems: "stretch",
    }}>
      {/* Badge match — petit, en coin, comme sur la maquette. */}
      {note && (
        <span style={{
          position: "absolute", top: 12, left: 12, zIndex: 2,
          background: "rgba(255,255,255,.92)", borderRadius: 12,
          padding: "7px 11px", textAlign: "center",
          boxShadow: "0 2px 10px -6px rgba(30,30,30,.4)",
        }}>
          <span style={{
            display: "block", fontFamily: fontLabel, fontSize: 8.5,
            letterSpacing: ".12em", textTransform: "uppercase",
            color: textSecondary, fontWeight: 600,
          }}>
            Wada match
          </span>
          <span style={{ fontFamily: fontHeading, fontSize: 20, color: ink, lineHeight: 1.15 }}>
            {note.total}%
          </span>
        </span>
      )}

      {/* ── Flat lay ────────────────────────────────────────────────────
          Grille de la maquette : VESTE|HAUT / BAS|CHAUSSURES / ACCESSOIRE.
          Les rangées vêtements dominent, l'accessoire ferme en bandeau. */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "minmax(120px, 1.2fr) minmax(120px, 1.2fr) minmax(72px, .7fr)",
        gap: 8, minHeight: 340,
        background: "#F4F1EA", borderRadius: 16, padding: 8,
      }}>
        {cellule("veste")}
        {cellule("haut", true)}
        {cellule("bas", true)}
        {cellule("chaussures")}
        <div style={{ gridColumn: "1 / -1" }}>
          {cellule("accent")}
        </div>
      </div>

      {/* ── Infos + CTA ───────────────────────────────────────────────── */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 4, padding: "6px 8px 6px 4px",
      }}>
        <p style={{
          fontFamily: fontHeading, fontSize: 21, color: ink,
          margin: 0, lineHeight: 1.15,
        }}>
          Tenue complète
        </p>
        <p style={{ fontFamily: fontBody, fontSize: 13.5, color: textSecondary, margin: 0 }}>
          {pieces.length} pièce{pieces.length > 1 ? "s" : ""} sélectionnée{pieces.length > 1 ? "s" : ""}
        </p>

        {/* Prix : le total réel des pièces résolues. Tant qu'elles ne le
            sont pas toutes, un espace réservé — jamais un total partiel qui
            grimpe sous les yeux du client. */}
        <p style={{
          fontFamily: fontHeading, fontSize: 30, color: ink,
          margin: "10px 0 0", lineHeight: 1,
        }}>
          {totalPret
            ? formatProductPrice(Math.round(total * 100) / 100, null, devise)
            : "…"}
        </p>

        {/* Résumé des critères en UNE ligne discrète (brief §4 : « éviter
            les gros blocs de score »). Le détail vit dans l'accordéon. */}
        {note && note.criteres.length > 0 && (
          <p style={{
            fontFamily: fontBody, fontSize: 12, color: textSecondary,
            margin: "8px 0 0", lineHeight: 1.5,
          }}>
            {note.criteres.slice(0, 4)
              .map((c) => `${c.libelle} ${Math.round((c.note / c.max) * 100)}%`)
              .join(" · ")}
          </p>
        )}

        <button
          type="button"
          onClick={onShopper}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            marginTop: 16, padding: "14px 22px", borderRadius: 999,
            background: ink, color: "#FAF8F4", border: "none", cursor: "pointer",
            fontFamily: fontBody, fontSize: 14.5, fontWeight: 600,
          }}
        >
          Shopper la tenue
          <span aria-hidden style={{ fontSize: 15 }}>→</span>
        </button>

        <button
          type="button"
          onClick={onSauvegarder}
          aria-pressed={sauvegardee}
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            alignSelf: "flex-start", marginTop: 10, padding: "6px 2px",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: fontBody, fontSize: 13.5,
            color: sauvegardee ? mojo : textSecondary,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden
            fill={sauvegardee ? "currentColor" : "none"} stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-6-4.5L6 21z" />
          </svg>
          {sauvegardee ? "Tenue sauvegardée" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}
