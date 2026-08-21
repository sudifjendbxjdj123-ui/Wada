"use client";
/**
 * OutfitSlotCard — Carte unique pour une pièce de la tenue.
 * Remplace PieceCard avec sizing adapté (small pour Accent, large pour autres).
 */

import { useEffect, useState } from "react";
import { formatProductPrice } from "@/lib/priceFormat";
import type { OutfitPiece } from "@/lib/composer/microTypes";

interface MujiProduct {
  nom: string;
  marque: string;
  marchand?: string;
  marchandSlug?: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
}

interface OutfitSlotCardProps {
  piece: OutfitPiece;
  size?: "small" | "large";
  genre?: string | null;
  style?: string | null;
  loading?: boolean;
}

const BORDEAUX = "#6B3A32";
const CREAM = "#FAF8F4";
const LINE = "rgba(30,30,30,.10)";

/* Hook produits du slot. C'est LUI que la tenue du Styliste utilise —
   StylistPageContent héberge une PieceCard homonyme jamais rendue, dans
   laquelle deux campagnes de corrections (budget « moins de 80 € », puis
   tailles/matière) ont été câblées pour rien. Mesuré : la requête réseau
   du slot cargo partait sans maxPrice ni taille. D'où les règles ici :
   - budgetMax lu dans la phrase → maxPrice ;
   - taille/pointure → filtre API sur les tailles connues ;
   - matière ajoutée au q, avec REPLI sans elle si le résultat est vide
     (q exige TOUS les mots — mieux vaut une chemise sans lin qu'aucune) ;
   - limit > 1 pour la pièce NOMMÉE : « voici DES pantalons cargo ». */
