/**
 * GET /api/categories/[category]/counts?dimension={X} — compteurs de
 * produits par valeur d'une dimension de filtre (brief 2026-06-09).
 *
 * dimension ∈ type | color | brand | size | material | season | genre
 * Réponse : { [valeur]: nombre }   ex. { Sneakers: 142, Mocassins: 38 }
 *
 * Comptés sur le pool catégorie (en stock + affilié + image), avant tout
 * filtre utilisateur — donc stable.
 */
import { readAllProducts } from "@/lib/productStore";
import { isAffiliated } from "@/lib/composer/occasionRules";
import { visitorCountry, shouldShowProduct } from "@/lib/products/visibility";
import { computeCounts } from "@/lib/categoryFilters";
import type { ProduitAwin } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Label catégorie (URL) → slots ProductCategorie inclus. */
const CATEGORY_SLOTS: Record<string, string[]> = {
  chaussures: ["chaussures"],
  vetements: ["haut", "bas", "veste"],
  sacs: ["accent"],
  accessoires: ["accent"],
  bijoux: ["accent"],
};

type Dimension = "type" | "color" | "brand" | "size" | "material" | "season" | "genre";
const VALID_DIMENSIONS: Dimension[] = ["type", "color", "brand", "size", "material", "season", "genre"];

function isUsableImage(p: ProduitAwin): boolean {
  const url = p.imageLocal || p.largeImage || p.image || "";
  if (!url || url === "-") return false;
  if (/noimage\.(gif|png|jpe?g|webp)/i.test(url)) return false;
  return true;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params;
  const dimension = (new URL(req.url).searchParams.get("dimension") || "type") as Dimension;
  if (!VALID_DIMENSIONS.includes(dimension)) {
    return Response.json({ error: "invalid dimension" }, { status: 400 });
  }

  const slots = CATEGORY_SLOTS[category] || [];
  const country = visitorCountry(req.headers); // K&Ö = CH only (2026-06-09)
  const catalog = await readAllProducts();
  const pool = catalog.filter((p) =>
    p.enStock &&
    isUsableImage(p) &&
    isAffiliated(p.marchandSlug || "") &&
    shouldShowProduct(p, country) &&
    (slots.length === 0 || slots.includes(p.categorie)),
  );

  return Response.json(computeCounts(pool, category, dimension), {
    headers: { "Vary": "x-vercel-ip-country" },
  });
}
