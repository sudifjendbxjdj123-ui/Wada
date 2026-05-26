/**
 * productMatching — types et logique de matching produit (brief 2026-05-22 §2,3).
 *
 * Couche pure-fonction. Aucune base de données n'est encore branchée ; on
 * utilise un tableau en mémoire `productCatalog` pour les tests. Quand le
 * flux Awin sera ingéré (cf. `productFeed.ts` à venir), il alimentera ce
 * tableau et le moteur de matching ci-dessous reste inchangé.
 *
 * Pipeline pour un slot de tenue :
 *   1. Filtrer par type (synonymes), genre, prix (budget), stock
 *   2. Calculer ΔE2000 entre hex slot et hex produit
 *   3. Garder ceux sous DELTA_E_TIGHT, élargir à DELTA_E_LOOSE si vide
 *   4. Ranker par (ΔE asc, prix dans budget, marque registre)
 *   5. Garantir diversité marques (max 1 par marque dans le top 3)
 *
 * Tests brief §9 :
 *   - « pull blanc homme » → vrais pulls blancs hommes, prix dans budget
 *   - couleur olive → produits olive (ΔE < 15), pas du vert vif
 *   - chaque produit ouvre sa fiche (deep_link), tracké Awin
 *   - aucune rupture de stock affichée
 */

import { deltaEHex, DELTA_E_TIGHT, DELTA_E_LOOSE, colorMatchLevel, type ColorMatchLevel } from "./colorDistance";
import { canonicalGarment } from "./garmentSynonyms";

/* ──────────────────────────────────────────────────────────────────────
   TYPES — schéma de flux produit (compatible Awin Product Feed CSV)
   ──────────────────────────────────────────────────────────────────────
   Champs alignés sur Awin Datafeed standard. Un job d'ingestion (à venir)
   parsera le CSV par marchand et alimentera la table `products` côté DB. */

export type ProductGender = "femme" | "homme" | "unisexe";

export type Product = {
  /** Id stable (préfixé par marchand : « sezane:12345 »). */
  id: string;
  /** Label de la marque tel qu'affiché côté UI (« Sézane »). */
  brand: string;
  /** Slug marchand pour le wrapping affilié (« sezane »). */
  brandSlug: string;
  /** Nom produit complet du catalogue (« Pull col rond cachemire crème »). */
  productName: string;
  /** Description (optionnelle, peut servir au matching synonymes). */
  description?: string;
  /** Couleur produit en HEX (« #F5F2EC »). Idéalement extrait du flux ;
      fallback : table de mapping mot → hex. */
  colorHex: string;
  /** Nom de couleur du flux marchand (« écru », « ivory »…). */
  colorLabel?: string;
  /** Catégorie standard (top / bottom / shoes / outerwear / accessory). */
  category: "top" | "bottom" | "outerwear" | "shoes" | "accessory" | "knit" | "dress";
  /** Mot canonique pièce (pull/chemise/cargo/…). Pour matcher rapidement. */
  garmentKey?: string;
  /** Genre destiné. */
  gender: ProductGender;
  /** Prix en euros (sans le symbole). */
  price: number;
  /** Devise (toujours EUR pour le moment). */
  currency: "EUR";
  /** En stock — booléen strict ; si rupture, le produit est filtré côté UI. */
  inStock: boolean;
  /** URL produit deep-link chez le marchand (sera wrappée Awin). */
  productUrl: string;
  /** URL image (https obligatoire). */
  imageUrl: string;
  /** Score de popularité (0-1) — optionnel, pour le ranking. */
  popularity?: number;
};

/** Tranches de budget alignées sur le profil utilisateur (0/1/2). */
export const BUDGET_RANGES: Record<0 | 1 | 2, { min: number; max: number; label: string }> = {
  0: { min: 0,   max: 200,  label: "≤ 200 €" },
  1: { min: 100, max: 500,  label: "200 – 500 €" },
  2: { min: 300, max: 5000, label: "≥ 500 €" },
};

/* ──────────────────────────────────────────────────────────────────────
   CRITÈRES — entrée du matching pour un slot de tenue
   ────────────────────────────────────────────────────────────────────── */

