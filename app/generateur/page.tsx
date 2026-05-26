"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { dictionary, cultureLabels, type DictionaryEntry } from "@/lib/data";
import { iconForItem, pieceLabels } from "@/lib/icons";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import { paletteGender, type Gender } from "@/lib/utils";
import PaletteOrganicMoodboard from "@/components/PaletteOrganicMoodboard";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";

type SeasonOpt = "all" | "printemps" | "été" | "automne" | "hiver";
type GenderOpt = "all" | Gender;

/**
 * /generateur — Le bouton magique.
 *
 * Un clic, une tenue. Tire une palette random du dictionnaire selon les
 * filtres optionnels (saison, genre). Affiche l'OutfitAvatar habillé +
 * composition + CTAs (re-générer, voir détail, ajouter au dressing).
 *
 * L'animation de shuffle est gérée via une clé `key` qui change à chaque
 * tirage, ce qui force le Reveal interne à rejouer le fade-up.
 */
export default function GenerateurPage() {
  const [seasonFilter, setSeasonFilter] = useState<SeasonOpt>("all");
  const [genderFilter, setGenderFilter] = useState<GenderOpt>("all");
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [shuffling, setShuffling] = useState(false);

  // Charge les favoris depuis localStorage
  useEffect(() => {
    try {
      const fv = localStorage.getItem("wada-favorites");
      if (fv) setFavorites(JSON.parse(fv));
    } catch {}
  }, []);

  // Pool filtré selon les contraintes
  const pool = useMemo(() => {
    return dictionary.filter((d) => {
      if (seasonFilter !== "all" && !d.seasons.includes(seasonFilter) && !d.seasons.includes("any")) return false;
      if (genderFilter !== "all") {
        const g = paletteGender(d.composition);
        if (genderFilter === "femme" && g === "homme") return false;
        if (genderFilter === "homme" && g === "femme") return false;
        if (genderFilter === "unisexe" && g !== "unisexe") return false;
      }
      return true;
    });
  }, [seasonFilter, genderFilter]);

  // Tire une tenue au hasard dans le pool
  const generate = useCallback(() => {
    if (pool.length === 0) return;
    setShuffling(true);
    // Léger délai pour que l'animation de shuffle se voie
    setTimeout(() => {
      const next = pool[Math.floor(Math.random() * pool.length)];
      setEntry(next);
      setShuffleCount((n) => n + 1);
      setShuffling(false);
    }, 320);
  }, [pool]);

  // Premier tirage automatique au montage
  useEffect(() => {
    if (!entry) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper pour OutfitAvatar
  const piecesFor = (e: DictionaryEntry) => {
    const top    = e.composition.find((c) => c.piece === "Top" || c.piece === "Outer" || c.piece === "Shirt");
    const bottom = e.composition.find((c) => c.piece === "Bottom");
    const shoes  = e.composition.find((c) => c.piece === "Shoes");
    const colorFor = (item?: string) => {
      if (!item) return e.colors[0].hex;
      return (e.colors.find((c) => item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) || e.colors[0]).hex;
    };
    return {
      top:    top    ? { type: iconForItem(top.item, top.piece),       color: colorFor(top.item) }    : undefined,
      bottom: bottom ? { type: iconForItem(bottom.item, bottom.piece), color: colorFor(bottom.item) } : undefined,
      shoes:  shoes  ? { type: iconForItem(shoes.item, shoes.piece),   color: colorFor(shoes.item) }  : undefined,
    };
  };

  const isFav = entry ? favorites.includes(entry.number) : false;
  const toggleFav = () => {
    if (!entry) return;
    const next = isFav ? favorites.filter((n) => n !== entry.number) : [...favorites, entry.number];
    setFavorites(next);
    try { localStorage.setItem("wada-favorites", JSON.stringify(next)); } catch {}
  };

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
      
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* HEADER */}
          <header style={{ textAlign: "center", padding: "80px 0 40px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Générateur de tenues</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.05, fontFamily: "'Fredoka', sans-serif" }}>
              Une tenue,<br />maintenant.
            </h1>
            <p style={{ fontSize: 16, color: textSecondary, fontStyle: "italic", marginTop: 24, maxWidth: 540, margin: "24px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
              Cliquez et Wada vous donne une palette au hasard parmi les 348. Le tirage est instantané — vous portez ce que vous trouvez beau, pas ce que vous avez le temps de chercher.
            </p>
          </header>

          {/* FILTRES — saison + genre */}
          <Reveal>
            <section style={{ marginBottom: 48, paddingBottom: 28, borderBottom: `1px solid ${border}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ ...sectionLabel, marginBottom: 12 }}>Saison</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    {(["all", "printemps", "été", "automne", "hiver"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeasonFilter(s)}
                        className="wada-lift-sm"
                        style={{
                          padding: "8px 16px",
                          border: `1px solid ${seasonFilter === s ? ink : border}`,
                          background: seasonFilter === s ? ink : "transparent",
                          color: seasonFilter === s ? paper : ink,
                          fontSize: 10,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {s === "all" ? "Toutes" : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ width: 1, height: 50, background: border }} />

                <div style={{ textAlign: "center" }}>
                  <p style={{ ...sectionLabel, marginBottom: 12 }}>Pour qui</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                    {([
                      { k: "all" as const,     l: "Tous" },
                      { k: "femme" as const,   l: "Femme" },
                      { k: "homme" as const,   l: "Homme" },
                      { k: "unisexe" as const, l: "Unisexe" },
                    ]).map((g) => (
                      <button
                        key={g.k}
                        onClick={() => setGenderFilter(g.k)}
                        className="wada-lift-sm"
                        style={{
                          padding: "8px 16px",
                          border: `1px solid ${genderFilter === g.k ? ink : border}`,
                          background: genderFilter === g.k ? ink : "transparent",
                          color: genderFilter === g.k ? paper : ink,
                          fontSize: 10,
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: subtle, fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>
                {pool.length} {pool.length > 1 ? "tenues éligibles" : "tenue éligible"} dans le pool
              </p>
            </section>
          </Reveal>

          {/* TIRAGE ─ avatar + composition + CTAs */}
          {entry && (
            <section style={{ marginBottom: 80 }}>
              <div
                key={shuffleCount}
                className="wada-generator-stage"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(280px, 380px) 1fr",
                  gap: 56,
                  alignItems: "center",
                  maxWidth: 920,
                  margin: "0 auto",
                  opacity: shuffling ? 0.3 : 1,
                  transform: shuffling ? "translateY(8px)" : "translateY(0)",
                  transition: "opacity 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)",
                }}
              >
                {/* Moodboard Matisse coraux + Pantone overlay — version complète avec
                    formes organiques (coral, fleur, vague, feuille, splash, blob) */}
                <div style={{ border: `1px solid ${border}`, overflow: "hidden" }}>
                  <PaletteOrganicMoodboard entry={entry} minHeight={460} />
                </div>

                {/* Détail de la palette */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: "0.45em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", fontWeight: 600, margin: "0 0 14px" }}>
                    No. {entry.number}
                  </p>
                  <h2 className="wada-section-title" style={{ fontSize: 34, fontWeight: 500, margin: "0 0 14px", lineHeight: 1.15, fontFamily: "'Fredoka', sans-serif", letterSpacing: "-0.01em" }}>
                    {entry.name}
                  </h2>
                  {entry.culture && (
                    <p style={{ fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: seal, fontFamily: "'Inter', sans-serif", margin: "0 0 22px", fontWeight: 600 }}>
                      {cultureLabels[entry.culture] || entry.culture}
                    </p>
                  )}

                  {/* Bandes de couleurs */}
                  <div className="wada-palette-bands" style={{ display: "flex", height: 56, border: `1px solid ${border}`, marginBottom: 12 }}>
                    {entry.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
                  </div>
                  <p style={{ fontSize: 12, color: subtle, fontStyle: "italic", margin: "0 0 26px", fontFamily: "'Inter', sans-serif" }}>
                    {entry.colors.map((c) => c.name).join(" · ")}
                  </p>

                  {/* Composition résumée */}
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", fontSize: 14, color: textSecondary, fontFamily: "'Inter', sans-serif" }}>
                    {entry.composition.map((c) => (
                      <li key={c.piece + c.item} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: `1px solid ${border}` }}>
                        <span style={{ flexShrink: 0, width: 90, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", fontWeight: 600, paddingTop: 2 }}>
                          {pieceLabels[c.piece] || c.piece}
                        </span>
                        <span style={{ flex: 1, fontStyle: "italic", lineHeight: 1.5 }}>{c.item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTAs */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <button
                      onClick={generate}
                      className="wada-lift-sm"
                      disabled={shuffling}
                      style={{
                        background: ink,
                        color: paper,
                        border: "none",
                        padding: "16px 26px",
                        fontSize: 11,
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        cursor: shuffling ? "wait" : "pointer",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      Une autre
                      <HandArrow size={28} color={paper} />
                    </button>

                    <Link
                      href={`/palette/${entry.number}`}
                      className="wada-lift-sm"
                      style={{
                        color: ink,
                        border: `1px solid ${ink}`,
                        padding: "16px 26px",
                        fontSize: 11,
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      Voir le détail
                    </Link>

                    <button
                      onClick={toggleFav}
                      className="wada-lift-sm"
                      aria-label={isFav ? "Retirer de la garde-robe" : "Ajouter à la garde-robe"}
                      style={{
                        background: isFav ? seal : "transparent",
                        color: isFav ? paper : ink,
                        border: `1px solid ${isFav ? seal : ink}`,
                        padding: "16px 22px",
                        fontSize: 18,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {isFav ? "♥" : "♡"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lien sous-tirage : aller au dressing */}
              <p style={{ textAlign: "center", marginTop: 48, fontSize: 13, color: textSecondary, fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>
                Une fois sauvegardée, retrouvez-la dans{" "}
                <Link href="/favoris" style={{ color: ink, textDecoration: "none" }}>
                  <SketchUnderline>votre dressing</SketchUnderline>
                </Link>
                .
              </p>
            </section>
          )}

        </div>
              </div>
    </main>
  );
}
