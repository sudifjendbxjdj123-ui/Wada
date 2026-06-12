"use client";
import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  piece: string;
  item: string;
  colorName: string;
  colorHex: string;
  query: string;
  fromEntry: string;
  addedAt: number;
  /** Si l'utilisateur a sauvegardé une marque spécifique (ex: sandales chez COS),
      on conserve l'info pour rouvrir le bon onglet quand il revient. */
  brandLabel?: string;
  brandUrl?: string;
};

const STORAGE_KEY = "wada-cart";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try { setCart(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const persist = useCallback((next: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setCart((prev) => {
      const updated = typeof next === "function" ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(updated) }));
      } catch (e) {
        // Handle quota exceeded error
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          console.error("localStorage plein: impossible de sauvegarder le panier");
          // Could dispatch a toast notification here if needed
        }
      }
      return updated;
    });
  }, []);

  const add = useCallback((item: Omit<CartItem, "id" | "addedAt">) => {
    persist((prev) => [{ ...item, id: uid(), addedAt: Date.now() }, ...prev]);
  }, [persist]);

  const addMany = useCallback((items: Array<Omit<CartItem, "id" | "addedAt">>) => {
    const stamped = items.map((i) => ({ ...i, id: uid(), addedAt: Date.now() }));
    persist((prev) => [...stamped, ...prev]);
  }, [persist]);

  const remove = useCallback((id: string) => persist((prev) => prev.filter((c) => c.id !== id)), [persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { cart, add, addMany, remove, clear, hydrated, count: cart.length };
}
