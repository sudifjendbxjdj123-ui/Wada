/**
 * useMujiForSlotV2 — Advanced product fetching with caching & retry
 *
 * Improvements over V1:
 * - Product result caching (5 min TTL)
 * - Automatic retry with exponential backoff
 * - Better error recovery
 * - Performance optimization
 */

import { useEffect, useRef, useState } from "react";
import { fetchWithErrorHandling } from "@/lib/stylist/helpers";
import { getCachedProduct, setCachedProduct, generateProductCacheKey } from "@/lib/stylist/productCache";
import { retryWithBackoff } from "@/lib/stylist/retryWithBackoff";

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
  maxRetries?: number;
  useCache?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Advanced hook for fetching product with caching & retry
 *
 * Features:
 * - Proper error logging & recovery
 * - Timeout handling with abort
 * - Race condition prevention
 * - Full cleanup on unmount
 * - Data validation
 * - Product result caching
 * - Automatic retry with backoff
 */
export function useMujiForSlotV2(
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
  const retryCountRef = useRef(0);

  const { timeout = 5000, maxRetries = 3, useCache = true, onError } = options;

  useEffect(() => {
    // Clear previous error
    setError(null);
    retryCountRef.current = 0;

    // Skip if required params missing
    if (!slot || !colorHex) {
      setProduct(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentFetchId = ++fetchIdRef.current;

    // Check cache first
    if (useCache) {
      const cacheKey = generateProductCacheKey(slot, colorHex, style, genre);
      const cached = getCachedProduct(cacheKey);

      if (cached && currentFetchId === fetchIdRef.current) {
        setProduct(cached);
        setLoading(false);
        return;
      }
    }

    // Build query parameters
    const params = new URLSearchParams({
      slot,
      color: colorHex,
      limit: "1",
    });

    if (style) params.set("style", style);
    if (genre) params.set("genre", genre.toLowerCase());
    if (typeKeyword) params.set("q", typeKeyword);

    // Create abort controller for timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Execute fetch with retry
    (async () => {
      try {
        const res = await retryWithBackoff(
          async () => {
            const response = await fetch(`/api/products?${params}`, {
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            return response;
          },
          {
            maxRetries,
            initialDelayMs: 300,
            onRetry: (attempt) => {
              console.warn(`[useMujiForSlotV2] Retrying ${slot} (attempt ${attempt}/${maxRetries})`);
              retryCountRef.current = attempt;
            },
          },
        );

        // Check if this is still the latest fetch
        if (currentFetchId !== fetchIdRef.current) {
          console.debug("[useMujiForSlotV2] Ignoring stale fetch result");
          return;
        }

        // Parse response
        const data = await res.json();

        // Validate response structure
        if (!data?.products?.[0]) {
          const err = new Error("No products found");
          console.warn(`[useMujiForSlotV2] ${err.message} for ${slot}`);
          setError(err);
          setLoading(false);
          onError?.(err);
          return;
        }

        const p = data.products[0];

        // Validate required product fields
        if (!p.nom || typeof p.prix !== "number") {
          const err = new Error("Invalid product data");
          console.warn("[useMujiForSlotV2] Missing required fields:", p);
          setError(err);
          setLoading(false);
          onError?.(err);
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

          // Cache result
          if (useCache) {
            const cacheKey = generateProductCacheKey(slot, colorHex, style, genre);
            setCachedProduct(cacheKey, product);
          }
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
            console.warn(`[useMujiForSlotV2] Fetch timeout (${timeout}ms)`);
          } else {
            console.warn(`[useMujiForSlotV2] Fetch error: ${err.message}`);
          }
        } else {
          error = new Error("Unknown fetch error");
          console.warn("[useMujiForSlotV2] Unknown error:", err);
        }

        setError(error);
        setLoading(false);
        onError?.(error);
      }
    })();

    // Set timeout for abort
    const timeoutId = setTimeout(() => {
      if (controller && currentFetchId === fetchIdRef.current) {
        console.debug("[useMujiForSlotV2] Aborting fetch due to timeout");
        controller.abort();
      }
    }, timeout);

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
  }, [slot, colorHex, style, genre, typeKeyword, timeout, maxRetries, useCache, onError]);

  return {
    product,
    loading,
    error,
    retryCount: retryCountRef.current,
    retry: () => {
      // Trigger re-fetch by resetting state
      setProduct(null);
      setError(null);
      retryCountRef.current = 0;
      fetchIdRef.current += 1;
    },
  };
}
