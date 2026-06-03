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
  /* Brief 2026-05-30 — TBF (The Business Fashion) héberge ses images
     sur Shopify, AWS et Cloudinary selon les marques. Sans ces hosts
     en whitelist, le proxy bloque → cartes produit TBF avec zone
     blanche au lieu de la photo. Ces CDN sont publics, pas de risque
     SSRF accru (ils ne servent pas de services internes). */
  "shopify.com",                  // cdn.shopify.com (TBF majoritaire)
  "farfetch-contents.com",        // cdn-images.farfetch-contents.com — TBF
                                  //   majoritaire pour Rick Owens / Belstaff /
                                  //   Jacquemus / Bathing Ape (Farfetch est le
                                  //   distributeur réseau de ces marques luxury).
  "cloudfront.net",               // AWS CDN (utilisé par plusieurs marques luxury)
  "amazonaws.com",                // S3 direct
  "cloudinary.com",               // CDN très courant en e-commerce
  "akamaized.net",                // Akamai (gros marchands)
  "scene7.com",                   // Adobe Scene7 (utilisé par certaines marques)
  // Suitable FR CDN — cdn.suitableshop.net (ajout 2026-06-02)
  "suitableshop.net",
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

  /* Fetch côté serveur. Brief 2026-05-30 : User-Agent "WADA-image-proxy/1.0"
     se faisait rate-limit (HTTP 429) par Farfetch et d'autres CDN protégés.
     On passe à un UA navigateur standard + Referer = host de l'image (Farfetch
     accepte les requêtes qui semblent venir de leur propre site, refuse les
     bots identifiables). cache: "force-cache" + maxage permet à fetch() de
     réutiliser les images en mémoire serveur entre requêtes, ce qui réduit
     les hits côté CDN upstream. */
  let upstream: Response;
  try {
    upstream = await fetch(remote.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Referer: `${remote.protocol}//${remote.hostname}/`,
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      cache: "force-cache",
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
