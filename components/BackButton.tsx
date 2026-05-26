"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * BackButton — pill « ← Retour » en flux (statique).
 *
 * Bug fix 2026-05-22 : ce composant n'est PLUS rendu globalement (ni
 * dans layout.tsx, ni dans Nav.tsx). Chaque page qui en a besoin
 * l'importe et le rend explicitement, garantissant qu'il n'y a JAMAIS
 * de doublon avec les retours inline (/stylist, /scanner, /composer,
 * /ma-tenue, /capsule, /palette/[n] ont déjà leur propre lien retour).
 *
 * Utilisation :
 *   import BackButton from "@/components/BackButton";
 *   ...
 *   <Nav />
 *   <BackButton />        ← juste sous la nav, en flux
 *
 * Logique :
 *   - Caché sur la home (point d'entrée)
 *   - `router.back()` si historique disponible, sinon fallback `/atelier`
 */
/** Optional fallback URL override (brief audit 2026-05-28).
 *  Pages avec un parent logique différent peuvent passer ex.
 *  <BackButton fallback="/atelier" /> pour /scanner ou /stylist. */
interface BackButtonProps {
  fallback?: string;
}

export default function BackButton({ fallback }: BackButtonProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== "undefined" && window.history.length > 1);
  }, [pathname]);

  // Pas de bouton sur la home — c'est le point d'entrée
  if (pathname === "/") return null;

  const handleClick = () => {
    if (canGoBack) {
      router.back();
    } else if (fallback) {
      router.push(fallback);
    } else {
      // Fallback deep-link par défaut : depuis /atelier on retombe sur la
      // home (sinon boucle infinie), sinon on remonte vers l'atelier (hub).
      router.push(pathname === "/atelier" ? "/" : "/atelier");
    }
  };

  return (
    <div className="wada-back-button-wrap" style={{
      // En flux, juste sous la nav. Padding aligné sur les conteneurs page.
      maxWidth: 1280,
      margin: "0 auto",
      padding: "20px 5% 0",
    }}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Retourner à la page précédente"
        className="wada-back-button"
        style={{
          // STATIC, jamais position:fixed (refonte 2026-05-21).
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 18px",
          background: "var(--wada-paper)",
          color: "var(--wada-ink)",
          border: "1px solid var(--wada-ink)",
          borderRadius: 999,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "var(--wada-shadow-2)",
          minHeight: 44,
          transition: "transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.22s ease",
        }}
        onMouseEnter={(ev) => {
          ev.currentTarget.style.transform = "translateX(-3px)";
          ev.currentTarget.style.boxShadow = "var(--wada-shadow-3)";
        }}
        onMouseLeave={(ev) => {
          ev.currentTarget.style.transform = "translateX(0)";
          ev.currentTarget.style.boxShadow = "var(--wada-shadow-2)";
        }}
      >
        <span aria-hidden style={{ fontSize: 14, letterSpacing: 0, lineHeight: 1 }}>←</span>
        <span>Retour</span>
      </button>
    </div>
  );
}
