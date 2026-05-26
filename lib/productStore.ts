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
export async function readAllProducts(): Promise<ProduitAwin[]> {
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

  // 2. Read tous les chunks en parallèle
  const chunkPromises: Promise<ProduitAwin[] | null>[] = [];
  for (let i = 0; i < meta.chunks; i++) {
    chunkPromises.push(kvGetJson<ProduitAwin[]>(creds, `wada:products:chunk:${i}`));
  }
  const chunks = await Promise.all(chunkPromises);

  // 3. Concat avec compteur de diagnostic
  const all: ProduitAwin[] = [];
  let missingChunks = 0;
  for (const c of chunks) {
    if (Array.isArray(c)) all.push(...c);
    else missingChunks++;
  }
  if (missingChunks > 0) {
    console.log(`[KV] readAllProducts: ${missingChunks}/${meta.chunks} chunks missing/empty`);
  }
  console.log(`[KV] readAllProducts: ${all.length}/${meta.count} products loaded from ${meta.chunks} chunks`);
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
