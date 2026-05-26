import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/about",
  title: "À propos — l'histoire de WADA",
  description: "WADA est né d'une idée simple : rendre le style plus facile. Le dictionnaire de 348 palettes de Sanzo Wada (1933) réinterprété en tenues du quotidien.",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
