"use client";
/**
 * /boutique — Page shopping WADA.
 *
 * Fix 2026-06-11 « hero instantané » : retiré le caches.delete("products-v1")
 * qui s'exécutait à chaque mount → toutes les requêtes /api/products
 * repartaient à froid (4-6s contre ~200ms en chaud). Le cache produits doit
 * être invalidé par /api/cron, pas par l'utilisateur qui ouvre la page.
 */
import BackButton from "@/components/BackButton";
import { BoutiqueHero } from "@/components/BoutiqueHero";
import { BrandBannerShowcase } from "@/components/BrandBannerShowcase";
import { BrandShowcaseStrip } from "@/components/BrandShowcaseStrip";
import { SidebarBrandShowcase } from "@/components/SidebarBrandShowcase";

export default function BoutiquePage() {
  return (
    <main
      style={{
        background: "#FAF8F4",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <BackButton fallback="/" />
      </div>
      <BoutiqueHero />

      {/* Featured brands showcase - Fill dead spaces */}
      <div style={{ maxWidth: 1200, margin: "40px auto", width: "100%", padding: "0 20px" }}>
        <BrandShowcaseStrip cols={4} title="Marques phares" />
      </div>

      {/* Banner section - Between content */}
      <div style={{ maxWidth: 1200, margin: "40px auto", width: "100%", padding: "0 20px" }}>
        <BrandBannerShowcase layout="full-width" maxBanners={3} />
      </div>

      {/* Another showcase strip */}
      <div style={{ maxWidth: 1200, margin: "40px auto", width: "100%", padding: "0 20px" }}>
        <BrandShowcaseStrip cols={6} title="Découvrez nos partenaires" />
      </div>
    </main>
  );
}
