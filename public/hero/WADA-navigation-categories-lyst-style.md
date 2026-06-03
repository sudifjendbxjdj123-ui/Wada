# WADA — Navigation par catégories (style Lyst)

## ⚠️ RÈGLE IMAGES PRODUITS — ABSOLUE ET NON NÉGOCIABLE

**Toutes les images affichées sur WADA doivent être** :

✅ **Packshot pur** (le vêtement seul, à plat ou suspendu sans contexte)
✅ **Vue de face** uniquement
✅ **Fond uniforme** (blanc, gris très clair, ou neutre)
✅ **Le vêtement entier visible** (pas coupé)

❌ **JAMAIS de mannequin** (vivant ou silhouette)
❌ **JAMAIS de vue de dos**
❌ **JAMAIS de vue 3/4**
❌ **JAMAIS de photo lifestyle / contexte**
❌ **JAMAIS de gros plan détail seul** (sauf si la pièce entière est aussi visible)

### Pourquoi cette règle

- **Cohérence visuelle** du site (chaque pièce est dans le même cadre éditorial)
- **Compatibilité avec le flat lay composite** (le détourage Replicate est propre seulement sur des packshots)
- **Lisibilité immédiate** pour le client (il voit la pièce comme dans le catalogue marchand)
- **SEO** : Google Image préfère les packshots pour les requêtes shopping

### Comment filtrer les images du flux

Chaque produit Awin a en général plusieurs URLs d'image :
- `aw_image_url` — image principale (souvent packshot)
- `large_image` — variante haute résolution
- `merchant_image_url` — image custom du marchand
- `alternate_images[]` — images additionnelles (souvent contextuelles, lifestyle, dos)

**Algo de sélection** pour chaque produit, à l'import :

```typescript
// lib/products/select-image.ts

interface RawProductImages {
  aw_image_url?: string;
  large_image?: string;
  merchant_image_url?: string;
  alternate_images?: string[];
}

interface ImageScore {
  url: string;
  score: number;  // 0-1, plus élevé = meilleur packshot
}

async function selectBestImage(rawImages: RawProductImages): Promise<string | null> {
  const candidates = [
    rawImages.aw_image_url,
    rawImages.large_image,
    rawImages.merchant_image_url,
    ...(rawImages.alternate_images ?? []),
  ].filter(Boolean) as string[];

  // 1. Scorer chaque image
  const scored: ImageScore[] = await Promise.all(
    candidates.map(async url => ({
      url,
      score: await scoreImageAsPackshot(url),
    }))
  );

  // 2. Filtrer celles qui passent le seuil
  const passing = scored.filter(s => s.score >= 0.7);

  // 3. Retourner la meilleure (ou null si aucune n'est valable)
  if (passing.length === 0) return null;
  return passing.sort((a, b) => b.score - a.score)[0].url;
}

async function scoreImageAsPackshot(imageUrl: string): Promise<number> {
  // Approche 1 — Heuristique simple (rapide, gratuit)
  const heuristicScore = await heuristicPackshotScore(imageUrl);
  if (heuristicScore >= 0.9 || heuristicScore <= 0.2) {
    return heuristicScore;  // confiance haute, pas besoin de Vision
  }

  // Approche 2 — GPT-4o Vision (cas ambigus, payant ~$0,001/image)
  return await visionPackshotScore(imageUrl);
}

async function heuristicPackshotScore(imageUrl: string): Promise<number> {
  const buffer = await fetch(imageUrl).then(r => r.arrayBuffer()).then(ab => Buffer.from(ab));
  const meta = await sharp(buffer).metadata();

  let score = 0.5;

  // Ratio carré ou portrait = +0.2 (packshots sont souvent carrés)
  const ratio = meta.width! / meta.height!;
  if (ratio >= 0.7 && ratio <= 1.3) score += 0.2;

  // Échantillonner les coins (packshot = fond uniforme clair)
  const small = await sharp(buffer).resize(100, 100, { fit: 'fill' }).raw().toBuffer();
  const corners = [[0,0], [99,0], [0,99], [99,99]];
  let whiteCorners = 0;
  for (const [x, y] of corners) {
    const idx = (y * 100 + x) * 3;
    const r = small[idx], g = small[idx+1], b = small[idx+2];
    if (r > 220 && g > 220 && b > 220) whiteCorners++;
  }
  if (whiteCorners >= 3) score += 0.3;       // fond blanc = packshot probable
  if (whiteCorners === 0) score -= 0.3;      // fond contexté = lifestyle

  return Math.max(0, Math.min(1, score));
}

async function visionPackshotScore(imageUrl: string): Promise<number> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Score this fashion product image from 0 to 1.
          Score 1.0 = perfect packshot (single garment, plain background, front view, no mannequin)
          Score 0.5 = acceptable but has a mannequin/torso/back view
          Score 0.0 = lifestyle photo or contextual scene with people
          Return only a JSON: {"score": 0.X, "has_mannequin": bool, "is_back_view": bool, "is_lifestyle": bool}`
        },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(res.choices[0].message.content!);

  // Kill switch — si mannequin OU dos OU lifestyle → score à 0 (rejeté)
  if (result.has_mannequin || result.is_back_view || result.is_lifestyle) return 0;

  return result.score;
}
```

### Application — Migration des produits existants

Pour les ~36 000 produits déjà en base, lancer un script one-shot :

```typescript
// scripts/clean-product-images.ts

