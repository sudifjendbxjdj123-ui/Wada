"use client";
import { usePathname } from "next/navigation";
import MobileTabBar from "./MobileTabBar";

/**
 * ConditionalTabBar — affiche le tabbar bottom-nav mobile SAUF sur
 * les routes « plein écran caméra » (/scanner, /composer).
 *
 * Brief 2026-05-31 (user feedback screenshot) : la barre d'onglets
 * basse mange la zone des contrôles caméra (toggle Couleur/Vêtement,
 * bouton capture, galerie). Sur ces routes, c'est notre propre UI
 * caméra qui occupe le bas — pas le tabbar global.
 */
export default function ConditionalTabBar() {
  const pathname = usePathname();
  if (pathname === "/scanner" || pathname === "/composer") return null;
  return <MobileTabBar />;
}
