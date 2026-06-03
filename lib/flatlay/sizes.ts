/**
 * lib/flatlay/sizes.ts
 *
 * Tailles réelles des pièces de vêtements en cm.
 * Sur le canvas 1200×1200 = 240×240 cm réels.
 * Donc 1 cm = 5 pixels.
 */

export const CM_TO_PX = 5;
export const CANVAS_SIZE = 1200;

export type PieceType =
  | "manteau_long" | "manteau_court" | "cardigan" | "blazer" | "pull"
  | "polo" | "tshirt" | "chemise"
  | "robe_courte" | "robe_longue"
  | "jean" | "pantalon" | "short" | "jupe"
  | "mocassins" | "sneakers" | "bottes" | "sandales"
  | "sac" | "ceinture" | "foulard" | "lunettes"
  | "cufflinks" | "montre" | "bagues" | "collier";

interface RealSize { w: number; h: number; }

export const REAL_SIZES_CM: Record<PieceType, RealSize> = {
  manteau_long:    { w: 75, h: 110 },
  manteau_court:   { w: 70, h: 80 },
  cardigan:        { w: 65, h: 70 },
  blazer:          { w: 70, h: 75 },
  pull:            { w: 60, h: 65 },
  polo:            { w: 55, h: 70 },
  tshirt:          { w: 50, h: 65 },
  chemise:         { w: 58, h: 75 },
  robe_courte:     { w: 50, h: 90 },
  robe_longue:     { w: 55, h: 130 },
  jean:            { w: 40, h: 105 },
  pantalon:        { w: 40, h: 105 },
  short:           { w: 40, h: 45 },
  jupe:            { w: 50, h: 70 },
  mocassins:       { w: 28, h: 12 },
  sneakers:        { w: 30, h: 13 },
  bottes:          { w: 30, h: 35 },
  sandales:        { w: 26, h: 11 },
  sac:             { w: 30, h: 25 },
  ceinture:        { w: 18, h: 18 },
  foulard:         { w: 25, h: 25 },
  lunettes:        { w: 14, h: 5 },
  cufflinks:       { w: 4, h: 4 },
  montre:          { w: 6, h: 6 },
  bagues:          { w: 3, h: 3 },
  collier:         { w: 12, h: 18 },
};

export function getPiecePixelSize(type: PieceType): RealSize {
  const cm = REAL_SIZES_CM[type] ?? { w: 50, h: 50 };
  return { w: cm.w * CM_TO_PX, h: cm.h * CM_TO_PX };
}

export function inferPieceType(piece: { type?: string; name?: string; slot?: string }): PieceType {
  if (piece.type && piece.type in REAL_SIZES_CM) return piece.type as PieceType;

  const text = `${piece.name ?? ""} ${piece.slot ?? ""}`.toLowerCase();

  if (text.match(/manteau|trench|parka/)) return text.match(/long/) ? "manteau_long" : "manteau_court";
  if (text.match(/cardigan|gilet/)) return "cardigan";
  if (text.match(/blazer|veste\s+(de\s+)?costume/)) return "blazer";
  if (text.match(/pull|sweater|hoodie/)) return "pull";
  if (text.match(/polo/)) return "polo";
  if (text.match(/t-?shirt|tee/)) return "tshirt";
  if (text.match(/chemise|shirt/)) return "chemise";
  if (text.match(/robe\s+longue/)) return "robe_longue";
  if (text.match(/robe/)) return "robe_courte";
  if (text.match(/jean/)) return "jean";
  if (text.match(/short/)) return "short";
  if (text.match(/jupe|skirt/)) return "jupe";
  if (text.match(/pantalon|trouser|cargo|chino/)) return "pantalon";
  if (text.match(/mocassin|loafer|derby/)) return "mocassins";
  if (text.match(/sneaker|basket/)) return "sneakers";
  if (text.match(/botte|boot/)) return "bottes";
  if (text.match(/sandale|sandal/)) return "sandales";
  if (text.match(/sac|bag|tote/)) return "sac";
  if (text.match(/ceinture|belt/)) return "ceinture";
  if (text.match(/foulard|écharpe|scarf/)) return "foulard";
  if (text.match(/lunette|sunglass/)) return "lunettes";

  if (piece.slot === "veste") return "cardigan";
  if (piece.slot === "haut") return "polo";
  if (piece.slot === "bas") return "pantalon";
  if (piece.slot === "chaussures") return "mocassins";
  if (piece.slot === "accent") return "sac";

  return "polo";
}
