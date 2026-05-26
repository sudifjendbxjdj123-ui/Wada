"use client";
import { useEffect, useState } from "react";

/**
 * ThemeToggle — bouton ☾/☀ qui bascule data-theme="jour|nuit" sur <html>.
 *
 * Brief 2026-05-26 §2 « Mode JOUR / NUIT » :
 *   - Un attribut data-theme="jour|nuit" sur <html>
 *   - Bascule via le bouton ☾/☀ du header
 *   - Mémorise le choix dans localStorage["wada-theme"]
 *   - Remplace le ☾ statique actuel du header
 *
 * Anti-flash : le data-theme initial est posé par un <script> inline dans
 * layout.tsx <head> AVANT le paint. Ce composant ne fait que :
 *   1. lire l'état courant au mount (depuis <html>)
 *   2. exposer un bouton qui flip jour ↔ nuit
 *
 * L'icône reflète l'ACTION (☾ quand on est en jour → cliquer pour passer
 * en nuit ; ☀ quand on est en nuit → cliquer pour repasser en jour).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"jour" | "nuit">("jour");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lit l'état réellement appliqué (posé par le script inline avant paint)
    const current = (document.documentElement.dataset.theme as "jour" | "nuit") || "jour";
    setTheme(current);
    // Brief audit 2026-05-28 M8 — sync initiale StatusBar Capacitor au mount.
    syncCapacitorStatusBar(current);
  }, []);

  function toggle() {
    const next = theme === "jour" ? "nuit" : "jour";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("wada-theme", next);
    } catch {
      /* localStorage indispo (Safari privé) → silencieusement no-op */
    }
    // M8 : aligner StatusBar app native sur le nouveau thème.
    syncCapacitorStatusBar(next);
  }

  /** Synchronise la StatusBar de l'app Capacitor avec le thème courant.
   *  - jour → style LIGHT (texte foncé sur fond clair)
   *  - nuit → style DARK  (texte clair sur fond sombre)
   *  No-op sur le web (Capacitor absent). Best-effort : on n'importe pas
   *  le plugin statiquement pour ne pas alourdir le bundle web ; on accède
   *  à window.Capacitor injecté par le webview natif s'il existe. */
  function syncCapacitorStatusBar(theme: "jour" | "nuit") {
    if (typeof window === "undefined") return;
    type CapacitorWindow = {
      Capacitor?: { isNativePlatform?: () => boolean };
    };
    const w = window as Window & CapacitorWindow;
    if (!w.Capacitor?.isNativePlatform?.()) return;
    // Import dynamique côté natif uniquement
    import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      const bg = theme === "nuit" ? "#14110D" : "#F4EFE7";
      const style = theme === "nuit" ? Style.Dark : Style.Light;
      StatusBar.setBackgroundColor({ color: bg }).catch(() => { /* iOS no-op */ });
      StatusBar.setStyle({ style }).catch(() => { /* no-op si plugin absent */ });
    }).catch(() => { /* @capacitor/status-bar non installé en web */ });
  }

  // Pour éviter mismatch SSR/CSR, on rend un placeholder de la même taille
  // jusqu'au mount (le script inline a déjà posé le bon data-theme).
  if (!mounted) return <span style={{ display: "inline-block", width: 28, height: 28 }} />;

  const icon = theme === "jour" ? "☾" : "☀";
  const label = theme === "jour" ? "Passer en mode nuit" : "Passer en mode jour";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
        color: "var(--txt, #1E1E1E)",
        padding: "4px 6px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform .2s ease, opacity .2s ease",
        opacity: 0.85,
      }}
      onMouseEnter={(ev) => {
        ev.currentTarget.style.opacity = "1";
        ev.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.opacity = "0.85";
        ev.currentTarget.style.transform = "scale(1)";
      }}
    >
      {icon}
    </button>
  );
}
