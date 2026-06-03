/**
 * POST /api/flatlay
 *
 * Génère ou sert depuis cache le flat lay d'une tenue.
 * Body : { pieces: FlatLayPiece[] }
 * Response : { url: string|null, positions: LayoutPosition[], status: string }
 *
 * Coût : ~$0.005 par tenue (5 images × $0.001) — seulement si pas en cache.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateFlatLay } from "@/lib/flatlay";
import type { FlatLayPiece } from "@/lib/flatlay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Replicate peut prendre ~20s

export async function POST(req: NextRequest) {
  let pieces: FlatLayPiece[];
  try {
    const body = await req.json();
    pieces = body.pieces;
    if (!Array.isArray(pieces) || pieces.length === 0) throw new Error("pieces manquantes");
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  const result = await generateFlatLay(pieces);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
