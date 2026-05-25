"use client";
import Link from "next/link";
import { dictionary } from "@/lib/data";
import {
  ink, paper, subtle, border, textSecondary, cardBg,
  mojo,
  sectionLabel,
  fontHeading, fontBody, fontLabel,
  cardRadius,
} from "@/lib/styles";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";

/**
 * /atelier — Sommaire des huit outils WADA.
 * Déplacé hors de la home pour garder la home en porte d'entrée pure.
 * Présenté comme un sommaire de livre : eyebrow caps, gros titre 3D
 * extrudé, grille 4×2 des tool cards, pagination en clôture.
 */
export default function AtelierPage() {
  const demo  = dictionary.find((d) => d.number === "002") || dictionary[0];
  const demo2 = dictionary.find((d) => d.number === "003") || dictionary[1] || dictionary[0];

  return (
    <main style={{ minHeight: "100vh", fontFamily: fontBody, background: paper, color: ink }}>
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
      <Nav />
      <div id="main-content" />

      {/* ═══════════════════════════════════════════════════════════════
          HERO ATELIER — layout 2 colonnes texte/photo type Figma mockup
          Gauche : SOMMAIRE eyebrow + L'atelier WADA + fleur + sub-text
          Droite : photo "livres Sanzo Wada vintage" + caption éditoriale
          ═══════════════════════════════════════════════════════════════ */}
      <section className="wada-paper-grain" style={{ background: paper, padding: "80px 5% 56px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div className="wada-hero-grid" style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: 64, alignItems: "center",
            }}>
              {/* Colonne gauche — texte */}
              <div>
                <p style={{ ...sectionLabel, color: mojo, marginBottom: 24, fontWeight: 700, fontSize: 11, letterSpacing: "0.5em" }}>
                  Sommaire
                </p>
                <h1 className="wada-text-lift" style={{
                  fontFamily: fontHeading,
                  fontSize: "clamp(40px, 7vw, 76px)",
                  fontWeight: 500,
                  lineHeight: 1.02, letterSpacing: "-0.025em", margin: 0,
                  fontStyle: "italic", color: ink,
                }}>
                  L'atelier <SketchUnderline color={mojo}>WADA</SketchUnderline>.
                </h1>
                <p aria-hidden style={{
                  fontFamily: fontHeading, fontSize: 22, color: subtle,
                  margin: "20px 0 0", letterSpacing: "0.6em",
                }}>
                  ✦  ✦  ✦
                </p>
              </div>

              {/* Colonne droite — photo Sanzo Wada style "books + ceramic ball".
                  Unsplash : vintage books / objets d'atelier. À remplacer par
                  une vraie photo si tu en as une (place à /public/atelier-hero.jpg). */}
              <div style={{ position: "relative", aspectRatio: "1 / 1", maxWidth: 480, marginLeft: "auto" }}>
                <div style={{
                  width: "100%", height: "100%",
                  background: `linear-gradient(rgba(31,27,22,0.05), rgba(31,27,22,0.15)), url("https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80")`,
                  backgroundSize: "cover", backgroundPosition: "center",
                  borderRadius: cardRadius,
                  boxShadow: "var(--wada-shadow-4)",
                }} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ GRILLE OUTILS ═══ */}
      <section style={{ background: paper, padding: "32px 5% 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div className="wada-tools-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}>
              <ToolCard photoUrl="/atelier-scanner.jpg"     icon="camera"   kind="Photo → tenue"  title="Scanner une couleur" desc="Prenez une photo, recevez la tenue qui s'accorde."         href="/scanner"  colors={(dictionary.find((d) => d.number === "001") || demo).colors.map((c) => c.hex)} featured />
              <ToolCard photoUrl="/atelier-creer-tenue.jpg" icon="hanger"   kind="Votre tenue"    title="Créer une tenue"     desc="348 palettes du dictionnaire WADA — chacune sa silhouette."  href="/palettes" colors={(dictionary.find((d) => d.number === "024") || demo2).colors.map((c) => c.hex)} featured />
              <ToolCard photoUrl="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80" icon="chat"     kind="IA stylist"     title="Assistant mode"      desc="Décrivez l'occasion, on trouve la palette qui marche." href="/stylist"    colors={(dictionary.find((d) => d.number === "056") || demo).colors.map((c) => c.hex)} />
              <ToolCard photoUrl="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=600&q=80" icon="wardrobe" kind="Vos favoris"    title="Mon dressing"        desc="Vos tenues sauvegardées, prêtes à reprendre."          href="/garde-robe" colors={(dictionary.find((d) => d.number === "094") || demo).colors.map((c) => c.hex)} />
              <ToolCard photoUrl="https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=600&q=80" icon="globe"    kind="Voyage"         title="Inspirations"        desc="Le style selon six géographies du monde."              href="/cultures"   colors={(dictionary.find((d) => d.number === "115") || demo).colors.map((c) => c.hex)} />
              <ToolCard photoUrl="https://images.unsplash.com/photo-1612965607446-25e1332775ae?auto=format&fit=crop&w=600&q=80" icon="palette"  kind="Par teinte"     title="Explorer les couleurs" desc="Cherchez par brique, indigo, sauge, ocre…"           href="/couleurs"   colors={(dictionary.find((d) => d.number === "189") || demo).colors.map((c) => c.hex)} />
              <ToolCard photoUrl="https://images.unsplash.com/photo-1485518882345-15568b007407?auto=format&fit=crop&w=600&q=80" icon="sparkle"  kind="Chaque jour"    title="Looks du jour"       desc="Une palette nouvelle chaque matin, fraîche."           href="/decouverte" colors={(dictionary.find((d) => d.number === "133") || demo).colors.map((c) => c.hex)} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pagination de clôture — façon livre */}
      <Pagination current="Atelier" page="01" total="348" />

      <Footer />
    </main>
  );
}

