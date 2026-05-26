/**
 * Brief finition (24/05) — Toast système ultra-léger.
 *
 * API publique : `showToast(message)` depuis n'importe quel composant
 * (server- ou client-side, l'appel est gardé par typeof window).
 * Un seul Toast écouteur monté dans `app/layout.tsx` consomme l'événement.
 *
 * Pas de Context React, pas de provider — juste un CustomEvent sur window.
 * Avantage : zéro prop-drilling, fonctionne depuis n'importe où, y compris
 * un handler de bouton dans une page server-rendered hydratée.
 */

export const WADA_TOAST_EVENT = "wada-toast" as const;

export interface WadaToastDetail {
  message: string;
  /** Variante visuelle. `info` par défaut, `success` pour les confirmations. */
  variant?: "info" | "success";
  /** Durée d'affichage en ms. Défaut 2500. */
  duration?: number;
}

/**
 * Déclenche un toast. Safe sur SSR (no-op si window absent).
 *
 * Exemples :
 *   showToast("Ajouté à vos favoris ✓", { variant: "success" });
 *   showToast("Lien copié");
 */
export function showToast(message: string, options?: Omit<WadaToastDetail, "message">) {
  if (typeof window === "undefined") return;
  const detail: WadaToastDetail = {
    message,
    variant: options?.variant ?? "info",
    duration: options?.duration ?? 2500,
  };
  window.dispatchEvent(new CustomEvent<WadaToastDetail>(WADA_TOAST_EVENT, { detail }));
}
