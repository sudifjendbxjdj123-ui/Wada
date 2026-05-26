import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/cultures",
  title: "Cultures du monde — palettes par origine géographique",
  description: "Les 348 palettes Sanzo Wada classées par culture : française, japonaise, italienne, anglaise, marocaine, indienne, russe, mexicaine, et plus.",
});

export default function CulturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
