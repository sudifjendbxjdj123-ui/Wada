"use client";
/**
 * /palettes — Le dictionnaire des 348 accords Sanzo Wada
 * Refonte 2026-05-20 (v2 — mockup éditorial enrichi).
 *
 * Brief changes vs v1 :
 *   - Header H1 + sous-titre + "À propos" pill en top right
 *   - Search bar + sort dropdown séparés
 *   - 8 chips familles (Toutes/Neutres/Chauds/Froids/Terreux/Vifs/Pastels/Sombres)
 *     + bouton "Filtres ⇅" (réservé pour futurs filtres culture/saison)
 *   - Meta row : compteur + "Mises à jour chaque semaine" + View toggle large/compact
 *   - Cards riches : photo gradient ambiance + swatches strip + description +
 *     tags styles/saisons + harmony % + bookmark favori
 *   - Promo banner footer avec 3 features + CTA
 *
 * Design system officiel (beige/cream + Bagel Fat One pour le H1, Fraunces
 * pour les noms de cards = équilibre cohérence brand + lisibilité).
 */
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { dictionary, type DictionaryEntry } from "@/lib/data";
import { colorFamily } from "@/lib/outfitComposer";
import { scoreOutfit } from "@/lib/colorEngine";
import BackButton from "@/components/BackButton";

