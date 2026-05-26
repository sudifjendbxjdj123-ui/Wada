import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/decouverte",
  title: "Découverte — la jeune maison de la semaine",
  description: "Chaque semaine, WADA met à l'honneur une jeune maison de mode triée sur le volet. Découvertes éditoriales et histoires de marques.",
});

export default function DecouverteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
