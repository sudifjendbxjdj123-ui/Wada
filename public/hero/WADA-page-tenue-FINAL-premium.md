# WADA — Page tenue FINAL premium (combinaison meilleurs éléments)

Spec définitive combinant les meilleurs éléments des 2 maquettes :
- L'approche éditoriale (hero photo, contexte saison/météo, communauté)
- L'approche transactionnelle (trust pills, prix prominent, Klarna, alternatives par pièce)

**Durée dev estimée** : 8-10h (sur la base des composants déjà spec'd).

---

## Architecture complète

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER global (logo + search + heart + bag)                  │
├─────────────────────────────────────────────────────────────┤
│  Breadcrumb : Accueil > Mes tenues > Look du 24 Mai          │
├──────────────────────┬──────────────────────────────────────┤
│                      │ LOOK DU 24 MAI                        │
│                      │                                        │
│  [PHOTO ÉDITORIALE   │ Élégance naturelle                    │
│   PORTRAIT 4/5]      │                                        │
│                      │ Un look chic et décontracté, parfait  │
│  [Thumbs vert: 3D,   │ pour une journée en ville…           │
│   photos 4]          │                                        │
│                      │ 🌸 Printemps · 🌡 18-23°C ·          │
│                      │ 📍 Genève · ✨ Décontracté chic       │
│                      │                                        │
│                      │ ┌─────────────────────────────────┐  │
│                      │ │ ✦ Cette tenue sélectionnée pour │  │
│                      │ │   vous selon votre style et la  │  │
│                      │ │   météo de demain               │  │
│                      │ └─────────────────────────────────┘  │
│                      │                                        │
│                      │ ┌────┬────────────────┬────┬───┐    │
│                      │ │ 🖼 │ Chemise lin    │ S ▾│ ♡ │    │
│                      │ │    │ Massimo Dutti  │    │   │    │
│                      │ │    │ 79,95 €        │    │   │    │
│                      │ ├────┼────────────────┼────┼───┤    │
│                      │ │ 🖼 │ Pantalon       │ M ▾│ ♡ │    │
│                      │ │    │ Zara · 49,95 € │    │   │    │
│                      │ ├────┼────────────────┼────┼───┤    │
│                      │ │ 🖼 │ Ceinture       │ 85▾│ ♡ │    │
│                      │ │    │ & Other · 39 € │    │   │    │
│                      │ ├────┼────────────────┼────┼───┤    │
│                      │ │ 🖼 │ Sac cuir       │    │ ♡ │    │
│                      │ │    │ Polène · 320 € │    │   │    │
│                      │ ├────┼────────────────┼────┼───┤    │
│                      │ │ 🖼 │ Sandales       │ 37▾│ ♡ │    │
│                      │ │    │ Aeyde · 210 €  │    │   │    │
│                      │ └────┴────────────────┴────┴───┘    │
│                      │                                        │
│                      │ Total du look       698,90 €          │
│                      │ Livraison & retours gratuits          │
│                      │                                        │
│                      │ ┌─────────────────────────────────┐  │
│                      │ │ AJOUTER LE LOOK AU PANIER   🛍  │  │
│                      │ └─────────────────────────────────┘  │
│                      │                                        │
│                      │   Payez en 3 fois sans frais          │
│                      │   avec ⬛ Klarna                      │
└──────────────────────┴──────────────────────────────────────┘
│                                                                │
│  COMPLÉTEZ VOTRE LOOK                                          │
│  ◀  [🕶 Ray-Ban]  [⌚ Cluse]  [💎 Agmes]  [🔗 Maria]  [💧] ▶│
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  POURQUOI ON AIME CE LOOK                                      │
│                                                                │
│  [Photo détail]  ✨ Élégant et intemporel                     │
│                  Des pièces classiques que vous porterez       │
│                  saison après saison.                          │
│                                                                │
│                  ☁ Confort avant tout                          │
│                  Des matières naturelles et des coupes        │
│                  fluides…                                       │
│                                                                │
│                  🤝 Facile à assortir                          │
│                  Chaque pièce se marie parfaitement…           │
│                                              [Photo plan large]│
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  DÉJÀ ADOPTÉ PAR NOTRE COMMUNAUTÉ           Voir plus d'avis →│
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ 👤 Camille  ⭐⭐⭐⭐│  │ 👤 Julie    ⭐⭐⭐⭐│  │ 👤 Sophie  ⭐⭐⭐⭐⭐│ │
│  │ Acheté ce look  │  │ Acheté ce look  │  │ Acheté ce look  │ │
│  │                 │  │                 │  │                 │ │
│  │ "Confortable    │  │ "Les pièces     │  │ "Parfait pour   │ │
│  │  et chic, je le │  │  sont de très   │  │  le bureau      │ │
│  │  porte tout le  │  │  bonne qualité, │  │  comme pour le  │ │
│  │  temps !"       │  │  je recommande."│  │  week-end."     │ │
│  │                 │  │                 │  │                 │ │
│  │  [Photo Camille]│  │  [Photo Julie]  │  │  [Photo Sophie] │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  POURQUOI ACHETER CHEZ WADA ?                                  │
│                                                                │
│  ✨ Sélection      🚚 Livraison      🔒 Paiement     🤝 Marques│
│  personnalisée     rapide & offerte  sécurisé        de confiance│
│  Des looks         Livraison         Payez en        Des marques│
│  choisis pour      gratuite et       toute sécurité  premium    │
│  vous              retours sous      en 3 fois sans  sélection.│
│                    30 jours          frais                      │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│  NE MANQUEZ AUCUNE INSPIRATION                                 │
│  Recevez nos nouveaux looks et conseils style chaque semaine.  │
│  [_______________ email _________________] [ S'INSCRIRE ]      │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Hero — Photo éditoriale + colonne droite

### Layout desktop : 2 colonnes (1/2 ratio)
### Layout mobile : empilé (photo full-width au-dessus du panneau droit)

```tsx
// app/tenue/[slug]/page.tsx

export default async function TenuePage({ params }: Props) {
  const outfit = await getOutfit(params.slug);
  const weather = await getWeatherForCity(outfit.target_city);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
      <Breadcrumb items={[
        { label: 'Accueil', href: '/' },
        { label: 'Mes tenues', href: '/mes-tenues' },
        { label: outfit.name, href: `/tenue/${outfit.slug}` },
      ]} />

      <div className="grid lg:grid-cols-2 gap-8 mt-4">
        <OutfitHeroGallery outfit={outfit} />
        <OutfitDetailPanel outfit={outfit} weather={weather} />
      </div>

      <CompletezVotreLook outfit={outfit} />
      <PourquoiOnAimeCeLook outfit={outfit} />
      <CommunityReviews outfit={outfit} />
      <TrustPillars />
      <NewsletterSignup />
    </div>
  );
}
```

---

## 2. Composant Hero Gallery (gauche)

```tsx
// components/tenue/OutfitHeroGallery.tsx

'use client';
import { useState } from 'react';
import Image from 'next/image';
import { RotateCw, Heart } from 'lucide-react';

export function OutfitHeroGallery({ outfit }: { outfit: Outfit }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  return (
    <div className="grid grid-cols-[60px_1fr] gap-3">

      {/* Thumbnails verticaux */}
      <div className="flex flex-col gap-2">
        {outfit.editorial_photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={`aspect-[4/5] rounded-md overflow-hidden border-2 ${
              selectedIdx === i ? 'border-[#1a1a1a]' : 'border-transparent'
            }`}
          >
            <Image
              src={photo.thumb_url}
              alt=""
              width={60}
              height={75}
              className="object-cover w-full h-full"
            />
          </button>
        ))}

        {outfit.has_3d && (
          <button className="aspect-[4/5] rounded-md border-2 border-gray-200 bg-white flex items-center justify-center text-xs text-gray-500">
            <RotateCw className="w-4 h-4" />
            3D
          </button>
        )}
      </div>

      {/* Photo principale */}
      <div className="relative aspect-[4/5] bg-[#f8f8f8] rounded-2xl overflow-hidden">
        <Image
          src={outfit.editorial_photos[selectedIdx].url}
          alt={outfit.name}
          fill
          className="object-cover"
          priority
        />

        {/* Boutons flottants */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"
          aria-label={liked ? 'Retirer' : 'Aimer'}
        >
          <Heart
            className="w-4 h-4 text-[#1a1a1a]"
            fill={liked ? '#1a1a1a' : 'none'}
          />
        </button>

        {outfit.has_3d && (
          <button className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/95 text-xs flex items-center gap-1.5">
            <RotateCw className="w-3 h-3" />
            3D
          </button>
        )}
      </div>

    </div>
  );
}
```

---

## 3. Composant Panel Détail (droite)

```tsx
// components/tenue/OutfitDetailPanel.tsx

import { Sparkles, ShoppingBag } from 'lucide-react';

export function OutfitDetailPanel({ outfit, weather }: Props) {
  return (
    <div>

      {/* Eyebrow */}
      <p className="text-[11px] tracking-[0.2em] uppercase text-[#6e3b32] font-medium mb-2">
        Look du {formatDate(outfit.created_at)}
      </p>

      {/* Titre */}
      <h1 className="font-serif text-4xl text-[#1a1a1a] mb-3 leading-tight">
        {outfit.name}
      </h1>

      {/* Description courte */}
      <p className="text-sm text-[#5a5a5a] mb-5 leading-relaxed">
        {outfit.short_description}
      </p>

      {/* Tags contextuels */}
      <div className="flex flex-wrap gap-2 mb-5">
        <ContextTag icon="🌸" label={outfit.season} />
        <ContextTag icon="🌡" label={`${weather.temp_min}-${weather.temp_max}°C`} />
        <ContextTag icon="📍" label={outfit.target_city} />
        <ContextTag icon="✨" label={outfit.style_label} />
      </div>

      {/* Badge "Sélectionné pour vous" */}
      <div className="bg-[#fef3e8] border border-[#f0d8b8] rounded-lg p-3 mb-6 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-[#6e3b32] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#4a3d2a] leading-relaxed">
          Cette tenue a été sélectionnée pour vous basée sur votre style et la météo de demain
        </p>
      </div>

      {/* Liste des pièces avec sélecteur taille */}
      <PiecesList pieces={outfit.pieces} />

      {/* Total + livraison */}
      <div className="flex justify-between items-baseline mt-6 mb-4 pb-4 border-b border-[#e8dfd0]">
        <div>
          <p className="text-sm text-[#5a5a5a]">Total du look</p>
          <p className="text-xs text-[#2a7a3a] mt-0.5">Livraison & retours gratuits</p>
        </div>
        <p className="font-serif text-3xl text-[#1a1a1a]">
          {outfit.total_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </p>
      </div>

      {/* CTA principal */}
      <button className="w-full bg-[#1a1a1a] text-white rounded-lg py-4 text-sm tracking-wide font-medium flex items-center justify-center gap-3 hover:bg-[#2c2c2a] transition-colors">
        AJOUTER LE LOOK AU PANIER
        <ShoppingBag className="w-4 h-4" />
      </button>

      {/* Klarna */}
      <p className="text-xs text-center text-[#5a5a5a] mt-3 flex items-center justify-center gap-1.5">
        Payez en 3 fois sans frais avec
        <span className="bg-[#ffa8c5] text-[#1a1a1a] px-2 py-0.5 rounded font-bold text-xs">
          Klarna.
        </span>
      </p>

    </div>
  );
}

function ContextTag({ icon, label }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#d4ccc0] rounded-full text-xs text-[#1a1a1a]">
      <span>{icon}</span>
      {label}
    </span>
  );
}
```

---

## 4. Composant PiecesList (les 5 pièces)

```tsx
// components/tenue/PiecesList.tsx

'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';

export function PiecesList({ pieces }: { pieces: Piece[] }) {
  const [sizes, setSizes] = useState<Record<string, string>>(
    Object.fromEntries(pieces.map(p => [p.id, p.default_size || '']))
  );
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="grid grid-cols-[56px_1fr_auto_auto] gap-3 items-center"
        >
          {/* Image */}
          <div className="w-14 h-14 bg-[#f8f8f8] rounded-md overflow-hidden">
            <Image
              src={piece.image_url}
              alt={piece.name}
              width={56}
              height={56}
              className="object-contain w-full h-full p-1"
              unoptimized
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <p className="text-sm text-[#1a1a1a] leading-tight">{piece.name}</p>
            <p className="text-xs text-[#5a5a5a] mt-0.5">
              {piece.brand} · {piece.price.toFixed(2)} €
            </p>
          </div>

          {/* Sélecteur taille */}
          {piece.sizes && piece.sizes.length > 0 && (
            <select
              value={sizes[piece.id]}
              onChange={e => setSizes({ ...sizes, [piece.id]: e.target.value })}
              className="px-2 py-1.5 border border-[#d4ccc0] rounded text-xs bg-white min-w-[44px]"
            >
              {piece.sizes.map(s => (
                <option key={s.value} value={s.value} disabled={!s.available}>
                  {s.value}
                </option>
              ))}
            </select>
          )}

          {/* Cœur favoris individuel */}
          <button
            onClick={() => setLiked({ ...liked, [piece.id]: !liked[piece.id] })}
            className="w-7 h-7 flex items-center justify-center"
            aria-label="Aimer cette pièce"
          >
            <Heart
              className="w-4 h-4 text-[#1a1a1a]"
              fill={liked[piece.id] ? '#1a1a1a' : 'none'}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 5. Complétez votre look (carousel d'accessoires)

```tsx
// components/tenue/CompletezVotreLook.tsx

'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

export function CompletezVotreLook({ outfit }: Props) {
  const [accessories, setAccessories] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`/api/outfits/${outfit.id}/accessories`)
      .then(r => r.json())
      .then(setAccessories);
  }, [outfit.id]);

  return (
    <section className="my-12">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#1a1a1a] font-medium mb-5">
        Complétez votre look
      </h2>

      <div className="relative">
        <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#faf6ee]">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 overflow-x-auto">
          {accessories.map(item => (
            <div key={item.id} className="bg-[#f8f8f8] rounded-xl p-4 relative">
              <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <Heart className="w-3.5 h-3.5" />
              </button>
              <div className="aspect-square flex items-center justify-center">
                <Image src={item.image_url} alt={item.name} width={120} height={120} className="object-contain" />
              </div>
              <p className="text-sm text-[#1a1a1a] mt-3">{item.name}</p>
              <p className="text-xs text-[#5a5a5a]">{item.brand}</p>
              <p className="text-sm font-medium text-[#1a1a1a] mt-1">
                {item.price.toFixed(2)} €
              </p>
            </div>
          ))}
        </div>

        <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
```

---

## 6. Section "Pourquoi on aime ce look"

```tsx
// components/tenue/PourquoiOnAimeCeLook.tsx

import { Sparkles, Cloud, Handshake } from 'lucide-react';

const REASONS = [
  {
    icon: Sparkles,
    title: 'Élégant et intemporel',
    text: 'Des pièces classiques que vous porterez saison après saison.',
  },
  {
    icon: Cloud,
    title: 'Confort avant tout',
    text: 'Des matières naturelles et des coupes fluides pour vous sentir bien toute la journée.',
  },
  {
    icon: Handshake,
    title: 'Facile à assortir',
    text: 'Chaque pièce se marie parfaitement avec votre garde-robe existante.',
  },
];

export function PourquoiOnAimeCeLook({ outfit }: Props) {
  return (
    <section className="bg-[#f5efe2] rounded-3xl p-8 my-12">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#1a1a1a] font-medium mb-8">
        Pourquoi on aime ce look
      </h2>

      <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6 items-center">

        {/* Photo détail gauche */}
        <div className="aspect-[4/5] bg-white rounded-2xl overflow-hidden">
          <Image
            src={outfit.detail_photo_url}
            alt=""
            width={300}
            height={375}
            className="object-cover w-full h-full"
          />
        </div>

        {/* 3 raisons */}
        <div className="space-y-6">
          {REASONS.map(reason => {
            const Icon = reason.icon;
            return (
              <div key={reason.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#6e3b32]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-[#1a1a1a] mb-1">
                    {reason.title}
                  </p>
                  <p className="text-xs text-[#5a5a5a] leading-relaxed">
                    {reason.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Photo plan large droit */}
        <div className="aspect-[4/5] bg-white rounded-2xl overflow-hidden">
          <Image
            src={outfit.full_shot_url}
            alt=""
            width={300}
            height={375}
            className="object-cover w-full h-full"
          />
        </div>

      </div>
    </section>
  );
}
```

---

## 7. Section Communauté (avis clients)

```tsx
// components/tenue/CommunityReviews.tsx

export function CommunityReviews({ outfit }: Props) {
  const reviews = await db.review.findMany({
    where: { outfit_id: outfit.id, has_photo: true },
    take: 3,
    orderBy: { helpful_count: 'desc' },
  });

  return (
    <section className="my-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xs tracking-[0.2em] uppercase text-[#1a1a1a] font-medium">
          Déjà adopté par notre communauté
        </h2>
        <Link href={`/tenue/${outfit.slug}/avis`} className="text-xs text-[#6e3b32] underline">
          Voir plus d'avis →
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-[#faf6ee] rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white overflow-hidden">
                <Image src={review.avatar_url} alt="" width={40} height={40} className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">{review.author_name}</p>
                <p className="text-[10px] text-[#5a5a5a]">Acheté ce look</p>
              </div>
              <Stars rating={review.rating} className="ml-auto" />
            </div>

            <p className="text-sm text-[#3c3c3c] italic mb-4 leading-relaxed">
              "{review.text}"
            </p>

            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white">
              <Image src={review.photo_url} alt="" width={200} height={266} className="object-cover w-full h-full" />
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 8. Trust Pillars

```tsx
// components/tenue/TrustPillars.tsx

import { UserCheck, Truck, Lock, ShieldCheck } from 'lucide-react';

const PILLARS = [
  {
    icon: UserCheck,
    title: 'Sélection personnalisée',
    text: 'Des looks choisis pour vous selon votre style et vos préférences.',
  },
  {
    icon: Truck,
    title: 'Livraison rapide & offerte',
    text: 'Livraison gratuite et retours sous 30 jours.',
  },
  {
    icon: Lock,
    title: 'Paiement sécurisé',
    text: 'Payez en toute sécurité en 3 fois sans frais.',
  },
  {
    icon: ShieldCheck,
    title: 'Marques de confiance',
    text: 'Des marques premium sélectionnées avec soin.',
  },
];

export function TrustPillars() {
  return (
    <section className="my-12">
      <h2 className="text-xs tracking-[0.2em] uppercase text-[#1a1a1a] font-medium mb-6">
        Pourquoi acheter chez WADA ?
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {PILLARS.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#faf6ee] flex items-center justify-center mx-auto mb-3">
                <Icon className="w-5 h-5 text-[#1a1a1a]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-[#1a1a1a] mb-1">{pillar.title}</p>
              <p className="text-xs text-[#5a5a5a] leading-relaxed">{pillar.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

---

## 9. Newsletter Signup

```tsx
// components/tenue/NewsletterSignup.tsx

export function NewsletterSignup() {
  return (
    <section className="bg-[#faf6ee] rounded-2xl p-6 my-12 flex items-center justify-between gap-6">
      <div>
        <h3 className="text-xs tracking-[0.2em] uppercase font-medium text-[#1a1a1a] mb-1">
          Ne manquez aucune inspiration
        </h3>
        <p className="text-xs text-[#5a5a5a]">
          Recevez nos nouveaux looks et conseils style chaque semaine.
        </p>
      </div>

      <div className="flex gap-2 flex-1 max-w-md">
        <input
          type="email"
          placeholder="Votre adresse e-mail"
          className="flex-1 px-4 py-3 bg-white border-0 rounded-lg text-sm"
        />
        <button className="px-5 py-3 bg-[#1a1a1a] text-white rounded-lg text-xs tracking-wider">
          S'INSCRIRE
        </button>
      </div>
    </section>
  );
}
```

---

## 10. API endpoints à créer

```typescript
// /api/outfits/[id]/accessories
// Renvoie les 5 accessoires complémentaires pour cette tenue
// Algo : palette compatible + catégorie "Accessoires/Sacs/Bijoux"
//        + non déjà présent dans la tenue

// /api/outfits/[id]/reviews
// Renvoie les avis communauté pour cette tenue
// Filtre : has_photo=true, ordre helpful_count DESC

// /api/weather/[city]
// Renvoie la météo pour la ville cible
// Cache 6h pour éviter rate limits OpenWeather
```

---

## 11. Migration DB nécessaire

```sql
-- Champs météo et contexte sur outfits
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS target_city TEXT DEFAULT 'Genève';
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS style_label TEXT;

-- Photos éditoriales
CREATE TABLE outfit_photos (
  id SERIAL PRIMARY KEY,
  outfit_id INT NOT NULL REFERENCES outfits(id),
  url TEXT NOT NULL,
  thumb_url TEXT,
  type TEXT NOT NULL,  -- 'main' | 'detail' | 'full' | '3d'
  position INT
);

-- Avis communauté
CREATE TABLE outfit_reviews (
  id SERIAL PRIMARY KEY,
  outfit_id INT NOT NULL REFERENCES outfits(id),
  user_id INT REFERENCES users(id),
  author_name TEXT,
  avatar_url TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  photo_url TEXT,
  has_photo BOOLEAN GENERATED ALWAYS AS (photo_url IS NOT NULL) STORED,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_outfit ON outfit_reviews(outfit_id);
CREATE INDEX idx_reviews_helpful ON outfit_reviews(helpful_count DESC);
```

---

## 12. Checklist d'implémentation

```
□ Migrations DB (outfit_photos + outfit_reviews + champs météo)
□ Breadcrumb composant
□ OutfitHeroGallery (photo principale + thumbnails verticaux)
□ OutfitDetailPanel (titre + tags + badge sélection + pieces)
□ PiecesList (avec sélecteurs taille + cœurs individuels)
□ Tags contextuels (saison/météo/ville/style)
□ Badge "Sélectionné pour vous" avec fond sandy
□ CTA "Ajouter le look au panier" + mention Klarna
□ CompletezVotreLook (carousel d'accessoires)
□ PourquoiOnAimeCeLook (2 photos + 3 raisons)
□ CommunityReviews (3 cards avec photos)
□ TrustPillars (4 colonnes)
□ NewsletterSignup
□ API /api/outfits/[id]/accessories
□ API /api/outfits/[id]/reviews
□ API /api/weather/[city] avec cache
□ Mobile-first responsive :
  - 2 colonnes hero → empilé
  - Tags wrappent
  - Carousel accessoires scrollable horizontal
  - Pourquoi on aime → 1 colonne (photos en haut/bas)
  - Communauté → carousel horizontal
  - Trust pillars → 2 colonnes mobile
```

---

## 13. Les 12 leviers de conversion intégrés

1. **Photo éditoriale grande** (modèle qui porte la tenue) → projection immédiate
2. **Tags contextuels** (saison, météo, ville, style) → pertinence personnalisée
3. **Badge "Sélectionné pour vous"** → personnalisation perçue
4. **Sélecteurs de taille par pièce** → pas besoin de quitter la page
5. **Cœur favoris par pièce ET sur la tenue entière** → 2 niveaux d'engagement
6. **Total prominent avec livraison gratuite** → transparence
7. **CTA noir grande taille** → conversion forte
8. **Klarna mention** → option de paiement flexible (très important Gen Z + Millennials)
9. **Complétez votre look** → AOV ×1,3 (upsell accessoires)
10. **Pourquoi on aime ce look** → justifie le prix par les bénéfices
11. **Avis communauté avec photos** → social proof visuel
12. **4 trust pillars** → réduit l'anxiété d'achat

---

## 14. Pourquoi cette spec va transformer WADA

**Aujourd'hui** ta page tenue ressemble à un assemblage technique.

**Demain** elle ressemblera à une page produit Net-a-Porter / Mr Porter — éditoriale,
contextuelle, sociale, transactionnelle.

C'est la page qui justifie un panier moyen de **600-800 €** au lieu de 50-100 €.

C'est aussi la page qui te permet d'attirer **les vrais clients premium** : ceux qui achètent
une tenue complète, pas juste un t-shirt à 19 €.

---

## En une phrase

> **Une page tenue WADA n'est pas un panier — c'est une recommandation personnalisée
> que le client accepte ou rejette.**

À implémenter en priorité après les fixes critiques (object-contain, restauration home).
