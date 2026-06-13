"use client";
/**
 * OutfitPieceSkeleton — Loading placeholder for outfit pieces
 *
 * Shows a skeleton while product details are loading
 * Provides visual feedback and maintains layout
 */

interface OutfitPieceSkeletonProps {
  size?: "small" | "large";
}

const CREAM = "#FAF8F4";
const LINE = "rgba(30,30,30,.10)";

export function OutfitPieceSkeleton({ size = "large" }: OutfitPieceSkeletonProps) {
  const minHeight = size === "small" ? 220 : 380;

  return (
    <div
      style={{
        background: CREAM,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight,
        padding: 16,
        gap: 12,
      }}
      aria-busy
      aria-label="Loading product details"
    >
      {/* Image skeleton */}
      <div
        style={{
          width: "100%",
          height: size === "small" ? 140 : 240,
          background: "linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)",
          backgroundSize: "200% 100%",
          borderRadius: 12,
          animation: "shimmer 2s infinite",
        }}
      />

      {/* Text skeletons */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Title skeleton */}
        <div
          style={{
            height: 16,
            background: "linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 4,
            animation: "shimmer 2s infinite",
            width: "80%",
          }}
        />

        {/* Subtitle skeleton */}
        <div
          style={{
            height: 12,
            background: "linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 4,
            animation: "shimmer 2s infinite",
            width: "60%",
          }}
        />

        {/* Price skeleton */}
        <div
          style={{
            height: 14,
            background: "linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 4,
            animation: "shimmer 2s infinite",
            width: "40%",
            marginTop: 8,
          }}
        />
      </div>

      {/* Button skeleton */}
      <div
        style={{
          height: 44,
          background: "linear-gradient(90deg, #e8e0d8 25%, #f0e8e0 50%, #e8e0d8 75%)",
          backgroundSize: "200% 100%",
          borderRadius: 8,
          animation: "shimmer 2s infinite",
        }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            background: #e8e0d8 !important;
          }
        }
      `}</style>
    </div>
  );
}
