/**
 * WADA Capsule Wardrobe — inventaire structuré
 * ─────────────────────────────────────────────────────────────────────────
 * Décomposition du moodboard "dossier pour HABITS.png" en items
 * individuels typés. Sert de "source of truth" pour les recommandations
 * outfit basées sur un inventaire FIXE (vs le scoring dynamique sur le
 * dictionnaire de 348 palettes).
 *
 * Architecture :
 *   IMAGE CAPSULE → JSON wardrobe (ce fichier) → page /capsule
 *   ↳ Claude (stylist) recompose 5 tenues capsule à partir d'ici
 *
 * Style global : quiet luxury / Scandinavian minimalism / Japanese functional
 * Palette neutre : noir, blanc, écru, beige, gris, brun, indigo profond
 *
 * Convention IDs :
 *   {gender}-{category}-{slug-court}
 *   ex: "f-top-chemise-oxford-blanche", "h-shoe-derbie-cuir-noir"
 */

export type ItemCategory =
  | "tops" | "bottoms" | "dresses" | "knits" | "outerwear"
  | "shoes" | "bags" | "accessories" | "underwear_basic";

export type CapsuleItem = {
  id: string;
  name: string;              // Display FR
  category: ItemCategory;
  gender: "femme" | "homme" | "unisexe";
  color: string;             // EN normalisé (black, white, cream...)
  color_fr: string;          // FR display
  material_guess: string;    // Cotton, wool, cashmere, linen, leather...
  fit: "fitted" | "regular" | "oversized" | "draped";
  style_dna: string[];       // ["quiet luxury", "minimal", "capsule"]
  occasion: string[];        // ["bureau", "quotidien", "soir", "voyage"]
};

/* ──────────────────────────────────────────────────────────────────────
   FEMME — TOPS
   ────────────────────────────────────────────────────────────────────── */
