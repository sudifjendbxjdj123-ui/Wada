/**
 * productStore — read/write produits Awin dans Upstash KV en CHUNKS.
 *
 * Brief 2026-05-28 (Upstash 1MB/value) :
 *   Le free tier (et le SET REST de toute façon) plafonne ~1MB par valeur.
 *   863 produits Muji avec descriptions, image URLs, deep-links… pèsent
 *   typiquement 1.5-2.5 MB en JSON. → écriture sous une clé unique
 *   échoue silencieusement (l'API REST renvoie un 200 selon les cas mais
 *   ne persiste rien).
 *
 *   On découpe maintenant en chunks de 200 produits par clé :
 *
 *     wada:products:meta          → { count, chunks, updatedAt }
 *     wada:products:chunk:0       → ProduitAwin[] (200 max)
 *     wada:products:chunk:1       → idem
 *     ...
 *
 *   Lecture : GET meta → GET chunk:0..meta.chunks-1 → concat → liste finale.
 *   Écriture : SET chacun puis SET meta en DERNIER (ainsi un read mid-write
 *   voit l'ancien jeu cohérent).
 *
 * Logs : les fonctions tracent en console.log avec préfixe « [KV] » —
 *   visible dans Vercel Function Logs pour debugger les écritures silencieuses.
 */
import type { ProduitAwin } from "./schema";

/** Taille d'un chunk en nombre de produits. 200 × ~2.5KB ≈ 500KB par valeur,
 *  bien sous la limite 1MB Upstash + marge pour les marchands à descriptions
 *  longues (Sézane, ZARA…). */
const CHUNK_SIZE = 200;

interface KvCreds {
  url: string;
  token: string;
}

function getCreds(): KvCreds | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

interface Meta {
  count: number;
  chunks: number;
  updatedAt: string;
}

/* ──────────────────────────────────────────────────────────────────────
   CACHE MÉMOIRE process-level — Brief 2026-06-10 (« améliore la rapidité »)
   ──────────────────────────────────────────────────────────────────────
   Avant : readAllProducts relisait meta + les ~350 chunks KV (~58 Mo) à
   CHAQUE appel. Une page /ma-tenue déclenche 5-15 appels /api/products (un
   par slot + retries) → autant de relectures complètes du catalogue → lent.
   Maintenant : on garde le catalogue en mémoire du process. Sur Vercel, une
   instance serverless chaude réutilise ce module entre requêtes, donc les
   appels rapprochés (même page, utilisateurs proches) repartent du cache.
   Le catalogue ne change qu'au cron quotidien (4h) + uploads ponctuels, et
   writeAllProducts invalide en plus le cache → on peut être généreux sur le TTL.
   PERF 2026-06-11 (« attente trop longue » / keep-warm) : 60s → 10 min. À 60s,
   une instance même CHAUDE re-lisait les ~350 chunks KV (~4s) toutes les
   minutes ; le coût « froid » revenait donc en permanence sous faible trafic.
   À 10 min, un ping keep-warm toutes les ~5 min (ou n'importe quel trafic
   organique) garde le cache plein en continu. Staleness max = 10 min après le
   refresh quotidien de 4h → sans impact (catalogue journalier). */
let _catalogCache: { data: ProduitAwin[]; at: number } | null = null;
const CATALOG_TTL_MS = 600_000;

/** Vide le cache mémoire du catalogue (appelé après une écriture KV). */
export function invalidateCatalogCache(): void {
  _catalogCache = null;
}

/* ──────────────────────────────────────────────────────────────────────
   READ
   ────────────────────────────────────────────────────────────────────── */

async function kvGetJson<T>(creds: KvCreds, key: string): Promise<T | null> {
  try {
    const r = await fetch(`${creds.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${creds.token}` },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const data = await r.json();
    const result = data?.result;
    if (typeof result === "string") {
      try { return JSON.parse(result) as T; } catch { return null; }
    }
    if (result === null || result === undefined) return null;
    return result as T;
  } catch {
    return null;
  }
}

/** Lit l'intégralité du catalogue depuis KV (concat des chunks). */
let _inFlight: Promise<ProduitAwin[]> | null = null;

