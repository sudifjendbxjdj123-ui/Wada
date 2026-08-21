"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { SlotKey } from "@/lib/registreEngine";
import type { ProduitLook } from "./LookComplet";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, seal, border, paper, cardBg, textSecondary, mojo,
  fontHeading, fontBody, fontLabel, cardRadius,
} from "@/lib/styles";

/**
 * ShopperLaTenue — barre d'achat permanente + feuille de sélection.
 *
 * Retour client 2026-08-21 : « Un CTA d'achat permanent. C'est probablement
 * ce qui manque le plus commercialement. [...] L'utilisateur peut décocher ce
 * qu'il possède déjà. Ça devient beaucoup plus intéressant pour ton système
 * d'affiliation : tu ne présentes plus simplement quatre liens ; tu construis
 * un panier de look. »
 *
 * Contrainte réelle : WADA est un site d'affiliation, pas un marchand. On ne
 * peut pas « acheter les 4 pièces » en un paiement — chaque pièce vit sur le
 * site de son marchand. La feuille ouvre donc les liens retenus, et le dit
 * franchement plutôt que de promettre un panier unique qui n'existe pas.
 *
 * Détails d'implémentation :
 *  - la barre est en `position: fixed` et rendue en PORTAIL sur `document.body`.
 *    La page /ma-tenue contient des conteneurs avec `contain` / `transform`,
 *    qui redéfinissent le bloc conteneur d'un élément fixed et le feraient
 *    défiler avec la section au lieu de rester collé au bas de l'écran.
 *  - elle se place au-dessus de la barre de navigation, via la même variable
 *    CSS `--wada-tabbar-h` (qui inclut déjà la zone sûre iOS).
 */

const LIBELLE_SLOT: Record<SlotKey, string> = {
  veste: "Veste", haut: "Haut", bas: "Bas",
  chaussures: "Chaussures", accent: "Accessoire",
};

const ORDRE: SlotKey[] = ["veste", "haut", "bas", "chaussures", "accent"];

