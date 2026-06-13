"use client";
/**
 * SidebarBrandShowcase — Featured brands in empty spaces
 *
 * Displays rotating products from partner brands (New Balance, etc)
 * in vertical sidebar format - perfect for empty corners on product pages
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  nom: string;
  marque: string;
  image?: string;
  largeImage?: string;
  prix: number;
  devise?: string;
  url?: string;
}

interface SidebarBrandShowcaseProps {
  maxProducts?: number;
  autoRotate?: boolean;
  rotateInterval?: number;
  brands?: string[]; // Filter by specific brands
}

export function SidebarBrandShowcase({
  maxProducts = 3,
  autoRotate = true,
  rotateInterval = 5000,
  brands,
}: SidebarBrandShowcaseProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Fetch from multiple brand sources
        const slots = ["haut", "bas", "chaussures"];
        const results = await Promise.all(
          slots.map((slot) =>
            fetch(
              `/api/products?slot=${slot}&style=minimaliste&limit=20${
                brands ? `&marque=${brands.join(",")}` : ""
              }`,
            )
              .then((r) => r.json())
              .catch(() => ({ products: [] })),
          ),
        );

        const allProducts: Product[] = results
          .flatMap((r) => r.products || [])
          .filter(
            (p: any) =>
              p.image || p.largeImage,
          )
          .slice(0, maxProducts * 3); // Get more for rotation

        if (alive) {
          setProducts(allProducts);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[SidebarBrandShowcase] Failed to load products:", err);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [brands, maxProducts]);

  // Auto-rotate products
  useEffect(() => {
    if (!autoRotate || products.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(products.length / maxProducts));
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [autoRotate, rotateInterval, products.length, maxProducts]);

  if (loading || products.length === 0) {
    return null;
  }

  const displayedProducts = products.slice(currentIndex * maxProducts, (currentIndex + 1) * maxProducts);

  return (
    <aside
      style={{
        background: "#FAF8F4",
        borderRadius: 12,
        padding: 16,
        maxWidth: 220,
      }}
    >
      {/* Header */}
      <h3
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#A8A890",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          margin: "0 0 12px",
        }}
      >
        Marques en vedette
      </h3>

      {/* Products Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
        }}
      >
        {displayedProducts.map((product, idx) => {
          const imageUrl = product.image || product.largeImage;
          return (
            <Link
              key={idx}
              href={product.url || "#"}
              style={{
                textDecoration: "none",
                display: "block",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
                border: "1px solid #E8DFD0",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Image */}
              {imageUrl && (
                <img
                  src={imageUrl.startsWith("http") ? `/api/img?u=${encodeURIComponent(imageUrl)}` : imageUrl}
                  alt={product.nom}
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "3/4",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}

              {/* Info */}
              <div style={{ padding: 8 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#A8A890",
                    margin: "0 0 4px",
                    textTransform: "uppercase",
                  }}
                >
                  {product.marque}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#1F1B16",
                    margin: "0 0 6px",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {product.nom}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6B3A32",
                    margin: 0,
                  }}
                >
                  {product.prix.toFixed(2)}
                  {product.devise || "€"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination dots */}
      {Math.ceil(products.length / maxProducts) > 1 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            marginTop: 12,
          }}
        >
          {Array.from({ length: Math.ceil(products.length / maxProducts) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                border: "none",
                background: idx === currentIndex ? "#6B3A32" : "#D4C5B9",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s",
              }}
              aria-label={`Page ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
