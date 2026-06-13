/**
 * useMujiForSlot — Improved product fetching hook
 *
 * Replaces the inline hook in StylistPageContent.tsx with proper:
 * - Error handling & logging
 * - Timeout management
 * - Race condition prevention
 * - Data validation
 * - Cleanup on unmount
 */

import { useEffect, useRef, useState } from "react";
import { fetchWithErrorHandling } from "@/lib/stylist/helpers";

interface MujiProduct {
  nom: string;
  marque: string;
  marchand?: string;
  marchandSlug?: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
}

interface UseMujiProductOptions {
  timeout?: number;
  onError?: (error: Error) => void;
}

/**
 * Improved hook for fetching product for a slot
 *
 * Features:
 * - Proper error logging & recovery
 * - Timeout handling with abort
 * - Race condition prevention
 * - Full cleanup on unmount
 * - Data validation
 */
export function useMujiForSlot(
  slot: string | null,
  colorHex: string | null,
  style: string | null = null,
  genre: string | null = null,
  typeKeyword: string | null = null,
  options: UseMujiProductOptions = {},
) {
  const [product, setProduct] = useState<MujiProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track fetch ID to prevent race conditions
  const fetchIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous error
    setError(null);

    // Skip if required params missing
    if (!slot || !colorHex) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentFetchId = ++fetchIdRef.current;

    // Build query parameters
    const params = new URLSearchParams({
      slot,
      color: colorHex,
      limit: "1",
    });

    // Add optional filters
    if (style) params.set("style", style);
    if (genre) params.set("genre", genre.toLowerCase());
    if (typeKeyword) params.set("q", typeKeyword);

    // Create abort controller for timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutMs = options.timeout ?? 5000;

    // Execute fetch with error handling
    (async () => {
      try {
        const res = await fetch(`/api/products?${params}`, {
          signal: controller.signal,
        });

        // Check if this is still the latest fetch
        if (currentFetchId !== fetchIdRef.current) {
          console.debug("[useMujiForSlot] Ignoring stale fetch result");
          return;
        }

        // Handle HTTP errors
        if (!res.ok) {
          const err = new Error(`HTTP ${res.status}`);
          console.warn(`[useMujiForSlot] API error: ${err.message}`);
          setError(err);
          setLoading(false);
          return;
        }

        // Parse response
        const data = await res.json();

        // Validate response structure
        if (!data?.products?.[0]) {
          const err = new Error("No products found");
          console.warn(`[useMujiForSlot] ${err.message} for ${slot}`);
          setError(err);
          setLoading(false);
          return;
        }

        const p = data.products[0];

        // Validate required product fields
        if (!p.nom || typeof p.prix !== "number") {
          const err = new Error("Invalid product data");
          console.warn("[useMujiForSlot] Missing required fields:", p);
          setError(err);
          setLoading(false);
          return;
        }

        // Pick best image quality
        const displayImage = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";

        // Create product object
        const product: MujiProduct = {
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          marchand: p.marchand,
          marchandSlug: p.marchandSlug,
          image: displayImage,
          prix: p.prix,
          devise: p.devise || "€",
          url: p.urlProduit || "#",
        };

        // Only update if still latest fetch
        if (currentFetchId === fetchIdRef.current) {
          setProduct(product);
          setLoading(false);
        }
      } catch (err) {
        // Only handle if still latest fetch
        if (currentFetchId !== fetchIdRef.current) {
          return;
        }

        let error: Error;
        if (err instanceof Error) {
          error = err;
          if (err.name === "AbortError") {
            console.warn(`[useMujiForSlot] Fetch timeout (${timeoutMs}ms)`);
          } else {
            console.warn(`[useMujiForSlot] Fetch error: ${err.message}`);
          }
        } else {
          error = new Error("Unknown fetch error");
          console.warn("[useMujiForSlot] Unknown error:", err);
        }

        setError(error);
        setLoading(false);
        options.onError?.(error);
      }
    })();

    // Set timeout for abort
    const timeoutId = setTimeout(() => {
      if (controller && currentFetchId === fetchIdRef.current) {
        console.debug("[useMujiForSlot] Aborting fetch due to timeout");
        controller.abort();
      }
    }, timeoutMs);

    // Cleanup on unmount or dependency change
    return () => {
      // Mark fetch as stale
      fetchIdRef.current = 0;

      // Abort in-flight request
      if (controller) {
        controller.abort();
        abortControllerRef.current = null;
      }

      // Clear timeout
      clearTimeout(timeoutId);
    };
  }, [slot, colorHex, style, genre, typeKeyword, options.timeout]);

  return {
    product,
    loading,
    error,
    retry: () => {
      // Trigger re-fetch by resetting state
      setProduct(null);
      setError(null);
      fetchIdRef.current += 1;
    },
  };
}
