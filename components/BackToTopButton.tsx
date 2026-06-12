"use client";
import { useEffect, useState } from "react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Retour vers le haut"
      style={{
        position: "fixed",
        bottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
        right: 24,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "#6B3A32",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        boxShadow: "0 4px 12px rgba(107, 58, 50, 0.3)",
        zIndex: 40,
        animation: "wadaBttSlideUp 0.3s ease-out",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(107, 58, 50, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(107, 58, 50, 0.3)";
      }}
    >
      ↑
      <style>{`
        @keyframes wadaBttSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          button[aria-label="Retour vers le haut"] {
            width: 44px !important;
            height: 44px !important;
            right: 16px !important;
            bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
            font-size: 18px !important;
          }
        }
      `}</style>
    </button>
  );
}
