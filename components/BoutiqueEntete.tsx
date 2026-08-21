"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dictionary } from "@/lib/data";
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

/* « Shopper par couleur » — les familles de teintes du catalogue, pas les
   couleurs d'une palette précise : c'est une entrée de recherche, elle doit
   couvrir tout le magasin. Chaque pastille emmène vers /vetements filtré. */
const COULEURS: Array<{ nom: string; hex: string }> = [
  { nom: "Crème",     hex: "#F0E9DA" },
  { nom: "Sauge",     hex: "#9CAF88" },
  { nom: "Mousse",    hex: "#5A6F4A" },
  { nom: "Marine",    hex: "#2A3A56" },
  { nom: "Camel",     hex: "#C4A484" },
  { nom: "Chocolat",  hex: "#4A3428" },
  { nom: "Noir",      hex: "#1E1E1E" },
  { nom: "Bordeaux",  hex: "#5C1F2B" },
  { nom: "Gris",      hex: "#8A8A8A" },
  { nom: "Rouille",   hex: "#A8624A" },
];
/* Six visibles, le reste derrière « + » : dix pastilles alignées débordaient
   d'un écran de 393 px. */
const COULEURS_VISIBLES = 6;

const FILTRES: Array<{ label: string; href: string }> = [
  { label: "Filtres", href: "/vetements" },
  { label: "Marques", href: "/marques" },
  { label: "Trier par", href: "/vetements?sort=nouveaute" },
];

/** Palette mise en avant — change chaque jour, sans hasard : l'index dérive
    du quantième, donc le serveur et le client tombent sur la même. */
function paletteDuJour() {
  if (!dictionary.length) return null;
  const jour = Math.floor(Date.now() / 86400000);
  return dictionary[jour % dictionary.length];
}

export default function BoutiqueEntete() {
  const router = useRouter();
  const [genre, setGenre] = useState<Genre>("femme");
  const [toutesCouleurs, setToutesCouleurs] = useState(false);
  const [monte, setMonte] = useState(false);

  /* La palette du jour dépend de la date : calculée après hydratation pour
     que le HTML serveur et le HTML client soient identiques. */
  useEffect(() => setMonte(true), []);
  const palette = useMemo(() => (monte ? paletteDuJour() : null), [monte]);

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

      {/* ── Filtres / Marques / Trier ──────────────────────────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 8, margin: "16px 0 0",
      }}>
        {FILTRES.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => router.push(`${f.href}${f.href.includes("?") ? "&" : "?"}genre=${genre}`)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 6, padding: "11px 13px", borderRadius: 12,
              border: `1px solid ${border}`, background: "#FFFDFA",
              cursor: "pointer", fontFamily: fontBody, fontSize: 13.5, color: seal,
              minWidth: 0,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.label}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, color: textSecondary }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        ))}
      </div>

      {/* ── Shopper par couleur ────────────────────────────────────────── */}
      <p style={{
        fontFamily: fontLabel, fontSize: 10.5, letterSpacing: ".14em",
        textTransform: "uppercase", color: textSecondary, margin: "22px 0 10px",
      }}>
        Shopper par couleur
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {(toutesCouleurs ? COULEURS : COULEURS.slice(0, COULEURS_VISIBLES)).map((c) => (
          <button
            key={c.nom}
            type="button"
            onClick={() => router.push(`/vetements?genre=${genre}&couleur=${encodeURIComponent(c.nom)}`)}
            aria-label={`Shopper en ${c.nom}`}
            title={c.nom}
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: c.hex, cursor: "pointer",
              border: `1px solid ${border}`,
              boxShadow: "inset 0 0 0 2px #FAF8F4",
            }}
          />
        ))}
        {!toutesCouleurs && COULEURS.length > COULEURS_VISIBLES && (
          <button
            type="button"
            onClick={() => setToutesCouleurs(true)}
            aria-label="Voir toutes les couleurs"
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "transparent", cursor: "pointer",
              border: `1px solid ${border}`, color: textSecondary,
              fontFamily: fontBody, fontSize: 17, lineHeight: 1,
            }}
          >
            +
          </button>
        )}
      </div>

      {/* ── Palette du jour ────────────────────────────────────────────── */}
      {palette && (
        <button
          type="button"
          onClick={() => router.push(`/palette/${palette.number}`)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            margin: "18px 0 0", padding: "13px 15px", borderRadius: 14,
            border: `1px solid ${border}`, background: "#FFFDFA",
            cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit",
          }}
        >
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              display: "block", fontFamily: fontHeading, fontSize: 16, color: ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {palette.name}
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 7, marginTop: 4,
              fontFamily: fontBody, fontSize: 12.5, color: textSecondary,
              overflow: "hidden",
            }}>
              {palette.colors.slice(0, 3).map((c) => (
                <span key={c.hex} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap",
                }}>
                  <span aria-hidden style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: c.hex, border: `1px solid ${border}`,
                  }} />
                  {c.name}
                </span>
              ))}
            </span>
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: fontBody, fontSize: 13, color: textSecondary,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Voir
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </span>
        </button>
      )}

      <style>{`
        .wada-tabs-scroll { scrollbar-width: none; }
        .wada-tabs-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
