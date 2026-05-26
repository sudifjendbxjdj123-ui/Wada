import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/mentions",
  title: "Mentions légales",
  description: "Informations légales WADA — éditeur, hébergeur, responsable de publication.",
});

export default function MentionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
