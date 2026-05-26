"use client";
/**
 * /scanner — Refonte 2026-05-27 mockup éditorial jour/nuit.
 *
 * Brief : template HTML reçu (kicker + h1 Fredoka centré, sub italique,
 * tabs pill, panel 2-col, raccourcis circulaires).
 *
 * Architecture :
 *   1. Hero centré : kicker / h1 / sub / tabs <ScanModeToggle/>
 *   2. Panel 2-col : drop zone dashed + détection card (gauche) | info
 *      « La teinte vraie » + 3 ✓ (droite)
 *   3. Ess card : kicker + heading + grid 12 swatches ronds
 *   4. Résultats si scan effectué
 *
 * Couleurs via CSS variables (--txt, --txt-soft, --ln, --surf) qui suivent
 * data-theme="jour|nuit" sur <html> (cf. globals.css + ThemeToggle).
 *
 * Mécanique inchangée :
 *   - extractFromImageSrc : décode pixels canvas → moyenne pondérée
 *   - Drag/drop, file picker, color picker fallback, native camera Capacitor
 */
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { dictionary, findPalettesByColor, type DictionaryEntry } from "@/lib/data";
import BackButton from "@/components/BackButton";
import Reveal from "@/components/Reveal";
import PaletteCard from "@/components/PaletteCard";
import ScanModeToggle from "@/components/ScanModeToggle";
import { isNative, takeNativePhoto, hapticMedium } from "@/lib/native";

const fonts = {
  display: "'Fredoka', sans-serif",
  serif: "'Inter', sans-serif",
  sans: "'Inter', Arial, sans-serif",
};

/* Palette (côté pages). Les vars CSS (--txt, --txt-soft, --ln, --surf) du
   theme jour/nuit prennent le dessus quand disponibles. */
const fallback = {
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
};

/* 12 essentielles — couleurs du mockup (sumi, marine, brique, olive, sauge,
   terracotta, brun, lanterne, beige doré, taupe, crème, off-white). */
const ESSENTIALS = [
  "#1E1E1E", "#1f3a5f", "#6B2D2A", "#556b2f",
  "#7A8F73", "#c46b4a", "#b5613f", "#D4A24E",
  "#c7a06a", "#a89e8e", "#D8C9B2", "#FBF9F5",
];

