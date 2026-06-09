# WADA — Intégration Kastner & Öhler CH depuis le flux Awin

Brief codeur pour ajouter **44 500 produits multi-marques K&Ö** au catalogue WADA.

**Durée dev estimée** : 4-5h.
**Coût** : ~$25 one-shot.
**Volume final attendu** : ~30 000 produits affichables sur WADA.

---

## Contexte du flux

J'ai téléchargé et analysé le flux Awin de Kastner & Öhler CH. Voici le rapport :

| Métrique | Valeur |
|---|---|
| Total produits | **76 317** |
| En stock | 100% ✓ |
| Vendables (`is_for_sale=1`) | **44 536** (58%) |
| **Marques distinctes** | **520** ⭐ |
| Catégories distinctes | 554 |
| Couleurs renseignées | **97%** (35 couleurs) ✓ |
| Tailles distinctes | 388 |
| Avec `alternate_image` | 88% |
| Avec `large_image` | 0% (bug Awin) |
| Devise | **CHF** (Francs Suisses) |
| Langue | **DE** (allemand) |
| Prix médian | **107 CHF** |
| Prix range | 70 – 2 532 CHF |

**K&Ö est un game-changer** : 520 marques européennes premium en une seule intégration —
Polo Ralph Lauren, Tommy Hilfiger, Boss, HUGO, Marc O'Polo, Drykorn, Levi's, Adidas Originals,
Joop, MAC, Marc Cain, etc.

---

## L'URL du flux

À mettre dans Vercel comme variable d'environnement (**JAMAIS dans le code source**) :

```
KO_AWIN_FEED_URL=[à transmettre par DM uniquement]
```

⚠️ Cette URL contient la clé API Awin. Sécurité absolue : pas de git, pas de log Vercel,
pas de canal public.

---

## Les 5 particularités à gérer pour K&Ö

| Particularité | Impact | Solution |
|---|---|---|
| **Langue allemande** | Toutes les catégories en allemand | Table mapping DE→FR hardcodée |
| **Devise CHF** | Prix en Francs suisses | Garder CHF + conversion EUR optionnelle |
| **`Fashion:suitable_for` vide 97%** | Pas de genre direct | Déduire depuis `category_path` (Herren/Damen) |
| **`is_for_sale = 0` pour 42%** | 31 781 produits invendables | Filtrer dès l'import |
| **`large_image` à 0%** | Bug Awin standard | Fallback cascade vers `alternate_image` |

---

## 1. Tables de mapping allemand → français

