"use client";
import type { DictionaryEntry } from "@/lib/data";
import { dictionary } from "@/lib/data";
import { iconForItem, PieceIcon } from "@/lib/icons";
import { ink, paper, subtle, border, cardBg, fontHeading, fontLabel, mojo } from "@/lib/styles";
/* Brief client 2026-05-26 : PaletteCardMatisse supprimé sitewide.
   Ce wrapper a déjà son propre header (N°) et footer (nom + culture +
   couleurs), donc on rend juste les bandes pleines directement, pas
   besoin d'importer la PaletteCard complète (qui dupliquerait header/footer). */
// OutfitAvatar n'est plus utilisé ici — variant "outfit-stack" rend désormais
// une vraie photo Unsplash tintée par la palette (cf. lignes 130-180).

type VisualKind =
  | "book-spread"     // 2-3 cartes-livre côte à côte (Hero, CTA)
  | "color-scan"      // gros swatch + crosshair scanner (étape Scanner)
  | "outfit-stack"    // 1 OutfitAvatar centré sur cream paper (étape Tenue)
  | "shop-chips"      // pile de chips boutiques (étape Acheter)
  | "palette-bands"   // bandes verticales de couleurs (Features)
  | "texture-paper"   // marbré + grain (CTA bg, accents)
  | "kanji-medallion"; // grand kanji éditorial sur cream

interface WadaVisualProps {
  /** Variante de visuel à rendre. */
  kind: VisualKind;
  /** Pour book-spread : 1-3 palettes (DictionaryEntry). Défaut : 002 / 003. */
  entries?: DictionaryEntry[];
  /** Pour color-scan / palette-bands : couleurs custom. */
  colors?: string[];
  /** Pour outfit-stack : palette source pour habiller l'avatar. */
  entry?: DictionaryEntry;
  /** Mode dark — adapte ink → paper. */
  dark?: boolean;
  /** Hauteur min de la card englobante. */
  minHeight?: number;
}

const DEFAULTS = {
  asagi:       dictionary.find((d) => d.number === "002"),
  karakurenai: dictionary.find((d) => d.number === "003"),
  jardin:      dictionary.find((d) => d.number === "024"),
};

/**
 * WadaVisual — visuels éditoriaux WADA-natifs (pas de photo externe).
 *
 * Inspiration directe : pages du livre Sanzo Wada (1933) — cartes
 * palette, swatches Pantone, kanji éditoriaux, bandes chromatiques.
 * Chaque variante est composée à partir de la data WADA elle-même.
 */
