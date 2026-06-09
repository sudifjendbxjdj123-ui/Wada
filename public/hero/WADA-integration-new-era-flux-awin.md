# WADA — Intégration New Era depuis le flux Awin

Brief codeur pour ajouter **25 367 casquettes New Era** au catalogue WADA.

**Durée dev estimée** : 2-3h + 30 min d'enrichissement IA.
**Coût** : ~$2,50 one-shot pour l'enrichissement couleur.

---

## Contexte du flux

J'ai téléchargé et analysé le flux Awin de New Era. Voici le rapport :

| Métrique | Valeur |
|---|---|
| Total produits | **25 367 casquettes** |
| En stock | 100% (25 367) ✓ |
| Disponibles vente | 100% ✓ |
| Prix range | 8€ – 300€ |
| Prix moyen | 50,97 € |
| Avec `alternate_image` | 99,9% ✓ |

**MAIS** 3 colonnes critiques sont mal ou pas renseignées par le flux New Era. Il faut
gérer ces 3 cas dans l'import :

| Colonne | État | Solution |
|---|---|---|
| `large_image` | **0% rempli** | Fallback sur `alternate_image` |
| `colour` | **6% rempli** | Enrichir via GPT-4o-mini Vision |
| `merchant_product_category_path` | **0% rempli** | Hardcoder `casquettes` |

---

## L'URL du flux

À mettre dans Vercel comme variable d'environnement (**JAMAIS dans le code source**) :

```
NEW_ERA_AWIN_FEED_URL=[à transmettre par DM uniquement]
```

⚠️ Cette URL contient la clé API Awin de Nem. Elle ne doit JAMAIS être :
- Committée dans le code source
- Affichée publiquement
- Loggée dans Vercel logs

---

## 1. Le script d'import

```typescript
// scripts/import-new-era-feed.ts

import fetch from 'node-fetch';
import { gunzipSync } from 'zlib';
import { parse } from 'csv-parse/sync';
import { db } from '@/lib/db';

interface AwinCsvRow {
  aw_deep_link: string;
  product_name: string;
  aw_product_id: string;
  merchant_product_id: string;
  merchant_image_url: string;
  aw_image_url: string;
  large_image: string;
  alternate_image: string;
  alternate_image_two: string;
  alternate_image_three: string;
  alternate_image_four: string;
  description: string;
  search_price: string;
  currency: string;
  brand_name: string;
  colour: string;
  product_type: string;
  in_stock: string;
  is_for_sale: string;
  rrp_price: string;
  savings_percent: string;
  display_price: string;
  // ... etc
}

const FEED_URL = process.env.NEW_ERA_AWIN_FEED_URL;

async function importNewEraFeed() {
  if (!FEED_URL) throw new Error('NEW_ERA_AWIN_FEED_URL non configurée');

  console.log('📥 Téléchargement du flux...');
  const response = await fetch(FEED_URL);
  const buffer = await response.arrayBuffer();
  const csvText = gunzipSync(Buffer.from(buffer)).toString('utf-8');

  console.log('📋 Parsing CSV...');
  const rows: AwinCsvRow[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  console.log(`✅ ${rows.length} produits à traiter`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    // Skip si pas en stock
    if (row.in_stock !== '1' || row.is_for_sale !== '1') {
      skipped++;
      continue;
    }

    // FALLBACK IMAGE — large_image est vide, on cascade
    const imageUrl = row.large_image
                  || row.alternate_image
                  || row.aw_image_url
                  || row.merchant_image_url
                  || null;

    if (!imageUrl) {
      skipped++;
      continue;
    }

    // Images alternées (pour le quick view multi-photos)
    const alternateImages = [
      row.alternate_image,
      row.alternate_image_two,
      row.alternate_image_three,
      row.alternate_image_four,
    ].filter(Boolean);

    // Normalisation marque : "New Era Cap" + "UK NewEraCap" → "New Era"
    const brand = 'New Era';

    // HARDCODÉ — catégorie New Era = casquettes
    const category = 'accessoires';
    const subcategory = 'casquettes';
    const type = 'chapeaux';

    // Parser le prix
    const price = parseFloat(row.search_price || '0');
    const rrpPrice = parseFloat(row.rrp_price || '0');
    const savingsPercent = parseFloat(row.savings_percent || '0');

    // Insertion / mise à jour
    await db.product.upsert({
      where: { source_product_id: row.aw_product_id },
      create: {
        source: 'new_era_awin',
        source_product_id: row.aw_product_id,
        brand,
        name: row.product_name,
        description: row.description,
        category,
        subcategory,
        type,
        price,
        original_price: rrpPrice > 0 ? rrpPrice : null,
        discount_percent: savingsPercent > 0 ? savingsPercent : null,
        currency: row.currency || 'EUR',
        image_url: imageUrl,
        alternate_images: alternateImages,
        affiliate_url: row.aw_deep_link,
        merchant_url: row.merchant_deep_link,
        gender: 'mixte',  // Par défaut pour casquettes
        is_active: true,
        is_color_enriched: false,  // sera enrichi par GPT-4o Vision
        // colour brut depuis le flux, sera enrichi
        raw_color: row.colour || null,
        // metadata
        merchant_id: row.merchant_id,
        last_updated_at: new Date(row.last_updated || Date.now()),
      },
      update: {
        price,
        original_price: rrpPrice > 0 ? rrpPrice : null,
        discount_percent: savingsPercent > 0 ? savingsPercent : null,
        is_active: true,
        last_updated_at: new Date(row.last_updated || Date.now()),
      },
    });

    imported++;
    if (imported % 1000 === 0) {
      console.log(`  Importés : ${imported.toLocaleString()}/${rows.length.toLocaleString()}`);
    }
  }

  console.log(`\n✅ Import terminé :`);
  console.log(`   - Importés : ${imported.toLocaleString()}`);
  console.log(`   - Skipped  : ${skipped.toLocaleString()}`);
}

importNewEraFeed().catch(console.error);
```

