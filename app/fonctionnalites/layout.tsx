import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/fonctionnalites",
  title: "Fonctionnalités WADA — tout ce que le site permet",
  description: "Scanner couleur, dictionnaire des 348 palettes, assistant IA, garde-robe, capsule, calendrier — vue d'ensemble des outils WADA.",
});

export default function FonctionnalitesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
