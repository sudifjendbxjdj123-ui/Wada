"use client";
/**
 * /boutique — Page shopping WADA.
 * Brief 2026-06-02 « Refonte accueil mobile-first ».
 *
 * IMPORTANT : Ce design (shopping immédiat) va sur /boutique.
 * La home (/) garde sa vidéo hero éditoriale Sanzō Wada.
 */
import type { Metadata } from "next";
import { HomeHero } from "@/components/HomeHero";
import { HomeSelections } from "@/components/HomeSelections";
import { HomeNouveautes } from "@/components/HomeNouveautes";
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
      <HomeHero />
      <HomeSelections />
      <HomeNouveautes />
      <HomeFeatures />
    </main>
  );
}
