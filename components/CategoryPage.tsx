"use client";
/**
 * CategoryPage — Grille shopping style Lyst/Zalando.
 * Filtres : Genre (si non préselectionné), Prix, Couleur, Style, Tri.
 * Quick View modal sur clic carte.
 */
import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";
import { formatProductPrice } from "@/lib/priceFormat";
import { dictionaryMinimal } from "@/lib/data-client";
import { deltaEHex, DELTA_E_LOOSE } from "@/lib/colorDistance";
/* Brief 2026-06-09 — système de filtres complet (sidebar 11 filtres +
   filtre Palette Sanzō Wada). Cf. lib/categoryFilters + components/category. */
import {
  FilterSidebar, ActiveFilters, MobileFilterButton, type Facets,
} from "@/components/category/FilterSidebar";
import {
  type CategoryFilters, getDefaultFilters, paramsToFilters, filtersToParams,
  FILTERS_STORAGE_KEY,
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

/* ── Palettes WADA correspondant à un produit (marqueur unique WADA) ──
   Brief « Pages catégorie V2 premium » §3-5 : sous chaque produit, des
   pastilles indiquent dans quelles palettes Sanzō Wada la pièce s'intègre.
   Calculé CÔTÉ CLIENT depuis le hex dominant du produit vs les couleurs
   du dictionnaire (deltaE2000) — pas de champ backend ni de ré-ingestion.
   Résultat mémoïsé par hex (un produit = un hex → calcul une seule fois). */
interface MatchPalette { number: string; name: string; swatch: string; colors: string[]; culture?: string }
const _paletteMatchCache = new Map<string, MatchPalette[]>();
function getMatchingPalettes(hex?: string): MatchPalette[] {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return [];
  const cached = _paletteMatchCache.get(hex);
  if (cached) return cached;
  const matches: Array<MatchPalette & { dE: number }> = [];
  for (const pal of dictionaryMinimal) {
    let best = Infinity;
    let bestHex = pal.colors[0]?.hex || "#999";
    for (const c of pal.colors) {
      const dE = deltaEHex(hex, c.hex);
      if (dE < best) { best = dE; bestHex = c.hex; }
    }
    if (best < DELTA_E_LOOSE) {
      matches.push({
        number: pal.number,
        name: pal.name,
        swatch: bestHex,
        colors: pal.colors.map((c) => c.hex),
        culture: pal.culture,
        dE: best,
      });
    }
  }
  matches.sort((a, b) => a.dE - b.dE);
  const result = matches.map(({ number, name, swatch, colors, culture }) => ({ number, name, swatch, colors, culture }));
  _paletteMatchCache.set(hex, result);
  return result;
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
const SOURCE_LABEL: Record<string, string> = {
  "muji-france": "MUJI France",
  "the-business-fashion": "The Business Fashion",
  "suitable-fr": "Suitable FR",
  "new-era": "New Era",
  "kastner-ohler": "Kastner & Öhler",
};

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

function ProductModal({ product: p, onClose }: { product: ProduitAwin; onClose: () => void }) {
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
  const [liked, setLiked] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const matches = useMemo(() => getMatchingPalettes(p.hex), [p.hex]);
  const sizes = (p.tailles || []).filter(Boolean);
  const sizeLabel = p.categorie === "chaussures" ? "Pointure" : "Taille";
  const dom = /^#[0-9a-f]{6}$/i.test(p.hex || "") ? p.hex : "#ede4d4";
  const gradient = `linear-gradient(180deg, #fff 0%, ${dom}25 100%)`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div onClick={onClose} className="wada-qv-backdrop" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="wada-qv-modal wada-modal-grid" style={{ background: "#fff", width: "100%", maxWidth: 940, maxHeight: "88vh", borderRadius: 24, overflow: "hidden", display: "grid", gridTemplateColumns: "1.1fr 1fr", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.92)", boxShadow: "0 1px 6px rgba(0,0,0,0.12)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 300, display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Fermer">✕</button>

        {/* ── CÔTÉ IMAGE (gauche) ── */}
        <div className="wada-qv-imgside" style={{ background: gradient, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, minHeight: 380 }}>
          <div style={{ width: "82%", aspectRatio: "1/1", background: "#fff", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.10)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {(p.largeImage || p.image) ? (
              <img src={p.largeImage || p.image} alt={p.nom || p.marque || "Produit"} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 18 }}
                onError={(e) => { const img = e.currentTarget; img.style.display = "none"; if (img.parentElement) img.parentElement.style.background = "#F4EFE7"; }} />
            ) : (
              <span style={{ fontSize: 48, opacity: 0.3 }}>◻</span>
            )}
          </div>
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

          {/* ── Palettes WADA compatibles — FEATURE UNIQUE ── */}
          {matches.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 8px", fontFamily: "'Inter'" }}>
                Compatible avec ces palettes WADA
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {matches.slice(0, 3).map((m) => (
                  <Link key={m.number} href={`/palette/${m.number}`} style={{ flex: 1, padding: 8, background: "#faf6ee", borderRadius: 10, textDecoration: "none", transition: "background 0.15s" }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#f0e9d8"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#faf6ee"; }}>
                    <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                      {m.colors.slice(0, 5).map((c, i) => (
                        <span key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a", margin: 0, lineHeight: 1.2, fontFamily: "'Inter'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                    {m.culture && <p style={{ fontSize: 8, letterSpacing: "0.06em", textTransform: "uppercase", color: "#8a7a68", margin: "2px 0 0", fontFamily: "'Inter'" }}>{m.culture}</p>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Tailles / Pointures ── */}
          {sizes.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 8px", fontFamily: "'Inter'" }}>{sizeLabel}</p>
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

          {/* ── Réassurance Awin ── */}
          <div style={{ background: "#faf6ee", padding: 12, borderRadius: 10, marginBottom: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 11, color: "#1a1a1a", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 6 }}><CheckIcon /> Lien partenaire Awin · prix identique chez le marchand</p>
            <p style={{ margin: 0, fontSize: 11, color: "#1a1a1a", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 6 }}><CheckIcon /> Paiement sécurisé sur {source}</p>
            <p style={{ margin: 0, fontSize: 11, color: "#1a1a1a", fontFamily: "'Inter'", display: "flex", alignItems: "center", gap: 6 }}><CheckIcon /> Livraison 2-5 jours · retours selon le marchand</p>
          </div>

          {/* ── Composer une tenue autour de cette pièce (funnel WADA) ── */}
          {matches.length > 0 && (
            <div style={{ background: "#fefaf2", padding: 14, borderRadius: 14 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8a7a68", fontWeight: 600, margin: "0 0 10px", fontFamily: "'Inter'" }}>
                Composez une tenue autour de cette pièce
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {matches.slice(0, 4).map((m) => (
                  <Link key={m.number} href={`/palette/${m.number}`} style={{ background: "#fff", borderRadius: 10, padding: 8, textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", height: 12, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                      {m.colors.slice(0, 5).map((c, i) => (
                        <span key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a", margin: 0, fontFamily: "'Inter'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</p>
                    <p style={{ fontSize: 8, color: "#8a7a68", margin: "2px 0 0", fontFamily: "'Inter'" }}>Palette n°{m.number} →</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .wada-qv-backdrop { animation: wadaQvFade 0.2s ease-out; }
        .wada-qv-modal { animation: wadaQvScale 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes wadaQvFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wadaQvScale { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
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
   - Hover : soulèvement + léger zoom image */
function ProductCard({ p, onClick }: { p: ProduitAwin; onClick: () => void }) {
  const [liked, setLiked] = useState(false);
  const source = SOURCE_LABEL[p.marchandSlug || ""] || p.marchand;
  const matches = useMemo(() => getMatchingPalettes(p.hex), [p.hex]);
  const dom = /^#[0-9a-f]{6}$/i.test(p.hex || "") ? p.hex : "#ede4d4";
  // Dégradé blanc → teinte dominante à ~19% (hex + "30").
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${dom}30 100%)`;
  return (
    <article style={{ position: "relative", cursor: "pointer" }}>
      <div onClick={onClick}>
        <div style={{ background: bgGradient, borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", position: "relative", marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", transition: "box-shadow 0.25s, transform 0.25s" }}
          onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; const img = e.currentTarget.querySelector("img"); if (img) (img as HTMLImageElement).style.transform = "scale(1.05)"; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; const img = e.currentTarget.querySelector("img"); if (img) (img as HTMLImageElement).style.transform = "scale(1)"; }}>
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

  /* État UNIQUE des 11 filtres. Seed SSR-safe (props), puis hydraté depuis
     l'URL (+ localStorage en fallback) au montage → pas de mismatch SSR. */
  const [filters, setFilters] = useState<CategoryFilters>(() => seedFilters(initGenre, initStyle));
  const [hydrated, setHydrated] = useState(false);

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProduitAwin | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    try { localStorage.setItem(`${FILTERS_STORAGE_KEY}:${category}`, JSON.stringify(next)); } catch {}
    try {
      const qs = filtersToParams(next).toString();
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    } catch {}
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

      {/* Breadcrumb */}
      <div style={{ padding: "10px 20px", fontSize: 12, color: "#8a7a68", borderBottom: "0.5px solid #e8dfd0" }}>
        {breadcrumb.map((item, i) => (
          <span key={item.href}>
            {i > 0 && <span style={{ margin: "0 5px", opacity: 0.5 }}>›</span>}
            <Link href={item.href} style={{ color: "#8a7a68", textDecoration: "none" }}>{item.label}</Link>
          </span>
        ))}
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

          <ActiveFilters filters={filters} onChange={updateFilters} />

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
              {products.map((p) => (
                <ProductCard key={p.id} p={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}

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

        </div>{/* /colonne principale */}
      </div>{/* /layout 2 colonnes */}

      {/* CTA palette */}
      <div style={{ maxWidth: 1200, margin: "0 auto 40px", padding: "18px 20px", background: "#f2ede4", borderRadius: 14, textAlign: "center", boxSizing: "border-box" }}>
        <p style={{ fontFamily: "'Fredoka'", fontSize: 17, fontWeight: 500, margin: "0 0 6px" }}>Trouver les pièces de ta palette</p>
        <Link href="/palettes" style={{ display: "inline-block", background: "#1a1a1a", color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 13, fontFamily: "'Inter'", fontWeight: 500, textDecoration: "none", marginTop: 10 }}>
          Explorer les 348 palettes →
        </Link>
      </div>

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}

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
        @media (min-width: 901px)  { .wada-shop-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (min-width: 1200px) { .wada-shop-grid { grid-template-columns: repeat(4,1fr) !important; } }
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
