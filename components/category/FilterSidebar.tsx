"use client";
/**
 * Sidebar de filtres catégorie (brief 2026-06-09). Adapté à WADA :
 * styles inline (pas de Tailwind), pas de lucide/react-range. Le slider
 * prix est un double-range natif maison.
 *
 * Exporte : FilterSidebar (desktop + drawer), ActiveFilters (pills),
 * PalettePickerModal, MobileFilterButton.
 */
import { useEffect, useState, useMemo } from "react";
import { dictionary } from "@/lib/data";
import {
  type CategoryFilters, getDefaultFilters, activeFilterCount,
  TYPES_BY_CATEGORY, COLOR_FAMILIES, MATERIALS, SEASONS, STYLES,
  PRICE_MIN, PRICE_MAX,
} from "@/lib/categoryFilters";

const C = {
  bordeaux: "#6e3b32", ink: "#1a1a1a", muted: "#8a7a68", soft: "#5a5a5a",
  line: "#e8dfd0", line2: "#f0e9d8", sandy: "#fef3e8", chip: "#d4ccc0",
  white: "#ffffff", hover: "#faf6ee",
};

export interface Facets {
  type?: Record<string, number>;
  color?: Record<string, number>;
  brand?: Record<string, number>;
  size?: Record<string, number>;
  material?: Record<string, number>;
  season?: Record<string, number>;
  genre?: Record<string, number>;
}

interface PopularPalette { id: string; name: string; colors: string[]; }

