"use client";
import { useState } from "react";
import { useStyleSignals, type DislikeReason } from "@/hooks/useStyleSignals";

/**
 * <OutfitFeedback> — Vision Pt D (2026-05-31).
 *
 * Deux boutons sous chaque tenue proposée :
 *   👍 J'aime cette tenue    👎 Pas pour moi
 *
 * Like : commit immédiat (kind="like", reason="general") + toast.
 * Dislike : ouvre une modal compacte avec 5 raisons mutuellement
 *   exclusives (couleur/marque/coupe/prix/occasion). Au clic, commit
 *   + toast + ferme.
 *
 * Le composant connaît la tenue proposée (paletteRef, pieces, etc.)
 * pour pouvoir cibler le dislike (« la couleur X de cette tenue »
 * vs un dislike générique).
 */

const palette = {
  cream: "#FAF8F4",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  bordeaux: "#6B3A32",
  olive: "#A8B29A",
  line: "rgba(30,30,30,.12)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const DISLIKE_REASONS: Array<{ key: DislikeReason; icon: string; label: string }> = [
  { key: "couleur", icon: "🎨", label: "La couleur" },
  { key: "marque", icon: "🏷️", label: "La marque" },
  { key: "coupe", icon: "✂️", label: "La coupe" },
  { key: "prix", icon: "💶", label: "Le prix" },
  { key: "occasion", icon: "📅", label: "L'occasion ne correspond pas" },
];

export interface OutfitFeedbackProps {
  paletteRef?: string;
  paletteName?: string;
  tenueName?: string;
  pieces?: Array<{ type: string; brand?: string; price?: number; hex?: string }>;
  /* Couleur dominante de la tenue (1er slot ou accord) — utilisée comme
     target par défaut quand l'user dislike "la couleur". */
  dominantHex?: string;
  /* Marque dominante — target par défaut pour "la marque". */
  dominantBrand?: string;
  /* Type de coupe dominante (ex. "oversize", "fitted") — optionnel. */
  dominantCut?: string;
  onFeedback?: (kind: "like" | "dislike") => void;
}

export default function OutfitFeedback(props: OutfitFeedbackProps) {
  const { add } = useStyleSignals();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState<"like" | "dislike" | null>(null);

  const handleLike = () => {
    add({
      kind: "like",
      reason: "general",
      paletteRef: props.paletteRef,
      paletteName: props.paletteName,
      tenueName: props.tenueName,
      pieces: props.pieces,
    });
    setSubmitted("like");
    props.onFeedback?.("like");
  };

  const handleDislikeReason = (reason: DislikeReason) => {
    const targetByReason: Record<DislikeReason, string | undefined> = {
      couleur: props.dominantHex,
      marque: props.dominantBrand,
      coupe: props.dominantCut,
      prix: undefined, // pas de target précis, c'est juste « trop cher »
      occasion: undefined,
    };
    add({
      kind: "dislike",
      reason,
      target: targetByReason[reason],
      paletteRef: props.paletteRef,
      paletteName: props.paletteName,
      tenueName: props.tenueName,
      pieces: props.pieces,
    });
    setSubmitted("dislike");
    setOpen(false);
    props.onFeedback?.("dislike");
  };

  /* État après feedback : merci compact, plus de boutons. */
  if (submitted) {
    return (
      <div style={{
        marginTop: 10,
        padding: "8px 14px",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 999,
        fontFamily: fonts.sans,
        fontSize: 12,
        color: palette.inkSoft,
        textAlign: "center",
      }}>
        {submitted === "like"
          ? "🙏 Noté — je vais te proposer plus de tenues dans ce registre."
          : "🙏 Noté — WADA évitera ce profil à l'avenir."}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleLike}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "#fff",
            color: palette.ink,
            border: `1px solid ${palette.line}`,
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 500,
            transition: "all .15s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = palette.olive;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = palette.olive;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = palette.ink;
            e.currentTarget.style.borderColor = palette.line;
          }}
        >
          <span style={{ fontSize: 14 }}>👍</span> J'aime
        </button>
        <button
          onClick={() => setOpen(true)}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "#fff",
            color: palette.ink,
            border: `1px solid ${palette.line}`,
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: fonts.sans,
            fontSize: 13,
            fontWeight: 500,
            transition: "all .15s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = palette.bordeaux;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = palette.bordeaux;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = palette.ink;
            e.currentTarget.style.borderColor = palette.line;
          }}
        >
          <span style={{ fontSize: 14 }}>👎</span> Pas pour moi
        </button>
      </div>

      {/* Modal raison dislike */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(30,30,30,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              background: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: "24px 22px calc(28px + env(safe-area-inset-bottom)) 22px",
              fontFamily: fonts.sans,
              animation: "slideUp .25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 style={{
                fontFamily: fonts.display,
                fontWeight: 600,
                fontSize: 19,
                margin: 0,
                color: palette.ink,
              }}>
                Qu'est-ce qui ne va pas ?
              </h3>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 22,
                  color: palette.inkSoft,
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="Fermer"
              >×</button>
            </div>
            <p style={{
              fontSize: 13,
              color: palette.inkSoft,
              margin: "0 0 16px",
              lineHeight: 1.5,
            }}>
              WADA retient ton signal pour affiner les prochaines tenues.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DISLIKE_REASONS.map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleDislikeReason(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 16px",
                    background: palette.cream,
                    border: `1px solid ${palette.line}`,
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: palette.ink,
                    textAlign: "left",
                    width: "100%",
                    transition: "all .15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = palette.bordeaux;
                    e.currentTarget.style.background = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = palette.line;
                    e.currentTarget.style.background = palette.cream;
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <style jsx>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
