"use client";
/**
 * /composer — Mode "Un vêtement" du scanner WADA (refonte 2026-05-20 v2).
 *
 * Brief mockup éditorial : hero photo gradient + voile dense, mode toggle
 * intégré au hero, carte couleur détectée qui chevauche, verdict bordeaux,
 * bande palette complète, 5 cards outfit, actions finales.
 *
 * Architecture WADA :
 *   - /scanner = mode "Une couleur" (1 toggle)
 *   - /composer = mode "Un vêtement" (1 toggle) ← cette page
 *
 * Confidentialité : la photo NE QUITTE JAMAIS l'appareil. Tout en local.
 */
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { composeOutfitFromColor, type ComposedOutfit, type Slot } from "@/lib/outfitComposer";
/* Brief design 2026-05-26 : alignement /composer sur /scanner — même
   toggle, même hero centré, mêmes hairlines, même structure éditoriale. */
import ScanModeToggle from "@/components/ScanModeToggle";

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  body: "'Inter', sans-serif",
};

const shadow = "0 12px 48px rgba(30,30,30,.10)";
const ease = "cubic-bezier(.22,1,.36,1)";

const SLOT_LABELS: Record<Slot, string> = {
  haut: "Haut",
  bas: "Bas",
  veste: "Veste",
  chaussures: "Chaussures",
  accent: "Accent",
};

const PIECE_OPTIONS: Array<{ slug: Slot; label: string }> = [
  { slug: "haut", label: "Haut" },
  { slug: "bas", label: "Bas" },
  { slug: "chaussures", label: "Chaussures" },
  { slug: "veste", label: "Veste" },
];

/**
 * Brief « Scanner Un vêtement » §2 (26/05) : ask piece type.
 * WADA ne détecte que la couleur ; sans info sur le type précis de pièce
 * (running shoes vs derbies, hoodie vs pull fin), le moteur propose une
 * tenue incohérente avec la vraie pièce. On demande le « style » de la
 * pièce, qui se mappe sur le REGISTRE de la tenue à composer.
 *
 * Mapping : chaque option → un registre WADA (passé à /api/products en
 * `style=` pour filtrer les pièces incohérentes — exclude survêtement
 * dans une tenue classique, exclude derbies dans une tenue sport…).
 */
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

type Gender = "femme" | "homme" | "unisexe";

/**
 * Brief « Scanner Un vêtement » §1 (26/05) — sub-component qui fetch
 * un vrai produit MUJI pour un slot non-ancre (haut/bas/chaussures/veste/
 * accent proposé par WADA, PAS la pièce que l'utilisateur a scannée).
 *
 * Pattern identique à /ma-tenue et /stylist : on tape /api/products avec
 * slot + color hex + genre + style, on prend le 1er résultat trié par
 * proximité ΔE. Si trouvé → photo MUJI + nom + prix + Acheter. Sinon →
 * fallback swatch couleur + « Voir des pièces → » (recherche générique).
 *
 * Priorité photo : imageLocal (Blob hi-res, mais désactivé tant que le
 * Blob store est private) → largeImage via /api/img proxy (1280px CDN
 * MUJI direct) → image (200px Awin, dernier recours).
 */
