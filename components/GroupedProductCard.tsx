"use client";
/**
 * GroupedProductCard — carte produit de la grille catégorie.
 *
 * Refonte 2026-08-21 (« comme sur Zalando ») : la carte embarquait un
 * sélecteur de couleur, un sélecteur de taille, un bouton « Ajouter au
 * panier », un bloc « Complétez votre look » et un overlay quick view.
 * Résultat sur téléphone : UNE carte occupait tout l'écran, et la grille
 * passait à une seule colonne — on ne comparait plus rien.
 *
 * Anatomie retenue, celle des grandes boutiques : image, marque, nom, prix.
 * Rien d'autre au-dessus de la ligne de flottaison. Les tailles et l'ajout au
 * panier vivent dans la fiche produit, qui les affichait déjà.
 *
 * Deux éléments propres à WADA sont conservés, parce qu'ils sont la raison
 * d'être du site : les pastilles de palette Sanzō Wada sur l'image, et les
 * nuances disponibles sous le prix.
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { GroupedProduct } from "@/lib/groupProducts";
import { formatProductPrice } from "@/lib/priceFormat";
import { getDisplayImageUrl } from "@/lib/image-utils";
import { getMatchingPalettes } from "@/lib/getMatchingPalettes";
import { SOURCE_LABEL } from "@/lib/SOURCE_LABEL";
import { HeartIcon } from "./HeartIcon";
import { useLiked } from "@/hooks/useLiked";

const BORDEAUX = "#6B3A32";

interface Props {
  g: GroupedProduct;
  onClick?: (e: React.MouseEvent) => void;
}

export function GroupedProductCard({ g, onClick }: Props) {
  const [liked, setLiked] = useLiked(g.key);
  const [selectedColorHex, setSelectedColorHex] = useState(g.primary.hex);
  const [imgLoading, setImgLoading] = useState(true);

  const currentVariant = useMemo(
    () => g.variants.find((v) => v.hex === selectedColorHex) || g.primary,
    [selectedColorHex, g.primary, g.variants],
  );

  const source = SOURCE_LABEL[currentVariant.marchandSlug || ""] || currentVariant.marchand;
  const dom = /^#[0-9a-f]{6}$/i.test(currentVariant.hex || "") ? currentVariant.hex : "#ede4d4";
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${dom}22 100%)`;

  /* Palettes correspondantes.
     Fix 2026-08-21 : la carte affichait « 309 palettes ». getMatchingPalettes
     retient tout ce qui tombe sous DELTA_E_LOOSE (25), le seuil « approchant » :
     une teinte neutre est donc proche de presque tout le dictionnaire, et le
     compteur n'apprenait rien à personne. On ne montre plus de décompte mais
     les trois accords les PLUS proches, du plus fidèle au moins fidèle — c'est
     l'information utile, et elle tient en trois pastilles. */
  const matches = useMemo(() => getMatchingPalettes(currentVariant.hex), [currentVariant.hex]);
  const topPalettes = matches.slice(0, 3);

  return (
    <article className="wada-card">
      <div onClick={(e) => onClick?.(e)} style={{ cursor: "pointer" }}>
        {/* ── Image ── */}
        <div className="wada-card-media" style={{ background: bgGradient }}>
          {currentVariant.image || currentVariant.largeImage ? (
            <>
              {imgLoading && <div className="wada-card-skel" aria-hidden />}
              <img
                src={getDisplayImageUrl(currentVariant.image, currentVariant.largeImage)}
                alt={g.nom || g.marque || "Produit"}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoading(false)}
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  if (img.parentElement) img.parentElement.style.background = "#F4EFE7";
                  setImgLoading(false);
                }}
              />
            </>
          ) : (
            <div className="wada-card-noimg">◻</div>
          )}

          {/* Pastilles palette — signature WADA, discrètes, en bas à gauche.
              Lien vers l'accord le plus proche ; stopPropagation pour ne pas
              ouvrir la fiche produit par-dessus. */}
          {topPalettes.length > 0 && (
            <Link
              href={`/palette/${topPalettes[0]!.number}`}
              onClick={(e) => e.stopPropagation()}
              className="wada-card-pal"
              title={`Accord le plus proche : n°${topPalettes[0]!.number} · ${topPalettes[0]!.name}`}
              aria-label={`Palette n°${topPalettes[0]!.number}, ${topPalettes[0]!.name}`}
            >
              {topPalettes.map((m) => (
                <span key={m.number} style={{ background: m.swatch }} />
              ))}
            </Link>
          )}
        </div>

        {/* ── Marque · nom · prix ── */}
        <p className="wada-card-brand">{g.marque}</p>
        <p className="wada-card-name">{g.nom}</p>
        <p className="wada-card-price">
          {formatProductPrice(currentVariant.prix, currentVariant.marchandSlug, currentVariant.devise)}
        </p>

        {/* ── Nuances disponibles ── */}
        {g.uniqueColors.length > 1 && (
          <div className="wada-card-colors">
            {g.uniqueColors.slice(0, 4).map((c) => (
              <button
                key={c.hex}
                onClick={(e) => { e.stopPropagation(); setSelectedColorHex(c.hex); }}
                title={c.nom || c.hex}
                aria-label={`Couleur ${c.nom || c.hex}`}
                aria-pressed={selectedColorHex === c.hex}
                style={{
                  background: c.hex,
                  outline: selectedColorHex === c.hex ? `1.5px solid ${BORDEAUX}` : "none",
                  outlineOffset: 1.5,
                }}
              />
            ))}
            {g.uniqueColors.length > 4 && (
              <span className="wada-card-colors-more">+{g.uniqueColors.length - 4}</span>
            )}
          </div>
        )}

        <p className="wada-card-source">
          <span aria-hidden>↗</span> {source}
        </p>
      </div>

      {/* ── Favori — cible tactile 44px (WCAG) ── */}
      <button
        onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={liked}
        className="wada-card-heart"
      >
        <HeartIcon filled={liked} />
      </button>
    </article>
  );
}
