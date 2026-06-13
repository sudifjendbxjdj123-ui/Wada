/**
 * Stylist Helper Functions — Robust error handling & data validation
 *
 * Centralizes all the stylist logic for:
 * - Data fetching with error recovery
 * - JSON parsing with validation
 * - Color matching & palette selection
 * - Product composition
 */

import type { DictionaryEntry } from "@/lib/data";
import { dictionary } from "@/lib/data";

/**
 * Safely parse localStorage JSON with type validation
 * @returns Parsed object or null if invalid/missing
 */
export function safeParseJSON<T>(
  raw: string | null,
  validator?: (data: unknown) => data is T,
): T | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    // If validator provided, check the structure
    if (validator && !validator(parsed)) {
      console.warn("[stylist] JSON validation failed", raw.slice(0, 50));
      return null;
    }

    return parsed as T;
  } catch (err) {
    console.warn("[stylist] JSON parse failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Fetch product for a slot with error recovery
 * Handles network errors, missing products, and timeout
 */
export async function fetchProductForSlot(
  slot: string,
  colorHex: string,
  style?: string | null,
  genre?: string | null,
  typeKeyword?: string | null,
  timeout = 5000,
): Promise<{
  nom: string;
  marque: string;
  marchand?: string;
  marchandSlug?: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
} | null> {
  if (!slot || !colorHex) return null;

  const params = new URLSearchParams({ slot, color: colorHex, limit: "1" });

  // Add optional filters
  if (style) params.set("style", style);
  if (genre) params.set("genre", genre.toLowerCase());
  if (typeKeyword) params.set("q", typeKeyword);

  try {
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`/api/products?${params}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    // Check HTTP status
    if (!res.ok) {
      console.warn(`[stylist] Product fetch failed: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    // Validate response structure
    if (!data?.products?.[0]) {
      console.warn(`[stylist] No products found for ${slot}`);
      return null;
    }

    const p = data.products[0];

    // Validate required fields
    if (!p.nom || !p.prix) {
      console.warn("[stylist] Product missing required fields", p);
      return null;
    }

    // Pick best image quality
    const displayImage = p.imageLocal
      ? p.imageLocal
      : p.largeImage
        ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
        : p.image
          ? `/api/img?u=${encodeURIComponent(p.image)}`
          : "";

    return {
      nom: p.nom,
      marque: p.marque || p.marchand || "MUJI",
      marchand: p.marchand,
      marchandSlug: p.marchandSlug,
      image: displayImage,
      prix: typeof p.prix === "number" ? p.prix : 0,
      devise: p.devise || "€",
      url: p.urlProduit || "#",
    };
  } catch (err) {
    // More specific error logging
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.warn(`[stylist] Product fetch timeout for ${slot}`);
      } else {
        console.warn(`[stylist] Product fetch error: ${err.message}`);
      }
    } else {
      console.warn("[stylist] Product fetch unknown error");
    }
    return null;
  }
}

/**
 * Find best matching palette for a color
 * Uses color engine or falls back to first palette
 */
export function findPaletteForColor(
  colorHex: string | null,
  style: string | null,
): DictionaryEntry | null {
  if (!colorHex) {
    // Fallback: first palette or random
    return dictionary[0] || null;
  }

  try {
    // Simple approach: find palette with color closest to target
    // In production, use deltaEHex from colorEngine
    const withColor = dictionary.find((d) =>
      d.colors?.some((c) => c.hex && isCloseColor(c.hex, colorHex)),
    );

    return withColor || dictionary[0] || null;
  } catch (err) {
    console.warn("[stylist] Palette search failed:", err);
    return dictionary[0] || null;
  }
}

/**
 * Simple color distance check (not perfect, but fast)
 */
function isCloseColor(hex1: string, hex2: string, tolerance = 30): boolean {
  try {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2),
    );

    return distance < tolerance;
  } catch {
    return false;
  }
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

/**
 * Validate user preferences object
 */
export function validateUserPrefs(data: unknown): data is {
  gender?: string;
  style?: string;
  budget?: number;
  [key: string]: unknown;
} {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check optional fields have correct types
  if (obj.gender && typeof obj.gender !== "string") return false;
  if (obj.style && typeof obj.style !== "string") return false;
  if (obj.budget && typeof obj.budget !== "number") return false;

  return true;
}

/**
 * Load user preferences with validation
 */
export function loadUserPreferences() {
  try {
    const profileRaw = typeof window !== "undefined" ? localStorage.getItem("wada.profile") : null;
    const profile = safeParseJSON(profileRaw, validateUserPrefs);

    const prefsRaw = typeof window !== "undefined" ? localStorage.getItem("wada-prefs") : null;
    const prefs = safeParseJSON(prefsRaw, validateUserPrefs);

    return { profile, prefs };
  } catch (err) {
    console.warn("[stylist] Failed to load preferences:", err);
    return { profile: null, prefs: null };
  }
}

/**
 * Fetch from API with proper error handling and timeout
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit & { timeout?: number; validator?: (data: unknown) => data is T } = {},
): Promise<T | null> {
  const { timeout = 8000, validator, ...fetchOptions } = options;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[stylist] API error: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (validator && !validator(data)) {
      console.warn("[stylist] API response validation failed");
      return null;
    }

    return data as T;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.warn("[stylist] API request timeout");
      } else {
        console.warn(`[stylist] API error: ${err.message}`);
      }
    }
    return null;
  }
}
