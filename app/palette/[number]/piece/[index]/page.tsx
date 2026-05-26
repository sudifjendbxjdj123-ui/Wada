"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, use } from "react";
import {
  dictionary, shopOptionsAffiliated, cultureLabels,
  filterShopLinks, styleModes, worldBrandsForPiece, enc,
  type StyleModeKey, type ShopLink, type WorldBrand,
} from "@/lib/data";
import { smartQuery, paletteGender } from "@/lib/utils";
import { iconForItem, pieceLabels } from "@/lib/icons";
import PieceIconBold from "@/components/PieceIconBold";
import {
  ink, paper, subtle, mojo, mojoSoft, border, sectionLabel,
  textSecondary, fontHeading, fontBody, fontLabel,
  buttonRadius, cardRadius,
} from "@/lib/styles";
import HandArrow from "@/components/HandArrow";
import ExternalLink from "@/components/ExternalLink";

const PRICE_HINTS: Record<string, string> = {
  Top: "79,00 €", Shirt: "59,00 €", Outer: "189,00 €",
  Bottom: "89,00 €", Shoes: "120,00 €", Accent: "39,00 €",
};

const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "13px 24px", borderRadius: buttonRadius,
  fontFamily: fontLabel, fontSize: 13, fontWeight: 600,
  letterSpacing: "0.04em", textDecoration: "none", cursor: "pointer",
  border: "1px solid transparent", whiteSpace: "nowrap" as const,
  transition: "all 0.2s ease",
};
const btnPrimary = { ...btnBase, background: mojo, color: "#FFFFFF" };
const btnInk     = { ...btnBase, background: ink, color: "#FFFFFF" };
const btnOutline = { ...btnBase, background: "transparent", color: ink, border: `1px solid ${ink}` };

type CartItem = {
  id: string; piece: string; item: string; colorName: string; colorHex: string;
  query: string; fromEntry: string; addedAt: number;
};

/**
 * 3 grands buckets pour épurer la navigation marchands.
 * Au lieu de 9-13 tiers techniques, on regroupe par intention d'achat.
 */
const TIER_BUCKETS: { id: string; label: string; desc: string; tiers: string[] }[] = [
  {
    id: "budget",
    label: "Petit budget",
    desc: "Seconde main et fast retail — sous 100 €",
    tiers: ["Seconde main", "Petits prix", "Vintage", "Artisanat"],
  },
  {
    id: "compromis",
    label: "Le bon compromis",
    desc: "Prêt-à-porter et marques contemporaines",
    tiers: ["Mid-range", "Multi-marques", "Premium", "Jeunes marques", "Streetwear", "Sport", "Chaussures", "Spécialisé"],
  },
  {
    id: "luxe",
    label: "Pièce d'investissement",
    desc: "Luxe et créateurs établis",
    tiers: ["Luxe"],
  },
];

/**
 * /palette/[number]/piece/[index] — page dédiée à une pièce de la palette.
 * Version épurée : Hero, "Notre sélection" (3 marques curées), 3 buckets simplifiés.
 */
