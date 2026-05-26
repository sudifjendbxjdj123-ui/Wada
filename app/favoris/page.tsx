"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dictionary, cultureLabels } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import BackButton from "@/components/BackButton";
import PaletteCard from "@/components/PaletteCard";

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fv = localStorage.getItem("wada-favorites");
    if (fv) { try { setFavorites(JSON.parse(fv)); } catch {} }
  }, []);

  const removeFromFavorites = (number: string) => {
    const next = favorites.filter((n) => n !== number);
    setFavorites(next);
    localStorage.setItem("wada-favorites", JSON.stringify(next));
  };

  const clearAll = () => {
    if (confirm("Vider tous les favoris ?")) {
      setFavorites([]);
      localStorage.removeItem("wada-favorites");
    }
  };

  const favPalettes = dictionary.filter((d) => favorites.includes(d.number));

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <BackButton />
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <header style={{ textAlign: "center", padding: "80px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Vos coups de cœur</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, fontStyle: "italic", lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>
              Mes favoris
            </h1>
            {mounted && (
              <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, fontFamily: "'Inter', sans-serif" }}>
                {favPalettes.length} {favPalettes.length > 1 ? "palettes sauvegardées" : favPalettes.length === 0 ? "palette sauvegardée" : "palette sauvegardée"}
              </p>
            )}
          </header>

          {!mounted ? null : favPalettes.length === 0 ? (
            <section style={{ textAlign: "center", padding: "60px 24px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.4)", maxWidth: 600, margin: "0 auto" }}>
              <p style={{ fontSize: 18, fontStyle: "italic", color: textSecondary, marginBottom: 28, fontFamily: "'Inter', sans-serif" }}>
                Vous n'avez pas encore de favoris.
              </p>
              <p style={{ fontSize: 14, color: subtle, fontStyle: "italic", marginBottom: 36, fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                Cliquez sur ♡ sur n'importe quelle palette pour la sauvegarder ici.
              </p>
              <Link href="/palettes" style={{ background: ink, color: paper, padding: "16px 32px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
                Découvrir les palettes →
              </Link>
            </section>
          ) : (
            <>
              <section style={{ marginBottom: 60 }}>
                <div className="wada-palettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                  {favPalettes.map((p) => (
                    <article key={p.number} style={{ position: "relative" }}>
                      <PaletteCard entry={p} />
                      <button onClick={() => removeFromFavorites(p.number)} aria-label="Retirer des favoris" style={{ position: "absolute", top: 14, right: 14, background: paper, border: `1px solid ${border}`, color: seal, fontSize: 18, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.2s ease", zIndex: 5 }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.background = seal; ev.currentTarget.style.color = paper; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.background = paper; ev.currentTarget.style.color = seal; }}>
                        ♥
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: `1px solid ${ink}`, flexWrap: "wrap", gap: 16 }}>
                <button onClick={clearAll} style={{ background: "transparent", border: "none", color: subtle, padding: 0, cursor: "pointer", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                  Tout supprimer
                </button>
                <Link href="/palettes" style={{ background: ink, color: paper, padding: "16px 32px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
                  Découvrir d'autres palettes →
                </Link>
              </div>
            </>
          )}

        </div>
              </div>
    </main>
  );
}
