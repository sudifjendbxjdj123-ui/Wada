/**
 * /marques — Index A-Z de toutes les marques présentes dans le KV.
 * Généré dynamiquement (Server Component) depuis readAllProducts().
 */
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { readAllProducts } from "@/lib/productStore";
import { visitorCountry, filterByGeo } from "@/lib/products/visibility";

export const metadata: Metadata = {
  title: "Toutes les marques — WADA",
  description: "Index A-Z de toutes les maisons partenaires disponibles sur WADA.",
};

/* Visibilité géo (2026-06-09) : K&Ö = CH uniquement → la liste des marques
   dépend du pays visiteur, donc on ne peut PAS partager un HTML ISR entre
   pays. Page rendue dynamiquement (headers() force déjà le dynamique). */
export const dynamic = "force-dynamic";

function slugBrand(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Brand = { name: string; count: number; slug: string };
type MarquesData = { grouped: Record<string, Brand[]>; letters: string[]; brandsCount: number; totalProducts: number };

/* Cache mémoire de l'index marques — Brief 2026-06-10 (« attente trop longue ») :
   /marques est `force-dynamic` (geo-gate K&Ö), donc il re-groupait ~586 marques
   sur 70k produits à CHAQUE requête (~0,7s). On met le RÉSULTAT en cache par
   groupe géo (« CH » qui voit K&Ö vs le reste), 60s. La lecture KV est déjà
   cachée en amont ; ceci évite de refaire le groupement A-Z à chaque hit. */
const _marquesCache = new Map<string, { data: MarquesData; at: number }>();
/* PERF 2026-06-11 (keep-warm) : 60s → 10 min, aligné sur le cache catalogue.
   L'index marques dérive du catalogue journalier → 10 min de fraîcheur est large. */
const MARQUES_TTL_MS = 600_000;

async function getMarquesData(country: string | null): Promise<MarquesData> {
  const key = country === "CH" ? "CH" : "other";
  const cached = _marquesCache.get(key);
  if (cached && Date.now() - cached.at < MARQUES_TTL_MS) return cached.data;

  const products = filterByGeo(await readAllProducts(), country);
  const brandMap = new Map<string, { count: number; slug: string }>();
  for (const p of products) {
    const name = (p.marque || p.marchand || "").trim();
    if (!name || name.length < 2) continue;
    const existing = brandMap.get(name);
    brandMap.set(name, { count: (existing?.count ?? 0) + 1, slug: slugBrand(name) });
  }
  const brands: Brand[] = [...brandMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([name, data]) => ({ name, ...data }));
  const grouped: Record<string, Brand[]> = {};
  for (const brand of brands) {
    const letter = brand.name.charAt(0).toUpperCase();
    (grouped[letter] = grouped[letter] || []).push(brand);
  }
  const data: MarquesData = {
    grouped,
    letters: Object.keys(grouped).sort(),
    brandsCount: brands.length,
    totalProducts: products.length,
  };
  _marquesCache.set(key, { data, at: Date.now() });
  return data;
}

export default async function MarquesPage() {
  const country = visitorCountry(await headers());
  const { grouped, letters, brandsCount, totalProducts } = await getMarquesData(country);

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "28px 24px 20px", borderBottom: "0.5px solid #e8dfd0" }}>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 36, fontWeight: 500, margin: "0 0 6px", color: "#2c2c2a" }}>
          Toutes les marques
        </h1>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: 0, fontStyle: "italic" }}>
          {brandsCount} maisons partenaires · {totalProducts.toLocaleString("fr-FR")} pièces
        </p>
      </header>

      {/* Navigation alphabétique sticky */}
      <nav style={{
        position: "sticky", top: 0, background: "#fff", zIndex: 10,
        padding: "10px 24px", borderBottom: "0.5px solid #e8dfd0",
        display: "flex", flexWrap: "wrap", gap: 4,
      }}>
        {letters.map((letter) => (
          <a key={letter} href={`#letter-${letter}`} style={{
            fontSize: 13, fontWeight: 600, color: "#6e3b32",
            textDecoration: "none", padding: "2px 6px", borderRadius: 4,
          }}>
            {letter}
          </a>
        ))}
      </nav>

      {/* Index A-Z */}
      <main style={{ padding: "24px 16px 60px" }}>
        {letters.map((letter) => (
          <section key={letter} id={`letter-${letter}`} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Fredoka'", fontSize: 28, fontWeight: 500, margin: "0 0 12px", color: "#2c2c2a" }}>
              {letter}
            </h2>
            <ul className="wada-brand-grid" style={{
              listStyle: "none", margin: 0, padding: 0,
              display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4,
            }}>
              {grouped[letter].map((brand) => (
                <li key={brand.slug}>
                  {/* Fix 2026-06-07 (bug) — page = Server Component : on NE peut
                      PAS passer onMouseOver/onMouseOut à <Link> (« Event handlers
                      cannot be passed to Client Component props » → page cassée).
                      Le survol passe en CSS (.wada-brand-grid a:hover). */}
                  <Link href={`/marques/${brand.slug}`} className="wada-brand-link" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                    transition: "background 0.1s",
                  }}>
                    <span style={{ fontSize: 14, color: "#2c2c2a" }}>{brand.name}</span>
                    <span style={{ fontSize: 11, color: "#8a7a68" }}>{brand.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

    </main>
  );
}
