import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/cgv",
  title: "Conditions générales de vente",
  description: "CGV WADA — modalités d'abonnement, droit de rétractation, paiement.",
});

export default function CgvLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
