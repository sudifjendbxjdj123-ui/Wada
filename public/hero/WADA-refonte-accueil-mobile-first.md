# WADA — Page Boutique mobile-first (inspirée maquette épurée)

## ⚠️ ARCHITECTURE — IMPORTANT

Cette spec **NE remplace PAS la page d'accueil actuelle**. Elle crée la page **/boutique** :

| URL | Identité | Rôle |
|---|---|---|
| **`/` (homepage actuelle)** | Éditoriale, vidéo Hannya, « INSPIRÉ DE SANZŌ WADA » | Storytelling, brand experience, différenciation |
| **`/boutique` (NOUVELLE — cette spec)** | Shopping clair style Mango/Zara | Plateforme e-commerce, conversion |

**Comportement nav** :
- Logo `WADA 和田` (en haut à gauche) → renvoie toujours vers `/` (la home éditoriale)
- Onglet « Boutique » dans la nav → renvoie vers `/boutique` (cette page shopping)
- Au clic sur le logo depuis `/boutique`, on revient au monde éditorial WADA
- Au clic sur « Boutique » depuis `/`, on entre dans le monde shopping

**Pourquoi cette dichotomie est brillante** :
- Le **client curieux** entre par `/` et découvre Sanzō Wada → conversion par l'émotion
- Le **client pressé** clique directement « Boutique » → conversion par la simplicité
- Les deux mondes communiquent via le logo et la nav

---

Spec complète à donner au codeur pour créer la page **/boutique** selon la maquette
fournie : design **mobile-first**, shopping clair, identité WADA préservée via le logo + nav.

**Durée dev estimée** : 6-8h.
**Image de référence** : maquette dans `/public/hero/` (le mockup mobile clean cream).

---

## Philosophie de la refonte

**Avant** : site éditorial qui demande au client de comprendre Sanzō Wada avant d'acheter.
**Après** : site **shopping immédiat** avec l'éditorial WADA en valeur ajoutée.

Le client peut maintenant :
1. **Acheter directement** en passant par les catégories (comme sur Mango / Zalando)
2. **Découvrir WADA** via l'expérience palette (Scanner / Dressing) en bonus

C'est le pivot UX qui fait passer WADA de **« projet de niche »** à **« app shopping crédible »**.

---

## Architecture de la page d'accueil

```
┌────────────────────────────────────────────┐
│  HEADER                                     │
│  [WADA STYLE]  [🔍 Search bar...] [♡] [🛍]  │
├────────────────────────────────────────────┤
│  TOP NAV (catégories)                       │
│  Nouveau | Vacances | Marques | Vêtements |│
│  Chaussures | Sacs | Accessoires            │
├────────────────────────────────────────────┤
│                                             │
│  HERO ÉDITORIAL                             │
│  ┌─────────────────────┬─────────────────┐ │
│  │ NOUVEAUTÉS           │                 │ │
│  │                      │  [Photo modèle  │ │
│  │ Les pièces           │   éditoriale,   │ │
│  │ incontournables      │   fond crème,   │ │
│  │ du moment            │   ambiance      │ │
│  │                      │   Sanzō Wada]   │ │
│  │ [Découvrir]          │                 │ │
│  └─────────────────────┴─────────────────┘ │
├────────────────────────────────────────────┤
│                                             │
│  NOS SÉLECTIONS                  Voir tout │
│  [6 cards horizontales avec image catégorie]│
│  Vacances · Sacs · Accessoires · Chaussures │
│  · Vêtements · Marques                       │
├────────────────────────────────────────────┤
│                                             │
│  NOUVEAUTÉS                       Voir tout │
│  [6 produits horizontaux avec ♡ + Ajouter]  │
│  Vraies images packshot, marque, nom, prix  │
├────────────────────────────────────────────┤
│                                             │
│  FEATURE CARDS (3 colonnes)                 │
│  [Inspiration] [Scanne&Trouve] [Dressing]  │
├────────────────────────────────────────────┤
│                                             │
│  FOOTER                                     │
│                                             │
└────────────────────────────────────────────┘
│  TAB BAR MOBILE (sticky bottom)             │
│  [Accueil] [Découvrir] [Scanner] [Dressing]│
│  [Profil]                                   │
└────────────────────────────────────────────┘
```

