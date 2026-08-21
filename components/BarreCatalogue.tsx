"use client";
import { useRouter } from "next/navigation";
import {
  type FiltresBoutique, FAMILLES_COULEUR, TRANCHES_PRIX, TRIS,
  nombreFiltresActifs,
} from "@/lib/filtresBoutique";
import type { Genre } from "@/lib/paletteDuJour";
import {
  ink, seal, border, textSecondary, mojo,
  fontBody, fontLabel,
} from "@/lib/styles";

/**
 * BarreCatalogue — genre, filtres, marques, tri et couleurs de /boutique.
 *
 * Remplace BoutiqueEntete, qui empilait AVANT le premier produit : un bouton
 * Retour, un titre « BOUTIQUE », un sous-titre, le genre, six onglets de
 * catégorie, trois pilules et dix pastilles de couleur. Soit près de six cents
 * pixels de commandes sur un téléphone — la moitié d'un écran — pendant que le
 * catalogue attendait plus bas. La maquette client du 23/08 ouvre la page sur
 * la recherche et les produits ; les commandes descendent donc ici, juste
 * au-dessus de la grille qu'elles pilotent.
 *
 * Elles restent RÉELLES : chaque réglage part au serveur et filtre le
 * catalogue entier (cf. lib/filtresBoutique).
 */
