import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";

const SUB_MAP: Record<string, { q?: string }> = {
  sneakers:    { q: "sneaker basket" },
  mocassins:   { q: "mocassin loafer derby" },
  derbies:     { q: "derby oxford" },
  sandales:    { q: "sandale sandal" },
  espadrilles: { q: "espadrille" },
  ballerines:  { q: "ballerine" },
  escarpins:   { q: "escarpin" },
  bottines:    { q: "bottine" },
  bottes:      { q: "botte boot" },
  "boots-moto":{ q: "botte moto" },
};

interface Props {
  params: Promise<{ sub?: string[] }>;
  searchParams: Promise<{ genre?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const subSlug = sub?.[0];
  const label = subSlug
    ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Chaussures";
  return {
    title: `${label} — WADA`,
    description: `Découvrez notre sélection de ${subSlug ?? "chaussures"} filtrables par palette Sanzō Wada.`,
    alternates: { canonical: subSlug ? `/chaussures/${subSlug}` : "/chaussures" },
  };
}

export default async function ChaussuresPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

  /* Fix 2026-08-20 « fausse page catégorie » : la route est un catch-all
     optionnel, donc /chaussures/nimportequoi (ou une ancienne URL renommée)
     tombait ici avec mapping = null. La page répondait alors 200 avec un titre
     tiré du slug — « Nimportequoi » — et la grille par défaut de la catégorie.
     Un visiteur voyait une catégorie qui n'existe pas, et Google l'indexait.
     Un slug non mappé (ou un segment supplémentaire) est un 404. */
  if (sub && sub.length > 1) notFound();
  if (subSlug && !mapping) notFound();

  return (
    <CategoryPage
      title={subSlug ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Chaussures"}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Chaussures", href: "/chaussures" },
        ...(subSlug ? [{ label: subSlug.replace(/-/g, " "), href: `/chaussures/${subSlug}` }] : []),
      ]}
      slot="chaussures"
      q={mapping?.q}
      genre={sp.genre}
    />
  );
}
