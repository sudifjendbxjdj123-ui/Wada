"use client";
/**
 * ComposeForm — formulaire « Composez votre tenue » (refonte maquette
 * 2026-06-11). Remplace l'ancien PersonalizedCompose : 5 questions
 * numérotées en grille 2 colonnes (occasion / univers / pour qui / budget /
 * niveau d'audace), carte « Votre sélection » récapitulative, CTA « Voir ma
 * tenue ».
 *
 * « Visuel d'abord » (décision user) : les libellés de la maquette qui ne
 * sont pas reconnus par le moteur (/ma-tenue) — occasion « Voyage », univers
 * « Élégant » / « Créatif », curseur « Niveau d'audace » — sont AFFICHÉS tels
 * quels mais traduits en paramètres valides au moment du lien, pour garder la
 * composition fonctionnelle sans recâbler le moteur. L'audace reste décorative
 * (pas encore transmise) — à câbler plus tard.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import type { DictionaryEntry } from "@/lib/data";
import { cultureLabels } from "@/lib/data";
import { useProfile } from "@/hooks/useProfile";

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
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

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}
function hexRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

type OccasionOpt = "travail" | "quotidien" | "soiree" | "voyage";
type UniversOpt = "Minimaliste" | "Élégant" | "Créatif" | "Décontracté";
type Genre = "Femme" | "Homme" | "Mixte";

const OCC_LABEL: Record<OccasionOpt, string> = {
  travail: "Travail", quotidien: "Quotidien", soiree: "Soirée", voyage: "Voyage",
};
/* Traduction maquette → paramètres /ma-tenue (registres reconnus). */
const OCC_TO_PARAM: Record<OccasionOpt, string> = {
  travail: "bureau", quotidien: "quotidien", soiree: "soiree", voyage: "quotidien",
};
const UNIV_TO_STYLE: Record<UniversOpt, string> = {
  Minimaliste: "Minimal", "Élégant": "Old money", "Créatif": "Streetwear", "Décontracté": "Décontracté",
};

