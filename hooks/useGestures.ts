"use client";
/**
 * useGestures — TIER 3 gesture support (swipe, double-tap, pinch)
 * Hook réutilisable pour détecter les gestes tactiles courants.
 * Útile sur mobile pour améliorer l'UX du carousel, galleries, etc.
 */

import { useEffect, useRef } from "react";

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onPinchZoom?: (scale: number) => void;
  onLongPress?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  touches: number;
  lastDistance: number;
}

export function useGestures(
  element: HTMLElement | null,
  handlers: GestureHandlers,
  options = { minSwipeDistance: 50, longPressDuration: 500 }
) {
  const touchState = useRef<Partial<TouchState>>({});
  const doubleTapTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now(),
        touches: e.touches.length,
      };

      // Détecteur de long press
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, options.longPressDuration);
      }

      // Détecteur de double tap
      if (handlers.onDoubleTap) {
        if (doubleTapTimer.current) {
          clearTimeout(doubleTapTimer.current);
          handlers.onDoubleTap();
          doubleTapTimer.current = null;
        } else {
          doubleTapTimer.current = setTimeout(() => {
            doubleTapTimer.current = null;
          }, 300);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;

      const touch = e.touches[0];
      touchState.current.currentX = touch.clientX;
      touchState.current.currentY = touch.clientY;
      touchState.current.touches = e.touches.length;

      // Détecteur de pinch (2 doigts)
      if (e.touches.length === 2 && handlers.onPinchZoom) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (touchState.current.lastDistance) {
          const scale = distance / touchState.current.lastDistance;
          handlers.onPinchZoom(scale);
        }
        touchState.current.lastDistance = distance;
      }

      // Annule le long press si l'utilisateur bouge le doigt
      if (longPressTimer.current) {
        const distX = Math.abs(touch.clientX - (touchState.current.startX || 0));
        const distY = Math.abs(touch.clientY - (touchState.current.startY || 0));
        if (distX > 10 || distY > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchState.current.startX) return;

      clearTimeout(longPressTimer.current ?? undefined);

      const { startX = 0, startY = 0, currentX = 0, currentY = 0 } = touchState.current;
      const distX = currentX - startX;
      const distY = currentY - startY;
      const absDist = Math.hypot(distX, distY);

      // Détecteur de swipe (min distance + rapide)
      if (absDist > options.minSwipeDistance) {
        if (Math.abs(distX) > Math.abs(distY)) {
          // Swipe horizontal
          if (distX > 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (distX < 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        } else {
          // Swipe vertical
          if (distY > 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (distY < 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }

      touchState.current = {};
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [element, handlers, options.minSwipeDistance, options.longPressDuration]);
}
