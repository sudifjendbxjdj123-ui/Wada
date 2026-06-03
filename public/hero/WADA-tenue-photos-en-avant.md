# WADA — Page Tenue : retirer le visuel généré en haut + mettre les vraies photos en vedette

Contexte : la page tenue (ex. « Nuit sur Budapest ») affiche en haut un **grand visuel flat-lay
généré par IA**, puis en bas les **vraies pièces MUJI** (photo + prix + Acheter). Maintenant que les
vrais produits s'affichent, le visuel du haut **fait doublon, n'est plus cohérent** (il ne montre pas
les vraies pièces) et coûte du temps/de la génération. → On le retire et on met les vraies photos en avant.

---

## 1. Retirer le générateur d'image en haut

- Supprimer le **bloc image flat-lay généré** en haut de la page tenue (le grand cadre `lookframe`
  avec l'image IA + les pastilles de couleur posées dessus).
- Supprimer aussi l'**appel de génération d'image** associé (l'API / le composant qui produit ce
  visuel) pour cette page → moins de latence, moins de coût.
- **Garder** : le titre de la palette (« Nuit sur Budapest »), la ligne de teintes
  (« Lin · Olive · Rose ancien »), le bloc « Direction artistique » + les attributs
  (Registre / Coupe / Matières / Réf). Ça structure la page sans le visuel lourd.

Optionnel (léger, à la place du grand cadre) : une fine bande des **pastilles de couleur** de la
palette (3-4 ronds), discrète, pour garder l'identité couleur sans grande image.

---

## 2. Mettre les vraies photos en vedette (section « La tenue complète en détail »)

Aujourd'hui les cartes produit sont petites et reléguées en bas. Elles doivent devenir **le cœur
visuel** de la page :

- **Agrandir la zone photo** de chaque carte : viser une grande image (ratio **4/5** ou **1/1**),
  bien plus haute qu'aujourd'hui, sur un **fond clair uniforme** (`#FBF9F5`) avec
  `object-fit: contain` + un peu de padding (produits lisibles même sur fond sombre).
- **Grille plus généreuse** : par ex. **2 colonnes** de grandes cartes sur desktop (au lieu de 3
  petites), 1 colonne sur mobile. Ou une mise en avant : 1ʳᵉ pièce en grand, les autres en dessous.
- **Hiérarchie claire dans la carte** : grande photo → rôle + couleur (petit) → nom produit
  (lisible, 2 lignes max) → marque MUJI → prix → bouton « Acheter sur MUJI ».
- Espacement aéré entre les cartes, coins arrondis cohérents (16 px), ombre légère.
- Conserver « + N autres marchands » sous la carte, mais discret.

Effet recherché : en arrivant, le client voit **immédiatement de belles pièces réelles, grandes et
achetables** — pas un montage générique.

---

## 3. Rappels qualité (déjà notés dans `WADA-tenue-rendu-MUJI.md`)

Pendant qu'on y est, ces points rendent la section encore meilleure :
- Cohérence **type/registre/genre** des pièces (un Haut = un haut, des Chaussures = de vraies
  chaussures et pas des sandales/pantoufles pour du tailoring, même genre sur toute la tenue).
- Écarter les **photos trop sombres** (prendre une autre vue du produit).

---

## Résumé pour le codeur (à coller)

1. Supprimer le visuel flat-lay **généré par IA** en haut de la page tenue (+ son appel de génération).
2. Garder titre palette + teintes + « Direction artistique » + attributs. (Option : fine bande de pastilles couleur.)
3. Agrandir fortement les cartes produit MUJI : grande image (4/5 ou 1/1), fond clair `object-fit:contain`, grille 2 colonnes desktop / 1 mobile.
4. Hiérarchie carte : photo → rôle·couleur → nom (2 lignes) → MUJI → prix → Acheter.
5. Garder les correctifs de `WADA-tenue-rendu-MUJI.md` (cohérence type/registre/genre, photos lisibles).
