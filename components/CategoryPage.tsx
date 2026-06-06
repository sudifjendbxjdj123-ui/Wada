"use client";
/**
 * CategoryPage — Grille shopping style Lyst/Zalando.
 * Filtres : Genre (si non préselectionné), Prix, Couleur, Style, Tri.
 * Quick View modal sur clic carte.
 */
import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
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

const BORDEAUX = "#6B3A32";
const SOURCE_LABEL: Record<string, string> = {
  "muji-france": "MUJI France",
  "the-business-fashion": "The Business Fashion",
  "suitable-fr": "Suitable FR",
};

/* ── Icône cœur ── */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden
      fill={filled ? BORDEAUX : "none"}
      stroke={filled ? BORDEAUX : "#5a5a5a"} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s cubic-bezier(.22,1.4,.36,1), fill 0.2s, stroke 0.2s", transform: filled ? "scale(1.12)" : "scale(1)" }}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

/* ── Chevron SVG ── */
function Chevron({ color = "#1a1a1a", open = false }: { color?: string; open?: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ── Dropdown générique ── */
function FilterDropdown({
  label, active, options, value, onChange, renderOption,
}: {
  label: string;
  active: boolean;
  options: Array<{ value: string; label: string; extra?: string }>;
  value: string;
  onChange: (v: string) => void;
  renderOption?: (o: { value: string; label: string; extra?: string }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 999,
          fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif",
          cursor: "pointer",
          background: active ? "#1a1a1a" : "#fff",
          color: active ? "#fff" : "#1a1a1a",
          border: `1px solid ${active ? "#1a1a1a" : "rgba(26,26,26,0.18)"}`,
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {label}
        <Chevron color={active ? "#fff" : "#1a1a1a"} open={open} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.07)",
          minWidth: 180, overflow: "hidden",
          animation: "fadeDown 0.15s ease",
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "11px 16px",
                background: value === opt.value ? "#faf6ee" : "transparent",
                border: "none", cursor: "pointer",
                fontSize: 13, fontFamily: "'Inter', sans-serif",
                fontWeight: value === opt.value ? 600 : 400,
                color: value === opt.value ? BORDEAUX : "#1a1a1a",
                textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              {renderOption ? renderOption(opt) : opt.label}
              {value === opt.value && (
                <span style={{ marginLeft: "auto", fontSize: 11, color: BORDEAUX }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Modal Quick View ── */
function ProductModal({ product: p, onClose }: { product: ProduitAwin; onClose: () => void }) {
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 900, maxHeight: "90vh", borderRadius: "20px 20px 0 0", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", position: "relative", animation: "slideUp 0.3s cubic-bezier(.22,1,.36,1)" }} className="wada-modal-grid">
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: "50%", background: "#f5f1eb", border: "none", cursor: "pointer", fontSize: 18, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Fermer">✕</button>
        <div style={{ padding: "32px 32px 40px", overflowY: "auto" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a7a68", margin: "0 0 6px", fontFamily: "'Inter'", fontWeight: 600 }}>{p.marque}</p>
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, color: "#1a1a1a", margin: "0 0 16px", lineHeight: 1.2 }}>{p.nom}</h2>
          <p style={{ fontFamily: "'Inter'", fontSize: 26, fontWeight: 600, color: "#1a1a1a", margin: "0 0 24px" }}>{p.prix?.toLocaleString("fr-FR")} €</p>
          <a href={p.urlProduit} target="_blank" rel="noopener sponsored" style={{ display: "block", width: "100%", background: "#1a1a1a", color: "#fff", borderRadius: 12, padding: "16px 0", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none", fontFamily: "'Inter'", marginBottom: 12 }}>Acheter maintenant →</a>
          <div style={{ border: "1px solid #e8dfd0", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8a7a68", fontFamily: "'Inter'" }}>Extrait de <strong style={{ color: "#1a1a1a" }}>{source}</strong></p>
            <p style={{ margin: "0 0 3px", fontSize: 12, color: "#5a5a5a", fontFamily: "'Inter'" }}>✓ Lien partenaire Awin · prix identique chez le marchand</p>
            <p style={{ margin: 0, fontSize: 12, color: "#5a5a5a", fontFamily: "'Inter'" }}>✓ Paiement sécurisé sur {source}</p>
          </div>
          {p.couleurNom && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: p.hex || "#9B9B96", border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#5a5a5a", fontFamily: "'Inter'" }}>Couleur : {p.couleurNom}</span>
            </div>
          )}
          {p.paletteRef && (
            <div style={{ background: "#faf6ee", borderRadius: 10, padding: "12px 14px", borderLeft: `2px solid ${BORDEAUX}` }}>
              <p style={{ margin: "0 0 3px", fontSize: 11, color: BORDEAUX, fontFamily: "'Inter'", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Palette Sanzō Wada</p>
              <Link href={`/palette/${p.paletteRef}`} style={{ fontSize: 13, color: "#1a1a1a", fontFamily: "'Inter'", textDecoration: "underline" }}>Voir la palette n°{p.paletteRef} →</Link>
            </div>
          )}
        </div>
        <div style={{ background: "#f5f1eb", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
          {(p.largeImage || p.image) ? (
            <img src={p.largeImage || p.image} alt={p.nom} style={{ maxWidth: "90%", maxHeight: "85%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 48, opacity: 0.3 }}>◻</span>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 640px) { .wada-modal-grid { grid-template-columns: 1fr !important; } }
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
      <div onClick={onClick}>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", position: "relative", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.2s" }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}>
          {(p.image || p.largeImage) ? (
            <img src={p.image || p.largeImage} alt={p.nom} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c5b9a8", fontSize: 28 }}>◻</div>
          )}
          <span style={{ position: "absolute", top: 10, left: 10, width: 8, height: 8, borderRadius: "50%", background: p.hex || "#9B9B96", border: "1px solid rgba(0,0,0,0.1)" }} />
        </div>
        <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>{p.marque}</p>
        <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.35, color: "#1a1a1a", fontFamily: "'Inter'", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.nom}</p>
        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>{p.prix?.toLocaleString("fr-FR")} €</p>
        <p style={{ margin: 0, fontSize: 11, color: "#a89880", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 9 }}>↗</span> {source}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={liked}
        style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 5px rgba(0,0,0,0.12)" }}>
        <HeartIcon filled={liked} />
      </button>
    </article>
  );
}

/* ════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════ */
export default function CategoryPage({ title, breadcrumb, slot, q, genre: initGenre, style: initStyle }: Props) {
  const [products, setProducts] = useState<ProduitAwin[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const PER_PAGE = 48;

  /* Filtres API */
  const [genre, setGenre] = useState(initGenre ?? "");
  const [style, setStyle] = useState(initStyle ?? "");

  /* Filtres client-side */
  const [priceRange, setPriceRange] = useState("");
  const [couleur, setCouleur] = useState("");
  const [sortBy, setSortBy] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<ProduitAwin | null>(null);
  const [, startTransition] = useTransition();

  /* ── Fetch produits ── */
  const fetchProducts = useCallback(async (currentPage: number) => {
    setLoading(true);
    const slots = slot.split(",");
    const offset = (currentPage - 1) * PER_PAGE;
    const results = await Promise.all(slots.map(async (s) => {
      const par = new URLSearchParams({ slot: s.trim(), limit: String(PER_PAGE), offset: String(offset) });
      if (q) par.set("q", q);
      if (genre) par.set("genre", genre);
      if (style) par.set("style", style);
      return fetch(`/api/products?${par}`).then(r => r.json()).catch(() => ({ products: [], total: 0 }));
    }));
    const all: ProduitAwin[] = results.flatMap(r => r.products ?? []);
    setProducts(all);
    setTotal(results.reduce((s, r) => s + (r.total ?? 0), 0));
    setLoading(false);
  }, [slot, q, genre, style, PER_PAGE]);

  useEffect(() => { fetchProducts(page); }, [fetchProducts, page]);

  /* ── Couleurs disponibles dans les produits chargés ── */
  const availableColors = useMemo(() => {
    const map = new Map<string, string>(); // couleurNom → hex
    for (const p of products) {
      if (p.couleurNom && !map.has(p.couleurNom)) map.set(p.couleurNom, p.hex || "#9B9B96");
    }
    return Array.from(map.entries())
      .map(([label, hex]) => ({ value: label, label, extra: hex }))
      .slice(0, 16);
  }, [products]);

  /* ── Filtrage + tri client-side ── */
  const filtered = useMemo(() => {
    let list = [...products];
    if (priceRange) {
      list = list.filter(p => {
        const px = p.prix ?? 0;
        if (priceRange === "0-50")    return px < 50;
        if (priceRange === "50-100")  return px >= 50 && px < 100;
        if (priceRange === "100-200") return px >= 100 && px < 200;
        if (priceRange === "200+")    return px >= 200;
        return true;
      });
    }
    if (couleur) list = list.filter(p => p.couleurNom === couleur);
    if (sortBy === "price-asc")  list.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
    if (sortBy === "price-desc") list.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
    return list;
  }, [products, priceRange, couleur, sortBy]);

  /* ── Nombre de filtres actifs ── */
  const activeCount = [priceRange, couleur, style, sortBy].filter(Boolean).length
    + (initGenre ? 0 : genre ? 1 : 0);

  /* ── Options des dropdowns ── */
  const PRICE_OPTIONS = [
    { value: "", label: "Tous les prix" },
    { value: "0-50",    label: "Moins de 50 €" },
    { value: "50-100",  label: "50 € – 100 €" },
    { value: "100-200", label: "100 € – 200 €" },
    { value: "200+",    label: "Plus de 200 €" },
  ];
  const STYLE_OPTIONS = [
    { value: "", label: "Tous les styles" },
    { value: "Classique",    label: "Classique" },
    { value: "Minimaliste",  label: "Minimaliste" },
    { value: "Décontracté",  label: "Décontracté" },
    { value: "Streetwear",   label: "Streetwear" },
    { value: "Premium",      label: "Premium" },
  ];
  const SORT_OPTIONS = [
    { value: "", label: "Pertinence" },
    { value: "price-asc",  label: "Prix croissant" },
    { value: "price-desc", label: "Prix décroissant" },
  ];
  const GENRES = [
    { value: "", label: "Tous" },
    { value: "homme", label: "Hommes" },
    { value: "femme",  label: "Femmes" },
  ];

  /* Remettre à page 1 quand un filtre API change */
  const changeGenre = (v: string) => { setGenre(v); setPage(1); };
  const changeStyle = (v: string) => { setStyle(v); setPage(1); };

  const resetAll = () => {
    if (!initGenre) changeGenre("");
    changeStyle(""); setPriceRange(""); setCouleur(""); setSortBy(""); setPage(1);
  };

  /* Nombre total de pages */
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /* Pages à afficher dans le paginator */
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: (number | "…")[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);
    if (page - delta > 2) range.unshift("…");
    if (page + delta < totalPages - 1) range.push("…");
    if (totalPages > 1) range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [page, totalPages]);

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

      {/* Header titre + compteur */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid #e8dfd0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontFamily: "'Fredoka'", fontSize: 28, fontWeight: 500, margin: 0, color: "#1a1a1a", textTransform: "capitalize" }}>
            {title}
            {initGenre && (
              <span style={{ fontSize: 14, fontFamily: "'Inter'", fontWeight: 500, color: "#8a7a68", marginLeft: 10, textTransform: "none" }}>
                · {initGenre === "homme" ? "Hommes" : "Femmes"}
              </span>
            )}
          </h1>
          <span style={{ fontSize: 13, color: "#8a7a68", fontStyle: "italic" }}>
            {loading ? "" : `${filtered.length.toLocaleString("fr-FR")} pièces`}
          </span>
        </div>
      </div>

      {/* ── Barre de filtres sticky ── */}
      <div style={{
        padding: "10px 16px", background: "#fff",
        borderBottom: "0.5px solid #e8dfd0",
        position: "sticky", top: 0, zIndex: 50,
        overflowX: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: "max-content" }}>

          {/* Genre — seulement si pas préselectionné */}
          {!initGenre && (
            <>
              {GENRES.map((g) => (
                <button key={g.value} onClick={() => changeGenre(g.value)}
                  style={{
                    padding: "8px 16px", borderRadius: 999, fontSize: 13,
                    cursor: "pointer", fontFamily: "'Inter'", fontWeight: 500,
                    background: genre === g.value ? "#1a1a1a" : "#fff",
                    color: genre === g.value ? "#fff" : "#1a1a1a",
                    border: `1px solid ${genre === g.value ? "#1a1a1a" : "rgba(26,26,26,0.18)"}`,
                    transition: "all 0.15s", whiteSpace: "nowrap",
                  }}>
                  {g.label}
                </button>
              ))}
              <span style={{ width: 1, height: 20, background: "#e8dfd0", flexShrink: 0 }} />
            </>
          )}

          {/* Prix */}
          <FilterDropdown
            label={priceRange ? PRICE_OPTIONS.find(o => o.value === priceRange)?.label ?? "Prix" : "Prix"}
            active={!!priceRange}
            options={PRICE_OPTIONS}
            value={priceRange}
            onChange={setPriceRange}
          />

          {/* Couleur */}
          <FilterDropdown
            label={couleur || "Couleur"}
            active={!!couleur}
            options={[{ value: "", label: "Toutes les couleurs" }, ...availableColors]}
            value={couleur}
            onChange={setCouleur}
            renderOption={(opt) => (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {opt.extra && (
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: opt.extra, border: "1px solid rgba(0,0,0,0.12)", flexShrink: 0 }} />
                )}
                {opt.label}
              </span>
            )}
          />

          {/* Style */}
          <FilterDropdown
            label={style ? STYLE_OPTIONS.find(o => o.value === style)?.label ?? "Style" : "Style"}
            active={!!style}
            options={STYLE_OPTIONS}
            value={style}
            onChange={changeStyle}
          />

          <span style={{ width: 1, height: 20, background: "#e8dfd0", flexShrink: 0 }} />

          {/* Tri */}
          <FilterDropdown
            label={sortBy ? SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Trier" : "Trier"}
            active={!!sortBy}
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
          />

          {/* Reset si filtres actifs */}
          {activeCount > 0 && (
            <button onClick={resetAll}
              style={{
                padding: "8px 14px", borderRadius: 999, fontSize: 13,
                cursor: "pointer", fontFamily: "'Inter'", fontWeight: 500,
                background: "transparent", color: BORDEAUX,
                border: `1px solid ${BORDEAUX}`,
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>
              Effacer ({activeCount})
            </button>
          )}
        </div>
      </div>

      {/* Grille produits */}
      <div style={{ padding: "20px 16px 60px" }}>
        {loading ? (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, opacity: 0.5 + (i % 3) * 0.1 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 20, color: "#8a7a68" }}>Aucun produit trouvé</p>
            <button onClick={resetAll} style={{ marginTop: 12, padding: "10px 22px", borderRadius: 999, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Inter'" }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} onClick={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 16px 32px", flexWrap: "wrap" }}>
          {/* Précédent */}
          <button
            onClick={() => { startTransition(() => setPage(p => Math.max(1, p - 1))); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page === 1}
            style={{ padding: "9px 16px", borderRadius: 999, fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, cursor: page === 1 ? "default" : "pointer", background: "transparent", color: page === 1 ? "#ccc" : "#1a1a1a", border: `1px solid ${page === 1 ? "#eee" : "rgba(26,26,26,0.2)"}`, transition: "all 0.15s" }}
            aria-label="Page précédente"
          >
            ← Précédent
          </button>

          {/* Numéros de pages */}
          {pageNumbers.map((n, i) =>
            n === "…" ? (
              <span key={`dots-${i}`} style={{ padding: "9px 4px", color: "#aaa", fontSize: 13 }}>…</span>
            ) : (
              <button
                key={n}
                onClick={() => { startTransition(() => setPage(n as number)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                style={{
                  width: 38, height: 38, borderRadius: "50%", fontSize: 13,
                  fontFamily: "'Inter'", fontWeight: page === n ? 700 : 500,
                  cursor: "pointer",
                  background: page === n ? "#1a1a1a" : "transparent",
                  color: page === n ? "#fff" : "#1a1a1a",
                  border: `1px solid ${page === n ? "#1a1a1a" : "rgba(26,26,26,0.2)"}`,
                  transition: "all 0.15s",
                }}
                aria-label={`Page ${n}`}
                aria-current={page === n ? "page" : undefined}
              >
                {n}
              </button>
            )
          )}

          {/* Suivant */}
          <button
            onClick={() => { startTransition(() => setPage(p => Math.min(totalPages, p + 1))); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page === totalPages}
            style={{ padding: "9px 16px", borderRadius: 999, fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, cursor: page === totalPages ? "default" : "pointer", background: page === totalPages ? "transparent" : "#1a1a1a", color: page === totalPages ? "#ccc" : "#fff", border: `1px solid ${page === totalPages ? "#eee" : "#1a1a1a"}`, transition: "all 0.15s" }}
            aria-label="Page suivante"
          >
            Suivant →
          </button>
        </div>
      )}

      {/* CTA palette */}
      <div style={{ margin: "0 16px 40px", padding: "18px 20px", background: "#f2ede4", borderRadius: 14, textAlign: "center" }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, margin: "0 0 6px" }}>Trouver les pièces de ta palette</p>
        <Link href="/palettes" style={{ display: "inline-block", background: "#1a1a1a", color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none", marginTop: 10 }}>
          Explorer les 348 palettes →
        </Link>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @media (min-width: 640px)  { .wada-shop-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (min-width: 1024px) { .wada-shop-grid { grid-template-columns: repeat(4,1fr) !important; } }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
