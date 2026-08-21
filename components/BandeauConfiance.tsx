"use client";
import { border, ink, textSecondary, fontBody, fontLabel } from "@/lib/styles";

/**
 * BandeauConfiance — la barre de réassurance en bas de /boutique.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POURQUOI LE TEXTE DIFFÈRE DE LA MAQUETTE
 *
 * La maquette du 23/08 propose quatre promesses : « Livraison rapide 1-2
 * jours ouvrés », « Retours gratuits sous 30 jours », « Paiement sécurisé —
 * Carte, TWINT, PayPal », « Plus de 500 marques ».
 *
 * Trois d'entre elles engagent quelqu'un d'autre que WADA. Le site est
 * affilié : il ne prend pas le paiement, n'expédie rien et ne traite aucun
 * retour. C'est le marchand qui le fait, avec SES délais, SES frais de
 * retour et SES moyens de paiement — et ils changent d'un marchand à
 * l'autre. La fiche produit du site le dit déjà noir sur blanc :
 * « Livraison directe par [le marchand] ». Afficher « retours gratuits sous
 * 30 jours » sous un article dont la marque facture le retour, c'est une
 * promesse commerciale fausse : le client la découvre au moment où il veut
 * renvoyer sa commande, et c'est WADA qu'il tient pour responsable.
 *
 * Le bandeau garde donc la forme exacte de la maquette — quatre colonnes,
 * une icône, un titre, une précision — avec quatre affirmations que WADA
 * peut tenir. Le compte de marques, lui, est réel : il vient du catalogue.
 *
 * Si des accords marchands rendent les promesses d'origine vraies, il n'y a
 * qu'à remplacer les libellés ci-dessous par les conditions réelles.
 * ───────────────────────────────────────────────────────────────────────── */

function Camion() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}
function Etiquette() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 12.5 12 21l-8.5-8.5V4h8.5z" /><circle cx="8" cy="8" r="1.4" />
    </svg>
  );
}
function Nuancier() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="5" height="16" rx="1.4" />
      <rect x="9.5" y="4" width="5" height="16" rx="1.4" />
      <rect x="16" y="4" width="5" height="16" rx="1.4" />
    </svg>
  );
}
function Cadenas() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2.2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function BandeauConfiance({
  /** Nombre réel de marques du catalogue, remonté par /api/products. Tant
      qu'il n'est pas connu, la colonne annonce la sélection sans chiffre —
      plutôt qu'un « 500 » décoratif que l'index des marques démentirait. */
  marquesTotal,
}: { marquesTotal?: number | null }) {
  /* Arrondi à la centaine INFÉRIEURE : « plus de 500 marques » doit rester
     vrai même si le flux du jour en compte quelques-unes de moins. */
  const paquet = typeof marquesTotal === "number" && marquesTotal >= 100
    ? Math.floor(marquesTotal / 100) * 100
    : null;

  const colonnes = [
    {
      icone: <Etiquette />,
      titre: "Achat chez la marque",
      detail: "Aucun surcoût WADA",
    },
    {
      icone: <Camion />,
      titre: "Livraison par le marchand",
      detail: "Délais et retours selon la marque",
    },
    {
      icone: <Cadenas />,
      titre: "Paiement sur le site marchand",
      detail: "WADA ne reçoit aucun paiement",
    },
    {
      icone: <Nuancier />,
      titre: paquet ? `Plus de ${paquet} marques` : "Sélection de marques",
      detail: "Accordées aux 348 palettes Wada",
    },
  ];

  return (
    <section aria-label="Informations pratiques" style={{
      margin: "4px 0 26px", padding: "15px 14px", borderRadius: 16,
      border: `1px solid ${border}`, background: "#FFFDFA",
      display: "grid",
      /* Deux colonnes sur téléphone, quatre dès qu'il y a la place. Quatre
         colonnes sur 393 px donneraient 80 px par bloc : le titre y passerait
         sur trois lignes. */
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "14px 12px",
    }}>
      {colonnes.map((c) => (
        <div key={c.titre} style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
          <span aria-hidden style={{ color: textSecondary, flexShrink: 0, marginTop: 1 }}>
            {c.icone}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{
              display: "block", fontFamily: fontLabel, fontSize: 11.5,
              color: ink, fontWeight: 600, lineHeight: 1.3,
            }}>
              {c.titre}
            </span>
            <span style={{
              display: "block", marginTop: 2, fontFamily: fontBody, fontSize: 11.5,
              color: textSecondary, lineHeight: 1.35,
            }}>
              {c.detail}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
