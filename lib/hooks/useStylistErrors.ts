/**
 * useStylistErrors — Error management hook for stylist component
 *
 * Centralized error tracking with auto-cleanup
 */

import { useCallback, useRef, useState } from "react";

interface StylistError {
  id: string;
  type: "product" | "stream" | "validation" | "timeout" | "network";
  message: string;
  slot?: string;
  timestamp: number;
  retry?: () => void;
}

export function useStylistErrors() {
  const [errors, setErrors] = useState<StylistError[]>([]);
  const errorCounterRef = useRef(0);

  // Add an error with auto-dismiss for recoverable types
  const addError = useCallback(
    (
      type: StylistError["type"],
      message: string,
      slot?: string,
      retry?: () => void,
    ) => {
      const id = `error-${++errorCounterRef.current}`;
      const error: StylistError = {
        id,
        type,
        message,
        slot,
        timestamp: Date.now(),
        retry,
      };

      setErrors((prev) => [...prev, error]);

      // Auto-dismiss recoverable errors after 5 seconds
      if (["timeout", "product", "stream"].includes(type)) {
        setTimeout(() => {
          setErrors((prev) => prev.filter((e) => e.id !== id));
        }, 5000);
      }

      return id;
    },
    [],
  );

  // Remove error by ID
  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Handle retry
  const retryError = useCallback((error: StylistError) => {
    error.retry?.();
    dismissError(error.id);
  }, [dismissError]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    addError,
    dismissError,
    retryError,
    clearErrors,
  };
}
