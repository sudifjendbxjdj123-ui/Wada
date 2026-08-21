"use client";
import { useMemo } from "react";
import type { RegistreOutfit, SlotKey } from "@/lib/registreEngine";
import type { NoteTenue } from "@/lib/composer/scoreTenue";
import { rolesCouleurs } from "@/lib/composer/rolesCouleurs";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * LookComplet — la carte « Votre tenue ».
 *
 * Maquette client 2026-08-22. Elle règle en une carte ce que la page disait
 * en trois sections empilées : ce que WADA propose (les pièces), ce que ça
 * vaut (le match), et combien ça coûte (le CTA).
 *
 * Deux choix repris de la maquette et qui changent le sens de la page :
 *
 *  - sous chaque vignette, on affiche le NOM DE LA TEINTE, pas le nom du
 *    produit. « Sauge tendre », « Lait », « Mousse », « Chocolat ». Le nom
 *    commercial est en dessous, dans la liste des pièces. Ici on lit la
 *    palette portée — c'est la promesse de WADA, et elle devient vérifiable
 *    d'un coup d'œil.
 *
 *  - les quatre critères passent en rangée d'icônes chiffrées plutôt qu'en
 *    barres empilées. Même information, un quart de la hauteur, et ça tient
 *    dans la carte au lieu de pousser le CTA hors de l'écran.
 */

export type ProduitLook = {
  id: string;
  nom: string;
  marque?: string;
  prix: number;
  devise: string;
  urlProduit: string;
  image?: string;
  imageLocal?: string;
  largeImage?: string;
};

const ORDRE: SlotKey[] = ["veste", "haut", "bas", "chaussures", "accent"];

function visuel(p: ProduitLook | null | undefined): string | null {
  if (!p) return null;
  return p.imageLocal || p.largeImage || p.image || null;
}

/* Icônes des quatre critères — tracées inline : quatre glyphes de 16 px ne
   justifient pas une dépendance, et un emoji ne se colorise pas. */