```typescript
// lib/translations/de-fr.ts

export const COLOR_DE_TO_FR: Record<string, { fr: string; hex: string }> = {
  schwarz:     { fr: 'noir',         hex: '#1a1a1a' },
  blau:        { fr: 'bleu',         hex: '#2c4a8a' },
  dunkelblau:  { fr: 'bleu marine',  hex: '#1a2849' },
  hellblau:    { fr: 'bleu clair',   hex: '#8ab4d4' },
  weiss:       { fr: 'blanc',        hex: '#ffffff' },
  beige:       { fr: 'beige',        hex: '#e0d4b8' },
  braun:       { fr: 'marron',       hex: '#6e4d2e' },
  grau:        { fr: 'gris',         hex: '#888880' },
  hellgrau:    { fr: 'gris clair',   hex: '#c8c8c4' },
  dunkelgrau:  { fr: 'gris foncé',   hex: '#4a4a48' },
  creme:       { fr: 'crème',        hex: '#f0e8d4' },
  olive:       { fr: 'olive',        hex: '#6b6840' },
  rosa:        { fr: 'rose',         hex: '#e8b8c4' },
  camel:       { fr: 'camel',        hex: '#b89570' },
  grün:        { fr: 'vert',         hex: '#4a8048' },
  dunkelgrün:  { fr: 'vert foncé',   hex: '#2a4a28' },
  hellgrün:    { fr: 'vert clair',   hex: '#a4c890' },
  rot:         { fr: 'rouge',        hex: '#c83030' },
  weinrot:     { fr: 'bordeaux',     hex: '#6e2030' },
  gelb:        { fr: 'jaune',        hex: '#e8c848' },
  orange:      { fr: 'orange',       hex: '#e08838' },
  lila:        { fr: 'violet',       hex: '#8848a8' },
  türkis:      { fr: 'turquoise',    hex: '#48b8b8' },
  silber:      { fr: 'argent',       hex: '#c8c8d0' },
  gold:        { fr: 'or',           hex: '#d4af37' },
  bronze:      { fr: 'bronze',       hex: '#a87844' },
  taupe:       { fr: 'taupe',        hex: '#8a7a6a' },
  khaki:       { fr: 'kaki',         hex: '#7a7548' },
  petrol:      { fr: 'pétrole',      hex: '#2a5a6a' },
  bunt:        { fr: 'multicolore',  hex: '#888888' },
  natur:       { fr: 'écru',         hex: '#e8dfc4' },
  // Ajouter au fur et à mesure si nouvelles couleurs détectées
};

export const CATEGORY_DE_TO_FR: Record<string, string> = {
  // Genre
  'Herren':         'Homme',
  'Damen':          'Femme',
  'Kinder':         'Enfant',
  'Baby':           'Bébé',

  // Macro-catégories
  'Bekleidung':     'Vêtements',
  'Schuhe':         'Chaussures',
  'Accessoires':    'Accessoires',
  'Taschen':        'Sacs',
  'Schmuck':        'Bijoux',
  'Wäsche':         'Lingerie',
  'Bademode':       'Maillots',

  // Sous-catégories vêtements
  'Anzüge':         'Costumes',
  'Hosen':          'Pantalons',
  'Shorts':         'Shorts',
  'Hemden':         'Chemises',
  'Blusen':         'Chemisiers',
  'Tuniken':        'Tuniques',
  'Pullover':       'Pulls',
  'Strick':         'Tricot',
  'Cardigans':      'Cardigans',
  'Strickjacken':   'Gilets',
  'Poloshirts':     'Polos',
  'T-Shirts':       'T-shirts',
  'Tops':           'Tops',
  'Sweatshirts':    'Sweats',
  'Hoodies':        'Hoodies',
  'Jacken':         'Vestes',
  'Mäntel':         'Manteaux',
  'Jeans':          'Jeans',
  'Röcke':          'Jupes',
  'Kleider':        'Robes',
  'Westen':         'Vestes sans manches',

  // Sous-catégories chaussures
  'Sneaker':        'Baskets',
  'Stiefel':        'Bottes',
  'Stiefeletten':   'Bottines',
  'Halbschuhe':     'Mocassins',
  'Pumps':          'Escarpins',
  'Sandalen':       'Sandales',
  'Hausschuhe':     'Chaussons',

  // Coupes / styles
  'Slim':           'Coupe slim',
  'Straight':       'Coupe droite',
  'Wideleg':        'Coupe large',
  'Marlenehose':    'Pantalon Marlene',
  'Chinos':         'Chinos',
  'Low Sneaker':    'Baskets basses',
  'High Sneaker':   'Baskets montantes',
  'Baukasten Anzüge': 'Costumes modulaires',
  'Freizeithemden': 'Chemises décontractées',
  'Businesshemden': 'Chemises business',
  'Kurzarm':        'Manches courtes',
  'Langarm':        'Manches longues',
  'Strickpolos':    'Polos en tricot',
  'Hosen & Shorts': 'Pantalons & shorts',
  'Pullover & Strick': 'Pulls & tricot',
  'Blusen & Tuniken': 'Chemisiers & tuniques',
  'Shorts & Bermudas': 'Shorts & bermudas',
};

/**
 * Traduit un chemin de catégorie DE→FR.
 * Ex: "Herren > Bekleidung > Anzüge > Baukasten Anzüge"
 *     → "Homme > Vêtements > Costumes > Costumes modulaires"
 */
export function translateCategoryPath(pathDe: string): string {
  return pathDe
    .split('>')
    .map(p => p.trim())
    .map(p => CATEGORY_DE_TO_FR[p] || p)
    .join(' > ');
}
```

