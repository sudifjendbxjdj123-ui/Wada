"use client";
/**
 * /showcase-demo — Demo page showing banners & showcases in dead spaces
 *
 * Visual reference for where to place components
 */

import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";
import { SidebarBrandShowcase } from "@/components/SidebarBrandShowcase";
import { BrandShowcaseStrip } from "@/components/BrandShowcaseStrip";

export default function ShowcaseDemoPage() {
  return (
    <main style={{ background: "#FAF8F4", minHeight: "100vh", padding: "20px" }}>
      {/* ========== SECTION 1: Full-Width Banner ========== */}
      <section style={{ maxWidth: 1200, margin: "0 auto 40px" }}>
        <h1 style={{ fontSize: 24, marginBottom: 20 }}>
          Brand Showcase Demo
        </h1>
        <p style={{ color: "#8A7A68", marginBottom: 24 }}>
          Exemples de placement des composants dans les espaces vides
        </p>

        {/* Banner 1: Full-Width Top */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
            1️⃣ Full-Width Banner (100% width)
          </h2>
          <BrandBannerShowcase layout="full-width" />
        </div>
      </section>

      {/* ========== SECTION 2: Content with Right Sidebar ========== */}
      <section style={{ maxWidth: 1200, margin: "0 auto 40px" }}>
        <h2 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
          2️⃣ Product Page (Content + Right Sidebar)
        </h2>

        <div style={{ display: "flex", gap: 24 }}>
          {/* Left: Main Content */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8DFD0",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>
                Product Details
              </h3>
              <p style={{ color: "#8A7A68", lineHeight: 1.6 }}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua.
              </p>
            </div>

            {/* Half-Width Banner */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
                Half-Width Banner
              </h3>
              <BrandBannerShowcase layout="half-width" />
            </div>

            {/* More Content */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E8DFD0",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <h3 style={{ fontSize: 18, marginBottom: 12 }}>
                Related Information
              </h3>
              <p style={{ color: "#8A7A68" }}>
                Additional product details would go here...
              </p>
            </div>
          </div>

          {/* Right: Sidebar */}
          <aside style={{ width: 240 }}>
            <h3 style={{ fontSize: 12, color: "#A8A890", marginBottom: 12 }}>
              📍 Right Sidebar
            </h3>
            <SidebarBrandShowcase />
          </aside>
        </div>
      </section>

      {/* ========== SECTION 3: Strip Between Sections ========== */}
      <section style={{ maxWidth: 1200, margin: "0 auto 40px" }}>
        <h2 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
          3️⃣ Brand Showcase Strip (Between Sections)
        </h2>

        {/* Content Block 1 */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3>Featured Products</h3>
          <p style={{ color: "#8A7A68" }}>Product grid would go here...</p>
        </div>

        {/* Strip Between */}
        <BrandShowcaseStrip cols={4} title="Découvrez nos marques" />

        {/* Content Block 2 */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            padding: 20,
            marginTop: 24,
          }}
        >
          <h3>Related Products</h3>
          <p style={{ color: "#8A7A68" }}>More products here...</p>
        </div>
      </section>

      {/* ========== SECTION 4: Multiple Layouts ========== */}
      <section style={{ maxWidth: 1200, margin: "0 auto 40px" }}>
        <h2 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
          4️⃣ Home Page Layout (Multiple Sections)
        </h2>

        {/* Hero */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            padding: 40,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <h2>Hero Section</h2>
        </div>

        {/* Banner 1 */}
        <BrandBannerShowcase
          layout="full-width"
          brands={["new-era"]}
          rotateInterval={6000}
        />

        {/* Section 2 */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            marginTop: 24,
          }}
        >
          <h3>Featured Products</h3>
        </div>

        {/* Banner 2 */}
        <BrandBannerShowcase layout="full-width" brands={["muji"]} />

        {/* Newsletter */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            padding: 20,
            marginTop: 24,
          }}
        >
          <h3>Newsletter</h3>
        </div>
      </section>

      {/* ========== REFERENCE TABLE ========== */}
      <section style={{ maxWidth: 1200, margin: "40px auto" }}>
        <h2 style={{ fontSize: 14, color: "#A8A890", marginBottom: 12 }}>
          📋 Composants & Placements
        </h2>

        <div
          style={{
            background: "#fff",
            border: "1px solid #E8DFD0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: "#F5F1EB" }}>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>
                  Composant
                </th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>
                  Layout
                </th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>
                  Placement
                </th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>
                  Usage
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: "1px solid #E8DFD0" }}>
                <td style={{ padding: 12 }}>
                  <code>BrandBannerShowcase</code>
                </td>
                <td style={{ padding: 12 }}>full-width (100%)</td>
                <td style={{ padding: 12 }}>Entre sections</td>
                <td style={{ padding: 12 }}>Bannières HD (Trucker 2026)</td>
              </tr>
              <tr style={{ borderTop: "1px solid #E8DFD0" }}>
                <td style={{ padding: 12 }}>
                  <code>BrandBannerShowcase</code>
                </td>
                <td style={{ padding: 12 }}>half-width (600px)</td>
                <td style={{ padding: 12 }}>Colonne droite</td>
                <td style={{ padding: 12 }}>Highlight produit</td>
              </tr>
              <tr style={{ borderTop: "1px solid #E8DFD0" }}>
                <td style={{ padding: 12 }}>
                  <code>SidebarBrandShowcase</code>
                </td>
                <td style={{ padding: 12 }}>sidebar (220px)</td>
                <td style={{ padding: 12 }}>Marge latérale</td>
                <td style={{ padding: 12 }}>Carousel produits 3 à la fois</td>
              </tr>
              <tr style={{ borderTop: "1px solid #E8DFD0" }}>
                <td style={{ padding: 12 }}>
                  <code>BrandShowcaseStrip</code>
                </td>
                <td style={{ padding: 12 }}>horizontal (3-6 cols)</td>
                <td style={{ padding: 12 }}>Entre contenus</td>
                <td style={{ padding: 12 }}>Grille produits marques</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          maxWidth: 1200,
          margin: "40px auto 0",
          padding: "20px 0",
          borderTop: "1px solid #E8DFD0",
          textAlign: "center",
          fontSize: 12,
          color: "#A8A890",
        }}
      >
        <p>
          🎨 Tous les composants ci-dessus remplissent les espaces vides avec
          des images de produits haute qualité du flux.
        </p>
        <p>
          ✅ Auto-rotation, animations smooth, lazy loading, CORS-safe
        </p>
      </div>
    </main>
  );
}
