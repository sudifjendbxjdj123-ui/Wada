/**
 * WADA — Amazon Product Advertising API 5.0 (PA-API)
 * ─────────────────────────────────────────────────────────────────────────
 * Wrapper serveur pour l'API officielle Amazon.
 *
 * Activation (3 étapes) :
 *
 *   1. Compte Amazon Associates accepté ✓ (déjà fait — tag wadastyle-21)
 *   2. Atteindre 3 ventes via tes liens dans les 180 derniers jours
 *      → Amazon ouvre alors automatiquement l'accès à PA-API.
 *   3. Récupérer Access Key + Secret Key dans https://affiliate-program.amazon.com
 *      → Outils → Product Advertising API → Manage Your Credentials
 *
 * Variables d'environnement à définir dans .env.local (et sur Vercel) :
 *
 *   AMAZON_PAAPI_ACCESS_KEY = AKIA...
 *   AMAZON_PAAPI_SECRET_KEY = ...
 *   AMAZON_PAAPI_PARTNER_TAG = wadastyle-21   (déjà public)
 *   AMAZON_PAAPI_HOST = webservices.amazon.fr
 *   AMAZON_PAAPI_REGION = eu-west-1
 *
 * Sans ces clés, getProductByAsin() retourne un fallback statique pour les
 * ASINs connus (cf. STATIC_FALLBACKS) — le site continue de fonctionner.
 *
 * Limites PA-API : 1 req/sec, 8 640 req/jour gratuit. On cache donc 6h.
 * ─────────────────────────────────────────────────────────────────────── */

import { AMAZON_TAG } from "./amazonAffiliate";

/* ──────────────────────────────────────────────────────────────────────
   Types — structure normalisée d'un produit, indépendante de PA-API.
   On expose ces types à toute l'app pour pouvoir swap la source plus tard.
   ────────────────────────────────────────────────────────────────────── */

export type AmazonImage = {
  url: string;
  width: number;
  height: number;
};

export type AmazonProduct = {
  asin: string;
  title: string;
  brand: string;
  url: string;            // URL produit déjà avec tag wadastyle-21
  price?: string;         // ex: "129,00 €" — null si indispo
  priceMin?: number;      // ex: 129 — pour tri/filtre
  currency?: string;      // ex: "EUR"
  primaryImage?: AmazonImage;
  variantImages?: AmazonImage[];
  features?: string[];    // bullet points
  availability?: "in_stock" | "out_of_stock" | "unknown";
  /** Source — utile pour debug et pour distinguer live API vs fallback statique. */
  source: "paapi" | "static";
};

/* ──────────────────────────────────────────────────────────────────────
   Fallbacks statiques — utilisés tant que PA-API n'est pas activé.
   Permet d'afficher au moins le produit phare (Larroudé) sur le site
   avant les 3 ventes requises.
   ────────────────────────────────────────────────────────────────────── */

const STATIC_FALLBACKS: Record<string, Omit<AmazonProduct, "source">> = {
  // Larroudé — Sandale compensée Miso Brut — produit individuel curé
  "B0CGXLLXNY": {
    asin: "B0CGXLLXNY",
    title: "Sandale compensée Miso Brut",
    brand: "Larroudé",
    url: `https://www.amazon.fr/Larroud%C3%A9-Sandale-Compens%C3%A9e-Miso-Brut/dp/B0CGXLLXNY?th=1&psc=1&linkCode=ll2&tag=${AMAZON_TAG}`,
    // Pas d'image hot-linkée — on utilise un placeholder éditorial WADA
    // jusqu'à activation de PA-API (qui fournit des URLs autorisées)
    features: [
      "Compensée en bois naturel",
      "Cuir brut souple",
      "Sangle ajustable au coup-de-pied",
    ],
    availability: "unknown",
  },
};

/* ──────────────────────────────────────────────────────────────────────
   Configuration — lecture des env vars
   ────────────────────────────────────────────────────────────────────── */

function getConfig() {
  const accessKey  = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey  = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG || AMAZON_TAG;
  const host       = process.env.AMAZON_PAAPI_HOST   || "webservices.amazon.fr";
  const region     = process.env.AMAZON_PAAPI_REGION || "eu-west-1";
  return { accessKey, secretKey, partnerTag, host, region };
}

/** True si toutes les credentials PA-API sont présentes. */
export function isPaapiConfigured(): boolean {
  const { accessKey, secretKey } = getConfig();
  return Boolean(accessKey && secretKey);
}

/* ──────────────────────────────────────────────────────────────────────
   Signature AWS Signature V4 — requise pour PA-API.
   Implémentation Web Crypto API (compatible Next.js edge + node).
   ────────────────────────────────────────────────────────────────────── */

async function hmac(key: ArrayBuffer | Uint8Array, msg: string): Promise<ArrayBuffer> {
  // Convert to ArrayBuffer to satisfy strict BufferSource typing on importKey()
  const keyBuf: ArrayBuffer = key instanceof Uint8Array
    ? (key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer)
    : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(msg));
}

