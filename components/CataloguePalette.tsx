"use client";
import { useEffect, useMemo, useState } from "react";
import type { DictionaryEntry } from "@/lib/data";
import { getDisplayImageUrl } from "@/lib/image-utils";
import { formatPrixCatalogue } from "@/lib/priceFormat";
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
  /** Prix de référence quand le marchand le fournit (cf. lib/schema.ts). */
  prixOriginal?: number;
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

/** Teintes de la palette que ce produit porte réellement, les plus proches
    d'abord. Vide si aucune n'est assez proche pour qu'on puisse l'affirmer.
    Deux au maximum : au-delà, la ligne déborde d'une carte de 152 px. */
function teintesPalette(
  hexProduit: string | undefined,
  couleurs: Array<{ hex: string; name: string }>,
): Array<{ hex: string; name: string }> {
  if (!hexProduit || couleurs.length === 0) return [];
  const proches: Array<{ hex: string; name: string; ecart: number }> = [];
  for (const c of couleurs) {
    try {
      const d = deltaEHex(hexProduit, c.hex);
      if (d <= DELTA_E_PASTILLE) proches.push({ ...c, ecart: d });
    } catch { /* hex illisible : on ignore cette teinte */ }
  }
  return proches.sort((a, b) => a.ecart - b.ecart).slice(0, 2)
    .map(({ hex, name }) => ({ hex, name }));
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
  const teintes = useMemo(() => teintesPalette(produit.hex, couleurs), [produit.hex, couleurs]);
  const marque = (produit.marque || produit.marchand || "").trim();

  /* Remise : seulement si le marchand fournit un prix de référence
     supérieur. Rien n'est déduit — voir `prixOriginal` dans lib/schema.ts. */
  const remise =
    typeof produit.prixOriginal === "number" &&
    typeof produit.prix === "number" &&
    produit.prixOriginal > produit.prix
      ? Math.round((1 - produit.prix / produit.prixOriginal) * 100)
      : null;

  return (
    <article style={{
      /* UNE carte bordée qui contient l'image ET le texte, au lieu d'une
         image nue suivie de lignes flottantes (maquette 2026-08-22). */
      position: "relative", minWidth: 0,
      background: "#FFFDFA", border: `1px solid ${border}`,
      borderRadius: 14, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* Lien marchand externe : <a rel="sponsored">, pas next/link — la
          destination est hors du site et le lien est affilié. */}
      <a
        href={produit.urlProduit || "#"}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{
          display: "flex", flexDirection: "column", flex: 1,
          textDecoration: "none", color: "inherit",
        }}
      >
        <span style={{
          display: "block", position: "relative",
          aspectRatio: "1 / 1",
          /* Fond légèrement plus sourd que la carte : les packshots sur fond
             blanc se détachent, et la limite image/texte se lit sans trait. */
          background: "#F2EFE9",
        }}>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image} alt={produit.nom} loading="lazy" decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {remise !== null && (
            <span style={{
              position: "absolute", top: 8, left: 8,
              padding: "3px 8px", borderRadius: 999,
              background: "rgba(192,57,43,.12)", color: "#A33529",
              fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
              lineHeight: 1.4,
            }}>
              −{remise}%
            </span>
          )}
        </span>

        <span style={{
          display: "flex", flexDirection: "column", gap: 3,
          padding: "10px 11px 12px", flex: 1,
        }}>
          {marque && (
            <span style={{
              fontFamily: fontLabel, fontSize: 11, letterSpacing: ".07em",
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
               de produits sortaient en bleu, comme des liens, au milieu d'une
               grille où tout est déjà cliquable. */
            fontFamily: fontBody, fontSize: 12.5, color: ink, lineHeight: 1.3,
            /* Deux lignes réservées même quand le nom en tient une : sinon la
               ligne de couleur et le prix se décalent d'une carte à l'autre
               et la grille a l'air bancale. */
            minHeight: "2.6em",
          }}>
            {produit.nom}
          </span>

          {/* Une seule ligne de couleur, avec ses pastilles — la maquette ne
              répète pas le nom du marchand ET la teinte de palette. Quand le
              produit touche deux teintes de la palette, les deux pastilles
              s'affichent (« ●● Sable / Vert émeraude »). */}
          {teintes.length > 0 ? (
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontFamily: fontBody, fontSize: 11.5, color: textSecondary,
              overflow: "hidden", whiteSpace: "nowrap",
            }}>
              <span aria-hidden style={{ display: "inline-flex", flexShrink: 0 }}>
                {teintes.map((t, i) => (
                  <span key={t.hex} style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: t.hex, border: `1px solid ${border}`,
                    marginLeft: i === 0 ? 0 : -3,
                  }} />
                ))}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {teintes.map((t) => t.name).join(" / ")}
              </span>
            </span>
          ) : produit.couleurNom ? (
            <span style={{
              fontFamily: fontBody, fontSize: 11.5, color: textSecondary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}>
              {produit.couleurNom}
            </span>
          ) : null}

          {typeof produit.prix === "number" && (
            <span style={{
              display: "flex", alignItems: "baseline", gap: 7,
              marginTop: "auto", paddingTop: 5, flexWrap: "wrap",
            }}>
              {remise !== null && (
                <span style={{
                  fontFamily: fontBody, fontSize: 11.5, color: textSecondary,
                  textDecoration: "line-through",
                }}>
                  {formatPrixCatalogue(produit.prixOriginal, produit.devise)}
                </span>
              )}
              <span style={{
                fontFamily: fontLabel, fontSize: 13.5,
                color: remise !== null ? "#A33529" : ink,
              }}>
                {formatPrixCatalogue(produit.prix, produit.devise)}
              </span>
            </span>
          )}
        </span>
      </a>

      {/* Le cœur est HORS du lien : imbriquer un bouton dans un <a> est
          invalide, et le clic partait chez le marchand au lieu de liker.
          Sans pastille blanche (maquette) : il est posé sur un fond clair,
          un cercle de plus alourdirait la vignette. */}
      <button
        type="button"
        onClick={() => setLiked(!liked)}
        aria-pressed={liked}
        aria-label={liked ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
        style={{
          position: "absolute", top: 6, right: 6,
          width: 32, height: 32, borderRadius: "50%",
          border: "none", background: "transparent", cursor: "pointer",
          color: liked ? mojo : "rgba(30,30,30,.62)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
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