export default function PiecePage({
  params,
}: { params: Promise<{ number: string; index: string }> }) {
  const { number, index } = use(params);
  const pieceIdx = parseInt(index, 10);
  const entry = useMemo(() => dictionary.find((d) => d.number === number), [number]);
  const piece = entry?.composition[pieceIdx];

  const [favorites, setFavorites] = useState<string[]>([]);
  const [cartFlash, setCartFlash] = useState(false);
  const [activeMode, setActiveMode] = useState<StyleModeKey>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBuckets, setExpandedBuckets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const fv = localStorage.getItem("wada-favorites");
      if (fv) setFavorites(JSON.parse(fv));
    } catch {}
  }, []);

  const addToCart = (it: CartItem) => {
    try {
      const raw = localStorage.getItem("wada-cart") || "[]";
      const list: CartItem[] = JSON.parse(raw);
      list.unshift(it);
      localStorage.setItem("wada-cart", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
      setCartFlash(true);
      setTimeout(() => setCartFlash(false), 2000);
    } catch {}
  };

  /* Couleur matchée pour cette pièce */
  const color = useMemo(() => {
    if (!entry || !piece) return null;
    return entry.colors.find((c) => piece.item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) || entry.colors[0];
  }, [entry, piece]);

  /* Tous les liens filtrés par mode */
  const allLinks = useMemo(() => {
    if (!entry || !piece || !color) return [];
    const query = smartQuery(piece.item, color.name);
    const raw = shopOptionsAffiliated(query, piece.piece);
    const filtered = filterShopLinks(raw, { mode: activeMode });
    return filtered.length > 0 ? filtered : raw;
  }, [entry, piece, color, activeMode]);

  /* Sélection curée — 3 marques choisies automatiquement (1 par bucket) */
  const curated = useMemo<ShopLink[]>(() => {
    if (allLinks.length === 0) return [];
    // Priorités par bucket (les marques les plus reconnues d'abord)
    const segPicks = ["Vinted", "Vestiaire Collective", "Le Closet"];
    const midPicks = ["COS", "Sézane", "Massimo Dutti", "Arket", "& Other Stories", "Mango"];
    const luxPicks = ["Net-a-Porter", "Lemaire", "Mr Porter", "Toteme", "Khaite"];

    const findFirst = (names: string[], fallbackBucket: string) => {
      for (const n of names) {
        const found = allLinks.find((l) => l.label === n);
        if (found) return found;
      }
      const bucket = TIER_BUCKETS.find((b) => b.id === fallbackBucket);
      return allLinks.find((l) => bucket?.tiers.includes(l.tier));
    };
    return [
      findFirst(segPicks, "budget"),
      findFirst(midPicks, "compromis"),
      findFirst(luxPicks, "luxe"),
    ].filter(Boolean) as ShopLink[];
  }, [allLinks]);

  /* Liens groupés par bucket */
  const linksByBucket = useMemo(() => {
    const result: Record<string, ShopLink[]> = {};
    TIER_BUCKETS.forEach((b) => {
      result[b.id] = allLinks.filter((l) => b.tiers.includes(l.tier));
    });
    return result;
  }, [allLinks]);

  /* MONDE — petites marques par culture (priorité à la culture de la palette) */
  const worldBrands = useMemo<WorldBrand[]>(() => {
    if (!entry || !piece || !color) return [];
    const q = smartQuery(piece.item, color.name);
    return worldBrandsForPiece(q, entry.culture);
  }, [entry, piece, color]);

  /* ─── Erreurs ─── */
  if (!entry) {
    return (
      <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
                <div style={{ maxWidth: 720, margin: "120px auto", padding: 32, textAlign: "center" }}>
          <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Erreur</p>
          <h1 style={{ fontFamily: fontHeading, fontSize: 48, margin: 0 }}>
            Palette introuvable
          </h1>
          <div style={{ marginTop: 32 }}>
            <Link href="/palettes" style={btnPrimary}>← Voir toutes les palettes</Link>
          </div>
        </div>
              </main>
    );
  }
  if (!piece || !color) {
    return (
      <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
                <div style={{ maxWidth: 720, margin: "120px auto", padding: 32, textAlign: "center" }}>
          <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Erreur</p>
          <h1 style={{ fontFamily: fontHeading, fontSize: 48, margin: 0 }}>
            Pièce introuvable
          </h1>
          <div style={{ marginTop: 32 }}>
            <Link href={`/palette/${number}`} style={btnPrimary}>← Retour à la palette</Link>
          </div>
        </div>
              </main>
    );
  }

  const culture = entry.culture ? (cultureLabels[entry.culture] || entry.culture) : "";
  const price = PRICE_HINTS[piece.piece] || "—";
  const query = smartQuery(piece.item, color.name);
  const totalBrands = allLinks.length;

  /* ── Genre pour la recherche multi-marchands ──
     Priorité : préférence utilisateur (wada-gender en localStorage,
     positionnée sur /palettes via le segmented control "Pour qui").
     Fallback : genre déduit de la composition de la palette. */
  let userGender: string | null = null;
  if (typeof window !== "undefined") {
    try { userGender = localStorage.getItem("wada-gender"); } catch { /* ignore */ }
  }
  const detectedGender = paletteGender(entry.composition);
  const finalGender =
    userGender && userGender !== "all" ? userGender :
    detectedGender !== "unisexe" ? detectedGender : "";

  /* Query enrichie + URL Google Shopping qui aggrège TOUS les marchands.
     Exemple : "pantalon en lin noir homme" → toutes les boutiques qui
     vendent ce pantalon, classées par prix/pertinence par Google. */
  const enrichedQuery = finalGender ? `${query} ${finalGender}` : query;
  const googleShoppingUrl = `https://www.google.com/search?tbm=shop&q=${enc(enrichedQuery)}`;

  /* Voir un état "favorite" sur le bouton */
  void favorites;

  /* Brief master (24/05) — JSON-LD Product :
     Permet aux moteurs (Google Shopping, etc.) d'indexer chaque pièce de
     palette comme un produit/recommandation. La pièce n'est pas vendue
     par WADA directement (on est affilié), donc on émet un type Product
     avec une liste d'offres si on veut un jour brancher, mais ici on
     reste minimal : nom + image (palette) + brand WADA + URL canonique.
     Schema.org accepte un Product sans prix obligatoire. */
  const productJsonLd = piece && color && entry ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": piece.item,
    "description": `Pièce ${piece.piece.toLowerCase()} en ${color.name.toLowerCase()} de l'accord WADA No. ${entry.number} — ${entry.name}.`,
    "color": color.name,
    "brand": { "@type": "Brand", "name": "WADA" },
    "category": piece.piece,
    "url": `https://www.wada.style/palette/${entry.number}/piece/${pieceIdx}`,
    "image": `https://www.wada.style/palette/${entry.number}/opengraph-image`,
    "isRelatedTo": {
      "@type": "Product",
      "name": entry.name,
      "url": `https://www.wada.style/palette/${entry.number}`,
    },
  } : null;

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
      {productJsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BACK BAR sticky — léger, retour palette
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: paper, borderBottom: `1px solid ${border}`,
        padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <Link href={`/palette/${entry.number}`} style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          textDecoration: "none", color: ink,
          fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.25em", textTransform: "uppercase",
        }}>
          <span aria-hidden style={{ fontSize: 18 }}>←</span>
          <span>Retour à la palette</span>
          <span style={{ color: subtle, fontStyle: "italic", textTransform: "none", letterSpacing: "0.02em", fontFamily: fontHeading, fontSize: 14 }}>
            {entry.name}
          </span>
        </Link>
        <span style={{ ...sectionLabel, color: subtle, fontSize: 9 }}>
          {totalBrands} {totalBrands > 1 ? "marchands" : "marchand"}
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HERO 2-COL — visuel pièce + détail (gardé intact, mojo accent)
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        minHeight: 480, background: paper,
      }} className="wada-piece-hero">
        <div style={{
          background: color.hex,
          position: "relative", overflow: "hidden",
          borderRight: `1px solid ${border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PieceIconBold
            type={iconForItem(piece.item, piece.piece)}
            size={240}
            fillColor="#FFFFFF"
            bgColor={color.hex}
          />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' /></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/></svg>")`,
            mixBlendMode: "overlay", opacity: 0.5,
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", bottom: 28, left: 28,
            display: "flex", height: 20, border: `1px solid rgba(255,255,255,0.6)`,
            borderRadius: 4, overflow: "hidden",
          }}>
            {entry.colors.map((c) => (
              <div key={c.hex} style={{ width: 32, height: 20, background: c.hex }} />
            ))}
          </div>
        </div>

        <div style={{
          padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>
            {pieceLabels[piece.piece] || piece.piece} · No. {entry.number}{culture ? ` · ${culture}` : ""}
          </p>
          <h1 style={{
            fontFamily: fontHeading, fontSize: 56, fontStyle: "italic", fontWeight: 500,
            margin: "0 0 14px", lineHeight: 1.08, letterSpacing: "-0.02em", color: ink,
          }}>
            {piece.item}
          </h1>
          <p style={{
            fontFamily: fontBody, fontSize: 15, color: subtle, fontStyle: "italic",
            margin: "0 0 28px",
          }}>
            Coloris <strong style={{ color: ink, fontStyle: "normal", fontWeight: 600 }}>{color.name}</strong> · {color.hex.toUpperCase()}
          </p>
          <p style={{
            fontFamily: fontLabel, fontSize: 24, fontWeight: 700, color: ink,
            margin: "0 0 32px", letterSpacing: "0.01em",
          }}>
            {price}
            <span style={{
              fontFamily: fontBody, fontSize: 13, color: subtle,
              fontStyle: "italic", letterSpacing: "0.02em", marginLeft: 12, fontWeight: 400,
            }}>
              fourchette indicative
            </span>
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* CTA primaire — Google Shopping pour la pièce avec couleur + genre.
                Agrège toutes les boutiques qui vendent l'article. Plus direct
                que cliquer marque par marque. */}
            <ExternalLink
              href={googleShoppingUrl}
              style={{
                ...btnInk,
                background: mojo,
                display: "inline-flex", alignItems: "center", gap: 10,
              }}
            >
              <span>Trouver chez tous les marchands</span>
              <HandArrow size={22} color="#FFFFFF" />
            </ExternalLink>
            <button
              onClick={() => addToCart({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                piece: piece.piece, item: piece.item,
                colorHex: color.hex, colorName: color.name,
                query, fromEntry: entry.name, addedAt: Date.now(),
              })}
              style={btnInk}
            >
              <span>Ajouter au panier</span>
              <HandArrow size={22} color="#FFFFFF" />
            </button>
          </div>
          {/* Petit indicatif sous les boutons pour expliquer ce qui se passe */}
          <p style={{
            fontFamily: fontBody, fontSize: 12, color: subtle, fontStyle: "italic",
            margin: "14px 0 0", lineHeight: 1.5,
          }}>
            Recherche multi-marchands : « {enrichedQuery} ». Google Shopping liste
            toutes les boutiques qui vendent cet article, triées par prix.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          NOTRE SÉLECTION — 3 marques curées en grand, fond Mojo soft
          ══════════════════════════════════════════════════════════════════ */}
      {curated.length > 0 && (
        <section style={{ background: mojoSoft, padding: "80px 5%" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>Notre sélection</p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 48, fontStyle: "italic", fontWeight: 500,
                margin: "0 0 12px", lineHeight: 1.05, letterSpacing: "-0.02em", color: ink,
              }}>
                Trois marques. Trois budgets.
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                Notre coup de cœur pour chaque tier — testé, lisible, sans détour.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
              {curated.map((link, i) => (
                <CuratedCard
                  key={link.label}
                  link={link}
                  badge={["Petit budget", "Bon compromis", "Investissement"][i] || ""}
                  badgeColor={mojo}
                  accentColor={color.hex}
                  pieceLabel={piece.item}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MONDE — petites marques des cultures du dictionnaire
          Si la palette a une culture (japonaise, africaine…), ses marques
          locales apparaissent en premier, suivies d'un mix mondial.
          ══════════════════════════════════════════════════════════════════ */}
      {worldBrands.length > 0 && (
        <section style={{ background: paper, padding: "80px 5%", borderTop: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>
                Monde · {worldBrands.length} marques locales
              </p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 48, fontStyle: "italic", fontWeight: 500,
                margin: "0 0 12px", lineHeight: 1.05, letterSpacing: "-0.02em", color: ink,
              }}>
                {entry.culture
                  ? <>Petites maisons <span style={{ color: mojo }}>{cultureLabels[entry.culture] || entry.culture}</span> et d'ailleurs.</>
                  : "Petites maisons du monde entier."
                }
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                {entry.culture
                  ? <>Les designers locaux qui réinventent l'esthétique de cette palette, suivis d'un tour du monde de jeunes maisons indépendantes.</>
                  : <>Treize cultures, treize regards sur la mode. Chaque marque est une porte d'entrée vers un savoir-faire local.</>
                }
              </p>
            </div>

            <WorldBrandsGrid brands={worldBrands} priorityCulture={entry.culture} />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TOUS LES MARCHANDS — 3 buckets simplifiés, accordion par défaut
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "80px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
            <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>Tous les marchands</p>
            <h2 style={{
              fontFamily: fontHeading, fontSize: 48, fontStyle: "italic", fontWeight: 500,
              margin: "0 0 12px", lineHeight: 1.05, letterSpacing: "-0.02em", color: ink,
            }}>
              {totalBrands} options pour <span style={{ color: mojo }}>{piece.item.toLowerCase()}</span>.
            </h2>
            <p style={{ fontFamily: fontBody, fontSize: 15, color: textSecondary, margin: 0, fontStyle: "italic" }}>
              Chaque lien atterrit directement sur la recherche du marchand. Pas de détour.
            </p>
          </div>

          {/* Bouton "Filtrer" — révèle les chips style mode */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="wada-lift-sm"
              style={{
                ...btnOutline,
                padding: "10px 20px",
                fontSize: 12,
                background: showFilters ? ink : "transparent",
                color: showFilters ? "#FFFFFF" : ink,
                border: `1px solid ${ink}`,
              }}
            >
              <span aria-hidden style={{ fontSize: 14 }}>{showFilters ? "×" : "⊕"}</span>
              <span>{showFilters ? "Masquer les filtres" : `Filtrer par style (${activeMode === "all" ? "tous" : styleModes.find((m) => m.key === activeMode)?.label})`}</span>
            </button>
          </div>

          {/* Chips de filtres style — masqué par défaut */}
          {showFilters && (
            <div style={{
              display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap",
              marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${border}`,
            }}>
              {styleModes.map((m) => {
                const active = activeMode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setActiveMode(m.key)}
                    title={m.hint}
                    className="wada-lift-sm"
                    style={{
                      padding: "8px 14px",
                      background: active ? ink : paper,
                      color: active ? "#FFFFFF" : ink,
                      border: `1px solid ${active ? ink : border}`,
                      fontFamily: fontLabel, fontSize: 10, fontWeight: 600,
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      cursor: "pointer", borderRadius: 6,
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 12 }}>{m.glyph}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3 BUCKETS — chacun affiche 2 marques + bouton "Voir tous" */}
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {TIER_BUCKETS.map((bucket) => {
              const links = linksByBucket[bucket.id];
              if (!links || links.length === 0) return null;
              const isExpanded = expandedBuckets[bucket.id] || false;
              const visible = isExpanded ? links : links.slice(0, 4);

              return (
                <div key={bucket.id}>
                  <div style={{
                    display: "flex", alignItems: "baseline", gap: 16,
                    marginBottom: 24, paddingBottom: 14, borderBottom: `1px solid ${border}`,
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      width: 10, height: 10, background: mojo,
                      borderRadius: "50%", flexShrink: 0,
                    }} aria-hidden />
                    <h3 style={{
                      fontFamily: fontHeading, fontSize: 32, fontStyle: "italic", fontWeight: 500,
                      margin: 0, color: ink, letterSpacing: "-0.015em",
                    }}>
                      {bucket.label}
                    </h3>
                    <span style={{
                      fontFamily: fontLabel, fontSize: 11, color: subtle,
                      letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 700,
                    }}>
                      {links.length} {links.length > 1 ? "marchands" : "marchand"}
                    </span>
                    <span style={{ flex: 1, minWidth: 12 }} />
                    <span style={{
                      fontFamily: fontBody, fontSize: 14, color: subtle, fontStyle: "italic",
                    }}>
                      {bucket.desc}
                    </span>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 14,
                  }}>
                    {visible.map((link) => <BrandCard key={link.label} link={link} />)}
                  </div>

                  {links.length > 4 && (
                    <div style={{ textAlign: "center", marginTop: 24 }}>
                      <button
                        onClick={() => setExpandedBuckets((s) => ({ ...s, [bucket.id]: !isExpanded }))}
                        className="wada-lift-sm"
                        style={{
                          ...btnOutline,
                          padding: "10px 20px",
                          fontSize: 12,
                          background: "transparent",
                        }}
                      >
                        {isExpanded
                          ? <>← Réduire à 4 marchands</>
                          : <>Voir les {links.length - 4} autres marchands →</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalBrands === 0 && (
            <p style={{
              textAlign: "center", padding: 60,
              fontFamily: fontBody, fontSize: 15, color: subtle, fontStyle: "italic",
            }}>
              Aucun marchand ne correspond. Essayez de retirer le filtre style.
            </p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA RETOUR
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: mojoSoft, padding: "80px 5%", textAlign: "center" }}>
        <p style={{
          fontFamily: fontHeading, fontSize: 28, fontStyle: "italic", fontWeight: 500,
          color: ink, lineHeight: 1.3, margin: "0 auto 24px", maxWidth: 560, letterSpacing: "-0.01em",
        }}>
          Rien ne vous parle ?<br />Retournez voir la palette dans son ensemble.
        </p>
        <Link href={`/palette/${entry.number}`} style={btnPrimary}>
          <span>← Retour à {entry.name}</span>
        </Link>
      </section>

      {cartFlash && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: ink, color: paper, padding: "14px 24px",
          fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.25em",
          textTransform: "uppercase", fontWeight: 600,
          boxShadow: "0 10px 30px rgba(31, 27, 22, 0.25)",
          zIndex: 50, borderRadius: 8,
        }}>
          + Ajouté au panier
        </div>
      )}

          </main>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   COMPOSANTS LOCAUX
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Carte curée — grand format pour "Notre sélection".
 * 3 cards affichées en grille 3-col avec badge tier, prix, et CTA marqué.
 */
function CuratedCard({
  link, badge, badgeColor, accentColor, pieceLabel,
}: {
  link: ShopLink; badge: string; badgeColor: string;
  accentColor: string; pieceLabel: string;
}) {
  const priceLabel = link.priceLevel === "budget" ? "10–60 €" :
                     link.priceLevel === "mid"     ? "40–180 €" :
                     link.priceLevel === "premium" ? "150–450 €" :
                     link.priceLevel === "luxe"    ? "400 €+" : null;
  return (
    <ExternalLink
      href={link.url}
      className="wada-image-card"
      style={{
        display: "flex", flexDirection: "column",
        background: paper,
        border: `1px solid ${border}`,
        borderRadius: cardRadius,
        textDecoration: "none", color: ink,
        overflow: "hidden",
      }}
    >
      {/* Bandeau couleur + badge tier */}
      <div style={{
        height: 140, background: accentColor,
        position: "relative", overflow: "hidden",
      }}>
        <span style={{
          position: "absolute", top: 14, left: 14,
          background: paper, color: ink,
          padding: "5px 11px",
          fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.3em", textTransform: "uppercase",
          borderRadius: 4,
        }}>
          {badge}
        </span>
        <p style={{
          position: "absolute", bottom: 16, left: 16, right: 16,
          fontFamily: fontHeading, fontSize: 14, fontStyle: "italic",
          color: "rgba(255,255,255,0.92)", margin: 0,
          letterSpacing: "-0.005em",
        }}>
          {pieceLabel}
        </p>
      </div>
      {/* Détail */}
      <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ ...sectionLabel, color: badgeColor, margin: 0, fontWeight: 600, fontSize: 9 }}>
          {link.tier}
        </p>
        <h3 style={{
          fontFamily: fontHeading, fontSize: 26, fontStyle: "italic", fontWeight: 500,
          margin: 0, color: ink, letterSpacing: "-0.01em", lineHeight: 1.15,
        }}>
          {link.label}
        </h3>
        <p style={{
          fontFamily: fontBody, fontSize: 14, color: textSecondary, fontStyle: "italic",
          margin: 0, lineHeight: 1.5,
        }}>
          {link.sub}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          {priceLabel && (
            <span style={{
              fontFamily: fontLabel, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.04em", color: ink,
              padding: "4px 10px",
              background: mojoSoft, borderRadius: 4,
            }}>
              {priceLabel}
            </span>
          )}
          {link.eco && (
            <span style={{
              fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.2em", color: "#3B8756",
              padding: "3px 8px", border: `1px solid #3B8756`,
              textTransform: "uppercase", borderRadius: 4,
            }}>
              ♺ Durable
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span aria-hidden style={{ fontSize: 18, color: badgeColor, fontWeight: 600 }}>→</span>
        </div>
      </div>
    </ExternalLink>
  );
}

/**
 * Grille "Monde" — marques groupées par culture, avec la culture prioritaire
 * mise en avant (header dédié) + les autres cultures en grille compacte.
 */
function WorldBrandsGrid({
  brands, priorityCulture,
}: { brands: WorldBrand[]; priorityCulture?: string }) {
  // Si culture prioritaire : sépare ses marques des autres
  const priorityBrands = priorityCulture
    ? brands.filter((b) => b.cultureKey === priorityCulture)
    : [];
  const otherBrands = priorityCulture
    ? brands.filter((b) => b.cultureKey !== priorityCulture)
    : brands;

  // Groupe les autres par culture
  const groupedOthers = useMemo(() => {
    const groups: Record<string, { label: string; brands: WorldBrand[] }> = {};
    for (const b of otherBrands) {
      if (!groups[b.cultureKey]) {
        groups[b.cultureKey] = { label: b.cultureLabel, brands: [] };
      }
      groups[b.cultureKey].brands.push(b);
    }
    return groups;
  }, [otherBrands]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      {/* Culture prioritaire — header + grille riche */}
      {priorityBrands.length > 0 && (
        <div style={{
          background: mojoSoft,
          border: `1px solid ${border}`,
          borderRadius: cardRadius,
          padding: "32px 32px 28px",
        }}>
          <div style={{
            display: "flex", alignItems: "baseline", gap: 14,
            marginBottom: 20, paddingBottom: 12,
            borderBottom: `1px solid ${border}`, flexWrap: "wrap",
          }}>
            <span style={{
              width: 10, height: 10, background: mojo,
              borderRadius: "50%", flexShrink: 0,
            }} aria-hidden />
            <h3 style={{
              fontFamily: fontHeading, fontSize: 28, fontStyle: "italic", fontWeight: 500,
              margin: 0, color: ink, letterSpacing: "-0.015em",
            }}>
              {priorityBrands[0].cultureLabel}
            </h3>
            <span style={{
              fontFamily: fontLabel, fontSize: 11, color: subtle,
              letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 700,
            }}>
              {priorityBrands.length} {priorityBrands.length > 1 ? "marques" : "marque"}
            </span>
            <span style={{ flex: 1, minWidth: 12 }} />
            <span style={{
              fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic",
            }}>
              Culture d'origine de cette palette
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}>
            {priorityBrands.map((b) => <WorldBrandCard key={b.label} brand={b} />)}
          </div>
        </div>
      )}

      {/* Autres cultures — header compact "Et ailleurs" + grille flat */}
      {Object.keys(groupedOthers).length > 0 && (
        <div>
          <div style={{
            display: "flex", alignItems: "baseline", gap: 14,
            marginBottom: 20, paddingBottom: 12,
            borderBottom: `1px solid ${border}`, flexWrap: "wrap",
          }}>
            <span style={{
              width: 10, height: 10, background: ink,
              borderRadius: "50%", flexShrink: 0,
            }} aria-hidden />
            <h3 style={{
              fontFamily: fontHeading, fontSize: 28, fontStyle: "italic", fontWeight: 500,
              margin: 0, color: ink, letterSpacing: "-0.015em",
            }}>
              {priorityCulture ? "Et ailleurs" : "Tour du monde"}
            </h3>
            <span style={{
              fontFamily: fontLabel, fontSize: 11, color: subtle,
              letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 700,
            }}>
              {Object.keys(groupedOthers).length} cultures
            </span>
            <span style={{ flex: 1, minWidth: 12 }} />
            <span style={{
              fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic",
            }}>
              Une porte d'entrée par culture du dictionnaire
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 14,
          }}>
            {Object.values(groupedOthers).flatMap((g) => g.brands)
              .map((b) => <WorldBrandCard key={`${b.cultureKey}-${b.label}`} brand={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/** Carte d'une marque mondiale — montre le pays/culture en évidence. */
function WorldBrandCard({ brand }: { brand: WorldBrand }) {
  return (
    <ExternalLink
      href={brand.url}
      className="wada-lift"
      style={{
        display: "flex", flexDirection: "column", gap: 8,
        padding: "20px 20px 18px",
        background: paper,
        border: `1px solid ${border}`,
        borderRadius: cardRadius,
        textDecoration: "none", color: ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <p style={{ ...sectionLabel, color: mojo, margin: 0, fontWeight: 600, fontSize: 9 }}>
          {brand.cultureLabel}
        </p>
        <span aria-hidden style={{ fontSize: 12, color: mojo }}>↗</span>
      </div>
      <h4 style={{
        fontFamily: fontHeading, fontSize: 20, fontStyle: "italic", fontWeight: 500,
        margin: 0, color: ink, letterSpacing: "-0.01em", lineHeight: 1.15,
      }}>
        {brand.label}
      </h4>
      <p style={{
        fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic",
        margin: 0, lineHeight: 1.5,
      }}>
        {brand.sub}
      </p>
    </ExternalLink>
  );
}

/**
 * Carte marchand compacte — dans les buckets 2/4 marques visibles par défaut.
 */
function BrandCard({ link }: { link: ShopLink }) {
  const priceLabel = link.priceLevel === "budget" ? "10–60 €" :
                     link.priceLevel === "mid"     ? "40–180 €" :
                     link.priceLevel === "premium" ? "150–450 €" :
                     link.priceLevel === "luxe"    ? "400 €+" : null;
  return (
    <ExternalLink
      href={link.url}
      className="wada-lift"
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "18px 20px",
        background: paper,
        border: `1px solid ${border}`,
        borderRadius: cardRadius,
        textDecoration: "none", color: ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <p style={{
          fontFamily: fontLabel, fontSize: 14, fontWeight: 700,
          margin: 0, color: ink, letterSpacing: "0.01em",
        }}>
          {link.label}
        </p>
        <span aria-hidden style={{ fontSize: 12, color: mojo }}>↗</span>
      </div>
      <p style={{
        fontFamily: fontBody, fontSize: 12, color: subtle, fontStyle: "italic",
        margin: 0, lineHeight: 1.4,
      }}>
        {link.sub}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        {priceLabel && (
          <span style={{
            fontFamily: fontLabel, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.04em", color: ink,
          }}>
            {priceLabel}
          </span>
        )}
        {link.eco && (
          <span style={{
            fontFamily: fontLabel, fontSize: 8, fontWeight: 700,
            letterSpacing: "0.2em", color: "#3B8756",
            padding: "1px 6px", border: `1px solid #3B8756`,
            textTransform: "uppercase",
          }}>
            ♺ Durable
          </span>
        )}
      </div>
    </ExternalLink>
  );
}
