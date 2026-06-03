# WADA — Corrections téléphone (mobile) avant ouverture au public

Liste des bugs et corrections **mobile uniquement**, classés par priorité : **Urgent** (bloque
l'ouverture au public), **Important**, **Confort** (finitions). Format problème → correction.

---

## 🔴 URGENT — à faire avant toute mise en avant

### 1. Barre du haut surchargée et incohérente
- **Problème** : trop d'éléments tassés (menu, logo WADA和田, profil, lune, gros bouton « Abonnement »),
  et **3 versions de menu différentes** selon les pages.
- **Correction** : **un seul en-tête mobile, partout** → ☰ à gauche · logo centré (avec de l'air) ·
  **une seule action** à droite. Profil → onglet « Compte » (déjà en bas). Thème (lune) → dans le
  menu/réglages avec libellé « Thème sombre ». Hauteur d'en-tête standard.

### 2. Textes qui se coupent / débordent
- **Problème** : le titre du hero touche les bords, se superpose à la silhouette ; risque de coupe
  sur petits écrans ; chevauchement avec l'encoche/heure.
- **Correction** : marges intérieures, police **responsive**, retour à la ligne autorisé, respect des
  **safe areas** (haut et bas).

### 3. Bande noire en haut de l'image (hero)
- **Problème** : une bande noire apparaît sous l'en-tête → effet « bug », coupe l'image.
- **Correction** : faire remonter l'image jusqu'en haut (ou dégradé propre) ; l'image remplit tout l'espace.

### 4. Photos de tenue trop petites / absentes
- **Problème** : sur la page tenue, l'image flotte petite dans une grande carte vide ; sur le mode
  Scanner « Un vêtement », pas de photos du tout (aplats de couleur).
- **Correction** : image **plein cadre** (`width:100%` + `object-fit:cover`, ratio 3/4), source
  **haute résolution** (`merchant_image_url`). Brancher le mode « Un vêtement » sur le moteur produits
  (vraies pièces MUJI avec photos).

### 5. Footer surchargé
- **Problème** : 3 colonnes + 12-15 liens = un mur interminable à scroller.
- **Correction** : footer en **accordéon** compact sur mobile (sections repliées), liens identiques
  sur toutes les pages.

### 6. Pages trop chargées
- **Problème** : /cultures (≈17 cultures déployées d'un coup) et /palettes (348 cartes) = pages
  interminables et lentes sur téléphone.
- **Correction** : /cultures en **accordéon** par culture ; /palettes en **pagination / chargement
  progressif** + bouton « Filtrer ».

---

## 🟠 IMPORTANT

### 7. Lisibilité du titre sur l'image
- **Problème** : titre sombre sur fond sombre, peu lisible.
- **Correction** : voile/dégradé derrière le texte, contraste garanti partout.

### 8. Bouton « Notre histoire » presque invisible
- **Problème** : bouton fantôme qui se confond avec l'image.
- **Correction** : contour ou fond léger pour qu'on voie qu'il est cliquable.

### 9. Hero vidéo trop lourd sur mobile
- **Problème** : vidéo autoplay = data/batterie/lenteur.
- **Correction** : afficher l'**image poster** sur mobile (pas de lecture auto).

### 10. Grilles & cartes
- **Problème** : tenue en 2 colonnes serrées ; risque de **scroll horizontal**.
- **Correction** : **1 colonne** sur mobile pour la tenue ; aucune ligne ne dépasse l'écran.

### 11. Zones tactiles & formulaires
- **Problème** : liens/icônes trop petits ; les champs font zoomer l'écran (iOS).
- **Correction** : cibles **≥ 44 × 44 px** ; champs de saisie **≥ 16px**.

### 12. Bug d'affichage « /compte »
- **Problème** : le lien compte affiche le texte brut « /compte ».
- **Correction** : « Compte » (ou icône) avec le bon lien.

---

## 🟡 CONFORT (finitions)

### 13. Icône thème (lune) sans libellé
- **Correction** : la déplacer dans le menu/réglages avec « Thème sombre ».

### 14. Espacements irréguliers
- **Correction** : marges régulières et cohérentes partout ; harmoniser avec la barre d'onglets du bas.

### 15. Micro-interactions
- **Correction** : transitions douces, pas de saut de mise en page au chargement des images
  (réserver l'espace via aspect-ratio).

---

## À retenir
1. **Alléger la barre du haut** (point 1) — le plus visible.
2. **Aucun texte ne se coupe / ne déborde** (point 2), respecter les safe areas.
3. **Photos plein cadre** (point 4).
4. **Tester sur petit ET grand téléphone** avant d'ouvrir au public.
