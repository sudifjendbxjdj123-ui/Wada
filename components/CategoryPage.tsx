"use client";
/**
 * CategoryPage — Layout réutilisable pour toutes les pages /vetements,
 * /chaussures, /accessoires, /sacs, /bijoux.
 *
 * Lit les produits via /api/products (endpoint existant KV).
 * Grille style Lyst avec filtres genre/style.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";

interface BreadcrumbItem { label: string; href: string; }

interface Props {
  title: string;
  breadcrumb: BreadcrumbItem[];
  slot: string;      // "haut" | "bas,veste" | etc.
  q?: string;
  genre?: string;
  style?: string;
  page?: number;
}

const PER_PAGE = 32;

export default function CategoryPage({ title, breadcrumb, slot, q, genre: initGenre, style: initStyle, page: initPage = 1 }: Props) {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(initGenre ?? "");
  const [style, setStyle] = useState(initStyle ?? "");
  const [page, setPage] = useState(initPage);

  useEffect(() => {
    setLoading(true);
    const slots = slot.split(",");

    Promise.all(slots.map(async (s) => {
      const params = new URLSearchParams({ slot: s.trim(), limit: String(PER_PAGE) });
      if (q) params.set("q", q);
      if (genre) params.set("genre", genre);
      if (style) params.set("style", style);
      const r = await fetch(`/api/products?${params}`);
      if (!r.ok) return { products: [], total: 0 };
      return r.json();
    })).then((results) => {
      const all = results.flatMap((r) => r.products ?? []);
      const totalAll = results.reduce((s, r) => s + (r.total ?? 0), 0);
      setProducts(all);
      setTotal(totalAll);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slot, q, genre, style, page]);

  const GENRE_OPTIONS = [
    { value: "", label: "Tous" },
    { value: "homme", label: "Hommes" },
    { value: "femme", label: "Femmes" },
  ];

  const STYLE_OPTIONS = [
    { value: "", label: "Tous les styles" },
    { value: "Classique", label: "Classique" },
    { value: "Minimaliste", label: "Minimaliste" },
    { value: "Décontracté", label: "Décontracté" },
    { value: "Streetwear", label: "Streetwear" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", color: "#1E1E1E", fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "12px 24px", fontSize: 12, color: "#8a7a68" }}>
        {breadcrumb.map((item, i) => (
          <span key={item.href}>
            {i > 0 && <span style={{ margin: "0 6px" }}>›</span>}
            <Link href={item.href} style={{ color: "#8a7a68", textDecoration: "none" }}>{item.label}</Link>
          </span>
        ))}
      </div>

      {/* Header */}
      <div style={{ padding: "8px 24px 20px", borderBottom: "0.5px solid #e8dfd0" }}>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 32, fontWeight: 500, margin: "0 0 4px", textTransform: "capitalize" }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: 0, fontStyle: "italic" }}>
          {loading ? "Chargement…" : `${total.toLocaleString("fr-FR")} pièces`}
        </p>
      </div>

      {/* Filtres */}
      <div style={{ padding: "12px 24px", background: "#faf6ee", borderBottom: "0.5px solid #e8dfd0", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Genre */}
        <div style={{ display: "flex", gap: 6 }}>
          {GENRE_OPTIONS.map((g) => (
            <button key={g.value} onClick={() => setGenre(g.value)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                background: genre === g.value ? "#4a3d2a" : "#fff",
                color: genre === g.value ? "#f4eee4" : "#4a3d2a",
                border: `1px solid ${genre === g.value ? "#4a3d2a" : "#d4ccc0"}`,
              }}>
              {g.label}
            </button>
          ))}
        </div>

        {/* Style */}
        <select value={style} onChange={(e) => setStyle(e.target.value)}
          style={{
            padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            background: "#fff", color: "#4a3d2a", border: "1px solid #d4ccc0",
          }}>
          {STYLE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grille */}
      <div style={{ padding: "20px 16px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8a7a68" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20 }}>Aucune pièce trouvée</p>
            <p style={{ fontSize: 13 }}>Essayez de modifier les filtres.</p>
          </div>
        ) : (
          <div className="wada-category-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
          }}>
            {products.map((p) => (
              <a key={p.id} href={p.urlProduit} target="_blank" rel="noopener sponsored"
                style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ aspectRatio: "3/4", background: "#f0ebe2", borderRadius: 12, overflow: "hidden", marginBottom: 8, position: "relative" }}>
                  {(p.image || p.largeImage) && (
                    <img
                      src={p.image || p.largeImage}
                      alt={p.nom}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                    />
                  )}
                  {/* Pastille couleur */}
                  <span style={{
                    position: "absolute", top: 8, left: 8,
                    width: 10, height: 10, borderRadius: "50%",
                    background: p.hex || "#9B9B96",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }} />
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68" }}>
                  {p.marque}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 12, lineHeight: 1.3, color: "#2c2c2a", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.nom}
                </p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>
                  {p.prix?.toLocaleString("fr-FR")} €
                </p>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* CTA palette */}
      <div style={{ margin: "32px 16px", padding: "20px 24px", background: "#f2ede4", borderRadius: 16, textAlign: "center" }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 18, fontWeight: 500, margin: "0 0 8px" }}>
          Tu cherches une tenue complète ?
        </p>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: "0 0 14px" }}>
          Scanner une couleur pour voir les palettes Sanzō Wada compatibles
        </p>
        <Link href="/palettes" style={{
          display: "inline-block", background: "#6e3b32", color: "#f4eee4",
          borderRadius: 10, padding: "10px 22px", fontSize: 14,
          fontFamily: "'Fredoka'", textDecoration: "none",
        }}>
          Explorer les palettes →
        </Link>
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .wada-category-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .wada-category-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  );
}
