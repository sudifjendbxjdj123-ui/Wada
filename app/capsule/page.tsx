"use client";
/**
 * /capsule — La garde-robe capsule WADA
 *
 * Inventaire éditorial de 121 pièces (67 femme, 54 homme) curées dans
 * l'esprit quiet luxury / minimal / capsule wardrobe. Lecture du catalogue
 * depuis `lib/capsuleWardrobe.ts`.
 *
 * Sections :
 *   1. Hero éditorial (image source dossier pour HABITS.png en miniature)
 *   2. 5 Tenues capsule curées (presets composés par stylist Claude)
 *   3. Catalogue complet groupé par catégorie + filtres genre/occasion
 *
 * Cette page sert de "référentiel WADA" — pas de scoring dynamique,
 * juste un dressing fixe que le client peut explorer.
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CAPSULE_WARDROBE, CAPSULE_OUTFITS, CAPSULE_TOTAL,
  CATEGORY_ORDER, CATEGORY_LABELS_FR,
  itemById, type CapsuleItem, type ItemCategory,
} from "@/lib/capsuleWardrobe";
import {
  ink, paper, subtle, border, mojo, seal,
  textSecondary, fontHeading, fontBody, fontLabel,
  cardRadius, sectionLabel,
} from "@/lib/styles";
import Reveal from "@/components/Reveal";

/* Map couleur EN → swatch hex pour l'affichage. */
const COLOR_SWATCH: Record<string, string> = {
  black:  "#1F1B16",
  white:  "#F4EFE6",
  cream:  "#EDE5D4",
  beige:  "#C7B299",
  grey:   "#9B9B9B",
  brown:  "#6B4F3A",
  indigo: "#2A3A55",
  blue:   "#7A95B3",
  gold:   "#C9A24A",
  silver: "#B8B8B8",
};

type GenderFilter = "tous" | "femme" | "homme";

