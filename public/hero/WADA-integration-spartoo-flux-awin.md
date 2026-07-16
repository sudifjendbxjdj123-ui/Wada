# WADA — Intégration Spartoo FR depuis le flux Awin

Brief ops pour brancher **Spartoo FR** au catalogue WADA une fois l'approbation Awin obtenue.

**Statut** : code prêt — attend uniquement l'URL du flux dans les env vars.

**Durée bascule** : ~15 min (config env + 1 tour de cron).

**Volume attendu** : ~50 000 – 100 000 produits, très majoritairement **chaussures** (Nike, Adidas, Puma, Vans, Timberland, Dr. Martens, Levi's, Converse, New Balance, Reebok, Asics, Geox, Clarks…), plus une part de textile léger et sacs.

---

## Pourquoi Spartoo en complément de La Redoute

- **Chaussures ⭐** — Spartoo est un pure player chaussures, catalogue nettement plus profond que la rubrique chaussures d'un généraliste. Idéal pour peupler `/chaussures` (WADA n'a aujourd'hui aucun marchand pur chaussures — les 3 250 items Suitable sont mono-marque et K&Ö est CH-only).
- **Approbation Awin rapide** — historiquement plus facile à obtenir que La Redoute (programme ouvert). Sert de plan B si La Redoute traîne.
- **Livraison FR + EUR + retours 100 jours** — pas de geo-gate, pas de conversion.

---

## Comment brancher le flux (une fois l'approbation Awin reçue)

1. Récupérer l'URL du datafeed dans le back-office Awin (Publishers → Datafeeds → Spartoo).

2. Ajouter l'entrée dans `AWIN_DATAFEED_URLS` (variable Vercel encrypted) :

   ```json
   [
     {"slug":"muji-france","url":"..."},
     {"slug":"the-business-fashion","url":"..."},
     {"slug":"suitable-fr","url":"..."},
     {"slug":"new-era","url":"..."},
     {"slug":"kastner-ohler","url":"..."},
     {"slug":"la-redoute","url":"..."},
     {"slug":"spartoo","url":"[URL Awin datafeed Spartoo FR]"}
   ]
   ```

3. Déclencher l'ingest manuel :

   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://wada.style/api/cron/refresh-awin-feed?phase=ingest
   ```

4. Puis mirror progressif (~50 images par batch) :

   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://wada.style/api/cron/refresh-awin-feed?phase=mirror&batch=50"
   ```

5. Le cron quotidien existant refresh Spartoo comme les autres feeds. Rien à ajouter.

---

## Ce qui est déjà géré côté code (rien à toucher)

- **Slug canonique** `spartoo` — détecté par `/\bspartoo\b/i.test(merchant_name)` dans `lib/awinFeed.ts`.
- **Whitelist** — `spartoo` ajouté à `WHITELIST_SOURCES` dans `lib/composer/occasionRules.ts`.
- **Label** — `"Spartoo"` mappé dans `lib/SOURCE_LABEL.ts`.
- **Multi-marques** — `brand_name` par produit, groupé automatiquement par `/marques` (Nike, Adidas, Vans… chacun sa page).
- **Catégories FR** — résolution `category_name` → `merchant_category` → `merchant_product_category_path` → fallback nom. Libellés FR couverts par l'intégration Suitable.
- **Exclusions non-mode** — l'ensemble `EXCLUDED_CATEGORIES` (partagé) drop les rubriques enfant/bébé, hygiène, etc. Le filtre passe aussi Spartoo via le même check `isLaRedoute || isSpartoo`.
- **Genre** — Spartoo range clairement (« Chaussures homme », « Vêtements femme »), `parseGender` résout naturellement via les regex `\bfemme\b` / `\bhomme\b`.
- **Devise / images / livraison** — EUR, images via `images2.productserve.com` (extraction CDN automatique par `extractFromAwinProxy`), pas de geo-gate.

---

## Vérification post-ingest

1. Réponse JSON du cron :
   ```
   products_refreshed > 0 pour "spartoo"
   stats["spartoo"].parsed > 10000 (attendu — catalogue chaussures profond)
   ```

2. Filtre marque Nike (test le plus parlant vu la mission de la feature) :
   ```
   curl -X POST /api/products/search \
     -H "Content-Type: application/json" \
     -d '{"slot":"chaussures","category":"chaussures","filters":{"brands":["Nike"]},"limit":10}'
   ```
   Doit retourner des chaussures **Nike** avec `marchandSlug === "spartoo"`.

3. Page `/marques/nike` doit lister des sneakers Nike (hors CH). Idem `/marques/adidas`, `/marques/vans`.

---

## Points de vigilance possibles

Layout exact du CSV Spartoo non inspecté. Trois zones à surveiller au 1er ingest :

- **Chaussures de sécurité / chaussures de sport spécialisées** — si Spartoo pousse des rubriques « safety shoes », « crampons foot », « chaussons escalade » dans le fashion catalog, ajouter ces libellés à `EXCLUDED_CATEGORIES`. Le sport lifestyle (running/basket casual) reste OK.
- **Enfants** — normalement filtré par les entrées `kinder`/`kids`/`bébé` de la liste globale. Vérifier via un curl `?filters={"brands":["Nike"]}` que rien ne remonte de taille < 30 (chaussures enfant).
- **Marques house Spartoo** — si Spartoo a des marques distribuées exclusives (Casual Attitude, Spartoo x…), elles arriveront comme brand à part entière. Comportement voulu.

Ajustement post-ingest = 10 min de dev une fois l'échantillon disponible.
