"use client";
/**
 * StylisteContent — Colonne gauche de la page /styliste.
 * Titre éditorial + card intro + chips + input + features.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ── Chips de quick action ── */
const CHIPS = [
  { label: "Bureau lundi", prompt: "Compose-moi une tenue pour le bureau lundi matin" },
  { label: "J'ai un pull noir", prompt: "J'ai un pull noir en col rond, autour de quoi je peux le composer ?" },
  { label: "Soirée samedi", prompt: "Tenue pour un dîner restaurant samedi soir" },
  { label: "Surprends-moi ✦", prompt: "Surprends-moi avec une tenue inattendue mais belle", primary: true },
  { label: "J'ai déjà une pièce", prompt: "J'ai déjà une pièce que je veux te montrer" },
];

/* ── Feature cards ── */
const FEATURES = [
  { icon: "✦", label: "Styliste IA", text: "Des tenues uniques rien que pour vous", href: "/styliste" },
  { icon: "◉", label: "Scanner", text: "Scannez une couleur et trouvez des idées", href: "/scanner" },
  { icon: "▦", label: "Palettes", text: "348 harmonies de couleurs Sanzō Wada", href: "/palettes" },
  { icon: "♡", label: "Vos favoris", text: "Enregistrez vos looks préférés", href: "/favoris" },
];

export function StylisteContent() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    router.push(`/stylist?q=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <div style={{ paddingTop: 24, paddingBottom: 60 }}>

      {/* Bouton Retour */}
      <Link href="/" style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 18px", border: "1px solid rgba(26,26,26,0.15)",
        borderRadius: 999, fontSize: 11, letterSpacing: "0.2em",
        textTransform: "uppercase", color: "#1a1a1a", textDecoration: "none",
        fontFamily: "'Inter', sans-serif", transition: "background 0.15s",
      }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#fff")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        ← Retour
      </Link>

      {/* Titre éditorial */}
      <div style={{ marginTop: 40, marginBottom: 32 }}>
        <p style={{
          fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase",
          color: "#5a5a5a", marginBottom: 14, fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
        }}>
          Le styliste · WADA AI
        </p>
        <h1 style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: "clamp(36px, 5vw, 56px)",
          fontWeight: 400,
          lineHeight: 1.05,
          color: "#1a1a1a",
          margin: 0,
        }}>
          Composons<br />votre tenue.
        </h1>
      </div>

      {/* Card intro WADA */}
      <div style={{
        background: "#fff", borderRadius: 18, padding: "18px 20px",
        marginBottom: 24, maxWidth: 440,
      }}>
        <p style={{
          fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase",
          color: "#8a7a68", marginBottom: 8, fontFamily: "'Inter'", fontWeight: 600,
        }}>
          WADA
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <p style={{ fontSize: 14, color: "#1a1a1a", lineHeight: 1.6, margin: 0, fontFamily: "'Inter'" }}>
            Dites-moi tout. Une occasion, une pièce, une humeur — je compose autour.
          </p>
          <span style={{ fontSize: 16, color: "#1a1a1a", flexShrink: 0, marginTop: 2 }}>✦</span>
        </div>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, maxWidth: 440 }}>
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => setPrompt(chip.prompt)}
            style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 12,
              cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'Inter'", fontWeight: 500,
              background: chip.primary ? "#6e3b32" : "transparent",
              color: chip.primary ? "#fff" : "#1a1a1a",
              border: chip.primary ? "1px solid #6e3b32" : "1px solid rgba(26,26,26,0.2)",
            }}
            onMouseOver={(e) => {
              if (!chip.primary) e.currentTarget.style.background = "#fff";
              else e.currentTarget.style.background = "#5a2f28";
            }}
            onMouseOut={(e) => {
              if (!chip.primary) e.currentTarget.style.background = "transparent";
              else e.currentTarget.style.background = "#6e3b32";
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ position: "relative", maxWidth: 440, marginBottom: 40 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Décrivez ce que vous cherchez..."
          style={{
            width: "100%", padding: "16px 140px 16px 20px",
            background: "#fff", border: "1px solid rgba(26,26,26,0.1)",
            borderRadius: 999, fontSize: 14, color: "#1a1a1a",
            fontFamily: "'Inter'", outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px rgba(110,59,50,0.2)")}
          onBlur={(e) => (e.target.style.boxShadow = "none")}
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim()}
          style={{
            position: "absolute", right: 6, top: 6, bottom: 6,
            padding: "0 20px", background: "#1a1a1a", color: "#fff",
            borderRadius: 999, border: "none", cursor: prompt.trim() ? "pointer" : "not-allowed",
            fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
            fontFamily: "'Inter'", fontWeight: 600,
            opacity: prompt.trim() ? 1 : 0.5, transition: "opacity 0.15s",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          Envoyer →
        </button>
      </div>

      {/* Feature cards 2×2 */}
      <div className="wada-styliste-features" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 440,
      }}>
        {FEATURES.map((feat) => (
          <Link key={feat.href} href={feat.href} style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              transition: "opacity 0.15s",
            }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(26,26,26,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 16, color: "#1a1a1a",
              }}>
                {feat.icon}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "#1a1a1a", fontFamily: "'Inter'" }}>
                  {feat.label}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#5a5a5a", lineHeight: 1.5, fontFamily: "'Inter'" }}>
                  {feat.text}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
