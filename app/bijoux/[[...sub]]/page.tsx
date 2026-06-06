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

export default async function BijouxPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

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
      page={parseInt(sp.page ?? "1")}
    />
  );
}
