# Message à envoyer au codeur — Intégration flux The Business Fashion

Voilà le bloc à copier-coller directement à ton codeur :

---

**Sujet : Nouveau flux Awin à intégrer — The Business Fashion (luxury menswear)**

Salut,

Nouveau flux à intégrer sur WADA, plus gros que MUJI et avec quelques particularités.

**URL du flux** :
```
https://productdata.awin.com/datafeed/download/apikey/891f0ef95df8511518ea6630364e3638/language/en/fid/102136/rid/0/hasEnhancedFeeds/0/columns/aw_deep_link,product_name,aw_product_id,merchant_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,merchant_id,category_name,category_id,aw_image_url,currency,store_price,delivery_cost,merchant_deep_link,language,last_updated,display_price,data_feed_id,colour,brand_name,product_short_description,in_stock,stock_status,large_image,merchant_thumb_url,Fashion%3Asuitable_for,Fashion%3Acategory,Fashion%3Asize,Fashion%3Amaterial,Fashion%3Apattern/format/csv/delimiter/%2C/compression/gzip/adultcontent/1/
```

## Faits importants (vérifiés en lisant le CSV)

- **14 433 produits**, tous `in_stock = 1` (pas besoin de filtrer).
- **Devise : GBP** (livres sterling) — il faudra convertir en EUR côté affichage.
- **Multi-marques** : 522 Polo Ralph Lauren, 337 Givenchy, 285 Rick Owens, 276 Lanvin, 264 Jacquemus, 258 Zegna, 257 Brunello Cucinelli, 253 Tom Ford, 240 Dolce & Gabbana, 222 Alexander McQueen, 218 AMI Paris, etc.
- Le champ `brand_name` contient la **vraie marque** (Amiri, Tom Ford…). C'est elle qu'on affiche sur WADA, **pas** "The Business Fashion".

## Problèmes du flux à contourner

1. **`Fashion:suitable_for` est vide pour tous les produits**. On ne peut pas filtrer par genre via cette colonne. **Contournement** : le site TBF est officiellement « Luxury Menswear » → considérer **tout le flux comme HOMME par défaut**. Quelques pièces unisexes (Birkenstock, Comme des Garçons) peuvent être détectées via le mot "unisex" dans `product_name` ou `description` — mais c'est optionnel pour la V1.

2. **`Fashion:category` et `category_name` sont vides** (ou "Home Accessories" pour tous, ce qui est faux). Il faut **classer par slot via inférence depuis `product_name`** :
   - "t-shirt", "shirt", "polo", "hoodie", "sweater", "knit", "tee", "top" → **haut**
   - "pants", "jeans", "trousers", "shorts" → **bas**
   - "jacket", "coat", "blazer", "parka", "vest" → **veste**
   - "sneakers", "shoes", "boots", "loafers", "sandals" → **chaussures**
   - "bracelet", "necklace", "bag", "wallet", "sunglasses", "belt", "hat", "cap", "scarf" → **accent**

3. **Marques à exclure** : il y a une entrée bizarre `"(do not use)COMME DES GARÇONS BLACK"` — filtrer toute brand_name commençant par `"(do not use)"`.

## Spec d'intégration (récap)

- **Lien d'achat** : toujours `aw_deep_link` (jamais le site direct de la marque).
- **Mirror images sur Blob WADA** : priorité à `merchant_image_url`, fallback `large_image`. Pas `aw_image_url`. Cf. la même règle que pour MUJI dans `WADA-integration-flux-MUJI.md`.
- **Conversion GBP → EUR** : utiliser un taux fixe (genre × 1.17) ou un taux dynamique via une API si tu veux faire propre.
- **Affichage** : "Brunello Cucinelli — Pull en cachemire — 890 €" (marque réelle, prix converti). Au clic → ouvre TBF via le lien tracké.
- **Dédup** par `(brand_name, product_name, colour)` — les variantes de tailles peuvent créer des doublons.
- **Match couleur → palette Sanzo Wada** : champ `colour`, ΔE2000, même moteur que MUJI.
- **Traitement par lots** : 14 k produits dépassent le timeout 60s du cron Vercel Hobby. Pagination par lots de 1 000 produits, plusieurs runs cron successifs comme pour MUJI.

## Impact sur l'expérience WADA

Ce flux remplit ENFIN le segment **« Premium »** du filtre profil. Vérifier après déploiement :
- Un profil "Homme · Premium · Classique" → ramène du Tom Ford, Brunello, Zegna, Canali.
- Un profil "Homme · Premium · Streetwear" → ramène du Rick Owens, Off-White, Palm Angels, AMI.
- Un profil "Homme · < 150€" → reste sur MUJI (les pièces TBF dépassent largement ce budget).

Cf. `WADA-integration-flux-MUJI.md` pour la mécanique d'import de base.
Cf. `WADA-flux-TBF-etapes.md` pour le contexte.

Merci !

---

Voilà, copie le bloc ci-dessus dans un message (email / Slack / Notion) et envoie-le tel quel à ton codeur. Il a toutes les infos pour intégrer proprement.
