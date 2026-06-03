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

export default async function ChaussuresPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

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
