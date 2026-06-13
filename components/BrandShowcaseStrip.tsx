"use client";
/**
 * BrandShowcaseStrip — Horizontal brand showcase for empty spaces
 *
 * Displays 4-6 featured products from partner brands in a horizontal strip
 * Perfect for filling spaces between sections on product/category pages
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

interface BrandShowcaseStripProps {
  cols?: 3 | 4 | 5 | 6; // Number of columns
  brands?: string[];
  title?: string;
}

export function BrandShowcaseStrip({
  cols = 4,
  brands,
  title = "Découvrez nos marques partenaires",
}: BrandShowcaseStripProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const slots = ["haut", "bas"];
        const results = await Promise.all(
          slots.map((slot) =>
            fetch(
              `/api/products?slot=${slot}&style=minimaliste&limit=${cols * 3}${
                brands ? `&marque=${brands.join(",")}` : ""
              }`,
            )
              .then((r) => r.json())
              .catch(() => ({ products: [] })),
          ),
        );

        const allProducts: Product[] = results
          .flatMap((r) => r.products || [])
          .filter((p: any) => p.image || p.largeImage)
          .slice(0, cols);

        if (alive) {
          setProducts(allProducts);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[BrandShowcaseStrip] Failed to load products:", err);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [brands, cols]);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        background: "#FAF8F4",
        padding: "32px 20px",
        margin: "24px 0",
      }}
    >
      {/* Title */}
      <div style={{ maxWidth: 1200, margin: "0 auto", marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#1F1B16",
            margin: "0 0 4px",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#8A7A68",
            margin: 0,
          }}
        >
          Sélection de pièces exclusives
        </p>
      </div>

      {/* Products Grid */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 16,
        }}
      >
        {products.map((product, idx) => {
          const imageUrl = product.image || product.largeImage;
          return (
            <Link
              key={idx}
              href={product.url || "#"}
              style={{
                textDecoration: "none",
                display: "block",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                border: "1px solid #E8DFD0",
                transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              {/* Image */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "3/4",
                  background: "#F5F1EB",
                  overflow: "hidden",
                }}
              >
                {imageUrl && (
                  <img
                    src={imageUrl.startsWith("http") ? `/api/img?u=${encodeURIComponent(imageUrl)}` : imageUrl}
                    alt={product.nom}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLImageElement).style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.transform = "scale(1)";
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>

              {/* Info */}
              <div style={{ padding: 12 }}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#A8A890",
                    margin: "0 0 6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {product.marque}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1F1B16",
                    margin: "0 0 8px",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {product.nom}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#6B3A32",
                      margin: 0,
                    }}
                  >
                    {product.prix.toFixed(2)}
                    {product.devise || "€"}
                  </p>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#A8A890",
                      fontWeight: 500,
                    }}
                  >
                    Voir →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div
        style={{
          maxWidth: 1200,
          margin: "24px auto 0",
          textAlign: "center",
        }}
      >
        <Link
          href="/vetements"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "#6B3A32",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#7a4a3f";
            (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#6B3A32";
            (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          }}
        >
          Explorer tous les produits
        </Link>
      </div>
    </section>
  );
}
