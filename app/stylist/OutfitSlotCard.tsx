"use client";
/**
 * OutfitSlotCard — Carte unique pour une pièce de la tenue.
 * Remplace PieceCard avec sizing adapté (small pour Accent, large pour autres).
 */

import { useEffect, useState } from "react";
import { formatProductPrice } from "@/lib/priceFormat";
import type { OutfitPiece } from "@/lib/composer/microTypes";

interface MujiProduct {
  nom: string;
  marque: string;
  marchand?: string;
  marchandSlug?: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
}

interface OutfitSlotCardProps {
  piece: OutfitPiece;
  size?: "small" | "large";
  genre?: string | null;
  style?: string | null;
  loading?: boolean;
}

const BORDEAUX = "#6B3A32";
const CREAM = "#FAF8F4";
const LINE = "rgba(30,30,30,.10)";

// Hook pour fetch produit MUJI (copié du original avec optimisations)
function useMujiForSlot(
  slot: string | null,
  colorHex: string | null,
  style: string | null,
  genre: string | null,
  typeKeyword?: string | null,
): MujiProduct | null {
  const [product, setProduct] = useState<MujiProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slot || !colorHex) {
      setProduct(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      slot,
      color: colorHex,
      limit: "1",
    });

    if (style) params.set("style", style);
    if (genre) params.set("genre", genre.toLowerCase());
    if (typeKeyword) params.set("q", typeKeyword);

    // Timeout 3s pour éviter les fetches qui traînent
    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
        setProduct(null);
      }
    }, 3000);

    fetch(`/api/products?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        clearTimeout(timeoutId);
        if (cancelled || !data?.products?.length) return;

        const p = data.products[0];
        const displayImage = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";

        setProduct({
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          marchand: p.marchand,
          marchandSlug: p.marchandSlug,
          image: displayImage,
          prix: p.prix,
          devise: p.devise,
          url: p.urlProduit,
        });
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [slot, colorHex, style, genre, typeKeyword]);

  return product;
}

export function OutfitSlotCard({
  piece,
  size = "large",
  genre,
  style,
  loading: outerLoading = false,
}: OutfitSlotCardProps) {
  // Si c'est une pièce ancre (déjà possédée), pas de fetch MUJI
  const mujiProduct = useMujiForSlot(
    piece.ancre ? null : piece.role.toLowerCase(),
    piece.ancre ? null : piece.hex,
    style ?? null,
    genre ?? null,
    piece.typeKeyword,
  );

  const badgeIcon = piece.ancre ? "📌" : "✨";
  const minHeight = size === "small" ? 220 : 380;

  return (
    <div
      style={{
        background: CREAM,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(30,30,30,.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      {/* BADGE */}
      <div
        style={{
          background: piece.ancre ? "rgba(107, 58, 50, 0.12)" : "rgba(168, 178, 154, 0.12)",
          padding: "8px 12px",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          display: "flex",
          gap: 6,
          alignItems: "center",
          color: piece.ancre ? BORDEAUX : "#5a5a5a",
          fontFamily: "'Inter'",
        }}
      >
        <span>{badgeIcon}</span>
        <span>{piece.role}</span>
      </div>

      {/* IMAGE CONTAINER */}
      <div
        style={{
          aspectRatio: "4 / 5",
          background: `linear-gradient(to bottom, #fff 0%, ${piece.hex}20 100%)`,
          overflow: "hidden",
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
        }}
      >
        {mujiProduct?.image ? (
          <img
            src={mujiProduct.image}
            alt={mujiProduct.nom}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : outerLoading ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(90deg, ${CREAM} 0%, rgba(255,255,255,0.5) 50%, ${CREAM} 100%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ) : piece.ancre ? (
          <span style={{ fontSize: 12, color: "#999", fontFamily: "'Inter'" }}>Votre pièce</span>
        ) : (
          <span style={{ fontSize: 12, color: "#ccc", fontFamily: "'Inter'" }}>◻</span>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* NOM PIÈCE */}
        <p
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.2,
            color: "#1a1a1a",
            margin: "0 0 8px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {mujiProduct?.nom || piece.type}
        </p>

        {/* MUJI PRODUCT ou FALLBACK */}
        {mujiProduct ? (
          <div
            style={{
              marginTop: "auto",
              background: "rgba(255,255,255,0.7)",
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px 0", fontFamily: "'Inter'" }}>
              {mujiProduct.marque}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: BORDEAUX, margin: "0 0 8px 0", fontFamily: "'Inter'" }}>
              {formatProductPrice(mujiProduct.prix, mujiProduct.marchandSlug, mujiProduct.devise)}
            </p>
            <a
              href={mujiProduct.url}
              target="_blank"
              rel="noopener sponsored"
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                background: "#1a1a1a",
                color: CREAM,
                border: "none",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                textAlign: "center",
                fontFamily: "'Inter'",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0a0a0a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
              }}
            >
              Acheter sur {mujiProduct.marchand || "MUJI"} →
            </a>
          </div>
        ) : !piece.ancre ? (
          <p
            style={{
              fontSize: 11.5,
              color: "#8a7a68",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.45,
              fontFamily: "'Inter'",
            }}
          >
            En cours de recherche chez nos partenaires…
          </p>
        ) : null}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
