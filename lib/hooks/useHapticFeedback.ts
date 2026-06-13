/**
 * useHapticFeedback — Mobile haptic feedback hook
 *
 * Provides haptic feedback patterns for better UX
 * Gracefully degrades on devices without vibration API
 */

type HapticPattern = "tap" | "success" | "error" | "warning" | "double-tap";

const PATTERNS: Record<HapticPattern, number[]> = {
  tap: [30],
  success: [100, 50, 100],
  error: [200],
  warning: [100, 100, 100],
  "double-tap": [50, 100, 50],
};

export function useHapticFeedback() {
  // Check if vibration API is available
  const isSupported = typeof navigator !== "undefined" && !!navigator.vibrate;

  /**
   * Trigger haptic feedback pattern
   */
  const trigger = (pattern: HapticPattern | number[]) => {
    if (!isSupported) return;

    const pattern_array = typeof pattern === "string" ? PATTERNS[pattern] : pattern;

    try {
      navigator.vibrate(pattern_array);
    } catch (err) {
      console.debug("[useHapticFeedback] Vibration failed:", err);
    }
  };

  return {
    isSupported,
    trigger,
    // Convenience methods
    tap: () => trigger("tap"),
    success: () => trigger("success"),
    error: () => trigger("error"),
    warning: () => trigger("warning"),
    doubleTap: () => trigger("double-tap"),
    custom: (pattern: number[]) => trigger(pattern),
  };
}

/**
 * Example usage:
 *
 * const { trigger, success, error } = useHapticFeedback();
 *
 * // On successful outfit composition
 * success(); // [100, 50, 100]
 *
 * // On error
 * error();  // [200]
 *
 * // Custom pattern
 * trigger([50, 100, 50, 150, 30]);
 *
 * // Conditional
 * if (isSupported) {
 *   doubleTap();
 * }
 */
