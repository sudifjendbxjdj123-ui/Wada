"use client";
import { useState, useEffect, useRef } from "react";
import { dictionary } from "@/lib/data";
import { ink, paper, subtle, border, mojo, fontHeading, fontLabel, cardRadius } from "@/lib/styles";

/**
 * HeroVideoCarousel — diaporama vidéo + palette overlay pour le hero home.
 *
 * Concept : on cycle entre N entrées { vidéo MP4, palette WADA correspondante }.
 * Chaque vidéo montre un mannequin (femme ou homme) qui marche dans une
 * tenue de la palette ; la palette est affichée en overlay sur le côté.
 * L'utilisateur voit instantanément le lien tenue ↔ palette.
 *
 * Comportement :
 *   - autoplay loop muted playsInline → marche sur iOS/Android sans interaction
 *   - cycle automatique : passe à la vidéo suivante quand la vidéo en cours
 *     finit (event `ended`) — mieux qu'un setInterval qui peut couper
 *     une vidéo en plein milieu
 *   - cross-fade 400ms entre les vidéos (opacity transition)
 *   - tiny dots indicateurs sous la vidéo (cliquables pour switch manuel)
 *   - si une vidéo n'existe pas (404), passe automatiquement à la suivante
 *     pour ne pas bloquer le carousel sur une entrée manquante
 */

interface HeroEntry {
  /** Fichier MP4 dans /public/hero/ */
  src: string;
  /** Numéro de palette WADA correspondant (dictionnaire) */
  paletteNumber: string;
  /** Genre du mannequin — affiché en label */
  gender: "femme" | "homme";
  /** Lieu de la scène, affiché en sous-titre */
  scene: string;
}

const HERO_VIDEOS: HeroEntry[] = [
  { src: "/hero/01-femme-rosee-matin.mp4",  paletteNumber: "002", gender: "femme", scene: "Galerie scandinave" },
  { src: "/hero/02-homme-pluie-tokyo.mp4",  paletteNumber: "037", gender: "homme", scene: "Tokyo, crépuscule" },
  { src: "/hero/03-femme-marrakech.mp4",    paletteNumber: "003", gender: "femme", scene: "Riad à Marrakech" },
  { src: "/hero/04-homme-workwear.mp4",     paletteNumber: "127", gender: "homme", scene: "Marché aux puces" },
  { src: "/hero/05-femme-jardin.mp4",       paletteNumber: "024", gender: "femme", scene: "Jardin anglais" },
  { src: "/hero/06-homme-cinema.mp4",       paletteNumber: "056", gender: "homme", scene: "Foyer de théâtre" },
];

export default function HeroVideoCarousel() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = HERO_VIDEOS[index];
  const palette = dictionary.find((d) => d.number === current.paletteNumber);

  /** Passe à la vidéo suivante en cross-fade. */
  const next = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIndex((i) => (i + 1) % HERO_VIDEOS.length);
      setIsVisible(true);
    }, 400);
  };

  /** Switch manuel via dot */
  const jumpTo = (i: number) => {
    if (i === index) return;
    setIsVisible(false);
    setTimeout(() => {
      setIndex(i);
      setIsVisible(true);
    }, 400);
  };

  /** Fallback : si la vidéo ne charge pas (404 / réseau), on saute après 8s
      pour ne pas bloquer le carousel. Le onEnded n'est jamais fired si la
      vidéo n'a pas pu démarrer. */
  useEffect(() => {
    const failover = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        // La vidéo n'a pas chargé suffisamment de data pour jouer
        next();
      }
    }, 9000);
    return () => clearTimeout(failover);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!palette) return null; // safety net

  return (
    <div
      style={{
        marginTop: 56,
        maxWidth: 880, marginLeft: "auto", marginRight: "auto",
        position: "relative",
      }}
    >
      {/* Container vidéo */}
      <div
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          borderRadius: cardRadius,
          overflow: "hidden",
          border: `1px solid ${border}`,
          boxShadow: "var(--wada-shadow-4)",
          background: "#1F1B16",
        }}
      >
        <video
          ref={videoRef}
          key={current.src} // force re-mount → trigger autoplay
          autoPlay
          loop={false}
          muted
          playsInline
          onEnded={next}
          preload="metadata"
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            opacity: isVisible ? 1 : 0,
            transition: "opacity 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          <source src={current.src} type="video/mp4" />
        </video>

        {/* Overlay palette — en bas-droite, carte papier */}
        <div
          style={{
            position: "absolute",
            bottom: 18, right: 18,
            background: paper,
            border: `1px solid ${ink}`,
            borderRadius: 8,
            padding: "10px 14px 12px",
            minWidth: 180, maxWidth: "55%",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.45s 0.1s ease, transform 0.45s 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)",
            boxShadow: "var(--wada-shadow-3)",
          }}
        >
          <p style={{
            fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.35em", textTransform: "uppercase",
            color: mojo, margin: "0 0 6px",
          }}>
            No. {palette.number} · {current.gender}
          </p>
          <p style={{
            fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
            fontSize: 18, color: ink, margin: "0 0 8px", lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}>
            {palette.name}
          </p>
          <div style={{ display: "flex", height: 16, marginBottom: 6, border: `1px solid ${border}` }}>
            {palette.colors.map((c) => (
              <div key={c.hex} style={{ flex: 1, background: c.hex }} />
            ))}
          </div>
          <p style={{
            fontFamily: fontLabel, fontSize: 9, color: subtle, fontStyle: "italic",
            margin: 0, letterSpacing: "0.02em",
          }}>
            {current.scene}
          </p>
        </div>

        {/* Signature kanji 和田 — bas-gauche, blanc opacity */}
        <span aria-hidden style={{
          position: "absolute", bottom: 14, left: 18,
          fontFamily: "'Noto Serif JP', 'Fredoka', sans-serif",
          fontSize: 16, letterSpacing: "0.3em",
          color: "rgba(255, 255, 255, 0.7)",
          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          fontWeight: 500,
        }}>
          和田
        </span>
      </div>

      {/* Dots indicateurs — switch manuel + position courante */}
      <div
        role="tablist"
        aria-label="Sélection de la vidéo hero"
        style={{
          display: "flex", justifyContent: "center", gap: 8,
          marginTop: 18,
        }}
      >
        {HERO_VIDEOS.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === index}
            aria-label={`Vidéo ${i + 1} : ${HERO_VIDEOS[i].gender} — ${HERO_VIDEOS[i].scene}`}
            onClick={() => jumpTo(i)}
            style={{
              width: i === index ? 28 : 8, height: 8,
              borderRadius: 999,
              background: i === index ? ink : border,
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "width 0.3s ease, background 0.2s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
