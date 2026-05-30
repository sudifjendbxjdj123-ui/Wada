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
      {/* Brief refonte 2026-05-30 : passé du pill flottant centré en haut
          (qui mangeait l'image hero) à un TOAST DISCRET en bas à droite.
          Fond noir charbon + kanji 和 dans une vignette dégradée or, label
          REPRENDRE en kicker majuscules, nom palette en Fredoka. Croix de
          dismiss session. Visible mais non envahissant. */}
      <Link
        href={href}
        className="wada-resume-link"
        aria-label={`${kicker} : ${title}`}
      >
        <span className="wada-resume-icon" aria-hidden>和</span>
        <span className="wada-resume-text">
          <span className="wada-resume-kicker">{kicker}</span>
          <span className="wada-resume-title">{title} →</span>
        </span>
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
          /* Bas à droite, au-dessus de la MobileTabBar éventuelle (≤880px). */
          bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          right: 24px;
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px 12px 12px;
          background: #222;
          border-radius: 14px;
          box-shadow: 0 14px 40px -12px rgba(0,0,0,.4);
          color: #f3eddf;
          font-family: 'Inter', sans-serif;
          max-width: 320px;
          animation: wada-resume-slide 0.4s cubic-bezier(.22,1,.36,1);
        }
        @media (max-width: 880px) {
          /* Décale au-dessus de la MobileTabBar (~62px). */
          :global(.wada-resume-banner) {
            bottom: calc(80px + env(safe-area-inset-bottom, 0px));
            right: 16px;
            max-width: calc(100vw - 32px);
          }
        }
        :global(.wada-resume-link) {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
          min-width: 0;
        }
        :global(.wada-resume-icon) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, #caa479, #8a6f4a);
          color: #fff;
          font-family: 'Noto Serif JP', 'Fredoka', sans-serif;
          font-size: 14px;
          font-weight: 700;
        }
        :global(.wada-resume-text) {
          display: inline-flex;
          flex-direction: column;
          min-width: 0;
        }
        :global(.wada-resume-kicker) {
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(243,237,223,.7);
          line-height: 1.2;
        }
        :global(.wada-resume-title) {
          font-family: 'Fredoka', sans-serif;
          font-weight: 500;
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
          line-height: 1.3;
        }
        :global(.wada-resume-close) {
          background: none;
          border: none;
          color: #f3eddf;
          opacity: 0.55;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 4px 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.18s ease;
        }
        }
        @keyframes wada-resume-slide {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.wada-resume-banner) { animation: none; }
        }
      `}</style>
    </div>
  );
}
