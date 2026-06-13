"use client";
/**
 * BrandBannerShowcase — High-quality brand banners from product feeds
 *
 * Displays full-width or half-width hero banners with product images
 * Perfect for empty spaces - uses real product images from feeds
 * Example: New Era Cap "Trucker 2026" banner (48x180 format)
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface BrandBanner {
  id: string;
  marque: string;
  nom: string;
  image: string;
  url?: string;
  categorie?: string;
  prix?: number;
}

interface BrandBannerShowcaseProps {
  layout?: "full-width" | "half-width" | "sidebar";
  autoRotate?: boolean;
  rotateInterval?: number;
  brands?: string[];
  maxBanners?: number;
}

export function BrandBannerShowcase({
  layout = "full-width",
  autoRotate = true,
  rotateInterval = 8000,
  brands,
  maxBanners = 6,
}: BrandBannerShowcaseProps) {
  const [banners, setBanners] = useState<BrandBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Fetch high-res product images from multiple sources
        const slots = ["haut", "bas", "veste", "chaussures"];
        const results = await Promise.all(
          slots.map((slot) =>
            fetch(
              `/api/products?slot=${slot}&limit=40${
                brands ? `&marque=${brands.join(",")}` : ""
              }`,
            )
              .then((r) => r.json())
              .catch(() => ({ products: [] })),
          ),
        );

        // Filter for products with large images (banner-suitable)
        const allBanners: BrandBanner[] = results
          .flatMap((r) => r.products || [])
          .filter((p: any) => p.largeImage || p.image)
          .map((p: any) => ({
            id: `${p.marchand}-${p.nom}`,
            marque: p.marque || p.marchand || "WADA",
            nom: p.nom,
            image: p.largeImage || p.image,
            url: p.urlProduit || "#",
            categorie: p.categorie,
            prix: p.prix,
          }))
          .slice(0, maxBanners);

        if (alive && allBanners.length > 0) {
          setBanners(allBanners);
          setLoading(false);
        }
      } catch (err) {
        console.warn("[BrandBannerShowcase] Failed to load banners:", err);
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [brands, maxBanners]);

  // Auto-rotate banners
  useEffect(() => {
    if (!autoRotate || banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, rotateInterval);

    return () => clearInterval(timer);
  }, [autoRotate, rotateInterval, banners.length]);

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];
  const imageUrl = currentBanner.image.startsWith("http")
    ? `/api/img?u=${encodeURIComponent(currentBanner.image)}`
    : currentBanner.image;

  // Layout dimensions
  const layoutStyles = {
    "full-width": {
      height: 300,
      padding: "20px",
      maxWidth: "none",
    },
    "half-width": {
      height: 240,
      padding: "16px",
      maxWidth: 600,
    },
    sidebar: {
      height: 400,
      padding: "12px",
      maxWidth: 220,
    },
  };

  const style = layoutStyles[layout] || layoutStyles["full-width"];

  return (
    <Link
      href={currentBanner.url || "#"}
      style={{
        display: "block",
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        height: style.height,
        maxWidth: style.maxWidth,
        margin: "0 auto 16px",
        textDecoration: "none",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "pointer",
        background: "#f5f1eb",
        border: "1px solid #E8DFD0",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={currentBanner.nom}
        loading="lazy"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Dark Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(30,30,30,0.3) 0%, rgba(30,30,30,0.1) 100%)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: style.padding,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          color: "#fff",
        }}
      >
        {/* Brand Label */}
        <div
          style={{
            fontSize: layout === "sidebar" ? 10 : 12,
            fontWeight: 700,
            opacity: 0.9,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {currentBanner.marque}
        </div>

        {/* Product Name */}
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: layout === "sidebar" ? 12 : 18,
            fontWeight: 700,
            lineHeight: 1.3,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {currentBanner.nom}
        </h3>

        {/* Price (if available) */}
        {currentBanner.prix && (
          <div
            style={{
              fontSize: layout === "sidebar" ? 12 : 16,
              fontWeight: 700,
              opacity: 0.95,
            }}
          >
            {currentBanner.prix.toFixed(2)}€
          </div>
        )}

        {/* CTA */}
        {layout !== "sidebar" && (
          <div
            style={{
              marginTop: 12,
              display: "inline-block",
              padding: "8px 16px",
              background: "#6B3A32",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              opacity: 0.95,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "#7a4a3f";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.95";
              e.currentTarget.style.background = "#6B3A32";
            }}
          >
            Découvrir →
          </div>
        )}
      </div>

      {/* Pagination indicators */}
      {banners.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            display: "flex",
            gap: 6,
            zIndex: 3,
          }}
        >
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex(idx);
              }}
              style={{
                width: layout === "sidebar" ? 4 : 6,
                height: layout === "sidebar" ? 4 : 6,
                borderRadius: "50%",
                border: "none",
                background: idx === currentIndex ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.2s",
              }}
              aria-label={`Banner ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTop: "2px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Link>
  );
}
