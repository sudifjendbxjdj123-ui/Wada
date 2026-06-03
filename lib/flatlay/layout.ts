/**
 * lib/flatlay/layout.ts
 * Calcul des positions spatiales pour le flat lay 1200×1200.
 */

import { getPiecePixelSize, inferPieceType } from "./sizes";

export interface PieceForLayout {
  id: string;
  slot: "veste" | "haut" | "bas" | "chaussures" | "accent";
  type?: string;
  name?: string;
}

export interface LayoutPosition {
  piece_id: string;
  slot: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Centre de la pièce pour les hotspots — calculé depuis x/y/w/h. */
  cx: number;
  cy: number;
}

const TEMPLATES = {
  casual: {
    veste:      { ax: 110, ay: 130 },
    haut:       { ax: 700, ay: 185 },
    bas:        { ax: 175, ay: 615 },
    chaussures: { ax: 580, ay: 840 },
    accent:     { ax: 850, ay: 1010 },
  },
  formal: {
    veste:      { ax: 80,  ay: 80  },
    haut:       { ax: 640, ay: 130 },
    bas:        { ax: 220, ay: 660 },
    chaussures: { ax: 700, ay: 740 },
    accent:     { ax: 880, ay: 1000 },
  },
  dress: {
    veste:      { ax: 560, ay: 100 },
    haut:       { ax: 200, ay: 80  },
    bas:        { ax: -999,ay: -999 }, // pas de bas
    chaussures: { ax: 580, ay: 580 },
    accent:     { ax: 870, ay: 200 },
  },
  streetwear: {
    veste:      { ax: 140, ay: 100 },
    haut:       { ax: 640, ay: 130 },
    bas:        { ax: 220, ay: 600 },
    chaussures: { ax: 620, ay: 700 },
    accent:     { ax: 800, ay: 950 },
  },
};

export type TemplateName = keyof typeof TEMPLATES;

export function pickTemplate(pieces: PieceForLayout[]): TemplateName {
  const types = pieces.map((p) => inferPieceType(p));
  if (types.some((t) => t === "manteau_long" || t === "manteau_court")) return "formal";
  if (types.some((t) => t === "robe_courte" || t === "robe_longue")) return "dress";
  if (types.some((t) => t === "pull") && pieces.some((p) => p.name?.toLowerCase().includes("hood"))) return "streetwear";
  return "casual";
}

export function layoutFlatLay(pieces: PieceForLayout[]): LayoutPosition[] {
  const template = TEMPLATES[pickTemplate(pieces)];
  const positions: LayoutPosition[] = [];

  for (const piece of pieces) {
    const size = getPiecePixelSize(inferPieceType(piece));
    const anchor = template[piece.slot] as { ax: number; ay: number } | undefined;
    if (!anchor || anchor.ax < 0) continue;

    positions.push({
      piece_id: piece.id,
      slot: piece.slot,
      x: anchor.ax,
      y: anchor.ay,
      w: size.w,
      h: size.h,
      cx: anchor.ax + size.w / 2,
      cy: anchor.ay + size.h / 2,
    });
  }

  return positions;
}
