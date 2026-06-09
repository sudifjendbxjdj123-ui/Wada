# WADA — Intégration The Shirt Company depuis le flux Awin

Brief codeur pour ajouter **722 chemises premium** au catalogue WADA.

**Durée dev estimée** : 3-4h.
**Coût** : ~$2 one-shot.
**Volume final attendu** : ~700 chemises affichables.

---

## Contexte du flux

J'ai analysé le flux Awin de The Shirt Company. Voici le rapport :

| Métrique | Valeur |
|---|---|
| Total produits | **722 chemises** |
| En stock | 100% ✓ |
| Vendables | 100% ✓ |
| **Devise** | **GBP** (Livres Sterling) |
| Prix moyen | £98,73 |
| Prix médian | £100 |
| Prix range | £5 – £150 |
| Avec `alternate_image` | 100% ✓ |
| Avec `large_image` | 0% (même bug Awin) |

**Particularité majeure** : The Shirt Company n'a pratiquement RIEN renseigné dans les
colonnes standards. Mais **tout est dans le `product_name`** :

```
"Abigail Hourglass Fit Wrap Blouse In White Cotton Sateen"
 └─ Nom    └─ Coupe         └─ Style       └─ Couleur └─ Matière
```

Il faut **parser le nom** pour extraire les attributs WADA.

---

## L'URL du flux

```
TSC_AWIN_FEED_URL=[à transmettre par DM uniquement]
```

⚠️ Sécurité absolue. JAMAIS dans le code source.

---

## Les 6 colonnes à dériver depuis `product_name`

| Attribut WADA | Comment l'extraire du nom |
|---|---|
| **Couleur** | Mot après "In" : "In **White** Cotton" → blanc |
| **Matière** | Mots après la couleur : "In White **Cotton Sateen**" → coton sateen |
| **Coupe** | Mots avant "Fit" : "**Hourglass Fit**" |
| **Style** | Mots entre coupe et "In" : "**Wrap Blouse**" |
| **Motif** | Mots clés : "**Polka Dot**", "Stripe", "Floral" |
| **Genre** | Hardcoded : **Femme** (catalogue 100% femme) |

---

## 1. Parser de noms — Regex + fallback IA