---

## 1. Header

### Desktop & Mobile

```tsx
// components/Header.tsx
import { Heart, ShoppingBag, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-[#e8dfd0] bg-white">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 px-5 py-4 max-w-7xl mx-auto">

        {/* Logo */}
        <Link href="/" className="flex flex-col">
          <span className="font-bold tracking-wider text-xl text-[#1a1a1a]">WADA</span>
          <span className="text-[10px] tracking-[0.3em] text-[#1a1a1a] -mt-1">STYLE</span>
        </Link>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a7a68]" />
          <input
            type="search"
            placeholder="Rechercher un vêtement, une marque..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#faf6ee] border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#6e3b32]/20"
          />
        </div>

        {/* Icônes droite */}
        <div className="flex items-center gap-4">
          <Link href="/favoris" aria-label="Favoris">
            <Heart className="w-5 h-5 text-[#1a1a1a]" />
          </Link>
          <Link href="/panier" aria-label="Panier">
            <ShoppingBag className="w-5 h-5 text-[#1a1a1a]" />
          </Link>
        </div>

      </div>
    </header>
  );
}
```

**Détails importants** :
- Logo `WADA` en sans-serif bold (font: Inter ou Fredoka, weight 700), `STYLE` en dessous letter-spacing très large
- Search bar avec **fond beige `#faf6ee`**, pas blanc — c'est ce qui donne la chaleur WADA
- Icônes : juste les contours (lucide-react), pas remplies
- Pas de menu burger sur desktop, mais oui sur mobile (voir section mobile)

---

## 2. Top nav — catégories simplifiées

### Bar de catégories (Nouveau / Vacances / Marques / Vêtements / etc.)

