"use client";
import { useState } from "react";
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
  const { favorites, clear, removeWithUndo, hydrated } = useFavorites();
  const { outfits, removeWithUndo: removeOutfitWithUndo, hydrated: outfitsHydrated } = useSavedOutfits();
  const [undoState, setUndoState] = useState<{ undo: () => void; label: string; timeout: NodeJS.Timeout } | null>(null);

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
            {/* Brief 2026-06-01 (audit doublon empty state) : on
                n'affiche le sous-titre que quand il y a des favoris.
                Quand totalCount === 0, la section vide en dessous
                porte déjà le message complet (« Vos favoris vous
                attendent » + CTA Scanner). Évite « Rien pour
                l'instant » répété sous le titre. */}
            {hydrated && outfitsHydrated && totalCount > 0 && (
              <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, fontFamily: "'Inter', sans-serif" }}>
                {favPalettes.length > 0 && `${favPalettes.length} palette${favPalettes.length > 1 ? "s" : ""}`}
                {favPalettes.length > 0 && outfits.length > 0 && " · "}
                {outfits.length > 0 && `${outfits.length} tenue${outfits.length > 1 ? "s" : ""} gardée${outfits.length > 1 ? "s" : ""}`}
              </p>
            )}
          </header>

          {!hydrated || !outfitsHydrated ? null : totalCount === 0 ? (
            /* Improved empty state with better visual hierarchy and engagement */
            <section style={{
              textAlign: "center",
              padding: "80px 32px 64px",
              border: `2px solid ${border}`,
              background: `linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(107, 58, 50, 0.04) 100%)`,
              borderRadius: 24,
              maxWidth: 600,
              margin: "0 auto",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Subtle animated background element */}
              <div style={{
                position: "absolute",
                top: -40, right: -40, width: 200, height: 200,
                borderRadius: "50%",
                background: "rgba(107, 58, 50, 0.06)",
                animation: "wadaEmptyStatePulse 4s ease-in-out infinite",
                pointerEvents: "none",
              }} />

              {/* Heart icon with enhanced styling */}
              <div style={{
                width: 84, height: 84, margin: "0 auto 32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(107, 58, 50, 0.12) 0%, rgba(107, 58, 50, 0.06) 100%)",
                color: "#6B3A32",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                boxShadow: "0 8px 20px rgba(107, 58, 50, 0.12)",
              }}>
                <svg
                  width="40" height="40" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                </svg>
              </div>

              <h2 style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 28, fontWeight: 600,
                color: ink, margin: "0 0 16px", letterSpacing: "-0.3px",
              }}>
                Vos favoris vous attendent
              </h2>

              <p style={{
                fontSize: 15, color: textSecondary,
                margin: "0 auto 40px", maxWidth: 420,
                fontFamily: "'Inter', sans-serif", lineHeight: 1.6,
              }}>
                Sauvegardez vos palettes et tenues préférées pour les retrouver facilement. Commencez par scanner une couleur ou explorer notre dictionnaire.
              </p>

              {/* Two-column CTA layout on desktop */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 20,
                position: "relative",
                zIndex: 1,
              }}>
                {/* Primary CTA */}
                <Link
                  href="/scanner"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                    background: "#6B3A32", color: "#FAF8F4",
                    padding: "16px 28px", borderRadius: 12,
                    fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
                    textDecoration: "none",
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: "0 12px 32px rgba(107, 58, 50, 0.25)",
                    transition: "all 0.2s ease",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(107, 58, 50, 0.32)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(107, 58, 50, 0.25)"; }}
                >
                  <span style={{ fontSize: 16 }}>⬡</span>
                  <span>Scanner une couleur</span>
                </Link>

                {/* Secondary CTA */}
                <Link
                  href="/palettes"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                    background: "transparent", color: "#6B3A32",
                    padding: "16px 28px", borderRadius: 12,
                    fontSize: 14, fontWeight: 600, letterSpacing: "0.02em",
                    textDecoration: "none",
                    fontFamily: "'Inter', sans-serif",
                    border: `2px solid ${border}`,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(107, 58, 50, 0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 16 }}>▦</span>
                  <span>Explorer les palettes</span>
                </Link>
              </div>

              <style>{`
                @keyframes wadaEmptyStatePulse {
                  0%, 100% { transform: scale(1); opacity: 0.8; }
                  50% { transform: scale(1.15); opacity: 0.4; }
                }
              `}</style>
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
                  {/* Brief 2026-06-07 (cohérence) — même grille fluide que
                      /palettes (auto-fill minmax 220px) au lieu de l'ancienne
                      classe .wada-palettes-grid figée à 2 colonnes < 1024px.
                      Les cartes favoris s'alignent désormais sur le dictionnaire
                      (≈3 colonnes desktop, 1 sur mobile, sans saut brusque). */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 20,
                  }}>
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
                      <SavedOutfitCard
                        key={o.id}
                        outfit={o}
                        onRemove={() => {
                          if (undoState) clearTimeout(undoState.timeout);
                          const undo = removeOutfitWithUndo(o.id);
                          const timeout = setTimeout(() => setUndoState(null), 5000);
                          setUndoState({ undo, label: o.nomTenue, timeout });
                        }}
                      />
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

      {/* Toast Undo */}
      {undoState && (
        <div style={{
          position: "fixed", bottom: "calc(56px + env(safe-area-inset-bottom) + 20px)", right: 20,
          background: ink, color: paper, padding: "14px 20px", borderRadius: 12,
          fontSize: 14, fontFamily: "'Inter', sans-serif", display: "flex", gap: 12,
          alignItems: "center", boxShadow: "0 12px 32px rgba(30,30,30,0.25)",
          animation: "wadaUndoSlideIn 0.25s ease-out", zIndex: 10000,
        }}>
          <span>"{undoState.label}" supprimée</span>
          <button
            onClick={() => {
              clearTimeout(undoState.timeout);
              undoState.undo();
              setUndoState(null);
            }}
            style={{
              background: "transparent", border: "none", color: "#F4EFE7",
              textDecoration: "underline", cursor: "pointer", fontSize: 13, fontWeight: 600,
              padding: 0, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
            }}
          >
            Annuler
          </button>
        </div>
      )}

      <style>{`
        @keyframes wadaUndoSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
