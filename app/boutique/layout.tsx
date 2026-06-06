import { pageMetadata } from "@/lib/pageMetadata";

/**
 * Layout server pour la page /boutique — permet d'exporter metadata
 * sur une route "use client" (brief SEO audit 2026-06-06).
 *
 * Sans cette layout, /boutique/page.tsx (use client) ne pouvait pas
 * exporter metadata directement → Google voyait juste la metadata root
 * générique, pas le titre/description spécifique à la boutique.
 */
export const metadata = pageMetadata({
  path: "/boutique",
  title: "La boutique WADA — Découvrez 64 marques partenaires",
  description:
    "Explorez notre sélection de vêtements, chaussures, accessoires et bijoux, filtrés par palette Sanzō Wada. MUJI, The Business Fashion, Suitable FR et plus.",
});

export default function BoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
