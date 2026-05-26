"use client";
import { useEffect } from "react";

/**
 * ServiceWorkerRegister — enregistre /sw.js au mount (client-side).
 *
 * Composant invisible. À placer une seule fois dans le RootLayout.
 * En dev (NODE_ENV=development) : pas d'enregistrement pour éviter
 * les conflits avec le HMR Next.js.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Si une nouvelle version est dispo → demander l'install immédiat
        reg.addEventListener("updatefound", () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener("statechange", () => {
            if (newSW.state === "installed" && navigator.serviceWorker.controller) {
              // Nouvelle version prête, on lui dit de prendre le contrôle
              newSW.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      } catch {
        // Échec silencieux — le SW est optionnel
      }
    };

    // Décale d'1s pour ne pas bloquer le rendu initial
    const t = setTimeout(register, 1000);
    return () => clearTimeout(t);
  }, []);

  return null;
}
