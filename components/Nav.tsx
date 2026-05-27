"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ink } from "@/lib/styles";
import ThemeToggle from "@/components/ThemeToggle";
import LangButton from "@/components/LangButton";

/**
 * Nav — header WADA global (brief 2026-05-28 v4 — audit UX).
 *
 * Refonte issue de l'audit UX :
 *   - N1 (CRITIQUE) : le Nav doit donner accès aux fonctionnalités, pas
 *     juste « Qui sommes-nous ». Liens ajoutés : Palettes · Scanner ·
 *     Styliste · Favoris.
 *   - N3 (CRITIQUE) : sur ≤880px les liens étaient simplement masqués
 *     → navigation morte sur mobile. Ajout d'un menu hamburger + drawer
 *     plein écran qui liste TOUS les parcours.
 *   - D3 (CRITIQUE) : ThemeToggle ☾/☀ rendu côté droit pour rendre le
 *     mode nuit accessible (était codé mais jamais monté).
 *
 * Structure :
 *   Desktop ≥881px : [Palettes · Scanner · Styliste · Favoris]
 *                    [WADA和田 (centre, →/)]
 *                    [☾ · Abonnement]
 *   Mobile  ≤880px : [☰] [WADA和田] [☾ · Abonnement]
 *                    + drawer plein écran au clic ☰
 */

/* Brief audit 2026-05-28 D5 — l'ancien #8B2F6E (plum) n'apparaissait
   nulle part ailleurs sur le site → incohérence chromatique sur le bouton
   le plus visible. Aligné maintenant sur le bordeaux WADA (#6B3A32), qui
   est aussi la couleur du CTA hero « Entrer dans l'atelier » et des
   accents éditoriaux des pages Tenue / Palette. Un seul accent primaire. */
const PLUM = "#6B3A32";       // bordeaux WADA (ex-#8B2F6E plum)
const PLUM_DARK = "#5a3029";  // hover plus sombre

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/palettes", label: "Palettes" },
  { href: "/scanner", label: "Scanner" },
  { href: "/stylist", label: "Styliste" },
  { href: "/favoris", label: "Favoris" },
];

/* Drawer mobile : toutes les destinations, hiérarchisées en sections. */
const DRAWER_SECTIONS: Array<{
  title: string;
  links: Array<{ href: string; label: string }>;
}> = [
  {
    title: "Outils",
    links: [
      { href: "/scanner", label: "Scanner une couleur" },
      { href: "/composer", label: "Composer une tenue" },
      { href: "/stylist", label: "Assistant styliste" },
      { href: "/palettes", label: "Les 348 palettes" },
    ],
  },
  {
    title: "Personnel",
    links: [
      { href: "/favoris", label: "Mes favoris" },
      { href: "/compte", label: "Mon compte" },
      { href: "/panier", label: "Panier" },
    ],
  },
  {
    title: "WADA",
    links: [
      { href: "/about", label: "Qui sommes-nous" },
      { href: "/tarifs", label: "Abonnement" },
      { href: "/cultures", label: "Cultures" },
      { href: "/faq", label: "FAQ" },
    ],
  },
];