---

## 2. Détection du genre depuis le category_path

Comme `Fashion:suitable_for` est vide à 97%, on déduit le genre depuis le chemin :

```typescript
// lib/products/detect-gender.ts

export function detectGenderFromPath(categoryPath: string): 'femme' | 'homme' | 'enfant' | 'mixte' {
  if (!categoryPath) return 'mixte';

  const start = categoryPath.split('>')[0]?.trim().toLowerCase();

  if (start === 'herren') return 'homme';
  if (start === 'damen') return 'femme';
  if (start === 'kinder' || start === 'baby') return 'enfant';

  return 'mixte';
}
```

---

## 3. Mapping vers structure WADA

```typescript
// lib/feeds/ko-mapper.ts

import { COLOR_DE_TO_FR, translateCategoryPath } from '@/lib/translations/de-fr';
import { detectGenderFromPath } from '@/lib/products/detect-gender';

interface KoCsvRow {
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
  merchant_product_category_path: string;
  'Fashion:suitable_for': string;
  'Fashion:category': string;
  'Fashion:size': string;
  'Fashion:material': string;
  'Fashion:pattern': string;
  size_stock_amount: string;
  size_stock_status: string;
  // ...
}

export function mapKoProduct(row: KoCsvRow): WadaProduct | null {
  // Skip si pas vendable
  if (row.is_for_sale !== '1') return null;
  if (row.in_stock !== '1') return null;

  // Image avec fallback (large_image vide à 100%)
  const imageUrl = row.large_image
                || row.alternate_image
                || row.aw_image_url
                || row.merchant_image_url
                || null;

  if (!imageUrl) return null;

  const alternateImages = [
    row.alternate_image,
    row.alternate_image_two,
    row.alternate_image_three,
    row.alternate_image_four,
  ].filter(Boolean);

  // Couleur DE → FR
  const colorLower = row.colour?.toLowerCase().trim();
  const colorMapping = COLOR_DE_TO_FR[colorLower];

  // Genre depuis category_path
  const gender = detectGenderFromPath(row.merchant_product_category_path);

  // Catégorie traduite
  const categoryPathFr = translateCategoryPath(row.merchant_product_category_path);
  const segments = categoryPathFr.split('>').map(s => s.trim());

  // category = 1er segment significatif après le genre
  // ex: "Homme > Vêtements > Pantalons > Chinos" → category="vetements", subcategory="pantalons"
  const category = mapToWadaCategory(segments);

  // Prix CHF
  const priceCHF = parseFloat(row.search_price || '0');
  const rrpPriceCHF = parseFloat(row.rrp_price || '0');

  // Conversion EUR optionnelle (selon visiteur)
  const priceEUR = priceCHF * (process.env.CHF_TO_EUR_RATE ? parseFloat(process.env.CHF_TO_EUR_RATE) : 0.95);

  return {
    source: 'ko_awin',
    source_product_id: row.aw_product_id,
    brand: row.brand_name,
    name: row.product_name,
    description: row.description,
    short_description: row.product_short_description,

    category: category.main,
    subcategory: category.sub,
    type: category.type,

    price_chf: priceCHF,
    price_eur: priceEUR,
    currency: 'CHF',
    original_price_chf: rrpPriceCHF > 0 ? rrpPriceCHF : null,

    image_url: imageUrl,
    alternate_images: alternateImages,
    affiliate_url: row.aw_deep_link,
    merchant_url: row.merchant_deep_link,

    color_family: colorMapping?.fr || row.colour || null,
    color_hex: colorMapping?.hex || null,
    raw_color: row.colour,

    gender,
    size: row['Fashion:size'] || null,
    material: row['Fashion:material'] || null,  // souvent vide
    pattern: row['Fashion:pattern'] || null,

    category_path_de: row.merchant_product_category_path,
    category_path_fr: categoryPathFr,

    is_active: true,
    is_color_enriched: !!colorMapping,
  };
}

function mapToWadaCategory(segments: string[]): { main: string; sub: string; type: string } {
  // segments[0] = Genre (Homme/Femme/Enfant)
  // segments[1] = Macro-catégorie (Vêtements/Chaussures/...)
  // segments[2] = Sous-catégorie (Pantalons/Pulls/...)
  // segments[3] = Type spécifique (Chinos/Slim/...)

  const macro = segments[1]?.toLowerCase();
  const sub = segments[2]?.toLowerCase();
  const type = segments[3]?.toLowerCase();

  let main = 'vetements';
  if (macro?.includes('chaussure')) main = 'chaussures';
  else if (macro?.includes('sac')) main = 'sacs';
  else if (macro?.includes('accessoire')) main = 'accessoires';
  else if (macro?.includes('bijou')) main = 'bijoux';

  return {
    main,
    sub: sub || '',
    type: type || '',
  };
}
```

