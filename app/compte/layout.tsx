import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/compte",
  title: "Mon compte WADA",
  description: "Gestion de votre compte WADA — profil, abonnement, préférences.",
  noindex: true,
});

export default function CompteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
