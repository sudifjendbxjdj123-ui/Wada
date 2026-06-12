/**
 * POST /api/products/search — recherche catalogue multi-filtres (brief
 * 2026-06-09 « filtres catégorie complets »).
 *
 * Body JSON : { slot, category, filters: CategoryFilters, limit, offset }
 *   - slot     : liste CSV de ProductCategorie (« haut,bas,veste ») à inclure
 *   - category : label catégorie (« vetements ») pour les regex de sous-type
 *   - filters  : état complet des 11 filtres (cf. lib/categoryFilters)
 *
 * Réponse : { products, total, count, facets } — produits paginés (shape
 * identique à /api/products : images proxifiées) + compteurs de facettes
 * sur le pool catégorie (pour griser les options vides côté sidebar).
 */
import { readAllProducts } from "@/lib/productStore";
import { visitorCountry, filterByGeo } from "@/lib/products/visibility";
import type { ProduitAwin } from "@/lib/schema";
import { isAffiliated } from "@/lib/composer/occasionRules";
import {
  applyCategoryFilters, sortProducts, computeCounts,
  getDefaultFilters, isSlotNameConsistent, type CategoryFilters,
} from "@/lib/categoryFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 96;

function isUsableImage(p: ProduitAwin): boolean {
  const url = p.imageLocal || p.largeImage || p.image || "";
  if (!url || url === "-") return false;
  if (/noimage\.(gif|png|jpe?g|webp)/i.test(url)) return false;
  if (/shopifypreview\.com/i.test(url) || /shopifypreview\.com/i.test(p.urlProduit || "")) return false;
  return true;
}

const IMG_PROXY_HOSTS = new Set(["images2.productserve.com"]);
function proxyImageUrl(url: string | undefined): string {
  if (!url) return "";
  try {
    if (IMG_PROXY_HOSTS.has(new URL(url).hostname)) return `/api/img?u=${encodeURIComponent(url)}`;
  } catch {}
  return url;
}

export async function POST(req: Request) {
  let body: {
    slot?: string;
    category?: string;
    filters?: Partial<CategoryFilters>;
    limit?: number;
    offset?: number;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ products: [], total: 0, count: 0, facets: {}, error: "bad json" }, { status: 400 });
  }

  const filters: CategoryFilters = { ...getDefaultFilters(), ...(body.filters || {}) };
  const category = body.category || "";
  const slots = (body.slot || "").split(",").map((s) => s.trim()).filter(Boolean);
  const limit = Math.min(body.limit ?? 48, MAX_LIMIT);
  const offset = Math.max(0, body.offset ?? 0);

  /* Visibilité géo (2026-06-09) : K&Ö = CH uniquement (x-vercel-ip-country). */
  const country = visitorCountry(req.headers);
  const catalog = filterByGeo(await readAllProducts(), country);
  if (catalog.length === 0) {
    return Response.json({ products: [], total: 0, count: 0, facets: {}, source: "empty" });
  }

  /* Pool catégorie : en stock + image utilisable + marchand affilié + slot. */
  const pool = catalog.filter((p) => {
    if (!p.enStock) return false;
    if (!isUsableImage(p)) return false;
    if (!isAffiliated(p.marchandSlug || "")) return false;
    if (slots.length && !slots.includes(p.categorie)) return false;
    if (!isSlotNameConsistent(p)) return false; // ex. « Derby jumper » hors chaussures
    return true;
  });

  /* Facettes calculées sur le pool CATÉGORIE (avant filtres utilisateur) —
     compteurs stables « combien si je coche ceci ». */
  const facets = {
    type: computeCounts(pool, category, "type"),
    color: computeCounts(pool, category, "color"),
    brand: computeCounts(pool, category, "brand"),
    size: computeCounts(pool, category, "size"),
    material: computeCounts(pool, category, "material"),
    season: computeCounts(pool, category, "season"),
    genre: computeCounts(pool, category, "genre"),
  };

  /* Application des filtres + tri. */
  const filtered = sortProducts(applyCategoryFilters(pool, filters, category), filters.sort);

  /* Dédup par marque + nom + couleur (ignorer les tailles).
     Raison : Awin donne un ID unique par SKU (taille/couleur), donc chaque
     taille serait un produit distinct. On veut afficher CHAQUE PRODUIT UNE FOIS.
     Tailles sont dans p.tailles[] si l'utilisateur veut les détails. */
  const seen = new Set<string>();
  const deduped: ProduitAwin[] = [];
  for (const p of filtered) {
    const key = `${(p.marque || "").toLowerCase()}-${(p.nom || "").toLowerCase()}-${(p.couleurNom || p.hex || "").toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(p); }
  }

  const total = deduped.length;
  const products = deduped.slice(offset, offset + limit).map((p) => ({
    ...p,
    image: p.imageLocal ? p.imageLocal : proxyImageUrl(p.image),
    largeImage: p.imageLocal ? p.imageLocal : proxyImageUrl(p.largeImage || p.image),
  }));

  return Response.json({ products, total, count: products.length, facets });
}
