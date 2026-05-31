"use client";
/**
 * /composer — Mode "Un vêtement" plein écran caméra (refonte 2026-05-31).
 *
 * User demande : « met le scanner aussi pour vetement ».
 *
 * Architecture identique à /scanner (caméra plein écran type app
 * native), mais le bottom sheet de résultat demande EN PLUS :
 *   - le SLOT du vêtement scanné (Haut / Bas / Veste / Chaussures)
 *   - le STYLE de la pièce (T-shirt, Chemise, Jean… variable selon slot)
 *
 * Ces 2 infos sont indispensables pour que /ma-tenue compose une tenue
 * cohérente autour de la pièce scannée :
 *   - slot = quelle place dans la tenue (cette pièce, les 4 autres autour)
 *   - style → registre WADA (Classique / Streetwear / Old money / Décontracté)
 *     → exclut les pièces incohérentes (running shoes + tailoring, etc.)
 *
 * Le bouton final route vers /ma-tenue?palette=N&style=...&genre=...&slot=...
 * Le composer ne fait PLUS de composition inline — /ma-tenue est la
 * page dédiée pour cette logique, on évite la duplication.
 *
 * Confidentialité : la photo NE QUITTE JAMAIS l'appareil (canvas local).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { findPalettesByColor, type DictionaryEntry } from "@/lib/data";
import { isNative, takeNativePhoto, hapticMedium } from "@/lib/native";
import type { Slot } from "@/lib/outfitComposer";

const palette = {
  bordeaux: "#6B3A32",
  bordeauxDark: "#5a3029",
  cream: "#FAF8F4",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  olive: "#A8B29A",
  line: "rgba(30,30,30,.12)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const SLOT_OPTIONS: Array<{ slug: Slot; label: string; icon: string }> = [
  { slug: "haut", label: "Haut", icon: "👕" },
  { slug: "bas", label: "Bas", icon: "👖" },
  { slug: "veste", label: "Veste", icon: "🧥" },
  { slug: "chaussures", label: "Chaussures", icon: "👟" },
];

/* Brief « Scanner Un vêtement » §2 : style → registre WADA pour /ma-tenue.
   Garde la même table que la version précédente du composer pour ne pas
   régresser sur la cohérence registre × pièces. */
const STYLE_BY_SLOT: Record<Slot, Array<{ label: string; register: string }>> = {
  haut: [
    { label: "T-shirt", register: "Décontracté" },
    { label: "Chemise", register: "Classique" },
    { label: "Pull", register: "Classique" },
    { label: "Hoodie", register: "Streetwear" },
  ],
  bas: [
    { label: "Jean", register: "Décontracté" },
    { label: "Chino", register: "Classique" },
    { label: "Pantalon habillé", register: "Old money" },
    { label: "Jogging", register: "Streetwear" },
  ],
  chaussures: [
    { label: "Sneakers", register: "Décontracté" },
    { label: "Derbies", register: "Old money" },
    { label: "Mocassins", register: "Old money" },
    { label: "Bottes", register: "Classique" },
    { label: "Running", register: "Streetwear" },
  ],
  veste: [
    { label: "Blazer", register: "Old money" },
    { label: "Bomber", register: "Streetwear" },
    { label: "Manteau", register: "Classique" },
    { label: "Coupe-vent", register: "Décontracté" },
  ],
  accent: [
    { label: "Ceinture", register: "Classique" },
    { label: "Foulard", register: "Old money" },
    { label: "Sac", register: "Décontracté" },
  ],
};

interface Detected {
  hex: string;
  matches: DictionaryEntry[];
}

/* Phase 1 (2026-05-31) — Résultat Vision /api/scan-garment.
   Type tolérant : null pour les champs optionnels que la Vision peut omettre
   selon les images (modèle/marque/couleur secondaire). */
