import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";

const SUB_MAP: Record<string, { q?: string }> = {
  colliers:   { q: "collier necklace" },
  bracelets:  { q: "bracelet" },
  bagues:     { q: "bague ring" },
  boucles:    { q: "boucles d'oreilles earrings" },
  broches:    { q: "broche pin" },
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
    : "Bijoux";
  return {
    title: `${label} — WADA`,
    description: `Découvrez notre sélection de ${subSlug ?? "bijoux"} filtrables par palette Sanzō Wada.`,
    alternates: { canonical: subSlug ? `/bijoux/${subSlug}` : "/bijoux" },
  };
}

export default async function BijouxPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

  /* Fix 2026-08-20 « fausse page catégorie » : la route est un catch-all
     optionnel, donc /bijoux/nimportequoi (ou une ancienne URL renommée)
     tombait ici avec mapping = null. La page répondait alors 200 avec un titre
     tiré du slug — « Nimportequoi » — et la grille par défaut de la catégorie.
     Un visiteur voyait une catégorie qui n'existe pas, et Google l'indexait.
     Un slug non mappé (ou un segment supplémentaire) est un 404. */
  if (sub && sub.length > 1) notFound();
  if (subSlug && !mapping) notFound();

  return (
    <CategoryPage
      title={subSlug ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Bijoux"}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Bijoux", href: "/bijoux" },
        ...(subSlug ? [{ label: subSlug.replace(/-/g, " "), href: `/bijoux/${subSlug}` }] : []),
      ]}
      slot="accent"
      q={mapping?.q ?? "bijou collier bracelet bague"}
      genre={sp.genre}
      style={sp.style}
      page={parseInt(sp.page ?? "1", 10)}
    />
  );
}
