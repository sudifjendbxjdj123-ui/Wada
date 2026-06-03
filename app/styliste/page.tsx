/**
 * /styliste — Page landing du Styliste IA WADA.
 * Brief 2026-06-02 « Page Styliste IA (inspirée maquette éditoriale) ».
 * Server Component — les sous-composants sont "use client".
 */
import type { Metadata } from "next";
import { StylisteContent } from "@/components/styliste/StylisteContent";
import { StylisteHero } from "@/components/styliste/StylisteHero";

export const metadata: Metadata = {
  title: "Styliste IA — WADA",
  description: "Composons votre tenue. Dites-moi une occasion, une pièce, une humeur — je compose autour.",
};

export default function StylistePage() {
  return (
    <div style={{ background: "#f5efe2", minHeight: "100vh" }}>
      {/* grid responsive via className + global CSS */}
      <div
        className="wada-styliste-grid"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          padding: "0 16px",
        }}
      >
        <StylisteContent />
        <StylisteHero />
      </div>
    </div>
  );
}
