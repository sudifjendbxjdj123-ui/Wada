"use client";
import { useEffect, useState } from "react";
import { WADA_TOAST_EVENT, type WadaToastDetail } from "@/lib/toast";

/**
 * Brief finition (24/05) — Toast écouteur global.
 *
 * Monté UNE FOIS dans `app/layout.tsx`, écoute l'événement `wada-toast`
 * et affiche le message en bottom-center pendant `duration` ms avec
 * fade-in/out + safe-area-inset-bottom pour iPhone.
 *
 * Stack : aria-live=polite (lu par lecteurs d'écran sans interruption),
 * pointer-events: none (n'intercepte pas les clics dessous), z-index 200
 * pour passer au-dessus du Nav (100) et de la MobileTabBar (60).
 *
 * Files d'attente : si un nouveau toast arrive pendant qu'un est affiché,
 * on remplace le précédent (le timer redémarre). Acceptable pour l'usage
 * actuel (confirmations rares, pas de batch).
 */
export default function Toast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"info" | "success">("info");

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<WadaToastDetail>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
      setVariant(detail.variant ?? "info");
      setVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setVisible(false), detail.duration ?? 2500);
    };

    window.addEventListener(WADA_TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(WADA_TOAST_EVENT, onToast);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        // Au-dessus de la MobileTabBar (qui prend ~56px + safe-area).
        // Sur desktop, safe-area-inset-bottom = 0, donc on garde 24px de marge.
        bottom: "calc(80px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: visible
          ? "translate(-50%, 0)"
          : "translate(-50%, 20px)",
        opacity: visible ? 1 : 0,
        pointerEvents: "none",
        zIndex: 200,
        transition: "opacity 0.25s ease, transform 0.25s ease",
        maxWidth: "calc(100vw - 32px)",
        // Couleur de fond selon variante (succès = bordeaux WADA, sinon ink)
        background: variant === "success" ? "#6B3A32" : "#1A1612",
        color: "#FAF8F4",
        padding: "12px 20px",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.01em",
        textAlign: "center",
        // Évite que le toast soit lu par les lecteurs d'écran quand vide
        // (sinon ils annoncent "" à chaque mise à jour).
        visibility: message ? "visible" : "hidden",
      }}
    >
      {message}
    </div>
  );
}
