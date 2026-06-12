"use client";
import { useState } from "react";

export type SortOption = "relevance" | "price-low" | "price-high" | "newest" | "popular";

interface SortDropdownProps {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "relevance", label: "Pertinence" },
  { value: "price-low", label: "Prix: bas → haut" },
  { value: "price-high", label: "Prix: haut → bas" },
  { value: "newest", label: "Les plus nouveaux" },
  { value: "popular", label: "Les plus populaires" },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label || "Trier";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 16px",
          background: "#fff",
          border: "1px solid #e8dfd0",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          color: "#1a1a1a",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#d4ccc0";
          e.currentTarget.style.background = "#faf6ee";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e8dfd0";
          e.currentTarget.style.background = "#fff";
        }}
      >
        <span>↕</span>
        {currentLabel}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
            }}
            onClick={() => setOpen(false)}
            aria-hidden
          />

          {/* Dropdown menu */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "#fff",
              border: "1px solid #e8dfd0",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 100,
              minWidth: 220,
              overflow: "hidden",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: value === opt.value ? "#faf6ee" : "#fff",
                  borderBottom: "1px solid #f0e9d8",
                  textAlign: "left",
                  fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  color: value === opt.value ? "#6B3A32" : "#1a1a1a",
                  fontWeight: value === opt.value ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = "#f9f5ef";
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== opt.value) {
                    e.currentTarget.style.background = "#fff";
                  }
                }}
              >
                {value === opt.value && <span style={{ marginRight: 8 }}>✓</span>}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
