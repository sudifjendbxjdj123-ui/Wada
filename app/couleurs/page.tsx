"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { dictionary } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary, cardBg } from "@/lib/styles";
type ColorEntry = {
  hex: string;
  name: string;
  palettes: { number: string; name: string }[];
};

// Calcul de la luminosité pour trier (du clair au foncé)
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function CouleursPage() {
  const [search, setSearch] = useState("");

  const allColors = useMemo<ColorEntry[]>(() => {
    const map = new Map<string, ColorEntry>();
    for (const entry of dictionary) {
      for (const c of entry.colors) {
        const key = c.hex.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { hex: c.hex, name: c.name, palettes: [] });
        }
        map.get(key)!.palettes.push({ number: entry.number, name: entry.name });
      }
    }
    // Tri par luminosité (clair → sombre) pour un dégradé visuel
    return Array.from(map.values()).sort((a, b) => luminance(b.hex) - luminance(a.hex));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allColors;
    return allColors.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.hex.toLowerCase().includes(q)
    );
  }, [allColors, search]);

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <header style={{ textAlign: "center", padding: "80px 0 40px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Index ouvert</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, lineHeight: 1, fontFamily: "'Fredoka', sans-serif" }}>
              Toutes les couleurs<br/>de Sanzo Wada
            </h1>
            <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, maxWidth: 580, margin: "24px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              {allColors.length} teintes uniques utilisées dans nos palettes, classées du clair au foncé.
              Cliquez sur une couleur pour découvrir les palettes qui l'emploient.
            </p>
          </header>

          {/* Recherche */}
          <section style={{ marginBottom: 40, maxWidth: 540, margin: "0 auto 40px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="search"
                placeholder="Chercher par nom (Bordeaux, Indigo…) ou code (#1F1B16)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "14px 44px 14px 18px", fontSize: 14, fontStyle: "italic", fontFamily: "'Inter', sans-serif", border: `1px solid ${border}`, background: cardBg, color: ink, outline: "none" }}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Effacer" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: subtle, fontSize: 16 }}>✕</button>
              )}
            </div>
          </section>

          {/* GRILLE DES COULEURS */}
          <section style={{ marginBottom: 80 }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", padding: 60, color: subtle, fontStyle: "italic" }}>Aucune couleur ne correspond à cette recherche.</p>
            ) : (
              <div className="wada-couleurs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: border, border: `1px solid ${border}` }}>
                {filtered.map((c) => (
                  <details key={c.hex} className="wada-color-cell" style={{ background: paper, position: "relative" }}>
                    <summary style={{ listStyle: "none", cursor: "pointer", display: "block" }}>
                      <div style={{ aspectRatio: "1", background: c.hex, position: "relative", overflow: "hidden", transition: "transform 0.2s ease" }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.transform = "scale(1.04)"; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.transform = "scale(1)"; }}>
                        {/* Overlay info au hover */}
                        <div style={{ position: "absolute", inset: 0, padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)", opacity: 0, transition: "opacity 0.2s ease" }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.opacity = "1"; }}
                          onMouseLeave={(ev) => { ev.currentTarget.style.opacity = "0"; }}>
                          <span style={{ fontSize: 12, color: "white", fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>{c.name}</span>
                          <span style={{ fontSize: 9, color: "white", fontFamily: "'Inter', sans-serif", letterSpacing: "0.1em", opacity: 0.8 }}>{c.hex.toUpperCase()}</span>
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <p style={{ fontSize: 12, color: ink, fontStyle: "italic", margin: 0, fontFamily: "'Inter', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                        <p style={{ fontSize: 9, letterSpacing: "0.1em", color: subtle, margin: "2px 0 0", fontFamily: "'Inter', sans-serif" }}>{c.hex.toUpperCase()} · {c.palettes.length} palette{c.palettes.length > 1 ? "s" : ""}</p>
                      </div>
                    </summary>
                    {/* Liste des palettes contenant cette couleur */}
                    <div style={{ padding: "0 12px 16px", background: cardBg }}>
                      {c.palettes.slice(0, 5).map((p) => (
                        <Link key={p.number} href={`/palette/${p.number}`} style={{ display: "block", fontSize: 11, color: ink, textDecoration: "none", padding: "4px 0", fontStyle: "italic", fontFamily: "'Inter', sans-serif", borderTop: `1px solid ${border}` }}>
                          → {p.name}
                        </Link>
                      ))}
                      {c.palettes.length > 5 && (
                        <p style={{ fontSize: 10, color: subtle, fontStyle: "italic", margin: "6px 0 0", fontFamily: "'Inter', sans-serif" }}>+ {c.palettes.length - 5} autres</p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* À propos */}
          <section style={{ maxWidth: 720, margin: "0 auto 80px", paddingTop: 40, borderTop: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Ressource ouverte</p>
            <p style={{ fontSize: 16, color: textSecondary, lineHeight: 1.7, fontStyle: "italic", fontFamily: "'Inter', sans-serif", margin: "0 0 24px" }}>
              Les noms et combinaisons originaux proviennent du livre A Dictionary of Color Combinations de Sanzo Wada (1933, domaine public au Japon).
              Les noms français sont traduits ou ré-interprétés par WADA selon l'esprit du peintre.
            </p>
            <p style={{ fontSize: 13, color: subtle, fontFamily: "'Inter', sans-serif", fontStyle: "italic" }}>
              Cette page est libre de consultation et de partage. Si vous l'utilisez dans un article, une présentation ou un projet, un lien vers wada.style nous fait plaisir mais n'est pas obligatoire.
            </p>
          </section>

        </div>
              </div>
    </main>
  );
}
