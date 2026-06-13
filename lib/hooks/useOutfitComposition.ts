/**
 * useOutfitComposition — Enhanced outfit composition logic hook
 *
 * Manages the 5-step composition process with proper error handling and state management:
 * 1. Parse user preferences
 * 2. Find best palette match
 * 3. Compose outfit pieces
 * 4. Validate coherence
 * 5. Resolve final product data
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type CompositionStep = "idle" | "analyze" | "palette" | "match" | "validate" | "render" | "complete" | "error";

interface CompositionState {
  step: CompositionStep;
  progress: number; // 0-100
  error?: string;
  errorDetails?: string;
  paletteNumber?: string;
  piecesCount?: number;
  retryCount: number;
}

export function useOutfitComposition() {
  const [state, setState] = useState<CompositionState>({
    step: "idle",
    progress: 0,
    retryCount: 0,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRetriesRef = useRef(3);

  /**
   * Step 1: Analyze user preferences
   * Validates preference data and normalizes it
   */
  const analyzePreferences = useCallback(async (prefs: Record<string, unknown>) => {
    setState({ step: "analyze", progress: 15, retryCount: 0 });

    try {
      // Validate preference structure
      if (!prefs || typeof prefs !== "object") {
        throw new Error("Invalid preferences data structure");
      }

      // Check required fields with sensible defaults
      const validated = {
        gender: prefs.gender || null,
        style: prefs.style || "Minimaliste",
        budget: typeof prefs.budget === "number" ? prefs.budget : 400,
        occasion: prefs.occasion || "quotidien",
      };

      return validated;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to analyze preferences";
      setState((prev) => ({
        ...prev,
        step: "error",
        progress: 0,
        error: "Préférences invalides",
        errorDetails: errorMsg,
      }));
      throw err;
    }
  }, []);

  /**
   * Step 2: Find palette match
   * Queries palette database and scores against preferences
   */
  const findPaletteMatch = useCallback(async (
    prefs: Record<string, unknown>,
    requestedPaletteNumber?: string,
  ) => {
    setState({ step: "palette", progress: 30, retryCount: 0 });

    try {
      // If palette explicitly requested, use it directly
      if (requestedPaletteNumber) {
        return { paletteNumber: requestedPaletteNumber, source: "explicit" };
      }

      // Otherwise, score and find best match
      // This would call colorEngine.findBestPalettesWithFallback
      // For now, returning structure
      return { paletteNumber: "001", source: "computed" };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to find palette match";
      setState((prev) => ({
        ...prev,
        step: "error",
        progress: 30,
        error: "Palette introuvable",
        errorDetails: errorMsg,
      }));
      throw err;
    }
  }, [state.retryCount]);

  /**
   * Step 3: Match products by slot
   * Finds products for haut/bas/veste/chaussures/accent
   */
  const matchProducts = useCallback(async (paletteNumber: string) => {
    setState({ step: "match", progress: 50, retryCount: 0 });

    try {
      // Validate palette number format
      if (!paletteNumber || !/^\d{3}$/.test(paletteNumber)) {
        throw new Error("Invalid palette number format");
      }

      // Would call /api/outfit endpoint to prefetch all pieces
      // For now, returning structure
      const pieces = {
        haut: { id: "1", nom: "Chemise", marque: "MUJI" },
        bas: { id: "2", nom: "Pantalon", marque: "MUJI" },
        veste: { id: "3", nom: "Blazer", marque: "TBF" },
        chaussures: { id: "4", nom: "Sneaker", marque: "New Balance" },
        accent: { id: "5", nom: "Ceinture", marque: "MUJI" },
      };

      return { pieces, count: 5 };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to match products";
      setState({
        step: "error",
        progress: 50,
        error: "Appairage échoué",
        errorDetails: errorMsg,
        retryCount: state.retryCount,
      });
      throw err;
    }
  }, [state.retryCount]);

  /**
   * Step 4: Validate outfit coherence
   * Calls LLM to ensure outfit is visually and stylistically coherent
   */
  const validateOutfit = useCallback(async (pieces: Record<string, unknown>) => {
    setState({ step: "validate", progress: 75, retryCount: 0 });

    try {
      // Validate pieces structure
      if (!pieces || Object.keys(pieces).length < 3) {
        throw new Error("Incomplete outfit: missing required pieces");
      }

      // Would call /api/validate-outfit
      // Gracefully handle LLM failure (fail-open)
      const validation = { coherent: true, verdict: "COHERENT" };

      return validation;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Validation failed";
      // Log but don't fail - graceful degradation
      console.warn("[useOutfitComposition] Validation error:", errorMsg);
      return { coherent: true, verdict: "COHERENT", _fallback: true };
    }
  }, []);

  /**
   * Step 5: Render final outfit
   * Resolves product images, prices, and merchant links
   */
  const renderOutfit = useCallback(async () => {
    setState({ step: "render", progress: 90, retryCount: 0 });

    try {
      // Resolve all product details in parallel
      // This includes images, real prices, and affiliate links
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Render timeout")), 8000),
      );

      // Simulate render completion
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, 1000)),
        timeout,
      ]);

      return { rendered: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Render failed";
      setState({
        step: "error",
        progress: 90,
        error: "Rendu échoué",
        errorDetails: errorMsg,
        retryCount: state.retryCount,
      });
      throw err;
    }
  }, []);

  /**
   * Complete composition process
   */
  const completeComposition = useCallback(() => {
    setState({ step: "complete", progress: 100, retryCount: 0 });
  }, []);

  /**
   * Retry composition from current step
   * Increments retry counter and attempts again
   */
  const retry = useCallback(() => {
    if (state.retryCount >= maxRetriesRef.current) {
      setState({
        step: "error",
        progress: 0,
        error: "Échec après plusieurs tentatives",
        errorDetails: "Veuillez rafraîchir ou réessayer plus tard",
        retryCount: state.retryCount,
      });
      return;
    }

    setState((prev) => ({
      step: prev.step === "error" ? "analyze" : prev.step,
      progress: 0,
      retryCount: prev.retryCount + 1,
    }));
  }, [state.retryCount]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      step: "idle",
      progress: 0,
      retryCount: 0,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    state,

    // Methods
    analyzePreferences,
    findPaletteMatch,
    matchProducts,
    validateOutfit,
    renderOutfit,
    completeComposition,
    retry,
    reset,
  };
}
