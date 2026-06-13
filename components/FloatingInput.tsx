"use client";
import { useState } from "react";
import React from "react";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function FloatingInput({
  label,
  error,
  helperText,
  className = "",
  ...props
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value);

  return (
    <div style={{ position: "relative", marginBottom: "24px" }}>
      <style jsx>{`
        .floating-label-container {
          position: relative;
        }

        .floating-input {
          width: 100%;
          padding: 16px 12px 8px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          background: transparent;
          transition: all 0.2s ease;
        }

        .floating-input:hover {
          border-color: rgba(0, 0, 0, 0.24);
        }

        .floating-input:focus {
          outline: none;
          border-color: #6B3A32;
          box-shadow: 0 0 0 3px rgba(107, 58, 50, 0.1);
        }

        .floating-label {
          position: absolute;
          left: 12px;
          top: 16px;
          font-size: 16px;
          color: rgba(0, 0, 0, 0.6);
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: left bottom;
          pointer-events: none;
        }

        .floating-input:focus ~ .floating-label,
        .floating-input[data-has-value="true"] ~ .floating-label {
          top: 4px;
          font-size: 12px;
          color: #6B3A32;
          font-weight: 600;
        }

        .error-text {
          color: #C13E3E;
          font-size: 12px;
          margin-top: 6px;
          display: block;
        }

        .helper-text {
          color: rgba(0, 0, 0, 0.6);
          font-size: 12px;
          margin-top: 6px;
          display: block;
        }
      `}</style>

      <div className="floating-label-container">
        <input
          {...props}
          className={`floating-input ${className}`}
          data-has-value={hasValue ? "true" : "false"}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          placeholder=""
        />
        <label className="floating-label">{label}</label>
      </div>

      {error && <span className="error-text">{error}</span>}
      {helperText && !error && <span className="helper-text">{helperText}</span>}
    </div>
  );
}