/* ──────────────────────────── primitives ──────────────────────────── */
function Chevron({ open }: { open: boolean }) {
  return <span aria-hidden style={{ fontSize: 11, color: open ? C.bordeaux : C.muted, transition: "transform .2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>;
}

function FilterGroup({ name, open, onToggle, children }: { name: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.line2}` }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{name}</span>
        <Chevron open={open} />
      </button>
      {open && <div style={{ paddingBottom: 10 }}>{children}</div>}
    </div>
  );
}

const checkboxRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: C.ink };

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

/* ──────────────────────────── sidebar ──────────────────────────── */
interface SidebarProps {
  category: string;
  filters: CategoryFilters;
  onChange: (f: CategoryFilters) => void;
  facets: Facets;
  resultCount: number;
  variant?: "desktop" | "drawer";
  onClose?: () => void;
}

export function FilterSidebar({ category, filters, onChange, facets, resultCount, variant = "desktop", onClose }: SidebarProps) {
  const [open, setOpen] = useState({
    palette: true, type: true, genre: true, brand: false, color: true,
    size: false, price: true, style: false, season: false, material: false, promo: false,
  });
  const [popular, setPopular] = useState<PopularPalette[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/palettes/popular").then((r) => r.json()).then((d) => { if (!cancelled) setPopular(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const tog = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const set = (patch: Partial<CategoryFilters>) => onChange({ ...filters, ...patch });

  const types = TYPES_BY_CATEGORY[category] || [];
  const brandList = useMemo(() => Object.entries(facets.brand || {}).sort((a, b) => b[1] - a[1]).map(([b]) => b), [facets.brand]);
  const filteredBrands = brandQuery ? brandList.filter((b) => b.toLowerCase().includes(brandQuery.toLowerCase())) : brandList.slice(0, 12);
  const sizeList = useMemo(() => Object.keys(facets.size || {}).sort(), [facets.size]);

  const isDrawer = variant === "drawer";

  return (
    <aside style={{
      background: C.white, borderRadius: isDrawer ? 0 : 18, padding: isDrawer ? "0 16px" : 16,
      width: isDrawer ? "100%" : 230, fontFamily: "'Inter', sans-serif",
      ...(isDrawer ? {} : { position: "sticky", top: 16, maxHeight: "85vh", overflowY: "auto", border: `1px solid ${C.line}` }),
    }}>
      {!isDrawer && (
        <p style={{ fontSize: 11, color: C.soft, margin: "0 0 10px", paddingBottom: 10, borderBottom: `1px solid ${C.line}`, textTransform: "capitalize" }}>
          Filtrer {category} par
        </p>
      )}

      {/* PALETTE — vedette */}
      <div style={{ background: open.palette ? C.sandy : "transparent", margin: open.palette ? "0 -10px 2px" : "0 0 2px", padding: open.palette ? "2px 10px" : 0, borderRadius: 10 }}>
        <button type="button" onClick={() => tog("palette")} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", background: "none", border: "none", borderBottom: `1px solid ${C.line2}`, cursor: "pointer" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: open.palette ? C.bordeaux : C.ink }}>Palette Sanzō Wada</span>
          <Chevron open={open.palette} />
        </button>
        {open.palette && (
          <div style={{ paddingTop: 8 }}>
            {popular.slice(0, 5).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set({ palettes: toggle(filters.palettes, p.id) })}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 0",
                  background: filters.palettes.includes(p.id) ? "rgba(107, 58, 50, 0.08)" : "transparent",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(107, 58, 50, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = filters.palettes.includes(p.id)
                    ? "rgba(107, 58, 50, 0.08)"
                    : "transparent";
                }}
              >
                {/* Swatch palette — bigger & nicer */}
                <span
                  style={{
                    display: "flex",
                    height: 24,
                    width: 56,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: filters.palettes.includes(p.id) ? "0 0 0 2px " + C.bordeaux : "0 2px 6px rgba(0,0,0,0.08)",
                    transition: "all 0.2s",
                  }}
                >
                  {p.colors.slice(0, 4).map((c, i) => (
                    <span key={i} style={{ flex: 1, background: c }} />
                  ))}
                </span>
                {/* Palette name + number */}
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <p style={{ fontSize: 11.5, fontWeight: filters.palettes.includes(p.id) ? 600 : 500, color: C.ink, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 9, color: C.muted, margin: "2px 0 0", fontFamily: "'Inter'" }}>
                    {p.id}
                  </p>
                </div>
                {/* Checkmark when selected */}
                {filters.palettes.includes(p.id) && (
                  <span style={{ fontSize: 16, color: C.bordeaux }}>✓</span>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                fontSize: 10.5,
                color: C.bordeaux,
                background: "none",
                border: "none",
                cursor: "pointer",
                marginTop: 12,
                padding: "8px 0",
                fontWeight: 600,
                width: "100%",
                textAlign: "left",
              }}
            >
              + {Math.max(0, 348 - 5)} palettes →
            </button>
          </div>
        )}
      </div>

      {/* TYPE */}
      {types.length > 0 && (
        <FilterGroup name="Type" open={open.type} onToggle={() => tog("type")}>
          {types.map((t) => {
            const n = facets.type?.[t.label] ?? 0;
            return (
              <label key={t.label} style={{ ...checkboxRow, opacity: n === 0 ? 0.4 : 1 }}>
                <input type="checkbox" checked={filters.types.includes(t.label)} onChange={() => set({ types: toggle(filters.types, t.label) })} style={{ accentColor: C.bordeaux }} />
                <span>{t.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>({n})</span>
              </label>
            );
          })}
        </FilterGroup>
      )}

      {/* GENRE */}
      <FilterGroup name="Genre" open={open.genre} onToggle={() => tog("genre")}>
        <div style={{ display: "flex", gap: 5, paddingTop: 4 }}>
          {["femme", "homme", "mixte"].map((g) => {
            const active = filters.genres.includes(g);
            return (
              <button key={g} type="button" onClick={() => set({ genres: active ? [] : [g] })} style={{ flex: 1, padding: "6px 4px", fontSize: 11, borderRadius: 7, cursor: "pointer", border: `1px solid ${active ? C.ink : C.chip}`, background: active ? C.ink : C.white, color: active ? C.white : C.ink, fontFamily: "'Inter', sans-serif", textTransform: "capitalize" }}>
                {g}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* COULEUR */}
      <FilterGroup name="Couleur" open={open.color} onToggle={() => tog("color")}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingTop: 6 }}>
          {COLOR_FAMILIES.map((c) => {
            const active = filters.colors.includes(c.name);
            return (
              <button key={c.name} type="button" title={c.name} aria-label={c.name} onClick={() => set({ colors: toggle(filters.colors, c.name) })}
                style={{ width: 20, height: 20, borderRadius: "50%", background: c.hex, cursor: "pointer", border: c.name === "Blanc" ? "1px solid #ddd" : "1px solid rgba(0,0,0,.15)", outline: active ? `2px solid ${C.ink}` : "none", outlineOffset: 2 }} />
            );
          })}
        </div>
      </FilterGroup>

      {/* PRIX */}
      <FilterGroup name="Prix" open={open.price} onToggle={() => tog("price")}>
        <PriceRange min={filters.priceMin} max={filters.priceMax} onChange={(min, max) => set({ priceMin: min, priceMax: max })} />
      </FilterGroup>

      {/* MARQUE */}
      {brandList.length > 0 && (
        <FilterGroup name="Marque" open={open.brand} onToggle={() => tog("brand")}>
          <input type="text" value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Rechercher une marque…" aria-label="Rechercher une marque"
            style={{ width: "100%", padding: "6px 9px", fontSize: 12, border: `1px solid ${C.chip}`, borderRadius: 8, marginBottom: 6, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }} />
          <div style={{ maxHeight: 160, overflowY: "auto" }}>
            {filteredBrands.map((b) => (
              <label key={b} style={checkboxRow}>
                <input type="checkbox" checked={filters.brands.includes(b)} onChange={() => set({ brands: toggle(filters.brands, b) })} style={{ accentColor: C.bordeaux }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>({facets.brand?.[b] ?? 0})</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* TAILLE */}
      {sizeList.length > 0 && (
        <FilterGroup name="Taille" open={open.size} onToggle={() => tog("size")}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 6 }}>
            {sizeList.slice(0, 24).map((s) => {
              const active = filters.sizes.includes(s);
              return (
                <button key={s} type="button" onClick={() => set({ sizes: toggle(filters.sizes, s) })}
                  style={{ minWidth: 34, padding: "5px 7px", fontSize: 11, borderRadius: 7, cursor: "pointer", border: `1px solid ${active ? C.ink : C.chip}`, background: active ? C.ink : C.white, color: active ? C.white : C.ink, fontFamily: "'Inter', sans-serif" }}>
                  {s}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* STYLE */}
      <FilterGroup name="Style" open={open.style} onToggle={() => tog("style")}>
        {STYLES.map((s) => (
          <label key={s.value} style={checkboxRow}>
            <input type="checkbox" checked={filters.styles.includes(s.value)} onChange={() => set({ styles: toggle(filters.styles, s.value) })} style={{ accentColor: C.bordeaux }} />
            <span>{s.label}</span>
          </label>
        ))}
      </FilterGroup>

      {/* SAISON */}
      <FilterGroup name="Saison" open={open.season} onToggle={() => tog("season")}>
        <div style={{ display: "flex", gap: 5, paddingTop: 4 }}>
          {SEASONS.map((s) => {
            const active = filters.seasons.includes(s.value);
            return (
              <button key={s.value} type="button" onClick={() => set({ seasons: toggle(filters.seasons, s.value) })} style={{ flex: 1, padding: "6px 4px", fontSize: 10.5, borderRadius: 7, cursor: "pointer", border: `1px solid ${active ? C.ink : C.chip}`, background: active ? C.ink : C.white, color: active ? C.white : C.ink, fontFamily: "'Inter', sans-serif" }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* MATIÈRE */}
      <FilterGroup name="Matière" open={open.material} onToggle={() => tog("material")}>
        {MATERIALS.map((m) => (
          <label key={m.label} style={checkboxRow}>
            <input type="checkbox" checked={filters.materials.includes(m.label)} onChange={() => set({ materials: toggle(filters.materials, m.label) })} style={{ accentColor: C.bordeaux }} />
            <span>{m.label}</span>
          </label>
        ))}
      </FilterGroup>

      {/* PROMO */}
      <FilterGroup name="Promotion" open={open.promo} onToggle={() => tog("promo")}>
        <label style={{ ...checkboxRow, paddingTop: 4 }}>
          <input type="checkbox" checked={filters.onSale} onChange={() => set({ onSale: !filters.onSale })} style={{ accentColor: C.bordeaux }} />
          <span>En promotion</span>
        </label>
      </FilterGroup>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, paddingTop: 12, marginTop: 6, borderTop: `1px solid ${C.line}`, position: "sticky", bottom: 0, background: C.white }}>
        <button type="button" onClick={() => onChange(getDefaultFilters())} style={{ flex: 1, padding: "9px 0", fontSize: 12, border: `1px solid ${C.chip}`, borderRadius: 999, background: C.white, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Effacer</button>
        <button type="button" onClick={() => onClose?.()} style={{ flex: 1, padding: "9px 0", fontSize: 12, border: "none", borderRadius: 999, background: C.ink, color: C.white, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Voir ({resultCount})</button>
      </div>

      {showAll && (
        <PalettePickerModal selected={filters.palettes} onChange={(v) => set({ palettes: v })} onClose={() => setShowAll(false)} />
      )}
    </aside>
  );
}

/* ──────────────────────────── price double-range ──────────────────────────── */
function PriceRange({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  const pct = (v: number) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.soft, marginBottom: 8 }}>
        <span>{PRICE_MIN} €</span>
        <span style={{ color: C.bordeaux, fontWeight: 600 }}>{min} – {max >= PRICE_MAX ? `${PRICE_MAX}+` : max} €</span>
        <span>{PRICE_MAX}+ €</span>
      </div>
      <div style={{ position: "relative", height: 20 }}>
        <div style={{ position: "absolute", top: 9, left: 0, right: 0, height: 3, borderRadius: 2, background: C.line }} />
        <div style={{ position: "absolute", top: 9, height: 3, borderRadius: 2, background: C.bordeaux, left: `${pct(min)}%`, right: `${100 - pct(max)}%` }} />
        <input type="range" aria-label="Prix minimum" min={PRICE_MIN} max={PRICE_MAX} step={10} value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 10), max)}
          className="wada-price-range" style={{ position: "absolute", left: 0, right: 0, top: 0, width: "100%", margin: 0, background: "transparent", pointerEvents: "none", WebkitAppearance: "none", appearance: "none", height: 20 }} />
        <input type="range" aria-label="Prix maximum" min={PRICE_MIN} max={PRICE_MAX} step={10} value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 10))}
          className="wada-price-range" style={{ position: "absolute", left: 0, right: 0, top: 0, width: "100%", margin: 0, background: "transparent", pointerEvents: "none", WebkitAppearance: "none", appearance: "none", height: 20 }} />
      </div>
    </div>
  );
}

/* ──────────────────────────── palette picker modal ──────────────────────────── */
export function PalettePickerModal({ selected, onChange, onClose }: { selected: string[]; onChange: (v: string[]) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? dictionary.filter((d) => d.name.toLowerCase().includes(t) || d.number.includes(t)) : dictionary;
  }, [q]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,26,26,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.white, borderRadius: 18, width: "min(720px, 100%)", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 12 }}>
          <strong style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, color: C.ink }}>Les 348 palettes</strong>
          <span style={{ fontSize: 12, color: C.muted }}>{selected.length} sélectionnée{selected.length > 1 ? "s" : ""}</span>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "12px 18px" }}>
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une palette (nom ou n°)…" aria-label="Rechercher une palette"
            style={{ width: "100%", padding: "9px 12px", fontSize: 13, border: `1px solid ${C.chip}`, borderRadius: 10, fontFamily: "'Inter', sans-serif", boxSizing: "border-box" }} />
        </div>
        <div style={{ overflowY: "auto", padding: "0 18px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {list.map((d) => {
            const active = selected.includes(d.number);
            return (
              <button key={d.number} type="button" onClick={() => onChange(toggle(selected, d.number))}
                style={{ textAlign: "left", border: `1.5px solid ${active ? C.bordeaux : C.line}`, borderRadius: 12, overflow: "hidden", background: active ? C.sandy : C.white, cursor: "pointer", padding: 0 }}>
                <span style={{ display: "flex", height: 34 }}>
                  {d.colors.map((c, i) => <span key={i} style={{ flex: 1, background: c.hex }} />)}
                </span>
                <span style={{ display: "block", padding: "7px 9px" }}>
                  <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.ink, lineHeight: 1.2 }}>{d.name}</span>
                  <span style={{ display: "block", fontSize: 9.5, color: C.muted, marginTop: 2 }}>N°{d.number}{active ? " · ✓" : ""}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 10 }}>
          <button type="button" onClick={() => onChange([])} style={{ flex: 1, padding: "11px 0", fontSize: 13, border: `1px solid ${C.chip}`, borderRadius: 999, background: C.white, cursor: "pointer" }}>Tout désélectionner</button>
          <button type="button" onClick={onClose} style={{ flex: 2, padding: "11px 0", fontSize: 13, border: "none", borderRadius: 999, background: C.bordeaux, color: C.white, cursor: "pointer", fontWeight: 600 }}>Appliquer</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── active pills ──────────────────────────── */
export function ActiveFilters({ filters, onChange }: { filters: CategoryFilters; onChange: (f: CategoryFilters) => void }) {
  const pills: { id: string; label: string; swatches?: string[]; remove: () => void }[] = [];
  const set = (patch: Partial<CategoryFilters>) => onChange({ ...filters, ...patch });

  for (const id of filters.palettes) {
    const d = dictionary.find((x) => x.number === id);
    pills.push({ id: `pal-${id}`, label: d?.name || `N°${id}`, swatches: d?.colors.map((c) => c.hex), remove: () => set({ palettes: filters.palettes.filter((x) => x !== id) }) });
  }
  for (const t of filters.types) pills.push({ id: `type-${t}`, label: t, remove: () => set({ types: filters.types.filter((x) => x !== t) }) });
  for (const g of filters.genres) pills.push({ id: `genre-${g}`, label: g.charAt(0).toUpperCase() + g.slice(1), remove: () => set({ genres: filters.genres.filter((x) => x !== g) }) });
  for (const b of filters.brands) pills.push({ id: `brand-${b}`, label: b, remove: () => set({ brands: filters.brands.filter((x) => x !== b) }) });
  for (const c of filters.colors) pills.push({ id: `color-${c}`, label: c, remove: () => set({ colors: filters.colors.filter((x) => x !== c) }) });
  for (const s of filters.sizes) pills.push({ id: `size-${s}`, label: `Taille ${s}`, remove: () => set({ sizes: filters.sizes.filter((x) => x !== s) }) });
  for (const s of filters.styles) { const lbl = STYLES.find((x) => x.value === s)?.label || s; pills.push({ id: `style-${s}`, label: lbl, remove: () => set({ styles: filters.styles.filter((x) => x !== s) }) }); }
  for (const s of filters.seasons) { const lbl = SEASONS.find((x) => x.value === s)?.label || s; pills.push({ id: `season-${s}`, label: lbl, remove: () => set({ seasons: filters.seasons.filter((x) => x !== s) }) }); }
  for (const m of filters.materials) pills.push({ id: `mat-${m}`, label: m, remove: () => set({ materials: filters.materials.filter((x) => x !== m) }) });
  if (filters.onSale) pills.push({ id: "sale", label: "En promotion", remove: () => set({ onSale: false }) });
  if (filters.priceMin > PRICE_MIN || filters.priceMax < PRICE_MAX) pills.push({ id: "price", label: `${filters.priceMin}–${filters.priceMax >= PRICE_MAX ? PRICE_MAX + "+" : filters.priceMax} €`, remove: () => set({ priceMin: PRICE_MIN, priceMax: PRICE_MAX }) });

  if (pills.length === 0) return null;

  // Couleurs par type de filtre
  const getBadgeStyle = (id: string) => {
    const bgColors: Record<string, { bg: string; border: string; text: string }> = {
      "pal": { bg: "#fef3e8", border: "#f5d4a8", text: "#8a5a2a" },
      "genre": { bg: "#ede9f6", border: "#c5b9e8", text: "#5a3f8f" },
      "price": { bg: "#f0e8f5", border: "#d9c8e8", text: "#6a4a8a" },
      "style": { bg: "#e8f3f5", border: "#b8dce8", text: "#3a6a8a" },
      "type": { bg: "#f0f5e8", border: "#d4e8b8", text: "#5a8a3a" },
      "size": { bg: "#f5f0e8", border: "#e8dcc8", text: "#8a7a5a" },
      "mat": { bg: "#f5eee8", border: "#e8d8c8", text: "#8a6a5a" },
      "sale": { bg: "#ffe8e8", border: "#f5c8c8", text: "#8a3a3a" },
      "color": { bg: "#f0ebe8", border: "#d8ccc0", text: "#7a6a5a" },
    };
    const prefix = id.split("-")[0];
    return bgColors[prefix] || { bg: C.white, border: C.chip, text: C.ink };
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: pills.length > 0 ? 10 : 0 }}>
        {pills.map((p) => {
          const style = getBadgeStyle(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={p.remove}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: style.bg,
                border: `1px solid ${style.border}`,
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 11.5,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                color: style.text,
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {p.swatches && (
                <span style={{ display: "flex", height: 11, width: 18, borderRadius: 2, overflow: "hidden" }}>
                  {p.swatches.map((c, i) => (
                    <span key={i} style={{ flex: 1, background: c }} />
                  ))}
                </span>
              )}
              {p.label}
              <span aria-hidden style={{ fontSize: 13, opacity: 0.6 }}>×</span>
            </button>
          );
        })}
      </div>
      {pills.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(getDefaultFilters())}
          style={{
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2a2a2a";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1a1a1a";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Réinitialiser tous les filtres
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────── mobile filter button ──────────────────────────── */
export function MobileFilterButton({ filters, resultCount, onClick }: { filters: CategoryFilters; resultCount: number; onClick: () => void }) {
  const n = activeFilterCount(filters);
  return (
    <button type="button" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", background: C.ink, color: C.white, borderRadius: 999, border: "none", fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
      <span aria-hidden>⚙</span> Filtrer
      {n > 0 && <span style={{ background: "rgba(255,255,255,.22)", padding: "1px 7px", borderRadius: 999, fontSize: 11 }}>{n}</span>}
      <span style={{ opacity: 0.7 }}>· {resultCount}</span>
    </button>
  );
}
