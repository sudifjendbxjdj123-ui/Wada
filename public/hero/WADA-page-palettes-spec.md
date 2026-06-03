# WADA — Page Palettes /palettes (refonte selon maquette éditoriale)

Spec complète pour la page index des 348 palettes Sanzō Wada.

**Durée dev estimée** : 5-7h.
**URL** : `/palettes`
**Image de référence** : maquette dans `/public/hero/` (page avec vase crème + nuanciers en éventail).

---

## Architecture de la page

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (commun)                                          │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────┐  ┌────────────────────────┐    │
│  │ ← RETOUR              │  │  [HERO IMAGE]          │    │
│  │                       │  │                          │    │
│  │ Quelle combinaison    │  │  Vase crème + fleurs    │    │
│  │ vous parle ?          │  │  séchées + nuanciers    │    │
│  │                       │  │  cartonnés en éventail  │    │
│  │ Découvrez des         │  │                          │    │
│  │ harmonies de couleurs │  │                          │    │
│  │ pensées pour vos      │  │                          │    │
│  │ tenues parfaites.     │  │                          │    │
│  └──────────────────────┘  └────────────────────────┘    │
│                                                            │
│  ┌─────────────────────┐  ┌──────────────────────────┐   │
│  │ 🔍 Rechercher...    │  │ Trier par : Numéro    ▼│   │
│  └─────────────────────┘  └──────────────────────────┘   │
│                                                            │
│  [Toutes] [Neutres] [Chaudes] [Froides] [Naturelles]      │
│  [Vifs] [Pastels] [Sombres]                                │
│                                                            │
│  348 palettes trouvées · Sanzo Wada 1933       Vue: [⊞][≡]│
│                                                            │
│  ┌────┬────┬────┬────┬────┐                               │
│  │ P1 │ P2 │ P3 │ P4 │ P5 │  ← grille 5 colonnes          │
│  ├────┼────┼────┼────┼────┤                               │
│  │ P6 │ P7 │ P8 │ P9 │P10 │                               │
│  ├────┼────┼────┼────┼────┤                               │
│  │... │... │... │... │... │                               │
│  └────┴────┴────┴────┴────┘                               │
│                                                            │
│          [Voir plus (298 restantes)]                       │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │ ✦ L'harmonie des couleurs, pensée pour vous.     │    │
│  │                                                    │    │
│  │ Nos palettes...                                    │    │
│  │                                                    │    │
│  │ [Découvrir ma palette sur mesure →]               │    │
│  │                                                    │    │
│  │  Harmonie · Polyvalence · Saisons · Inspiration  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
├──────────────────────────────────────────────────────────┤
│  FOOTER (commun)                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Layout principal

```tsx
// app/palettes/page.tsx
import { PalettesHero } from '@/components/palettes/PalettesHero';
import { PalettesFilters } from '@/components/palettes/PalettesFilters';
import { PalettesGrid } from '@/components/palettes/PalettesGrid';
import { PalettesInfoCard } from '@/components/palettes/PalettesInfoCard';
import { Footer } from '@/components/Footer';

export default function PalettesPage() {
  return (
    <div className="bg-[#f5efe2] min-h-screen">
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <PalettesHero />
        <PalettesFilters />
        <PalettesGrid />
        <PalettesInfoCard />
      </main>
      <Footer />
    </div>
  );
}
```

**Fond global** : `#f5efe2` (crème WADA) — identique à la page Styliste pour cohérence.

---

## 2. Hero éditorial

```tsx
// components/palettes/PalettesHero.tsx
import Image from 'next/image';
import { BackButton } from '@/components/styliste/BackButton';

export function PalettesHero() {
  return (
    <section className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-12 items-center">

      <div className="pt-4">
        <BackButton />

        <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05] text-[#1a1a1a] mt-10 mb-5">
          Quelle combinaison<br/>
          vous parle ?
        </h1>

        <p className="text-sm text-[#5a5a5a] max-w-md leading-relaxed">
          Découvrez des harmonies de couleurs pensées pour vos tenues parfaites.
        </p>
      </div>

      <div className="relative aspect-[5/4] lg:aspect-[4/3]">
        <Image
          src="/hero/palettes-hero-vase-nuanciers.jpg"
          alt="Vase de céramique crème avec fleurs séchées et nuanciers de couleurs"
          fill
          className="object-contain object-right"
          priority
        />
      </div>

    </section>
  );
}
```

### L'image hero à générer

**Prompt Flux Pro** :

