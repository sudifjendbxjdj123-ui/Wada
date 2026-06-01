/**
 * lib/composer/types.ts
 *
 * Brief 2026-06-01 « Composer IA — code prêt à coller » §1.
 * Types fondamentaux du moteur de composition de tenue WADA.
 *
 * Conventions :
 *   - Registre en snake_case (avant_garde, heritage_country, apres_ski).
 *     Aliasé sur le type BrandRegistre existant de lib/brandRegistre.ts.
 *   - Slot/Genre identiques aux types existants de lib/schema.ts (ProduitAwin)
 *     pour éviter les double mapping côté API.
 *
 * Les modules dans ce dossier sont indépendants des autres lib/ pour permettre
 * une refonte progressive du composer sans casser /api/products legacy.
 */

import type { BrandRegistre } from "@/lib/brandRegistre";
import type { ProduitAwin, ProductCategorie, ProductGenre } from "@/lib/schema";

/** Alias sémantique : Registre = BrandRegistre (8 valeurs en 2026-06-01). */
export type Registre = BrandRegistre;

/** Slot tenue WADA — déjà défini dans schema.ts (ProductCategorie). */
export type Slot = ProductCategorie; // "haut" | "bas" | "veste" | "chaussures" | "accent"

/** Genre — alias de ProductGenre existant. On accepte "mixte" en synonyme
 *  de "unisexe" côté entrée (le nouveau sélecteur palette utilise "Mixte"). */
export type Genre = ProductGenre | "mixte"; // homme | femme | unisexe | inconnu | mixte

export type Saison = "ete" | "mi_saison" | "hiver" | "toute_saison";

export type Occasion =
  | "bureau"
  | "quotidien"
  | "soiree"
  | "weekend"
  | "voyage"
  | "rendez_vous"
  | "ceremonie";

/** Budget en bucket — aligné avec le profil utilisateur existant. */
export type Budget = "lt_150" | "150_400" | "400_1000" | "premium";

/** Mood palette — usage interne, dérivé via paletteIdentity() au runtime. */
export type Mood = "calme_epure" | "chaleureux" | "theatral" | "sobre" | "audacieux";

/** Envie utilisateur — chip choisi avant la composition. */
export type Envie =
  | "confortable"
  | "elegant"
  | "discret"
  | "affirme"
  | "creatif"
  | "intemporel";

/** Variante de tenue générée (3 variations + 1 idéal sans contrainte budget). */
export type Variation = "safe" | "bold" | "budget" | "ideal";

/**
 * Product — vue normalisée d'un produit pour le composer.
 * Construit depuis ProduitAwin existant + getRegistre() dérivé.
 */
export interface ComposerProduct {
  id: string;
  brand_name: string;
  product_name: string;
  slot: Slot;
  genre: Genre;
  couleur_principale: { hex: string; nom: string };
  matiere: string;
  saison: Saison[];
  prix_eur: number;
  url_image: string;
  url_buy: string;
  source: string;          // marchandSlug (muji / the-business-fashion / suitable-fr)
  in_stock: boolean;
  registre: Registre;      // résolu via brandToRegistre()
}

/**
 * PaletteIdentity — palette enrichie avec les métadonnées composer.
 * Dérivée de DictionaryEntry (lib/data.ts) via paletteIdentity() helper.
 *
 * Pour les 348 palettes existantes, les champs manquants sont dérivés
 * de styles[] + culture + seasons[] avec des défauts raisonnables. Une
 * future migration peut enrichir le JSON canonique.
 */
export interface PaletteIdentity {
  ref: string;                       // "162" (= entry.number)
  nom: string;                       // "Tweed & Encre"
  culture: string;                   // entry.culture
  registre: Registre;                // inféré depuis styles[0]
  mood: Mood;
  saison: Saison[];                  // inféré depuis seasons[]
  occasion: Occasion[];              // inféré depuis occasions
  matieres_attendues: string[];      // dérivé du registre
  matieres_interdites: string[];     // dérivé du registre (ex. polyester technique en classique)
  couleur_principale: string;        // hex de couleurs[0]
  couleurs_neutres: string[];        // hex de couleurs[1..]
  couleurs_interdites_hex: string[]; // hex à exclure (souvent vide par défaut)
  marques_inspiration: string[];     // optionnel — laissé vide par défaut
  marques_interdites: string[];      // dérivé du registre via registreCompat
  histoire: string;                  // entry.description
}

/** Profil utilisateur côté composer (input client). */
export interface ComposerProfile {
  genre: Genre;
  budget: Budget;
  envie?: Envie;
  occasion?: Occasion;
  inspiration?: "tendance" | "intemporel" | "avant_garde" | "classique_revisite";
  likes_couleurs?: string[];
  dislikes_marques?: string[];
}

/** Output final d'une composition. */
export interface ComposedOutfit {
  pieces: Partial<Record<Slot, ComposerProduct>>;
  total_eur: number;
  score: number;                                  // 0-100
  llm_verdict?: "COHERENT" | "INCOHERENT";
  llm_reason?: string;
  variation: Variation;
  overshoot?: number;                             // % de dépassement budget (0-1+)
}

/**
 * Adaptateur ProduitAwin → ComposerProduct.
 * Le pool persisté KV utilise ProduitAwin ; le composer utilise ComposerProduct.
 * Conversion 1-to-1 sans perte avec fallback gracieux pour les champs manquants
 * (saison, matière) souvent vides dans les feeds Awin.
 */
export function toComposerProduct(p: ProduitAwin): ComposerProduct | null {
  if (!p.brandRegistre) return null; // sans registre on ne sait pas placer
  return {
    id: p.id,
    brand_name: p.marque || p.marchand,
    product_name: p.nom,
    slot: p.categorie,
    genre: p.genre,
    couleur_principale: { hex: p.hex, nom: p.couleurNom || "non précisé" },
    matiere: "", // les feeds Awin ne fournissent pas systématiquement la matière
    saison: ["toute_saison"], // fallback — à dériver depuis description plus tard
    prix_eur: p.prix,
    url_image: p.largeImage || p.image,
    url_buy: p.urlProduit || "",
    source: p.marchandSlug || "unknown",
    in_stock: p.enStock,
    registre: p.brandRegistre,
  };
}
