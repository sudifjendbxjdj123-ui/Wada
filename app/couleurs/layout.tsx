import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/couleurs",
  title: "Couleurs — explorez par teinte chromatique",
  description: "Cherchez les palettes Sanzo Wada par couleur dominante : brique, indigo, sauge, ocre, terracotta, et toutes les teintes du dictionnaire.",
});

export default function CouleursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
