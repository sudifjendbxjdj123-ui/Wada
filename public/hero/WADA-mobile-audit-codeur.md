# WADA — Audit mobile iPhone (à corriger par le codeur)

Basé sur 18 captures réelles de WADA sur iPhone. Classé par sévérité : 🔴 critique, 🟠 important,
🟡 polish. Pour chaque point : ce qui ne va pas + la correction concrète.

---

## 🔴 CRITIQUE — bloque l'utilisation ou très visible

### 1. Pilule « REPRENDRE » sur l'accueil mange le hero
La pilule **« 和 REPRENDRE → Plage de São Vicente »** est positionnée au centre, par-dessus la vidéo
hero. Elle couvre une partie du bouton **« Scanner une couleur »** — on voit littéralement « Sc » qui
dépasse derrière la pilule. C'est cassé visuellement.

**Correction** : déplacer la pilule en **bas à droite** (style toast / snackbar), au-dessus du tab bar
mais en dessous de tout autre contenu. Pas au centre, pas par-dessus le hero. Taille réduite, fond
sombre (`#222`), avec un X pour la fermer.

```css
.resume-toast {
  position: fixed;
  bottom: calc(80px + env(safe-area-inset-bottom)); /* au-dessus de la tab bar */
  right: 16px;
  z-index: 30;
  /* fond sombre, taille compacte */
}
```

### 2. Panier — TOUTES les pièces ont le même prix « No. 066 · Amazon FR · ~80€ »
Capture du Panier : 4 pièces affichées (T-shirt, Pantalon, Surchemise, Sneakers, Tote), TOUTES avec
**exactement le même libellé** : « No. 066 · Amazon FR · ~80 € ». C'est invraisemblable.

**Correction** :
- Récupérer le **vrai prix** par produit, depuis le flux Awin (chaque pièce a son `search_price`).
- Le « No. 066 » est probablement la référence de palette, **pas** un identifiant produit. Il ne doit
  pas s'afficher comme une référence prix. À remplacer par le **nom de marque réel** (MUJI, AMI Paris,
  etc.) issu de `brand_name`.
- Le libellé final attendu : `T-shirt épais col rond · MUJI · 39,90 €` (puis bouton « Acheter sur
  MUJI → »).

### 3. Panier — aucune photo de produit
Les vignettes carrées à gauche de chaque pièce sont **vides** (juste un fond beige clair). Le client
ne voit pas ce qu'il achète. C'est très grave côté conversion.

**Correction** : afficher l'image hébergée sur Blob WADA (`merchant_image_url` mirrorée), en
`object-fit: cover` dans une vignette 80×80. Si l'image n'a pas été synchronisée, fallback sur un
gradient de la couleur Wada associée + emoji slot, mais c'est un pansement — l'image doit s'afficher.

### 4. Footer + tab bar se télescopent
Sur plusieurs pages (Favoris vide, Scanner couleur scrolled), le **footer noir** apparaît
**juste derrière la tab bar du bas**. La tab bar est translucide → on voit le footer transparaître.

**Correction** :
- Donner à la tab bar un **fond solide** (cream avec opacité 96% + backdrop-blur).
- Et ajouter `padding-bottom: 80px + env(safe-area-inset-bottom)` au `<main>` pour que le contenu
  ne se cache pas derrière la tab bar.
- Le footer doit avoir au moins 80px de padding bottom aussi.

---

## 🟠 IMPORTANT — UX dégradée

### 5. Scanner couleur — « COULEUR DÉTECTÉE » avec 2 carrés vides
Toujours présent malgré nos discussions. Le bloc affiche deux carrés gris + « En attente d'une photo
ou d'une teinte ». Donne l'impression d'un état cassé.

**Correction** : un seul aperçu (pastille ronde 52×52), avec un fond damier discret en état vide
(pas un carré gris). Cf. maquette `wada-scanner-v2.html`.

### 6. Scanner vêtement — deux niveaux de chips de pièce confus
On a en haut **« Haut / Bas / Chaussures / Veste »** puis plus bas **« T-shirt / Chemise / Pull /
Hoodie »**. Pourquoi deux niveaux ? Le client se demande s'il doit choisir Haut PUIS T-shirt, ou si
les deux sont séparés.

**Correction** : un seul niveau. Soit slots (Haut/Bas/Veste/Chaussures/Accent), soit types (T-shirt,
Pull, Pantalon…) — pas les deux. Si on veut les deux, faire « Catégorie » + « Type » avec une vraie
hiérarchie (Type apparaît seulement après choix de Catégorie).

### 7. Favoris vide — message dupliqué
La page affiche d'abord **« Mes favoris — Rien pour l'instant »**, puis juste en dessous **« Vos
favoris vous attendent — Scannez une couleur pour démarrer »**. C'est dire deux fois la même chose.

**Correction** : garder UN seul empty state. Format suggéré :
```
[icône cœur vide]
Vos favoris vous attendent
Scannez une couleur pour démarrer — chaque palette ou tenue gardée apparaîtra ici.
[Scanner ma première couleur →]
```
Le titre « Mes favoris — Rien pour l'instant » est redondant et doit être supprimé en mode vide.

### 8. Styliste — bulle WADA + chips qui doublent l'info
La bulle WADA dit : « Dites-moi tout. Une occasion, une pièce, une humeur — je compose autour. »
Puis juste en dessous, les chips disent : Bureau lundi / J'ai un pull noir / Soirée samedi /
Surprends-moi / J'ai déjà une pièce. Les chips répètent l'idée déjà donnée dans la bulle.

