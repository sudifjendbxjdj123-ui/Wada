import { pageMetadata } from "@/lib/pageMetadata";

/**
 * ISR — revalidate every 7 days.
 * Marques (brands) page is static. Brand information changes infrequently,
 * so 7-day cache is appropriate.
 */
export const revalidate = 604800; // 7 days in seconds

export const metadata = pageMetadata({
  path: "/marques",
  title: "64 marques partenaires WADA — Nos sélections mode",
  description: "Découvrez les 64 marques partenaires WADA : MUJI, COS, Uniqlo, Lemaire, Stone Island, et bien d'autres. Mode responsable, qualité premium, prix accessibles.",
});

export default function MarquesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
