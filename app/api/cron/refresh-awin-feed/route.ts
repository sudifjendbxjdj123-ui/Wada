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
import { isAffiliated } from "@/lib/composer/occasionRules";

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
   PHASE VERIFY — auditer un flux candidat SANS toucher au catalogue.

   « On va installer toutes les marques sur Wada » (client 2026-08-23).
   Chaque marchand ajouté jusqu'ici a demandé un aller-retour de code
   (New Era, K&Ö, La Redoute, Spartoo…) parce qu'on découvrait ses
   particularités APRÈS l'avoir branché. Cette phase inverse l'ordre :
   on télécharge le flux, on le fait passer par le MÊME parseur que
   l'ingestion réelle, et on rend un rapport — produits gardés/écartés et
   pourquoi, marques trouvées, devise, genres, couverture images/tailles.
   Rien n'est écrit en KV : c'est un essayage, pas une installation.

   USAGE :
     /api/cron/refresh-awin-feed?phase=verify&url=<URL du flux Awin>
   (même Authorization: Bearer CRON_SECRET que les autres phases)

   Une fois le rapport satisfaisant, l'installation reste la même :
   ajouter {"slug":"...","url":"..."} à AWIN_DATAFEED_URLS puis relancer
   ?phase=ingest — aucun déploiement nécessaire.
   ────────────────────────────────────────────────────────────────────── */