export default function ComposeForm({ entry }: { entry: DictionaryEntry }) {
  const { effective, hydrated } = useProfile();
  const [occasion, setOccasion] = useState<OccasionOpt>("quotidien");
  const [univers, setUnivers] = useState<UniversOpt>("Élégant");
  const [genre, setGenre] = useState<Genre>("Homme");
  const [budget, setBudget] = useState<number>(450);
  const [audace, setAudace] = useState<number>(50);

  /* Pré-remplissage depuis le profil (genre / budget / style le plus proche). */
  useEffect(() => {
    if (!hydrated) return;
    if (effective.genre === "Femme" || effective.genre === "Homme") setGenre(effective.genre);
    if (effective.budget === "< 150€") setBudget(150);
    else if (effective.budget === "150–400€") setBudget(400);
    else if (effective.budget === "Premium") setBudget(1000);
    const s = effective.style;
    if (s === "Minimaliste") setUnivers("Minimaliste");
    else if (s === "Décontracté") setUnivers("Décontracté");
    else if (s === "Streetwear") setUnivers("Créatif");
    else if (s) setUnivers("Élégant");
  }, [hydrated, effective.style, effective.genre, effective.budget]);

  if (!hydrated) return <div style={{ height: 820 }} aria-hidden />;

  /* Accent = couleur de palette la plus FONCÉE → toujours visible sur fond
     clair (bordures, cases cochées, curseurs), et teinte l'élément actif. */
  const accent = [...entry.colors].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex || palette.bordeaux;
  const accentTint = hexRgba(accent, 0.1);

  const genreParam = genre === "Femme" ? "femme" : genre === "Homme" ? "homme" : "unisexe";
  const composeHref =
    `/ma-tenue?palette=${entry.number}` +
    `&style=${encodeURIComponent(UNIV_TO_STYLE[univers])}` +
    `&occasion=${OCC_TO_PARAM[occasion]}` +
    `&genre=${genreParam}` +
    `&maxPrice=${budget >= 2000 ? "" : budget}`;

  const audaceLabel = audace < 34 ? "Classique" : audace < 67 ? "Affirmé" : "Éditorial";
  const budgetPct = ((budget - 100) / (2000 - 100)) * 100;

  /* ── styles ── */
  const qCard: React.CSSProperties = {
    background: "#fff", border: `1px solid ${palette.line}`, borderRadius: 18,
    padding: "22px 22px 24px", boxShadow: "0 10px 34px -24px rgba(60,40,25,.45)",
    display: "flex", flexDirection: "column",
  };
  const qHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, marginBottom: 16 };
  const qBadge: React.CSSProperties = {
    width: 26, height: 26, borderRadius: "50%", background: palette.ink, color: "#fff",
    display: "grid", placeItems: "center", fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, flexShrink: 0,
  };
  const qTitle: React.CSSProperties = { fontFamily: fonts.display, fontSize: 16.5, fontWeight: 500, color: palette.ink, margin: 0 };
  const sumRow: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "11px 0", borderTop: `1px solid ${palette.line}`, fontSize: 13.5,
  };

  const choiceRow = (active: boolean, onClick: () => void, label: string) => (
    <button
      key={label} type="button" onClick={onClick} aria-pressed={active}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "12px 15px", borderRadius: 11,
        border: `1.5px solid ${active ? accent : palette.line}`,
        background: active ? accentTint : "#fff", cursor: "pointer",
        fontFamily: fonts.sans, fontSize: 14.5, fontWeight: active ? 600 : 500,
        color: palette.ink, textAlign: "left", transition: "all .15s", marginBottom: 8,
      }}
    >
      <span aria-hidden style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${active ? accent : "rgba(0,0,0,.26)"}`,
        background: active ? accent : "transparent",
        display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700,
      }}>{active ? "✓" : ""}</span>
      <span>{label}</span>
    </button>
  );

  const sliderStyle = (pct: number): React.CSSProperties => ({
    width: "100%", height: 6, borderRadius: 999,
    background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #e7e0d4 ${pct}%, #e7e0d4 100%)`,
    WebkitAppearance: "none", appearance: "none", outline: "none", cursor: "pointer",
  });

  return (
    <div>
      <div className="wada-q-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* 1 — Occasion */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>1</span><h3 style={qTitle}>Pour quelle occasion&nbsp;?</h3></div>
          {(["travail", "quotidien", "soiree", "voyage"] as OccasionOpt[]).map((o) =>
            choiceRow(occasion === o, () => setOccasion(o), OCC_LABEL[o]),
          )}
        </div>

        {/* 2 — Univers */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>2</span><h3 style={qTitle}>Quel univers&nbsp;?</h3></div>
          {(["Minimaliste", "Élégant", "Créatif", "Décontracté"] as UniversOpt[]).map((u) =>
            choiceRow(univers === u, () => setUnivers(u), u),
          )}
        </div>

        {/* 3 — Pour qui */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>3</span><h3 style={qTitle}>Pour qui&nbsp;?</h3></div>
          {(["Femme", "Homme", "Mixte"] as Genre[]).map((g) =>
            choiceRow(genre === g, () => setGenre(g), g),
          )}
        </div>

        {/* 4 — Budget total */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>4</span><h3 style={qTitle}>Budget total</h3></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 12, color: palette.inkSoft, marginBottom: 10 }}>
            <span>100&nbsp;€</span><span>2000&nbsp;€+</span>
          </div>
          <input
            type="range" min={100} max={2000} step={50} value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            className="wada-slider" style={sliderStyle(budgetPct)}
            aria-label="Budget total"
          />
          <div style={{ textAlign: "center", marginTop: 16, fontFamily: fonts.display, fontSize: 30, fontWeight: 500, color: accent, letterSpacing: "-0.5px", lineHeight: 1 }}>
            {budget >= 2000 ? "2000 €+" : `~ ${budget} €`}
          </div>
        </div>

        {/* 5 — Niveau d'audace (pleine largeur) */}
        <div style={{ ...qCard, gridColumn: "1 / -1" }}>
          <div style={qHead}><span style={qBadge}>5</span><h3 style={qTitle}>Niveau d'audace</h3></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 12.5, color: palette.inkSoft, marginBottom: 10 }}>
            <span>Classique</span>
            <span style={{ color: accent, fontWeight: 600 }}>{audaceLabel} · {audace}%</span>
            <span>Éditorial</span>
          </div>
          <input
            type="range" min={0} max={100} step={5} value={audace}
            onChange={(e) => setAudace(parseInt(e.target.value))}
            className="wada-slider" style={sliderStyle(audace)}
            aria-label="Niveau d'audace"
          />
        </div>
      </div>

      {/* Votre sélection */}
      <div style={{ background: palette.cream, border: `1px solid ${palette.line}`, borderRadius: 18, padding: "24px 26px", marginTop: 22 }}>
        <p style={{ fontFamily: fonts.display, fontSize: 11, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: palette.inkSoft, margin: "0 0 8px" }}>
          Votre sélection
        </p>
        <h3 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 500, color: palette.ink, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
          {entry.name}
        </h3>
        <div style={{ display: "flex", gap: 7, marginBottom: 6 }}>
          {entry.colors.slice(0, 3).map((c, i) => (
            <i key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,.06)", display: "block" }} />
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          {([
            ["Occasion", OCC_LABEL[occasion]],
            ["Univers", univers],
            ["Pour", genre],
            ["Budget", budget >= 2000 ? "2000 €+" : `~ ${budget} €`],
            ["Audace", `${audace}% · ${audaceLabel}`],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={sumRow}>
              <span style={{ color: palette.inkSoft, fontFamily: fonts.sans }}>{k}</span>
              <span style={{ color: palette.ink, fontWeight: 500, fontFamily: fonts.display }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link href={composeHref} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        width: "100%", boxSizing: "border-box", background: palette.ink, color: "#fff",
        borderRadius: 14, padding: "18px", fontFamily: fonts.display, fontSize: 16.5, fontWeight: 500,
        marginTop: 18, textDecoration: "none", boxShadow: "0 14px 34px -16px rgba(30,30,30,.6)",
      }}>
        Voir ma tenue
        <em style={{ fontStyle: "italic", fontWeight: 400, opacity: 0.72 }}>{entry.name}</em>
        <span aria-hidden>→</span>
      </Link>
      <p style={{ textAlign: "center", marginTop: 16, fontFamily: fonts.sans, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.inkSoft }}>
        Rapide · Personnalisé · Sans engagement
      </p>

      <style jsx>{`
        :global(.wada-slider::-webkit-slider-thumb) {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2px solid ${accent}; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,.18); transition: transform .14s;
        }
        :global(.wada-slider::-webkit-slider-thumb:hover) { transform: scale(1.12); }
        :global(.wada-slider::-moz-range-thumb) {
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2px solid ${accent}; cursor: pointer;
        }
        @media (max-width: 680px) {
          :global(.wada-q-grid) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
