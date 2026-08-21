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
import { useState, useMemo, useEffect, useRef } from "react";
import { dictionary, type DictionaryEntry } from "@/lib/data";
import { colorFamily } from "@/lib/outfitComposer";
import { scoreOutfit } from "@/lib/colorEngine";
import BackButton from "@/components/BackButton";
/* Brief client 2026-05-26 : « Un seul composant <PaletteCard> partout
   (grille, scanner, cultures, favoris) ». L'ancien PaletteCardEditorial
   inline (défini en bas de ce fichier) est retiré au profit du composant
   partagé qui sert maintenant TOUTES les pages. */
import PaletteCard from "@/components/PaletteCard";
import { PaletteDuJour, CartePaletteCompacte } from "@/components/CartesPalette";
import { AMBIANCES, aPourAmbiance, type Ambiance } from "@/lib/ambiances";
import { useFavorites } from "@/hooks/useFavorites";
import { useGestures } from "@/hooks/useGestures";

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
  /* Ambiance choisie en haut de page. Elle pilote la mise en avant, PAS la
     grille du bas : celle-ci garde ses propres filtres techniques. Mélanger
     les deux rendrait deux jeux de contrôles concurrents sur une même
     liste. */
  const [ambiance, setAmbiance] = useState<Ambiance | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("number");
  const [view, setView] = useState<ViewMode>("large");
  /* Brief 2026-05-26 — unification : la page lit les favoris via le même
     hook useFavorites() que PaletteCard. Avant on avait 2 sources de
     vérité (Set local + hook dans la card) qui pouvaient désynchroniser.
     Maintenant : 1 hook, 1 localStorage, 1 sync inter-onglets gratuite. */
  const { favorites, toggle: toggleFavorite, has: isFavorite } = useFavorites();
  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Brief Étape 2.1 (2026-05-26) : pagination 24 + bouton « Voir plus ».
  // Charger 348 cards d'un coup tuait les perfs sur mobile 4G.
  const PAGE_SIZE = 24;
  const [pageCount, setPageCount] = useState(PAGE_SIZE);
  // Reset à la première page quand un filtre / une recherche / un tri change
  useEffect(() => {
    setPageCount(PAGE_SIZE);
  }, [filter, query, sortMode]);

  // TIER 3: Gesture support pour mobile carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  useGestures(carouselRef.current, {
    onSwipeLeft: () => {
      if (carouselRef.current) {
        carouselRef.current.scrollBy({ left: 280, behavior: "smooth" });
      }
    },
    onSwipeRight: () => {
      if (carouselRef.current) {
        carouselRef.current.scrollBy({ left: -280, behavior: "smooth" });
      }
    },
  });

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
  /* Palettes correspondant à l'ambiance choisie, ou tout le dictionnaire.
     Le tirage est déterministe : l'index dérive du quantième du jour, donc
     le serveur et le client tombent sur la même palette et la mise en avant
     ne change pas d'un rendu à l'autre. */
  const { paletteMiseEnAvant, autresPalettes } = useMemo(() => {
    const pool = ambiance
      ? dictionary.filter((e) => aPourAmbiance(e, ambiance))
      : dictionary;
    if (pool.length === 0) return { paletteMiseEnAvant: null, autresPalettes: [] };
    const jour = Math.floor(Date.now() / 86400000);
    const debut = jour % pool.length;
    const prendre = (i: number) => pool[(debut + i) % pool.length];
    return {
      paletteMiseEnAvant: prendre(0),
      autresPalettes: pool.length > 1
        ? Array.from({ length: Math.min(3, pool.length - 1) }, (_, i) => prendre(i + 1))
        : [],
    };
  }, [ambiance]);

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
      const af = favoritesSet.has(a.entry.number) ? 1 : 0;
      const bf = favoritesSet.has(b.entry.number) ? 1 : 0;
      if (af !== bf) return bf - af;
      return a.entry.number.localeCompare(b.entry.number);
    });
    else list = [...list].sort((a, b) => a.entry.number.localeCompare(b.entry.number));
    return list;
  }, [annotated, filter, query, sortMode, favoritesSet]);

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

      {/* 18 px en haut au lieu de 40 : mesuré en 393×852, la première palette
          commençait à 577 px — le client demandait « voir une palette
          quasiment dès le premier écran ». */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "18px 20px 70px" }}>
        {/* ═══════════════════════════════════════════════════════════════
            EN-TÊTE — « Quelle ambiance ? » (maquette client 2026-08-22)
            ═══════════════════════════════════════════════════════════════
            Le changement est de cadrage, pas de décor :
              avant  « Voici 348 palettes. Choisissez-en une. »
              après  « Quelle atmosphère voulez-vous porter aujourd'hui ? »
            Le brief note aussi qu'avant d'atteindre la première palette, on
            traversait titre, paragraphe, À propos, recherche, tri, huit
            filtres, compteur et bascule de vue. Tout ça existe encore, mais
            APRÈS la palette du jour — l'outillage ne crée pas le désir.
            ═══════════════════════════════════════════════════════════════ */}
        <h1 style={{
          fontFamily: fonts.display, fontWeight: 700,
          fontSize: "clamp(24px, 5.6vw, 40px)",
          letterSpacing: "-0.01em", margin: 0, lineHeight: 1.12,
        }}>
          Quelle ambiance voulez-vous porter aujourd&rsquo;hui&nbsp;?
        </h1>
        <p style={{ color: palette.inkSoft, fontSize: 14, margin: "8px 0 0", maxWidth: "46ch", lineHeight: 1.45 }}>
          348 harmonies de Sanzō Wada, réinterprétées pour votre vestiaire.
        </p>

        {/* Pastilles d'ambiance — l'entrée émotionnelle. Les familles
            techniques (Neutres / Chauds / Froids…) restent plus bas, dans
            les filtres : elles parlent à qui connaît la théorie des
            couleurs, pas à qui cherche comment s'habiller. */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "14px 0 0" }}>
          {AMBIANCES.map((a) => {
            const actif = ambiance === a.cle;
            return (
              <button
                key={a.cle}
                type="button"
                onClick={() => setAmbiance(actif ? null : a.cle)}
                aria-pressed={actif}
                style={{
                  fontSize: 12.5, padding: "8px 14px", borderRadius: 999,
                  border: `1.5px solid ${actif ? palette.bordeaux : palette.line}`,
                  background: actif ? palette.bordeaux : "transparent",
                  color: actif ? "#fff" : palette.ink,
                  cursor: "pointer", fontFamily: fonts.sans,
                  fontWeight: actif ? 600 : 500,
                  transition: "all .2s ease",
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>

        {/* ── Palette du jour ───────────────────────────────────────────
            « Ça évite de jeter 348 choix au visage de quelqu'un dès son
            arrivée. » Quand une ambiance est choisie, la mise en avant suit
            ce choix — sinon la pastille n'aurait aucun effet visible avant
            la grille, tout en bas. */}
        {paletteMiseEnAvant && (
          <section style={{ margin: "18px 0 0" }}>
            <p style={{
              fontFamily: fonts.sans, fontSize: 11, letterSpacing: ".16em",
              textTransform: "uppercase", color: palette.inkFaint, margin: "0 0 11px",
            }}>
              {ambiance ? "Notre choix" : "Palette du jour"}
            </p>
            <PaletteDuJour
              entry={paletteMiseEnAvant}
              favori={isFavorite(paletteMiseEnAvant.number)}
              onFavori={() => toggleFavorite(paletteMiseEnAvant.number)}
            />
          </section>
        )}

        {/* ── Trois autres, pour donner le choix sans écraser ─────────── */}
        {autresPalettes.length > 0 && (
          <section style={{ margin: "28px 0 0" }}>
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              gap: 12, margin: "0 0 11px",
            }}>
              <p style={{
                fontFamily: fonts.sans, fontSize: 11, letterSpacing: ".16em",
                textTransform: "uppercase", color: palette.inkFaint, margin: 0,
              }}>
                Autres palettes pour vous
              </p>
              <a href="#toutes" style={{
                fontFamily: fonts.sans, fontSize: 13, color: palette.bordeaux,
                textDecoration: "none",
              }}>
                Voir tout
              </a>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}>
              {autresPalettes.map((e) => (
                <CartePaletteCompacte
                  key={e.number}
                  entry={e}
                  favori={isFavorite(e.number)}
                  onFavori={() => toggleFavorite(e.number)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── L'héritage Wada ──────────────────────────────────────────
            « Je ne cacherais surtout pas cette origine. Au contraire, j'en
            ferais quelque chose de premium. » Une carte éditoriale plutôt
            qu'une ligne de bas de page : c'est la raison d'être du site. */}
        <section style={{
          margin: "28px 0 0", padding: "18px 20px", borderRadius: 18,
          background: palette.card, border: `1px solid ${palette.line}`,
        }}>
          <p style={{
            fontFamily: fonts.sans, fontSize: 10.5, letterSpacing: ".16em",
            textTransform: "uppercase", color: palette.inkFaint, margin: 0,
          }}>
            L&rsquo;héritage Wada
          </p>
          <h2 style={{
            fontFamily: fonts.display, fontSize: "clamp(20px, 4.6vw, 26px)",
            color: palette.ink, margin: "7px 0 0", lineHeight: 1.2,
          }}>
            348 harmonies. Un siècle plus tard.
          </h2>
          <p style={{
            fontFamily: fonts.sans, fontSize: 14, color: palette.inkSoft,
            lineHeight: 1.55, margin: "9px 0 0", maxWidth: "48ch",
          }}>
            Des accords de couleurs publiés par Sanzō Wada dans les années 1930,
            réinterprétés aujourd&rsquo;hui pour votre vestiaire.
          </p>
          <Link href="/about" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            margin: "14px 0 0", padding: "10px 18px", borderRadius: 999,
            border: `1px solid ${palette.line}`, background: "transparent",
            color: palette.ink, textDecoration: "none",
            fontFamily: fonts.sans, fontSize: 13.5,
          }}>
            Découvrir l&rsquo;histoire →
          </Link>
        </section>

        <h2 id="toutes" style={{
          fontFamily: fonts.sans, fontSize: 11, letterSpacing: ".16em",
          textTransform: "uppercase", color: palette.inkFaint,
          margin: "34px 0 0", scrollMarginTop: 12,
        }}>
          Toutes les palettes
        </h2>

        {/* ─── Barre filtres COLLANTE (brief 2026-05-26) ───
             Sticky en haut avec backdrop-blur dès qu'on scrolle. Englobe
             SEARCH+SORT, les chips de teinte et le compteur. Reste lisible
             sur fond cream/beige grâce au blur + bg semi-opaque. */}
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 19,
          background: "rgba(240, 230, 215, .95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          margin: "0 -26px",
          padding: "8px 26px 4px",
          borderBottom: `1.5px solid ${palette.line}`,
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
                  fontSize: 13.5, padding: "10px 18px",
                  borderRadius: 999,
                  border: `1.5px solid ${filter === f ? palette.bordeaux : palette.line}`,
                  background: filter === f ? palette.bordeaux : "transparent",
                  color: filter === f ? "#fff" : palette.ink,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  transition: "all 0.2s ease",
                  fontWeight: filter === f ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (filter !== f) {
                    e.currentTarget.style.borderColor = palette.bordeaux;
                    e.currentTarget.style.background = "rgba(107, 58, 50, 0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== f) {
                    e.currentTarget.style.borderColor = palette.line;
                    e.currentTarget.style.background = "transparent";
                  }
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
              style={{...vBtnStyle(view === "large"), minWidth: 48, minHeight: 48}}
              aria-label="Vue large"
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              ▦
            </button>
            <button
              type="button"
              onClick={() => setView("compact")}
              style={{...vBtnStyle(view === "compact"), minWidth: 48, minHeight: 48}}
              aria-label="Vue compacte"
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              ▥
            </button>
          </div>
        </div>
        </div>{/* /sticky filter bar (brief 2026-05-26) */}

        {/* GRID / CAROUSEL */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 30px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
          }}>
            <svg width={80} height={80} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx={40} cy={40} r={36} stroke={palette.line} strokeWidth={2} />
              <circle cx={40} cy={32} r={8} fill={palette.inkFaint} opacity={0.4} />
              <path d="M 40 42 L 45 52 L 35 52 Z" fill={palette.inkFaint} opacity={0.4} />
            </svg>
            <div>
              <h3 style={{
                fontFamily: fonts.sans, fontSize: 18, fontWeight: 600,
                color: palette.ink, margin: 0, marginBottom: 8,
              }}>
                Aucune palette ne correspond
              </h3>
              <p style={{
                fontFamily: fonts.sans, fontSize: 14, color: palette.inkSoft,
                margin: 0, marginBottom: 20,
              }}>
                Essayez une autre teinte ou supprimez un filtre pour découvrir plus de couleurs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilter("toutes");
                setQuery("");
              }}
              style={{
                fontFamily: fonts.sans, fontSize: 14, fontWeight: 600,
                padding: "12px 24px",
                background: palette.ink,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#3a2725")}
              onMouseLeave={(e) => (e.currentTarget.style.background = palette.ink)}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div
              ref={carouselRef}
              className={`wada-palettes-carousel ${view === "compact" ? "compact" : ""}`}
              style={{
                display: "grid",
                gridTemplateColumns: view === "large"
                  ? "repeat(auto-fill, minmax(220px, 1fr))"
                  : "repeat(auto-fill, minmax(180px, 1fr))",
                gap: view === "large" ? 20 : 16,
              }}>
              {filtered.slice(0, pageCount).map(({ entry }) => (
                <div key={entry.number} className="wada-reveal-item">
                  <PaletteCard entry={entry} />
                </div>
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
                    fontWeight: 600,
                    padding: "14px 32px",
                    background: palette.ink,
                    color: palette.bg,
                    border: "none",
                    borderRadius: 999,
                    cursor: "pointer",
                    minHeight: 48,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#3a2725";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = palette.ink;
                    e.currentTarget.style.transform = "translateY(0)";
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
          <button
            type="button"
            onClick={() => {
              window.location.href = "/composer";
            }}
            style={{
              background: palette.ink, color: "#fff",
              border: "none", borderRadius: 12,
              padding: "14px 24px",
              fontFamily: fonts.sans, fontSize: 14, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
              minHeight: 48,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#3a2725";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = palette.ink;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Découvrir ma palette sur mesure →
          </button>
        </div>
      </div>

          </main>
  );
}

/* PaletteCardEditorial supprimé 2026-05-26 — promu en composant partagé
   components/PaletteCard.tsx, utilisé maintenant par /palettes, /scanner,
   /cultures, /favoris (brief client : un seul composant carte partout). */

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
