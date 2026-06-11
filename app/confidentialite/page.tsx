"use client";
import Link from "next/link";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";

export default function ConfidentialitePage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            {/* Brief audit 2026-05-28 : back button standardisé. */}
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
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Vie privée</p>
            <h1 style={{ fontSize: 56, fontWeight: 400, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>Politique de confidentialité</h1>
          </header>
          <article style={{ fontSize: 16, lineHeight: 1.8, color: ink, fontFamily: "'Inter', sans-serif" }}>

            <p style={{ color: textSecondary, marginBottom: 24, fontStyle: "italic" }}>
              La présente politique respecte la <strong>Loi fédérale suisse sur la protection des données (nLPD)</strong>, ainsi que le <strong>Règlement Général sur la Protection des Données (RGPD)</strong> pour les visiteurs de l'Union européenne.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>1. Responsable du traitement</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Nemanja Milosevic — 66 Rue des Vollandes, 1207 Genève, Suisse<br/>
              Email : <a href="mailto:hello@wada.style" style={{ color: ink }}>hello@wada.style</a>
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>2. Données que nous collectons</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>WADA collecte un minimum de données :</p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Localement (votre navigateur uniquement) :</strong> palettes favorites, panier, préférence de thème (clair/sombre), abonnement newsletter. <strong>Aucune de ces données n'est envoyée sur nos serveurs.</strong></li>
              <li><strong>Via Stripe (si vous souscrivez à WADA Premium) :</strong> email, moyen de paiement (tokenisé), adresse de facturation. Stripe est notre seul prestataire de paiement, certifié PCI-DSS niveau 1.</li>
              <li><strong>Newsletter :</strong> votre adresse email, stockée localement dans votre navigateur. Désabonnement immédiat en effaçant les données du site.</li>
            </ul>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>3. Cookies et traceurs</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Cookies first-party (déposés par wada.style) :</strong> aucun. WADA n'utilise pas de cookies de session, de tracking ou d'analyse côté serveur.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Outils d'analyse / publicité :</strong> aucun. WADA n'intègre pas Google Analytics, Google Tag Manager, Meta Pixel, TikTok Pixel, Hotjar, Mixpanel ou tout équivalent.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Stockage local :</strong> WADA utilise exclusivement le <code style={{ background: "rgba(31,27,22,0.06)", padding: "1px 6px", borderRadius: 3, fontSize: 13 }}>localStorage</code> de votre navigateur (palettes favorites, panier, préférence de thème, choix de genre pour le filtre catalogue). Ces données restent sur votre appareil — elles ne sont jamais transmises à un serveur. Vous pouvez les effacer à tout moment depuis les réglages de votre navigateur.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Cookies tiers (déposés par les services intégrés) :</strong>
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Stripe</strong> (seulement sur les pages de paiement) — cookies essentiels pour la sécurité et la prévention de fraude. Pas de cookies marketing.</li>
              <li><strong>Programmes d'affiliation</strong> (voir section 4) — déposés uniquement quand vous cliquez sur un lien sortant vers un marchand partenaire.</li>
            </ul>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>4. Liens et programmes d'affiliation</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Quand vous cliquez sur un lien d'achat vers une de nos boutiques partenaires, vous quittez WADA et entrez sur le site de la boutique, qui possède sa propre politique de confidentialité.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Programmes d'affiliation utilisés par WADA :</strong>
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Awin</strong> (publisher ID 2879911) — réseau d'affiliation pour marques mode et lifestyle européennes. Cookie de suivi déposé pour 30 jours typiquement, attribue la vente à WADA si vous achetez. <a href="https://www.awin.com/fr/legal/politique-de-confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: ink }}>Politique Awin</a>.</li>
              <li><strong>Amazon Associates</strong> (tag wadastyle-21) — programme d'affiliation Amazon. Cookie déposé pour 24 heures (10 jours pour un panier validé). <a href="https://www.amazon.fr/gp/help/customer/display.html?nodeId=GVP69FUNYG8DKEY3" target="_blank" rel="noopener noreferrer" style={{ color: ink }}>Politique Amazon</a>.</li>
            </ul>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Ces cookies servent <strong>uniquement à l'attribution de la vente</strong> (suivi anonyme du parcours d'achat), pas au profilage publicitaire. Vous pouvez les refuser via les réglages de votre navigateur ou via un bloqueur (uBlock, Brave, etc.).
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>4 bis. Application native (iOS / Android)</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Si vous utilisez l'application native WADA (publiée via Capacitor sur l'App Store / Play Store), les liens sortants s'ouvrent dans le navigateur in-app du système (<strong>SFSafariViewController</strong> sur iOS, <strong>Chrome Custom Tabs</strong> sur Android). Le comportement de stockage de cookies est identique à un navigateur web standard. WADA ne collecte aucune donnée supplémentaire dans le mode natif (pas de tracking d'usage in-app, pas de notifications push sans consentement explicite).
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>5. Vos droits</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Conformément à la loi suisse (nLPD) et au RGPD européen, vous disposez des droits suivants :
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Accès :</strong> demander quelles données nous avons sur vous.</li>
              <li><strong>Rectification :</strong> corriger des informations inexactes.</li>
              <li><strong>Effacement :</strong> demander la suppression de toutes vos données (« droit à l'oubli »).</li>
              <li><strong>Portabilité :</strong> récupérer vos données dans un format lisible.</li>
              <li><strong>Opposition :</strong> retirer votre consentement à tout moment.</li>
            </ul>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Pour exercer vos droits : <a href="mailto:hello@wada.style" style={{ color: ink }}>hello@wada.style</a>. Réponse sous 30 jours maximum.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>6. Conservation des données</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Données client (Stripe) :</strong> conservées pendant la durée de l'abonnement actif + 10 ans après pour obligations comptables suisses.<br/>
              <strong>Données newsletter :</strong> conservées tant que vous n'avez pas demandé désinscription.<br/>
              <strong>Données navigateur (localStorage) :</strong> sous votre contrôle exclusif — vous pouvez les effacer à tout moment depuis les réglages de votre navigateur.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>7. Sous-traitants</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Pour fonctionner, WADA s'appuie sur :
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Vercel</strong> (hébergement) — États-Unis, certifié SOC 2.</li>
              <li><strong>Stripe</strong> (paiements) — Irlande, conforme RGPD et certifié PCI-DSS.</li>
            </ul>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Aucun autre acteur n'a accès à vos données.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>8. Réclamation</h2>
            <p style={{ color: textSecondary, marginBottom: 32 }}>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès :
            </p>
            <ul style={{ color: textSecondary, marginBottom: 32, paddingLeft: 20 }}>
              <li><strong>Suisse :</strong> <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener" style={{ color: ink }}>PFPDT</a> — Préposé fédéral à la protection des données et à la transparence.</li>
              <li><strong>Union européenne :</strong> <a href="https://www.cnil.fr" target="_blank" rel="noopener" style={{ color: ink }}>CNIL</a> ou autorité équivalente de votre pays.</li>
            </ul>

            <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${border}`, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              <Link href="/mentions" style={{ color: ink, textDecoration: "none" }}>Mentions légales →</Link>
              <Link href="/cgv" style={{ color: ink, textDecoration: "none" }}>CGV →</Link>
              <Link href="/contact" style={{ color: ink, textDecoration: "none" }}>Contact →</Link>
            </div>
            <p style={{ fontSize: 12, color: subtle, fontStyle: "italic", marginTop: 16 }}>
              Dernière mise à jour : mai 2026
            </p>
          </article>
        </div>
              </div>
    </main>
  );
}
