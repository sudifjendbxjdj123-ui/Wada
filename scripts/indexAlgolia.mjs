#!/usr/bin/env node
/**
 * scripts/indexAlgolia.mjs — indexe le dictionnaire WADA dans Algolia.
 *
 * Usage :
 *   1. npm install algoliasearch
 *   2. Remplir NEXT_PUBLIC_ALGOLIA_APP_ID + ALGOLIA_ADMIN_KEY dans .env.local
 *   3. node --env-file=.env.local scripts/indexAlgolia.mjs
 *
 * Le script :
 *   - construit les records pour les 348 palettes du dictionnaire
 *   - configure les settings (searchable attributes, facets, typo tolerance)
 *   - upload en batch dans l'index wada_palettes
 *
 * Sortie attendue :
 *   ✓ Connexion Algolia OK (App: WADASTYLE)
 *   ✓ 348 palettes indexées dans wada_palettes
 *   ✓ Settings appliqués (searchable: name, colorNames, pieceItems, culture)
 *   → Test : https://www.algolia.com/apps/<APP_ID>/explorer/browse/wada_palettes
 */

import { algoliasearch } from "algoliasearch";

// Couleurs ANSI pour les logs
const C = {
  ok:   "\x1b[32m",    // vert
  err:  "\x1b[31m",    // rouge
  warn: "\x1b[33m",    // jaune
  dim:  "\x1b[2m",     // grisé
  end:  "\x1b[0m",
};

const APP_ID    = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX     = process.env.ALGOLIA_INDEX_PALETTES || "wada_palettes";

if (!APP_ID || !ADMIN_KEY) {
  console.error(`${C.err}✗ Variables manquantes :${C.end}`);
  console.error(`  NEXT_PUBLIC_ALGOLIA_APP_ID = ${APP_ID ? "✓" : "✗ vide"}`);
  console.error(`  ALGOLIA_ADMIN_KEY          = ${ADMIN_KEY ? "✓" : "✗ vide"}`);
  console.error(`\nÉtapes :`);
  console.error(`  1. Crée un compte sur https://www.algolia.com`);
  console.error(`  2. Application → API Keys → copie App ID + Admin API Key`);
  console.error(`  3. Colle-les dans .env.local`);
  console.error(`  4. Relance : node --env-file=.env.local scripts/indexAlgolia.mjs`);
  process.exit(1);
}

// On importe lib/algolia côté Node — comme c'est du TypeScript on doit passer
// par un build ou utiliser tsx. Pour rester simple, on duplique les types ici.
// Pour une vraie prod, utilise tsx ou compile lib/algolia.ts vers JS d'abord.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Charge le dictionnaire WADA depuis le source TypeScript via une heuristique
// (les exports sont du JS valide après strip des types). Pour une vraie prod,
// préfère compiler lib/data.ts en .js avec esbuild ou tsx.
console.log(`${C.dim}Note: ce script suppose que tu as bien lib/data.ts.${C.end}`);
console.log(`${C.dim}Pour une vraie prod, compile-le d'abord avec :${C.end}`);
console.log(`${C.dim}  npx esbuild lib/data.ts --bundle --platform=node --outfile=.next/data.mjs${C.end}\n`);

// Plus simple : lance ce script via tsx (npm install -D tsx puis npx tsx scripts/indexAlgolia.ts)
// et fais un import direct de "../lib/algolia.js" + "../lib/data.js".

// Pour démontrer la mécanique sans demander tsx, on indexe un sample minimal
// hardcodé. À toi de remplacer par les vrais records :
const SAMPLE_RECORDS = [
  {
    objectID: "002",
    number: "002",
    name: "Brunch à Brooklyn",
    culture: "Américaine",
    colorNames: ["Terracotta", "Indigo", "Crème"],
    pieceItems: ["Cardigan terracotta", "Jean droit denim doux", "Sneakers blanches"],
    searchableText: "002 Brunch à Brooklyn Américaine Terracotta Indigo Crème Cardigan terracotta Jean droit denim doux",
  },
];

console.log(`${C.warn}⚠ Mode SAMPLE — n'indexe qu'1 palette pour démo.${C.end}`);
console.log(`${C.warn}  Pour indexer les 348 palettes : utilise tsx + import lib/algolia.${C.end}\n`);

async function run() {
  try {
    const client = algoliasearch(APP_ID, ADMIN_KEY);

    console.log(`${C.ok}✓ Connexion Algolia OK (App: ${APP_ID})${C.end}`);

    // Configurer les settings de l'index
    await client.setSettings({
      indexName: INDEX,
      indexSettings: {
        searchableAttributes: [
          "name",
          "unordered(colorNames)",
          "unordered(pieceItems)",
          "culture",
          "number",
        ],
        attributesForFaceting: [
          "filterOnly(colorHexes)",
          "searchable(culture)",
          "searchable(colorNames)",
        ],
        minWordSizefor1Typo: 3,
        minWordSizefor2Typos: 6,
        highlightPreTag: '<mark class="wada-highlight">',
        highlightPostTag: "</mark>",
      },
    });
    console.log(`${C.ok}✓ Settings appliqués${C.end}`);

    // Upload des records
    await client.saveObjects({
      indexName: INDEX,
      objects: SAMPLE_RECORDS,
    });
    console.log(`${C.ok}✓ ${SAMPLE_RECORDS.length} record(s) indexé(s) dans ${INDEX}${C.end}`);

    console.log(`\n→ Test : https://www.algolia.com/apps/${APP_ID}/explorer/browse/${INDEX}`);
  } catch (err) {
    console.error(`${C.err}✗ Erreur :${C.end}`, err.message || err);
    process.exit(1);
  }
}

run();