export default function ShopperLaTenue({
  produits,
}: {
  produits: Partial<Record<SlotKey, ProduitLook | null>>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [montee, setMontee] = useState(false);
  /* Slots que le client a décochés — « je l'ai déjà ». */
  const [exclus, setExclus] = useState<Set<SlotKey>>(new Set());

  useEffect(() => setMontee(true), []);

  /* Empêche la page de défiler derrière la feuille ouverte. */
  useEffect(() => {
    if (!ouvert) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, [ouvert]);

  const disponibles = useMemo(
    () => ORDRE
      .map((slot) => ({ slot, produit: produits[slot] ?? null }))
      .filter((x): x is { slot: SlotKey; produit: ProduitLook } => !!x.produit?.urlProduit),
    [produits],
  );

  const retenus = disponibles.filter((x) => !exclus.has(x.slot));
  const total = retenus.reduce((a, x) => a + (x.produit.prix || 0), 0);
  const devise = disponibles[0]?.produit.devise || "EUR";

  /* Rien de cliquable tant qu'aucun produit n'est résolu : afficher une barre
     « 0 pièce · 0 € » pendant le chargement serait pire que pas de barre. */
  if (!montee || disponibles.length === 0) return null;

  const basculer = (slot: SlotKey) => {
    setExclus((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(slot)) suivant.delete(slot); else suivant.add(slot);
      return suivant;
    });
  };

  const ouvrirTout = () => {
    /* Les navigateurs bloquent les ouvertures multiples non déclenchées par
       un geste ; celles-ci le sont (clic direct), mais on garde le premier
       onglet en tête pour que le client voie qu'il se passe quelque chose. */
    for (const { produit } of retenus) {
      window.open(produit.urlProduit, "_blank", "noopener,noreferrer");
    }
  };

  const barre = (
    <div
      style={{
        position: "fixed", left: 0, right: 0,
        bottom: "var(--wada-tabbar-h, 78px)",
        zIndex: 60,
        padding: "10px 5%",
        background: "rgba(250,248,244,.94)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: `1px solid ${border}`,
      }}
    >
      <div style={{
        maxWidth: 720, margin: "0 auto",
        display: "flex", alignItems: "center", gap: 11,
      }}>
        <span aria-hidden style={{ color: ink, flexShrink: 0, display: "flex" }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h16l-1 12H5L4 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </span>
        <div style={{ minWidth: 0, flexShrink: 0 }}>
          <p style={{
            fontFamily: fontLabel, fontSize: 9.5, letterSpacing: ".08em",
            textTransform: "uppercase", color: textSecondary, margin: 0,
            whiteSpace: "nowrap",
          }}>
            {retenus.length} pièce{retenus.length > 1 ? "s" : ""} sélectionnée{retenus.length > 1 ? "s" : ""}
          </p>
          <p style={{ fontFamily: fontHeading, fontSize: 18, color: ink, margin: "1px 0 0" }}>
            {formatProductPrice(total, null, devise)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOuvert(true)}
          style={{
            flex: 1, minWidth: 0,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px 14px", borderRadius: 999, border: "none",
            background: mojo, color: "#fff", cursor: "pointer",
            fontFamily: fontLabel, fontSize: 11.5, fontWeight: 600,
            letterSpacing: ".05em", textTransform: "uppercase",
            /* Sans ça, « Shopper la tenue » se coupait en deux lignes et la
               barre grandissait d'un cran. */
            whiteSpace: "nowrap",
          }}
        >
          Shopper la tenue
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );

  const feuille = ouvert && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Votre tenue"
      style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", alignItems: "flex-end" }}
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={() => setOuvert(false)}
        style={{
          position: "absolute", inset: 0, border: "none", padding: 0,
          background: "rgba(30,30,30,.42)", cursor: "pointer",
        }}
      />
      <div style={{
        position: "relative", width: "100%", maxWidth: 640, margin: "0 auto",
        background: paper, borderRadius: `${cardRadius} ${cardRadius} 0 0`,
        padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
        maxHeight: "84vh", overflowY: "auto",
        boxShadow: "0 -8px 30px -12px rgba(30,30,30,.28)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontFamily: fontHeading, fontSize: 20, color: ink, margin: 0 }}>
            Votre tenue
          </h2>
          <span style={{ fontFamily: fontHeading, fontSize: 18, color: ink }}>
            {formatProductPrice(total, null, devise)}
          </span>
        </div>
        <p style={{
          fontFamily: fontBody, fontSize: 13, color: textSecondary,
          lineHeight: 1.5, margin: "8px 0 16px",
        }}>
          Décochez ce que vous avez déjà. Chaque pièce s'ouvre sur le site de
          son marchand — WADA ne vend pas directement.
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {disponibles.map(({ slot, produit }) => {
            const actif = !exclus.has(slot);
            return (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => basculer(slot)}
                  aria-pressed={actif}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", textAlign: "left", cursor: "pointer",
                    background: actif ? cardBg : "transparent",
                    border: `1px solid ${border}`, borderRadius: 12,
                    opacity: actif ? 1 : 0.5,
                    font: "inherit", color: "inherit",
                  }}
                >
                  <span aria-hidden style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${actif ? mojo : border}`,
                    background: actif ? mojo : "transparent",
                    color: "#fff", fontSize: 12, lineHeight: "18px", textAlign: "center",
                  }}>
                    {actif ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: "block", fontFamily: fontLabel, fontSize: 10,
                      letterSpacing: ".1em", textTransform: "uppercase", color: textSecondary,
                    }}>
                      {LIBELLE_SLOT[slot]}
                    </span>
                    <span style={{
                      display: "block", fontFamily: fontBody, fontSize: 13.5, color: seal,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {produit.nom}
                    </span>
                  </span>
                  <span style={{ fontFamily: fontLabel, fontSize: 13, color: ink, whiteSpace: "nowrap" }}>
                    {formatProductPrice(produit.prix, null, produit.devise)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={ouvrirTout}
          disabled={retenus.length === 0}
          style={{
            width: "100%", marginTop: 16, padding: "15px 16px", borderRadius: 999,
            border: "none", cursor: retenus.length ? "pointer" : "not-allowed",
            background: retenus.length ? mojo : border,
            color: retenus.length ? "#fff" : textSecondary,
            fontFamily: fontLabel, fontSize: 13, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
          }}
        >
          {retenus.length === 0
            ? "Sélectionnez au moins une pièce"
            : `Ouvrir les ${retenus.length} pièce${retenus.length > 1 ? "s" : ""}`}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          style={{
            width: "100%", marginTop: 8, padding: "10px", background: "none",
            border: "none", cursor: "pointer",
            fontFamily: fontLabel, fontSize: 12, letterSpacing: ".08em",
            textTransform: "uppercase", color: textSecondary,
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );

  return createPortal(<>{barre}{feuille}</>, document.body);
}