export default function ScannerPage() {
  /* État vide propre — pas de #5C2018 par défaut (brief 3.1). */
  const [color, setColor] = useState<string | null>(null);
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [nativeMode, setNativeMode] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNativeMode(isNative());
  }, []);

  /** Extrait la couleur dominante d'une source image (URL d'objet OU dataURL). */
  const extractFromImageSrc = (src: string) => {
    setLoading(true);
    setPreviewUrl(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const W = 80, H = 80;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) { setLoading(false); return; }
      ctx.drawImage(img, 0, 0, W, H);
      const data = ctx.getImageData(0, 0, W, H).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const luminance = (R + G + B) / 3;
        if (luminance > 240 || luminance < 15) continue;
        r += R; g += G; b += B; n++;
      }
      if (n === 0) { setLoading(false); return; }
      const hex = "#" + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
      setColor(hex);
      setResults(findPalettesByColor(hex, 6));
      setLoading(false);
      void hapticMedium();
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };
    img.src = src;
  };

  const extractFromFile = (file: File) => extractFromImageSrc(URL.createObjectURL(file));

  const onNativeCamera = async () => {
    const dataUrl = await takeNativePhoto();
    if (dataUrl) extractFromImageSrc(dataUrl);
    else if (!isNative()) fileRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractFromFile(file);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) extractFromFile(file);
  };
  const onColorChange = (hex: string) => {
    setColor(hex);
    setResults(findPalettesByColor(hex, 6));
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: fonts.sans,
        background: "var(--wada-paper, #F4EFE7)",
        color: "var(--wada-ink, #1E1E1E)",
        lineHeight: 1.55,
        transition: "background .4s ease, color .4s ease",
      }}
    >
            <BackButton fallback="/atelier" />

      <div style={{
        maxWidth: 1000, margin: "0 auto",
        /* Brief « bugs visuels mobile » BUG #2 (24/05) :
           padding "0 24px" ne prenait pas en compte env(safe-area-
           inset-*). Sur iPhone à encoche + viewportFit:cover, les
           ~14px de safe-area droite n'étaient pas réservés → le bord
           droit des boutons « Prendre une photo » / « Choisir un
           fichier » et de la carte « Couleur détectée » passait sous
           la courbure du device. max(24px, safe-area-inset-*) garantit
           que le contenu reste dans la zone safe. */
        padding: "0 max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left))",
      }}>
        {/* ─── HERO ÉDITORIAL CENTRÉ ─── */}
        <div style={{ padding: "34px 0 8px", textAlign: "center" }}>
          <Reveal>
            <p style={{
              fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase",
              color: fallback.bordeaux, fontWeight: 500, margin: 0,
            }}>
              Scanner
            </p>
            <h1 style={{
              fontFamily: fonts.display, fontWeight: 700,
              fontSize: "clamp(30px, 5vw, 40px)", margin: "8px 0 6px",
              color: "var(--wada-ink, #1E1E1E)",
            }}>
              Trouvez votre couleur exacte.
            </h1>
            <p style={{
              color: "var(--wada-text-secondary, #6f685f)",
              maxWidth: "50ch", margin: "0 auto",
            }}>
              Photographiez une couleur ou un vêtement — WADA lit la teinte vraie et propose les palettes qui s'accordent.
            </p>
            <div style={{ marginTop: 20 }}>
              <ScanModeToggle active="couleur" />
            </div>
          </Reveal>
        </div>

        {/* ─── PANEL 2-COL ─── */}
        <section
          className="wada-scanner-panel"
          style={{
            background: "var(--wada-card-bg-strong, #FBF9F5)",
            border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 8px 30px rgba(30,30,30,.06)",
            margin: "26px 0 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 34,
            alignItems: "center",
          }}
        >
          {/* COLONNE GAUCHE — drop zone + détection */}
          <div>
            {nativeMode && (
              <button
                type="button"
                onClick={onNativeCamera}
                style={{
                  width: "100%",
                  marginBottom: 12,
                  background: fallback.bordeaux,
                  color: "#FAF8F4",
                  border: "none",
                  borderRadius: 999,
                  padding: "13px",
                  fontSize: 14,
                  fontFamily: fonts.sans,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span aria-hidden>📷</span> Ouvrir la caméra
              </button>
            )}

            {/* Drop zone — brief audit A5 : <label htmlFor> natif au lieu
                de role="button" custom. Sémantique correcte : cliquer (ou
                taper) sur le label ouvre directement l'input file natif,
                pas besoin de gérer le clavier manuellement. Drag/drop
                conservé via les events sur le label. */}
            <label
              htmlFor="wada-scanner-file"
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              style={{
                display: "block",
                border: `1.5px dashed ${dragActive ? "var(--wada-ink, #1E1E1E)" : "var(--wada-border, rgba(30,30,30,.10))"}`,
                borderRadius: 18,
                background: "var(--wada-paper, #F4EFE7)",
                padding: "34px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "border-color .2s ease, background .2s ease",
              }}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Aperçu"
                    style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain", borderRadius: 8, marginBottom: 10 }}
                  />
                  <p style={{ fontSize: 13, color: "var(--wada-text-secondary, #6f685f)", margin: 0, fontStyle: "italic" }}>
                    Cliquez pour changer
                  </p>
                </>
              ) : (
                <>
                  <div aria-hidden style={{ fontSize: 30, color: fallback.olive }}>◇</div>
                  <h3 style={{
                    fontFamily: fonts.display, fontWeight: 500,
                    fontSize: 20, margin: "10px 0 6px",
                    color: "var(--wada-ink, #1E1E1E)",
                  }}>
                    Déposez ou photographiez
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--wada-text-secondary, #6f685f)", margin: 0 }}>
                    Un mur, une fleur, un tissu
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    {/* preventDefault sur les boutons à l'intérieur du
                        <label> : empêche le label de re-déclencher l'input
                        file natif (sinon double dialogue ou conflit avec
                        l'API caméra Capacitor). stopPropagation reste pour
                        bloquer le bubbling jusqu'au label. */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (nativeMode) onNativeCamera();
                        else fileRef.current?.click();
                      }}
                      style={{
                        background: fallback.bordeaux,
                        color: "#FAF8F4",
                        border: "none",
                        borderRadius: 999,
                        padding: "13px",
                        fontSize: 16, // M2 audit : ≥16 évite zoom iOS sur input
                        cursor: "pointer",
                        fontFamily: fonts.sans,
                        fontWeight: 500,
                      }}
                    >
                      <span aria-hidden>📷</span> Prendre une photo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fileRef.current?.click();
                      }}
                      style={{
                        background: "transparent",
                        color: "var(--wada-ink, #1E1E1E)",
                        border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
                        borderRadius: 999,
                        padding: "12px",
                        fontSize: 16,
                        cursor: "pointer",
                        fontFamily: fonts.sans,
                        fontWeight: 500,
                      }}
                    >
                      Choisir un fichier
                    </button>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                id="wada-scanner-file"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFile}
                style={{
                  /* sr-only : caché visuellement mais accessible au clavier
                     (vs display:none qui rend l'input inatteignable). */
                  position: "absolute",
                  width: 1, height: 1,
                  padding: 0, margin: -1,
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              />
            </label>

            {/* Détection card */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "var(--wada-paper, #F4EFE7)",
              border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
              borderRadius: 14,
              padding: "14px 16px",
              marginTop: 14,
            }}>
              <div
                aria-hidden
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: color || "#cfc8bd",
                  border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 10, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: fallback.olive,
                  margin: 0, fontWeight: 600,
                }}>
                  Couleur détectée
                </p>
                <p style={{
                  fontFamily: fonts.serif,
                  fontSize: 15, color: "var(--wada-text-secondary, #6f685f)",
                  margin: "2px 0 0", lineHeight: 1.3,
                  /* Brief « bugs visuels mobile » BUG #2 (24/05) :
                     whiteSpace:nowrap + ellipsis tronquait « Aucune
                     couleur scannée pour le moment » en « …pour le momen… »
                     sur iPhone (32 chars ne tiennent jamais à 375px).
                     Pour les hex (« #1F3A5F »), nowrap reste pertinent ;
                     on garde nowrap UNIQUEMENT quand on affiche un hex.
                     Sinon, le texte peut wrap sur 2 lignes. */
                  overflow: "hidden",
                  ...(color && !loading
                    ? { whiteSpace: "nowrap" as const, textOverflow: "ellipsis" as const }
                    : { wordBreak: "break-word" as const }),
                }}>
                  {loading ? "Analyse en cours…"
                    : color ? color.toUpperCase()
                    : "Aucune couleur scannée pour le moment"}
                </p>
              </div>
              <input
                type="color"
                value={color || "#888888"}
                onChange={(e) => onColorChange(e.target.value)}
                style={{
                  // Brief audit mobile §4 : 44×44 minimum tactile (WCAG 2.5.5).
                  // L'ancien 36×32 forçait l'utilisateur à zoomer pour viser.
                  width: 44, height: 44, minWidth: 44, minHeight: 44,
                  border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
                  background: "transparent",
                  cursor: "pointer", padding: 0, borderRadius: 8,
                }}
                aria-label="Choix précis de la couleur"
              />
            </div>
          </div>

          {/* COLONNE DROITE — info */}
          <div>
            <h2 style={{
              fontFamily: fonts.display, fontWeight: 700,
              fontSize: "clamp(26px, 3.4vw, 34px)", lineHeight: 1.1,
              color: "var(--wada-ink, #1E1E1E)", margin: 0,
            }}>
              La teinte vraie, pas une approximation.
            </h2>
            <p style={{
              color: "var(--wada-text-secondary, #6f685f)",
              margin: "12px 0 16px",
            }}>
              WADA détecte la couleur dans votre navigateur et la rattache à l'accord de Sanzo Wada le plus proche.
            </p>

            {[
              { t: "Précision", d: "analyse pondérée, ignore le bruit." },
              { t: "Sans inscription", d: "tout reste sur votre appareil." },
              { t: "348 palettes", d: "le dictionnaire complet, à portée." },
            ].map((b) => (
              <div key={b.t} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: fallback.bordeaux, fontWeight: 700 }}>✓</span>
                <span>
                  <b style={{ fontWeight: 600, color: "var(--wada-ink, #1E1E1E)" }}>{b.t}</b>
                  <span style={{ color: "var(--wada-text-secondary, #6f685f)" }}> — {b.d}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ESSENTIELLES — raccourcis 12 swatches ronds ─── */}
        <section style={{
          margin: "30px 0 0",
          background: "var(--wada-card-bg-strong, #FBF9F5)",
          border: "1px solid var(--wada-border, rgba(30,30,30,.10))",
          borderRadius: 24,
          padding: "26px 30px",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase",
            color: fallback.bordeaux, fontWeight: 500, margin: 0,
          }}>
            Raccourcis
          </p>
          <h3 style={{
            fontFamily: fonts.display, fontWeight: 700,
            fontSize: 24, margin: "6px 0 4px",
            color: "var(--wada-ink, #1E1E1E)",
          }}>
            Ou choisissez parmi les essentielles
          </h3>
          <div style={{
            display: "flex", gap: 10, justifyContent: "center",
            flexWrap: "wrap", marginTop: 16,
          }}>
            {ESSENTIALS.map((c) => {
              const active = color?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  aria-label={`Choisir ${c}`}
                  className="wada-essential-swatch"
                  style={{
                    width: 46, height: 46,
                    borderRadius: "50%",
                    background: c,
                    border: `2px solid ${active ? fallback.bordeaux : "var(--wada-card-bg-strong, #FBF9F5)"}`,
                    boxShadow: "0 0 0 1px var(--wada-border, rgba(30,30,30,.10))",
                    cursor: "pointer",
                    padding: 0,
                    transition: "transform .2s ease",
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* ─── RÉSULTATS — apparaît après un scan ─── */}
        {results.length > 0 && (
          <section id="results" style={{ margin: "40px 0 0" }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <p style={{
                fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase",
                color: fallback.bordeaux, fontWeight: 500, margin: 0,
              }}>
                Vos résultats
              </p>
              <h2 style={{
                fontFamily: fonts.display, fontWeight: 700,
                fontSize: "clamp(26px, 3.5vw, 32px)", margin: "6px 0 4px",
                color: "var(--wada-ink, #1E1E1E)",
              }}>
                Palettes accordées {color && <span style={{ color: fallback.bordeaux }}>{color.toUpperCase()}</span>}
              </h2>
              <p style={{
                fontFamily: fonts.serif,
                color: "var(--wada-text-secondary, #6f685f)", margin: 0,
              }}>
                Cliquez sur une palette pour voir la tenue complète.
              </p>
            </div>
            <div
              className="wada-palettes-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {results.map((p) => (
                <PaletteCard key={p.number} entry={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      
      <style jsx>{`
        .wada-essential-swatch:hover {
          transform: scale(1.1);
        }
        @media (max-width: 760px) {
          :global(.wada-scanner-panel) {
            grid-template-columns: 1fr !important;
            gap: 22px !important;
            padding: 22px !important;
          }
          :global(.wada-palettes-grid) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 460px) {
          :global(.wada-palettes-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
