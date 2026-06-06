import type { MetadataRoute } from "next";
import { dictionary } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.wada.style";
  const now = new Date();

  const staticPages = [
    { url: base, priority: 1.0, changeFrequency: "weekly" as const },
    { url: `${base}/palettes`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${base}/atelier`, priority: 0.9, changeFrequency: "weekly" as const },
    { url: `${base}/scanner`, priority: 0.85, changeFrequency: "monthly" as const },
    { url: `${base}/stylist`, priority: 0.85, changeFrequency: "monthly" as const },
    { url: `${base}/couleurs`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${base}/decouverte`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${base}/calendrier`, priority: 0.6, changeFrequency: "daily" as const },
    { url: `${base}/cultures`, priority: 0.7, changeFrequency: "monthly" as const },
    /* Brief maître 2026-05-28 : /garde-robe a été fusionnée sur /favoris.
       Retirée du sitemap pour ne pas indexer la redirection. */
    { url: `${base}/ma-tenue`, priority: 0.7, changeFrequency: "weekly" as const },
    { url: `${base}/capsule`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${base}/composer`, priority: 0.85, changeFrequency: "monthly" as const },
    { url: `${base}/tarifs`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/about`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${base}/faq`, priority: 0.4, changeFrequency: "monthly" as const },
    { url: `${base}/contact`, priority: 0.3, changeFrequency: "yearly" as const },
    { url: `${base}/favoris`, priority: 0.3, changeFrequency: "yearly" as const },
    // Pages pro pour les Account Managers + transparence affiliation
    { url: `${base}/partenaires`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${base}/affiliation`, priority: 0.5, changeFrequency: "monthly" as const },
    /* Fix 2026-06-06 « SEO » : la boutique et ses catégories n'étaient PAS
       dans le sitemap → Google ne les découvrait pas. On les ajoute avec
       une priorité élevée (pages commerciales). */
    { url: `${base}/boutique`, priority: 0.85, changeFrequency: "daily" as const },
    { url: `${base}/vetements`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${base}/chaussures`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${base}/accessoires`, priority: 0.8, changeFrequency: "daily" as const },
    { url: `${base}/sacs`, priority: 0.75, changeFrequency: "daily" as const },
    { url: `${base}/bijoux`, priority: 0.75, changeFrequency: "daily" as const },
    { url: `${base}/marques`, priority: 0.7, changeFrequency: "weekly" as const },
    // Pages légales (priorité basse mais indexées pour conformité)
    { url: `${base}/mentions`, priority: 0.2, changeFrequency: "yearly" as const },
    { url: `${base}/cgv`, priority: 0.2, changeFrequency: "yearly" as const },
    { url: `${base}/confidentialite`, priority: 0.2, changeFrequency: "yearly" as const },
  ].map((p) => ({ ...p, lastModified: now }));

  // Une page par palette
  const palettePages = dictionary.map((p) => ({
    url: `${base}/palette/${p.number}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...palettePages];
}
