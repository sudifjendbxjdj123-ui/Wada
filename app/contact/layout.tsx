import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/contact",
  title: "Contact — joindre l'équipe WADA",
  description: "Une question, une suggestion, un partenariat ? Contactez WADA à hello@wada.style.",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