export async function readAllProducts(): Promise<ProduitAwin[]> {
  // Cache mémoire : sert le catalogue sans relire KV si encore frais.
  if (_catalogCache && Date.now() - _catalogCache.at < CATALOG_TTL_MS) {
    return _catalogCache.data;
  }
  /* Single-flight : si une lecture KV est déjà en cours (ex. les 5 PieceCards
     d'une page /ma-tenue qui démarrent ensemble sur une instance FROIDE), on
     PARTAGE la même promesse au lieu de relire les 350 chunks N fois en
     parallèle (thundering herd au démarrage à froid). */
  if (_inFlight) return _inFlight;
  _inFlight = _readAllProductsFromKV();
  try {
    return await _inFlight;
  } finally {
    _inFlight = null;
  }
}

async function _readAllProductsFromKV(): Promise<ProduitAwin[]> {
  const creds = getCreds();
  if (!creds) {
    console.log("[KV] readAllProducts: KV not configured");
    return [];
  }

  // 1. Meta — donne le nombre de chunks à lire
  const meta = await kvGetJson<Meta>(creds, "wada:products:meta");

  // Backward-compat : si la nouvelle clé meta n'existe pas mais l'ancienne
  // clé monolithique « wada:products » existe (déploiement transitoire),
  // on retombe dessus pour ne pas planter le site.
  if (!meta || !meta.chunks) {
    const legacy = await kvGetJson<ProduitAwin[]>(creds, "wada:products");
    if (Array.isArray(legacy) && legacy.length > 0) {
      console.log(`[KV] readAllProducts: legacy single-key fallback, ${legacy.length} products`);
      return legacy;
    }
    console.log("[KV] readAllProducts: no meta, no legacy → empty");
    return [];
  }

  /* 2. Read les chunks par LOTS bornés (pas un Promise.all géant).
     Bug 2026-06-09 (K&Ö, catalogue ~70k → 350 chunks) : lancer 350 fetch
     REST Upstash simultanés depuis une fonction serverless saturait les
     connexions → beaucoup de GET échouaient en silence (kvGetJson catch →
     null → chunk manquant), donc le catalogue arrivait tronqué en prod
     (K&Ö quasi invisible) alors qu'il se lisait entièrement en local.
     Fix : on lit par lots de READ_BATCH, + une passe de retry sur les
     chunks manquants (les échecs Upstash sont surtout transitoires).

     NB 2026-06-11 : testé READ_BATCH 24 → 48 pour accélérer le cold start —
     AUCUN gain mesuré (cold ≈ 5s avant/après). Le coût froid est le boot
     serverless + la latence réseau Upstash, pas le nombre de rounds. Donc on
     RESTE à 24, la valeur sûre validée après l'incident de troncature du
     2026-06-09 (350 fetch simultanés saturaient les connexions). */
  const READ_BATCH = 24;
  const chunks: (ProduitAwin[] | null)[] = new Array(meta.chunks).fill(null);
  for (let start = 0; start < meta.chunks; start += READ_BATCH) {
    const end = Math.min(start + READ_BATCH, meta.chunks);
    const batch = await Promise.all(
      Array.from({ length: end - start }, (_, k) =>
        kvGetJson<ProduitAwin[]>(creds, `wada:products:chunk:${start + k}`),
      ),
    );
    for (let k = 0; k < batch.length; k++) chunks[start + k] = batch[k];
  }

  // Retry des chunks manquants (échecs transitoires de connexion/rate-limit).
  let missingIdx = chunks.map((c, i) => (Array.isArray(c) ? -1 : i)).filter((i) => i >= 0);
  if (missingIdx.length > 0) {
    console.log(`[KV] readAllProducts: retry ${missingIdx.length} chunks manquants`);
    for (let start = 0; start < missingIdx.length; start += READ_BATCH) {
      const slice = missingIdx.slice(start, start + READ_BATCH);
      const batch = await Promise.all(
        slice.map((i) => kvGetJson<ProduitAwin[]>(creds, `wada:products:chunk:${i}`)),
      );
      for (let k = 0; k < slice.length; k++) chunks[slice[k]] = batch[k];
    }
    missingIdx = chunks.map((c, i) => (Array.isArray(c) ? -1 : i)).filter((i) => i >= 0);
  }

  // 3. Concat avec compteur de diagnostic
  const all: ProduitAwin[] = [];
  for (const c of chunks) {
    if (Array.isArray(c)) all.push(...c);
  }
  if (missingIdx.length > 0) {
    console.log(`[KV] readAllProducts: ${missingIdx.length}/${meta.chunks} chunks STILL missing after retry`);
  }
  console.log(`[KV] readAllProducts: ${all.length}/${meta.count} products loaded from ${meta.chunks} chunks`);
  /* On ne met en cache QUE les lectures complètes (aucun chunk manquant) pour
     ne jamais servir un catalogue tronqué depuis le cache (cf. bug K&Ö). */
  if (missingIdx.length === 0 && all.length > 0) {
    _catalogCache = { data: all, at: Date.now() };
  }
  return all;
}

