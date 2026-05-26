import type { Metadata } from "next";
import { dictionary } from "@/lib/data";
import { pageMetadata } from "@/lib/pageMetadata";

/**
 * generateMetadata dynamique pour /palette/[number] — utilise le nom de la
 * palette et ses couleurs pour produire un title + description uniques par
 * page, ce qui est critique pour le SEO (348 pages = 348 fiches indexables).
 */
export async function generateMetadata(
  { params }: { params: Promise<{ number: string }> }
): Promise<Metadata> {
  const { number } = await params;
  const entry = dictionary.find((d) => d.number === number);

  if (!entry) {
    return pageMetadata({
      path: `/palette/${number}`,
      title: "Palette introuvable",
      description: "Cette palette n'existe pas dans le dictionnaire WADA.",
      noindex: true,
    });
  }

  const colors = entry.colors.map((c) => c.name).join(" · ");
  const culture = entry.culture ? ` · ${entry.culture}` : "";

  return pageMetadata({
    path: `/palette/${number}`,
    title: `${entry.name} — palette n°${number}${culture}`,
    description: `Palette Sanzo Wada n°${number} : ${colors}. Tenue complète shoppable inspirée de cette combinaison chromatique.`,
    /* Brief Pinterest Rich Pins (25/05) — chaque page palette est un
       contenu éditorial unique (l'accord, son histoire, sa traduction
       en tenue). Article Rich Pin sur Pinterest = titre + extrait +
       auteur affichés directement dans le pin. */
    ogType: "article",
    author: "WADA",
  });
}

/* ──────────────────────────────────────────────────────────────────────
   JSON-LD BreadcrumbList + Article (brief SEO 2026-05-23)
   ──────────────────────────────────────────────────────────────────────
   Permet à Google d'afficher le fil d'Ariane dans les résultats (Atelier
   › Palettes › No. 094 Béton & Lin) et de mieux indexer chaque page
   palette comme un contenu éditorial unique. */
async function PaletteBreadcrumb({ paletteNumber }: { paletteNumber: string }) {
  const { dictionary } = await import("@/lib/data");
  const entry = dictionary.find((d) => d.number === paletteNumber);
  if (!entry) return null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", position: 1, name: "Atelier", item: "https://www.wada.style/atelier" },
      { "@type": "ListItem", position: 2, name: "Palettes", item: "https://www.wada.style/palettes" },
      { "@type": "ListItem", position: 3, name: `No. ${entry.number} ${entry.name}`, item: `https://www.wada.style/palette/${entry.number}` },
    ],
  };
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `${entry.name} — palette n°${entry.number}`,
    "description": `Palette Sanzo Wada n°${entry.number} : ${entry.colors.map((c) => c.name).join(" · ")}.`,
    /* Brief audit (25/05) — pointer sur l'OG image dynamique de la palette
       (rendue par opengraph-image.tsx, PNG 1200×630 avec les vraies
       couleurs de cette palette) plutôt que la SVG générique. */
    "image": `https://www.wada.style/palette/${entry.number}/opengraph-image`,
    "author": { "@type": "Organization", "name": "WADA" },
    "publisher": { "@type": "Organization", "name": "WADA", "logo": { "@type": "ImageObject", "url": "https://www.wada.style/icon-512.png" } },
    "url": `https://www.wada.style/palette/${entry.number}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
    </>
  );
}

export default async function PaletteLayout(
  { children, params }: { children: React.ReactNode; params: Promise<{ number: string }> }
) {
  const { number } = await params;
  return (
    <>
      <PaletteBreadcrumb paletteNumber={number} />
      {children}
    </>
  );
}
