import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/palettes",
  title: "Les 348 palettes — quelle combinaison de couleurs vous plaît ?",
  description: "Le dictionnaire complet de Sanzo Wada (1933) — 348 palettes chromatiques, chacune transformée en tenue complète shoppable.",
});

export default function PalettesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
