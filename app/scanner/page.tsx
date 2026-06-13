"use client";
/**
 * /scanner — Refonte 2026-05-31 plein écran caméra (maquette client).
 *
 * Avant : carte éditoriale dans une page avec drop zone + boutons +
 * grille essentielles. Maintenant : caméra plein écran style app
 * native (Snapchat / Instagram / Cosmetic Safety Scanner).
 *
 * Architecture :
 *   - <video> getUserMedia({facingMode:"environment"}) plein écran
 *   - Overlay top : bouton ✕ (close) + ⚡ (flash) + 9:41 mock
 *   - Mire centrale : carré 120×120 avec coins arrondis + pulse blanc
 *   - Hint texte au centre haut : « Visez la couleur »
 *   - Bottom bar : toggle Couleur/Vêtement + capture button 66×66 +
 *     galerie + flash latéral
 *   - Capture en 1 tap → bottom sheet résultat (couleur + palette + CTA)
 *
 * Fallback : si getUserMedia rejette (permission refusée, browser
 * incompatible, no camera) on retombe sur un input file + galerie.
 *
 * Capacitor (Android/iOS) : takeNativePhoto() pris en charge en
 * première classe quand isNative() === true.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dictionary, findPalettesByColor, type DictionaryEntry } from "@/lib/data";
import { wadaRefCode as refCode } from "@/lib/utils";
import { isNative, takeNativePhoto, hapticMedium } from "@/lib/native";
import ARPreviewMock from "@/components/ARPreviewMock";

const palette = {
  bordeaux: "#6B3A32",
  bordeauxDark: "#5a3029",
  cream: "#FAF8F4",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  /* Résultat affiché en bottom sheet — null si pas encore capturé. */
  const [detected, setDetected] = useState<{
    hex: string;
    matches: DictionaryEntry[];
  } | null>(null);

  const router = useRouter();

  /* ──────────────────────────────────────────────────────────
     Démarre la caméra au mount. getUserMedia avec facingMode
     environment (caméra arrière). En cas d'échec, on garde le
     fallback file upload accessible via le bouton galerie.
     ────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia non supporté");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch (err) {
        setCameraError(err instanceof Error ? err.message : "Caméra inaccessible");
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  /* ──────────────────────────────────────────────────────────
     Capture : dessine la frame courante de la vidéo sur un
     canvas off-screen, échantillonne les pixels au CENTRE de
     la mire (carré 120×120 du viewport projeté sur la vidéo),
     calcule la moyenne RGB (en filtrant blancs/noirs extrêmes),
     convertit en hex, trouve la palette Sanzo Wada la plus
     proche.
     ────────────────────────────────────────────────────────── */
  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    const W = video.videoWidth;
    const H = video.videoHeight;
    if (W === 0 || H === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, W, H);

    /* Échantillon au centre — taille proportionnelle à la mire 120px
       du viewport projeté sur la résolution vidéo. */
    const sampleSize = Math.min(W, H) * 0.3;
    const sx = Math.floor(W / 2 - sampleSize / 2);
    const sy = Math.floor(H / 2 - sampleSize / 2);
    const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data;

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i], G = data[i + 1], B = data[i + 2];
      const lum = (R + G + B) / 3;
      if (lum > 245 || lum < 10) continue; // filtre blancs/noirs purs
      r += R; g += G; b += B; n++;
    }
    if (n === 0) return;
    const hex = "#" + [r / n, g / n, b / n]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("");

    const matches = findPalettesByColor(hex, 3);
    setDetected({ hex, matches });
    void hapticMedium();
  }, [cameraReady]);

  /* Fallback : pick file depuis galerie si caméra refusée. */
  const onFilePicked = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 80, 80);
      const data = ctx.getImageData(0, 0, 80, 80).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const lum = (R + G + B) / 3;
        if (lum > 245 || lum < 10) continue;
        r += R; g += G; b += B; n++;
      }
      if (n === 0) return;
      const hex = "#" + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
      setDetected({ hex, matches: findPalettesByColor(hex, 3) });
      void hapticMedium();
    };
    img.src = url;
  }, []);

  /* Capacitor native camera. */
  const onNativeCamera = useCallback(async () => {
    if (!isNative()) return;
    const dataUrl = await takeNativePhoto();
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 80; canvas.height = 80;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 80, 80);
      const data = ctx.getImageData(0, 0, 80, 80).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const lum = (R + G + B) / 3;
        if (lum > 245 || lum < 10) continue;
        r += R; g += G; b += B; n++;
      }
      if (n === 0) return;
      const hex = "#" + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
      setDetected({ hex, matches: findPalettesByColor(hex, 3) });
    };
    img.src = dataUrl;
  }, []);

  /* Flash toggle — tente d'activer la torche via track.applyConstraints.
     Pas supporté partout (iOS Safari limité). */
  const toggleFlash = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
    if (!capabilities?.torch) return;
    try {
      const next = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setFlashOn(next);
    } catch {}
  }, [flashOn]);

  const closeResult = () => setDetected(null);

  return (
    <main style={{
      position: "fixed",
      inset: 0,
      background: "#000",
      overflow: "hidden",
      fontFamily: fonts.sans,
    }}>
      {/* VIDÉO CAMÉRA PLEIN ÉCRAN */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      {/* Voile sombre si caméra pas prête / erreur */}
      {!cameraReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(160deg, #3d3024 0%, #1f1814 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 14, padding: 32,
        }}>
          {/* Brief 2026-06-07 (design) — état d'erreur clarifié : avant, un
              anneau de spinner FIGÉ (animation:none) ressemblait à un
              chargement en pause. Maintenant une icône caméra barrée
              explicite + un sous-titre qui dit quoi faire. En chargement,
              on garde le vrai spinner animé. */}
          {cameraError ? (
            <div aria-hidden style={{
              width: 64, height: 64, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 7.5h2L8 5.5h8l1.5 2h2A1.5 1.5 0 0 1 21 9v8" />
                <path d="M19 19H5a1.5 1.5 0 0 1-1.5-1.5V9" />
                <path d="M3.5 3.5l17 17" />
              </svg>
            </div>
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.2)",
              borderTopColor: "#fff",
              animation: "wada-spin 0.9s linear infinite",
            }} />
          )}
          <p style={{
            color: "#fff", fontFamily: fonts.display,
            fontSize: 18, fontWeight: 500, textAlign: "center",
            margin: 0,
          }}>
            {cameraError ? "Caméra inaccessible" : "Activation de la caméra…"}
          </p>
          {cameraError && (
            <>
              <p style={{
                color: "#fff", fontFamily: fonts.sans,
                fontSize: 14, lineHeight: 1.6, textAlign: "center",
                margin: 0, maxWidth: "32ch", fontWeight: 500,
              }}>
                ✓ Autorisez l’accès à la caméra dans les paramètres de votre navigateur
              </p>
              <p style={{
                color: "rgba(255,255,255,0.75)", fontFamily: fonts.sans,
                fontSize: 13, lineHeight: 1.5, textAlign: "center",
                margin: "8px 0 0", maxWidth: "30ch",
              }}>
                Ou importez une photo depuis votre galerie
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 8,
                  background: palette.bordeaux, color: palette.cream,
                  border: "none", borderRadius: 999,
                  padding: "13px 24px",
                  fontFamily: fonts.sans, fontSize: 14, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Choisir une photo de la galerie
              </button>
            </>
          )}
        </div>
      )}

      {/* TOP BAR : ✕ close + ⚡ flash */}
      <div style={{
        position: "absolute", top: "max(14px, env(safe-area-inset-top, 14px))",
        left: 0, right: 0, zIndex: 20,
        padding: "0 18px",
        display: "flex", justifyContent: "space-between",
      }}>
        <Link
          href="/"
          aria-label="Fermer"
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", textDecoration: "none",
            fontSize: 24, lineHeight: 1,
            border: "1px solid rgba(255,255,255,0.12)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.4)";
          }}
        >
          ×
        </Link>
        {/* Flash : seulement quand la caméra est live — inutile (et trompeur)
            en chargement ou en fallback « caméra inaccessible » (brief
            2026-06-07). */}
        {cameraReady ? (
          <button
            type="button"
            onClick={toggleFlash}
            aria-label={flashOn ? "Éteindre le flash" : "Allumer le flash"}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              background: flashOn ? "rgba(255,220,100,0.85)" : "rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer", fontSize: 18, lineHeight: 1,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (flashOn) {
                e.currentTarget.style.background = "rgba(255,220,100,1)";
              } else {
                e.currentTarget.style.background = "rgba(0,0,0,0.6)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = flashOn ? "rgba(255,220,100,0.85)" : "rgba(0,0,0,0.4)";
            }}
          >
            ⚡
          </button>
        ) : (
          <span aria-hidden />
        )}
      </div>

      {/* MIRE CENTRALE — 4 coins arrondis + pulse blanc au centre */}
      {cameraReady && !detected && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 200, height: 200,
          zIndex: 15, pointerEvents: "none",
        }}>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <path d="M5,25 L5,5 L25,5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M75,5 L95,5 L95,25" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M95,75 L95,95 L75,95" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M25,95 L5,95 L5,75" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
          </svg>
          <span style={{
            position: "absolute", top: "50%", left: "50%",
            width: 22, height: 22, borderRadius: "50%",
            background: "#fff",
            transform: "translate(-50%, -50%)",
            animation: "wada-scan-pulse 1.6s infinite ease-out",
            opacity: 0.5,
          }} />
        </div>
      )}

      {/* HINT TEXTE */}
      {cameraReady && !detected && (
        <>
          <div style={{
            position: "absolute",
            top: "calc(50% + 110px)",
            left: 0, right: 0,
            height: 80,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)",
            pointerEvents: "none",
            zIndex: 17,
          }} />
          <div style={{
            position: "absolute",
            top: "calc(50% + 130px)",
            left: 0, right: 0,
            textAlign: "center",
            color: "#fff", fontSize: 16,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
            fontFamily: fonts.display, fontWeight: 600,
            letterSpacing: "0.02em",
            zIndex: 18,
          }}>
            Visez la couleur
          </div>
        </>
      )}

      {/* BOTTOM BAR : toggle + capture + galerie + flash */}
      {cameraReady && !detected && (
        <div style={{
          position: "absolute",
          bottom: "max(28px, env(safe-area-inset-bottom, 14px))",
          left: 0, right: 0,
          padding: "0 18px",
          zIndex: 25,
        }}>
          {/* Toggle Couleur / Vêtement */}
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 999,
            padding: 4,
            width: "max-content",
            margin: "0 auto 18px",
            gap: 3,
          }}>
            {/* User feedback 2026-05-31 : « inverse les deux mets d'abord
                vêtements ». L'ordre logique du client est :
                  d'abord scanner UN VÊTEMENT (objet concret qu'il possède
                  ou qu'il vient de voir), ENSUITE éventuellement une
                  couleur seule. Vêtement en premier, couleur en second. */}
            <button
              type="button"
              onClick={() => router.push("/composer")}
              style={{
                background: "transparent", color: palette.inkSoft,
                border: "none", padding: "10px 18px",
                borderRadius: 999,
                fontFamily: fonts.display, fontSize: 14, fontWeight: 500,
                cursor: "pointer",
                minHeight: 44,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              ◇ Un vêtement
            </button>
            <button
              type="button"
              style={{
                background: "#fff", color: palette.bordeaux,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                border: "none", padding: "10px 18px",
                borderRadius: 999,
                fontFamily: fonts.display, fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                minHeight: 44,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
              }}
            >
              ⦿ Une couleur
            </button>
          </div>

          {/* Capture row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 14px",
          }}>
            {/* Galerie */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Ouvrir la galerie"
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              }}
            >
              🖼
            </button>

            {/* CAPTURE BUTTON 66×66 */}
            <button
              type="button"
              onClick={isNative() ? onNativeCamera : capture}
              aria-label="Capturer"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#fff",
                border: "4px solid rgba(255,255,255,0.5)",
                boxShadow: "0 8px 22px -6px rgba(0,0,0,0.4)",
                cursor: "pointer",
                transition: "transform 0.12s ease",
              }}
              onMouseDown={(ev) => { ev.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={(ev) => { ev.currentTarget.style.transform = "scale(1)"; }}
              onTouchStart={(ev) => { ev.currentTarget.style.transform = "scale(0.94)"; }}
              onTouchEnd={(ev) => { ev.currentTarget.style.transform = "scale(1)"; }}
            />

            {/* Côté droit — vide pour symétrie, ou autre future option */}
            <span style={{ width: 44, height: 44 }} aria-hidden />
          </div>
        </div>
      )}

      {/* Input file caché (fallback galerie) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        style={{ display: "none" }}
      />

      {/* RÉSULTAT — bottom sheet qui slide depuis le bas */}
      {detected && (
        <>
          {/* Voile sombre */}
          <div
            onClick={closeResult}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(3px)",
              zIndex: 30,
            }}
          />
          <div style={{
            position: "absolute",
            left: 10, right: 10,
            bottom: "max(14px, env(safe-area-inset-bottom, 14px))",
            background: "#faf8f4",
            borderRadius: 24,
            padding: "22px 24px 28px",
            zIndex: 35,
            boxShadow: "0 -12px 40px -8px rgba(0,0,0,0.25)",
            animation: "wada-sheet-slide 0.3s cubic-bezier(.22,1,.36,1)",
          }}>
            <div style={{
              width: 36, height: 4,
              background: "#ddd", borderRadius: 2,
              margin: "0 auto 14px",
            }} />

            {/* Header : pastille couleur + label */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span
                aria-hidden
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: detected.hex,
                  border: `1px solid rgba(0,0,0,0.1)`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: fonts.sans, fontSize: 10,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: palette.inkSoft, fontWeight: 600,
                  margin: 0,
                }}>
                  Couleur détectée
                </p>
                <p style={{
                  fontFamily: fonts.display, fontWeight: 500,
                  fontSize: 17, color: palette.ink,
                  margin: "2px 0 0",
                }}>
                  {detected.hex.toUpperCase()} <span style={{ fontSize: 12, color: palette.inkSoft, fontWeight: 400 }}>· {refCode(detected.hex)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeResult}
                aria-label="Re-scanner"
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(30,30,30,0.06)",
                  border: "none", cursor: "pointer",
                  fontSize: 18, color: palette.inkSoft,
                  lineHeight: 1,
                }}
              >
                ↻
              </button>
            </div>

            {/* Palettes matches */}
            {detected.matches.length > 0 && (
              <>
                <p style={{
                  fontSize: 12, color: palette.inkSoft,
                  margin: "0 0 8px",
                  lineHeight: 1.45,
                }}>
                  Cette teinte appartient à la palette{" "}
                  <strong style={{ color: palette.ink, fontFamily: fonts.display, fontWeight: 600 }}>
                    {detected.matches[0].name}
                  </strong>
                  {" "}— No. {detected.matches[0].number}.
                </p>
                {/* Bandes 3 couleurs de la 1ère palette match */}
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {detected.matches[0].colors.slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      style={{
                        flex: 1, height: 34, borderRadius: 6,
                        background: c.hex,
                      }}
                    />
                  ))}
                </div>

                {/* TIER 3: AR Preview Mock */}
                <div style={{ marginBottom: 14 }}>
                  <ARPreviewMock
                    colors={detected.matches[0].colors}
                    paletteNo={detected.matches[0].number}
                    paletteName={detected.matches[0].name}
                    mode="palette"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => window.location.href = `/palette/${detected.matches[0].number}`}
                  style={{
                    display: "block",
                    width: "100%",
                    background: palette.bordeaux,
                    color: palette.cream,
                    border: "none",
                    borderRadius: 12,
                    padding: "15px 18px",
                    textAlign: "center",
                    textDecoration: "none",
                    fontFamily: fonts.display,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    minHeight: 48,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#5a3029";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = palette.bordeaux;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Voir la palette & ma tenue&nbsp;→
                </button>
              </>
            )}
            {detected.matches.length === 0 && (
              <p style={{ fontSize: 13, color: palette.inkSoft }}>
                Aucune palette ne matche cette couleur. Re-essayez avec une teinte plus définie.
              </p>
            )}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes wada-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes wada-scan-pulse {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes wada-sheet-slide {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </main>
  );
}
