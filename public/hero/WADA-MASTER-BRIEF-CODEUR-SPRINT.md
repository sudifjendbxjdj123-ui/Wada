# WADA — MASTER BRIEF CODEUR · Sprint complet

**Ce fichier est ton plan de bataille pour les 3 prochaines semaines.**

Il consolide toutes les specs récentes en **9 chantiers prioritaires**, à exécuter dans
l'ordre. Chaque chantier réfère vers un fichier détaillé pour le code complet.

---

## Vue d'ensemble

```
SEMAINE 1 — Fixes critiques + bases
├── Jour 1   : FIX URGENT photos produits (object-contain) [30 min]
├── Jour 1   : RESTAURER home + Boutique sur /boutique [1h]
├── Jour 1   : REVERT Styliste si pas déjà fait [30 min]
├── Jour 2-3 : Refonte page tenue FINAL premium [10h]
└── Jour 4-5 : Refonte pages catégorie premium [6-8h]

SEMAINE 2 — Filtres + Quick view + Composer
├── Jour 1-2 : Système de filtres complets sidebar [4-6h]
├── Jour 3-4 : Quick view modal premium [3-4h]
└── Jour 5   : Cohérence composer + Styliste IA [4-6h]

SEMAINE 3 — Catalogue (intégration de marques)
├── Jour 1-2 : Intégration New Era (25 367 produits) [2-3h + IA]
├── Jour 3-4 : Intégration K&Ö (44 500 produits, 520 marques) [4-5h]
└── Jour 5   : Tests + déploiement
```

**Total** : ~30-40h de travail réparties sur 3 semaines.

---

# CHANTIER 1 — FIX URGENT photos produits

**Priorité** : ⚠️ ABSOLUE
**Durée** : 30 min
**Spec détaillée** : `public/hero/WADA-FIX-photos-produits-cropped.md`

## Problème

Les images produits sont actuellement **zoomées et croppées** (object-cover). On ne voit
qu'un détail au lieu du produit entier.

## Solution en 4 règles

1. **`object-contain` partout** au lieu de `object-cover`
2. **Padding 16-24px** sur le container image
3. **Fond gris pâle uniforme** `#f8f8f8`
4. **Ratio carré strict** `aspect-square`

## Composants à modifier

```
components/category/ProductCard.tsx
components/boutique/BoutiqueNouveautes.tsx
components/product/QuickViewModal.tsx
components/tenue/PieceCard.tsx
+ tout autre composant qui affiche une image produit
```

## Code de référence

```tsx
<div className="aspect-square bg-[#f8f8f8] rounded-xl overflow-hidden relative
                p-5 flex items-center justify-center">
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

---

# CHANTIER 2 — RESTAURER home + Boutique sur /boutique

**Priorité** : ⚠️ ABSOLUE
**Durée** : 1h
**Spec détaillée** : `public/hero/WADA-URGENT-CORRECTION-home-vs-boutique.md`

## Demande

- **`/` (homepage)** doit retrouver son design original : vidéo Hannya mask + "Trouvez la
  couleur. Trouvez votre style." + CTA "Scanner une couleur" / "Notre histoire"
- **`/boutique` (NOUVEAU)** doit contenir le design "Les pièces incontournables du moment"

## Méthode

Si Git :
```bash
git checkout <commit-avant-refonte> -- app/page.tsx
```

Sinon utiliser le code dans le brief détaillé pour reconstruire `app/page.tsx`.

Puis créer `app/boutique/page.tsx` avec le contenu Mango-style.

## Vérification

- `wada.style/` → vidéo Hannya + "Trouvez la couleur"
- `wada.style/boutique` → "Les pièces incontournables du moment"
- Logo WADA pointe vers `/`
- Lien "Boutique" dans la nav pointe vers `/boutique`

---

# CHANTIER 3 — Refonte page tenue FINAL premium ⭐

**Priorité** : HAUTE
**Durée** : 8-10h
**Spec détaillée** : `public/hero/WADA-page-tenue-FINAL-premium.md`

## Vision

Transformer la page tenue de "catalogue technique" en **page éditoriale Net-a-Porter** avec
12 leviers de conversion intégrés.

## Structure mobile-first

```
1. Breadcrumb : Accueil > Mes tenues > Look du 24 Mai
2. Hero gallery (gauche desktop / haut mobile) :
   - Photo éditoriale principale 4:5
   - Thumbnails verticaux (+ bouton 3D)
   - Cœur favoris flottant