```
Editorial still life photography, top angle, soft natural daylight casting subtle window
shadows. On a cream linen background: a tall sand-colored ceramic round vase with dried
pampas grass and small flowers in earthy tones, positioned on the left. To the right of
the vase, a cascading arrangement of large fabric color swatches fanned out like cards,
each in a different muted color: cream, sage green, dusty blue, navy, terracotta, taupe,
deep forest green. The swatches overlap slightly. Composition: minimal, breathing space,
Japanese aesthetic, Wes Anderson symmetry, warm cream tones. No text, no people,
no models. 4:3 aspect ratio. Photorealistic. Natural daylight. Editorial fashion magazine
style.
```

Coût : ~$0,04 sur Replicate Flux Pro.
À stocker : `/public/hero/palettes-hero-vase-nuanciers.jpg`

---

## 3. Search bar + tri

```tsx
// components/palettes/PalettesSearch.tsx
'use client';
import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export function PalettesSearch({
  query, onQueryChange, sortBy, onSortChange,
}: Props) {
  return (
    <div className="grid lg:grid-cols-[1fr_220px] gap-3 mb-5">

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a68]" />
        <input
          type="search"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          placeholder="Rechercher une palette (bleu, couleur, pastel, automne...)"
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#1a1a1a]/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3b32]/20"
        />
      </div>

      <div className="relative">
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value)}
          className="w-full appearance-none pl-5 pr-10 py-3.5 bg-white border border-[#1a1a1a]/10 rounded-full text-sm focus:outline-none cursor-pointer"
        >
          <option value="numero">Trier par : Numéro</option>
          <option value="popularite">Trier par : Popularité</option>
          <option value="alpha">Trier par : A-Z</option>
          <option value="recent">Trier par : Récent</option>
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a68] pointer-events-none" />
      </div>

    </div>
  );
}
```

---

## 4. Chips filtres (Toutes / Neutres / Chaudes / ...)

