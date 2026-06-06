import type { Metadata } from "next";
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
      page={parseInt(sp.page ?? "1")}
    />
  );
}