**Correction** : raccourcir la bulle à `« Dites-moi tout — je compose autour. »` et laisser les chips
parler d'eux-mêmes. Moins de texte.

### 9. Page Palettes — phrase descriptive redondante
La page dit « 348 palettes trouvées · 348 accords intemporels du dictionnaire Sanzo Wada (1933) ».
Le « 348 » est répété deux fois.

**Correction** : remplacer par `« 348 accords intemporels — Sanzo Wada, 1933 »` (une seule fois).

### 10. Page À propos — typographie incohérente
La page mélange : titre chubby noir, titre chubby italique, paragraphe chubby italique, paragraphes
serif italique en couleur (rouge corail), paragraphes sans-serif noir. Trop de variantes pour une
seule page.

**Correction** : 
- Titres : Fredoka, poids 500, noir.
- Sous-titres : Fredoka, poids 500, plus petit, bordeaux.
- Corps : Inter, poids 400, noir/gris.
- Citations : Fredoka italique, ton bordeaux ou olive.
**Pas plus de 4 styles** sur une page.

### 11. Toggle « Vue ◾ ⬜ » sur la page Palettes
Les deux icônes ne sont pas claires. C'est carré plein vs carré vide — on devine que c'est
grille vs liste, mais ce n'est pas évident.

**Correction** : utiliser des icônes plus parlantes (par ex. une grille de 4 carrés vs une liste de
3 lignes), ou mettre un label texte minuscule au-dessus du toggle (`VUE : grille · liste`).

---

## 🟡 PETITS DÉTAILS — polish

### 12. Le « X » de suppression sur les pièces du panier
Petit, en haut à droite, peu visible. Sur mobile la zone tactile est minuscule.

**Correction** : augmenter la zone tactile à au moins 44×44px (recommandé Apple), et garder l'icône
visuellement petite mais le `padding` qui entoure étendu.

### 13. La pilule « Abonnement » en haut à droite
Contour orange/coral, plutôt voyante. Pas catastrophique mais elle attire l'œil systématiquement.

**Correction** : si le user est connecté ET abonné, cacher complètement. Sinon, garder en contour
mais en couleur plus douce (bordeaux foncé).

### 14. Liens du footer empilés en colonne
Lorsque le footer apparaît, les sections (Explorer, Compte, Contact) s'empilent une colonne par une.
C'est très long.

**Correction** : sur mobile, 2 colonnes côte à côte (Explorer | Compte) puis 1 ligne pour Contact en
dessous. Plus compact, moins de scroll.

### 15. Les hashtag « 和 » dans le toast Reprendre
Le « 和 » dans la pilule est joli mais petit et flou si l'icône est trop réduite.

**Correction** : utiliser une vraie icône SVG plutôt que le caractère unicode, ou augmenter la taille
de police de l'icône à 18px minimum.

### 16. Le bouton « Notre histoire » en deuxième CTA sur l'accueil
Bouton ghost discret, OK. Mais le texte « Notre histoire » est moins percutant que « En savoir plus »
ou « Découvrir WADA ».

**Correction (optionnel)** : tester `« Comment ça marche »` ou `« Découvrir WADA »` — plus orienté
bénéfice utilisateur.

### 17. Les chips d'orientation profil sur Scanner vêtement
Les chips « Femme / Homme / Unisexe » sont OK, mais « Unisexe » est en bordeaux par défaut. Pourquoi
celui-ci plutôt qu'un autre ? Le default devrait être **le profil de l'utilisateur** (si connecté
en Femme, default = Femme).

**Correction** : préselectionner le genre du profil utilisateur. Si pas de profil, default = Unisexe
(neutre).

### 18. Espaces blancs en bas de plusieurs pages
Sur Favoris vide notamment, il y a beaucoup de vide entre le contenu et le footer / tab bar.

**Correction** : centrer verticalement le contenu d'empty state sur la hauteur disponible, ou ajouter
un visuel décoratif (illustration légère, palette flottante).

---

## Check-list de validation après corrections

- [ ] Pilule « Reprendre » repositionnée en bas à droite, ne couvre rien sur l'accueil.
- [ ] Panier affiche vraies images, vrais prix, vraies marques (plus de « No. 066 · Amazon FR · ~80€ »).
- [ ] Tab bar a un fond solide ; footer ne transparaît plus derrière.
- [ ] Scanner couleur : un seul aperçu (pastille), pas deux carrés vides.
- [ ] Scanner vêtement : un seul niveau de catégorisation, pas deux.
- [ ] Favoris vide : un seul message, pas de doublon.
- [ ] Styliste : bulle WADA raccourcie.
- [ ] Page Palettes : phrase descriptive non répétée.
- [ ] À propos : 4 styles typographiques maximum, hiérarchie claire.
- [ ] Footer mobile : 2 colonnes au lieu de 1.
- [ ] Zones tactiles 44×44 minimum sur tous les boutons.
- [ ] Profil utilisateur préselectionné sur Scanner vêtement.

---

Priorité absolue codeur : régler les **4 points critiques** en haut (Reprendre, Panier prix/photos,
tab bar + footer). Ça fait passer WADA de « rendu mobile cassé » à « propre et utilisable ». Les
points orange et jaune peuvent suivre en seconde passe.
