"use client";
import Link from "next/link";
import { ink, paper, seal, border, sectionLabel, textSecondary } from "@/lib/styles";

/**
 * /cookies — Politique de cookies.
 *
 * Brief 2026-06-01 « Pages légales complètes + Lancement » §5.
 * Texte verbatim. Bouton « Modifier mes choix » qui réinitialise
 * localStorage.wada_consent → le CookieBanner ré-apparaît au prochain
 * scroll/refresh.
 */
export default function CookiesPage() {
  const reopenBanner = () => {
    try {
      localStorage.removeItem("wada_consent");
      window.dispatchEvent(new CustomEvent("wada-cookie-reopen"));
    } catch {}
  };

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
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Vie privée</p>
            <h1 style={{ fontSize: 56, fontWeight: 500, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>Cookies</h1>
          </header>
          <article style={{ fontSize: 16, lineHeight: 1.8, color: ink, fontFamily: "'Inter', sans-serif" }}>

            <h2 style={hStyle}>Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p style={pStyle}>
              Un cookie est un petit fichier déposé sur votre appareil lors de votre visite. Il permet au
              site de vous reconnaître lors de visites ultérieures.
            </p>

            <h2 style={hStyle}>Cookies utilisés par WADA</h2>

            <h3 style={h3Style}>Cookies strictement nécessaires (non désactivables)</h3>
            <ul style={ulStyle}>
              <li><code>wada_session</code> : maintient votre session de navigation</li>
              <li><code>wada_consent</code> : mémorise vos choix de cookies</li>
              <li><code>wada.profile</code>, <code>wada.mood</code> : préférences locales du compte (stockées en localStorage, jamais envoyées à un serveur tiers)</li>
            </ul>

            <h3 style={h3Style}>Cookies de mesure d&apos;audience (optionnels — Vercel Analytics)</h3>
            <ul style={ulStyle}>
              <li>Statistiques anonymisées de fréquentation</li>
              <li>Aucun cookie publicitaire</li>
              <li>Aucun tracking croisé entre sites</li>
            </ul>

            <h3 style={h3Style}>Cookies tiers</h3>
            <ul style={ulStyle}>
              <li><strong>Stripe</strong> : nécessaires pour le paiement (uniquement sur la page checkout)</li>
              <li><strong>Awin</strong> : tracking d&apos;affiliation (cookie posé par Awin chez les marchands, pas chez nous)</li>
            </ul>

            <h2 style={hStyle}>Gestion de vos préférences</h2>
            <p style={pStyle}>
              À votre première visite, un bandeau vous demande votre consentement pour les cookies
              optionnels. Vous pouvez modifier vos choix à tout moment depuis cette page ou via le footer.
            </p>

            <button
              type="button"
              onClick={reopenBanner}
              style={{
                background: "#6B3A32",
                color: "#FAF8F4",
                border: "none",
                borderRadius: 14,
                padding: "12px 22px",
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                marginTop: 8, marginBottom: 24,
              }}
            >
              Modifier mes choix de cookies
            </button>

            <h2 style={hStyle}>Durée de conservation</h2>
            <ul style={ulStyle}>
              <li>Cookies de session : supprimés à la fermeture du navigateur</li>
              <li>Cookies de mémorisation : 13 mois maximum (conformément à la CNIL)</li>
            </ul>

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
const h3Style: React.CSSProperties = { fontSize: 17, margin: "20px 0 10px", fontFamily: "'Fredoka', sans-serif", fontWeight: 500 };
const pStyle: React.CSSProperties = { color: textSecondary, marginBottom: 16 };
const ulStyle: React.CSSProperties = { color: textSecondary, marginBottom: 16, paddingLeft: 22, listStyle: "disc" };