```typescript
// lib/feeds/tsc-name-parser.ts

interface ParsedShirtName {
  base_name: string;        // "Abigail"
  fit: string | null;        // "Hourglass Fit"
  style: string;             // "Wrap Blouse"
  color_family: string;      // "blanc"
  color_hex: string;         // "#ffffff"
  material: string;          // "Coton sateen"
  pattern: string;           // "uni" ou "à pois", "rayé", etc.
}

const COLOR_KEYWORDS: Record<string, { fr: string; hex: string }> = {
  'white':       { fr: 'blanc',         hex: '#ffffff' },
  'black':       { fr: 'noir',          hex: '#1a1a1a' },
  'navy':        { fr: 'bleu marine',   hex: '#1a2849' },
  'blue':        { fr: 'bleu',          hex: '#3a5fa8' },
  'tan':         { fr: 'camel',         hex: '#b89570' },
  'cream':       { fr: 'crème',         hex: '#f0e8d4' },
  'beige':       { fr: 'beige',         hex: '#e0d4b8' },
  'pink':        { fr: 'rose',          hex: '#f0b8c4' },
  'red':         { fr: 'rouge',         hex: '#c83030' },
  'green':       { fr: 'vert',          hex: '#4a8048' },
  'sage':        { fr: 'vert sauge',    hex: '#a4b896' },
  'olive':       { fr: 'olive',         hex: '#6b6840' },
  'grey':        { fr: 'gris',          hex: '#888880' },
  'silver':      { fr: 'argent',        hex: '#c8c8d0' },
  'yellow':      { fr: 'jaune',         hex: '#e8c848' },
  'mustard':     { fr: 'moutarde',      hex: '#c89830' },
  'burgundy':    { fr: 'bordeaux',      hex: '#6e2030' },
  'wine':        { fr: 'bordeaux',      hex: '#6e2030' },
  'taupe':       { fr: 'taupe',         hex: '#8a7a6a' },
  'khaki':       { fr: 'kaki',          hex: '#7a7548' },
  'chocolate':   { fr: 'chocolat',      hex: '#5a3a2a' },
  'brown':       { fr: 'marron',        hex: '#6e4d2e' },
  'lavender':    { fr: 'lavande',       hex: '#a8a0d4' },
  'peach':       { fr: 'pêche',         hex: '#f8c8a4' },
  'coral':       { fr: 'corail',        hex: '#e88878' },
  'mint':        { fr: 'menthe',        hex: '#a8d8c4' },
  'turquoise':   { fr: 'turquoise',     hex: '#48b8b8' },
  'gold':        { fr: 'or',            hex: '#d4af37' },
  'rose':        { fr: 'rose',          hex: '#f0b8c4' },
  'ivory':       { fr: 'ivoire',        hex: '#f8f4e8' },
  'ecru':        { fr: 'écru',          hex: '#e8dfc4' },
  'mocha':       { fr: 'moka',          hex: '#8a6a4a' },
  'sand':        { fr: 'sable',         hex: '#d4c498' },
  'denim':       { fr: 'denim',         hex: '#4a6890' },
};

const PATTERN_KEYWORDS: Record<string, string> = {
  'polka dot':   'à pois',
  'stripe':      'rayé',
  'striped':     'rayé',
  'floral':      'fleuri',
  'plaid':       'à carreaux',
  'check':       'à carreaux',
  'gingham':     'vichy',
  'paisley':     'cachemire',
  'leopard':     'léopard',
  'animal':      'animal',
  'geometric':   'géométrique',
  'print':       'imprimé',
};

const MATERIAL_KEYWORDS: Record<string, string> = {
  'cotton':       'coton',
  'silk':         'soie',
  'linen':        'lin',
  'wool':         'laine',
  'cashmere':     'cachemire',
  'sateen':       'satin coton',
  'poplin':       'popeline',
  'organza':      'organza',
  'organdie':     'organdi',
  'chiffon':      'mousseline',
  'twill':        'twill',
  'jersey':       'jersey',
  'denim':        'denim',
  'velvet':       'velours',
  'crepe':        'crêpe',
  'chambray':     'chambray',
  'drape':        'drapé',
  'flannel':      'flanelle',
};

const FIT_KEYWORDS = [
  'Hourglass Fit',
  'Tailored Fit',
  'Regular Fit',
  'Relaxed Fit',
  'Slim Fit',
  'Curve Hourglass Fit',
  'Curve Relaxed Fit',
  'Curve Tailored Fit',
  'Contour Fit',
  'Oversized Fit',
];

const STYLE_KEYWORDS = [
  'Wrap Blouse', 'Wrap Shirt', 'Wrap Dress',
  'Tuxedo Shirt',
  'V-Neck Shirt', 'V-Neck Blouse',
  'Trench Dress', 'Trench Coat',
  'Ruffle Front Blouse', 'Ruffle Blouse',
  'Button Down', 'Button-Down',
  'Tunic',
  'Camisole',
  'Polo Shirt',
  'Pleated Shirt',
  'Oxford Shirt',
  'Western Shirt',
];

export function parseShirtName(name: string): ParsedShirtName {
  const result: ParsedShirtName = {
    base_name: '',
    fit: null,
    style: 'Chemise',
    color_family: 'multicolore',
    color_hex: '#888888',
    material: '',
    pattern: 'uni',
  };

  const lower = name.toLowerCase();

  // 1. BASE NAME (premier mot, le prénom)
  result.base_name = name.split(' ')[0];

  // 2. FIT (coupe) — chercher le mot avant "Fit"
  for (const fit of FIT_KEYWORDS) {
    if (name.includes(fit)) {
      result.fit = fit;
      break;
    }
  }

  // 3. STYLE — chercher mot-clé style
  for (const style of STYLE_KEYWORDS) {
    if (name.includes(style)) {
      result.style = style;
      break;
    }
  }

  // 4. COLOR — chercher mot après "In " (typique TSC)
  // ex: "Wrap Blouse In White Cotton" → white
  const inMatch = name.match(/\bIn\s+([A-Z][a-z]+)/);
  if (inMatch) {
    const colorWord = inMatch[1].toLowerCase();
    if (COLOR_KEYWORDS[colorWord]) {
      result.color_family = COLOR_KEYWORDS[colorWord].fr;
      result.color_hex = COLOR_KEYWORDS[colorWord].hex;
    }
  } else {
    // Fallback : scanner tous les mots pour trouver une couleur connue
    for (const [eng, fr] of Object.entries(COLOR_KEYWORDS)) {
      if (lower.includes(eng)) {
        result.color_family = fr.fr;
        result.color_hex = fr.hex;
        break;
      }
    }
  }

  // 5. PATTERN — détecter les motifs
  for (const [eng, fr] of Object.entries(PATTERN_KEYWORDS)) {
    if (lower.includes(eng)) {
      result.pattern = fr;
      break;
    }
  }

  // 6. MATERIAL — extraire après la couleur ou cherche mots-clés
  const materials: string[] = [];
  for (const [eng, fr] of Object.entries(MATERIAL_KEYWORDS)) {
    if (lower.includes(eng)) {
      materials.push(fr);
    }
  }
  result.material = materials.join(' ') || 'Coton';  // par défaut coton (~80% du catalogue)

  return result;
}
```

