import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/generateur",
  title: "Générateur de tenue — composez votre silhouette",
  description: "Choisissez une palette, composez votre tenue pièce par pièce. WADA propose les marchands qui vendent chaque article.",
});

export default function GenerateurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
