import { useEffect, useRef, useCallback } from "react";

/**
 * useScrollOptimized — Debounced scroll event handler with passive listeners
 *
 * Prevents jank during scroll by:
 * 1. Using passive event listeners (browser can optimize scroll)
 * 2. Debouncing handler calls (reduce function call frequency)
 * 3. Using requestAnimationFrame for smooth updates
 * 4. Cleaning up listeners on unmount
 *
 * Usage:
 *   const handleScroll = useCallback(() => {
 *     // Update UI based on scroll position
 *   }, []);
 *   useScrollOptimized(handleScroll, 200); // 200ms debounce
 */
export function useScrollOptimized(
  handler: (scrollY: number) => void,
  debounceMs: number = 100
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastScrollRef = useRef<number>(0);

  const debouncedHandler = useCallback(() => {
    const scrollY = window.scrollY || window.pageYOffset;
    lastScrollRef.current = scrollY;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      handler(lastScrollRef.current);
      frameRef.current = null;
    });
  }, [handler]);

  useEffect(() => {
    const handleScrollEvent = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(debouncedHandler, debounceMs);
    };

    // Passive listener: browser can optimize scroll without waiting for handler
    window.addEventListener("scroll", handleScrollEvent, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollEvent);
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [debouncedHandler, debounceMs]);
}

/**
 * useScrollPosition — Simple scroll position tracker
 *
 * Tracks current scroll position with optional callback.
 * Useful for showing/hiding headers, progress indicators, etc.
 */
export function useScrollPosition(
  callback?: (scrollY: number) => void
): number {
  const [scrollY, setScrollY] = (typeof window !== "undefined"
    ? (require("react") as typeof import("react")).useState(0)
    : [0, () => {}]) as [number, (y: number) => void];

  useScrollOptimized(
    (y) => {
      setScrollY(y);
      callback?.(y);
    },
    50 // Lighter debounce for position tracking
  );

  return scrollY;
}