3. Panel détail (droite desktop / bas mobile) :
   - Eyebrow "LOOK DU [date]"
   - Titre serif (ex: "Élégance naturelle")
   - Description 1-2 lignes
   - 4 tags contextuels : 🌸 Saison · 🌡 Météo · 📍 Ville · ✨ Style
   - Badge "Sélectionné pour vous" avec sparkle (fond sandy)
   - Liste des pièces avec : image, brand, nom, prix, SELECTEUR TAILLE, cœur
   - Total + "Livraison & retours gratuits"
   - CTA noir prominent "AJOUTER LE LOOK AU PANIER"
   - Mention Klarna "Payez en 3 fois sans frais"
4. Complétez votre look (carousel 5 accessoires)
5. Pourquoi on aime ce look (2 photos + 3 raisons avec icônes)
6. Déjà adopté par notre communauté (3 reviews avec photos)
7. Pourquoi acheter chez WADA (4 trust pillars)
8. Newsletter signup
```

## Composants à créer

```
components/tenue/Breadcrumb.tsx
components/tenue/OutfitHeroGallery.tsx
components/tenue/OutfitDetailPanel.tsx
components/tenue/PiecesList.tsx
components/tenue/ContextTags.tsx
components/tenue/CompletezVotreLook.tsx
components/tenue/PourquoiOnAimeCeLook.tsx
components/tenue/CommunityReviews.tsx
components/tenue/TrustPillars.tsx
components/tenue/NewsletterSignup.tsx
```

## API endpoints

```
/api/outfits/[id]/accessories   → 5 accessoires complémentaires
/api/outfits/[id]/reviews       → avis communauté avec photos
/api/weather/[city]             → météo cible avec cache 6h
```

## Migrations DB

```sql
ALTER TABLE outfits ADD COLUMN target_city TEXT DEFAULT 'Genève';
ALTER TABLE outfits ADD COLUMN target_date DATE;
ALTER TABLE outfits ADD COLUMN season TEXT;
ALTER TABLE outfits ADD COLUMN style_label TEXT;

CREATE TABLE outfit_photos (
  id SERIAL PRIMARY KEY,
  outfit_id INT REFERENCES outfits(id),
  url TEXT NOT NULL,
  thumb_url TEXT,
  type TEXT NOT NULL,  -- 'main' | 'detail' | 'full' | '3d'
  position INT
);