function useProduitsForSlot(
  slot: string | null,
  colorHex: string | null,
  style: string | null,
  genre: string | null,
  typeKeyword?: string | null,
  budgetMax?: number | null,
  matiere?: string | null,
  taille?: string | null,
  limit: number = 1,
): MujiProduct[] {
  const [products, setProducts] = useState<MujiProduct[]>([]);

  useEffect(() => {
    if (!slot || !colorHex) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    const params = new URLSearchParams({
      slot,
      color: colorHex,
      limit: String(limit),
    });

    if (style) params.set("style", style);
    if (genre) params.set("genre", genre.toLowerCase());
    if (typeof budgetMax === "number" && budgetMax > 0) params.set("maxPrice", String(Math.round(budgetMax)));
    if (taille) params.set("taille", taille);

    /* Candidats de recherche, du plus précis au plus large. */
    const qs: Array<string | null> = [];
    if (typeKeyword && matiere) qs.push(`${typeKeyword} ${matiere}`);
    if (typeKeyword) qs.push(typeKeyword);
    if (qs.length === 0) qs.push(null);

    /* Timeout 8s global pour éviter les fetches qui traînent. */
    const timeoutId = setTimeout(() => { cancelled = true; }, 8000);

    (async () => {
      for (const qCandidat of qs) {
        if (cancelled) return;
        const essai = new URLSearchParams(params);
        if (qCandidat) essai.set("q", qCandidat);
        try {
          const r = await fetch(`/api/products?${essai}`);
          if (!r.ok) continue;
          const data = await r.json();
          if (cancelled) return;
          if (!data?.products?.length) continue;
          setProducts(data.products.map((p: {
            nom: string; marque?: string; marchand?: string; marchandSlug?: string;
            imageLocal?: string; largeImage?: string; image?: string;
            prix: number; devise: string; urlProduit: string;
          }) => ({
            nom: p.nom,
            marque: p.marque || p.marchand || "MUJI",
            marchand: p.marchand,
            marchandSlug: p.marchandSlug,
            image: p.imageLocal
              ? p.imageLocal
              : p.largeImage
                ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
                : p.image
                  ? `/api/img?u=${encodeURIComponent(p.image)}`
                  : "",
            prix: p.prix,
            devise: p.devise,
            url: p.urlProduit,
          })));
          return;
        } catch { /* réseau : candidat suivant */ }
      }
    })().finally(() => clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [slot, colorHex, style, genre, typeKeyword, budgetMax, matiere, taille, limit]);

  return products;
}

export function OutfitSlotCard({
  piece,
  size = "large",
  genre,
  style,
  loading: outerLoading = false,
}: OutfitSlotCardProps) {
  // Si c'est une pièce ancre (déjà possédée), pas de fetch MUJI
  const produits = useProduitsForSlot(
    piece.ancre ? null : piece.role.toLowerCase(),
    piece.ancre ? null : piece.hex,
    style ?? null,
    genre ?? null,
    piece.typeKeyword,
    piece.budgetMax ?? null,
    piece.matiere ?? null,
    piece.taille ?? null,
    /* La pièce NOMMÉE par le client reçoit un choix, les slots
       d'accompagnement gardent une proposition unique : c'est la pièce
       demandée qu'on est venu voir, pas la ceinture. */
    piece.demandee ? 4 : 1,
  );
  const mujiProduct = produits[0] ?? null;
  const alternatives = piece.demandee ? produits.slice(1, 4) : [];

  const badgeIcon = piece.ancre ? "📌" : "✨";
  const minHeight = size === "small" ? 220 : 380;

  return (
    <div
      style={{
        background: CREAM,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(30,30,30,.1)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      {/* BADGE */}
      <div
        style={{
          background: piece.ancre ? "rgba(107, 58, 50, 0.12)" : "rgba(168, 178, 154, 0.12)",
          padding: "8px 12px",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          display: "flex",
          gap: 6,
          alignItems: "center",
          color: piece.ancre ? BORDEAUX : "#5a5a5a",
          fontFamily: "'Inter'",
        }}
      >
        <span>{badgeIcon}</span>
        <span>{piece.role}</span>
      </div>

      {/* IMAGE CONTAINER */}
      <div
        style={{
          aspectRatio: "4 / 5",
          background: `linear-gradient(to bottom, #fff 0%, ${piece.hex}20 100%)`,
          overflow: "hidden",
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 8,
        }}
      >
        {mujiProduct?.image ? (
          <img
            src={mujiProduct.image}
            alt={mujiProduct.nom}
            loading="lazy"
            decoding="async"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : outerLoading ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(90deg, ${CREAM} 0%, rgba(255,255,255,0.5) 50%, ${CREAM} 100%)`,
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }}
          />
        ) : piece.ancre ? (
          <span style={{ fontSize: 12, color: "#999", fontFamily: "'Inter'" }}>Votre pièce</span>
        ) : (
          <span style={{ fontSize: 12, color: "#ccc", fontFamily: "'Inter'" }}>◻</span>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* NOM PIÈCE */}
        <p
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 1.2,
            color: "#1a1a1a",
            margin: "0 0 8px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {mujiProduct?.nom || piece.type}
        </p>

        {/* MUJI PRODUCT ou FALLBACK */}
        {mujiProduct ? (
          <div
            style={{
              marginTop: "auto",
              background: "rgba(255,255,255,0.7)",
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px 0", fontFamily: "'Inter'" }}>
              {mujiProduct.marque}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: BORDEAUX, margin: "0 0 8px 0", fontFamily: "'Inter'" }}>
              {formatProductPrice(mujiProduct.prix, mujiProduct.marchandSlug, mujiProduct.devise)}
            </p>
            {piece.taille && (
              /* La taille énoncée par le client. Les produits dont la liste
                 de tailles connue l'exclut sont déjà filtrés côté API ; pour
                 ceux qui n'en déclarent pas, on reste honnête : elle se
                 choisit chez le marchand. */
              <span style={{
                display: "inline-block", margin: "0 0 8px", padding: "3px 9px",
                borderRadius: 999, background: "rgba(107,58,50,0.08)",
                fontSize: 11, color: BORDEAUX, fontWeight: 600, fontFamily: "'Inter'",
              }}>
                {piece.role === "Chaussures" ? `Pointure ${piece.taille}` : `Taille ${piece.taille}`} · à confirmer chez le marchand
              </span>
            )}
            <a
              href={mujiProduct.url}
              target="_blank"
              rel="noopener sponsored"
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                background: "#1a1a1a",
                color: CREAM,
                border: "none",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                textAlign: "center",
                fontFamily: "'Inter'",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#0a0a0a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
              }}
            >
              Acheter sur {mujiProduct.marchand || "MUJI"} →
            </a>
          </div>
        ) : !piece.ancre ? (
          <p
            style={{
              fontSize: 11.5,
              color: "#8a7a68",
              fontStyle: "italic",
              margin: 0,
              lineHeight: 1.45,
              fontFamily: "'Inter'",
            }}
          >
            En cours de recherche chez nos partenaires…
          </p>
        ) : null}

        {/* « Voici DES pantalons cargo » (brief client 2026-08-22) : pour la
            pièce que le client a NOMMÉE, d'autres options du catalogue sous
            la proposition principale. Un styliste à qui on demande un cargo
            n'en sort pas un seul du portant. */}
        {alternatives.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{
              fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase",
              margin: "0 0 6px", fontWeight: 700, color: "#7A8B6A", fontFamily: "'Inter'",
            }}>
              D&apos;autres options
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {alternatives.map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noopener sponsored"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: 6, borderRadius: 10,
                    border: `1px solid ${LINE}`,
                    background: "rgba(255,255,255,0.7)",
                    textDecoration: "none", color: "inherit", minWidth: 0,
                  }}>
                  <span aria-hidden style={{
                    width: 38, height: 46, borderRadius: 7, overflow: "hidden",
                    background: "#F2EFE9", flexShrink: 0,
                  }}>
                    {a.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image} alt="" loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    )}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{
                      display: "block", fontSize: 11, fontWeight: 700, color: "#1a1a1a",
                      fontFamily: "'Inter'",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {a.marque}
                    </span>
                    <span style={{
                      display: "block", fontSize: 10.5, color: "#8a7a68", lineHeight: 1.25,
                      fontFamily: "'Inter'",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {a.nom}
                    </span>
                  </span>
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, color: BORDEAUX, flexShrink: 0,
                    fontFamily: "'Inter'",
                  }}>
                    {formatProductPrice(a.prix, a.marchandSlug, a.devise)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
