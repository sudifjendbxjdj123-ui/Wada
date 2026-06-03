# WADA — Page Tenue : varier les produits selon la palette (pour le codeur)

Symptôme constaté en live : **toutes les tenues affichent les mêmes pièces MUJI**, quelle que soit
la palette. Exemple : la palette « indigo · terracotta · marine » et la palette « crème · anthracite ·
bordeaux » donnent **exactement les mêmes produits** (même cardigan femme, mêmes sandales en coton,
même imperméable, même chemise lin homme).

→ Le moteur **n'utilise pas vraiment les couleurs de la palette** : il ramène toujours le même
« produit le plus proche » par slot, sur tout le catalogue. Résultat : zéro variété + couleurs qui ne
collent pas (slot « terracotta » → pantalon indigo, slot « marine » → cardigan beige).

---

## 1. Utiliser les VRAIES couleurs de la palette (cause n°1)

Chaque palette a 3 teintes (ex. indigo, terracotta, marine). Il faut **assigner une teinte cible par
slot** et chercher le produit le plus proche **de cette teinte-là**, pas d'une couleur générique.

- Répartir les couleurs de la palette sur les slots (haut / bas / veste / chaussures / accent), par
  ex. couleur dominante sur la pièce forte, neutres autour.
- Le label affiché (« BAS · TERRACOTTA ») doit correspondre à la **couleur réelle du produit** choisi
  (sinon on annonce terracotta et on montre du marine → incohérent).
- Conséquence : deux palettes différentes → teintes cibles différentes → **produits différents**.

## 2. Ajouter de la VARIÉTÉ (cause n°2)

Même avec la bonne couleur, prendre toujours le **#1 le plus proche** donne le même produit à chaque
fois. À la place :

- Constituer un **pool des N plus proches** (ex. 8-12) pour le slot + la teinte.
- Choisir dans ce pool avec un **tirage déterministe basé sur (n° de palette + slot + style)** :
  - déterministe = la même palette donne toujours la même tenue (stable au rechargement),
  - mais deux palettes différentes tombent sur des produits différents.
- **Pas de doublon** : un même produit ne doit pas réapparaître sur 2 slots d'une tenue, ni être le
  même que sur la palette voisine si évitable.
- Les **3 façons de la porter** (Classique / Minimal / Old money) et le **profil** (genre, budget)
  doivent réellement changer le pool → des pièces différentes selon le réglage.

## 3. 🔴 GENRE NON RESPECTÉ — bug critique (confirmé sur l'assistant IA)

Constaté en live sur l'assistant : l'utilisateur choisit **« Homme »** et reçoit un **T-shirt femme**,
une **jupe midi** (!) et une **écharpe femme**. Le filtre genre **n'est pas appliqué** à la sélection
des produits — ni sur /ma-tenue, ni sur l'assistant /stylist.

À corriger en priorité absolue :
- Le genre choisi (Homme/Femme/Unisexe) doit être **transmis à `/api/products` pour CHAQUE slot** et
  **filtrer strictement** : Homme → produits homme + unisexe uniquement ; Femme → femme + unisexe.
  Jamais de pièce de l'autre genre.
- Le **type** doit aussi respecter le slot et le genre : pas de **jupe / robe** pour une tenue homme ;
  un « Bas » homme = pantalon/short.
- Vérifier le mapping des catégories MUJI (`Men's …` / `Women's …`) → genre, et l'appliquer
  réellement dans la requête (aujourd'hui il est manifestement ignoré).

## 3 bis. Type / registre (rappel)
- Pour « Classique / tailoring » : exclure **sandales/pantoufles** (chaussures = vraies chaussures)
  et **imperméable/sac de sport** en accent ; préférer derbies/mocassins + ceinture/foulard.
(Détail complet dans `WADA-tenue-rendu-MUJI.md`.)

---

## Résumé pour le codeur (à coller)

1. **Assigner une teinte de la palette à chaque slot** et matcher le produit le plus proche de CETTE
   teinte (plus de couleur générique). Le label couleur doit refléter la couleur réelle du produit.
2. **Variété** : piocher dans le top-N plus proches avec un tirage **déterministe par (palette + slot
   + style)** ; pas de doublon entre slots ; le profil (genre/budget) et les 3 styles changent le pool.
3. **Cohérence** : genre unique sur toute la tenue ; exclure sandales/pantoufles (chaussures) et
   imperméable/sac de sport (accent) pour les registres habillés.
4. Vérifier sur 3-4 palettes très différentes que les tenues rendues sont **visiblement différentes**.
