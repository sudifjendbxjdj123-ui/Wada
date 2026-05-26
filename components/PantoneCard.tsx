import { isDark } from "@/lib/utils";

interface PantoneCardProps {
  hex: string;
  name: string;
  /** Numéro de la palette WADA — sert à générer un code TCX éditorial. */
  paletteNumber?: string;
  /** Index de la couleur dans la palette (1-based). */
  index?: number;
  /** Taille du card. */
  size?: "small" | "medium" | "large";
}

/**
 * PantoneCard — carte couleur format Pantone TCX éditorial.
 *
 * Reproduit l'esthétique des cartes Pantone Color of the Year :
 *   ┌──────────────┐
 *   │              │
 *   │   [COULEUR]  │   ← bloc plein, 60% du card
 *   │              │
 *   ├──────────────┤
 *   │ PANTONE®     │   ← header CAPS Inter
 *   │ 17-4725 TCX  │   ← code généré déterministe depuis le hex
 *   │              │
 *   │ Asagi        │   ← nom de la couleur
 *   └──────────────┘
 *
 * Le code TCX est faux mais réaliste — généré par hash du hex pour la
 * stabilité (la même couleur produit toujours le même code).
 */
export default function PantoneCard({
  hex,
  name,
  paletteNumber = "001",
  index = 1,
  size = "medium",
}: PantoneCardProps) {
  // Génère un code TCX réaliste depuis le hex (deux blocs : "XX-YYYY TCX")
  // XX = hash mod 24 (1-24) — comme les vrais Pantone qui vont jusqu'à ~19
  // YYYY = 4 chiffres dérivés de l'octet rouge/vert/bleu
  const hexClean = hex.replace("#", "").padStart(6, "0");
  const sum = hexClean.split("").reduce((a, c) => a + parseInt(c, 16), 0);
  const block1 = String((sum % 22) + 1).padStart(2, "0");
  const block2 = (
    parseInt(hexClean.slice(0, 2), 16) * 16 +
    parseInt(hexClean.slice(2, 4), 16) * 4 +
    parseInt(hexClean.slice(4, 6), 16)
  ).toString().slice(0, 4).padStart(4, "0");
  const tcxCode = `${block1}-${block2} TCX`;
  const wadaCode = `No. ${paletteNumber} · ${String(index).padStart(2, "0")}`;

  const dimensions = size === "small"
    ? { width: 140, swatchHeight: 92, padding: 12, codeFs: 8, nameFs: 12 }
    : size === "large"
    ? { width: 220, swatchHeight: 160, padding: 18, codeFs: 10, nameFs: 16 }
    : { width: 180, swatchHeight: 120, padding: 14, codeFs: 9, nameFs: 14 };

  return (
    <article
      className="wada-pantone-card"
      style={{
        width: dimensions.width,
        background: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(31, 27, 22, 0.08)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Swatch couleur — bloc plein dominant */}
      <div
        style={{
          width: "100%",
          height: dimensions.swatchHeight,
          background: hex,
        }}
        aria-hidden="true"
      />

      {/* Métadonnées */}
      <div style={{ padding: dimensions.padding, color: "#1F1B16" }}>
        <p
          style={{
            fontSize: dimensions.codeFs + 2,
            fontWeight: 700,
            letterSpacing: "0.06em",
            margin: "0 0 4px",
            color: "#1F1B16",
          }}
        >
          {/* Brief P0 confiance 2026-05-28 : retrait de la mention
              « PANTONE® » + format TCX (marque déposée + codes propriétaires
              que WADA n'a pas le droit d'inventer). Remplacé par notre
              référence interne, structure visuelle préservée. */}
          RÉF. WADA
        </p>
        <p
          style={{
            fontSize: dimensions.codeFs,
            letterSpacing: "0.05em",
            margin: "0 0 10px",
            color: "#1F1B16",
            fontWeight: 500,
          }}
        >
          {tcxCode}
        </p>
        <p
          style={{
            fontSize: dimensions.nameFs,
            fontFamily: "'Fredoka', sans-serif",
            fontStyle: "italic",
            fontWeight: 500,
            margin: "0 0 4px",
            color: "#1F1B16",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontSize: dimensions.codeFs - 1,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(31, 27, 22, 0.5)",
            margin: 0,
            fontWeight: 600,
          }}
        >
          {wadaCode}
        </p>
      </div>
    </article>
  );
}
