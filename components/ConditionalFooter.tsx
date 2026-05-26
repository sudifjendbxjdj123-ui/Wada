"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * ConditionalFooter — affiche le Footer global SAUF sur la home.
 *
 * Brief client 2026-05-26 verbatim : « Retirer le footer de la page
 * d'accueil uniquement (le bloc noir : logo WADA / Explorer / Compte /
 * Contact / ligne affiliation). À la place, l'accueil = la vidéo du
 * mannequin en plein écran, qui tourne en boucle. »
 *
 * Important : « Aucune modification sur les autres pages. » → toutes
 * les routes autres que `/` continuent d'afficher le Footer normalement.
 *
 * Implémentation : pas de duplication de Footer dans chaque page. On
 * garde le rendu global dans app/layout.tsx, mais on filtre la home
 * via usePathname(). Solution la plus chirurgicale.
 */
export default function ConditionalFooter() {
  const pathname = usePathname();
  // pathname peut être "/" exactement (home) ou commencer par "/?..."
  // (query strings). On filtre strictement "/" pour éviter de masquer
  // /about, /atelier, etc.
  if (pathname === "/") return null;
  return <Footer />;
}
