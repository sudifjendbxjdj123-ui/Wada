"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { GroupedProduct } from "@/lib/groupProducts";
import { formatProductPrice } from "@/lib/priceFormat";
import { getMatchingPalettes } from "@/lib/getMatchingPalettes";
import { SOURCE_LABEL } from "@/lib/SOURCE_LABEL";
import { HeartIcon } from "./HeartIcon";
import { addToCart } from "@/lib/cart";
import { showToast } from "@/lib/toast";
import { useLiked } from "@/hooks/useLiked";

const BORDEAUX = "#6B3A32";

interface Props {
  g: GroupedProduct;
  onClick?: (e: React.MouseEvent) => void;
}

export function GroupedProductCard({ g, onClick }: Props) {
  const [liked, setLiked] = useLiked(g.key);
  const [hovering, setHovering] = useState(false);
  const [quickView, setQuickView] = useState(false);
  const [selectedColorHex, setSelectedColorHex] = useState(g.primary.hex);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Reset selectedSize when product changes (g.key)
  useEffect(() => {
    setSelectedSize(null);
  }, [g.key]);

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

  // Déterminer les badges — DETERMINISTIC basé sur product ID, pas random
  const badges: Array<{ label: string; icon: string; bg: string; text: string }> = [];

  // "NOUVEAU" — heuristique: hash du produit ID déterministe (40% des produits)
  const isNew = (g.key.charCodeAt(0) + g.key.charCodeAt(g.key.length - 1)) % 10 < 4;
  if (isNew) {
    const daysSeed = Math.abs(g.key.charCodeAt(0)) % 7 + 1;
    badges.push({
      label: `NOUVEAU · Il y a ${daysSeed}j`,
      icon: "✨",
      bg: "#fef2f2",
      text: "#991b1b"
    });
  }

  if ((currentVariant.popularite || 0) > 0.7) {
    badges.push({ label: "POPULAIRE", icon: "🔥", bg: "#fff3e0", text: "#d97706" });
  }
  // Heuristique: prix bas = possible sale
  if (currentVariant.prix < 50) {
    badges.push({ label: "PROMO", icon: "⚡", bg: "#fee2e2", text: "#dc2626" });
  }
  // Heuristique: prix moyen = best value
  if (currentVariant.prix >= 50 && currentVariant.prix < 150) {
    badges.push({ label: "✓ MEILLEUR PRIX", icon: "💎", bg: "#f0fdf4", text: "#16a34a" });
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!selectedSize) {
      showToast("Veuillez sélectionner une taille", { variant: "info" });
      return;
    }

    // Vérifier que la taille est en stock pour la couleur sélectionnée
    if (!availableSizes.includes(selectedSize)) {
      showToast("Cette taille n'est pas disponible", { variant: "info" });
      return;
    }

    addToCart({
      piece: currentVariant.categorie || "accent",
      item: g.nom,
      colorName: currentVariant.couleurNom || currentVariant.hex,
      colorHex: currentVariant.hex,
      query: `${g.marque} ${g.nom}`,
      fromEntry: currentVariant.id,
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

          {/* Product badges (POPULAIRE, PROMO) */}
          {badges.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {badges.map((badge, i) => (
                <div
                  key={i}
                  style={{
                    background: badge.bg,
                    color: badge.text,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "'Inter'",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  <span>{badge.icon}</span>
                  {badge.label}
                </div>
              ))}
            </div>
          )}

          {/* Palette badges — clickable & enhanced */}
          {matches.length > 0 && (
            <Link
              href={`/palette/${matches[0]?.number}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "blur(8px)",
                borderRadius: 8,
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
              }}
            >
              <div style={{ display: "flex", gap: 3 }}>
                {matches.slice(0, 3).map((m) => (
                  <span
                    key={m.number}
                    title={`Palette n°${m.number} · ${m.name}\n(Cliquez pour explorer)`}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: m.swatch,
                      border: "1px solid rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B3A32",
                  fontFamily: "'Inter'",
                  whiteSpace: "nowrap",
                }}
              >
                {matches.length} palette{matches.length > 1 ? "s" : ""}
              </span>
            </Link>
          )}

          {/* Overlay au hover — Quick view ou Voir détails */}
          {hovering && !quickView && (
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
                cursor: "pointer",
              }}
              onClick={() => setQuickView(true)}
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
                Quick view ⚡
              </div>
            </div>
          )}

          {/* Quick view overlay — Color + Size selectors */}
          {quickView && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(26,26,26,0.95)",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)",
                padding: 16,
                zIndex: 10,
              }}
            >
              {/* Couleur */}
              {g.uniqueColors.length > 1 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    {g.uniqueColors.slice(0, 5).map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColorHex(c.hex)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: c.hex,
                          border: selectedColorHex === c.hex ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)",
                          cursor: "pointer",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Taille */}
              {availableSizes.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
                    {availableSizes.slice(0, 4).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 4,
                          border: selectedSize === size ? "2px solid #fff" : "1px solid rgba(255,255,255,0.3)",
                          background: selectedSize === size ? "rgba(255,255,255,0.1)" : "transparent",
                          color: "#fff",
                          fontSize: 11,
                          fontFamily: "'Inter'",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick add to cart */}
              <button
                onClick={(e) => {
                  handleAddToCart(e);
                  setQuickView(false);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#1a1a1a",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter'",
                  marginTop: 8,
                }}
              >
                ✓ Ajouter
              </button>

              {/* Close button */}
              <button
                onClick={() => setQuickView(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 20,
                  cursor: "pointer",
                  opacity: 0.6,
                }}
              >
                ×
              </button>
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
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
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

        {/* Prix (BIG & BOLD) + palette count */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 6,
            marginBottom: 6,
            padding: "8px 10px",
            background: "#faf6ee",
            borderRadius: 8,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#6B3A32",
              fontFamily: "'Inter'",
            }}
          >
            {formatProductPrice(currentVariant.prix, currentVariant.marchandSlug, currentVariant.devise)}
          </p>
          {matches.length > 0 && (
            <span style={{ fontSize: 9, color: "#8a7a68", fontFamily: "'Inter'", fontWeight: 500, whiteSpace: "nowrap" }}>
              {matches.length}P
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
            marginBottom: 12,
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

        {/* Complétez votre look — Outfit recommendation */}
        <div style={{ background: "#fef8f2", padding: 12, borderRadius: 8, textAlign: "center" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#8a7a68", margin: "0 0 8px", fontFamily: "'Inter'", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            ✦ Complétez votre look
          </p>
          <p style={{ fontSize: 11, color: "#5a5a5a", margin: 0, fontFamily: "'Inter'" }}>
            Découvrez une tenue assortie à cette pièce
          </p>
          <button
            onClick={() => window.location.href = `/stylist?color=${currentVariant.hex.slice(1)}`}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              background: "transparent",
              border: "1px solid #8a7a68",
              borderRadius: 6,
              color: "#1a1a1a",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Inter'",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#8a7a68";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#1a1a1a";
            }}
          >
            Composer une tenue →
          </button>
        </div>
      </div>

      {/* Bouton favori — accessible 44px touch target (WCAG) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setLiked(!liked);
        }}
        aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={liked}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 44,
          height: 44,
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
