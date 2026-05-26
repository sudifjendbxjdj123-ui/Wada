import type { Metadata } from "next";
import { dictionary } from "@/lib/data";
import { pageMetadata } from "@/lib/pageMetadata";

/**
 * generateMetadata dynamique pour /palette/[number]/piece/[index] —
 * une fiche par pièce de palette (haut/bas/veste/chaussures/accent).
 *
 * Brief Pinterest Rich Pins (25/05) — type d'OG = `product` :
 *   Pinterest et Facebook reconnaissent og:type=product et affichent
 *   un Product Rich Pin (titre + image + extrait + lien direct).
 *   La JSON-LD Product déjà présente dans la page (cf. task #68) fournit
 *   les données structurées de fallback. Combiné OG product + JSON-LD
 *   Product = couverture maximale pour Pinterest, Facebook, Google.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ number: string; index: string }> }
): Promise<Metadata> {
  const { number, index } = await params;
  const entry = dictionary.find((d) => d.number === number);
  const pieceIdx = parseInt(index, 10);
  const piece = entry?.composition[pieceIdx];

  if (!entry || !piece) {
    return pageMetadata({
      path: `/palette/${number}/piece/${index}`,
      title: "Pièce introuvable",
      description: "Cette pièce de palette n'existe pas dans le dictionnaire WADA.",
      noindex: true,
    });
  }

  /* Couleur associée à la pièce (heuristique simple : on prend la 1ère
     couleur de la palette qui apparaît dans le nom de la pièce, sinon
     la première couleur de la palette). */
  const color = entry.colors.find((c) =>
    piece.item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])
  ) || entry.colors[0];

  return pageMetadata({
    path: `/palette/${number}/piece/${pieceIdx}`,
    title: `${piece.item} — accord No. ${number} ${entry.name}`,
    description: `${piece.item} en ${color.name.toLowerCase()}. Pièce de la palette Sanzo Wada n°${number} (${entry.name}). Trouvez-la chez nos marchands partenaires.`,
    /* Note Pinterest (25/05) : pas d'og:type=product (Next.js Metadata
       ne le supporte pas dans son union de types). La JSON-LD Schema.org/
       Product déjà dans la page (cf. task #68) est lue directement par
       Pinterest pour les Product Rich Pins. */
  });
}

export default function PieceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
