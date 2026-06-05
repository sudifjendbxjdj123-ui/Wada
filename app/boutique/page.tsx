"use client";
/**
 * /boutique — Page shopping WADA.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 *
 * IMPORTANT : Ce design (shopping immédiat) va sur /boutique.
 * La home (/) garde sa vidéo hero éditoriale Sanzō Wada.
 */
import type { Metadata } from "next";
import { BoutiqueHero } from "@/components/BoutiqueHero";
import { HomeFeatures } from "@/components/HomeFeatures";

export default function BoutiquePage() {
  return (
    <main
      style={{
        background: "#FAF8F4",
        minHeight: "100vh",
        paddingBottom: 80,
      }}
    >
      <BoutiqueHero />
      <HomeFeatures />
    </main>
  );
}
