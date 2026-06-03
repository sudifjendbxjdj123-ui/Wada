# WADA — Rendre la page Tenue « belle » avec les produits MUJI (pour le codeur)

Les vraies photos MUJI s'affichent ✅. Reste à améliorer la **pertinence des pièces choisies**
et la **qualité visuelle**. Exemples tirés de la tenue live « Tailoring net · gris perle, crème, noir » :

| Slot | Produit choisi (actuel) | Problème |
|------|--------------------------|----------|
| Haut · gris perle | « Robe-chemise transparente femme » | type (robe) + genre (femme) incohérents avec une tenue tailoring masculine |
| Bas · crème | « Pantalon de survêtement Relaxed Fit » | survêtement ≠ « tailoring net / coupe regular » |
| Chaussures · noir | « Pantoufles mules en lin » | ce ne sont pas de vraies chaussures |
| Accent · noir | « Sac Boston de sport » | trop casual pour du tailoring |
| Veste · noir | « Veste lin cordon » | OK, mais **photo quasi noire** (produit invisible) |

Le matching actuel = **couleur seulement**. Il faut ajouter 3 filtres : **type de pièce**, **registre**, **genre** — puis soigner l'image.

---

## 1. Cohérence TYPE de pièce ↔ slot

Mapper `category_name` MUJI → slot WADA **strictement**, et exclure les sous-types qui ne
correspondent pas au slot :

- **haut** → Tops uniquement. Exclure robes/combinaisons (sauf si slot « robe » dédié).
- **bas** → Trousers/Skirts. 
- **veste** → Outerwear.
- **chaussures** → Footwear, mais **exclure pantoufles / mules / chaussons** (`slippers`,
  `mules`, `sandales d'intérieur`) sauf registre « détente/maison ».
- **accent** → Accessories, en **priorisant** ceinture, foulard, petite maroquinerie, lunettes ;
  **dé-prioriser** sacs de sport / sacs de voyage volumineux pour les registres habillés.

Astuce : repérer ces sous-types via des mots-clés dans `product_name` (« survêtement », « jogging »,
« pantoufle », « mule », « chausson », « sac de sport », « Boston », « pyjama »…).

---

## 2. Cohérence REGISTRE (le style annoncé doit filtrer les pièces)

Le registre de la tenue (Classique / Tailoring / Old money / Décontracté…) doit **exclure** les
pièces qui jurent :

- **Classique / Tailoring / Old money** → exclure : survêtement, jogging, pantoufles, mules,
  sweat à capuche, sac de sport, pyjama. Préférer : chemise, pantalon à pinces/chino, blazer,
  derbies/mocassins, ceinture/foulard.
- **Décontracté / streetwear** → ces pièces casual sont OK.

Concrètement : ajouter un champ `style_tags` (ou un score) par produit, et filtrer le pool
candidat selon le registre avant le tri par couleur (ΔE).

Ordre de sélection conseillé : **type de slot → registre → genre → puis ΔE couleur** (la couleur
départage, elle ne décide plus seule).

---

## 3. Cohérence GENRE sur toute la tenue

Toutes les pièces d'une même tenue doivent être du **même genre** (ou unisexe). Aujourd'hui on
mélange une robe femme et un pantalon homme. → Passer `genre` à la requête `/api/products` pour
**tous** les slots, et filtrer (genre demandé + unisexe).

---

## 4. Qualité PHOTO (le plus visible)

Problème : fonds hétérogènes (gris / crème / **noir**) et plusieurs photos **trop sombres** où
le produit est invisible (veste noire, pantoufles).

À faire :
- **Fond de carte uniforme** : afficher l'image sur un fond clair constant (ex. `#FBF9F5`) avec
  `object-fit: contain` + un petit `padding`, pour que les produits détourés/sur fond sombre
  restent lisibles. (Plutôt que `cover` qui garde le fond noir d'origine.)
- **Écarter les photos trop sombres** : si possible, détecter la luminance moyenne de la vignette
  et, si trop basse, préférer une autre photo du même produit (`large_image` / `alternate_image`)
  ou une autre variante couleur proche.
- **Cadrage homogène** : même ratio pour toutes les cartes (ex. 4/5 ou 1/1), même alignement.
- Garder `loading="lazy"` + `alt` = nom produit.

---

## 5. Finitions visuelles de la carte

- Ratio image identique partout, coins arrondis cohérents (16 px).
- Nom produit sur 2 lignes max (`line-clamp: 2`) pour aligner les cartes.
- Prix bien lisible, une seule couleur d'accent.
- Pastille de couleur (slot) alignée avec le libellé, taille constante.
- Espacement vertical régulier entre les 5 cartes.

---

## Résumé pour le codeur (à coller)

1. Matching tenue : ajouter **type de pièce** + **registre** + **genre** comme filtres AVANT le tri couleur (ΔE en dernier).
2. Exclure par slot : chaussures ≠ pantoufles/mules ; accent ≠ sac de sport ; haut ≠ robe (hors slot robe) ; tailoring ≠ survêtement/jogging/pyjama.
3. Genre identique sur toute la tenue (passer `genre` à `/api/products`).
4. Photo : fond de carte clair uniforme + `object-fit: contain` + padding ; écarter les vignettes trop sombres (fallback `large_image`/autre variante).
5. Cartes : ratio constant, nom sur 2 lignes, espacement régulier.
