"use client";
/**
 * /tier3-showcase — Démonstration des animations et features TIER 3
 * Cette page showcase tous les composants et animations premium:
 * - Social proof badges
 * - AR preview mockups
 * - Advanced animations (reveal, bounce, glow, float)
 * - Gesture support demo
 * - Loading states
 */

import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import SocialProofBadge from "@/components/SocialProofBadge";
import ARPreviewMock from "@/components/ARPreviewMock";

const palette = {
  bg: "#F4EFE7",
  card: "#FBF9F5",
  ink: "#1E1E1E",
  bordeaux: "#6B3A32",
  olive: "#A8B29A",
  line: "rgba(30,30,30,.10)",
};

const fonts = { display: "'Fredoka', sans-serif", sans: "'Inter', sans-serif" };

export default function Tier3Showcase() {
  const [activeTab, setActiveTab] = useState<
    "badges" | "animations" | "ar" | "loading"
  >("badges");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.bg,
        fontFamily: fonts.sans,
      }}
    >
      <BackButton />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: "clamp(32px, 4vw, 44px)",
            margin: 0,
            marginBottom: 8,
          }}
        >
          TIER 3 Showcase
        </h1>
        <p style={{ color: palette.bordeaux, marginTop: 0, marginBottom: 32 }}>
          Animations & premium features démonstration
        </p>

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 32,
            borderBottom: `2px solid ${palette.line}`,
            paddingBottom: 12,
          }}
        >
          {(
            ["badges", "animations", "ar", "loading"] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 18px",
                border: "none",
                background: activeTab === tab ? palette.bordeaux : "transparent",
                color: activeTab === tab ? "#fff" : palette.ink,
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s ease",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {activeTab === "badges" && (
          <div className="wada-reveal-item" style={{ display: "grid", gap: 24 }}>
            <div>
              <h2 style={{ fontFamily: fonts.display, fontSize: 18, margin: "0 0 12px" }}>
                Social Proof Badges
              </h2>
              <div
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.line}`,
                  borderRadius: 16,
                  padding: 24,
                  display: "grid",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <SocialProofBadge type="loved" count={250} animated />
                  <SocialProofBadge type="trending" animated />
                  <SocialProofBadge type="pick" animated />
                  <SocialProofBadge type="new" animated />
                </div>
                <p style={{ color: palette.bordeaux, margin: 0, fontSize: 12 }}>
                  Badges avec animation float (monte/descend doucement)
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "animations" && (
          <div style={{ display: "grid", gap: 32 }}>
            <div className="wada-reveal-item">
              <h2 style={{ fontFamily: fonts.display, fontSize: 18, margin: "0 0 12px" }}>
                Reveal Sequence
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 12,
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="wada-reveal-item"
                    style={{
                      background: palette.card,
                      border: `1px solid ${palette.line}`,
                      borderRadius: 12,
                      padding: 16,
                      textAlign: "center",
                      minHeight: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Item {i + 1}
                  </div>
                ))}
              </div>
              <p style={{ color: palette.bordeaux, marginTop: 12, fontSize: 12 }}>
                Cascade animation: chaque élément pop avec délai croissant
              </p>
            </div>

            <div className="wada-reveal-item">
              <h2 style={{ fontFamily: fonts.display, fontSize: 18, margin: "0 0 12px" }}>
                Animation Effects
              </h2>
              <div style={{ display: "grid", gap: 12 }}>
                <div
                  className="wada-bounce"
                  style={{
                    background: palette.bordeaux,
                    color: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  Bounce Effect (hover)
                </div>
                <div
                  className="wada-float"
                  style={{
                    background: palette.olive,
                    color: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  Float Animation
                </div>
                <div
                  className="wada-cta-glow"
                  style={{
                    background: palette.bordeaux,
                    color: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    textAlign: "center",
                  }}
                >
                  Glow Effect
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ar" && (
          <div className="wada-reveal-item">
            <h2 style={{ fontFamily: fonts.display, fontSize: 18, margin: "0 0 12px" }}>
              AR Preview Mockups
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 20,
              }}
            >
              <ARPreviewMock
                colors={[
                  { hex: "#6B3A32", name: "Bordeaux" },
                  { hex: "#A8B29A", name: "Olive" },
                  { hex: "#E8DFD0", name: "Cream" },
                  { hex: "#1E1E1E", name: "Ink" },
                  { hex: "#F4EFE7", name: "Beige" },
                ]}
                paletteNo="042"
                paletteName="Harmonie Terre"
                mode="palette"
              />
              <ARPreviewMock
                colors={[
                  { hex: "#2563EB", name: "Blue" },
                  { hex: "#60A5FA", name: "Sky" },
                  { hex: "#DBEAFE", name: "Light" },
                ]}
                paletteNo="156"
                paletteName="Ocean Dreams"
                mode="palette"
              />
            </div>
            <p style={{ color: palette.bordeaux, marginTop: 12, fontSize: 12 }}>
              Fake AR preview avec scanlines + crosshair + color strips
            </p>
          </div>
        )}

        {activeTab === "loading" && (
          <div className="wada-reveal-item">
            <h2 style={{ fontFamily: fonts.display, fontSize: 18, margin: "0 0 12px" }}>
              Loading States
            </h2>
            <div
              style={{
                background: palette.card,
                border: `1px solid ${palette.line}`,
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <div className="wada-loader-ring" />
              </div>
              <p style={{ color: palette.bordeaux, fontSize: 12 }}>Spinner animé</p>

              <div
                style={{
                  marginTop: 24,
                  background: palette.bg,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  className="wada-skeleton"
                  style={{ height: 20, marginBottom: 8 }}
                />
                <div
                  className="wada-skeleton"
                  style={{ height: 20, width: "80%" }}
                />
              </div>
              <p style={{ color: palette.bordeaux, fontSize: 12, marginTop: 12 }}>
                Skeleton loaders avec shimmer
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .wada-reveal-item:nth-child(1) {
          animation-delay: 0.05s;
        }
        .wada-reveal-item:nth-child(2) {
          animation-delay: 0.1s;
        }
        .wada-reveal-item:nth-child(3) {
          animation-delay: 0.15s;
        }
      `}</style>
    </main>
  );
}
