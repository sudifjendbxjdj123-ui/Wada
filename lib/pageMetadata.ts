import type { Metadata } from "next";

/**
 * Helper pour générer la metadata d'une page avec canonical/og:url corrects.
 *
 * Pourquoi ce helper : audit du 2026-05-20 a révélé que toutes les pages
 * WADA renvoyaient le MÊME canonical (`https://wada.style/`) et `og:url`,
 * ce qui dit à Google que toutes les pages internes sont des doublons de
 * l'accueil. Risque de désindexation des pages internes.
 *
 * Convention : on utilise `https://www.wada.style` (AVEC www) comme version
 * canonique. C'est la version que Vercel sert nativement ; la non-www
 * redirige 307 vers la www via la config Vercel Domains.
 * ⚠️ Ne PAS rajouter de redirect inverse dans next.config.ts — boucle.
 *
 * Usage typique — dans un layout.tsx server-component (pas dans une page
 * "use client" qui ne peut pas exporter metadata) :
 *
 *   import { pageMetadata } from "@/lib/pageMetadata";
 *   export const metadata = pageMetadata({
 *     path: "/atelier",
 *     title: "L'atelier WADA — 8 outils pour explorer votre style",
 *     description: "Scanner couleur, créer une tenue, assistant IA...",
 *   });
 */
export function pageMetadata(opts: {
  path: string;             // ex: "/atelier" — toujours commencer par "/"
  title: string;
  description?: string;
  image?: string;           // override OG image (default = /og-image.svg)
  noindex?: boolean;        // pour les pages internes type /compte
  /**
   * Brief Pinterest Rich Pins (25/05) — type d'OG. Détermine quel
   * format Rich Pin Pinterest applique au pin :
   *   - "website" (défaut) : Pas de Rich Pin (juste pin simple)
   *   - "article" : Article Rich Pin (titre + extrait + auteur)
   *
   * Note : Pinterest supporte aussi les Product Rich Pins via og:type=
   * product, mais l'API Metadata de Next.js ne le typant pas, on s'appuie
   * sur la JSON-LD Schema.org/Product directement émise sur la piece page
   * (cf. task #68). Pinterest scrape OG OU JSON-LD, l'un suffit.
   */
  ogType?: "website" | "article";
  /** Pour ogType=article — date de publication ISO (article:published_time). */
  publishedTime?: string;
  /** Pour ogType=article — nom de l'auteur (article:author). */
  author?: string;
}): Metadata {
  const base = "https://www.wada.style";
  const fullUrl = `${base}${opts.path === "/" ? "" : opts.path}`;
  /* Brief audit (25/05) : default OG image migré de `.svg` (rejetée par
     LinkedIn / Slack / certains crawlers legacy) vers `/opengraph-image`
     (PNG 1200×630 généré par Next.js opengraph-image.tsx à la racine).
     L'ancien `og-image.svg` reste dans `public/` pour compat des liens
     externes pré-existants, mais n'est plus la valeur par défaut. */
  const imageUrl = opts.image
    ? (opts.image.startsWith("http") ? opts.image : `${base}${opts.image}`)
    : `${base}/opengraph-image`;

  const ogType = opts.ogType ?? "website";

  /* Brief Pinterest Rich Pins (25/05) — pour og:type=article, on enrichit
     l'OG metadata avec published_time + author. Pinterest et Facebook
     utilisent ces champs pour afficher un Article Rich Pin élégant. */
  const articleOg = ogType === "article" ? {
    publishedTime: opts.publishedTime ?? new Date("2026-05-01").toISOString(),
    authors: opts.author ? [opts.author] : ["WADA"],
  } : {};

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: fullUrl,
      siteName: "WADA",
      locale: "fr_FR",
      type: ogType,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: opts.title }],
      ...articleOg,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [imageUrl],
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
