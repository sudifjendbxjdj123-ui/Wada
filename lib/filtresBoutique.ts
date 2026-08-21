/**
 * Filtres de la page /boutique — état partagé entre l'en-tête (qui les règle)
 * et le catalogue (qui les applique).
 *
 * Pourquoi ce module existe : jusqu'ici, les trois pilules « Filtres »,
 * « Marques » et « Trier par » de /boutique étaient de simples LIENS vers
 * d'autres pages, et les pastilles de couleur envoyaient sur
 * `/vetements?couleur=Sauge` — un paramètre que rien ne lit. Trois des quatre
 * commandes de la page ne filtraient donc rien du tout. Elles règlent
 * désormais un vrai état, appliqué au catalogue de la page.
 *
 * Le vocabulaire est celui de /api/products (`couleurFamille`, `prixMin`,
 * `prixMax`, `promo`, `marques`, `sort`) : c'est lui qui filtre le catalogue
 * complet côté serveur. Filtrer côté client n'aurait trié que les 24 produits
 * déjà chargés — exactement le bug corrigé sur les pages catégorie.
 */

export type FiltresBoutique = {
  /** Famille de couleur de l'API, ou null. Ex. « vert », « bleu ». */
  couleur: string | null;
  prixMin: number | null;
  prixMax: number | null;
  /** Uniquement les articles dont le prix barré est réellement supérieur. */
  promo: boolean;
  /** Noms de marques tels que le catalogue les orthographie. */
  marques: string[];
  /** "" | "nouveau" | "prix-asc" | "prix-desc" | "remise" */
  sort: string;
};

export const FILTRES_VIDES: FiltresBoutique = {
  couleur: null, prixMin: null, prixMax: null,
  promo: false, marques: [], sort: "",
};

/** Les douze familles que /api/products sait réellement filtrer.
 *
 *  L'ancienne liste de la boutique (« Sauge », « Mousse », « Camel »,
 *  « Rouille »…) était un choix de nuances, pas de familles : aucun de ces
 *  noms n'existe côté filtre, et deux d'entre eux — sauge et mousse —
 *  auraient de toute façon rendu exactement les mêmes produits, tous deux
 *  étant du vert. Un client qui voit deux pastilles différentes attend deux
 *  résultats différents.
 *
 *  Le `hex` est une teinte représentative de la famille, pas une couleur du
 *  catalogue : il sert à rendre la pastille reconnaissable. */
export const FAMILLES_COULEUR: Array<{ cle: string; nom: string; hex: string }> = [
  { cle: "noir",   nom: "Noir",   hex: "#1E1E1E" },
  { cle: "blanc",  nom: "Blanc",  hex: "#F4EFE6" },
  { cle: "gris",   nom: "Gris",   hex: "#9A9A96" },
  { cle: "beige",  nom: "Beige",  hex: "#C4A484" },
  { cle: "marron", nom: "Marron", hex: "#5A4530" },
  { cle: "bleu",   nom: "Bleu",   hex: "#2A3A56" },
  { cle: "vert",   nom: "Vert",   hex: "#5A6F4A" },
  { cle: "rouge",  nom: "Rouge",  hex: "#A03A2E" },
  { cle: "rose",   nom: "Rose",   hex: "#D99AA6" },
  { cle: "jaune",  nom: "Jaune",  hex: "#D8B54A" },
  { cle: "orange", nom: "Orange", hex: "#B4643C" },
  { cle: "violet", nom: "Violet", hex: "#6B5378" },
];

/** Fourchettes de prix proposées. Bornes rondes, lisibles à voix haute. */
export const TRANCHES_PRIX: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: "Moins de 50 €", min: null, max: 50 },
  { label: "50 – 100 €",    min: 50,   max: 100 },
  { label: "100 – 200 €",   min: 100,  max: 200 },
  { label: "200 – 500 €",   min: 200,  max: 500 },
  { label: "Plus de 500 €", min: 500,  max: null },
];

/** Tris proposés.
 *
 *  « Populaire » est volontairement absent : `sortProducts` sait le faire,
 *  mais il s'appuie sur `popularite`, qu'aucun flux ne renseigne. L'option
 *  aurait donc rendu l'ordre du catalogue sous un nom qui promet autre chose. */
export const TRIS: Array<{ valeur: string; label: string }> = [
  { valeur: "",          label: "Notre sélection" },
  { valeur: "nouveau",   label: "Nouveautés" },
  { valeur: "prix-asc",  label: "Prix croissant" },
  { valeur: "prix-desc", label: "Prix décroissant" },
  { valeur: "remise",    label: "Meilleures remises" },
];

export function nombreFiltresActifs(f: FiltresBoutique): number {
  return (f.couleur ? 1 : 0)
    + (f.prixMin !== null || f.prixMax !== null ? 1 : 0)
    + (f.promo ? 1 : 0)
    + f.marques.length;
}

/** Filtres → paramètres de /api/products. */
export function filtresVersParams(f: FiltresBoutique): URLSearchParams {
  const p = new URLSearchParams();
  if (f.couleur) p.set("couleurFamille", f.couleur);
  if (f.prixMin !== null) p.set("prixMin", String(f.prixMin));
  if (f.prixMax !== null) p.set("prixMax", String(f.prixMax));
  if (f.promo) p.set("promo", "1");
  if (f.marques.length) p.set("marques", f.marques.join(","));
  if (f.sort) p.set("sort", f.sort);
  return p;
}

/** Filtres → URL /vetements, dans le vocabulaire de `lib/categoryFilters`
 *  (`colors`, `genres`, `brands`, `priceMin`…). C'est le seul que la page
 *  catégorie sait relire : `couleur=` et `genre=` au singulier y étaient
 *  ignorés, et le client atterrissait sur le catalogue entier. */
export function filtresVersUrlCategorie(f: FiltresBoutique, genre?: string | null): string {
  const p = new URLSearchParams();
  if (genre) p.set("genres", genre.toLowerCase());
  if (f.couleur) {
    const fam = FAMILLES_COULEUR.find((c) => c.cle === f.couleur);
    if (fam) p.set("colors", fam.nom);
  }
  if (f.prixMin !== null) p.set("priceMin", String(f.prixMin));
  if (f.prixMax !== null) p.set("priceMax", String(f.prixMax));
  if (f.promo) p.set("onSale", "1");
  if (f.marques.length) p.set("brands", f.marques.join(","));
  if (f.sort) p.set("sort", f.sort);
  const qs = p.toString();
  return qs ? `/vetements?${qs}` : "/vetements";
}
