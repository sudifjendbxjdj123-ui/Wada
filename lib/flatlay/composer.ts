/**
 * lib/flatlay/composer.ts
 * Composition Sharp : 5 cutouts PNG → image JPEG 1200×1200 fond crème WADA.
 */

import sharp from "sharp";
import type { LayoutPosition } from "./layout";
import { CANVAS_SIZE } from "./sizes";

const BG = { r: 244, g: 238, b: 228 }; // #f4eee4

export async function composeFlatLay(
  cutouts: (Buffer | null)[],
  positions: LayoutPosition[],
): Promise<Buffer> {
  const overlays: sharp.OverlayOptions[] = [];

  for (let i = 0; i < positions.length; i++) {
    const cutout = cutouts[i];
    const pos = positions[i];
    if (!cutout) continue;

    try {
      const resized = await sharp(cutout)
        .resize(pos.w, pos.h, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();

      overlays.push({ input: resized, top: Math.max(0, pos.y), left: Math.max(0, pos.x) });
    } catch (e) {
      console.warn("[composer] skip piece", pos.slot, String(e));
    }
  }

  const canvas = sharp({
    create: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 3, background: BG },
  });

  const final = await canvas
    .composite(overlays)
    .modulate({ saturation: 0.95, brightness: 1.02 })
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();

  return final;
}
