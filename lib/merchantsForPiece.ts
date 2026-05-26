/**
 * merchantsForPiece — sélecteur de marchands pertinents par pièce.
 *
 * Bug fix 2026-05-24 : avant, chaque pièce affichait « JACK & JONES »
 * parce que c'était la SEULE marque Amazon polyvalente codée en dur dans
 * le tier « budget » de lib/data.ts. La sélection légèrement biaisée
 * (`tierOrder` itéré dans l'ordre du budget) tombait toujours dessus.
 *
 * Correctif (brief Amazon Partenaires + Muji 2026-05-24) :
 *   - Plus jamais de marque codée en dur comme « bestseller »
 *   - 1 lien Amazon générique pré-rempli avec la query SPÉCIFIQUE de la
 *     pièce (type + couleur + genre) → variété automatique du catalogue
 *   - 1 lien Muji deep-link Awin si la pièce est dans son univers
 *     (minimal/basique/neutre)
 *   - Optionnel : 1-2 marchands directs (Uniqlo, COS, Arket…) pour des
 *     pièces specific dont on connaît un partenaire pertinent
 *
 * Quand la PA-API Amazon sera activée (après 3 ventes), on remplacera
 * `amazonSearchLink` par une vraie recherche produit (image + prix +
 * marque réelle). La structure d'affichage côté UI reste identique.
 */

import { amazonSearch } from "./amazonAffiliate";
import { affiliate } from "./affiliate";
import type { ShopLink } from "./data";
import { buildSearchUrl } from "./merchantSearch";

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
   QUERY BUILDER — construit la query Amazon réelle depuis la pièce
   ────────────────────────────────────────────────────────────────────── */

function buildAmazonQuery(piece: {
  type: string;
  couleurNom?: string;
  genre?: string | null;
}): string {
  // « hoodie oversized » → on garde « hoodie » + couleur + genre
  // Évite de bourrer la query avec « oversized smart casual » qui peut
  // diluer les résultats. On garde un mot-clé principal court.
  const typeWords = piece.type
    .toLowerCase()
    .replace(/\boversized\b|\bsmart\s+casual\b|\bsmart casual\b|\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3) // max 3 mots type
    .join(" ");
  const parts = [typeWords, piece.couleurNom?.toLowerCase(), piece.genre].filter(Boolean);
  return parts.join(" ").trim();
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
 * Retourne 2-4 marchands variés pour une pièce donnée.
 *
 * Toujours présent :
 *   1. Amazon (recherche pré-remplie avec type+couleur+genre, taggée affilié)
 *   2. Muji (deep-link Awin) — uniquement si la pièce est minimal/basique
 *
 * Optionnel selon le slot :
 *   - chaussures : Veja, New Balance, Adidas (sneakers minimales)
 *   - haut/bas   : COS, Uniqlo, Arket (basiques neutres)
 *
 * Plus jamais de hardcoded « Amazon · JACK & JONES » qui apparaissait
 * partout par défaut.
 */
export function merchantsForPiece(piece: PieceForMerchants): ShopLink[] {
  const query = buildAmazonQuery(piece);
  const merchants: ShopLink[] = [];

  // 1. Amazon générique avec query pièce-spécifique (toujours premier)
  merchants.push({
    label: "Amazon",
    sub: "Recherche multi-marques",
    url: amazonSearch(query),
    tier: "Multi-marques",
    priceLevel: "mid",
  });

  // 2. Muji si pièce minimal/basique (deep-link Awin via affiliate())
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

  // 3. Marchands directs spécifiques au slot (pour variété)
  if (piece.slot === "chaussures") {
    // Privilégie sneakers minimales / directes : Veja (éco) et New Balance
    const shoeQuery = `${piece.type.split(/\s+/).slice(0, 2).join(" ")} ${piece.couleurNom}`.toLowerCase();
    merchants.push({
      label: "Veja",
      sub: "Sneakers éco",
      url: buildSearchUrl("veja", shoeQuery),
      tier: "Sport",
      priceLevel: "mid",
      vibes: ["minimal", "sport-chic"],
    });
  } else if (piece.slot === "haut" || piece.slot === "bas") {
    // Basiques : COS pour minimal, Uniqlo pour budget
    const basicQuery = `${piece.type.split(/\s+/).slice(0, 2).join(" ")} ${piece.couleurNom}`.toLowerCase();
    merchants.push({
      label: "COS",
      sub: "Basiques neutres",
      url: buildSearchUrl("cos", basicQuery),
      tier: "Mid-range",
      priceLevel: "mid",
      vibes: ["minimal"],
    });
    merchants.push({
      label: "Uniqlo",
      sub: "Essentiels accessibles",
      url: buildSearchUrl("uniqlo", basicQuery),
      tier: "Petits prix",
      priceLevel: "budget",
      vibes: ["minimal"],
    });
  }

  // 4. Cap à 4 entrées max (brief mobile : éviter le mur de marchands)
  return merchants.slice(0, 4);
}