---

## 2. L'enrichissement couleur via GPT-4o-mini Vision

C'est la partie critique. Sans ça, 94% des casquettes sont invisibles pour le filtre
Palette Sanzō Wada.

```typescript
// scripts/enrich-new-era-colors.ts

import OpenAI from 'openai';
import { db } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ColorEnrichment {
  color_family: string;     // "noir", "bleu marine", "beige", etc.
  color_hex: string;        // "#1a1a1a"
  color_intensity: number;  // 0-1 (saturation)
  has_pattern: boolean;     // true si motif visible
  pattern_type?: string;    // "camo", "rayé", "uni", etc.
}

async function enrichColor(imageUrl: string): Promise<ColorEnrichment> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Identifie la couleur dominante de cette casquette.
Retourne UNIQUEMENT un JSON :
{
  "color_family": "<nom français : noir, blanc, gris, bleu marine, rouge, vert sauge, beige, marron, etc>",
  "color_hex": "<code hex>",
  "color_intensity": <nombre 0-1, saturation>,
  "has_pattern": <true|false>,
  "pattern_type": "<uni, camo, rayé, à pois, logo, autre>"
}`
        },
        {
          type: 'image_url',
          image_url: { url: imageUrl, detail: 'low' }  // 'low' = -50% coût
        }
      ]
    }],
    response_format: { type: 'json_object' },
    max_tokens: 150,
  });

  return JSON.parse(response.choices[0].message.content!);
}

