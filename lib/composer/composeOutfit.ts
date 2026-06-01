/**
 * lib/composer/composeOutfit.ts
 *
 * Brief 2026-06-01 « Composer IA » §10.
 * Orchestrateur principal : filterPool → pickForSlot × 5 → scoreOutfit
 * → validateWithLLM, avec retry max 5×.
 *
 * Flow :
 *   1. Calcule plafond budget par pièce selon variant
 *   2. filterPool() strict
 *   3. Si pool < 5, on retente loose (threshold couleur élargi)
 *   4. Pour chaque slot, pickForSlot() avec scoring
 *   5. scoreOutfit() global → si < 75, exclure le pire et retry
 *   6. validateWithLLM() → si INCOHERENT, exclure la pièce problématique et retry
 *   7. Retourne la tenue OK ou null après 5 essais
 *
 * Dégradation gracieuse : retourne null SEULEMENT si après 5 retries
 * le pool est épuisé. L'appelant API affiche alors le produit avec le
 * score le plus haut quand même (cf. brief « toujours afficher une tenue »).
 */

import type {
  ComposerProduct,
  PaletteIdentity,
  ComposerProfile,
  ComposedOutfit,
  Variation,
  Budget,
  Slot,
} from "./types";
import { filterPool } from "./filterPool";
import { pickForSlot } from "./pickSlot";
import { scoreOutfit, findWorstProduct } from "./scoreOutfit";

const SLOTS_TENUE: Slot[] = ["haut", "bas", "veste", "chaussures", "accent"];

/** Plafond budget par pièce selon variant. */
function budgetToMaxParPiece(budget: Budget, variant: Variation): number {
  const tolerance =
    variant === "ideal"  ? 3      // pas de contrainte stricte
    : variant === "budget" ? 0.7   // plafond plus serré pour la variante éco
    : variant === "bold"   ? 2     // un peu plus généreux pour signature
    : 1.5;                          // safe : tolérance standard 1.5×
  const base = ({ lt_150: 150, "150_400": 400, "400_1000": 1000, premium: 5000 } as const)[budget];
  return Math.round(base * tolerance);
}

/** Pourcentage de dépassement vs plafond mou du budget. */
function calculateOvershoot(total: number, budget: Budget): number {
  const max = ({ lt_150: 600, "150_400": 1500, "400_1000": 3500, premium: 15000 } as const)[budget];
  return Math.max(0, (total - max) / max);
}