async function cleanAllImages() {
  const products = await db.product.findMany();
  let updated = 0;
  let dropped = 0;

  for (const product of products) {
    const cleanImage = await selectBestImage({
      aw_image_url: product.aw_image_url,
      large_image: product.large_image,
      merchant_image_url: product.merchant_image_url,
      alternate_images: product.alternate_images,
    });

    if (cleanImage) {
      await db.product.update({
        where: { id: product.id },
        data: { image_url: cleanImage, image_validated: true },
      });
      updated++;
    } else {
      // Aucune image valable → désactiver le produit
      await db.product.update({
        where: { id: product.id },
        data: { is_active: false, image_validated: false },
      });
      dropped++;
    }
  }

  console.log(`✅ ${updated} produits avec image propre`);
  console.log(`❌ ${dropped} produits désactivés (aucune image packshot)`);
}
```

**Coût estimé** :
- Heuristique : gratuit (Sharp local)
- Vision sur cas ambigus (~30% des produits) : $0,001 × 11 000 = **$11 total**
- Une seule fois pour les 36 000 produits

**Résultat attendu** : ~70-85% des produits gardent une image (les vrais packshots passent), ~15-30% sont désactivés (pas de packshot disponible dans le flux). Mieux 25 000 produits propres que 36 000 dont 10 000 montrent des photos de dos avec mannequin.

### Filtre permanent dans le job cron quotidien

À chaque sync des flux Awin (tous les jours à 4h via Vercel Cron), appliquer ce filtre
automatiquement sur les nouveaux produits.

---


Spec pour ajouter une **2e barre de navigation** sous la nav principale, avec mega menus
au survol — comme Lyst, Net-a-Porter, Mr Porter.

**Objectif** : permettre au client de naviguer **par type de produit** (Vêtements, Chaussures,
Marques...) en complément de la navigation **par expérience WADA** (Palettes, Scanner,
Styliste).

**Durée dev estimée** : 4-6h Claude Code.

---

## Header complet — Structure finale

```tsx
// components/MainNav.tsx
'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export function MainNav() {
  return (
    <header className="border-b border-[#e8dfd0] bg-white">
      <div className="flex items-center justify-between px-7 py-3.5">

        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-lg font-medium tracking-wider text-[#2c2c2a]">WADA</span>
            <span className="font-serif text-base text-[#6e3b32]">和田</span>
          </Link>

          <nav className="flex gap-6 text-sm text-[#2c2c2a]">
            <Link href="/palettes">Palettes</Link>
            <Link href="/scanner">Scanner</Link>
            <Link href="/styliste">Styliste</Link>
            <Link href="/boutique">Boutique</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/favoris" className="flex items-center gap-1.5 text-sm text-[#2c2c2a]">
            <Heart className="w-4 h-4" />
            <span>Favoris</span>
          </Link>
          <Link href="/abonnement"
            className="text-xs px-4 py-1.5 border border-[#6e3b32] text-[#6e3b32] rounded-full">
            Abonnement
          </Link>
        </div>

      </div>

      <CategoryNav />
    </header>
  );
}
```

---

## Architecture globale

### 2 barres distinctes :

**Bar 1 — Identité WADA (modifiée)** :
```
WADA 和田  |  Palettes  |  Scanner  |  Styliste  |  Boutique           Favoris  |  Abonnement
```

Changements vs version actuelle :
- ❌ Supprimer « Favoris » de la position 5 (après Styliste)
- ✅ Ajouter « Boutique » en position 5 (après Styliste)
- ✅ Déplacer « Favoris » à droite, juste à gauche d'« Abonnement »

« Boutique » est le **point d'entrée** vers la navigation par catégories produits.

**Bar 2 — Catégories produits (NOUVELLE)** :
```
Vêtements  |  Chaussures  |  Accessoires  |  Sacs  |  Bijoux  |  Marques  |  Lettres du dimanche  |  Index WADA
```

### Style visuel de la Bar 2 :
- Fond crème `#faf6ee`
- Texte `#4a3d2a`
- Centrée, espacement 32px entre items
- Hauteur 44px
- Border bas `0.5px solid #e8dfd0`
- Indicateur d'item actif : `border-bottom: 2px solid #6e3b32` (bordeaux WADA)
- Au survol d'un item → ouvre le **mega menu** sous la barre

---

## 1. La catégorie « Vêtements »

URL : `/vetements` (page index avec tous les vêtements)

### Mega menu (au survol) — 3 colonnes

**Colonne 1 — Hauts**
```
Tous les hauts                  → /vetements/hauts
T-shirts                        → /vetements/t-shirts
Chemises                        → /vetements/chemises
Polos                           → /vetements/polos
Pulls & cardigans               → /vetements/pulls-cardigans
Sweats & hoodies                → /vetements/sweats-hoodies
Robes                           → /vetements/robes
Blouses                         → /vetements/blouses
```

**Colonne 2 — Bas**
```
Tous les bas                    → /vetements/bas
Pantalons                       → /vetements/pantalons
Jeans                           → /vetements/jeans
Shorts                          → /vetements/shorts
Jupes                           → /vetements/jupes
Joggings                        → /vetements/joggings
```

**Colonne 3 — Vestes & manteaux**
```
Toutes les vestes               → /vetements/vestes
Blazers                         → /vetements/blazers
Manteaux                        → /vetements/manteaux
Vestes en jean                  → /vetements/vestes-jean
Perfectos & cuir                → /vetements/perfectos-cuir
Trenchs                         → /vetements/trenchs
Bombers                         → /vetements/bombers
Doudounes                       → /vetements/doudounes
```

### Pied du mega menu :
```
Filtrable par palette Sanzō Wada                Tous les vêtements →
```

---

## 2. La catégorie « Chaussures »

URL : `/chaussures`

### Mega menu — 2 colonnes

**Colonne 1 — Casual**
```
Toutes les chaussures           → /chaussures
Sneakers                        → /chaussures/sneakers
Mocassins                       → /chaussures/mocassins
Derbies                         → /chaussures/derbies
Sandales                        → /chaussures/sandales
Tongs                           → /chaussures/tongs
Espadrilles                     → /chaussures/espadrilles
```

**Colonne 2 — Formelles & hautes**
```
Ballerines                      → /chaussures/ballerines
Escarpins                       → /chaussures/escarpins
Bottines                        → /chaussures/bottines
Bottes                          → /chaussures/bottes
Boots de moto                   → /chaussures/boots-moto
Birkenstocks                    → /chaussures/birkenstocks
```

---

## 3. La catégorie « Accessoires »

URL : `/accessoires`

### Mega menu — 3 colonnes

**Colonne 1 — Tête & cou**
```
Tous les accessoires            → /accessoires
Foulards & écharpes             → /accessoires/foulards
Chapeaux & bonnets              → /accessoires/chapeaux
Lunettes de soleil              → /accessoires/lunettes
Gants                           → /accessoires/gants
```

**Colonne 2 — Taille & corps**
```
Ceintures                       → /accessoires/ceintures
Cravates                        → /accessoires/cravates
Nœuds papillon                  → /accessoires/noeuds-papillon
Bretelles                       → /accessoires/bretelles
Pochettes de costume            → /accessoires/pochettes-costume
```

**Colonne 3 — Détails**
```
Boutons de manchette            → /accessoires/boutons-manchette
Montres                         → /accessoires/montres
Portefeuilles                   → /accessoires/portefeuilles
Porte-cartes                    → /accessoires/porte-cartes
Parapluies                      → /accessoires/parapluies
```

---

## 4. La catégorie « Sacs »

URL : `/sacs`

### Mega menu — 2 colonnes

**Colonne 1 — Femme**
```
Tous les sacs                   → /sacs
Sacs à main                     → /sacs/sacs-main
Sacs à bandoulière              → /sacs/sacs-bandouliere
Pochettes                       → /sacs/pochettes
Mini sacs                       → /sacs/mini-sacs
Sacs cabas                      → /sacs/cabas
```

**Colonne 2 — Mixte**
```
Sacs à dos                      → /sacs/sacs-dos
Banane                          → /sacs/banane
Sacoche                         → /sacs/sacoche
Sacs de voyage                  → /sacs/sacs-voyage
Sacs de sport                   → /sacs/sacs-sport
Porte-documents                 → /sacs/porte-documents
```

---

## 5. La catégorie « Bijoux »

URL : `/bijoux`

### Mega menu — 2 colonnes

**Colonne 1 — Petits bijoux**
```
Tous les bijoux                 → /bijoux
Bagues                          → /bijoux/bagues
Boucles d'oreilles              → /bijoux/boucles-oreilles
Piercings                       → /bijoux/piercings
```

**Colonne 2 — Grands bijoux**
```
Colliers                        → /bijoux/colliers
Bracelets                       → /bijoux/bracelets
Broches                         → /bijoux/broches
Pendentifs                      → /bijoux/pendentifs
```

---

## 6. La catégorie « Marques » (très importante)

URL : `/marques`

### Principe clé — TOUTES les marques des flux

Les flux d'affiliation contiennent **bien plus que les 5 partenaires directs**. Notamment :

- **TBF (The Business Fashion)** distribue **~200 marques de luxe** : Brunello Cucinelli,
  Tom Ford, AMI Paris, Rick Owens, Jacquemus, Acne Studios, Off-White, Comme des Garçons,
  Maison Margiela, Issey Miyake, Yohji Yamamoto, Prada, Gucci, Saint Laurent, Balenciaga,
  Bottega Veneta, Loewe, Lemaire, Toteme, The Row, Khaite, Cecilie Bahnsen, Stüssy, etc.

- **Kastner & Öhler** distribue ~150 marques : Polo Ralph Lauren, Boss, Tommy Hilfiger,
  Marc O'Polo, Drykorn, Closed, Joop!, Eterna, Schiesser, Falke, etc.

- **MUJI**, **Suitable**, **The Shirt Company**, **Birkenstock** sont mono-marque.

**Total estimé : ~250-350 marques uniques** accessibles depuis tes flux.

### Le composant TOUTES les marques doit les afficher TOUTES

`/marques` = **page index A-Z** générée automatiquement depuis la base de données.
Tout brand qui a au moins 1 produit en stock dans la base apparaît automatiquement.

Si demain TBF ajoute un nouveau designer (ex: Aimé Leon Dore), il apparaît **automatiquement**
dans `/marques/aime-leon-dore` sans intervention manuelle.

### Le mega menu (au survol) — 4 colonnes curaté

Le mega menu **NE liste pas les 300 marques** (illisible). Il affiche **les 16 marques
phares + un lien vers l'index complet**.

**Colonne 1 — Maisons de luxe**
```
Brunello Cucinelli              → /marques/brunello-cucinelli
Tom Ford                        → /marques/tom-ford
Rick Owens                      → /marques/rick-owens
Maison Margiela                 → /marques/maison-margiela
```

**Colonne 2 — Créateurs contemporains**
```
AMI Paris                       → /marques/ami-paris
Acne Studios                    → /marques/acne-studios
Jacquemus                       → /marques/jacquemus
Lemaire                         → /marques/lemaire
```

**Colonne 3 — Premium accessible**
```
The Shirt Company               → /marques/the-shirt-company
Suitable                        → /marques/suitable
Polo Ralph Lauren               → /marques/polo-ralph-lauren
Birkenstock                     → /marques/birkenstock
```

**Colonne 4 — Lifestyle & basiques**
```
MUJI                            → /marques/muji
Margaret Howell                 → /marques/margaret-howell
Boss                            → /marques/boss
Toteme                          → /marques/toteme
```

**Bandeau bas (sticky en bas du mega menu)** :
```
Voir toutes les marques (286)  →  /marques        [BIG LINK]
Marques d'ici · Genève                            → /marques/geneve     [NEW]
Marques émergentes                                → /marques/emergentes
```

Le compteur « 286 » est **dynamique** — il vient d'un `count` SQL sur la table `brands`.

### Page `/marques` — Index A-Z complet

```
┌─────────────────────────────────────────────────────┐
│ Toutes les marques                                   │
│ 286 maisons partenaires · 36 240 pièces             │
├─────────────────────────────────────────────────────┤
│ [Recherche : taper une marque...]                    │
├─────────────────────────────────────────────────────┤
│ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z │
├─────────────────────────────────────────────────────┤
│                                                       │
│ A                                                     │
│ • Acne Studios (124 pièces)                          │
│ • AMI Paris (87)                                     │
│ • Armani Exchange (45)                               │
│                                                       │
│ B                                                     │
│ • Balenciaga (38)                                    │
│ • Birkenstock (29)                                   │
│ • Boss (156)                                         │
│ • Bottega Veneta (23)                                │
│ • Brunello Cucinelli (51)                            │
│                                                       │
│ C                                                     │
│ • Cecilie Bahnsen (12)                               │
│ • Closed (43)                                        │
│ • Comme des Garçons (18)                             │
│ • CASAMODA (97)                                      │
│ ...                                                  │
└─────────────────────────────────────────────────────┘
```

### Code pour générer automatiquement la liste

```typescript
// app/marques/page.tsx
import { db } from '@/lib/db';

export default async function MarquesIndex() {
  // Récupérer toutes les marques avec un compte produits
  const brands = await db.brand.findMany({
    where: { product_count: { gt: 0 } },
    orderBy: { name: 'asc' },
    select: {
      slug: true,
      name: true,
      product_count: true,
      logo_url: true,
      source: true, // 'muji' | 'tbf' | 'shirt_co' | 'suitable' | 'ko' | ...
    },
  });

  // Grouper par première lettre
  const grouped = brands.reduce((acc, brand) => {
    const letter = brand.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(brand);
    return acc;
  }, {} as Record<string, typeof brands>);

  return (
    <div>
      <header className="px-6 py-5 border-b border-[#e8dfd0]">
        <h1 className="font-serif text-3xl text-[#2c2c2a]">Toutes les marques</h1>
        <p className="text-sm text-[#8a7a68] mt-1">
          {brands.length} maisons partenaires · {totalProducts.toLocaleString('fr-FR')} pièces
        </p>
      </header>

      <nav className="sticky top-0 bg-white px-6 py-3 border-b border-[#e8dfd0] overflow-x-auto">
        {Object.keys(grouped).sort().map(letter => (
          <a key={letter} href={`#${letter}`} className="inline-block mx-2 text-sm text-[#6e3b32]">
            {letter}
          </a>
        ))}
      </nav>

      <main className="px-6 py-6">
        {Object.keys(grouped).sort().map(letter => (
          <section key={letter} id={letter} className="mb-8">
            <h2 className="font-serif text-2xl text-[#2c2c2a] mb-3">{letter}</h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {grouped[letter].map(brand => (
                <li key={brand.slug}>
                  <a
                    href={`/marques/${brand.slug}`}
                    className="flex items-baseline justify-between py-2 px-3 hover:bg-[#faf6ee] rounded text-sm"
                  >
                    <span className="text-[#2c2c2a]">{brand.name}</span>
                    <span className="text-xs text-[#8a7a68]">{brand.product_count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
```

### Auto-discovery des nouvelles marques

Pour que toute nouvelle marque qui apparaît dans tes flux soit **automatiquement** ajoutée
au catalogue, mettre en place un **job quotidien** :

```typescript
// scripts/sync-brands.ts
import { fetchAwinFeed } from '@/lib/awin';

async function syncBrands() {
  const sources = ['muji', 'tbf', 'shirt_company', 'suitable', 'kastner_oehler'];

  for (const source of sources) {
    const products = await fetchAwinFeed(source);

    // Extraire les marques uniques
    const brandsInFeed = [...new Set(products.map(p => p.brand))];

    for (const brandName of brandsInFeed) {
      // Si la marque n'existe pas en base, la créer
      await db.brand.upsert({
        where: { name: brandName },
        create: {
          name: brandName,
          slug: slugify(brandName),
          source,
          product_count: products.filter(p => p.brand === brandName).length,
        },
        update: {
          product_count: products.filter(p => p.brand === brandName).length,
        },
      });
    }
  }
}

// À déclencher via Vercel Cron tous les jours à 4h
// vercel.json :
// { "crons": [{ "path": "/api/cron/sync-brands", "schedule": "0 4 * * *" }] }
```

### Page `/marques/[slug]` — Page d'une marque

URL : `/marques/brunello-cucinelli`, `/marques/aime-leon-dore`, etc.

Cette page est **générée dynamiquement** depuis la base. Elle affiche :

1. **Header** : logo + nom + courte description éditoriale + compteur produits
2. **Filtres latéraux** : palette Sanzō Wada / catégorie / prix / style
3. **Grille produits** : tous les produits de cette marque avec vraies images Awin

La description éditoriale peut être générée **automatiquement par GPT-4o** lors du premier
discovery de la marque :

```typescript
async function generateBrandDescription(brandName: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: `Tu es la styliste WADA. Écris une description courte (2 phrases, ton éditorial
        à la Suzy Menkes) pour la maison ${brandName}. Mentionne son fondateur si tu le sais,
        son univers stylistique, et un détail signature.`,
    }],
  });
  return res.choices[0].message.content!;
}
```

Coût négligeable : ~$0,001 par marque × 300 marques = $0,30 total, une fois.

---

## 7. « Lettres du dimanche »

URL : `/lettres-du-dimanche` (pas de mega menu, simple page)

Index des newsletters éditoriales — la « Lettre du dimanche » que tu écris chaque semaine.
Liste chronologique avec extraits.

Format de chaque entrée :
```
N°12 · 23 mai 2026
Pluie de Tokyo et le silence
Comment habiller la mélancolie urbaine sans tomber dans le cliché.
[Lire →]
```

---

## 8. « Index WADA » (signature éditoriale)

URL : `/index`

Le pendant WADA du « Lyst Index ». **Le rapport trimestriel** des palettes les plus
recherchées, des marques en hausse, des tenues les plus achetées.

C'est ta **signature éditoriale** qui te donne une autorité dans le secteur (presse mode,
investisseurs, partenaires).

Structure :
- Palettes les plus scannées ce trimestre
- Marques montantes
- Couleurs en hausse
- Best-sellers WADA

**Mise à jour** : tous les 3 mois.

---

## Code React — Composant Navigation

```tsx
// components/Navigation.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';

interface MegaMenuColumn {
  title: string;
  links: { label: string; href: string; badge?: string }[];
}

interface CategoryConfig {
  label: string;
  href: string;
  columns?: MegaMenuColumn[];
  footer?: { text: string; cta: string };
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: 'Vêtements',
    href: '/vetements',
    columns: [
      {
        title: 'Hauts',
        links: [
          { label: 'Tous les hauts', href: '/vetements/hauts' },
          { label: 'T-shirts', href: '/vetements/t-shirts' },
          { label: 'Chemises', href: '/vetements/chemises' },
          { label: 'Polos', href: '/vetements/polos' },
          { label: 'Pulls & cardigans', href: '/vetements/pulls-cardigans' },
          { label: 'Sweats & hoodies', href: '/vetements/sweats-hoodies' },
          { label: 'Robes', href: '/vetements/robes' },
          { label: 'Blouses', href: '/vetements/blouses' },
        ],
      },
      {
        title: 'Bas',
        links: [
          { label: 'Tous les bas', href: '/vetements/bas' },
          { label: 'Pantalons', href: '/vetements/pantalons' },
          { label: 'Jeans', href: '/vetements/jeans' },
          { label: 'Shorts', href: '/vetements/shorts' },
          { label: 'Jupes', href: '/vetements/jupes' },
          { label: 'Joggings', href: '/vetements/joggings' },
        ],
      },
      {
        title: 'Vestes & manteaux',
        links: [
          { label: 'Toutes les vestes', href: '/vetements/vestes' },
          { label: 'Blazers', href: '/vetements/blazers' },
          { label: 'Manteaux', href: '/vetements/manteaux' },
          { label: 'Vestes en jean', href: '/vetements/vestes-jean' },
          { label: 'Perfectos & cuir', href: '/vetements/perfectos-cuir' },
          { label: 'Trenchs', href: '/vetements/trenchs' },
          { label: 'Bombers', href: '/vetements/bombers' },
          { label: 'Doudounes', href: '/vetements/doudounes' },
        ],
      },
    ],
    footer: { text: 'Filtrable par palette Sanzō Wada', cta: 'Tous les vêtements →' },
  },
  // ... répéter pour Chaussures, Accessoires, Sacs, Bijoux, Marques
];

export function CategoryNav() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative">
      <nav
        className="flex items-center justify-center gap-8 px-7 py-3 bg-[#faf6ee] border-b border-[#e8dfd0] text-sm text-[#4a3d2a]"
        onMouseLeave={() => setHovered(null)}
      >
        {CATEGORIES.map(cat => (
          <Link
            key={cat.label}
            href={cat.href}
            className={`hover:text-[#6e3b32] transition-colors ${
              hovered === cat.label ? 'border-b-2 border-[#6e3b32] -mb-1 pb-1' : ''
            }`}
            onMouseEnter={() => setHovered(cat.label)}
          >
            {cat.label}
          </Link>
        ))}
        <Link href="/lettres-du-dimanche" className="hover:text-[#6e3b32]">
          Lettres du dimanche
        </Link>
        <Link href="/index" className="italic text-[#6e3b32]">
          Index WADA
        </Link>
      </nav>

      {hovered && (
        <div
          className="absolute left-0 right-0 top-full bg-white border-b border-[#e8dfd0] px-7 py-6 shadow-md z-50"
          onMouseEnter={() => setHovered(hovered)}
          onMouseLeave={() => setHovered(null)}
        >
          <MegaMenu category={CATEGORIES.find(c => c.label === hovered)!} />
        </div>
      )}
    </div>
  );
}

