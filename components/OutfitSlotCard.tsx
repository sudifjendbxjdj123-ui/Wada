"use client";
/**
 * OutfitSlotCard — Product card for stylist outfit slots
 *
 * Features:
 * - Skeleton loader while fetching
 * - Error state with retry
 * - Responsive layout
 * - Haptic feedback on load
 */

import { useEffect, useState } from "react";
import { OutfitPieceSkeleton } from "./OutfitPieceSkeleton";

interface OutfitSlotCardProps {
  slot: string;
  product: {
    nom: string;
    marque: string;
    image: string;
    prix: number;
    devise: string;
    url: string;
  } | null;
  loading: boolean;
  error: Error | null;
  onRetry?: () => void;
}

export function OutfitSlotCard({
  slot,
  product,
  loading,
  error,
  onRetry,
}: OutfitSlotCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Add haptic feedback when product loads
  useEffect(() => {
    if (product && imageLoaded) {
      // Provide haptic feedback on mobile
      if (navigator?.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, [product, imageLoaded]);

  // Show skeleton while loading
  if (loading) {
    return <OutfitPieceSkeleton size="large" />;
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          background: "#FAF8F4",
          border: "1px solid #E8DFD0",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 380,
          gap: 16,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontSize: 48,
              margin: "0 0 8px",
            }}
          >
            ⚠️
          </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1F1B16",
              margin: "0 0 4px",
            }}
          >
            Produit indisponible
          </p>
          <p
            style={{
              fontSize: 12,
              color: "#8A7A68",
              margin: 0,
            }}
          >
            {slot}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: "10px 20px",
              background: "#6B3A32",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "#7a4a3f";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "#6B3A32";
            }}
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  // Show product card
  if (!product) {
    return null;
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8DFD0",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 20px 40px rgba(30,30,30,.12)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image Container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 240,
          background: "#F9F7F3",
          overflow: "hidden",
        }}
      >
        <img
          src={product.image}
          alt={product.nom}
          onLoad={() => setImageLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: imageLoaded ? 1 : 0.5,
            transition: "opacity 0.3s",
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23e8dfd8' width='400' height='300'/%3E%3C/svg%3E";
          }}
        />

        {/* Slot Label */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "rgba(255,255,255,.9)",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            color: "#6B3A32",
            backdropFilter: "blur(4px)",
          }}
        >
          {slot}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand */}
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 11,
            fontWeight: 700,
            color: "#A8A890",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {product.marque}
        </p>

        {/* Product Name */}
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 14,
            fontWeight: 600,
            color: "#1F1B16",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.nom}
        </p>

        {/* Price */}
        <p
          style={{
            margin: "auto 0 0",
            fontSize: 16,
            fontWeight: 700,
            color: "#6B3A32",
          }}
        >
          {product.prix.toFixed(2)}
          {product.devise}
        </p>
      </div>

      {/* CTA Button */}
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: 12,
          background: "#6B3A32",
          color: "#fff",
          textDecoration: "none",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          transition: "all 0.2s",
          borderTop: "1px solid #E8DFD0",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#7a4a3f";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#6B3A32";
        }}
      >
        Voir le produit
      </a>
    </div>
  );
}
