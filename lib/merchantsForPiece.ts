/**
 * merchantsForPiece — sélecteur de marchands AFFILIÉS par pièce.
 *
 * Bug critique 2026-05-31 (capture « Béton & Lin ») : cette fonction poussait
 * systématiquement Amazon (générique) + Veja (chaussures) + COS/Uniqlo
 * (haut/bas) comme « marchands » — alors qu'AUCUNE de ces marques n'est
 * partenaire affilié de WADA. Le client achetait → WADA ne touchait rien, et
 * le libellé « Lien partenaire » devenait mensonger (RGPD).
 *
 * Correctif (brief règle 1) : on ne pousse QUE des marchands réellement
 * affiliés (whitelist lib/affiliate-brands). Aujourd'hui le seul marchand de
 * recherche affilié pertinent ici est MUJI (deep-link Awin). Les autres
 * partenaires (The Business Fashion, The Shirt Company) n'arrivent PAS par une
 * recherche pré-remplie mais par leur vraie fiche produit (flux Awin →
 * /api/products), avec image + prix réel + deep-link. Donc cette fonction
 * renvoie soit [Muji] (pièce minimal/basique), soit [] — et c'est honnête.
 *
 * Un filet de sécurité final (`filterAffiliatedShopLinks`) garantit qu'aucune
 * marque non whitelistée ne puisse jamais s'échapper d'ici.
 */

import { affiliate } from "./affiliate";
import type { ShopLink } from "./data";
import { filterAffiliatedShopLinks } from "./affiliate-brands";

/* ──────────────────────────────────────────────────────────────────────
   Détection « pièce minimal/basique » → Muji pertinent
   ──────────────────────────────────────────────────────────────────────
   Muji = basiques neutres (t-shirts, chemises oxford, pantalons droits,
   sneakers minimales). Pas pertinent pour cargo streetwear / blazer
   structuré / talons habillés. */

const MINIMAL_KEYWORDS = /\b(t-shirt|tee|tshirt|polo|chemise|oxford|pull|maille|cardigan|chino|pantalon\s+droit|jean\s+droit|surchemise|sneakers?\s+minimal|sneakers?\s+blanche|bottines|trench|manteau\s+droit|écharpe|ceinture|tote)\b/i;
const MINIMAL_COLORS = /\b(blanc|écru|crème|gris|sable|beige|taupe|marine|olive|sauge|noir|anthracite)\b/i;

function isMinimalPiece(pieceType: string, colorName: string): boolean {
  if (MINIMAL_KEYWORDS.test(pieceType) && MINIMAL_COLORS.test(colorName)) return true;
  // Cas généreux : si le type est très basique, on accepte même sans couleur neutre
  if (/\b(t-shirt|tee|tshirt|chemise\s+oxford|chino|pantalon\s+droit)\b/i.test(pieceType)) return true;
  return false;
}

/* ──────────────────────────────────────────────────────────────────────
   MUJI VIA AWIN — deep-link tracké
   ──────────────────────────────────────────────────────────────────────
   Le wrapper `affiliate()` lit AWIN_MERCHANT_IDS depuis env. Quand le MID
   Muji sera ajouté (« Muji »: « XXXXX » dans le JSON), tous les liens
   Muji deviendront automatiquement trackés Awin.

   URL de recherche Muji FR : `https://www.muji.com/fr/fr/search?q=...`
   (à vérifier régulièrement, le format peut évoluer côté Muji). */

function mujiSearchUrl(query: string): string {
  const q = encodeURIComponent(query);
  return `https://www.muji.com/fr/fr/search?q=${q}`;
}

/* ──────────────────────────────────────────────────────────────────────
   API publique — merchantsForPiece
   ────────────────────────────────────────────────────────────────────── */

export interface PieceForMerchants {
  /** Type de pièce (« Hoodie oversized », « Chemise oxford »). */
  type: string;
  /** Nom de couleur fidèle au hex (« Olive », « Camel »). */
  couleurNom: string;
  /** Genre destinataire si connu. */
  genre?: "homme" | "femme" | "unisexe" | null;
  /** Slot canonique (pour deviner si Muji est pertinent). */
  slot?: "haut" | "bas" | "veste" | "chaussures" | "accent";
}

/**
 * Retourne 0-1 marchand de recherche AFFILIÉ pour une pièce donnée.
 *
 *   - Muji (deep-link Awin) — uniquement si la pièce est minimal/basique
 *
 * Plus jamais d'Amazon / Veja / COS / Uniqlo non affiliés. Si la pièce n'est
 * pas dans l'univers Muji, la liste est vide (règle 3 : mieux vaut honnête
 * et vide qu'un faux lien partenaire). La vraie fiche produit affiliée
 * (MUJI / TBF / Shirt Company) arrive séparément via /api/products.
 */
export function merchantsForPiece(piece: PieceForMerchants): ShopLink[] {
  const merchants: ShopLink[] = [];

  // Muji si pièce minimal/basique (deep-link Awin via affiliate())
  if (isMinimalPiece(piece.type, piece.couleurNom)) {
    const mujiQuery = [piece.type.split(/\s+/).slice(0, 2).join(" "), piece.couleurNom]
      .filter(Boolean)
      .join(" ");
    merchants.push({
      label: "Muji",
      sub: "Basiques minimal",
      url: affiliate(mujiSearchUrl(mujiQuery), "Muji"),
      tier: "Mid-range",
      priceLevel: "mid",
      vibes: ["minimal"],
    });
  }

  // Filet de sécurité : ne JAMAIS laisser passer une marque non affiliée.
  return filterAffiliatedShopLinks(merchants).slice(0, 4);
}
