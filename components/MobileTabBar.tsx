"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";

/**
 * MobileTabBar — barre d'onglets fixée en bas, visible uniquement ≤880px.
 *
 * Refonte 2026-05-29 (brief client « appli efficace » §2) :
 *   5 tabs au lieu de 4. Pattern app-native avec Scanner CENTRAL SURÉLEVÉ
 *   bordeaux (« l'action cœur du produit »).
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Accueil   Palettes  [ SCAN ]  Styliste  ♡  │
 *   │     ⌂        ▦          ◎         ✦        │
 *   └──────────────────────────────────────────────┘
 *                       ▲
 *                  surélevé -14px,
 *                  cercle bordeaux 56×56
 *
 * Le Compte sort de la TabBar (il est déjà dans le drawer mobile +
 * accessible via icône user dans le Nav desktop). Brief : 5 tabs max
 * pour ne pas surcharger.
 *
 * Icônes SVG (1.6 stroke, currentColor) au lieu des glyphes ◎▦✦ basiques :
 * repère visuel reconnaissable au coup d'œil — sensation app native.
 *
 * Position fixed bottom + safe-area-inset-bottom pour ne pas chevaucher
 * la barre gestuelle iPhone. Le body reçoit padding-bottom équivalent en
 * CSS pour que le contenu ne passe pas sous la barre.
 */

type IconKind = "home" | "bag" | "grid" | "scan" | "stylist" | "heart";

function Icon({ kind, size = 22 }: { kind: IconKind; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "home":
      return (
        <svg {...props}>
          <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" />
        </svg>
      );
    case "bag":
      /* Sac shopping : signal boutique. */
      return (
        <svg {...props}>
          <path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "scan":
      /* Viewfinder caméra : 4 coins + cercle central — signal scanner /
         appareil photo, lisible en blanc sur le rond bordeaux. */
      return (
        <svg {...props} strokeWidth={2}>
          <path d="M4 8V6a2 2 0 0 1 2-2h2" />
          <path d="M16 4h2a2 2 0 0 1 2 2v2" />
          <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
          <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      );
    case "stylist":
      /* Sparkle / étoile à 4 branches : signal magique / IA. */
      return (
        <svg {...props}>
          <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...props}>
          <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
        </svg>
      );
  }
}

const TABS: Array<{
  href: string;
  label: string;
  icon: IconKind;
  hero?: boolean;
}> = [
  { href: "/boutique", label: "Boutique", icon: "bag" },
  { href: "/palettes", label: "Palettes", icon: "grid" },
  /* User feedback 2026-05-31 « mets en première option vêtement et pas
     couleur » : le bouton central « Scanner » de la tabbar route maintenant
     directement vers /composer (mode vêtement plein écran). C'est le cas
     d'usage principal du scanner. /scanner (mode couleur) reste accessible
     via le toggle dans la bottom bar du composer. */
  { href: "/composer", label: "Scanner", icon: "scan", hero: true },
  { href: "/stylist", label: "Styliste", icon: "stylist" },
  { href: "/favoris", label: "Favoris", icon: "heart" },
];

export default function MobileTabBar() {
  const path = usePathname() || "/";
  const { favorites, hydrated: favHydrated } = useFavorites();
  const { outfits, hydrated: outfitHydrated } = useSavedOutfits();

  const notifCount = favorites.length + outfits.length;
  const showNotif = favHydrated && outfitHydrated && notifCount > 0;

  return (
    <nav className="wada-tabbar" aria-label="Navigation mobile">
      {TABS.map((t) => {
        /* « / » ne doit pas être actif sur /palettes parce qu'il
           « startsWith /palettes ». Le test exact évite la collision.

           Brief 2026-05-31 : le hero « Scanner » route vers /composer
           mais doit aussi être actif sur /scanner (les deux modes sont
           la même feature, juste l'autre face du toggle). */
        const isHeroScannerRoute = t.hero && (path === "/scanner" || path.startsWith("/scanner/"));
        const active = t.href === "/"
          ? path === "/"
          : path === t.href || path.startsWith(t.href + "/") || isHeroScannerRoute;

        if (t.hero) {
          /* Bouton central SURÉLEVÉ — cercle bordeaux 56×56 qui dépasse
             vers le haut de la barre. Le slot conserve son flex:1 pour
             que les 4 autres tabs restent équirépartis, mais le rond
             est positionné absolutely à la verticale.
             aria-current pas posé (il est déjà visuellement distinct). */
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              className="wada-tabbar-link wada-tabbar-hero"
            >
              <span className="wada-tabbar-hero-bubble" aria-hidden="true">
                <Icon kind={t.icon} size={26} />
              </span>
              <span className="wada-tabbar-label wada-tabbar-hero-label">
                {t.label}
              </span>
            </Link>
          );
        }

        const isFavoritesTab = t.href === "/favoris";

        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="wada-tabbar-link"
            style={{ position: "relative" }}
          >
            <span className="wada-tabbar-icon" aria-hidden="true">
              <Icon kind={t.icon} />
            </span>
            {isFavoritesTab && showNotif && (
              <span
                className="wada-tabbar-badge"
                aria-label={`${notifCount} favoris sauvegardés`}
              >
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
            <span className="wada-tabbar-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
