"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ink } from "@/lib/styles";
import ThemeToggle from "@/components/ThemeToggle";
import LangButton from "@/components/LangButton";
/* Brief refonte Nav 2026-05-30 (maquette épurée) :
   - ProfileBadge + ThemeToggle + LangButton individuels du header
     SUPPRIMÉS du header desktop.
   - ProfileMenu = nouveau composant qui fusionne avatar compact + dropdown
     contenant : Compte / Favoris / Changer style / Thème / Langue.
   - Logo passe à gauche à côté des liens (au lieu de centré absolument).
   - Bouton « Abonnement » passe en ghost (outline bordeaux). */
/* ProfileMenu retiré du header 2026-05-31 (user feedback).
   Import conservé en commentaire au cas où on veut le ré-activer
   plus tard via toggle Premium ou sur une page dédiée.
import ProfileMenu from "@/components/ProfileMenu"; */

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
  { href: "/vetements", label: "Boutique" },
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
        {/* ─── Gauche : hamburger mobile + LOGO + liens desktop ─── */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Hamburger — visible uniquement ≤880px */}
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

          {/* Brief refonte 2026-05-30 : logo passe À GAUCHE avec les liens,
              au lieu d'être centré absolument. La nav est plus claire à
              parcourir d'un coup d'œil. */}
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

          {/* Liens desktop — collés au logo, plus de gap absolu */}
          <div
            className="wada-nav-links"
            style={{
              display: "flex",
              gap: 22,
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
                  opacity: 0.85,
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Droite : Favoris + Abonnement + ProfileMenu ─── */}
        <div
          className="wada-nav-right"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          {/* Favoris — déplacé à droite, à côté d'Abonnement */}
          <Link
            href="/favoris"
            className="wada-nav-favoris"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#1E1E1E",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Favoris
          </Link>

          <Link
            href="/tarifs"
            className="wada-nav-tarifs"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: PLUM,
              textDecoration: "none",
              background: "transparent",
              border: `1px solid ${PLUM}`,
              borderRadius: "6.25rem",
              padding: "9px 18px",
              lineHeight: 1,
              transition: "background .22s ease, color .22s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(ev) => {
              ev.currentTarget.style.background = PLUM;
              ev.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(ev) => {
              ev.currentTarget.style.background = "transparent";
              ev.currentTarget.style.color = PLUM;
            }}
          >
            Abonnement
          </Link>

          {/* Brief 2026-05-31 (user feedback verbatim) : « efface cette
              option car si le client veut tester plusieurs styles
              différents il doit tout le temps changer ce n'est pas
              pratique ». La pastille profil H/F poussait le client à
              s'engager sur UN style. Maintenant : la personnalisation
              backend (genre/style/budget) reste fonctionnelle, mais
              elle n'est plus visible en permanence. Le client la
              configure une fois dans /compte et l'oublie. */}
          {/* <ProfileMenu /> */}
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
