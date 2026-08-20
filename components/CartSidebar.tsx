"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCart, removeFromCart, type CartItem } from "@/lib/cart";
import { showToast } from "@/lib/toast";

export function CartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  /* Fix 2026-08-20 « hydratation » : getCart() lisait localStorage pendant le
     render. Le serveur rendait « panier vide » et le client la vraie liste →
     divergence d'hydratation. On démarre vide des deux côtés et on charge le
     panier dans l'effet de synchronisation (qui tourne déjà au montage). */
  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync with localStorage changes (from other tabs/components)
  useEffect(() => {
    const handleStorageChange = () => {
      setCart(getCart());
    };
    handleStorageChange();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleRemove = (cartItemId: string) => {
    const itemToRemove = cart.find((item) => item.id === cartItemId);
    removeFromCart(cartItemId);
    setCart(getCart());

    // Show toast notification
    if (itemToRemove) {
      showToast(`✓ ${itemToRemove.item} retiré du panier`, {
        variant: "success",
        duration: 3000,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 150,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(100%, 380px)",
          background: "#fff",
          zIndex: 160,
          display: "flex",
          flexDirection: "column",
          boxShadow: isOpen ? "-4px 0 20px rgba(0,0,0,0.15)" : "none",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #e8dfd0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 20, fontWeight: 500, margin: 0, color: "#1a1a1a" }}>
            Panier
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: "#8a7a68",
            }}
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8a7a68" }}>
              <p style={{ fontFamily: "'Inter'", fontSize: 14, margin: 0 }}>Panier vide</p>
              <button
                onClick={onClose}
                style={{
                  marginTop: 16,
                  padding: "8px 16px",
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Inter'",
                }}
              >
                Continuer le shopping
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#faf6ee",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  {/* Color swatch */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 6,
                      background: item.colorHex,
                      border: "1px solid #e8dfd0",
                      flexShrink: 0,
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "'Inter'",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#1a1a1a",
                        margin: "0 0 4px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.item}
                    </p>
                    <p style={{ fontFamily: "'Inter'", fontSize: 10, color: "#8a7a68", margin: "0 0 4px" }}>
                      {item.colorName}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8a7a68",
                      cursor: "pointer",
                      fontSize: 16,
                      padding: 0,
                      fontFamily: "'Inter'",
                      textDecoration: "underline",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Checkout link */}
        {cart.length > 0 && (
          <div style={{ padding: 16, borderTop: "1px solid #e8dfd0", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'" }}>
              <span style={{ fontSize: 12, color: "#8a7a68" }}>{cart.length} article{cart.length > 1 ? "s" : ""}</span>
            </div>
            <Link
              href="/panier"
              onClick={onClose}
              style={{
                display: "block",
                width: "100%",
                padding: 12,
                background: "#1a1a1a",
                color: "#fff",
                textAlign: "center",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
                fontFamily: "'Inter'",
                border: "none",
              }}
            >
              Voir le panier
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
