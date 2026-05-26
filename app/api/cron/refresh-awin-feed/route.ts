/**
 * GET /api/cron/refresh-awin-feed
 *
 * Brief 2026-05-28 (correctif Hobby timeout) :
 *   Le cron est désormais découpé en 2 phases pour tenir sous la limite
 *   60s du plan Vercel Hobby. Le mirroring des ~1 180 images Muji dans
 *   une seule invocation dépassait largement (~45-90s) → KV jamais écrit.
 *
 * PHASES (query param `?phase=`)
 *
 *   ?phase=ingest (DÉFAUT) — ~5-15s
 *     1. Fetch CSV.gz des flux Awin
 *     2. Parse + normalize + dédup + ΔE2000 palette match
 *     3. Préserve `imageLocal` du snapshot KV précédent (id identique)
 *     4. Écrit en KV sous `wada:products`
 *     5. Aucun téléchargement d'image — c'est le job de la phase mirror
 *
 *   ?phase=mirror&batch=N — ~10-20s pour N=50
 *     1. Lit `wada:products` depuis KV
 *     2. Sélectionne les N premiers produits sans `imageLocal`
 *     3. Download + upload Vercel Blob
 *     4. Update les produits modifiés dans `wada:products`
 *     N max = 80 (sécurité : ~30s pour 80 images à concurrency 10)
 *
 *   ?phase=all — comportement legacy (timeout probable sur Hobby)
 *
 * USAGE typique post-déploiement :
 *   curl /api/cron/refresh-awin-feed?phase=ingest             ← 1× : remplit KV
 *   curl /api/cron/refresh-awin-feed?phase=mirror&batch=50    ← répété : ~25 fois
 *
 * SCHEDULE Vercel cron quotidien (vercel.json) :
 *   tape `phase=ingest` par défaut. Si tu veux que le mirror se fasse aussi
 *   automatiquement, ajoute un 2e cron qui appelle `?phase=mirror&batch=50`
 *   toutes les heures par exemple.
 *
 * Configuration d'env :
 *   AWIN_DATAFEED_URLS=[{"slug":"muji","url":"..."}]
 *   CRON_SECRET=<string-aleatoire>
 *   KV_REST_API_URL + KV_REST_API_TOKEN  (auto via Vercel KV)
 *   BLOB_READ_WRITE_TOKEN                (auto via Vercel Blob, mirror only)
 *
 * Sécurité : header `Authorization: Bearer <CRON_SECRET>` requis quand
 * la variable CRON_SECRET est définie.
 */
import { ingestAwinCsv } from "@/lib/awinFeed";
import type { ProduitAwin } from "@/lib/schema";
import { gunzipSync } from "node:zlib";
import { uploadRemoteImage, uploadBatch } from "@/lib/imageStorage";
import { readAllProducts, writeAllProducts } from "@/lib/productStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Limite Hobby = 60s. On reste sous pour éviter le SIGKILL.
export const maxDuration = 60;

interface FeedConfig {
  slug: string;
  url: string;
}

/* Brief 2026-05-28 : helpers KV déplacés dans lib/productStore.ts, avec
   chunking en wada:products:chunk:N (limite 1MB Upstash) + logs explicites.
   Le cron utilise readAllProducts() / writeAllProducts() depuis ce module. */

/* ──────────────────────────────────────────────────────────────────────
   PHASE INGEST — fetch CSV + parse + dédup + write KV (no image mirror)
   ────────────────────────────────────────────────────────────────────── */