export type MatchCriteria = {
  /** Mot canonique de la pièce (« hoodie », « pantalon »…). */
  garmentKey: string;
  /** Hex de couleur cible (issu de la palette Wada du slot). */
  colorHex: string;
  /** Genre du client. */
  gender: ProductGender;
  /** Tranche budget (0/1/2). */
  budget: 0 | 1 | 2;
  /** Registre attendu (optionnel — sert au ranking marques cohérentes). */
  registre?: string;
  /** Tolérance ΔE max (par défaut DELTA_E_TIGHT puis fallback LOOSE). */
  maxDeltaE?: number;
};

export type ScoredProduct = {
  product: Product;
  /** Distance couleur ΔE CIEDE2000. */
  deltaE: number;
  /** Niveau de match couleur (exact / proche / approchant). */
  colorLevel: ColorMatchLevel;
  /** Score global utilisé pour le tri (plus petit = meilleur). */
  score: number;
};

/* ──────────────────────────────────────────────────────────────────────
   MAPPING — registre → marques cohérentes (bonus ranking, brief §3.3)
   ────────────────────────────────────────────────────────────────────── */

const REGISTRE_BRANDS: Record<string, string[]> = {
  "Streetwear":  ["carhartt-wip", "carhartt", "vans", "converse", "nike", "adidas", "y-3"],
  "Décontracté": ["apc", "veja", "new-balance", "uniqlo", "arket", "cos"],
  "Old money":   ["loro-piana", "tods", "officine-generale", "polene", "loewe"],
  "Classique":   ["officine-generale", "cos", "arket", "sezane", "soeur", "ba-sh"],
  "Minimal":     ["cos", "uniqlo", "arket", "weekday"],
};

/* ──────────────────────────────────────────────────────────────────────
   FILTRAGE + RANKING — pipeline brief §2, §3
   ────────────────────────────────────────────────────────────────────── */

/**
 * Filtre un catalogue produits pour un slot de tenue donné.
 *
 * 1. Garde uniquement les produits du bon type (canonique + synonymes via
 *    `garmentKey` matché par `canonicalGarment`).
 * 2. Filtre par genre (unisexe accepté pour les deux).
 * 3. Filtre stock (jamais de rupture affichée).
 * 4. Filtre prix dans la tranche budget (avec marge ±20% pour ne pas
 *    être trop strict aux bornes).
 * 5. Calcule ΔE2000 vs colorHex cible, garde ceux sous maxDeltaE.
 *
 * Retourne les produits scorés (non triés — voir rankProducts).
 */
export function filterProducts(
  catalog: Product[],
  criteria: MatchCriteria
): ScoredProduct[] {
  const maxDE = criteria.maxDeltaE ?? DELTA_E_TIGHT;
  const budget = BUDGET_RANGES[criteria.budget];
  const priceMin = budget.min * 0.8;
  const priceMax = budget.max * 1.2;

  const out: ScoredProduct[] = [];
  for (const p of catalog) {
    if (!p.inStock) continue;
    if (p.gender !== "unisexe" && p.gender !== criteria.gender && criteria.gender !== "unisexe") continue;
    if (p.price < priceMin || p.price > priceMax) continue;

    // Match type pièce — soit `garmentKey` correspond directement, soit
    // le `productName` contient un synonyme du garmentKey cible.
    const productKey = p.garmentKey || canonicalGarment(p.productName) || "";
    if (productKey !== criteria.garmentKey) continue;

    const dE = deltaEHex(p.colorHex, criteria.colorHex);
    if (dE > maxDE) continue;

    out.push({
      product: p,
      deltaE: dE,
      colorLevel: colorMatchLevel(dE),
      score: 0, // calculé dans rankProducts
    });
  }
  return out;
}

/**
 * Range les produits scorés selon le brief §3 :
 *   1. proximité couleur (ΔE asc, le plus important)
 *   2. cohérence marque ↔ registre (-10 si la marque est dans le registre)
 *   3. popularité produit (+petit bonus)
 *   4. diversité marques (max 1 par marque dans le top N)
 *
 * Retourne le top N (default 3) avec diversité de marques garantie.
 */
export function rankProducts(
  scored: ScoredProduct[],
  criteria: MatchCriteria,
  topN = 3
): ScoredProduct[] {
  const registreBrands = criteria.registre ? (REGISTRE_BRANDS[criteria.registre] || []) : [];
  const brandSet = new Set(registreBrands);

  // Calcul du score (plus petit = meilleur)
  for (const s of scored) {
    let score = s.deltaE; // base : ΔE (15 max si TIGHT)
    if (brandSet.has(s.product.brandSlug)) score -= 8; // bonus registre
    if (s.product.popularity) score -= s.product.popularity * 3; // bonus pop
    s.score = score;
  }
  scored.sort((a, b) => a.score - b.score);

  // Diversité : max 1 produit par marque dans le top N
  const seenBrands = new Set<string>();
  const result: ScoredProduct[] = [];
  for (const s of scored) {
    if (seenBrands.has(s.product.brandSlug)) continue;
    seenBrands.add(s.product.brandSlug);
    result.push(s);
    if (result.length >= topN) break;
  }
  return result;
}

