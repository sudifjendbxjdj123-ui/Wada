"use client";
/**
 * /boutique — Page shopping WADA.
 *
 * Fix 2026-06-11 « hero instantané » : retiré le caches.delete("products-v1")
 * qui s'exécutait à chaque mount → toutes les requêtes /api/products
 * repartaient à froid (4-6s contre ~200ms en chaud). Le cache produits doit
 * être invalidé par /api/cron, pas par l'utilisateur qui ouvre la page.
 */
import BackButton from "@/components/BackButton";
import BoutiqueEntete from "@/components/BoutiqueEntete";
import { BrandShowcaseCompact } from "@/components/BrandShowcaseCompact";

export default function BoutiquePage() {
  return (
    <main
      style={{
        background: "#FAF8F4",
        /* Fix 2026-08-20 « pilule Marques coupée » : ce <main> imposait
           `minHeight: 100svh`. Mais il démarre SOUS le bandeau crème, et la
           barre d'onglets fixe recouvre le bas de l'écran : un premier écran
           de 100svh finissait donc largement derrière la barre. Sur iPhone
           c'est pire, le bandeau passant à ~105px avec la safe-area — et le
           contenu du hero, ancré à 140px du bas de celui-ci, tombait pile
           sous la barre. C'est désormais le hero lui-même qui fixe la hauteur
           du premier écran (cf. `.wada-bh-hero`), la vitrine des marques
           coulant simplement à sa suite. */
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
      <BoutiqueEntete />

      {/* Fill dead spaces - Compact brand showcase */}
      <div style={{ maxWidth: 1200, margin: "28px auto 40px", width: "100%", padding: "0 20px" }}>
        <BrandShowcaseCompact maxProducts={6} cols={3} />
      </div>
    </main>
  );
}