/** Optional LLM validation — fail-open. */
async function validateWithLLM(
  outfit: Partial<Record<Slot, ComposerProduct>>,
  palette: PaletteIdentity,
  profile: ComposerProfile,
  baseUrl: string,
): Promise<{ verdict: "COHERENT" | "INCOHERENT"; raison?: string; piece?: string }> {
  try {
    const payload = {
      palette: {
        nom: palette.nom,
        ref: palette.ref,
        couleurs: [palette.couleur_principale, ...palette.couleurs_neutres].slice(0, 5),
        registre: palette.registre,
      },
      profil: {
        genre: profile.genre,
        budget: profile.budget,
        style: palette.registre,
      },
      occasion: profile.occasion || "quotidien",
      tenue: Object.values(outfit)
        .filter((p): p is ComposerProduct => !!p)
        .map((p) => ({
          slot: p.slot,
          marque: p.brand_name,
          nom: p.product_name,
          couleur: p.couleur_principale.nom,
          prix_eur: p.prix_eur,
        })),
    };
    const res = await fetch(`${baseUrl}/api/validate-outfit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { verdict: "COHERENT" }; // fail-open
    const data = await res.json();
    return {
      verdict: data?.verdict === "INCOHERENT" ? "INCOHERENT" : "COHERENT",
      raison: data?.raison,
      piece: data?.piece_la_plus_problematique,
    };
  } catch {
    return { verdict: "COHERENT" }; // fail-open total sur erreur réseau
  }
}

export interface ComposeOptions {
  variant?: Variation;
  /** baseUrl pour appel LLM. Si vide, on skip la validation. */
  validateUrl?: string;
  /** Si true, on tolère un score < 75 et on retourne quand même la meilleure
   *  tenue trouvée (mode « toujours afficher quelque chose »). */
  alwaysReturn?: boolean;
}

export async function composeOutfit(
  pool_complete: ComposerProduct[],
  palette: PaletteIdentity,
  profile: ComposerProfile,
  options: ComposeOptions = {},
): Promise<ComposedOutfit | null> {
  const variant = options.variant || "safe";

  /* 1. Budget plafond par pièce */
  const budgetMax = budgetToMaxParPiece(profile.budget, variant);

  /* 2. Filtre strict */
  let pool = filterPool(pool_complete, palette, profile, {
    budget_max_par_piece: budgetMax,
    occasion: profile.occasion,
    loose: false,
  });

  /* 3. Fallback loose si pool trop petit */
  if (pool.length < 5) {
    pool = filterPool(pool_complete, palette, profile, {
      budget_max_par_piece: budgetMax,
      occasion: profile.occasion,
      loose: true,
    });
  }

  if (pool.length === 0) return null;

  let bestOutfit: Partial<Record<Slot, ComposerProduct>> | null = null;
  let bestScore = -1;

  for (let attempt = 0; attempt < 5; attempt++) {
    const tried = new Set<string>();
    const outfit: Partial<Record<Slot, ComposerProduct>> = {};

    for (const slot of SLOTS_TENUE) {
      const pick = pickForSlot(pool, slot, palette, profile, tried);
      if (pick) {
        outfit[slot] = pick;
        tried.add(pick.id);
      }
    }

    const score = scoreOutfit(outfit, palette, profile);

    /* Track best so far pour le mode alwaysReturn. */
    if (score > bestScore) {
      bestScore = score;
      bestOutfit = outfit;
    }

    if (score < 75) {
      /* Exclure le pire produit et retry */
      const worst = findWorstProduct(outfit, palette);
      if (worst) pool = pool.filter((p) => p.id !== worst.id);
      continue;
    }

    /* Validation LLM (optionnelle) */
    if (options.validateUrl) {
      const llm = await validateWithLLM(outfit, palette, profile, options.validateUrl);
      if (llm.verdict === "INCOHERENT") {
        const slotProb = llm.piece?.split(":")[0] as Slot | undefined;
        if (slotProb && outfit[slotProb]) {
          const badId = outfit[slotProb]!.id;
          pool = pool.filter((p) => p.id !== badId);
        }
        continue;
      }
    }

    /* Score OK + LLM coherent → on retourne */
    const pieces = Object.values(outfit).filter((p): p is ComposerProduct => !!p);
    const total = pieces.reduce((s, p) => s + p.prix_eur, 0);
    return {
      pieces: outfit,
      total_eur: total,
      score,
      llm_verdict: "COHERENT",
      variation: variant,
      overshoot: calculateOvershoot(total, profile.budget),
    };
  }

  /* Après 5 essais : si alwaysReturn, on renvoie la meilleure tentative.
     Sinon, dégradation gracieuse → null. */
  if (options.alwaysReturn && bestOutfit) {
    const pieces = Object.values(bestOutfit).filter((p): p is ComposerProduct => !!p);
    const total = pieces.reduce((s, p) => s + p.prix_eur, 0);
    return {
      pieces: bestOutfit,
      total_eur: total,
      score: bestScore,
      variation: variant,
      overshoot: calculateOvershoot(total, profile.budget),
    };
  }
  return null;
}

/** Helper : génère les 3 variations Safe/Bold/Budget en parallèle. */
export async function generateVariations(
  pool: ComposerProduct[],
  palette: PaletteIdentity,
  profile: ComposerProfile,
  validateUrl?: string,
): Promise<{ safe?: ComposedOutfit; bold?: ComposedOutfit; budget?: ComposedOutfit }> {
  const [safe, bold, budgetV] = await Promise.all([
    composeOutfit(pool, palette, profile, { variant: "safe", validateUrl, alwaysReturn: true }),
    composeOutfit(pool, palette, profile, { variant: "bold", validateUrl, alwaysReturn: true }),
    composeOutfit(pool, palette, profile, { variant: "budget", validateUrl, alwaysReturn: true }),
  ]);
  return {
    safe: safe || undefined,
    bold: bold || undefined,
    budget: budgetV || undefined,
  };
}
