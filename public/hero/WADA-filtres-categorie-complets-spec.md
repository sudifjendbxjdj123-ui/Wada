# WADA — Système de filtres complets sur pages catégorie

Spec du système de filtres latéral (style Suitable.fr / Lyst / Net-a-Porter) avec ajout
unique : **Filtre Palette Sanzō Wada**.

**Durée dev estimée** : 4-6h (sidebar desktop + drawer mobile + endpoints).

---

## Les 11 filtres disponibles

| # | Filtre | Type UI | Position |
|---|---|---|---|
| 1 | **Palette Sanzō Wada** ⭐ | Multi-select avec mini-swatches | TOP (mis en valeur) |
| 2 | Type (sous-catégorie) | Checkboxes + compteurs | 2 |
| 3 | Genre | Tabs (Femme/Homme/Mixte) | 3 |
| 4 | Marque | Multi-select + search bar | 4 |
| 5 | Couleur | Pastilles cliquables | 5 |
| 6 | Taille / Pointure | Grid 4×2 | 6 |
| 7 | Prix | Range slider 2 poignées | 7 |
| 8 | Style | Multi-select (macro_styles) | 8 |
| 9 | Saison | Tabs | 9 |
| 10 | Matière | Multi-select | 10 |
| 11 | Promotion | Toggle (Soldes / Nouveau) | 11 |

---

## 1. Structure du composant

```tsx
// components/category/FilterSidebar.tsx

'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersState {
  palettes: string[];      // palette IDs
  types: string[];
  genres: ('femme' | 'homme' | 'mixte')[];
  brands: string[];
  colors: string[];
  sizes: string[];
  priceMin: number;
  priceMax: number;
  styles: MacroStyle[];
  seasons: ('ete' | 'mi-saison' | 'hiver')[];
  materials: string[];
  onSale: boolean;
}

export function FilterSidebar({
  category,
  filters,
  onChange,
  resultCount,
}: Props) {
  const [openGroups, setOpenGroups] = useState({
    palette: true,    // ouvert par défaut (mise en valeur)
    type: true,
    genre: true,
    brand: false,
    color: true,
    size: true,
    price: true,
    style: false,
    season: false,
    material: false,
    promo: false,
  });

  return (
    <aside className="bg-white rounded-2xl p-4 sticky top-4 max-h-[85vh] overflow-y-auto w-[220px]">

      <p className="text-xs text-[#5a5a5a] mb-3 pb-2.5 border-b border-[#e8dfd0]">
        Filtrer {category} par
      </p>

      {/* PALETTE WADA — Filtre vedette */}
      <FilterPalette
        selected={filters.palettes}
        onChange={(v) => onChange({ ...filters, palettes: v })}
        open={openGroups.palette}
        onToggle={() => setOpenGroups({ ...openGroups, palette: !openGroups.palette })}
      />

      <FilterType
        category={category}
        selected={filters.types}
        onChange={(v) => onChange({ ...filters, types: v })}
        open={openGroups.type}
        onToggle={() => setOpenGroups({ ...openGroups, type: !openGroups.type })}
      />

      <FilterGenre
        selected={filters.genres}
        onChange={(v) => onChange({ ...filters, genres: v })}
        open={openGroups.genre}
        onToggle={() => setOpenGroups({ ...openGroups, genre: !openGroups.genre })}
      />

      <FilterBrand
        selected={filters.brands}
        onChange={(v) => onChange({ ...filters, brands: v })}
        open={openGroups.brand}
        onToggle={() => setOpenGroups({ ...openGroups, brand: !openGroups.brand })}
      />

      <FilterColor
        selected={filters.colors}
        onChange={(v) => onChange({ ...filters, colors: v })}
        open={openGroups.color}
        onToggle={() => setOpenGroups({ ...openGroups, color: !openGroups.color })}
      />

      <FilterSize
        category={category}
        selected={filters.sizes}
        onChange={(v) => onChange({ ...filters, sizes: v })}
        open={openGroups.size}
        onToggle={() => setOpenGroups({ ...openGroups, size: !openGroups.size })}
      />

      <FilterPrice
        min={filters.priceMin}
        max={filters.priceMax}
        onChange={({ min, max }) => onChange({ ...filters, priceMin: min, priceMax: max })}
        open={openGroups.price}
        onToggle={() => setOpenGroups({ ...openGroups, price: !openGroups.price })}
      />

      <FilterStyle ... />
      <FilterSeason ... />
      <FilterMaterial ... />
      <FilterPromo ... />

      {/* Actions sticky bottom */}
      <div className="flex gap-2 pt-3 mt-3 border-t border-[#e8dfd0] sticky bottom-0 bg-white">
        <button
          onClick={() => onChange(getDefaultFilters())}
          className="flex-1 py-2 text-xs border border-[#d4ccc0] rounded-full"
        >
          Effacer
        </button>
        <button
          onClick={() => {}}
          className="flex-1 py-2 text-xs bg-[#1a1a1a] text-white rounded-full"
        >
          Voir ({resultCount})
        </button>
      </div>

    </aside>
  );
}
```

