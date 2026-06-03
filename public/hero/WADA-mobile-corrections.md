# WADA — Corrections mobile (téléphone) pour le codeur

Cible : corriger les bugs, incohérences et pages surchargées sur téléphone. Constats tirés de la
structure du site + bonnes pratiques mobile. Classé par impact. (Certains points 100 % visuels sont
à confirmer sur capture — section finale.)

---

## 1. 🔴 Navigation mobile incohérente (le plus visible)

Aujourd'hui il y a **3 systèmes de nav différents** selon les pages, et sur mobile ça se voit :
- certaines pages ont un **menu burger (☰)**,
- /decouverte a une **barre d'onglets en bas** (◎ Scanner ▦ Palettes ✦ Styliste ○ Compte),
- d'autres un header simple.

À faire :
- **Un seul système mobile sur tout le site.** Recommandé : **barre d'onglets en bas** (4 icônes max :
  Palettes, Scanner, Styliste, Compte) **partout** + un header minimal en haut (logo + Abonnement).
  Sinon, burger partout — mais pas un mélange.
- **Bug** : le lien compte affiche le texte brut **« /compte »** → « Compte » (ou icône).
- Le burger (☰) et les icônes sans texte doivent avoir un `aria-label`.

## 2. 🟠 Footer surchargé sur mobile

Le footer empile 3 colonnes + 12-15 liens (Explorer, Compte, Contact, Calendrier, Installer l'app,
CGV, Confidentialité…) → un mur interminable à scroller sur téléphone.
- Passer le footer en **accordéon** sur mobile (sections repliées : Explorer / Compte / Contact),
  ou une version compacte (logo + 4-5 liens essentiels + « plus »).
- Harmoniser : mêmes liens partout (certaines pages ont « Installer l'app »/« Calendrier », d'autres non).

## 3. 🟠 Hero vidéo = lourd sur mobile

Les vidéos de fond en autoplay (femme-wada-bg.mp4, rue-video-*.mp4) consomment data/batterie et
ralentissent le chargement sur téléphone.
- Sur mobile : afficher l'**image poster** (`.webp`) au lieu de lire la vidéo en autoplay
  (ou `preload="none"` + lecture seulement au scroll). Toujours un `poster`.
- Vérifier la **lisibilité du titre** sur petit écran (garder le voile/scrim suffisant).

## 4. 🔴 Pages trop chargées sur mobile

- **/cultures** : ~17 cultures, chacune avec pièces + palettes + 5-6 marques = page **énorme** à
  scroller sur téléphone. → mettre chaque culture en **accordéon** (titre cliquable qui déplie), ou
  une grille de cultures → page par culture. Aujourd'hui tout est déployé d'un coup.
- **/palettes** (348 cartes) : sur mobile, **pagination ou chargement progressif** obligatoire
  (sinon page interminable + lente). Filtres accessibles via un bouton « Filtrer » (bottom sheet).

## 5. 🟠 Cartes & grilles sur mobile

- **Tenue** (/ma-tenue) : passer la grille à **1 colonne** sur mobile (2 colonnes = trop serré),
  image pleine largeur, nom sur 2 lignes. (cf. `WADA-tenue-MASTER.md`)
- **Palettes / Découverte** : 2 colonnes max sur mobile, jamais de **débordement horizontal**
  (vérifier qu'aucune ligne ne dépasse l'écran → scroll latéral = bug).
- **Scanner** : le panneau (dépôt photo + texte explicatif) doit **s'empiler** verticalement sur
  mobile, pas rester en 2 colonnes compressées.

## 6. 🟠 Zones tactiles & formulaires

- **Cibles tactiles ≥ 44 × 44 px** : liens du footer, pastilles de couleur, « + N autres marchands »,
  icônes — souvent trop petits au doigt.
- **Champs de saisie en 16px minimum** (sinon iOS zoome automatiquement au focus = effet sautillant).
- Boutons « Acheter » / CTA : pleine largeur sur mobile, bien espacés.

## 7. 🟡 Détails / non-sens à corriger (pas que mobile)
- **/calendrier** : date « Aujourd'hui » figée (20 mai) → date réelle.
- **Scanner** : « Couleur détectée #5C2018 » affiché par défaut → état vide tant qu'aucune photo.
- Vocabulaire : « palettes » vs « tenues », « WADA+ » vs « WADA Premium » → unifier.
- Double espace dans le titre d'accueil.

---

## À confirmer sur une capture mobile (pour cibler le reste)
Envoyez-moi 2-3 **captures depuis votre téléphone** (accueil, une tenue, /cultures ou /palettes) :
je repérerai les bugs visuels précis (chevauchements, textes coupés, boutons hors écran, marges
incohérentes) et je les ajouterai ici.

## 10. 🔴 Écran d'accueil mobile — détails (d'après l'audit visuel téléphone)

- **Barre du haut surchargée** (menu + logo WADA和田 + icône profil + icône lune + gros bouton
  « Abonnement » tous tassés) → **alléger** : ☰ à gauche, logo centré aéré, **UNE seule action** à
  droite. Déplacer l'icône profil dans l'onglet « Compte » (déjà en bas), le thème (lune) dans le
  menu/réglages avec un libellé (« Thème sombre »), réduire/déplacer « Abonnement ».
- **Textes qui se coupent / débordent** : le titre « Trouvez la couleur. Trouvez votre style. »
  touche les bords et se superpose à la silhouette → marges intérieures, taille de police responsive,
  retour à la ligne autorisé, et **respect des safe areas** (encoche, heure, barre du bas).
- **Lisibilité du titre** : titre sombre sur silhouette sombre → ajouter un **voile/dégradé** derrière
  le texte (contraste garanti partout).
- **Bouton « Notre histoire » presque invisible** (fantôme sur l'image) → lui donner un contour ou un
  fond léger pour qu'on voie que c'est cliquable.
- **Bande noire en haut de l'image** (sous l'en-tête) = effet « bug » → faire remonter l'image
  jusqu'en haut ou la remplacer par un dégradé propre ; l'image doit remplir tout l'espace.
- **Espacements irréguliers** → marges régulières et cohérentes (mêmes écarts entre blocs), harmonisées
  avec la barre du bas.
- **Tester sur petit ET grand écran.**

## Résumé pour le codeur (à coller)
1. **Une seule navigation mobile** (barre d'onglets partout) + corriger le label « /compte ».
2. **Footer en accordéon** compact sur mobile, liens harmonisés.
3. **Hero** : poster image sur mobile (pas de vidéo autoplay).
4. **/cultures en accordéon**, **/palettes paginée**, **/ma-tenue en 1 colonne**.
5. Aucune **scroll horizontale** ; cibles tactiles ≥ 44 px ; champs ≥ 16px.
6. Corriger date calendrier + état vide scanner + vocabulaire + double espace.
