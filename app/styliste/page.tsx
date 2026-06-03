/**
 * /styliste — Page landing du Styliste IA WADA.
 * Brief 2026-06-02 « Page Styliste IA (inspirée maquette éditoriale) ».
 *
 * Layout 2 colonnes desktop :
 *   Gauche : formulaire éditorial (titre + intro + chips + input)
 *   Droite : flat lay hero éditorial (sticky au scroll)
 *
 * Adapté au stack WADA (pas de DB) :
 *   L'action "Envoyer" redirige vers /stylist?q=prompt (chat existant).
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

      <style jsx>{`
        @media (min-width: 1024px) {
          .wada-styliste-grid {
            grid-template-columns: 1fr 1fr !important;
            padding: 0 48px !important;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
}
