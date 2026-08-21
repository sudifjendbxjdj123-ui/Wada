import { ProduitAwin } from "./schema";

export interface GroupedProduct {
  key: string; // brand-nom
  marque: string;
  nom: string;
  primary: ProduitAwin; // produit principal (affichage défaut)
  variants: ProduitAwin[]; // tous les produits du groupe (variantes couleur)
  uniqueColors: Array<{ hex: string; nom?: string; products: ProduitAwin[] }>;
  allTailles: Set<string>;
}

/**
 * Clé de groupe d'un produit (marque + nom, insensible à la casse).
 *
 * Exportée depuis le 2026-08-20 : la carte produit mémorise les favoris sous
 * `g.key` tandis que la Quick View utilisait `p.id`. Les deux composants
 * décrivaient donc le MÊME produit sous deux clés différentes — un cœur coché
 * sur la carte réapparaissait vide dans la modale. Une seule fonction, une
 * seule clé.
 */
export function groupKeyOf(p: Pick<ProduitAwin, "marque" | "nom">): string {
  return `${(p.marque || "").toLowerCase()}-${(p.nom || "").toLowerCase()}`;
}

/**
 * Groupe les produits par marque + nom, consolidant les variantes couleur.
 * Chaque groupe affiche une carte avec sélecteurs couleur/taille.
 */
export function groupProducts(products: ProduitAwin[]): GroupedProduct[] {
  const groupMap = new Map<string, ProduitAwin[]>();

  // Grouper par brand-nom (case-insensitive)
  for (const p of products) {
    const key = groupKeyOf(p);
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(p);
  }

  // Convertir en GroupedProduct[]
  return Array.from(groupMap.entries()).map(([key, variants]) => {
    const primary = variants[0]!;

    // Grouper les variantes par couleur
    const colorMap = new Map<string, ProduitAwin[]>();
    for (const v of variants) {
      const colorHex = v.hex || "#ccc";
      if (!colorMap.has(colorHex)) colorMap.set(colorHex, []);
      colorMap.get(colorHex)!.push(v);
    }

    const uniqueColors = Array.from(colorMap.entries()).map(([hex, colorProducts]) => ({
      hex,
      nom: colorProducts[0]?.couleurNom,
      products: colorProducts,
    }));

    // Consolider toutes les tailles
    const allTailles = new Set<string>();
    for (const v of variants) {
      for (const t of v.tailles || []) {
        allTailles.add(t);
      }
    }

    return {
      key,
      marque: primary.marque || "",
      nom: primary.nom || "",
      primary,
      variants,
      uniqueColors,
      allTailles,
    };
  });
}