```tsx
// components/palettes/PaletteFilterChips.tsx
'use client';

const FILTERS = [
  { value: 'toutes', label: 'Toutes' },
  { value: 'neutres', label: 'Neutres' },
  { value: 'chaudes', label: 'Chaudes' },
  { value: 'froides', label: 'Froides' },
  { value: 'naturelles', label: 'Naturelles' },
  { value: 'vifs', label: 'Vifs' },
  { value: 'pastels', label: 'Pastels' },
  { value: 'sombres', label: 'Sombres' },
];

export function PaletteFilterChips({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`px-4 py-2 rounded-full text-xs transition-colors ${
            active === f.value
              ? 'bg-[#1a1a1a] text-white border border-[#1a1a1a]'
              : 'bg-transparent text-[#1a1a1a] border border-[#1a1a1a]/15 hover:bg-white'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
```

**Détail** : actif = **noir rempli** (pas bordeaux comme « Surprends-moi »). Ici le bordeaux est réservé aux actions, le noir aux filtres.

---

## 5. Header de résultats + toggle vue

```tsx
// components/palettes/PalettesResultsHeader.tsx
import { Grid3x3, List } from 'lucide-react';

export function PalettesResultsHeader({
  total, viewMode, onViewModeChange,
}: Props) {
  return (
    <div className="flex justify-between items-center mb-6">
      <p className="text-xs text-[#5a5a5a]">
        <span className="font-medium text-[#1a1a1a]">{total} palettes trouvées</span>
        {' '}·{' '}
        D'après le dictionnaire de palettes Sanzo Wada (1933)
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#5a5a5a]">Vue :</span>
        <div className="flex bg-white rounded-md p-0.5 border border-[#1a1a1a]/10">
          <button
            onClick={() => onViewModeChange('grid')}
            aria-label="Vue grille"
            className={`p-1.5 rounded ${
              viewMode === 'grid' ? 'bg-[#1a1a1a] text-white' : 'text-[#5a5a5a]'
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            aria-label="Vue liste"
            className={`p-1.5 rounded ${
              viewMode === 'list' ? 'bg-[#1a1a1a] text-white' : 'text-[#5a5a5a]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Card de palette

C'est l'élément CENTRAL — il doit être beau et performant. Il sera affiché ~300 fois sur cette page.

```tsx
// components/palettes/PaletteCard.tsx
'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState } from 'react';

interface Palette {
  id: string;
  slug: string;
  name: string;          // "Brume du matin"
  origin: string;        // "SCANDINAVE" / "FRANÇAISE" / "JAPONAISE"
  colors: string[];      // ["#a8b5c0", "#3c4d5e", "#7a8a98", "#e3d8c8"]
  is_liked?: boolean;
}

export function PaletteCard({ palette }: { palette: Palette }) {
  const [liked, setLiked] = useState(palette.is_liked ?? false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !liked;
    setLiked(newState);
    await fetch(`/api/palettes/${palette.id}/like`, {
      method: newState ? 'POST' : 'DELETE',
    });
  };

  return (
    <Link
      href={`/palettes/${palette.slug}`}
      className="group block bg-white rounded-xl overflow-hidden border border-[#1a1a1a]/5 hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[5/4]">
        <div className="absolute inset-0 flex">
          {palette.colors.map((color, i) => (
            <div
              key={i}
              className="flex-1 transition-transform group-hover:scale-y-105 origin-bottom"
              style={{ background: color }}
            />
          ))}
        </div>

        <button
          onClick={handleLike}
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: liked ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.85)',
          }}
        >
          <Heart
            className="w-3.5 h-3.5 text-white"
            fill={liked ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="p-3">
        <p className="font-serif text-base text-[#1a1a1a] leading-tight">
          {palette.name}
        </p>
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#8a7a68] mt-1">
          {palette.origin}
        </p>
      </div>
    </Link>
  );
}
```

**Détails importants** :
- Les bandes de couleurs occupent ~70% de la card, le nom prend ~30%
- Le cœur en haut à droite a un **fond noir 85%** (pas blanc) pour ressortir sur toutes les couleurs (vue dans la maquette)
- Au hover, les bandes de couleur **s'étirent légèrement vers le haut** (`scale-y-105`) — effet vivant
- Le nom de palette est en **serif** (cohérent avec le titre éditorial)
- L'origine en **uppercase letter-spacing très large** (rappel des labels éditoriaux)

---

## 7. Grille de palettes

```tsx
// components/palettes/PalettesGrid.tsx
'use client';
import { useState } from 'react';
import { PaletteCard } from './PaletteCard';

export function PalettesGrid({ palettes }: { palettes: Palette[] }) {
  const [shown, setShown] = useState(24);
  const visible = palettes.slice(0, shown);
  const remaining = palettes.length - shown;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {visible.map(palette => (
          <PaletteCard key={palette.id} palette={palette} />
        ))}
      </div>

      {remaining > 0 && (
        <div className="flex justify-center mb-12">
          <button
            onClick={() => setShown(s => s + 24)}
            className="px-6 py-2.5 bg-[#6e3b32] text-white rounded-full text-xs hover:bg-[#5a2f28] transition-colors"
          >
            Voir plus ({remaining} restantes)
          </button>
        </div>
      )}
    </>
  );
}
```

**Pagination** : « Voir plus » charge **24 palettes à la fois** au lieu de pagination classique — UX plus moderne. Le bouton « Voir plus » est en **bordeaux** (action utilisateur).

**Performance** : pour les 348 palettes, c'est OK de tout charger en mémoire au début. Le rendu est virtualisable si besoin avec `react-window` (à n'envisager que si problème de perf détecté).

---

## 8. Info card du bas

```tsx
// components/palettes/PalettesInfoCard.tsx
import { Sparkles, Sun, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';

const MINI_FEATURES = [
  { icon: Sparkles, title: 'Harmonie',    text: 'Équilibre visuel parfait' },
  { icon: Sun,      title: 'Polyvalence', text: 'Facile à associer en toutes occasions' },
  { icon: Calendar, title: 'Saisons',     text: 'Adaptée à toutes les saisons' },
  { icon: Heart,    title: 'Inspiration', text: 'Pensée pour votre style unique' },
];

export function PalettesInfoCard() {
  return (
    <section className="bg-white rounded-2xl p-8 mb-12">
      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-center">

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-serif text-xl text-[#1a1a1a] leading-tight mb-2">
              L'harmonie des couleurs, pensée pour vous.
            </p>
            <p className="text-xs text-[#5a5a5a] leading-relaxed mb-4 max-w-sm">
              Nos palettes sont le résultat de plus d'un siècle de recherches
              sur les couleurs et les tendances de mode.
            </p>
            <Link
              href="/styliste"
              className="inline-block bg-[#6e3b32] text-white px-5 py-2 rounded-full text-xs hover:bg-[#5a2f28] transition-colors"
            >
              Découvrir ma palette sur mesure →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {MINI_FEATURES.map(feat => {
            const Icon = feat.icon;
            return (
              <div key={feat.title}>
                <Icon className="w-4 h-4 text-[#6e3b32] mb-2" strokeWidth={1.5} />
                <p className="text-xs font-medium text-[#1a1a1a] mb-0.5">{feat.title}</p>
                <p className="text-[11px] text-[#5a5a5a] leading-tight">{feat.text}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
```

---

## 9. Composant orchestrateur (la page complète)

```tsx
// app/palettes/page.tsx
import { Suspense } from 'react';
import { PalettesHero } from '@/components/palettes/PalettesHero';
import { PalettesContent } from '@/components/palettes/PalettesContent';
import { PalettesInfoCard } from '@/components/palettes/PalettesInfoCard';
import { Footer } from '@/components/Footer';
import { db } from '@/lib/db';

export default async function PalettesPage() {
  // Récupérer toutes les palettes
  const palettes = await db.palette.findMany({
    orderBy: { number: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      origin: true,
      colors: true,
      category: true,
    },
  });

  return (
    <div className="bg-[#f5efe2] min-h-screen">
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
        <PalettesHero />
        <Suspense fallback={<div>Chargement...</div>}>
          <PalettesContent initialPalettes={palettes} />
        </Suspense>
        <PalettesInfoCard />
      </main>
      <Footer />
    </div>
  );
}
```

```tsx
// components/palettes/PalettesContent.tsx
'use client';
import { useState, useMemo } from 'react';
import { PalettesSearch } from './PalettesSearch';
import { PaletteFilterChips } from './PaletteFilterChips';
import { PalettesResultsHeader } from './PalettesResultsHeader';
import { PalettesGrid } from './PalettesGrid';
import { PalettesListView } from './PalettesListView';

export function PalettesContent({ initialPalettes }: { initialPalettes: Palette[] }) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('numero');
  const [filter, setFilter] = useState('toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let result = [...initialPalettes];

    // Filtre par catégorie
    if (filter !== 'toutes') {
      result = result.filter(p => p.category === filter);
    }

    // Recherche texte
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.origin.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Tri
    if (sortBy === 'alpha') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'popularite') result.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));

    return result;
  }, [initialPalettes, query, sortBy, filter]);

  return (
    <div className="mb-12">
      <PalettesSearch
        query={query}
        onQueryChange={setQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <PaletteFilterChips active={filter} onChange={setFilter} />
      <PalettesResultsHeader
        total={filtered.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {viewMode === 'grid'
        ? <PalettesGrid palettes={filtered} />
        : <PalettesListView palettes={filtered} />
      }
    </div>
  );
}
```

---

## 10. Schéma DB pour les catégories

Pour que le filtre fonctionne, **chaque palette doit avoir un tag `category`** :

```sql
ALTER TABLE palettes ADD COLUMN category TEXT;
-- Valeurs possibles : 'neutres' | 'chaudes' | 'froides' | 'naturelles' | 'vifs' | 'pastels' | 'sombres'
```

**Classification automatique** via un script GPT-4o :

```typescript
// scripts/classify-palettes.ts
async function classifyPalette(palette: Palette): Promise<string> {
  const hexes = palette.colors.join(', ');
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Classify this color palette in ONE of these categories: neutres, chaudes, froides, naturelles, vifs, pastels, sombres.
        Palette colors: ${hexes}
        Return only the category word, nothing else.`,
    }],
  });
  return res.choices[0].message.content!.trim().toLowerCase();
}
```

Coût total : 348 palettes × $0,0002 = **$0,07 one-time**.

---

## 11. Vue liste (alternative)

Si l'utilisateur active la vue liste (icône ≡) :

```tsx
// components/palettes/PalettesListView.tsx
export function PalettesListView({ palettes }: Props) {
  return (
    <div className="space-y-2">
      {palettes.map(palette => (
        <Link
          key={palette.id}
          href={`/palettes/${palette.slug}`}
          className="flex items-center gap-4 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
        >
          <div className="flex w-32 h-12 rounded overflow-hidden flex-shrink-0">
            {palette.colors.map((color, i) => (
              <div key={i} className="flex-1" style={{ background: color }} />
            ))}
          </div>
          <div className="flex-1">
            <p className="font-serif text-base text-[#1a1a1a]">{palette.name}</p>
            <p className="text-[10px] tracking-widest uppercase text-[#8a7a68]">
              {palette.origin}
            </p>
          </div>
          <span className="text-xs text-[#8a7a68]">N°{palette.number}</span>
        </Link>
      ))}
    </div>
  );
}
```

---

## 12. Mobile responsive

Sur mobile (≤lg) :
- Le hero passe en 1 colonne, l'image vase descend sous le titre
- La grille passe de 5 colonnes à **2 colonnes** (sm: 3 colonnes pour tablette)
- Le sélecteur de tri va sous la search bar
- Les filter chips wrap normalement
- L'info card du bas passe en 1 colonne

```tsx
// Adaptations dans les composants existants
<section className="grid lg:grid-cols-[1fr_1fr] gap-6 ...">
  {/* gauche / droite stack sur mobile */}
