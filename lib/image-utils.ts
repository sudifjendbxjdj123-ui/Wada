/**
 * Image Utilities — Safe image URL handling
 *
 * Transforms external image URLs through /api/img proxy for:
 * - CORS compliance
 * - Image optimization
 * - Caching
 * - Format conversion
 */

/**
 * Get display image URL - transforms external URLs through proxy
 *
 * @param image Primary image URL
 * @param largeImage Fallback to large image
 * @param defaultImage Final fallback (default: empty string)
 * @returns Safe image URL ready for <img> src
 */
export function getDisplayImageUrl(
  image?: string | null,
  largeImage?: string | null,
  defaultImage = "",
): string {
  const url = image || largeImage;

  // No image available
  if (!url) return defaultImage;

  // Already local or data URI
  if (url.startsWith("/") || url.startsWith("data:")) {
    return url;
  }

  // External URL - proxy through /api/img
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/img?u=${encodeURIComponent(url)}`;
  }

  // Relative URL (shouldn't happen but safe handling)
  return url;
}

/**
 * Batch transform image URLs
 */
export function normalizeImageUrls(
  images: Array<{ image?: string; largeImage?: string }>,
): string[] {
  return images
    .map((img) => getDisplayImageUrl(img.image, img.largeImage))
    .filter(Boolean);
}

/**
 * Create srcset for responsive images
 */
export function createImageSrcSet(
  baseUrl: string,
  sizes = ["400w", "800w", "1200w"],
): string {
  if (!baseUrl || !baseUrl.includes("/api/img")) {
    return baseUrl;
  }

  return sizes
    .map((size) => `${baseUrl}&size=${size} ${size}`)
    .join(", ");
}

/**
 * Get image with fallback
 */
export function getImageWithFallback(
  image?: string | null,
  largeImage?: string | null,
): string {
  const primary = getDisplayImageUrl(image);
  const fallback = getDisplayImageUrl(undefined, largeImage);

  return primary || fallback || "";
}
