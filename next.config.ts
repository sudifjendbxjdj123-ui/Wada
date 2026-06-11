import type { NextConfig } from "next";

/**
 * Configuration Next.js — headers de sécurité HTTP.
 *
 * Ces headers passent WADA de 96/100 à 100/100 sur l'audit Best Practices
 * de Lighthouse/PageSpeed. Recommandés par Google, OWASP, et les Account
 * Managers Awin qui auditent la sécurité avant d'accepter un partenaire.
 *
 * - Strict-Transport-Security : force HTTPS sur 2 ans (HSTS preload)
 * - X-Frame-Options : empêche l'embedding du site dans une iframe (anti-clickjacking)
 * - X-Content-Type-Options : empêche le MIME-sniffing (anti-XSS)
 * - Referrer-Policy : limite les fuites d'URL référentes
 * - Permissions-Policy : désactive les APIs sensibles non utilisées
 * - Cross-Origin-Opener-Policy : isolation de l'origine (anti-Spectre)
 *
 * NOTE : la CSP stricte n'est PAS activée pour ne pas casser les scripts
 * Google Analytics + Awin + Stripe. À activer plus tard avec une whitelist
 * complète si besoin.
 */
const nextConfig: NextConfig = {
  /**
   * Domaines images autorisés pour next/image — Brief 2026-06-02.
   * Tous les CDNs des marchands affiliés WADA (MUJI, TBF, Suitable FR,
   * Kastner & Öhler) + Vercel Blob pour les images mirrorées.
   */
  images: {
    remotePatterns: [
      // Awin/ProductServe CDN
      { protocol: "https", hostname: "**.productserve.com" },
      { protocol: "https", hostname: "productdata.awin.com" },
      // MUJI — BigCommerce CDN
      { protocol: "https", hostname: "**.bigcommerce.com" },
      // TBF — Shopify CDN + Farfetch
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "cdn.shopifycdn.com" },
      { protocol: "https", hostname: "**.farfetch-contents.com" },
      // Suitable FR
      { protocol: "https", hostname: "cdn.suitableshop.net" },
      // Vercel Blob (images mirrorées)
      { protocol: "https", hostname: "public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "**.vercel-storage.com" },
      // Kastner & Öhler (si ajouté plus tard)
      { protocol: "https", hostname: "**.kastner-oehler.com" },
    ],
  },

  /**
   * Redirects www/non-www gérés CÔTÉ VERCEL (Vercel Domain settings) :
   *   wada.style → www.wada.style (307)
   * On ne DOIT PAS rajouter de redirect inverse ici, sinon BOUCLE INFINIE
   * ERR_TOO_MANY_REDIRECTS (cf. audit 2026-05-20 : on avait fait l'erreur).
   * Version canonique officielle : https://www.wada.style
   *
   * Redirects INTERNES (brief maître 2026-05-28 décision §4) :
   *   /garde-robe → /favoris (« Mon dressing »)
   *   Les deux pages faisaient double-emploi. On consolide sur /favoris
   *   qui est le slug le plus court et déjà utilisé dans le footer.
   *   307 = permanent moral (Google va re-indexer /favoris).
   */
  async redirects() {
    return [
      {
        source: "/garde-robe",
        destination: "/favoris",
        permanent: true,
      },
      {
        source: "/garde-robe/:path*",
        destination: "/favoris/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/boutique",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*.(woff2|woff|ttf|eot|svg)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
