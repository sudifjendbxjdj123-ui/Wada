"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCartCount } from "@/lib/cart";

const CATEGORIES = [
  { label: "Vetements", href: "/vetements", icon: "👕" },
  { label: "Chaussures", href: "/chaussures", icon: "👟" },
  { label: "Accessoires", href: "/accessoires", icon: "👜" },
  { label: "Sacs", href: "/sacs", icon: "🎒" },
];

export function MobileNav({ onCartClick }: { onCartClick: () => void }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #e8dfd0",
        display: "none",
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      className="mobile-nav"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "8px 0",
        }}
      >
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              padding: "8px 12px",
              color: "#8a7a68",
              fontSize: 10,
              fontWeight: 500,
              fontFamily: "'Inter'",
              flex: 1,
            }}
          >
            <span style={{ fontSize: 18 }}>{cat.icon}</span>
            {cat.label}
          </Link>
        ))}

        {/* Cart button */}
        <button
          onClick={onCartClick}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 12px",
            color: "#8a7a68",
            fontSize: 10,
            fontWeight: 500,
            fontFamily: "'Inter'",
            flex: 1,
            position: "relative",
          }}
        >
          <span style={{ fontSize: 18 }}>🛒</span>
          Panier
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 4,
                background: "#6B3A32",
                color: "#fff",
                width: 18,
                height: 18,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}
