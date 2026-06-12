"use client";
/**
 * CategoryPage — Grille shopping style Lyst/Zalando.
 * Filtres : Genre (si non préselectionné), Prix, Couleur, Style, Tri.
 * Quick View modal sur clic carte.
 */
import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import type { ProduitAwin } from "@/lib/schema";
import { formatProductPrice } from "@/lib/priceFormat";
import { dictionaryMinimal } from "@/lib/data-client";
import { deltaEHex, DELTA_E_LOOSE } from "@/lib/colorDistance";
import { groupProducts } from "@/lib/groupProducts";
import { GroupedProductCard } from "@/components/GroupedProductCard";
import { getMatchingPalettes } from "@/lib/getMatchingPalettes";
import { SOURCE_LABEL } from "@/lib/SOURCE_LABEL";
import { HeartIcon } from "@/components/HeartIcon";
import { SortDropdown, type SortOption } from "@/components/category/SortDropdown";
import { BackToTopButton } from "@/components/BackToTopButton";
import { showToast } from "@/lib/toast";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { CartSidebar } from "@/components/CartSidebar";
import { getCartCount } from "@/lib/cart";
import { NewsletterBanner } from "@/components/NewsletterBanner";
import { MobileNav } from "@/components/MobileNav";
/* Brief 2026-06-09 — système de filtres complet (sidebar 11 filtres +
   filtre Palette Sanzō Wada). Cf. lib/categoryFilters + components/category. */
import {
  FilterSidebar, ActiveFilters, MobileFilterButton, type Facets,
} from "@/components/category/FilterSidebar";
import {
  type CategoryFilters, getDefaultFilters, paramsToFilters, filtersToParams,
  FILTERS_STORAGE_KEY, activeFilterCount,
} from "@/lib/categoryFilters";

/** Label catégorie (pour sous-types + endpoint) dérivé du titre de page. */
function deriveCategory(slot: string, title: string): string {
  const t = title.toLowerCase();
  if (/chaussure/.test(t) || slot === "chaussures") return "chaussures";
  if (/v[êe]tement/.test(t) || /\bhaut\b/.test(slot)) return "vetements";
  if (/\bsac/.test(t)) return "sacs";
  if (/bijou/.test(t)) return "bijoux";
  if (/accessoire/.test(t)) return "accessoires";
  return "vetements";
}

/** Seed SSR-safe : genre/style préselectionnés via props (pas d'URL ici). */
function seedFilters(initGenre?: string, initStyle?: string): CategoryFilters {
  const f = getDefaultFilters();
  if (initGenre === "homme" || initGenre === "femme") f.genres = [initGenre];
  if (initStyle) f.styles = [initStyle.toLowerCase()];
  return f;
}


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

/* Garde anti-crash : vrai uniquement pour une URL http(s) bien formée.
   Empêche href="undefined"/"" de produire un clic vers une route cassée. */
function isValidHttpUrl(u?: string | null): u is string {
  if (!u || typeof u !== "string") return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}