/* ─────────────────── ToolIcon ───────────────────
   Icônes line-art simples (stroke ink, fill none), genre éditorial.
   Pas d'emojis (cassent la DA), pas de pictos remplis (trop UI).
   ───────────────────────────────────────────────────── */
type IconKind = "camera" | "hanger" | "outfit" | "grid" | "chat" | "wardrobe" | "globe" | "palette" | "sparkle";

function ToolIcon({ kind, size = 28, color }: { kind: IconKind; size?: number; color?: string }) {
  const stroke = color || "currentColor";
  const props = {
    width: size, height: size,
    viewBox: "0 0 28 28",
    fill: "none" as const, stroke,
    strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (kind) {
    case "camera":
      return (
        <svg {...props}>
          <rect x="3" y="8" width="22" height="15" rx="2" />
          <circle cx="14" cy="15.5" r="4.5" />
          <path d="M9 8 L10 5 L18 5 L19 8" />
          <circle cx="21" cy="11" r="0.6" fill={stroke} />
        </svg>
      );
    case "hanger":
      return (
        <svg {...props}>
          <path d="M14 5 a2 2 0 1 1 1.5 3.4" />
          <path d="M14 8 L14 11" />
          <path d="M14 11 L3 19 L25 19 L14 11" />
          <path d="M3 19 L3 21 L25 21 L25 19" />
        </svg>
      );
    case "outfit":
      return (
        <svg {...props}>
          <path d="M8 4 L10 6 Q14 8 18 6 L20 4 L24 7 L22 11 L20 10 L20 22 L8 22 L8 10 L6 11 L4 7 Z" />
        </svg>
      );
    case "grid":
      // Catalogue / dictionnaire — 4 carrés en 2×2 + une légère ligne de
      // reliure à gauche, suggère "pages d'un livre catalogué"
      return (
        <svg {...props}>
          <rect x="5" y="5" width="8" height="8" />
          <rect x="15" y="5" width="8" height="8" />
          <rect x="5" y="15" width="8" height="8" />
          <rect x="15" y="15" width="8" height="8" />
          <circle cx="9" cy="9" r="0.8" fill={stroke} />
          <circle cx="19" cy="19" r="0.8" fill={stroke} />
        </svg>
      );
    case "chat":
      return (
        <svg {...props}>
          <path d="M4 6 L24 6 Q25 6 25 7 L25 18 Q25 19 24 19 L11 19 L7 23 L7 19 L4 19 Q3 19 3 18 L3 7 Q3 6 4 6 Z" />
          <circle cx="10" cy="12.5" r="0.6" fill={stroke} />
          <circle cx="14" cy="12.5" r="0.6" fill={stroke} />
          <circle cx="18" cy="12.5" r="0.6" fill={stroke} />
        </svg>
      );
    case "wardrobe":
      return (
        <svg {...props}>
          <rect x="5" y="4" width="18" height="20" />
          <line x1="14" y1="4" x2="14" y2="24" />
          <circle cx="11" cy="14" r="0.6" fill={stroke} />
          <circle cx="17" cy="14" r="0.6" fill={stroke} />
          <line x1="8" y1="8" x2="11" y2="8" />
          <line x1="17" y1="8" x2="20" y2="8" />
        </svg>
      );
    case "globe":
      return (
        <svg {...props}>
          <circle cx="14" cy="14" r="10" />
          <ellipse cx="14" cy="14" rx="5" ry="10" />
          <line x1="4" y1="14" x2="24" y2="14" />
          <path d="M5.5 8 Q14 11 22.5 8" />
          <path d="M5.5 20 Q14 17 22.5 20" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <path d="M14 4 a10 10 0 1 0 0 20 c1 0 1.5 -1 1 -2 c-0.5 -1 0 -2 1 -2 L19 20 a4 4 0 0 0 4 -4 c0 -7 -4 -12 -9 -12 Z" />
          <circle cx="9" cy="11" r="1.2" fill={stroke} />
          <circle cx="14" cy="9" r="1.2" fill={stroke} />
          <circle cx="19" cy="11" r="1.2" fill={stroke} />
          <circle cx="9" cy="16" r="1.2" fill={stroke} />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...props}>
          <path d="M14 4 L15.5 11 L22 12 L15.5 13 L14 20 L12.5 13 L6 12 L12.5 11 Z" />
          <path d="M22 4 L22.7 6 L25 6.5 L22.7 7 L22 9 L21.3 7 L19 6.5 L21.3 6 Z" />
          <path d="M6 18 L6.7 20 L9 20.5 L6.7 21 L6 23 L5.3 21 L3 20.5 L5.3 20 Z" />
        </svg>
      );
  }
}

