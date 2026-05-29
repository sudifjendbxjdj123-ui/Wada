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
  /* Brief 2026-05-28 « donne le logo Pinterest sur le site WADA » :
     compte officiel @wadastyle confirmé, on hardcode l'URL en fallback
     pour que l'icône s'affiche immédiatement sans dépendre d'une env
     var Vercel à poser à la main. L'env var prime toujours si définie
     (flexibilité future : changer d'URL sans redeploy code).
     Logo SVG = path officiel Pinterest (« P » dans cercle plein),
     rendu en FILLED — d'où le flag `filled` ajouté ci-dessous. Les
     autres icônes restent outline pour cohérence du jeu existant. */
  const socials: Array<{
    url: string | undefined;
    label: string;
    path: React.ReactNode;
    filled?: boolean;
  }> = [
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
      /* Brief 2026-05-29 « ajouter le logo TikTok » — compte officiel
         @wadastyle confirmé. Vrai logo TikTok officiel (note de musique
         filled, libre d'usage en SVG monochrome). Hardcodé en fallback
         comme Pinterest. Ordre demandé : Instagram · TikTok · Pinterest. */
      url: process.env.NEXT_PUBLIC_TIKTOK_URL || "https://www.tiktok.com/@wadastyle",
      label: "TikTok",
      filled: true,
      path: (
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
      ),
    },
    {
      /* Fallback hardcodé : compte WADA officiel @wadastyle.
         Si l'env var est définie côté Vercel, elle prime. */
      url: process.env.NEXT_PUBLIC_PINTEREST_URL || "https://www.pinterest.com/wadastyle/",
      label: "Pinterest",
      filled: true,
      /* Vrai logo Pinterest officiel (path simplifié, libre d'utili-
         sation pour les boutons « Save »/« Follow » selon brand.
         pinterest.com). Cercle plein + « P » blanc en négatif via
         evenodd / contour interne du path. Rendu plus reconnaissable
         que l'ancien glyphe schématique. */
      path: (
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.137.893 2.738a.36.36 0 0 1 .083.343c-.091.378-.293 1.193-.333 1.361-.053.218-.173.265-.4.16-1.494-.696-2.428-2.879-2.428-4.633 0-3.772 2.74-7.235 7.895-7.235 4.144 0 7.366 2.953 7.366 6.899 0 4.117-2.595 7.43-6.199 7.43-1.211 0-2.348-.629-2.738-1.372l-.745 2.84c-.269 1.04-.997 2.345-1.485 3.139C9.572 23.812 10.766 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
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
          {/* Pinterest + TikTok = filled (logos officiels, glyph plein).
              Instagram + X = outline (cohérence du jeu existant). */}
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={s.filled ? "currentColor" : "none"}
            stroke={s.filled ? "none" : "currentColor"}
            strokeWidth={s.filled ? 0 : 1.6}
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
