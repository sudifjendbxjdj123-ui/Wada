"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLastPalette } from "@/hooks/useLastPalette";
import { useSavedOutfits } from "@/hooks/useSavedOutfits";

/**
 * ResumeBanner — pill flottante « Reprends — Tweed & Encre ».
 *
 * Brief « appli efficace » §3 (2026-05-29) : « un client ne doit jamais
 * repartir de zéro. Bande Reprends ta tenue qui ramène le client là où
 * il s'était arrêté (dernière palette / tenue en cours). »
 *
 * Priorité d'affichage :
 *   1. Si l'user a une tenue sauvée → propose la reprise vers sa tenue
 *      la plus récente (action la plus avancée dans le tunnel).
 *   2. Sinon, si l'user a visité une palette → propose la palette.
 *   3. Sinon, ne rend rien (pas de bande vide).
 *
 * Comportement :
 *   - Visible UNIQUEMENT sur la home (`/`). Sur les autres pages, la
 *     navigation Nav/MobileTabBar suffit ; la pill serait du bruit.
 *   - Position fixed top, sous le Nav, animation slide-down à l'apparition.
 *   - Croix ✕ → dismiss session-only (sessionStorage, revient au prochain
 *     onglet). Pas de dismiss permanent : si l'user a un état à reprendre,
 *     ça sert le re-engagement.
 *   - Sur la home plein-écran vidéo (cf. app/page.tsx), la pill flotte
 *     au-dessus de la vidéo grâce à un z-index 40 (< Nav 50, < drawer 100).
 */

const SESSION_DISMISS_KEY = "wada-resume-dismissed";

export default function ResumeBanner() {
  const { last, hydrated: lastHydrated } = useLastPalette();
  const { outfits, hydrated: outfitsHydrated } = useSavedOutfits();
  /* dismissed est lu côté client uniquement (sessionStorage) — initial null
     pour éviter le mismatch SSR/CSR, puis mis à true/false après mount. */
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(SESSION_DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const close = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  /* Tant que les hooks ne sont pas hydratés ou qu'on ne sait pas si
     dismissed, on ne rend rien (évite flash). */
  if (!lastHydrated || !outfitsHydrated || dismissed === null) return null;
  if (dismissed) return null;

  /* Sélection de la cible — priorité tenue > palette. */
  const mostRecentOutfit = outfits.length > 0
    ? [...outfits].sort((a, b) => b.savedAt - a.savedAt)[0]
    : null;

  let kicker = "";
  let title = "";
  let href = "";

  if (mostRecentOutfit) {
    kicker = "Reprendre ma tenue";
    title = mostRecentOutfit.nomTenue;
    href = "/favoris";
  } else if (last) {
    kicker = "Reprendre";
    title = last.name;
    href = `/palette/${last.number}`;
  } else {
    return null;
  }

  return (
    <div className="wada-resume-banner" role="region" aria-label="Reprise rapide">
      <Link
        href={href}
        className="wada-resume-link"
        aria-label={`${kicker} : ${title}`}
      >
        <span className="wada-resume-kicker">{kicker}</span>
        <span className="wada-resume-arrow" aria-hidden>→</span>
        <span className="wada-resume-title">{title}</span>
      </Link>
      <button
        type="button"
        onClick={close}
        className="wada-resume-close"
        aria-label="Masquer la reprise"
      >
        <span aria-hidden>×</span>
      </button>
      <style jsx>{`
        :global(.wada-resume-banner) {
          position: fixed;
          /* Sous le Nav (~70px) + safe-area iOS. */
          top: calc(78px + env(safe-area-inset-top, 0px));
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 4px 4px 16px;
          background: rgba(250, 248, 244, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(107, 58, 50, 0.18);
          border-radius: 999px;
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18);
          color: #1E1E1E;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          max-width: calc(100vw - 32px);
          animation: wada-resume-slide 0.4s cubic-bezier(.22,1,.36,1);
        }
        :global(.wada-resume-link) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: inherit;
          text-decoration: none;
          padding: 7px 0;
          max-width: 100%;
          overflow: hidden;
        }
        :global(.wada-resume-kicker) {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6B3A32;
          white-space: nowrap;
        }
        :global(.wada-resume-arrow) {
          color: #6B3A32;
          font-size: 13px;
          opacity: 0.7;
        }
        :global(.wada-resume-title) {
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: #1E1E1E;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        :global(.wada-resume-close) {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(30, 30, 30, 0.06);
          border: none;
          color: #6a6259;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.18s ease, color 0.18s ease;
        }
        :global(.wada-resume-close:hover) {
          background: rgba(107, 58, 50, 0.1);
          color: #6B3A32;
        }
        @keyframes wada-resume-slide {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        /* Mobile : encore plus compact + max-width plus serré pour ne pas
           déborder du viewport. */
        @media (max-width: 480px) {
          :global(.wada-resume-banner) {
            font-size: 12px;
            padding: 3px 3px 3px 14px;
          }
          :global(.wada-resume-title) {
            font-size: 13px;
            max-width: 140px;
          }
          :global(.wada-resume-kicker) {
            font-size: 10px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.wada-resume-banner) { animation: none; }
        }
      `}</style>
    </div>
  );
}
