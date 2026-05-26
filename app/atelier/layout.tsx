import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/atelier",
  title: "L'atelier WADA — 8 outils pour explorer votre style",
  description: "Scanner une couleur, créer une tenue, assistant IA stylist, explorer 348 palettes Sanzo Wada. Toutes les portes d'entrée WADA dans un seul sommaire.",
});

export default function AtelierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
