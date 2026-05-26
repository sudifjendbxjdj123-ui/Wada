"use client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { shopOptionsAffiliated, type ShopLink } from "@/lib/data";
import BackButton from "@/components/BackButton";
import ExternalLink from "@/components/ExternalLink";
import { openExternal } from "@/lib/native";

/* ──────────────────────────────────────────────────────────────────────
   /panier — Refonte 2026-05-22 (maquette brief).
   Vue simple « ce que vous avez retenu » avec 1 bouton d'achat par item.
   Préserve : lecture cart depuis localStorage, retrait item, ouverture
   externe via openExternal() (cookies Awin/Amazon préservés app native).
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};
const SOFT = "0 8px 36px rgba(30,30,30,.06)";

type CartItem = {
  id: string;
  piece: string;
  item: string;
  colorName: string;
  colorHex: string;
  query: string;
  fromEntry: string;
  addedAt: number;
};

// Indicatif de prix par tier marchand. Source unique pour l'affichage.
const PRICE_HINT: Record<string, string> = {
  budget: "~30 €",
  mid: "~80 €",
  premium: "~180 €",
  luxe: "~400 €+",
};

// Labels FR pour les pièces.
const PIECE_LABELS: Record<string, string> = {
  Top: "Haut", haut: "Haut",
  Bottom: "Bas", bas: "Bas",
  Outer: "Veste", veste: "Veste",
  Shoes: "Chaussures", chaussures: "Chaussures",
  Accent: "Accent", accent: "Accent",
};

export default function PanierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("wada-cart") || "[]";
      setCart(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const removeItem = (id: string) => {
    const next = cart.filter((c) => c.id !== id);
    setCart(next);
    try {
      localStorage.setItem("wada-cart", JSON.stringify(next));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  // Pour chaque item, on prend la 1ʳᵉ offre marchande dispo (déjà rankée
  // dans data.ts). Si rien : recherche Google fallback transparente.
  const offers = useMemo(
    () =>
      cart.map((c) => {
        const opts = shopOptionsAffiliated(c.query, c.piece);
        const best: ShopLink | undefined = opts[0];
        return { item: c, best };
      }),
    [cart]
  );

  // Ouvre tous les marchands en série (1 onglet par item).
  const openAll = () => {
    offers.forEach(({ best }) => {
      if (best) void openExternal(best.url);
    });
  };

  const totalHint = useMemo(() => {
    let total = 0;
    for (const { best } of offers) {
      const tier = best?.priceLevel || "mid";
      const guess = tier === "budget" ? 30 : tier === "mid" ? 80 : tier === "premium" ? 180 : 400;
      total += guess;
    }
    return total;
  }, [offers]);

  const isEmpty = mounted && cart.length === 0;
  const distinctBrands = mounted ? new Set(offers.map((o) => o.best?.label).filter(Boolean)).size : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.beige,
        color: palette.ink,
        fontFamily: fonts.sans,
        lineHeight: 1.6,
      }}
    >
            <BackButton />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* HEAD */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: palette.bordeaux,
            fontWeight: 500,
            margin: 0,
          }}
        >
          Votre sélection
        </p>
        <h1
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: "clamp(32px, 6vw, 40px)",
            lineHeight: 1.04,
            margin: "10px 0 4px",
            color: palette.ink,
          }}
        >
          Panier
        </h1>
        <p style={{ color: palette.inkSoft, margin: 0 }}>
          Les pièces que vous avez retenues, prêtes à acheter chez leurs marques.
        </p>

        {/* Brief audit (25/05) — loader skeleton avant l'hydratation
            localStorage. Évite le flash « panier vide » pendant que le
            client lit le storage (1 frame, mais visible). */}
        {!mounted && (
          <div style={{ marginTop: 36 }}>
            <div className="wada-skeleton" style={{ height: 96, borderRadius: 14, marginBottom: 12 }} />
            <div className="wada-skeleton" style={{ height: 96, borderRadius: 14, marginBottom: 12 }} />
            <div className="wada-skeleton" style={{ height: 96, borderRadius: 14 }} />
          </div>
        )}

        {!isEmpty && mounted && (
          <div
            style={{
              background: "#EDE6DA",
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              padding: "14px 18px",
              fontSize: 13,
              color: palette.inkSoft,
              margin: "20px 0",
            }}
          >
            WADA ne vend rien directement : chaque pièce s'achète sur le site de sa marque, au
            prix affiché.
          </div>
        )}

        {/* ITEMS LIST */}
        {!isEmpty && (
          <>
            <div>
              {offers.map(({ item, best }) => (
                <article
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    background: palette.cream,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 12,
                    boxShadow: SOFT,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Color swatch */}
                  <div
                    aria-hidden
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: item.colorHex,
                      border: `1px solid ${palette.line}`,
                    }}
                  />
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: palette.olive,
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      {PIECE_LABELS[item.piece] || item.piece}
                    </p>
                    <p
                      style={{
                        fontFamily: fonts.display,
                        fontWeight: 700,
                        fontSize: 17,
                        margin: "2px 0",
                        color: palette.ink,
                        lineHeight: 1.2,
                      }}
                    >
                      {item.item}
                    </p>
                    <p style={{ fontSize: 12, color: palette.inkSoft, margin: 0 }}>
                      No. {item.fromEntry}
                      {best ? ` · ${best.label}` : ""}
                      {best?.priceLevel ? ` · ${PRICE_HINT[best.priceLevel] || ""}` : ""}
                    </p>
                  </div>
                  {/* Buy button */}
                  {best && (
                    <ExternalLink
                      href={best.url}
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 13,
                        padding: "11px 18px",
                        borderRadius: 999,
                        background: palette.ink,
                        color: palette.cream,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      Acheter chez {best.label.replace(/^Amazon\s*[·•:-]\s*/i, "")} →
                    </ExternalLink>
                  )}
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Retirer du panier"
                    title="Retirer"
                    style={{
                      background: "none",
                      border: "none",
                      color: palette.inkSoft,
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 8,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            {/* SUMMARY */}
            <div
              style={{
                background: palette.cream,
                border: `1px solid ${palette.line}`,
                borderRadius: 16,
                padding: "20px 22px",
                marginTop: 20,
                boxShadow: SOFT,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 13, color: palette.inkSoft, maxWidth: "46ch", margin: 0 }}>
                  {cart.length} {cart.length > 1 ? "pièces" : "pièce"} · ~{totalHint} € au total chez{" "}
                  {distinctBrands} {distinctBrands > 1 ? "marques" : "marque"}. Les achats se font
                  sur chaque site marchand ; les liens sont trackés (affiliation, sans surcoût pour
                  vous).
                </p>
                <button
                  onClick={openAll}
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    padding: "14px 24px",
                    borderRadius: 999,
                    background: palette.bordeaux,
                    color: palette.cream,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Ouvrir tous les marchands →
                </button>
              </div>
            </div>
          </>
        )}

        {/* EMPTY STATE */}
        {isEmpty && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 34, color: palette.olive }}>✦</div>
            <h2
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: 24,
                margin: "12px 0 6px",
              }}
            >
              Votre panier est vide
            </h2>
            <p
              style={{
                color: palette.inkSoft,
                maxWidth: "42ch",
                margin: "0 auto 20px",
              }}
            >
              Composez une tenue ou scannez une couleur, puis ajoutez les pièces qui vous plaisent.
            </p>
            <Link
              href="/palettes"
              style={{
                display: "inline-block",
                fontFamily: fonts.sans,
                fontSize: 14,
                padding: "14px 24px",
                borderRadius: 999,
                background: palette.bordeaux,
                color: palette.cream,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Composer une tenue
            </Link>
          </div>
        )}
      </div>

          </main>
  );
}
