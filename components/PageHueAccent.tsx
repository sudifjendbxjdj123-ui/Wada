"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Injecte un décalage de teinte CSS (`--wada-page-hue`) sur <html> selon
 * la route courante. Le fond SVG (body::before, cf. globals.css) applique
 * `filter: hue-rotate(var(--wada-page-hue))` → chaque page reçoit une
 * teinte propre tout en gardant le même motif. Transition fluide entre
 * routes (600ms cubic-bezier) → la couleur du site "respire" à chaque
 * navigation.
 *
 * Pour les routes dynamiques (/palette/[number]), on dérive la teinte du
 * numéro de palette → chaque tenue a sa propre couleur de fond.
 */

const ROUTE_HUES: Record<string, number> = {
  "/":                0,    // Couverture — Mojo brut, référence
  "/atelier":         30,   // Tons chauds
  "/scanner":         55,   // Or
  "/generateur":      90,   // Vert tendre
  "/palettes":        130,  // Forêt
  "/stylist":         170,  // Cyan/turquoise
  "/garde-robe":      205,  // Bleu nuit
  "/cultures":        240,  // Violet
  "/couleurs":        275,  // Magenta
  "/decouverte":      310,  // Rose
  "/compte":          340,  // Rouge-rose
  "/favoris":         15,   // Orange-mojo
  "/calendrier":      75,   // Citron
  "/tarifs":          110,  // Vert pomme
  "/fonctionnalites": 200,  // Bleu
  "/about":           260,  // Indigo
  "/contact":         290,  // Violet
  "/faq":             50,   // Or pâle
  "/panier":          5,    // Mojo
  "/install":         140,  // Émeraude
};

/** Hash simple pour dériver une teinte stable depuis une chaîne. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

export default function PageHueAccent() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === "undefined") return;
    let hue = ROUTE_HUES[pathname];
    if (hue === undefined) {
      // Routes dynamiques (palette/[n], cgv, mentions, etc.) :
      // teinte dérivée du hash du path → stable pour la même URL.
      hue = hashStr(pathname) % 360;
    }
    document.documentElement.style.setProperty("--wada-page-hue", `${hue}deg`);
  }, [pathname]);

  return null;
}
