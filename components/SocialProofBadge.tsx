"use client";
/**
 * SocialProofBadge — TIER 3 premium polish
 * Affiche des badges de "social proof" sur les cards:
 * - "250+ aimée" (nombre de likes persisté dans localStorage)
 * - "Trending" (dans le top 10 des favoris)
 * - "Editor's Pick" (sélection manuelle)
 * - "Nouvelle" (ajoutée cette semaine)
 */

interface SocialProofBadgeProps {
  type: "loved" | "trending" | "pick" | "new";
  count?: number;
  animated?: boolean;
}

const badgeConfig = {
  loved: {
    icon: "❤️",
    label: (count: number) => `${count}+ aimée`,
    bg: "rgba(107, 58, 50, 0.08)",
    borderColor: "#6B3A32",
    textColor: "#6B3A32",
  },
  trending: {
    icon: "🔥",
    label: "Tendance",
    bg: "rgba(242, 201, 76, 0.10)",
    borderColor: "#F2C94C",
    textColor: "#D4A72B",
  },
  pick: {
    icon: "✦",
    label: "Choix éditeur",
    bg: "rgba(168, 178, 154, 0.08)",
    borderColor: "#A8B29A",
    textColor: "#848C7A",
  },
  new: {
    icon: "⭐",
    label: "Nouvelle",
    bg: "rgba(107, 58, 50, 0.06)",
    borderColor: "#D4A574",
    textColor: "#6B3A32",
  },
};

export default function SocialProofBadge({
  type,
  count = 250,
  animated = true,
}: SocialProofBadgeProps) {
  const config = badgeConfig[type];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${config.borderColor}`,
        background: config.bg,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: config.textColor,
        fontFamily: "'Inter', sans-serif",
        transition: "all 0.2s ease",
        ...(animated && {
          animation: "wada-badge-float 2s ease-in-out infinite",
        }),
      }}
    >
      <span style={{ fontSize: 12, lineHeight: 1 }}>{config.icon}</span>
      <span>{type === "loved" ? config.label(count) : config.label}</span>
      <style jsx>{`
        @keyframes wada-badge-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}
