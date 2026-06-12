export interface CartItem {
  productId: string;
  marque: string;
  nom: string;
  couleur: string;
  hex: string;
  taille: string;
  prix: number;
  devise: string;
  image?: string;
  quantite: number;
  urlProduit: string;
  marchand: string;
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
  } catch {}
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const key = `${item.productId}-${item.taille}-${item.hex}`;
  const existing = cart.find(
    (c) => `${c.productId}-${c.taille}-${c.hex}` === key
  );

  if (existing) {
    existing.quantite += item.quantite;
  } else {
    cart.push(item);
  }

  saveCart(cart);
}

export function removeFromCart(productId: string, taille: string, hex: string) {
  const cart = getCart();
  const key = `${productId}-${taille}-${hex}`;
  const filtered = cart.filter((c) => `${c.productId}-${c.taille}-${c.hex}` !== key);
  saveCart(filtered);
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.prix * item.quantite, 0);
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantite, 0);
}
