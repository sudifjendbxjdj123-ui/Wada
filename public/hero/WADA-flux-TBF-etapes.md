# WADA — Intégration du flux The Business Fashion (étapes complètes)

The Business Fashion (TBF) — annonceur Awin, **40 306 produits sur 3 flux**, marchand multi-marques
luxe homme (Amiri, Tom Ford, Burberry, Off-White, Stone Island, Brunello Cucinelli, Loro Piana, etc.).

Deux temps : ce que **Nem** fait sur Awin (~30 min), ce que le **codeur** fait sur WADA (~1 journée).

---

## PARTIE 1 — CE QUE NEM FAIT SUR AWIN

### Étape 1 — Identifier les 3 flux
Va sur **Annonceurs → The Business Fashion**, descends dans la section **Mes flux produits**.
Tu y verras les 3 flux listés avec leur **nom** et **leur taille**. Note-les. Probablement :
- TBF Homme (gros, ~30k produits)
- TBF Femme (plus petit, si applicable)
- TBF Sale / Outlet (à ignorer pour l'instant)

Si TBF est purement menswear (titre du site : « Luxury Menswear »), les 3 flux peuvent être :
- Homme nouveautés
- Homme catalogue complet
- Homme outlet/sale

### Étape 2 — Aller dans Create-a-Feed
**Outils → Create-a-Feed** dans le menu Awin.

### Étape 3 — Régler la langue
En haut, mets **« N'importe lequel »** (ou « Anglais » si dispo seulement en anglais).
TBF est UK : avec « Français » seul tu ne les verras pas.

### Étape 4 — Sélectionner The Business Fashion
Descends à la section **Annonceurs**, clique sur **« Sélectionner Annonceurs »**.
Tape « business » dans la recherche. Coche **The Business Fashion**.

**Important** : ne coche QUE les flux pertinents (Homme + Femme si présente, **PAS** le sale/outlet).
Si la fenêtre te propose les 3 flux individuellement, choisis bien lesquels.

### Étape 5 — Cocher les bonnes colonnes
À l'étape suivante (Configurez votre flux), garde les colonnes par défaut et **ajoute** :

**Spécifications du produit** :
- ☑️ Couleur
- ☑️ brand_name
- ☑️ product_short_description

**Disponibilité** :
- ☑️ in_stock
- ☑️ stock_status

**Images** :
- ☑️ large_image
- ☑️ merchant_thumb_url

**Mode (Colonnes verticales spécifiques)** :
- ☑️ suitable_for (genre : Femme / Homme / Mixte)
- ☑️ Catégorie
- ☑️ Taille
- ☑️ Matériel
- ☑️ Motif

### Étape 6 — Régler le format
En bas :
- Format : **CSV**
- Délimiteur : **,** (virgule)
- Compression : **gzip**

### Étape 7 — Copier l'URL
Tout en bas, tu auras **l'URL de téléchargement manuelle**. Copie-la (et pas le fichier — c'est l'URL
qui sera branchée automatiquement sur WADA).

### Étape 8 — Envoyer au codeur
Transmets cette URL avec **la note de la partie 3** ci-dessous (à coller telle quelle).

---

## PARTIE 2 — CE QUE NEM ENVOIE AU CODEUR

Voici exactement ce que tu envoies au codeur en un seul message :

