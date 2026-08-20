/**
 * /vetements + /vetements/[sub] — Page catégorie vêtements.
 * Lit directement le KV via /api/products existant.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPage from "@/components/CategoryPage";

interface Props {
  params: Promise<{ sub?: string[] }>;
  searchParams: Promise<{ genre?: string; style?: string; page?: string }>;
}

/* Mapping slug → slot+query pour /api/products */
const SUB_MAP: Record<string, { slot: string; q?: string }> = {
  hauts:            { slot: "haut" },
  "t-shirts":       { slot: "haut", q: "t-shirt tee" },
  chemises:         { slot: "haut", q: "chemise shirt" },
  polos:            { slot: "haut", q: "polo" },
  "pulls-cardigans":{ slot: "haut", q: "pull cardigan" },
  "sweats-hoodies": { slot: "haut", q: "sweat hoodie" },
  robes:            { slot: "haut", q: "robe" },
  blouses:          { slot: "haut", q: "blouse" },
  bas:              { slot: "bas" },
  pantalons:        { slot: "bas", q: "pantalon trouser" },
  jeans:            { slot: "bas", q: "jean denim" },
  shorts:           { slot: "bas", q: "short" },
  jupes:            { slot: "bas", q: "jupe skirt" },
  joggings:         { slot: "bas", q: "jogging track" },
  vestes:           { slot: "veste" },
  blazers:          { slot: "veste", q: "blazer" },
  manteaux:         { slot: "veste", q: "manteau coat" },
  "vestes-jean":    { slot: "veste", q: "jean denim jacket" },
  "perfectos-cuir": { slot: "veste", q: "perfecto leather cuir" },
  trenchs:          { slot: "veste", q: "trench" },
  bombers:          { slot: "veste", q: "bomber" },
  doudounes:        { slot: "veste", q: "doudoune puffer" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const subSlug = sub?.[0];
  const title = subSlug
    ? `${subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} — WADA`
    : "Vêtements — WADA";
  return {
    title,
    description: `Découvrez notre sélection de ${subSlug ?? "vêtements"} filtrables par palette Sanzō Wada.`,
  };
}

export default async function VetementsPage({ params, searchParams }: Props) {
  const { sub } = await params;
  const sp = await searchParams;
  const subSlug = sub?.[0];
  const mapping = subSlug ? SUB_MAP[subSlug] : null;

  /* Fix 2026-08-20 « fausse page catégorie » : la route est un catch-all
     optionnel, donc /vetements/nimportequoi (ou une ancienne URL renommée)
     tombait ici avec mapping = null. La page répondait alors 200 avec un titre
     tiré du slug — « Nimportequoi » — et la grille par défaut de la catégorie.
     Un visiteur voyait une catégorie qui n'existe pas, et Google l'indexait.
     Un slug non mappé (ou un segment supplémentaire) est un 404. */
  if (sub && sub.length > 1) notFound();
  if (subSlug && !mapping) notFound();

  return (
    <CategoryPage
      title={subSlug ? subSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Vêtements"}
      breadcrumb={[
        { label: "Accueil", href: "/" },
        { label: "Vêtements", href: "/vetements" },
        ...(subSlug ? [{ label: subSlug.replace(/-/g, " "), href: `/vetements/${subSlug}` }] : []),
      ]}
      slot={mapping?.slot ?? "haut"}
      q={mapping?.q}
      genre={sp.genre}
      style={sp.style}
      page={parseInt(sp.page ?? "1", 10)}
    />
  );
}
