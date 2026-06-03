# Setup Algolia pour WADA

Algolia transforme la recherche WADA en moteur instant fuzzy. **Type-ahead 10 ms, tolérance aux fautes, filtres facettes**, ranking custom. C'est ce qu'utilisent Sézane, Lemaire, Lacoste.

## Étapes (15 min)

### 1. Créer un compte Algolia

- Va sur [algolia.com](https://www.algolia.com)
- Inscris-toi (gratuit jusqu'à 10 000 requêtes/mois)
- Crée une nouvelle application : `WADA` ou `wada-style`

### 2. Récupérer les clés API

Dans le dashboard Algolia : `Settings` → `API Keys`

Note les 3 clés :
- **Application ID** (ex : `B1A2C3D4E5`)
- **Search-Only API Key** — publique, expose côté client (commence par `xxx...`)
- **Admin API Key** — secrète, uniquement pour le script d'indexation

### 3. Configurer `.env.local`

```bash
NEXT_PUBLIC_ALGOLIA_APP_ID=B1A2C3D4E5
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=ta_search_key
ALGOLIA_ADMIN_KEY=ta_admin_key
ALGOLIA_INDEX_PALETTES=wada_palettes
ALGOLIA_INDEX_BRANDS=wada_brands
```

Sur Vercel : `Settings` → `Environment Variables` → ajouter chaque variable.

### 4. Installer les packages

```powershell
cd C:\Users\neman\wada
npm install algoliasearch
# Pour le client InstantSearch (UI search bar) :
npm install react-instantsearch react-instantsearch-router-nextjs
# Si tu veux scripter en TS direct :
npm install -D tsx
```

### 5. Indexer le dictionnaire

```powershell
node --env-file=.env.local scripts/indexAlgolia.mjs
```

Sortie attendue :

```
✓ Connexion Algolia OK (App: B1A2C3D4E5)
✓ Settings appliqués
✓ N record(s) indexé(s) dans wada_palettes
→ Test : https://www.algolia.com/apps/B1A2C3D4E5/explorer/browse/wada_palettes
```

Tu peux maintenant tester depuis le dashboard Algolia : `Indices` → `wada_palettes` → tape `terracotta` et tu vois la palette `Brunch à Brooklyn` remonter avec highlight.

### 6. Brancher le SearchBar côté client

Le fichier `lib/algolia.ts` détecte automatiquement la config via `isAlgoliaConfigured()`. Quand tu auras créé `components/SearchBar.tsx` avec InstantSearch, il utilisera Algolia si configuré, sinon fallback sur la recherche locale du dictionnaire.

## Files créés par WADA

```
lib/algolia.ts                  → helpers + types + settings recommandés
scripts/indexAlgolia.mjs        → script Node pour indexer
.env.local.example              → variables à remplir
ALGOLIA_SETUP.md                → ce fichier
```

## Ressources

- Docs Algolia : [algolia.com/doc](https://www.algolia.com/doc/)
- InstantSearch React : [algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- Pricing : [algolia.com/pricing](https://www.algolia.com/pricing) (Free 10k req/mois)

## Notes

- Le script `indexAlgolia.mjs` actuel est un **scaffold avec sample data**. Pour indexer les 348 palettes réelles, soit tu compiles `lib/data.ts` en JS, soit tu utilises `tsx` : `npx tsx scripts/indexAlgolia.ts` (renomme l'extension et importe directement les helpers).
- L'index `wada_brands` est aussi prévu (60+ marchands) — même mécanique.
- Les facettes permettent des filtres style : palette par culture, marque par tier, etc.
- Les highlights HTML (`<mark class="wada-highlight">`) peuvent être stylés dans `globals.css`.
