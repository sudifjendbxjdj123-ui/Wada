"use client";
import { useMemo, useState } from "react";
import {
  useProfile,
  type AgeRange,
  type Morphologie,
  type Profession,
  type FormaliteLevel,
} from "@/hooks/useProfile";
import { listKnownBrands } from "@/lib/brandRegistre";

/**
 * <ProfileEnriched> — Vision Pt A (2026-05-31).
 *
 * Bloc de profil stylistique enrichi affiché sur /compte (état compte
 * existant). Chaque champ est OPTIONNEL : plus le client remplit, mieux
 * WADA recommande. Barre de progression visible en haut pour gamifier.
 *
 * Sauvegarde via useProfile().save() → localStorage `wada.profile`.
 * Sync inter-onglets automatique (storage event).
 *
 * Pas de bouton « Enregistrer » : chaque interaction commit immédiatement
 * pour éviter la friction « j'ai rempli puis oublié de cliquer ».
 */

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  bordeaux: "#6B3A32",
  olive: "#A8B29A",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.12)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

/* Couleurs proposées (chips multi-select). 12 nuances qui couvrent le
   spectre Sanzo Wada — l'utilisateur peut en choisir plusieurs. */
const COLOR_CHIPS: Array<{ hex: string; label: string }> = [
  { hex: "#1E1E1E", label: "Noir" },
  { hex: "#F4EFE7", label: "Crème" },
  { hex: "#6B3A32", label: "Bordeaux" },
  { hex: "#A8B29A", label: "Olive" },
  { hex: "#2E4E3F", label: "Vert sapin" },
  { hex: "#5B7A99", label: "Bleu pierre" },
  { hex: "#C8A165", label: "Ocre" },
  { hex: "#E8DBC5", label: "Sable" },
  { hex: "#8A4B4B", label: "Terracotta" },
  { hex: "#D4A8B0", label: "Rose poudré" },
  { hex: "#3D3D5C", label: "Indigo" },
  { hex: "#7A6E55", label: "Kaki" },
];

const AGES: AgeRange[] = ["18-25", "25-35", "35-50", "50+"];
const MORPHOS: Morphologie[] = ["Rectangle", "Triangle", "Sablier", "Rond", "Athlétique"];
const PROFESSIONS: Profession[] = ["Créatif", "Corporate", "Freelance", "Étudiant", "Autre"];
const FORMALITE_LABELS = ["Très casual", "Casual", "Smart-casual", "Habillé", "Très habillé"];

