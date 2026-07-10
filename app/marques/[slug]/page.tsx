import CategoryPage from "@/components/CategoryPage";
import { headers } from "next/headers";
import { readAllProducts } from "@/lib/productStore";
import { visitorCountry, filterByGeo } from "@/lib/products/visibility";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ genre?: string; style?: string; page?: string }>;
}

/* Slugify identique à /marques/page.tsx pour retrouver le nom exact
   stocké dans le KV depuis le slug URL. Sinon on retombe sur la version
   naïve dash→space+capitalize qui rate les casings type « adidas by X ». */
function slugBrand(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unslugBrand(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Fix 2026-06-14 « /marques/[slug] affichait New Era partout » : on résout
   le slug vers le nom EXACT de la marque tel qu'il est stocké dans le KV,
   pour que le filtre brand match vraiment. Précédemment on passait juste
   `q={brandName}` qui n'était utilisé nulle part → aucun filtre appliqué. */
async function resolveBrandName(slug: string, country: string | null): Promise<string | null> {
  if (!slug) return null;
  const products = filterByGeo(await readAllProducts(), country);
  const seen = new Set<string>();
  for (const p of products) {
    const name = (p.marque || p.marchand || "").trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    if (slugBrand(name) === slug) return name;
  }
  return null;
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const country = visitorCountry(await headers());
  const exactName = await resolveBrandName(slug, country);
  const brandName = exactName || unslugBrand(slug || "");

  return (
    <CategoryPage
      title={brandName}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Marques", href: "/marques" },
        { label: brandName, href: `/marques/${slug}` },
      ]}
      slot="haut,bas,veste,chaussures,accent"
      brand={brandName}
      genre={sp.genre}
      style={sp.style}
      page={parseInt(sp.page ?? "1")}
    />
  );
}
