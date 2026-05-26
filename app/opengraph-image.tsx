import { ImageResponse } from "next/og";

/**
 * Image Open Graph racine — générée dynamiquement par Next.js.
 *
 * Brief audit (25/05) : `og-image.svg` était la seule version dispo. Or
 * LinkedIn, Slack, certains crawlers Microsoft et beaucoup de plateformes
 * legacy ne supportent pas / rendent mal les SVG en OG. Solution propre :
 * Next.js `opengraph-image.tsx` génère un PNG 1200×630 à la volée via
 * `ImageResponse` (built-in API Next 16, basée sur Satori).
 *
 * Cette image est servie automatiquement à `/opengraph-image` et est
 * référencée par défaut dans tous les `<meta property="og:image">` du site
 * via `lib/pageMetadata.ts`.
 *
 * Format : 1200×630 (standard OG/Twitter Card), fond beige WADA, titre
 * éditorial centré en serif italique. Les pages internes (palette,
 * piece, etc.) peuvent toujours override avec leur propre image OG via
 * le param `image` de pageMetadata().
 */

export const runtime = "edge";
export const alt = "WADA — Le dictionnaire des couleurs et de la mode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #F4EFE7 0%, #EEE5D2 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
          fontFamily: "serif",
        }}
      >
        {/* Kicker */}
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "#6B3A32",
            fontWeight: 600,
            marginBottom: 36,
          }}
        >
          WADA
        </div>

        {/* Titre principal */}
        <div
          style={{
            fontSize: 96,
            fontStyle: "italic",
            color: "#1A1612",
            textAlign: "center",
            lineHeight: 1.05,
            marginBottom: 32,
            maxWidth: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div>Le dictionnaire</div>
          <div>des couleurs.</div>
        </div>

        {/* Sous-titre */}
        <div
          style={{
            fontSize: 26,
            color: "#6a6259",
            fontStyle: "italic",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          348 accords de Sanzo Wada (1933), traduits en tenues à porter.
        </div>

        {/* Pastilles couleur — un mini-aperçu de palette */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 48,
          }}
        >
          {["#1F3A5F", "#6B3A32", "#C9A567", "#9B6F4A", "#A8B29A"].map((c) => (
            <div
              key={c}
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: c,
                border: "2px solid rgba(0,0,0,0.05)",
              }}
            />
          ))}
        </div>

        {/* Footer URL */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            fontSize: 18,
            letterSpacing: "0.2em",
            color: "#9b948a",
          }}
        >
          wada.style
        </div>
      </div>
    ),
    { ...size }
  );
}
