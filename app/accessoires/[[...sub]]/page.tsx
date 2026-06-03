import CategoryPage from "@/components/CategoryPage";

const SUB_MAP: Record<string, { q?: string }> = {
  foulards:    { q: "foulard écharpe scarf" },
  chapeaux:    { q: "chapeau bonnet hat" },
  lunettes:    { q: "lunettes soleil sunglasses" },
  gants:       { q: "gants gloves" },
  ceintures:   { q: "ceinture belt" },
  montres:     { q: "montre watch" },
  portefeuilles: { q: "portefeuille wallet" },
  "porte-cartes": { q: "porte-cartes cardholder" },
};

interface Props {
  params: Promise<{ sub?: string[] }>;
  searchParams: Promise<{ genre?: string }>;
}

export default async function AccessoiresPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

  return (
    <CategoryPage
      title={subSlug ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Accessoires"}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Accessoires", href: "/accessoires" },
        ...(subSlug ? [{ label: subSlug.replace(/-/g, " "), href: `/accessoires/${subSlug}` }] : []),
      ]}
      slot="accent"
      q={mapping?.q}
      genre={sp.genre}
    />
  );
}