interface ComposerMujiProduct {
  nom: string;
  marque: string;
  image: string;
  prix: number;
  devise: string;
  url: string;
  /* Brief 2026-05-26 « erreur entre couleurs palette et couleurs habits » :
     on stocke aussi le nom de couleur RÉEL du produit MUJI (ex. « Brun
     foncé », « Écru », « Noir ») au lieu de juste l'intention palette
     (Camel, Moutarde, Olive). Affiché sous le nom de la pièce pour
     éviter le mismatch label/photo (chino brun foncé étiqueté « Camel »
     alors que la palette intent était camel mais le produit retourné
     est brun foncé). */
  couleurNom?: string;
  couleurHex?: string;
}
function useComposerMuji(
  slot: Slot | null,
  colorHex: string | null,
  style: string | null,
  genre: string | null,
) {
  const [product, setProduct] = useState<ComposerMujiProduct | null>(null);

  useEffect(() => {
    if (!slot || !colorHex) return;
    let cancelled = false;
    const params = new URLSearchParams({
      slot,
      merchant: "muji-france",
      color: colorHex,
      limit: "1",
    });
    if (style) params.set("style", style);
    if (genre) params.set("genre", genre.toLowerCase());

    fetch(`/api/products?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.products?.length) return;
        const p = data.products[0];
        /* Priorité photo : imageLocal → largeImage (via /api/img) → image
           (idem /ma-tenue, /stylist). Le proxy /api/img bypass le hotlink
           protection des CDN marchands. */
        const displayImage = p.imageLocal
          ? p.imageLocal
          : p.largeImage
            ? `/api/img?u=${encodeURIComponent(p.largeImage)}`
            : p.image
              ? `/api/img?u=${encodeURIComponent(p.image)}`
              : "";
        setProduct({
          nom: p.nom,
          marque: p.marque || p.marchand || "MUJI",
          image: displayImage,
          prix: p.prix,
          devise: p.devise,
          url: p.urlProduit,
          couleurNom: p.couleurNom,
          couleurHex: p.hex,
        });
      })
      .catch(() => { /* silencieux — fallback swatch + Voir des pièces */ });
    return () => { cancelled = true; };
  }, [slot, colorHex, style, genre]);

  return product;
}

export default function ComposerPage() {
  const [gender, setGender] = useState<Gender>("unisexe");
  const [anchorSlot, setAnchorSlot] = useState<Slot>("haut");
  /* Brief « Scanner Un vêtement » §2 (26/05) — label de la pièce scannée
     (« Hoodie », « Derbies »…). Sert à 2 choses :
       1. Affiner le registre WADA via STYLE_BY_SLOT (`pieceLabel` → register).
       2. Améliorer le label de l'ancre dans la tenue composée.
     Reset à null quand l'utilisateur change le slot ancre. */
  const [pieceLabel, setPieceLabel] = useState<string | null>(null);
  /* Registre dérivé : on cherche dans STYLE_BY_SLOT[anchorSlot] l'option
     dont le label matche `pieceLabel`. Si rien → "Classique" par défaut
     (registre neutre, ni trop sport ni trop habillé). Passé à /api/products
     pour exclure les pièces incohérentes (ex. running shoes + tailoring). */
  const pieceRegister =
    STYLE_BY_SLOT[anchorSlot]?.find((s) => s.label === pieceLabel)?.register
    ?? "Classique";
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [detectedHex, setDetectedHex] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<ComposedOutfit | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  /* Charge le genre depuis localStorage (cf. home page) */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wada-gender");
      if (saved === "femme" || saved === "homme" || saved === "unisexe") {
        setGender(saved);
      }
    } catch {}
  }, []);

  /* Détection couleur locale via canvas (zone centrale 50%) */
  const detectColorFromImage = (src: string) => {
    setLoading(true);
    setImgPreview(src);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const W = 80, H = 80;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) { setLoading(false); return; }
      ctx.drawImage(img, 0, 0, W, H);
      const cs = Math.floor(W * 0.25), ce = Math.floor(W * 0.75);
      const data = ctx.getImageData(cs, cs, ce - cs, ce - cs).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const R = data[i], G = data[i + 1], B = data[i + 2];
        const lum = (R + G + B) / 3;
        if (lum > 245 || lum < 12) continue;
        r += R; g += G; b += B; n++;
      }
      if (n === 0) { setLoading(false); return; }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      const composed = composeOutfitFromColor(hex, anchorSlot, gender);
      setDetectedHex(hex);
      setOutfit(composed);
      setLoading(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(12);
      }
    };
    img.onerror = () => setLoading(false);
    img.src = src;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    detectColorFromImage(url);
  };

  const reset = () => {
    setImgPreview(null);
    setDetectedHex(null);
    setOutfit(null);
  };

  return (
    <main style={{
      fontFamily: fonts.sans,
      background: palette.beige,
      color: palette.ink,
      lineHeight: 1.6,
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
    }}>
      <BackButton fallback="/atelier" />

      {/* ═══════════════════ HERO ÉPURÉ ═══════════════════
          Brief client : « ludique + instinctif ». H1 court, toggle en
          tête, plus de paragraphe explicatif (le formulaire parle de
          lui-même via ses chips). */}
      <section style={{ padding: "48px 26px 4px", textAlign: "center" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ marginBottom: 22 }}>
            <ScanModeToggle active="vetement" />
          </div>
          <h1 style={{
            fontFamily: fonts.display, fontWeight: 700,
            fontSize: "clamp(34px, 5.6vw, 48px)", margin: "0 0 4px",
            color: palette.ink,
            letterSpacing: "-0.01em",
          }}>
            Quelle pièce ?
          </h1>
          <p style={{
            color: palette.inkSoft,
            margin: 0, fontSize: 14, fontStyle: "italic",
          }}>
            Une photo, et WADA compose autour.
          </p>
        </div>
      </section>

      {/* ═══ CARTE D'ACTION ÉPURÉE ═══
          Brief client « moins d'info, plus instinctif » : on retire les
          étapes 01/02/03/04 numérotées qui transformaient la page en
          questionnaire administratif. Maintenant : 3 lignes de chips
          compactes (le formulaire EST son propre label) + drop zone
          photo en bas. L'utilisateur balaye en 5 secondes, comprend
          tout, clique. */}
      {!outfit && (
        <section style={{
          maxWidth: 580, margin: "26px auto 0",
          padding: "0 max(24px, env(safe-area-inset-right)) 0 max(24px, env(safe-area-inset-left))",
        }}>
          <div style={{
            background: "var(--wada-card-bg-strong, #FBF9F5)",
            border: `1px solid var(--wada-border, ${palette.line})`,
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 8px 30px rgba(30,30,30,.06)",
          }}>
            {/* Mini-label + chips genre */}
            <MiniLabel>Pour qui</MiniLabel>
            <ChipRow>
              {(["femme", "homme", "unisexe"] as Gender[]).map((g) => (
                <Chip key={g} active={gender === g} onClick={() => setGender(g)}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Chip>
              ))}
            </ChipRow>

            <MiniLabel>La pièce</MiniLabel>
            <ChipRow>
              {PIECE_OPTIONS.map((p) => (
                <Chip key={p.slug} active={anchorSlot === p.slug} onClick={() => {
                  setAnchorSlot(p.slug);
                  setPieceLabel(null);
                }}>
                  {p.label}
                </Chip>
              ))}
            </ChipRow>

            <MiniLabel>Son style</MiniLabel>
            <ChipRow>
              {(STYLE_BY_SLOT[anchorSlot] || []).map((s) => (
                <Chip
                  key={s.label}
                  active={pieceLabel === s.label}
                  onClick={() => setPieceLabel(s.label)}
                >
                  {s.label}
                </Chip>
              ))}
            </ChipRow>

            {/* Drop zone — aperture SVG + bouton bordeaux. Pas de titre,
                pas de mention "JPG / PNG max 8 Mo" : le bouton se suffit. */}
            <div style={{
              marginTop: 22, padding: "30px 20px",
              border: `1.5px dashed var(--wada-border, ${palette.line})`,
              borderRadius: 18,
              textAlign: "center",
              background: palette.beige,
              transition: "border-color .2s ease",
            }}>
              {imgPreview ? (
                <img src={imgPreview} alt="" style={{ maxHeight: 200, borderRadius: 12, marginBottom: 14, maxWidth: "100%", objectFit: "contain" }} />
              ) : (
                <svg
                  aria-hidden
                  width="38" height="38" viewBox="0 0 38 38"
                  style={{ display: "block", margin: "0 auto 14px", color: palette.olive }}
                >
                  <circle cx="19" cy="19" r="17" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
                  <circle cx="19" cy="19" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="19" cy="19" r="2.5" fill="currentColor" />
                </svg>
              )}
              {loading ? (
                <p style={{ color: palette.inkSoft, fontStyle: "italic", margin: 0 }}>
                  Analyse en cours…
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    fontFamily: fonts.sans, fontSize: 16,
                    padding: "13px 28px", borderRadius: 999,
                    background: palette.bordeaux, color: palette.cream,
                    border: "none", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  <span aria-hidden style={{ marginRight: 6 }}>📷</span>
                  Photographier la pièce
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                style={{
                  position: "absolute", width: 1, height: 1,
                  padding: 0, margin: -1, overflow: "hidden",
                  clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ ÉTAT RÉSULTAT — couleur détectée + verdict + accord + outfit ═══ */}
      {outfit && (
        <>
          {/* Carte couleur détectée qui chevauche le hero */}
          <div style={{
            position: "relative", zIndex: 4,
            maxWidth: 1040, margin: "-90px auto 0",
            padding: "0 26px",
          }}>
            <div style={{
              background: palette.cream,
              border: `1px solid ${palette.line}`,
              borderRadius: 20,
              boxShadow: shadow,
              padding: "22px 26px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 18, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div aria-hidden style={{
                  width: 60, height: 60, borderRadius: 14,
                  border: `1px solid ${palette.line}`,
                  background: detectedHex || "#000",
                  flexShrink: 0,
                }} />
                <div>
                  <p style={{
                    fontSize: 11, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: palette.olive,
                  }}>
                    Couleur de votre pièce
                  </p>
                  <p style={{
                    fontFamily: fonts.display, fontWeight: 600,
                    fontSize: 26, margin: "4px 0",
                  }}>
                    {outfit.palette.matchedColor.name}
                  </p>
                  <p style={{ fontSize: 12, color: palette.inkSoft }}>
                    {detectedHex} · pour {gender}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                style={{
                  fontFamily: fonts.sans, fontSize: 13,
                  letterSpacing: "0.04em",
                  background: "transparent",
                  border: `1px solid ${palette.line}`,
                  borderRadius: 999, padding: "12px 20px",
                  cursor: "pointer", color: palette.ink,
                }}
              >
                Nouvelle photo
              </button>
            </div>
          </div>

          {/* Sections résultats */}
          <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 26px 70px" }}>
            {/* Verdict bordeaux */}
            <p style={sectionLabelStyle}>
              Verdict — {`No. ${outfit.palette.entry.number} · ${outfit.palette.entry.name}`}
            </p>
            <div style={{
              background: palette.bordeaux, color: palette.cream,
              borderRadius: 18, padding: "24px 28px",
            }}>
              <p style={{
                fontSize: 11, letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(250,248,244,.75)",
              }}>
                L'accord
              </p>
              <p style={{
                fontFamily: fonts.display, fontWeight: 500,
                fontSize: 21, marginTop: 8, lineHeight: 1.35,
              }}>
                {outfit.verdict}
              </p>
            </div>

            {/* Bande accord complet */}
            <p style={sectionLabelStyle}>L'accord WADA complet</p>
            <div style={{
              display: "flex", height: 64,
              borderRadius: 14, overflow: "hidden",
              boxShadow: shadow,
            }}>
              {outfit.palette.entry.colors.map((c, i) => (
                <div key={i} title={`${c.name} ${c.hex}`} style={{ flex: 1, background: c.hex }} />
              ))}
            </div>

            {/* La tenue composée — 5 cards */}
            <p style={sectionLabelStyle}>La tenue composée</p>
            <div className="wada-composer-outfit" style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 14,
            }}>
              {outfit.slots.map((s, i) => (
                /* Brief « Scanner Un vêtement » §1 (26/05) — Sub-component
                   qui fetch un vrai produit MUJI pour les slots non-ancre.
                   Anchor (Votre pièce) garde l'affichage swatch + libellé. */
                <ComposerSlotCard
                  key={`${s.slot}-${i}`}
                  slot={s}
                  gender={gender}
                  register={pieceRegister}
                />
              ))}
            </div>

            {/* Actions finales */}
            <div style={{
              display: "flex", gap: 14, justifyContent: "center",
              marginTop: 36, flexWrap: "wrap",
            }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  fontFamily: fonts.sans, fontSize: 14,
                  padding: "14px 26px", borderRadius: 999,
                  background: palette.bordeaux, color: palette.cream,
                  border: "none", cursor: "pointer", fontWeight: 500,
                }}
              >
                Composer une autre tenue
              </button>
              <Link href={`/palette/${outfit.palette.entry.number}`} style={{
                fontFamily: fonts.sans, fontSize: 14,
                padding: "14px 26px", borderRadius: 999,
                background: "transparent", color: palette.ink,
                border: `1px solid ${palette.line}`,
                textDecoration: "none", fontWeight: 500,
              }}>
                Voir la palette {outfit.palette.entry.number} →
              </Link>
            </div>
          </div>
        </>
      )}

      
      <style jsx>{`
        @media (max-width: 820px) {
          :global(.wada-composer-outfit) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ───────────── Helpers UI ───────────── */

const kickerStyle: React.CSSProperties = {
  fontFamily: fonts.display, fontWeight: 600,
  fontSize: 17, marginTop: 22, marginBottom: 10,
  color: palette.ink,
};

/* Brief client 2026-05-26 « ludique + instinctif » : on remplace les
   étapes 01/02/03/04 par des MiniLabel discrets (text-transform uppercase
   10px). Le formulaire est son propre label, plus besoin de numérotation. */
function MiniLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: fonts.sans, fontSize: 10,
      letterSpacing: "0.32em", textTransform: "uppercase",
      color: palette.inkSoft, fontWeight: 600,
      margin: "18px 0 8px",
    }}>
      {children}
    </p>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: palette.olive,
  margin: "34px 0 14px",
};

/* modeBtnStyle retiré 2026-05-26 — l'ancien toggle inline (pill blanc
   sur fond dark) est remplacé par <ScanModeToggle active="vetement" />
   pour cohérence absolue avec /scanner. */

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{children}</div>;
}

function Chip({ children, active, onClick }: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 16px",
        background: active ? palette.bordeaux : palette.beige,
        color: active ? palette.cream : palette.ink,
        border: `1px solid ${active ? palette.bordeaux : palette.line}`,
        borderRadius: 999,
        fontFamily: fonts.sans, fontSize: 13, fontWeight: 500,
        cursor: "pointer",
        transition: `all 0.2s ${ease}`,
      }}
    >
      {children}
    </button>
  );
}

