# WADA — FIX URGENT : photos produits croppées

## Le problème

Les images produits sur le catalogue sont **affichées zoomées et croppées**.
On ne voit pas le produit entier — juste un détail (lacets, partie d'une semelle, etc.).

**Cause** : utilisation de `object-fit: cover` au lieu de `object-fit: contain`.

## Comparaison

### ❌ Actuel (mauvais)

```tsx
<Image
  src={product.image_url}
  alt={product.name}
  fill
  className="object-cover"  // ← FAUX
/>
```

Résultat : on voit la chaussure zoomée, croppée par les bords, fond
souvent invisible. Le client ne sait pas ce qu'il achète.

### ✅ Attendu (style Suitable.fr / Mr Porter / Net-a-Porter)

```tsx
<div className="aspect-square bg-[#f8f8f8] flex items-center justify-center p-6">
  <Image
    src={product.image_url}
    alt={product.name}
    width={400}
    height={400}
    className="object-contain w-full h-full"
    unoptimized
  />
</div>
```

Résultat : la chaussure entière est visible, centrée, avec de l'air autour.
Fond gris pâle uniforme. Le client voit immédiatement le produit complet.

---

## Les 4 règles à appliquer PARTOUT sur les cards produits

### Règle 1 — `object-contain` partout

Remplace **toutes les occurrences** de `object-cover` par `object-contain`
dans les composants de cards produits :

- `components/category/ProductCard.tsx`
- `components/boutique/BoutiqueNouveautes.tsx`
- `components/product/QuickViewModal.tsx`
- `components/tenue/PieceCard.tsx`
- Tout autre composant qui affiche une image produit

### Règle 2 — Padding interne 16-24px

Chaque image doit avoir **du padding autour d'elle** dans sa card :

```tsx
<div className="aspect-square bg-[#f8f8f8] p-5 flex items-center justify-center">
  <Image ... className="object-contain w-full h-full" />
</div>
```

Le padding (`p-5` = 20px) crée l'air autour du produit. Sans ça, l'image
touche les bords et c'est moche.

### Règle 3 — Fond gris très pâle uniforme

Pas de dégradé sur les cards de catalogue. Juste un **fond gris pâle uniforme** :

```css
background: #f8f8f8;   /* gris très clair, presque blanc */
```

(Le dégradé subtil peut rester sur la page tenue ou le quick view modal,
mais pour le catalogue grid il faut de la **cohérence visuelle absolue** :
toutes les chaussures sur le même fond, peu importe leur couleur.)

### Règle 4 — Ratio carré strict

Toutes les images doivent avoir un ratio `aspect-square` (1:1) — la chaussure
peut donc être centrée et avoir le même cadre que toutes les autres.

---

## Le composant ProductCard corrigé

```tsx
// components/category/ProductCard.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);

  return (
    <Link href={`/produit/${product.slug}`} className="group block">

      {/* Image card avec fond uniforme + padding + contain */}
      <div className="aspect-square bg-[#f8f8f8] rounded-xl overflow-hidden relative
                      p-5 flex items-center justify-center mb-3
                      transition-shadow group-hover:shadow-md">

        <Image
          src={product.image_url}
          alt={product.name}
          width={400}
          height={400}
          className="object-contain w-full h-full transition-transform
                     group-hover:scale-105"
          unoptimized
        />

        {/* Pastilles palettes */}
        <div className="absolute top-3 left-3 flex gap-1">
          {product.matching_palettes.slice(0, 3).map((p, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full border border-black/15"
              style={{ background: p.dominant_color }}
            />
          ))}
        </div>

        {/* Cœur favoris */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setLiked(!liked);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white
                     flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Favoris"
        >
          <Heart
            className="w-4 h-4 text-[#1a1a1a]"
            fill={liked ? '#1a1a1a' : 'none'}
          />
        </button>
      </div>

      {/* Info card */}
      <div className="px-1">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#8a7a68] mb-0.5">
          {product.brand}
        </p>
        <p className="text-xs text-[#1a1a1a] mb-1.5 line-clamp-2 leading-tight">
          {product.name}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#1a1a1a]">
            {product.price.toLocaleString('fr-FR')} €
          </p>
          {product.matching_palettes.length > 0 && (
            <span className="text-[10px] text-[#6e3b32]">
              {product.matching_palettes.length} palettes
            </span>
          )}
        </div>
      </div>

    </Link>
  );
}
```

---

## Cas spécifique : si l'image source est petite

Si une image fait 400×400 mais que ta card fait 500×500, **l'image va sembler petite**.

**Solution** : ajuster le padding pour que l'image occupe ~70-80% de la card,
peu importe sa taille originale.

```tsx
<div className="aspect-square bg-[#f8f8f8] rounded-xl p-[12%] flex items-center justify-center">
  <img src={product.image_url} className="object-contain w-full h-full" />
</div>
```

Le `p-[12%]` garantit qu'il y a toujours 12% de padding de chaque côté,
peu importe la taille finale de la card.

---

## Checklist pour le codeur

```
□ Identifier toutes les occurrences de "object-cover" dans le projet
  → ~5-10 fichiers probablement

□ Pour chaque ProductCard / image produit :
  - Remplacer object-cover → object-contain
  - Ajouter p-5 (ou p-[12%]) sur le container
  - Vérifier que le fond est #f8f8f8 uniforme
  - aspect-square sur le container

□ Tester sur 5 catégories différentes :
  - Sneakers (chaussures plates et larges)
  - Bottes (verticales, grandes)
  - T-shirts (carrés, pliés)
  - Sacs (variables)
  - Bijoux (très petits)

□ Vérifier qu'aucune image n'est croppée
□ Vérifier que toutes les images ont le même cadre visuel
□ Vérifier mobile : ratio carré préservé
```

---

## Pourquoi cette règle est cruciale

**Net-a-Porter, Mr Porter, Suitable, Aesop, COS** — toutes les marques mode premium
utilisent le même pattern :

1. **Fond uniforme gris pâle** (#f8f8f8 ou #fafafa)
2. **Produit entier visible, centré**
3. **Padding généreux** autour du produit
4. **Ratio carré strict**

C'est ce qui donne **l'effet catalogue éditorial** au lieu d'un effet Amazon zoomé.

Cette correction toute simple va **transformer immédiatement la perception** de WADA :
de "site mal fait" à "vrai catalogue mode".

---

## Durée

**5-15 minutes** côté codeur. C'est un fix CSS, pas une refonte.

---

**À envoyer au codeur dès maintenant** comme correction prioritaire. C'est probablement
le bug le plus visible et le plus gênant pour la conversion actuellement.
