"use client";
import React from "react";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  hoverable?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export function PremiumCard({
  elevated = true,
  hoverable = true,
  glass = false,
  className = "",
  children,
  ...props
}: PremiumCardProps) {
  return (
    <>
      <style jsx>{`
        .premium-card {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
          background: var(--wada-paper, #F4EFE6);
        }

        .premium-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .premium-card.elevated {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .premium-card.hoverable {
          cursor: pointer;
        }

        .premium-card.hoverable:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .premium-card.hoverable:hover::before {
          opacity: 1;
        }

        .premium-card.glass {
          backdrop-filter: blur(10px);
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .premium-card.active {
          box-shadow: 0 0 0 2px #6B3A32;
        }
      `}</style>

      <div
        {...props}
        className={`
          premium-card
          ${elevated ? "elevated" : ""}
          ${hoverable ? "hoverable" : ""}
          ${glass ? "glass" : ""}
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
}