---

## 4. Le script d'import principal

```typescript
// scripts/import-ko-feed.ts

import fetch from 'node-fetch';
import { gunzipSync } from 'zlib';
import { parse } from 'csv-parse/sync';
import { db } from '@/lib/db';
import { mapKoProduct } from '@/lib/feeds/ko-mapper';

const FEED_URL = process.env.KO_AWIN_FEED_URL;

async function importKoFeed() {
  if (!FEED_URL) throw new Error('KO_AWIN_FEED_URL non configurée');

  console.log('📥 Téléchargement du flux K&Ö (76 317 produits, ~30 Mo)...');
  const response = await fetch(FEED_URL);
  const buffer = await response.arrayBuffer();
  const csvText = gunzipSync(Buffer.from(buffer)).toString('utf-8');

  console.log('📋 Parsing CSV...');
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`✅ ${rows.length.toLocaleString()} lignes à traiter`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Traitement par batch pour ne pas saturer la DB
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async row => {
      try {
        const product = mapKoProduct(row);
        if (!product) {
          skipped++;
          return;
        }

        await db.product.upsert({
          where: { source_product_id: product.source_product_id },
          create: product,
          update: {
            price_chf: product.price_chf,
            price_eur: product.price_eur,
            is_active: product.is_active,
            last_updated_at: new Date(),
          },
        });

        imported++;
      } catch (err) {
        console.error(`  ❌ ${row.aw_product_id}: ${err.message}`);
        errors++;
      }
    }));

    if ((i + BATCH_SIZE) % 5000 === 0) {
      console.log(`  Progrès : ${(i + BATCH_SIZE).toLocaleString()}/${rows.length.toLocaleString()}`);
    }
  }

  console.log(`\n✅ Import K&Ö terminé :`);
  console.log(`   - Importés : ${imported.toLocaleString()}`);
  console.log(`   - Skipped  : ${skipped.toLocaleString()} (is_for_sale=0 ou pas d'image)`);
  console.log(`   - Erreurs  : ${errors.toLocaleString()}`);
}

importKoFeed().catch(console.error);
```

---

## 5. Indexation des palettes WADA (couleurs déjà OK)

K&Ö a 97% de couleurs renseignées (via le mapping DE→FR), donc on peut indexer
les palettes directement sans passer par GPT-4o Vision :

```typescript
// scripts/index-ko-palettes.ts

import { db } from '@/lib/db';
import { deltaE } from '@/lib/colors/delta-e';

