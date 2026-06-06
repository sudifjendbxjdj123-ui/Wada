"use client";
/**
 * CategoryPage — Grille shopping style Lyst/Zalando.
 * Filtres : Genre (si non préselectionné), Prix, Couleur, Style, Tri.
 * Quick View modal sur clic carte.
 */
import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
import Link from "next/link";
import type { ProduitAwin } from "@/lib/schema";
import { dictionaryMinimal } from "@/lib/data-client";
import { deltaEHex, DELTA_E_LOOSE } from "@/lib/colorDistance";

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
              <img src={p.largeImage || p.image} alt={p.nom || p.marque || "Produit"} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 18 }} />
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
            <p style={{ fontFamily: "'Inter'", fontSize: 24, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{typeof p.prix === "number" ? `${p.prix.toLocaleString("fr-FR")} €` : "Prix sur le site"}</p>
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
            <img src={p.image || p.largeImage} alt={p.nom || p.marque || "Produit"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", transition: "transform 0.4s cubic-bezier(.22,1,.36,1)" }} />
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
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>{typeof p.prix === "number" ? `${p.prix.toLocaleString("fr-FR")} €` : "Prix sur le site"}</p>
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

  const PER_PAGE = 48;

  /* Filtres API (server-side → refetch) */
  const [genre, setGenre] = useState(initGenre ?? "");
  const [style, setStyle] = useState(initStyle ?? "");
  const [priceRange, setPriceRange] = useState("");
  const [couleur, setCouleur] = useState("");

  /* Tri client-side (instantané, pas de refetch) */
  const [sortBy, setSortBy] = useState("");

  /* Pagination */
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<ProduitAwin | null>(null);
  const [, startTransition] = useTransition();

  /* ── Mapping priceRange → prixMin/prixMax ── */
  const priceParams = useMemo(() => {
    if (!priceRange) return {};
    if (priceRange === "0-50")    return { prixMin: "0",   prixMax: "50" };
    if (priceRange === "50-100")  return { prixMin: "50",  prixMax: "100" };
    if (priceRange === "100-200") return { prixMin: "100", prixMax: "200" };
    if (priceRange === "200-500") return { prixMin: "200", prixMax: "500" };
    if (priceRange === "500+")    return { prixMin: "500", prixMax: "" };
    return {};
  }, [priceRange]);

  /* ── Fetch produits ── */
  const fetchProducts = useCallback(async (currentPage: number) => {
    setLoading(true);
    const slots = slot.split(",");
    const offset = (currentPage - 1) * PER_PAGE;
    const results = await Promise.all(slots.map(async (s) => {
      const par = new URLSearchParams({ slot: s.trim(), limit: String(PER_PAGE), offset: String(offset) });
      if (q)      par.set("q", q);
      if (genre)  par.set("genre", genre);
      if (style)  par.set("style", style);
      if (couleur) par.set("couleurFamille", couleur);
      if (priceParams.prixMin) par.set("prixMin", priceParams.prixMin);
      if (priceParams.prixMax) par.set("prixMax", priceParams.prixMax);
      return fetch(`/api/products?${par}`).then(r => r.json()).catch(() => ({ products: [], total: 0 }));
    }));
    const all: ProduitAwin[] = results.flatMap(r => r.products ?? []);
    setProducts(all);
    setTotal(results.reduce((s, r) => s + (r.total ?? 0), 0));
    setLoading(false);
  }, [slot, PER_PAGE]);

  /* ── Debounce filter changes (300ms) — batch rapid filter updates into single fetch ── */
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    /* Clear previous timer on every filter change */
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    /* Set new timer: fetch after 300ms of inactivity */
    debounceTimerRef.current = setTimeout(() => {
      setPage(1); /* Reset to page 1 when filters change */
      fetchProducts(1);
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [q, genre, style, couleur, priceParams, fetchProducts]);

  useEffect(() => { fetchProducts(page); }, [fetchProducts, page]);

  /* ── Familles de couleurs fixes (comme Zalando) ── */
  const COLOR_FAMILIES: Array<{ value: string; label: string; hex: string; keywords: string[] }> = [
    { value: "noir",    label: "Noir",          hex: "#1c1c1c", keywords: ["noir","black","anthracite","charbon","ébène","onyx","graphite"] },
    { value: "blanc",   label: "Blanc / Crème", hex: "#f0ebe0", keywords: ["blanc","white","crème","cream","ivoire","ivory","écru","ecru","off-white","nacre","lait","cassé"] },
    { value: "gris",    label: "Gris",          hex: "#8e8e8e", keywords: ["gris","grey","gray","argent","silver","acier","perle","ciment","ardoise","souris"] },
    { value: "beige",   label: "Beige / Camel", hex: "#c4a882", keywords: ["beige","camel","sable","nude","grège","taupe","nougat","naturel","lin","chanvre","paille","blé","champagne","dune"] },
    { value: "marron",  label: "Marron",        hex: "#7d4f35", keywords: ["marron","brun","brown","tabac","cognac","noisette","chocolat","caramel","tan","havane","moka","café","châtaigne","ocre"] },
    { value: "bleu",    label: "Bleu",          hex: "#2c5282", keywords: ["bleu","blue","marine","navy","indigo","cobalt","saphir","cyan","ciel","azur","denim","électrique","nuit"] },
    { value: "vert",    label: "Vert / Kaki",   hex: "#4a6741", keywords: ["vert","green","kaki","khaki","olive","sauge","sage","forêt","forest","émeraude","menthe","militaire","bouteille","chasseur","pistache","mousse"] },
    { value: "rouge",   label: "Rouge",         hex: "#8b1a1a", keywords: ["rouge","red","bordeaux","burgundy","carmin","cramoisi","vermeil","grenat","cerise","fraise","rubis","brique"] },
    { value: "rose",    label: "Rose",          hex: "#e8a4a4", keywords: ["rose","pink","blush","poudré","framboise","corail","coral","saumon","salmon","pêche","layette","nude rose","fushia","fuchsia","lilas rose"] },
    { value: "jaune",   label: "Jaune / Moutarde", hex: "#c8951a", keywords: ["jaune","yellow","moutarde","mustard","doré","or","gold","citron","curry","safran","ambre","miel","sable doré"] },
    { value: "orange",  label: "Orange",        hex: "#d4642a", keywords: ["orange","rouille","rust","terre cuite","brique","cannelle","roux","cuivre","paprika","brûlé"] },
    { value: "violet",  label: "Violet",        hex: "#6b3a8b", keywords: ["violet","purple","mauve","lilas","aubergine","lavande","prune","parme","améthyste","myrtille"] },
  ];

  /* ── Tri client-side uniquement (prix/couleur = serveur) ── */
  const filtered = useMemo(() => {
    if (!sortBy) return products;
    const list = [...products];
    if (sortBy === "price-asc")  list.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
    if (sortBy === "price-desc") list.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
    if (sortBy === "az")         list.sort((a, b) => (a.marque || "").localeCompare(b.marque || "", "fr"));
    return list;
  }, [products, sortBy]);

  /* ── Nombre de filtres actifs ── */
  const activeCount = [priceRange, couleur, style, sortBy].filter(Boolean).length
    + (initGenre ? 0 : genre ? 1 : 0);

  /* ── Options des dropdowns ── */
  const PRICE_OPTIONS = [
    { value: "",        label: "Tous les prix",    extra: "" },
    { value: "0-50",    label: "Moins de 50 €",    extra: "" },
    { value: "50-100",  label: "50 € – 100 €",     extra: "" },
    { value: "100-200", label: "100 € – 200 €",    extra: "" },
    { value: "200-500", label: "200 € – 500 €",    extra: "" },
    { value: "500+",    label: "Plus de 500 €",    extra: "" },
  ];
  const COLOR_OPTIONS = [
    { value: "", label: "Toutes couleurs", extra: "" },
    ...COLOR_FAMILIES.map(f => ({ value: f.value, label: f.label, extra: f.hex })),
  ];
  const STYLE_OPTIONS = [
    { value: "",              label: "Tous les styles",  extra: "" },
    { value: "Classique",     label: "Classique",        extra: "Chemises, costumes, tenues soignées" },
    { value: "Minimaliste",   label: "Minimaliste",      extra: "Coupes épurées, matières nobles" },
    { value: "Décontracté",   label: "Décontracté",      extra: "Casual, confortable, quotidien" },
    { value: "Streetwear",    label: "Streetwear",       extra: "Sneakers, hoodies, looks urbains" },
    { value: "Premium",       label: "Premium / Luxe",   extra: "Maisons haut de gamme" },
  ];
  const SORT_OPTIONS = [
    { value: "",            label: "Pertinence",        extra: "" },
    { value: "price-asc",   label: "Prix croissant ↑",  extra: "" },
    { value: "price-desc",  label: "Prix décroissant ↓", extra: "" },
    { value: "az",          label: "Marque A → Z",      extra: "" },
  ];
  const GENRES = [
    { value: "", label: "Tous" },
    { value: "homme", label: "Hommes" },
    { value: "femme",  label: "Femmes" },
  ];

  /* Remettre à page 1 quand un filtre serveur change */
  const changeGenre  = (v: string) => { setGenre(v);      setPage(1); };
  const changeStyle  = (v: string) => { setStyle(v);      setPage(1); };
  const changePrice  = (v: string) => { setPriceRange(v); setPage(1); };
  const changeCouleur = (v: string) => { setCouleur(v);   setPage(1); };

  const resetAll = () => {
    if (!initGenre) changeGenre("");
    changeStyle(""); changePrice(""); changeCouleur(""); setSortBy(""); setPage(1);
  };

  /* Nombre total de pages */
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  /* ── Pré-calculation des matchs de palettes pour optimiser le rendu grille ──
     Batch-populate cache pour tous les produits (évite recalcul pendant render) */
  useMemo(() => {
    filtered.forEach((p) => {
      if (p.hex) getMatchingPalettes(p.hex);
    });
  }, [filtered]);

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
            onChange={changePrice}
          />

          {/* Couleur */}
          <FilterDropdown
            label={couleur ? COLOR_OPTIONS.find(o => o.value === couleur)?.label ?? "Couleur" : "Couleur"}
            active={!!couleur}
            options={COLOR_OPTIONS}
            value={couleur}
            onChange={changeCouleur}
            renderOption={(opt) => (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {opt.extra ? (
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: opt.extra, border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.3)" }} />
                ) : (
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: "conic-gradient(red,yellow,green,blue,violet,red)", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)" }} />
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
            renderOption={(opt) => (
              <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span>{opt.label}</span>
                {opt.extra && <span style={{ fontSize: 11, color: "#8a7a68", fontWeight: 400 }}>{opt.extra}</span>}
              </span>
            )}
          />

          <span style={{ width: 1, height: 20, background: "#e8dfd0", flexShrink: 0 }} />

          {/* Tri */}
          <FilterDropdown
            label={sortBy ? SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? "Trier" : "Trier"}
            active={!!sortBy}
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            renderOption={(opt) => <span>{opt.label}</span>}
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
