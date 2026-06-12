"use client";
import Link from "next/link";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";

export default function MentionsPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            {/* Brief audit 2026-05-28 §2 : bouton retour standardisé sur toutes
          les pages internes hors accueil. */}
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
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Mentions légales</p>
            <h1 style={{ fontSize: 56, fontWeight: 500, margin: 0, fontFamily: "'Fredoka', sans-serif" }}>Mentions légales</h1>
          </header>
          <article style={{ fontSize: 16, lineHeight: 1.8, color: ink, fontFamily: "'Inter', sans-serif" }}>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Éditeur du site</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Le site <strong>wada.style</strong> est édité par Nemanja Milosevic, exerçant en raison individuelle.<br/>
              Adresse : 66 Rue des Vollandes, 1207 Genève, Suisse<br/>
              Email : <a href="mailto:hello@wada.style" style={{ color: ink }}>hello@wada.style</a>
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Statut juridique</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Raison individuelle non inscrite au Registre du commerce (chiffre d'affaires inférieur au seuil légal de 100 000 CHF/an).<br/>
              Affilié auprès de l'OCAS — Office cantonal des assurances sociales de Genève.<br/>
              Non assujetti à la TVA suisse (chiffre d'affaires inférieur à 100 000 CHF/an).
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Directeur de la publication</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>Nemanja Milosevic</p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Hébergement</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Le site est hébergé par <strong>Vercel Inc.</strong><br/>
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br/>
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: ink }}>vercel.com</a>
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Paiements</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Les paiements relatifs à l'abonnement WADA Premium sont traités par <strong>Stripe Payments Europe Ltd</strong>, certifié PCI-DSS.<br/>
              1 Grand Canal Street Lower, Dublin, Irlande.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Propriété intellectuelle</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              L'ensemble du contenu de wada.style (textes, design, code, sélections éditoriales) est la propriété de Nemanja Milosevic, à l'exception :
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li>Des palettes de couleurs originales, issues du livre <em>A Dictionary of Color Combinations</em> de Sanzo Wada (1933, domaine public au Japon).</li>
              <li>Des marques et logos cités, propriétés de leurs titulaires respectifs.</li>
              <li>Des images, lorsqu'elles proviennent de tiers cités.</li>
            </ul>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Liens externes et affiliation</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              WADA propose des liens vers des boutiques tierces partenaires. Certains de ces liens sont des liens d'affiliation : si vous effectuez un achat via ces liens, WADA peut percevoir une commission de la part de la boutique, sans surcoût pour vous.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Programmes d'affiliation actifs :</strong>
            </p>
            <ul style={{ color: textSecondary, marginBottom: 16, paddingLeft: 20 }}>
              <li><strong>Awin</strong> — Publisher ID <code style={{ background: "rgba(31,27,22,0.06)", padding: "1px 6px", borderRadius: 3, fontSize: 13 }}>2879911</code>. Réseau d'affiliation pour marques européennes.</li>
              <li><strong>Amazon Associates France</strong> — Tag <code style={{ background: "rgba(31,27,22,0.06)", padding: "1px 6px", borderRadius: 3, fontSize: 13 }}>wadastyle-21</code>. Programme d'affiliation Amazon FR.</li>
            </ul>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Conformément à l'article 23 de la loi suisse contre la concurrence déloyale (LCD), la relation commerciale d'affiliation est divulguée explicitement sur la <Link href="/confidentialite" style={{ color: ink }}>politique de confidentialité</Link> et sur cette page.
            </p>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              <strong>Application native (iOS / Android) :</strong> les liens sortants s'ouvrent dans le navigateur in-app système (SFSafariViewController / Chrome Custom Tabs). Les cookies d'affiliation y sont préservés comme dans un navigateur web standard.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Droit applicable</h2>
            <p style={{ color: textSecondary, marginBottom: 16 }}>
              Le présent site est régi par le droit suisse. Tout litige sera porté devant les tribunaux compétents du canton de Genève.
            </p>

            <h2 style={{ fontSize: 24, margin: "32px 0 16px" }}>Contact</h2>
            <p style={{ color: textSecondary, marginBottom: 32 }}>
              Pour toute question relative au site : <a href="mailto:hello@wada.style" style={{ color: ink }}>hello@wada.style</a>
            </p>

            <div style={{ marginTop: 48, paddingTop: 32, borderTop: `1px solid ${border}`, display: "flex", flexWrap: "wrap", gap: 24, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              <Link href="/confidentialite" style={{ color: ink, textDecoration: "none" }}>Confidentialité →</Link>
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
