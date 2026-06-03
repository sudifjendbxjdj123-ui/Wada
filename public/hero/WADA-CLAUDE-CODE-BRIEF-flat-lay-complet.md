# WADA — Brief Claude Code : flat lay shoppable complet

Document unique à coller dans Claude Code. Contient tout le système flat lay :
composite des vraies images produits, proportions réelles, grille spatiale, hotspots
cliquables, bouton aimer, bouton acheter tenue complète, modal multi-marchand.

**Durée totale estimée** : 6-8 heures de dev en une session Claude Code
**Coût mensuel** : ~1-5 €/mois au démarrage, ~25 €/mois à 5000 outfits/mois (Replicate)

---

## Objectif

Transformer la page tenue de WADA d'un assemblage de cards séparées en une **expérience
éditoriale shoppable** style Net-a-Porter :

1. **Une image flat lay unifiée** en haut de la page, générée automatiquement à partir
   des 5 vraies photos produits des marques affiliées
2. **Des hotspots cliquables** sur chaque pièce du flat lay (hover → info-bar
   avec marque + nom + prix)
3. **Deux boutons d'action** sous le flat lay : « Aimer la tenue » et « Acheter cette
   tenue complète »
4. **Une modale multi-marchand** qui ouvre les 5 liens d'affiliation Awin séquentiellement
   ou envoie un mail récapitulatif

---

## Critères de succès

L'implémentation est réussie quand :

- [ ] Une tenue de 5 pièces affiche une image flat lay propre en moins de 3 secondes
- [ ] Le cardigan apparaît **plus grand** que les mocassins (proportions réelles respectées)
- [ ] Survol d'un + sur le flat lay → info-bar marque/nom/prix apparaît en bas
- [ ] Clic sur « Aimer » → toggle l'état dans user.likedOutfits
- [ ] Clic sur « Acheter cette tenue » → modale s'ouvre avec liste des 5 marchands
- [ ] « Ouvrir les 5 onglets » → 5 fenêtres avec liens Awin trackés
- [ ] « Recevoir par mail » → mail envoyé via Resend avec les 5 liens
- [ ] Si 3 images source sont mauvaises → fallback automatique sur les cards individuelles
- [ ] Cache des images générées sur Vercel Blob (clé par outfit_id)

---

## Variables d'environnement à ajouter dans Vercel

```bash
REPLICATE_API_TOKEN=...         # Déjà configuré chez WADA ✅
RESEND_API_KEY=...              # Déjà configuré normalement
NEXT_PUBLIC_SITE_URL=https://wada.style
```

Aucune nouvelle variable à créer — REPLICATE_API_TOKEN est déjà dans les variables Vercel
de WADA.

---

## Architecture des fichiers à créer

```
lib/
  flatlay/
    sizes.ts          → table des tailles réelles cm/px
    layout.ts         → calcul des positions par template
    rembg.ts          → client Replicate (background removal open source)
    composer.ts       → composition Sharp
    quality.ts        → quality gate sur images source
    index.ts          → orchestrateur principal

app/
  api/
    flatlay/
      [outfit_id]/
        route.ts      → endpoint GET pour générer/récupérer le flat lay
    email-outfit/
      route.ts        → endpoint POST pour envoyer la tenue par mail
    affiliate-track/
      route.ts        → endpoint POST pour tracker les clics affiliés

components/
  flatlay/
    ShoppableFlatLay.tsx  → composant avec hotspots
    OutfitActions.tsx     → boutons Aimer + Acheter
    BuyAllModal.tsx       → modale multi-marchand
```

---

## Schéma de base de données à ajouter

```sql
ALTER TABLE outfits ADD COLUMN flat_lay_url TEXT;
ALTER TABLE outfits ADD COLUMN flat_lay_generated_at TIMESTAMP;
ALTER TABLE outfits ADD COLUMN flat_lay_status TEXT DEFAULT 'pending';
  -- 'pending' | 'generated' | 'failed' | 'low_quality'

ALTER TABLE outfit_pieces ADD COLUMN flat_lay_position_x INTEGER;
ALTER TABLE outfit_pieces ADD COLUMN flat_lay_position_y INTEGER;
ALTER TABLE outfit_pieces ADD COLUMN flat_lay_width INTEGER;
ALTER TABLE outfit_pieces ADD COLUMN flat_lay_height INTEGER;
ALTER TABLE outfit_pieces ADD COLUMN editorial_note TEXT;
  -- note styliste IA "Le brun chaud du cuir fait écho au bois flotté..."

CREATE TABLE user_liked_outfits (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  outfit_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

CREATE TABLE affiliate_clicks (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  outfit_id TEXT NOT NULL,
  piece_id TEXT NOT NULL,
  source TEXT,            -- 'flat_lay_hotspot' | 'product_card' | 'buy_all_modal'
  affiliate_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Fichier 1 — lib/flatlay/sizes.ts

```typescript
/**
 * Tailles réelles des pièces de vêtements en cm.
 * Sur le canvas 1200×1200 = 240×240 cm réels.
 * Donc 1 cm = 5 pixels.
 */