### Tests unitaires

```typescript
// tests/tsc-name-parser.test.ts

describe('parseShirtName', () => {
  test('Abigail Hourglass Fit Wrap Blouse In White Cotton Sateen', () => {
    const r = parseShirtName('Abigail Hourglass Fit Wrap Blouse In White Cotton Sateen');
    expect(r.base_name).toBe('Abigail');
    expect(r.fit).toBe('Hourglass Fit');
    expect(r.style).toBe('Wrap Blouse');
    expect(r.color_family).toBe('blanc');
    expect(r.material).toContain('coton');
    expect(r.material).toContain('satin coton');
    expect(r.pattern).toBe('uni');
  });

  test('Morgane Regular Fit Trench Dress In Tan Polka Dot Cotton Chino', () => {
    const r = parseShirtName('Morgane Regular Fit Trench Dress In Tan Polka Dot Cotton Chino');
    expect(r.fit).toBe('Regular Fit');
    expect(r.style).toBe('Trench Dress');
    expect(r.color_family).toBe('camel');
    expect(r.pattern).toBe('à pois');
    expect(r.material).toContain('coton');
  });

  test('Victoria Curve Relaxed Fit Ruffle Front Blouse In Black Drape', () => {
    const r = parseShirtName('Victoria Curve Relaxed Fit Ruffle Front Blouse In Black Drape');
    expect(r.fit).toBe('Curve Relaxed Fit');
    expect(r.style).toBe('Ruffle Front Blouse');
    expect(r.color_family).toBe('noir');
    expect(r.material).toContain('drapé');
  });
});
```

### Fallback GPT-4o-mini pour les cas ambigus

```typescript
// lib/feeds/tsc-ai-enrich.ts

async function enrichAmbiguousProduct(productName: string, description: string): Promise<ParsedShirtName> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Parse this shirt product into structured fields.
Product name: "${productName}"
Description: "${description?.slice(0, 300) || 'N/A'}"

Return JSON:
{
  "fit": "<Hourglass Fit | Regular Fit | Tailored Fit | Relaxed Fit | Slim Fit | etc>",
  "style": "<Wrap Blouse | Shirt | Tunic | etc>",
  "color_family": "<français : noir, blanc, beige, bleu marine, etc>",
  "color_hex": "<hex>",
  "material": "<coton, soie, lin, etc>",
  "pattern": "<uni | à pois | rayé | fleuri | imprimé | à carreaux>"
}`
    }],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });

  return JSON.parse(response.choices[0].message.content!);
}
```

**Coût** : 722 × $0,0001 = **$0,07 si on enrichit tous les produits via GPT-4o**.
Mais avec le parser regex, **~90% sont déjà traités** → seuls ~70 produits ambigus
nécessitent GPT-4o.

---

## 2. Le script d'import

```typescript
// scripts/import-tsc-feed.ts

import fetch from 'node-fetch';
import { gunzipSync } from 'zlib';
import { parse } from 'csv-parse/sync';
import { db } from '@/lib/db';
import { parseShirtName } from '@/lib/feeds/tsc-name-parser';

const FEED_URL = process.env.TSC_AWIN_FEED_URL;
const GBP_TO_EUR = parseFloat(process.env.GBP_TO_EUR_RATE || '1.17');

