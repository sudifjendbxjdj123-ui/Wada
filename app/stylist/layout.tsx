import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/stylist",
  title: "Assistant IA stylist — décrivez, l'IA trouve la palette",
  description: "Décrivez l'occasion, le style, la couleur ou l'humeur — l'assistant IA WADA vous propose la palette Sanzo Wada qui matche, avec sa tenue complète et ses marchands.",
});

export default function StylistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
