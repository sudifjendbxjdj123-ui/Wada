import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/scanner",
  title: "Scanner une couleur — trouve la palette qui matche",
  description: "Photographiez n'importe quelle couleur, WADA identifie la palette Sanzo Wada la plus proche et propose une tenue complète. Analyse 100% locale, aucun upload.",
});

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
