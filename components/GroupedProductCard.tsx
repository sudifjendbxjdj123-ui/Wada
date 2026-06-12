"use client";
import { useState, useMemo } from "react";
import { GroupedProduct } from "@/lib/groupProducts";
import { formatProductPrice } from "@/lib/priceFormat";
import { getMatchingPalettes } from "@/lib/getMatchingPalettes";
import { SOURCE_LABEL } from "@/lib/SOURCE_LABEL";
import { HeartIcon } from "./HeartIcon";
import { addToCart } from "@/lib/cart";
import { showToast } from "@/lib/toast";

const BORDEAUX = "#6B3A32";

interface Props {
  g: GroupedProduct;
  onClick?: (e: React.MouseEvent) => void;
}

export function GroupedProductCard({ g, onClick }: Props) {
  const [liked, setLiked] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [selectedColorHex, setSelectedColorHex] = useState(g.primary.hex);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Trouver le produit selon la couleur sélectionnée
  const currentVariant = useMemo(() => {
    const selected = g.variants.find((v) => v.hex === selectedColorHex);
    return selected || g.primary;
  }, [selectedColorHex, g.primary, g.variants]);

  // Tailles disponibles pour la couleur sélectionnée
  const availableSizes = useMemo(() => {
    return currentVariant.tailles || [];
  }, [currentVariant.tailles]);

  const source = SOURCE_LABEL[currentVariant.marchandSlug || ""] || currentVariant.marchand;
  const matches = useMemo(() => getMatchingPalettes(currentVariant.hex), [currentVariant.hex]);
  const dom = /^#[0-9a-f]{6}$/i.test(currentVariant.hex || "") ? currentVariant.hex : "#ede4d4";
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${dom}30 100%)`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedSize) {
      showToast("Veuillez sélectionner une taille", { variant: "info" });
      return;
    }

    addToCart({
      productId: currentVariant.id,
      marque: g.marque,
      nom: g.nom,
      couleur: currentVariant.couleurNom || currentVariant.hex,
      hex: currentVariant.hex,
      taille: selectedSize,
      prix: currentVariant.prix,
      devise: currentVariant.devise,
      image: currentVariant.image || currentVariant.largeImage,
      quantite: 1,
      urlProduit: currentVariant.urlProduit,
      marchand: currentVariant.marchand,
    });

    showToast(`✓ ${g.marque} ${g.nom} ajouté au panier`, { variant: "success", duration: 3000 });
  };

  return (
    <article style={{ position: "relative", cursor: "pointer" }}>
      <div onClick={(e) => onClick?.(e)}>
        {/* Image produit */}
        <div
          style={{
            background: bgGradient,
            borderRadius: 14,
            overflow: "hidden",
            aspectRatio: "3/4",
            position: "relative",
            marginBottom: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            transition: "box-shadow 0.25s, transform 0.25s",
          }}
          onMouseEnter={(e) => {
            setHovering(true);
            e.currentTarget.style.boxShadow = "0 10px 26px rgba(0,0,0,0.14)";
            e.currentTarget.style.transform = "translateY(-3px)";
            const img = e.currentTarget.querySelector("img");
            if (img) (img as HTMLImageElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            setHovering(false);
            e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
            e.currentTarget.style.transform = "translateY(0)";
            const img = e.currentTarget.querySelector("img");
            if (img) (img as HTMLImageElement).style.transform = "scale(1)";
          }}
        >
          {currentVariant.image || currentVariant.largeImage ? (
            <img
              src={currentVariant.image || currentVariant.largeImage}
              alt={g.nom || g.marque || "Produit"}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                transition: "transform 0.4s cubic-bezier(.22,1,.36,1)",
              }}
              onError={(e) => {
                const img = e.currentTarget;
                img.style.display = "none";
                if (img.parentElement) img.parentElement.style.background = "#F4EFE7";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c5b9a8",
                fontSize: 28,
              }}
            >
              ◻
            </div>
          )}

          {/* Pastilles palettes */}
          {matches.length > 0 && (
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 4 }}>
              {matches.slice(0, 3).map((m) => (
                <span
                  key={m.number}
                  title={`Palette n°${m.number} · ${m.name}`}
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: m.swatch,
                    border: "1px solid rgba(0,0,0,0.18)",
                    boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Overlay au hover */}
          {hovering && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(26,26,26,0.72)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(2px)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  color: "#fff",
                  fontFamily: "'Fredoka'",
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "-0.4px",
                }}
              >
                Voir détails
              </div>
            </div>
          )}
        </div>

        {/* Infos produit */}
        <p
          style={{
            margin: "0 0 1px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8a7a68",
            fontFamily: "'Inter'",
          }}
        >
          {g.marque}
        </p>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            lineHeight: 1.35,
            color: "#1a1a1a",
            fontFamily: "'Inter'",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {g.nom}
        </p>

        {/* Sélecteur couleur */}
        {g.uniqueColors.length > 1 && (
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 600,
                color: "#8a7a68",
                fontFamily: "'Inter'",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Couleur
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {g.uniqueColors.map((c) => (
                <button
                  key={c.hex}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColorHex(c.hex);
                  }}
                  title={c.nom || c.hex}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border:
                      selectedColorHex === c.hex
                        ? `2px solid ${BORDEAUX}`
                        : "2px solid rgba(0,0,0,0.1)",
                    background: c.hex,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  aria-label={`Couleur ${c.nom || c.hex}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sélecteur taille */}
        {availableSizes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 600,
                color: "#8a7a68",
                fontFamily: "'Inter'",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Taille
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 6,
                    border:
                      selectedSize === size
                        ? `2px solid ${BORDEAUX}`
                        : "1px solid rgba(0,0,0,0.15)",
                    background: selectedSize === size ? "rgba(26,26,26,0.05)" : "transparent",
                    color: "#1a1a1a",
                    fontSize: 12,
                    fontFamily: "'Inter'",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prix et palette count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#1a1a1a",
              fontFamily: "'Inter'",
            }}
          >
            {formatProductPrice(currentVariant.prix, currentVariant.marchandSlug, currentVariant.devise)}
          </p>
          {matches.length > 0 && (
            <span style={{ fontSize: 10, color: BORDEAUX, fontFamily: "'Inter'", fontWeight: 500, whiteSpace: "nowrap" }}>
              {matches.length} palette{matches.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Reviews placeholder */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
            fontSize: 11,
            fontFamily: "'Inter'",
          }}
        >
          <span style={{ color: "#f59e0b" }}>★★★★☆</span>
          <span style={{ color: "#8a7a68" }}>4.5 (248 avis)</span>
        </div>

        {/* Shipping info */}
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 10,
            color: "#10b981",
            fontFamily: "'Inter'",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ✓ Livraison gratuite dès {currentVariant.devise === "CHF" ? "CHF" : "€"}50
        </p>

        {/* Source */}
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 11,
            color: "#a89880",
            fontFamily: "'Inter'",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span style={{ fontSize: 9 }}>↗</span> {source}
        </p>

        {/* Add to Cart button */}
        <button
          onClick={handleAddToCart}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            background: BORDEAUX,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter'",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#52261f";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(107, 58, 50, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = BORDEAUX;
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Ajouter au panier
        </button>
      </div>

      {/* Bouton favori */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setLiked(!liked);
        }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={liked}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 34,
          height: 34,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(4px)",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 5px rgba(0,0,0,0.12)",
        }}
      >
        <HeartIcon filled={liked} />
      </button>
    </article>
  );
}