export default function Nav() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ferme le drawer quand on change de route (clic sur un lien)
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden"; // bloque scroll body
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Échap ferme le drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const fgColor = `var(--wada-ink, ${ink})`;
  /* Brief « bugs visuels mobile » BUG #1 (24/05) :
     Nav bg à 0.92 d'opacité créait un aplat blanc/crème quasi opaque sur
     le hero photo (mannequin) → combiné au voile crème du hero, ça
     formait une « bande grise » qui mangeait le quart supérieur du
     visuel. À .60 le Nav reste lisible (backdrop-filter blur 12px assure
     le contraste texte) tout en laissant transparaître le hero. */
  const bgColor = "rgba(255,255,255,0.60)";

  return (
    <>
      <nav
        className="wada-nav wada-nav--solid"
        aria-label="Navigation principale"
        style={{
          position: "sticky",
          top: 0,
          background: bgColor,
          color: fgColor,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          /* Brief « bugs visuels mobile » BUG #3 (24/05) :
             Avec viewportFit: "cover" (cf. layout.tsx), env(safe-area-
             inset-right) est non-zéro sur iPhone à encoche. Le padding
             droit en dur 28px laissait le bouton Abonnement venir
             toucher la courbure du bord (effet « collé au bord »).
             Maintenant on prend max(28px, safe-area-inset-right) pour
             garantir une marge visible quel que soit le device. Pareil
             gauche par symétrie iPhone landscape. */
          padding: "18px max(28px, env(safe-area-inset-right)) 18px max(28px, env(safe-area-inset-left))",
          paddingTop: "max(18px, env(safe-area-inset-top))",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Merriweather Sans', 'Inter', sans-serif",
          boxShadow: "0 1px 0 rgba(7,7,2,.08)",
        }}
      >
        {/* ─── Gauche : hamburger mobile + liens desktop ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Hamburger — visible uniquement ≤880px (cf. style jsx en bas) */}
          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            aria-controls="wada-drawer"
            onClick={() => setDrawerOpen(true)}
            className="wada-nav-burger"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 44, height: 44,
              padding: 0,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: fgColor,
            }}
          >
            <span aria-hidden style={{
              display: "inline-flex", flexDirection: "column", gap: 5,
            }}>
              <span style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2 }} />
              <span style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2 }} />
              <span style={{ width: 22, height: 2, background: "currentColor", borderRadius: 2 }} />
            </span>
          </button>

          {/* Liens desktop */}
          <div
            className="wada-nav-links"
            style={{
              display: "flex",
              gap: 26,
              alignItems: "center",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="wada-nav-link"
                style={{
                  color: fgColor,
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Centre : logo WADA和田 → / ─── */}
        <Link
          href="/"
          aria-label="Accueil WADA"
          className="wada-nav-center"
          style={{
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            color: fgColor,
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            fontSize: "1.5rem",
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          <span>WADA</span>
          <span className="wada-jp" style={{ marginLeft: 4 }}>和田</span>
        </Link>

        {/* ─── Droite : Compte + ThemeToggle + bouton « Abonnement » ───
             Brief audit 2026-05-28 N7 : icône compte ajoutée pour offrir
             un accès direct à /compte sans passer par le drawer. */}
        <div
          className="wada-nav-right"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          {/* Brief mobile (26/05) — décongestion header :
              `wada-nav-compte` et `wada-nav-theme` cachés ≤880px via CSS
              en bas de fichier. Le Compte est déjà dans la MobileTabBar
              du bas, le ThemeToggle est dans le drawer en option « Thème
              sombre ». Header mobile ne montre plus que ☰ / logo /
              Abonnement (3 éléments au lieu de 5 → respire). */}
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="wada-nav-compte"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: "50%",
              color: fgColor,
              textDecoration: "none",
              border: `1px solid var(--wada-border, rgba(30,30,30,.12))`,
              background: "transparent",
              transition: "background .2s ease, border-color .2s ease",
            }}
          >
            <svg
              aria-hidden
              width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
            </svg>
          </Link>
          <span className="wada-nav-theme">
            <ThemeToggle />
          </span>
          {/* Brief client 2026-05-28 « traduction anglaise » — bouton EN
              qui passe par le proxy Google translate.goog. Caché ≤880px
              (même règle que .wada-nav-compte/.wada-nav-theme : sur mobile
              l'option est dans le drawer pour ne pas surcharger le header). */}
          <span className="wada-nav-lang-wrapper">
            <LangButton variant="pill" />
          </span>
          <Link
            href="/tarifs"
            style={{
              fontFamily: "'Merriweather Sans', 'Inter', sans-serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#FFFFFF",
              textDecoration: "none",
              background: PLUM,
              border: `1px solid ${PLUM}`,
              borderRadius: "6.25rem",
              padding: "11px 22px",
              lineHeight: 1,
              transition: "background .25s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(ev) => { ev.currentTarget.style.background = PLUM_DARK; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.background = PLUM; }}
          >
            Abonnement
          </Link>
        </div>

        <style jsx>{`
          /* Hover + focus accessible (A3 audit) — CSS plutôt que JS,
             retour visuel garanti au clavier. */
          :global(.wada-nav-link) {
            transition: opacity .2s ease, color .2s ease;
            opacity: 0.92;
          }
          :global(.wada-nav-link:hover),
          :global(.wada-nav-link:focus-visible) {
            opacity: 1;
            color: ${PLUM};
          }
          /* Hover icône compte — bordeaux aligné sur ${PLUM} */
          :global(.wada-nav-compte:hover),
          :global(.wada-nav-compte:focus-visible) {
            background: rgba(107,58,50,.08);
            border-color: ${PLUM};
          }

          /* Responsive — N3 (audit) :
             ≤880px : on cache les liens texte gauche et on affiche le
             hamburger. Le drawer plein écran (.wada-drawer) prend le relais.
             Brief mobile décongestion (26/05) : on cache aussi le Compte
             icon (redondant avec MobileTabBar du bas) et le ThemeToggle
             (déplacé dans le drawer avec label « Thème sombre »). */
          @media (max-width: 880px) {
            :global(.wada-nav-links) {
              display: none !important;
            }
            :global(.wada-nav-burger) {
              display: inline-flex !important;
            }
            :global(.wada-nav-compte),
            :global(.wada-nav-theme),
            :global(.wada-nav-lang-wrapper) {
              display: none !important;
            }
          }
        `}</style>
      </nav>

      {/* ─── DRAWER MOBILE plein écran ─── */}
      {drawerOpen && (
        <div
          id="wada-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            animation: "wada-drawer-fade .2s ease-out",
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0, left: 0, bottom: 0,
              width: "min(360px, 88vw)",
              background: "var(--wada-paper, #F4EFE7)",
              color: fgColor,
              padding: "max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))",
              overflowY: "auto",
              boxShadow: "4px 0 24px rgba(0,0,0,.18)",
              animation: "wada-drawer-slide .25s cubic-bezier(.22,1,.36,1)",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {/* Header drawer : titre + close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                fontFamily: "'Fredoka', sans-serif",
                fontWeight: 700, fontSize: "1.4rem", letterSpacing: "0.02em",
              }}>
                WADA<span style={{ marginLeft: 4, opacity: 0.6 }}>和田</span>
              </span>
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setDrawerOpen(false)}
                style={{
                  width: 44, height: 44,
                  background: "transparent", border: "none",
                  cursor: "pointer", color: fgColor,
                  fontSize: 24, lineHeight: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            {/* Brief mobile (26/05) — ThemeToggle dans le drawer
                avec label « Thème » (au lieu de juste ☾ dans le header,
                où il ne disait rien à un nouveau visiteur). En haut du
                drawer pour être visible sans scroll. */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              borderBottom: "1px solid var(--wada-border, rgba(30,30,30,.08))",
            }}>
              <span style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: "1.05rem",
                color: fgColor,
              }}>
                Thème
              </span>
              <ThemeToggle />
            </div>

            {/* Brief client 2026-05-28 « traduction anglaise » — option
                Language dans le drawer mobile (versant pill cachée ≤880px
                via CSS plus haut). Le LangButton variant="drawer-row"
                produit déjà une ligne complète avec borderBottom. */}
            <LangButton variant="drawer-row" />

            {/* Sections de liens */}
            {DRAWER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p style={{
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.28em", textTransform: "uppercase",
                  color: "var(--wada-subtle, #A89A85)",
                  margin: "0 0 12px",
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {section.title}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {section.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setDrawerOpen(false)}
                        style={{
                          display: "block",
                          padding: "12px 0",
                          fontFamily: "'Fredoka', sans-serif",
                          fontSize: "1.15rem",
                          color: fgColor,
                          textDecoration: "none",
                          minHeight: 44, // cible tactile a11y
                          lineHeight: 1.4,
                        }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
          <style jsx>{`
            @keyframes wada-drawer-fade {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes wada-drawer-slide {
              from { transform: translateX(-20px); opacity: 0.6; }
              to   { transform: translateX(0); opacity: 1; }
            }
            @media (prefers-reduced-motion: reduce) {
              div, aside { animation: none !important; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
