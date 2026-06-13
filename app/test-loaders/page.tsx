"use client";
/**
 * Test page for outfit composition loaders
 * Useful for testing the UI without going through the full composition flow
 */
import { useState } from "react";
import { OutfitCompositionLoaderDetailed } from "@/components/OutfitCompositionLoaderDetailed";
import { OutfitCompositionLoader } from "@/components/OutfitCompositionLoader";

export default function TestLoadersPage() {
  const [selectedLoader, setSelectedLoader] = useState<"detailed" | "simple">("detailed");

  if (selectedLoader === "detailed") {
    return (
      <>
        <OutfitCompositionLoaderDetailed />
        <button
          onClick={() => setSelectedLoader("simple")}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            padding: "12px 20px",
            background: "#6B3A32",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 12,
            zIndex: 999,
          }}
        >
          Voir version simple →
        </button>
      </>
    );
  }

  return (
    <>
      <OutfitCompositionLoader currentStep="match" />
      <button
        onClick={() => setSelectedLoader("detailed")}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          padding: "12px 20px",
          background: "#6B3A32",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 12,
          zIndex: 999,
        }}
      >
        Voir version détaillée →
      </button>
    </>
  );
}