---

## 2. Le filtre Palette Sanzō Wada (vedette)

C'est **le filtre unique à WADA**. Il doit être visuellement distinct des autres.

```tsx
// components/category/FilterPalette.tsx

export function FilterPalette({ selected, onChange, open, onToggle }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [palettes, setPalettes] = useState<Palette[]>([]);

  useEffect(() => {
    fetch('/api/palettes/popular')  // top 10 palettes populaires
      .then(r => r.json())
      .then(setPalettes);
  }, []);

  return (
    <div className={`mb-1 ${open ? 'bg-[#fef3e8] -mx-2 px-2 py-2.5 rounded-md' : ''}`}>

      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-2.5 border-b border-[#f0e9d8]"
      >
        <span className={`text-sm font-medium ${open ? 'text-[#6e3b32]' : 'text-[#1a1a1a]'}`}>
          Palette Sanzō Wada
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-[#6e3b32]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8a7a68]" />}
      </button>

      {open && (
        <div className="pt-2.5">
          {palettes.slice(0, 5).map(palette => (
            <label
              key={palette.id}
              className="flex items-center gap-2 py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(palette.id)}
                onChange={() => {
                  const newSelected = selected.includes(palette.id)
                    ? selected.filter(id => id !== palette.id)
                    : [...selected, palette.id];
                  onChange(newSelected);
                }}
                className="accent-[#6e3b32] w-3 h-3"
              />

              <span className="flex h-3.5 w-12 rounded overflow-hidden flex-shrink-0">
                {palette.colors.slice(0, 4).map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>

              <span className="text-xs text-[#1a1a1a]">{palette.name}</span>
            </label>
          ))}

          <button
            onClick={() => setShowAll(true)}
            className="text-[10px] text-[#6e3b32] mt-2"
          >
            + 343 palettes →
          </button>
        </div>
      )}

      {/* Modal palette picker complet */}
      {showAll && (
        <PalettePickerModal
          selected={selected}
          onChange={onChange}
          onClose={() => setShowAll(false)}
        />
      )}
    </div>
  );
}
```

---

## 3. Filtres standards (Type, Genre, Marque, etc.)

