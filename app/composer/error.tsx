"use client";

import { useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function ComposerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ComposerError]", error);
  }, [error]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#FAF8F4",
      fontFamily: "'Inter', sans-serif",
    }}>
      <BackButton />
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "60px 24px",
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 40,
          fontWeight: 700,
          margin: "0 0 16px",
          color: "#1a1a1a",
        }}>
          Erreur du compositeur
        </h1>
        <p style={{
          fontSize: 16,
          color: "#5a5a5a",
          margin: "0 0 28px",
          lineHeight: 1.6,
        }}>
          Le compositeur de tenues a rencontré un problème. Vérifiez votre connexion et réessayez.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "#1a1a1a",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Réessayer
          </button>
          <Link
            href="/palettes"
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "#f0e9d8",
              color: "#1a1a1a",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Explorer les palettes
          </Link>
        </div>
      </div>
    </main>
  );
}
