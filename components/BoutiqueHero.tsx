"use client";
/**
 * BoutiqueHero — Hero de /boutique.
 * Brief 2026-06-06 : fond = MUR de vêtements des marques affiliées qui défile
 * verticalement (entrée par le haut → sortie en bas, boucle infinie), voile
 * sombre + titre Fredoka « Boutique » + toggle Femme/Homme + 6 pills catégories.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDisplayImageUrl } from "@/lib/image-utils";

const CREAM = "#FAF8F4";
const BORDEAUX = "#6B3A32";
const BORDEAUX_DARK = "#52261f";

const CATEGORIES: Array<{ label: string; href: string }> = [
  { label: "Vêtements",  href: "/vetements" },
  { label: "Chaussures", href: "/chaussures" },
  { label: "Accessoires",href: "/accessoires" },
  { label: "Sacs",       href: "/sacs" },
  { label: "Bijoux",     href: "/bijoux" },
  { label: "Marques",    href: "/marques" },
];

/* Fix 2026-06-11 « hero instantané », révisé le 2026-08-20 :
   cache localStorage des URLs d'images pour remplir le mur sans attendre
   /api/products (6-7s à froid). Le cache est rafraîchi silencieusement en
   arrière-plan à chaque visite. Sur une 1re visite, ou si le réseau échoue,
   ce sont les placeholders neutres ci-dessous qui tiennent le mur — jamais un
   fond vide. Le cache est appliqué dans un effet et non pendant le render :
   lire localStorage au render faisait diverger le HTML serveur du HTML client
   (erreur d'hydratation, mur qui se remontait au chargement). */
const CACHE_KEY = "wada-boutique-hero-images";
/* Fix 2026-08-20 « le fond met trop de temps » : 60 images distinctes, chacune
   retéléchargée chez le marchand via /api/img, pour un décor — et comme chaque
   colonne est dupliquée pour boucler, ça faisait 120 balises <img> dans le DOM.
   30 suffisent largement : le mur fait 3 colonnes sur téléphone (10 images par
   colonne, 20 après duplication), bien plus haut que l'écran. Moitié moins de
   requêtes, mur complet deux fois plus vite. */
const CACHE_MAX = 30;
/* Idem : 16 images en priorité haute se disputaient la bande passante au
   moment précis où la page doit s'afficher. 8 couvrent le premier écran. */
