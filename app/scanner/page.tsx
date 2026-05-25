"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { dictionary, findPalettesByColor, type DictionaryEntry } from "@/lib/data";
import {
  ink, paper, subtle, border, textSecondary, cardBg,
  mojo, mojoSoft,
  sectionLabel,
  fontHeading, fontBody, fontLabel,
  buttonRadius, cardRadius,
} from "@/lib/styles";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";
import WadaVisual from "@/components/WadaVisual";
import PaletteCard from "@/components/PaletteCard";
import { isNative, takeNativePhoto, hapticMedium } from "@/lib/native";

/* ──────────────────────────────────────────────────────────────────────
   Boutons identiques à la home
   ────────────────────────────────────────────────────────────────────── */
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
const btnGhost   = { ...btnBase, background: "transparent", color: ink, padding: "13px 8px" };

const quickSwatches = [
  "#0C0C0C", "#1B2840", "#5C2018", "#5C5A3C", "#7A8F73", "#C26A4F",
  "#A8624A", "#C9A24A", "#B8946A", "#A89A85", "#E8DFD0", "#F8F5EE",
];

export default function ScannerPage() {
  const [color, setColor] = useState<string>("#5C2018");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [nativeMode, setNativeMode] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const demo  = dictionary.find((d) => d.number === "002") || dictionary[0];
  const demo2 = dictionary.find((d) => d.number === "003") || dictionary[1] || dictionary[0];

  useEffect(() => {
    setResults(findPalettesByColor("#5C2018", 6));
    // Détection client-only de la plateforme native (Capacitor) — utilisé
    // pour afficher le bouton "Prendre une photo" et activer les haptiques.
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
      void hapticMedium(); // no-op sur web, vibration douce sur device
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };
    img.src = src;
  };

  const extractFromFile = (file: File) => extractFromImageSrc(URL.createObjectURL(file));

  /** Ouvre la caméra native Capacitor (iOS/Android) — fallback file input web. */
  const onNativeCamera = async () => {
    const dataUrl = await takeNativePhoto();
    if (dataUrl) {
      extractFromImageSrc(dataUrl);
    } else if (!isNative()) {
      // Sur web : fallback file picker. Sur natif : annulation → on ne fait rien.
      fileRef.current?.click();
    }
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
    <main style={{ minHeight: "100vh", fontFamily: fontBody, background: paper, color: ink }}>
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
      <Nav />
      <div id="main-content" />

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — 2 colonnes : scanner à gauche, titre éditorial à droite
          Fond Mojo soft comme la home
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: mojoSoft, padding: "80px 5% 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div className="wada-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

              {/* Colonne gauche — Scanner */}
              <div>
                {nativeMode && (
                  <button
                    type="button"
                    onClick={onNativeCamera}
                    data-wada-btn
                    style={{
                      ...btnPrimary,
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: 16,
                      padding: "16px 24px",
                      fontSize: 14,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <circle cx="12" cy="13.5" r="3.5" />
                      <path d="M8 7 L9 4 L15 4 L16 7" />
                    </svg>
                    <span>Prendre une photo</span>
                  </button>
                )}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: "relative",
                    border: `2px dashed ${dragActive ? ink : border}`,
                    background: dragActive ? cardBg : paper,
                    padding: "56px 32px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    minHeight: 320,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    borderRadius: cardRadius,
                  }}
                  onMouseEnter={(ev) => { if (!dragActive) ev.currentTarget.style.borderColor = subtle; }}
                  onMouseLeave={(ev) => { if (!dragActive) ev.currentTarget.style.borderColor = border; }}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Aperçu" style={{ maxHeight: 220, maxWidth: "100%", objectFit: "contain", borderRadius: 6 }} />
                      <p style={{ fontSize: 13, color: subtle, fontStyle: "italic", margin: 0, fontFamily: fontBody }}>
                        Cliquez ou déposez une autre photo pour changer
                      </p>
                    </>
                  ) : (
                    <>
                      <svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke={ink} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="8" y="14" width="32" height="22" />
                        <circle cx="24" cy="25" r="6" />
                        <path d="M16 14 L18 10 L30 10 L32 14" />
                      </svg>
                      <h2 style={{
                        fontFamily: fontHeading, fontSize: 26, fontStyle: "italic", fontWeight: 500,
                        margin: 0, color: ink, letterSpacing: "-0.01em",
                      }}>
                        {loading ? "Analyse en cours…" : "Déposez une photo ici"}
                      </h2>
                      <p style={{ fontSize: 14, color: textSecondary, fontStyle: "italic", margin: 0, fontFamily: fontBody }}>
                        ou cliquez pour parcourir vos fichiers
                      </p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
                </div>

                {/* Aperçu couleur sous la zone */}
                <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: paper, border: `1px solid ${border}`, borderRadius: cardRadius }}>
                  <div style={{ width: 48, height: 48, background: color, border: `1px solid ${border}`, borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ ...sectionLabel, color: subtle, margin: 0, fontSize: 10 }}>Couleur détectée</p>
                    <p style={{ fontFamily: fontHeading, fontSize: 20, fontStyle: "italic", color: ink, margin: "2px 0 0", lineHeight: 1 }}>
                      {color.toUpperCase()}
                    </p>
                  </div>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ width: 44, height: 36, border: `1px solid ${border}`, background: "transparent", cursor: "pointer", padding: 0, borderRadius: 6 }}
                    aria-label="Choix précis de la couleur"
                  />
                </div>
              </div>

              {/* Colonne droite — Texte éditorial */}
              <div>
                {/* Vignette photo — "main qui tient un petit appareil photo" */}
                <div
                  aria-hidden
                  style={{
                    width: 110, height: 140,
                    marginBottom: 22,
                    background: `url("/scanner-camera.jpg")`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    borderRadius: 4,
                    boxShadow: "var(--wada-shadow-3)",
                    transform: "rotate(-2deg)",
                  }}
                />
                <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Scanner</p>
                <h1 className="wada-hero-title wada-text-3d-ink" style={{
                  fontFamily: fontHeading, fontSize: 72, fontWeight: 500,
                  lineHeight: 1.04, letterSpacing: "-0.02em", margin: 0,
                  fontStyle: "italic", color: ink,
                }}>
                  Trouvez votre <SketchUnderline color={mojo}>couleur</SketchUnderline> exacte.
                </h1>
                <p style={{
                  fontFamily: fontBody, fontSize: 18, lineHeight: 1.7,
                  color: textSecondary, margin: "24px 0 0", maxWidth: 520,
                }}>
                  Déposez la photo d'un vêtement, d'un mur, d'une fleur. WADA lit la teinte
                  vraie et propose les palettes qui s'accordent — pas une approximation.
                </p>

                {/* Bénéfices courts */}
                <ul style={{ margin: "28px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { t: "Précision sub-pixel", d: "Algo qui ignore le bruit blanc/noir et calcule la moyenne pondérée." },
                    { t: "Aucune inscription", d: "Tout reste local dans votre navigateur." },
                    { t: "348 palettes prêtes", d: "Le dictionnaire complet de Sanzo Wada à portée." },
                  ].map((b) => (
                    <li key={b.t} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                        background: mojo, color: "#FFFFFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: fontLabel, fontSize: 12, fontWeight: 700,
                      }}>
                        ✓
                      </span>
                      <div>
                        <p style={{ fontFamily: fontLabel, fontSize: 13, fontWeight: 600, color: ink, margin: 0, letterSpacing: "0.02em" }}>
                          {b.t}
                        </p>
                        <p style={{ fontFamily: fontBody, fontSize: 14, color: textSecondary, margin: "2px 0 0", lineHeight: 1.5 }}>
                          {b.d}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ ...btnPrimary, cursor: "pointer" }}
                  >
                    <span>Choisir une photo</span>
                    <HandArrow size={24} color="#FFFFFF" />
                  </button>
                  <Link href="/palettes" style={btnGhost}>
                    <span>Voir les 348 tenues</span>
                    <span aria-hidden style={{ fontSize: 16 }}>→</span>
                  </Link>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. RACCOURCIS — swatches essentiels, fond paper
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "72px 5%", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>Raccourcis</p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 36, fontWeight: 500,
                lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 12px",
                fontStyle: "italic", color: ink,
              }}>
                Ou choisissez parmi les <SketchUnderline color={mojo}>essentielles</SketchUnderline>.
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 15, color: textSecondary, margin: 0, fontStyle: "italic" }}>
                Douze couleurs qui ouvrent les meilleures palettes.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {quickSwatches.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  aria-label={c}
                  className="wada-lift"
                  style={{
                    width: 64, height: 64, background: c,
                    border: color === c ? `2px solid ${ink}` : `1px solid ${border}`,
                    cursor: "pointer", padding: 0, borderRadius: 6,
                    transition: "transform 0.15s ease",
                  }}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. RÉSULTATS — toujours affichés (démo au démarrage)
          ══════════════════════════════════════════════════════════════════ */}
      {results.length > 0 && (
        <section id="results" style={{ background: paper, padding: "96px 5%" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <Reveal>
              <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 56px" }}>
                <p style={{ ...sectionLabel, color: mojo, marginBottom: 14, fontWeight: 600 }}>
                  {previewUrl ? "Vos résultats" : "Aperçu"}
                </p>
                <h2 style={{
                  fontFamily: fontHeading, fontSize: 56, fontWeight: 500,
                  lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 16px",
                  fontStyle: "italic", color: ink,
                }}>
                  Palettes qui s'accordent à <SketchUnderline color={mojo}>{color.toUpperCase()}</SketchUnderline>
                </h2>
                <p style={{ fontFamily: fontBody, fontSize: 17, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                  Cliquez sur une palette pour voir la tenue complète et les boutiques.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="wada-palettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                {results.map((p) => (
                  <PaletteCard key={p.number} entry={p} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          5. POURQUOI LE SCANNER — 3 différences, fond paper
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 64px" }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Précision</p>
              <h2 style={{
                fontFamily: fontHeading,
                fontSize: "clamp(28px, 5.5vw, 56px)",
                fontWeight: 500,
                lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 16px",
                fontStyle: "italic", color: ink,
              }}>
                Pas une <SketchUnderline color={mojo}>devinette</SketchUnderline>.<br />Une lecture.
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 17, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                Le scanner WADA traite chaque pixel comme un mot du dictionnaire de Sanzo Wada.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="wada-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
              <ReasonCard
                title="Couleur vraie"
                desc="Algo qui pondère luminance et saturation pour retourner la teinte dominante — pas une moyenne grise."
              />
              <ReasonCard
                title="100 % local"
                desc="Vos photos ne quittent jamais votre appareil. Aucune analyse côté serveur."
              />
              <ReasonCard
                title="348 palettes"
                desc="Chaque résultat est validé contre le dictionnaire de Sanzo Wada (1933) — un siècle de couleur."
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. CTA — fond paper minimaliste, sans photo marbrée
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "80px 5% 96px", borderTop: `1px solid ${border}` }}>
        <Reveal>
          <div style={{
            maxWidth: 720, margin: "0 auto", textAlign: "center",
          }}>
            <h2 className="wada-text-3d-ink" style={{
              fontFamily: fontHeading, fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 500,
              lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 20px",
              fontStyle: "italic", color: ink,
            }}>
              Une photo. <SketchUnderline color={mojo}>Une palette.</SketchUnderline>
            </h2>
            <p style={{ fontFamily: fontBody, fontSize: 17, color: textSecondary, margin: "0 auto 32px", maxWidth: 540, lineHeight: 1.6 }}>
              Aucune inscription. Aucun upload sur nos serveurs. Juste votre couleur.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/palettes" style={btnPrimary} data-wada-btn>
                <span>Explorer les palettes</span>
                <HandArrow size={22} color="#FFFFFF" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   COMPOSANTS LOCAUX
   ════════════════════════════════════════════════════════════════════════ */
function StepCard(props: { step: string; visual: React.ReactNode; title: string; desc: string }) {
  return (
    <article className="wada-lift wada-press" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="wada-zoom" style={{ position: "relative", aspectRatio: "4 / 3", overflow: "hidden", borderRadius: cardRadius, background: cardBg, border: `1px solid ${border}` }}>
        {props.visual}
        <span style={{
          position: "absolute", top: 16, left: 16,
          padding: "4px 10px",
          background: "rgba(255, 255, 255, 0.92)",
          color: ink,
          fontFamily: fontLabel,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.25em",
          borderRadius: 6,
          zIndex: 2,
        }}>
          {props.step}
        </span>
      </div>
      <div>
        <h3 style={{
          fontFamily: fontHeading, fontSize: 26, fontWeight: 500,
          lineHeight: 1.15, letterSpacing: "-0.015em", margin: "0 0 10px",
          fontStyle: "italic", color: ink,
        }}>
          {props.title}
        </h3>
        <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
          {props.desc}
        </p>
      </div>
    </article>
  );
}

function ReasonCard(props: { title: string; desc: string }) {
  return (
    <article className="wada-lift" style={{
      background: paper,
      borderRadius: cardRadius,
      border: `1px solid ${border}`,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: mojoSoft, color: mojo,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: fontHeading, fontSize: 20, fontStyle: "italic", fontWeight: 600,
        marginBottom: 4,
      }}>
        ✦
      </div>
      <h3 style={{
        fontFamily: fontHeading, fontSize: 24, fontWeight: 500,
        lineHeight: 1.2, letterSpacing: "-0.01em", margin: 0,
        fontStyle: "italic", color: ink,
      }}>
        {props.title}
      </h3>
      <p style={{ fontFamily: fontBody, fontSize: 15, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
        {props.desc}
      </p>
    </article>
  );
}
