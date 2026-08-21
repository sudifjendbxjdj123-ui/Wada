/**
 * lib/composer/proportions.ts
 *
 * ÉQUILIBRE DES VOLUMES — la règle que le moteur ne connaissait pas.
 *
 * Le brief client la place en 3ᵉ position et la qualifie de « probablement
 * l'une des règles les plus importantes » :
 *
 *     Haut ample  → bas droit ou légèrement ajusté
 *     Bas large   → haut plus court / structuré
 *     Tout ample  → possible, mais il faut créer de la structure
 *     Tout ajusté → peut fonctionner, mais donne une esthétique différente
 *
 * Et l'exemple qui résume le manque : « pantalon large gris + énorme hoodie +
 * grosses sneakers + manteau très ample possède de bonnes couleurs, mais
 * manque d'équilibre dans les volumes ». Le moteur d'avant aurait noté cette
 * tenue au maximum : il ne regardait que les couleurs.
 *
 * Ce module ne parle QUE de volumes. Il ne connaît ni les couleurs, ni les
 * marques, ni les prix — ce qui le rend testable seul.
 */

import type { SlotKey, Fit } from "@/lib/registreEngine";

/** Les trois slots qui portent la silhouette. Chaussures et accent ne
    créent pas de volume au sens du brief — ils ponctuent. */
export const SLOTS_VOLUME: SlotKey[] = ["haut", "bas", "veste"];

export type Silhouette =
  | "contraste-haut"   // volume en haut, ligne nette en bas
  | "contraste-bas"    // ligne nette en haut, volume en bas
  | "ligne-nette"      // une pièce près du corps sur une base droite
  | "tout-ample"
  | "tout-ajuste"
  | "droite";          // tout en coupe standard

export type LectureVolumes = {
  silhouette: Silhouette;
  /** Vrai si la tenue oppose deux volumes — le cas le plus sûr. */
  equilibre: boolean;
  /** Pour « tout-ample » : reste-t-il un élément structurant ? */
  structure: boolean;
  /** Une phrase en français, affichable telle quelle au client. */
  explication: string;
};

/**
 * Lit la silhouette d'une tenue à partir des coupes de ses pièces.
 *
 * Le contraste se joue entre le HAUT et le BAS — ce sont les deux volumes du
 * corps. La veste compte comme du volume haut quand elle est ample, mais elle
 * ne peut pas à elle seule racheter un haut ET un bas amples : c'est
 * exactement la tenue que le brief donne en contre-exemple.
 *
 * `structurant` : un élément qui tient la silhouette malgré des volumes
 * amples — une chaussure nette (mocassin, derby, ballerine) plutôt qu'une
 * grosse sneaker. C'est la condition que le brief pose sur le tout-ample.
 */
export function lireVolumes(
  fits: Partial<Record<SlotKey, Fit>>,
  structurant = false,
): LectureVolumes {
  const haut = fits.haut, bas = fits.bas, veste = fits.veste;
  if (!haut && !bas && !veste) {
    return { silhouette: "droite", equilibre: false, structure: false,
      explication: "Volumes non renseignés." };
  }

  const hautAmple = haut === "ample";
  const basAmple = bas === "ample";
  const vesteAmple = veste === "ample";

  /* 1. Haut ET bas amples — le cas du contre-exemple. La veste structurée
        ou une chaussure nette « crée de la structure » au sens du brief,
        mais ne transforme pas ça en contraste de volumes. */
  if (hautAmple && basAmple) {
    const structure = !vesteAmple || structurant;
    return {
      silhouette: "tout-ample", equilibre: false, structure,
      explication: structure
        ? "Volumes amples partout, tenus par une pièce structurée."
        : "Volumes amples partout, sans rien pour structurer la silhouette.",
    };
  }

  /* 2. Volume en haut (haut ou veste), ligne nette en bas. */
  if ((hautAmple || vesteAmple) && !basAmple) {
    return { silhouette: "contraste-haut", equilibre: true, structure: true,
      explication: "Volume en haut, ligne nette en bas — les proportions se répondent." };
  }

  /* 3. Volume en bas, ligne nette en haut. */
  if (basAmple) {
    return { silhouette: "contraste-bas", equilibre: true, structure: true,
      explication: "Ligne nette en haut, volume en bas — les proportions se répondent." };
  }

  /* 4. Plus aucun volume ample. */
  const ajustes = [haut, bas, veste].filter((f) => f === "ajuste").length;
  const renseignes = [haut, bas, veste].filter(Boolean).length;

  if (ajustes === renseignes) {
    return { silhouette: "tout-ajuste", equilibre: false, structure: true,
      explication: "Silhouette près du corps sur toute la tenue — un parti pris net." };
  }
  if (ajustes > 0) {
    return { silhouette: "ligne-nette", equilibre: true, structure: true,
      explication: "Une pièce près du corps sur une base droite — silhouette lisible." };
  }
  return { silhouette: "droite", equilibre: false, structure: true,
    explication: "Coupes droites sur toute la tenue — sobre, sans effet de proportion." };
}

