# WADA — Quick view produit V2 (modale premium)

Refonte de la modale quick view qui s'ouvre quand on clique sur un produit dans la grille.

**Durée dev estimée** : 3-4h.

---

## Le problème actuel

La modale actuelle prend la moitié basse de l'écran, affiche peu d'infos, n'offre **aucune
différenciation WADA**. C'est une fiche Amazon basique.

Tu rates ainsi le **moment de vérité** : quand le client clique sur un produit, c'est là que
WADA doit briller.

---

## La règle d'or

> La quick view ne montre pas un produit. Elle propose **un univers** autour du produit.

C'est-à-dire : la photo + le prix, oui — mais aussi **les palettes WADA compatibles** et
**les tenues qu'on peut composer autour**.

---

## 1. Structure de la modale

```
┌────────────────────────────────────────────────────┐
│                                          [X]        │
├──────────────────────┬─────────────────────────────┤
│                      │  Chaussures · Sneakers       │
│   [Photo principale] │  SALOMON                      │
│                      │  XT-4 OG shell-skeleton       │
│   [Thumbnails: img,  │                                │
│    360°, zoom, +]    │  292,11 €                     │
│                      │  Livraison directe par TBF    │
│                      │  ──────────────────────────   │
│                      │  COMPATIBLE AVEC PALETTES     │
│                      │  [Pluie de Tokyo]              │
│                      │  [Studio danois]               │
│                      │  [Béton & Lin]                 │
│                      │                                │
│                      │  POINTURE                      │
│                      │  39 40 [41] 42 ̶4̶3̶ 44 45        │
│                      │                                │
│                      │  [♡] [Acheter sur TBF ↗]       │
│                      │  [Composer] [Similaires]       │
│                      │                                │
│                      │  ✓ Lien partenaire Awin        │
│                      │  ✓ Paiement sécurisé           │
│                      │  ✓ Retours gratuits            │
│                      │                                │
│                      │  3 TENUES WADA AVEC CETTE PIÈCE│
│                      │  [Pluie de Tokyo · 824€]       │
│                      │  [Studio danois · 657€]        │
│                      └─────────────────────────────────┘
```

---

## 2. Composant principal