/* ──────────────────────────────────────────────────────────────────────
   WRITE
   ────────────────────────────────────────────────────────────────────── */

async function kvSetJson(creds: KvCreds, key: string, value: unknown): Promise<{ ok: boolean; error?: string; bytes?: number }> {
  const body = JSON.stringify(value);
  const bytes = Buffer.byteLength(body, "utf-8");
  // Garde-fou : si on dépasse 1MB on log un warning (mais on tente quand
  // même, certains tiers d'Upstash supportent jusqu'à 100MB).
  if (bytes > 1_000_000) {
    console.log(`[KV] kvSetJson WARN ${key}: ${(bytes / 1024 / 1024).toFixed(2)}MB (Upstash free limit = 1MB)`);
  }
  try {
    const r = await fetch(`${creds.url}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body,
    });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return { ok: false, error: `HTTP ${r.status} ${text.slice(0, 200)}`, bytes };
    }
    return { ok: true, bytes };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), bytes };
  }
}

/** Écrit l'intégralité du catalogue dans KV en chunks. Retourne stats détaillées. */
export async function writeAllProducts(products: ProduitAwin[]): Promise<{
  ok: boolean;
  chunks: number;
  total_bytes: number;
  failed_chunks: number[];
  errors: string[];
}> {
  const creds = getCreds();
  if (!creds) {
    return { ok: false, chunks: 0, total_bytes: 0, failed_chunks: [], errors: ["KV not configured"] };
  }

  const chunks: ProduitAwin[][] = [];
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    chunks.push(products.slice(i, i + CHUNK_SIZE));
  }
  console.log(`[KV] writeAllProducts: ${products.length} products → ${chunks.length} chunks of ${CHUNK_SIZE}`);

  let totalBytes = 0;
  const failedChunks: number[] = [];
  const errors: string[] = [];

  // 1. Écrit chaque chunk
  for (let i = 0; i < chunks.length; i++) {
    const res = await kvSetJson(creds, `wada:products:chunk:${i}`, chunks[i]);
    totalBytes += res.bytes || 0;
    if (!res.ok) {
      failedChunks.push(i);
      errors.push(`chunk:${i} → ${res.error}`);
      console.log(`[KV] FAIL chunk:${i} (${(res.bytes || 0)} bytes) — ${res.error}`);
    } else {
      console.log(`[KV] OK chunk:${i} (${chunks[i].length} products, ${(res.bytes || 0)} bytes)`);
    }
  }

  // 2. Si tous les chunks sont OK, écrit le meta en dernier (point de bascule)
  if (failedChunks.length === 0) {
    const meta: Meta = {
      count: products.length,
      chunks: chunks.length,
      updatedAt: new Date().toISOString(),
    };
    const metaRes = await kvSetJson(creds, "wada:products:meta", meta);
    if (!metaRes.ok) {
      errors.push(`meta → ${metaRes.error}`);
      console.log(`[KV] FAIL meta — ${metaRes.error}`);
      return { ok: false, chunks: chunks.length, total_bytes: totalBytes, failed_chunks: [], errors };
    }
    console.log(`[KV] OK meta (${chunks.length} chunks, ${products.length} products total)`);
    invalidateCatalogCache(); // le catalogue a changé → vide le cache mémoire
    // Nettoie l'ancienne clé monolithique pour économiser l'espace si présente
    try {
      await fetch(`${creds.url}/del/wada:products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${creds.token}` },
      });
    } catch { /* best-effort */ }
  }

  return {
    ok: failedChunks.length === 0,
    chunks: chunks.length,
    total_bytes: totalBytes,
    failed_chunks: failedChunks,
    errors,
  };
}
