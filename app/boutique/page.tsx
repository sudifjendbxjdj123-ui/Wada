"use client";
/**
 * /boutique — Page shopping WADA.
 *
 * Maquette client 2026-08-23 (« je veux ça »). La page s'ouvre désormais sur
 * la recherche et les produits. Ce qui l'ouvrait avant — un bouton Retour, un
 * titre « BOUTIQUE », un sous-titre, deux pilules de genre, six onglets de
 * catégorie, trois pilules de filtre et dix pastilles de couleur — occupait
 * près de six cents pixels, soit la moitié d'un écran de téléphone, avant le
 * premier article. Les commandes n'ont pas disparu : elles sont descendues
 * dans BarreCatalogue, juste au-dessus de la grille qu'elles pilotent.
 *
 * Fix 2026-06-11 « hero instantané » : ne pas remettre de caches.delete(
 * "products-v1") au montage — toutes les requêtes /api/products repartaient
 * à froid (4-6 s contre ~200 ms en chaud). Le cache produits est invalidé par
 * /api/cron, pas par l'utilisateur qui ouvre la page.
 */
import { useCallback, useState } from "react";
import { FILTRES_VIDES, type FiltresBoutique } from "@/lib/filtresBoutique";
import { usePaletteDuJour, useGenreMemorise } from "@/lib/paletteDuJour";
import BarreCatalogue from "@/components/BarreCatalogue";
import CataloguePalette from "@/components/CataloguePalette";
import VitrineBoutique from "@/components/VitrineBoutique";
import BandeauConfiance from "@/components/BandeauConfiance";

export default function BoutiquePage() {
  const palette = usePaletteDuJour();
  const [genre, setGenre] = useGenreMemorise();
  const [filtres, setFiltres] = useState<FiltresBoutique>(FILTRES_VIDES);
  const [panneau, setPanneau] = useState<string | null>(null);

  /* Les marques du résultat courant font l'aller-retour : le catalogue les
     découvre en interrogeant l'API, la barre s'en sert pour peupler son
     panneau « Marques ». Le catalogue est le seul à parler à l'API — une
     seconde requête depuis la barre aurait doublé la charge pour la même
     information. useCallback : sans lui, une nouvelle fonction à chaque rendu
     relancerait l'effet du catalogue en boucle. */
  const [marques, setMarques] = useState<Array<{ nom: string; n: number }>>([]);
  const [marquesTotal, setMarquesTotal] = useState<number | null>(null);
  const majMarques = useCallback(
    (m: Array<{ nom: string; n: number }>, total: number | null) => {
      setMarques(m);
      if (total !== null) setMarquesTotal(total);
    },
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
      {/* Plus de bouton Retour flottant : la boutique est une destination de
          la barre d'onglets du bas, pas une sous-page dont on ressort. Il
          poussait en plus le contenu de 62 px vers le bas pour ne pas passer
          derrière lui. */}
      <div style={{ width: "100%", padding: "18px 5% 46px" }}>
        {/* Recherche, onglets, bannière remises, tendances, palette,
            nouveautés, été, sport, réassurance. */}
        <VitrineBoutique genre={genre} palette={palette} />

        {/* Le catalogue et ses commandes ferment la page : on y arrive après
            avoir parcouru les sélections, au moment où l'on veut chercher
            soi-même. */}
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <BarreCatalogue
            genre={genre}
            onGenre={setGenre}
            filtres={filtres}
            onFiltres={setFiltres}
            panneau={panneau}
            onPanneau={setPanneau}
            marquesDisponibles={marques}
          />
          <CataloguePalette
            palette={palette}
            genre={genre}
            filtres={filtres}
            onMarques={majMarques}
            limit={24}
          />
        </div>

        {/* Réassurance en pied de page (maquette client 2026-08-23). Le texte
            diffère de la maquette : voir l'explication dans le composant —
            WADA n'expédie rien, n'encaisse rien et ne traite aucun retour. */}
        <div style={{ maxWidth: 1200, margin: "26px auto 0", width: "100%" }}>
          <BandeauConfiance marquesTotal={marquesTotal} />
        </div>
      </div>
    </main>
  );
}