async function importTscFeed() {
  if (!FEED_URL) throw new Error('TSC_AWIN_FEED_URL non configurée');

  console.log('📥 Téléchargement The Shirt Company (722 produits)...');
  const response = await fetch(FEED_URL);
  const buffer = await response.arrayBuffer();
  const csvText = gunzipSync(Buffer.from(buffer)).toString('utf-8');

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });

  console.log(`✅ ${rows.length} chemises à traiter`);

  let imported = 0;
  let aiEnriched = 0;

  for (const row of rows) {
    if (row.is_for_sale !== '1') continue;
    if (row.in_stock !== '1') continue;

    // Image cascade
    const imageUrl = row.large_image
                  || row.alternate_image
                  || row.aw_image_url
                  || row.merchant_image_url
                  || null;
    if (!imageUrl) continue;

    const alternateImages = [
      row.alternate_image,
      row.alternate_image_two,
      row.alternate_image_three,
      row.alternate_image_four,
    ].filter(Boolean);

    // Parse du nom (sans IA)
    let parsed = parseShirtName(row.product_name);

    // Si la couleur n'a pas été détectée, fallback GPT-4o-mini
    if (parsed.color_family === 'multicolore' || !parsed.style) {
      try {
        const aiResult = await enrichAmbiguousProduct(row.product_name, row.description);
        parsed = { ...parsed, ...aiResult };
        aiEnriched++;
      } catch (err) {
        console.error(`AI fail for ${row.aw_product_id}: ${err.message}`);
      }
    }

    // Prix GBP → EUR
    const priceGBP = parseFloat(row.search_price || '0');
    const priceEUR = priceGBP * GBP_TO_EUR;
    const rrpGBP = parseFloat(row.rrp_price || '0');

    // Catégorie : tout est chemise/blouse femme
    let category = 'vetements';
    let subcategory = 'chemisiers';
    if (parsed.style?.toLowerCase().includes('dress')) {
      subcategory = 'robes';
    } else if (parsed.style?.toLowerCase().includes('coat') ||
               parsed.style?.toLowerCase().includes('trench')) {
      subcategory = 'manteaux';
    } else if (parsed.style?.toLowerCase().includes('tunic')) {
      subcategory = 'tuniques';
    }

    await db.product.upsert({
      where: { source_product_id: row.aw_product_id },
      create: {
        source: 'tsc_awin',
        source_product_id: row.aw_product_id,
        brand: 'The Shirt Company',
        name: row.product_name,
        description: row.description,
        category,
        subcategory,
        type: parsed.style,
        price_gbp: priceGBP,
        price_eur: priceEUR,
        original_price_gbp: rrpGBP > 0 ? rrpGBP : null,
        currency: 'GBP',
        image_url: imageUrl,
        alternate_images: alternateImages,
        affiliate_url: row.aw_deep_link,
        merchant_url: row.merchant_deep_link,
        color_family: parsed.color_family,
        color_hex: parsed.color_hex,
        gender: 'femme',  // 100% du catalogue est femme
        material: parsed.material,
        pattern: parsed.pattern,
        fit: parsed.fit,
        is_active: true,
        is_color_enriched: true,
      },
      update: {
        price_gbp: priceGBP,
        price_eur: priceEUR,
        is_active: true,
        last_updated_at: new Date(),
      },
    });

    imported++;
    if (imported % 100 === 0) console.log(`  ${imported}/${rows.length}`);
  }

  console.log(`\n✅ TSC import terminé :`);
  console.log(`   - Importés : ${imported}`);
  console.log(`   - Enrichis IA : ${aiEnriched}`);
}

importTscFeed().catch(console.error);
```

---

## 3. Indexation palettes

```typescript
// scripts/index-tsc-palettes.ts

import { db } from '@/lib/db';
import { deltaE } from '@/lib/colors/delta-e';

async function indexTscPalettes() {
  const palettes = await db.palette.findMany();
  const products = await db.product.findMany({
    where: { source: 'tsc_awin', is_active: true },
  });

  for (const product of products) {
    if (!product.color_hex) continue;

    const matchingPalettes = palettes
      .filter(p => p.colors.some(c => deltaE(product.color_hex, c) < 35))
      .map(p => p.id);

    await db.product.update({
      where: { id: product.id },
      data: { matching_palette_ids: matchingPalettes },
    });
  }
}
```

---

## 4. Migration DB

```sql
-- Prix multi-devises pour TSC
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_gbp REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price_gbp REAL;

-- Fit (coupe) spécifique aux chemises
ALTER TABLE products ADD COLUMN IF NOT EXISTS fit TEXT;
```

---

## 5. Variable d'environnement Vercel

```bash
TSC_AWIN_FEED_URL=[URL transmise par DM uniquement]
GBP_TO_EUR_RATE=1.17  # à mettre à jour mensuellement
```

---

## 6. Script master

```typescript
// scripts/onboard-tsc.ts

