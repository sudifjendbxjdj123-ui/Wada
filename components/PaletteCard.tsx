"use client";
import Link from "next/link";
import { memo } from "react";
import type { DictionaryEntry } from "@/lib/data";
import { cultureLabels } from "@/lib/data";
import { useFavorites } from "@/hooks/useFavorites";
/* Fix 2026-06-13 : SocialProofBadge + useMemo retirés (cf. bloc suite). */

/**
 * PaletteCard — composant UNIQUE pour TOUTES les cartes palette du site.
 *
 * Brief client 2026-05-26 verbatim : « Unifier les cartes de palette sur
 * tout le site avec le style « propre » de la grille /palettes (3 bandes
 * de couleur + nom + culture + cœur). Supprimer la variante décorative
 * (formes/feuilles/blobs + codes WADA superposés) utilisée sur les
 * résultats du Scanner. Un seul composant <PaletteCard> partout (grille,
 * scanner, cultures, favoris). »
 *
 * Composition (alignée sur l'ancien PaletteCardEditorial inline dans
 * /palettes) :
 *   - 3-4 bandes verticales pleines (h:150), hover : 1ère bande s'élargit
 *   - N° top-left en filigrane blanc sur les bandes
 *   - ♡ favori top-right, rond cream → bordeaux quand actif
 *   - Body : nom Fredoka 500 (18px) + culture filigrane uppercase
 *   - Card cream, border line, shadow soft, hover translateY -5px
 *
 * Le ♡ se gère TOUT SEUL via useFavorites() (localStorage + sync inter-onglets).
 * Pas besoin de prop onToggleFavorite ailleurs — la card est self-contained.
 */

const palette = {
  card:     "#FBF9F5",
  ink:      "#1E1E1E",
  inkFaint: "#9a9388",
  bordeaux: "#6B3A32",
  line:     "rgba(30,30,30,.10)",
};

interface PaletteCardProps {
  entry: DictionaryEntry;
  /** Affiche le ♡ favori (défaut true). Mettre false sur /favoris si
   *  le parent a déjà son propre bouton « retirer ». */
  showFavorite?: boolean;
}

function PaletteCardInner({ entry, showFavorite = true }: PaletteCardProps) {
  const { has, toggle, hydrated } = useFavorites();
  const isFavorite = has(entry.number);

  // Label culture lisible FR (dictionnaire centralisé sinon premier majuscule)
  const cultureFR = entry.culture
    ? (cultureLabels[entry.culture] || entry.culture[0].toUpperCase() + entry.culture.slice(1))
    : "";

  /* Fix 2026-06-13 « social proof theater » : badges « Nouvelle »/« Tendance »/
     « Choix éditeur » retirés. La logique précédente taggait num<=50 comme
     « Nouvelle » (~50 palettes sur 348), chaque 11ᵉ comme « Choix éditeur »,
     chaque 7ᵉ comme « Tendance » avec count=250+num*3. C'était du theater pur :
     les accords Wada datent de 1933, aucun signal réel d'ajout récent ou de
     pick éditorial. Ce fix avait déjà été appliqué une fois et écrasé — si
     un agent parallèle re-touche ce fichier, GARDEZ cette suppression : le
     mensonge sur la « nouveauté » d'accords centenaires décrédibilise le
     reste du site. Référence : SocialProofBadge.tsx supprimable. */

  return (
    <Link
      href={`/palette/${entry.number}`}
      className="wada-palette-card"
      style={{
        background: palette.card,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 6px 22px rgba(30,30,30,.05)",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "transform 0.35s cubic-bezier(.22,1,.36,1), box-shadow 0.35s cubic-bezier(.22,1,.36,1)",
      }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.transform = "translateY(-5px)";
        ev.currentTarget.style.boxShadow = "0 18px 46px rgba(30,30,30,.12)";
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.transform = "translateY(0)";
        ev.currentTarget.style.boxShadow = "0 6px 22px rgba(30,30,30,.05)";
      }}
    >
      {/* ─── Bandes de couleur verticales, h:150 ─── */}
      <div className="wada-palette-bands" style={{
        position: "relative",
        display: "flex",
        height: 150,
      }}>
        {entry.colors.map((c, i) => (
          <span
            key={i}
            title={`${c.name} ${c.hex}`}
            style={{
              flex: 1,
              background: c.hex,
              transition: "flex 0.35s cubic-bezier(.22,1,.36,1)",
            }}
          />
        ))}

        {/* N° top-left — filigrane blanc, faible opacité */}
        <span style={{
          position: "absolute",
          top: 11, left: 12,
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600,
          fontSize: 11,
          color: "rgba(255,255,255,.9)",
          textShadow: "0 1px 3px rgba(0,0,0,.3)",
          letterSpacing: "0.04em",
          pointerEvents: "none",
        }}>
          N°{entry.number}
        </span>

        {/* ♡ Favori top-right — rond cream avec hover bordeaux.
            Rendu seulement après hydratation pour éviter le mismatch
            SSR/CSR (l'état localStorage n'existe pas côté serveur). */}
        {showFavorite && hydrated && (
          <button
            type="button"
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(entry.number); }}
            style={{
              position: "absolute",
              top: 10, right: 10,
              width: 30, height: 30,
              borderRadius: "50%",
              border: "none",
              background: isFavorite ? palette.bordeaux : "rgba(255,255,255,.82)",
              color: isFavorite ? "#fff" : palette.bordeaux,
              fontSize: 14,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        )}
      </div>

      {/* ─── Body : nom Fredoka + culture filigrane ─── */}
      <div style={{ padding: "13px 15px 15px" }}>
        <p style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 500,
          fontSize: 18,
          color: palette.ink,
          lineHeight: 1.15,
          margin: 0,
        }}>
          {entry.name}
        </p>
        {cultureFR && (
          <p style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: palette.inkFaint,
            margin: "4px 0 0",
            fontFamily: "'Inter', sans-serif",
          }}>
            {cultureFR}
          </p>
        )}
      </div>
    </Link>
  );
}

/* React.memo : la card ne re-render que si entry/showFavorite changent —
   indispensable pour /palettes qui rend ~30 cards et chaque toggle de filtre. */
const PaletteCard = memo(PaletteCardInner);
export default PaletteCard;