/* ── Quick View Modal V2 « premium » (brief WADA-quickview-produit-V2) ──
   Adaptée au stack réel : inline styles + SVG inline (pas de lucide), données
   live du produit déjà chargé (pas d'endpoint /full), palettes & tenues
   calculées CÔTÉ CLIENT depuis le hex (deltaE) — aucune donnée fabriquée.
   Les 2 features uniques WADA : « palettes compatibles » et « composer une
   tenue autour de cette pièce » (liens réels vers /palette/N et /stylist). */
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={BORDEAUX} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ProductModal({ product: p, onClose, clickPosition, allProducts, onProductChange }: { product: ProduitAwin; onClose: () => void; clickPosition: { x: number; y: number } | null; allProducts: ProduitAwin[]; onProductChange?: (product: ProduitAwin) => void }) {
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
  const [liked, setLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  /* Galerie d'images : largeImage + image + thumb si disponibles */
  const images = [p.largeImage, p.image, p.thumb].filter(Boolean);
  const currentImg = images[imgIndex] || p.largeImage || p.image;

  const matches = useMemo(() => getMatchingPalettes(p.hex), [p.hex]);
  const sizes = (p.tailles || []).filter(Boolean);
  const sizeLabel = p.categorie === "chaussures" ? "Pointure" : "Taille";
  const dom = /^#[0-9a-f]{6}$/i.test(p.hex || "") ? p.hex : "#ede4d4";
  const gradient = `linear-gradient(180deg, #fff 0%, ${dom}25 100%)`;

  useEffect(() => {
    if (imgIndex >= images.length && images.length > 0) {
      setImgIndex(0);
    }
  }, [images.length, imgIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  /* Calcul position dynamique de la modal près du clic */
  const getModalPosition = () => {
    if (!clickPosition) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const modalWidth = 940;
    const modalHeight = 600;
    const offset = 20;
    let top = clickPosition.y - modalHeight / 2;
    let left = clickPosition.x - modalWidth / 2;

    /* Ajuste si la modal sort de l'écran */
    if (left < offset) left = offset;
    if (left + modalWidth > window.innerWidth - offset) left = window.innerWidth - modalWidth - offset;
    if (top < offset) top = offset;
    if (top + modalHeight > window.innerHeight - offset) top = window.innerHeight - modalHeight - offset;

    return { top: `${top}px`, left: `${left}px`, transform: "none" };
  };

  const modalPos = getModalPosition();

  return (
    <div onClick={onClose} className="wada-qv-backdrop" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "block", overflow: "auto", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="wada-qv-modal wada-modal-grid" style={{ background: "#fff", width: "100%", maxWidth: 940, maxHeight: "88vh", borderRadius: 24, overflow: "hidden", display: "grid", gridTemplateColumns: "1.1fr 1fr", position: "fixed", ...modalPos, pointerEvents: "auto", "@media (max-width: 768px)": { gridTemplateColumns: "1fr", maxWidth: "95vw", maxHeight: "95vh" } } as any}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.92)", boxShadow: "0 1px 6px rgba(0,0,0,0.12)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Fermer">✕</button>

        {/* ── CÔTÉ IMAGE (gauche) — CAROUSEL STYLE LYST ── */}
        <div className="wada-qv-imgside" style={{ background: gradient, display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "space-between", gap: 12, padding: 32, minHeight: 380, position: "relative" }}>
          {/* Main image + nav buttons */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {/* Image container */}
            <div style={{ width: "100%", aspectRatio: "1/1", background: "#fff", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative", marginBottom: 14 }}>
              {currentImg ? (
                <img src={currentImg} alt={p.nom || p.marque || "Produit"} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 18 }}
                  onError={(e) => { const img = e.currentTarget; img.style.display = "none"; if (img.parentElement) img.parentElement.style.background = "#F4EFE7"; }} />
              ) : (
                <span style={{ fontSize: 48, opacity: 0.3 }}>◻</span>
              )}

              {/* Prev button */}
              {images.length > 1 && (
                <button onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1a1a1a", transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; e.currentTarget.style.boxShadow = "none"; }}
                  aria-label="Image précédente">
                  ‹
                </button>
              )}

              {/* Next button */}
              {images.length > 1 && (
                <button onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1a1a1a", transition: "all 0.2s" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; e.currentTarget.style.boxShadow = "none"; }}
                  aria-label="Image suivante">
                  ›
                </button>
              )}
            </div>

            {/* Dots indicator (kept below main image) */}
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIndex(i)}
                    style={{ width: i === imgIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === imgIndex ? "#1a1a1a" : "rgba(26,26,26,0.3)", border: "none", cursor: "pointer", transition: "all 0.2s" }}
                    aria-label={`Image ${i + 1}`} aria-current={i === imgIndex ? "true" : undefined} />
                ))}
            </div>
            )}
          </div>

          {/* ── COLONNE THUMBNAILS (droite) — STYLE LYST ── */}
          {images.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "100%", overflowY: "auto", paddingRight: 4, minWidth: 64 }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  style={{ width: 60, height: 60, borderRadius: 8, border: i === imgIndex ? "2px solid #1a1a1a" : "1px solid #d4ccc0", background: "#fff", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 6, transition: "all 0.2s" }}
                  onMouseOver={(e) => { if (i !== imgIndex) e.currentTarget.style.borderColor = "#8a7a68"; }}
                  onMouseOut={(e) => { if (i !== imgIndex) e.currentTarget.style.borderColor = "#d4ccc0"; }}
                  aria-label={`Image ${i + 1}`} aria-current={i === imgIndex ? "true" : undefined}>
                  <img src={img} alt={`Vue ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CÔTÉ MÉTA (droite) ── */}
        <div className="wada-qv-meta" style={{ padding: "30px 28px 32px", overflowY: "auto", maxHeight: "88vh" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", margin: "0 0 8px", fontFamily: "'Inter'", fontWeight: 500 }}>
            {p.categorie}{p.couleurNom ? ` · ${p.couleurNom}` : ""}
          </p>
          <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: BORDEAUX, margin: "0 0 4px", fontFamily: "'Inter'", fontWeight: 600 }}>{p.marque}</p>
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 24, fontWeight: 500, color: "#1a1a1a", margin: "0 0 14px", lineHeight: 1.2 }}>{p.nom}</h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 14, marginBottom: 16, borderBottom: "1px solid #e8dfd0" }}>
            <p style={{ fontFamily: "'Inter'", fontSize: 24, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{formatProductPrice(p.prix, p.marchandSlug, p.devise)}</p>
            <span style={{ fontSize: 10, color: "#5a5a5a", fontFamily: "'Inter'" }}>Livraison directe par {source}</span>
          </div>

          {/* ── Tailles / Pointures ── */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: 0, fontFamily: "'Inter'" }}>{sizeLabel}</p>
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#6B3A32",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontFamily: "'Inter'",
                    padding: 0,
                  }}
                >
                  ? Guide des tailles
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sizes.map((s) => (
                  <button key={s} onClick={() => setSelectedSize(s === selectedSize ? null : s)}
                    style={{ minWidth: 38, height: 34, padding: "0 8px", borderRadius: 7, fontSize: 12, fontFamily: "'Inter'", cursor: "pointer",
                      background: selectedSize === s ? "#1a1a1a" : "#fff",
                      color: selectedSize === s ? "#fff" : "#1a1a1a",
                      border: `1px solid ${selectedSize === s ? "#1a1a1a" : "#d4ccc0"}`, transition: "all 0.12s" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions principales : cœur + acheter ── */}
          <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setLiked(!liked)} aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={liked}
              style={{ borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                background: liked ? BORDEAUX : "#fff", border: `1px solid ${liked ? BORDEAUX : "#d4ccc0"}` }}>
              <HeartIcon filled={liked} />
            </button>
            {isValidHttpUrl(p.urlProduit) ? (
              <a href={p.urlProduit} target="_blank" rel="noopener sponsored" style={{ background: "#1a1a1a", color: "#fff", borderRadius: 999, padding: "14px 0", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none", fontFamily: "'Inter'", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Acheter sur {source} <span style={{ fontSize: 12 }}>↗</span>
              </a>
            ) : (
              <div aria-disabled="true" style={{ background: "#d8cfc0", color: "#fff", borderRadius: 999, padding: "14px 0", fontSize: 14, fontWeight: 600, textAlign: "center", fontFamily: "'Inter'", cursor: "not-allowed" }}>Bientôt disponible</div>
            )}
          </div>

          {/* ── Actions secondaires ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <Link href="/stylist" style={{ flex: 1, padding: "10px 0", border: "1px solid #d4ccc0", borderRadius: 999, fontSize: 11, background: "#fff", color: "#1a1a1a", textAlign: "center", textDecoration: "none", fontFamily: "'Inter'", fontWeight: 500 }}>
              ✦ Composer une tenue
            </Link>
            {p.paletteRef && (
              <Link href={`/palette/${p.paletteRef}`} style={{ flex: 1, padding: "10px 0", border: "1px solid #d4ccc0", borderRadius: 999, fontSize: 11, background: "#fff", color: "#1a1a1a", textAlign: "center", textDecoration: "none", fontFamily: "'Inter'", fontWeight: 500 }}>
                ◫ Voir similaires
              </Link>
            )}
          </div>

          {/* ── Trust Signals ── */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 10px", fontFamily: "'Inter'" }}>Vous pouvez acheter en confiance</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#fef8f2", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 18 }}>🔄</div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>Retour gratuit</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "#8a7a68", fontFamily: "'Inter'" }}>30 jours</p>
                </div>
              </div>
              <div style={{ background: "#f5faf8", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 18 }}>🛡️</div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>Paiement sécurisé</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "#8a7a68", fontFamily: "'Inter'" }}>Stripe certifié</p>
                </div>
              </div>
              <div style={{ background: "#faf8f5", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 18 }}>📦</div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>Livraison rapide</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "#8a7a68", fontFamily: "'Inter'" }}>2-5 jours</p>
                </div>
              </div>
              <div style={{ background: "#f8faf9", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 18 }}>✓</div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>Marque officielle</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "#8a7a68", fontFamily: "'Inter'" }}>{source}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Composer une tenue autour de cette pièce (funnel WADA) ── */}
          {matches.length > 0 && (
            <div style={{ background: "#fefaf2", padding: 14, borderRadius: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 10px", fontFamily: "'Inter'" }}>
                Composez une tenue autour de cette pièce
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {matches.slice(0, 4).map((m) => (
                  <Link key={m.number} href={`/stylist?palette=${m.number}`} style={{ background: "#fff", borderRadius: 10, padding: 8, textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "box-shadow 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
                    <div style={{ display: "flex", height: 12, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                      {m.colors.slice(0, 5).map((c, i) => (
                        <span key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a", margin: 0, fontFamily: "'Inter'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                    <p style={{ fontSize: 8, color: "#8a7a68", margin: "2px 0 0", fontFamily: "'Inter'" }}>Composer une tenue →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Vous aimerez aussi — Related products */}
          {allProducts.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #e8dfd0" }}>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 12px", fontFamily: "'Inter'" }}>
                Vous aimerez aussi
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {allProducts
                  .filter((pr) => pr.categorie === p.categorie && pr.id !== p.id)
                  .slice(0, 4)
                  .map((related) => (
                    <button
                      key={related.id}
                      onClick={() => {
                        onProductChange?.(related);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      style={{
                        background: "#faf6ee",
                        border: "1px solid #e8dfd0",
                        borderRadius: 10,
                        padding: 8,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#d4ccc0";
                        e.currentTarget.style.background = "#f5ede2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e8dfd0";
                        e.currentTarget.style.background = "#faf6ee";
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          background: `linear-gradient(180deg, #fff 0%, ${/^#[0-9a-f]{6}$/i.test(related.hex || "") ? related.hex : "#ede4d4"}30 100%)`,
                          borderRadius: 6,
                          marginBottom: 6,
                          overflow: "hidden",
                        }}
                      >
                        {related.image && (
                          <img
                            src={related.image}
                            alt={related.nom}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.currentTarget as any).style.display = "none";
                            }}
                          />
                        )}
                      </div>
                      <p style={{ fontSize: 9, fontWeight: 600, color: "#1a1a1a", margin: 0, fontFamily: "'Inter'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {related.nom}
                      </p>
                      <p style={{ fontSize: 10, color: "#8a7a68", margin: "2px 0 0", fontFamily: "'Inter'" }}>
                        {formatProductPrice(related.prix, related.marchandSlug, related.devise)}
                      </p>
                      {/* Social proof by gender */}
                      <p style={{ fontSize: 8, color: "#c5b9a8", margin: "4px 0 0", fontFamily: "'Inter'", fontStyle: "italic" }}>
                        {p.genre === "femme" ? "👗 Aimé par 1.2k femmes" : "👔 Aimé par 900 hommes"}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} category={p.categorie} />

      <style>{`
        .wada-qv-backdrop { animation: wadaQvFade 0.2s ease-out; }
        .wada-qv-modal { animation: wadaQvPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes wadaQvFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wadaQvPopIn { from { opacity: 0; transform: scale(0.85) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (max-width: 768px) {
          .wada-qv-backdrop { padding: 0 !important; align-items: stretch !important; }
          .wada-modal-grid { grid-template-columns: 1fr !important; max-width: 100% !important; max-height: 100% !important; height: 100%; border-radius: 0 !important; }
          .wada-qv-imgside { min-height: 44vh !important; }
          .wada-qv-meta { max-height: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ── Carte produit PREMIUM (brief Pages catégorie V2) ──
   - Fond dégradé subtil tiré de la couleur dominante du produit
   - Pastilles des palettes WADA correspondantes (haut gauche)
   - Compteur « X palettes » en bordeaux (polyvalence)
   - Hover : soulèvement + léger zoom image + overlay "Voir détails" */
function ProductCard({ p, onClick }: { p: ProduitAwin; onClick: (e: React.MouseEvent) => void }) {
  const [liked, setLiked] = useState(false);
  const [hovering, setHovering] = useState(false);
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
  const matches = useMemo(() => getMatchingPalettes(p.hex), [p.hex]);
  const dom = /^#[0-9a-f]{6}$/i.test(p.hex || "") ? p.hex : "#ede4d4";
  // Dégradé blanc → teinte dominante à ~19% (hex + "30").
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${dom}30 100%)`;
  return (
    <article style={{ position: "relative", cursor: "pointer" }}>
      <div onClick={(e) => onClick(e)}>
        <div style={{ background: bgGradient, borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", position: "relative", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", transition: "box-shadow 0.25s, transform 0.25s" }}
          onMouseEnter={(e) => { setHovering(true); e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; const img = e.currentTarget.querySelector("img"); if (img) (img as HTMLImageElement).style.transform = "scale(1.05)"; }}
          onMouseLeave={(e) => { setHovering(false); e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; const img = e.currentTarget.querySelector("img"); if (img) (img as HTMLImageElement).style.transform = "scale(1)"; }}>
          {(p.image || p.largeImage) ? (
            <img src={p.image || p.largeImage} alt={p.nom || p.marque || "Produit"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transition: "transform 0.4s cubic-bezier(.22,1,.36,1)" }}
              onError={(e) => { /* image marchand morte/hotlink → tuile neutre au lieu de l'icône cassée */ const img = e.currentTarget; img.style.display = "none"; if (img.parentElement) img.parentElement.style.background = "#F4EFE7"; }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c5b9a8", fontSize: 28 }}>◻</div>
          )}
          {/* Pastilles palettes WADA — haut gauche */}
          {matches.length > 0 && (
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
              {matches.slice(0, 3).map((m) => (
                <span key={m.number} title={`Palette n°${m.number} · ${m.name}`}
                  style={{ width: 9, height: 9, borderRadius: "50%", background: m.swatch, border: "1px solid rgba(0,0,0,0.18)", boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)" }} />
              ))}
            </div>
          )}

          {/* Overlay "Voir détails" au hover */}
          {hovering && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,26,0.72)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", animation: "wadaProductOverlay 0.2s ease-out", backdropFilter: "blur(2px)" }}>
              <div style={{ textAlign: "center", color: "#fff", fontFamily: "'Fredoka'", fontSize: 18, fontWeight: 500, letterSpacing: "-0.4px" }}>
                Voir détails
              </div>
            </div>
          )}
        </div>
        <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7a68", fontFamily: "'Inter'" }}>{p.marque}</p>
        <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.35, color: "#1a1a1a", fontFamily: "'Inter'", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.nom}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>{formatProductPrice(p.prix, p.marchandSlug, p.devise)}</p>
          {matches.length > 0 && (
            <span style={{ fontSize: 10, color: BORDEAUX, fontFamily: "'Inter'", fontWeight: 500, whiteSpace: "nowrap" }}>
              {matches.length} palette{matches.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#a89880", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 3 }}><span style={{ fontSize: 9 }}>↗</span> {source}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={liked}
        style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 5px rgba(0,0,0,0.12)" }}>
        <HeartIcon filled={liked} />
      </button>

      <style>{`
        @keyframes wadaProductOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
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
  const [facets, setFacets] = useState<Facets>({});

  const PER_PAGE = 48;

  const category = useMemo(() => deriveCategory(slot, title), [slot, title]);

  /* Fonction de tri des produits */
  const sortProducts = (items: ProduitAwin[], sortBy: SortOption): ProduitAwin[] => {
    const sorted = [...items];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.prix - b.prix);
      case "price-high":
        return sorted.sort((a, b) => b.prix - a.prix);
      case "newest":
        // Simulation: tri par popularité comme proxy pour nouveaux
        return sorted.sort((a, b) => (b.popularite || 0) - (a.popularite || 0));
      case "popular":
        return sorted.sort((a, b) => (b.popularite || 0) - (a.popularite || 0));
      case "relevance":
      default:
        return sorted;
    }
  };

  /* État UNIQUE des 11 filtres. Seed SSR-safe (props), puis hydraté depuis
     l'URL (+ localStorage en fallback) au montage → pas de mismatch SSR. */
  const [filters, setFilters] = useState<CategoryFilters>(() => seedFilters(initGenre, initStyle));
  const [hydrated, setHydrated] = useState(false);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProduitAwin | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => getCartCount());
  const [sort, setSort] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "relevance";
    try {
      const stored = localStorage.getItem("wada-sort-pref");
      return (stored as SortOption) || "relevance";
    } catch {
      return "relevance";
    }
  });
  const [, startTransition] = useTransition();

  /* ── Hydratation : URL > localStorage > seed props (au montage client) ── */
  useEffect(() => {
    let next: CategoryFilters;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString()) {
      next = paramsToFilters(sp);
      /* Préselections de route (ex. /vetements/homme) toujours respectées. */
      if (initGenre === "homme" || initGenre === "femme") next.genres = [initGenre];
    } else {
      let stored: CategoryFilters | null = null;
      try {
        const raw = localStorage.getItem(`${FILTERS_STORAGE_KEY}:${category}`);
        if (raw) stored = JSON.parse(raw);
      } catch {}
      next = stored || seedFilters(initGenre, initStyle);
    }
    setFilters(next);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Maj filtres : reset page, persiste (localStorage), synchronise l'URL ── */
  const updateFilters = useCallback((next: CategoryFilters) => {
    setFilters(next);
    setPage(1);
    setDrawerOpen(false); // Close mobile filter drawer after apply
    try { localStorage.setItem(`${FILTERS_STORAGE_KEY}:${category}`, JSON.stringify(next)); } catch {}
    try {
      const qs = filtersToParams(next).toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    } catch {}
    // Toast feedback
    const activeCount = Object.values(next).flat().length;
    if (activeCount === 0) {
      showToast("Filtres réinitialisés", { variant: "info", duration: 2000 });
    } else {
      showToast(`✓ Filtres appliqués (${activeCount})`, { variant: "success", duration: 2000 });
    }
  }, [category]);

  /* ── Fetch unique vers /api/products/search (debounce 250ms + abort) ── */
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    if (!hydrated) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch("/api/products/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, category, filters, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
        signal: ctrl.signal,
      })
        .then((r) => r.json())
        .then((d) => {
          setProducts(d.products ?? []);
          setTotal(d.total ?? 0);
          if (d.facets) setFacets(d.facets);
          setLoading(false);
        })
        .catch((e) => { if (e?.name !== "AbortError") setLoading(false); });
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, slot, category, filtersKey, page, PER_PAGE]);

  /* Nombre total de pages (le serveur /search renvoie déjà filtré + trié). */
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /* ── Pré-calculation des matchs de palettes pour optimiser le rendu grille ── */
  useMemo(() => {
    products.forEach((p) => { if (p.hex) getMatchingPalettes(p.hex); });
  }, [products]);

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

      {/* Cart button — top right */}
      <div style={{ position: "absolute", top: 16, right: 20, zIndex: 50 }}>
        <button
          onClick={() => {
            setCartOpen(true);
            setCartCount(getCartCount());
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter'",
            position: "relative",
          }}
        >
          🛒 Panier
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "#6B3A32",
                color: "#fff",
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Fix 2026-06-11 : bouton retour explicite (pill « ← Retour ») — la
          breadcrumb seule ne suffisait pas comme affordance de navigation
          arrière, surtout pour les sous-catégories profondes. Fallback
          /boutique car les catégories sont accessibles depuis le hub shopping. */}
      <BackButton fallback="/boutique" />

      {/* Breadcrumb — amélioré */}
      <div style={{ padding: "12px 20px", borderBottom: "0.5px solid #e8dfd0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {breadcrumb.map((item, i) => (
          <div key={item.href} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {i > 0 && <span style={{ fontSize: 10, color: "#c5b9a8", opacity: 0.5 }}>›</span>}
            <Link
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                background: i === breadcrumb.length - 1 ? "#1a1a1a" : "#f9f5ef",
                color: i === breadcrumb.length - 1 ? "#fff" : "#1a1a1a",
                textDecoration: "none",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: i === breadcrumb.length - 1 ? 600 : 500,
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (i < breadcrumb.length - 1) {
                  e.currentTarget.style.background = "#efeae2";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (i < breadcrumb.length - 1) {
                  e.currentTarget.style.background = "#f9f5ef";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {item.label}
            </Link>
          </div>
        ))}
        {initGenre && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ fontSize: 10, color: "#c5b9a8", opacity: 0.5 }}>·</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                background: "#f0e8f5",
                color: "#5a3f8f",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {initGenre === "homme" ? "👔 Hommes" : "👗 Femmes"}
            </span>
          </div>
        )}
      </div>

      {/* Header éditorial (brief Pages catégorie V2 §2.1) */}
      <div className="wada-cat-hero" style={{ padding: "34px 20px 24px", borderBottom: "0.5px solid #e8dfd0", maxWidth: 1200, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <p style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8a7a68", margin: "0 0 8px", fontFamily: "'Inter'", fontWeight: 600 }}>
          Catégorie
        </p>
        <h1 className="wada-cat-title" style={{ fontFamily: "'Fredoka'", fontSize: 48, fontWeight: 500, margin: "0 0 8px", color: "#1a1a1a", lineHeight: 1, textTransform: "capitalize" }}>
          {title}
          {initGenre && (
            <span style={{ fontSize: 18, fontFamily: "'Inter'", fontWeight: 500, color: "#8a7a68", marginLeft: 12, textTransform: "none" }}>
              · {initGenre === "homme" ? "Hommes" : "Femmes"}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 14, color: "#5a5a5a", fontStyle: "italic", margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
          {loading
            ? "Sélection WADA, filtrable par palette Sanzō Wada, marque et style."
            : `${total.toLocaleString("fr-FR")} pièces sélectionnées par WADA, filtrables par palette Sanzō Wada, marque et style.`}
        </p>
      </div>

      {/* ── Layout 2 colonnes : sidebar filtres + grille (brief 2026-06-09) ── */}
      <div className="wada-cat-layout" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 24, padding: "16px", alignItems: "flex-start", boxSizing: "border-box" }}>

        {/* Sidebar desktop (masquée ≤ 900px) */}
        <div className="wada-cat-sidebar" style={{ flexShrink: 0 }}>
          <FilterSidebar category={category} filters={filters} facets={facets} resultCount={total} onChange={updateFilters} />
        </div>

        {/* Colonne principale */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Barre mobile : bouton « Filtrer » (visible ≤ 900px) */}
          <div className="wada-cat-mobilebar" style={{ marginBottom: 12 }}>
            <MobileFilterButton filters={filters} resultCount={total} onClick={() => setDrawerOpen(true)} />
          </div>

          {/* Barre de contrôle : filtres actifs + tri */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ActiveFilters filters={filters} onChange={updateFilters} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#8a7a68", whiteSpace: "nowrap" }}>Trier par:</span>
              <SortDropdown value={sort} onChange={(newSort) => {
                setSort(newSort);
                try {
                  localStorage.setItem("wada-sort-pref", newSort);
                } catch {}
                const sortLabels: Record<SortOption, string> = {
                  relevance: "Pertinence",
                  "price-low": "Prix: bas → haut",
                  "price-high": "Prix: haut → bas",
                  newest: "Les plus nouveaux",
                  popular: "Les plus populaires",
                };
                showToast(`✓ Trié par ${sortLabels[newSort]}`, { variant: "success", duration: 2000 });
              }} />
            </div>
          </div>

          {/* Section Tendances — 4 produits populaires */}
          {!loading && products.length > 0 && activeFilterCount(filters) === 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <h2 style={{ fontFamily: "'Fredoka'", fontSize: 20, fontWeight: 500, margin: 0, color: "#1a1a1a" }}>À la une cette semaine</h2>
                </div>
                <span style={{ fontSize: 11, color: "#8a7a68", fontFamily: "'Inter'" }}>
                  {initGenre === "femme" ? "👗 Tendance femmes" : initGenre === "homme" ? "👔 Tendance hommes" : "⭐ Plus vendus"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {sortProducts([...products].sort((a, b) => (b.popularite || 0) - (a.popularite || 0)), "relevance").slice(0, 4).map((p) => (
                  <GroupedProductCard key={p.id} g={groupProducts([p])[0]!} onClick={(e) => {
                    setClickPosition({ x: e.clientX, y: e.clientY });
                    setSelected(p);
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Grille produits */}
          {loading ? (
            <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: "3/4", background: "#ede8e0", borderRadius: 12, opacity: 0.5 + (i % 3) * 0.1 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontFamily: "'Fredoka'", fontSize: 20, color: "#8a7a68" }}>Aucun produit trouvé</p>
              <button onClick={() => updateFilters(getDefaultFilters())} style={{ marginTop: 12, padding: "10px 22px", borderRadius: 999, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Inter'" }}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="wada-shop-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
              {groupProducts(sortProducts(products, sort)).map((g) => (
                <GroupedProductCard key={g.key} g={g} onClick={(e) => {
                  setClickPosition({ x: e.clientX, y: e.clientY });
                  setSelected(g.primary);
                }} />
              ))}
            </div>
          )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 16px 32px", flexWrap: "wrap", opacity: loading ? 0.5 : 1, pointerEvents: loading ? "none" : "auto", transition: "opacity 0.2s" }}>
          {loading && (
            <span style={{ fontSize: 12, color: "#8a7a68", fontFamily: "'Inter'" }}>Chargement…</span>
          )}
          {!loading && (
            <>
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
            </>
          )}
        </div>
      )}

        </div>{/* /colonne principale */}
      </div>{/* /layout 2 colonnes */}

      {/* CTA palette */}
      <div style={{ maxWidth: 1200, margin: "0 auto 40px", padding: "18px 20px", background: "#f2ede4", borderRadius: 14, textAlign: "center", boxSizing: "border-box" }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, margin: "0 0 6px" }}>Trouver les pièces de ta palette</p>
        <Link href="/palettes" style={{ display: "inline-block", background: "#1a1a1a", color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none", marginTop: 10 }}>
          Explorer les 348 palettes →
        </Link>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} clickPosition={clickPosition} allProducts={products} onProductChange={setSelected} />}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Back to top button */}
      <BackToTopButton />

      {/* Newsletter Banner */}
      <NewsletterBanner />

      {/* Mobile nav — sticky bottom */}
      <MobileNav onCartClick={() => setCartOpen(true)} />

      {/* ── Drawer mobile plein écran ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,26,26,.45)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", inset: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e8dfd0" }}>
              <strong style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17, color: "#1a1a1a" }}>Filtres</strong>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Fermer" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#8a7a68", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 16px" }}>
              <FilterSidebar category={category} filters={filters} facets={facets} resultCount={total} onChange={updateFilters} variant="drawer" onClose={() => setDrawerOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Grid responsive — colonnes par taille écran */
        @media (max-width: 480px) { .wada-shop-grid { grid-template-columns: repeat(1, 1fr) !important; gap: 12px !important; } }
        @media (min-width: 481px) and (max-width: 768px) { .wada-shop-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; } }
        @media (min-width: 769px) and (max-width: 900px) { .wada-shop-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 901px)  { .wada-shop-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1200px) { .wada-shop-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        /* Sidebar desktop / bouton mobile — bascule à 900px (brief 2026-06-09). */
        @media (max-width: 900px) { .wada-cat-sidebar { display: none !important; } }
        @media (min-width: 901px) { .wada-cat-mobilebar { display: none !important; } }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
