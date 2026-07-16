# WADA — Intégration La Redoute FR depuis le flux Awin

Brief ops pour brancher **La Redoute FR** au catalogue WADA une fois l'approbation Awin obtenue.

**Statut** : code prêt — attend uniquement l'URL du flux dans les env vars.

**Durée bascule** : ~15 min (config env + 1 tour de cron).

**Volume attendu** : quelques dizaines de milliers de produits mode, dont **Nike, Adidas, Puma, Hugo Boss, Levi's, Superdry, Only, Vero Moda**, La Redoute Collections, La Redoute Créations, plus les marques exclusives distribuées par le grand magasin.

---

## Pourquoi La Redoute

Avant cette intégration, ces marques n'existaient dans le KV WADA que via **Kastner & Öhler** — mais K&Ö est **geo-gaté CH uniquement** (livraison depuis la Suisse en CHF). Résultat : un visiteur français ouvrant `/marques/adidas-originals` ne voyait rien de pertinent.

La Redoute couvre exactement la même profondeur de marques, mais **livre en France, prix en EUR, catalogue en français** — donc pas de geo-gate à gérer, pas de conversion de devise, pas de traduction de catégorie à ajouter.

---

## Comment brancher le flux (une fois l'approbation Awin reçue)

1. Récupérer l'URL du datafeed dans le back-office Awin
   (Publishers → Datafeeds → La Redoute FR → Download URL).

2. Ajouter l'entrée dans la variable d'environnement Vercel `AWIN_DATAFEED_URLS` :

   ```json
   [
     {"slug":"muji-france","url":"..."},
     {"slug":"the-business-fashion","url":"..."},
     {"slug":"suitable-fr","url":"..."},
     {"slug":"new-era","url":"..."},
     {"slug":"kastner-ohler","url":"..."},
     {"slug":"la-redoute","url":"[URL Awin datafeed La Redoute FR]"}
   ]
   ```

   ⚠️ **JAMAIS dans le code source** — l'URL contient la clé API Awin. Vercel env vars uniquement (`Settings → Environment Variables → Encrypted`).

3. Déclencher l'ingest manuel une première fois :

   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://wada.style/api/cron/refresh-awin-feed?phase=ingest
   ```

4. Puis mirror les images progressivement (cron horaire) :

   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://wada.style/api/cron/refresh-awin-feed?phase=mirror&batch=50"
   ```

5. Le cron quotidien existant fera le reste — pas de nouveau schedule à ajouter.

---

## Ce qui est déjà géré côté code (rien à toucher)

- **Slug canonique** `la-redoute` — détecté depuis `merchant_name` par regex `/la[\s-]?redoute/i` dans `lib/awinFeed.ts::normalizeAwinProduct`.
- **Whitelist** — `la-redoute` ajouté à `WHITELIST_SOURCES` dans `lib/composer/occasionRules.ts` (sinon `/api/products/search` drop tous les produits en filtre "affilié").
- **Label affichage** — `"La Redoute"` mappé dans `lib/SOURCE_LABEL.ts`.
- **Multi-marques** — La Redoute renseigne `brand_name` par produit (Adidas, Nike, Puma…). La logique `marque = rawBrand` existante rend chaque marque distincte dans `/marques` (comme K&Ö avec ses 520 marques). L'utilisateur voit donc `/marques/adidas-originals` peuplée par les produits Adidas venant du feed La Redoute.
- **Catégories FR** — `parseCategory` teste `category_name` → `merchant_category` → `merchant_product_category_path`. Les libellés français courants (chemises, pantalons, vestes, chaussures, ceintures, sacs, cravates…) sont déjà dans `CATEGORY_MAPPING` grâce à l'intégration Suitable FR.
- **Genre** — `parseGender` matche `\b(femme|homme|femmes|hommes)\b` sur les colonnes catégorie. La Redoute range explicitement (« Prêt-à-porter Femme > Robes »), donc le genre se résout naturellement.
- **Exclusions non-mode** — `EXCLUDED_CATEGORIES` ajoute les catégories La Redoute hors périmètre : maison, meubles, déco, linge, électroménager, high-tech, puériculture, jardin, jouets, papeterie, animalerie, hygiène. Sport **non exclu** (Nike/Adidas sportswear légitime — tri fin par slot).
- **Devise / livraison / retours** — EUR, France, pas de geo-gate. Rien à configurer côté `lib/products/visibility.ts`.
- **Images** — La Redoute publie via `images2.productserve.com` (proxy Awin) qui bloque le referer wada.style. `extractFromAwinProxy` récupère automatiquement l'URL CDN directe. Rien à faire.

---

## Vérification post-ingest

Après le premier `?phase=ingest`, ces trois sanity checks :

1. Compte par marchand dans la réponse JSON du cron :
   ```
   products_refreshed > 0 pour "la-redoute"
   stats["la-redoute"].parsed > 1000 (grand magasin → gros volume attendu)
   ```

2. Filtre marque via l'API :
   ```
   curl -X POST /api/products/search \
     -H "Content-Type: application/json" \
     -d '{"slot":"haut,bas,veste,chaussures,accent","category":"vetements","filters":{"brands":["Adidas Originals"]},"limit":10}'
   ```
   Doit retourner des produits **Adidas Originals** (dont `marchandSlug === "la-redoute"`).

3. Page `/marques/adidas-originals` doit lister des produits (hors CH) au lieu de retomber sur du New Era comme avant le fix `b8fbbea`.

---

## Points de vigilance possibles

Le layout exact du CSV La Redoute n'a pas été inspecté (pas d'échantillon avant approbation). Trois zones où un ajustement peut être nécessaire au premier ingest :

- **Colonne genre** — si `parseGender` retourne "inconnu" pour beaucoup de produits, ajouter une lecture explicite d'une éventuelle colonne `Fashion:suitable_for` ou `custom_1` (comme pour TBF/Suitable).
- **Libellés catégorie** — si des sous-catégories mode reviennent souvent sans match (loggées dans `stats.dropped`), les ajouter à `CATEGORY_MAPPING` dans `lib/awinFeed.ts` (les libellés FR standard sont déjà couverts).
- **Marques house** — "La Redoute Collections" ou "La Redoute Créations" arriveront comme marques distinctes dans `/marques`. Comportement voulu (une page par gamme).

Un fix ciblé prend 15 min de dev une fois l'échantillon disponible.