</section>

<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ...">
  {/* 2 colonnes mobile, 3 tablette, 5 desktop */}
</div>
```

---

## 13. Animations

Pour la finesse :

```css
/* Apparition cascade des cards à l'arrivée */
.palette-card {
  animation: fadeInUp 0.4s ease-out backwards;
}

.palette-card:nth-child(1) { animation-delay: 0.0s; }
.palette-card:nth-child(2) { animation-delay: 0.03s; }
.palette-card:nth-child(3) { animation-delay: 0.06s; }
/* ... ou dynamiquement via JS pour 24 cards */

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Effet : à l'arrivée sur la page, les palettes apparaissent **en cascade douce** de haut en bas.

---

## 14. URLs SEO-friendly

Chaque palette a une page dédiée à `/palettes/[slug]` :
- `/palettes/brume-du-matin`
- `/palettes/rosee-du-matin`
- `/palettes/studio-du-peintre`
- etc.

Avec des **metadata SEO** par palette :

```typescript
export async function generateMetadata({ params }) {
  const palette = await db.palette.findUnique({ where: { slug: params.slug } });
  return {
    title: `${palette.name} — Palette ${palette.origin} | WADA`,
    description: `Découvrez la palette ${palette.name}, harmonie ${palette.origin} d'après Sanzo Wada (1933). ${palette.colors.length} couleurs pour composer vos tenues.`,
    openGraph: {
      images: [`/api/og/palette/${palette.slug}`],  // image OG dynamique
    },
  };
}
```

---

## 15. Checklist Claude Code

```
□ Créer la route app/palettes/page.tsx
□ Créer les composants dans components/palettes/ :
  - PalettesHero.tsx (titre + image)
  - PalettesContent.tsx (orchestrateur avec state)
  - PalettesSearch.tsx (search + tri)
  - PaletteFilterChips.tsx (Toutes/Neutres/...)
  - PalettesResultsHeader.tsx (compteur + toggle vue)
  - PaletteCard.tsx (card individuelle)
  - PalettesGrid.tsx (grille 5 colonnes + Voir plus)
  - PalettesListView.tsx (vue liste alternative)
  - PalettesInfoCard.tsx (bloc bas avec 4 features)