export const CM_TO_PX = 5;
export const CANVAS_SIZE = 1200;

export type PieceType =
  | 'manteau_long' | 'manteau_court' | 'cardigan' | 'blazer' | 'pull'
  | 'polo' | 'tshirt' | 'chemise'
  | 'robe_courte' | 'robe_longue'
  | 'jean' | 'pantalon' | 'short' | 'jupe'
  | 'mocassins' | 'sneakers' | 'bottes' | 'sandales'
  | 'sac' | 'ceinture' | 'foulard' | 'lunettes'
  | 'cufflinks' | 'montre' | 'bagues' | 'collier';

interface RealSize {
  w: number;
  h: number;
}

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
  return {
    w: cm.w * CM_TO_PX,
    h: cm.h * CM_TO_PX,
  };
}

/**
 * Détecte le type d'une pièce à partir de son nom/description.
 * Best-effort fallback si piece.type n'est pas explicitement renseigné.
 */
export function inferPieceType(piece: { type?: string, name?: string, slot?: string }): PieceType {
  if (piece.type && piece.type in REAL_SIZES_CM) {
    return piece.type as PieceType;
  }

  const text = `${piece.name ?? ''} ${piece.slot ?? ''}`.toLowerCase();

  if (text.match(/manteau|trench|parka/)) {
    return text.match(/long/) ? 'manteau_long' : 'manteau_court';
  }
  if (text.match(/cardigan|gilet/)) return 'cardigan';
  if (text.match(/blazer|veste\s+(de\s+)?costume/)) return 'blazer';
  if (text.match(/pull|sweater|hoodie/)) return 'pull';
  if (text.match(/polo/)) return 'polo';
  if (text.match(/t-?shirt|tee/)) return 'tshirt';
  if (text.match(/chemise|shirt/)) return 'chemise';
  if (text.match(/robe\s+longue/)) return 'robe_longue';
  if (text.match(/robe/)) return 'robe_courte';
  if (text.match(/jean/)) return 'jean';
  if (text.match(/short/)) return 'short';
  if (text.match(/jupe|skirt/)) return 'jupe';
  if (text.match(/pantalon|trouser|cargo/)) return 'pantalon';
  if (text.match(/mocassin|loafer|derby/)) return 'mocassins';
  if (text.match(/sneaker|basket/)) return 'sneakers';
  if (text.match(/botte|boot/)) return 'bottes';
  if (text.match(/sandale|sandal/)) return 'sandales';
  if (text.match(/sac|bag/)) return 'sac';
  if (text.match(/ceinture|belt/)) return 'ceinture';
  if (text.match(/foulard|scarf/)) return 'foulard';
  if (text.match(/lunette|sunglass|glass/)) return 'lunettes';
  if (text.match(/cufflink|manchette/)) return 'cufflinks';
  if (text.match(/montre|watch/)) return 'montre';
  if (text.match(/bague|ring/)) return 'bagues';
  if (text.match(/collier|necklace|chain/)) return 'collier';

  // Fallback selon le slot
  if (piece.slot === 'veste') return 'cardigan';
  if (piece.slot === 'haut') return 'polo';
  if (piece.slot === 'bas') return 'jean';
  if (piece.slot === 'chaussures') return 'mocassins';
  if (piece.slot === 'accent') return 'cufflinks';

  return 'polo'; // dernier fallback
}
```

---

## Fichier 2 — lib/flatlay/layout.ts

```typescript
import { getPiecePixelSize, inferPieceType, PieceType } from './sizes';

export interface PieceForLayout {
  id: string;
  slot: 'veste' | 'haut' | 'bas' | 'chaussures' | 'accent';
  type?: string;
  name?: string;
}

