"use client";
import { useEffect, useMemo, useState } from "react";
import type { DictionaryEntry } from "@/lib/data";
import { getDisplayImageUrl } from "@/lib/image-utils";
import { formatProductPrice } from "@/lib/priceFormat";
import { deltaEHex } from "@/lib/colorDistance";
import { useLiked } from "@/hooks/useLiked";
import {
  ink, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * CataloguePalette — un vrai catalogue produits, façon Zalando / BSTN.
 *
 * Remplace le bloc « À découvrir » (BrandShowcaseCompact). Retour client
 * 2026-08-22 : « je remplacerais complètement À découvrir par un vrai
 * catalogue produits, comme un e-commerce mode ».
 *
 * Trois décisions de mise en page viennent directement du brief :
 *
 *  1. DEUX colonnes sur téléphone, pas trois. « Tes trois colonnes actuelles
 *     rendent les produits trop petits. Sur Zalando/BSTN, la photo produit
 *     doit vendre le produit. »
 *  2. PAS de grand cadre autour de la grille. Les cartes sont posées
 *     directement sur le fond crème — « ça donnera immédiatement une
 *     sensation plus premium et plus proche d'une vraie boutique ».
 *  3. La correspondance de palette se dit par une PASTILLE discrète sous le
 *     prix, pas par un badge « WADA MATCH » sur chaque carte : « pour ne pas
 *     rendre le catalogue trop IA ».
 *
 * Ce que WADA garde en propre : quand une palette est active, le catalogue
 * est demandé filtré sur elle, et chaque carte dit LAQUELLE de ses teintes
 * elle porte.
 */

type Produit = {
  id?: string;
  nom: string;
  marque?: string;
  marchand?: string;
  image?: string;
  largeImage?: string;
  imageLocal?: string;
  prix?: number;
  devise?: string;
  urlProduit?: string;
  couleurNom?: string;
  hex?: string;
};

/* Au-delà, dire « ce produit porte cette teinte » serait faux. 15 est le
   seuil « match acceptable » de lib/colorDistance ; on s'y tient plutôt que
   d'afficher une pastille sur tout ce qui passe. */
const DELTA_E_PASTILLE = 15;

function IconeCoeur({ plein }: { plein: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden
      fill={plein ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4l1.4 1.4L12 22l7.4-7.6 1.4-1.4a5.2 5.2 0 0 0 0-7.4Z" />
    </svg>
  );
}

/** Teinte de la palette que ce produit porte réellement, ou null. */
function teintePalette(
  hexProduit: string | undefined,
  couleurs: Array<{ hex: string; name: string }>,
): { hex: string; name: string } | null {
  if (!hexProduit || couleurs.length === 0) return null;
  let meilleure: { hex: string; name: string } | null = null;
  let meilleurEcart = Infinity;
  for (const c of couleurs) {
    try {
      const d = deltaEHex(hexProduit, c.hex);
      if (d < meilleurEcart) { meilleurEcart = d; meilleure = c; }
    } catch { /* hex illisible : on ignore cette teinte */ }
  }
  return meilleurEcart <= DELTA_E_PASTILLE ? meilleure : null;
}

function CarteProduit({
  produit, couleurs,
}: {
  produit: Produit;
  couleurs: Array<{ hex: string; name: string }>;
}) {
  const id = produit.id || produit.urlProduit || produit.nom;
  /* useLiked rend un tuple [valeur, setter], pas un objet. */
  const [liked, setLiked] = useLiked(id);
  const image = getDisplayImageUrl(produit.image, produit.largeImage);
  const teinte = useMemo(() => teintePalette(produit.hex, couleurs), [produit.hex, couleurs]);
  const marque = (produit.marque || produit.marchand || "").trim();

  return (
    <article style={{ position: "relative", minWidth: 0 }}>
      {/* Lien marchand externe : <a rel="sponsored">, pas next/link — la
          destination est hors du site et le lien est affilié. */}
      <a
        href={produit.urlProduit || "#"}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        <span style={{
          display: "block", position: "relative",
          aspectRatio: "3 / 4", borderRadius: 12, overflow: "hidden",
          background: "#F2EEE7",
        }}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image} alt={produit.nom} loading="lazy" decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </span>

        {marque && (
          <span style={{
            display: "block", marginTop: 9,
            fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".08em",
            textTransform: "uppercase", color: ink, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {marque}
          </span>
        )}
        <span style={{
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
          /* `ink` et non `seal` : ce dernier vaut #1B4A6B, un BLEU. Les noms
             de produits sortaient donc en bleu, comme des liens, au milieu
             d'une grille où tout est déjà cliquable. */
          marginTop: 2, fontFamily: fontBody, fontSize: 13, color: ink,
          lineHeight: 1.32,
        }}>
          {produit.nom}
        </span>
        {produit.couleurNom && (
          <span style={{
            display: "block", marginTop: 2,
            fontFamily: fontBody, fontSize: 12, color: textSecondary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            textTransform: "capitalize",
          }}>
            {produit.couleurNom}
          </span>
        )}
        {typeof produit.prix === "number" && (
          <span style={{
            display: "block", marginTop: 4,
            fontFamily: fontLabel, fontSize: 13.5, color: ink,
          }}>
            {formatProductPrice(produit.prix, produit.devise || "EUR")}
          </span>
        )}
        {teinte && (
          <span style={{
            display: "flex", alignItems: "center", gap: 5, marginTop: 5,
            fontFamily: fontBody, fontSize: 11.5, color: textSecondary,
            overflow: "hidden", whiteSpace: "nowrap",
          }}>
            <span aria-hidden style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: teinte.hex, border: `1px solid ${border}`,
            }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{teinte.name}</span>
          </span>
        )}
      </a>

      {/* Le cœur est HORS du lien : imbriquer un bouton dans un <a> est
          invalide, et le clic partait chez le marchand au lieu de liker. */}
      <button
        type="button"
        onClick={() => setLiked(!liked)}
        aria-pressed={liked}
        aria-label={liked ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
        style={{
          position: "absolute", top: 8, right: 8,
          width: 32, height: 32, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: "rgba(255,255,255,.88)",
          color: liked ? mojo : "rgba(30,30,30,.55)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px -4px rgba(30,30,30,.4)",
        }}
      >
        <IconeCoeur plein={liked} />
      </button>
    </article>
  );
}

export default function CataloguePalette({
  palette,
  genre,
  limit = 24,
}: {
  /** Palette active — filtre le catalogue et alimente les pastilles. */
  palette?: DictionaryEntry | null;
  genre?: string | null;
  limit?: number;
}) {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [etat, setEtat] = useState<"charge" | "pret" | "vide">("charge");

  const couleurs = useMemo(() => palette?.colors ?? [], [palette]);

  useEffect(() => {
    const ac = new AbortController();
    setEtat("charge");
    (async () => {
      try {
        const sp = new URLSearchParams({ limit: String(limit) });
        if (palette?.number) sp.set("palette", palette.number);
        if (genre) sp.set("genre", genre.toLowerCase());
        const r = await fetch(`/api/products?${sp}`, { signal: ac.signal });
        if (!r.ok) { setEtat("vide"); return; }
        const d = await r.json();
        /* On n'affiche que des produits réellement achetables : une image ET
           un lien marchand. Une vignette inerte dans un catalogue donne
           l'impression d'un site cassé. */
        const liste: Produit[] = (d.products ?? []).filter(
          (p: Produit) =>
            (p.image || p.largeImage || p.imageLocal) &&
            typeof p.urlProduit === "string" && /^https?:\/\//.test(p.urlProduit),
        );
        setProduits(liste);
        setTotal(typeof d.total === "number" ? d.total : liste.length);
        setEtat(liste.length ? "pret" : "vide");
      } catch {
        /* Abort au démontage, ou réseau : on ne casse pas la page. */
      }
    })();
    return () => ac.abort();
  }, [palette?.number, genre, limit]);

  if (etat === "vide") return null;

  return (
    <section style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        gap: 12, margin: "0 0 12px",
      }}>
        <h2 style={{
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
          textTransform: "uppercase", color: ink, fontWeight: 600, margin: 0,
        }}>
          {palette ? "Pièces pour cette palette" : "Pièces sélectionnées"}
        </h2>
        {total !== null && total > 0 && (
          <span style={{ fontFamily: fontBody, fontSize: 13, color: textSecondary, whiteSpace: "nowrap" }}>
            {total} article{total > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {etat === "charge" ? (
        /* Squelettes aux mêmes proportions que les cartes : sans eux la page
           sautait d'un bloc vide à une grille pleine. */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} aria-hidden style={{
              display: "block", aspectRatio: "3 / 4", borderRadius: 12,
              background: "rgba(30,30,30,.05)",
            }} />
          ))}
        </div>
      ) : (
        /* minmax(150px) : deux colonnes sur un téléphone de 393 px (le brief
           demande deux, pas trois), et davantage dès que l'écran s'élargit —
           sans point de rupture à maintenir. */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 14,
        }}>
          {produits.map((p, i) => (
            <CarteProduit key={p.id || p.urlProduit || i} produit={p} couleurs={couleurs} />
          ))}
        </div>
      )}
    </section>
  );
}