/* ───────────── ComposerSlotCard ─────────────
   Brief « Scanner Un vêtement » §1 (26/05) :
   - slot === "owned" (la pièce de l'utilisateur) → swatch couleur + libellé.
   - slot suggéré par WADA → fetch MUJI via useComposerMuji + photo réelle
     + nom + prix + bouton Acheter. Si MUJI introuvable → fallback swatch +
     « Voir des pièces → » (search générique).
   Aligné sur le pattern /ma-tenue + /stylist : aspect-ratio 4/5,
   objectFit cover, source priorité imageLocal → largeImage → image.
*/
function ComposerSlotCard({ slot, gender, register }: {
  slot: import("@/lib/outfitComposer").OutfitSlot;
  gender: Gender;
  register: string | null;
}) {
  const isOwned = slot.role === "owned";
  /* On NE fetch QUE pour les slots non-owned (la pièce ancre est celle de
     l'utilisateur, on n'a pas de produit MUJI à lui montrer pour ça). */
  const muji = useComposerMuji(
    isOwned ? null : slot.slot,
    isOwned ? null : slot.hex,
    isOwned ? null : register,
    isOwned ? null : gender,
  );

  return (
    <article style={{
      background: palette.cream,
      border: isOwned ? `1.5px solid ${palette.bordeaux}` : `1px solid ${palette.line}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: shadow,
      transition: `transform 0.3s ${ease}`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Visuel haut : photo MUJI si trouvée, sinon swatch couleur */}
      {!isOwned && muji ? (
        <div style={{
          aspectRatio: "4 / 5",
          background: "#FBF9F5",
          overflow: "hidden",
          borderBottom: `1px solid ${palette.line}`,
        }}>
          <img
            src={muji.image}
            alt={muji.nom}
            loading="lazy"
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 20%",
              display: "block",
            }}
          />
        </div>
      ) : (
        <div style={{ height: 120, background: slot.hex }} />
      )}

      <div style={{ padding: "13px 14px 15px", flex: 1, display: "flex", flexDirection: "column" }}>
        <p style={{
          fontSize: 10, letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: isOwned ? palette.bordeaux : palette.inkSoft,
          fontWeight: 600,
        }}>
          {SLOT_LABELS[slot.slot as Slot] || slot.slot}
          {isOwned && " · à vous"}
        </p>
        <p style={{
          fontFamily: fonts.display, fontWeight: 600,
          fontSize: 15, margin: "5px 0 3px", lineHeight: 1.2,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {isOwned ? "Votre pièce" : (muji?.nom || slot.label)}
        </p>
        {/* Brief 2026-05-26 : couleur RÉELLE du produit MUJI (muji.couleurNom)
            si on a un produit fetché, sinon intention palette (slot.colorName).
            Évite le mismatch « Camel » écrit alors que la photo montre du
            brun foncé. La pastille couleur prend le hex du produit aussi
            pour cohérence visuelle stricte label/photo/pastille. */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 9, height: 9, borderRadius: "50%",
              background: (!isOwned && muji?.couleurHex) || slot.hex,
              boxShadow: "0 0 0 1px rgba(30,30,30,0.12)",
              flexShrink: 0,
            }}
          />
          <p style={{ fontSize: 12, fontStyle: "italic", color: palette.inkSoft, margin: 0 }}>
            {(!isOwned && muji?.couleurNom) || slot.colorName}
          </p>
        </div>

        {!isOwned && muji && (
          <>
            <p style={{
              fontFamily: fonts.sans, fontSize: 13, fontWeight: 700,
              color: palette.bordeaux, margin: "8px 0 0",
            }}>
              {muji.prix.toFixed(2)} {muji.devise === "EUR" ? "€" : muji.devise}
            </p>
            <a
              href={muji.url}
              target="_blank"
              rel="noopener nofollow sponsored"
              style={{
                marginTop: 10,
                display: "block", textAlign: "center",
                fontFamily: fonts.sans, fontSize: 12, fontWeight: 600,
                background: palette.ink, color: palette.cream,
                padding: "9px 12px", borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Acheter sur {muji.marque} →
            </a>
            <p style={{
              margin: "5px 0 0", textAlign: "center",
              fontSize: 10, fontStyle: "italic",
              color: palette.inkSoft, letterSpacing: "0.02em",
            }}>
              Lien partenaire — prix identique chez le marchand
            </p>
          </>
        )}
        {!isOwned && !muji && (
          /* Fallback historique : aucun MUJI trouvé pour ce slot+couleur+
             registre — on retombe sur la recherche générique. Marqué
             « Voir des pièces → » comme avant (donne au moins une voie
             à l'utilisateur). À terme, on pourrait y mettre un Amazon
             search pré-rempli, mais pour l'instant on laisse simple. */
          <p style={{
            fontSize: 11, letterSpacing: "0.06em",
            color: palette.olive, marginTop: 10,
            textTransform: "uppercase",
          }}>
            Voir des pièces →
          </p>
        )}
      </div>
    </article>
  );
}
