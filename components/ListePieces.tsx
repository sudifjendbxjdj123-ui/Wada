"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SlotKey } from "@/lib/registreEngine";
import type { ProduitLook } from "./LookComplet";
import { formatProductPrice } from "@/lib/priceFormat";
import { addToCart } from "@/lib/cart";
import { showToast } from "@/lib/toast";
import {
  ink, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * ListePieces — « LES 5 PIÈCES », en lignes compactes.
 *
 * Refonte client 2026-08-23, au format exact de la maquette :
 *   [image 80 px] [CATÉGORIE · COULEUR / MARQUE / nom / Taille ▾] [prix + panier]
 *                                                    [chez {marchand}, discret]
 *
 * Trois règles de la maquette appliquées à la lettre :
 *  - le marchand affilié est DISCRET (« Disponible chez Kastner & Öhler »),
 *    plus jamais « via Awin · partenaire » en information principale ;
 *  - la taille s'ouvre en feuille basse SUR la ligne, pas sur une page à
 *    part. Le flux Awin remplit `tailles` par modèle quand le marchand les
 *    publie ; quand il ne les publie pas, la feuille le dit au lieu
 *    d'inventer un S-M-L décoratif ;
 *  - « Remplacer » ouvre un tiroir d'alternatives (RemplacerDrawer) — le
 *    reste de la tenue ne bouge pas.
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
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden
      fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 22l7.4-7.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

function IconePanier() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function IconeRemplacer({ enCours }: { enCours: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden
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

/* ── Feuille basse du sélecteur de taille ─────────────────────────────── */
function FeuilleTailles({
  produit, tailleChoisie, onChoisir, onFermer,
}: {
  produit: ProduitLook;
  tailleChoisie: string | null;
  onChoisir: (t: string) => void;
  onFermer: () => void;
}) {
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, []);

  const tailles = produit.tailles ?? [];

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Tailles — ${produit.nom}`}
      onClick={onFermer}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(30,26,22,.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(560px, 100%)", maxHeight: "70vh", overflowY: "auto",
        background: "#FFFDFA", borderRadius: "18px 18px 0 0",
        padding: "16px 18px calc(18px + env(safe-area-inset-bottom, 0px))",
      }}>
        <p style={{
          fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".13em",
          textTransform: "uppercase", color: textSecondary, margin: "0 0 4px",
        }}>
          Choisir la taille
        </p>
        <p style={{
          fontFamily: fontBody, fontSize: 14, color: ink, margin: "0 0 14px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {produit.marque ? `${produit.marque} — ` : ""}{produit.nom}
        </p>

        {tailles.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tailles.map((t) => {
              const actif = tailleChoisie === t;
              return (
                <button key={t} type="button"
                  onClick={() => { onChoisir(t); onFermer(); }}
                  aria-pressed={actif}
                  style={{
                    minWidth: 52, padding: "11px 12px", borderRadius: 12,
                    border: `1px solid ${actif ? ink : border}`,
                    background: actif ? ink : "transparent",
                    color: actif ? "#FAF8F4" : ink,
                    fontFamily: fontBody, fontSize: 13.5, cursor: "pointer",
                  }}>
                  {t}
                </button>
              );
            })}
          </div>
        ) : (
          /* Le marchand n'a pas publié ses tailles dans le flux : le dire
             vaut mieux qu'une grille S-M-L inventée qui mentirait une fois
             sur deux. */
          <p style={{
            fontFamily: fontBody, fontSize: 13.5, color: textSecondary,
            margin: 0, lineHeight: 1.5,
          }}>
            Ce marchand ne publie pas ses tailles dans notre catalogue —
            elles se choisissent sur sa page produit, ouverte par le bouton
            d&apos;achat.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default function ListePieces({
  produits,
  couleurs,
  favoris,
  onFavori,
  onRemplacer,
  enRemplacement,
  tailles,
  onTaille,
}: {
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
  /** Teinte prévue par slot — libellé « HAUT · CRÈME ». */
  couleurs: Partial<Record<SlotKey, string>>;
  favoris: Set<string>;
  onFavori: (id: string) => void;
  /** Ouvre le tiroir d'alternatives de ce slot. */
  onRemplacer: (slot: SlotKey) => void;
  enRemplacement: SlotKey | null;
  /** Taille choisie par slot (état parent — le récap d'achat la relit). */
  tailles: Partial<Record<SlotKey, string>>;
  onTaille: (slot: SlotKey, taille: string) => void;
}) {
  const [feuille, setFeuille] = useState<SlotKey | null>(null);

  const lignes = ORDRE
    .map((slot) => ({ slot, produit: produits[slot] ?? null }))
    .filter((l): l is { slot: SlotKey; produit: ProduitLook } => !!l.produit);

  if (lignes.length === 0) return null;

  const produitFeuille = feuille ? produits[feuille] : null;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: ink, fontWeight: 600,
        margin: "0 0 10px",
      }}>
        Les {lignes.length} pièces
      </p>

      <ul style={{
        listStyle: "none", padding: 0, margin: 0,
        background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 16,
        overflow: "hidden",
      }}>
        {lignes.map(({ slot, produit }, i) => {
          const img = visuel(produit);
          const aime = favoris.has(produit.id);
          const tailleChoisie = tailles[slot] ?? null;
          return (
            <li key={slot} id={`piece-${slot}`} style={{
              display: "flex", gap: 12, padding: "12px 12px",
              borderTop: i === 0 ? "none" : `1px solid ${border}`,
              scrollMarginTop: 16,
            }}>
              {/* Vignette */}
              <span style={{
                width: 84, height: 100, borderRadius: 10, overflow: "hidden",
                background: "#FFFFFF", border: `1px solid ${border}`,
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={produit.nom} loading="lazy" decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                ) : (
                  <span aria-hidden style={{
                    width: 40, height: 52, borderRadius: 8,
                    background: couleurs[slot] || "#E5DFD2", opacity: .6,
                  }} />
                )}
              </span>

              {/* Infos */}
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{
                  fontFamily: fontLabel, fontSize: 9.5, letterSpacing: ".13em",
                  textTransform: "uppercase", color: textSecondary, fontWeight: 600,
                }}>
                  {LIBELLE[slot]}{produit.couleurNom ? ` · ${produit.couleurNom}` : ""}
                </span>
                {produit.marque && (
                  <span style={{
                    fontFamily: fontLabel, fontSize: 12.5, letterSpacing: ".05em",
                    textTransform: "uppercase", color: ink, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {produit.marque}
                  </span>
                )}
                <a href={produit.urlProduit} target="_blank" rel="noopener noreferrer sponsored"
                  style={{
                    /* `ink`, pas `seal` : seal est un bleu-canard et rendait le
                       nom du produit bleu lien-hypertexte — défaut déjà corrigé
                       une fois sur les cartes catalogue. */
                    fontFamily: fontBody, fontSize: 13, color: ink,
                    textDecoration: "none", lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                  {produit.nom}
                </a>

                {/* Taille + Remplacer, sur la même ligne d'actions. */}
                <span style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setFeuille(slot)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      fontFamily: fontBody, fontSize: 12.5, color: ink,
                    }}>
                    Taille{tailleChoisie ? ` : ${tailleChoisie}` : ""}
                    <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden fill="none"
                      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => onRemplacer(slot)}
                    disabled={enRemplacement === slot}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      fontFamily: fontBody, fontSize: 12.5, color: mojo,
                    }}>
                    <IconeRemplacer enCours={enRemplacement === slot} />
                    Remplacer
                  </button>
                </span>

                {/* Marchand affilié — discret (brief §5). */}
                {produit.marchand && (
                  <span style={{
                    fontFamily: fontBody, fontSize: 11, color: textSecondary,
                    marginTop: 4,
                  }}>
                    Disponible chez {produit.marchand}
                  </span>
                )}
              </span>

              {/* Prix + actions */}
              <span style={{
                display: "flex", flexDirection: "column", alignItems: "flex-end",
                justifyContent: "space-between", gap: 6, flexShrink: 0,
              }}>
                <span style={{ fontFamily: fontLabel, fontSize: 14.5, color: ink, fontWeight: 600 }}>
                  {formatProductPrice(produit.prix, produit.marchandSlug ?? null, produit.devise)}
                </span>
                <span style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => onFavori(produit.id)}
                    aria-pressed={aime}
                    aria-label={aime ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "none", background: "transparent", cursor: "pointer",
                      color: aime ? mojo : "rgba(30,30,30,.55)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <IconeCoeur plein={aime} />
                  </button>
                  <button type="button"
                    onClick={() => {
                      addToCart({
                        piece: LIBELLE[slot],
                        item: produit.nom,
                        colorName: produit.couleurNom || "",
                        colorHex: couleurs[slot] || "",
                        query: produit.nom,
                        fromEntry: "",
                      });
                      showToast("Ajouté au panier ✓");
                    }}
                    aria-label={`Ajouter ${produit.nom} au panier`}
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "none", background: ink, color: "#FAF8F4",
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                    <IconePanier />
                  </button>
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {feuille && produitFeuille && (
        <FeuilleTailles
          produit={produitFeuille}
          tailleChoisie={tailles[feuille] ?? null}
          onChoisir={(t) => onTaille(feuille, t)}
          onFermer={() => setFeuille(null)}
        />
      )}
    </div>
  );
}
