import { pageMetadata } from "@/lib/pageMetadata";

/**
 * ISR — revalidate every 7 days.
 * Marques (brands) page is static. Brand information changes infrequently,
 * so 7-day cache is appropriate.
 */
export const revalidate = 604800; // 7 days in seconds

export const metadata = pageMetadata({
  path: "/marques",
  title: "Nos marques partenaires — Sélections mode WADA",
  description: "Découvrez les marques partenaires de WADA : mode responsable, qualité premium, prix accessibles.",
});

export default function MarquesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