export default function CapsulePage() {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("tous");
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "tous">("tous");

  /* Items filtrés selon genre + catégorie */
  const filteredItems = useMemo(() => {
    return CAPSULE_WARDROBE.filter((item) => {
      if (genderFilter !== "tous" && item.gender !== genderFilter && item.gender !== "unisexe") return false;
      if (activeCategory !== "tous" && item.category !== activeCategory) return false;
      return true;
    });
  }, [genderFilter, activeCategory]);

  /* Items groupés par catégorie pour le rendu */
  const itemsByCategory = useMemo(() => {
    const groups: Record<string, CapsuleItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
      
      {/* Retour atelier */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 5% 0" }}>
        <Link href="/atelier" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          color: ink, textDecoration: "none",
          fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          padding: "8px 14px", border: `1px solid ${border}`, borderRadius: 999,
          background: "rgba(255,255,255,0.6)",
        }}>
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          HERO ÉDITORIAL — annonce de la capsule wardrobe + total items
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "56px 5% 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: mojo, fontWeight: 700, letterSpacing: "0.4em", marginBottom: 22 }}>
              La garde-robe WADA
            </p>
            <h1 style={{
              fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
              fontSize: "clamp(40px, 6.5vw, 76px)", margin: "0 0 22px",
              letterSpacing: "-0.02em", color: ink, lineHeight: 1.04,
            }}>
              La capsule essentielle
            </h1>
            <p style={{
              fontFamily: fontBody, fontStyle: "italic", fontSize: 20,
              color: textSecondary, lineHeight: 1.55,
              maxWidth: 620, margin: "0 auto 32px",
            }}>
              {CAPSULE_TOTAL} pièces curées dans l'esprit quiet luxury — chacune choisie pour
              composer le maximum de tenues avec le minimum d'éléments.
            </p>
            <div style={{ display: "inline-flex", gap: 6, marginTop: 8 }}>
              {["#1F1B16", "#EDE5D4", "#C7B299", "#9B9B9B", "#6B4F3A", "#2A3A55"].map((c) => (
                <span key={c} style={{
                  width: 18, height: 18, borderRadius: "50%", background: c,
                  border: `1px solid rgba(0,0,0,0.1)`,
                }} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          5 TENUES CAPSULE — presets curated par stylist Claude
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "48px 5% 32px", background: "rgba(196,78,58,0.03)", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 48px" }}>
              <p style={{ ...sectionLabel, color: mojo, fontWeight: 700, letterSpacing: "0.35em", marginBottom: 16 }}>
                Tenues curated
              </p>
              <h2 style={{
                fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 14px",
                letterSpacing: "-0.015em", lineHeight: 1.1, color: ink,
              }}>
                Cinq compositions, un même langage
              </h2>
              <p style={{
                fontFamily: fontBody, fontStyle: "italic", fontSize: 16,
                color: textSecondary, lineHeight: 1.6, margin: 0,
              }}>
                Cinq tenues complètes recomposées depuis la garde-robe. Quiet luxury,
                trois couleurs max par look, deux matières par silhouette.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}>
              {CAPSULE_OUTFITS.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CATALOGUE — filtres + grille par catégorie
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "64px 5% 32px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{ ...sectionLabel, color: mojo, fontWeight: 700, letterSpacing: "0.35em", marginBottom: 14 }}>
                Inventaire complet
              </p>
              <h2 style={{
                fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
                fontSize: "clamp(28px, 4vw, 40px)", margin: 0,
                letterSpacing: "-0.015em", color: ink,
              }}>
                {filteredItems.length} pièces
              </h2>
            </div>

            {/* Filtres genre */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 8,
              marginBottom: 18, flexWrap: "wrap",
            }}>
              {(["tous", "femme", "homme"] as GenderFilter[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  style={{
                    padding: "8px 18px",
                    background: genderFilter === g ? ink : "transparent",
                    color: genderFilter === g ? paper : ink,
                    border: `1px solid ${genderFilter === g ? ink : border}`,
                    borderRadius: 999,
                    fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
                    letterSpacing: "0.2em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  {g === "tous" ? "Tous" : g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>

            {/* Filtres catégorie */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 6,
              marginBottom: 40, flexWrap: "wrap",
            }}>
              <button
                type="button"
                onClick={() => setActiveCategory("tous")}
                style={chipFilterStyle(activeCategory === "tous")}
              >
                Toutes catégories
              </button>
              {CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={chipFilterStyle(activeCategory === cat)}
                >
                  {CATEGORY_LABELS_FR[cat]}
                </button>
              ))}
            </div>

            {/* Grille items, groupés par catégorie */}
            {CATEGORY_ORDER.map((cat) => {
              const items = itemsByCategory[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat} style={{ marginBottom: 48 }}>
                  <h3 style={{
                    fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
                    fontSize: 26, margin: "0 0 18px", letterSpacing: "-0.01em", color: ink,
                  }}>
                    {CATEGORY_LABELS_FR[cat]}
                    <span style={{
                      fontFamily: fontLabel, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.2em", textTransform: "uppercase",
                      color: subtle, marginLeft: 14,
                    }}>
                      {items.length}
                    </span>
                  </h3>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 14,
                  }}>
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

          </main>
  );
}

/* ─────────────────── OutfitCard ───────────────────
   Carte tenue capsule : items composant la tenue avec leurs couleurs.
   ───────────────────────────────────────────────── */
function OutfitCard({ outfit }: { outfit: typeof CAPSULE_OUTFITS[0] }) {
  const items = outfit.items.map(itemById).filter(Boolean) as CapsuleItem[];
  return (
    <article style={{
      background: paper,
      border: `1px solid ${border}`,
      borderRadius: cardRadius,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      boxShadow: "0 6px 18px rgba(31,27,22,0.06)",
    }}>
      {/* Visuel = grille de swatches couleurs des items */}
      <div style={{
        aspectRatio: "5 / 3",
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`,
        gridAutoRows: "1fr",
      }}>
        {items.slice(0, 8).map((item, i) => (
          <div key={i} style={{
            background: COLOR_SWATCH[item.color] || "#888",
          }} />
        ))}
      </div>
      {/* Contenu textuel */}
      <div style={{ padding: "22px 22px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <p style={{
            fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.3em", textTransform: "uppercase",
            color: mojo, margin: 0,
          }}>
            {outfit.gender === "femme" ? "♀ Femme" : outfit.gender === "homme" ? "♂ Homme" : "Unisexe"} · {outfit.occasion}
          </p>
        </div>
        <h3 style={{
          fontFamily: fontHeading, fontStyle: "italic", fontWeight: 500,
          fontSize: 22, color: ink, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2,
        }}>
          {outfit.name}
        </h3>
        <p style={{
          fontFamily: fontLabel, fontSize: 10, fontWeight: 500,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: subtle, margin: 0,
        }}>
          Concept : {outfit.concept}
        </p>
        <p style={{
          fontFamily: fontBody, fontStyle: "italic", fontSize: 14,
          color: textSecondary, margin: "4px 0 12px", lineHeight: 1.55,
        }}>
          {outfit.story}
        </p>
        {/* Liste items */}
        <ul style={{
          listStyle: "none", padding: 0, margin: 0,
          display: "flex", flexDirection: "column", gap: 5,
        }}>
          {items.map((item) => (
            <li key={item.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              fontFamily: fontBody, fontSize: 13, color: ink,
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%",
                background: COLOR_SWATCH[item.color] || "#888",
                border: `1px solid ${border}`, flexShrink: 0,
              }} />
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/* ─────────────────── ItemCard ───────────────────
   Carte item individuel : swatch couleur + nom + matière + fit.
   ───────────────────────────────────────────────── */
function ItemCard({ item }: { item: CapsuleItem }) {
  const swatch = COLOR_SWATCH[item.color] || "#888";
  return (
    <article style={{
      background: paper,
      border: `1px solid ${border}`,
      borderRadius: 12,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        aspectRatio: "1 / 1",
        background: swatch,
        position: "relative",
      }}>
        {/* Badge gender corner */}
        <span style={{
          position: "absolute", top: 8, right: 8,
          padding: "3px 7px",
          background: paper, color: ink,
          fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.15em", textTransform: "uppercase",
          borderRadius: 4,
          opacity: 0.92,
        }}>
          {item.gender === "femme" ? "♀" : item.gender === "homme" ? "♂" : "U"}
        </span>
      </div>
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{
          fontFamily: fontLabel, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.25em", textTransform: "uppercase",
          color: subtle, margin: 0,
        }}>
          {item.color_fr}
        </p>
        <p style={{
          fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
          fontSize: 14, color: ink, margin: 0, lineHeight: 1.3,
        }}>
          {item.name}
        </p>
        <p style={{
          fontFamily: fontBody, fontSize: 11,
          color: textSecondary, margin: "2px 0 0", letterSpacing: 0,
        }}>
          {item.material_guess}
        </p>
      </div>
    </article>
  );
}

/* Style pour les chips filtres catégorie. */
function chipFilterStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: active ? mojo : "transparent",
    color: active ? paper : textSecondary,
    border: `1px solid ${active ? mojo : border}`,
    borderRadius: 999,
    fontFamily: fontLabel, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.15em", textTransform: "uppercase",
    cursor: "pointer", transition: "all 0.2s ease",
  };
}
