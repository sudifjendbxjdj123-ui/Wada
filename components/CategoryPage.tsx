"use client";
/**
 * CategoryPage — Grille shopping style Lyst avec Quick View modal.
 * Clic sur une carte → modal produit par-dessus la grille (X pour fermer).
 */
import { useState, useEffect, useCallback, useRef } from "react";
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
  page?: number; // conservé pour compat mais non utilisé (modal remplace la pagination)
}

const SOURCE_LABEL: Record<string, string> = {
  "muji-france": "MUJI France",
  "the-business-fashion": "The Business Fashion",
  "suitable-fr": "Suitable FR",
};

/* Cœur favoris — SVG (contour fin → rempli brun de marque) */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden
      fill={filled ? "#6e3b32" : "none"}
      stroke={filled ? "#6e3b32" : "#5a5a5a"} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s cubic-bezier(.22,1.4,.36,1), fill 0.2s, stroke 0.2s", transform: filled ? "scale(1.12)" : "scale(1)" }}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

/* ── Quick View Modal ── */
function ProductModal({ product: p, onClose }: { product: ProduitAwin; onClose: () => void }) {
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;

  /* Fermer sur Escape ou clic backdrop */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%", maxWidth: 900,
          maxHeight: "90vh",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          position: "relative",
          animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1)",
        }}
        className="wada-modal-grid"
      >
        {/* ── Bouton Fermer ── */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: "50%",
            background: "#f5f1eb", border: "none",
            cursor: "pointer", fontSize: 18, fontWeight: 300,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Fermer"
        >
          ✕
        </button>

        {/* ── Colonne gauche : infos produit ── */}
        <div style={{ padding: "32px 32px 40px", overflowY: "auto" }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#8a7a68", margin: "0 0 6px", fontFamily: "'Inter'", fontWeight: 600,
          }}>
            {p.marque}
          </p>
          <h2 style={{
            fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500,
            color: "#1a1a1a", margin: "0 0 16px", lineHeight: 1.2,
          }}>
            {p.nom}
          </h2>

          <p style={{
            fontFamily: "'Inter'", fontSize: 26, fontWeight: 600,
            color: "#1a1a1a", margin: "0 0 24px",
          }}>
            {p.prix?.toLocaleString("fr-FR")} €
          </p>

          {/* CTA principal */}
          <a
            href={p.urlProduit} target="_blank" rel="noopener sponsored"
            style={{
              display: "block", width: "100%",
              background: "#1a1a1a", color: "#fff",
              borderRadius: 12, padding: "16px 0",
              fontSize: 14, fontWeight: 600, textAlign: "center",
              textDecoration: "none", fontFamily: "'Inter'",
              marginBottom: 12,
            }}
          >
            Acheter maintenant →
          </a>

          {/* Source */}
          <div style={{
            border: "1px solid #e8dfd0", borderRadius: 10,
            padding: "14px 16px", marginBottom: 20,
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8a7a68", fontFamily: "'Inter'" }}>
              Extrait de{" "}
              <strong style={{ color: "#1a1a1a" }}>{source}</strong>
            </p>
            <p style={{ margin: "0 0 3px", fontSize: 12, color: "#5a5a5a", fontFamily: "'Inter'" }}>
              ✓ Lien partenaire Awin · prix identique chez le marchand
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#5a5a5a", fontFamily: "'Inter'" }}>
              ✓ Paiement sécurisé sur {source}
            </p>
          </div>

          {/* Infos couleur / pastille */}
          {p.couleurNom && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%",
                background: p.hex || "#9B9B96",
                border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "#5a5a5a", fontFamily: "'Inter'" }}>
                Couleur : {p.couleurNom}
              </span>
            </div>
          )}

          {/* Palette WADA si disponible */}
          {p.paletteRef && (
            <div style={{
              background: "#faf6ee", borderRadius: 10, padding: "12px 14px",
              borderLeft: "2px solid #6e3b32",
            }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: "#6e3b32", fontFamily: "'Inter'", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Palette Sanzō Wada
              </p>
              <Link href={`/palette/${p.paletteRef}`} style={{
                fontSize: 13, color: "#1a1a1a", fontFamily: "'Inter'",
                textDecoration: "underline",
              }}>
                Voir la palette n°{p.paletteRef} →
              </Link>
            </div>
          )}
        </div>

        {/* ── Colonne droite : image ── */}
        <div style={{
          background: "#f5f1eb",
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 400,
        }}>
          {(p.largeImage || p.image) ? (
            <img
              src={p.largeImage || p.image}
              alt={p.nom}
              style={{
                maxWidth: "90%", maxHeight: "85%",
                objectFit: "contain",
              }}
            />
          ) : (
            <span style={{ fontSize: 48, opacity: 0.3 }}>◻</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .wada-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Carte produit ── */
function ProductCard({ p, onClick }: { p: ProduitAwin; onClick: () => void }) {
  const [liked, setLiked] = useState(false);
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;

  return (
    <article style={{ position: "relative", cursor: "pointer" }}>
      <div onClick={onClick} style={{ display: "block" }}>
        <div style={{
          background: "#f5f1eb", borderRadius: 12, overflow: "hidden",
          aspectRatio: "3/4", position: "relative", marginBottom: 10,
          transition: "box-shadow 0.2s, transform 0.2s",
        }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {(p.image || p.largeImage) ? (
            <img src={p.image || p.largeImage} alt={p.nom} loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c5b9a8", fontSize: 28 }}>◻</div>
          )}
          <span style={{
            position: "absolute", top: 10, left: 10,
            width: 8, height: 8, borderRadius: "50%",
            background: p.hex || "#9B9B96", border: "1px solid rgba(0,0,0,0.1)",
          }} />
        </div>

        <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>
          {p.marque}
        </p>
        <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.35, color: "#1a1a1a", fontFamily: "'Inter'", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {p.nom}
        </p>
        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>
          {p.prix?.toLocaleString("fr-FR")} €
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#a89880", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 9 }}>↗</span> {source}
        </p>
      </div>

      <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={liked}
        style={{
          position: "absolute", top: 10, right: 10,
          width: 34, height: 34, background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(4px)",
          border: "none", borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
        }}>
        <HeartIcon filled={liked} />
      </button>
    </article>
  );
}

/* ── Page principale ── */
export default function CategoryPage({ title, breadcrumb, slot, q, genre: initGenre, style: initStyle }: Props) {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState(initGenre ?? "");
  const [style, setStyle] = useState(initStyle ?? "");
  const [selected, setSelected] = useState<ProduitAwin | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const slots = slot.split(",");
    const results = await Promise.all(slots.map(async (s) => {
      const par = new URLSearchParams({ slot: s.trim(), limit: "48" });
      if (q) par.set("q", q);
      if (genre) par.set("genre", genre);
      if (style) par.set("style", style);
      return fetch(`/api/products?${par}`).then(r => r.json()).catch(() => ({ products: [] }));
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

      {/* Filtres sticky */}
      <div style={{
        padding: "12px 20px", background: "#fff", borderBottom: "0.5px solid #e8dfd0",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        position: "sticky", top: 0, zIndex: 10,
      }}>
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
        <div style={{ position: "relative", display: "inline-flex" }}>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            style={{
              padding: "7px 34px 7px 16px", borderRadius: 999, fontSize: 13,
              fontWeight: 500, lineHeight: "18px",
              background: style ? "#1a1a1a" : "transparent",
              color: style ? "#fff" : "#1a1a1a",
              border: `1px solid ${style ? "#1a1a1a" : "rgba(26,26,26,0.18)"}`,
              cursor: "pointer", fontFamily: "'Inter'", outline: "none",
              WebkitAppearance: "none", MozAppearance: "none", appearance: "none",
              transition: "all 0.15s",
            }}>
            {STYLES.map((s) => <option key={s.value} value={s.value} style={{ color: "#1a1a1a", background: "#fff" }}>{s.label}</option>)}
          </select>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke={style ? "#fff" : "#1a1a1a"} strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Grille */}
      <div style={{ padding: "20px 16px 60px" }}>
        {loading ? (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, opacity: 0.5 }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20, color: "#8a7a68" }}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {products.map((p) => (
              <ProductCard key={p.id} p={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* CTA palette */}
      <div style={{ margin: "0 16px 40px", padding: "18px 20px", background: "#f2ede4", borderRadius: 14, textAlign: "center" }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, margin: "0 0 6px" }}>
          Trouver les pièces de ta palette
        </p>
        <Link href="/palettes" style={{
          display: "inline-block", background: "#1a1a1a", color: "#fff",
          borderRadius: 999, padding: "10px 22px",
          fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none",
          marginTop: 10,
        }}>
          Explorer les 348 palettes →
        </Link>
      </div>

      {/* Modal Quick View */}
      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @media (min-width: 640px) { .wada-shop-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (min-width: 1024px) { .wada-shop-grid { grid-template-columns: repeat(4,1fr) !important; } }
      `}</style>
    </main>
  );
}
