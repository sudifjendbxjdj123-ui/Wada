/**
 * lib/flatlay/index.ts — Orchestrateur principal.
 *
 * Adapté au stack WADA (pas de SQL) : cache via Vercel Blob.
 * Clé de cache = hash SHA-256 des 5 URLs sources.
 */

import { createHash } from "node:crypto";
import { put, head } from "@vercel/blob";
import { removeBackgroundBatch } from "./rembg";
import { composeFlatLay } from "./composer";
import { layoutFlatLay } from "./layout";
import type { PieceForLayout } from "./layout";

export interface FlatLayPiece extends PieceForLayout {
  image_url: string;
  marque?: string;
  nom?: string;
  prix?: number;
  url_buy?: string;
}

export interface FlatLayResult {
  url: string | null;
  positions: import("./layout").LayoutPosition[];
  status: "generated" | "cached" | "low_quality" | "failed";
  reason?: string;
}

/** Génère un hash stable depuis les URLs sources pour le cache Blob. */
function outfitHash(pieces: FlatLayPiece[]): string {
  const key = pieces
    .sort((a, b) => a.slot.localeCompare(b.slot))
    .map((p) => p.image_url)
    .join("|");
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

export async function generateFlatLay(pieces: FlatLayPiece[]): Promise<FlatLayResult> {
  const hash = outfitHash(pieces);
  const blobKey = `flatlay/${hash}.jpg`;

  /* 1. Cache check via Vercel Blob */
  try {
    const existing = await head(blobKey);
    if (existing?.url) {
      const positions = layoutFlatLay(pieces);
      return { url: existing.url, positions, status: "cached" };
    }
  } catch {
    /* pas en cache — on génère */
  }

  /* 2. Calcul des positions spatiales */
  const positions = layoutFlatLay(pieces);
  if (positions.length < 3) {
    return { url: null, positions: [], status: "low_quality", reason: "Moins de 3 pièces positionables" };
  }

  /* 3. Background removal en parallèle (Replicate) */
  const urls = positions.map((pos) => {
    const piece = pieces.find((p) => p.id === pos.piece_id);
    return piece?.image_url ?? "";
  }).filter(Boolean);

  const cutouts = await removeBackgroundBatch(urls);
  const validCutouts = cutouts.filter(Boolean).length;

  if (validCutouts < 3) {
    return {
      url: null, positions,
      status: "low_quality",
      reason: `Seulement ${validCutouts}/5 images détourées avec succès`,
    };
  }

  /* 4. Composition Sharp */
  let flatLayJpeg: Buffer;
  try {
    flatLayJpeg = await composeFlatLay(cutouts, positions);
  } catch (e) {
    return { url: null, positions, status: "failed", reason: String(e) };
  }

  /* 5. Upload Vercel Blob (cache 7 jours) */
  try {
    const { url } = await put(blobKey, flatLayJpeg, {
      access: "public",
      contentType: "image/jpeg",
      cacheControlMaxAge: 60 * 60 * 24 * 7,
    });
    return { url, positions, status: "generated" };
  } catch (e) {
    return { url: null, positions, status: "failed", reason: `Blob upload: ${String(e)}` };
  }
}
