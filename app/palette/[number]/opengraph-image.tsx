import { ImageResponse } from "next/og";
import { dictionary } from "@/lib/data";

/**
 * Open Graph image dynamique par palette (brief SEO 2026-05-23).
 *
 * Next.js sert automatiquement ce fichier comme l'OG image de la route
 * /palette/[number]. Quand quelqu'un partage l'URL d'une palette sur
 * iMessage / WhatsApp / Twitter / Facebook / LinkedIn, l'aperçu affiche
 * désormais les VRAIES couleurs de cette palette — plus l'image générique
 * /og-image.svg.
 *
 * Convention Next.js : ce fichier doit être nommé `opengraph-image.tsx`
 * (sans tiret) et exporter par défaut une fonction qui retourne un
 * ImageResponse. Next.js l'expose automatiquement à
 *   /palette/[number]/opengraph-image
 * et l'inscrit dans <meta property="og:image"> de la page.
 *
 * Format imposé par les réseaux sociaux : 1200×630, < 8 MB, public.
 */

export const runtime = "edge"; // Plus rapide pour la génération d'image
export const alt = "Palette Sanzo Wada — WADA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const entry = dictionary.find((d) => d.number === number);

  // Fallback : palette introuvable → image générique cohérente
  if (!entry) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#F4EFE7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            color: "#1E1E1E",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          WADA
        </div>
      ),
      size
    );
  }

  // Composition principale : bande palette pleine largeur + carte info beige
  // en bas avec No., nom de l'accord, couleurs nommées.
  const colors = entry.colors;
  const culture = entry.culture ? entry.culture[0].toUpperCase() + entry.culture.slice(1) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F4EFE7",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
        }}
      >
        {/* BANDE PALETTE — 60% de la hauteur, 1 colonne par couleur */}
        <div style={{ flex: 1, display: "flex" }}>
          {colors.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: c.hex,
                display: "flex",
                alignItems: "flex-end",
                padding: "32px 28px",
                color: getContrastColor(c.hex),
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.04em",
              }}
            >
              {c.name}
            </div>
          ))}
        </div>

        {/* CARTE INFO — fond beige, infos palette */}
        <div
          style={{
            background: "#F4EFE7",
            padding: "44px 56px 50px",
            display: "flex",
            flexDirection: "column",
            borderTop: "1px solid rgba(30,30,30,.12)",
          }}
        >
          {/* Top row : No. à gauche · WADA brand à droite */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "#6B3A32",
                fontWeight: 700,
              }}
            >
              No. {entry.number}{culture ? ` · ${culture}` : ""}
            </div>
            {/* Mini logomark WADA : 3 bandes (bordeaux/olive/bleu) — la signature */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 3 }}>
                <span style={{ display: "block", width: 6, height: 22, background: "#6B3A32" }} />
                <span style={{ display: "block", width: 6, height: 22, background: "#5C5A3C" }} />
                <span style={{ display: "block", width: 6, height: 22, background: "#1B4A6B" }} />
              </div>
              <div
                style={{
                  fontSize: 24,
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                  color: "#1E1E1E",
                }}
              >
                WADA
              </div>
            </div>
          </div>

          {/* Nom de la palette — gros, dominant */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#1E1E1E",
              lineHeight: 1.05,
              letterSpacing: "0.005em",
            }}
          >
            {entry.name}
          </div>

          {/* Sous-titre éditorial */}
          <div
            style={{
              fontSize: 20,
              color: "#6a6259",
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            {entry.description || "Un accord du dictionnaire Sanzo Wada."}
          </div>
        </div>
      </div>
    ),
    size
  );
}

/**
 * Contraste lisible sur fond hex — retourne blanc cassé ou anthracite
 * selon la luminance perçue (formule WCAG simplifiée).
 * Garantit que le nom de couleur reste lisible sur n'importe quel hex.
 */
function getContrastColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  // luminance perçue (formule WCAG)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#1E1E1E" : "#F4EFE7";
}
