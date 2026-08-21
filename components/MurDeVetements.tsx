"use client";
import { useEffect, useState } from "react";
import { getDisplayImageUrl } from "@/lib/image-utils";

/**
 * MurDeVetements — le mur de vêtements qui défile, en fond.
 *
 * Extrait de BoutiqueHero (2026-08-22) pour être réutilisable : le client
 * demande ce fond sur l'ACCUEIL, à la place de la photo + vidéo, et une
 * boutique sans lui. Le composant ne fait que le décor — pas de titre, pas de
 * boutons : chaque page pose son contenu par-dessus.
 *
 * Toute la mécanique de performance vient de BoutiqueHero et reste valable :
 *  - cache localStorage des URLs pour remplir le mur sans attendre l'API ;
 *  - lecture du cache dans un EFFET et non pendant le render (sinon le HTML
 *    serveur et le HTML client divergent → erreur d'hydratation) ;
 *  - 30 images maximum, 8 en priorité haute, le reste en lazy ;
 *  - une seule requête /api/products, sans `slot` (qui ne sert qu'à des
 *    exclusions) — trois requêtes pour un décor coûtaient trois balayages du
 *    catalogue côté serveur.
 */

const CACHE_KEY = "wada-boutique-hero-images";
const CACHE_MAX = 30;
const EAGER_COUNT = 8;

const FALLBACK_IMAGES = Array.from({ length: 24 }, (_, i) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect fill='%23${["d4c5b9", "c9b8ac", "e8ddd4", "bfb0a4"][i % 4]}' width='400' height='500'/%3E%3C/svg%3E`
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

export default function MurDeVetements({
  /* Le voile sombre est utile quand du texte blanc passe par-dessus
     (accueil, ancienne boutique) ; inutile sur un fond clair. */
  voile = true,
}: { voile?: boolean }) {
  const [images, setImages] = useState<string[]>(FALLBACK_IMAGES);
  const [cols, setCols] = useState(4);

  useEffect(() => {
    const cached = readCachedImages();
    if (cached !== FALLBACK_IMAGES) setImages(cached);
  }, []);

  useEffect(() => {
    const update = () => setCols(Math.max(3, Math.round(window.innerWidth / 260)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const r = await fetch(`/api/products?style=minimaliste&limit=${CACHE_MAX}`, { signal: ac.signal });
        if (!r.ok) return;
        const d = await r.json();
        const imgs: string[] = (d.products ?? [])
          .map((p: { image?: string; largeImage?: string }) =>
            getDisplayImageUrl(p.image, p.largeImage))
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
    <>
      <div
        className="wada-bh-wall"
        aria-hidden="true"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {columns.map((col, ci) => (
          <div
            key={ci}
            className="wada-bh-col"
            style={{
              animationDuration: `${30 + (ci % 4) * 7}s`,
              animationDelay: `-${(ci % 5) * 6}s`,
            }}
          >
            {col.length > 0 &&
              [...col, ...col].map((src, i) => {
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
      {voile && <div className="wada-bh-scrim" aria-hidden="true" />}

      {/* Styles du mur, déplacés depuis BoutiqueHero avec le composant. Les
          laisser là-bas aurait donné un accueil sans aucune mise en page dès
          que la boutique cesserait de monter son hero. */}
      <style>{`
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
        /* Contenu dupliqué → boucle sans couture, sens HAUT → BAS. */
        @keyframes wada-bh-scroll {
          from { transform: translateY(-50%); }
          to   { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wada-bh-col { animation: none; }
        }
        .wada-bh-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg,
            rgba(28,22,18,0.50) 0%, rgba(28,22,18,0.36) 42%,
            rgba(20,14,11,0.72) 100%);
        }
      `}</style>
    </>
  );
}