```tsx
// components/TopCategoryNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = [
  { label: 'Nouveau', href: '/nouveau' },
  { label: 'Vacances', href: '/vacances' },
  { label: 'Marques', href: '/marques' },
  { label: 'Vêtements', href: '/vetements' },
  { label: 'Chaussures', href: '/chaussures' },
  { label: 'Sacs', href: '/sacs' },
  { label: 'Accessoires', href: '/accessoires' },
];

export function TopCategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#e8dfd0] bg-white overflow-x-auto">
      <div className="flex items-center gap-8 px-5 py-3 max-w-7xl mx-auto whitespace-nowrap">
        {CATEGORIES.map(cat => {
          const isActive = pathname === cat.href || (cat.href === '/nouveau' && pathname === '/');
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className={`text-sm pb-1 transition-colors ${
                isActive
                  ? 'font-medium text-[#1a1a1a] border-b-2 border-[#1a1a1a] -mb-3.5'
                  : 'text-[#1a1a1a] hover:text-[#6e3b32]'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Pourquoi 7 catégories simplifiées** :
- « Nouveau » = nouvelle catégorie phare (last week's drops)
- « Vacances » = thématique saisonnière qui change toute l'année (été = plage, hiver = ski)
- « Marques » = page A-Z complète (déjà spec'd)
- Vêtements / Chaussures / Sacs / Accessoires = catégories produits classiques

**Note** : « Bijoux » disparaît comme catégorie séparée. Les bijoux sont dans Accessoires. Ça simplifie.

---

## 3. Hero éditorial

### Structure HTML

```tsx
// components/HomeHero.tsx
export function HomeHero() {
  return (
    <section className="bg-[#f5efe2] rounded-2xl mx-5 mt-5 overflow-hidden">
      <div className="grid md:grid-cols-2 items-center">

        {/* Texte gauche */}
        <div className="px-8 py-12 md:py-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#1a1a1a] mb-4">
            Nouveautés
          </p>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight text-[#1a1a1a] mb-4">
            Les pièces<br/>
            incontournables<br/>
            du moment
          </h1>
          <p className="text-sm text-[#5a5a5a] mb-6 max-w-xs">
            Découvre les nouveautés sélectionnées pour ton style.
          </p>
          <Link
            href="/nouveau"
            className="inline-block bg-[#1a1a1a] text-white px-6 py-3 rounded-full text-sm font-medium"
          >
            Découvrir
          </Link>
        </div>

        {/* Image droite */}
        <div className="relative aspect-[4/5] md:aspect-auto md:h-full">
          <img
            src="/hero/home-hero-cream-blazer.jpg"
            alt="Look beige éditorial WADA"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </section>
  );
}
```

**L'image** : photo éditoriale **lifestyle** (la SEULE de tout le site avec un modèle, et c'est OK ici parce que c'est le hero). Style :
- Modèle en tenue cohérente avec une palette WADA (ex: crème + sable + noir pour « Studio danois » ou « Sumi-e »)
- Fond clair, lumière naturelle douce
- Composition aérée

**Source de l'image** : tu peux la commander sur Midjourney / Flux Pro avec un prompt type :
> *« Editorial fashion photo, model wearing cream blazer and matching pants, black crop top, mini bag, sunglasses, hair pulled back, soft daylight, neutral cream background, minimalist composition, Vogue editorial style, photorealistic, 4k »*

Coût : ~$0,04 sur Replicate Flux Pro. **À refaire à chaque saison** pour garder le hero frais.

---

## 4. Section « Nos sélections »

```tsx
// components/HomeSelections.tsx
const SELECTIONS = [
  { label: 'Vacances', href: '/vacances', image: '/sections/vacances.jpg' },
  { label: 'Sacs', href: '/sacs', image: '/sections/sacs.jpg' },
  { label: 'Accessoires', href: '/accessoires', image: '/sections/accessoires.jpg' },
  { label: 'Chaussures', href: '/chaussures', image: '/sections/chaussures.jpg' },
  { label: 'Vêtements', href: '/vetements', image: '/sections/vetements.jpg' },
  { label: 'Marques', href: '/marques', image: '/sections/marques.jpg' },
];

export function HomeSelections() {
  return (
    <section className="px-5 mt-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-medium text-xl text-[#1a1a1a]">Nos sélections</h2>
        <Link href="/decouvrir" className="text-sm text-[#6e3b32] underline">Voir tout</Link>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {SELECTIONS.map(sel => (
          <Link key={sel.label} href={sel.href} className="group">
            <div className="aspect-[3/4] bg-[#faf6ee] rounded-xl overflow-hidden mb-2 relative">
              <img
                src={sel.image}
                alt={sel.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-3 left-3 text-white text-sm font-medium drop-shadow">
                {sel.label}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

**Les 6 images à préparer** (peuvent être générées par IA pour démarrer, puis remplacées par de vraies photos plus tard) :

| Section | Description visuelle |
|---|---|
| Vacances | Plage, chapeau paille, robe blanche fluide |
| Sacs | Sac à main beige sur fond neutre |
| Accessoires | Lunettes de soleil + bagues sur fond clair |
| Chaussures | Sneakers ou mocassins de face, fond neutre |
| Vêtements | Chemise lait sur cintre, fond crème |
| Marques | Étiquette de luxe (style Prada) sur fond foncé |

Génère-les sur **Flux Pro** ($0,04 chacune) ou prends des photos chez toi. Stocke-les dans `/public/sections/`.

---

## 5. Section « Nouveautés »

```tsx
// components/HomeNouveautes.tsx
import { Heart } from 'lucide-react';
import Image from 'next/image';

export async function HomeNouveautes() {
  // Récupérer les 6 derniers produits ajoutés en base
  const products = await db.product.findMany({
    where: { is_active: true, image_validated: true },
    orderBy: { created_at: 'desc' },
    take: 6,
  });

  return (
    <section className="px-5 mt-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-medium text-xl text-[#1a1a1a]">Nouveautés</h2>
        <Link href="/nouveau" className="text-sm text-[#6e3b32] underline">Voir tout</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {products.map(product => (
          <article key={product.id}>
            <div className="aspect-square bg-[#faf6ee] rounded-xl overflow-hidden mb-2 relative">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                aria-label="Ajouter aux favoris"
                className="absolute top-2 right-2 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center hover:bg-white"
              >
                <Heart className="w-4 h-4 text-[#1a1a1a]" />
              </button>
            </div>
            <p className="text-[11px] tracking-wider uppercase text-[#8a7a68] mt-1">{product.brand}</p>
            <p className="text-sm text-[#1a1a1a] leading-tight">{product.name}</p>
            <p className="text-sm font-medium text-[#1a1a1a] mt-1">
              CHF {product.price.toFixed(2)}
            </p>
            <button className="mt-2 w-full py-2 border border-[#1a1a1a] rounded-full text-xs text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-colors">
              Ajouter
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
```

**Détails importants** :
- **Bouton « Ajouter »** : ajoute à la **liste de souhaits** (wishlist), pas un panier. Au clic → toast « Ajouté à tes favoris » + cœur se remplit
- **Prix en CHF** parce que tu es à Genève. Le code peut détecter la géo et basculer en EUR pour les visiteurs FR.
- **Pas de mannequin** dans les images (cf. règle absolue déjà spec'd)
- **6 produits affichés**, le reste est sur la page `/nouveau`

---

## 6. 3 feature cards (Inspiration · Scanne · Dressing)

```tsx
// components/HomeFeatures.tsx
import { Sparkles, Scan, Shirt } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Inspiration personnalisée',
    text: 'Des tenues créées pour ton style',
    href: '/styliste',
  },
  {
    icon: Scan,
    title: 'Scanne & trouve',
    text: 'Scanne un vêtement et trouve des idées',
    href: '/scanner',
  },
  {
    icon: Shirt,
    title: 'Ton dressing intelligent',
    text: 'Organise et stylise tes looks',
    href: '/dressing',
  },
];

export function HomeFeatures() {
  return (
    <section className="px-5 mt-12 mb-8">
      <div className="grid md:grid-cols-3 gap-3">
        {FEATURES.map(feat => {
          const Icon = feat.icon;
          return (
            <Link
              key={feat.href}
              href={feat.href}
              className="flex items-center gap-4 p-5 bg-[#f5efe2] rounded-2xl hover:bg-[#ede4d4] transition-colors"
            >
              <Icon className="w-8 h-8 text-[#1a1a1a] flex-shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs tracking-wider uppercase font-medium text-[#1a1a1a]">
                  {feat.title}
                </p>
                <p className="text-sm text-[#5a5a5a] mt-1">{feat.text}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

**Pourquoi c'est important** : ces 3 cards rappellent au client que WADA n'est **pas qu'un site shopping** — c'est aussi une **expérience éditoriale unique** avec Scanner couleur + Styliste IA + Dressing virtuel. C'est ta différenciation.

---

## 7. Tab bar mobile (sticky bottom)

```tsx
// components/MobileTabBar.tsx
'use client';
import { Home, Compass, Scan, Shirt, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { icon: Home, label: 'Accueil', href: '/' },
  { icon: Compass, label: 'Découvrir', href: '/decouvrir' },
  { icon: Scan, label: 'Scanner', href: '/scanner', isPrimary: true },
  { icon: Shirt, label: 'Dressing', href: '/dressing' },
  { icon: User, label: 'Profil', href: '/profil' },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8dfd0] z-50">
      <div className="grid grid-cols-5 items-end pt-2 pb-3 px-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          if (tab.isPrimary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full border-2 border-[#1a1a1a] bg-white flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5 text-[#1a1a1a]" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] mt-1 text-[#1a1a1a]">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#1a1a1a]' : 'text-[#8a7a68]'}`} strokeWidth={1.5} />
              <span className={`text-[10px] ${isActive ? 'text-[#1a1a1a] font-medium' : 'text-[#8a7a68]'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Détails** :
- **Visible uniquement sur mobile** (`md:hidden`)
- **Scanner** est mis en avant : icône plus grosse, dans un cercle bordé, légèrement remontée — c'est la fonctionnalité signature de WADA
- 5 onglets : Accueil / Découvrir / **Scanner** / Dressing / Profil
- Active state : icône et texte noirs (sinon gris)

---

## 8. Layout root (intégration globale)

```tsx
// app/layout.tsx
import { Header } from '@/components/Header';
import { TopCategoryNav } from '@/components/TopCategoryNav';
import { MobileTabBar } from '@/components/MobileTabBar';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-white">
        <Header />
        <TopCategoryNav />
        <main className="pb-24 md:pb-12">{children}</main>
        <MobileTabBar />
      </body>
    </html>
  );
}

// app/boutique/page.tsx  ← ATTENTION : C'EST /boutique, PAS /
import { HomeHero } from '@/components/boutique/HomeHero';
import { HomeSelections } from '@/components/boutique/HomeSelections';
import { HomeNouveautes } from '@/components/boutique/HomeNouveautes';
import { HomeFeatures } from '@/components/boutique/HomeFeatures';

export default function BoutiquePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <HomeHero />
      <HomeSelections />
      <HomeNouveautes />
      <HomeFeatures />
    </div>
  );
}

// La page d'accueil actuelle (app/page.tsx) avec la vidéo Hannya RESTE INCHANGÉE.
// On ne touche PAS à app/page.tsx.
```

---

## 9. Palette de couleurs (mise à jour)

```css
:root {
  /* Backgrounds */
  --wada-bg-white: #ffffff;
  --wada-bg-cream: #faf6ee;        /* search bar, soft sections */
  --wada-bg-cream-strong: #f5efe2; /* hero, feature cards */
  --wada-bg-cream-deep: #ede4d4;   /* hover states */

  /* Text */
  --wada-text-primary: #1a1a1a;     /* main text, logo */
  --wada-text-secondary: #5a5a5a;   /* subtitle, body */
  --wada-text-muted: #8a7a68;       /* labels, hints */

  /* Accents */
  --wada-accent: #6e3b32;           /* bordeaux WADA pour liens et CTA secondaires */
  --wada-cta-bg: #1a1a1a;           /* boutons primaires (noir) */
  --wada-cta-text: #ffffff;

  /* Borders */
  --wada-border-light: #e8dfd0;
}
```

**Note** : le **noir #1a1a1a remplace #4a3d2a (bordeaux foncé) pour les CTA**. C'est ce qui donne le côté pro/Mango à la maquette. Le bordeaux WADA `#6e3b32` reste pour les **liens éditoriaux** (« Voir tout », souligné).

---

## 10. Typographie

```css
:root {
  /* Sans-serif principale */
  --wada-font-sans: 'Inter', system-ui, sans-serif;

  /* Serif pour hero et titres éditoriaux */
  --wada-font-serif: 'Cormorant Garamond', 'EB Garamond', Georgia, serif;

  /* Display pour le logo */
  --wada-font-display: 'Inter', sans-serif;
  /* (le logo "WADA" est juste sans-serif bold large) */
}
```

**Règles d'usage** :
- Logo : `font-sans bold tracking-wider`, 22px
- Sous-logo « STYLE » : 10px, letter-spacing 0.3em
- Hero titre : `font-serif`, 40-50px, line-height tight
- Section titles (« Nos sélections », « Nouveautés ») : `font-sans medium`, 20px
- Body : `font-sans regular`, 14px
- Petits labels (uppercase) : `font-sans medium`, 11px, letter-spacing 0.15em

---

## 11. Pages liées à créer

Les nouvelles routes que la nav et les sections pointent :

| URL | Contenu |
|---|---|
| `/nouveau` | Nouveautés (50 derniers produits ajoutés, filtrable) |
| `/vacances` | Thématique saisonnière (été : maillots, robes légères, sandales) |
| `/marques` | Index A-Z déjà spec'd |
| `/vetements` | Index vêtements (déjà spec'd avec sous-catégories) |
| `/chaussures` | Index chaussures |
| `/sacs` | Index sacs |
| `/accessoires` | Index accessoires (inclut bijoux + autres) |
| `/decouvrir` | Hub éditorial (palettes + Lettres du dimanche + Index WADA) |
| `/scanner` | Scanner couleur (existant, à conserver) |
| `/styliste` | Conversation styliste IA (existant) |
| `/dressing` | Garde-robe virtuelle utilisateur (existant ou à créer) |
| `/profil` | Compte utilisateur |
| `/favoris` | Wishlist |
| `/panier` | Panier (si tu actives un panier multi-marchand plus tard) |

---

## 12. Adaptations mobile (≤ 768px)

- **Header** : la search bar prend toute la largeur, icônes en dessous ou compactées
- **Top nav** : scroll horizontal (overflow-x-auto), pas de wrap
- **Hero** : passe en 1 colonne, image au-dessus du texte
- **Nos sélections** : 3 colonnes au lieu de 6
- **Nouveautés** : 2 colonnes au lieu de 6
- **Feature cards** : 1 colonne au lieu de 3 (les unes au-dessus des autres)
- **Tab bar** : visible et sticky bottom

---

## 13. Checklist Claude Code

```
□ Créer les composants :
  - components/Header.tsx
  - components/TopCategoryNav.tsx
  - components/HomeHero.tsx
  - components/HomeSelections.tsx
  - components/HomeNouveautes.tsx
  - components/HomeFeatures.tsx
  - components/MobileTabBar.tsx

□ Mettre à jour app/layout.tsx pour utiliser le nouveau Header + TopCategoryNav + MobileTabBar

□ Réécrire app/page.tsx avec les 4 sections nouvelles

□ Définir la palette CSS dans globals.css (variables --wada-*)

□ Importer Inter (sans-serif) + Cormorant Garamond (serif) depuis Google Fonts

□ Créer les 6 images de sections (dans /public/sections/) :
  - vacances.jpg, sacs.jpg, accessoires.jpg, chaussures.jpg, vetements.jpg, marques.jpg
  - Générer sur Flux Pro ou utiliser des images stock libres

□ Créer la hero image (dans /public/hero/home-hero-cream-blazer.jpg)
  - Générer sur Flux Pro avec prompt fourni

□ Créer les pages liées si elles n'existent pas :
  - /nouveau, /vacances, /decouvrir, /favoris, /panier, /profil, /dressing

□ Tester :
  - Desktop : 1440px et 1920px
  - Mobile : iPhone 14 Pro (390px) et iPhone SE (375px)
  - Tab bar visible sur mobile, pas sur desktop
  - Top nav scrollable horizontalement sur mobile
  - Vérifier que toutes les images sont en CHF (pas EUR), sauf si géo France

□ A/B test optionnel : garder l'ancienne page d'accueil sur /old pendant 2 semaines
```

---

## 14. Cohabitation avec les autres briefs

Cette refonte d'accueil est **compatible** avec les 3 autres briefs déjà envoyés :

| Brief | Compatibilité |
|---|---|
| **Flat lay shoppable** (page tenue) | ✅ Cette refonte ne touche pas aux pages tenues |
| **Cohérence composer** (logique IA) | ✅ Indépendant — la nouvelle homepage utilisera les tenues cohérentes du composer |
| **Navigation catégories** (Lyst-style) | 🔄 **À ADAPTER** : cette nouvelle nav simplifiée remplace la spec « Bar 2 » du brief Lyst. Garder uniquement les mega menus si tu les veux toujours, ou les simplifier en drawer mobile direct |

**Recommandation** : envoie cette nouvelle spec au codeur **avant** qu'il commence le brief « Navigation Lyst-style ». Il fera la nav simplifiée d'abord, puis pourra l'enrichir avec les sous-catégories mega menu si besoin.

---

## 15. Pourquoi ce changement transforme WADA

**Avant** (les clients qui voulaient juste acheter) :
- Le client arrive sur `/`, voit la vidéo Hannya magnifique mais ne sait pas comment acheter
- Il quitte sans avoir vu un seul produit

**Après** (avec `/boutique`) :
- Le client curieux entre par `/` → expérience storytelling Sanzō Wada, conversion par l'émotion
- Le client pressé clique « Boutique » dans la nav → expérience shopping immédiate, conversion par la simplicité
- Les deux mondes communiquent et se renforcent
- Taux de conversion global estimé : **×3 à ×5** sur la cible « pressée »

C'est **le passage du site démo au site qui sert à la fois l'âme et le business**. Combiné
avec le flat lay shoppable et la cohérence du composer, WADA devient un vrai **acteur mode pro**
qui n'a rien sacrifié de son identité.

---

**À envoyer au codeur dès maintenant.** Cette refonte est la plus impactante des 4 briefs.

**RAPPEL TECHNIQUE FINAL** :
- ❌ NE PAS toucher à `app/page.tsx` (la home actuelle reste)
- ✅ CRÉER `app/boutique/page.tsx` (la nouvelle page shopping)
- ✅ S'assurer que l'item « Boutique » de la nav pointe vers `/boutique`
- ✅ S'assurer que le logo `WADA 和田` pointe toujours vers `/`