async function indexKoPalettes() {
  const palettes = await db.palette.findMany();
  const products = await db.product.findMany({
    where: { source: 'ko_awin', is_active: true },
  });

  console.log(`🎨 Indexation palettes pour ${products.length.toLocaleString()} produits K&Ö...`);

  let indexed = 0;
  for (const product of products) {
    if (!product.color_hex) continue;

    const matchingPalettes = palettes
      .filter(palette =>
        palette.colors.some(c => deltaE(product.color_hex, c) < 35)
      )
      .map(p => p.id);

    await db.product.update({
      where: { id: product.id },
      data: { matching_palette_ids: matchingPalettes },
    });

    indexed++;
  }

  console.log(`✅ ${indexed.toLocaleString()} produits indexés`);
}
```

---

## 6. Filtrage des photos avec mannequin (règle WADA)

Lancer `scripts/clean-product-images.ts` avec `source='ko_awin'`.

⚠️ **Particularité K&Ö** : c'est un grand magasin, donc **beaucoup de produits ont des
photos avec mannequin**. On s'attend à ce que **40-50%** des produits soient désactivés
si on applique la règle stricte « no mannequin ».

**Recommandation** : assouplir la règle pour K&Ö en gardant les photos avec mannequin
*si c'est la seule disponible* :

```typescript
async function cleanKoImages() {
  const products = await db.product.findMany({ where: { source: 'ko_awin' }});

  for (const product of products) {
    const allImages = [product.image_url, ...product.alternate_images];

    // Trouver la meilleure image (sans mannequin si possible)
    const bestImage = await findBestPackshot(allImages);

    if (bestImage) {
      // Garder cette image
      await db.product.update({
        where: { id: product.id },
        data: { image_url: bestImage },
      });
    }
    // Si AUCUNE image n'est packshot, on garde le produit quand même
    // mais avec un flag is_lifestyle_only=true
  }
}
```

Coût : ~$15 (Vision sur cas ambigus).

---

## 7. Migration DB (en plus de celle de New Era)

Ajouter ces champs spécifiques à K&Ö s'ils n'existent pas :

```sql
-- Champs prix multi-devises
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_chf REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_eur REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price_chf REAL;

-- Catégorie multilingue
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_path_de TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_path_fr TEXT;

-- Fashion
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern TEXT;

-- Flag image
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_lifestyle_only BOOLEAN DEFAULT FALSE;

-- Index pour recherche par marque
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products (gender);
```

---

## 8. Script master

```typescript
// scripts/onboard-ko.ts

import { importKoFeed } from './import-ko-feed';
import { indexKoPalettes } from './index-ko-palettes';
import { cleanKoImages } from './clean-ko-images';

async function onboardKo() {
  console.log('🚀 Onboarding Kastner & Öhler → WADA\n');

  console.log('Étape 1/3 : Import du flux Awin');
  await importKoFeed();

  console.log('\nÉtape 2/3 : Indexation palettes Sanzō Wada');
  await indexKoPalettes();

  console.log('\nÉtape 3/3 : Filtrage photos mannequin (mode permissif)');
  await cleanKoImages();

  console.log('\n🎉 K&Ö onboardé sur WADA');
  console.log('   ~44 500 produits importés, ~30 000 affichables');
  console.log('   520 marques disponibles dont :');
  console.log('   Polo Ralph Lauren · Tommy Hilfiger · Boss · HUGO');
  console.log('   Marc O\'Polo · Drykorn · Levi\'s · Adidas Originals');
}

onboardKo().catch(console.error);
```

---

## 9. Cron quotidien

Ajouter K&Ö au sync existant :

```typescript
// scripts/sync-all-feeds.ts

const FEEDS = [
  { name: 'MUJI', env: 'MUJI_AWIN_FEED_URL' },
  { name: 'TBF', env: 'TBF_AWIN_FEED_URL' },
  { name: 'Shirt Co', env: 'SHIRT_CO_AWIN_FEED_URL' },
  { name: 'Suitable', env: 'SUITABLE_AWIN_FEED_URL' },
  { name: 'New Era', env: 'NEW_ERA_AWIN_FEED_URL' },
  { name: 'K&Ö', env: 'KO_AWIN_FEED_URL' },  // ← AJOUT
];
```

---

## 10. Checklist d'implémentation

```
□ Variable d'env KO_AWIN_FEED_URL dans Vercel
□ Migrations DB exécutées
□ lib/translations/de-fr.ts créé (tables couleurs + catégories)
□ lib/products/detect-gender.ts créé
□ lib/feeds/ko-mapper.ts créé
□ scripts/import-ko-feed.ts créé et testé sur 1000 lignes
□ scripts/index-ko-palettes.ts créé
□ scripts/clean-ko-images.ts créé (mode permissif)
□ scripts/onboard-ko.ts (master) créé
□ K&Ö ajouté à FEEDS dans sync-all-feeds.ts
□ Test sur 1000 produits (mode dry-run --limit=1000)
□ Si OK : lancer onboard-ko.ts en prod
□ Vérifier sur wada.style/marques :
  - 520 marques apparaissent
  - Polo Ralph Lauren a ~2800 produits
  - Tommy Hilfiger a ~2900 produits