function Icone({ nom, taille = 16 }: { nom: string; taille?: number }) {
  const commun = {
    width: taille, height: taille, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.6,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (nom) {
    case "couleurs":   // palette de peintre
      return (
        <svg {...commun}>
          <path d="M12 3a9 9 0 1 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1-.24-.27-.39-.62-.39-1 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Z" />
          <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "proportions": // quatre carrés = équilibre des volumes
      return (
        <svg {...commun}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "styles":      // t-shirt
      return (
        <svg {...commun}>
          <path d="M8 3 4 5.5 5.5 10 8 9v11h8V9l2.5 1L20 5.5 16 3a4 4 0 0 1-8 0Z" />
        </svg>
      );
    case "occasion":    // calendrier
      return (
        <svg {...commun}>
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "sac":
      return (
        <svg {...commun}>
          <path d="M4 8h16l-1 12H5L4 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "fleche":
      return (
        <svg {...commun} strokeWidth={2}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

const CRITERES = [
  { cle: "couleurs", label: "Couleurs" },
  { cle: "proportions", label: "Coupe" },
  { cle: "styles", label: "Style" },
  { cle: "occasion", label: "Occasion" },
] as const;

export default function LookComplet({
  outfit,
  produits,
  note,
  onVoirPiece,
  onVoirLaTenue,
}: {
  outfit: RegistreOutfit;
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
  note: NoteTenue | null;
  onVoirPiece?: (slot: SlotKey) => void;
  onVoirLaTenue?: () => void;
}) {
  const places = useMemo(() => rolesCouleurs(outfit), [outfit]);

  const pieces = ORDRE
    .map((slot) => {
      const place = places.find((p) => p.slot === slot);
      const s = outfit.slots.find((x) => x.slot === slot);
      return place && s ? { slot, place, type: s.type, produit: produits[slot] ?? null } : null;
    })
    .filter((p): p is NonNullable<typeof p> => !!p);

  const resolus = pieces.map((p) => p.produit).filter((p): p is ProduitLook => !!p);
  const total = resolus.reduce((a, p) => a + (p.prix || 0), 0);
  const devise = resolus[0]?.devise || "EUR";

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto",
      background: "#FFFDFA", border: `1px solid ${border}`,
      borderRadius: 20, padding: "16px 16px 14px",
      boxShadow: "0 10px 30px -22px rgba(30,30,30,.4)",
    }}>
      {/* ── Titre + match ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, marginBottom: 14,
      }}>
        <span style={{
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
          textTransform: "uppercase", color: ink, fontWeight: 600,
        }}>
          Votre tenue
        </span>
        {note && (
          <span style={{
            display: "inline-flex", alignItems: "baseline", gap: 7,
            background: "rgba(30,30,30,.045)", borderRadius: 999,
            padding: "5px 11px",
          }}>
            <span style={{
              fontFamily: fontLabel, fontSize: 9.5, letterSpacing: ".1em",
              textTransform: "uppercase", color: textSecondary,
            }}>
              Wada match
            </span>
            <span style={{ fontFamily: fontHeading, fontSize: 17, color: mojo, lineHeight: 1 }}>
              {note.total}%
            </span>
          </span>
        )}
      </div>

      {/* ── Les pièces ────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(pieces.length, 5)}, minmax(0, 1fr))`,
        gap: 8,
      }}>
        {pieces.map(({ slot, place, type, produit }) => {
          const img = visuel(produit);
          return (
            <button
              key={slot}
              type="button"
              onClick={onVoirPiece ? () => onVoirPiece(slot) : undefined}
              aria-label={`${place.libelleSlot} — ${produit?.nom || type}`}
              style={{
                display: "block", textAlign: "left", padding: 0, minWidth: 0,
                background: "none", border: "none", font: "inherit", color: "inherit",
                cursor: onVoirPiece ? "pointer" : "default",
              }}
            >
              <div style={{
                aspectRatio: "1 / 1", borderRadius: 12, overflow: "hidden",
                /* Fond neutre, pas la teinte : la maquette pose les produits
                   sur du blanc cassé pour qu'on juge la couleur du VÊTEMENT,
                   pas celle de la vignette. La teinte reste dite en toutes
                   lettres sous la photo. */
                background: img ? "#F6F3EE" : place.hex,
                border: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={produit?.nom || type} loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  /* Pas de photo (produit pas encore résolu) : on montre la
                     teinte prévue en fond, et rien d'écrit — le libellé du
                     slot est déjà juste en dessous, l'afficher ici donnait
                     « VESTE / VESTE ». */
                  <span aria-hidden />
                )}
              </div>
              <p style={{
                /* 8 px sans interlettrage : « CHAUSSURES » et « ACCESSOIRE »
                   sortaient tronqués sur des colonnes de ~62 px. */
                fontFamily: fontLabel, fontSize: 8, letterSpacing: 0,
                textTransform: "uppercase", color: ink, fontWeight: 600,
                margin: "8px 0 1px", minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {place.libelleSlot}
              </p>
              {/* Le nom de la TEINTE, pas celui du produit — voir l'en-tête. */}
              <p style={{
                fontFamily: fontBody, fontSize: 11, color: textSecondary,
                margin: 0, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {place.nom}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Les quatre critères ───────────────────────────────────────── */}
      {note && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 6, marginTop: 14, paddingTop: 13, borderTop: `1px solid ${border}`,
        }}>
          {CRITERES.map(({ cle, label }) => {
            const c = note.criteres.find((x) => x.cle === cle);
            if (!c) return null;
            const pc = Math.round((c.note / c.max) * 100);
            return (
              <div key={cle} style={{ display: "flex", gap: 7, alignItems: "center", minWidth: 0 }}>
                <span style={{ color: textSecondary, flexShrink: 0, display: "flex" }}>
                  <Icone nom={cle} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{
                    display: "block", fontFamily: fontLabel, fontSize: 8.5,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    color: textSecondary,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: fontHeading, fontSize: 14, color: ink }}>
                    {pc}
                    <span style={{ fontSize: 9, color: textSecondary }}>%</span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Prix + CTA ────────────────────────────────────────────────── */}
      {resolus.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginTop: 13,
          background: "rgba(30,30,30,.035)", borderRadius: 14, padding: "10px 12px",
        }}>
          <span style={{ color: textSecondary, flexShrink: 0, display: "flex" }}>
            <Icone nom="sac" taille={20} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: "block", fontFamily: fontBody, fontSize: 11.5, color: textSecondary,
            }}>
              {/* « dès » et non « = » : toutes les pièces ne sont pas
                  toujours résolues, et le client peut en décocher. */}
              Tenue complète dès
            </span>
            <span style={{ fontFamily: fontHeading, fontSize: 17, color: ink }}>
              {formatProductPrice(total, null, devise)}
            </span>
          </span>
          <button
            type="button"
            onClick={onVoirLaTenue}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 15px", borderRadius: 999, border: "none",
              background: mojo, color: "#fff", cursor: "pointer",
              fontFamily: fontLabel, fontSize: 11.5, fontWeight: 600,
              letterSpacing: ".07em", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Voir la tenue
            <Icone nom="fleche" taille={14} />
          </button>
        </div>
      )}
    </div>
  );
}