/* ─────────────────── ToolCard ───────────────────
   Refonte "tout public" : icône explicite + titre direct + desc concrète.
   Hiérarchie visuelle : cards `featured` (Scanner + Créer une tenue)
   reçoivent un fond cream, bordure ink, label Mojo et icône plus grande.
   ───────────────────────────────────────────────────── */
function ToolCard(props: {
  title: string; desc: string; href: string; colors: string[];
  icon: IconKind; kind: string; featured?: boolean;
  /** URL photo Unsplash ou /public — affichée en hero de la card.
      Quand fournie : prend la place du bandeau palette pur (qui devient
      une fine bande de 3 chips en bas du photo). Quand omise : bandeau
      palette classique avec icône médaillon centrale (rendu legacy). */
  photoUrl?: string;
}) {
  const accent = props.colors[0] || ink;
  return (
    <Link href={props.href} style={{ textDecoration: "none", color: ink }}>
      <article className="wada-lift wada-tool-card" style={{
        background: props.featured ? cardBg : paper,
        border: `1px solid ${props.featured ? ink : border}`,
        borderRadius: cardRadius,
        overflow: "hidden", height: "100%",
        display: "flex", flexDirection: "column",
        position: "relative",
        ["--accent" as string]: accent,
      } as React.CSSProperties}>
        {/* Photo hero (si photoUrl) — paysage 4:3, icône médaillon en
            haut-gauche en overlay. Sinon bandeau palette pur. */}
        {props.photoUrl ? (
          <div style={{
            position: "relative",
            aspectRatio: "4 / 3",
            backgroundImage: `linear-gradient(rgba(31,27,22,0.0), rgba(31,27,22,0.1)), url("${props.photoUrl}")`,
            backgroundSize: "cover", backgroundPosition: "center",
            background: `linear-gradient(rgba(31,27,22,0.0), rgba(31,27,22,0.1)), ${accent} url("${props.photoUrl}") center/cover`,
          }}>
            {/* Médaillon icône — top-left, signature WADA */}
            <div style={{
              position: "absolute", top: 12, left: 12,
              width: 32, height: 32,
              background: paper, border: `1px solid ${ink}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--wada-shadow-1)",
            }}>
              <ToolIcon kind={props.icon} size={16} color={ink} />
            </div>
            {/* Bande palette fine en bas du photo (3 chips, signature WADA) */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              display: "flex", height: 6,
            }}>
              {props.colors.slice(0, 3).map((c, i) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", height: 88, position: "relative" }}>
            {props.colors.slice(0, 5).map((c, i) => (
              <div key={i} style={{ flex: 1, background: c }} />
            ))}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: props.featured ? 60 : 52,
              height: props.featured ? 60 : 52,
              background: paper,
              border: `1px solid ${ink}`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--wada-shadow-2)",
            }}>
              <ToolIcon kind={props.icon} size={props.featured ? 30 : 26} color={ink} />
            </div>
          </div>
        )}

        <div style={{ padding: "24px 22px 22px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {/* Micro-catégorie — vise "tout public" : descripteur direct, pas abstrait */}
          <p style={{
            fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.32em", textTransform: "uppercase",
            color: props.featured ? mojo : subtle, margin: 0,
          }}>
            {props.kind}
          </p>

          <h3 className="wada-text-lift" style={{
            fontFamily: fontHeading, fontSize: props.featured ? 26 : 22, fontWeight: 500,
            lineHeight: 1.15, letterSpacing: "-0.02em", margin: 0,
            fontStyle: "italic", color: ink,
          }}>
            {props.title}
          </h3>

          <span aria-hidden style={{
            display: "block", width: 28, height: 1,
            background: ink, opacity: 0.4, marginTop: 4, marginBottom: 4,
          }} />

          <p style={{
            fontFamily: fontBody, fontSize: 14, color: textSecondary, margin: 0,
            lineHeight: 1.5, flex: 1, fontStyle: "normal",
          }}>
            {props.desc}
          </p>

          <p style={{
            fontFamily: fontLabel, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em",
            textTransform: "uppercase", color: props.featured ? mojo : ink, margin: "12px 0 0",
            display: "inline-flex", alignItems: "center", gap: 10,
          }}>
            <span>Ouvrir</span>
            <span aria-hidden style={{ fontSize: 13, letterSpacing: 0, transition: "transform 0.2s" }}>→</span>
          </p>
        </div>

        <span aria-hidden className="wada-tool-card-underline" style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: 3, background: accent,
          transform: "scaleX(0)", transformOrigin: "left center",
          transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }} />
      </article>
    </Link>
  );
}

/* ─────────────────── Pagination de clôture ─────────────────── */
function Pagination({ current, page, total }: { current: string; page: string; total: string }) {
  return (
    <div style={{
      padding: "48px 5% 80px",
      textAlign: "center",
      borderTop: `1px solid ${border}`,
      background: paper,
    }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 10, fontWeight: 600,
        letterSpacing: "0.5em", textTransform: "uppercase",
        color: subtle, margin: 0,
      }}>
        — {current} · page {page} / {total} —
      </p>
    </div>
  );
}
