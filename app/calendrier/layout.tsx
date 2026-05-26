import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/calendrier",
  title: "Calendrier des palettes — une couleur par jour",
  description: "Chaque jour, WADA met à l'honneur une palette de Sanzo Wada. Un calendrier chromatique pour rythmer l'année.",
});

export default function CalendrierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
