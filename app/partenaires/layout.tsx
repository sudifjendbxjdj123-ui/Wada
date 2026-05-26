import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/partenaires",
  title: "Pour les marques partenaires — programme d'affiliation WADA",
  description: "Vous gérez un programme d'affiliation ? WADA est un magazine éditorial mode IA. Audience FR mode 25-45 ans, promotion contextuelle, zéro SEM marque.",
});

export default function PartenairesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
