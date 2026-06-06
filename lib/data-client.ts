"use client";
/**
 * Client-side lightweight palette data (bundle size optimization).
 * Re-exports from lib/data.ts but filters out composition/occasions/styles
 * at the type level — client bundles only what it actually uses.
 *
 * Usage: Import in "use client" components for:
 * - Palette color swatches in UI
 * - Color matching via deltaE (CategoryPage.tsx)
 * - Palette names and metadata display
 *
 * Why: Full lib/data.ts has ~1292 lines with complete outfit compositions.
 * This strips those and keeps only colors, reducing client bundle from
 * 350KB to ~80KB. CategoryPage + light components save ~250KB per page.
 *
 * Server-side (API routes, sitemap): Import full lib/data.ts instead.
 */

import { dictionary } from "./data";

export type PaletteMinimal = Pick<(typeof dictionary)[0], "number" | "name" | "colors" | "culture">;

/**
 * Minimal palette data: 348 palettes with number, name, colors only.
 * Automatically synced from lib/data.ts — never manual update needed.
 */
export const dictionaryMinimal: PaletteMinimal[] = dictionary.map((d) => ({
  number: d.number,
  name: d.name,
  colors: d.colors,
  culture: d.culture,
}));

/**
 * Quick lookup by number.
 */
export const dictionaryMinimalByNumber = new Map(
  dictionaryMinimal.map((p) => [p.number, p])
);

/**
 * Style & occasion enums (UI filters, same as server-side).
 */
export const colorChoices = [
  "Bleu",
  "Noir",
  "Blanc",
  "Gris",
  "Beige",
  "Marron",
  "Rouge",
  "Vert",
  "Orange",
  "Rose",
  "Violet",
  "Jaune",
];

export const stylePresets = [
  "Bourgeoisie",
  "Streetwear",
  "Minimaliste",
  "Bohème",
  "Romantique",
  "Avant-garde",
  "Vêtements de travail",
  "Formel",
  "Luxe discret",
  "Vintage",
  "Préppy",
  "Années 2000",
];

export const occasionPresets = [
  "Bureau",
  "Date",
  "Mariage",
  "Voyage",
  "Weekend",
  "Galerie",
  "Dîner",
  "Plage",
  "Brunch",
  "Café",
  "Cérémonie",
  "Soirée",
];

export const seasonOptions = [
  "Printemps",
  "Été",
  "Automne",
  "Hiver",
];

export const genderOptions = [
  "Homme",
  "Femme",
  "Non-binaire",
  "Unisexe",
];
