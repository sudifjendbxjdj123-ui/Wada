"use client";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { dictionary, cultureLabels, type DictionaryEntry } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import { iconForItem } from "@/lib/icons";
import { avatarVariationFor } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import OutfitAvatar from "@/components/OutfitAvatar";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";

type Season = "all" | "printemps" | "été" | "automne" | "hiver";

/**
 * /garde-robe — Garde-robe digitale.
 *
 * Le dressing virtuel : chaque palette favorite devient une "tenue" rangée
 * dans l'armoire. Lit `wada-favorites` en localStorage. Pour chaque entrée,
 * un OutfitAvatar habillé est rendu, avec le nom et la culture. Filtres :
 * toutes / par saison. Empty state qui invite à explorer le catalogue.
 */
export default function GardeRobePage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [seasonFilter, setSeasonFilter] = useState<Season>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const fv = localStorage.getItem("wada-favorites");
      if (fv) setFavorites(JSON.parse(fv));
    } catch {}
  }, []);

  const remove = (num: string) => {
    const next = favorites.filter((n) => n !== num);
    setFavorites(next);
    localStorage.setItem("wada-favorites", JSON.stringify(next));
  };

  const clearAll = () => {
    if (typeof window !== "undefined" && confirm("Vider toute la garde-robe ?")) {
      setFavorites([]);
      localStorage.removeItem("wada-favorites");
    }
  };

  // Récupère les entrées du dictionnaire correspondant aux favoris
  const entries = useMemo<DictionaryEntry[]>(
    () => favorites.map((num) => dictionary.find((d) => d.number === num)).filter(Boolean) as DictionaryEntry[],
    [favorites],
  );

  const filtered = useMemo(
    () => seasonFilter === "all"
      ? entries
      : entries.filter((e) => e.seasons.includes(seasonFilter) || e.seasons.includes("any")),
    [entries, seasonFilter],
  );

  // Helper : extrait les pièces principales d'une palette pour OutfitAvatar
  const piecesFor = (entry: DictionaryEntry) => {
    const top    = entry.composition.find((c) => c.piece === "Top" || c.piece === "Outer" || c.piece === "Shirt");
    const bottom = entry.composition.find((c) => c.piece === "Bottom");
    const shoes  = entry.composition.find((c) => c.piece === "Shoes");
    const colorFor = (item?: string) => {
      if (!item) return entry.colors[0].hex;
      return (entry.colors.find((c) => item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) || entry.colors[0]).hex;
    };
    return {
      top:    top    ? { type: iconForItem(top.item, top.piece),       color: colorFor(top.item) }    : undefined,
      bottom: bottom ? { type: iconForItem(bottom.item, bottom.piece), color: colorFor(bottom.item) } : undefined,
      shoes:  shoes  ? { type: iconForItem(shoes.item, shoes.piece),   color: colorFor(shoes.item) }  : undefined,
    };
  };

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <BackButton />

      {/* ═══ Bandeau moodboard-6 (portant de vêtements lin) — brief 2026-05-24
              Image décorative qui « littéralement » illustre un dressing.
              Voile sombre 25,22,18 .45→.72 + texte cream → lisibilité garantie. */}
      <section
        aria-hidden
        className="wada-media-bg wada-fade-to-beige"
        style={{
          height: 260,
          marginBottom: 32,
          // @ts-ignore CSS var
          "--media-image": "url(/hero/moodboard-6.webp)",
        } as React.CSSProperties}
      >
        <div className="wada-media-scrim" />
        <div className="wada-media-content" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", padding: "0 24px", textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'Fredoka', sans-serif",
            color: "#F4EFE7", fontSize: "clamp(22px, 4vw, 32px)",
            margin: 0, fontWeight: 700, letterSpacing: "0.01em",
            textShadow: "0 2px 12px rgba(0,0,0,.4)",
          }}>
            Votre garde-robe — du lin, des couleurs, des accords.
          </p>
        </div>
      </section>

      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          // Voile crème opaque + flou pour rendre tout le contenu garde-robe
          // parfaitement lisible au-dessus de la vidéo de fond.
          background: "rgba(244,239,230,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 16,
          padding: "40px 32px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        }}>

          {/* HEADER — texte sombre lisible sur la card crème */}
          <header style={{ textAlign: "center", padding: "40px 0 32px" }}>
            <p style={{
              ...sectionLabel, marginBottom: 18, color: seal,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.45em",
            }}>
              Garde-robe digitale
            </p>
            <h1 className="wada-hero-title" style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 400, letterSpacing: "-0.02em",
              margin: 0, lineHeight: 1.05, color: ink,
            }}>
              Votre dressing.
            </h1>
            {/* Sous-texte clarifié : on explique CONCRÈTEMENT à quoi sert cette page */}
            <p style={{
              fontSize: 16, color: ink, fontFamily: "'Inter', sans-serif",
              lineHeight: 1.65, maxWidth: 580, margin: "20px auto 0",
              opacity: 0.85,
            }}>
              {mounted && entries.length > 0
                ? <><strong style={{ fontWeight: 600, fontStyle: "normal", color: seal }}>{entries.length} {entries.length > 1 ? "tenues sauvegardées" : "tenue sauvegardée"}</strong>{" "}— vos palettes favorites rangées ici, prêtes à reprendre.</>
                : <>👉 Chaque palette que vous <strong style={{ fontWeight: 600, fontStyle: "normal", color: seal }}>mettez en favori</strong> (cœur ♥) sur le site vient automatiquement se ranger ici, comme une tenue dans votre armoire.</>}
            </p>
          </header>

          {/* État vide — instructions step-by-step super claires */}
          {mounted && entries.length === 0 ? (
            <Reveal>
              <section style={{
                maxWidth: 720, margin: "40px auto 60px",
                padding: "48px 40px",
                background: "#FFFFFF",
                border: `1px solid ${border}`,
                borderRadius: 16,
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}>
                <p style={{ ...sectionLabel, color: seal, marginBottom: 14, fontWeight: 700, letterSpacing: "0.4em" }}>
                  Armoire vide
                </p>
                <h2 style={{
                  fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 500,
                  margin: "0 0 14px", color: ink, letterSpacing: "-0.015em",
                  lineHeight: 1.2,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  Comment ranger vos premières tenues ici ?
                </h2>

                {/* Mini guide en 3 étapes — UX la plus claire pour onboarder */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16, margin: "28px 0 32px",
                  textAlign: "left",
                }}>
                  {[
                    { n: "1", t: "Ouvrez le catalogue", d: "Parcourez les 348 palettes Sanzo Wada" },
                    { n: "2", t: "Cliquez sur ♡", d: "Sur chaque palette que vous aimez" },
                    { n: "3", t: "Tout revient ici", d: "Vos favoris s'affichent dans cette page" },
                  ].map((step) => (
                    <div key={step.n} style={{
                      padding: "16px 18px",
                      background: "#FAF7F1",
                      borderRadius: 10,
                      border: `1px solid ${border}`,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: seal, color: paper,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700,
                        marginBottom: 10,
                      }}>
                        {step.n}
                      </div>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
                        margin: "0 0 4px", color: ink,
                      }}>
                        {step.t}
                      </p>
                      <p style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 13,
                        margin: 0, color: textSecondary, lineHeight: 1.4,
                      }}>
                        {step.d}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/palettes"
                  className="wada-lift-sm"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: ink, color: paper,
                    padding: "14px 28px",
                    fontSize: 12, letterSpacing: "0.25em", textTransform: "uppercase",
                    textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    borderRadius: 999,
                  }}
                >
                  Voir les 348 palettes
                  <HandArrow size={20} color={paper} />
                </Link>
              </section>
            </Reveal>
          ) : mounted && (
            <>
              {/* FILTRES SAISON */}
              <section style={{ marginBottom: 48, paddingBottom: 24, borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["all", "printemps", "été", "automne", "hiver"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeasonFilter(s)}
                        className="wada-lift-sm"
                        style={{
                          padding: "8px 18px",
                          border: `1px solid ${seasonFilter === s ? ink : border}`,
                          background: seasonFilter === s ? ink : "transparent",
                          color: seasonFilter === s ? paper : ink,
                          fontSize: 10,
                          letterSpacing: "0.3em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {s === "all" ? "Toutes les saisons" : s}
                      </button>
                    ))}
                  </div>
                  <button onClick={clearAll} style={{ background: "transparent", border: "none", color: subtle, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", cursor: "pointer", padding: 0 }}>
                    Vider l'armoire
                  </button>
                </div>
                <p style={{ marginTop: 18, fontSize: 12, color: subtle, fontFamily: "'Inter', sans-serif" }}>
                  {filtered.length} {filtered.length > 1 ? "tenues" : "tenue"} {seasonFilter !== "all" && `pour ${seasonFilter}`}
                </p>
              </section>

              {/* GRILLE DRESSING */}
              <section style={{ marginBottom: 100 }}>
                {filtered.length === 0 ? (
                  <p style={{ textAlign: "center", padding: 60, color: subtle, fontFamily: "'Inter', sans-serif" }}>
                    Aucune tenue ne correspond à cette saison dans votre armoire.
                  </p>
                ) : (
                  <div className="wada-garde-robe-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                    {filtered.map((entry) => {
                      const p = piecesFor(entry);
                      return (
                        <article
                          key={entry.number}
                          className="wada-lift"
                          style={{
                            background: paper,
                            border: `1px solid ${border}`,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          {/* Bouton retirer en coin */}
                          <button
                            onClick={(e) => { e.preventDefault(); remove(entry.number); }}
                            aria-label="Retirer de la garde-robe"
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              zIndex: 2,
                              background: "transparent",
                              border: "none",
                              color: subtle,
                              fontSize: 20,
                              cursor: "pointer",
                              lineHeight: 1,
                              padding: 4,
                            }}
                          >
                            ✕
                          </button>

                          <Link href={`/palette/${entry.number}`} style={{ textDecoration: "none", color: ink, display: "flex", flexDirection: "column", flex: 1 }}>
                            {/* Bandes de couleurs en haut */}
                            <div className="wada-palette-bands" style={{ display: "flex", height: 40 }}>
                              {entry.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
                            </div>

                            {/* Avatar habillé — variation déterministe par palette
                                (coupe / peau / morphologie variées selon culture + composition) */}
                            {(() => {
                              const v = avatarVariationFor(entry);
                              return (
                                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 8px", background: paper, minHeight: 260 }}>
                                  <OutfitAvatar
                                    height={240}
                                    top={p.top}
                                    bottom={p.bottom}
                                    shoes={p.shoes}
                                    hairStyle={v.hairStyle}
                                    skinTone={v.skinTone}
                                    morphology={v.morphology}
                                  />
                                </div>
                              );
                            })()}

                            {/* Pied — nom + culture */}
                            <div style={{ padding: "14px 18px 18px", textAlign: "center", borderTop: `1px solid ${border}`, background: "rgba(255, 255, 255, 0.5)" }}>
                              <p style={{ fontSize: 9, letterSpacing: "0.4em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "0 0 6px", fontWeight: 600 }}>
                                No. {entry.number}
                              </p>
                              <h3 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px", lineHeight: 1.2, fontFamily: "'Fredoka', sans-serif" }}>
                                {entry.name}
                              </h3>
                              {entry.culture && (
                                <p style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: 0 }}>
                                  {cultureLabels[entry.culture] || entry.culture}
                                </p>
                              )}
                            </div>
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* CTA : explorer pour ajouter plus */}
              <section style={{ textAlign: "center", margin: "60px 0 80px" }}>
                <p style={{ ...sectionLabel, color: subtle, marginBottom: 20 }}>Encore une envie</p>
                <Link href="/palettes" className="wada-lift-sm" style={{ display: "inline-flex", alignItems: "center", gap: 14, color: ink, fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                  <SketchUnderline>Ajouter d'autres tenues</SketchUnderline>
                  <HandArrow size={32} />
                </Link>
              </section>
            </>
          )}

          {!mounted && (
            <div style={{ minHeight: 400 }} aria-hidden="true" />
          )}

        </div>
              </div>
    </main>
  );
}
