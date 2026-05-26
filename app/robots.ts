import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/panier"],
    },
    /* Brief 2026-05-27 favicon Google : la version canonique du site est
       www.wada.style (le 307 wada.style → www.wada.style le confirme).
       Sitemap doit pointer sur la MÊME version canonique, sinon Google
       hésite et garde le globe par défaut dans les SERP. */
    sitemap: "https://www.wada.style/sitemap.xml",
  };
}