> **Sujet : Nouveau flux Awin à intégrer — The Business Fashion (luxury menswear)**
>
> Bonjour. Nouveau flux à brancher sur WADA, similaire à MUJI mais avec des spécificités importantes.
>
> **URL du flux** : [coller l'URL Awin ici]
>
> **Volume** : ~40 000 produits (gros — voir consigne « par lots » plus bas)
>
> **Particularités à gérer** :
> 1. **Multi-marques** : TBF revend Amiri, Tom Ford, Burberry, Off-White, Brunello Cucinelli,
>    Loro Piana, Stone Island, Palm Angels, Acne, etc. Le champ `brand_name` du flux contient
>    la VRAIE marque. **Afficher cette marque sur WADA**, pas « The Business Fashion ».
> 2. **Lien d'achat** : toujours via `aw_deep_link` (Awin). Ne JAMAIS relier vers le site direct
>    de la marque (Amiri.com, etc.) — la commission passe par TBF.
> 3. **Genre** : champ `suitable_for` (Femme / Homme / Mixte). À utiliser pour filtrer selon le
>    profil utilisateur.
> 4. **Devise** : prix en **GBP** (£). À convertir en EUR (€) pour l'affichage sur WADA.
> 5. **Budget** : ces produits remplissent le segment **« Premium »** du filtre profil.
>    Vérifier que `search_price` est bien remonté dans la bonne tranche.
>
> **Spécifications techniques** :
> - **Traiter par lots** (1 000 produits à la fois) car le cron Vercel Hobby plante à 60s sur
>   gros volume. Cf. ce qu'on a fait pour MUJI.
> - **Mirror des images vers Blob** (priorité à `merchant_image_url` ou `large_image`,
>   pas `aw_image_url`). Cf. spec `WADA-integration-flux-MUJI.md` § 7.
> - **Dédupliquer par (`brand_name`, `product_name`, `Couleur`)** pour éviter les variantes
>   de tailles qui multiplient les lignes.
> - **Filtrer `in_stock = true`** uniquement.
> - **Slots WADA** : haut (shirts, sweats, knit), bas (pants, jeans), veste (jackets, coats),
>   chaussures (shoes, sneakers, boots), accent (accessories, bags).
> - **Match couleur → palette Sanzo Wada** : même moteur ΔE2000 que pour MUJI.
>
> **Cohérence avec onboarding** : ce flux donne enfin du sens au filtre « Premium ». À tester
> que le profil « Homme · Premium · Classique » ramène bien du Tom Ford / Brunello / Canali,
> pas du MUJI.
>
> Cf. fichier `WADA-integration-flux-MUJI.md` qui détaille la mécanique de base — TBF reprend
> la même, en plus gros et en multi-marques.

---

## PARTIE 3 — CE QUE LE CODEUR FAIT (résumé technique)

1. Récupère l'URL du flux depuis le message.
2. Adapte l'importeur MUJI pour gérer le volume (pagination par 1000, plusieurs runs cron).
3. Mappe les colonnes (cf. WADA-integration-flux-MUJI.md, ajouter `brand_name` qui devient
   l'identifiant marque affiché).
4. Mirror des images vers Blob WADA (priorité haute res).
5. Dédup, filtre stock, conversion GBP → EUR.
6. Match couleur → palette Wada (ΔE2000).
7. Tag par slot (haut / bas / veste / chaussures / accent) selon catégorie.
8. Push en DB / KV.
9. Test : profil « Homme · Premium » ramène bien du luxe TBF.

---

## PARTIE 4 — TESTS APRÈS DÉPLOIEMENT

- [ ] La home et les palettes affichent maintenant des produits luxe (pas que MUJI).
- [ ] Filtre « Premium » → des Tom Ford / Brunello / Amiri apparaissent.
- [ ] Filtre « Homme » → vraies pièces homme luxe.
- [ ] Cliquer sur une pièce → ouvre thebusinessfashion.com avec l'URL `aw_deep_link`.
- [ ] Marque affichée = vraie marque (Amiri, Tom Ford…), pas « The Business Fashion ».
- [ ] Prix en EUR sur WADA, même si le flux est en GBP.
- [ ] Images affichées en pleine qualité (cover, pas blurry).
- [ ] Aucun produit out-of-stock affiché.
- [ ] Au bout de 24h, un nouveau cron tourne et met à jour le catalogue automatiquement.

---

## RÉCAP COURT

| Qui | Quoi | Temps |
|---|---|---|
| Nem | Étapes 1 à 7 (générer + copier l'URL) | ~30 min |
| Nem | Envoyer URL + note au codeur | 5 min |
| Codeur | Intégration + tests | ~1 journée |
| Nem | Vérifier sur wada.style après déploiement | ~15 min |

Une fois que c'est fait, WADA passe officiellement au luxe. Bonne intégration.
