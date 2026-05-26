"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ink, paper, border, mojo,
  sectionLabel, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * PersonalizationPanel v2 — refonte "tout public"
 * ─────────────────────────────────────────────────────────────────────────
 * Reformulation des étiquettes techniques en langage commun :
 *   - Morphologie "A/V/X/H/O" → "silhouette droite/sablier/poire..."
 *   - Budget slider 0-1000 → 3 chips simples (€ / €€ / €€€)
 *   - Style limité à 5 (les user-friendly principaux)
 *   - Ajout d'un slider d'intensité Neutre ↔ Affirmé
 *
 * Sauvegarde dans localStorage :
 *   - wada-gender : "femme" | "homme" | "unisexe"
 *   - wada-prefs  : { style, budget, morpho, size, intensity }
 *
 * Affiche en bas un badge "IA Styling actif" qui résume les choix —
 * pour rendre visible que les filtres impactent réellement la sélection.
 */

export type WadaPrefs = {
  gender: "femme" | "homme" | "unisexe" | null;  // hérité de la home, on ne le redemande pas ici
  style: string;
  budget: number;       // 0=petit (~150€), 1=moyen (~400€), 2=premium (~800€)
  morpho: string;
  size: string;
  intensity: number;    // 0 = neutre, 1 = affirmé
  fit: string;          // "ajuste" | "standard" | "ample"
  occasion_focus: string; // "bureau" | "quotidien" | "sorties" | "voyage"
};

const DEFAULT_PREFS: WadaPrefs = {
  gender: null,
  style: "",
  budget: 1,
  morpho: "",
  size: "",
  intensity: 0.5,
  fit: "",
  occasion_focus: "",
};

const STYLES = ["Minimal", "Classique", "Old money", "Décontracté", "Streetwear"];

