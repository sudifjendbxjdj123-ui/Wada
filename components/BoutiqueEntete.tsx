"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dictionary, type DictionaryEntry } from "@/lib/data";
import {
  type FiltresBoutique, FILTRES_VIDES, FAMILLES_COULEUR, TRANCHES_PRIX, TRIS,
  nombreFiltresActifs,
} from "@/lib/filtresBoutique";
import {
  ink, seal, border, textSecondary, mojo,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";

/**
 * BoutiqueEntete — l'en-tête clair de /boutique.
 *
 * Maquette client 2026-08-22 : le mur de vêtements défilant quitte la boutique
 * (il part sur l'accueil) et laisse place à une entrée de catalogue lisible —
 * titre, genre, catégories, filtres, couleurs, palette du moment.
 *
 * Le raisonnement derrière l'échange est juste : un mur d'images qui bouge est
 * une belle porte d'entrée, mais une mauvaise page de courses. Sur la boutique
 * on vient chercher, pas contempler ; il faut voir tout de suite par quoi
 * filtrer.
 *
 * Ce composant ne fait que l'en-tête et la navigation. Il n'affiche aucun
 * produit : chaque catégorie a déjà sa page (/vetements, /chaussures…) avec sa
 * grille, ses filtres et sa pagination. Dupliquer ici une seconde grille
 * aurait créé deux chemins concurrents vers les mêmes produits.
 */

type Genre = "femme" | "homme";

const CATEGORIES: Array<{ label: string; href: string | null }> = [
  { label: "Tout",        href: null },      // reste sur cette page
  { label: "Vêtements",   href: "/vetements" },
  { label: "Chaussures",  href: "/chaussures" },
  { label: "Sacs",        href: "/sacs" },
  { label: "Accessoires", href: "/accessoires" },
  { label: "Bijoux",      href: "/bijoux" },
];

/* Les pastilles « Shopper par couleur » et les pilules « Filtres / Marques /
   Trier par » étaient des LIENS vers d'autres pages :

     - « Filtres »   → /vetements  (aucun filtre appliqué, panneau fermé) ;
     - « Trier par » → /vetements?sort=nouveaute — une valeur que personne ne
       reconnaît (le tri s'appelle « nouveau »), sur une page qui ne lisait
       même pas `sort` ;
     - une pastille  → /vetements?couleur=Sauge — paramètre inexistant, et
       « Sauge » n'est pas une famille de couleur filtrable.

   Autrement dit : trois des quatre commandes de la boutique ne filtraient
   rien, et faisaient en plus quitter la page. Elles règlent désormais un
   véritable état, appliqué au catalogue juste en dessous.
   Les familles, tranches de prix et tris vivent dans lib/filtresBoutique. */

/** Palette mise en avant — change chaque jour, sans hasard : l'index dérive
    du quantième, donc le serveur et le client tombent sur la même. */
function paletteDuJour(): DictionaryEntry | null {
  if (!dictionary.length) return null;
  const jour = Math.floor(Date.now() / 86400000);
  return dictionary[jour % dictionary.length];
}

export default function BoutiqueEntete({
  /* Le parent a besoin de la palette du jour et du genre pour alimenter le
     catalogue qui suit. Ils sont calculés ici (palette du jour, genre
     mémorisé) — les recalculer en double aurait pu les faire diverger. */
  onContexte,
  /** Marques présentes dans le résultat courant, remontées par le catalogue
      (facette `marquesDisponibles` de /api/products). Le panneau « Marques »
      ne propose donc que des marques qui donneront un résultat. */
  marquesDisponibles = [],
}: {
  onContexte?: (ctx: {
    palette: DictionaryEntry | null;
    genre: Genre;
    filtres: FiltresBoutique;
  }) => void;
  marquesDisponibles?: Array<{ nom: string; n: number }>;
} = {}) {
  const router = useRouter();
  const [genre, setGenre] = useState<Genre>("femme");
  const [monte, setMonte] = useState(false);
  const [filtres, setFiltres] = useState<FiltresBoutique>(FILTRES_VIDES);
  /** Panneau ouvert : "filtres" | "marques" | "tri" | null. Un seul à la fois —
      deux panneaux ouverts se recouvriraient sur un écran de 393 px. */
  const [panneau, setPanneau] = useState<string | null>(null);

  /* La palette du jour dépend de la date : calculée après hydratation pour
     que le HTML serveur et le HTML client soient identiques. */
  useEffect(() => setMonte(true), []);
  const palette = useMemo(() => (monte ? paletteDuJour() : null), [monte]);

  useEffect(() => {
    onContexte?.({ palette, genre, filtres });
  }, [palette, genre, filtres, onContexte]);

  const majFiltres = (partiel: Partial<FiltresBoutique>) =>
    setFiltres((f) => ({ ...f, ...partiel }));

  const basculerMarque = (nom: string) =>
    setFiltres((f) => ({
      ...f,
      marques: f.marques.includes(nom)
        ? f.marques.filter((m) => m !== nom)
        : [...f.marques, nom],
    }));

  const actifs = nombreFiltresActifs(filtres);
  /* La pilule porte le nom du tri CHOISI, et « Trier par » tant qu'aucun ne
     l'est. `TRIS` contient une entrée de valeur vide (« Notre sélection ») :
     la chercher sans garde faisait afficher ce libellé dès l'ouverture de la
     page — une commande qui n'annonce plus ce qu'elle fait. */
  const libelleTri = filtres.sort
    ? (TRIS.find((t) => t.valeur === filtres.sort)?.label ?? "Trier par")
    : "Trier par";

  /* Genre mémorisé : le client qui a choisi « Homme » ne veut pas le
     rechoisir à chaque visite. Même clé que le reste du site. */
  useEffect(() => {
    try {
      const g = localStorage.getItem("wada-gender");
      if (g === "homme" || g === "femme") setGenre(g);
    } catch { /* stockage indisponible : on garde le défaut */ }
  }, []);

  const choisirGenre = (g: Genre) => {
    setGenre(g);
    try { localStorage.setItem("wada-gender", g); } catch {}
  };

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

  const pilule = (actif: boolean) => ({
    padding: "9px 22px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontFamily: fontBody,
    fontSize: 14.5,
    fontWeight: actif ? 600 : 400,
    background: actif ? mojo : "transparent",
    color: actif ? "#fff" : textSecondary,
    transition: "background .2s ease, color .2s ease",
  });

  return (
    /* 62 px en haut : le bouton RETOUR de la page est en position absolue à
       top:0 et occupe 90→134 px. À 22 px de marge, le titre démarrait à 98 px
       et passait DERRIÈRE lui — « BOUTIQUE » s'affichait « …QUE ». */
    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "62px 5% 0" }}>
      <h1 style={{
        fontFamily: fontHeading, fontSize: "clamp(28px, 7vw, 40px)",
        letterSpacing: ".06em", textTransform: "uppercase",
        color: ink, margin: 0, lineHeight: 1.05,
      }}>
        Boutique
      </h1>
      <p style={{
        fontFamily: fontBody, fontSize: 15, color: textSecondary,
        lineHeight: 1.45, margin: "8px 0 0", maxWidth: "34ch",
      }}>
        Découvrez des pièces sélectionnées selon les palettes WADA.
      </p>

      {/* ── Genre ──────────────────────────────────────────────────────── */}
      <div role="group" aria-label="Genre" style={{ display: "flex", gap: 4, margin: "18px 0 0" }}>
        <button type="button" onClick={() => choisirGenre("femme")}
          aria-pressed={genre === "femme"} style={pilule(genre === "femme")}>
          Femme
        </button>
        <button type="button" onClick={() => choisirGenre("homme")}
          aria-pressed={genre === "homme"} style={pilule(genre === "homme")}>
          Homme
        </button>
      </div>

      {/* ── Catégories ─────────────────────────────────────────────────── */}
      <nav aria-label="Catégories" style={{
        display: "flex", gap: 20, margin: "18px 0 0",
        borderBottom: `1px solid ${border}`,
        /* Défilement horizontal plutôt que retour à la ligne : six onglets ne
           tiennent pas sur 393 px, et une deuxième rangée d'onglets se lit
           mal. La barre de défilement est masquée (cf. .wada-tabs-scroll). */
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }} className="wada-tabs-scroll">
        {CATEGORIES.map((c, i) => {
          const actif = i === 0;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => { if (c.href) router.push(`${c.href}?genre=${genre}`); }}
              aria-current={actif ? "page" : undefined}
              style={{
                background: "none", border: "none", padding: "0 0 10px",
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                fontFamily: fontBody, fontSize: 14.5,
                color: actif ? mojo : textSecondary,
                fontWeight: actif ? 600 : 400,
                borderBottom: `2px solid ${actif ? mojo : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </nav>

      {/* ── Filtres / Marques / Trier ────────────────────────────────────
          Trois vraies commandes. Elles ouvrent un panneau SUR la page et
          règlent l'état `filtres`, que le catalogue en dessous applique. */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8, margin: "16px 0 0",
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
            <button
              key={b.cle}
              type="button"
              onClick={() => setPanneau(ouvert ? null : b.cle)}
              aria-expanded={ouvert}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 6, padding: "11px 13px", borderRadius: 12,
                border: `1px solid ${rempli ? mojo : border}`,
                background: rempli ? "rgba(178,74,58,.07)" : "#FFFDFA",
                cursor: "pointer", fontFamily: fontBody, fontSize: 13.5,
                color: rempli ? mojo : seal, minWidth: 0,
              }}
            >
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
                  onClick={() => majFiltres(actif
                    ? { prixMin: null, prixMax: null }
                    : { prixMin: t.min, prixMax: t.max })}
                  aria-pressed={actif}
                  style={puce(actif)}>
                  {t.label}
                </button>
              );
            })}
          </div>

          <p style={{ ...titrePanneau, marginTop: 16 }}>Promotions</p>
          <button type="button"
            onClick={() => majFiltres({ promo: !filtres.promo })}
            aria-pressed={filtres.promo}
            style={puce(filtres.promo)}>
            {/* Une remise, ici, est un prix barré RÉELLEMENT supérieur au prix
                courant — pas le mot « solde » trouvé dans un nom de produit. */}
            Articles en promotion
          </button>

          {actifs > 0 && (
            <button type="button"
              onClick={() => setFiltres({ ...FILTRES_VIDES, sort: filtres.sort })}
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
                  Le catalogue en compte près de six cents : les lister toutes
                  ici ferait un mur illisible, et la plupart n'auraient aucun
                  article dans la sélection affichée. L'index complet reste à
                  un clic. */}
              {/* Hauteur bornée : trente marques en pilules font une douzaine de
                  rangées, qui repousseraient le catalogue hors de l'écran. */}
              <div className="wada-tabs-scroll" style={{
                display: "flex", flexWrap: "wrap", gap: 7,
                maxHeight: 210, overflowY: "auto",
              }}>
                {marquesDisponibles.map((m) => {
                  const actif = filtres.marques.includes(m.nom);
                  return (
                    <button key={m.nom} type="button"
                      onClick={() => basculerMarque(m.nom)}
                      aria-pressed={actif}
                      style={puce(actif)}>
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
                Voir l'index complet des marques →
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
                  onClick={() => { majFiltres({ sort: t.valeur }); setPanneau(null); }}
                  aria-pressed={actif}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, padding: "11px 2px", background: "none", border: "none",
                    /* Pas de filet sous la dernière option : il pendait sous la
                       liste sans rien séparer. */
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

      {/* ── Shopper par couleur ──────────────────────────────────────────
          Douze familles — celles que le catalogue sait réellement filtrer.
          Une pastille se coche et se décoche ; elle ne quitte plus la page. */}
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: textSecondary, margin: "22px 0 10px",
      }}>
        Shopper par couleur
      </p>
      <div className="wada-tabs-scroll" style={{
        display: "flex", gap: 10, alignItems: "center",
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        margin: "0 -5%", padding: "3px 5%",
      }}>
        {FAMILLES_COULEUR.map((c) => {
          const actif = filtres.couleur === c.cle;
          return (
            <button
              key={c.cle}
              type="button"
              onClick={() => majFiltres({ couleur: actif ? null : c.cle })}
              aria-pressed={actif}
              aria-label={`Filtrer sur ${c.nom}`}
              title={c.nom}
              style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: c.hex, cursor: "pointer", padding: 0,
                border: `1px solid ${border}`,
                /* Anneau crème puis anneau mojo quand la famille est active :
                   sur une pastille noire, une simple bordure ne se voit pas. */
                boxShadow: actif
                  ? `inset 0 0 0 2px #FAF8F4, 0 0 0 2px ${mojo}`
                  : "inset 0 0 0 2px #FAF8F4",
              }}
            />
          );
        })}
      </div>

      {/* La carte « palette du jour » vivait ici. Elle est partie dans
          VitrineBoutique (section « Shopper par palette WADA », maquette
          client 2026-08-22), qui montre la MÊME palette 200 px plus bas avec
          toutes ses teintes et un vrai bouton d'achat. Deux cartes pour une
          seule palette sur le même écran, c'est une répétition, pas une mise
          en avant. Le contexte remonté au parent est inchangé. */}

      <style>{`
        .wada-tabs-scroll { scrollbar-width: none; }
        .wada-tabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
