"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * CookieBanner — bandeau RGPD au premier accès.
 *
 * Brief 2026-06-01 « Pages légales complètes + Lancement » §7.
 *
 * Comportement :
 *  - Au mount, lit localStorage["wada_consent"]. Si absent → affiche le
 *    bandeau. Si présent → caché (même choix mémorisé).
 *  - Boutons : « Refuser les analytics » (necessary only) / « Accepter »
 *    (necessary + analytics).
 *  - Stocke le choix en JSON { necessary, analytics, timestamp }.
 *  - Notifie le reste de l'app via `window.dispatchEvent("wada-consent-changed")`
 *    pour que les libs analytics (Vercel Analytics, Plausible, GA) se
 *    chargent à la volée si accepté.
 *
 * Conformité RGPD :
 *  - Affiché AVANT toute pose de cookie analytics (Vercel Analytics ne
 *    pose pas de cookie par défaut → safe).
 *  - Choix mémorisé 13 mois (renouvelable automatiquement à chaque visite
 *    ; quand le timestamp dépasse 13 mois, on re-demande).
 *  - Modifiable à tout moment via /cookies → bouton « Modifier mes
 *    choix » qui supprime localStorage et re-déclenche le bandeau.
 */

const STORAGE_KEY = "wada_consent";
const TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000; // 13 mois (CNIL)

interface Consent {
  necessary: true;
  analytics: boolean;
  timestamp: number;
}

const palette = {
  cream: "#F4EFE7",
  ink: "#1E1E1E",
  inkSoft: "#3d3530",
  muted: "#8c8377",
  bordeaux: "#6B3A32",
  line: "rgba(30,30,30,0.12)",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setShow(true);
        return;
      }
      const parsed = JSON.parse(raw) as Consent;
      if (!parsed?.timestamp || Date.now() - parsed.timestamp > TTL_MS) {
        /* Choix périmé (>13 mois) → re-demander. */
        setShow(true);
      }
    } catch {
      setShow(true);
    }
    /* Écoute un event externe pour ré-ouvrir le bandeau (depuis /cookies). */
    const reopen = () => setShow(true);
    window.addEventListener("wada-cookie-reopen", reopen);
    return () => window.removeEventListener("wada-cookie-reopen", reopen);
  }, []);

  function persist(analytics: boolean) {
    const consent: Consent = {
      necessary: true,
      analytics,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      window.dispatchEvent(new CustomEvent("wada-consent-changed", { detail: consent }));
    } catch {}
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Bandeau cookies"
      aria-modal="false"
      style={{
        position: "fixed",
        left: 12, right: 12,
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        zIndex: 100,
        background: "#fff",
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 12px 32px -10px rgba(30,30,30,0.25)",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: fonts.body,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <p style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 14.5,
            color: palette.ink,
            margin: "0 0 6px",
            letterSpacing: "-0.01em",
          }}>
            Cookies
          </p>
          <p style={{
            fontSize: 13,
            color: palette.inkSoft,
            margin: 0,
            lineHeight: 1.5,
          }}>
            WADA utilise des cookies nécessaires au fonctionnement du site.
            Avec votre accord, nous utilisons aussi un outil d&apos;audience
            anonyme pour améliorer le service. Aucune pub, aucun tracking
            croisé.{" "}
            <Link href="/cookies" style={{ color: palette.bordeaux, textDecoration: "underline" }}>
              En savoir plus
            </Link>
            .
          </p>
        </div>
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}>
          <button
            type="button"
            onClick={() => persist(false)}
            style={{
              background: "transparent",
              color: palette.inkSoft,
              border: `1px solid ${palette.line}`,
              borderRadius: 10,
              padding: "9px 14px",
              fontFamily: fonts.display,
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            Refuser les analytics
          </button>
          <button
            type="button"
            onClick={() => persist(true)}
            style={{
              background: palette.bordeaux,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontFamily: fonts.display,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