interface VisionGarment {
  type: string;
  slot: Slot;
  marque: string | null;
  modele: string | null;
  couleur_principale: { nom: string; hex: string };
  couleur_secondaire: { nom: string; hex: string } | null;
  registre: "classique" | "streetwear" | "minimaliste" | "decontracte";
  genre: "femme" | "homme" | "mixte";
  caracteristiques: string[];
  saison: "ete" | "mi-saison" | "hiver" | "toute_saison";
}
interface VisionError {
  error: string;
  raison?: string;
}
type VisionResponse = VisionGarment | VisionError;

/* État de l'analyse Vision : pending pendant l'appel API,
   error si la Vision a échoué ou n'a pas reconnu, garment si OK. */
type VisionState =
  | { phase: "idle" }
  | { phase: "pending"; thumb: string }
  | { phase: "error"; thumb: string; message: string }
  | { phase: "garment"; thumb: string; data: VisionGarment };

export default function ComposerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [detected, setDetected] = useState<Detected | null>(null);
  const [pickedSlot, setPickedSlot] = useState<Slot>("haut");
  const [pickedStyle, setPickedStyle] = useState<string | null>(null);
  /* Phase 1 (2026-05-31) — résultat Vision /api/scan-garment. */
  const [vision, setVision] = useState<VisionState>({ phase: "idle" });

  const router = useRouter();

  /* Démarrage caméra arrière. */
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

  /* Capture : moyenne RGB du centre 30%, hex, palettes proches. */
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

    const sampleSize = Math.min(W, H) * 0.3;
    const sx = Math.floor(W / 2 - sampleSize / 2);
    const sy = Math.floor(H / 2 - sampleSize / 2);
    const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data;

    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const R = data[i], G = data[i + 1], B = data[i + 2];
      const lum = (R + G + B) / 3;
      if (lum > 245 || lum < 10) continue;
      r += R; g += G; b += B; n++;
    }
    if (n === 0) return;
    const hex = "#" + [r / n, g / n, b / n]
      .map((v) => Math.round(v).toString(16).padStart(2, "0"))
      .join("");

    const matches = findPalettesByColor(hex, 3);
    setDetected({ hex, matches });
    void hapticMedium();

    /* Phase 1 (2026-05-31) — Vision : on encode l'image en data URL et on
       l'envoie à /api/scan-garment. Compression JPEG 0.78 pour rester sous
       les ~5 Mo de garde-fou serveur même sur photos haute résolution.
       Downscale à 768px max (suffisant pour GPT-4o-mini detail:low). */
    void analyzeWithVision(canvas);
  }, [cameraReady]);

  /* Appelle /api/scan-garment avec un canvas (capture caméra ou image
     chargée depuis la galerie). Compresse → data URL → POST → setVision. */
  const analyzeWithVision = useCallback(async (sourceCanvas: HTMLCanvasElement) => {
    const targetMax = 768;
    const sw = sourceCanvas.width;
    const sh = sourceCanvas.height;
    const scale = Math.min(1, targetMax / Math.max(sw, sh));
    const tw = Math.round(sw * scale);
    const th = Math.round(sh * scale);
    const thumb = document.createElement("canvas");
    thumb.width = tw;
    thumb.height = th;
    const tctx = thumb.getContext("2d");
    if (!tctx) {
      setVision({ phase: "error", thumb: "", message: "Canvas indisponible" });
      return;
    }
    tctx.drawImage(sourceCanvas, 0, 0, tw, th);
    const dataUrl = thumb.toDataURL("image/jpeg", 0.78);
    setVision({ phase: "pending", thumb: dataUrl });

    try {
      const res = await fetch("/api/scan-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = (await res.json()) as VisionResponse;
      if ("error" in json) {
        setVision({
          phase: "error",
          thumb: dataUrl,
          message: json.raison || "Pièce non reconnue",
        });
        return;
      }
      setVision({ phase: "garment", thumb: dataUrl, data: json });
      /* Si la Vision a identifié un slot, on synchronise le picker manuel
         pour que le user n'ait qu'à confirmer. */
      if (json.slot) setPickedSlot(json.slot);
    } catch (err) {
      setVision({
        phase: "error",
        thumb: "",
        message: err instanceof Error ? err.message : "Réseau indisponible",
      });
    }
  }, []);

  /* Helper : à partir d'un HTMLImageElement chargé, on extrait la couleur
     dominante (canvas 80×80 — suffisant pour la moyenne) ET on génère un
     canvas plein format (max 1024) pour la Vision API. */
  const processLoadedImage = useCallback((img: HTMLImageElement) => {
    /* (1) Couleur dominante — petit canvas pour rapidité. */
    const small = document.createElement("canvas");
    small.width = 80; small.height = 80;
    const sctx = small.getContext("2d");
    if (sctx) {
      sctx.drawImage(img, 0, 0, 80, 80);
      const data = sctx.getImageData(0, 0, 80, 80).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const lum = (R + G + B) / 3;
        if (lum > 245 || lum < 10) continue;
        r += R; g += G; b += B; n++;
      }
      if (n > 0) {
        const hex = "#" + [r / n, g / n, b / n].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
        setDetected({ hex, matches: findPalettesByColor(hex, 3) });
      }
    }

    /* (2) Canvas plein format pour la Vision API (cappé à 1024px). */
    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const tw = Math.max(1, Math.round(img.naturalWidth * scale));
    const th = Math.max(1, Math.round(img.naturalHeight * scale));
    const full = document.createElement("canvas");
    full.width = tw; full.height = th;
    const fctx = full.getContext("2d");
    if (fctx) {
      fctx.drawImage(img, 0, 0, tw, th);
      void analyzeWithVision(full);
    }
  }, [analyzeWithVision]);

  /* Fallback fichier (galerie + caméra refusée). */
  const onFilePicked = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      processLoadedImage(img);
      void hapticMedium();
    };
    img.src = url;
  }, [processLoadedImage]);

  /* Capacitor natif. */
  const onNativeCamera = useCallback(async () => {
    if (!isNative()) return;
    const dataUrl = await takeNativePhoto();
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      processLoadedImage(img);
    };
    img.src = dataUrl;
  }, [processLoadedImage]);

  /* Flash via torche. */
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

  const closeResult = () => {
    setDetected(null);
    setPickedStyle(null);
    setVision({ phase: "idle" });
  };

  /* Validation : route vers /ma-tenue avec les params slot+style+palette.
     On lit le genre depuis le profil utilisateur s'il existe.

     Phase 2+3 (2026-05-31) : si la Vision a identifié une pièce, on
     stocke l'ancre dans sessionStorage avant la redirection. /ma-tenue
     lit ce blob au mount → exclut le slot ancré du composer (le client
     a déjà cette pièce) + affiche la carte « Ta pièce » en 1ère
     position avec un badge ancre. */
  const handleCompose = () => {
    if (!detected?.matches[0]) return;
    const paletteNumber = detected.matches[0].number;

    /* Si Vision OK, le registre vient de la Vision (plus fiable que
       STYLE_BY_SLOT qui dépend du clic manuel sur un chip style). */
    const registerFromVision = vision.phase === "garment"
      ? mapVisionRegistre(vision.data.registre)
      : null;
    const register =
      registerFromVision
      ?? STYLE_BY_SLOT[pickedSlot]?.find((s) => s.label === pickedStyle)?.register
      ?? "Classique";

    let genre: string | null = null;
    try {
      const raw = localStorage.getItem("wada.profile");
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.genre === "Femme") genre = "femme";
        else if (p?.genre === "Homme") genre = "homme";
      }
    } catch {}
    /* Le genre Vision est secondaire si profil dit autre chose, mais
       précieux pour les clients qui n'ont pas configuré /compte. */
    if (!genre && vision.phase === "garment") {
      const vg = vision.data.genre;
      if (vg === "femme" || vg === "homme") genre = vg;
    }

    /* Stockage ancre en sessionStorage (taille thumb ~50-150ko en JPEG
       0.78, dans le quota 5MB du sessionStorage). Une seule ancre
       active à la fois — pas de cumul. */
    try {
      if (vision.phase === "garment") {
        sessionStorage.setItem("wada.anchor", JSON.stringify({
          thumb: vision.thumb,
          slot: vision.data.slot,
          type: vision.data.type,
          marque: vision.data.marque,
          modele: vision.data.modele,
          couleur: vision.data.couleur_principale,
          registre: vision.data.registre,
          piecePicked: pickedStyle,
          detectedHex: detected.hex,
        }));
      } else {
        sessionStorage.removeItem("wada.anchor");
      }
    } catch {}

    const params = new URLSearchParams({
      palette: paletteNumber,
      style: register,
      slot: pickedSlot,
      piece: pickedStyle || "",
      color: detected.hex,
    });
    if (genre) params.set("genre", genre);
    /* Flag pour signaler à /ma-tenue qu'il y a une ancre (peut lire
       sessionStorage en complément). Évite un round-trip si l'user
       arrive directement sur /ma-tenue sans passer par /composer. */
    if (vision.phase === "garment") params.set("anchor", "1");
    router.push(`/ma-tenue?${params}`);
  };

  /* Phase 2 (2026-05-31) — mappe le registre Vision (lowercase sans
     accent) vers le label registre utilisé par WADA côté UI/filtres.
     Vision dit "classique", WADA filtre sur "Classique" via
     styleToRegistre — c'est case-insensitive donc accepte les deux. */
  function mapVisionRegistre(r: VisionGarment["registre"]): string {
    const map: Record<VisionGarment["registre"], string> = {
      classique: "Classique",
      streetwear: "Streetwear",
      minimaliste: "Minimaliste",
      decontracte: "Décontracté",
    };
    return map[r] || "Classique";
  }

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

      {/* Voile sombre si caméra pas prête */}
      {!cameraReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(160deg, #3d3024 0%, #1f1814 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 14, padding: 32,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.2)",
            borderTopColor: "#fff",
            animation: cameraError ? "none" : "wada-spin 0.9s linear infinite",
          }} />
          <p style={{
            color: "#fff", fontFamily: fonts.display,
            fontSize: 18, fontWeight: 500, textAlign: "center",
          }}>
            {cameraError ? "Caméra inaccessible" : "Activation de la caméra…"}
          </p>
          {cameraError && (
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
          )}
        </div>
      )}

      {/* TOP BAR : × + label MODE VÊTEMENT + ⚡ */}
      <div style={{
        position: "absolute", top: "max(14px, env(safe-area-inset-top, 14px))",
        left: 0, right: 0, zIndex: 20,
        padding: "0 18px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <Link
          href="/"
          aria-label="Fermer"
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", textDecoration: "none",
            fontSize: 22, lineHeight: 1,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          ×
        </Link>

        <span style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#fff",
          fontFamily: fonts.display,
          fontSize: 12,
          letterSpacing: "0.18em",
          fontWeight: 500,
          padding: "6px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
        }}>
          MODE VÊTEMENT
        </span>

        <button
          type="button"
          onClick={toggleFlash}
          aria-label={flashOn ? "Éteindre le flash" : "Allumer le flash"}
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: flashOn ? "rgba(255,220,100,0.85)" : "rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", border: "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer", fontSize: 16, lineHeight: 1,
          }}
        >
          ⚡
        </button>
      </div>

      {/* MIRE — cadre rectangulaire vertical (pour cadrer un vêtement plutôt
          qu'un point couleur). 4 coins arrondis + ligne de pulse centrale. */}
      {cameraReady && !detected && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 210, height: 280,
          zIndex: 15, pointerEvents: "none",
        }}>
          <svg viewBox="0 0 100 130" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <path d="M5,22 L5,5 L25,5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M75,5 L95,5 L95,22" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M95,108 L95,125 L75,125" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
            <path d="M25,125 L5,125 L5,108" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,.5))" }} />
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

      {/* HINT */}
      {cameraReady && !detected && (
        <div style={{
          position: "absolute",
          top: "calc(50% + 170px)",
          left: 0, right: 0,
          textAlign: "center",
          color: "#fff", fontSize: 14,
          textShadow: "0 1px 6px rgba(0,0,0,0.7)",
          fontFamily: fonts.display, fontWeight: 500,
          letterSpacing: "0.02em",
          zIndex: 18,
        }}>
          Cadrez le vêtement
        </div>
      )}

      {/* BOTTOM BAR : toggle + capture + galerie */}
      {cameraReady && !detected && (
        <div style={{
          position: "absolute",
          bottom: "max(28px, env(safe-area-inset-bottom, 14px))",
          left: 0, right: 0,
          padding: "0 18px",
          zIndex: 25,
        }}>
          {/* Toggle Couleur / Vêtement (Vêtement actif ici) */}
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
            {/* User feedback 2026-05-31 : ordre inversé — Vêtement en
                premier (par défaut actif ici), couleur en second. */}
            <button
              type="button"
              style={{
                background: "#fff", color: palette.bordeaux,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "none", padding: "8px 16px",
                borderRadius: 999,
                fontFamily: fonts.display, fontSize: 13, fontWeight: 500,
                cursor: "pointer",
              }}
            >
              ◇ Un vêtement
            </button>
            <button
              type="button"
              onClick={() => router.push("/scanner")}
              style={{
                background: "transparent", color: palette.inkSoft,
                border: "none", padding: "8px 16px",
                borderRadius: 999,
                fontFamily: fonts.display, fontSize: 13, fontWeight: 500,
                cursor: "pointer",
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
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Ouvrir la galerie"
              style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#fff",
                border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}
            >
              🖼
            </button>

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

            <span style={{ width: 44, height: 44 }} aria-hidden />
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        style={{ display: "none" }}
      />

      {/* RÉSULTAT — bottom sheet avec slot + style picker */}
      {detected && (
        <>
          <div
            onClick={closeResult}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(3px)",
              zIndex: 30,
            }}
          />
          <div style={{
            position: "absolute",
            left: 10, right: 10,
            bottom: "max(10px, env(safe-area-inset-bottom, 10px))",
            background: "#fff",
            borderRadius: 22,
            padding: "16px 20px 22px",
            zIndex: 35,
            boxShadow: "0 -10px 30px -10px rgba(0,0,0,0.3)",
            animation: "wada-sheet-slide 0.3s cubic-bezier(.22,1,.36,1)",
            maxHeight: "78vh",
            overflowY: "auto",
          }}>
            <div style={{
              width: 36, height: 4,
              background: "#ddd", borderRadius: 2,
              margin: "0 auto 14px",
            }} />

            {/* Phase 1 (2026-05-31) — Bloc Vision : identification IA de la
                pièce scannée (type, marque, modèle, registre). Au-dessus
                du bloc couleur classique pour donner le résultat principal
                en haut, comme une vraie app de scan (Google Lens, Vivino). */}
            {vision.phase !== "idle" && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
                padding: "12px",
                background: vision.phase === "garment"
                  ? "rgba(168,178,154,0.10)"
                  : vision.phase === "error"
                    ? "rgba(193,62,62,0.08)"
                    : "rgba(30,30,30,0.04)",
                border: `1px solid ${
                  vision.phase === "garment"
                    ? "rgba(168,178,154,0.4)"
                    : vision.phase === "error"
                      ? "rgba(193,62,62,0.25)"
                      : "rgba(30,30,30,0.08)"
                }`,
                borderRadius: 14,
              }}>
                {/* Thumbnail de la pièce scannée */}
                {vision.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vision.thumb}
                    alt="Pièce scannée"
                    style={{
                      width: 56, height: 56, borderRadius: 10,
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 10,
                    background: "rgba(30,30,30,0.06)",
                    flexShrink: 0,
                  }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: fonts.sans, fontSize: 10,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: palette.bordeaux, fontWeight: 600,
                    margin: 0,
                  }}>
                    {vision.phase === "pending" && "Analyse en cours…"}
                    {vision.phase === "error" && "Non reconnu"}
                    {vision.phase === "garment" && "J'ai vu"}
                  </p>
                  {vision.phase === "garment" && (
                    <>
                      <p style={{
                        fontFamily: fonts.display, fontWeight: 600,
                        fontSize: 16, color: palette.ink,
                        margin: "2px 0 0",
                        lineHeight: 1.2,
                      }}>
                        {[vision.data.marque, vision.data.modele]
                          .filter(Boolean)
                          .join(" ") || vision.data.type}
                      </p>
                      <p style={{
                        fontFamily: fonts.sans, fontSize: 12,
                        color: palette.inkSoft, margin: "2px 0 0",
                        lineHeight: 1.3,
                      }}>
                        {[
                          vision.data.type,
                          vision.data.registre,
                          vision.data.couleur_principale?.nom,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </>
                  )}
                  {vision.phase === "pending" && (
                    <p style={{
                      fontFamily: fonts.sans, fontSize: 13,
                      color: palette.inkSoft, margin: "2px 0 0",
                    }}>
                      Identification de la pièce…
                    </p>
                  )}
                  {vision.phase === "error" && (
                    <p style={{
                      fontFamily: fonts.sans, fontSize: 12,
                      color: palette.inkSoft, margin: "2px 0 0",
                      lineHeight: 1.3,
                    }}>
                      {vision.message}. Tu peux quand même choisir le slot manuellement ci-dessous.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Header : couleur + palette détectée */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span
                aria-hidden
                style={{
                  width: 44, height: 44, borderRadius: 10,
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
                  fontSize: 16, color: palette.ink,
                  margin: "2px 0 0",
                }}>
                  {detected.hex.toUpperCase()}
                  {detected.matches[0] && (
                    <span style={{ fontSize: 12, color: palette.inkSoft, fontWeight: 400 }}>
                      {" "}· {detected.matches[0].name}
                    </span>
                  )}
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

            {/* Slot picker */}
            <p style={pickerLabel}>Quel type de pièce ?</p>
            <div style={chipRow}>
              {SLOT_OPTIONS.map(({ slug, label, icon }) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => { setPickedSlot(slug); setPickedStyle(null); }}
                  style={chipStyle(pickedSlot === slug)}
                >
                  <span style={{ fontSize: 14 }}>{icon}</span> {label}
                </button>
              ))}
            </div>

            {/* Style picker (selon slot) */}
            <p style={{ ...pickerLabel, marginTop: 14 }}>Plus précisément ?</p>
            <div style={chipRow}>
              {(STYLE_BY_SLOT[pickedSlot] || []).map(({ label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPickedStyle(label)}
                  style={chipStyle(pickedStyle === label)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* CTA Composer ma tenue */}
            <button
              type="button"
              onClick={handleCompose}
              disabled={!detected.matches[0]}
              style={{
                display: "block",
                width: "100%",
                marginTop: 18,
                background: detected.matches[0] ? palette.bordeaux : "#ccc",
                color: palette.cream,
                border: "none", borderRadius: 14,
                padding: "15px",
                textAlign: "center",
                fontFamily: fonts.display, fontSize: 15, fontWeight: 500,
                cursor: detected.matches[0] ? "pointer" : "not-allowed",
              }}
            >
              Composer ma tenue&nbsp;→
            </button>

            {!detected.matches[0] && (
              <p style={{ fontSize: 12, color: palette.inkSoft, textAlign: "center", marginTop: 8 }}>
                Aucune palette Sanzo Wada ne matche cette teinte. Recadre puis recapture.
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

const pickerLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: palette.inkSoft,
  fontWeight: 600,
  margin: "0 0 8px",
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "8px 13px",
    background: active ? palette.ink : "#FAF8F4",
    color: active ? palette.cream : palette.ink,
    border: `1px solid ${active ? palette.ink : palette.line}`,
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    transition: "all .15s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };
}
