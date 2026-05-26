/**
 * GET /api/img?u=<encoded-remote-url>
 *
 * Brief 2026-05-28 (correctif Hobby timeout) :
 *   Proxy d'image SERVER-SIDE. Sert de fallback quand un produit n'a pas
 *   encore son `imageLocal` posé par le cron mirror (phase 2). Le browser
 *   ne peut pas hotlinker l'URL Muji directement (CORS/Referer block) ;
 *   notre serveur, lui, peut fetch + ré-émettre.
 *
 *   Avantages vs hotlink :
 *     - Contourne les filtres CORS/Referer côté marchand
 *     - Cache CDN agressif (24h) → 99% des hits ne font pas de roundtrip
 *     - Pas d'attente du cron mirror pour voir les photos
 *
 *   Avantages vs mirror Blob :
 *     - Aucun stockage requis (pas de quota à gérer)
 *     - Pas de travail backfill — fonctionne tout de suite
 *
 *   Pourquoi quand même garder le mirror Blob :
 *     - URL Blob plus stable (jamais 404 si Muji retire l'image)
 *     - Pas de risque de proxy abuse si quelqu'un nous saute des images
 *
 * SÉCURITÉ — anti-SSRF :
 *   On whitelist STRICTEMENT les domaines marchand connus (Awin, Muji,
 *   etc.) pour empêcher un attaquant d'utiliser ce proxy pour scrapper
 *   un service interne ou émettre des requêtes vers 127.0.0.1.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Domaines autorisés en source. Ajouter au fil des partenariats.
 *  Le matching accepte sous-domaines : « productserve.com » autorise aussi
 *  « images2.productserve.com » (Awin sert depuis cette variante). */
const ALLOWED_HOSTS = [
  // Awin/ProductServe CDN — couvre images.productserve.com, images2., etc.
  "productserve.com",
  "productdata.awin.com",
  "awin.com",
  // Muji direct (au cas où l'URL pointe directement)
  "muji.com",
  // BigCommerce CDN parfois exposé en source (cdn11.bigcommerce.com)
  "bigcommerce.com",
];

function isAllowedHost(u: URL): boolean {
  return ALLOWED_HOSTS.some(
    (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("u");
  if (!target) {
    return Response.json({ error: "missing ?u=" }, { status: 400 });
  }

  // Parse + valide l'URL cible
  let remote: URL;
  try {
    remote = new URL(target);
  } catch {
    return Response.json({ error: "invalid URL" }, { status: 400 });
  }
  if (remote.protocol !== "https:" && remote.protocol !== "http:") {
    return Response.json({ error: "protocol forbidden" }, { status: 400 });
  }
  if (!isAllowedHost(remote)) {
    return Response.json(
      { error: "host not allowed", host: remote.hostname },
      { status: 403 },
    );
  }

  // Fetch côté serveur. Le User-Agent + Referer aident à contourner les
  // filtres de hotlink agressifs côté marchand.
  let upstream: Response;
  try {
    upstream = await fetch(remote.toString(), {
      headers: {
        "User-Agent": "WADA-image-proxy/1.0",
        Referer: "https://www.wada.style/",
        Accept: "image/*,*/*;q=0.8",
      },
      cache: "no-store",
      // Coupe au cas où le serveur upstream traîne — 8s suffisent pour une
      // image 200×200 (~20-50KB). Au-delà on émet un 504 propre.
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    return Response.json(
      { error: "upstream fetch failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 504 },
    );
  }

  if (!upstream.ok) {
    return Response.json(
      { error: "upstream non-OK", status: upstream.status },
      { status: 502 },
    );
  }

  const buf = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache CDN agressif : 24h public + 7j stale-while-revalidate
      // → les images marchand changent rarement, on évite les hits inutiles.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      // Bonus : autorise l'embed cross-origin (notre propre app)
      "Access-Control-Allow-Origin": "*",
    },
  });
}