import { importTscFeed } from './import-tsc-feed';
import { indexTscPalettes } from './index-tsc-palettes';

async function onboardTsc() {
  console.log('🚀 Onboarding The Shirt Company → WADA\n');

  console.log('Étape 1/2 : Import + parsing des noms');
  await importTscFeed();

  console.log('\nÉtape 2/2 : Indexation palettes Sanzō Wada');
  await indexTscPalettes();

  console.log('\n🎉 The Shirt Company onboardée');
  console.log('   ~700 chemises premium disponibles');
}

onboardTsc().catch(console.error);
```

---

## 7. Ajout au cron quotidien

```typescript
// scripts/sync-all-feeds.ts
const FEEDS = [
  { name: 'MUJI', env: 'MUJI_AWIN_FEED_URL' },
  { name: 'TBF', env: 'TBF_AWIN_FEED_URL' },
  { name: 'Shirt Co', env: 'TSC_AWIN_FEED_URL' },  // ← TSC ici
  { name: 'Suitable', env: 'SUITABLE_AWIN_FEED_URL' },
  { name: 'New Era', env: 'NEW_ERA_AWIN_FEED_URL' },
  { name: 'K&Ö', env: 'KO_AWIN_FEED_URL' },
];
```

---

## 8. Checklist

```
□ Variable d'env TSC_AWIN_FEED_URL dans Vercel
□ Variable d'env GBP_TO_EUR_RATE=1.17
□ Migrations DB exécutées (price_gbp, fit)
□ lib/feeds/tsc-name-parser.ts créé avec tests unitaires
□ Tests passent : "Abigail Hourglass Fit Wrap Blouse In White Cotton Sateen" → blanc, coton, etc.
□ scripts/import-tsc-feed.ts créé
□ scripts/index-tsc-palettes.ts créé
□ scripts/onboard-tsc.ts (master)
□ TSC ajouté à FEEDS dans sync-all-feeds.ts
□ Test sur 50 produits d'abord
□ Si OK : lancer onboard-tsc.ts en prod
□ Vérifier sur wada.style/marques/the-shirt-company : ~700 chemises
□ Vérifier filtre Palette :
  - Chemises blanches matchent "Rosée du matin"
  - Chemises noires matchent "Sumi-e"
  - Chemises navy matchent "Pluie de Tokyo"
□ Vérifier filtre Genre : Femme (100%)
□ Vérifier filtre Catégorie : majoritairement chemisiers
```

---

## 9. Coûts

| Item | Coût |
|---|---|
| Import + parsing regex | 0€ |
| Enrichissement IA (cas ambigus, ~70 produits) | **~$0,01** |
| Indexation palettes | 0€ |
| **TOTAL** | **~$0,01** (quasi gratuit) |

---

## 10. Volume attendu après onboarding

| Métrique | Valeur |
|---|---|
| Chemises importées | ~720 |
| Avec image valide | ~720 (100%) |
| Couleur détectée par parsing | ~650 (90%) |
| Couleur enrichie par IA | ~70 (10%) |
| Matching palette WADA | ~650 (90%) |
| **Affichables sur WADA** | **~700 chemises premium** |

**Profil du catalogue** :
- 100% femme
- Prix moyen ~£99 (~€115)
- Style : chemisiers tailoring premium, blouses, quelques robes
- Couleurs majoritairement neutres (blanc, noir, beige, navy)
- Idéal pour palettes : Rosée du matin, Studio danois, Pluie de Tokyo, Sumi-e

---

## 11. Pourquoi TSC est précieuse

C'est ta seule marque **niche femme premium chemises** :

- **Net-a-Porter** n'a que des marques très luxe → pas accessible
- **MUJI** = basiques unisexes → pas féminin chic
- **K&Ö** = multi-marques mais ailleurs (Suisse)
- **TBF** = principalement homme luxe

**The Shirt Company te donne le seul créneau femme chic-élégant accessible** sur ton catalogue.
C'est un **complément stratégique** essentiel pour les palettes douces (Rosée du matin,
Studio danois, Brume du matin).

---

## En une phrase

> **The Shirt Company nous donne 700 chemises premium femme parfaitement adaptées aux palettes
> douces de Sanzō Wada, via un parsing intelligent du nom de produit pour ~$0,01.**

À implémenter en parallèle de New Era (chantier 8) — c'est un quick win.
