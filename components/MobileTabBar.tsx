"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * MobileTabBar — barre d'onglets fixée en bas, visible uniquement ≤880px.
 *
 * Brief audit mobile 24/05 §1 : sur téléphone, le hamburger ☰ du Nav reste
 * accessible pour les destinations secondaires (Composer, About, Tarifs,
 * etc.), mais les 4 outils principaux méritent un accès permanent au pouce.
 * Pattern attendu sur une app mobile native.
 *
 * Stack visible :
 *   [Scanner] [Palettes] [Styliste] [Compte]
 *
 * Le ✦ pour Styliste, ▦ pour Palettes, ◎ pour Scanner, ○ pour Compte
 * (glyphes neutres, pas de dépendance icon set). aria-current marque la
 * route active.
 *
 * Position fixed bottom + safe-area-inset-bottom pour ne pas chevaucher
 * la barre gestuelle iPhone. Le body reçoit padding-bottom équivalent en
 * CSS pour que le contenu ne passe pas sous la barre.
 */

const TABS: Array<{ href: string; label: string; icon: string }> = [
  { href: "/scanner", label: "Scanner", icon: "◎" },
  { href: "/palettes", label: "Palettes", icon: "▦" },
  { href: "/stylist", label: "Styliste", icon: "✦" },
  { href: "/compte", label: "Compte", icon: "○" },
];

export default function MobileTabBar() {
  const path = usePathname() || "/";

  return (
    <nav className="wada-tabbar" aria-label="Navigation mobile">
      {TABS.map((t) => {
        const active = path === t.href || path.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="wada-tabbar-link"
          >
            <span aria-hidden="true" className="wada-tabbar-icon">
              {t.icon}
            </span>
            <span className="wada-tabbar-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
