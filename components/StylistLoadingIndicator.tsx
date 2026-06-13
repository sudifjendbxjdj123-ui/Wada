"use client";
/**
 * StylistLoadingIndicator — Beautiful loading states with progress
 *
 * Shows phase progression:
 * 0-25%: Analyzing preferences
 * 25-50%: Finding palette
 * 50-75%: Selecting products
 * 75-100%: Composing outfit
 */

interface StylistLoadingIndicatorProps {
  progress?: number; // 0-100
  message?: string;
  visible: boolean;
}

const PHASES = [
  { min: 0, max: 25, label: "📊 Analyzing your preferences...", emoji: "🔍" },
  { min: 25, max: 50, label: "🎨 Finding perfect palette...", emoji: "🎯" },
  { min: 50, max: 75, label: "🛍️ Selecting products...", emoji: "✨" },
  { min: 75, max: 100, label: "👗 Composing your outfit...", emoji: "🎁" },
];

export function StylistLoadingIndicator({
  progress = 0,
  message,
  visible,
}: StylistLoadingIndicatorProps) {
  if (!visible) return null;

  const phase = PHASES.find((p) => progress >= p.min && progress < p.max) || PHASES[0];
  const displayMessage = message || phase.label;
  const displayEmoji = message ? "⏳" : phase.emoji;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: 32,
        right: 32,
        maxWidth: 500,
        zIndex: 999,
        animation: "slideUp 0.3s ease-out",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E8DFD0",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 20px 40px rgba(30,30,30,.12)",
        }}
      >
        {/* Header with emoji */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 24 }}>{displayEmoji}</div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#1F1B16",
            }}
          >
            {displayMessage}
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: 6,
            background: "#F0E8E0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6B3A32, #8B5A3C)",
              transition: "width 0.3s ease-out",
              borderRadius: 3,
            }}
          />
        </div>

        {/* Progress text */}
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 11,
            color: "#A8A890",
            textAlign: "right",
          }}
        >
          {Math.round(progress)}%
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }

        @media (max-width: 640px) {
          div {
            left: 16px;
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}
