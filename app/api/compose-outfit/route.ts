/**
 * POST /api/compose-outfit
 *
 * Brief 2026-06-01 « Composer IA — code prêt à coller » §12.
 *
 * Endpoint qui compose une tenue 5 pièces serveur-side via le module
 * lib/composer/* (Phase A + B). Remplace la composition côté client
 * dans /ma-tenue qui appelait /api/products 5× indépendamment.
 *
 * Body :
 *   {
 *     paletteRef: "162",                     // entry.number
 *     profile: { genre, budget, envie?, occasion?, dislikes_marques? },
 *     occasion: "quotidien",
 *     variant?: "safe" | "bold" | "budget"   // default "safe"
 *     allVariations?: boolean                // si true, renvoie {safe,bold,budget}
 *   }
 *
 * Response :
 *   { variation: { pieces, total_eur, score, llm_verdict, overshoot } }
 *   OU
 *   { variations: { safe, bold, budget } }
 *   OU
 *   { error: "palette_not_found" | "pool_empty" }
 *
 * Note dégradation gracieuse (brief 2026-06-01 v3) :
 * alwaysReturn=true côté composer → on renvoie TOUJOURS la meilleure
 * tenue trouvée, même si le score < 75. Le client peut afficher un badge
 * "approximative" si nécessaire. Voir tâche #107 pour la suppression du
 * fallback "Pour cette palette précise, je n'ai pas trouvé...".
 */

import { NextRequest, NextResponse } from "next/server";
import { dictionary } from "@/lib/data";
import { readAllProducts } from "@/lib/productStore";
import { toComposerProduct } from "@/lib/composer/types";
import { paletteIdentity } from "@/lib/composer/paletteIdentity";
import { composeOutfit, generateVariations } from "@/lib/composer/composeOutfit";
import type { ComposerProfile } from "@/lib/composer/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    paletteRef,
    profile,
    occasion,
    variant,
    allVariations,
  } = (body as {
    paletteRef?: string;
    profile?: Partial<ComposerProfile>;
    occasion?: ComposerProfile["occasion"];
    variant?: "safe" | "bold" | "budget";
    allVariations?: boolean;
  }) || {};

  if (!paletteRef) return NextResponse.json({ error: "missing_paletteRef" }, { status: 400 });

  const entry = dictionary.find((d) => d.number === paletteRef);
  if (!entry) return NextResponse.json({ error: "palette_not_found" }, { status: 404 });

  /* PaletteIdentity dérivée du JSON canonique. */
  const palette = paletteIdentity(entry);

  /* Profil par défaut si client envoie partiel. */
  const fullProfile: ComposerProfile = {
    genre: profile?.genre || "homme",
    budget: profile?.budget || "150_400",
    envie: profile?.envie,
    occasion: occasion || profile?.occasion || "quotidien",
    inspiration: profile?.inspiration,
    likes_couleurs: profile?.likes_couleurs,
    dislikes_marques: profile?.dislikes_marques,
  };

  /* Pool produit depuis KV. Convertit ProduitAwin → ComposerProduct. */
  const all = await readAllProducts();
  const pool = all
    .map(toComposerProduct)
    .filter((p): p is NonNullable<ReturnType<typeof toComposerProduct>> => p !== null);

  if (pool.length === 0) {
    return NextResponse.json({ error: "pool_empty" }, { status: 503 });
  }

  /* Base URL pour la validation LLM optionnelle. */
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "wada.style";
  const baseUrl = `${proto}://${host}`;

  if (allVariations) {
    const variations = await generateVariations(pool, palette, fullProfile, baseUrl);
    return NextResponse.json({ variations }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }

  const outfit = await composeOutfit(pool, palette, fullProfile, {
    variant: variant || "safe",
    validateUrl: baseUrl,
    alwaysReturn: true,
  });

  if (!outfit) {
    return NextResponse.json({ error: "compose_failed" }, { status: 500 });
  }

  return NextResponse.json({ outfit }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
