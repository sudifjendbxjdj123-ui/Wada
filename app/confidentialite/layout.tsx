import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/confidentialite",
  title: "Politique de confidentialité",
  description: "Comment WADA traite vos données personnelles — RGPD, cookies, conservation, droits utilisateur.",
});

export default function ConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
