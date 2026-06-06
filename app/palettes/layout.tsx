import { pageMetadata } from "@/lib/pageMetadata";

/**
 * ISR (Incremental Static Regeneration) — revalidate every 1 hour.
 *
 * Benefits:
 * - No serverless function invocations for up to 1 hour (cost + latency)
 * - Instant page loads (CDN cache hit from edge servers)
 * - SEO-friendly (static HTML, crawler-friendly)
 * - Automatic background regeneration after 1h (dictionary updates weekly)
 *
 * Trade-off: Palettes are up to 1 hour stale (acceptable, changes are weekly)
 */
export const revalidate = 3600; // 1 hour in seconds

export const metadata = pageMetadata({
  path: "/palettes",
  title: "Les 348 palettes — quelle combinaison de couleurs vous plaît ?",
  description: "Le dictionnaire complet de Sanzo Wada (1933) — 348 palettes chromatiques, chacune transformée en tenue complète shoppable.",
});

export default function PalettesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
