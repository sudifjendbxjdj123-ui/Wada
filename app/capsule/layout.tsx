import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/capsule",
  title: "La capsule WADA — 121 pièces essentielles quiet luxury",
  description: "L'inventaire éditorial WADA : 121 pièces curées dans l'esprit quiet luxury + 5 tenues capsule recomposées. Femme et homme.",
});

export default function CapsuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
