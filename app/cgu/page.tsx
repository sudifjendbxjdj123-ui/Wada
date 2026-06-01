"use client";
import Link from "next/link";
import { ink, paper, seal, border, sectionLabel, textSecondary } from "@/lib/styles";

/**
 * /cgu — Conditions Générales d'Utilisation.
 *
 * Brief 2026-06-01 « Pages légales complètes + Lancement » §2.
 * Texte verbatim. Champs [crochets] à remplir par Nem avant publication
 * officielle (IDE Suisse, structure juridique). Relecture avocat 30 min
 * (~150€) recommandée avant lancement public.
 */
export default function CGUPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 5% 0" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: ink, textDecoration: "none",
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <header style={{ textAlign: "center", padding: "40px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Conditions d&apos;utilisation</p>
            <h1 style={{ fontSize: 56, fontWeight: 500, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>CGU</h1>
          </header>
          <article style={{ fontSize: 16, lineHeight: 1.8, color: ink, fontFamily: "'Inter', sans-serif" }}>

            <h2 style={hStyle}>Préambule</h2>
            <p style={pStyle}>
              WADA (wada.style) est un service éditorial qui transforme les 348 palettes du peintre japonais
              Sanzo Wada en suggestions de tenues à acheter chez des marques partenaires. Le service est
              gratuit, et inclut une formule d&apos;abonnement Premium optionnelle.
            </p>
            <p style={pStyle}>
              L&apos;utilisation du site implique l&apos;acceptation pleine et entière des présentes conditions.
            </p>

            <h2 style={hStyle}>Article 1 — Objet du service</h2>
            <p style={pStyle}>WADA propose :</p>
            <ul style={ulStyle}>
              <li>Un dictionnaire de <strong>348 palettes de couleurs</strong> consultable gratuitement</li>
              <li>Un <strong>scanner de couleur</strong> et de <strong>vêtement</strong> (gratuit)</li>
              <li>Un <strong>styliste IA</strong> qui compose des tenues (gratuit)</li>
              <li>Une <strong>mise en relation</strong> avec des marques partenaires via des liens d&apos;affiliation</li>
              <li>Une formule <strong>Premium</strong> (optionnelle, payante) offrant des fonctionnalités avancées : recommandations personnalisées, calendrier de tenues, capsule garde-robe</li>
            </ul>

            <h2 style={hStyle}>Article 2 — Accès au service</h2>
            <p style={pStyle}>
              Le service est accessible 24 h/24, 7 j/7, hors maintenance technique. WADA ne garantit pas une
              disponibilité absolue.
            </p>

            <h2 style={hStyle}>Article 3 — Création de compte</h2>
            <p style={pStyle}>
              La création d&apos;un compte utilisateur est gratuite. Elle nécessite un email valide. Un seul
              compte par personne. L&apos;utilisateur s&apos;engage à fournir des informations exactes.
            </p>

            <h2 style={hStyle}>Article 4 — Achat et abonnement</h2>
            <p style={pStyle}>L&apos;abonnement Premium est facturé :</p>
            <ul style={ulStyle}>
              <li><strong>1,99 €/mois</strong> (sans engagement, résiliable à tout moment)</li>
              <li>ou <strong>17,99 €/an</strong> (équivalent à 1,50 €/mois — économie de 25 %)</li>
            </ul>
            <p style={pStyle}>
              Le paiement est sécurisé via <strong>Stripe</strong>. Aucune donnée bancaire n&apos;est stockée
              par WADA.
            </p>

            <h2 style={hStyle}>Article 5 — Droit de rétractation</h2>
            <p style={pStyle}>
              Conformément à la législation européenne, vous disposez d&apos;un délai de <strong>14 jours</strong> à
              compter du premier paiement pour vous rétracter et obtenir le remboursement intégral. Demande à
              envoyer à <a href="mailto:hello@wada.style" style={{ color: ink }}>hello@wada.style</a>.
            </p>
            <p style={pStyle}>
              Passé ce délai, l&apos;abonnement est non-remboursable, mais résiliable à tout moment depuis votre
              compte sans condition. La résiliation prend effet à la fin de la période en cours.
            </p>

            <h2 style={hStyle}>Article 6 — Liens d&apos;affiliation</h2>
            <p style={pStyle}>
              WADA contient des liens d&apos;affiliation vers des sites marchands tiers. Lorsque vous achetez
              via ces liens, WADA peut percevoir une <strong>commission</strong>, <strong>sans surcoût pour
              vous</strong>. Cette commission est notre principale source de revenus.
            </p>
            <p style={pStyle}>
              La sélection éditoriale des marques n&apos;est <strong>pas conditionnée</strong> au montant de
              la commission.
            </p>

            <h2 style={hStyle}>Article 7 — Responsabilité</h2>
            <p style={pStyle}>
              WADA ne vend aucun produit directement. Vous achetez chez les marques partenaires aux conditions
              qu&apos;elles fixent (livraison, retour, garantie, SAV). WADA ne peut être tenu responsable d&apos;un
              litige avec un marchand tiers.
            </p>
            <p style={pStyle}>
              WADA s&apos;efforce de proposer des recommandations cohérentes mais ne garantit pas que chaque
              tenue proposée vous conviendra parfaitement.
            </p>

            <h2 style={hStyle}>Article 8 — Données personnelles</h2>
            <p style={pStyle}>
              Voir notre <Link href="/confidentialite" style={{ color: ink, textDecoration: "underline" }}>Politique de confidentialité</Link>.
            </p>

            <h2 style={hStyle}>Article 9 — Modification des CGU</h2>
            <p style={pStyle}>
              WADA se réserve le droit de modifier ces CGU à tout moment. Les utilisateurs en sont informés
              par email 30 jours avant l&apos;entrée en vigueur des changements.
            </p>

            <h2 style={hStyle}>Article 10 — Droit applicable</h2>
            <p style={pStyle}>
              Les présentes CGU sont régies par le droit suisse. Tout litige sera porté devant les tribunaux
              compétents de Genève.
            </p>

            <p style={{ ...pStyle, fontStyle: "italic", marginTop: 32 }}>
              Dernière mise à jour : 1<sup>er</sup> juin 2026.
            </p>
          </article>
        </div>
      </div>
    </main>
  );
}

const hStyle: React.CSSProperties = { fontSize: 24, margin: "32px 0 16px", fontFamily: "'Fredoka', sans-serif", fontWeight: 600 };
const pStyle: React.CSSProperties = { color: textSecondary, marginBottom: 16 };
const ulStyle: React.CSSProperties = { color: textSecondary, marginBottom: 16, paddingLeft: 22, listStyle: "disc" };
