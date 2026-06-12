// CartItem — structure identique à /app/panier/page.tsx (panier officiel)
export interface CartItem {
  id: string;
  piece: string; // "Top", "Bottom", "Shoes", "Accent", etc.
  item: string; // nom du produit
  colorName: string;
  colorHex: string;
  query: string; // pour retrouver le produit via /api/products
  fromEntry: string;
  addedAt: number;
}

const CART_KEY = "wada-cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("storage"));
  } catch {}
}

export function addToCart(item: Omit<CartItem, "id" | "addedAt">): void {
  const cart = getCart();
  cart.push({
    id: String(Date.now()),
    addedAt: Date.now(),
    ...item,
  });
  saveCart(cart);
}

export function removeFromCart(cartItemId: string) {
  const cart = getCart();
  const filtered = cart.filter((c) => c.id !== cartItemId);
  saveCart(filtered);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

export function getCartCount(): number {
  return getCart().length;
}
