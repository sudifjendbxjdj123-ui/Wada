import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";

const SUB_MAP: Record<string, { q?: string }> = {
  "sacs-main":        { q: "sac à main handbag" },
  "sacs-bandouliere": { q: "bandoulière shoulder bag" },
  pochettes:          { q: "pochette clutch" },
  cabas:              { q: "cabas tote" },
  "sacs-dos":         { q: "sac à dos backpack" },
  sacoche:            { q: "sacoche messenger" },
  "sacs-voyage":      { q: "sac voyage travel" },
  tote:               { q: "tote bag fourre-tout" },
};

interface Props {
  params: Promise<{ sub?: string[] }>;
  searchParams: Promise<{ genre?: string; style?: string; page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const subSlug = sub?.[0];
  const label = subSlug
    ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Sacs";
  return {
    title: `${label} — WADA`,
    description: `Découvrez notre sélection de ${subSlug ?? "sacs"} filtrables par palette Sanzō Wada.`,
    alternates: { canonical: subSlug ? `/sacs/${subSlug}` : "/sacs" },
  };
}

export default async function SacsPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

  /* Fix 2026-08-20 « fausse page catégorie » : la route est un catch-all
     optionnel, donc /sacs/nimportequoi (ou une ancienne URL renommée)
     tombait ici avec mapping = null. La page répondait alors 200 avec un titre
     tiré du slug — « Nimportequoi » — et la grille par défaut de la catégorie.
     Un visiteur voyait une catégorie qui n'existe pas, et Google l'indexait.
     Un slug non mappé (ou un segment supplémentaire) est un 404. */
  if (sub && sub.length > 1) notFound();
  if (subSlug && !mapping) notFound();

  return (
    <CategoryPage
      title={subSlug ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Sacs"}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Sacs", href: "/sacs" },
        ...(subSlug ? [{ label: subSlug.replace(/-/g, " "), href: `/sacs/${subSlug}` }] : []),
      ]}
      slot="accent"
      q={mapping?.q ?? "sac bag"}
      genre={sp.genre}
      style={sp.style}
      page={parseInt(sp.page ?? "1", 10)}
    />
  );
}
