"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#FAF8F4",
      fontFamily: "'Inter', sans-serif",
      padding: "20px",
    }}>
      <div style={{
        maxWidth: 500,
        textAlign: "center",
      }}>
        <h1 style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          margin: "0 0 12px",
          color: "#1a1a1a",
        }}>
          Oups !
        </h1>
        <p style={{
          fontSize: 16,
          color: "#5a5a5a",
          margin: "0 0 24px",
          lineHeight: 1.5,
        }}>
          Une erreur inattendue s'est produite. Notre équipe a été notifiée.
        </p>
        {error.digest && (
          <p style={{
            fontSize: 12,
            color: "#8a7a68",
            margin: "0 0 20px",
            fontFamily: "'Courier New', monospace",
            wordBreak: "break-all",
          }}>
            ID erreur: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "12px 28px",
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
            href="/"
            style={{
              padding: "12px 28px",
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
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
