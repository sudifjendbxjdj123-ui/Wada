# WADA — Mode Scanner « Un vêtement » : 2 corrections (pour le codeur)

Sur le flux « Un vêtement » (scanner sa pièce → composer une tenue autour).

## 1. Afficher de vraies pièces avec photos
Aujourd'hui la tenue composée affiche des **aplats de couleur + « VOIR DES PIÈCES → »** (recherche),
pas de vrais produits.
→ Brancher ce flux sur le **même moteur que /ma-tenue** (`/api/products`) pour afficher de **vraies
pièces MUJI avec photo, nom et prix**. La pièce scannée (« Votre pièce · À vous ») reste sans photo
(c'est celle de l'utilisateur).

## 2. Tenir compte du TYPE de la pièce, pas seulement de la couleur
Le scan ne détecte que la **couleur** → WADA peut composer une tenue habillée autour de **chaussures
de running** = incohérent.
→ Après le scan, **demander à l'utilisateur le type + le style** de sa pièce
(ex. « Vos chaussures : ville / sneakers / running / bottes ? ») et **adapter le registre** de la
tenue en conséquence (running → casual sport ; derby → habillé…). Idem pour un pull (fin vs hoodie).
→ La tenue proposée doit être cohérente avec la **vraie** pièce, pas seulement sa couleur.
