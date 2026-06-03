/**
 * /marques — Index A-Z de toutes les marques présentes dans le KV.
 * Généré dynamiquement (Server Component) depuis readAllProducts().
 */
import type { Metadata } from "next";
import Link from "next/link";
import { readAllProducts } from "@/lib/productStore";

export const metadata: Metadata = {
  title: "Toutes les marques — WADA",
  description: "Index A-Z de toutes les maisons partenaires disponibles sur WADA.",
};

export const revalidate = 3600; // ISR 1h

function slugBrand(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default async function MarquesPage() {
  const products = await readAllProducts();

  /* Extraire toutes les marques avec leur compte produits */
  const brandMap = new Map<string, { count: number; slug: string }>();
  for (const p of products) {
    const name = (p.marque || p.marchand || "").trim();
    if (!name || name.length < 2) continue;
    const existing = brandMap.get(name);
    brandMap.set(name, { count: (existing?.count ?? 0) + 1, slug: slugBrand(name) });
  }

  /* Trier A-Z */
  const brands = [...brandMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([name, data]) => ({ name, ...data }));

  /* Grouper par première lettre */
  const grouped: Record<string, typeof brands> = {};
  for (const brand of brands) {
    const letter = brand.name.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(brand);
  }

  const letters = Object.keys(grouped).sort();
  const totalProducts = products.length;

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "28px 24px 20px", borderBottom: "0.5px solid #e8dfd0" }}>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 36, fontWeight: 500, margin: "0 0 6px", color: "#2c2c2a" }}>
          Toutes les marques
        </h1>
        <p style={{ fontSize: 13, color: "#8a7a68", margin: 0, fontStyle: "italic" }}>
          {brands.length} maisons partenaires · {totalProducts.toLocaleString("fr-FR")} pièces
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
                  <Link href={`/marques/${brand.slug}`} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "9px 12px", borderRadius: 8, textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#faf6ee")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontSize: 14, color: "#2c2c2a" }}>{brand.name}</span>
                    <span style={{ fontSize: 11, color: "#8a7a68" }}>{brand.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <style jsx>{`
        @media (min-width: 768px) {
          .wada-brand-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          .wada-brand-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}
