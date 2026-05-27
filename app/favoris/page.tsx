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
/* Brief 2026-05-26 « ameliore tout le reste possible » : section
   « Mes tenues » avec les outfits sauvegardés depuis /stylist. */
import { useSavedOutfits, type SavedOutfit } from "@/hooks/useSavedOutfits";

export default function FavorisPage() {
  const { favorites, clear, hydrated } = useFavorites();
  const { outfits, remove: removeOutfit, hydrated: outfitsHydrated } = useSavedOutfits();

  const clearAll = () => {
    if (confirm("Vider toutes les palettes favorites ?")) clear();
  };

  const favPalettes = dictionary.filter((d) => favorites.includes(d.number));

  const totalCount = favPalettes.length + outfits.length;

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <BackButton />
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <header style={{ textAlign: "center", padding: "80px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Vos coups de cœur</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, lineHeight: 1, fontFamily: "'Fredoka', sans-serif" }}>
              Mes favoris
            </h1>
            {hydrated && outfitsHydrated && (
              <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, fontFamily: "'Inter', sans-serif" }}>
                {favPalettes.length > 0 && `${favPalettes.length} palette${favPalettes.length > 1 ? "s" : ""}`}
                {favPalettes.length > 0 && outfits.length > 0 && " · "}
                {outfits.length > 0 && `${outfits.length} tenue${outfits.length > 1 ? "s" : ""} gardée${outfits.length > 1 ? "s" : ""}`}
                {totalCount === 0 && "Rien pour l'instant"}
              </p>
            )}
          </header>

          {!hydrated || !outfitsHydrated ? null : totalCount === 0 ? (
            <section style={{ textAlign: "center", padding: "60px 24px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.4)", maxWidth: 600, margin: "0 auto" }}>
              <p style={{ fontSize: 18, fontStyle: "italic", color: textSecondary, marginBottom: 28, fontFamily: "'Inter', sans-serif" }}>
                Vous n&apos;avez pas encore de favoris.
              </p>
              <p style={{ fontSize: 14, color: subtle, fontStyle: "italic", marginBottom: 36, fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                Cliquez sur ♡ sur une palette, ou « Garder cette tenue » dans le styliste.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/palettes" style={{ background: ink, color: paper, padding: "16px 32px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
                  Découvrir les palettes →
                </Link>
                <Link href="/stylist" style={{ background: "transparent", color: ink, border: `1px solid ${border}`, padding: "16px 32px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
                  Composer une tenue →
                </Link>
              </div>
            </section>
          ) : (
            <>
              {/* ═══════════ SECTION PALETTES ═══════════ */}
              {favPalettes.length > 0 && (
                <section style={{ marginBottom: 60 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <p style={{ ...sectionLabel, margin: 0, color: seal }}>Palettes</p>
                    <div style={{ flex: 1, height: 1, background: border }} />
                    <span style={{ fontSize: 11, color: subtle, fontStyle: "italic" }}>{favPalettes.length}</span>
                  </div>
                  <div className="wada-palettes-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                    {favPalettes.map((p) => (
                      <PaletteCard key={p.number} entry={p} />
                    ))}
                  </div>
                </section>
              )}

              {/* ═══════════ SECTION TENUES GARDÉES ═══════════
                  Brief 2026-05-26 : tenues sauvegardées via le chip
                  « Garder cette tenue » du /stylist. Affichage card
                  avec nom_tenue + mini-bandes accord + 5 pastilles
                  pièces + ✕ pour retirer. */}
              {outfits.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                    <p style={{ ...sectionLabel, margin: 0, color: seal }}>Mes tenues</p>
                    <div style={{ flex: 1, height: 1, background: border }} />
                    <span style={{ fontSize: 11, color: subtle, fontStyle: "italic" }}>{outfits.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {outfits.map((o) => (
                      <SavedOutfitCard key={o.id} outfit={o} onRemove={() => removeOutfit(o.id)} />
                    ))}
                  </div>
                </section>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: `1px solid ${ink}`, flexWrap: "wrap", gap: 16 }}>
                {favPalettes.length > 0 && (
                  <button onClick={clearAll} style={{ background: "transparent", border: "none", color: subtle, padding: 0, cursor: "pointer", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
                    Vider les palettes
                  </button>
                )}
                <Link href="/stylist" style={{ background: ink, color: paper, padding: "16px 32px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
                  Composer une nouvelle tenue →
                </Link>
              </div>
            </>
          )}

        </div>
              </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   SavedOutfitCard — card d'une tenue gardée
   ──────────────────────────────────────────────────────────────────────
   Affiche : kicker LA TENUE + nom Fredoka, mini-bandes de l'accord
   (cliquable → /palette/[ref]), liste des 5 pièces en pastilles avec
   type + couleur réelle, bouton ✕ pour retirer.
   ────────────────────────────────────────────────────────────────────── */
function SavedOutfitCard({ outfit, onRemove }: { outfit: SavedOutfit; onRemove: () => void }) {
  const palette = {
    cream: "#FBF9F5",
    bordeaux: "#6B3A32",
    ink: "#1E1E1E",
    inkSoft: "#6a6259",
    line: "rgba(30,30,30,.10)",
  };

  /* Relative time : « il y a 2h », « hier », « 12 mars »… */
  const relativeTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
    return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  return (
    <article style={{
      position: "relative",
      background: palette.cream,
      border: `1px solid ${palette.line}`,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 6px 22px rgba(30,30,30,.06)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Bouton ✕ retirer — top right */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer cette tenue"
        title="Retirer cette tenue"
        style={{
          position: "absolute",
          top: 12, right: 12,
          width: 28, height: 28,
          borderRadius: "50%",
          border: `1px solid ${palette.line}`,
          background: palette.cream,
          color: palette.inkSoft,
          fontSize: 14,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1,
          zIndex: 2,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = palette.bordeaux;
          e.currentTarget.style.color = palette.bordeaux;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = palette.line;
          e.currentTarget.style.color = palette.inkSoft;
        }}
      >
        ✕
      </button>

      {/* Mini-bandes accord — cliquables si on a une ref */}
      {outfit.accordColors.length > 0 && (
        outfit.accordRef ? (
          <Link href={`/palette/${outfit.accordRef}`} style={{
            display: "flex",
            height: 56,
            textDecoration: "none",
          }}>
            {outfit.accordColors.slice(0, 5).map((c, i) => (
              <span
                key={i}
                title={c.name}
                style={{ flex: 1, background: c.hex }}
                aria-hidden="true"
              />
            ))}
          </Link>
        ) : (
          <div style={{ display: "flex", height: 56 }}>
            {outfit.accordColors.slice(0, 5).map((c, i) => (
              <span
                key={i}
                title={c.name}
                style={{ flex: 1, background: c.hex }}
                aria-hidden="true"
              />
            ))}
          </div>
        )
      )}

      <div style={{ padding: "18px 20px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Kicker LA TENUE */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 9, letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: palette.bordeaux, fontWeight: 600,
          margin: 0,
        }}>
          La tenue
        </p>

        {/* Nom de la tenue */}
        <h3 style={{
          fontFamily: "'Fredoka', sans-serif", fontWeight: 600,
          fontSize: 20, color: palette.ink,
          margin: "4px 0 6px", lineHeight: 1.15,
          letterSpacing: "-0.005em",
        }}>
          {outfit.nomTenue}
        </h3>

        {/* Accord ref + nom */}
        {outfit.accordRef && outfit.accordName && (
          <p style={{
            fontSize: 12, color: palette.inkSoft,
            margin: "0 0 12px", fontStyle: "italic",
          }}>
            Sanzo Wada No. {outfit.accordRef} · {outfit.accordName}
          </p>
        )}

        {/* Liste des 5 pièces en pastilles compactes */}
        <ul style={{
          listStyle: "none", padding: 0, margin: "8px 0 0",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          {outfit.pieces.map((p, i) => (
            <li key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 12, lineHeight: 1.3,
            }}>
              <span
                aria-hidden
                style={{
                  display: "inline-block",
                  width: 10, height: 10, borderRadius: "50%",
                  background: p.hex,
                  boxShadow: "0 0 0 1px rgba(30,30,30,.12)",
                  flexShrink: 0,
                }}
              />
              <span style={{
                color: p.ancre ? palette.bordeaux : palette.ink,
                fontWeight: p.ancre ? 600 : 500,
                fontSize: 11, letterSpacing: "0.04em",
                textTransform: "uppercase",
                minWidth: 70,
              }}>
                {p.role}
              </span>
              <span style={{
                color: palette.inkSoft, flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {p.type}
              </span>
            </li>
          ))}
        </ul>

        {/* Footer : relative time */}
        <p style={{
          marginTop: 16, paddingTop: 12,
          borderTop: `1px solid ${palette.line}`,
          fontSize: 10, color: palette.inkSoft,
          letterSpacing: "0.04em",
        }}>
          Gardée {relativeTime(outfit.savedAt)}
        </p>
      </div>
    </article>
  );
}
