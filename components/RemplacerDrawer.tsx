"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { SlotKey } from "@/lib/registreEngine";
import type { ProduitLook } from "./LookComplet";
import { formatProductPrice } from "@/lib/priceFormat";
import {
  ink, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * RemplacerDrawer — « Je n'aime pas cette pièce ».
 *
 * Refonte client 2026-08-23 (§6) : au lieu de remplacer à l'aveugle par la
 * pièce suivante du classement, un tiroir montre des ALTERNATIVES et laisse
 * choisir. Le reste de la tenue ne bouge pas.
 *
 * Les filtres de la maquette, traduits en paramètres que /api/products sait
 * réellement appliquer :
 *   - « Même couleur »  → color={hex du slot} (ΔE, garde de luminance) —
 *     actif par défaut : c'est la promesse de la palette ;
 *   - « Moins cher »    → maxPrice = prix de la pièce actuelle ;
 *   - « Autre marque »  → filtre client sur la marque actuelle ;
 *   - « Plus tendance » n'existe PAS : aucune donnée du flux ne mesure la
 *     tendance, le bouton aurait trié au hasard sous un nom qui promet.
 *     À la place, « Nouveautés » — le tri `nouveau` sur la date marchand,
 *     qui existe et se vérifie.
 */

type Alternative = ProduitLook & { hex?: string };

export default function RemplacerDrawer({
  slot,
  libelleSlot,
  hexSlot,
  produitActuel,
  paletteNumber,
  genre,
  style,
  onChoisir,
  onFermer,
}: {
  slot: SlotKey;
  libelleSlot: string;
  hexSlot: string;
  produitActuel: ProduitLook;
  paletteNumber: string;
  genre: string | null;
  style: string | null;
  onChoisir: (p: ProduitLook) => void;
  onFermer: () => void;
}) {
  const [moinsCher, setMoinsCher] = useState(false);
  const [autreMarque, setAutreMarque] = useState(false);
  const [nouveautes, setNouveautes] = useState(false);
  const [etat, setEtat] = useState<"charge" | "pret" | "vide">("charge");
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = avant; };
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    setEtat("charge");
    (async () => {
      try {
        const sp = new URLSearchParams({
          slot, limit: "8", palette: paletteNumber, color: hexSlot,
        });
        if (genre) sp.set("genre", genre.toLowerCase());
        if (style) sp.set("style", style);
        if (moinsCher && produitActuel.prix > 0) {
          sp.set("maxPrice", String(Math.ceil(produitActuel.prix)));
        }
        if (nouveautes) sp.set("sort", "nouveau");
        sp.set("excludeIds", produitActuel.id);
        sp.set("seed", `${paletteNumber}-${slot}-drawer`);

        const r = await fetch(`/api/products?${sp}`, { signal: ac.signal });
        if (!r.ok) { setEtat("vide"); return; }
        const d = await r.json();
        let liste: Alternative[] = (d.products ?? []).filter(
          (p: Alternative) => p.urlProduit && (p.image || p.largeImage || p.imageLocal),
        );
        if (autreMarque && produitActuel.marque) {
          const m = produitActuel.marque.toLowerCase();
          liste = liste.filter((p) => (p.marque || "").toLowerCase() !== m);
        }
        liste = liste.filter((p) => p.id !== produitActuel.id);
        setAlternatives(liste);
        setEtat(liste.length ? "pret" : "vide");
      } catch { /* abort ou réseau */ }
    })();
    return () => ac.abort();
  }, [slot, paletteNumber, hexSlot, genre, style, moinsCher, autreMarque, nouveautes, produitActuel.id, produitActuel.prix, produitActuel.marque]);

  const puce = (actif: boolean): React.CSSProperties => ({
    padding: "7px 12px", borderRadius: 999, cursor: "pointer",
    fontFamily: fontBody, fontSize: 12.5,
    border: `1px solid ${actif ? mojo : border}`,
    background: actif ? mojo : "transparent",
    color: actif ? "#fff" : ink,
    whiteSpace: "nowrap",
  });

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Remplacer — ${libelleSlot}`}
      onClick={onFermer}
      style={{
        position: "fixed", inset: 0, zIndex: 90,
        background: "rgba(30,26,22,.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(640px, 100%)", maxHeight: "82vh", overflowY: "auto",
        background: "#FFFDFA", borderRadius: "18px 18px 0 0",
        padding: "16px 18px calc(18px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <p style={{
            fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".13em",
            textTransform: "uppercase", color: textSecondary, margin: 0,
          }}>
            Remplacer — {libelleSlot}
          </p>
          <button type="button" onClick={onFermer} aria-label="Fermer" style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "rgba(30,30,30,.06)", cursor: "pointer", color: ink,
            fontSize: 15, lineHeight: 1,
          }}>
            ✕
          </button>
        </div>

        {/* Filtres */}
        <div className="wada-tabs-scroll" style={{
          display: "flex", gap: 7, margin: "12px 0 14px",
          overflowX: "auto", WebkitOverflowScrolling: "touch",
        }}>
          <span style={{ ...puce(true), cursor: "default", opacity: .85 }}>Même couleur</span>
          <button type="button" onClick={() => setMoinsCher(!moinsCher)}
            aria-pressed={moinsCher} style={puce(moinsCher)}>
            Moins cher
          </button>
          <button type="button" onClick={() => setAutreMarque(!autreMarque)}
            aria-pressed={autreMarque} style={puce(autreMarque)}>
            Autre marque
          </button>
          <button type="button" onClick={() => setNouveautes(!nouveautes)}
            aria-pressed={nouveautes} style={puce(nouveautes)}>
            Nouveautés
          </button>
        </div>

        {etat === "charge" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} aria-hidden style={{
                display: "block", aspectRatio: "3 / 4", borderRadius: 12,
                background: "rgba(30,30,30,.05)",
              }} />
            ))}
          </div>
        )}

        {etat === "vide" && (
          <p style={{ fontFamily: fontBody, fontSize: 13.5, color: textSecondary, margin: "8px 0" }}>
            Aucune alternative ne correspond à ces critères — essayez d&apos;en
            retirer un.
          </p>
        )}

        {etat === "pret" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
            {alternatives.map((p) => {
              const img = p.imageLocal || p.largeImage || p.image || null;
              return (
                <button key={p.id} type="button" onClick={() => { onChoisir(p); onFermer(); }}
                  style={{
                    display: "flex", flexDirection: "column", textAlign: "left",
                    border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden",
                    background: "#fff", cursor: "pointer", padding: 0, minWidth: 0,
                  }}>
                  <span style={{ display: "block", aspectRatio: "3 / 4", background: "#FFFFFF" }}>
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.nom} loading="lazy" decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
                    )}
                  </span>
                  <span style={{ padding: "8px 9px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                    {p.marque && (
                      <span style={{
                        fontFamily: fontLabel, fontSize: 10, letterSpacing: ".06em",
                        textTransform: "uppercase", color: ink, fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {p.marque}
                      </span>
                    )}
                    <span style={{
                      fontFamily: fontBody, fontSize: 11.5, color: textSecondary, lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {p.nom}
                    </span>
                    <span style={{ fontFamily: fontLabel, fontSize: 12.5, color: ink, fontWeight: 600, marginTop: 2 }}>
                      {formatProductPrice(p.prix, p.marchandSlug ?? null, p.devise)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