const EAGER_COUNT = 8;
// Placeholders neutres en attendant les images API
const FALLBACK_IMAGES = Array.from({ length: 24 }, (_, i) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect fill='%23${["d4c5b9","c9b8ac","e8ddd4","bfb0a4"][i % 4]}' width='400' height='500'/%3E%3C/svg%3E`
);

function readCachedImages(): string[] {
  if (typeof window === "undefined") return FALLBACK_IMAGES;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return FALLBACK_IMAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return FALLBACK_IMAGES;
    const cached = parsed.filter((s) => typeof s === "string").slice(0, CACHE_MAX);
    return cached.length > 0 ? cached : FALLBACK_IMAGES;
  } catch { return FALLBACK_IMAGES; }
}

function writeCachedImages(imgs: string[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(imgs.slice(0, CACHE_MAX))); } catch {}
}

export function BoutiqueHero() {
  /* Fix 2026-08-20 « hydratation » : l'initialiseur lisait localStorage
     PENDANT le render. Le serveur rend alors les 24 placeholders SVG et le
     client rend les URLs en cache → les <img src> divergent et React jette
     une erreur d'hydratation (mur qui clignote / se re-monte au chargement).
     On part donc du MÊME état des deux côtés (les placeholders), puis on
     remplace par le cache dans un effet, avant le fetch réseau. Le mur reste
     visible à la 1re paint, sans divergence SSR/client. */
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);

  const [cols, setCols] = useState(4);
  const [genre, setGenre] = useState<"femme" | "homme">("femme");

  /* Cache localStorage appliqué après hydratation (effet ⇒ client only). */
  useEffect(() => {
    const cached = readCachedImages();
    if (cached !== FALLBACK_IMAGES) setImages(cached);
  }, []);

  /* Nombre de colonnes adapté à la largeur (≈1 colonne / 260px). */
  useEffect(() => {
    const update = () => setCols(Math.max(3, Math.round(window.innerWidth / 260)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* Fix 2026-08-20 « le fond met trop de temps » : on lançait TROIS requêtes
     /api/products (haut, bas, veste). Chacune rebalaie l'intégralité du
     catalogue KV (~1-2 Mo) puis lui applique une quarantaine de filtres, côté
     serveur, à chaque appel — trois fois ce travail pour un simple décor. Et
     comme on attendait `Promise.all`, le mur ne se remplissait qu'une fois la
     PLUS LENTE des trois revenue.
     Le paramètre `slot` de /api/products ne sert qu'à des exclusions : sans
     lui, une seule requête renvoie déjà un mélange de pièces. Un tiers du
     travail serveur, et plus d'attente sur la traînarde. */
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `/api/products?style=minimaliste&limit=${CACHE_MAX}`,
          { signal: ac.signal },
        );
        if (!r.ok) return;
        const d = await r.json();
        const imgs: string[] = (d.products ?? [])
          .map((p: { image?: string; largeImage?: string }) =>
            getDisplayImageUrl(p.image, p.largeImage),
          )
          .filter(Boolean);
        const uniq = Array.from(new Set(imgs)).slice(0, CACHE_MAX);
        if (uniq.length === 0) return;
        setImages(uniq);
        writeCachedImages(uniq);
      } catch { /* abort ou réseau : on garde le mur déjà affiché */ }
    })();
    return () => ac.abort();
  }, []);

  const columns = Array.from({ length: cols }, (_, c) =>
    images.filter((_, i) => i % cols === c),
  );

  return (
    <section className="wada-bh-section" aria-label="Boutique">
      <div className="wada-bh-hero">
        {/* Mur de vêtements défilant (décoratif) */}
        <div
          className="wada-bh-wall"
          aria-hidden="true"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {columns.map((col, ci) => (
            <div
              key={ci}
              className="wada-bh-col"
              style={{ animationDuration: `${30 + (ci % 4) * 7}s`, animationDelay: `-${(ci % 5) * 6}s` }}
            >
              {col.length > 0 &&
                [...col, ...col].map((src, i) => {
                  /* Fix 2026-06-11 « hero instantané » : les 1res images
                     (above-the-fold) en eager + fetchpriority=high pour
                     remplir le mur dès la 1re paint au lieu de streamer
                     en lazy. Au-delà du seuil on garde lazy. */
                  const isEager = i < Math.max(2, Math.ceil(EAGER_COUNT / cols));
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading={isEager ? "eager" : "lazy"}
                      decoding="async"
                      {...(isEager ? { fetchPriority: "high" as const } : {})}
                    />
                  );
                })}
            </div>
          ))}
        </div>

        {/* Voile sombre pour la lisibilité */}
        <div className="wada-bh-scrim" aria-hidden="true" />

        {/* Contenu superposé */}
        <div className="wada-bh-content">
          <p className="wada-bh-kicker">Inspiré de Sanzō Wada · 1933</p>
          <h1 className="wada-bh-title">Boutique</h1>
          <p className="wada-bh-sub">Les pièces de tes marques, par palette.</p>

          {/* Toggle Femme / Homme */}
          <div className="wada-bh-toggle" role="group" aria-label="Genre">
            <button
              className={`wada-bh-tog${genre === "femme" ? " wada-bh-tog--active" : ""}`}
              onClick={() => setGenre("femme")}
              aria-pressed={genre === "femme"}
            >
              Femme
            </button>
            <button
              className={`wada-bh-tog${genre === "homme" ? " wada-bh-tog--active" : ""}`}
              onClick={() => setGenre("homme")}
              aria-pressed={genre === "homme"}
            >
              Homme
            </button>
          </div>

          {/* 6 catégories */}
          <nav className="wada-bh-cats" aria-label="Catégories">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                href={`${c.href}?genre=${genre}`}
                className="wada-bh-cat"
              >
                {c.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <style>{`
        .wada-bh-section.wada-bh-section {
          display: flex;
          flex: 1 1 auto;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          background: ${CREAM};
        }
        .wada-bh-hero {
          position: relative;
          width: 100%;
          flex: 1 1 auto;
          /* Hauteur du premier écran : tout l'espace visible entre le bandeau
             crème et la barre d'onglets. Le mur descend donc pile jusqu'au
             bord de la barre, et le contenu qui y est ancré (titre, toggle,
             pilules) reste entièrement visible — y compris « Marques », qui
             passait derrière la barre. Plancher à 500px pour les écrans très
             courts (paysage). */
          min-height: max(500px, calc(100svh - var(--wada-nav-h) - var(--wada-tabbar-h)));
          overflow: hidden;
          background: linear-gradient(135deg, #1c1612 0%, #3a342d 50%, #2a2420 100%);
        }
        /* ── Mur défilant ── */
        .wada-bh-wall {
          position: absolute;
          inset: -8px 0;
          display: grid;
          gap: 8px;
          padding: 0 8px;
        }
        .wada-bh-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: max-content;
          animation-name: wada-bh-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .wada-bh-col img {
          width: 100%;
          aspect-ratio: 3 / 4;
          object-fit: cover;
          border-radius: 10px;
          background: #efeae2;
          display: block;
        }
        /* contenu dupliqué → boucle sans couture, sens HAUT → BAS */
        @keyframes wada-bh-scroll {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wada-bh-col { animation: none; }
        }

        /* ── Voile ── */
        .wada-bh-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg,
            rgba(28,22,18,0.50) 0%, rgba(28,22,18,0.36) 42%,
            rgba(20,14,11,0.72) 100%);
        }

        /* ── Contenu ── */
        .wada-bh-content {
          position: absolute; left: 0; right: 0;
          bottom: calc(140px + env(safe-area-inset-bottom, 0px));
          padding: 0 22px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .wada-bh-kicker {
          margin: 0 0 14px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: #F4EFE7; text-shadow: 0 1px 8px rgba(0,0,0,0.7);
        }
        .wada-bh-title {
          margin: 0;
          font-family: 'Fredoka', sans-serif; font-weight: 600;
          font-size: clamp(44px, 12vw, 72px); line-height: 1;
          color: #fff; letter-spacing: -0.01em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.6);
        }
        .wada-bh-sub {
          margin: 12px 0 0;
          font-family: 'Inter', sans-serif; font-size: 15px;
          color: #f4efe2; text-shadow: 0 1px 10px rgba(0,0,0,0.65);
        }

        /* ── Toggle Femme / Homme ── */
        .wada-bh-toggle {
          margin-top: 22px;
          display: flex;
          /* Ring/halo enveloppant retiré (demande user) : plus de fond
             translucide ni de bordure autour de Femme/Homme. Seul le pill
             bordeaux du genre actif reste visible. */
          background: transparent;
          border: none;
          padding: 0;
          gap: 8px;
        }
        .wada-bh-tog {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          letter-spacing: 0.04em;
          padding: 9px 28px;
          border-radius: 999px;
          border: none; cursor: pointer;
          background: transparent;
          color: rgba(255,255,255,0.72);
          transition: background 0.22s ease, color 0.22s ease;
        }
        /* Fix 2026-08-20 : cette classe existait mais n'était JAMAIS posée —
           l'état actif était appliqué en style inline, qui l'emporte sur toute
           règle CSS. Conséquence : la règle :hover ci-dessous ciblait aussi le
           pill actif (sans effet visible) et le halo actif ne pouvait pas être
           thémé depuis la feuille. On pose désormais la classe. */
        .wada-bh-tog--active {
          background: ${BORDEAUX};
          color: #fff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        }
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-tog:not(.wada-bh-tog--active):hover {
            background: rgba(255,255,255,0.18);
            color: #fff;
          }
        }

        /* ── 6 catégories ── */
        .wada-bh-cats {
          margin-top: 18px;
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 8px; max-width: 460px;
        }
        .wada-bh-cat {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 11px 20px; border-radius: 999px;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
          letter-spacing: 0.01em; text-decoration: none;
          background: rgba(255,255,255,0.13);
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.32);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .wada-bh-cat:hover {
            transform: translateY(-2px);
            background: ${BORDEAUX};
            border-color: ${BORDEAUX};
            box-shadow: 0 8px 22px rgba(0,0,0,0.4);
          }
        }
      `}</style>
    </section>
  );
}
