/**
 * GET /api/dna/[number]
 * ─────────────────────────────────────────────────────────────────────────
 * Endpoint JSON IA-ready. Renvoie l'ADN structuré d'une tenue WADA dans
 * un format directement consommable par un LLM ou un système externe :
 *
 *   {
 *     "id": "look_002",
 *     "name": "Asagi",
 *     "culture": "japanese",
 *     "palette": { "taffy_blue": "#A8B2BD", ... },
 *     "composition": [{ "piece": "Top", "item": "Chemise oxford bleu glacier" }, ...],
 *     "seasons": ["spring", "summer"],
 *     "dna": ["minimal", "old-money", "preppy"],
 *     "tags": ["Palette froide", "Coton", "Bureau", "Printemps"],
 *     "color_bias": "cool",
 *     "saturation": "muted",
 *     "palette_coherence": 92,
 *     "compatibility": { "minimal": 91, "old-money": 87, ... }
 *   }
 *
 * Cache 6h (CDN + edge) — l'ADN est déterministe, pas besoin de recalculer.
 * ─────────────────────────────────────────────────────────────────────── */

import { NextResponse } from "next/server";
import { dictionary } from "@/lib/data";
import { computeOutfitDNA, outfitToAIObject } from "@/lib/dna";

export const runtime = "nodejs";
export const revalidate = 21600; // 6h

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const entry = dictionary.find((d) => d.number === number);
  if (!entry) {
    return NextResponse.json({ error: "Palette introuvable", number }, { status: 404 });
  }
  const dna = computeOutfitDNA(entry);
  const payload = outfitToAIObject(entry, dna);
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
}