async function enrichAllNewEra() {
  const products = await db.product.findMany({
    where: {
      source: 'new_era_awin',
      is_color_enriched: false,
    },
    take: 30000,
  });

  console.log(`🎨 Enrichissement de ${products.length} casquettes...`);

  let enriched = 0;
  let failed = 0;

  // Parallélisme limité à 5 simultanément pour ne pas saturer l'API
  for (let i = 0; i < products.length; i += 5) {
    const batch = products.slice(i, i + 5);

    await Promise.all(batch.map(async product => {
      try {
        const enrichment = await enrichColor(product.image_url);

        await db.product.update({
          where: { id: product.id },
          data: {
            color_family: enrichment.color_family,
            color_hex: enrichment.color_hex,
            color_intensity: enrichment.color_intensity,
            has_pattern: enrichment.has_pattern,
            pattern_type: enrichment.pattern_type,
            is_color_enriched: true,
          },
        });

        enriched++;
        if (enriched % 100 === 0) {
          console.log(`  ${enriched.toLocaleString()}/${products.length.toLocaleString()}`);
        }
      } catch (err) {
        console.error(`  ❌ ${product.id}: ${err.message}`);
        failed++;
      }
    }));

    // Petite pause anti rate-limit
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n✅ Enrichissement terminé :`);
  console.log(`   - Enrichies : ${enriched.toLocaleString()}`);
  console.log(`   - Échecs    : ${failed.toLocaleString()}`);
}

enrichAllNewEra().catch(console.error);
```

**Coût** : 25 367 × $0,0001 = **$2,54** total (en mode `detail: 'low'`).

---

## 3. Recalculer les matching_palette_ids

Après l'enrichissement couleur, recalculer les palettes WADA matchantes pour chaque casquette :

```typescript
// scripts/index-new-era-palettes.ts

import { db } from '@/lib/db';
import { deltaE } from '@/lib/colors/delta-e';

async function indexNewEraPalettes() {
  const palettes = await db.palette.findMany();
  const products = await db.product.findMany({
    where: { source: 'new_era_awin', is_color_enriched: true },
  });

  console.log(`🎨 Indexation des palettes pour ${products.length} casquettes...`);

  for (const product of products) {
    if (!product.color_hex) continue;

    const matchingPalettes = palettes
      .filter(palette => {
        return palette.colors.some(paletteColor =>
          deltaE(product.color_hex, paletteColor) < 35
        );
      })
      .map(p => p.id);

    await db.product.update({
      where: { id: product.id },
      data: {
        matching_palette_ids: matchingPalettes,
      },
    });
  }

  console.log('✅ Indexation terminée');
}
```

---

## 4. Filtrage des photos avec mannequin (règle WADA absolue)

Lance le script déjà spec'd `scripts/clean-product-images.ts` qui :
- Détecte les photos avec mannequin via GPT-4o Vision
- Désactive les produits qui n'ont QUE des photos avec mannequin
- Garde uniquement les packshots de face

Pour les casquettes New Era, on s'attend à ce que **80-90% des photos soient des packshots
purs** (chapeaux flottants ou posés). C'est la marque de la maison.

---

## 5. Script master orchestrant tout

```typescript
// scripts/onboard-new-era.ts

import { importNewEraFeed } from './import-new-era-feed';
import { enrichAllNewEra } from './enrich-new-era-colors';
import { indexNewEraPalettes } from './index-new-era-palettes';
import { cleanProductImages } from './clean-product-images';

async function onboardNewEra() {
  console.log('🚀 Onboarding New Era → WADA\n');

  console.log('Étape 1/4 : Import du flux Awin');
  await importNewEraFeed();

  console.log('\nÉtape 2/4 : Enrichissement couleurs (GPT-4o Vision)');
  await enrichAllNewEra();

  console.log('\nÉtape 3/4 : Indexation palettes Sanzō Wada');
  await indexNewEraPalettes();

  console.log('\nÉtape 4/4 : Filtrage photos mannequin');
  await cleanProductImages({ source: 'new_era_awin' });

  console.log('\n🎉 New Era onboardé sur WADA');
}

onboardNewEra().catch(console.error);
```

À lancer une seule fois pour le onboarding initial, puis le job cron quotidien
prend le relais pour les nouveaux produits.

---

## 6. Job cron quotidien (déjà existant à étendre)

Ajouter New Era au sync quotidien :

```typescript
// scripts/sync-all-feeds.ts (existant)

const FEEDS = [
  { name: 'MUJI',           env: 'MUJI_AWIN_FEED_URL' },
  { name: 'TBF',            env: 'TBF_AWIN_FEED_URL' },
  { name: 'Shirt Co',       env: 'SHIRT_CO_AWIN_FEED_URL' },
  { name: 'Suitable',       env: 'SUITABLE_AWIN_FEED_URL' },
  { name: 'K&Ö',            env: 'KO_AWIN_FEED_URL' },
  { name: 'New Era',        env: 'NEW_ERA_AWIN_FEED_URL' },  // ← AJOUT
];

async function syncAllFeeds() {
  for (const feed of FEEDS) {
    const url = process.env[feed.env];
    if (!url) continue;

    console.log(`Sync ${feed.name}...`);
    await syncFeed(feed.name, url);
  }
}
```

Et configurer Vercel Cron dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-feeds",
      "schedule": "0 4 * * *"
    }
  ]
}
```

---

## 7. Migration DB nécessaire

Si pas déjà fait, ajouter ces colonnes à la table `products` :

```sql
ALTER TABLE products ADD COLUMN raw_color TEXT;
ALTER TABLE products ADD COLUMN is_color_enriched BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN color_intensity REAL;
ALTER TABLE products ADD COLUMN has_pattern BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN pattern_type TEXT;
ALTER TABLE products ADD COLUMN matching_palette_ids TEXT[];
ALTER TABLE products ADD COLUMN alternate_images TEXT[];
ALTER TABLE products ADD COLUMN original_price REAL;
ALTER TABLE products ADD COLUMN discount_percent REAL;
ALTER TABLE products ADD COLUMN source_product_id TEXT UNIQUE;

