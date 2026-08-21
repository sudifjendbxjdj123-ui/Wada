"use client";
import { useMemo } from "react";
import type { RegistreOutfit, SlotKey } from "@/lib/registreEngine";
import { legendePalette, rolesCouleurs, libelleRole } from "@/lib/composer/rolesCouleurs";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, seal, border, cardBg, textSecondary,
  fontHeading, fontBody, fontLabel, cardRadius,
} from "@/lib/styles";

/**
 * LookComplet — « Votre tenue », toutes les pièces visibles d'un coup.
 *
 * Retour client 2026-08-21 : « Ça ressemble encore davantage à une page de
 * résultat qu'à une page qui donne envie d'acheter la tenue. Le changement
 * principal : arrêter de présenter une succession de produits et commencer à
 * présenter un LOOK. » Et le symptôme précis : « Ta chemise occupe
 * pratiquement tout l'écran » — il fallait scroller avant de comprendre à
 * quoi ressemblait la tenue.
 *
 * D'où cette vue d'ensemble, placée AVANT les fiches produit : quatre ou cinq
 * vignettes côte à côte, et sous chacune le rôle qu'elle joue dans la
 * composition. Les fiches détaillées restent en dessous, inchangées.
 *
 * La légende palette → vêtements répond au second point : « l'utilisateur
 * comprend immédiatement que les couleurs Sanzō Wada ne sont pas juste une
 * décoration en haut de l'écran ».
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

export default function LookComplet({
  outfit,
  produits,
  onVoirPiece,
}: {
  outfit: RegistreOutfit;
  /** Produits résolus, par slot. Une entrée manquante affiche la teinte seule. */
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
  /** Fait défiler jusqu'à la fiche détaillée de la pièce. */
  onVoirPiece?: (slot: SlotKey) => void;
}) {
  const places = useMemo(() => rolesCouleurs(outfit), [outfit]);
  const legende = useMemo(() => legendePalette(outfit), [outfit]);

  /* Ordre de lecture d'une silhouette : ce qu'on voit en premier de loin
     (la veste), puis le haut, le bas, et enfin ce qui ponctue. */
  const pieces = ORDRE
    .map((slot) => {
      const place = places.find((p) => p.slot === slot);
      const s = outfit.slots.find((x) => x.slot === slot);
      return place && s ? { slot, place, type: s.type, produit: produits[slot] ?? null } : null;
    })
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* ── Les pièces, ensemble ───────────────────────────────────────── */}
      <div style={{
        display: "grid",
        /* 60 px de minimum, pas 96 : mesuré en 393 px de large, un minimum de
           96 ne laissait passer que TROIS vignettes par ligne — la tenue se
           lisait sur deux rangées, et la seconde tombait sous la ligne de
           flottaison. Tout l'intérêt de cette vue est de comprendre la
           proposition d'un seul coup d'œil, donc les cinq pièces doivent
           tenir sur une rangée. À 60, la rangée compte 5 colonnes sur
           téléphone et s'élargit sur grand écran. */
        gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
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
                display: "block", textAlign: "left", padding: 0,
                background: "none", border: "none",
                cursor: onVoirPiece ? "pointer" : "default",
                font: "inherit", color: "inherit",
                /* Sans ça, la colonne prend la largeur du mot le plus long :
                   « ACCESSOIRE » débordait de sa vignette et poussait la
                   cinquième pièce hors de la rangée. Les cellules de grille
                   ont `min-width: auto` par défaut, pas 0. */
                minWidth: 0,
              }}
            >
              <div style={{
                aspectRatio: "3 / 4", borderRadius: 12, overflow: "hidden",
                background: place.hex, border: `1px solid ${border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                {/* Pastille de teinte incrustée sur l'image plutôt que posée
                    devant le libellé : sur une colonne de 62 px, elle volait
                    11 px et faisait tronquer « CHAUSSURES » en « CHAUSS… ». */}
                <span aria-hidden style={{
                  position: "absolute", left: 5, bottom: 5,
                  width: 11, height: 11, borderRadius: "50%",
                  background: place.hex,
                  boxShadow: "0 0 0 1.5px rgba(255,255,255,.85)",
                }} />
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img} alt={produit?.nom || type} loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  /* Pas encore de produit : on montre au moins la teinte
                     prévue, plutôt qu'un carré vide. */
                  <span style={{
                    fontFamily: fontLabel, fontSize: 10, letterSpacing: ".08em",
                    color: "rgba(30,30,30,.45)", textTransform: "uppercase",
                    padding: 6, textAlign: "center",
                  }}>
                    {place.nom}
                  </span>
                )}
              </div>

              {/* Sur une colonne de ~62 px, chaque ligne compte : la pastille
                  de teinte rejoint le libellé de slot au lieu d'occuper la
                  sienne, et le nom du produit est borné à deux lignes. Le
                  détail complet reste sur la fiche, plus bas. */}
              <p style={{
                fontFamily: fontLabel, fontSize: 9, letterSpacing: ".02em",
                textTransform: "uppercase", color: textSecondary,
                margin: "6px 0 2px", minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {place.libelleSlot}
              </p>
              <p style={{
                fontFamily: fontBody, fontSize: 11, color: ink,
                margin: 0, lineHeight: 1.3,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
                /* Hauteur de deux lignes réservée même quand le nom en tient
                   une seule : sinon les prix se décalaient d'une vignette à
                   l'autre et la rangée avait l'air bancale. */
                minHeight: "2.6em",
              }}>
                {produit?.nom || type}
              </p>
              {produit && (
                <p style={{ fontFamily: fontLabel, fontSize: 11, color: ink, margin: "2px 0 0" }}>
                  {formatProductPrice(produit.prix, produit.devise)}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Palette → vêtements ────────────────────────────────────────── */}
      <div style={{
        marginTop: 18, background: cardBg, border: `1px solid ${border}`,
        borderRadius: cardRadius, padding: "14px 16px",
      }}>
        <p style={{
          fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
          textTransform: "uppercase", color: textSecondary, margin: "0 0 10px",
        }}>
          La palette dans la tenue
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {legende.map((l) => (
            <li key={l.hex} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                background: l.hex, border: `1px solid ${border}`,
              }} />
              <span style={{ fontFamily: fontBody, fontSize: 13, color: ink, minWidth: 0 }}>
                {l.nom}
              </span>
              <span aria-hidden style={{ color: textSecondary, fontSize: 12 }}>→</span>
              <span style={{ fontFamily: fontBody, fontSize: 13, color: seal, flex: 1, minWidth: 0 }}>
                {l.pieces.join(" · ")}
              </span>
              <span style={{
                fontFamily: fontLabel, fontSize: 10, letterSpacing: ".06em",
                textTransform: "uppercase", color: textSecondary,
                whiteSpace: "nowrap",
              }}>
                {libelleRole(l.role)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
