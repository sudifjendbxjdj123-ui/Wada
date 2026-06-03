"use client";
/**
 * HomeNouveautes — 6 produits depuis le KV.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 * Appelle /api/products (endpoint existant) côté client.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";

export function HomeNouveautes() {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    /* Mélange les slots pour avoir de la variété */
    const slots = ["haut", "bas", "veste", "chaussures", "accent"];
    Promise.all(
      slots.map((s) =>
        fetch(`/api/products?slot=${s}&limit=2`)
          .then((r) => r.json())
          .then((d) => d.products ?? [])
          .catch(() => []),
      ),
    ).then((results) => {
      const all: ProduitAwin[] = results.flat().filter((p) => p.image || p.largeImage);
      /* Shuffle léger */
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      setProducts(all.slice(0, 6));
      setLoading(false);
    });
  }, []);

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section style={{ padding: "32px 16px 0" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 14,
      }}>
        <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>
          Nouveautés
        </h2>
        <Link href="/vetements" style={{ fontSize: 13, color: "#6e3b32", textDecoration: "underline", fontFamily: "'Inter'" }}>
          Voir tout
        </Link>
      </div>

      {loading ? (
        <div className="wada-nouveautes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 14, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div className="wada-nouveautes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {products.map((p) => (
            <article key={p.id}>
              <a href={p.urlProduit} target="_blank" rel="noopener sponsored" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  aspectRatio: "3/4", background: "#f0ebe2", borderRadius: 14,
                  overflow: "hidden", position: "relative", marginBottom: 8,
                }}>
                  {(p.image || p.largeImage) && (
                    <img
                      src={p.image || p.largeImage}
                      alt={p.nom}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                    />
                  )}
                  {/* Bouton cœur */}
                  <button
                    onClick={(e) => { e.preventDefault(); toggleLike(p.id); }}
                    aria-label="Ajouter aux favoris"
                    style={{
                      position: "absolute", top: 8, right: 8,
                      width: 32, height: 32,
                      background: "rgba(255,255,255,0.95)", border: "none",
                      borderRadius: "50%", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    {liked.has(p.id) ? "❤️" : "🤍"}
                  </button>
                  {/* Pastille couleur */}
                  <span style={{
                    position: "absolute", top: 8, left: 8,
                    width: 8, height: 8, borderRadius: "50%",
                    background: p.hex || "#9B9B96",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }} />
                </div>
              </a>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>
                {p.marque}
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 12, lineHeight: 1.3, color: "#1a1a1a", fontFamily: "'Inter'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.nom}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>
                {p.prix?.toLocaleString("fr-FR")} €
              </p>
              <a href={p.urlProduit} target="_blank" rel="noopener sponsored" style={{
                display: "block", textAlign: "center",
                padding: "8px 0",
                border: "1px solid #1a1a1a", borderRadius: 999,
                fontSize: 12, color: "#1a1a1a",
                fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none",
                transition: "all 0.15s",
              }}
                onMouseOver={(e) => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = "#fff"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1a1a1a"; }}
              >
                Voir
              </a>
            </article>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 640px) {
          .wada-nouveautes-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .wada-nouveautes-grid {
            grid-template-columns: repeat(6, 1fr) !important;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
