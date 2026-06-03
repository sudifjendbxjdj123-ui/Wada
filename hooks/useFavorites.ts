"use client";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wada-favorites";

/** Manage palette favorites stored locally. Synchronised across tabs and tabs / components. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try { setFavorites(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const persist = useCallback((next: string[]) => {
    setFavorites(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const toggle = useCallback((number: string) => {
    persist(favorites.includes(number) ? favorites.filter((n) => n !== number) : [...favorites, number]);
  }, [favorites, persist]);

  const has = useCallback((number: string) => favorites.includes(number), [favorites]);

  const clear = useCallback(() => persist([]), [persist]);

  return { favorites, toggle, has, clear, hydrated };
}