/**
 * Corrige un plan de coupes déséquilibré.
 *
 * Un seul cas est corrigé : le tout-ample sans structure. Le brief ne
 * l'interdit pas — il demande d'y « créer de la structure ». On garde donc
 * les volumes voulus sur le haut et le bas (c'est la silhouette que le client
 * a choisie) et on rend la veste structurée : c'est elle qui tient la
 * silhouette, et c'est la pièce dont le volume se remarque le moins.
 *
 * Le tout-ajusté n'est PAS corrigé : le brief le déclare viable.
 */
export function equilibrerVolumes(
  fits: Record<SlotKey, Fit>,
  structurant = false,
): { fits: Record<SlotKey, Fit>; corrige: boolean } {
  const lecture = lireVolumes(fits, structurant);
  if (lecture.silhouette !== "tout-ample" || lecture.structure) {
    return { fits, corrige: false };
  }
  return { fits: { ...fits, veste: "standard" }, corrige: true };
}

/* ── Chaussures et accessoire : pas de coupe ─────────────────────────────
   Une chaussure n'a pas de « coupe ample ». Le moteur propageait pourtant
   la coupe choisie par le client aux cinq slots, produisant des libellés
   comme « Sneakers minimalistes blanches — oversized » et, plus gênant, une
   requête marchand « sneakers minimalistes blanches oversized blanc ». */
export function coupeNeutralisee(slot: SlotKey): boolean {
  return slot === "chaussures" || slot === "accent";
}

/* ── Chaussures : structurantes ou volumineuses ? ─────────────────────────
   Une grosse sneaker ajoute du volume au sol et aggrave un tout-ample ; un
   mocassin ou une derby ferme la silhouette. Le brief cite justement les
   « grosses sneakers » dans son contre-exemple. */
const CHAUSSURE_NETTE = /mocassin|loafer|derby|richelieu|oxford|ballerine|mary\s*jane|slingback|escarpin|kitten|bateau|chelsea|boots?\s+(en\s+)?cuir|boots?\s+pointue/i;
const CHAUSSURE_VOLUMINEUSE = /chunky|dad\s*shoe|grosse|running|trail|plateforme|platform/i;

/** Vrai si la chaussure ferme la silhouette plutôt que de l'alourdir. */
export function chaussureStructurante(type: string): boolean {
  if (!type) return false;
  if (CHAUSSURE_VOLUMINEUSE.test(type)) return false;
  return CHAUSSURE_NETTE.test(type);
}

/** Note de proportions sur 20 — barème du brief client.

    Le contraste de volumes est ce qu'on cherche : c'est lui qui fait qu'une
    tenue « tient ». Le tout-ample sans structure est le cas que le brief
    donne en exemple de mauvaise note malgré de bonnes couleurs. */
export function noterProportions(lecture: LectureVolumes): number {
  switch (lecture.silhouette) {
    case "contraste-haut":
    case "contraste-bas":
      return 20;   // l'opposition de volumes que le brief recherche
    case "ligne-nette":
      return 18;   // silhouette lisible, contraste plus discret
    case "droite":
      return 16;   // sobre et juste, mais sans effet de proportion
    case "tout-ajuste":
      return 15;   // « peut fonctionner, mais esthétique différente »
    case "tout-ample":
      return lecture.structure ? 14 : 6;
  }
}
