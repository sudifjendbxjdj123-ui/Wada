"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Délai après l'entrée dans le viewport, en ms. Permet d'orchestrer plusieurs Reveal en cascade. */
  delay?: number;
  /** Fraction de l'élément qui doit être visible pour déclencher (0–1). Défaut 0.12. */
  threshold?: number;
  /** Distance de translation initiale en pixels (vers le haut). Défaut 24. */
  offset?: number;
  /** Durée de l'animation en ms. Défaut 1100 — calme, pas hâté. */
  duration?: number;
}

/**
 * Wrapper "slow reveal" — l'enfant fade up doucement quand il entre dans le viewport.
 *
 * Inspiration : esthétique "calme & souffle" des sites éditoriaux (Kinfolk, Oryzo,
 * 9to5studio…). Chaque section paraît exister avant d'être lue, plutôt que d'arriver
 * brusquement. La courbe d'easing privilégie un démarrage net qui s'étire ensuite.
 *
 * Honore `prefers-reduced-motion` — les utilisateurs sensibles voient tout instantanément.
 */
export default function Reveal({
  children,
  delay = 0,
  threshold = 0.12,
  offset = 24,
  duration = 1100,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === "undefined") return;

    // Respecte la préférence utilisateur — pas d'animation si demandé.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const t = setTimeout(() => setVisible(true), delay);
            obs.disconnect();
            return () => clearTimeout(t);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${offset}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1), transform ${duration}ms cubic-bezier(0.2, 0.7, 0.2, 1)`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
