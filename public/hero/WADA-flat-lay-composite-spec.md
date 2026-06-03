# WADA — Flat lay par composite des vraies images produits

Spec technique pour générer un flat lay éditorial à partir des **vraies photos produits sans
mannequin** (déjà filtrées par le codeur). Approche choisie : background removal + composition sur
fond crème.

---

## Architecture en 5 étapes

```
1. Récupérer les 5 images produits de la tenue (sans mannequin, déjà filtrées)
2. Pour chaque image : enlever le fond (background removal API)
3. Composer les 5 pièces détourées sur un fond crème texturé (1:1 ratio)
4. Mirror sur Vercel Blob avec clé = hash de l'outfit
5. Servir l'URL Blob à l'affichage
```

---

## 1. Outils — background removal

### Option A — Photoroom API (recommandée)

- **Prix** : $0,02 par image (gratuit jusqu'à 100/mois sur le tier free)
- **Qualité** : excellente sur les vêtements (entraîné spécifiquement mode)
- **Vitesse** : ~1 seconde par image
- **Site** : photoroom.com/api

Pour une tenue de 5 pièces : **$0,10 max** (souvent moins si certaines images sont déjà sur fond
blanc neutre).

### Option B — remove.bg API

- **Prix** : $0,01 par image après 50 gratuites/mois
- **Qualité** : très bonne en général
- **Vitesse** : ~1-2 secondes par image

### Option C — Self-hosted `rembg` (gratuit)

- **Prix** : 0€ (open source)
- **Qualité** : bonne, mais moins propre sur les détails fins
- **Vitesse** : 2-5 secondes par image
- À déployer sur un service comme Modal, Replicate, ou Vercel Functions

**Recommandation** : commencer avec **Photoroom** (qualité fashion supérieure) puis basculer sur
`rembg` self-hosted si le volume explose.

---

## 2. Pipeline complet (code TypeScript)

```typescript
// lib/flatlay/composite.ts
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { createHash } from 'crypto';

interface OutfitPiece {
  slot: 'haut' | 'bas' | 'veste' | 'chaussures' | 'accent';
  product_name: string;
  image_url: string;  // image produit sans mannequin déjà filtrée
}

export async function generateFlatLayComposite(
  outfit_id: string,
  pieces: OutfitPiece[]
): Promise<string> {
  // 1. Cache check
  const cacheKey = `flatlay-${outfit_id}.jpg`;
  const existing = await getFromBlobIfExists(cacheKey);
  if (existing) return existing.url;

  // 2. Détourer les 5 pièces en parallèle
  const cutouts = await Promise.all(
    pieces.map(p => removeBackground(p.image_url))
  );

  // 3. Composer sur fond crème
  const composite = await composeFlatLay(cutouts, pieces);

  // 4. Mirror sur Vercel Blob
  const { url } = await put(cacheKey, composite, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
  });

  // 5. Stocker en base
  await db.outfit.update({
    where: { id: outfit_id },
    data: { flat_lay_url: url },
  });

  return url;
}

// --- Background removal via Photoroom ---
async function removeBackground(imageUrl: string): Promise<Buffer> {
  const formData = new FormData();
  formData.append('image_url', imageUrl);
  formData.append('format', 'png');  // PNG pour transparence

  const response = await fetch('https://image-api.photoroom.com/v2/edit', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.PHOTOROOM_API_KEY!,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Photoroom failed: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
```

---

## 3. La composition (layout flat lay)

C'est le point critique. Un flat lay éditorial bien fait suit une logique précise.

### Layout en grille 1200×1200 (carré)

```
┌────────────────────────────────────────────┐
│                                             │
│         ┌─────────────────────┐             │
│         │                     │             │
│         │       VESTE         │             │
│         │     (top center)    │             │
│         │                     │             │
│         └─────────────────────┘             │
│                                             │
│   ┌─────────┐         ┌─────────┐          │
│   │  HAUT   │         │  ACCENT │          │
│   │  (left) │         │ (right) │          │
│   └─────────┘         └─────────┘          │
│                                             │
│         ┌─────────────────────┐             │
│         │                     │             │
│         │        BAS          │             │
│         │   (bottom center)   │             │
│         └─────────────────────┘             │
│                                             │
│      ┌─────────────────────────┐            │
│      │      CHAUSSURES         │            │
│      │  (bottom row, smaller)  │            │
│      └─────────────────────────┘            │
│                                             │
└────────────────────────────────────────────┘
```

### Positions précises (canvas 1200×1200)

```typescript
const POSITIONS = {
  veste: {       x: 250, y: 80,  w: 700, h: 500 },  // grande pièce en haut
  haut: {        x: 80,  y: 540, w: 380, h: 380 },  // gauche
  accent: {      x: 740, y: 540, w: 380, h: 380 },  // droite (petit objet centré)
  bas: {         x: 350, y: 600, w: 500, h: 400 },  // grand au milieu-bas
  chaussures: {  x: 350, y: 950, w: 500, h: 200 },  // ligne du bas, paire côte à côte
};

// Ajustements selon le type :
// - Pour un accessoire petit (ceinture, montre, foulard) : taille réduite
// - Pour une robe (veste à toute la longueur) : étendre veste position en hauteur
```

### Code de composition avec Sharp

```typescript
async function composeFlatLay(
  cutouts: Buffer[],
  pieces: OutfitPiece[]
): Promise<Buffer> {
  // 1. Créer le canvas 1200×1200 avec fond crème texturé
  const background = await sharp({
    create: {
      width: 1200,
      height: 1200,
      channels: 3,
      background: { r: 244, g: 238, b: 228 },  // crème WADA #f4eee4
    },
  })
  // Ajouter une légère texture lin
  .composite([{
    input: Buffer.from(LIN_TEXTURE_BASE64, 'base64'),
    blend: 'multiply',
    opacity: 0.05,
  }])
  .png()
  .toBuffer();

  // 2. Préparer les overlays
  const overlays = pieces.map((piece, i) => {
    const pos = POSITIONS[piece.slot];
    return {
      input: cutouts[i],
      top: pos.y,
      left: pos.x,
      // Redimensionner et garder l'aspect ratio
    };
  });

  // 3. Pour chaque pièce, redimensionner avant composite
  const resized = await Promise.all(
    pieces.map(async (piece, i) => {
      const pos = POSITIONS[piece.slot];
      const resized = await sharp(cutouts[i])
        .resize(pos.w, pos.h, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();

      return {
        input: resized,
        top: pos.y,
        left: pos.x,
      };
    })
  );

  // 4. Composer tout
  const final = await sharp(background)
    .composite(resized)
    // Ajouter ombre douce globale ?
    .jpeg({ quality: 88 })
    .toBuffer();

  return final;
}
```

---

## 4. Bonus visuel — ombres portées

Pour un rendu plus réaliste, ajouter une **ombre portée** sous chaque pièce :

```typescript
async function addShadow(pieceBuffer: Buffer): Promise<Buffer> {
  // 1. Créer un masque flou de la silhouette
  const shadow = await sharp(pieceBuffer)
    .extractChannel('alpha')        // récupérer l'alpha
    .negate()                       // inverser
    .blur(15)                       // flouter
    .modulate({ brightness: 0.3 })  // assombrir
    .png()
    .toBuffer();

  // 2. Composer ombre + pièce
  return sharp(pieceBuffer)
    .composite([
      { input: shadow, blend: 'multiply', top: 8, left: 4 },  // décalage léger
    ])
    .png()
    .toBuffer();
}
```

Effet : chaque pièce semble posée sur le fond avec une légère ombre = réalisme accru.

---

## 5. Coûts détaillés

### Background removal

| Service | Prix/image | 1 outfit (5 pièces) | 1000 outfits/mois |
|---|---|---|---|
| Photoroom | $0,02 | $0,10 | $100 |
| remove.bg | $0,01 | $0,05 | $50 |
| rembg self-hosted | $0 + compute | quasi 0 | quasi 0 |

### Compute Vercel (composition Sharp)

- Négligeable (Sharp est ultra-rapide en Node.js)
- ~50ms par image
- Compris dans Vercel Pro

### Vercel Blob (stockage)

- ~50 KB par image JPG 1200×1200 qualité 88
- 1000 images = 50 MB = ~$0,10/mois
- Négligeable

### Total réaliste

| Volume | Photoroom | Total mois |
|---|---|---|
| 500 outfits/mois | $50 | $50-60 |
| 5000 outfits/mois | $500 | $510 |
| Avec rembg self-host | ~$0 | ~$20 (compute Modal) |

**Conseil** : démarre avec **Photoroom** pour la qualité. Si le volume monte au-delà de
5000 outfits/mois, bascule sur **rembg self-hosted** sur Modal (~$20/mois fixe pour tout volume).

---

## 6. Cache intelligent

Pour éviter de re-générer chaque fois :

```typescript
// Clé de cache basée sur les IDs des produits
function getCacheKey(pieces: OutfitPiece[]): string {
  const ids = pieces.map(p => p.product_id).sort().join('-');
  const hash = createHash('md5').update(ids).digest('hex').slice(0, 8);
  return `flatlay-${hash}.jpg`;
}

// Si deux tenues différentes utilisent les mêmes 5 produits, on réutilise l'image
```

**Bénéfice** : le composer peut proposer la même tenue à plusieurs clients sans regénérer.

---

## 7. Filtrage des images source (déjà fait par le codeur)

Tu as bien fait de demander au codeur de **filtrer les images sans mannequin**. Voici les
critères qu'il a probablement appliqués :

### Détection automatique « image sans mannequin »

```typescript
// Heuristique simple : si l'image a 90%+ de pixels presque-blancs sur les bords,
// c'est probablement un fond blanc / packshot (pas un mannequin)

async function isPackshot(imageUrl: string): Promise<boolean> {
  const img = await sharp(await fetchBuffer(imageUrl))
    .resize(100, 100)
    .raw()
    .toBuffer();

  // Échantillonner les pixels des coins
  let whiteishPixels = 0;
  const samples = sampleCorners(img, 100);
  for (const [r, g, b] of samples) {
    if (r > 235 && g > 235 && b > 235) whiteishPixels++;
  }

  return whiteishPixels / samples.length > 0.9;
}
```

### Avantage du filtrage

Les **packshots sur fond blanc** sont les plus faciles à détourer (background removal réussit
quasi à 100%). Les images avec mannequin ou en contexte donnent des résultats imprévisibles.

Si le codeur a déjà mis ce filtre, **le travail est mâché**. Tu auras des composites propres
quasiment à coup sûr.

---

## 8. Prompt à donner à Claude Code demain

```
Implémente la fonction generateFlatLayComposite() dans WADA :

1. Crée lib/flatlay/composite.ts avec une fonction qui prend (outfit_id, pieces[]) en input.

2. Pour chaque pièce, appelle l'API Photoroom (https://image-api.photoroom.com/v2/edit) pour
   enlever le fond. Utilise PHOTOROOM_API_KEY (à ajouter dans Vercel Env Vars).

3. Compose les 5 cutouts sur un canvas 1200×1200 fond crème (#f4eee4) avec Sharp.

   Positions (slots → coords) :
   - veste : x=250 y=80 w=700 h=500
   - haut : x=80 y=540 w=380 h=380
   - accent : x=740 y=540 w=380 h=380
   - bas : x=350 y=600 w=500 h=400
   - chaussures : x=350 y=950 w=500 h=200

   Chaque cutout est redimensionné en mode 'inside' pour tenir dans son rectangle sans
   déformation.

4. Sauve le résultat JPG 88% sur Vercel Blob avec clé = `flatlay-${outfit_id}.jpg`.

5. Stocke l'URL Blob dans la table outfit (champ flat_lay_url).

6. Cache : vérifie d'abord si flat_lay_url existe déjà avant de regénérer.

7. Crée un composant React <OutfitFlatLay outfit={outfit} /> qui affiche cette image au-dessus
   des cartes produits dans la page tenue. Si flat_lay_url est null, affiche un placeholder
   "Composition en cours..." pendant 2-3s puis recharge.

8. Sharp est déjà installé (vérifie package.json). Ajoute si manquant :
   npm install sharp

Variables d'environnement à ajouter dans Vercel :
- PHOTOROOM_API_KEY (clé API Photoroom, à créer sur photoroom.com/api)
```

---

## 9. Plan B si Photoroom marche mal sur certaines images

Pour 5-10% des images (textures complexes, transparences), Photoroom peut donner un détourage
imparfait. Solution :

```typescript
// Fallback : si Photoroom retourne une image avec contours flous, garder l'image
// originale crop + collée sur fond crème via blend mode

if (cutoutQualityScore < 0.7) {
  // Garder l'image originale sans détourage
  // Juste la coller sur le fond crème avec un masque doux
  return useOriginalWithSoftBlend(imageUrl);
}
```

---

## 10. Résultat attendu

**Avant** (page tenue actuelle) :
- 5 cards séparées avec des photos cassées
- Chaque marque a son style/fond/qualité
- Aspect visuel hétérogène, peu professionnel

**Après** (avec flat lay composite) :
- 1 image hero éditoriale en haut (1200×1200 carré)
- Les 5 vraies pièces du flux Awin sont visibles ensemble
- Fond crème uniforme, ombres douces
- Aspect : Net-a-Porter / Mr Porter / Vogue Shopping
- 5 cards en dessous pour les boutons "Acheter"

C'est **le niveau visuel qui crédibilise WADA face aux concurrents premium**.

---

## Conclusion

**Tu as raison de préférer l'approche composite** : les vraies pièces, plus crédible que l'IA.
Le filtre "images sans mannequin" déjà demandé au codeur facilite énormément la suite.

**À faire demain** :
1. Crée le compte Photoroom (gratuit jusqu'à 100 images/mois — suffisant pour tester)
2. Récupère la PHOTOROOM_API_KEY et ajoute-la dans Vercel
3. Donne à Claude Code le prompt d'implémentation ci-dessus
4. Compte ~4-6 heures de dev
5. Test sur 5-10 tenues
6. Si OK, déploie en production

**Coût mensuel à scale** :
- 500 outfits/mois : ~$50
- 5000 outfits/mois : ~$500 (passer sur rembg self-hosted)

Cette fonctionnalité te démarque immédiatement de tous les concurrents qui montrent juste des
catalogues sans cohérence visuelle.
