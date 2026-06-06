import { pageMetadata } from "@/lib/pageMetadata";

/**
 * ISR — revalidate every 7 days.
 * Cultures page is static (based on dictionary data). Benefits from caching since
 * cultural classifications don't change frequently.
 */
export const revalidate = 604800; // 7 days in seconds

export const metadata = pageMetadata({
  path: "/cultures",
  title: "Cultures du monde — palettes par origine géographique",
  description: "Les 348 palettes Sanzo Wada classées par culture : française, japonaise, italienne, anglaise, marocaine, indienne, russe, mexicaine, et plus.",
});

export default function CulturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