// Morphologie en langage commun + tooltip explicatif
const MORPHOS: Array<{ slug: string; label: string; tooltip: string }> = [
  { slug: "droite",     label: "Silhouette droite",     tooltip: "Épaules et hanches alignées (rectangle)" },
  { slug: "sablier",    label: "Silhouette sablier",    tooltip: "Hanches et épaules égales, taille marquée" },
  { slug: "poire",      label: "Silhouette poire",      tooltip: "Hanches plus larges que les épaules" },
  { slug: "athletique", label: "Silhouette athlétique", tooltip: "Épaules plus larges que les hanches" },
  { slug: "ronde",      label: "Silhouette ronde",      tooltip: "Courbes généreuses au niveau du buste" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const BUDGETS: Array<{ value: number; label: string; range: string }> = [
  { value: 0, label: "€",   range: "≤ 200€" },
  { value: 1, label: "€€",  range: "200-500€" },
  { value: 2, label: "€€€", range: "≥ 500€" },
];

const FITS: Array<{ slug: string; label: string; tooltip: string }> = [
  { slug: "ajuste",   label: "Près du corps",  tooltip: "Coupes ajustées, structurées" },
  { slug: "standard", label: "Standard",        tooltip: "Coupe classique, ni serrée ni ample" },
  { slug: "ample",    label: "Ample / oversize", tooltip: "Volumes, coupes loose, confort" },
];

const OCCASIONS: Array<{ slug: string; label: string }> = [
  { slug: "bureau",    label: "Bureau" },
  { slug: "quotidien", label: "Quotidien" },
  { slug: "sorties",   label: "Sorties / dîners" },
  { slug: "voyage",    label: "Voyage" },
];

/** Convertit l'index budget (0/1/2) en valeur euro représentative pour
    les calculs de recommandation downstream. */
export function budgetToEur(b: number): number {
  if (b === 0) return 150;
  if (b === 2) return 800;
  return 350;
}

interface PersonalizationPanelProps {
  variant?: "full" | "compact";
  maxWidth?: number;
  onChange?: (prefs: WadaPrefs) => void;
  background?: "glass" | "solid";
  /** Numéro de palette courant (si le panneau est sur /palette/[number]).
   *  Permet de transmettre le contexte palette à /ma-tenue via URL param,
   *  sinon /ma-tenue choisirait une autre palette via le score profil. */
  currentPaletteNumber?: string;
}

export default function PersonalizationPanel({
  variant = "compact",
  maxWidth = 560,
  onChange,
  background = "glass",
  currentPaletteNumber,
}: PersonalizationPanelProps) {
  const [prefs, setPrefs] = useState<WadaPrefs>(DEFAULT_PREFS);
  // Feedback visuel sur clic "Sauvegarder mon profil" — toast 2s
  const [saveFlash, setSaveFlash] = useState(false);

  // Charge l'état depuis localStorage au mount
  useEffect(() => {
    try {
      const g = localStorage.getItem("wada-gender");
      const p = localStorage.getItem("wada-prefs");
      const initial: WadaPrefs = { ...DEFAULT_PREFS };
      if (g === "femme" || g === "homme" || g === "unisexe") initial.gender = g;
      if (p) {
        const parsed = JSON.parse(p);
        if (parsed.style) initial.style = parsed.style;
        if (typeof parsed.budget === "number") initial.budget = parsed.budget > 2 ? 1 : parsed.budget;
        if (parsed.morpho) initial.morpho = parsed.morpho;
        if (parsed.size) initial.size = parsed.size;
        if (typeof parsed.intensity === "number") initial.intensity = parsed.intensity;
        if (parsed.fit) initial.fit = parsed.fit;
        if (parsed.occasion_focus) initial.occasion_focus = parsed.occasion_focus;
      }
      setPrefs(initial);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      // Le genre n'est plus modifié ici (asked on home). On sauvegarde
      // uniquement les autres préférences.
      localStorage.setItem("wada-prefs", JSON.stringify({
        style: prefs.style, budget: prefs.budget, morpho: prefs.morpho,
        size: prefs.size, intensity: prefs.intensity,
        fit: prefs.fit, occasion_focus: prefs.occasion_focus,
      }));
    } catch { /* ignore */ }
    onChange?.(prefs);
  }, [prefs, onChange]);

  const setField = <K extends keyof WadaPrefs>(field: K, value: WadaPrefs[K]) => {
    setPrefs((p) => ({ ...p, [field]: value }));
  };

  const containerStyle = background === "glass"
    ? {
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }
    : { background: paper };

  // Résume les choix en 1 ligne — pour le badge IA en bas
  const hasAnyChoice = prefs.style || prefs.morpho || prefs.size || prefs.fit || prefs.occasion_focus;
  const summary = buildSummary(prefs);

  return (
    <div style={{
      ...containerStyle,
      padding: "20px 22px",
      border: `1px solid ${border}`,
      borderRadius: 12,
      maxWidth,
      marginLeft: "auto", marginRight: "auto",
    }}>
      <p style={{ ...sectionLabel, fontSize: 10, color: mojo, fontWeight: 700, marginBottom: 4, letterSpacing: "0.4em" }}>
        Ton ADN style
      </p>
      <p style={{
        fontFamily: fontBody, fontSize: 14, color: ink, fontStyle: "italic",
        margin: "0 0 18px", opacity: 0.75, lineHeight: 1.5,
      }}>
        5 réponses pour que WADA te parle vraiment.
      </p>

      {/* STYLE — "Comment tu t'habilles d'habitude ?" plus engageant */}
      <FieldLabel>Comment tu t'habilles d'habitude ?</FieldLabel>
      <ChipRow>
        {STYLES.map((s) => (
          <Chip
            key={s} active={prefs.style === s}
            onClick={() => setField("style", prefs.style === s ? "" : s)}
          >
            {s}
          </Chip>
        ))}
      </ChipRow>

      {/* OCCASION — pour quel moment de la semaine */}
      <FieldLabel>Pour quelle occasion principalement ?</FieldLabel>
      <ChipRow>
        {OCCASIONS.map((o) => (
          <Chip
            key={o.slug} active={prefs.occasion_focus === o.slug}
            onClick={() => setField("occasion_focus", prefs.occasion_focus === o.slug ? "" : o.slug)}
          >
            {o.label}
          </Chip>
        ))}
      </ChipRow>

      {/* COUPE — préférence de fit (nouveau, très utile) */}
      <FieldLabel>Ta coupe préférée</FieldLabel>
      <ChipRow>
        {FITS.map((f) => (
          <Chip
            key={f.slug} active={prefs.fit === f.slug}
            onClick={() => setField("fit", prefs.fit === f.slug ? "" : f.slug)}
            title={f.tooltip}
          >
            {f.label}
          </Chip>
        ))}
      </ChipRow>
      {prefs.fit && (
        <p style={{
          fontFamily: fontBody, fontSize: 12, fontStyle: "italic",
          color: ink, opacity: 0.7, margin: "-10px 0 16px",
          paddingLeft: 4,
        }}>
          {FITS.find((f) => f.slug === prefs.fit)?.tooltip}
        </p>
      )}

      {/* INTENSITÉ — reformulé "Discret ↔ Affirmé" */}
      <FieldLabel>
        À quel point tu veux te démarquer ? ·{" "}
        <span style={{ color: mojo, fontWeight: 600 }}>
          {prefs.intensity < 0.33 ? "Discret" : prefs.intensity < 0.66 ? "Équilibré" : "Affirmé"}
        </span>
      </FieldLabel>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: fontLabel, fontSize: 10, color: ink, opacity: 0.55, letterSpacing: "0.1em" }}>Discret</span>
        <input
          type="range" min={0} max={1} step={0.05}
          value={prefs.intensity}
          onChange={(e) => setField("intensity", parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: mojo }}
          aria-label="Intensité du style"
        />
        <span style={{ fontFamily: fontLabel, fontSize: 10, color: ink, opacity: 0.55, letterSpacing: "0.1em" }}>Affirmé</span>
      </div>

      {/* BUDGET — reformulé "Combien tu mets pour une tenue ?" */}
      <FieldLabel>Combien tu mets pour une tenue ?</FieldLabel>
      <ChipRow>
        {BUDGETS.map((b) => (
          <Chip
            key={b.value} active={prefs.budget === b.value}
            onClick={() => setField("budget", b.value)}
            wide
          >
            <span style={{ fontWeight: 700, marginRight: 6 }}>{b.label}</span>
            <span style={{ opacity: 0.7, fontSize: 10 }}>{b.range}</span>
          </Chip>
        ))}
      </ChipRow>

      {/* MORPHOLOGIE — "Quelle est ta silhouette ?" + description visible
          de l'option sélectionnée (au lieu d'un tooltip caché). */}
      <FieldLabel>Quelle est ta silhouette ?</FieldLabel>
      <ChipRow>
        {MORPHOS.map((m) => (
          <Chip
            key={m.slug} active={prefs.morpho === m.slug}
            onClick={() => setField("morpho", prefs.morpho === m.slug ? "" : m.slug)}
            title={m.tooltip}
          >
            {m.label}
          </Chip>
        ))}
      </ChipRow>
      {/* Description visible de la morpho sélectionnée — résout le souci
          "personne sait ce que sablier veut dire" sans surcharger la UI. */}
      {prefs.morpho && (
        <p style={{
          fontFamily: fontBody, fontSize: 12, fontStyle: "italic",
          color: ink, opacity: 0.7, margin: "-10px 0 16px",
          paddingLeft: 4,
        }}>
          {MORPHOS.find((m) => m.slug === prefs.morpho)?.tooltip}
        </p>
      )}

      {/* TAILLE — "Ta taille habituelle" */}
      <FieldLabel>Ta taille habituelle</FieldLabel>
      <ChipRow>
        {SIZES.map((t) => (
          <Chip
            key={t} active={prefs.size === t}
            onClick={() => setField("size", prefs.size === t ? "" : t)}
            tight
          >
            {t}
          </Chip>
        ))}
      </ChipRow>

      {/* ─── BADGE IA STYLING ACTIF — visible dès qu'un choix est posé ─── */}
      {hasAnyChoice && (
        <div style={{
          marginTop: 16,
          padding: "12px 14px",
          background: ink, color: paper,
          borderRadius: 10,
          fontFamily: fontBody, fontStyle: "italic", fontSize: 14, fontWeight: 400,
          lineHeight: 1.5,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span aria-hidden style={{
            flexShrink: 0, fontSize: 14, lineHeight: 1.4,
            animation: "wada-pulse 1.5s ease-in-out infinite",
          }}>
            ✦
          </span>
          <span>
            WADA t'imagine{summary ? ` en ${summary}` : "..."}
          </span>
        </div>
      )}

      {/* CONSEIL (variant=full uniquement) */}
      {variant === "full" && (prefs.style || prefs.morpho || prefs.size) && (
        <p style={{
          fontFamily: fontBody, fontSize: 13, fontStyle: "italic",
          color: ink, marginTop: 14, lineHeight: 1.55,
          padding: "10px 12px", background: "rgba(196,78,58,0.08)",
          borderLeft: `3px solid ${mojo}`, borderRadius: 4,
        }}>
          <strong style={{ color: mojo, fontStyle: "normal", letterSpacing: "0.04em" }}>Notre conseil →</strong>{" "}
          {styleAdvice(prefs.style)}
          {morphoAdvice(prefs.morpho)}
          {budgetAdvice(prefs.budget)}
        </p>
      )}

      {/* ═════════ CTAs FINAUX (variant=full uniquement) ═════════
          Sans ces boutons, le client remplit le profil mais ne sait pas
          quoi en faire. Deux actions claires :
            1. "Découvrir la collection" → /palettes (filtre profil appliqué
               automatiquement via localStorage wada-prefs)
            2. "Sauvegarder mon profil" → confirmation visuelle 2s (les prefs
               sont déjà persistées en localStorage, le bouton est surtout
               un signal psychologique de "c'est noté")  */}
      {variant === "full" && (
        <div style={{
          marginTop: 24, paddingTop: 20,
          borderTop: `1px solid ${border}`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <Link
            href={currentPaletteNumber ? `/ma-tenue?palette=${currentPaletteNumber}` : "/ma-tenue"}
            // Avant le clic, on s'assure que les prefs courantes sont
            // bien persistées en localStorage — la page /ma-tenue les
            // relit pour scorer et choisir la palette qui matche.
            // Si on est sur /palette/[number], on passe aussi le numéro
            // via URL param pour que /ma-tenue utilise CETTE palette
            // (sinon il choisirait une autre selon le profil).
            onClick={() => {
              try { localStorage.setItem("wada-prefs", JSON.stringify(prefs)); } catch { /* ignore */ }
            }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "14px 24px",
              background: ink, color: paper,
              fontFamily: fontLabel, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.25em", textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 999, border: `1px solid ${ink}`,
              transition: "transform 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(ev) => { ev.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(ev) => { ev.currentTarget.style.transform = "translateY(0)"; }}
          >
            <span>Découvrir mon style</span>
            <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>→</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem("wada-prefs", JSON.stringify(prefs)); } catch { /* ignore */ }
              setSaveFlash(true);
              setTimeout(() => setSaveFlash(false), 2000);
            }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px 24px",
              background: saveFlash ? "rgba(196,78,58,0.08)" : "transparent",
              color: saveFlash ? mojo : ink,
              fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
              letterSpacing: "0.3em", textTransform: "uppercase",
              borderRadius: 999,
              border: `1px solid ${saveFlash ? mojo : border}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            aria-label="Sauvegarder mon profil"
          >
            <span aria-hidden style={{ fontSize: 13, letterSpacing: 0 }}>
              {saveFlash ? "✓" : "♡"}
            </span>
            <span>{saveFlash ? "Profil sauvegardé" : "Sauvegarder mon profil"}</span>
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes wada-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

/* ─── Petits composants UI réutilisés ─── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: fontLabel, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.3em", textTransform: "uppercase",
      color: ink, margin: "0 0 8px",
    }}>
      {children}
    </p>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Chip({
  children, active, onClick, color, wide, tight, title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color?: "primary";
  wide?: boolean;
  tight?: boolean;
  title?: string;
}) {
  const accent = color === "primary" ? mojo : ink;
  return (
    <button
      type="button" onClick={onClick} title={title}
      style={{
        padding: tight ? "5px 12px" : wide ? "6px 14px" : "5px 12px",
        background: active ? accent : "transparent",
        color: active ? paper : ink,
        border: `1px solid ${active ? accent : border}`,
        borderRadius: 999,
        fontFamily: fontLabel, fontSize: 11, fontWeight: active ? 600 : 500,
        cursor: "pointer",
        minWidth: tight ? 38 : undefined,
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Helpers conseil ─── */

function buildSummary(p: WadaPrefs): string {
  // Construit une phrase en prose naturelle au lieu d'une liste "a + b + c".
  // Le format est lu après "WADA t'imagine en {summary}".
  const adjectives: string[] = [];
  if (p.style) adjectives.push(p.style.toLowerCase());
  if (p.intensity >= 0.66) adjectives.push("affirmé");
  else if (p.intensity <= 0.33) adjectives.push("discret");

  let phrase = adjectives.join(" ");

  if (p.occasion_focus) {
    const occMap: Record<string, string> = {
      bureau: "pour le bureau",
      quotidien: "au quotidien",
      sorties: "pour les sorties",
      voyage: "en voyage",
    };
    phrase += phrase ? ` ${occMap[p.occasion_focus] || p.occasion_focus}` : (occMap[p.occasion_focus] || p.occasion_focus);
  }

  if (p.fit) {
    const fitMap: Record<string, string> = {
      ample: "coupe oversize",
      ajuste: "coupe ajustée",
      standard: "coupe standard",
    };
    if (fitMap[p.fit]) phrase += phrase ? `, ${fitMap[p.fit]}` : fitMap[p.fit];
  }

  if (p.budget === 0) phrase += phrase ? ", budget accessible" : "budget accessible";
  else if (p.budget === 2) phrase += phrase ? ", budget premium" : "budget premium";

  return phrase;
}

function styleAdvice(style: string): string {
  switch (style) {
    case "Old money":    return "Privilégiez les matières nobles (laine, soie, cachemire). ";
    case "Streetwear":   return "Misez sur des coupes oversize et sneakers en accent. ";
    case "Décontracté":  return "Optez pour du jersey, du lin et des coupes droites. ";
    case "Classique":    return "Tailoring soft, lignes nettes, accessoires discrets. ";
    case "Minimal":      return "Coupes épurées, monochromes, accessoires ton sur ton. ";
    default: return "";
  }
}

function morphoAdvice(morpho: string): string {
  switch (morpho) {
    case "poire":      return "Équilibrez avec un haut structuré et un bas fluide. ";
    case "athletique": return "Adoucissez les épaules avec un col rond ou en V. ";
    case "sablier":    return "Vos pièces cintrées à la taille mettent en valeur. ";
    case "droite":     return "Créez de la courbe avec ceinture et volumes. ";
    case "ronde":      return "Privilégiez les coupes droites et les V profonds. ";
    default: return "";
  }
}

function budgetAdvice(b: number): string {
  if (b === 0) return "Filtré sur le seconde main et les marques accessibles.";
  if (b === 2) return "Sélection haut de gamme sans compromis.";
  return "Mix entre marques accessibles et milieu de gamme.";
}