export default function BarreCatalogue({
  genre, onGenre,
  filtres, onFiltres,
  panneau, onPanneau,
  marquesDisponibles = [],
}: {
  genre: Genre;
  onGenre: (g: Genre) => void;
  filtres: FiltresBoutique;
  onFiltres: (f: FiltresBoutique) => void;
  /** Panneau ouvert : "filtres" | "marques" | "tri" | null. Un seul à la fois —
      deux panneaux ouverts se recouvriraient sur un écran de 393 px. */
  panneau: string | null;
  onPanneau: (p: string | null) => void;
  /** Marques présentes dans le résultat courant, remontées par le catalogue.
      Le panneau ne propose donc que des marques qui donneront un résultat. */
  marquesDisponibles?: Array<{ nom: string; n: number }>;
}) {
  const router = useRouter();

  const maj = (partiel: Partial<FiltresBoutique>) => onFiltres({ ...filtres, ...partiel });
  const basculerMarque = (nom: string) =>
    onFiltres({
      ...filtres,
      marques: filtres.marques.includes(nom)
        ? filtres.marques.filter((m) => m !== nom)
        : [...filtres.marques, nom],
    });

  const actifs = nombreFiltresActifs(filtres);
  /* La pilule porte le nom du tri CHOISI, et « Trier par » tant qu'aucun ne
     l'est. `TRIS` contient une entrée de valeur vide (« Notre sélection ») :
     la chercher sans garde afficherait ce libellé dès l'ouverture — une
     commande qui n'annonce plus ce qu'elle fait. */
  const libelleTri = filtres.sort
    ? (TRIS.find((t) => t.valeur === filtres.sort)?.label ?? "Trier par")
    : "Trier par";

  const panneauStyle: React.CSSProperties = {
    margin: "10px 0 0", padding: "14px 15px", borderRadius: 14,
    border: `1px solid ${border}`, background: "#FFFDFA",
  };
  const titrePanneau: React.CSSProperties = {
    fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".13em",
    textTransform: "uppercase", color: textSecondary, margin: "0 0 9px",
  };
  const puce = (actif: boolean): React.CSSProperties => ({
    padding: "8px 13px", borderRadius: 999, cursor: "pointer",
    fontFamily: fontBody, fontSize: 13,
    border: `1px solid ${actif ? mojo : border}`,
    background: actif ? mojo : "transparent",
    color: actif ? "#fff" : seal,
  });

  return (
    <div style={{ margin: "0 0 16px" }}>
      {/* ── Genre ────────────────────────────────────────────────────────
          Il pilote TOUTE la page (chaque section interroge l'API avec lui),
          donc il ne peut pas disparaître avec le reste de l'ancien en-tête.
          Réduit ici à deux mots discrets au lieu de deux grosses pilules. */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, margin: "0 0 12px",
      }}>
        <h2 style={{
          fontFamily: fontLabel, fontSize: 11, letterSpacing: ".14em",
          textTransform: "uppercase", color: ink, fontWeight: 600, margin: 0,
        }}>
          Tout le catalogue
        </h2>
        <div role="group" aria-label="Genre" style={{
          display: "flex", gap: 2, padding: 3, borderRadius: 999,
          border: `1px solid ${border}`, background: "#FFFDFA", flexShrink: 0,
        }}>
          {(["femme", "homme"] as Genre[]).map((g) => (
            <button key={g} type="button" onClick={() => onGenre(g)}
              aria-pressed={genre === g}
              style={{
                padding: "5px 14px", borderRadius: 999, border: "none",
                cursor: "pointer", fontFamily: fontBody, fontSize: 13,
                background: genre === g ? mojo : "transparent",
                color: genre === g ? "#fff" : textSecondary,
                fontWeight: genre === g ? 600 : 400,
              }}>
              {g === "femme" ? "Femme" : "Homme"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filtres / Marques / Trier ─────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8,
      }}>
        {[
          { cle: "filtres", label: actifs > 0 ? `Filtres (${actifs})` : "Filtres" },
          { cle: "marques", label: filtres.marques.length > 0 ? `Marques (${filtres.marques.length})` : "Marques" },
          { cle: "tri",     label: libelleTri },
        ].map((b) => {
          const ouvert = panneau === b.cle;
          const rempli =
            (b.cle === "filtres" && actifs > 0) ||
            (b.cle === "marques" && filtres.marques.length > 0) ||
            (b.cle === "tri" && filtres.sort !== "");
          return (
            <button key={b.cle} type="button"
              onClick={() => onPanneau(ouvert ? null : b.cle)}
              aria-expanded={ouvert}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 6, padding: "11px 13px", borderRadius: 12,
                border: `1px solid ${rempli ? mojo : border}`,
                background: rempli ? "rgba(178,74,58,.07)" : "#FFFDFA",
                cursor: "pointer", fontFamily: fontBody, fontSize: 13.5,
                color: rempli ? mojo : seal, minWidth: 0,
              }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {b.label}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  flexShrink: 0, color: rempli ? mojo : textSecondary,
                  transform: ouvert ? "rotate(180deg)" : "none", transition: "transform .18s ease",
                }}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* ── Panneau : prix + promotions ──────────────────────────────── */}
      {panneau === "filtres" && (
        <div style={panneauStyle}>
          <p style={titrePanneau}>Prix</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {TRANCHES_PRIX.map((t) => {
              const actif = filtres.prixMin === t.min && filtres.prixMax === t.max;
              return (
                <button key={t.label} type="button"
                  onClick={() => maj(actif
                    ? { prixMin: null, prixMax: null }
                    : { prixMin: t.min, prixMax: t.max })}
                  aria-pressed={actif} style={puce(actif)}>
                  {t.label}
                </button>
              );
            })}
          </div>

          <p style={{ ...titrePanneau, marginTop: 16 }}>Promotions</p>
          <button type="button" onClick={() => maj({ promo: !filtres.promo })}
            aria-pressed={filtres.promo} style={puce(filtres.promo)}>
            {/* Une remise, ici, est un prix barré RÉELLEMENT supérieur au prix
                courant — pas le mot « solde » trouvé dans un nom de produit. */}
            Articles en promotion
          </button>

          <p style={{ ...titrePanneau, marginTop: 16 }}>Couleur</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {FAMILLES_COULEUR.map((c) => {
              const actif = filtres.couleur === c.cle;
              return (
                /* Le DISQUE est un <span> à l'intérieur du bouton, pas le
                   bouton lui-même. globals.css impose `button { min-height:
                   36px }` sous 768 px : une pastille de 30×30 sortait donc en
                   30×36 — un ovale, mesuré tel quel. Le bouton garde sa cible
                   tactile (c'est le but de la règle), le disque reste rond. */
                <button key={c.cle} type="button"
                  onClick={() => maj({ couleur: actif ? null : c.cle })}
                  aria-pressed={actif} aria-label={`Filtrer sur ${c.nom}`} title={c.nom}
                  style={{
                    padding: 0, border: "none", background: "none", cursor: "pointer",
                    lineHeight: 0, flexShrink: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <span aria-hidden style={{
                    display: "block", width: 30, height: 30, borderRadius: "50%",
                    background: c.hex, border: `1px solid ${border}`,
                    /* Anneau crème puis anneau mojo quand la famille est
                       active : sur une pastille noire, une simple bordure ne
                       se voit pas. */
                    boxShadow: actif
                      ? `inset 0 0 0 2px #FFFDFA, 0 0 0 2px ${mojo}`
                      : "inset 0 0 0 2px #FFFDFA",
                  }} />
                </button>
              );
            })}
          </div>

          {actifs > 0 && (
            <button type="button"
              onClick={() => onFiltres({
                couleur: null, prixMin: null, prixMax: null,
                promo: false, marques: [], sort: filtres.sort,
              })}
              style={{
                display: "block", marginTop: 16, background: "none", border: "none",
                padding: 0, cursor: "pointer", fontFamily: fontBody, fontSize: 13,
                color: textSecondary, textDecoration: "underline",
              }}>
              Tout effacer
            </button>
          )}
        </div>
      )}

      {/* ── Panneau : marques ────────────────────────────────────────── */}
      {panneau === "marques" && (
        <div style={panneauStyle}>
          {marquesDisponibles.length === 0 ? (
            <p style={{ fontFamily: fontBody, fontSize: 13.5, color: textSecondary, margin: 0 }}>
              Chargement des marques…
            </p>
          ) : (
            <>
              {/* Les marques du RÉSULTAT courant, les mieux fournies d'abord.
                  Le catalogue en compte plusieurs centaines : les lister
                  toutes ferait un mur illisible, et la plupart n'auraient
                  aucun article dans la sélection affichée. Hauteur bornée,
                  sinon une douzaine de rangées repousseraient la grille hors
                  de l'écran. L'index complet reste à un clic. */}
              <div className="wada-tabs-scroll" style={{
                display: "flex", flexWrap: "wrap", gap: 7,
                maxHeight: 210, overflowY: "auto",
              }}>
                {marquesDisponibles.map((m) => {
                  const actif = filtres.marques.includes(m.nom);
                  return (
                    <button key={m.nom} type="button" onClick={() => basculerMarque(m.nom)}
                      aria-pressed={actif} style={puce(actif)}>
                      {m.nom} <span style={{ opacity: .55 }}>{m.n}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => router.push("/marques")}
                style={{
                  display: "block", marginTop: 14, background: "none", border: "none",
                  padding: 0, cursor: "pointer", fontFamily: fontBody, fontSize: 13,
                  color: mojo,
                }}>
                Voir l&apos;index complet des marques →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Panneau : tri ────────────────────────────────────────────── */}
      {panneau === "tri" && (
        <div style={panneauStyle}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {TRIS.map((t, i) => {
              const actif = filtres.sort === t.valeur;
              return (
                <button key={t.valeur || "defaut"} type="button"
                  onClick={() => { maj({ sort: t.valeur }); onPanneau(null); }}
                  aria-pressed={actif}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, padding: "11px 2px", background: "none", border: "none",
                    /* Pas de filet sous la dernière option : il pendait sous
                       la liste sans rien séparer. */
                    borderBottom: i === TRIS.length - 1 ? "none" : `1px solid ${border}`,
                    cursor: "pointer", textAlign: "left",
                    fontFamily: fontBody, fontSize: 14,
                    color: actif ? mojo : ink, fontWeight: actif ? 600 : 400,
                  }}>
                  {t.label}
                  {actif && (
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none"
                      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .wada-tabs-scroll { scrollbar-width: none; }
        .wada-tabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
