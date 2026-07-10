"use client";
import dynamic from "next/dynamic";
import { ReactNode } from "react";

/**
 * Dynamic Import Wrapper for Composer Page
 *
 * The actual composer implementation is loaded only when user navigates here.
 * This reduces initial bundle size by ~150KB (deferred composer logic).
 */

function ComposerLoadingState(): ReactNode {
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
            animation: "wada-composer-load-pulse 1.5s ease-in-out infinite",
          }}
        >
          ◉
        </div>
        <p style={{ fontSize: 14, margin: 0 }}>
          Activation de la caméra...
        </p>
        <style>{`
          @keyframes wada-composer-load-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

// Dynamically import the actual composer implementation
// ssr: false because composer uses camera API (browser-only)
const ComposerPageContent = dynamic(
  () => import("./ComposerPageContent").then((mod) => mod.ComposerPageContent),
  {
    loading: ComposerLoadingState,
    ssr: false,
  }
);

export function ComposerPageWrapper() {
  return <ComposerPageContent />;
}