□ Vérifier filtre Palette : 
  - schwarz/dunkelblau matchent "Sumi-e" et "Pluie de Tokyo"
  - beige/creme matchent "Rosée du matin" et "Studio danois"
□ Vérifier filtre Genre : ~38000 répartis Femme/Homme
□ Vérifier prix : afficher CHF par défaut + conversion EUR si visiteur FR
```

---

## 11. Coûts d'onboarding K&Ö

| Item | Coût |
|---|---|
| Import + parsing CSV (44 500 produits) | 0€ |
| Mapping DE→FR (tables hardcodées) | 0€ |
| Indexation palettes (calcul local) | 0€ |
| Filtrage photos mannequin (~44 500 produits) | **~$15** (Vision GPT-4o-mini) |
| Enrichissement matière (optionnel) | **~$10** |
| **TOTAL one-shot** | **~$25** |
| Job cron quotidien | ~$0,05/jour |

---

## 12. Volume attendu sur WADA après K&Ö

| Statut | Estimation |
|---|---|
| Importés (is_for_sale=1) | ~44 500 |
| Avec image utilisable | ~39 000 (88%) |
| Couleur renseignée | ~38 000 (97%) |
| Matching au moins 1 palette WADA | ~30 000 |
| **AFFICHABLES** | **~30 000 produits** |

**Top marques disponibles après K&Ö** :
- Polo Ralph Lauren (~2 800)
- Tommy Hilfiger (~2 900)
- Boss + HUGO (~3 800 cumulés)
- BRAX (~3 600)
- Marc O'Polo (~2 300)
- MAC, Joop, Marc Cain (~2 000 chacun)
- Drykorn, Levi's, Replay, Adidas Originals
- + 500 autres marques européennes

---

## 13. Bonus — Soldes / Promotions

K&Ö ne met pas les soldes via `web_offer` (0 produits flaggués). Mais le champ
`rrp_price` est renseigné — quand `rrp_price > search_price`, le produit est en
promotion. Le codeur peut afficher un badge « -X% » automatiquement :

```typescript
const discountPercent = product.rrp_price && product.rrp_price > product.price_chf
  ? Math.round((product.rrp_price - product.price_chf) / product.rrp_price * 100)
  : 0;

if (discountPercent > 0) {
  // Afficher badge "-X%" sur la card
}
```

---

## 14. Points d'attention spécifiques

1. **Les tailles `EG` (taille unique)** sont en allemand — `EG` = "Einheitsgröße" = "Taille unique".
   Le filtre Taille doit traduire `EG` → `Taille unique`.

2. **Les marques avec caractères spéciaux** : `LEVI'S®`, `ROY ROBSON`, `MOS MOSH`, `gottseidank`.
   Bien encoder l'UTF-8 dans la base.

3. **Devise CHF** : pour les visiteurs hors Suisse, afficher en EUR avec mention discrète
   *« Prix indicatif converti depuis CHF »* en italique. Le prix réel reste celui chargé par K&Ö.

4. **Géo-targeting** : K&Ö livre principalement en Suisse/Allemagne/Autriche. Les visiteurs
   français ou belges devront accepter les frais de livraison internationaux. À mentionner.

---

## En une phrase

> **K&Ö nous donne 30 000 produits affichables couvrant 520 marques européennes premium
> pour seulement $25 d'onboarding — c'est le plus gros levier catalogue de WADA.**

À implémenter en priorité après les bugs critiques actuels. Aucun autre flux Awin disponible
ne donne ce volume × cette qualité de marques en une seule opération.
