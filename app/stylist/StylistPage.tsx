"use client";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

/**
 * Dynamic Import Wrapper for Stylist Page
 *
 * The actual stylist implementation is loaded only when user navigates here.
 * This reduces initial bundle size by ~200KB (deferred stylist state machine + LLM).
 */

function StylistLoadingState(): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
        color: "#5a5a5a",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            marginBottom: 16,
            animation: "wada-stylist-load-pulse 1.5s ease-in-out infinite",
          }}
        >
          ◉
        </div>
        <p style={{ fontSize: 14, margin: 0 }}>
          Chargement du styliste...
        </p>
        <style>{`
          @keyframes wada-stylist-load-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// Dynamically import the actual stylist implementation
// ssr: false because stylist uses localStorage + chat state (client-only)
const StylistPageContent = dynamic(
  () => import("./StylistPageContent").then((mod) => mod.StylistPageContent),
  {
    loading: StylistLoadingState,
    ssr: false,
  }
);

export function StylistPageWrapper() {
  return <StylistPageContent />;
}
