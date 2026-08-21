"use client";
import type { SlotKey } from "@/lib/registreEngine";
import type { ProduitLook } from "./LookComplet";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * ListePieces — « Chaque pièce de votre tenue ».
 *
 * Maquette client 2026-08-22 : les cinq grandes fiches verticales deviennent
 * une liste. Le raisonnement du client, sur la version précédente : « je ne
 * ferais pas quatre énormes cartes verticales comme actuellement ». Une fois
 * la tenue vue en haut de page, ce qu'on veut de chaque pièce tient sur une
 * ligne — marque, prix, et deux gestes : la garder, ou la remplacer.
 *
 * Le bouton ↻ répond à la demande « Je n'aime pas cette pièce » : « et
 * surtout, le reste de la tenue ne change pas ». D'où un remplacement slot
 * par slot, jamais une régénération complète.
 */

const LIBELLE: Record<SlotKey, string> = {
  veste: "Veste", haut: "Haut", bas: "Bas",
  chaussures: "Chaussures", accent: "Accessoire",
};

const ORDRE: SlotKey[] = ["veste", "haut", "bas", "chaussures", "accent"];

function visuel(p: ProduitLook | null | undefined): string | null {
  if (!p) return null;
  return p.imageLocal || p.largeImage || p.image || null;
}

function IconeCoeur({ plein }: { plein: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden
      fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 22l7.4-7.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

function IconeRemplacer({ enCours }: { enCours: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={enCours ? { animation: "wada-spin 0.8s linear infinite" } : undefined}>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export default function ListePieces({
  produits,
  couleurs,
  favoris,
  onFavori,
  onRemplacer,
  enRemplacement,
}: {
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
  /** Teinte prévue par slot, pour la pastille de gauche. */
  couleurs: Partial<Record<SlotKey, string>>;
  favoris: Set<string>;
  onFavori: (id: string) => void;
  onRemplacer: (slot: SlotKey) => void;
  /** Slot dont le remplacement est en cours — anime son ↻. */
  enRemplacement: SlotKey | null;
}) {
  const lignes = ORDRE
    .map((slot) => ({ slot, produit: produits[slot] ?? null }))
    .filter((l): l is { slot: SlotKey; produit: ProduitLook } => !!l.produit);

  if (lignes.length === 0) return null;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, marginBottom: 10,
      }}>
        <span style={{
          fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
          textTransform: "uppercase", color: ink, fontWeight: 600,
        }}>
          Chaque pièce de votre tenue
        </span>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: fontLabel, fontSize: 11, color: mojo,
        }}>
          Remplacer une pièce
          <IconeRemplacer enCours={false} />
        </span>
      </div>

      <ul style={{
        listStyle: "none", padding: 0, margin: 0,
        background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
        overflow: "hidden",
      }}>
        {lignes.map(({ slot, produit }, i) => {
          const img = visuel(produit);
          const aime = favoris.has(produit.id);
          return (
            <li
              key={slot}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 10px",
                borderTop: i === 0 ? "none" : `1px solid ${border}`,
              }}
            >
              <span style={{
                width: 40, height: 46, borderRadius: 8, flexShrink: 0,
                background: "#F6F3EE", border: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                )}
              </span>

              {/* Slot et pastille empilés sur une colonne étroite : côte à
                  côte, ils mangeaient 75 px et le nom du produit sortait en
                  « Surche… ». Empilés, la colonne tombe à 44 px. */}
              <span style={{
                width: 44, flexShrink: 0, display: "flex",
                flexDirection: "column", gap: 3, alignItems: "flex-start",
              }}>
                <span aria-hidden style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: couleurs[slot] || border,
                  border: `1px solid ${border}`,
                }} />
                <span style={{
                  fontFamily: fontLabel, fontSize: 7.5, letterSpacing: 0,
                  textTransform: "uppercase", color: textSecondary,
                  lineHeight: 1.2,
                }}>
                  {LIBELLE[slot]}
                </span>
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  fontFamily: fontBody, fontSize: 12.5, color: ink, lineHeight: 1.3,
                }}>
                  {produit.nom}
                </span>
                {produit.marque && (
                  <span style={{
                    display: "block", fontFamily: fontBody, fontSize: 10.5,
                    color: textSecondary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {produit.marque}
                  </span>
                )}
              </span>

              <span style={{
                fontFamily: fontLabel, fontSize: 12.5, color: ink,
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {formatProductPrice(produit.prix, produit.devise)}
              </span>

              <button
                type="button"
                onClick={() => onFavori(produit.id)}
                aria-pressed={aime}
                aria-label={aime ? "Retirer des favoris" : "Ajouter aux favoris"}
                style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  border: `1px solid ${border}`, background: "transparent",
                  color: aime ? mojo : textSecondary, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <IconeCoeur plein={aime} />
              </button>

              <button
                type="button"
                onClick={() => onRemplacer(slot)}
                disabled={enRemplacement === slot}
                aria-label={`Remplacer ${LIBELLE[slot].toLowerCase()}`}
                style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  border: `1px solid ${border}`, background: "transparent",
                  color: textSecondary,
                  cursor: enRemplacement === slot ? "wait" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <IconeRemplacer enCours={enRemplacement === slot} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
