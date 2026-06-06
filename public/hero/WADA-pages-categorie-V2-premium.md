# WADA — Pages catégorie V2 « premium »

Refonte des pages catégorie (Chaussures, Vêtements, Sacs, Accessoires, Bijoux) selon
le standard éditorial Net-a-Porter / Mr Porter.

**Durée dev estimée** : 3-4h pour la première (Chaussures), puis ~30 min de duplication
par catégorie.

---

## Le problème actuel

La page actuelle est **un mur de produits sans hiérarchie** :

- Grille 4 colonnes trop dense
- Photos uniformes, sans atmosphère
- Pas de lien visuel à la palette Sanzō Wada
- Pas de sous-sections (tout pêle-mêle)
- Texte minuscule
- Aucune narration

C'est de **l'agrégation**, pas de la **curation**.

---

## La règle d'or

> Une page WADA ne montre pas tout. Elle **propose** quelque chose.

Donc on adopte le **principe Net-a-Porter** : moins de produits par écran, mais chacun a
de la présence visuelle.

---

## 1. Structure de la nouvelle page

```
┌──────────────────────────────────────────────────────┐
│  ← Boutique                                            │
├──────────────────────────────────────────────────────┤
│                                                        │
│  CATÉGORIE                                             │
│  Chaussures                                            │
│  2 847 paires sélectionnées par WADA. Filtrables par   │
│  palette Sanzō Wada, marque, style.                    │
│                                                        │
├──────────────────────────────────────────────────────┤
│                                                        │
│  [Tout] [Sneakers] [Mocassins] [Derbies] [Bottines]   │
│  [Sandales] [Birkenstocks]                             │
│                                                        │
├──────────────────────────────────────────────────────┤
│  2 847 résultats         [⚙ Filtrer] [↕ Trier]       │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ── SNEAKERS MINIMALISTES ──────────────────          │
│                                                        │
│  ┌───────┐ ┌───────┐ ┌───────┐                        │
│  │   ●   │ │   ●   │ │   ●   │  ← pastilles palettes  │
│  │       │ │       │ │       │                        │
│  │ photo │ │ photo │ │ photo │                        │
│  │       │ │       │ │       │                        │
│  └───────┘ └───────┘ └───────┘                        │
│  BRAND      BRAND      BRAND                           │
│  Nom        Nom        Nom                             │
│  395 €  3p  120 €  5p  150 €  7p                       │
│                                                        │
│  ── MOCASSINS & DERBIES ────────────────────          │
│                                                        │
│  [3 produits]                                          │
│                                                        │
│  ── BOTTINES & BOOTS ───────────────────────          │
│                                                        │
│  [3 produits]                                          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 2. Composants à coder

### 2.1 — Header éditorial

```tsx
// components/category/CategoryHero.tsx

interface Props {
  eyebrow: string;        // "CATÉGORIE"
  title: string;          // "Chaussures"
  description: string;    // "2 847 paires sélectionnées..."
  count: number;
}

export function CategoryHero({ eyebrow, title, description }: Props) {
  return (
    <div className="mb-8">
      <p className="text-[9px] tracking-[0.3em] uppercase text-[#8a7a68] mb-2">
        {eyebrow}
      </p>
      <h1 className="font-serif text-5xl text-[#1a1a1a] mb-2 leading-none">
        {title}
      </h1>
      <p className="text-sm text-[#5a5a5a] italic max-w-md">
        {description}
      </p>
    </div>
  );
}
```

### 2.2 — Filter chips visibles (sous-catégories)

```tsx
// components/category/SubcategoryChips.tsx

const SUBCATEGORIES = {
  chaussures: ['Tout', 'Sneakers', 'Mocassins', 'Derbies', 'Bottines', 'Sandales', 'Birkenstocks'],
  vetements: ['Tout', 'T-shirts', 'Chemises', 'Pulls', 'Vestes', 'Manteaux', 'Pantalons', 'Jeans', 'Robes', 'Jupes'],
  sacs: ['Tout', 'Sacs à main', 'Sacs à dos', 'Pochettes', 'Sacs voyage', 'Cabas'],
  accessoires: ['Tout', 'Ceintures', 'Foulards', 'Chapeaux', 'Lunettes', 'Montres', 'Bijoux'],
};