export interface LayoutPosition {
  piece_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

/**
 * Templates de placement spatial.
 * Coordonnées en pixels sur canvas 1200×1200.
 * x, y = coin haut-gauche de la zone allouée à la pièce.
 */

const TEMPLATES = {
  // Template C — défaut casual unisexe (Rosée du matin, etc.)
  casual: {
    veste: { anchor_x: 110, anchor_y: 130 },
    haut: { anchor_x: 740, anchor_y: 185 },
    bas: { anchor_x: 175, anchor_y: 615 },
    chaussures: { anchor_x: 580, anchor_y: 845 },
    accent: { anchor_x: 850, anchor_y: 1015 },
  },
  // Template A — tenue avec manteau (formelle/hivernale)
  formal: {
    veste: { anchor_x: 80, anchor_y: 80 },
    haut: { anchor_x: 640, anchor_y: 130 },
    bas: { anchor_x: 220, anchor_y: 660 },
    chaussures: { anchor_x: 700, anchor_y: 740 },
    accent: { anchor_x: 880, anchor_y: 1000 },
  },
  // Template B — robe (femme)
  dress: {
    veste: { anchor_x: 560, anchor_y: 100 },   // cardigan posé à côté
    haut: { anchor_x: 200, anchor_y: 80 },     // robe en hero central
    bas: null,                                  // pas de bas
    chaussures: { anchor_x: 580, anchor_y: 580 },
    accent: { anchor_x: 870, anchor_y: 200 },
  },
  // Template D — streetwear
  streetwear: {
    veste: { anchor_x: 140, anchor_y: 100 },
    haut: { anchor_x: 640, anchor_y: 130 },
    bas: { anchor_x: 220, anchor_y: 600 },
    chaussures: { anchor_x: 620, anchor_y: 700 },
    accent: { anchor_x: 800, anchor_y: 950 },
  },
};

export type TemplateName = keyof typeof TEMPLATES;

export function pickTemplate(pieces: PieceForLayout[]): TemplateName {
  const types = pieces.map(p => inferPieceType(p));

  if (types.some(t => t === 'manteau_long' || t === 'manteau_court')) {
    return 'formal';
  }
  if (types.some(t => t === 'robe_courte' || t === 'robe_longue')) {
    return 'dress';
  }
  if (types.some(t => t === 'pull' && pieces.find(p => p.name?.toLowerCase().includes('hood')))) {
    return 'streetwear';
  }
  return 'casual';
}

export function layoutFlatLay(pieces: PieceForLayout[]): LayoutPosition[] {
  const template = TEMPLATES[pickTemplate(pieces)];
  const positions: LayoutPosition[] = [];

  for (const piece of pieces) {
    const type = inferPieceType(piece);
    const size = getPiecePixelSize(type);
    const anchor = template[piece.slot];

    if (!anchor) continue; // slot pas géré par ce template

    positions.push({
      piece_id: piece.id,
      x: anchor.anchor_x,
      y: anchor.anchor_y,
      w: size.w,
      h: size.h,
      rotation: piece.slot === 'chaussures' ? 0 : undefined,
    });
  }

  return positions;
}
```

---

## Fichier 3 — lib/flatlay/rembg.ts

```typescript
/**
 * Client Replicate pour le background removal.
 * Utilise le modèle open source 851-labs/background-remover (RMBG-1.4).
 * Coût : ~$0,001 par image. REPLICATE_API_TOKEN déjà configuré dans Vercel.
 * Doc : https://replicate.com/851-labs/background-remover
 */

import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const MODEL = '851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc';

export async function removeBackground(imageUrl: string): Promise<Buffer> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN manquante');
  }

  // 1. Appel Replicate — renvoie une URL temporaire vers l'image détourée
  const output = await replicate.run(MODEL, {
    input: {
      image: imageUrl,
      format: 'png',     // PNG pour transparence
    },
  }) as string;

  if (!output || typeof output !== 'string') {
    throw new Error('Replicate did not return a valid output URL');
  }

  // 2. Télécharger l'image détourée
  const imgRes = await fetch(output);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch cutout: ${imgRes.status}`);
  }

  return Buffer.from(await imgRes.arrayBuffer());
}

export async function removeBackgroundBatch(urls: string[]): Promise<(Buffer | null)[]> {
  // Détoure les images en parallèle (Replicate supporte la concurrence)
  return Promise.all(
    urls.map(url =>
      removeBackground(url).catch(err => {
        console.error('[Replicate rembg] failed for', url, err.message);
        return null;
      })
    )
  );
}
```

**Installation** :
```bash
npm install replicate
```

**Modèles alternatifs** sur Replicate si jamais celui-ci change :
- `cjwbw/rembg` (classique rembg, légèrement moins propre mais plus stable)
- `lucataco/remove-bg` (modèle communautaire)
- `851-labs/background-remover` (recommandé — RMBG-1.4, très propre sur vêtements)

---

## Fichier 4 — lib/flatlay/quality.ts

