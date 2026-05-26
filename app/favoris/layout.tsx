import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/favoris",
  title: "Mes favoris — palettes sauvegardées",
  description: "Retrouvez les palettes que vous avez mises de côté sur WADA.",
  noindex: true,
});

export default function FavorisLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