export default function WadaVisual({
  kind, entries, colors, entry, dark = false, minHeight = 280,
}: WadaVisualProps) {
  const bg = dark ? ink : paper;
  const fg = dark ? paper : ink;

  if (kind === "book-spread") {
    const list = entries && entries.length > 0
      ? entries
      : [DEFAULTS.asagi, DEFAULTS.karakurenai].filter(Boolean) as DictionaryEntry[];
    return (
      <div
        style={{
          background: bg,
          padding: "32px 24px",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(list.length, 3)}, 1fr)`,
          gap: 16,
          alignItems: "stretch",
          minHeight,
          position: "relative",
        }}
      >
        {list.slice(0, 3).map((e) => (
          <BookPage key={e.number} entry={e} dark={dark} />
        ))}
      </div>
    );
  }

  if (kind === "color-scan") {
    const cs = colors && colors.length > 0 ? colors : ["#C44E3A", "#1B4A6B", "#9CAF88"];
    const main = cs[0];
    return (
      <div style={{
        position: "relative", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight, overflow: "hidden",
      }}>
        {/* Cible scanner — 3 anneaux */}
        <div style={{
          position: "absolute", width: 220, height: 220, borderRadius: "50%",
          border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : border}`,
        }} />
        <div style={{
          position: "absolute", width: 160, height: 160, borderRadius: "50%",
          border: `1px solid ${dark ? "rgba(255,255,255,0.4)" : "rgba(31,27,22,0.3)"}`,
        }} />
        {/* Swatch dominant */}
        <div style={{
          width: 100, height: 100, background: main,
          boxShadow: "0 8px 28px rgba(31, 27, 22, 0.18)",
          border: `2px solid ${dark ? paper : ink}`,
        }} aria-hidden="true" />
        {/* Crosshair */}
        <div style={{
          position: "absolute", width: 1, height: 240,
          background: dark ? "rgba(255,255,255,0.35)" : "rgba(31,27,22,0.35)",
        }} />
        <div style={{
          position: "absolute", width: 240, height: 1,
          background: dark ? "rgba(255,255,255,0.35)" : "rgba(31,27,22,0.35)",
        }} />
        {/* Labels de coin */}
        <span style={{
          position: "absolute", top: 16, left: 20,
          fontFamily: fontLabel, fontSize: 9, letterSpacing: "0.4em",
          textTransform: "uppercase", color: dark ? paper : subtle, fontWeight: 600,
        }}>Scan</span>
        <span style={{
          position: "absolute", bottom: 16, right: 20,
          fontFamily: fontLabel, fontSize: 9, letterSpacing: "0.3em",
          color: dark ? paper : subtle, fontWeight: 600,
        }}>{main.toUpperCase()}</span>
        {/* Mini swatches secondaires */}
        <div style={{ position: "absolute", bottom: 18, left: 20, display: "flex", gap: 4 }}>
          {cs.slice(1, 4).map((c, i) => (
            <span key={i} style={{ width: 16, height: 16, background: c, border: `1px solid ${dark ? "rgba(255,255,255,0.3)" : border}` }} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === "outfit-stack") {
    const e = entry || DEFAULTS.asagi!;
    /* Banque de photos lifestyle Unsplash — sélection rotative déterministe.
       Le seed vient du numéro de palette, donc une palette = toujours sa photo. */
    const lifestylePhotos = [
      "photo-1490481651871-ab68de25d43d", // portrait éditorial neutre
      "photo-1483985988355-763728e1935b", // street portrait
      "photo-1469334031218-e382a71b716b", // street fashion homme
      "photo-1539109136881-3be0616acf4b", // atelier portrait
      "photo-1492288991661-058aa541ff43", // editorial fashion
      "photo-1502716119720-b23a93e5fe1b", // outdoor portrait
      "photo-1502764613149-7f1d229e230f", // mode lin minimal
      "photo-1485518882345-15568b007407", // détail mode
    ];
    const seed = parseInt(e.number, 10) || 0;
    const photoId = lifestylePhotos[seed % lifestylePhotos.length];
    const dominant = e.colors[0]?.hex || "#1F1B16";
    return (
      <div style={{
        background: dominant,
        minHeight, position: "relative", overflow: "hidden",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=80`}
          alt={`Ambiance ${e.name}`}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            filter: "saturate(0.9) contrast(1.04)",
            minHeight,
          }}
        />
        {/* Tinte par la couleur dominante de la palette */}
        <div style={{
          position: "absolute", inset: 0,
          background: dominant, opacity: 0.16, mixBlendMode: "color",
        }} aria-hidden="true" />
        {/* Bandeau colors + nom en bas */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "14px 18px",
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
        }}>
          <div style={{ display: "flex", width: 110, height: 10, marginBottom: 8, border: "1px solid rgba(255,255,255,0.4)" }}>
            {e.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
          </div>
          <p style={{
            fontFamily: fontHeading, fontSize: 16, fontStyle: "italic", fontWeight: 500,
            color: "#FFFFFF", margin: 0, letterSpacing: "-0.005em",
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}>
            {e.name}
          </p>
        </div>
      </div>
    );
  }

  if (kind === "shop-chips") {
    const chips = [
      { label: "Vinted",       sub: "Seconde main",  color: "#5C2018" },
      { label: "Sézane",       sub: "Premium FR",    color: "#3A4555" },
      { label: "COS",          sub: "Minimaliste",   color: "#7E7166" },
      { label: "Net-a-Porter", sub: "Luxe",          color: "#1B2840" },
      { label: "Amazon",       sub: "Marketplace",   color: "#C44E3A" },
    ];
    return (
      <div style={{
        background: bg, padding: "24px 20px",
        display: "flex", flexDirection: "column", gap: 10,
        justifyContent: "center", minHeight,
      }}>
        {chips.map((c, i) => (
          <div key={c.label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: dark ? "rgba(255,255,255,0.08)" : paper,
            border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : border}`,
            padding: "11px 16px",
            opacity: 1 - i * 0.05,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 8, height: 8, background: c.color, borderRadius: "50%" }} />
              <div>
                <p style={{ fontFamily: fontLabel, fontSize: 12, fontWeight: 600, margin: 0, color: fg }}>{c.label}</p>
                <p style={{ fontFamily: fontLabel, fontSize: 8, letterSpacing: "0.25em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.55)" : subtle, margin: "2px 0 0", fontWeight: 600 }}>{c.sub}</p>
              </div>
            </div>
            <span style={{ fontSize: 10, color: dark ? paper : subtle, letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: fontLabel, fontWeight: 600 }}>→</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "palette-bands") {
    const cs = colors && colors.length > 0 ? colors : (DEFAULTS.karakurenai?.colors.map((c) => c.hex) || ["#C44E3A", "#1B4A6B", "#9CAF88"]);
    return (
      <div style={{
        background: bg,
        display: "flex",
        minHeight,
      }}>
        {cs.map((c, i) => (
          <div key={i} style={{
            flex: 1, background: c, position: "relative",
            borderRight: i < cs.length - 1 ? `1px solid rgba(255,255,255,0.15)` : "none",
          }}>
            {/* Petite étiquette TCX en bas de chaque bande */}
            <span style={{
              position: "absolute", bottom: 16, left: 14,
              fontFamily: fontLabel, fontSize: 8, fontWeight: 700,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.85)",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}>
              {String(i + 1).padStart(2, "0")} · {c.replace("#", "").toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "texture-paper") {
    const cs = colors && colors.length > 0 ? colors : ["#F4EFE6", "#C8B187", "#5C2018"];
    return (
      <div style={{
        background: `linear-gradient(135deg, ${cs[0]} 0%, ${cs[1] || cs[0]} 50%, ${cs[2] || cs[0]} 100%)`,
        minHeight, position: "relative", overflow: "hidden",
      }}>
        {/* Texture noise SVG */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' /></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>")`,
          mixBlendMode: "overlay",
          opacity: 0.6,
        }} />
      </div>
    );
  }

  if (kind === "kanji-medallion") {
    const kanji = "和田色彩";
    return (
      <div style={{
        background: bg, minHeight,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", padding: 24,
      }}>
        <p style={{
          fontFamily: "'Noto Serif JP', 'Fredoka', sans-serif",
          fontSize: 96, color: fg, margin: 0, lineHeight: 1.05,
          letterSpacing: "0.08em",
        }}>
          {kanji}
        </p>
        <p style={{
          fontFamily: fontLabel, fontSize: 10, letterSpacing: "0.5em",
          textTransform: "uppercase", color: dark ? "rgba(255,255,255,0.55)" : subtle,
          margin: "16px 0 0", fontWeight: 600,
        }}>
          Wada · Couleurs · Harmonie
        </p>
      </div>
    );
  }

  return null;
}

/* ──────────────────────────────────────────────────────────────────────
   Sous-composant : page de livre WADA (carte palette éditoriale)
   ────────────────────────────────────────────────────────────────────── */

function BookPage({ entry, dark }: { entry: DictionaryEntry; dark: boolean }) {
  const cardBgLocal = dark ? "rgba(255,255,255,0.04)" : paper;
  const txt = dark ? paper : ink;
  const meta = dark ? "rgba(255,255,255,0.55)" : subtle;
  const colorFor = (item?: string) => {
    if (!item) return entry.colors[0].hex;
    return (entry.colors.find((c) => item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) || entry.colors[0]).hex;
  };
  const pieces = (["Top", "Bottom", "Shoes"] as const).map((p) => {
    const c = entry.composition.find((cc) => cc.piece === p);
    if (!c) return null;
    return { piece: c.piece, item: c.item, color: colorFor(c.item), type: iconForItem(c.item, c.piece) };
  }).filter(Boolean) as { piece: string; item: string; color: string; type: string }[];

  return (
    <article style={{
      background: cardBgLocal,
      border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : border}`,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header : No. + traits chromatiques */}
      <div style={{ padding: "12px 14px 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ fontFamily: fontLabel, fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: meta, fontWeight: 600, margin: 0 }}>
          No. {entry.number}
        </p>
        <div style={{ display: "flex", gap: 2 }}>
          {entry.colors.map((c) => (
            <span key={c.hex} style={{ width: 12, height: 3, background: c.hex, border: `0.5px solid ${dark ? "rgba(255,255,255,0.2)" : border}` }} />
          ))}
        </div>
      </div>
      {/* Bandes de couleur pleines — alignées sur le visuel /palettes
          unifié (brief client 26/05). Plus de cellules organiques cut-out,
          plus de mini-cartes superposées : juste les couleurs. */}
      <div style={{ flex: 1, minHeight: 220, display: "flex" }}>
        {entry.colors.map((c) => (
          <span
            key={c.hex}
            title={`${c.name} ${c.hex}`}
            style={{ flex: 1, background: c.hex }}
            aria-hidden="true"
          />
        ))}
      </div>
      {/* Pied : nom italique + culture + noms de couleurs (réf. Brume du matin) */}
      <div style={{ padding: "14px 16px 16px", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.12)" : border}`, textAlign: "center", background: cardBgLocal }}>
        <p style={{
          fontFamily: fontHeading, fontSize: 17, fontStyle: "italic", fontWeight: 500,
          color: txt, margin: "0 0 4px", lineHeight: 1.1, letterSpacing: "-0.01em",
        }}>
          {entry.name}
        </p>
        {entry.culture && (
          <p style={{
            fontFamily: fontLabel, fontSize: 8, letterSpacing: "0.3em",
            textTransform: "uppercase", color: meta, margin: "0 0 6px", fontWeight: 600,
          }}>
            {entry.culture}
          </p>
        )}
        <p style={{
          fontFamily: "'Fredoka', sans-serif",
          fontSize: 10, fontStyle: "italic", color: meta, margin: 0, lineHeight: 1.4,
        }}>
          {entry.colors.map((c) => c.name).join(" · ")}
        </p>
      </div>
    </article>
  );
}