```typescript
/**
 * Quality gate : décide si les images source sont assez bonnes pour faire un flat lay.
 * Si non, on retombe sur l'affichage en cards.
 */

import sharp from 'sharp';

export interface QualityCheck {
  passed: boolean;
  reason?: string;
  score: number; // 0-1
}

export async function checkImageQuality(imageUrl: string): Promise<QualityCheck> {
  try {
    const buffer = await fetch(imageUrl)
      .then(r => r.arrayBuffer())
      .then(ab => Buffer.from(ab));

    const meta = await sharp(buffer).metadata();

    // Check 1 : résolution minimale
    if (!meta.width || !meta.height || meta.width < 600 || meta.height < 600) {
      return { passed: false, reason: 'résolution trop basse', score: 0.2 };
    }

    // Check 2 : ratio acceptable (pas trop déformé)
    const ratio = meta.width / meta.height;
    if (ratio < 0.5 || ratio > 2.0) {
      return { passed: false, reason: 'ratio anormal', score: 0.3 };
    }

    // Check 3 : détection fond uniforme (échantillonnage coins)
    const small = await sharp(buffer)
      .resize(100, 100, { fit: 'fill' })
      .raw()
      .toBuffer();

    let uniformPixels = 0;
    const samples = 0;
    const corners = [
      { x: 0, y: 0 }, { x: 99, y: 0 },
      { x: 0, y: 99 }, { x: 99, y: 99 },
    ];

    for (const c of corners) {
      const idx = (c.y * 100 + c.x) * 3;
      const r = small[idx], g = small[idx + 1], b = small[idx + 2];
      // pixel "clair" (proche blanc/gris clair)
      if (r > 220 && g > 220 && b > 220) uniformPixels++;
    }

    if (uniformPixels < 3) {
      return {
        passed: false,
        reason: 'fond non uniforme (probablement contexte/lifestyle)',
        score: 0.4,
      };
    }

    return { passed: true, score: 0.9 };
  } catch (err) {
    return { passed: false, reason: 'erreur fetch ou parse', score: 0 };
  }
}

export async function checkOutfitQuality(imageUrls: string[]): Promise<{
  overall_passed: boolean;
  per_image: QualityCheck[];
  pass_rate: number;
}> {
  const checks = await Promise.all(imageUrls.map(checkImageQuality));
  const passed = checks.filter(c => c.passed).length;
  const passRate = passed / checks.length;

  // Si 4/5 ou 5/5 passent → on fait le flat lay
  // Si 3/5 ou moins → fallback sur cards
  return {
    overall_passed: passRate >= 0.8,
    per_image: checks,
    pass_rate: passRate,
  };
}
```

---

## Fichier 5 — lib/flatlay/composer.ts

```typescript
import sharp from 'sharp';
import { LayoutPosition } from './layout';
import { CANVAS_SIZE } from './sizes';

/**
 * Compose le flat lay final à partir des cutouts détourés et des positions calculées.
 */

const BACKGROUND_COLOR = { r: 244, g: 238, b: 228 }; // #f4eee4 crème WADA

export async function composeFlatLay(
  cutouts: (Buffer | null)[],
  positions: LayoutPosition[]
): Promise<Buffer> {
  // 1. Créer le canvas avec fond crème
  let canvas = sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 3,
      background: BACKGROUND_COLOR,
    },
  });

  // 2. Préparer les overlays (resize + position)
  const overlays: sharp.OverlayOptions[] = [];

  for (let i = 0; i < positions.length; i++) {
    const cutout = cutouts[i];
    const pos = positions[i];

    if (!cutout) continue; // pièce échouée au détourage, skip

    // Resize en gardant l'aspect ratio (fit:inside)
    const resized = await sharp(cutout)
      .resize(pos.w, pos.h, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      // Ajouter ombre portée douce
      .composite([{
        input: await createShadow(cutout, pos.w, pos.h),
        blend: 'multiply',
      }])
      .png()
      .toBuffer();

    overlays.push({
      input: resized,
      top: pos.y,
      left: pos.x,
    });
  }

  // 3. Compose tout + harmonisation chromatique légère
  const final = await canvas
    .composite(overlays)
    .modulate({
      saturation: 0.95,    // dé-satrue légèrement pour unifier
      brightness: 1.02,    // éclaircit subtilement
    })
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();

  return final;
}

/**
 * Génère une ombre portée douce sous une pièce (effet "posée sur la table").
 */
async function createShadow(cutout: Buffer, w: number, h: number): Promise<Buffer> {
  return sharp(cutout)
    .resize(w, h, { fit: 'inside' })
    .extractChannel('alpha')
    .blur(8)
    .toColorspace('srgb')
    .joinChannel(Buffer.alloc(w * h, 200), { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer()
    .catch(() => Buffer.alloc(0)); // si erreur, pas d'ombre, on continue
}
```

---

## Fichier 6 — lib/flatlay/index.ts (orchestrateur)