async function runVerify(feedUrl: string) {
  let res: Response;
  try {
    res = await fetch(feedUrl, {
      headers: { "User-Agent": "WADA-feed-ingest/1.0" },
      signal: AbortSignal.timeout(45_000),
    });
  } catch (e) {
    return { ok: false, error: `Téléchargement impossible : ${e instanceof Error ? e.message : "réseau"}` };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: `HTTP ${res.status} — vérifier que l'URL vient bien de « Créer un flux » sur Awin et que le programme est approuvé.`,
    };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const looksGzipped = /\.gz(\?|$)|gzip/i.test(feedUrl) || (buf[0] === 0x1f && buf[1] === 0x8b);
  let csvText: string;
  try {
    csvText = looksGzipped ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  } catch {
    return { ok: false, error: "Fichier illisible (ni CSV ni CSV.gz valide)." };
  }

  const { products, stats } = ingestAwinCsv(csvText);

  /* Agrégats lisibles par un humain — c'est un rapport de décision, pas un
     dump. Chaque compteur répond à « ce flux vaut-il d'être installé ? ». */
  const parNom = (m: Map<string, number>, k: string | undefined) => {
    const cle = (k || "").trim();
    if (cle) m.set(cle, (m.get(cle) || 0) + 1);
  };
  const marques = new Map<string, number>();
  const marchands = new Map<string, number>();
  const devises = new Map<string, number>();
  const genres = new Map<string, number>();
  let avecImage = 0, avecTailles = 0, avecPrixBarre = 0, avecCouleur = 0;
  let prixMin = Infinity, prixMax = 0, sommePrix = 0;
  for (const p of products) {
    parNom(marques, p.marque);
    parNom(marchands, p.marchandSlug);
    parNom(devises, p.devise);
    parNom(genres, p.genre);
    if (p.image || p.largeImage) avecImage++;
    if (p.tailles?.length) avecTailles++;
    if (typeof p.prixOriginal === "number") avecPrixBarre++;
    if (p.couleurNom || p.hex) avecCouleur++;
    if (p.prix > 0) {
      prixMin = Math.min(prixMin, p.prix);
      prixMax = Math.max(prixMax, p.prix);
      sommePrix += p.prix;
    }
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([nom, count]) => ({ nom, produits: count }));
  /* Le piège qui a englouti The Shirt Company (757 produits ingérés, zéro
     affiché) : un slug absent de la liste d'affiliation est rejeté par
     /api/products APRÈS l'ingestion. Le rapport le dit noir sur blanc,
     marchand par marchand, plutôt que de laisser découvrir un catalogue
     vide en production. */
  const marchandsAnnotes = top(marchands, 5).map((m) => ({
    ...m,
    affilie: isAffiliated(m.nom),
  }));
  const avertissements = marchandsAnnotes
    .filter((m) => !m.affilie)
    .map((m) =>
      `Le slug « ${m.nom} » n'est pas encore affilié : ses produits seraient ` +
      `rejetés à l'affichage. Utiliser EXACTEMENT ce slug dans AWIN_DATAFEED_URLS ` +
      `(il devient alors affilié d'office), ou l'ajouter à WHITELIST_SOURCES.`);
  const pct = (n: number) => products.length ? Math.round((n / products.length) * 100) : 0;

  return {
    ok: true,
    phase: "verify",
    ecrit_en_kv: false,
    lignes_flux: stats.totalLines,
    produits_gardes: products.length,
    ecartes_au_parsing: stats.dropped,
    doublons_variantes_fusionnes: stats.parsed - stats.afterDedup,
    marchands: marchandsAnnotes,
    ...(avertissements.length ? { avertissements } : {}),
    marques_distinctes: marques.size,
    top_marques: top(marques, 15),
    devises: Object.fromEntries(devises),
    genres: Object.fromEntries(genres),
    couverture: {
      images: `${pct(avecImage)}%`,
      tailles: `${pct(avecTailles)}%`,
      prix_barre: `${pct(avecPrixBarre)}%`,
      couleur: `${pct(avecCouleur)}%`,
    },
    prix: products.length
      ? {
          min: Math.round(prixMin * 100) / 100,
          max: Math.round(prixMax * 100) / 100,
          moyen: Math.round((sommePrix / products.length) * 100) / 100,
        }
      : null,
    installation: {
      etape_1: "Ajouter {\"slug\":\"<slug>\",\"url\":\"<cette URL>\"} à AWIN_DATAFEED_URLS (Vercel → Settings → Environment Variables)",
      etape_2: "Relancer /api/cron/refresh-awin-feed?phase=ingest",
      etape_3: "Puis ?phase=mirror&batch=50 (répété) pour héberger les images",
    },
  };
}

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

  /* Snapshot précédent — sert à DEUX choses :
     1) préserver les `imageLocal` déjà mirrorés (sinon chaque ingest
        réinitialiserait le travail de mirror déjà fait) ;
     2) CONSERVER les marchands non rafraîchis par ce run (slug absent des
        produits frais). Brief New Era 2026-06-09 : avant, writeAllProducts
        réécrivait le KV avec UNIQUEMENT les flux configurés dans
        AWIN_DATAFEED_URLS → tout marchand chargé hors-cron (ex. New Era en
        one-shot) était effacé à la nuit suivante. Désormais on fusionne.
        Bonus : si un flux configuré échoue au fetch, ses produits sont
        conservés au lieu de disparaître sur une simple panne réseau. */
  const previous = await readAllProducts();
  const previousById = new Map<string, ProduitAwin>();
  for (const p of previous) previousById.set(p.id, p);

  let imagesReused = 0;
  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    const prev = previousById.get(p.id);
    if (prev?.imageLocal && prev.image === p.image) {
      allProducts[i] = { ...p, imageLocal: prev.imageLocal };
      imagesReused++;
    }
  }

  // Comptes par slug — avant (snapshot) et après (frais).
  const prevBySlug: Record<string, number> = {};
  for (const p of previous) prevBySlug[p.marchandSlug || ""] = (prevBySlug[p.marchandSlug || ""] || 0) + 1;
  const freshBySlug: Record<string, number> = {};
  for (const p of allProducts) freshBySlug[p.marchandSlug || ""] = (freshBySlug[p.marchandSlug || ""] || 0) + 1;

  /* GARDE-FOU anti-fetch-partiel — incident 2026-06-10 (Suitable 18k→2,8k,
     New Era 5,5k→0). Si un flux rafraîchi revient avec MOINS DE 50% du compte
     précédent pour ce marchand, on considère le téléchargement RATÉ (.csv.gz
     tronqué / panne réseau) → on EXCLUT ces produits frais et on RETIENT
     l'ancien snapshot pour ce slug. Évite de vider des milliers de produits. */
  const badSlugs = new Set<string>();
  for (const slug of Object.keys(freshBySlug)) {
    const before = prevBySlug[slug] || 0;
    if (before >= 200 && freshBySlug[slug] < before * 0.5) {
      badSlugs.add(slug);
      console.log(`[INGEST] GUARD partial-feed: ${slug} fresh=${freshBySlug[slug]} < 50% of ${before} → keeping previous snapshot`);
    }
  }
  const goodFresh = badSlugs.size > 0
    ? allProducts.filter((p) => !badSlugs.has(p.marchandSlug || ""))
    : allProducts;

  /* Slugs effectivement rafraîchis par CE run (et jugés sains) — dérivés des
     produits frais. On garde tout le reste tel quel (marchands non rafraîchis
     + marchands au fetch jugé partiel). */
  const refreshedSlugs = new Set(goodFresh.map((p) => p.marchandSlug || ""));
  const retained = previous.filter((p) => !refreshedSlugs.has(p.marchandSlug || ""));
  const retainedMerchants = [...new Set(retained.map((p) => p.marchandSlug || ""))];
  if (retained.length > 0) {
    console.log(`[INGEST] retaining ${retained.length} products (non-refreshed/guarded): ${retainedMerchants.join(", ")}`);
  }

  const merged = [...retained, ...goodFresh];

  /* GARDE-FOU anti-rétrécissement global : on refuse d'écrire un catalogue
     dramatiquement plus petit que le précédent (lecture tronquée du snapshot,
     plusieurs flux KO…). Si on écrirait <70% du compte précédent, on ABANDONNE
     — le KV garde l'ancien jeu intact plutôt que de subir une perte massive. */
  if (previous.length >= 1000 && merged.length < previous.length * 0.7) {
    console.log(`[INGEST] ABORT WRITE: merged ${merged.length} < 70% of previous ${previous.length} — refusing to shrink the catalog`);
    return {
      ok: false, phase: "ingest", aborted: "would_shrink_catalog",
      previous_total: previous.length, would_write: merged.length,
      products_refreshed: allProducts.length, bad_slugs: [...badSlugs],
      stats: merchantStats, errors,
    };
  }

  console.log(`[INGEST] writing ${merged.length} products to KV (chunked)`);
  const storage = await writeAllProducts(merged);
  console.log(`[INGEST] storage result: ok=${storage.ok}, chunks=${storage.chunks}, totalBytes=${storage.total_bytes}, failed=${storage.failed_chunks.length}`);

  return {
    ok: storage.ok,
    phase: "ingest",
    merchants: feeds.length,
    products_total: merged.length,
    products_refreshed: goodFresh.length,
    products_retained: retained.length,
    retained_merchants: retainedMerchants,
    guarded_partial_merchants: [...badSlugs],
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
  /* `verify` audite un flux qui n'est PAS encore installé : exiger que la
     liste soit déjà remplie interdirait de vérifier le tout premier. */
  const phasePrevue = (new URL(req.url).searchParams.get("phase") || "ingest").toLowerCase();
  if (feeds.length === 0 && phasePrevue !== "verify") {
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
  } else if (phase === "verify") {
    const feedUrl = url.searchParams.get("url");
    if (!feedUrl || !/^https?:\/\//.test(feedUrl)) {
      return Response.json({
        ok: false,
        error: "phase=verify demande ?url=<URL complète du flux Awin>",
      });
    }
    payload = await runVerify(feedUrl);
  } else {
    return Response.json({
      ok: false,
      error: `phase inconnue : ${phase}. Utiliser ?phase=ingest, ?phase=mirror&batch=N ou ?phase=verify&url=…`,
    });
  }

  return Response.json({
    ...payload,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - t0,
  });
}
