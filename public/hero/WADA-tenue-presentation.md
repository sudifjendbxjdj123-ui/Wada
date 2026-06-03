# WADA — Présentation des tenues : harmoniser les images (pour le codeur)

Constat live : les cartes produit sont là et grandes, mais le rendu manque d'homogénéité :
- Cadrages mélangés : certaines images sont des **photos mannequin plein cadre** (haut, bas, veste,
  écharpe), d'autres des **produits détourés sur blanc** (baskets) → échelles incohérentes.
- L'image **ne remplit pas la carte** : un encadré blanc plus petit, entouré d'une marge crème → effet
  « boîte dans une boîte ».
- **Hauteurs de cartes inégales** (ratios d'image différents).
- La grille à 2 colonnes laisse un **trou** quand il y a 5 pièces (la 5ᵉ est seule).

Objectif : des cartes nettes, identiques, où l'image remplit le cadre, sur un fond uniforme.

---

## 1. Conteneur image uniforme (le plus important)

Toutes les images dans le **même cadre**, ratio fixe, fond constant, remplissage edge-to-edge :

```css
.piece-card .photo{
  width: 100%;
  aspect-ratio: 4 / 5;          /* identique pour TOUTES les cartes */
  background: #FBF9F5;          /* fond crème clair uniforme (pas de blanc qui tranche) */
  overflow: hidden;
  border-radius: 16px 16px 0 0; /* l'image touche les bords haut de la carte */
}
.piece-card .photo img{
  width: 100%; height: 100%;
  object-fit: cover;            /* l'image remplit le cadre (plus de marge autour) */
  object-position: center 20%;  /* cadre sur le vêtement, pas sur la tête */
  display: block;
}
```

- `object-fit: cover` → fini l'encadré blanc plus petit ; l'image remplit la carte.
- `object-position: center 20%` → sur les photos mannequin, on cadre sur le buste/vêtement plutôt
  que de centrer (évite de couper bizarrement).
- Fond `#FBF9F5` (et non blanc pur) pour que les produits détourés se fondent dans la carte.

## 2. Mixte mannequin / produit détouré → harmoniser

Les images MUJI mélangent photos portées et packshots. Pour un rendu cohérent :
- Garder **un seul ratio** (4/5) + `cover` : les deux types remplissent alors le même cadre.
- Si possible, **préférer une source plus grande** (`large_image`) que la vignette 200px (évite le
  flou à l'agrandissement). Ne jamais upscaler une mini-vignette.
- Optionnel : si une image est un packshot sur fond blanc et une autre une photo portée, c'est ok
  tant que le **cadre, le fond et le ratio** sont identiques — c'est ça qui crée l'harmonie.

## 3. Carte homogène (hauteurs égales)

```css
.piece-card{ border-radius:16px; background:#FBF9F5; box-shadow:0 8px 30px rgba(30,30,30,.06);
  display:flex; flex-direction:column; }
.piece-card .body{ padding:14px 16px 16px; display:flex; flex-direction:column; flex:1; }
.piece-card .name{ font-weight:600; line-height:1.25;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; /* nom sur 2 lignes max */ }
```
- Nom sur **2 lignes max** (`line-clamp`) → toutes les cartes alignées.
- Même ratio d'image + line-clamp = **hauteurs de cartes identiques**.

## 4. Grille : éviter le trou de la 5ᵉ pièce

5 pièces en 2 colonnes laissent un vide. Deux options propres :
- **Option A (recommandée)** : 1ʳᵉ pièce en **vedette pleine largeur** (grande image), puis les 4
  autres en grille 2×2 → composition équilibrée, met la pièce signature en avant.
- **Option B** : grille 2 colonnes, et **centrer** la dernière carte seule (`justify-self:center` /
  `margin-inline:auto`) au lieu de la laisser collée à gauche.
- Sur **mobile** : 1 colonne, cartes pleine largeur.

## 5. Finitions

- Coins arrondis cohérents (16 px), ombre légère identique, espacement régulier (gap 18-22 px).
- Léger `hover` : `transform: translateY(-3px)` + image `scale(1.03)` (transition 0.3s).
- La bande de **pastilles de la palette** sous les cartes : la garder, fine et centrée.
- Garder la hiérarchie : rôle·couleur (petit) → nom (2 lignes) → MUJI → prix → « Acheter sur MUJI ».

---

## Résumé pour le codeur (à coller)

1. Toutes les images dans un cadre **ratio 4/5 identique**, `object-fit: cover`,
   `object-position: center 20%`, fond `#FBF9F5`, image **edge-to-edge** (supprimer l'encadré blanc + marge).
2. Préférer `large_image` (source plus grande), ne pas upscaler les vignettes 200px.
3. Nom produit sur **2 lignes max** (`line-clamp`) → cartes de même hauteur.
4. Grille : 1ʳᵉ pièce en vedette pleine largeur + 4 en 2×2 (ou centrer la 5ᵉ carte) ; 1 colonne sur mobile.
5. Finitions : coins 16px, ombre légère, hover discret, pastilles palette conservées.
