"use client";
/**
 * StylistErrorHandler — User-friendly error messages for stylist
 *
 * Displays contextual error messages with retry options
 */

import { useEffect, useState } from "react";

interface StylistError {
  id: string;
  type: "product" | "stream" | "validation" | "timeout" | "network";
  message: string;
  slot?: string;
  timestamp: number;
  retry?: () => void;
}

interface StylistErrorHandlerProps {
  errors: StylistError[];
  onDismiss: (id: string) => void;
  onRetry?: (error: StylistError) => void;
}

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  product: {
    title: "Produit introuvable",
    description: "Nous cherchons une alternative dans notre catalogue...",
  },
  stream: {
    title: "Problème de communication",
    description: "Reconnexion en cours...",
  },
  validation: {
    title: "Données invalides",
    description: "Veuillez vérifier votre entrée et réessayer",
  },
  timeout: {
    title: "Connexion lente",
    description: "Nous réessayons avec une meilleure connexion...",
  },
  network: {
    title: "Pas de connexion",
    description: "Veuillez vérifier votre connexion Internet",
  },
};

export function StylistErrorHandler({
  errors,
  onDismiss,
  onRetry,
}: StylistErrorHandlerProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        maxWidth: 400,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {errors.map((error) => (
        <ErrorToast
          key={error.id}
          error={error}
          onDismiss={() => onDismiss(error.id)}
          onRetry={() => onRetry?.(error)}
        />
      ))}
    </div>
  );
}

interface ErrorToastProps {
  error: StylistError;
  onDismiss: () => void;
  onRetry: () => void;
}

function ErrorToast({ error, onDismiss, onRetry }: ErrorToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const errorConfig = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.network;

  // Auto-dismiss after 5 seconds for recoverable errors
  useEffect(() => {
    if (["timeout", "product", "stream"].includes(error.type)) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onDismiss, 300);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error.type, onDismiss]);

  const getIcon = () => {
    switch (error.type) {
      case "product":
        return "⚠️";
      case "stream":
        return "🔄";
      case "timeout":
        return "⏱️";
      case "network":
        return "📡";
      case "validation":
        return "❌";
      default:
        return "ℹ️";
    }
  };

  const showRetry = ["product", "timeout", "network"].includes(error.type);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8DFD0",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 10px 30px rgba(30,30,30,.15)",
        animation: isExiting
          ? "fadeOut 0.3s ease-out"
          : "wada-stylist-error-slideUp 0.3s ease-out",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: 20, flexShrink: 0 }}>{getIcon()}</div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontWeight: 600,
            fontSize: 14,
            color: "#1F1B16",
          }}
        >
          {errorConfig.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "#8A7A68",
            lineHeight: 1.4,
          }}
        >
          {errorConfig.description}
        </p>

        {/* Slot info */}
        {error.slot && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "#A8A890",
            }}
          >
            {error.slot}
          </p>
        )}

        {/* Action buttons */}
        {showRetry && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={onRetry}
              style={{
                padding: "6px 12px",
                background: "#6B3A32",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "#7a4a3f";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "#6B3A32";
              }}
            >
              Réessayer
            </button>
            <button
              onClick={onDismiss}
              style={{
                padding: "6px 12px",
                background: "transparent",
                color: "#8A7A68",
                border: "1px solid #E8DFD0",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.borderColor = "#6B3A32";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.borderColor = "#E8DFD0";
              }}
            >
              Fermer
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      {!showRetry && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            color: "#A8A890",
            padding: 0,
            flexShrink: 0,
          }}
          aria-label="Fermer"
        >
          ×
        </button>
      )}

      {/* Fix 2026-06-14 « keyframes conflict » : préfixé wada-stylist-error-
          pour éviter le clash avec StylistLoadingIndicator (translateY 20px
          au lieu de 10px ici). */}
      <style>{`
        @keyframes wada-stylist-error-slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(10px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
