"use client";
import React from "react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isSuccess?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function PremiumButton({
  variant = "primary",
  size = "md",
  isLoading = false,
  isSuccess = false,
  fullWidth = false,
  className = "",
  disabled,
  children,
  ...props
}: PremiumButtonProps) {
  const variantClasses = {
    primary:
      "bg-[#6B3A32] text-white hover:bg-[#7a4a3f] active:bg-[#5a2d26]",
    secondary:
      "bg-[#E8DFD0] text-[#1F1B16] hover:bg-[#D9D0BF] active:bg-[#C9C0AF]",
    outline:
      "border-2 border-[#6B3A32] text-[#6B3A32] hover:bg-[rgba(107,58,50,0.05)] active:bg-[rgba(107,58,50,0.1)]",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes checkmark {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        .checkmark {
          animation: checkmark 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      <button
        {...props}
        disabled={disabled || isLoading || isSuccess}
        className={`
          relative inline-flex items-center justify-center gap-2
          rounded-lg font-medium transition-all duration-200
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current
          disabled:opacity-60 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? "w-full" : ""}
          ${isLoading || isSuccess ? "cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <svg
              className="spinner h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="16 20"
                opacity="0.5"
              />
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Chargement...</span>
          </>
        ) : isSuccess ? (
          <>
            <svg
              className="checkmark h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <span>Succès!</span>
          </>
        ) : (
          children
        )}
      </button>
    </>
  );
}