async function runIngest(feeds: FeedConfig[]) {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "WADA-feed-ingest/1.0" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} pour ${feed.slug}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const looksGzippedByUrl = /\.gz(\?|$)|gzip/i.test(feed.url);
      const looksGzippedByCT =
        (res.headers.get("content-encoding") || "").includes("gzip") ||
        (res.headers.get("content-type") || "").includes("gzip");
      const looksGzippedByMagic = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
      const isGzipped = looksGzippedByUrl || looksGzippedByCT || looksGzippedByMagic;
      const csv = isGzipped ? gunzipSync(buf).toString("utf-8") : buf.toString("utf-8");
      const { products, stats } = ingestAwinCsv(csv);
      return { slug: feed.slug, products, stats };
    })
  );

  const allProducts: ProduitAwin[] = [];
  const merchantStats: Record<string, unknown> = {};
  const errors: Array<{ slug: string; error: string }> = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const feed = feeds[i];
    if (r.status === "fulfilled") {
      allProducts.push(...r.value.products);
      merchantStats[feed.slug] = r.value.stats;
    } else {
      errors.push({
        slug: feed.slug,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  }

  /* Préserve les `imageLocal` déjà mirrorés du snapshot précédent. Sans ça,
     chaque ingest réinitialiserait le travail de mirror déjà fait. */
  const previousById = new Map<string, ProduitAwin>();
  for (const p of await readAllProducts()) previousById.set(p.id, p);

  let imagesReused = 0;
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const prev = previousById.get(p.id);
    if (prev?.imageLocal && prev.image === p.image) {
      allProducts[i] = { ...p, imageLocal: prev.imageLocal };
      imagesReused++;
    }
  }

  console.log(`[INGEST] writing ${allProducts.length} products to KV (chunked)`);
  const storage = await writeAllProducts(allProducts);
  console.log(`[INGEST] storage result: ok=${storage.ok}, chunks=${storage.chunks}, totalBytes=${storage.total_bytes}, failed=${storage.failed_chunks.length}`);

  return {
    ok: storage.ok,
    phase: "ingest",
    merchants: feeds.length,
    products_total: allProducts.length,
    images_reused_from_previous: imagesReused,
    stats: merchantStats,
    errors,
    storage,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   PHASE MIRROR — process N images sans imageLocal, update KV
   ────────────────────────────────────────────────────────────────────── */

async function runMirror(batchSize: number, force: boolean = false) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      phase: "mirror",
      error: "BLOB_READ_WRITE_TOKEN absent — connecter Vercel Blob d'abord",
    };
  }

  const products = await readAllProducts();
  if (products.length === 0) {
    return {
      ok: false,
      phase: "mirror",
      error: "KV vide — lancer ?phase=ingest d'abord",
    };
  }

  // Sélectionne les N premiers à mirrorer.
  // Mode normal : skip ceux qui ont déjà un imageLocal.
  // Brief « Page Tenue maître » P0-2 (24/05) — quand on passe `?force=1`,
  // on re-mirror TOUT, y compris les produits déjà mirrorés, pour remplacer
  // les anciens blobs 200px par les nouveaux hi-res (largeImage ~1280px).
  // À utiliser une fois après le déploiement du fix puis revenir au mode
  // normal pour ne pas re-uploader inutilement.
  const todo: { product: ProduitAwin; index: number }[] = [];
  for (let i = 0; i < products.length && todo.length < batchSize; i++) {
    const p = products[i];
    if (!force && p.imageLocal) continue;
    if (!p.image && !p.largeImage) continue;
    todo.push({ product: p, index: i });
  }

  if (todo.length === 0) {
    return {
      ok: true,
      phase: "mirror",
      done: true,
      message: "Tous les produits sont déjà mirrorés.",
      products_total: products.length,
    };
  }

  // Brief « Page Tenue maître » P0-2 (24/05) — bug critique :
  // on uploadait `product.image` qui pointe sur `aw_image_url` (~200px).
  // Résultat : toutes les cartes /ma-tenue affichaient une vignette
  // agrandie → flou. Le CSV Awin contient aussi `large_image` (CDN MUJI,
  // ~1280px) dispo dans `product.largeImage`. On télécharge celui-là en
  // priorité ; fallback sur `product.image` si absent ou échec.
  const results = await uploadBatch(todo, async ({ product }) => {
    const pathBase = `awin/${product.marchandSlug || "merchant"}/${product.id.replace(/[^a-z0-9._-]/gi, "_")}`;
    const sourceUrl = product.largeImage || product.image;
    return await uploadRemoteImage(sourceUrl, pathBase);
  });

  let uploaded = 0;
  let failed = 0;
  const errorSamples: string[] = [];
  for (let j = 0; j < todo.length; j++) {
    const r = results[j];
    if ("url" in r) {
      products[todo[j].index] = { ...todo[j].product, imageLocal: r.url };
      uploaded++;
    } else {
      failed++;
      if (errorSamples.length < 3) errorSamples.push(r.error);
    }
  }

  console.log(`[MIRROR] writing ${products.length} products to KV after batch (uploaded=${uploaded}, failed=${failed})`);
  const storage = await writeAllProducts(products);
  const remaining = products.filter((p) => !p.imageLocal && p.image).length;

  return {
    ok: true,
    phase: "mirror",
    batch_processed: todo.length,
    uploaded,
    failed,
    error_samples: errorSamples,
    remaining_to_mirror: remaining,
    products_total: products.length,
    storage,
    next: remaining > 0
      ? `Relancer ?phase=mirror&batch=${batchSize} pour traiter les ${remaining} restants.`
      : "Mirror complet — tous les produits ont un imageLocal.",
  };
}

/* ══════════════════════════════════════════════════════════════════════
   ROUTE — dispatch sur phase
   ══════════════════════════════════════════════════════════════════════ */

export async function GET(req: Request) {
  // Sécurité cron
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Config feeds
  let feeds: FeedConfig[];
  try {
    feeds = JSON.parse(process.env.AWIN_DATAFEED_URLS || "[]");
  } catch {
    return Response.json({ ok: false, error: "AWIN_DATAFEED_URLS invalide" });
  }
  if (feeds.length === 0) {
    return Response.json({
      ok: false,
      configured: false,
      message: "AWIN_DATAFEED_URLS vide.",
    });
  }

  // Phase routing
  const url = new URL(req.url);
  const phase = (url.searchParams.get("phase") || "ingest").toLowerCase();
  const batchRaw = parseInt(url.searchParams.get("batch") || "", 10);
  const batchSize = Math.min(
    Math.max(Number.isFinite(batchRaw) ? batchRaw : 50, 1),
    80,
  );

  const t0 = Date.now();
  let payload: object;

  if (phase === "mirror") {
    const force = url.searchParams.get("force") === "1";
    payload = await runMirror(batchSize, force);
  } else if (phase === "ingest") {
    payload = await runIngest(feeds);
  } else {
    return Response.json({
      ok: false,
      error: `phase inconnue : ${phase}. Utiliser ?phase=ingest ou ?phase=mirror&batch=N`,
    });
  }

  return Response.json({
    ...payload,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - t0,
  });
}
