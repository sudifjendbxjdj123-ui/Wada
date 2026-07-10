"use client";
/**
 * OutfitCompositionLoader — Advanced loading UI for outfit composition
 *
 * Shows detailed progress as WADA:
 * 1. Analyzes user preferences
 * 2. Searches palette database
 * 3. Matches products by color, style, registre
 * 4. Validates coherence with LLM
 * 5. Renders final outfit
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { paper, ink, textSecondary, fontHeading, fontBody, fontLabel, border, mojo } from "@/lib/styles";

type CompositionStep = "analyze" | "palette" | "match" | "validate" | "render";

const STEPS: { key: CompositionStep; label: string; description: string }[] = [
  { key: "analyze", label: "Analyse", description: "Lecture de votre profil" },
  { key: "palette", label: "Palette", description: "Recherche dans 348 accords" },
  { key: "match", label: "Matching", description: "Sélection des pièces" },
  { key: "validate", label: "Validation", description: "Vérification cohérence" },
  { key: "render", label: "Composition", description: "Finition de la tenue" },
];

export function OutfitCompositionLoader({ currentStep = "analyze" }: { currentStep?: CompositionStep }) {
  const [animatedSteps, setAnimatedSteps] = useState<number>(0);

  useEffect(() => {
    // Cycle through steps with animation
    const interval = setInterval(() => {
      setAnimatedSteps((prev) => Math.min(prev + 1, STEPS.length));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const displaySteps = Math.max(currentStepIndex + 1, animatedSteps);

  return (
    <main style={{
      minHeight: "100vh",
      background: paper,
      color: ink,
      fontFamily: fontBody,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Back button */}
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "24px 5%" }}>
        <Link
          href="/palettes"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: ink,
            textDecoration: "none",
            fontFamily: fontLabel,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`,
            borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>

      {/* Main loading content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 5%",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: mojo,
          marginBottom: 18,
        }}>
          Composition de votre tenue
        </p>

        <h1 style={{
          fontFamily: fontHeading,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "clamp(30px, 5vw, 48px)",
          margin: 0,
          letterSpacing: "-0.01em",
          marginBottom: 8,
        }}>
          On vous prépare ça…
        </h1>

        <p style={{
          marginTop: 8,
          marginBottom: 48,
          color: textSecondary,
          maxWidth: "42ch",
          lineHeight: 1.6,
        }}>
          WADA croise vos préférences avec les 348 palettes du dictionnaire.
        </p>

        {/* Progress steps */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: 420,
        }}>
          {STEPS.map((step, i) => {
            const isCompleted = i < displaySteps - 1;
            const isActive = i === displaySteps - 1;
            const isPending = i > displaySteps - 1;

            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  opacity: isPending ? 0.4 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                {/* Step indicator */}
                <div
                  style={{
                    minWidth: 28,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isCompleted ? "#6B3A32" : isActive ? "#6B3A32" : "#E8DFD0",
                    color: isCompleted || isActive ? "#fff" : "#6B3A32",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                    position: "relative",
                    marginTop: 4,
                  }}
                >
                  {isCompleted ? (
                    <span>✓</span>
                  ) : isActive ? (
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#fff",
                        animation: "wada-ocl-pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  ) : (
                    i + 1
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontWeight: 600,
                      fontSize: 14,
                      color: isActive ? "#6B3A32" : ink,
                    }}
                  >
                    {step.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: textSecondary,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Animated swatches below */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 48,
            justifyContent: "center",
          }}
          aria-hidden
        >
          {["#E8C8A0", "#A8B29A", "#C9A06A", "#6B3A32", "#7A8B5A"].map((hex, i) => (
            <div
              key={`${hex}-${i}`}
              style={{
                width: 44,
                height: 56,
                borderRadius: 12,
                background: hex,
                boxShadow: "inset 0 0 0 1px rgba(30,30,30,.08), 0 8px 20px -12px rgba(30,30,30,.5)",
                animation: `wada-ocl-pulse-swatch 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.13}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        /* Fix 2026-06-14 « keyframes conflict » : préfixé wada-ocl- pour
           éviter le clash avec OutfitCompositionLoaderDetailed qui définit
           les mêmes noms globaux (dernier mounté gagnait sinon). */
        @keyframes wada-ocl-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes wada-ocl-pulse-swatch {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
            opacity: 0.85;
          }
        }
      `}</style>
    </main>
  );
}
