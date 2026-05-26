import Link from "next/link";

/**
 * SocialIcons — icônes sociales gated par env vars publiques.
 *
 * Brief P2 (24/05) + brief social (25/05) : emplacements préparés pour
 * Pinterest / Instagram / TikTok / X. Quand un compte est créé, poser
 * l'URL dans la var d'env publique correspondante :
 *   NEXT_PUBLIC_INSTAGRAM_URL  → ex. https://instagram.com/wadastyle
 *   NEXT_PUBLIC_PINTEREST_URL  → ex. https://pinterest.com/wadastyle
 *   NEXT_PUBLIC_TIKTOK_URL     → ex. https://tiktok.com/@wadastyle
 *   NEXT_PUBLIC_X_URL          → ex. https://x.com/wadastyle
 *
 * Tant qu'aucune URL n'est définie : le bloc ne rend rien (pas d'icônes
 * orphelines qui amèneraient un visiteur sur une 404 ou une fausse page).
 *
 * Pictogrammes SVG inline (pas de lib d'icônes pour 4 logos). Tailles
 * 18×18, opacity .65 → 1 au hover (géré via CSS .wada-social-icon).
 */
function SocialIcons() {
  const socials = [
    {
      url: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      label: "Instagram",
      path: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </>
      ),
    },
    {
      url: process.env.NEXT_PUBLIC_PINTEREST_URL,
      label: "Pinterest",
      path: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 7c0 2 2 3 2 5s-1 4-2 5l1.5-5.5L13 17" strokeLinecap="round" />
        </>
      ),
    },
    {
      url: process.env.NEXT_PUBLIC_TIKTOK_URL,
      label: "TikTok",
      /* Logo TikTok stylisé — la note de musique caractéristique. Pas le
         logo officiel rainbow (trademark Bytedance, à éviter en SVG inline
         pour ne pas s'exposer à un takedown). Forme reconnaissable :
         croche + queue tordue. */
      path: (
        <>
          <path d="M9 8.5v8a3 3 0 1 1-3-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 8.5c0-2 0-3.5 0-5h2.5c.3 2.5 1.7 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ),
    },
    {
      url: process.env.NEXT_PUBLIC_X_URL,
      label: "X (Twitter)",
      path: <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />,
    },
  ].filter((s) => Boolean(s.url));

  if (socials.length === 0) return null;

  return (
    <div
      style={{
        display: "flex", gap: 14, alignItems: "center",
        marginTop: 32, justifyContent: "flex-start",
      }}
      aria-label="Réseaux sociaux"
    >
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          className="wada-social-icon"
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.6"
            aria-hidden="true"
          >
            {s.path}
          </svg>
        </a>
      ))}
    </div>
  );
}

/**
 * Footer — composant global présent sur TOUTES les pages.
 *
 * Brief 2026-05-27 mockup v2 (Relume kit) :
 *   - Background : INK foncé #070702
 *   - Texte : rgba(255,255,255,.72), hover white
 *   - 4 colonnes : brand 1.7fr (logo serif + tagline) + 3 col 1fr (liens)
 *   - Headers de col : sans uppercase letterspaced 0.18em, blanc, 0.78rem
 *   - Liens : 0.95rem, opacity 0.8, hover opacity 1 + white
 *   - Border séparatrice en bas + fbar copyright + tagline
 *
 * Bascule définitive du footer « calme beige » → « dark editorial ».
 */

const INK = "#070702";

const SECTIONS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Explorer",
    links: [
      { href: "/palettes", label: "Palettes" },
      { href: "/scanner", label: "Scanner" },
      { href: "/decouverte", label: "Découverte" },
      { href: "/cultures", label: "Cultures" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/favoris", label: "Mes favoris" },
      { href: "/tarifs", label: "Abonnement" },
      { href: "/about", label: "À propos" },
      { href: "/faq", label: "FAQ" },
      /* Brief audit 2026-05-28 M6 — accès explicite à l'installation
         PWA / app native, plutôt que d'attendre 30s du beforeinstallprompt. */
      { href: "/install", label: "Installer l'app" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "/contact", label: "hello@wada.style" },
      { href: "/partenaires", label: "Pour les marques" },
      { href: "/mentions", label: "Mentions légales" },
    ],
  },
];

const headerStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontFamily: "'Merriweather Sans', 'Inter', sans-serif",
  fontSize: "0.78rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  marginBottom: 16,
  fontWeight: 600,
};

const linkStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 10,
  fontSize: "0.95rem",
  fontWeight: 300,
  opacity: 0.8,
  color: "inherit",
  textDecoration: "none",
  transition: "opacity .2s ease, color .2s ease",
};

export default function Footer() {
  return (
    <footer
      className="wada-footer"
      style={{
        background: INK,
        color: "rgba(255,255,255,0.72)",
        padding: "72px 0 36px",
        position: "relative",
        zIndex: 10,
        fontFamily: "'Merriweather Sans', 'Inter', sans-serif",
        lineHeight: 1.6,
      }}
    >
      <div
        className="wada-container"
        style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 28px" }}
      >
        <div
          className="wada-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.7fr 1fr 1fr 1fr",
            gap: 30,
          }}
        >
          {/* Brand col — logo serif WADA和田 inline + tagline */}
          <div className="wada-footer-brand">
            <Link
              href="/"
              aria-label="Accueil WADA"
              style={{
                color: "#FFFFFF",
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700,
                fontSize: "1.6rem",
                letterSpacing: "0.01em",
                display: "inline-flex",
                alignItems: "baseline",
                textDecoration: "none",
                lineHeight: 1,
              }}
            >
              <span>WADA</span>
              <span className="wada-jp" style={{ marginLeft: 4 }}>和田</span>
            </Link>
            <p
              style={{
                marginTop: 14,
                maxWidth: "32ch",
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.6,
              }}
            >
              Un dictionnaire de palettes pour composer la tenue parfaite. D'après Sanzo Wada (1933).
            </p>
          </div>

          {/* 3 sections de liens */}
          {SECTIONS.map((s) => (
            <div key={s.title} className="wada-footer-section">
              <h5 style={headerStyle}>{s.title}</h5>
              {s.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="wada-footer-link"
                  style={linkStyle}
                >
                  {l.label}
                </Link>
              ))}
              {s.title === "Contact" && (
                <span
                  style={{
                    display: "block",
                    marginBottom: 10,
                    fontSize: "0.95rem",
                    fontWeight: 300,
                    opacity: 0.8,
                  }}
                >
                  Genève
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Brief P2 (24/05) — placeholders icônes sociales.
            Gated par env vars publiques : on n'affiche un lien que si l'URL
            est définie. Tant que les comptes Instagram/Pinterest n'existent
            pas, on ne rend rien (pas de pictogramme orphelin qui amène nulle
            part). Activation : poser NEXT_PUBLIC_INSTAGRAM_URL / PINTEREST_URL
            / X_URL dans les env Vercel. */}
        <SocialIcons />

        {/* Bottom bar : copyright + disclosure affiliation + tagline */}
        <div
          className="wada-footer-bottom"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            marginTop: 48,
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            fontSize: "0.82rem",
            opacity: 0.7,
          }}
        >
          <span>© 2026 WADA · Genève</span>
          {/* Divulgation d'affiliation obligatoire — brief Muji 2026-05-27 §7
              + brief Amazon Partenaires + Awin. Mention permanente visible
              partout sur le site. */}
          <span>
            Liens partenaires (Muji via Awin · Amazon) — WADA peut toucher une commission, sans coût supplémentaire pour vous.{" "}
            <Link
              href="/affiliation"
              className="wada-footer-link"
              style={{ color: "inherit", textDecoration: "underline", opacity: 0.9 }}
            >
              En savoir plus
            </Link>
          </span>
        </div>
      </div>

      {/* Responsive 4 col → 2 col à 880, 1 col à 480 */}
      <style>{`
        @media (max-width: 880px) {
          .wada-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .wada-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
        /* Hover : liens passent en blanc plein */
        .wada-footer-link:hover,
        .wada-footer-link:focus-visible {
          opacity: 1 !important;
          color: #FFFFFF !important;
        }
      `}</style>
    </footer>
  );
}
