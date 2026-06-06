"use client";
/**
 * /boutique — Page shopping WADA.
 */
import { useEffect } from "react";
import BackButton from "@/components/BackButton";
import { BoutiqueHero } from "@/components/BoutiqueHero";

export default function BoutiquePage() {
  /* Force le navigateur à ne jamais servir cette page depuis son cache */
  useEffect(() => {
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
  }, []);

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
    </main>
  );
}
