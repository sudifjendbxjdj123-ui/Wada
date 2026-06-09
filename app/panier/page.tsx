"use client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { shopOptionsAffiliated, type ShopLink } from "@/lib/data";
import BackButton from "@/components/BackButton";
import ExternalLink from "@/components/ExternalLink";
import { openExternal } from "@/lib/native";
import { formatProductPrice } from "@/lib/priceFormat";

/* Brief audit mobile 2026-05-30 §2+§3 : chaque item du panier a besoin
   d'une vraie image + d'un vrai prix + d'une vraie marque, pas d'un
   swatch couleur générique + d'un hint "~80€". On fetch /api/products
   par slot+color+query pour récupérer le produit MUJI/TBF correspondant. */
type ResolvedProduct = {
  id: string;
  nom: string;
  marque: string;
  marchand?: string;
  marchandSlug?: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
};

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

/** Brief 2026-06-07 (design) — format prix épuré, aligné sur /ma-tenue &
 *  /stylist : masque les décimales « .00 » (80.00 → 80) et garde les
 *  centimes réels avec une virgule FR (248.85 → 248,85). */
function formatPrice(prix: number): string {
  const rounded = Math.round(prix * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(".", ",");
}

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

  /* Bug critique 2026-05-31 : on n'affiche plus de « total estimé » fabriqué
     (auparavant 30/80/180/400 € par tier, inventé). Le vrai prix s'affiche
     par pièce (CartItemCard résout la fiche /api/products) et sur le site du
     marchand. Pas de chiffre inventé au niveau du panier. */
  const isEmpty = mounted && cart.length === 0;

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
                <CartItemCard
                  key={item.id}
                  item={item}
                  fallback={best}
                  onRemove={() => removeItem(item.id)}
                />
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
                  {cart.length} {cart.length > 1 ? "pièces" : "pièce"}. Le prix réel s'affiche sur
                  chaque pièce et sur le site du marchand. Les liens partenaires sont trackés
                  (affiliation, sans surcoût pour vous).
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

/* ───────────────────────────────────────────────────────────────────
   CartItemCard — résout le vrai produit depuis /api/products à partir
   de la query+slot stockés dans le panier, affiche image + marque +
   prix RÉELS au lieu du swatch couleur + hint générique "~80€".
   Brief audit mobile 2026-05-30 §2 + §3.
   ─────────────────────────────────────────────────────────────────── */
function CartItemCard({ item, fallback, onRemove }: {
  item: CartItem;
  fallback?: ShopLink;
  onRemove: () => void;
}) {
  const [resolved, setResolved] = useState<ResolvedProduct | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ slot: item.piece.toLowerCase(), limit: "1" });
    if (item.colorHex) params.set("color", item.colorHex);
    if (item.query) params.set("q", item.query);
    fetch(`/api/products?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        setLoaded(true);
        const p = data?.products?.[0];
        if (!p) return;
        const sourceUrl = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";
        setResolved({
          id: p.id,
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          marchand: p.marchand,
          marchandSlug: p.marchandSlug,
          image: sourceUrl,
          prix: p.prix,
          devise: p.devise || "EUR",
          url: p.urlProduit,
        });
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, [item.piece, item.colorHex, item.query]);

  const buyUrl = resolved?.url || fallback?.url;
  const buyLabel = resolved
    ? `Acheter sur ${resolved.marchand || resolved.marque} →`
    : fallback
      ? `Acheter chez ${(fallback.label || "Marchand").replace(/^Amazon\s*[·•:-]\s*/i, "")} →`
      : null;

  return (
    <article
      style={{
        display: "flex", gap: 14, alignItems: "center",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        boxShadow: SOFT,
        flexWrap: "wrap",
      }}
    >
      {/* Image carrée 80×80 (ou swatch couleur en fallback) */}
      <div
        aria-hidden
        style={{
          width: 80, height: 80, borderRadius: 12,
          flexShrink: 0, overflow: "hidden",
          background: resolved?.image
            ? "#FBF9F5"
            : item.colorHex,
          border: `1px solid ${palette.line}`,
          position: "relative",
        }}
      >
        {resolved?.image ? (
          <img
            src={resolved.image}
            alt={resolved.nom}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
          />
        ) : !loaded ? (
          /* Skeleton pendant le fetch */
          <span style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(110deg, rgba(0,0,0,0) 30%, rgba(255,255,255,.5) 50%, rgba(0,0,0,0) 70%)",
            animation: "wada-skel-shimmer 1.4s linear infinite",
          }} />
        ) : null}
      </div>

      {/* Info — vraie marque, vrai prix */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <p style={{
          fontSize: 10, letterSpacing: "0.12em",
          textTransform: "uppercase", color: palette.olive,
          margin: 0, fontWeight: 600,
        }}>
          {PIECE_LABELS[item.piece] || item.piece}
        </p>
        <p style={{
          fontFamily: fonts.display, fontWeight: 600,
          fontSize: 16, margin: "3px 0", color: palette.ink,
          lineHeight: 1.25,
        }}>
          {resolved?.nom || item.item}
        </p>
        <p style={{ fontSize: 12, color: palette.inkSoft, margin: 0 }}>
          {resolved ? (
            <>
              <strong style={{ color: palette.ink, fontWeight: 600 }}>{resolved.marque}</strong>
              {" · "}
              <span style={{ color: palette.bordeaux, fontWeight: 600 }}>
                {typeof resolved.prix === "number" ? formatProductPrice(resolved.prix, resolved.marchandSlug, resolved.devise) : "—"}
              </span>
            </>
          ) : !loaded ? "Recherche du produit…" : `No. ${item.fromEntry}`}
        </p>
      </div>

      {/* Buy button + Remove — zones tactiles 44×44 min (audit §12) */}
      {buyUrl && buyLabel && (
        <ExternalLink
          href={buyUrl}
          style={{
            fontFamily: fonts.sans, fontSize: 13, fontWeight: 600,
            padding: "12px 18px",
            minHeight: 44,
            borderRadius: 999,
            background: palette.bordeaux, color: palette.cream,
            textDecoration: "none", whiteSpace: "nowrap",
            display: "inline-flex", alignItems: "center",
          }}
        >
          {buyLabel}
        </ExternalLink>
      )}
      <button
        onClick={onRemove}
        aria-label="Retirer du panier"
        title="Retirer"
        style={{
          background: "none", border: "none",
          color: palette.inkSoft, cursor: "pointer",
          fontSize: 20, lineHeight: 1,
          width: 44, height: 44,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>
    </article>
  );
}
