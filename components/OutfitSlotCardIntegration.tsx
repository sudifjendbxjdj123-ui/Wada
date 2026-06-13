"use client";
/**
 * OutfitSlotCardIntegration — Complete example integration
 *
 * Shows how to use:
 * - useMujiForSlot hook
 * - OutfitSlotCard component
 * - Error handling
 * - Skeleton loaders
 */

import { useMujiForSlot } from "@/app/stylist/useMujiProductHook";
import { OutfitSlotCard } from "./OutfitSlotCard";

interface OutfitSlotCardIntegrationProps {
  slot: string;
  colorHex: string | null;
  style?: string | null;
  genre?: string | null;
  typeKeyword?: string | null;
  onError?: (error: Error) => void;
}

/**
 * Complete integrated slot card with loading, error, and success states
 *
 * Usage:
 * <OutfitSlotCardIntegration
 *   slot="top"
 *   colorHex="#8B4513"
 *   style="casual"
 *   onError={(err) => console.log(err)}
 * />
 */
export function OutfitSlotCardIntegration({
  slot,
  colorHex,
  style,
  genre,
  typeKeyword,
  onError,
}: OutfitSlotCardIntegrationProps) {
  // Use improved hook with proper error handling & timeout
  const { product, loading, error, retry } = useMujiForSlot(
    slot,
    colorHex,
    style,
    genre,
    typeKeyword,
    { timeout: 5000, onError },
  );

  return (
    <OutfitSlotCard
      slot={slot}
      product={product}
      loading={loading}
      error={error}
      onRetry={retry}
    />
  );
}
