import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/affiliation",
  title: "Transparence affiliation — comment WADA est financé",
  description: "WADA est gratuit grâce à l'affiliation : quand vous achetez via nos liens, nous touchons une commission sans impact sur votre prix. Détails complets.",
});

export default function AffiliationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
