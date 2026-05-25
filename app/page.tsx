"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ink, paper, subtle, border, cardBg,
  mojo,
  fontHeading, fontBody, fontLabel,
  buttonRadius, cardRadius,
} from "@/lib/styles";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";

const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "13px 24px", borderRadius: buttonRadius,
  fontFamily: fontLabel, fontSize: 13, fontWeight: 600,
  letterSpacing: "0.04em", textDecoration: "none",
  cursor: "pointer", border: "1px solid transparent",
  whiteSpace: "nowrap" as const, transition: "all 0.2s ease",
};
const btnPrimary = { ...btnBase, background: mojo, color: "#FFFFFF" };
const btnOutline = { ...btnBase, background: "transparent", color: ink, border: `1px solid ${ink}` };

/**
 * Home — Couverture du livre WADA.
 *
 * Refonte d'après le mockup Figma 2026-05 : layout éditorial à 2 colonnes
 * (kanji 和田 + photo modèle), eyebrow "Inspiré du célèbre dictionnaire…",
 * choix genre avec petites vignettes photo, section "Comment ça marche" en
 * 3 étapes, bande confiance 4 colonnes, CTA sombre photographique. Tous
 * les outils du site sont accessibles via /atelier.
 */
export default function Home() {

  /** Choix genre courant + toast de confirmation 2.4s après clic. */
  const [currentGender, setCurrentGender] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wada-gender");
      if (saved) setCurrentGender(saved);
    } catch { /* ignore */ }
  }, []);

  const pickGender = (g: "femme" | "homme" | "unisexe") => {
    try { localStorage.setItem("wada-gender", g); } catch { /* ignore */ }
    setCurrentGender(g);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  };

  const toastLabel = currentGender === "femme"
    ? "C'est noté — on vous proposera des tenues femme."
    : currentGender === "homme"
    ? "C'est noté — on vous proposera des tenues homme."
    : currentGender === "unisexe"
    ? "C'est noté — on vous proposera des tenues mixtes."
    : "";

  /** Vignettes photo pour les 3 boutons de genre — Unsplash éditorial. */
  const genderThumbs: Record<"femme" | "homme" | "unisexe", string> = {
    femme:   "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=120&q=80",
    homme:   "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=120&q=80",
    unisexe: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=120&q=80",
  };

  return (
    <main style={{ minHeight: "100vh", fontFamily: fontBody, background: paper, color: ink }}>
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
      <Nav />
      <div id="main-content" />

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — vidéo de fond + voile crème + titre centré.
             Le voile dégradé (78% → 55%) garde le H1 lisible quoi qu'il
             y ait dans la vidéo.
          ══════════════════════════════════════════════════════════════════ */}
      <section className="wada-paper-grain wada-hero-video" style={{
        background: paper, padding: "140px 5% 120px",
        position: "relative", overflow: "hidden", isolation: "isolate",
      }}>
        {/* Vidéo de fond — muet, autoplay, loop, playsInline (iOS). */}
        <video
          autoPlay muted loop playsInline aria-hidden
          poster="/hero/hero-banner-poster.jpg"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            zIndex: -2,
          }}
        >
          <source src="/hero/hero-banner.mp4" type="video/mp4" />
        </video>
        {/* Voile crème dégradé — lisibilité du H1 garantie */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(244,239,230,0.82) 0%, rgba(244,239,230,0.58) 60%, rgba(244,239,230,0.78) 100%)",
          zIndex: -1,
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h1 className="wada-hero-title wada-text-3d-xl" style={{
            fontFamily: fontHeading,
            fontSize: "clamp(34px, 7.5vw, 96px)",
            fontWeight: 500,
            lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0,
            fontStyle: "italic", color: ink,
          }}>
            Trouvez les <SketchUnderline color={mojo}>couleurs</SketchUnderline><br />
            et <SketchUnderline color={mojo}>vêtements</SketchUnderline> qui vous vont vraiment.
          </h1>
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* ─── Choix genre — éditorial avec vignettes photo ─── */}
          <Reveal>
            <div className="wada-gender-block" style={{
              marginTop: 88, textAlign: "center",
              padding: "44px 32px",
              border: `1px solid ${border}`,
              background: cardBg,
              borderRadius: cardRadius,
              maxWidth: 880, marginLeft: "auto", marginRight: "auto",
            }}>
              <p style={{
                fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.4em", textTransform: "uppercase",
                color: mojo, margin: "0 0 8px",
              }}>
                Je m'habille
              </p>
              <h2 style={{
                fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(24px, 3vw, 32px)", color: ink,
                margin: "0 0 28px", letterSpacing: "-0.01em",
              }}>
                Pour qui composer la tenue ?
              </h2>

              <div className="wada-gender-thumbs" style={{
                display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center",
              }}>
                {(["femme", "homme", "unisexe"] as const).map((g) => {
                  const isActive = currentGender === g;
                  const label = g.charAt(0).toUpperCase() + g.slice(1);
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => pickGender(g)}
                      aria-pressed={isActive}
                      className="wada-lift-sm"
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "10px 22px 10px 10px",
                        background: isActive ? ink : paper,
                        color: isActive ? paper : ink,
                        border: `1px solid ${isActive ? ink : border}`,
                        borderRadius: 999,
                        fontFamily: fontLabel, fontSize: 13, fontWeight: 600,
                        letterSpacing: "0.05em", cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? "var(--wada-shadow-3)" : "none",
                      }}
                    >
                      <span aria-hidden style={{
                        display: "inline-block",
                        width: 40, height: 40, borderRadius: "50%",
                        backgroundImage: `url("${genderThumbs[g]}")`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        border: `1px solid ${isActive ? paper : border}`,
                        flexShrink: 0,
                      }} />
                      <span>{label}</span>
                      {isActive && <span aria-hidden style={{ fontSize: 14, marginLeft: 2 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              <p style={{
                fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic",
                margin: "22px 0 0", lineHeight: 1.5,
              }}>
                Choix mémorisé sur cet appareil. Modifiable à tout moment.
              </p>
            </div>
          </Reveal>

          {/* Toast de confirmation — top-center, safe-area-aware */}
          {toastVisible && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "fixed",
                top: "calc(env(safe-area-inset-top, 0px) + 80px)",
                left: "50%",
                transform: "translateX(-50%)",
                background: ink, color: paper,
                padding: "14px 26px",
                borderRadius: 999,
                boxShadow: "var(--wada-shadow-5)",
                fontFamily: fontLabel, fontSize: 12, fontWeight: 600,
                letterSpacing: "0.05em",
                zIndex: 200,
                animation: "wada-toast-rise 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                maxWidth: "92vw",
                textAlign: "center",
              }}
            >
              <span aria-hidden style={{ marginRight: 8, color: mojo }}>✓</span>
              {toastLabel}
            </div>
          )}
          <style jsx>{`
            @keyframes wada-toast-rise {
              from { opacity: 0; transform: translate(-50%, -16px); }
              to   { opacity: 1; transform: translate(-50%, 0); }
            }
          `}</style>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. CTA SOMBRE — carte photographique, voile sombre, titre 3D
             centré, CTA primaire mojo.
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "0 5% 96px" }}>
        <Reveal>
          <div className="wada-cta-darkcard" style={{
            position: "relative",
            maxWidth: 1280, margin: "0 auto",
            borderRadius: cardRadius, overflow: "hidden",
            isolation: "isolate",
            boxShadow: "var(--wada-shadow-5)",
          }}>
            {/* Photo de fond + voile sombre */}
            <div style={{
              position: "absolute", inset: 0,
              background: `url("https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80")`,
              backgroundSize: "cover", backgroundPosition: "center",
              zIndex: -2,
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(31, 27, 22, 0.68)",
              zIndex: -1,
            }} />

            <div className="wada-cta-darkcard-inner" style={{ padding: "120px 32px 96px", textAlign: "center", color: "#FFFFFF" }}>
              <p style={{
                fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.5em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)", margin: "0 0 24px",
              }}>
                Essayez WADA
              </p>
              <h2 className="wada-text-3d-xl" style={{
                fontFamily: fontHeading,
                fontSize: "clamp(28px, 6.5vw, 76px)",
                fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.025em", margin: "0 0 28px",
                fontStyle: "italic", color: "#FFFFFF",
              }}>
                Découvrez votre <SketchUnderline color="#FFFFFF">style</SketchUnderline><br />
                en quelques secondes.
              </h2>
              <p style={{
                fontFamily: fontBody, fontSize: 19,
                color: "rgba(255,255,255,0.85)",
                margin: "0 auto 36px", maxWidth: 580, lineHeight: 1.6,
              }}>
                Prenez une photo, choisissez une humeur, ou laissez l'assistant deviner —
                vous repartez avec une tenue que vous pouvez acheter chez ses marques.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/atelier" style={btnPrimary} data-wada-btn>
                  <span>Essayer WADA</span>
                  <HandArrow size={22} color="#FFFFFF" />
                </Link>
                <Link href="/about" style={{ ...btnOutline, color: "#FFFFFF", border: "1px solid #FFFFFF" }} data-wada-btn="ghost">
                  Notre histoire
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Pagination de clôture — façon livre */}
      <div style={{
        padding: "48px 5% 80px",
        textAlign: "center",
        borderTop: `1px solid ${border}`,
        background: paper,
      }}>
        <p style={{
          fontFamily: fontLabel, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.5em", textTransform: "uppercase",
          color: subtle, margin: 0,
        }}>
          — Couverture · page 00 / 348 —
        </p>
      </div>

      <Footer />
    </main>
  );
}


