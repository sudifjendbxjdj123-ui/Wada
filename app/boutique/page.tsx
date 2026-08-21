"use client";
/**
 * /boutique — Page shopping WADA.
 *
 * Fix 2026-06-11 « hero instantané » : retiré le caches.delete("products-v1")
 * qui s'exécutait à chaque mount → toutes les requêtes /api/products
 * repartaient à froid (4-6s contre ~200ms en chaud). Le cache produits doit
 * être invalidé par /api/cron, pas par l'utilisateur qui ouvre la page.
 */
import { useCallback, useState } from "react";
import type { DictionaryEntry } from "@/lib/data";
import BackButton from "@/components/BackButton";
import BoutiqueEntete from "@/components/BoutiqueEntete";
import CataloguePalette from "@/components/CataloguePalette";

export default function BoutiquePage() {
  /* Palette du jour et genre, remontés par l'en-tête. Le catalogue s'en sert
     pour filtrer ses produits et nommer la teinte portée par chacun. */
  const [contexte, setContexte] = useState<{
    palette: DictionaryEntry | null;
    genre: string;
  }>({ palette: null, genre: "femme" });

  /* useCallback : sans lui, une nouvelle fonction à chaque rendu relancerait
     l'effet de l'en-tête en boucle. */
  const majContexte = useCallback(
    (ctx: { palette: DictionaryEntry | null; genre: string }) => setContexte(ctx),
    [],
  );

  return (
    <main
      style={{
        background: "#FAF8F4",
        /* Fix 2026-08-20 « pilule Marques coupée » : ce <main> imposait
           `minHeight: 100svh`. Mais il démarre SOUS le bandeau crème, et la
           barre d'onglets fixe recouvre le bas de l'écran : un premier écran
           de 100svh finissait donc largement derrière la barre. C'est
           désormais le contenu qui fixe sa hauteur. */
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <BackButton fallback="/" />
      </div>

      {/* Le mur de vêtements défilant est parti sur l'accueil (client
          2026-08-22). La boutique reçoit à la place une entrée de catalogue
          lisible : titre, genre, catégories, filtres, couleurs, palette du
          jour. Un mur d'images qui bouge est une belle porte d'entrée, mais
          une mauvaise page de courses. */}
      <BoutiqueEntete onContexte={majContexte} />

      {/* Vrai catalogue produits (client 2026-08-22 : « je remplacerais
          complètement À découvrir par un vrai catalogue produits, comme un
          e-commerce mode »). Il remplace BrandShowcaseCompact, qui montrait
          six vignettes dans un cadre blanc — une vitrine, pas une boutique.
          Pas de conteneur autour de la grille : les cartes sont posées sur le
          fond crème, comme sur Zalando ou BSTN. */}
      <div style={{ width: "100%", padding: "26px 5% 46px" }}>
        <CataloguePalette
          palette={contexte.palette}
          genre={contexte.genre}
          limit={24}
        />
      </div>
    </main>
  );
}