/**
 * Helper de bout-en-bout : filter → rank → top N avec fallback élargi.
 *
 * 1. Tente avec DELTA_E_TIGHT (15) — couleur fidèle
 * 2. Si zéro résultat : élargit à DELTA_E_LOOSE (25) — teinte approchante
 * 3. Si toujours zéro : retourne un tableau vide (UI doit afficher le fallback
 *    « recherche pré-remplie chez le marchand »)
 */
export function matchProductsForSlot(
  catalog: Product[],
  criteria: MatchCriteria,
  topN = 3
): { matches: ScoredProduct[]; widened: boolean } {
  const tight = filterProducts(catalog, criteria);
  if (tight.length > 0) {
    return { matches: rankProducts(tight, criteria, topN), widened: false };
  }
  const loose = filterProducts(catalog, { ...criteria, maxDeltaE: DELTA_E_LOOSE });
  if (loose.length > 0) {
    return { matches: rankProducts(loose, criteria, topN), widened: true };
  }
  return { matches: [], widened: false };
}

/* ──────────────────────────────────────────────────────────────────────
   CATALOG SOURCE — lit Vercel KV si configuré, sinon catalogue vide
   ──────────────────────────────────────────────────────────────────────
   Quand le cron `/api/cron/refresh-awin-feed` a tourné, les produits
   normalisés sont stockés dans Vercel KV sous la clé `wada:products`.
   Cette fonction les charge à la demande, avec cache mémoire 5 min pour
   éviter de spammer KV à chaque match.

   Si KV pas configuré → catalogue vide → UI doit fallback sur la
   recherche pré-remplie chez le marchand (cf. merchantSearch.ts). */

let kvCache: { products: Product[]; ts: number } | null = null;
const KV_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getProductCatalog(): Promise<Product[]> {
  // Cache mémoire chaud
  if (kvCache && Date.now() - kvCache.ts < KV_CACHE_TTL_MS) {
    return kvCache.products;
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) {
    return [];
  }

  try {
    const res = await fetch(`${kvUrl}/get/wada:products`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { result?: string };
    if (!data.result) return [];
    // KV stocke en string JSON ; on parse + adapte au schéma Product local
    const raw = JSON.parse(data.result) as Array<Record<string, unknown>>;
    // Convertit ProduitAwin (FR) → Product (EN, schéma productMatching)
    const products: Product[] = raw.map((p) => ({
      id: String(p.id ?? ""),
      brand: String(p.marchand ?? ""),
      brandSlug: String(p.marchandSlug ?? ""),
      productName: String(p.nom ?? ""),
      description: typeof p.description === "string" ? p.description : undefined,
      colorHex: String(p.hex ?? "#9B9B96"),
      colorLabel: typeof p.couleurNom === "string" ? p.couleurNom : undefined,
      category: ((): Product["category"] => {
        // ProduitAwin.categorie est en FR ; map vers Product.category EN
        const cat = String(p.categorie ?? "");
        if (cat === "haut") return "top";
        if (cat === "bas") return "bottom";
        if (cat === "veste") return "outerwear";
        if (cat === "chaussures") return "shoes";
        if (cat === "accent") return "accessory";
        return "top";
      })(),
      gender: (String(p.genre ?? "unisexe") as Product["gender"]),
      price: typeof p.prix === "number" ? p.prix : 0,
      currency: "EUR",
      inStock: Boolean(p.enStock),
      productUrl: String(p.urlProduit ?? ""),
      imageUrl: String(p.image ?? ""),
    }));
    kvCache = { products, ts: Date.now() };
    return products;
  } catch {
    return [];
  }
}

/** Catalogue stub — vide tant que KV n'est pas branché. Utilisé pour les
    tests unitaires et comme fallback synchrone si un appel inline manque
    de async. À terme, supprimer et toujours passer par getProductCatalog. */
export const productCatalog: Product[] = [];
