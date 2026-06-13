"use client";
/**
 * BrandShowcaseCompact — Discreet small brand showcase
 *
 * Like a sidebar element - small, subtle, doesn't take much space
 * Perfect for filling empty spaces without dominating the page
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  nom: string;
  marque: string;
  image?: string;
  largeImage?: string;
  prix: number;
  url?: string;
}

interface BrandShowcaseCompactProps {
  maxProducts?: number;
  cols?: 2 | 3;
}

export function BrandShowcaseCompact({
  maxProducts = 6,
  cols = 3,
}: BrandShowcaseCompactProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const slots = ["haut", "bas"];
        const results = await Promise.all(
          slots.map((slot) =>
            fetch(`/api/products?slot=${slot}&limit=20`)
              .then((r) => r.json())
              .catch(() => ({ products: [] })),
          ),
        );

        const allProducts: Product[] = results
          .flatMap((r) => r.products || [])
          .filter((p: any) => p.image || p.largeImage)
          .slice(0, maxProducts);

        if (alive) {
          setProducts(allProducts);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[BrandShowcaseCompact] Failed to load:", err);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [maxProducts]);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8DFD0",
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
      }}
    >
      {/* Small title */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#A8A890",
          textTransform: "uppercase",
          margin: "0 0 12px",
          letterSpacing: "0.5px",
        }}
      >
        À découvrir
      </p>

      {/* Compact grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
        }}
      >
        {products.map((product, idx) => {
          const imageUrl = (product.image || product.largeImage);
          const displayUrl = imageUrl?.startsWith("http")
            ? `/api/img?u=${encodeURIComponent(imageUrl)}`
            : imageUrl;

          return (
            <Link
              key={idx}
              href={product.url || "#"}
              style={{
                textDecoration: "none",
                display: "block",
                borderRadius: 8,
                overflow: "hidden",
                background: "#F5F1EB",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Image */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  overflow: "hidden",
                }}
              >
                <img
                  src={displayUrl}
                  alt={product.nom}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Mini info - on hover */}
              <div
                style={{
                  padding: 6,
                  fontSize: 10,
                  textAlign: "center",
                  color: "#8A7A68",
                  background: "#FAF8F4",
                  minHeight: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={product.nom}
              >
                {product.prix.toFixed(0)}€
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
