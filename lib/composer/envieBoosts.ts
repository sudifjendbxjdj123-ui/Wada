/**
 * lib/composer/envieBoosts.ts
 *
 * Brief 2026-06-01 « Composer IA » §9.
 * Boost de matière selon l'envie utilisateur — utilisé par pickForSlot()
 * pour pondérer les candidats lors du sort.
 *
 * Exemple : envie=elegant → laine +15 / soie +15 / cachemire +20 / cuir +10.
 * Un blazer en laine prend 15 points de plus qu'un blazer en polyester.
 *
 * Ces boosts sont additifs au score ΔE2000 et au score de cohérence palette ;
 * ils n'écrasent pas la palette mais aident à trancher entre deux candidats
 * sinon équivalents.
 */

import type { Envie } from "./types";

export function getEnvieBoosts(envie: Envie | undefined): Record<string, number> {
  if (!envie) return {};
  switch (envie) {
    case "confortable":
      return { jersey: 15, coton: 10, cachemire: 15, lin: 8 };
    case "elegant":
      return { laine: 15, soie: 15, cachemire: 20, cuir: 10, satin: 12 };
    case "discret":
      return { laine: 10, coton: 10, cachemire: 8 };
    case "affirme":
      return { cuir: 15, velours: 15, laine: 10, satin: 8 };
    case "creatif":
      return { lin: 10, cuir: 10, velours: 10, soie: 8 };
    case "intemporel":
      return { cachemire: 20, laine: 15, coton: 10, cuir: 15 };
    default:
      return {};
  }
}

/**
 * Score additionnel d'un produit selon l'envie.
 * Cherche un mot-clé matière (laine / coton / cuir / cachemire / soie / lin /
 * velours / jersey / satin) dans la matière OU dans le nom du produit, et
 * retourne le boost le plus élevé applicable.
 */
export function envieBoostFor(
  productMatiere: string,
  productName: string,
  envie: Envie | undefined,
): number {
  const boosts = getEnvieBoosts(envie);
  if (Object.keys(boosts).length === 0) return 0;
  const hay = `${productMatiere || ""} ${productName || ""}`.toLowerCase();
  let best = 0;
  for (const [matiere, boost] of Object.entries(boosts)) {
    if (hay.includes(matiere)) {
      if (boost > best) best = boost;
    }
  }
  return best;
}