export default function ProfileEnriched() {
  const { effective, save, completeness, hydrated } = useProfile();
  const knownBrands = useMemo(() => listKnownBrands(), []);
  const [brandQuery, setBrandQuery] = useState("");

  if (!hydrated) {
    return (
      <div style={{ minHeight: 280 }}>
        <div className="wada-skeleton" style={{ height: 18, width: "30%", marginBottom: 12, borderRadius: 4 }} />
        <div className="wada-skeleton" style={{ height: 8, width: "100%", marginBottom: 22, borderRadius: 999 }} />
        <div className="wada-skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 12 }} />
        <div className="wada-skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 12 }} />
      </div>
    );
  }

  /* Toggle une valeur dans un tableau (couleurs / marques). */
  const toggleArray = (key: "couleursAimees" | "couleursInterdites" | "marquesFavorites", value: string) => {
    const current: string[] = (effective[key] as string[] | undefined) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    save({ [key]: next } as { [k: string]: string[] });
  };

  /* Suggestions d'autocomplete marque, filtrées et limitées à 6. */
  const brandSuggestions = useMemo(() => {
    if (brandQuery.trim().length < 1) return [];
    const q = brandQuery.toLowerCase();
    const already = new Set((effective.marquesFavorites || []).map((b) => b.toLowerCase()));
    return knownBrands
      .filter((b) => b.toLowerCase().includes(q) && !already.has(b.toLowerCase()))
      .slice(0, 6);
  }, [brandQuery, knownBrands, effective.marquesFavorites]);

  return (
    <section style={{ marginTop: 36 }}>
      {/* ── Header avec barre de progression ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <h2 style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: 22,
            margin: 0,
            color: palette.ink,
          }}>
            Profil stylistique
          </h2>
          <span style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            color: palette.bordeaux,
            fontWeight: 500,
          }}>
            {completeness}% complété
          </span>
        </div>
        <div style={{
          height: 6,
          background: "rgba(107,58,50,0.12)",
          borderRadius: 999,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${completeness}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${palette.bordeaux}, ${palette.olive})`,
            transition: "width .4s ease",
          }} />
        </div>
        <p style={{
          fontSize: 13,
          color: palette.inkSoft,
          margin: "10px 0 0",
          lineHeight: 1.5,
        }}>
          Plus tu remplis, mieux WADA propose. Rien n'est obligatoire — chaque info ajoute de la précision.
        </p>
      </div>

      {/* ── BASE — Genre / Budget / Style (déjà choisis à l'onboarding) ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>De toi</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Pill label={effective.genre} />
          <Pill label={effective.budget} />
          <Pill label={effective.style} />
          {effective.saison && effective.saison !== "Toute saison" && <Pill label={effective.saison} />}
          {effective.tendance && effective.tendance !== "Sobre" && <Pill label={effective.tendance} />}
        </div>
        <p style={hintStyle}>
          Pour modifier, ouvre le menu profil en haut à droite.
        </p>
      </div>

      {/* ── ÂGE ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Âge</div>
        <div style={chipRowStyle}>
          {AGES.map((a) => (
            <ChoiceChip
              key={a}
              label={a}
              active={effective.age === a}
              onClick={() => save({ age: effective.age === a ? undefined : a })}
            />
          ))}
        </div>
      </div>

      {/* ── MORPHOLOGIE ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Morphologie</div>
        <div style={chipRowStyle}>
          {MORPHOS.map((m) => (
            <ChoiceChip
              key={m}
              label={m}
              active={effective.morphologie === m}
              onClick={() => save({ morphologie: effective.morphologie === m ? undefined : m })}
            />
          ))}
        </div>
        <p style={hintStyle}>
          Aide WADA à choisir des coupes qui te flattent.
        </p>
      </div>

      {/* ── VILLE ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Ville</div>
        <input
          type="text"
          value={effective.ville || ""}
          onChange={(e) => save({ ville: e.target.value })}
          placeholder="ex. Genève, Paris, Lyon…"
          style={inputStyle}
        />
        <p style={hintStyle}>
          Bientôt : recommandations adaptées à la météo locale.
        </p>
      </div>

      {/* ── PROFESSION ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Profession</div>
        <div style={chipRowStyle}>
          {PROFESSIONS.map((p) => (
            <ChoiceChip
              key={p}
              label={p}
              active={effective.profession === p}
              onClick={() => save({ profession: effective.profession === p ? undefined : p })}
            />
          ))}
        </div>
      </div>

      {/* ── NIVEAU DE FORMALITÉ ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Niveau de formalité habituel</div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={effective.formalite ?? 2}
          onChange={(e) => save({ formalite: Number(e.target.value) as FormaliteLevel })}
          style={{
            width: "100%",
            accentColor: palette.bordeaux,
            height: 36,
          }}
        />
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: palette.inkSoft,
          marginTop: 2,
        }}>
          {FORMALITE_LABELS.map((l, i) => (
            <span key={l} style={{
              fontWeight: effective.formalite === i ? 600 : 400,
              color: effective.formalite === i ? palette.bordeaux : palette.inkSoft,
            }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* ── COULEURS AIMÉES ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Couleurs que tu aimes</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COLOR_CHIPS.map((c) => {
            const active = (effective.couleursAimees || []).includes(c.hex);
            return (
              <button
                key={c.hex}
                onClick={() => toggleArray("couleursAimees", c.hex)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px 8px 6px",
                  background: active ? palette.ink : "#fff",
                  color: active ? palette.cream : palette.ink,
                  border: `1px solid ${active ? palette.ink : palette.line}`,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  transition: "all .15s ease",
                }}
              >
                <span style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c.hex,
                  border: c.hex === "#F4EFE7" ? `1px solid ${palette.line}` : "none",
                }} />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── COULEURS INTERDITES ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Couleurs à éviter</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COLOR_CHIPS.map((c) => {
            const active = (effective.couleursInterdites || []).includes(c.hex);
            return (
              <button
                key={c.hex}
                onClick={() => toggleArray("couleursInterdites", c.hex)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px 8px 6px",
                  background: active ? "#C13E3E" : "#fff",
                  color: active ? "#fff" : palette.ink,
                  border: `1px solid ${active ? "#C13E3E" : palette.line}`,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  transition: "all .15s ease",
                }}
              >
                <span style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c.hex,
                  border: c.hex === "#F4EFE7" ? `1px solid ${palette.line}` : "none",
                  position: "relative",
                }}>
                  {active && (
                    <span style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                    }}>×</span>
                  )}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MARQUES FAVORITES (autocomplete) ── */}
      <div style={cardStyle}>
        <div style={fieldHeaderStyle}>Marques que tu aimes</div>
        {(effective.marquesFavorites || []).length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {(effective.marquesFavorites || []).map((b) => (
              <button
                key={b}
                onClick={() => toggleArray("marquesFavorites", b)}
                style={{
                  padding: "6px 10px 6px 12px",
                  background: palette.bordeaux,
                  color: palette.cream,
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                aria-label={`Retirer ${b}`}
              >
                {b}
                <span style={{ opacity: 0.7, fontSize: 14, lineHeight: 1 }}>×</span>
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
          placeholder="ex. Brunello Cucinelli, Jacquemus, MUJI…"
          style={inputStyle}
        />
        {brandSuggestions.length > 0 && (
          <div style={{
            marginTop: 8,
            background: "#fff",
            border: `1px solid ${palette.line}`,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            {brandSuggestions.map((b) => (
              <button
                key={b}
                onClick={() => {
                  toggleArray("marquesFavorites", b);
                  setBrandQuery("");
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  color: palette.ink,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = palette.cream)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                + {b}
              </button>
            ))}
          </div>
        )}
        <p style={hintStyle}>
          WADA priorise ces marques quand elle compose tes tenues.
        </p>
      </div>
    </section>
  );
}

/* ── Sous-composants visuels ───────────────────────────────────── */
function Pill({ label }: { label: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "6px 12px",
      background: palette.cream,
      color: palette.ink,
      border: `1px solid ${palette.line}`,
      borderRadius: 999,
      fontFamily: fonts.sans,
      fontSize: 13,
      fontWeight: 500,
    }}>
      {label}
    </span>
  );
}

function ChoiceChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 14px",
        background: active ? palette.ink : "#fff",
        color: active ? palette.cream : palette.ink,
        border: `1px solid ${active ? palette.ink : palette.line}`,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: fonts.sans,
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transition: "all .15s ease",
      }}
    >
      {label}
    </button>
  );
}

/* ── Styles partagés ──────────────────────────────────────────── */
const cardStyle: React.CSSProperties = {
  background: palette.cream,
  border: `1px solid ${palette.line}`,
  borderRadius: 14,
  padding: 18,
  marginBottom: 12,
};
const fieldHeaderStyle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: palette.inkSoft,
  marginBottom: 10,
  fontWeight: 500,
};
const chipRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: fonts.sans,
  fontSize: 14,
  padding: "11px 14px",
  borderRadius: 12,
  border: `1px solid ${palette.line}`,
  background: "#fff",
  outline: "none",
  color: palette.ink,
};
const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: palette.inkSoft,
  margin: "10px 0 0",
  lineHeight: 1.4,
};
