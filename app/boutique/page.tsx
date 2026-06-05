"use client";
/**
 * /boutique — Page shopping WADA.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 *
 * IMPORTANT : Ce design (shopping immédiat) va sur /boutique.
 * La home (/) garde sa vidéo hero éditoriale Sanzō Wada.
 */
import type { Metadata } from "next";
import BackButton from "@/components/BackButton";
import { BoutiqueHero } from "@/components/BoutiqueHero";

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
      {/* Bouton Retour superposé sur l'image (pas de bande crème au-dessus) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <BackButton fallback="/" />
      </div>
      <BoutiqueHero />
    </main>
  );
}
