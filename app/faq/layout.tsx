import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/faq",
  title: "FAQ — questions fréquentes sur WADA",
  description: "Comment fonctionne WADA, qui est Sanzo Wada, l'affiliation, les palettes, l'IA stylist — toutes les réponses.",
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
