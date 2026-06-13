import CategoryPage from "@/components/CategoryPage";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ genre?: string; style?: string; page?: string }>;
}

function unslugBrand(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const brandName = unslugBrand(slug || "");

  return (
    <CategoryPage
      title={brandName}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Marques", href: "/marques" },
        { label: brandName, href: `/marques/${slug}` },
      ]}
      slot="haut"
      q={brandName}
      genre={sp.genre}
      style={sp.style}
      page={parseInt(sp.page ?? "1")}
    />
  );
}