```tsx
// components/product/QuickViewModal.tsx

'use client';
import { useState, useEffect } from 'react';
import { X, Heart, ExternalLink, Shirt, Shuffle, Check, Shield, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  productId: string;
  onClose: () => void;
}

export function QuickViewModal({ productId, onClose }: Props) {
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/full`)
      .then(r => r.json())
      .then(setProduct);
  }, [productId]);

  if (!product) return <div>Chargement...</div>;

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-6"
         onClick={onClose}>

      <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[85vh]
                      grid md:grid-cols-[1.1fr_1fr] overflow-hidden"
           onClick={e => e.stopPropagation()}>

        <button onClick={onClose} aria-label="Fermer"
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95
                           flex items-center justify-center text-[#1a1a1a] hover:bg-white">
          <X className="w-3.5 h-3.5" />
        </button>

        <ImageSide product={product}
                   selectedIdx={selectedImage}
                   onSelect={setSelectedImage} />

        <MetaSide product={product}
                  selectedSize={selectedSize}
                  setSelectedSize={setSelectedSize}
                  liked={liked}
                  setLiked={setLiked} />

      </div>

    </div>
  );
}
```

---

## 3. Le côté image (gauche)

```tsx
function ImageSide({ product, selectedIdx, onSelect }: Props) {
  const gradient = `linear-gradient(180deg, #fff 0%, ${product.dominant_color_hex}25 100%)`;

  return (
    <div className="relative p-8 flex items-center justify-center min-h-[380px]"
         style={{ background: gradient }}>

      {/* Thumbnails sticky gauche */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        {product.images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-10 h-10 rounded-md bg-white border ${
              selectedIdx === i ? 'border-[#1a1a1a] border-[1.5px]' : 'border-[#d4ccc0]'
            } overflow-hidden`}
          >
            <Image src={img.thumb_url} alt="" width={40} height={40} className="object-cover w-full h-full" />
          </button>
        ))}

        {/* Vue 360° si disponible */}
        {product.has_360 && (
          <button className="w-10 h-10 rounded-md bg-white border border-[#d4ccc0] flex items-center justify-center">
            <RotateCw className="w-4 h-4 text-[#8a7a68]" />
          </button>
        )}
      </div>

      {/* Image principale */}
      <div className="w-4/5 aspect-square bg-white rounded-xl shadow-md flex items-center justify-center">
        <Image
          src={product.images[selectedIdx].url}
          alt={product.name}
          width={400}
          height={400}
          className="object-contain w-full h-full p-4"
          unoptimized
        />
      </div>

    </div>
  );
}
```

---

## 4. Le côté métadonnées (droite)

```tsx
function MetaSide({ product, selectedSize, setSelectedSize, liked, setLiked }) {
  return (
    <div className="px-7 py-6 overflow-y-auto max-h-[85vh]">

      <p className="text-[10px] tracking-widest uppercase text-[#8a7a68] mb-3">
        {product.category} · {product.subcategory}
      </p>

      <p className="text-[10px] tracking-[0.2em] uppercase text-[#6e3b32] font-medium mb-1">
        {product.brand}
      </p>

      <h2 className="font-serif text-2xl text-[#1a1a1a] leading-tight mb-3">
        {product.name}
      </h2>

      <div className="flex justify-between items-baseline pb-3 mb-3 border-b border-[#e8dfd0]">
        <p className="text-2xl font-medium text-[#1a1a1a]">
          {product.price.toLocaleString('fr-FR')} €
        </p>
        <span className="text-[10px] text-[#5a5a5a]">
          Livraison directe par {product.source_name}
        </span>
      </div>

      {/* Palettes WADA compatibles — LA FEATURE UNIQUE */}
      <p className="text-[9px] tracking-[0.18em] uppercase text-[#8a7a68] font-medium mb-2">
        Compatible avec ces palettes WADA
      </p>
      <div className="flex gap-2 mb-4">
        {product.matching_palettes.slice(0, 3).map(p => (
          <Link
            key={p.id}
            href={`/palettes/${p.slug}`}
            className="flex-1 p-2 bg-[#faf6ee] rounded-lg hover:bg-[#f0e9d8] transition-colors"
          >
            <div className="flex h-4 rounded overflow-hidden mb-1">
              {p.colors.map(c => (
                <span key={c} className="flex-1" style={{ background: c }} />
              ))}
            </div>
            <p className="text-[10px] font-medium text-[#1a1a1a] leading-tight">{p.name}</p>
            <p className="text-[8px] tracking-wider uppercase text-[#8a7a68] mt-0.5">{p.origin}</p>
          </Link>
        ))}
      </div>

      {/* Pointures (ou tailles) */}
      <p className="text-[9px] tracking-[0.18em] uppercase text-[#8a7a68] font-medium mb-2">
        {product.size_label || 'Taille'}
      </p>
      <div className="flex gap-1 flex-wrap mb-4">
        {product.sizes.map(size => (
          <button
            key={size.value}
            onClick={() => setSelectedSize(size.value)}
            disabled={!size.available}
            className={`w-9 h-8 border rounded text-xs ${
              selectedSize === size.value
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : size.available
                ? 'bg-white border-[#d4ccc0] text-[#1a1a1a] hover:border-[#1a1a1a]'
                : 'text-[#d4ccc0] line-through cursor-not-allowed border-[#e8dfd0]'
            }`}
          >
            {size.value}
          </button>
        ))}
      </div>

      {/* Actions principales */}
      <div className="grid grid-cols-[48px_1fr] gap-1.5 mb-2">
        <button
          onClick={() => setLiked(!liked)}
          className={`rounded-full flex items-center justify-center transition-colors ${
            liked
              ? 'bg-[#6e3b32] text-white border-[#6e3b32]'
              : 'bg-white border-[0.5px] border-[#d4ccc0] text-[#6e3b32] hover:bg-[#faf6ee]'
          }`}
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
        </button>
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener"
          className="bg-[#1a1a1a] text-white rounded-full py-3 text-sm flex items-center justify-center gap-2 hover:bg-[#2c2c2a]"
          onClick={() => trackAffiliateClick(product, 'quickview')}
        >
          Acheter sur {product.source_name}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Actions secondaires */}
      <div className="flex gap-1.5 mb-4">
        <Link
          href={`/composer?piece=${product.id}`}
          className="flex-1 py-2 border border-[#d4ccc0] rounded-full text-[11px] bg-white
                     flex items-center justify-center gap-1.5 hover:bg-[#faf6ee]"
        >
          <Shirt className="w-3 h-3" />
          Composer une tenue
        </Link>
        <Link
          href={`/produits/similaires?ref=${product.id}`}
          className="flex-1 py-2 border border-[#d4ccc0] rounded-full text-[11px] bg-white
                     flex items-center justify-center gap-1.5 hover:bg-[#faf6ee]"
        >
          <Shuffle className="w-3 h-3" />
          Voir similaires
        </Link>
      </div>

      {/* Réassurance Awin */}
      <div className="bg-[#faf6ee] p-3 rounded-lg mb-4 space-y-1">
        <p className="text-[11px] text-[#1a1a1a] flex items-center gap-1.5">
          <Check className="w-3 h-3 text-[#6e3b32]" />
          Lien partenaire Awin · prix identique chez le marchand
        </p>
        <p className="text-[11px] text-[#1a1a1a] flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-[#6e3b32]" />
          Paiement sécurisé sur {product.source_name}
        </p>
        <p className="text-[11px] text-[#1a1a1a] flex items-center gap-1.5">
          <Truck className="w-3 h-3 text-[#6e3b32]" />
          Livraison 2-5 jours · Retours gratuits
        </p>
      </div>

      {/* Tenues WADA suggérées — LA SECONDE FEATURE UNIQUE */}
      <div className="bg-[#fefaf2] p-3.5 rounded-xl">
        <p className="text-[9px] tracking-[0.18em] uppercase text-[#8a7a68] font-medium mb-2">
          3 tenues WADA avec cette pièce
        </p>
        <div className="grid grid-cols-2 gap-2">
          {product.suggested_outfits.slice(0, 4).map(outfit => (
            <Link
              key={outfit.id}
              href={`/tenue/${outfit.slug}`}
              className="bg-white rounded-lg p-2 hover:shadow-sm transition-shadow"
            >
              <div className="flex h-3 rounded overflow-hidden mb-1.5">
                {outfit.palette_colors.map(c => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="text-[10px] font-medium text-[#1a1a1a]">{outfit.palette_name}</p>
              <p className="text-[8px] text-[#8a7a68] mt-0.5">
                {outfit.pieces_count} pièces · {outfit.total_price} €
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
```

---

## 5. API endpoints nécessaires

### `/api/products/[id]/full`

Renvoie le produit avec toutes les infos enrichies WADA :

```typescript
interface ProductFull {
  id: string;
  brand: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  size_label?: string;  // "Pointure" pour chaussures, "Taille" pour vêtements

  images: { url: string; thumb_url: string }[];
  has_360: boolean;

  dominant_color_hex: string;
  source_name: string;        // "The Business Fashion"
  affiliate_url: string;

  sizes: { value: string; available: boolean }[];

  matching_palettes: {        // ← LA VALEUR WADA
    id: string;
    slug: string;
    name: string;
    origin: string;
    colors: string[];
  }[];

  suggested_outfits: {        // ← LA SECONDE VALEUR WADA
    id: string;
    slug: string;
    palette_name: string;
    palette_colors: string[];
    pieces_count: number;
    total_price: number;
  }[];
}
```

```typescript
// app/api/products/[id]/full/route.ts

export async function GET(req: Request, { params }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { images: true, sizes: true },
  });

  // Récupérer les 3 palettes matching (déjà calculées en cache)
  const matchingPalettes = await db.palette.findMany({
    where: { id: { in: product.matching_palette_ids } },
    select: { id: true, slug: true, name: true, origin: true, colors: true },
    take: 3,
  });

  // Récupérer 3 tenues qui contiennent cette pièce
  const suggestedOutfits = await db.outfit.findMany({
    where: { pieces: { some: { product_id: product.id } } },
    include: { palette: true, pieces: true },
    take: 3,
    orderBy: { wada_score: 'desc' },  // les meilleures tenues d'abord
  });

  return Response.json({
    ...product,
    matching_palettes: matchingPalettes,
    suggested_outfits: suggestedOutfits.map(formatOutfitSuggestion),
  });
}
```

---

## 6. Animation d'ouverture

Pour l'effet premium :

```css
.quickview-modal {
  animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.quickview-backdrop {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

L'ouverture doit être **fluide et calme**, pas brutale.

---

## 7. Comportement mobile

Sur mobile (≤ 768px), la modale **prend tout l'écran** :

- Layout passe en 1 colonne (image au-dessus, infos en dessous)
- L'image fait 50vh
- Le scroll est interne à la modale
- Le bouton X reste accessible en sticky top

```tsx
<div className="fixed inset-0 z-50 md:p-6 md:flex md:items-center md:justify-center bg-black/45">
  <div className="bg-white md:rounded-3xl w-full h-full md:h-auto md:max-w-4xl
                  md:max-h-[85vh] md:grid md:grid-cols-[1.1fr_1fr] overflow-y-auto">
    {/* contenu */}
  </div>
</div>
```

---

## 8. Les 8 améliorations clés (récap)

1. **Modale flottante centrée** avec overlay sombre — focus immédiat
2. **Image héros** dans card blanche avec ombre douce + fond dégradé selon couleur dominante
3. **4 thumbnails à gauche** : photo / 360° / zoom / autres angles
4. **Sélecteur de pointures** complet avec sélection visible et indispos barrés
5. **« Compatible avec ces palettes WADA »** : 3 mini-cards palettes — feature unique
6. **Bouton acheter + cœur + 2 secondaires** : « Composer » + « Voir similaires »
7. **Bloc réassurance Awin** : 3 lignes avec icônes (lien / paiement / livraison)
8. **« 3 tenues WADA avec cette pièce »** : grid de 2-4 tenues prêtes — la conversion massive

---

## 9. Métriques de succès attendues

| Métrique | Avant | Après cible |
|---|---|---|
| Temps moyen sur quick view | ~6 sec | ~15-20 sec |
| Taux de clic « Acheter » | ~3% | ~10% |
| Taux de clic « Voir tenue » | 0% (n'existe pas) | ~15-25% |
| Taux d'ajout aux favoris | ~2% | ~8% |

**La feature « 3 tenues WADA »** est ce qui va le plus transformer le funnel — elle redirige
les utilisateurs vers les pages tenue, qui sont les pages avec le **meilleur AOV** (panier
moyen) parce qu'on achète 5 pièces au lieu d'1.

---

## 10. Plan d'implémentation

**Phase 1 — La modale + image (1h)**
- Composant `<QuickViewModal />`
- Côté image avec thumbnails et image principale

**Phase 2 — Méta + actions (1h)**
- Côté droit complet avec sizes, palettes, actions
- Sticky behavior + scroll interne

**Phase 3 — Backend `/api/products/[id]/full` (1h)**
- Endpoint qui agrège produit + palettes matching + tenues suggérées
- Cache des matching_palettes au moment de l'import des produits

**Phase 4 — Animations + mobile (30 min)**
- Animation d'ouverture cubic-bezier
- Adaptation mobile plein écran

**Total : 3-4h** sur 1 session.

---

## 11. Pourquoi cette refonte est cruciale

La quick view est **le moment de vérité** de WADA :

- C'est là que le client **décide d'acheter** (ou pas)
- C'est là que WADA peut **se différencier** d'un Amazon basique
- C'est là que **la valeur unique** (palettes + tenues) doit ressortir

**Aujourd'hui** : la modale ressemble à n'importe quel concurrent → aucune raison de revenir
sur WADA plutôt que d'aller direct sur The Business Fashion.

**Après cette refonte** : le client comprend qu'il **gagne quelque chose** à passer par WADA :
- Il voit les palettes compatibles
- Il voit les tenues prêtes
- Il a une raison de **rester** dans l'univers WADA au lieu de partir chez le marchand

**Effet attendu** : +30% de conversion sur les clics affiliés, +60% de pages vues par session.

---

## 12. À envoyer au codeur

Ce fichier + les 5 specs existantes. Donne-le-lui en disant simplement :

> *« Refonte la quick view selon le brief
> `public/hero/WADA-quickview-produit-V2-spec.md`. La feature la plus importante
> est la section "3 tenues WADA avec cette pièce" qui redirige vers les pages
> tenue. C'est ce qui multiplie le panier moyen. »*

Il a tout le code prêt à coller. 3-4h de dev.
