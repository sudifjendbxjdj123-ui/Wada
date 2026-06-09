"use client";
/**
 * HomeNouveautes — Grille 6 produits style Lyst/MUJI.fr.
 * Cards épurées, 4 colonnes desktop, source label, cœur.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";
import { formatProductPrice } from "@/lib/priceFormat";

const SOURCE_LABEL: Record<string, string> = {
  "muji-france": "MUJI France",
  "the-business-fashion": "The Business Fashion",
  "suitable-fr": "Suitable FR",
};

export function HomeNouveautes() {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const slots = ["haut", "bas", "veste", "chaussures", "accent"];
    Promise.all(
      slots.map((s) =>
        fetch(`/api/products?slot=${s}&limit=2`)
          .then((r) => r.json()).then((d) => d.products ?? []).catch(() => []),
      ),
    ).then((results) => {
      const all: ProduitAwin[] = results.flat().filter((p) => p.image || p.largeImage);
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      setProducts(all.slice(0, 8));
      setLoading(false);
    });
  }, []);

  const toggleLike = (id: string) =>
    setLiked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <section style={{ padding: "32px 16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
          Nouveautés
        </h2>
        <Link href="/vetements" style={{ fontSize: 13, color: "#6e3b32", textDecoration: "underline", fontFamily: "'Inter'" }}>
          Voir tout
        </Link>
      </div>

      {loading ? (
        <div className="wada-nouv-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, opacity: 0.6 }} />
          ))}
        </div>
      ) : (
        <div className="wada-nouv-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {products.map((p) => {
            const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
            return (
              <article key={p.id} style={{ position: "relative" }}>
                {p.urlProduit ? (
                  <a href={p.urlProduit} target="_blank" rel="noopener sponsored" style={{ textDecoration: "none", color: "inherit", display: "block" }}>

                  {/* Image */}
                  <div style={{
                    background: "#f5f1eb", borderRadius: 12, overflow: "hidden",
                    aspectRatio: "3/4", position: "relative", marginBottom: 9,
                  }}>
                    <img src={p.image || p.largeImage} alt={p.nom} loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                    <span style={{
                      position: "absolute", top: 8, left: 8,
                      width: 7, height: 7, borderRadius: "50%",
                      background: p.hex || "#9B9B96", border: "1px solid rgba(0,0,0,0.1)",
                    }} />
                  </div>

                  {/* Infos */}
                  <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>
                    {p.marque}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 12, lineHeight: 1.3, color: "#1a1a1a", fontFamily: "'Inter'", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.nom}
                  </p>
                  <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>
                    {formatProductPrice(p.prix, p.marchandSlug, p.devise)}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#a89880", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 9 }}>↗</span> {source}
                  </p>
                  </a>
                ) : (
                  <div style={{ textDecoration: "none", color: "inherit", display: "block", opacity: 0.5 }}>
                    <div style={{ background: "#f5f1eb", borderRadius: 12, overflow: "hidden", aspectRatio: "3/4", position: "relative", marginBottom: 9 }} />
                    <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>
                      {p.marque}
                    </p>
                    <p style={{ margin: "0 0 4px", fontSize: 12, lineHeight: 1.3, color: "#1a1a1a", fontFamily: "'Inter'" }}>
                      {p.nom}
                    </p>
                  </div>
                )}

                {/* Cœur */}
                <button onClick={() => toggleLike(p.id)} aria-label="Favoris"
                  style={{
                    position: "absolute", top: 8, right: 8,
                    width: 30, height: 30, background: "rgba(255,255,255,0.9)",
                    border: "none", borderRadius: "50%", cursor: "pointer",
                    fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}>
                  {liked.has(p.id) ? "❤️" : "🤍"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 640px) {
          .wada-nouv-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .wada-nouv-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}