```tsx
// components/category/FilterType.tsx

const TYPES_BY_CATEGORY = {
  chaussures: ['Sneakers', 'Mocassins', 'Derbies', 'Bottines', 'Sandales', 'Birkenstocks'],
  vetements: ['T-shirts', 'Chemises', 'Polos', 'Pulls', 'Vestes', 'Manteaux', 'Pantalons', 'Jeans', 'Robes', 'Jupes', 'Shorts'],
  sacs: ['Sacs à main', 'Sacs à dos', 'Pochettes', 'Cabas', 'Banane'],
  accessoires: ['Ceintures', 'Foulards', 'Chapeaux', 'Lunettes', 'Montres', 'Cravates'],
  bijoux: ['Bagues', 'Colliers', 'Boucles d\'oreilles', 'Bracelets', 'Broches'],
};

export function FilterType({ category, selected, onChange, open, onToggle }) {
  const types = TYPES_BY_CATEGORY[category] || [];
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/categories/${category}/counts?dimension=type`)
      .then(r => r.json())
      .then(setCounts);
  }, [category]);

  return (
    <FilterGroup name="Type" open={open} onToggle={onToggle}>
      {types.map(type => (
        <label key={type} className="flex items-center gap-1.5 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(type)}
            onChange={() => toggleArrayItem(type)}
            className="accent-[#6e3b32]"
          />
          <span className="text-xs">{type}</span>
          <span className="text-xs text-[#8a7a68] ml-auto">({counts[type] || 0})</span>
        </label>
      ))}
    </FilterGroup>
  );
}
```

### Filtre Genre (3 tabs)

```tsx
export function FilterGenre({ selected, onChange, open, onToggle }) {
  return (
    <FilterGroup name="Genre" open={open} onToggle={onToggle}>
      <div className="flex gap-1 py-1.5">
        {['femme', 'homme', 'mixte'].map(g => (
          <button
            key={g}
            onClick={() => onChange([g])}  // single-select
            className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
              selected.includes(g)
                ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                : 'bg-white border-[#d4ccc0] text-[#1a1a1a]'
            }`}
          >
            {g === 'femme' ? 'Femme' : g === 'homme' ? 'Homme' : 'Mixte'}
          </button>
        ))}
      </div>
    </FilterGroup>
  );
}
```

### Filtre Couleur (pastilles)

```tsx
const COLORS = [
  { hex: '#1a1a1a',   name: 'Noir' },
  { hex: '#ffffff',   name: 'Blanc' },
  { hex: '#5a4530',   name: 'Marron' },
  { hex: '#b8c2a7',   name: 'Vert sauge' },
  { hex: '#2c4a5c',   name: 'Bleu marine' },
  { hex: '#6e3b32',   name: 'Bordeaux' },
  { hex: '#d4ccc0',   name: 'Beige' },
  { hex: '#c9c4ba',   name: 'Gris' },
  { hex: '#3d2e1f',   name: 'Bois brûlé' },
  { hex: '#a89683',   name: 'Noisette' },
  { hex: '#ede4d4',   name: 'Crème' },
  { hex: '#8b9579',   name: 'Mousse' },
];

export function FilterColor({ selected, onChange, open, onToggle }) {
  return (
    <FilterGroup name="Couleur" open={open} onToggle={onToggle}>
      <div className="flex flex-wrap gap-1.5 py-1.5">
        {COLORS.map(color => (
          <button
            key={color.hex}
            onClick={() => toggleArrayItem(color.name)}
            className={`w-[18px] h-[18px] rounded-full border ${
              selected.includes(color.name)
                ? 'outline outline-2 outline-[#1a1a1a] outline-offset-[1.5px]'
                : 'border-black/15'
            }`}
            style={{ background: color.hex }}
            title={color.name}
            aria-label={color.name}
          />
        ))}
      </div>
    </FilterGroup>
  );
}
```

### Filtre Prix (range slider)

```tsx
import { Range, getTrackBackground } from 'react-range';

export function FilterPrice({ min, max, onChange, open, onToggle }) {
  const MIN = 50;
  const MAX = 2000;

  return (
    <FilterGroup name="Prix" open={open} onToggle={onToggle}>
      <div className="py-2">
        <div className="flex justify-between text-[11px] text-[#5a5a5a] mb-2">
          <span>{MIN} €</span>
          <span className="text-[#6e3b32] font-medium">{min} - {max} €</span>
          <span>{MAX}+ €</span>
        </div>

        <Range
          values={[min, max]}
          step={10}
          min={MIN}
          max={MAX}
          onChange={([min, max]) => onChange({ min, max })}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className="h-[3px] rounded-full bg-[#e8dfd0] relative"
              style={{
                ...props.style,
                background: getTrackBackground({
                  values: [min, max],
                  colors: ['#e8dfd0', '#6e3b32', '#e8dfd0'],
                  min: MIN,
                  max: MAX,
                }),
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              className="w-3.5 h-3.5 rounded-full bg-white border-2 border-[#6e3b32]"
              style={props.style}
            />
          )}
        />
      </div>
    </FilterGroup>
  );
}
```

---

## 4. Pills filtres actifs (au-dessus du contenu)

```tsx
// components/category/ActiveFilters.tsx

export function ActiveFilters({ filters, onRemove }: Props) {
  const activePills = computeActivePills(filters);  // formate les filtres en pills

  if (activePills.length === 0) return null;

  return (
    <div className="flex gap-1.5 mb-3 flex-wrap">
      {activePills.map(pill => (
        <button
          key={pill.id}
          onClick={() => onRemove(pill.id)}
          className="bg-white border border-[#d4ccc0] px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1.5 hover:bg-[#faf6ee]"
        >
          {pill.swatches && (
            <span className="flex h-2 w-3.5 rounded overflow-hidden">
              {pill.swatches.map((c, i) => (
                <span key={i} className="flex-1" style={{ background: c }} />
              ))}
            </span>
          )}
          {pill.label}
          <X className="w-2.5 h-2.5 text-[#8a7a68]" />
        </button>
      ))}
    </div>
  );
}
```

---

## 5. Mobile : Drawer plein écran

Sur mobile (≤ 768px), le sidebar disparaît. À la place, un **bouton « Filtrer » sticky** ouvre un drawer plein écran.

```tsx
// components/category/MobileFilterButton.tsx

export function MobileFilterButton({ resultCount, activeCount, onClick }) {
  return (
    <div className="md:hidden sticky top-[64px] z-30 bg-white border-b border-[#e8dfd0] p-3 flex justify-between">
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-sm"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Filtrer
        {activeCount > 0 && (
          <span className="bg-white/20 px-1.5 rounded-full text-[10px]">{activeCount}</span>
        )}
      </button>
      <button className="text-sm text-[#1a1a1a] flex items-center gap-1">
        <ArrowUpDown className="w-3.5 h-3.5" />
        Trier
      </button>
    </div>
  );
}
```

Le drawer plein écran utilise le même composant `<FilterSidebar />` mais avec un layout différent (full-width, header avec X de fermeture, bouton « Voir (143) » sticky en bas).

---

## 6. Backend — endpoints

### `/api/categories/[category]/counts?dimension={X}`

Renvoie le compte de produits pour chaque valeur d'une dimension de filtre.

```typescript
// app/api/categories/[category]/counts/route.ts

export async function GET(req: Request, { params }) {
  const { searchParams } = new URL(req.url);
  const dimension = searchParams.get('dimension');

  const results = await db.product.groupBy({
    by: [dimension as any],
    where: { category: params.category, is_active: true },
    _count: true,
  });

  return Response.json(
    results.reduce((acc, r) => ({ ...acc, [r[dimension]]: r._count }), {})
  );
}
```

### `/api/products/search`

L'endpoint principal qui prend tous les filtres et renvoie les produits matchant.

```typescript
// app/api/products/search/route.ts

export async function POST(req: Request) {
  const filters: FiltersState = await req.json();

  let products = await db.product.findMany({
    where: {
      AND: [
        filters.types.length ? { type: { in: filters.types } } : {},
        filters.genres.length ? { gender: { in: filters.genres } } : {},
        filters.brands.length ? { brand: { in: filters.brands } } : {},
        filters.colors.length ? { color_family: { in: filters.colors } } : {},
        filters.sizes.length ? { sizes: { hasSome: filters.sizes } } : {},
        filters.styles.length ? { macro_style: { in: filters.styles } } : {},
        filters.seasons.length ? { season: { in: filters.seasons } } : {},
        filters.materials.length ? { material: { in: filters.materials } } : {},
        filters.priceMin !== undefined ? { price: { gte: filters.priceMin } } : {},
        filters.priceMax !== undefined ? { price: { lte: filters.priceMax } } : {},
        filters.onSale ? { is_on_sale: true } : {},

        // Filtre palette : produits qui matchent l'une des palettes sélectionnées
        filters.palettes.length
          ? { matching_palette_ids: { hasSome: filters.palettes } }
          : {},
      ],
    },
    take: 100,
    orderBy: getSortOrder(filters.sort),
  });

  return Response.json({ products, count: products.length });
}
```

---

## 7. Pour faire fonctionner le filtre palette

Chaque produit doit avoir un champ `matching_palette_ids` (array de palette IDs).

À calculer lors de l'import des produits :

```typescript
// scripts/index-products-palettes.ts

async function indexProductsPalettes() {
  const products = await db.product.findMany();
  const palettes = await db.palette.findMany();

  for (const product of products) {
    const matching = palettes.filter(palette => {
      // Match couleur
      const colorMatch = palette.colors.some(c =>
        deltaE(product.color_hex, c) < 30
      );
      // Match style
      const styleMatch = palette.preferred_styles?.includes(product.macro_style);

      return colorMatch && styleMatch;
    });

    await db.product.update({
      where: { id: product.id },
      data: { matching_palette_ids: matching.map(p => p.id) },
    });
  }
}
```

Coût : 0€ (calculs locaux, pas d'API).
Temps : ~10 min pour 36 000 produits.
À lancer **une fois** + lors de chaque nouveau produit.

---

## 8. Checklist d'implémentation

```
□ Composant <FilterSidebar /> avec 11 groupes
□ Composant <FilterPalette /> vedette (en haut, fond sandy)
□ Composant <PalettePickerModal /> pour les 348 palettes complètes
□ Composants individuels pour chaque type de filtre
□ Composant <ActiveFilters /> pour les pills
□ Composant <MobileFilterButton /> sticky
□ Drawer mobile plein écran
□ Endpoints :
  - /api/categories/[category]/counts
  - /api/products/search
  - /api/palettes/popular (top 10)
□ Script d'indexation des palettes par produit (one-shot)
□ État synchronisé avec URL params (?palettes=xxx&types=yyy)
□ Mémorisation des filtres entre visites (localStorage)
□ Tests :
  - Filtres se cumulent (palette + type + couleur ensemble)
  - Pills se retirent au clic ×
  - Compteurs se mettent à jour live
  - Mobile drawer fonctionne
  - URL partageable
```

---

## 9. Pourquoi cette spec est cruciale

**Le filtre palette WADA** est ce qui te démarque de TOUS les autres sites mode. Suitable, Lyst,
Net-a-Porter — aucun n'a ça. C'est ton **angle d'attaque éditorial unique**.

Le client peut dire : *« Je veux des sneakers Homme dans la palette Pluie de Tokyo »*
et obtenir **30 sneakers parfaitement cohérentes** avec un univers chromatique précis.

C'est **le pitch SEO du siècle** :
- `wada.style/chaussures?palettes=pluie-de-tokyo`
- Mot-clé : « sneakers bleu nuit minimaliste »
- Tu trustes ce mot-clé parce que personne n'a ce filtre.

---

## 10. Durée et plan

**Phase 1 — Layout sidebar + base (1h)**
- Composant FilterSidebar avec accordion
- État des filtres
- Sticky behaviors

**Phase 2 — Filtre Palette vedette (1h)**
- FilterPalette + modal picker complet
- Mini-swatches

**Phase 3 — Filtres standards (1h30)**
- Type, Genre, Marque, Couleur, Taille, Prix, Style, Saison, Matière, Promo

**Phase 4 — Pills + mobile drawer (1h)**
- ActiveFilters component
- Mobile drawer plein écran

**Phase 5 — Backend + indexation (30 min)**
- Endpoint /api/products/search
- Script d'indexation palettes

**Total : 4-6h** sur 1-2 sessions.

---

## 11. À envoyer au codeur

Ce fichier + la spec catégorie V2 premium déjà livrée. Avec ces 2 ensemble, ton catalogue
WADA devient **navigable en 5 dimensions** au lieu d'une grille plate.

C'est ce qui transforme **« un site qui affiche des produits »** en **« un service qui aide
à trouver »**.
