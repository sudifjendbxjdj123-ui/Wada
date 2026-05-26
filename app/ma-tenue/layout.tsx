import { pageMetadata } from "@/lib/pageMetadata";

export const metadata = pageMetadata({
  path: "/ma-tenue",
  title: "Ma tenue — la silhouette WADA, pour vous",
  /* Brief audit 2026-05-28 §4 : description mise à jour. La génération
     d'image IA en haut de page a été retirée — la description évoque
     désormais les vraies pièces achetables (MUJI / Amazon partenaires). */
  description: "Votre tenue complète sélectionnée selon votre profil — 5 pièces réelles, photos, prix et achat direct chez le marchand (MUJI · Amazon partenaires).",
});

export default function MaTenueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