async function sha256Hex(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(payload: string, target: string): Promise<{ headers: Record<string, string>; body: string }> {
  const { accessKey, secretKey, host, region } = getConfig();
  if (!accessKey || !secretKey) throw new Error("PA-API credentials missing");

  const service = "ProductAdvertisingAPI";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = "/paapi5/getitems";
  const canonicalQuerystring = "";
  const payloadHash = await sha256Hex(payload);
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = "content-encoding;host;x-amz-date;x-amz-target";

  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

  // Signing key
  const kDate    = await hmac(new TextEncoder().encode("AWS4" + secretKey), dateStamp);
  const kRegion  = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = toHex(await hmac(kSigning, stringToSign));

  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    headers: {
      "content-encoding": "amz-1.0",
      "content-type":     "application/json; charset=utf-8",
      "host":             host,
      "x-amz-date":       amzDate,
      "x-amz-target":     target,
      "authorization":    authorizationHeader,
    },
    body: payload,
  };
}

/* ──────────────────────────────────────────────────────────────────────
   GetItems — récupère 1 à 10 produits par ASIN
   Doc : https://webservices.amazon.com/paapi5/documentation/get-items.html
   ────────────────────────────────────────────────────────────────────── */

type PaapiItemsResponse = {
  ItemsResult?: {
    Items?: Array<{
      ASIN: string;
      DetailPageURL?: string;
      ItemInfo?: {
        Title?: { DisplayValue?: string };
        ByLineInfo?: { Brand?: { DisplayValue?: string } };
        Features?: { DisplayValues?: string[] };
      };
      Offers?: {
        Listings?: Array<{
          Price?: { DisplayAmount?: string; Amount?: number; Currency?: string };
          Availability?: { Type?: string };
        }>;
      };
      Images?: {
        Primary?: { Large?: { URL: string; Width: number; Height: number } };
        Variants?: Array<{ Large?: { URL: string; Width: number; Height: number } }>;
      };
    }>;
  };
  Errors?: Array<{ Code: string; Message: string }>;
};

/**
 * Récupère un produit Amazon par son ASIN.
 * Si PA-API est configuré → fait la requête live (cache 6h via Next).
 * Sinon → retourne le fallback statique si l'ASIN est connu, ou null.
 */
export async function getProductByAsin(asin: string): Promise<AmazonProduct | null> {
  // Mode fallback : pas de clés API
  if (!isPaapiConfigured()) {
    const fb = STATIC_FALLBACKS[asin];
    if (!fb) return null;
    return { ...fb, source: "static" };
  }

  const { host, partnerTag } = getConfig();
  const payload = JSON.stringify({
    ItemIds: [asin],
    Resources: [
      "Images.Primary.Large",
      "Images.Variants.Large",
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "ItemInfo.Features",
      "Offers.Listings.Price",
      "Offers.Listings.Availability.Type",
    ],
    PartnerTag: partnerTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.fr",
  });

  try {
    const { headers, body } = await sign(payload, "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems");
    const res = await fetch(`https://${host}/paapi5/getitems`, {
      method: "POST",
      headers,
      body,
      // Cache Next.js : 6h. Permet de tenir les 8640 req/j sans souci.
      next: { revalidate: 21600 },
    });
    if (!res.ok) {
      console.warn("[paapi] HTTP", res.status, await res.text());
      const fb = STATIC_FALLBACKS[asin];
      return fb ? { ...fb, source: "static" } : null;
    }
    const data: PaapiItemsResponse = await res.json();
    const item = data.ItemsResult?.Items?.[0];
    if (!item) return null;

    const listing = item.Offers?.Listings?.[0];
    const primary = item.Images?.Primary?.Large;
    const variants = (item.Images?.Variants || [])
      .map((v) => v.Large)
      .filter(Boolean) as { URL: string; Width: number; Height: number }[];

    return {
      asin: item.ASIN,
      title: item.ItemInfo?.Title?.DisplayValue || "Produit Amazon",
      brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || "—",
      url: item.DetailPageURL || `https://www.amazon.fr/dp/${asin}?tag=${partnerTag}`,
      price: listing?.Price?.DisplayAmount,
      priceMin: listing?.Price?.Amount,
      currency: listing?.Price?.Currency,
      primaryImage: primary ? { url: primary.URL, width: primary.Width, height: primary.Height } : undefined,
      variantImages: variants.map((v) => ({ url: v.URL, width: v.Width, height: v.Height })),
      features: item.ItemInfo?.Features?.DisplayValues,
      availability:
        listing?.Availability?.Type === "Now" ? "in_stock" :
        listing?.Availability?.Type ? "out_of_stock" : "unknown",
      source: "paapi",
    };
  } catch (err) {
    console.warn("[paapi] error", err);
    const fb = STATIC_FALLBACKS[asin];
    return fb ? { ...fb, source: "static" } : null;
  }
}

/** Récupère plusieurs produits en une seule requête (max 10 par PA-API call). */
export async function getProductsByAsins(asins: string[]): Promise<AmazonProduct[]> {
  // Pour l'instant on appelle séquentiellement — à optimiser plus tard avec
  // un vrai batch GetItems (l'API accepte jusqu'à 10 ASINs par requête).
  const results = await Promise.all(asins.map(getProductByAsin));
  return results.filter((p): p is AmazonProduct => p !== null);
}

/** Liste des ASINs avec fallback statique. */
export const FALLBACK_ASINS = Object.keys(STATIC_FALLBACKS);
