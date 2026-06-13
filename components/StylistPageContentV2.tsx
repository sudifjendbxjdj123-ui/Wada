"use client";
/**
 * StylistPageContentV2 — Enhanced stylist with error handling & loading states
 *
 * Improvements:
 * - Integrated error toast notifications
 * - Skeleton loaders for products
 * - Better error recovery with retry
 * - Haptic feedback on load
 */

import { ReactNode, useCallback, useState } from "react";
import { StylistErrorHandler } from "./StylistErrorHandler";
import { useStylistErrors } from "@/lib/hooks/useStylistErrors";

interface StylistPageContentV2Props {
  children: (props: {
    addError: (
      type: "product" | "stream" | "validation" | "timeout" | "network",
      message: string,
      slot?: string,
      retry?: () => void,
    ) => string;
    dismissError: (id: string) => void;
  }) => ReactNode;
}

/**
 * Wrapper providing error handling to stylist child component
 * Usage:
 * <StylistPageContentV2>
 *   {({ addError, dismissError }) => (
 *     <YourContent onError={(type, msg) => addError(type, msg)} />
 *   )}
 * </StylistPageContentV2>
 */
export function StylistPageContentV2({ children }: StylistPageContentV2Props) {
  const { errors, addError, dismissError, retryError, clearErrors } =
    useStylistErrors();

  return (
    <>
      {children({ addError, dismissError })}
      <StylistErrorHandler
        errors={errors}
        onDismiss={dismissError}
        onRetry={retryError}
      />
    </>
  );
}
