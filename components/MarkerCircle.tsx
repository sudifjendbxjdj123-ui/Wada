"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface MarkerCircleProps {
  children: ReactNode;
  /**
   * Trigger de l'animation. Brief 2026-05-20 = "click" par défaut pour le
   * CTA "Essayer WADA" (le cercle ne doit apparaître qu'à l'interaction).
   *   - "click"   → tracé au clic sur le bouton enfant (default, brief WADA)
   *   - "hover"   → au survol (mouseenter)
   *   - "viewport"→ au scroll dans le viewport (IntersectionObserver, legacy)
   */
  trigger?: "click" | "hover" | "viewport";
  /** Couleur du tracé crayon. Par défaut bordeaux WADA (#6B3A32). */
  color?: string;
  /**
   * Délai en secondes avant le début de l'animation.
   *   - mode click/hover : délai après l'interaction (default 0)
   *   - mode viewport : délai après l'entrée dans le viewport (default 0.5)
   */
  delay?: number;
  /** Durée de l'animation de dessin du tracé, en secondes (default 0.85). */
  duration?: number;
}

/**
 * MarkerCircle — Cercle dessiné au crayon, à la main, autour de son contenu.
 *
 * Brief 2026-05-20 (spec « Cercle au crayon ») :
 *   - Tracé crayon imparfait (path Bézier simple + filtre feTurbulence)
 *   - Couleur bordeaux WADA #6B3A32
 *   - Déclenchement au CLIC (pas au scroll)
 *   - Animation 850ms cubic-bezier(.34,.8,.3,1)
 *   - Apparaît UNIQUEMENT à l'interaction — n'altère pas le rendu initial
 *
 * Pensé pour entourer un CTA — wrap un <Link>, <button>, etc. Le wrapper
 * est inline-block, donc le contenu conserve sa largeur intrinsèque.
 *
 * Usage typique (bouton "Essayer WADA") :
 *   <MarkerCircle>
 *     <Link href="/atelier" style={btnPrimary}>Essayer WADA</Link>
 *   </MarkerCircle>
 *
 * Variante au scroll (legacy) :
 *   <MarkerCircle trigger="viewport" color="#FF4D2E">
 *     <Link href="/atelier">...</Link>
 *   </MarkerCircle>
 */
export default function MarkerCircle({
  children,
  trigger = "click",
  color = "#6B3A32",
  delay,
  duration = 0.85,
}: MarkerCircleProps) {
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Filter ID unique pour éviter collisions si plusieurs MarkerCircle DOM
  const filterId = `wada-pencil-tex-${Math.random().toString(36).slice(2, 9)}`;

  const effectiveDelay = delay ?? (trigger === "viewport" ? 0.5 : 0);

  /** Trigger l'animation : reset l'offset puis lance la transition. */
  const draw = useCallback(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    // Force reflow pour redémarrer la transition proprement
    void path.getBoundingClientRect();
    setVisible(true);
  }, []);

  /* Détecte reduced-motion + monte le bon listener selon le trigger */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const el = wrapRef.current;
    if (!el) return;

    // Si reduced-motion, on affiche le cercle d'emblée sans animation
    if (mq.matches) {
      setVisible(true);
      return;
    }

    // ─── Trigger : viewport (legacy) ───
    if (trigger === "viewport") {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            draw();
            io.disconnect();
          }
        },
        { threshold: 0.5, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(el);
      return () => io.disconnect();
    }

    // ─── Trigger : click ou hover ───
    // On attache le listener sur l'enfant interactif (button/a) du wrapper.
    const interactive = el.querySelector("button, a") as HTMLElement | null;
    const target = interactive || el;
    const eventName = trigger === "hover" ? "mouseenter" : "click";

    const handler = () => draw();
    target.addEventListener(eventName, handler);
    return () => target.removeEventListener(eventName, handler);
  }, [trigger, draw]);

  // Path "crayon" — un cercle imparfait, légèrement déformé, comme une main
  // qui entoure le bouton d'un trait vif (cf. brief HTML pencil-circle).
  const PENCIL_PATH = "M70 30 C120 13 205 14 250 40 C284 60 272 94 198 98 C118 103 38 99 24 66 C14 43 42 24 92 22 C118 21 150 24 172 30";

  // Estimation de la longueur du path pour init du dasharray côté SSR
  // (sera recalculée au mount via getTotalLength)
  const ESTIMATED_LEN = 750;

  return (
    <span
      ref={wrapRef}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {children}
      <svg
        viewBox="0 0 300 110"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-2deg)",
          width: "150%",
          height: "235%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 3,
        }}
      >
        <defs>
          {/* Turbulence pour donner un côté "crayon sur papier" : le tracé
              n'est pas net, il tremble en sous-pixels. scale=4 = brouillon
              authentique, monter à 6 pour plus de granularité. */}
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.04" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <path
          ref={pathRef}
          d={PENCIL_PATH}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#${filterId})`}
          style={{
            strokeDasharray: ESTIMATED_LEN,
            strokeDashoffset: visible || reducedMotion ? 0 : ESTIMATED_LEN,
            opacity: visible || reducedMotion ? 1 : 0,
            transition: reducedMotion
              ? "none"
              : `stroke-dashoffset ${duration}s cubic-bezier(.34,.8,.3,1) ${effectiveDelay}s, opacity 0.15s linear ${effectiveDelay}s`,
          }}
        />
      </svg>
    </span>
  );
}