const palette = {
  bg: "#EFEBE3",
  card: "#FBF9F5",
  ink: "#1E1E1E",
  inkSoft: "#6f685f",
  inkFaint: "#9a9388",
  bordeaux: "#6B3A32",
  olive: "#A8B29A",
  line: "rgba(30,30,30,.10)",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  serif: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const shadow = "0 6px 22px rgba(30,30,30,.06)";
const shadowHover = "0 16px 44px rgba(30,30,30,.12)";

/* ──────────────────────────────────────────────────────────────────────
   FAMILLES — 8 buckets dérivés de colorFamily() HSL
   ────────────────────────────────────────────────────────────────────── */
type Family = "toutes" | "neutres" | "chauds" | "froids" | "terreux" | "vifs" | "pastels" | "sombres";
const FAMILY_LABELS: Record<Family, string> = {
  toutes: "Toutes",
  neutres: "Neutres",
  chauds: "Chauds",
  froids: "Froids",
  terreux: "Terreux",
  vifs: "Vifs",
  pastels: "Pastels",
  sombres: "Sombres",
};

function paletteFamilies(entry: DictionaryEntry): Set<Family> {
  const fams = new Set<Family>(["toutes"]);
  let hasDark = false, hasLight = false, hasWarm = false, hasCool = false, hasVivid = false;
  let avgS = 0, avgL = 0, n = 0;
  for (const c of entry.colors) {
    const fam = colorFamily(c.hex);
    if (fam === "dark") hasDark = true;
    if (fam === "light") hasLight = true;
    if (fam === "warm" || fam === "red") hasWarm = true;
    if (fam === "cool") hasCool = true;
    const hex = c.hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
    avgS += s; avgL += l; n++;
    if (s > 0.55 && l > 0.35 && l < 0.65) hasVivid = true;
  }
  avgS /= n || 1; avgL /= n || 1;
  if (avgS < 0.22) fams.add("neutres");
  if (hasWarm && !hasCool) fams.add("chauds");
  if (hasCool && !hasWarm) fams.add("froids");
  if (avgL < 0.4) fams.add("sombres");
  if (avgL > 0.75 && avgS < 0.45) fams.add("pastels");
  if (hasVivid) fams.add("vifs");
  if (hasWarm && avgS > 0.2 && avgS < 0.55 && avgL < 0.6) fams.add("terreux");
  return fams;
}

/* Génère un gradient ambiance depuis les 3 premières couleurs de la palette */
function paletteGradient(entry: DictionaryEntry): string {
  const cols = entry.colors.slice(0, 3);
  if (cols.length === 0) return "linear-gradient(135deg, #ccc, #999)";
  if (cols.length === 1) return `linear-gradient(135deg, ${cols[0].hex}, ${cols[0].hex})`;
  if (cols.length === 2) return `linear-gradient(135deg, ${cols[0].hex}, ${cols[1].hex})`;
  return `linear-gradient(135deg, ${cols[0].hex}, ${cols[1].hex} 60%, ${cols[2].hex})`;
}

/* Score harmonie 0-100 (à partir de colorHarmony 0-10 du moteur) */
function harmonyPct(entry: DictionaryEntry): number {
  try {
    const score = scoreOutfit(entry);
    return Math.round((score.colorHarmony || 0) * 10);
  } catch {
    return 88;
  }
}

type SortMode = "number" | "az" | "harmony" | "popular";
type ViewMode = "large" | "compact";

export default function PalettesPage() {
  const [filter, setFilter] = useState<Family>("toutes");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("number");
  const [view, setView] = useState<ViewMode>("large");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Brief Étape 2.1 (2026-05-26) : pagination 24 + bouton « Voir plus ».
  // Charger 348 cards d'un coup tuait les perfs sur mobile 4G.
  const PAGE_SIZE = 24;
  const [pageCount, setPageCount] = useState(PAGE_SIZE);
  // Reset à la première page quand un filtre / une recherche / un tri change
  useEffect(() => {
    setPageCount(PAGE_SIZE);
  }, [filter, query, sortMode]);

  useEffect(() => {
    try {
      const fv = localStorage.getItem("wada-favorites");
      if (fv) setFavorites(new Set(JSON.parse(fv)));
    } catch {}
  }, []);

  const toggleFavorite = (num: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      try { localStorage.setItem("wada-favorites", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  /* Annote chaque palette avec familles + harmony % — memoisé pour les 348 */
  const annotated = useMemo(() => {
    return dictionary.map((entry) => ({
      entry,
      families: paletteFamilies(entry),
      gradient: paletteGradient(entry),
      harmony: harmonyPct(entry),
    }));
  }, []);

  /* Filtre + sort */
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = annotated.filter(({ entry, families }) => {
      if (filter !== "toutes" && !families.has(filter)) return false;
      if (q) {
        const hay = `${entry.name} ${entry.number} ${entry.description || ""} ${(entry.styles || []).join(" ")} ${(entry.seasons || []).join(" ")} ${entry.culture || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (sortMode === "az") list = [...list].sort((a, b) => a.entry.name.localeCompare(b.entry.name, "fr"));
    else if (sortMode === "harmony") list = [...list].sort((a, b) => b.harmony - a.harmony);
    else if (sortMode === "popular") list = [...list].sort((a, b) => {
      const af = favorites.has(a.entry.number) ? 1 : 0;
      const bf = favorites.has(b.entry.number) ? 1 : 0;
      if (af !== bf) return bf - af;
      return a.entry.number.localeCompare(b.entry.number);
    });
    else list = [...list].sort((a, b) => a.entry.number.localeCompare(b.entry.number));
    return list;
  }, [annotated, filter, query, sortMode, favorites]);

  return (
    <main style={{
      fontFamily: fonts.sans,
      background: palette.bg,
      color: palette.ink,
      lineHeight: 1.55,
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
    }}>
            <BackButton />

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 26px 70px" }}>
        {/* TOP — Titre + sous-titre + À propos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{
              fontFamily: fonts.display, fontWeight: 700,
              fontSize: "clamp(28px, 5vw, 44px)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}>
              Quelle combinaison vous parle ?
            </h1>
            <p style={{ color: palette.inkSoft, fontSize: 15, marginTop: 6 }}>
              Découvrez des harmonies de couleurs pensées pour vos tenues parfaites.
            </p>
          </div>
          <Link href="/about" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 12, letterSpacing: "0.08em",
            background: palette.card, border: `1px solid ${palette.line}`,
            borderRadius: 999, padding: "9px 15px",
            color: palette.inkSoft, textDecoration: "none",
            flexShrink: 0,
          }}>
            ⓘ À propos
          </Link>
        </div>

        {/* ─── Barre filtres COLLANTE (brief 2026-05-26) ───
             Sticky en haut avec backdrop-blur dès qu'on scrolle. Englobe
             SEARCH+SORT, les chips de teinte et le compteur. Reste lisible
             sur fond cream/beige grâce au blur + bg semi-opaque. */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 19, // sous la nav (z:20) mais au-dessus du contenu
          background: "rgba(244, 239, 231, .82)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          margin: "0 -26px",
          padding: "8px 26px 4px",
          borderBottom: `1px solid ${palette.line}`,
        }}>
        {/* SEARCH + SORT */}
        <div style={{ display: "flex", gap: 12, margin: "12px 0 12px", flexWrap: "wrap" }}>
          <div style={{
            flex: 1, minWidth: 220,
            display: "flex", alignItems: "center", gap: 10,
            background: palette.card,
            border: `1px solid ${palette.line}`,
            borderRadius: 14,
            padding: "13px 18px",
            boxShadow: shadow,
          }}>
            <span aria-hidden style={{ color: palette.inkFaint }}>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une palette (nom, couleur, culture, ambiance…)"
              style={{
                flex: 1, border: "none", background: "transparent", outline: "none",
                fontFamily: fonts.sans, fontSize: 15, color: palette.ink,
              }}
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            style={{
              background: palette.card, border: `1px solid ${palette.line}`,
              borderRadius: 14, padding: "12px 18px",
              fontFamily: fonts.sans, fontSize: 14, color: palette.inkSoft,
              boxShadow: shadow, cursor: "pointer",
            }}
          >
            <option value="number">Trier par : Numéro</option>
            <option value="az">Trier par : A → Z</option>
            <option value="harmony">Trier par : Harmonie</option>
            <option value="popular">Trier par : Favoris</option>
          </select>
        </div>

        {/* FILTER CHIPS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {(Object.keys(FAMILY_LABELS) as Family[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 13.5, padding: "9px 17px",
                  borderRadius: 999,
                  border: `1px solid ${filter === f ? palette.ink : palette.line}`,
                  background: filter === f ? palette.ink : palette.card,
                  color: filter === f ? "#fff" : palette.inkSoft,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  transition: "all 0.22s ease",
                }}
              >
                {FAMILY_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* META ROW — compteur dynamique, dans la zone sticky */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          margin: "14px 0 12px", color: palette.inkSoft, fontSize: 13, flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span><b style={{ color: palette.ink, fontWeight: 600 }}>{filtered.length}</b> palette{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}</span>
            {/* Brief UX client (26/05) — « Mises à jour chaque semaine »
                était trompeur : le dictionnaire Sanzo Wada de 1933 est
                figé, on ne le met pas à jour. La cadence hebdo concerne
                /calendrier et /decouverte. Reformulé en « accords
                intemporels » qui dit ce qui est vrai. */}
            <span>· 348 accords intemporels du dictionnaire Sanzo Wada (1933)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Vue</span>
            <button
              type="button"
              onClick={() => setView("large")}
              style={vBtnStyle(view === "large")}
              aria-label="Vue large"
            >
              ▦
            </button>
            <button
              type="button"
              onClick={() => setView("compact")}
              style={vBtnStyle(view === "compact")}
              aria-label="Vue compacte"
            >
              ▥
            </button>
          </div>
        </div>
        </div>{/* /sticky filter bar (brief 2026-05-26) */}

        {/* GRID */}
        {filtered.length === 0 ? (
          <p style={{
            textAlign: "center", color: palette.inkSoft,
            padding: "50px 0", fontFamily: fonts.serif, fontStyle: "italic",
          }}>
            Aucune palette ne correspond — essayez une autre teinte.
          </p>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: view === "large"
                ? "repeat(auto-fill, minmax(220px, 1fr))"
                : "repeat(auto-fill, minmax(180px, 1fr))",
              gap: view === "large" ? 20 : 16,
            }}>
              {filtered.slice(0, pageCount).map(({ entry, families, gradient, harmony }) => (
                <PaletteCardEditorial
                  key={entry.number}
                  entry={entry}
                  gradient={gradient}
                  harmony={harmony}
                  family={[...families].find((f) => f !== "toutes") || "neutres"}
                  isFavorite={favorites.has(entry.number)}
                  onToggleFavorite={() => toggleFavorite(entry.number)}
                />
              ))}
            </div>
            {/* « Voir plus » — affiche +24 palettes à chaque clic, jusqu'à
                épuisement de la liste filtrée. Brief Étape 2.1. */}
            {pageCount < filtered.length && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button
                  type="button"
                  onClick={() => setPageCount((n) => n + PAGE_SIZE)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    fontWeight: 500,
                    padding: "13px 28px",
                    background: palette.ink,
                    color: palette.bg,
                    border: "none",
                    borderRadius: 999,
                    cursor: "pointer",
                  }}
                >
                  Voir plus
                  <span aria-hidden style={{ opacity: 0.7, fontSize: 12 }}>
                    ({filtered.length - pageCount} restantes)
                  </span>
                </button>
              </div>
            )}
          </>
        )}

        {/* PROMO BANNER footer */}
        <div style={{
          marginTop: 34,
          background: palette.card,
          border: `1px solid ${palette.line}`,
          borderRadius: 18,
          padding: "22px 26px",
          display: "flex", alignItems: "center", gap: 22,
          flexWrap: "wrap",
          boxShadow: shadow,
        }}>
          <div aria-hidden style={{
            width: 54, height: 54, borderRadius: "50%",
            background: palette.ink, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            ✦
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{
              fontFamily: fonts.serif, fontWeight: 500, fontSize: 18,
              color: palette.ink, margin: 0,
            }}>
              L'harmonie des couleurs, pensée pour vous.
            </h3>
            <p style={{
              fontSize: 13, color: palette.inkSoft, maxWidth: "42ch", marginTop: 3,
            }}>
              Nos palettes sont évaluées par notre IA selon la théorie des couleurs et les tendances mode.
            </p>
          </div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <PromoFeat icon="◷" label="Harmonie" desc="Équilibre visuel optimal" />
            <PromoFeat icon="⤬" label="Polyvalence" desc="Facile à associer au quotidien" />
            <PromoFeat icon="⚙" label="Saisons" desc="Adaptées à toutes les saisons" />
          </div>
          <Link href="/composer" style={{
            background: palette.ink, color: "#fff",
            border: "none", borderRadius: 12,
            padding: "14px 22px",
            fontFamily: fonts.sans, fontSize: 14, fontWeight: 500,
            cursor: "pointer", whiteSpace: "nowrap",
            textDecoration: "none",
          }}>
            Découvrir ma palette sur mesure →
          </Link>
        </div>
      </div>

          </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   PaletteCardEditorial — photo gradient + swatches + body riche
   ────────────────────────────────────────────────────────────────────── */
/* ──────────────────────────────────────────────────────────────────────
   PaletteCardEditorial — refonte 2026-05-26 (brief « palettes pro »).
   3 bandes verticales 150px (hover : 1ère bande s'élargit), n° top-left
   filigrane, ♡ top-right rond, nom serif + culture en bas. Card cream,
   border line, shadow soft, hover translateY -5px.
   ────────────────────────────────────────────────────────────────────── */
function PaletteCardEditorial({
  entry, isFavorite, onToggleFavorite,
}: {
  entry: DictionaryEntry;
  // gradient/harmony/family conservés en props pour compat (non utilisés
  // ici — la card épure le visuel selon le brief).
  gradient: string;
  harmony: number;
  family: Family;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  // Label culture lisible FR (premier des cultureLabels match)
  const cultureFR = entry.culture
    ? entry.culture[0].toUpperCase() + entry.culture.slice(1)
    : "";

  return (
    <Link
      href={`/palette/${entry.number}`}
      className="wada-palette-card"
      style={{
        background: "#FBF9F5",
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 6px 22px rgba(30,30,30,.05)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s cubic-bezier(.22,1,.36,1)",
      }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.transform = "translateY(-5px)";
        ev.currentTarget.style.boxShadow = "0 18px 46px rgba(30,30,30,.12)";
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.transform = "translateY(0)";
        ev.currentTarget.style.boxShadow = "0 6px 22px rgba(30,30,30,.05)";
      }}
    >
      {/* ─── 3-4 bandes de couleur verticales, h:150 ─── */}
      <div className="wada-palette-bands" style={{
        position: "relative",
        display: "flex",
        height: 150,
      }}>
        {entry.colors.map((c, i) => (
          <span
            key={i}
            title={`${c.name} ${c.hex}`}
            style={{
              flex: 1,
              background: c.hex,
              transition: "flex 0.35s cubic-bezier(.22,1,.36,1)",
            }}
          />
        ))}

        {/* N° top-left — filigrane blanc, faible opacité */}
        <span style={{
          position: "absolute",
          top: 11, left: 12,
          fontFamily: fonts.display,
          fontWeight: 600,
          fontSize: 11,
          color: "rgba(255,255,255,.9)",
          textShadow: "0 1px 3px rgba(0,0,0,.3)",
          letterSpacing: "0.04em",
          pointerEvents: "none",
        }}>
          N°{entry.number}
        </span>

        {/* ♡ Favori top-right — rond cream avec hover bordeaux */}
        <button
          type="button"
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(); }}
          style={{
            position: "absolute",
            top: 10, right: 10,
            width: 30, height: 30,
            borderRadius: "50%",
            border: "none",
            background: isFavorite ? palette.bordeaux : "rgba(255,255,255,.82)",
            color: isFavorite ? "#fff" : palette.bordeaux,
            fontSize: 14,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* ─── Body : nom serif + culture filigrane ─── */}
      <div style={{ padding: "13px 15px 15px" }}>
        <p style={{
          fontFamily: fonts.serif,
          fontWeight: 500,
          fontSize: 18,
          color: palette.ink,
          lineHeight: 1.15,
          margin: 0,
        }}>
          {entry.name}
        </p>
        {cultureFR && (
          <p style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9a9388",
            marginTop: 4,
            margin: "4px 0 0",
          }}>
            {cultureFR}
          </p>
        )}
      </div>
    </Link>
  );
}

function PromoFeat({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ fontSize: 12.5 }}>
      <b style={{
        display: "block", color: palette.ink, fontWeight: 500,
        fontSize: 13, marginBottom: 1,
      }}>
        <span aria-hidden style={{ marginRight: 6 }}>{icon}</span>
        {label}
      </b>
      <span style={{ color: palette.inkSoft }}>{desc}</span>
    </div>
  );
}

function vBtnStyle(active: boolean): React.CSSProperties {
  return {
    width: 34, height: 30, borderRadius: 8,
    border: `1px solid ${active ? palette.ink : palette.line}`,
    background: active ? palette.ink : palette.card,
    color: active ? "#fff" : palette.inkSoft,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
  };
}
