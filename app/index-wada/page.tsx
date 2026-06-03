import type { Metadata } from "next";
import { readAllProducts } from "@/lib/productStore";

export const metadata: Metadata = {
  title: "Index WADA — Rapport trimestriel",
  description: "Les palettes les plus recherchées, les marques en hausse et les couleurs du trimestre.",
};

export const revalidate = 3600;

export default async function IndexWadaPage() {
  const products = await readAllProducts();
  const total = products.length;

  /* Stats simples depuis le KV */
  const brandMap = new Map<string, number>();
  const slotMap = new Map<string, number>();
  const hexMap = new Map<string, number>();

  for (const p of products) {
    const b = (p.marque || "").trim();
    if (b) brandMap.set(b, (brandMap.get(b) || 0) + 1);
    slotMap.set(p.categorie, (slotMap.get(p.categorie) || 0) + 1);
    if (p.hex) hexMap.set(p.hex, (hexMap.get(p.hex) || 0) + 1);
  }

  const topBrands = [...brandMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topSlots = [...slotMap.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>
      <header style={{ padding: "40px 24px 28px", borderBottom: "0.5px solid #e8dfd0", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8a7a68", marginBottom: 10 }}>
          Trimestriel
        </p>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 36, fontWeight: 500, margin: "0 0 10px", color: "#2c2c2a" }}>
          Index WADA
        </h1>
        <p style={{ fontSize: 14, color: "#8a7a68", lineHeight: 1.6, margin: 0 }}>
          État du catalogue · {total.toLocaleString("fr-FR")} pièces · juin 2026
        </p>
      </header>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px", display: "grid", gap: 32 }}>
        {/* Distribution slots */}
        <div>
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, marginBottom: 16, color: "#2c2c2a" }}>
            Répartition par type de pièce
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            {topSlots.map(([slot, count]) => (
              <div key={slot} style={{
                background: "#fff", borderRadius: 14, padding: "16px 18px",
                border: "0.5px solid #e8dfd0",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8a7a68" }}>
                  {slot}
                </p>
                <p style={{ margin: 0, fontFamily: "'Fredoka'", fontSize: 26, fontWeight: 500, color: "#2c2c2a" }}>
                  {count.toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top marques */}
        <div>
          <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, marginBottom: 16, color: "#2c2c2a" }}>
            Top 10 marques par volume
          </h2>
          <div style={{ display: "grid", gap: 6 }}>
            {topBrands.map(([brand, count], i) => (
              <div key={brand} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: "#fff", borderRadius: 10,
                border: "0.5px solid #e8dfd0",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#8a7a68", width: 20 }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: "#2c2c2a" }}>{brand}</span>
                <span style={{ fontSize: 13, color: "#8a7a68" }}>{count} pièces</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