CREATE INDEX idx_products_matching_palettes ON products USING GIN (matching_palette_ids);
CREATE INDEX idx_products_source ON products (source);
```

---

## 8. Checklist d'implémentation

```
□ Variable d'env NEW_ERA_AWIN_FEED_URL dans Vercel
□ Migrations DB exécutées
□ scripts/import-new-era-feed.ts créé et testé
□ scripts/enrich-new-era-colors.ts créé et testé
□ scripts/index-new-era-palettes.ts créé et testé
□ scripts/onboard-new-era.ts (master) créé
□ New Era ajouté à FEEDS dans sync-all-feeds.ts
□ Test sur 100 produits d'abord (mode dry-run avec --limit=100)
□ Si OK : lancer onboard-new-era.ts en prod
□ Vérifier sur wada.style/marques/new-era qu'on voit ~25 000 produits
□ Vérifier sur wada.style/accessoires?palettes=rosee-du-matin qu'on
  voit les casquettes beige/sauge dans cette palette
□ Lancer un test de quick view sur une casquette : vérifier que
  matching_palette_ids fonctionne et affiche bien les 3 palettes
```

---

## 9. Coûts estimés

| Item | Coût |
|---|---|
| Import initial (DB + bande passante) | 0€ |
| Enrichissement couleur GPT-4o-mini × 25 367 | **$2,54** one-shot |
| Indexation palettes (calcul local) | 0€ |
| Filtrage photos mannequin × 25 367 | ~$5 (Vision sur cas ambigus) |
| Job cron quotidien (~200 nouveaux/jour) | ~$0,03/jour |
| **TOTAL one-shot** | **~$7,50** |
| **TOTAL récurrent** | **~$1/mois** |

C'est négligeable pour ajouter **25 000+ produits** à WADA.

---

## 10. Volume attendu après onboarding

| Statut | Estimation |
|---|---|
| Casquettes importées | ~25 367 |
| Avec image valide | ~25 350 (99,9%) |
| Avec couleur enrichie | ~24 500 (97%) |
| Matching au moins 1 palette WADA | ~20 000 (80%) |
| **Affichables sur le site** | **~20 000 casquettes** |

C'est **+20 000 produits** dans ton catalogue, +9 marques sous-marques New Era détectées
si on peuple `brand_name` correctement.

---

## 11. Particularités à retenir pour les FUTURES intégrations

New Era a 3 particularités qu'on retrouvera probablement chez d'autres marques streetwear :

1. **large_image vide** — toujours prévoir un fallback en cascade
2. **colour mal renseigné** — toujours prévoir un enrichissement Vision
3. **category_path vide** — souvent on doit hardcoder la catégorie selon la marque

Pour les futures intégrations (Stüssy, Carhartt WIP, Y-3...), réutiliser ce même pattern :
1. Tenter d'utiliser les colonnes fournies
2. Identifier les manques en analyse rapide du flux
3. Compléter avec GPT-4o Vision si critique (couleur, genre, taille)
4. Hardcoder ce qui peut l'être (catégorie, sous-marque)

---

## En une phrase

> **New Era nous donne 25 000 produits propres avec stock à jour ; on compense les 3 colonnes
> mal renseignées par 2 scripts d'enrichissement IA pour $2,50 one-shot.**

À implémenter en priorité après les bugs critiques actuels. C'est un **gain catalogue énorme
pour très peu d'effort**.
