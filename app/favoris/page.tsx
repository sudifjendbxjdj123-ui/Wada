"use client";
import Link from "next/link";
import { dictionary } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import BackButton from "@/components/BackButton";
import PaletteCard from "@/components/PaletteCard";
/* Brief client 2026-05-26 : unification favoris via useFavorites().
   Avant la page gérait son propre state + localStorage en parallèle de
   PaletteCard → 2 sources de vérité qui pouvaient se désynchroniser.
   Maintenant : 1 hook, sync inter-onglets gratuite, retrait depuis le
   ♡ dans la card propage instantanément. */
import { useFavorites } from "@/hooks/useFavorites";

export default function FavorisPage() {
  const { favorites, clear, hydrated } = useFavorites();

  const clearAll = () => {
    if (confirm("Vider tous les favoris ?")) clear();
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
            {hydrated && (
              <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, fontFamily: "'Inter', sans-serif" }}>
                {favPalettes.length} {favPalettes.length > 1 ? "palettes sauvegardées" : favPalettes.length === 0 ? "palette sauvegardée" : "palette sauvegardée"}
              </p>
            )}
          </header>

          {!hydrated ? null : favPalettes.length === 0 ? (
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
                {/* Brief client 2026-05-26 : le ♡ favori est maintenant
                    intégré dans PaletteCard (top-right des bandes, rond
                    cream → bordeaux quand actif). Plus besoin du bouton
                    « ♥ retirer » externe — un clic sur le ♡ dans la card
                    retire la palette des favoris (re-render auto via
                    useFavorites() qui écoute le storage). */}
                <div className="wada-palettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                  {favPalettes.map((p) => (
                    <PaletteCard key={p.number} entry={p} />
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