CREATE TABLE outfit_reviews (
  id SERIAL PRIMARY KEY,
  outfit_id INT REFERENCES outfits(id),
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
```

## Code complet

Voir `public/hero/WADA-page-tenue-FINAL-premium.md` section par section.

---

# CHANTIER 4 — Refonte pages catégorie premium

**Priorité** : HAUTE
**Durée** : 6-8h
**Spec détaillée** : `public/hero/WADA-pages-categorie-V2-premium.md`

## Vision

Remplacer le mur de produits dense par une **grille curée style Net-a-Porter** avec :
- Hero éditorial (titre serif + sous-titre italique)
- Grille 3 colonnes aérée (pas 4)
- Background dégradé subtil par produit (du blanc vers la teinte dominante)
- Pastilles palettes WADA en haut de chaque card
- Sections thématiques ("Sneakers minimalistes", "Mocassins & derbies", "Bottines & boots")
- Hover state premium (translate-y-0.5 + shadow-md + scale-105)

## URL pattern

```
/chaussures, /vetements, /sacs, /accessoires, /bijoux
+ sous-catégories : /vetements/blazers, /chaussures/sneakers, etc.
```

## Composant central : ProductCard

```tsx
<Link href={...} className="group block">
  <div className="aspect-square bg-[#f8f8f8] rounded-xl overflow-hidden relative
                  p-5 flex items-center justify-center mb-3
                  transition-shadow group-hover:shadow-md">
    <Image ... className="object-contain w-full h-full" />

    <div className="absolute top-3 left-3 flex gap-1">
      {product.matching_palettes.slice(0, 3).map(p => (
        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
      ))}
    </div>

    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white">
      <Heart className="w-4 h-4" />
    </button>
  </div>

  <p className="text-[10px] tracking-widest uppercase text-[#8a7a68]">
    {product.brand}
  </p>
  <p className="text-xs text-[#1a1a1a] line-clamp-2">{product.name}</p>
  <div className="flex justify-between">
    <p className="text-sm font-medium">{product.price} €</p>
    {product.matching_palettes.length > 0 && (
      <span className="text-[10px] text-[#6e3b32]">
        {product.matching_palettes.length} palettes
      </span>
    )}
  </div>
</Link>
```

---

# CHANTIER 5 — Système de filtres complets sidebar

**Priorité** : HAUTE
**Durée** : 4-6h
**Spec détaillée** : `public/hero/WADA-filtres-categorie-complets-spec.md`

## 11 filtres à implémenter

| # | Filtre | Type UI | Unique WADA |
|---|---|---|---|
| 1 | **Palette Sanzō Wada** | Multi-select avec mini-swatches | ⭐ OUI |
| 2 | Type | Checkboxes + compteurs | Non |
| 3 | Genre | Tabs Femme/Homme/Mixte | Non |
| 4 | Marque | Multi-select | Non |
| 5 | Couleur | 12 pastilles | Non |
| 6 | Taille | Grid 4×2 | Non |
| 7 | Prix | Range slider | Non |
| 8 | Style | Multi-select macro_styles | ⭐ OUI |
| 9 | Saison | Tabs | ⭐ OUI |
| 10 | Matière | Multi-select | Non |
| 11 | Promotion | Toggle | Non |

## Architecture

- Sidebar 220px sticky desktop, drawer plein écran mobile
- Filtre Palette en TOP avec fond sandy (`#fef3e8`)
- Pills filtres actifs au-dessus du contenu
- État synchronisé avec URL params (`?palettes=xxx&type=yyy`)
- Compteurs live à côté de chaque option
- Bouton "Voir (143)" qui montre le nombre de résultats

## Backend endpoints

```
/api/products/search                       → produits avec filtres
/api/categories/[category]/counts?dim=X    → compteurs par dimension
/api/palettes/popular                      → top 10 palettes
```

## Script d'indexation

```typescript
// Calcul matching_palette_ids pour chaque produit
// À lancer one-shot + lors de chaque nouveau produit
```

---

# CHANTIER 6 — Quick view modal premium

**Priorité** : HAUTE
**Durée** : 3-4h
**Spec détaillée** : `public/hero/WADA-quickview-produit-V2-spec.md`

## Vision

Quand le client clique sur un produit dans la grille, **une modale flottante** s'ouvre
au centre avec :

- Image héros à gauche (carrée, fond dégradé subtil)
- 4 thumbnails verticaux : photo / 360° / zoom / autres angles
- Côté droit :
  - Brand + nom + prix
  - **3 mini-cards "Palettes WADA compatibles"** ⭐ FEATURE UNIQUE
  - Sélecteur de pointures/tailles
  - Bouton cœur + bouton "Acheter sur [merchant] ↗"
  - 2 boutons secondaires : "Composer une tenue" + "Voir similaires"
  - Bloc réassurance (lien Awin / paiement sécurisé / retours gratuits)
  - **"3 tenues WADA avec cette pièce"** ⭐ FEATURE UNIQUE → multiplie l'AOV ×2,5

## Composant central

```tsx
<div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-6">
  <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh]
                  grid md:grid-cols-[1.1fr_1fr] overflow-hidden">
    <ImageSide product={product} />
    <MetaSide product={product} />
  </div>
</div>
```

---

# CHANTIER 7 — Cohérence composer + Styliste IA

**Priorité** : MOYENNE
**Durée** : 6-8h
**Specs détaillées** :
- `public/hero/WADA-composer-coherence-FINAL.md`
- `public/hero/WADA-styliste-IA-framework-FINAL.md`

## Le composer cohérent

Implémenter les 5 règles philosophiques + matrice de compatibilité 10 macro-styles :

```typescript
// lib/composer/styles.ts
type MacroStyle = 'minimaliste' | 'romantique' | 'streetwear' | 'boheme' | 'edgy'
                | 'academia' | 'country' | 'soiree' | 'plage' | 'sport';

// lib/composer/compatibility.ts
const STYLE_COMPATIBILITY: Record<MacroStyle, Record<MacroStyle, number>> = {
  // matrice 10×10 — voir spec détaillée
};

// lib/composer/forbidden.ts
const FORBIDDEN_COMBINATIONS = [
  { styles: ['streetwear', 'soiree'], reason: 'Hoodie + paillettes' },
  // ...
];

// lib/composer/scoring.ts
function scoreOutfit(pieces, context): OutfitScore {
  // Validation + kill-switches + scoring sur 10
}
```

## Le Styliste IA framework

```typescript
// Les 5 questions onboarding
const ONBOARDING_QUESTIONS = [
  { id: 'occasion', label: 'Pour quelle occasion ?', options: [...] },
  { id: 'saison', label: 'Quelle saison ?', options: [...] },
  { id: 'budget', label: 'Quel budget ?', type: 'slider' },
  { id: 'image', label: 'Quelle image voulez-vous renvoyer ?', options: [...] },
  { id: 'audace', label: 'Quel niveau d\'audace ?', type: 'slider' },
];

// Mapping Image → macro_styles
const IMAGE_TO_STYLES = {
  discret:     ['minimaliste', 'academia'],
  elegant:     ['minimaliste', 'soiree', 'romantique'],
  creatif:     ['boheme', 'edgy', 'minimaliste'],
  decontracte: ['streetwear', 'plage', 'boheme'],
};

// Reasoning template GPT-4
const SYSTEM_PROMPT = `Tu es la styliste WADA, ex-Lemaire, ex-Vogue Paris...`;
```

---

# CHANTIER 8 — Intégration New Era (25 367 produits)

**Priorité** : MOYENNE
**Durée** : 2-3h + 30 min d'enrichissement IA
**Spec détaillée** : `public/hero/WADA-integration-new-era-flux-awin.md`

## Particularités à gérer

| Particularité | Solution |
|---|---|
| `large_image` vide 100% | Fallback cascade vers `alternate_image` |
| `colour` vide 94% | Enrichissement GPT-4o-mini Vision ($2,50) |
| `category_path` vide 100% | Hardcoder `casquettes` |

## Variable Vercel

```
NEW_ERA_AWIN_FEED_URL=[URL transmise par DM uniquement]
```

## Scripts

```typescript
scripts/import-new-era-feed.ts         // parsing CSV.gz
scripts/enrich-new-era-colors.ts       // Vision pour couleur
scripts/index-new-era-palettes.ts      // matching palettes
scripts/onboard-new-era.ts             // master orchestrateur
```

## Volume attendu

**~20 000 casquettes affichables** sur WADA après onboarding.

---

# CHANTIER 9 — Intégration Kastner & Öhler CH (44 500 produits)

**Priorité** : HAUTE (gros levier catalogue)
**Durée** : 4-5h
**Spec détaillée** : `public/hero/WADA-integration-kastner-ohler-flux-awin.md`

## Particularités à gérer

| Particularité | Solution |
|---|---|
| Langue allemande | Tables mapping DE→FR (couleurs + catégories) |
| Devise CHF | Garder + conversion EUR optionnelle |
| `Fashion:suitable_for` vide 97% | Déduire depuis category_path (Herren/Damen) |
| `is_for_sale = 0` pour 42% | Filtrer à l'import |
| `large_image` vide 100% | Fallback alternate_image |

## Variable Vercel

```
KO_AWIN_FEED_URL=[URL transmise par DM uniquement]
```

## Tables mapping DE→FR

```typescript
// lib/translations/de-fr.ts
export const COLOR_DE_TO_FR = {
  schwarz: { fr: 'noir', hex: '#1a1a1a' },
  blau: { fr: 'bleu', hex: '#2c4a8a' },
  // ... 35 couleurs au total
};

export const CATEGORY_DE_TO_FR = {
  'Herren': 'Homme', 'Damen': 'Femme', 'Kinder': 'Enfant',
  'Bekleidung': 'Vêtements', 'Schuhe': 'Chaussures',
  'Anzüge': 'Costumes', 'Hosen': 'Pantalons',
  // ... ~60 termes
};
```

## Volume attendu

**~30 000 produits multi-marques premium** dont :
- Polo Ralph Lauren (~2 800)
- Tommy Hilfiger (~2 900)
- Boss + HUGO (~3 800)
- BRAX (~3 600)
- Marc O'Polo, Drykorn, Levi's, Adidas Originals
- + 510 autres marques européennes

## Scripts

```typescript
scripts/import-ko-feed.ts              // parsing CSV.gz avec filter is_for_sale=1
scripts/index-ko-palettes.ts           // matching palettes (couleurs déjà OK)
scripts/clean-ko-images.ts             // filtrage photos mannequin (mode permissif)
scripts/onboard-ko.ts                  // master orchestrateur
```

---

# CONFIGURATION GLOBALE

## Variables d'environnement Vercel à créer

```bash
# Marques Awin (URLs privées, JAMAIS dans le code)
NEW_ERA_AWIN_FEED_URL=https://...
KO_AWIN_FEED_URL=https://...

# Conversion CHF→EUR (à mettre à jour mensuellement)
CHF_TO_EUR_RATE=0.95

# OpenAI (pour Vision + composer)
OPENAI_API_KEY=sk-...

# Replicate (déjà configuré)
REPLICATE_API_TOKEN=r8_...

# Awin API key (déjà dans tes flux URLs)
# AWIN_PUBLISHER_ID=2879911

# Weather API
OPENWEATHER_API_KEY=...
```

## Vercel Cron

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-all-feeds",
      "schedule": "0 4 * * *"
    },
    {
      "path": "/api/cron/refresh-weather",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Migrations DB cumulées

```sql
-- Outfits enrichies
ALTER TABLE outfits ADD COLUMN target_city TEXT DEFAULT 'Genève';
ALTER TABLE outfits ADD COLUMN target_date DATE;
ALTER TABLE outfits ADD COLUMN season TEXT;
ALTER TABLE outfits ADD COLUMN style_label TEXT;

-- Photos éditoriales
CREATE TABLE outfit_photos (
  id SERIAL PRIMARY KEY,
  outfit_id INT NOT NULL REFERENCES outfits(id),
  url TEXT NOT NULL,
  thumb_url TEXT,
  type TEXT NOT NULL,
  position INT
);

-- Reviews
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

-- Produits enrichis
ALTER TABLE products ADD COLUMN IF NOT EXISTS raw_color TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_color_enriched BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_intensity REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_pattern BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS matching_palette_ids TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS alternate_images TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_product_id TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_chf REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_eur REAL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_path_de TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_path_fr TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern TEXT;

-- Index
CREATE INDEX idx_products_matching_palettes ON products USING GIN (matching_palette_ids);
CREATE INDEX idx_products_source ON products (source);
CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_gender ON products (gender);
CREATE INDEX idx_reviews_outfit ON outfit_reviews(outfit_id);
CREATE INDEX idx_reviews_helpful ON outfit_reviews(helpful_count DESC);
```

---

# COÛTS PRÉVISIONNELS

| Chantier | Coût IA |
|---|---|
| Fix photos produits | 0€ |
| Restauration home | 0€ |
| Page tenue premium | ~$0,50/mois (génération suggestions accessoires + raisons) |
| Pages catégorie premium | 0€ |
| Filtres complets | 0€ |
| Quick view premium | 0€ |
| Composer + Styliste IA | ~$5-10/mois (compositions GPT-4o-mini) |
| Intégration New Era | **$2,54** one-shot (Vision couleurs) |
| Intégration K&Ö | **~$25** one-shot (Vision mannequin + matière) |
| **TOTAL ONE-SHOT** | **~$30** |
| **TOTAL RÉCURRENT** | **~$10/mois** |

---

# CHECKLIST DE LIVRAISON

```
SEMAINE 1
□ object-contain partout (test sur chaussures + sneakers)
□ Home restaurée (vidéo Hannya visible)
□ /boutique créée avec design Mango-style
□ Lien "Boutique" nav pointe vers /boutique
□ Logo WADA pointe vers /
□ Page tenue refondue : photo hero + thumbnails + tags contextuels
□ Sélecteurs taille fonctionnent
□ Total + Klarna affichés
□ "Complétez votre look" : 5 accessoires affichés
□ "Pourquoi on aime ce look" : 2 photos + 3 raisons
□ "Communauté" : 3 reviews avec photos
□ "Trust pillars" : 4 colonnes
□ Newsletter signup fonctionne
□ Pages catégorie premium : grille 3 colonnes
□ Pastilles palettes en haut de chaque card
□ Background dégradé par produit
□ Sections thématiques fonctionnent

SEMAINE 2
□ Sidebar filtres avec 11 filtres
□ Filtre Palette en TOP avec fond sandy
□ Pills filtres actifs au-dessus de la grille
□ Drawer mobile plein écran
□ URL params synchronisés
□ Quick view modal s'ouvre au clic produit
□ Image hero + thumbnails dans la modale
□ "Compatible avec ces palettes WADA" : 3 mini-cards
□ "3 tenues WADA avec cette pièce" : grid affichée
□ Boutons Acheter / Composer / Similaires fonctionnent
□ Composer cohérent : score sur 10
□ Kill switches actifs (streetwear+soirée rejetée)
□ Styliste IA : 5 questions + scoring

SEMAINE 3
□ NEW_ERA_AWIN_FEED_URL dans Vercel
□ KO_AWIN_FEED_URL dans Vercel
□ scripts/onboard-new-era.ts lancé
□ scripts/onboard-ko.ts lancé
□ /marques/new-era : ~20 000 produits
□ /marques/polo-ralph-lauren : ~2 800 produits
□ /marques/boss : ~2 500 produits
□ Filtre Palette fonctionne sur catalogue K&Ö
□ Conversion CHF→EUR affichée pour visiteurs FR
□ Tests E2E : parcours complet ajout panier
□ Performance : Lighthouse score > 80
□ Mobile responsive testé sur iPhone + Android
□ Déploiement Vercel sans erreur
```

---

# SUPPORT — Fichiers de spec détaillée

Pour CHAQUE chantier, le code complet + design + détails sont dans ces fichiers :

| Chantier | Fichier spec |
|---|---|
| 1. Fix photos | `WADA-FIX-photos-produits-cropped.md` |
| 2. Restauration home | `WADA-URGENT-CORRECTION-home-vs-boutique.md` |
| 3. Page tenue premium | `WADA-page-tenue-FINAL-premium.md` |
| 4. Pages catégorie | `WADA-pages-categorie-V2-premium.md` |
| 5. Filtres complets | `WADA-filtres-categorie-complets-spec.md` |
| 6. Quick view | `WADA-quickview-produit-V2-spec.md` |
| 7. Composer cohérent | `WADA-composer-coherence-FINAL.md` |
| 7. Styliste IA | `WADA-styliste-IA-framework-FINAL.md` |
| 8. New Era | `WADA-integration-new-era-flux-awin.md` |
| 9. K&Ö | `WADA-integration-kastner-ohler-flux-awin.md` |

---

# DEMANDES SPÉCIALES

## Sécurité absolue

⚠️ Les URLs des flux Awin contiennent des **clés API privées**. **JAMAIS** :
- Commit dans le code source
- Log dans Vercel logs
- Partager dans un canal public

Toujours utiliser les **variables d'environnement Vercel** et ne les transmettre
qu'en **DM privé** (jamais Slack public, Discord, etc.).

## Sauvegardes

Avant chaque chantier, **commit** les changements actuels dans Git pour pouvoir revert
si problème. Sinon, créer un dossier `backup/` dans `/public/` avec les anciennes
versions des composants modifiés.

## Tests

Pour chaque chantier, tester sur :
- Desktop Chrome 1440px
- Mobile Safari iPhone 14 Pro (390px)
- Mobile Android Chrome (~360px)

Vérifier que :
- Aucune image n'est croppée (object-contain partout)
- Tous les boutons sont cliquables (zones suffisantes mobile)
- Le contraste texte est lisible
- Le scroll horizontal n'apparaît jamais sur mobile

---

# EN CAS DE PROBLÈME

Si un chantier prend plus de temps que prévu, **NE PAS** :
- Sauter d'étapes
- Hardcoder des valeurs temporaires
- Ignorer les erreurs TypeScript

**FAIRE** :
- Documenter le blocage dans un commentaire
- Passer au chantier suivant si non bloquant
- Demander de l'aide via Telegram/email

---

# CONCLUSION

Ce sprint transforme WADA d'un **prototype d'agrégateur** en **vraie plateforme mode pro**.

À la fin des 3 semaines :
- Catalogue : ~50 000 → ~100 000 produits (×2)
- Marques : ~10 → ~520 (×52)
- Panier moyen attendu : 50€ → 600-800€ (×15)
- Crédibilité : "site mal fait" → "rivalisant avec Net-a-Porter"

C'est le sprint le plus important de l'histoire de WADA. Bonne route.

**Nemanja Milošević, Genève · Juin 2026**
