import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/panier",
  title: "Mon panier — pièces sélectionnées",
  description: "Les pièces que vous avez mises de côté pour acheter chez les marchands partenaires WADA.",
  noindex: true,
});

export default function PanierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
