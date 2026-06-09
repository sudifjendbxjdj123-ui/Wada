/**
 * lib/products/visibility.ts — visibilité géographique des produits.
 *
 * Décision produit 2026-06-09 : Kastner & Öhler (K&Ö) est un grand magasin
 * SUISSE qui expédie principalement en Suisse (CHF, frais internationaux
 * ailleurs). On ne montre donc ses ~38k produits QU'AUX visiteurs situés en
 * Suisse. Pour tous les autres pays, K&Ö est masqué partout (catégories,
 * /marques, recherche, composition de tenue).
 *
 * Le pays visiteur vient de l'en-tête `x-vercel-ip-country` posé par l'edge
 * Vercel (ex. "CH", "FR"). En local/dev cet en-tête est absent → traité
 * comme non-CH (donc K&Ö masqué) ; pour tester K&Ö en local, spoofer
 * l'en-tête (curl -H "x-vercel-ip-country: CH").
 *
 * IMPORTANT — cache : toute route qui filtre par pays ET pose un
 * Cache-Control public DOIT ajouter `Vary: x-vercel-ip-country` pour que le
 * CDN ne serve pas le résultat d'un pays à un autre (cf. /api/products).
 */
import type { ProduitAwin } from "@/lib/schema";

/** marchandSlug → liste des pays (ISO-3166-1 alpha-2) où le marchand est visible. */
const GEO_RESTRICTED: Record<string, readonly string[]> = {
  "kastner-ohler": ["CH"],
};

/** Pays visiteur depuis les en-têtes (Vercel `x-vercel-ip-country`). null si inconnu. */
export function visitorCountry(headers: Headers): string | null {
  const c = headers.get("x-vercel-ip-country");
  return c ? c.toUpperCase() : null;
}

/** true si le produit doit être visible pour ce pays visiteur. */
export function shouldShowProduct(p: { marchandSlug?: string }, country: string | null): boolean {
  const allowed = GEO_RESTRICTED[p.marchandSlug || ""];
  if (!allowed) return true; // marchand sans restriction géo → toujours visible
  return !!country && allowed.includes(country);
}

/** Filtre une liste de produits selon le pays visiteur. */
export function filterByGeo<T extends { marchandSlug?: string }>(products: T[], country: string | null): T[] {
  return products.filter((p) => shouldShowProduct(p, country));
}

/** Y a-t-il au moins un marchand géo-restreint ? (utile pour décider d'ajouter le Vary). */
export const HAS_GEO_RESTRICTIONS = Object.keys(GEO_RESTRICTED).length > 0;
