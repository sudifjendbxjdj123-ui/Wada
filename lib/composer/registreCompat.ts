/**
 * lib/composer/registreCompat.ts
 *
 * Brief 2026-06-01 « Composer IA » §3.
 * Matrice de compatibilité entre les 8 registres BRAND_REGISTRE.
 *
 * Sémantique :
 *   ok   — combinaison parfaitement crédible (registre identique ou très proche)
 *   warn — combinaison possible avec précaution (smart casual, mix calculé)
 *   no   — combinaison stylistiquement incohérente (à exclure)
 *
 * Cette matrice REMPLACE l'ancien REGISTRE_ADJACENCY simple (5 valeurs) de
 * app/api/products/route.ts. Elle est utilisée par filterPool() pour décider
 * quels produits sortir du pool en fonction du registre cible de la tenue.
 *
 * Symétrie : la matrice est SYMÉTRIQUE (compat[a][b] === compat[b][a]).
 * Si une asymétrie est nécessaire (rare), commenter en place le pourquoi.
 */

import type { Registre } from "./types";

type Compat = "ok" | "warn" | "no";

const COMPAT: Record<Registre, Record<Registre, Compat>> = {
  minimaliste: {
    minimaliste:      "ok",
    classique:        "warn",  // tee min + costume classique = smart minimal
    streetwear:       "warn",  // sneakers minimal + hoodie street = OK
    avant_garde:      "warn",  // CDG + lemaire = base avant-garde minimaliste
    outdoor:          "no",
    heritage_country: "no",
    apres_ski:        "no",
    decontracte:      "ok",    // MUJI = pilier minimaliste fonctionnel
  },
  classique: {
    minimaliste:      "warn",
    classique:        "ok",
    streetwear:       "no",
    avant_garde:      "no",
    outdoor:          "no",
    heritage_country: "warn",  // Burberry trench + costume = OK
    apres_ski:        "no",
    decontracte:      "warn",  // MUJI tee + blazer Suitable = smart casual légitime
  },
  streetwear: {
    minimaliste:      "warn",
    classique:        "no",
    streetwear:       "ok",
    avant_garde:      "warn",  // Sacai + Off-White, Junya + Carhartt
    outdoor:          "warn",  // Stone Island ↔ TNF supreme collab
    heritage_country: "no",
    apres_ski:        "warn",  // 90s ski-streetwear (rare)
    decontracte:      "warn",
  },
  avant_garde: {
    minimaliste:      "warn",
    classique:        "no",
    streetwear:       "warn",
    avant_garde:      "ok",
    outdoor:          "no",
    heritage_country: "no",
    apres_ski:        "no",
    decontracte:      "no",
  },
  outdoor: {
    minimaliste:      "no",
    classique:        "no",
    streetwear:       "warn",
    avant_garde:      "no",
    outdoor:          "ok",
    heritage_country: "warn",  // Filson + Barbour : heritage outdoor cohabitent
    apres_ski:        "warn",
    decontracte:      "warn",
  },
  heritage_country: {
    minimaliste:      "no",
    classique:        "warn",
    streetwear:       "no",
    avant_garde:      "no",
    outdoor:          "warn",
    heritage_country: "ok",
    apres_ski:        "no",
    decontracte:      "warn",
  },
  apres_ski: {
    minimaliste:      "no",
    classique:        "no",
    streetwear:       "warn",
    avant_garde:      "no",
    outdoor:          "warn",
    heritage_country: "no",
    apres_ski:        "ok",
    decontracte:      "no",
  },
  decontracte: {
    minimaliste:      "ok",
    classique:        "warn",
    streetwear:       "warn",
    avant_garde:      "no",
    outdoor:          "warn",
    heritage_country: "warn",
    apres_ski:        "no",
    decontracte:      "ok",
  },
};

/** True si a et b sont parfaitement compatibles (même registre, même esprit). */
export function isCompatible(a: Registre, b: Registre): boolean {
  return COMPAT[a]?.[b] === "ok";
}

/** True si a et b peuvent cohabiter (ok ou warn). False uniquement sur "no". */
export function isAcceptable(a: Registre, b: Registre): boolean {
  const c = COMPAT[a]?.[b];
  return c === "ok" || c === "warn";
}

/** Retourne le niveau brut de compatibilité — utile pour le scoring. */
export function compatLevel(a: Registre, b: Registre): Compat {
  return COMPAT[a]?.[b] || "no";
}

/** Liste des registres acceptables (ok + warn) pour un registre cible. */
export function acceptableRegistres(target: Registre): Registre[] {
  const row = COMPAT[target];
  if (!row) return [target];
  return (Object.keys(row) as Registre[]).filter((r) => row[r] !== "no");
}

/** Liste des registres parfaitement compatibles (ok seulement) pour un registre cible. */
export function strictRegistres(target: Registre): Registre[] {
  const row = COMPAT[target];
  if (!row) return [target];
  return (Object.keys(row) as Registre[]).filter((r) => row[r] === "ok");
}