const FEMME_TOPS: CapsuleItem[] = [
  { id: "f-top-chemise-oxford-blanche", name: "Chemise oxford blanche", category: "tops", gender: "femme", color: "white", color_fr: "blanc", material_guess: "cotton poplin", fit: "regular", style_dna: ["quiet luxury", "minimal", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-top-chemise-popeline-blanche", name: "Chemise popeline blanche oversize", category: "tops", gender: "femme", color: "white", color_fr: "blanc cassé", material_guess: "cotton poplin", fit: "oversized", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "f-top-tshirt-blanc", name: "T-shirt blanc essentiel", category: "tops", gender: "femme", color: "white", color_fr: "blanc", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "voyage"] },
  { id: "f-top-tshirt-noir", name: "T-shirt noir essentiel", category: "tops", gender: "femme", color: "black", color_fr: "noir", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "voyage"] },
  { id: "f-top-pull-fin-noir", name: "Pull fin col rond noir", category: "tops", gender: "femme", color: "black", color_fr: "noir", material_guess: "fine merino wool", fit: "fitted", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien", "soir"] },
  { id: "f-top-pull-fin-beige", name: "Pull fin col rond beige", category: "tops", gender: "femme", color: "beige", color_fr: "beige sable", material_guess: "fine merino wool", fit: "fitted", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-top-bustier-noir", name: "Top bustier noir", category: "tops", gender: "femme", color: "black", color_fr: "noir", material_guess: "stretch cotton", fit: "fitted", style_dna: ["minimal", "soir"], occasion: ["soir", "sorties"] },
  { id: "f-top-body-noir", name: "Body col bateau noir", category: "tops", gender: "femme", color: "black", color_fr: "noir", material_guess: "stretch jersey", fit: "fitted", style_dna: ["minimal"], occasion: ["bureau", "soir"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — BOTTOMS
   ────────────────────────────────────────────────────────────────────── */
const FEMME_BOTTOMS: CapsuleItem[] = [
  { id: "f-bot-pantalon-tailleur-noir", name: "Pantalon de tailleur noir", category: "bottoms", gender: "femme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "soir"] },
  { id: "f-bot-pantalon-large-beige", name: "Pantalon large beige", category: "bottoms", gender: "femme", color: "beige", color_fr: "beige sable", material_guess: "wool flannel", fit: "oversized", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-bot-pantalon-large-creme", name: "Pantalon large crème", category: "bottoms", gender: "femme", color: "cream", color_fr: "crème", material_guess: "wool blend", fit: "oversized", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "f-bot-jean-droit-indigo", name: "Jean droit indigo profond", category: "bottoms", gender: "femme", color: "indigo", color_fr: "indigo profond", material_guess: "raw denim", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "voyage"] },
  { id: "f-bot-jupe-satin-noire", name: "Jupe satin noire midi", category: "bottoms", gender: "femme", color: "black", color_fr: "noir", material_guess: "silk satin", fit: "fitted", style_dna: ["quiet luxury", "soir"], occasion: ["soir", "sorties"] },
  { id: "f-bot-short-noir", name: "Short tailleur noir", category: "bottoms", gender: "femme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["minimal", "soir"], occasion: ["soir", "été"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — DRESSES
   ────────────────────────────────────────────────────────────────────── */
const FEMME_DRESSES: CapsuleItem[] = [
  { id: "f-dress-robe-pull-noire", name: "Robe pull noire mi-longue", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "merino wool", fit: "fitted", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "soir"] },
  { id: "f-dress-robe-froncee-noire", name: "Robe froncée noire", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "viscose", fit: "draped", style_dna: ["minimal", "soir"], occasion: ["soir", "sorties"] },
  { id: "f-dress-robe-trench-beige", name: "Robe trench beige", category: "dresses", gender: "femme", color: "beige", color_fr: "beige clair", material_guess: "cotton gabardine", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "voyage"] },
  { id: "f-dress-robe-noire-bretelles", name: "Robe noire à bretelles", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "stretch jersey", fit: "fitted", style_dna: ["minimal", "soir"], occasion: ["soir"] },
  { id: "f-dress-robe-chemise-noire", name: "Robe chemise noire", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "viscose poplin", fit: "regular", style_dna: ["minimal", "capsule"], occasion: ["bureau", "quotidien"] },
  { id: "f-dress-robe-portefeuille-noire", name: "Robe portefeuille noire", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "viscose", fit: "draped", style_dna: ["minimal", "soir"], occasion: ["soir", "bureau"] },
  { id: "f-dress-combinaison-noire", name: "Combinaison large noire", category: "dresses", gender: "femme", color: "black", color_fr: "noir", material_guess: "viscose blend", fit: "oversized", style_dna: ["minimal", "soir"], occasion: ["soir", "sorties"] },
  { id: "f-dress-combinaison-tailleur", name: "Combinaison tailleur beige", category: "dresses", gender: "femme", color: "beige", color_fr: "beige", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "soir"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — KNITS / SWEATERS
   ────────────────────────────────────────────────────────────────────── */
const FEMME_KNITS: CapsuleItem[] = [
  { id: "f-knit-pull-cachemire-noir", name: "Pull cachemire col rond noir", category: "knits", gender: "femme", color: "black", color_fr: "noir", material_guess: "cashmere", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-knit-cardigan-beige", name: "Cardigan boutonné beige", category: "knits", gender: "femme", color: "beige", color_fr: "beige sable", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-knit-pull-col-v-gris", name: "Pull col V gris perle", category: "knits", gender: "femme", color: "grey", color_fr: "gris perle", material_guess: "merino wool", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "f-knit-col-roule-blanc", name: "Pull col roulé blanc cassé", category: "knits", gender: "femme", color: "white", color_fr: "blanc cassé", material_guess: "merino wool", fit: "fitted", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "hiver"] },
  { id: "f-knit-sweat-blanc", name: "Sweat-shirt blanc essentiel", category: "knits", gender: "femme", color: "white", color_fr: "blanc cassé", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "voyage"] },
  { id: "f-knit-hoodie-noir", name: "Hoodie noir minimal", category: "knits", gender: "femme", color: "black", color_fr: "noir", material_guess: "heavy cotton", fit: "oversized", style_dna: ["minimal", "streetwear"], occasion: ["quotidien"] },
  { id: "f-knit-cardigan-creme", name: "Cardigan crème oversize", category: "knits", gender: "femme", color: "cream", color_fr: "crème", material_guess: "wool blend", fit: "oversized", style_dna: ["quiet luxury", "old money"], occasion: ["quotidien", "voyage"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — OUTERWEAR
   ────────────────────────────────────────────────────────────────────── */
const FEMME_OUTERWEAR: CapsuleItem[] = [
  { id: "f-out-blazer-noir", name: "Blazer noir structuré", category: "outerwear", gender: "femme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "soir"] },
  { id: "f-out-blazer-cuir", name: "Veste cuir noire", category: "outerwear", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "fitted", style_dna: ["minimal", "streetwear"], occasion: ["quotidien", "sorties"] },
  { id: "f-out-trench-beige", name: "Trench beige classique", category: "outerwear", gender: "femme", color: "beige", color_fr: "beige clair", material_guess: "cotton gabardine", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-out-manteau-long-beige", name: "Manteau long beige", category: "outerwear", gender: "femme", color: "beige", color_fr: "beige sable", material_guess: "wool flannel", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "hiver"] },
  { id: "f-out-manteau-long-noir", name: "Manteau long noir", category: "outerwear", gender: "femme", color: "black", color_fr: "noir", material_guess: "wool flannel", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "hiver"] },
  { id: "f-out-doudoune-noire", name: "Doudoune noire matelassée", category: "outerwear", gender: "femme", color: "black", color_fr: "noir", material_guess: "technical nylon", fit: "regular", style_dna: ["minimal", "voyage"], occasion: ["voyage", "hiver"] },
  { id: "f-out-bomber-noir", name: "Bomber noir technique", category: "outerwear", gender: "femme", color: "black", color_fr: "noir", material_guess: "technical poly", fit: "regular", style_dna: ["streetwear", "minimal"], occasion: ["quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — SHOES
   ────────────────────────────────────────────────────────────────────── */
const FEMME_SHOES: CapsuleItem[] = [
  { id: "f-shoe-escarpins-noirs", name: "Escarpins noirs pointus", category: "shoes", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "soir"], occasion: ["bureau", "soir"] },
  { id: "f-shoe-escarpins-nude", name: "Escarpins nude", category: "shoes", gender: "femme", color: "beige", color_fr: "nude", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "soir"], occasion: ["soir"] },
  { id: "f-shoe-bottes-cuir-hautes", name: "Bottes cuir hautes noires", category: "shoes", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "soir", "hiver"] },
  { id: "f-shoe-bottines-cuir", name: "Bottines cuir noires", category: "shoes", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "f-shoe-sneakers-blanches", name: "Sneakers blanches minimales", category: "shoes", gender: "femme", color: "white", color_fr: "blanc", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "voyage"] },
  { id: "f-shoe-sandales-nude", name: "Sandales nude à talons", category: "shoes", gender: "femme", color: "beige", color_fr: "nude", material_guess: "leather", fit: "regular", style_dna: ["minimal", "soir"], occasion: ["soir", "été"] },
  { id: "f-shoe-derbies-noires", name: "Derbies cuir noires", category: "shoes", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "f-shoe-mules-cuir", name: "Mules cuir camel", category: "shoes", gender: "femme", color: "brown", color_fr: "camel", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["quotidien", "été"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — BAGS
   ────────────────────────────────────────────────────────────────────── */
const FEMME_BAGS: CapsuleItem[] = [
  { id: "f-bag-cabas-noir", name: "Cabas cuir noir", category: "bags", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "f-bag-tote-noir", name: "Tote bag noir", category: "bags", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "bureau"] },
  { id: "f-bag-pochette-noire", name: "Pochette enveloppe noire", category: "bags", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal", "soir"], occasion: ["soir"] },
  { id: "f-bag-bandouliere-noire", name: "Sac bandoulière noir", category: "bags", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "f-bag-hobo-noir", name: "Sac hobo noir", category: "bags", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "draped", style_dna: ["quiet luxury", "minimal"], occasion: ["quotidien", "sorties"] },
  { id: "f-bag-cabas-beige", name: "Cabas cuir beige", category: "bags", gender: "femme", color: "beige", color_fr: "beige sable", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "f-bag-mini-bandouliere", name: "Mini sac bandoulière nude", category: "bags", gender: "femme", color: "beige", color_fr: "nude", material_guess: "leather", fit: "regular", style_dna: ["minimal", "soir"], occasion: ["soir", "sorties"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — ACCESSORIES
   ────────────────────────────────────────────────────────────────────── */
const FEMME_ACCESSORIES: CapsuleItem[] = [
  { id: "f-acc-ceinture-noire-large", name: "Ceinture cuir noire large", category: "accessories", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["bureau", "soir"] },
  { id: "f-acc-ceinture-fine-noire", name: "Ceinture fine noire", category: "accessories", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather", fit: "fitted", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau"] },
  { id: "f-acc-lunettes-noires", name: "Lunettes solaires noires", category: "accessories", gender: "femme", color: "black", color_fr: "noir", material_guess: "acetate", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["voyage", "été"] },
  { id: "f-acc-boucles-or", name: "Boucles d'oreilles or", category: "accessories", gender: "femme", color: "gold", color_fr: "or", material_guess: "gold-plated brass", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["soir"] },
  { id: "f-acc-collier-or-fin", name: "Collier or fin", category: "accessories", gender: "femme", color: "gold", color_fr: "or", material_guess: "gold-plated", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "soir"] },
  { id: "f-acc-montre-cuir-noir", name: "Montre cuir noir", category: "accessories", gender: "femme", color: "black", color_fr: "noir", material_guess: "leather + steel", fit: "regular", style_dna: ["minimal", "quiet luxury"], occasion: ["bureau"] },
  { id: "f-acc-foulard-soie", name: "Foulard soie crème", category: "accessories", gender: "femme", color: "cream", color_fr: "crème", material_guess: "silk", fit: "draped", style_dna: ["quiet luxury", "old money"], occasion: ["voyage", "bureau"] },
  { id: "f-acc-chapeau-feutre", name: "Chapeau feutre noir", category: "accessories", gender: "femme", color: "black", color_fr: "noir", material_guess: "wool felt", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["quotidien", "hiver"] },
];

/* ──────────────────────────────────────────────────────────────────────
   FEMME — UNDERWEAR / BASICS
   ────────────────────────────────────────────────────────────────────── */
const FEMME_BASICS: CapsuleItem[] = [
  { id: "f-base-soutien-blanc", name: "Soutien-gorge basique blanc", category: "underwear_basic", gender: "femme", color: "white", color_fr: "blanc", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "f-base-soutien-nude", name: "Soutien-gorge nude invisible", category: "underwear_basic", gender: "femme", color: "beige", color_fr: "nude", material_guess: "stretch microfiber", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "f-base-culotte-noire", name: "Culotte basique noire", category: "underwear_basic", gender: "femme", color: "black", color_fr: "noir", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "f-base-culotte-nude", name: "Culotte nude invisible", category: "underwear_basic", gender: "femme", color: "beige", color_fr: "nude", material_guess: "stretch microfiber", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "f-base-brassiere-grise", name: "Brassière sport grise", category: "underwear_basic", gender: "femme", color: "grey", color_fr: "gris", material_guess: "technical jersey", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien", "voyage"] },
  { id: "f-base-debardeur-blanc", name: "Débardeur basique blanc", category: "underwear_basic", gender: "femme", color: "white", color_fr: "blanc cassé", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "f-base-collants-noirs", name: "Collants opaques noirs", category: "underwear_basic", gender: "femme", color: "black", color_fr: "noir", material_guess: "opaque polyamide", fit: "fitted", style_dna: ["quiet luxury"], occasion: ["bureau", "soir", "hiver"] },
  { id: "f-base-leggings-noirs", name: "Leggings noirs", category: "underwear_basic", gender: "femme", color: "black", color_fr: "noir", material_guess: "technical jersey", fit: "fitted", style_dna: ["capsule"], occasion: ["voyage", "quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — TOPS
   ────────────────────────────────────────────────────────────────────── */
const HOMME_TOPS: CapsuleItem[] = [
  { id: "h-top-chemise-oxford-blanche", name: "Chemise oxford blanche", category: "tops", gender: "homme", color: "white", color_fr: "blanc", material_guess: "cotton oxford", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "h-top-chemise-bleue", name: "Chemise oxford bleu pâle", category: "tops", gender: "homme", color: "blue", color_fr: "bleu pâle", material_guess: "cotton oxford", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "h-top-tshirt-blanc", name: "T-shirt blanc essentiel", category: "tops", gender: "homme", color: "white", color_fr: "blanc", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-top-tshirt-noir", name: "T-shirt noir essentiel", category: "tops", gender: "homme", color: "black", color_fr: "noir", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-top-polo-gris", name: "Polo gris perle", category: "tops", gender: "homme", color: "grey", color_fr: "gris perle", material_guess: "pique cotton", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "h-top-pull-fin-noir", name: "Pull fin col rond noir", category: "tops", gender: "homme", color: "black", color_fr: "noir", material_guess: "merino wool", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "h-top-debardeur-creme", name: "Débardeur en maille crème", category: "tops", gender: "homme", color: "cream", color_fr: "crème", material_guess: "ribbed cotton", fit: "fitted", style_dna: ["minimal"], occasion: ["été", "quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — BOTTOMS
   ────────────────────────────────────────────────────────────────────── */
const HOMME_BOTTOMS: CapsuleItem[] = [
  { id: "h-bot-pantalon-tailleur-noir", name: "Pantalon de tailleur noir", category: "bottoms", gender: "homme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury"], occasion: ["bureau", "soir"] },
  { id: "h-bot-pantalon-marron", name: "Pantalon marron foncé", category: "bottoms", gender: "homme", color: "brown", color_fr: "marron foncé", material_guess: "wool flannel", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "h-bot-chino-beige", name: "Chino beige", category: "bottoms", gender: "homme", color: "beige", color_fr: "beige sable", material_guess: "cotton twill", fit: "regular", style_dna: ["capsule", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "h-bot-jean-droit-indigo", name: "Jean droit indigo profond", category: "bottoms", gender: "homme", color: "indigo", color_fr: "indigo profond", material_guess: "raw denim", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-bot-cargo-beige", name: "Pantalon cargo beige", category: "bottoms", gender: "homme", color: "beige", color_fr: "beige", material_guess: "cotton twill", fit: "regular", style_dna: ["streetwear", "voyage"], occasion: ["quotidien", "voyage"] },
  { id: "h-bot-short-noir", name: "Short tailleur noir", category: "bottoms", gender: "homme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["minimal"], occasion: ["été"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — KNITS
   ────────────────────────────────────────────────────────────────────── */
const HOMME_KNITS: CapsuleItem[] = [
  { id: "h-knit-pull-cachemire-creme", name: "Pull cachemire col rond crème", category: "knits", gender: "homme", color: "cream", color_fr: "crème", material_guess: "cashmere", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "quotidien"] },
  { id: "h-knit-pull-fin-gris", name: "Pull fin gris anthracite", category: "knits", gender: "homme", color: "grey", color_fr: "gris anthracite", material_guess: "merino wool", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau"] },
  { id: "h-knit-col-roule-creme", name: "Col roulé crème", category: "knits", gender: "homme", color: "cream", color_fr: "crème", material_guess: "merino wool", fit: "fitted", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "hiver"] },
  { id: "h-knit-sweat-noir", name: "Sweat-shirt noir essentiel", category: "knits", gender: "homme", color: "black", color_fr: "noir", material_guess: "heavy cotton", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-knit-hoodie-noir", name: "Hoodie noir minimal", category: "knits", gender: "homme", color: "black", color_fr: "noir", material_guess: "heavy cotton", fit: "oversized", style_dna: ["streetwear", "minimal"], occasion: ["quotidien"] },
  { id: "h-knit-cardigan-noir", name: "Cardigan noir minimal", category: "knits", gender: "homme", color: "black", color_fr: "noir", material_guess: "merino wool", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "h-knit-gilet-noir", name: "Gilet sans manches noir", category: "knits", gender: "homme", color: "black", color_fr: "noir", material_guess: "merino wool", fit: "fitted", style_dna: ["minimal", "quiet luxury"], occasion: ["bureau"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — OUTERWEAR
   ────────────────────────────────────────────────────────────────────── */
const HOMME_OUTERWEAR: CapsuleItem[] = [
  { id: "h-out-blazer-noir", name: "Blazer noir structuré", category: "outerwear", gender: "homme", color: "black", color_fr: "noir", material_guess: "wool blend", fit: "regular", style_dna: ["quiet luxury"], occasion: ["bureau", "soir"] },
  { id: "h-out-blazer-cuir", name: "Veste cuir noire", category: "outerwear", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal", "streetwear"], occasion: ["quotidien", "sorties"] },
  { id: "h-out-trench-beige", name: "Trench beige", category: "outerwear", gender: "homme", color: "beige", color_fr: "beige clair", material_guess: "cotton gabardine", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "h-out-manteau-long-noir", name: "Manteau long noir", category: "outerwear", gender: "homme", color: "black", color_fr: "noir", material_guess: "wool flannel", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau", "hiver"] },
  { id: "h-out-blazer-creme", name: "Blazer crème déstructuré", category: "outerwear", gender: "homme", color: "cream", color_fr: "crème", material_guess: "linen blend", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "été"] },
  { id: "h-out-doudoune-noire", name: "Doudoune noire", category: "outerwear", gender: "homme", color: "black", color_fr: "noir", material_guess: "technical nylon", fit: "regular", style_dna: ["minimal", "voyage"], occasion: ["voyage", "hiver"] },
  { id: "h-out-bomber-noir", name: "Bomber noir technique", category: "outerwear", gender: "homme", color: "black", color_fr: "noir", material_guess: "technical poly", fit: "regular", style_dna: ["streetwear"], occasion: ["quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — SHOES
   ────────────────────────────────────────────────────────────────────── */
const HOMME_SHOES: CapsuleItem[] = [
  { id: "h-shoe-derbies-noires", name: "Derbies cuir noires", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau", "soir"] },
  { id: "h-shoe-mocassins-noirs", name: "Mocassins cuir noirs", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "old money"], occasion: ["bureau"] },
  { id: "h-shoe-sneakers-blanches", name: "Sneakers cuir blanches", category: "shoes", gender: "homme", color: "white", color_fr: "blanc", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-shoe-sneakers-noires", name: "Sneakers cuir noires", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien"] },
  { id: "h-shoe-bottines-cuir", name: "Bottines cuir noires", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["quotidien", "hiver"] },
  { id: "h-shoe-chelsea-noires", name: "Bottines Chelsea noires", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["quotidien", "bureau"] },
  { id: "h-shoe-sandales-cuir", name: "Sandales cuir noires", category: "shoes", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["été"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — BAGS
   ────────────────────────────────────────────────────────────────────── */
const HOMME_BAGS: CapsuleItem[] = [
  { id: "h-bag-sac-dos-noir", name: "Sac à dos cuir noir", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal", "voyage"], occasion: ["bureau", "voyage"] },
  { id: "h-bag-tote-noir", name: "Tote bag noir", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["capsule", "minimal"], occasion: ["bureau", "quotidien"] },
  { id: "h-bag-besace-noire", name: "Besace cuir noire", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["bureau", "quotidien"] },
  { id: "h-bag-pochette-cuir", name: "Pochette cuir noire", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["quotidien", "voyage"] },
  { id: "h-bag-trousse-noire", name: "Trousse cuir noire", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["voyage"] },
  { id: "h-bag-ceinture-noire", name: "Ceinture cuir noire", category: "bags", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["bureau", "quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — ACCESSORIES
   ────────────────────────────────────────────────────────────────────── */
const HOMME_ACCESSORIES: CapsuleItem[] = [
  { id: "h-acc-lunettes-noires", name: "Lunettes solaires noires", category: "accessories", gender: "homme", color: "black", color_fr: "noir", material_guess: "acetate", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["voyage", "été"] },
  { id: "h-acc-montre-acier", name: "Montre acier classique", category: "accessories", gender: "homme", color: "silver", color_fr: "acier", material_guess: "steel", fit: "regular", style_dna: ["quiet luxury", "minimal"], occasion: ["bureau"] },
  { id: "h-acc-bracelet-cuir", name: "Bracelet cuir noir", category: "accessories", gender: "homme", color: "black", color_fr: "noir", material_guess: "leather", fit: "regular", style_dna: ["minimal"], occasion: ["quotidien"] },
  { id: "h-acc-bracelet-acier", name: "Bracelet acier fin", category: "accessories", gender: "homme", color: "silver", color_fr: "acier", material_guess: "steel", fit: "regular", style_dna: ["minimal"], occasion: ["quotidien"] },
  { id: "h-acc-foulard-laine", name: "Écharpe laine gris", category: "accessories", gender: "homme", color: "grey", color_fr: "gris", material_guess: "wool", fit: "draped", style_dna: ["quiet luxury"], occasion: ["hiver"] },
  { id: "h-acc-beanie-noir", name: "Bonnet noir maille fine", category: "accessories", gender: "homme", color: "black", color_fr: "noir", material_guess: "merino wool", fit: "regular", style_dna: ["minimal"], occasion: ["hiver"] },
  { id: "h-acc-casquette-noire", name: "Casquette noire", category: "accessories", gender: "homme", color: "black", color_fr: "noir", material_guess: "cotton", fit: "regular", style_dna: ["streetwear", "minimal"], occasion: ["quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   HOMME — UNDERWEAR / BASICS
   ────────────────────────────────────────────────────────────────────── */
const HOMME_BASICS: CapsuleItem[] = [
  { id: "h-base-boxer-noir", name: "Boxer noir essentiel", category: "underwear_basic", gender: "homme", color: "black", color_fr: "noir", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "h-base-boxer-blanc", name: "Boxer blanc essentiel", category: "underwear_basic", gender: "homme", color: "white", color_fr: "blanc", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "h-base-tshirt-corps-blanc", name: "T-shirt corps blanc", category: "underwear_basic", gender: "homme", color: "white", color_fr: "blanc", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "h-base-tshirt-corps-noir", name: "T-shirt corps noir", category: "underwear_basic", gender: "homme", color: "black", color_fr: "noir", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "h-base-chaussettes-noires", name: "Chaussettes noires", category: "underwear_basic", gender: "homme", color: "black", color_fr: "noir", material_guess: "merino blend", fit: "regular", style_dna: ["capsule"], occasion: ["bureau", "quotidien"] },
  { id: "h-base-chaussettes-blanches", name: "Chaussettes blanches", category: "underwear_basic", gender: "homme", color: "white", color_fr: "blanc", material_guess: "cotton", fit: "regular", style_dna: ["capsule"], occasion: ["quotidien"] },
  { id: "h-base-tanktop-noir", name: "Débardeur noir essentiel", category: "underwear_basic", gender: "homme", color: "black", color_fr: "noir", material_guess: "stretch cotton", fit: "fitted", style_dna: ["capsule"], occasion: ["été", "quotidien"] },
];

/* ──────────────────────────────────────────────────────────────────────
   AGGREGATION — toute la garde-robe
   ────────────────────────────────────────────────────────────────────── */
export const CAPSULE_WARDROBE: CapsuleItem[] = [
  ...FEMME_TOPS, ...FEMME_BOTTOMS, ...FEMME_DRESSES, ...FEMME_KNITS,
  ...FEMME_OUTERWEAR, ...FEMME_SHOES, ...FEMME_BAGS, ...FEMME_ACCESSORIES, ...FEMME_BASICS,
  ...HOMME_TOPS, ...HOMME_BOTTOMS, ...HOMME_KNITS, ...HOMME_OUTERWEAR,
  ...HOMME_SHOES, ...HOMME_BAGS, ...HOMME_ACCESSORIES, ...HOMME_BASICS,
];

/* ──────────────────────────────────────────────────────────────────────
   5 TENUES CAPSULE — recomposées par stylist Claude depuis l'inventaire
   ──────────────────────────────────────────────────────────────────────
   Règles appliquées :
     - Aucun nouvel item, on pioche dans la garde-robe ci-dessus
     - Quiet luxury aesthetic uniquement
     - Max 3 couleurs par tenue
     - Max 2 matières par tenue
     - 1 concept dominant par look
*/

export type CapsuleOutfit = {
  id: string;
  name: string;
  concept: string;            // ex: "Soft tailoring monochrome"
  occasion: string;
  gender: "femme" | "homme" | "unisexe";
  items: string[];            // CapsuleItem ids
  story: string;              // Description éditoriale courte
};

export const CAPSULE_OUTFITS: CapsuleOutfit[] = [
  {
    id: "outfit-1",
    name: "Bureau minéral",
    concept: "soft tailoring monochrome",
    occasion: "bureau",
    gender: "femme",
    items: [
      "f-top-chemise-oxford-blanche",
      "f-bot-pantalon-tailleur-noir",
      "f-out-blazer-noir",
      "f-shoe-derbies-noires",
      "f-bag-cabas-noir",
      "f-acc-montre-cuir-noir",
    ],
    story: "Blazer noir structuré, chemise oxford blanche, pantalon de tailleur noir. La rigueur d'un costume, sans effort. Une pièce signature et tout le reste s'efface.",
  },
  {
    id: "outfit-2",
    name: "Old money week-end",
    concept: "quiet luxury layering",
    occasion: "quotidien",
    gender: "femme",
    items: [
      "f-top-pull-fin-beige",
      "f-bot-pantalon-large-creme",
      "f-out-trench-beige",
      "f-shoe-mules-cuir",
      "f-bag-cabas-beige",
      "f-acc-foulard-soie",
      "f-acc-lunettes-noires",
    ],
    story: "Camaïeu de neutres chauds, trench beige classique sur pull cachemire. Les matières nobles parlent à voix basse — c'est tout l'intérêt.",
  },
  {
    id: "outfit-3",
    name: "Soir minimal",
    concept: "monastic minimalism",
    occasion: "soir",
    gender: "femme",
    items: [
      "f-dress-robe-pull-noire",
      "f-out-blazer-noir",
      "f-shoe-escarpins-noirs",
      "f-bag-pochette-noire",
      "f-acc-boucles-or",
    ],
    story: "Tout noir, une seule pièce d'or. La proposition est claire : silhouette précise, accessoires invisibles sauf un. L'élégance par soustraction.",
  },
  {
    id: "outfit-4",
    name: "Homme contemporain",
    concept: "modern utilitarian",
    occasion: "bureau",
    gender: "homme",
    items: [
      "h-top-chemise-bleue",
      "h-bot-chino-beige",
      "h-out-trench-beige",
      "h-shoe-derbies-noires",
      "h-bag-besace-noire",
      "h-acc-montre-acier",
    ],
    story: "Chemise oxford bleu pâle, chino beige, trench classique. Le code bureau réinterprété — pas costume, pas casual, juste précis.",
  },
  {
    id: "outfit-5",
    name: "Week-end homme",
    concept: "soft luxury layering",
    occasion: "quotidien",
    gender: "homme",
    items: [
      "h-top-tshirt-blanc",
      "h-knit-cardigan-noir",
      "h-bot-jean-droit-indigo",
      "h-shoe-chelsea-noires",
      "h-bag-sac-dos-noir",
    ],
    story: "T-shirt blanc, cardigan noir, jean indigo, Chelsea boots. Trois pièces neutres, une matière noble (la maille). Le minimum qui suffit.",
  },
];

/* ──────────────────────────────────────────────────────────────────────
   HELPERS — sélection par gender / category / occasion
   ────────────────────────────────────────────────────────────────────── */

export function itemsByCategory(category: ItemCategory, gender?: "femme" | "homme"): CapsuleItem[] {
  return CAPSULE_WARDROBE.filter(
    (i) => i.category === category && (!gender || i.gender === gender || i.gender === "unisexe")
  );
}

export function itemsByOccasion(occasion: string): CapsuleItem[] {
  return CAPSULE_WARDROBE.filter((i) => i.occasion.includes(occasion));
}

export function itemById(id: string): CapsuleItem | undefined {
  return CAPSULE_WARDROBE.find((i) => i.id === id);
}

/** Compte total d'items dans la garde-robe — utile pour le footer "X pièces". */
export const CAPSULE_TOTAL = CAPSULE_WARDROBE.length;

/** Catégories ordonnées pour l'affichage UI. */
export const CATEGORY_ORDER: ItemCategory[] = [
  "tops", "bottoms", "dresses", "knits", "outerwear",
  "shoes", "bags", "accessories", "underwear_basic",
];

export const CATEGORY_LABELS_FR: Record<ItemCategory, string> = {
  tops:             "Hauts",
  bottoms:          "Bas",
  dresses:          "Robes & combinaisons",
  knits:            "Mailles",
  outerwear:        "Vestes & manteaux",
  shoes:            "Chaussures",
  bags:             "Sacs",
  accessories:      "Accessoires",
  underwear_basic:  "Basiques",
};
