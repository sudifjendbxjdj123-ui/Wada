"use client";
/**
 * /marques/[slug] — Page d'une marque (produits depuis KV via /api/products?q=...).
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";
import { useParams } from "next/navigation";

function unslugBrand(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BrandPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const brandName = unslugBrand(slug || "");

  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    // Fetch tous les slots pour cette marque
    const slots = ["haut", "bas", "veste", "chaussures", "accent"];
    Promise.all(
      slots.map((slot) =>
        fetch(`/api/products?slot=${slot}&q=${encodeURIComponent(brandName)}&limit=20`)
          .then((r) => r.json())
          .catch(() => ({ products: [] })),
      ),
    ).then((results) => {
      const all: ProduitAwin[] = results.flatMap((r) => r.products ?? []);
      /* Filtrer ceux dont la marque correspond vraiment */
      const filtered = all.filter(
        (p) => (p.marque || "").toLowerCase().includes(slug.replace(/-/g, " ")) ||
               (p.marchand || "").toLowerCase().includes(slug.replace(/-/g, "")),
      );
      setProducts(filtered);
      setTotal(filtered.length);
      setLoading(false);
    });
  }, [slug, brandName]);

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "12px 24px", fontSize: 12, color: "#8a7a68" }}>
        <Link href="/" style={{ color: "#8a7a68", textDecoration: "none" }}>Accueil</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <Link href="/marques" style={{ color: "#8a7a68", textDecoration: "none" }}>Marques</Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span>{brandName}</span>
      </div>

      {/* Header marque */}
      <header style={{ padding: "16px 24px 24px", borderBottom: "0.5px solid #e8dfd0" }}>
        <div style={{
          width: 72, height: 72, background: "#f2ede4", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14, fontSize: 24, fontFamily: "'Fredoka'",
          color: "#6e3b32", fontWeight: 600,
        }}>
          {brandName.charAt(0)}
        </div>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 30, fontWeight: 500, margin: "0 0 6px", color: "#2c2c2a" }}>
          {brandName}
        </h1>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: 0, fontStyle: "italic" }}>
          {loading ? "Chargement…" : `${total} pièces disponibles`}
        </p>
      </header>

      {/* Grille produits */}
      <div style={{ padding: "20px 16px 60px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20, color: "#8a7a68" }}>
              Aucun produit trouvé pour {brandName}
            </p>
            <Link href="/marques" style={{
              display: "inline-block", marginTop: 16, color: "#6e3b32",
              textDecoration: "underline", fontSize: 14,
            }}>
              ← Toutes les marques
            </Link>
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12,
          }}>
            {products.map((p) => (
              <a key={p.id} href={p.urlProduit} target="_blank" rel="noopener sponsored"
                style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ aspectRatio: "3/4", background: "#f0ebe2", borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                  {(p.image || p.largeImage) && (
                    <img src={p.image || p.largeImage} alt={p.nom} loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                  )}
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 12, lineHeight: 1.3, color: "#2c2c2a" }}>{p.nom}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2c2c2a" }}>{p.prix?.toLocaleString("fr-FR")} €</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
