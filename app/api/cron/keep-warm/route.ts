/**
 * GET /api/cron/keep-warm
 *
 * Brief 2026-06-11 (« attente trop longue ») — PING KEEP-WARM.
 *
 * Objectif : sous faible trafic, les instances serverless Vercel deviennent
 * froides et les caches mémoire (catalogue KV, pool de base par slot)
 * expirent. La 1ʳᵉ visite paie alors un cold start (~5s : boot + lecture des
 * ~350 chunks KV). Un ping périodique sur cet endpoint :
 *   1. garde au moins une instance chaude (Vercel réutilise l'instance tant
 *      qu'elle reçoit du trafic) ;
 *   2. REMPLIT les caches mémoire (readAllProducts + getBasePool via le vrai
 *      handler /api/products), dont le TTL est passé à 10 min (productStore
 *      CATALOG_TTL_MS) → entre deux pings de ~5 min le cache ne se vide jamais.
 * Résultat : la tenue se compose en ~0,7s même pour le premier visiteur.
 *
 * Déclenchement (plan Hobby = crons Vercel quotidiens seulement) :
 *   - Pinger externe (UptimeRobot 5 min / cron-job.org 1 min) sur l'URL
 *     publique https://www.wada.style/api/cron/keep-warm, OU
 *   - cron Vercel `*​/5 * * * *` dans vercel.json si passage au plan Pro.
 *
 * Lecture seule + idempotent (ne fait que réchauffer des caches) → pas de
 * secret requis. Inoffensif si appelé par n'importe qui.
 */
import { GET as productsGET } from "../../products/route";
import { readAllProducts } from "@/lib/productStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const t0 = Date.now();

  /* 1. Réchauffe le cache catalogue géo-neutre (la lecture KV coûteuse). */
  let catalogCount = 0;
  try {
    catalogCount = (await readAllProducts()).length;
  } catch { /* KV indispo : on renvoie ok:false plus bas */ }

  /* 2. Réchauffe le pool de base par slot + le chemin de matching via le vrai
     handler /api/products (un slot représentatif suffit ; getBasePool est
     partitionné une fois pour tous les slots). */
  let warmedSample = 0;
  try {
    const internal = new Request("https://internal/api/products?slot=haut&limit=1", {
      headers: req.headers,
    });
    const res = await productsGET(internal);
    const data = (await res.json()) as { products?: unknown[] };
    warmedSample = Array.isArray(data.products) ? data.products.length : 0;
  } catch { /* non bloquant */ }

  return Response.json(
    { ok: catalogCount > 0, catalog: catalogCount, warmedSample, ms: Date.now() - t0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}
