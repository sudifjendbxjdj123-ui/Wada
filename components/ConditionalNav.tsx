"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";

/**
 * ConditionalNav — affiche la Nav globale SAUF sur les routes
 * « plein écran caméra » (/scanner, /composer).
 *
 * Brief 2026-05-31 (user feedback screenshot) : sur le scanner et le
 * composer, on veut une expérience type Snapchat / Google Lens — la
 * caméra prend toute la hauteur de l'écran, sans le header WADA qui
 * réduit la zone visible et casse l'immersion.
 *
 * Le bouton « × » en haut de la page scanner sert de retour (vers /).
 */
export default function ConditionalNav() {
  const pathname = usePathname();
  if (pathname === "/scanner" || pathname === "/composer") return null;
  return <Nav />;
}