export function SubcategoryChips({ category, active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {SUBCATEGORIES[category].map(sub => (
        <button
          key={sub}
          onClick={() => onChange(sub)}
          className={`px-3.5 py-1.5 text-xs rounded-full transition-colors ${
            active === sub
              ? 'bg-[#1a1a1a] text-white'
              : 'bg-white border border-[#d4ccc0] text-[#1a1a1a] hover:bg-[#faf6ee]'
          }`}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}
```

### 2.3 — Toolbar avec compteur + actions

```tsx
// components/category/Toolbar.tsx

export function Toolbar({ count, sortBy, onFilterOpen, onSortChange }: Props) {
  return (
    <div className="flex justify-between items-center py-3 mb-6 border-b border-[#d4ccc0]">
      <span className="text-xs text-[#5a5a5a]">
        {count.toLocaleString('fr-FR')} résultats
      </span>
      <div className="flex gap-4 items-center">
        <button onClick={onFilterOpen} className="text-xs text-[#1a1a1a] flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtrer
        </button>
        <button className="text-xs text-[#1a1a1a] flex items-center gap-1">
          <ArrowUpDown className="w-3.5 h-3.5" />
          Trier : {sortBy}
        </button>
      </div>
    </div>
  );
}
```

### 2.4 — Section header (« Sneakers minimalistes »)

Les produits sont **groupés par sous-style** ou par **palette dominante**.

```tsx
// components/category/SectionLabel.tsx

export function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <span className="text-[9px] tracking-[0.3em] uppercase text-[#8a7a68] flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#e8dfd0]" />
    </div>
  );
}
```

**Quels groupes utiliser ?** Algorithme simple :

```typescript
// lib/category/grouping.ts

export function groupProducts(products: Product[], category: string) {
  if (category === 'chaussures') {
    return {
      'Sneakers minimalistes': products.filter(p => p.sub === 'sneakers' && p.macro_style === 'minimaliste'),
      'Sneakers streetwear':   products.filter(p => p.sub === 'sneakers' && p.macro_style === 'streetwear'),
      'Mocassins & derbies':   products.filter(p => ['mocassins', 'derbies'].includes(p.sub)),
      'Bottines & boots':      products.filter(p => ['bottines', 'bottes'].includes(p.sub)),
      'Sandales d\'été':       products.filter(p => ['sandales', 'tongs', 'birkenstocks'].includes(p.sub)),
    };
  }
  // ... autres catégories
}
```

### 2.5 — Card produit premium

C'est le composant **central** de la refonte. Différences avec la version actuelle :

```tsx
// components/category/ProductCard.tsx

export function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false);

  // Background dégradé subtil basé sur la couleur dominante de la pièce
  const bgGradient = `linear-gradient(180deg, #fff 0%, ${product.dominant_color_hex}30 100%)`;

  return (
    <Link
      href={`/produit/${product.slug}`}
      className="group block bg-white rounded-xl overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      <div
        className="aspect-square relative"
        style={{ background: bgGradient }}
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-contain p-4 transition-transform group-hover:scale-105"
          unoptimized
        />

        {/* Pastilles palettes en haut à gauche */}
        <div className="absolute top-2 left-2 flex gap-1">
          {product.matching_palettes.slice(0, 3).map((palette, i) => (
            <span
              key={palette.id}
              className="w-2 h-2 rounded-full border border-black/10"
              style={{ background: palette.dominant_color }}
              title={palette.name}
            />
          ))}
        </div>

        {/* Cœur favoris en haut à droite */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setLiked(!liked);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center hover:bg-white"
          aria-label="Favoris"
        >
          <Heart
            className="w-3.5 h-3.5 text-[#1a1a1a]"
            fill={liked ? '#1a1a1a' : 'none'}
          />
        </button>
      </div>

      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[9px] tracking-[0.15em] uppercase text-[#8a7a68]">
          {product.brand}
        </p>
        <p className="text-xs text-[#1a1a1a] my-1 truncate">
          {product.name}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#1a1a1a]">
            {product.price.toLocaleString('fr-FR')} €
          </p>
          {product.matching_palettes.length > 0 && (
            <span className="text-[10px] text-[#6e3b32]">
              {product.matching_palettes.length} palette{product.matching_palettes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

---

## 3. Les 7 changements visuels clés

### 1. Densité réduite
- **Avant** : grille 4 colonnes, ~50 produits visibles en 1 scroll
- **Après** : grille 3 colonnes, ~15 produits visibles, **chacun a de la présence**

### 2. Background dégradé
Chaque card a un **dégradé subtil** du blanc en haut vers une teinte de la couleur dominante du produit en bas (à 30% d'opacité).

```css
background: linear-gradient(180deg, #fff 0%, #ede4d430 100%);
```

**Effet** : les chaussures noisette ont un fond crème, les sneakers blanches un fond beige clair, les bottines noires un fond gris... C'est **l'inverse d'Amazon** : le fond raconte le produit.

### 3. Pastilles palettes WADA
**3 petites pastilles** en haut à gauche montrent les palettes dans lesquelles ce produit apparaît. Au survol → tooltip avec le nom de chaque palette.

C'est **le marqueur unique WADA**. Aucun concurrent ne fait ça.

### 4. Texte « X palettes »
Au lieu d'un simple prix, on ajoute *« 7 palettes »* en bordeaux. Le client comprend immédiatement que ce produit est **polyvalent** (présent dans plusieurs tenues).

### 5. Sections thématiques
Au lieu de tout afficher en vrac, on **regroupe par sous-style** :
- Sneakers minimalistes
- Sneakers streetwear
- Mocassins & derbies
- Bottines & boots
- Sandales d'été

Chaque section a son label discret en uppercase letter-spacing.

### 6. Hover state premium
Au survol d'une card :
- Léger soulèvement (`hover:-translate-y-0.5`)
- Ombre douce (`hover:shadow-md`)
- L'image zoom légèrement (`scale-105`)

**Effet** : le client sent que le produit est « tangible ».

### 7. Filter chips visibles
Plus de filtres cachés. Les sous-catégories sont **immédiatement disponibles** sous le titre — un clic et on filtre.

---

## 4. Filtres avancés (drawer latéral)

Au clic sur « ⚙ Filtrer » dans la toolbar, ouvrir un **drawer latéral droit** :

```tsx
// components/category/FilterDrawer.tsx

export function FilterDrawer({ open, onClose, filters, onApply }: Props) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-[380px] h-full bg-white p-6 overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl">Filtrer</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {/* Palette filter */}
        <div className="mb-6">
          <p className="text-[10px] tracking-widest uppercase text-[#8a7a68] mb-3">Palette</p>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {ALL_PALETTES.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" />
                <span className="flex gap-0.5">
                  {p.colors.slice(0, 4).map(c => (
                    <span key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                  ))}
                </span>
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brand filter */}
        <div className="mb-6">
          <p className="text-[10px] tracking-widest uppercase text-[#8a7a68] mb-3">Marque</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map(b => (
              <label key={b.slug} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" />
                <span>{b.name}</span>
                <span className="text-[#8a7a68] text-xs ml-auto">{b.count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price filter */}
        <div className="mb-6">
          <p className="text-[10px] tracking-widest uppercase text-[#8a7a68] mb-3">Prix</p>
          <input type="range" min="0" max="2000" className="w-full" />
          <div className="flex justify-between text-xs text-[#5a5a5a] mt-1">
            <span>0 €</span>
            <span>2 000+ €</span>
          </div>
        </div>

        {/* Sticky bottom actions */}
        <div className="sticky bottom-0 bg-white pt-4 border-t border-[#e8dfd0] flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border border-[#d4ccc0] rounded-full text-sm">
            Effacer
          </button>
          <button onClick={onApply} className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-full text-sm">
            Voir les résultats
          </button>
        </div>

      </div>
    </Dialog>
  );
}
```

---

## 5. Backend — calculer les palettes par produit

Pour afficher les pastilles palettes sous chaque produit, il faut savoir **dans quelles palettes ce produit apparaît**.

```typescript
// lib/products/matching-palettes.ts

export async function getMatchingPalettes(product: Product): Promise<Palette[]> {
  // 1. Récupérer toutes les palettes
  const palettes = await db.palette.findMany();

  // 2. Pour chaque palette, vérifier si le produit matche
  return palettes.filter(palette => {
    // Match couleur : delta E entre product.color_hex et chaque couleur de la palette
    const colorMatches = palette.colors.some(paletteColor =>
      deltaE(product.color_hex, paletteColor) < 30
    );

    // Match macro_style : le style du produit est compatible avec l'identité de la palette
    const styleMatches = palette.preferred_styles.includes(product.macro_style);

    return colorMatches && styleMatches;
  });
}
```

À stocker en cache sur chaque produit lors de l'import (script one-shot, ~$0,50 total via
les calculs déjà existants).

---

## 6. Pages à dupliquer

Cette structure est **identique** pour toutes les catégories. Code une fois, applique partout :

| URL | Catégorie | Sous-catégories |
|---|---|---|
| /chaussures | Chaussures | Sneakers, Mocassins, Derbies, Bottines, Sandales, Birkenstocks |
| /vetements | Vêtements | T-shirts, Chemises, Pulls, Vestes, Manteaux, Pantalons, Jeans, Robes, Jupes |
| /sacs | Sacs | Sacs à main, Sacs à dos, Pochettes, Sacs voyage, Cabas |
| /accessoires | Accessoires | Ceintures, Foulards, Chapeaux, Lunettes, Montres |
| /bijoux | Bijoux | Bagues, Colliers, Boucles d'oreilles, Bracelets, Broches |

Le composant `<CategoryPage />` est générique et prend `{ category, subcategories }` en props.

---

## 7. Mobile responsive

Sur mobile (≤ 768px) :

- **Hero** : titre légèrement réduit (font-size 36px au lieu de 48px)
- **Filter chips** : scrollable horizontalement
- **Grille** : passe en **2 colonnes** au lieu de 3
- **Toolbar** : « Filtrer » devient une icône seule
- **Filter drawer** : prend **plein écran** au lieu de 380px

---

## 8. Plan d'implémentation

**Phase 1 — Le squelette (1h)**
- Composants `<CategoryHero />`, `<SubcategoryChips />`, `<Toolbar />`, `<SectionLabel />`
- Route `/chaussures` avec layout

**Phase 2 — La card premium (1h)**
- Composant `<ProductCard />` avec gradient, pastilles palettes, hover state
- Backend `getMatchingPalettes()` pour calculer les palettes par produit

**Phase 3 — Grouping par sections (30 min)**
- Algorithme `groupProducts()` par catégorie
- Affichage avec `<SectionLabel />` entre chaque groupe

**Phase 4 — Filter drawer (1h)**
- Drawer latéral avec palette/marque/prix
- État de filtres synchronisé avec URL params

**Phase 5 — Duplication (15 min par catégorie)**
- Vêtements, Sacs, Accessoires, Bijoux héritent du même pattern

**Total** : 3-4h pour Chaussures + Vêtements, +30 min par catégorie additionnelle.

---

## 9. Pourquoi cette refonte est cruciale

**Aujourd'hui** :
- La page catégorie est le **2ème point d'entrée** sur WADA (après l'accueil)
- C'est où **se prend la décision d'achat** (le client choisit son produit)
- Une mauvaise présentation = **abandon immédiat**

**Avec cette refonte** :
- Le client comprend en 2 secondes **où il est** (titre éditorial)
- Il voit **ce qui mérite son attention** (sections curées)
- Il peut **filtrer par palette WADA** (différenciation totale)
- Chaque produit a de la **présence** (gradient, pastilles)
- Il **revient** sur la page parce qu'elle est belle

**Effet attendu** :
- Temps moyen passé sur page catégorie : ×2
- Taux de clic sur produits : +40%
- Taux de retour sur le site : +25%

---

## 10. À envoyer au codeur

Ce fichier + les 4 specs existantes :
1. Composer cohérence
2. Flat lay shoppable
3. Styliste IA framework
4. Page tenue V2 narrative
5. **Ce fichier** (pages catégorie V2 premium)

Avec ces 5 briefs, **toutes les pages principales** de WADA sont spec'd :
- Accueil ✓ (vidéo hero)
- Boutique ✓
- Palettes ✓
- Styliste IA ✓
- **Catégorie ✓** (cette spec)
- Tenue ✓

WADA devient un site **complet et cohérent**. Plus rien ne dépare.

---

## Une dernière chose

La phrase qui résume cette refonte :

> **« Une page WADA ne montre pas tout. Elle propose quelque chose. »**

C'est la différence entre **Lyst** (qui montre 50 000 produits) et **Net-a-Porter** (qui en
montre 200). Ces 200 sont **sélectionnés**, **présentés**, **racontés**.

C'est le côté Net-a-Porter qu'on copie. Pas l'agrégateur.
