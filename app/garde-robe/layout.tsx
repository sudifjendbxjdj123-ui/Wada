import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/garde-robe",
  title: "Ma garde-robe — vos tenues sauvegardées",
  description: "Toutes les tenues que vous avez composées sur WADA, prêtes à reprendre.",
  noindex: true,
});

export default function GardeRobeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
