import { useState, useEffect } from "react";

const LIKED_KEY = "wada-liked-products";

export function useLiked(productId: string) {
  const [liked, setLiked] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      const liked = raw ? JSON.parse(raw) : {};
      setLiked(liked[productId] || false);
    } catch {
      setLiked(false);
    }
  }, [productId]);

  // Update localStorage when liked state changes
  const toggleLiked = (newLiked: boolean) => {
    try {
      const raw = localStorage.getItem(LIKED_KEY);
      const liked = raw ? JSON.parse(raw) : {};
      liked[productId] = newLiked;
      localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
      window.dispatchEvent(new Event("storage"));
    } catch {}
    setLiked(newLiked);
  };

  return [liked, toggleLiked] as const;
}
