"use client";
/**
 * Accueil WADA — Refonte mobile-first 2026-06-02.
 * Brief « shopping immédiat + éditorial WADA en valeur ajoutée ».
 */

import { HomeHero } from "@/components/HomeHero";
import { HomeSelections } from "@/components/HomeSelections";
import { HomeNouveautes } from "@/components/HomeNouveautes";
import { HomeFeatures } from "@/components/HomeFeatures";

export default function HomePage() {
  return (
    <main
      style={{
        background: "#FAF8F4",
        minHeight: "100vh",
        paddingBottom: 80,
      }}
    >
      <HomeHero />
      <HomeSelections />
      <HomeNouveautes />
      <HomeFeatures />
    </main>
  );
}
