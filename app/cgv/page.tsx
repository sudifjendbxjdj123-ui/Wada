"use client";
import Link from "next/link";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";

export default function CGVPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            {/* Brief audit 2026-05-28 : back button standardisé sur toutes les
          pages internes (cohérent avec /mentions, /partenaires, /ma-tenue). */}
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
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Conditions</p>
            <h1 style={{ fontSize: 56, fontWeight: 400, fontStyle: "italic", margin: 0, fontFamily: "'Inter', sans-serif" }}>Conditions générales</h1>
          </header>
          <article style={{ fontSize: 16, lineHeight: 1.8, color: ink, fontFamily: "'Inter', sans-serif" }}>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 1 — Objet et acceptation</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Les présentes Conditions Générales d'Utilisation et de Vente (« CGU/CGV ») régissent l'utilisation du service WADA accessible à l'adresse wada.style et la souscription à l'abonnement payant WADA Premium. Le service est édité par <strong>Nemanja Milosevic</strong>, raison individuelle, 66 Rue des Vollandes, 1207 Genève (« l'Éditeur »).
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Toute utilisation du service implique l'acceptation pleine et entière des présentes conditions.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 2 — Description du service</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Service gratuit :</strong> consultation des palettes de couleurs, accès aux liens d'achat vers des boutiques tierces, sauvegarde locale de favoris, calendrier, contenu éditorial.<br/>
              <strong>Abonnement WADA Premium (payant) :</strong> recommandations personnalisées, calendrier mensuel des tenues, accès anticipé aux nouvelles palettes, mode seconde main optimisé.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 3 — Tarifs (EUR)</h2>
            {/* Brief audit 2026-05-28 : devise unifiée en EUR, cohérente avec
                /tarifs et /faq. L'éditeur (Genève) facture en EUR via Stripe
                ; le client est débité en EUR. La TVA suisse ne s'applique
                pas (chiffre d'affaires sous seuil 100 000 CHF/an). */}
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>WADA Premium Mensuel :</strong> 1,99 € par mois, prélèvement automatique mensuel.<br/>
              <strong>WADA Premium Annuel :</strong> 17,99 € par an, prélèvement annuel (économie de 25 % par rapport au mensuel).<br/>
              <strong>Période d'essai :</strong> 7 jours gratuits sur le plan mensuel.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16, fontStyle: "italic", fontSize: 14 }}>
              Les prix sont affichés en euros, hors TVA (l'Éditeur n'est pas assujetti à la TVA suisse, son chiffre d'affaires étant inférieur au seuil légal de 100 000 CHF/an).
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 4 — Paiement</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Les paiements sont traités par <strong>Stripe Payments Europe Ltd</strong> (Dublin, Irlande). WADA ne stocke aucune donnée bancaire. Les moyens acceptés : Visa, Mastercard, American Express, et certains portefeuilles numériques (Apple Pay, Google Pay).
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 5 — Résiliation</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              L'abonnement peut être résilié à tout moment, sans motif, depuis votre espace client Stripe ou en envoyant un email à hello@wada.style. La résiliation prend effet à la fin de la période en cours déjà payée. Aucun remboursement au prorata n'est effectué.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Période d'essai :</strong> vous pouvez annuler durant les 7 jours gratuits sans aucun frais.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 6 — Liens vers les boutiques tierces</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              WADA ne vend aucun bien physique. Les achats effectués via les liens proposés (Vinted, Zara, Massimo Dutti, COS, Polène, Sézane, etc.) relèvent exclusivement du contrat conclu entre vous et la boutique concernée. WADA ne peut être tenu responsable d'un litige relatif à ces achats (livraison, remboursement, qualité, conformité, etc.).
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 7 — Affiliation</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Certains liens vers les boutiques sont des liens d'affiliation. Cela ne change ni le prix ni l'expérience d'achat. WADA peut percevoir une commission de la boutique pour les ventes générées via ces liens. Cette commission ne crée aucune relation contractuelle entre l'utilisateur et l'Éditeur au-delà du présent contrat.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 8 — Responsabilité</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              WADA s'efforce d'offrir un service disponible et précis, mais ne garantit ni l'absence d'erreur, ni la disponibilité ininterrompue, ni l'adéquation du service aux besoins particuliers de chaque utilisateur. L'Éditeur ne pourra être tenu responsable des préjudices indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 9 — Propriété intellectuelle</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Le contenu éditorial, les sélections, le design et le code source de WADA sont la propriété exclusive de l'Éditeur. Toute reproduction, extraction massive ou exploitation commerciale est interdite sans autorisation écrite préalable.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 10 — Données personnelles</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Le traitement des données personnelles est régi par notre <Link href="/confidentialite" style={{ color: ink }}>Politique de confidentialité</Link>, conforme à la nLPD suisse et au RGPD européen.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 11 — Modifications</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              L'Éditeur se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs seront informés des modifications substantielles par email. La poursuite de l'utilisation après notification vaut acceptation.
            </p>

            <h2 style={{ fontSize: 24, fontStyle: "italic", margin: "32px 0 16px" }}>Article 12 — Droit applicable et juridiction</h2>
            <p style={{ color: textSecondary, marginBottom: 32 }}>
              Les présentes CGV sont soumises au droit suisse. En cas de litige, une solution amiable sera privilégiée. À défaut, les tribunaux compétents du canton de Genève seront seuls compétents.
            </p>

            <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${border}`, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              <Link href="/mentions" style={{ color: ink, textDecoration: "none" }}>Mentions légales →</Link>
              <Link href="/confidentialite" style={{ color: ink, textDecoration: "none" }}>Confidentialité →</Link>
              <Link href="/contact" style={{ color: ink, textDecoration: "none" }}>Contact →</Link>
            </div>
            <p style={{ fontSize: 12, color: subtle, fontStyle: "italic", marginTop: 16 }}>
              Version 1.0 — mai 2026
            </p>
          </article>
        </div>
              </div>
    </main>
  );
}
