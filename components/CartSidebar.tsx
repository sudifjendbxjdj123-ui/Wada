"use client";
import Link from "next/link";
import { useState } from "react";
import { getCart, removeFromCart, getCartTotal } from "@/lib/cart";
import { formatProductPrice } from "@/lib/priceFormat";

export function CartSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [cart, setCart] = useState(() => getCart());

  const handleRemove = (productId: string, taille: string, hex: string) => {
    removeFromCart(productId, taille, hex);
    setCart(getCart());
  };

  const total = cart.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  const count = cart.reduce((sum, item) => sum + item.quantite, 0);

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
              {cart.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "#faf6ee",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    gap: 12,
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 6,
                      background: "#f0e9d8",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.nom}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>

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
                      {item.nom}
                    </p>
                    <p style={{ fontFamily: "'Inter'", fontSize: 10, color: "#8a7a68", margin: "0 0 4px" }}>
                      {item.marque}
                    </p>
                    <div style={{ display: "flex", gap: 6, fontSize: 10, color: "#8a7a68", fontFamily: "'Inter'" }}>
                      <span>Taille: {item.taille}</span>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: item.hex }} />
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <p style={{ fontFamily: "'Inter'", fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                      {formatProductPrice(item.prix * item.quantite, "", item.devise)}
                    </p>
                    <button
                      onClick={() => handleRemove(item.productId, item.taille, item.hex)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#8a7a68",
                        cursor: "pointer",
                        fontSize: 12,
                        textDecoration: "underline",
                        fontFamily: "'Inter'",
                        padding: 0,
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Total + Checkout */}
        {cart.length > 0 && (
          <div style={{ padding: 16, borderTop: "1px solid #e8dfd0", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Inter'" }}>
              <span style={{ fontSize: 12, color: "#8a7a68" }}>Total ({count} article{count > 1 ? "s" : ""}):</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{formatProductPrice(total, "", "EUR")}</span>
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
              Passer la commande
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