function MegaMenu({ category }: { category: CategoryConfig }) {
  if (!category.columns) return null;
  return (
    <div>
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
        {category.columns.map(col => (
          <div key={col.title}>
            <p className="text-[10px] tracking-widest uppercase text-[#8a7a68] mb-3">{col.title}</p>
            <ul className="space-y-1.5 text-sm">
              {col.links.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#2c2c2a] hover:text-[#6e3b32] transition-colors">
                    {link.label}
                    {link.badge && (
                      <span className="ml-2 text-[9px] bg-[#6e3b32] text-[#f4eee4] px-1.5 py-0.5 rounded">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {category.footer && (
        <div className="mt-5 pt-4 border-t border-[#e8dfd0] flex justify-between items-center max-w-6xl mx-auto">
          <p className="text-[11px] italic text-[#8a7a68]">{category.footer.text}</p>
          <Link href={category.href} className="text-xs text-[#6e3b32] hover:underline">
            {category.footer.cta}
          </Link>
        </div>
      )}
    </div>
  );
}
```

---

## Pages de catégorie — Structure

Chaque page de catégorie (ex: `/vetements/blazers`) doit avoir :

### En haut
- Breadcrumb : `Vêtements › Blazers`
- Titre : `Blazers`
- Sous-titre éditorial : *« Le tailoring qui structure la silhouette, en 2026 »*
- Nombre de produits trouvés : `42 blazers de 8 marques`

### Filtres latéraux (sticky sur desktop)
- **Palette Sanzō Wada** (multi-select) → filtre par palettes compatibles
- **Marque** (multi-select) → MUJI, TBF, AMI, etc.
- **Couleur** (swatches) → noir, blanc, beige, marine, etc.
- **Prix** (range slider) → ex: 0-150€, 150-400€, 400€+
- **Style** (multi-select) → minimaliste, romantique, etc. (depuis macro_style)
- **Genre** (femme/homme/mixte)

### Grille de produits
- 3-4 colonnes desktop, 2 mobile
- Cards avec : image, marque (uppercase), nom, prix, badge palette
- Au clic → page produit
- Pagination : 24 produits par page

### En bas
- Suggestion : « Tu cherches une tenue ? **Scanner une couleur** ou consulter les palettes »
- Footer standard

---

## Implémentation côté DB

Pour que les sous-catégories marchent, **chaque produit doit avoir un tag de catégorie** :

```typescript
interface ProductCategory {
  primary: 'vetements' | 'chaussures' | 'accessoires' | 'sacs' | 'bijoux';
  sub: string;  // ex: 'blazers', 'sneakers', 'colliers'
}

// Exemple :
const polo = {
  ...polo,
  category: { primary: 'vetements', sub: 'polos' },
};
```

Si pas déjà fait, **le script auto-tagging GPT-4o Vision** (déjà spec'd) peut ajouter ce tag
en même temps que le macro_style.

---

## SEO — Énorme bénéfice

Chaque sous-catégorie devient une page indexable :
- `wada.style/vetements/manteaux` → mot-clé « manteaux mode 2026 »
- `wada.style/marques/ami-paris` → mot-clé « AMI Paris boutique »
- `wada.style/chaussures/mocassins` → mot-clé « mocassins cuir homme »

Avec ~50 sous-catégories × ~10 marques + filtres palette, **WADA aura ~500-1000 pages
SEO-friendly** dès le lancement de cette nav.

C'est ce qui fait que **Lyst.com génère 50M+ visites/mois** : leur arborescence catégorielle
est leur premier acquisition channel.

---

## Mobile responsive — Drawer filtre catégorie (style Lyst)

Sur mobile (≤768px), la Bar 2 devient :

- Un **bouton « Filtres »** (icône ☰ ou « Filtrer ») affiché en sticky top
- Au tap → ouvre un **drawer plein écran** (slide depuis la gauche ou bottom sheet)
- Le drawer affiche le filtre catégorie avec **drill-down** + toggle genre

### Structure du drawer mobile

```
┌──────────────────────────────────────┐
│  ← Boutique          ●1       Effacer│  ← title = "Boutique" + compteur + clear
├──────────────────────────────────────┤
│  [ Femmes ]      [ Hommes ]          │  ← toggle genre (souligné = actif)
├──────────────────────────────────────┤
│  ◄ Toutes les catégories  ›  Chaussures │ ← breadcrumb drill-down
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Voir toutes les chaussures   ✓ │  │ ← "tout" sélectionnable
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Bottes                          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Mocassins & derbies             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Escarpins                       │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Sneakers                        │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Ballerines                      │  │
│  └────────────────────────────────┘  │
│                                       │
├──────────────────────────────────────┤
│  [ Annuler ]    [ Voir les éléments ]│  ← actions sticky bas
└──────────────────────────────────────┘
```

### Comportement
- Le toggle **Femmes / Hommes / Tous** filtre la liste affichée
- Tap sur une sous-catégorie → affiche les **sous-sous-catégories** si elles existent
  (ex: Bottes → Chelsea / Bottines / Cuissardes), sinon **applique le filtre et ferme le drawer**
- Le bouton **« Annuler »** ferme sans appliquer
- Le bouton **« Voir les éléments »** applique tous les filtres et ferme

### Code React du drawer

```tsx
// components/CategoryDrawer.tsx
'use client';
import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CategoryConfig[];
}

type Gender = 'femme' | 'homme' | 'tous';

export function CategoryDrawer({ open, onClose, categories }: Props) {
  const [gender, setGender] = useState<Gender>('tous');
  const [level, setLevel] = useState<'top' | 'sub'>('top');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (!open) return null;

  const currentList = level === 'top'
    ? categories
    : categories.find(c => c.label === activeCategory)?.columns?.flatMap(col => col.links) ?? [];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">

      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8dfd0]">
        <button
          onClick={() => level === 'sub' ? setLevel('top') : onClose()}
          className="text-[#4a3d2a]"
          aria-label={level === 'sub' ? 'Retour' : 'Fermer'}
        >
          {level === 'sub' ? <ArrowLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">Boutique</p>
          {activeFiltersCount > 0 && (
            <span className="text-[10px] bg-[#6e3b32] text-[#f4eee4] w-5 h-5 rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-[#6e3b32] underline"
        >
          Effacer
        </button>
      </div>

      <div className="px-4 py-3 border-b border-[#e8dfd0] flex gap-2 sticky top-0 bg-white z-10">
        {(['femme', 'homme', 'tous'] as Gender[]).map(g => (
          <button
            key={g}
            onClick={() => setGender(g)}
            className={`px-4 py-1.5 rounded-full text-xs ${
              gender === g
                ? 'bg-[#4a3d2a] text-[#f4eee4]'
                : 'bg-[#faf6ee] text-[#4a3d2a] border border-[#e8dfd0]'
            }`}
          >
            {g === 'femme' ? 'Femmes' : g === 'homme' ? 'Hommes' : 'Tous'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {level === 'top' && (
          <p className="text-xs text-[#8a7a68] uppercase tracking-wide py-3">
            Toutes les catégories
          </p>
        )}

        <ul className="space-y-1">
          {level === 'top' ? (
            categories.map((cat, i) => (
              <li key={cat.label}>
                <button
                  onClick={() => { setActiveCategory(cat.label); setLevel('sub'); }}
                  className="w-full flex items-center justify-between py-3 text-sm text-[#2c2c2a] border-b border-[#f3ece1]"
                >
                  <span>{cat.label}</span>
                  <span className="text-[#8a7a68]">›</span>
                </button>
              </li>
            ))
          ) : (
            <>
              <li>
                <a
                  href={`/${activeCategory?.toLowerCase()}?gender=${gender}`}
                  className="block py-3 text-sm text-[#2c2c2a] border-b border-[#f3ece1] font-medium"
                >
                  Voir tous les {activeCategory?.toLowerCase()}
                </a>
              </li>
              {(currentList as any[]).map((sub, i) => (
                <li key={sub.href}>
                  <a
                    href={`${sub.href}?gender=${gender}`}
                    className="block py-3 text-sm text-[#2c2c2a] border-b border-[#f3ece1]"
                  >
                    {sub.label}
                  </a>
                </li>
              ))}
            </>
          )}
        </ul>
      </div>

      <div className="flex gap-2 p-3 border-t border-[#e8dfd0]">
        <button
          onClick={onClose}
          className="flex-1 py-3 text-sm border border-[#d4ccc0] rounded text-[#4a3d2a]"
        >
          Annuler
        </button>
        <button
          onClick={() => {/* apply filters + close */}}
          className="flex-1 py-3 text-sm bg-[#4a3d2a] text-[#f4eee4] rounded"
        >
          Voir les éléments
        </button>
      </div>

    </div>
  );
}
```

### Bouton qui ouvre le drawer

À placer en sticky top sur les pages catégorie mobile :

```tsx
<button
  onClick={() => setDrawerOpen(true)}
  className="md:hidden sticky top-0 z-40 flex items-center gap-2 bg-[#faf6ee] border-b border-[#e8dfd0] px-4 py-3 w-full text-sm text-[#4a3d2a]"
>
  <Menu className="w-4 h-4" />
  Filtrer par catégorie
</button>
```

---

## Pages catégorie — Grille avec vraies images produits

URL : `/vetements`, `/vetements/blazers`, `/marques/ami-paris`, etc.

Chaque page de catégorie affiche **TOUS les produits matchant** en grille style Lyst,
**avec les vraies images** des flux d'affiliation (MUJI, TBF, Shirt Co, Suitable, K&Ö).

### Structure de la page

```
┌──────────────────────────────────────────────────┐
│ Nav principale (Bar 1)                            │
├──────────────────────────────────────────────────┤
│ Nav catégories (Bar 2) — Vêtements actif         │
├──────────────────────────────────────────────────┤
│ Breadcrumb : Accueil › Vêtements                  │
│ # Vêtements                                       │
│ 18 400 pièces de 8 marques partenaires            │
├──────────────────────────────────────────────────┤
│┌────────────┬─────────────────────────────────┐│
││ FILTRES     │ 1 247 résultats                  ││
││             │ ┌──────┬──────┬──────┬──────┐  ││
││ Palette     │ │image │image │image │image │  ││
││ ● ● ● ● ●   │ │MUJI  │AMI   │SHIRT │AMI   │  ││
││ + 342       │ │T-sh  │Chem  │Co Ch │Jean  │  ││
││             │ │19 €  │280 € │189 € │295 € │  ││
││ Marque      │ ├──────┼──────┼──────┼──────┤  ││
││ □ MUJI      │ │image │image │image │image │  ││
││ □ AMI       │ │BRUNE │CASA  │TOM F │MUJI  │  ││
││ □ Brunello  │ │...   │...   │...   │...   │  ││
││             │ └──────┴──────┴──────┴──────┘  ││
││ Prix        │                                  ││
││ Slider      │ Pagination 1 2 3 ... 39          ││
││             │                                  ││
││ Style       │                                  ││
││ Genre       │                                  ││
│└────────────┴─────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Composant React de la page catégorie

```tsx
// app/vetements/[[...sub]]/page.tsx (route catch-all)
import { ProductGrid } from '@/components/ProductGrid';
import { FilterSidebar } from '@/components/FilterSidebar';
import { Breadcrumb } from '@/components/Breadcrumb';

interface PageProps {
  params: { sub?: string[] };
  searchParams: {
    palette?: string;
    brand?: string;
    style?: string;
    gender?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const subCategory = params.sub?.[0]; // ex: 'blazers'

  // 1. Récupérer les produits depuis la base
  const { products, total } = await getProducts({
    category: 'vetements',
    sub_category: subCategory,
    palette: searchParams.palette?.split(','),
    brand: searchParams.brand?.split(','),
    style: searchParams.style?.split(','),
    gender: searchParams.gender,
    minPrice: parseInt(searchParams.minPrice ?? '0'),
    maxPrice: parseInt(searchParams.maxPrice ?? '5000'),
    sort: searchParams.sort ?? 'wada_relevance',
    page: parseInt(searchParams.page ?? '1'),
    perPage: 32,
  });

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Accueil', href: '/' },
        { label: 'Vêtements', href: '/vetements' },
        ...(subCategory ? [{ label: capitalize(subCategory), href: `/vetements/${subCategory}` }] : []),
      ]} />

      <div className="px-6 py-5 border-b border-[#e8dfd0]">
        <h1 className="font-serif text-3xl text-[#2c2c2a]">
          {subCategory ? capitalize(subCategory) : 'Vêtements'}
        </h1>
        <p className="text-sm text-[#8a7a68] italic mt-1">
          {total.toLocaleString('fr-FR')} pièces de {countBrands(products)} marques partenaires
        </p>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-0">
        <aside className="hidden md:block border-r border-[#e8dfd0] p-4 bg-[#fbf8f1]">
          <FilterSidebar
            category="vetements"
            availableFilters={await getAvailableFilters('vetements', subCategory)}
            activeFilters={searchParams}
          />
        </aside>

        <main className="px-5 py-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[#8a7a68]">{total.toLocaleString('fr-FR')} résultats</p>
            <SortDropdown current={searchParams.sort} />
          </div>

          <ProductGrid products={products} />

          <Pagination total={total} perPage={32} currentPage={parseInt(searchParams.page ?? '1')} />
        </main>
      </div>
    </div>
  );
}
```

### Composant ProductGrid (la grille avec vraies images)

```tsx
// components/ProductGrid.tsx
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  brand: string;
  name: string;
  price: number;
  image_url: string;        // ← VRAIE image du flux Awin (MUJI, TBF, etc.)
  affiliate_url: string;
  color_hex: string;
  palette_ids: string[];
  slug: string;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map(product => (
        <Link key={product.id} href={`/produit/${product.slug}`} className="group">
          <div className="aspect-square bg-[#faf6ee] rounded-md overflow-hidden relative mb-2">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              unoptimized
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <span
              className="absolute top-2 left-2 w-3 h-3 rounded-full border border-black/15"
              style={{ background: product.color_hex }}
              title="Couleur dominante"
            />
            {product.palette_ids.length > 0 && (
              <span className="absolute top-2 right-2 text-[9px] bg-white/95 text-[#6e3b32] px-1.5 py-0.5 rounded">
                {product.palette_ids.length} palette{product.palette_ids.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-[#8a7a68]">{product.brand}</p>
          <p className="text-sm text-[#2c2c2a] leading-tight">{product.name}</p>
          <p className="text-sm font-medium text-[#2c2c2a] mt-0.5">
            {product.price.toLocaleString('fr-FR')} €
          </p>
        </Link>
      ))}
    </div>
  );
}
```

### Important — le champ `image_url`

`product.image_url` pointe vers la **vraie image** depuis Awin / le flux marchand. Exemples
de domaines :

- `productserve.com` (Awin général)
- `muji.eu`, `muji.com`
- `thebusinessfashion.com`
- `suitable.fr`
- `kastner-oehler.com`
- `cdn.shopify.com`

Tous ces domaines doivent être whitelistés dans `next.config.mjs` (déjà fait dans le brief
flat lay) :

```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.productserve.com' },
    { protocol: 'https', hostname: '**.muji.eu' },
    { protocol: 'https', hostname: '**.muji.com' },
    { protocol: 'https', hostname: '**.thebusinessfashion.com' },
    { protocol: 'https', hostname: '**.suitable.fr' },
    { protocol: 'https', hostname: '**.kastner-oehler.com' },
    { protocol: 'https', hostname: 'cdn.shopify.com' },
    // ... autres marques
  ],
},
```

### Page « Marques » avec logos + signature

URL : `/marques`

Au lieu d'une grille de produits, c'est une **grille de marques** avec leur logo + une
sélection signature.

```tsx
// components/BrandGrid.tsx
export function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {brands.map(brand => (
        <Link key={brand.slug} href={`/marques/${brand.slug}`} className="group">
          <div className="aspect-square bg-[#faf6ee] rounded-md flex items-center justify-center mb-2 p-6">
            <Image
              src={brand.logo_url}
              alt={brand.name}
              width={150}
              height={150}
              className="object-contain"
            />
          </div>
          <p className="text-sm font-medium text-[#2c2c2a]">{brand.name}</p>
          <p className="text-xs text-[#8a7a68]">{brand.product_count} pièces</p>
        </Link>
      ))}
    </div>
  );
}
```

### Page « Marque détail » (`/marques/ami-paris`)

Affiche tous les produits de cette marque, avec un header éditorial :

```
┌──────────────────────────────────────────────┐
│  [Logo AMI Paris]                             │
│                                               │
│  AMI Paris                                    │
│  Maison parisienne fondée par Alexandre       │
│  Mattiussi en 2011. Tailoring contemporain    │
│  avec une touche d'irrévérence.               │
│                                               │
│  423 pièces sur WADA                          │
├──────────────────────────────────────────────┤
│  [Grille de tous les produits AMI]            │
└──────────────────────────────────────────────┘
```

---

## Checklist Claude Code

```
□ Créer components/CategoryNav.tsx avec le code ci-dessus
□ Configurer les 6 catégories avec sous-catégories (objet CATEGORIES)
□ Intégrer CategoryNav dans app/layout.tsx juste sous le header existant
□ Créer les pages dynamiques :
  - app/vetements/page.tsx (index)
  - app/vetements/[sub]/page.tsx (sous-catégorie dynamique)
  - app/chaussures/page.tsx + [sub]/page.tsx
  - app/accessoires/page.tsx + [sub]/page.tsx
  - app/sacs/page.tsx + [sub]/page.tsx
  - app/bijoux/page.tsx + [sub]/page.tsx
  - app/marques/page.tsx + [slug]/page.tsx
  - app/lettres-du-dimanche/page.tsx
  - app/index/page.tsx
□ Ajouter colonne category sur la table products en DB
□ Migrer les produits existants avec leurs catégories (script SQL ou re-tagging)
□ Filtres latéraux (composant FilterSidebar)
□ Mobile : drawer dédié pour la Bar 2
□ Tests :
  - Survol fonctionne sur desktop
  - Indicateur d'item actif fonctionne
  - Sous-catégories filtrent correctement les produits
  - Pages indexables (meta title + description par sous-catégorie)
  - Mobile drawer accessible et lisible
```

**Durée estimée : 6-8h de dev** (un peu plus que les 4-6h initiales si on inclut toutes les
pages dynamiques + les filtres + le mobile).

---

## Pourquoi cette navigation est cruciale

**Sans Bar 2** (situation actuelle) :
- Le client doit OBLIGATOIREMENT passer par les palettes pour acheter
- Si quelqu'un veut juste un blazer noir, il est perdu sur WADA
- SEO catastrophique : 1 seule page indexable (/) au lieu de centaines

**Avec Bar 2** (cette spec) :
- Le client peut entrer par n'importe quel angle : palette, type de produit, marque, éditorial
- WADA récupère **tout le trafic SEO** des recherches mode classiques
- Le site devient une **vraie plateforme mode**, pas juste un gadget éditorial

C'est **probablement la feature qui aura le plus gros impact business** des 3 derniers
mois de specs. Mets-la en priorité 1 après les bugs critiques actuels.
