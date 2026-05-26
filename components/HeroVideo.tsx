"use client";
/**
 * <HeroVideo /> — Vidéo de fond optimisée pour les hero sections WADA.
 *
 * Brief Épique B (2026-05-20) :
 *   B1. Conserver les vidéos + image poster pour éviter le flash de chargement
 *   B2. Overlay chaud (beige/bordeaux) + lisibilité texte AA
 *   B3. (futur) version WebM/AV1 + lazy-load — nécessite ffmpeg
 *   B4. Respect prefers-reduced-motion → afficher poster fixe sans lecture
 *
 * Usage :
 *   <HeroVideo src="/hero/femme-wada-bg.mp4" poster="/hero/femme-wada-bg.jpg" />
 *
 * Si pas de poster image dispo : passer `posterColor` (couleur unie chaude
 * proche du ton dominant de la vidéo). Ça évite quand même le flash blanc.
 */
import { useEffect, useRef, useState } from "react";

export interface HeroVideoProps {
  /** URL du MP4 (et optionnellement webm/av1 plus tard). */
  src: string;
  /** URL d'une image poster (jpg/webp idéalement). Optionnel. */
  poster?: string;
  /** Couleur de fond unie si pas de poster — proche du ton dominant. */
  posterColor?: string;
  /** Overlay au-dessus de la vidéo pour la lisibilité texte. */
  overlay?: "warm" | "dark" | "soft" | "none";
  /** Si true, la vidéo prend toute la page en position:fixed (defaults true). */
  fixed?: boolean;
  /** zIndex de la vidéo (defaults 0). */
  zIndex?: number;
}

export default function HeroVideo({
  src,
  poster,
  posterColor = "#3a2820",
  overlay = "warm",
  fixed = true,
  zIndex = 0,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  /* Respect prefers-reduced-motion (B4) — on n'autoplay PAS et on bloque
     le mount du <video> pour économiser bande passante + CPU. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  /* Force play() après mount (B1 robustesse iOS Safari) */
  useEffect(() => {
    if (reducedMotion) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => { v.play().catch(() => { /* autoplay bloqué */ }); };
    tryPlay();
    const onInteract = () => {
      tryPlay();
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("click", onInteract);
    };
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("click", onInteract);
    return () => {
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("click", onInteract);
    };
  }, [reducedMotion]);

  /* Overlay configurations — couleurs alignées palette brief 2026-05 */
  const overlayBg = (() => {
    switch (overlay) {
      case "warm":
        return "linear-gradient(180deg, rgba(107,58,50,.18) 0%, rgba(30,30,30,.36) 65%, rgba(30,30,30,.52) 100%)";
      case "dark":
        return "linear-gradient(180deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.18) 50%, rgba(0,0,0,.42) 100%)";
      case "soft":
        return "linear-gradient(180deg, rgba(244,239,231,.78) 0%, rgba(244,239,231,.65) 50%, rgba(244,239,231,.82) 100%)";
      case "none":
        return "none";
      default:
        return "none";
    }
  })();

  const containerStyle: React.CSSProperties = fixed
    ? { position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none" }
    : { position: "absolute", inset: 0, pointerEvents: "none" };

  return (
    <>
      {/* Fond couleur unie OU image poster — visible AVANT que la vidéo charge */}
      <div aria-hidden style={{
        ...containerStyle,
        zIndex: zIndex - 1,
        background: poster
          ? `${posterColor} url("${poster}") center/cover no-repeat`
          : posterColor,
        transition: "opacity 0.4s ease",
        opacity: videoReady ? 0 : 1,
      }} />

      {/* Vidéo (skip si reduced-motion) */}
      {!reducedMotion && (
        <video
          ref={videoRef}
          autoPlay muted loop playsInline aria-hidden
          preload="auto"
          poster={poster}
          // @ts-ignore - legacy iOS Safari attribute
          webkit-playsinline="true"
          // @ts-ignore - legacy Tencent X5 attribute
          x5-playsinline="true"
          controls={false}
          disablePictureInPicture
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          style={{
            ...containerStyle,
            zIndex,
            objectFit: "cover",
            objectPosition: "center",
            background: posterColor,
            opacity: videoReady ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}

      {/* Overlay chaud (B2) — toujours au-dessus de la vidéo, sous le contenu */}
      {overlay !== "none" && (
        <div aria-hidden style={{
          ...containerStyle,
          zIndex: zIndex + 1,
          background: overlayBg,
        }} />
      )}
    </>
  );
}
