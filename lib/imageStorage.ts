/**
 * imageStorage — upload d'images marchand sur Vercel Blob (notre CDN).
 *
 * Brief 2026-05-27 Muji integration :
 *   MUJI/Awin bloquent le hotlink cross-domain (CORS/Referer). Solution :
 *   on télécharge chaque image côté serveur depuis l'URL marchand, on
 *   l'upload sur Vercel Blob, et c'est l'URL Blob qu'on stocke (`imageLocal`).
 *   Le site affiche TOUJOURS `imageLocal`, jamais l'URL marchand directe.
 *
 * Idempotence :
 *   Pathname stable basé sur l'ID produit (`muji/<merchant-slug>/<id>.jpg`).
 *   Avec `allowOverwrite: true`, ré-uploader la MÊME pathname remplace les
 *   bytes en place, l'URL Blob reste stable. Donc le cron peut re-tourner
 *   sans peupler le store de doublons.
 *
 * Skip incrémental :
 *   Le caller (cron) doit comparer l'URL marchand actuelle au snapshot KV
 *   précédent et NE PAS RE-DOWNLOAD si elle est identique. C'est l'astuce
 *   qui évite de saturer Vercel Blob + bande passante Muji à chaque cron.
 *
 * Setup :
 *   1. Vercel Dashboard → Storage → Create Blob Store → Connect to project
 *   2. La variable `BLOB_READ_WRITE_TOKEN` se pose automatiquement
 *   3. Sans BLOB_READ_WRITE_TOKEN → fonction renvoie null (no-op gracieux)
 */
import { put } from "@vercel/blob";

/* Concurrence des uploads — au-dessus de 10 on commence à voir des rate
   limits côté Muji (429). 10 est un bon compromis débit/safety. */
const UPLOAD_CONCURRENCY = 10;

/** Suffixe d'extension depuis un content-type ou une URL. Défaut .jpg. */
function extFromContentType(ct: string | null, urlStr: string): string {
  if (ct?.includes("png")) return "png";
  if (ct?.includes("webp")) return "webp";
  if (ct?.includes("avif")) return "avif";
  // Sinon on devine depuis l'URL
  const m = urlStr.match(/\.(jpe?g|png|webp|avif)(\?|$)/i);
  if (m) return m[1].toLowerCase().replace("jpeg", "jpg");
  return "jpg";
}

/**
 * Télécharge une image depuis `remoteUrl` et l'upload sur Vercel Blob
 * sous la pathname donnée. Retourne l'URL Blob publique stable.
 *
 * Retourne null si :
 *   - BLOB_READ_WRITE_TOKEN absent (Blob pas configuré)
 *   - download a échoué (HTTP non-2xx)
 *   - upload a échoué
 *
 * Ne lance JAMAIS — c'est utilisé dans une boucle d'ingestion qui doit
 * survivre aux échecs individuels.
 */
/** Résultat de l'upload — soit l'URL Blob, soit le code d'erreur (pour debug). */
export type UploadResult = { url: string } | { error: string };

export async function uploadRemoteImage(
  remoteUrl: string,
  pathnameBase: string,
): Promise<UploadResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "no-token" };
  if (!remoteUrl) return { error: "empty-url" };

  let res: Response;
  try {
    res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": "WADA-image-proxy/1.0",
        Referer: "https://www.wada.style/",
      },
      cache: "no-store",
    });
  } catch (err) {
    return { error: `fetch-throw:${err instanceof Error ? err.message : "unknown"}` };
  }
  if (!res.ok) return { error: `fetch-${res.status}` };

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) return { error: `tiny-${buf.length}b` };

  const ext = extFromContentType(res.headers.get("content-type"), remoteUrl);
  const pathname = `${pathnameBase}.${ext}`;

  try {
    const blob = await put(pathname, buf, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: res.headers.get("content-type") || `image/${ext}`,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
    });
    return { url: blob.url };
  } catch (err) {
    return { error: `put-throw:${err instanceof Error ? err.message : "unknown"}` };
  }
}

/**
 * Traite un tableau de tâches d'upload en parallèle bornée.
 * Préserve l'ordre des résultats (le i-ème résultat correspond à la i-ème
 * tâche). Les rejets retournent null à l'index correspondant.
 */
export async function uploadBatch<T>(
  items: T[],
  worker: (item: T) => Promise<UploadResult>,
): Promise<UploadResult[]> {
  const results: UploadResult[] = new Array(items.length).fill(null).map(() => ({ error: "pending" }));
  let cursor = 0;

  async function runner() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i]);
      } catch (err) {
        results[i] = { error: `worker-throw:${err instanceof Error ? err.message : "unknown"}` };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, items.length) },
    () => runner(),
  );
  await Promise.all(workers);
  return results;
}