```typescript
import { layoutFlatLay, PieceForLayout } from './layout';
import { removeBackgroundBatch } from './rembg';
import { composeFlatLay } from './composer';
import { checkOutfitQuality } from './quality';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';

interface GenerateOptions {
  outfit_id: string;
  pieces: Array<PieceForLayout & { image_url: string }>;
  force_regenerate?: boolean;
}

export async function generateFlatLay({
  outfit_id,
  pieces,
  force_regenerate,
}: GenerateOptions): Promise<{
  url: string | null;
  status: 'generated' | 'cached' | 'low_quality' | 'failed';
  reason?: string;
}> {
  // 1. Cache check
  if (!force_regenerate) {
    const existing = await db.outfit.findUnique({
      where: { id: outfit_id },
      select: { flat_lay_url: true, flat_lay_status: true },
    });
    if (existing?.flat_lay_url && existing.flat_lay_status === 'generated') {
      return { url: existing.flat_lay_url, status: 'cached' };
    }
  }

  // 2. Quality gate sur les images source
  const quality = await checkOutfitQuality(pieces.map(p => p.image_url));
  if (!quality.overall_passed) {
    await db.outfit.update({
      where: { id: outfit_id },
      data: { flat_lay_status: 'low_quality' },
    });
    return {
      url: null,
      status: 'low_quality',
      reason: `pass rate ${(quality.pass_rate * 100).toFixed(0)}%`,
    };
  }

  // 3. Calculer les positions
  const positions = layoutFlatLay(pieces);

  // 4. Sauver les positions en base (pour les hotspots côté UI)
  for (const pos of positions) {
    await db.outfitPiece.update({
      where: { id: pos.piece_id },
      data: {
        flat_lay_position_x: pos.x,
        flat_lay_position_y: pos.y,
        flat_lay_width: pos.w,
        flat_lay_height: pos.h,
      },
    });
  }

  // 5. Détourer les 5 pièces en parallèle
  const cutouts = await removeBackgroundBatch(pieces.map(p => p.image_url));

  // 6. Composer le flat lay
  let composite: Buffer;
  try {
    composite = await composeFlatLay(cutouts, positions);
  } catch (err: any) {
    await db.outfit.update({
      where: { id: outfit_id },
      data: { flat_lay_status: 'failed' },
    });
    return { url: null, status: 'failed', reason: err.message };
  }

  // 7. Upload sur Vercel Blob
  const blobKey = `flatlay-${outfit_id}.jpg`;
  const { url } = await put(blobKey, composite, {
    access: 'public',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
  });

  // 8. Update DB
  await db.outfit.update({
    where: { id: outfit_id },
    data: {
      flat_lay_url: url,
      flat_lay_status: 'generated',
      flat_lay_generated_at: new Date(),
    },
  });

  return { url, status: 'generated' };
}
```

---

## Fichier 7 — app/api/flatlay/[outfit_id]/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateFlatLay } from '@/lib/flatlay';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { outfit_id: string } }
) {
  const { outfit_id } = params;
  const force = request.nextUrl.searchParams.get('force') === '1';

  const outfit = await db.outfit.findUnique({
    where: { id: outfit_id },
    include: { pieces: true },
  });

  if (!outfit) {
    return NextResponse.json({ error: 'outfit not found' }, { status: 404 });
  }

  const result = await generateFlatLay({
    outfit_id,
    pieces: outfit.pieces.map(p => ({
      id: p.id,
      slot: p.slot,
      type: p.type,
      name: p.name,
      image_url: p.image_url,
    })),
    force_regenerate: force,
  });

  return NextResponse.json(result);
}
```

---

## Fichier 8 — components/flatlay/ShoppableFlatLay.tsx

```tsx
'use client';
import { useState } from 'react';
import Image from 'next/image';

interface Piece {
  id: string;
  slot: string;
  brand: string;
  name: string;
  price: number;
  affiliate_url: string;
  flat_lay_position_x: number;
  flat_lay_position_y: number;
  flat_lay_width: number;
  flat_lay_height: number;
}

interface Props {
  flat_lay_url: string;
  pieces: Piece[];
  outfit_id: string;
}

const CANVAS = 1200;

