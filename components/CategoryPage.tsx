"use client";
/**
 * CategoryPage — Grille shopping style Lyst/MUJI.fr.
 * Brief 2026-06-03 : cards épurées, 4 colonnes desktop, filtres genre/style.
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";

interface BreadcrumbItem { label: string; href: string; }

interface Props {
  title: string;
  breadcrumb: BreadcrumbItem[];
  slot: string;
  q?: string;
  genre?: string;
  style?: string;
  page?: number;
}

const SOURCE_LABEL: Record<string, string> = {
  "muji-france": "MUJI France",
  "the-business-fashion": "The Business Fashion",
  "suitable-fr": "Suitable FR",
};

function ProductCard({ p }: { p: ProduitAwin }) {
  const [liked, setLiked] = useState(false);
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;

  return (
    <article style={{ position: "relative" }}>
      <a href={p.urlProduit} target="_blank" rel="noopener sponsored"
        style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {/* Image */}
        <div style={{
          background: "#f5f1eb",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "3/4",
          position: "relative",
          marginBottom: 10,
        }}>
          {(p.image || p.largeImage) ? (
            <img
              src={p.image || p.largeImage}
              alt={p.nom}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#c5b9a8", fontSize: 28,
            }}>◻</div>
          )}

          {/* Badge solde si prix inférieur au prix normal — indication simple */}

          {/* Pastille couleur */}
          <span style={{
            position: "absolute", top: 10, left: 10,
            width: 8, height: 8, borderRadius: "50%",
            background: p.hex || "#9B9B96",
            border: "1px solid rgba(0,0,0,0.1)",
          }} />
        </div>

        {/* Texte sous la carte */}
        <p style={{
          margin: "0 0 1px",
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#8a7a68", fontFamily: "'Inter', sans-serif",
        }}>
          {p.marque}
        </p>

        <p style={{
          margin: "0 0 4px", fontSize: 13, lineHeight: 1.35,
          color: "#1a1a1a", fontFamily: "'Inter', sans-serif",
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {p.nom}
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: "#1a1a1a", fontFamily: "'Inter', sans-serif",
          }}>
            {p.prix?.toLocaleString("fr-FR")} €
          </span>
        </div>

        <p style={{
          margin: 0, fontSize: 11, color: "#a89880",
          fontFamily: "'Inter', sans-serif",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <span style={{ fontSize: 9 }}>↗</span> {source}
        </p>
      </a>

      {/* Cœur */}
      <button
        onClick={() => setLiked(!liked)}
        aria-label="Ajouter aux favoris"
        style={{
          position: "absolute", top: 10, right: 10,
          width: 32, height: 32,
          background: "rgba(255,255,255,0.9)",
          border: "none", borderRadius: "50%",
          cursor: "pointer", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {liked ? "❤️" : "🤍"}
      </button>
    </article>
  );
}

export default function CategoryPage({
  title, breadcrumb, slot, q, genre: initGenre, style: initStyle, page: initPage = 1,
}: Props) {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(initGenre ?? "");
  const [style, setStyle] = useState(initStyle ?? "");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const slots = slot.split(",");
    const results = await Promise.all(slots.map(async (s) => {
      const p = new URLSearchParams({ slot: s.trim(), limit: "32" });
      if (q) p.set("q", q);
      if (genre) p.set("genre", genre);
      if (style) p.set("style", style);
      const r = await fetch(`/api/products?${p}`).then(res => res.json()).catch(() => ({ products: [] }));
      return r;
    }));
    const all: ProduitAwin[] = results.flatMap(r => r.products ?? []);
    setProducts(all);
    setTotal(results.reduce((s, r) => s + (r.total ?? 0), 0));
    setLoading(false);
  }, [slot, q, genre, style]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const GENRES = [
    { value: "", label: "Tous" },
    { value: "homme", label: "Hommes" },
    { value: "femme", label: "Femmes" },
  ];

  const STYLES = [
    { value: "", label: "Tous les styles" },
    { value: "Classique", label: "Classique" },
    { value: "Minimaliste", label: "Minimaliste" },
    { value: "Décontracté", label: "Décontracté" },
    { value: "Streetwear", label: "Streetwear" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>

      {/* Breadcrumb */}
      <div style={{ padding: "10px 20px", fontSize: 12, color: "#8a7a68", borderBottom: "0.5px solid #e8dfd0" }}>
        {breadcrumb.map((item, i) => (
          <span key={item.href}>
            {i > 0 && <span style={{ margin: "0 5px", opacity: 0.5 }}>›</span>}
            <Link href={item.href} style={{ color: "#8a7a68", textDecoration: "none" }}>{item.label}</Link>
          </span>
        ))}
      </div>

      {/* Header */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid #e8dfd0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Fredoka'", fontSize: 28, fontWeight: 500, margin: 0, color: "#1a1a1a", textTransform: "capitalize" }}>
            {title}
          </h1>
          <span style={{ fontSize: 13, color: "#8a7a68", fontStyle: "italic" }}>
            {loading ? "" : `${total.toLocaleString("fr-FR")} pièces`}
          </span>
        </div>
      </div>

      {/* Filtres — style MUJI.fr */}
      <div style={{
        padding: "12px 20px", background: "#fff",
        borderBottom: "0.5px solid #e8dfd0",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {/* Genre chips */}
        {GENRES.map((g) => (
          <button key={g.value} onClick={() => setGenre(g.value)}
            style={{
              padding: "7px 16px", borderRadius: 999, fontSize: 13,
              cursor: "pointer", fontFamily: "'Inter'", fontWeight: 500,
              background: genre === g.value ? "#1a1a1a" : "transparent",
              color: genre === g.value ? "#fff" : "#1a1a1a",
              border: `1px solid ${genre === g.value ? "#1a1a1a" : "rgba(26,26,26,0.18)"}`,
              transition: "all 0.15s",
            }}>
            {g.label}
          </button>
        ))}

        <span style={{ width: 1, height: 20, background: "#e8dfd0", margin: "0 4px" }} />

        {/* Style select */}
        <select value={style} onChange={(e) => setStyle(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 999, fontSize: 13,
            background: "transparent", color: "#1a1a1a",
            border: "1px solid rgba(26,26,26,0.18)",
            cursor: "pointer", fontFamily: "'Inter'", outline: "none",
          }}>
          {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Grille — 4 colonnes desktop style Lyst */}
      <div style={{ padding: "20px 16px 60px" }}>
        {loading ? (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, opacity: 0.6 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20, color: "#8a7a68" }}>Aucun produit trouvé</p>
            <p style={{ fontSize: 13, color: "#a89880" }}>Essayez un autre style ou genre.</p>
          </div>
        ) : (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {/* CTA palette */}
      <div style={{
        margin: "0 16px 40px", padding: "18px 20px",
        background: "#f2ede4", borderRadius: 14, textAlign: "center",
      }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, margin: "0 0 6px" }}>
          Trouver les pièces de ta palette
        </p>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: "0 0 12px", fontFamily: "'Inter'" }}>
          Scanner une couleur pour voir les palettes Sanzō Wada qui vont avec
        </p>
        <Link href="/palettes" style={{
          display: "inline-block", background: "#1a1a1a", color: "#fff",
          borderRadius: 999, padding: "10px 22px",
          fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none",
        }}>
          Explorer les 348 palettes →
        </Link>
      </div>

      <style jsx>{`
        @media (min-width: 640px) {
          .wada-shop-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .wada-shop-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
