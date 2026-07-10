"use client";
/**
 * OutfitCompositionLoaderDetailed — Ultra-detailed progress UI
 *
 * Shows granular sub-steps within each major phase for complete transparency
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { paper, ink, textSecondary, fontHeading, fontBody, fontLabel, border, mojo } from "@/lib/styles";

type DetailedStep = {
  phase: string;
  phaseEmoji: string;
  substeps: Array<{
    id: string;
    label: string;
    description: string;
  }>;
};

const DETAILED_STEPS: DetailedStep[] = [
  {
    phase: "Analyse",
    phaseEmoji: "🔍",
    substeps: [
      { id: "pref-read", label: "Lecture profil", description: "Récupération depuis localStorage" },
      { id: "pref-validate", label: "Validation", description: "Vérification intégrité données" },
      { id: "pref-normalize", label: "Normalisation", description: "Mapping legacy → nouveau format" },
    ],
  },
  {
    phase: "Palette",
    phaseEmoji: "🎨",
    substeps: [
      { id: "palette-search", label: "Recherche", description: "Parcours des 348 accords" },
      { id: "palette-score", label: "Scoring", description: "Calcul ΔE et cohérence style" },
      { id: "palette-rank", label: "Classement", description: "Tri par score décroissant" },
    ],
  },
  {
    phase: "Appairage",
    phaseEmoji: "👗",
    substeps: [
      { id: "match-filter", label: "Filtrage", description: "Style, registre, budget" },
      { id: "match-color", label: "Couleurs", description: "ΔE couleur palette ↔ produit" },
      { id: "match-cohesion", label: "Cohésion", description: "Évite les tailles extrêmes" },
    ],
  },
  {
    phase: "Validation",
    phaseEmoji: "✨",
    substeps: [
      { id: "valid-structure", label: "Structure", description: "Présence 5 pièces minimum" },
      { id: "valid-llm", label: "LLM check", description: "Validation cohérence IA" },
      { id: "valid-safety", label: "Sécurité", description: "Pas de contenu problématique" },
    ],
  },
  {
    phase: "Composition",
    phaseEmoji: "📦",
    substeps: [
      { id: "render-images", label: "Images", description: "Chargement photos produits" },
      { id: "render-prices", label: "Prix", description: "Récupération prix réels" },
      { id: "render-flatlay", label: "Flat-lay", description: "Génération collage stylist" },
    ],
  },
];

export function OutfitCompositionLoaderDetailed() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string>("pref-read");

  // Simulate progression through steps
  useEffect(() => {
    const allStepIds = DETAILED_STEPS.flatMap((p) => p.substeps.map((s) => s.id));
    let index = 0;

    const interval = setInterval(() => {
      if (index < allStepIds.length) {
        setCurrentStep(allStepIds[index]);
        setCompletedSteps((prev) => new Set([...prev, allStepIds[index]]));
        index++;
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: paper,
        color: ink,
        fontFamily: fontBody,
        display: "flex",
        flexDirection: "column",
      }}
    >
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
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>
            ←
          </span>
          <span>Retour</span>
        </Link>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 5%",
          maxWidth: 600,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: mojo,
            marginBottom: 18,
          }}
        >
          Composition en cours
        </p>

        <h1
          style={{
            fontFamily: fontHeading,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "clamp(28px, 4vw, 42px)",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          On prépare votre tenue…
        </h1>

        <p
          style={{
            marginTop: 8,
            marginBottom: 40,
            color: textSecondary,
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Chaque étape assure une tenue parfaite pour vous
        </p>

        {/* Phases with substeps */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
          {DETAILED_STEPS.map((phase, phaseIndex) => {
            const phaseIsActive = phase.substeps.some((s) => s.id === currentStep);
            const phaseIsCompleted = phase.substeps.every((s) => completedSteps.has(s.id));

            return (
              <div key={phase.phase}>
                {/* Phase header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                    opacity: phaseIsCompleted || phaseIsActive ? 1 : 0.5,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      opacity: phaseIsActive ? 1 : 0.6,
                    }}
                  >
                    {phase.phaseEmoji}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 14,
                        color: phaseIsActive ? "#6B3A32" : ink,
                      }}
                    >
                      {phase.phase}
                    </h3>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: textSecondary,
                      }}
                    >
                      {phaseIsCompleted
                        ? "✓ Complété"
                        : phaseIsActive
                          ? "En cours…"
                          : "En attente"}
                    </p>
                  </div>
                </div>

                {/* Substeps */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginLeft: 36 }}>
                  {phase.substeps.map((substep) => {
                    const isCompleted = completedSteps.has(substep.id);
                    const isActive = substep.id === currentStep;

                    return (
                      <div
                        key={substep.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: isCompleted
                            ? "rgba(107, 58, 50, 0.08)"
                            : isActive
                              ? "rgba(107, 58, 50, 0.12)"
                              : "transparent",
                          border: isActive ? `1px solid #6B3A32` : `1px solid transparent`,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          opacity: isCompleted || isActive ? 1 : 0.4,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {/* Status indicator */}
                        <div
                          style={{
                            minWidth: 20,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: isCompleted ? "#6B3A32" : isActive ? "#6B3A32" : "#E8DFD0",
                            color: isCompleted || isActive ? "#fff" : "#6B3A32",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          {isCompleted ? (
                            <span>✓</span>
                          ) : isActive ? (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#fff",
                                animation: "wada-ocld-pulse 1.5s ease-in-out infinite",
                              }}
                            />
                          ) : (
                            <span>○</span>
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: isActive ? 600 : 500,
                              fontSize: 12,
                              color: isActive ? "#6B3A32" : ink,
                            }}
                          >
                            {substep.label}
                          </p>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: 11,
                              color: textSecondary,
                            }}
                          >
                            {substep.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall progress */}
        <div style={{ width: "100%", marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: textSecondary }}>
              Progression globale
            </p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#6B3A32" }}>
              {Math.round((completedSteps.size / 15) * 100)}%
            </p>
          </div>
          <div
            style={{
              height: 6,
              background: "rgba(107, 58, 50, 0.1)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(completedSteps.size / 15) * 100}%`,
                background: "linear-gradient(90deg, #6B3A32, #8B4A3E)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Color swatches */}
        <div style={{ display: "flex", gap: 8, marginTop: 36, justifyContent: "center" }} aria-hidden>
          {["#E8C8A0", "#A8B29A", "#C9A06A", "#6B3A32", "#7A8B5A"].map((hex, i) => (
            <div
              key={`${hex}-${i}`}
              style={{
                width: 36,
                height: 48,
                borderRadius: 10,
                background: hex,
                boxShadow:
                  "inset 0 0 0 1px rgba(30,30,30,.08), 0 6px 16px -10px rgba(30,30,30,.4)",
                animation: `wada-ocld-pulse-swatch 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.13}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        /* Fix 2026-06-14 « keyframes conflict » : préfixé wada-ocld- pour
           éviter le clash avec OutfitCompositionLoader. */
        @keyframes wada-ocld-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes wada-ocld-pulse-swatch {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] {
            animation: none !important;
            opacity: 0.85 !important;
          }
        }
      `}</style>
    </main>
  );
}