□ Migration DB : ajouter `category` sur table palettes
□ Lancer script classify-palettes.ts (one-shot, $0,07)

□ Générer l'image hero Flux Pro :
  - /public/hero/palettes-hero-vase-nuanciers.jpg

□ Endpoint POST/DELETE /api/palettes/[id]/like
□ Réutiliser le Footer commun (créé sur la page Styliste)

□ Tester :
  - Desktop : grille 5 colonnes, hero 2 colonnes
  - Tablette : grille 3 colonnes
  - Mobile : grille 2 colonnes, hero stack
  - Recherche fonctionne (par nom, origine, couleur)
  - Filter chips fonctionnent
  - Tri fonctionne
  - Toggle vue grille/liste
  - "Voir plus" charge +24 palettes à la fois
  - Hover sur card → bandes s'étirent doucement
  - Animation cascade à l'arrivée
```

---

## 16. Cohérence avec les autres pages

Cette page partage avec **Styliste IA** et **Boutique** :
- Le **fond crème** `#f5efe2`
- Le **bouton retour pilule** outline
- Le **titre serif** en grande taille
- Les **chips outline noir** + **chips remplis bordeaux**
- Le **bouton CTA bordeaux** « Voir plus » / « Découvrir ma palette »
- Le **footer 4 colonnes** sur fond noir

C'est ce qui crée la **cohérence éditoriale forte** entre toutes les pages WADA. Le client navigue
de l'une à l'autre et sent que c'est **le même univers**.

---

## 17. Pourquoi cette page est cruciale

C'est **le coeur du dictionnaire WADA**. Si elle est belle, le client comprend en 3 secondes :
1. WADA est **encyclopédique** (348 palettes)
2. WADA est **éditorial** (origines géographiques, noms poétiques)
3. WADA est **utilisable** (filtres, recherche, tri)

Combinée avec **la page palette détail** (Bal au Palais, etc.) et **le composer cohérent**,
cette page positionne WADA comme **THE reference pour les harmonies de couleur en mode**.

C'est le **pitch SEO le plus puissant** : tape « palette mode automne » dans Google → tu tombes
sur `wada.style/palettes?filter=chaudes` qui montre 50+ palettes parfaites.

---

**À envoyer au codeur avec les 5 autres briefs.** Cette page est probablement la deuxième plus
visuellement importante après la Styliste, et celle qui mettra le plus en valeur ton catalogue
encyclopédique de 348 palettes.