export function ShoppableFlatLay({ flat_lay_url, pieces, outfit_id }: Props) {
  const [hovered, setHovered] = useState<Piece | null>(null);

  const trackClick = async (piece: Piece) => {
    await fetch('/api/affiliate-track', {
      method: 'POST',
      body: JSON.stringify({
        outfit_id,
        piece_id: piece.id,
        source: 'flat_lay_hotspot',
        affiliate_url: piece.affiliate_url,
      }),
    });
    window.open(piece.affiliate_url, '_blank', 'noopener');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#f4eee4]">
        <Image
          src={flat_lay_url}
          alt="Composition à plat de la tenue"
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {pieces.map(piece => {
          // Calculer le centre du hotspot en pourcentage du canvas
          const centerX = ((piece.flat_lay_position_x + piece.flat_lay_width / 2) / CANVAS) * 100;
          const centerY = ((piece.flat_lay_position_y + piece.flat_lay_height / 2) / CANVAS) * 100;

          return (
            <button
              key={piece.id}
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white/95 text-[#4a3d2a] shadow-lg flex items-center justify-center text-xl hover:bg-[#4a3d2a] hover:text-[#f4eee4] hover:scale-110 transition-all"
              style={{ left: `${centerX}%`, top: `${centerY}%` }}
              onMouseEnter={() => setHovered(piece)}
              onMouseLeave={() => setTimeout(() => setHovered(null), 200)}
              onClick={() => trackClick(piece)}
              aria-label={`${piece.brand} ${piece.name}`}
            >
              +
            </button>
          );
        })}

        {hovered && (
          <div
            className="absolute bottom-4 left-4 right-4 bg-white/96 backdrop-blur-sm rounded-md p-3 flex items-center justify-between gap-3 shadow-lg border border-black/5 transition-all"
            onMouseEnter={() => setHovered(hovered)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wider text-[#8a7a68]">
                {hovered.brand}
              </span>
              <span className="text-sm text-[#2c2c2a]">{hovered.name}</span>
            </div>
            <span className="text-sm font-medium text-[#2c2c2a] whitespace-nowrap">
              {hovered.price} €
            </span>
            <button
              onClick={() => trackClick(hovered)}
              className="text-xs px-3 py-1.5 bg-[#4a3d2a] text-[#f4eee4] rounded font-medium"
            >
              Acheter ↗
            </button>
          </div>
        )}
      </div>
      <p className="text-center text-xs italic text-gray-400 mt-2">
        Survolez chaque pièce pour découvrir le détail
      </p>
    </div>
  );
}
```

---

## Fichier 9 — components/flatlay/OutfitActions.tsx

```tsx
'use client';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { BuyAllModal } from './BuyAllModal';

interface Props {
  outfit_id: string;
  outfit_name: string;
  total_price: number;
  pieces: any[];
  is_liked: boolean;
  is_authenticated: boolean;
  on_like: (newState: boolean) => void;
}

export function OutfitActions({
  outfit_id, outfit_name, total_price, pieces,
  is_liked, is_authenticated, on_like
}: Props) {
  const [liked, setLiked] = useState(is_liked);
  const [showBuy, setShowBuy] = useState(false);

  const handleLike = async () => {
    if (!is_authenticated) {
      // Ouvre modal signup ailleurs ou redirect
      window.location.href = `/connexion?next=/tenue/${outfit_id}&action=like`;
      return;
    }

    const newState = !liked;
    setLiked(newState);
    on_like(newState);

    await fetch(`/api/outfits/${outfit_id}/like`, {
      method: newState ? 'POST' : 'DELETE',
    });
  };

  return (
    <>
      <div className="grid grid-cols-[56px_1fr] gap-3 mt-4">
        <button
          onClick={handleLike}
          className={`flex items-center justify-center border rounded-lg transition-all ${
            liked
              ? 'bg-[#6e3b32] border-[#6e3b32] text-[#f4eee4]'
              : 'bg-white border-gray-300 text-[#6e3b32] hover:bg-[#faf0ee]'
          }`}
          aria-label={liked ? 'Retirer des favoris' : 'Aimer cette tenue'}
        >
          <Heart className="w-6 h-6" fill={liked ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => setShowBuy(true)}
          className="bg-[#4a3d2a] text-[#f4eee4] rounded-lg px-5 py-3.5 flex items-center justify-between hover:bg-[#2d2418] transition-colors"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm tracking-wide">Acheter cette tenue</span>
            <span className="text-xs opacity-70">{pieces.length} pièces · {new Set(pieces.map(p => p.brand)).size} marques</span>
          </div>
          <span className="text-base font-medium">{total_price} €</span>
        </button>
      </div>

      {showBuy && (
        <BuyAllModal
          outfit_id={outfit_id}
          outfit_name={outfit_name}
          pieces={pieces}
          total={total_price}
          onClose={() => setShowBuy(false)}
        />
      )}
    </>
  );
}
```

---

## Fichier 10 — components/flatlay/BuyAllModal.tsx

```tsx
'use client';
import { useState } from 'react';
import { X, ExternalLink, Mail } from 'lucide-react';

interface Props {
  outfit_id: string;
  outfit_name: string;
  pieces: any[];
  total: number;
  onClose: () => void;
}

export function BuyAllModal({ outfit_id, outfit_name, pieces, total, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleOpenAll = async () => {
    setLoading(true);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      await fetch('/api/affiliate-track', {
        method: 'POST',
        body: JSON.stringify({
          outfit_id,
          piece_id: piece.id,
          source: 'buy_all_modal',
          affiliate_url: piece.affiliate_url,
        }),
      });
      window.open(piece.affiliate_url, `_wada_${piece.id}`, 'noopener');
      await sleep(300);
    }
    setLoading(false);
    onClose();
  };

  const handleEmailMe = async () => {
    setLoading(true);
    const res = await fetch('/api/email-outfit', {
      method: 'POST',
      body: JSON.stringify({ outfit_id }),
    });
    setLoading(false);
    if (res.ok) {
      setEmailSent(true);
      setTimeout(() => onClose(), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full overflow-hidden relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center px-6 py-5 border-b border-gray-200">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Tenue complète</p>
          <p className="font-serif text-2xl text-gray-900 mt-2">{outfit_name}</p>
          <p className="text-xs text-gray-500 mt-1">
            {pieces.length} pièces de {new Set(pieces.map(p => p.brand)).size} maisons différentes
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="bg-[#faf6ee] p-3 rounded-md text-xs text-[#4a3d2a] leading-relaxed mb-4">
            WADA ne gère pas de panier unique — chaque pièce s'achète sur le site de sa marque.
            Tu finalises en quelques clics, et on garde la trace de ta tenue.
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {pieces.map((piece, i) => (
              <div key={piece.id} className="grid grid-cols-[28px_1fr_auto] gap-3 items-center p-2.5 bg-gray-50 rounded-md text-sm">
                <div className="w-5 h-5 rounded-full bg-[#4a3d2a] text-[#f4eee4] flex items-center justify-center text-[10px] font-medium">
                  {i + 1}
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">{piece.brand}</span>
                  <span className="text-sm text-gray-900 truncate">{piece.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {piece.price} €
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-baseline pt-3 mb-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">Total estimé</span>
            <span className="font-serif text-2xl text-gray-900">{total} €</span>
          </div>

          {emailSent ? (
            <div className="text-center py-4 text-sm text-green-700">
              ✓ Envoyé ! Vérifie ta boîte mail.
            </div>
          ) : (
            <>
              <button
                onClick={handleOpenAll}
                disabled={loading}
                className="w-full bg-[#4a3d2a] text-[#f4eee4] rounded-md py-3.5 text-sm flex items-center justify-center gap-2 mb-2 hover:bg-[#2d2418] transition-colors disabled:opacity-60"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir les {pieces.length} onglets
              </button>

              <button
                onClick={handleEmailMe}
                disabled={loading}
                className="w-full bg-transparent border border-gray-300 rounded-md py-3 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                Recevoir par mail pour acheter plus tard
              </button>
            </>
          )}
        </div>

        <div className="px-6 pb-5 text-center">
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Les liens passent par notre réseau partenaire Awin.<br />
            WADA touche une commission sans surcoût pour toi.{' '}
            <a href="/affiliation" className="underline text-gray-600">En savoir plus</a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Fichier 11 — app/api/email-outfit/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Resend } from 'resend';
import { auth } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { outfit_id } = await req.json();

  const outfit = await db.outfit.findUnique({
    where: { id: outfit_id },
    include: { pieces: true, palette: true },
  });

  if (!outfit) {
    return NextResponse.json({ error: 'outfit not found' }, { status: 404 });
  }

  const total = outfit.pieces.reduce((sum, p) => sum + p.price, 0);

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f4eee4; color: #2c2c2a;">
      <h1 style="font-size: 24px; font-weight: normal; text-align: center; margin: 0 0 8px;">${outfit.palette.name}</h1>
      <p style="text-align: center; font-size: 12px; color: #8a7a68; margin: 0 0 24px; letter-spacing: 1px; text-transform: uppercase;">Ta tenue WADA</p>

      ${outfit.flat_lay_url ? `<img src="${outfit.flat_lay_url}" alt="Flat lay ${outfit.palette.name}" style="width: 100%; border-radius: 8px; margin-bottom: 24px;" />` : ''}

      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">Bonjour,</p>
      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
        Voici les ${outfit.pieces.length} pièces pour finaliser ta tenue ${outfit.palette.name}.
        Chaque lien t'amène directement sur le site de la marque.
      </p>

      <div style="background: white; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
        ${outfit.pieces.map((p, i) => `
          <div style="padding: 12px 0; border-bottom: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <span style="font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #8a7a68;">${i + 1}. ${p.brand}</span>
              <span style="font-weight: 500;">${p.price} €</span>
            </div>
            <p style="margin: 0 0 8px; font-size: 14px;">${p.name}</p>
            <a href="${p.affiliate_url}" style="display: inline-block; background: #4a3d2a; color: #f4eee4; padding: 6px 14px; text-decoration: none; border-radius: 4px; font-size: 12px;">Acheter chez ${p.brand} →</a>
          </div>
        `).join('')}
      </div>

      <p style="text-align: right; font-size: 14px; margin: 0 0 24px;">
        Total estimé : <strong>${total} €</strong>
      </p>

      <p style="font-size: 13px; line-height: 1.6; font-style: italic; color: #6e3b32; text-align: center;">
        Ta styliste WADA
      </p>

      <hr style="border: none; border-top: 1px solid rgba(0,0,0,0.1); margin: 24px 0;" />
      <p style="font-size: 10px; color: #8a7a68; text-align: center; line-height: 1.5;">
        Les liens passent par notre réseau partenaire Awin.<br />
        WADA touche une commission sans surcoût pour toi.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: 'WADA <hello@wada.style>',
    to: session.user.email,
    subject: `Ta tenue ${outfit.palette.name} t'attend`,
    html,
  });

  await db.affiliateEmailSent.create({
    data: {
      user_id: session.user.id,
      outfit_id,
      sent_at: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
```

---

## Fichier 12 — app/api/affiliate-track/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  const { outfit_id, piece_id, source, affiliate_url } = await req.json();

  await db.affiliateClick.create({
    data: {
      user_id: session?.user?.id ?? null,
      outfit_id,
      piece_id,
      source,
      affiliate_url,
    },
  });

  return NextResponse.json({ ok: true });
}
```

---

## Intégration dans la page tenue existante

Dans `app/tenue/[outfit_id]/page.tsx` (ou le path équivalent) :

```tsx
import { ShoppableFlatLay } from '@/components/flatlay/ShoppableFlatLay';
import { OutfitActions } from '@/components/flatlay/OutfitActions';

export default async function TenuePage({ params }: { params: { outfit_id: string } }) {
  const outfit = await getOutfit(params.outfit_id);
  const session = await auth();
  const isLiked = session ? await isOutfitLiked(session.user.id, params.outfit_id) : false;

  // Génère le flat lay si absent (async, non-bloquant pour MVP)
  if (!outfit.flat_lay_url) {
    fetch(`/api/flatlay/${params.outfit_id}`); // fire-and-forget
  }

  const total = outfit.pieces.reduce((s, p) => s + p.price, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-serif text-3xl text-center mb-2">{outfit.palette.name}</h1>
      <p className="text-xs text-center text-gray-500 mb-6 uppercase tracking-wider">
        {outfit.palette.color_names.join(' · ')}
      </p>

      {outfit.flat_lay_url ? (
        <ShoppableFlatLay
          flat_lay_url={outfit.flat_lay_url}
          pieces={outfit.pieces}
          outfit_id={outfit.id}
        />
      ) : (
        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 italic text-sm">Composition en cours...</p>
        </div>
      )}

      <OutfitActions
        outfit_id={outfit.id}
        outfit_name={outfit.palette.name}
        total_price={total}
        pieces={outfit.pieces}
        is_liked={isLiked}
        is_authenticated={!!session}
        on_like={(newState) => {/* analytics */}}
      />

      {/* Cards produits individuelles en dessous, fallback si flat lay échoue */}
      <div className="mt-8 space-y-3">
        {outfit.pieces.map(piece => (
          <ProductCard key={piece.id} piece={piece} />
        ))}
      </div>
    </div>
  );
}
```

---

## Checklist de test après implémentation

```
□ npm install @vercel/blob resend sharp replicate
□ Variables d'env Vercel : REPLICATE_API_TOKEN (existe déjà ✅) + RESEND_API_KEY
□ Migrations DB exécutées (les nouveaux champs sur outfits / outfit_pieces)
□ Test 1 : ouvrir /api/flatlay/[outfit_id] dans le navigateur → JSON retourne url
□ Test 2 : page tenue affiche le flat lay généré
□ Test 3 : survol d'un hotspot → info-bar apparaît
□ Test 4 : clic sur hotspot → ouvre l'URL Awin + tracking enregistré en base
□ Test 5 : clic « Aimer » → entrée créée dans user_liked_outfits
□ Test 6 : clic « Acheter tout » → modale s'ouvre
□ Test 7 : « Ouvrir 5 onglets » → 5 fenêtres avec délai 300ms
□ Test 8 : « Recevoir par mail » → mail reçu via Resend
□ Test 9 : tenue avec images cassées → fallback sur cards (status 'low_quality')
□ Test 10 : 2ème visite → image cachée servie depuis Blob (instantanée)
```

---

## Estimation finale

| Phase | Durée |
|---|---|
| Setup deps + DB migrations | 30 min |
| Fichiers lib/flatlay/* | 1h30 |
| API routes | 1h |
| Composants React (3 fichiers) | 2h |
| Intégration page tenue | 1h |
| Tests & polish | 1-2h |
| **TOTAL** | **6-8h** |

À étaler sur 1-2 sessions Claude Code.

---

## Quand c'est en prod

**Surveille ces métriques** la première semaine :
- Taux de succès du flat lay (status='generated' / total tenues)
- Coût Replicate par jour (visible sur replicate.com/account/billing)
- CTR des hotspots vs cards classiques (avant/après)
- Taux de clic « Acheter cette tenue »
- Taux de « Recevoir par mail »

Si **taux de succès < 70%** → revoir le quality gate (peut-être trop strict).
Si **coût Replicate > 50€/mois** → passer en rembg self-hosted sur Modal (gratuit
à l'infini avec $30/mois de crédits offerts).

---

Tu donnes ce fichier à Claude Code, il a tout pour livrer l'expérience flat lay shoppable
complète en une session.
