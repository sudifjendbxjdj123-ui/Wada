"use client";
import { useEffect, useRef, useState } from "react";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * SimilairesTenue — « Vous pourriez aussi aimer » (refonte 2026-08-23, §12).
 *
 * Carrousel de pièces du catalogue accordées à la MÊME palette que la tenue —
 * le seul critère de similarité que WADA peut affirmer. Les pièces déjà dans
 * la tenue sont écartées. Chargé paresseusement, comme les variantes.
 */

type Produit = {
  id?: string; nom: string; marque?: string; marchand?: string;
  marchandSlug?: string; prix?: number; devise?: string; urlProduit?: string;
  image?: string; imageLocal?: string; largeImage?: string;
};

export default function SimilairesTenue({
  palette,
  genre,
  excludeIds,
}: {
  palette: string;
  genre: string | null;
  excludeIds: string[];
}) {
  const conteneur = useRef<HTMLDivElement>(null);
  const lance = useRef(false);
  const [produits, setProduits] = useState<Produit[] | null>(null);

  /* `excludeIds` est un tableau recréé à chaque rendu du parent : en
     dépendance d'effet il recréerait l'observateur en continu (même piège
     que VariantesTenue, mesuré là-bas). Lu via une ref au moment du tir. */
  const propsRef = useRef({ palette, genre, excludeIds });
  propsRef.current = { palette, genre, excludeIds };

  useEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const obs = new IntersectionObserver((entrees) => {
      if (!entrees.some((e) => e.isIntersecting) || lance.current) return;
      lance.current = true;
      obs.disconnect();
      const { palette, genre, excludeIds } = propsRef.current;
      const sp = new URLSearchParams({
        palette, limit: "10", seed: `${palette}-similaires`,
      });
      if (genre) sp.set("genre", genre.toLowerCase());
      if (excludeIds.length) sp.set("excludeIds", excludeIds.join(","));
      fetch(`/api/products?${sp}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setProduits(
          ((d?.products ?? []) as Produit[])
            .filter((p) => p.urlProduit && (p.image || p.largeImage || p.imageLocal)),
        ))
        .catch(() => setProduits([]));
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (produits !== null && produits.length === 0) return null;

  return (
    <div ref={conteneur} style={{ maxWidth: 980, margin: "0 auto" }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: ink, fontWeight: 600,
        margin: "0 0 10px",
      }}>
        Vous pourriez aussi aimer
      </p>
      <div className="wada-tabs-scroll" style={{
        display: "flex", gap: 10, overflowX: "auto",
        WebkitOverflowScrolling: "touch", scrollSnapType: "x proximity",
        margin: "0 -5%", padding: "0 5% 2px",
      }}>
        {(produits ?? Array.from({ length: 4 }, () => null)).map((p, i) => (
          p ? (
            <a key={p.id ?? i} href={p.urlProduit} target="_blank" rel="noopener noreferrer sponsored"
              style={{
                flex: "0 0 auto", width: 150, scrollSnapAlign: "start",
                background: "#FFFDFA", border: `1px solid ${border}`, borderRadius: 14,
                overflow: "hidden", textDecoration: "none", color: "inherit",
                display: "flex", flexDirection: "column",
              }}>
              <span style={{ display: "block", aspectRatio: "3 / 4", background: "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageLocal || p.largeImage || p.image || ""} alt={p.nom}
                  loading="lazy" decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
              </span>
              <span style={{ padding: "8px 10px 11px", display: "flex", flexDirection: "column", gap: 2 }}>
                {(p.marque || p.marchand) && (
                  <span style={{
                    fontFamily: fontLabel, fontSize: 10, letterSpacing: ".06em",
                    textTransform: "uppercase", color: ink, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.marque || p.marchand}
                  </span>
                )}
                <span style={{
                  fontFamily: fontBody, fontSize: 11.5, color: textSecondary, lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden", minHeight: "2.6em",
                }}>
                  {p.nom}
                </span>
                {typeof p.prix === "number" && (
                  <span style={{ fontFamily: fontLabel, fontSize: 12.5, color: ink, fontWeight: 600 }}>
                    {formatProductPrice(p.prix, p.marchandSlug ?? null, p.devise)}
                  </span>
                )}
              </span>
            </a>
          ) : (
            <span key={i} aria-hidden className="wada-skeleton" style={{
              flex: "0 0 auto", width: 150, height: 240, borderRadius: 14,
              background: "rgba(30,30,30,.05)",
            }} />
          )
        ))}
      </div>
    </div>
  );
}
