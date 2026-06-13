/**
 * Product Caching System — Avoid refetching same products
 *
 * Caches product results in memory with TTL
 * Reduces API load and improves performance
 */

interface CachedProduct {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const productCache = new Map<string, CachedProduct>();

/**
 * Generate cache key from product parameters
 */
export function generateProductCacheKey(
  slot: string,
  colorHex: string,
  style?: string | null,
  genre?: string | null,
): string {
  return `${slot}:${colorHex}:${style || ""}:${genre || ""}`;
}

/**
 * Get cached product if valid
 */
export function getCachedProduct(key: string) {
  const cached = productCache.get(key);

  if (!cached) return null;

  // Check TTL
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    productCache.delete(key);
    return null;
  }

  console.debug(`[productCache] Cache hit: ${key} (age: ${Math.round(age / 1000)}s)`);
  return cached.data;
}

/**
 * Set product in cache
 */
export function setCachedProduct(key: string, data: any) {
  productCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  console.debug(`[productCache] Cached: ${key}`);
}

/**
 * Clear entire cache (admin only)
 */
export function clearProductCache() {
  const size = productCache.size;
  productCache.clear();
  console.debug(`[productCache] Cleared ${size} entries`);
}

/**
 * Get cache stats
 */
export function getProductCacheStats() {
  const validEntries = Array.from(productCache.entries()).filter(([_, cached]) => {
    const age = Date.now() - cached.timestamp;
    return age <= CACHE_TTL;
  });

  return {
    total: productCache.size,
    valid: validEntries.length,
    expired: productCache.size - validEntries.length,
    ttlMs: CACHE_TTL,
  };
}
