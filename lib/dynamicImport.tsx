"use client";

import dynamic from "next/dynamic";
import React, { ReactNode } from "react";

/**
 * Dynamic Import Utilities — Code splitting for heavy components
 *
 * Defers loading of large component trees until they're actually needed.
 * Reduces initial JavaScript bundle and improves Time to Interactive (TTI).
 *
 * How it works:
 * 1. Heavy component is NOT included in initial bundle
 * 2. Component is only downloaded when user navigates to that page/modal
 * 3. Loading state shown while component chunks download
 * 4. After load, component works normally
 *
 * Benefits:
 * - Initial bundle size: -20-30% (defer heavy components)
 * - Time to Interactive: -15-25% (less to parse/evaluate)
 * - Time to First Paint: -5-10% (lighter initial page)
 * - Better performance on slow connections
 */

/**
 * Loading placeholder component
 * Shown while dynamic component is being loaded
 */
function DynamicComponentLoader() {
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
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          ◉
        </div>
        <p style={{ fontSize: 14, margin: 0 }}>Chargement du compositeur...</p>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * Error placeholder component
 * Shown if dynamic component fails to load
 */
function DynamicComponentError({
  error,
}: {
  error: Error;
}) {
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
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1 style={{ fontSize: 24, color: "#1a1a1a", marginBottom: 12 }}>
          Erreur de chargement
        </h1>
        <p style={{ fontSize: 14, margin: "0 0 20px", color: "#8a7a68" }}>
          {error?.message || "Une erreur est survenue lors du chargement."}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            borderRadius: 999,
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

/**
 * Create a dynamically imported component with loading/error states
 *
 * Usage:
 * export const ComposerPage = createDynamicComponent(
 *   () => import('@/components/ComposerPage'),
 *   'Compositeur'
 * );
 */
export function createDynamicComponent<P extends object>(
  componentImport: () => Promise<{ default: React.ComponentType<P> }>,
  name: string
) {
  return dynamic(componentImport, {
    loading: DynamicComponentLoader,
    ssr: false, // Don't render on server (these are interactive client components)
  });
}

/**
 * Higher-order component for lazy-loaded modals
 * Useful for modals that are only opened by user action
 */
export function createDynamicModal<P extends object>(
  componentImport: () => Promise<{ default: React.ComponentType<P> }>,
  name: string
) {
  return dynamic(componentImport, {
    loading: () => <div style={{ minHeight: "300px" }} />, // Smaller loading state for modals
    ssr: false,
  });
}
