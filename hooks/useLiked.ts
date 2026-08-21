import { useCallback, useEffect, useState } from "react";

const LIKED_KEY = "wada-liked-products";

function readAll(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Favori produit, persisté en localStorage.
 *
 * `productId` doit être la MÊME clé partout pour un produit donné — utiliser
 * `groupKeyOf()` (lib/groupProducts), pas l'id Awin, qui varie par SKU
 * (taille/couleur) et donnerait un favori différent par variante.
 */
export function useLiked(productId: string) {
  const [liked, setLiked] = useState(false);

  /* Fix 2026-08-20 : le hook émettait un évènement `storage` à chaque écriture
     mais n'y était pas abonné. Deux composants montés sur le même produit — la
     carte de la grille et la Quick View ouverte par-dessus — ne se voyaient
     donc pas : cocher le cœur dans la modale laissait celui de la carte vide
     jusqu'au rechargement. On écoute maintenant l'évènement. */
  useEffect(() => {
    const sync = () => setLiked(readAll()[productId] || false);
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [productId]);

  const toggleLiked = useCallback((newLiked: boolean) => {
    try {
      const all = readAll();
      all[productId] = newLiked;
      localStorage.setItem(LIKED_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event("storage"));
    } catch {}
    setLiked(newLiked);
  }, [productId]);

  return [liked, toggleLiked] as const;
}
