"use client";
/**
 * ARPreviewMock — TIER 3 fake AR "try-on" preview
 * Affiche un mockup AR-like qui montre comment une palette ou tenue
 * s'appliquerait visuellement. C'est un mockup, pas une vraie AR!
 *
 * Usage:
 *   <ARPreviewMock colors={palette.colors} mode="palette" />
 */

interface ARPreviewMockProps {
  colors?: Array<{ hex: string; name: string }>;
  paletteNo?: string;
  paletteName?: string;
  mode?: "palette" | "outfit";
}

export default function ARPreviewMock({
  colors = [],
  paletteNo = "001",
  paletteName = "Sans nom",
  mode = "palette",
}: ARPreviewMockProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1.2",
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(135deg, #f5f1e8 0%, #e8dfd0 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* AR Camera Feed Mock */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 320 400"
        style={{ position: "absolute", inset: 0 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="arGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: "#f5f1e8", stopOpacity: 0.7 }} />
          </linearGradient>

          {/* Scanline effect */}
          <pattern
            id="scanlines"
            x="0"
            y="0"
            width="320"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="320"
              height="2"
              fill="rgba(0,0,0,0.02)"
            />
          </pattern>
        </defs>

        {/* Mock camera background */}
        <rect width="320" height="400" fill="url(#arGradient)" />
        <rect width="320" height="400" fill="url(#scanlines)" opacity="0.3" />

        {/* Central preview area */}
        {mode === "palette" && colors.length > 0 && (
          <>
            {/* Palette color preview — vertical strips */}
            <g opacity="0.9">
              {colors.slice(0, 5).map((color, i) => (
                <rect
                  key={i}
                  x={64 + (i * 40)}
                  y={80}
                  width="36"
                  height="160"
                  fill={color.hex}
                  style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))" }}
                />
              ))}
            </g>

            {/* Info overlay */}
            <g>
              <text
                x="160"
                y="280"
                textAnchor="middle"
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  fill: "#1E1E1E",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {paletteName}
              </text>
              <text
                x="160"
                y="300"
                textAnchor="middle"
                style={{
                  fontSize: 12,
                  fill: "#6a6259",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                No. {paletteNo}
              </text>
            </g>
          </>
        )}

        {/* AR Corner Markers */}
        <g stroke="#6B3A32" strokeWidth="2" fill="none" opacity="0.4">
          {/* Top-left */}
          <line x1="20" y1="20" x2="50" y2="20" />
          <line x1="20" y1="20" x2="20" y2="50" />
          {/* Top-right */}
          <line x1="300" y1="20" x2="270" y2="20" />
          <line x1="300" y1="20" x2="300" y2="50" />
          {/* Bottom-left */}
          <line x1="20" y1="380" x2="50" y2="380" />
          <line x1="20" y1="380" x2="20" y2="350" />
          {/* Bottom-right */}
          <line x1="300" y1="380" x2="270" y2="380" />
          <line x1="300" y1="380" x2="300" y2="350" />
        </g>

        {/* Center crosshair */}
        <g stroke="#6B3A32" strokeWidth="1" opacity="0.3">
          <circle cx="160" cy="120" r="30" fill="none" />
          <line x1="160" y1="90" x2="160" y2="30" />
          <line x1="160" y1="150" x2="160" y2="210" />
          <line x1="130" y1="120" x2="70" y2="120" />
          <line x1="190" y1="120" x2="250" y2="120" />
        </g>
      </svg>

      {/* AR Badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "rgba(107, 58, 50, 0.9)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.1em",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#fff",
            animation: "wada-pulse 1s ease-in-out infinite",
          }}
        />
        AR PREVIEW
      </div>

      {/* Pulse ring animation */}
      <style jsx>{`
        @keyframes wada-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
