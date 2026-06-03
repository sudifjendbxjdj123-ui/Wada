# WADA — Liste des erreurs du site (audit live wada.style)

Audit réalisé sur le site en ligne, pages : accueil, /atelier, /scanner, /about, /faq, /tarifs, /cultures.
(Non vérifiables ici : /palettes, /palette/[n], /ma-tenue, /decouverte, /compte, /panier — à contrôler visuellement, voir §7.)

Classé par priorité. Chaque point a un exemple concret pour le codeur.

---

## 1. 🔴 SEO cassé — balises canonical incorrectes (priorité haute)

Certaines pages ont un `<head>` correct, d'autres non. Deux groupes :

- **Pages OK** : accueil, /about, /faq → canonical propre et par page
  (ex. `/about` → `https://www.wada.style/about`).
- **Pages CASSÉES** : /atelier, /scanner, /tarifs, /cultures (et probablement les autres pages
  « à fond vidéo ») → **canonical = `https://wada.style`** (NON-www **ET** pointant vers la racine,
  pas vers la page). Idem `og:url = https://wada.style`.

Conséquence : Google voit /atelier, /scanner, /tarifs, /cultures comme des **doublons de la
page d'accueil** → ces pages ne se référencent pas. À corriger :
- canonical **par page** et **toujours en www** : `https://www.wada.style/atelier`, `/scanner`, etc.
- harmoniser `og:url` de la même façon.

**www vs non-www** : choisir UNE version canonique (vous utilisez www partout ailleurs → tout mettre en `www.wada.style`).

**theme-color incohérent** : `#F4EFE7` sur accueil/about/faq, mais **`#F4EFE6`** sur atelier/scanner/tarifs/cultures. Choisir une seule valeur.

---

## 2. 🟠 Deux menus (Nav) différents selon les pages

- Accueil, /about, /faq → menu **court** : « Palettes · Scanner · À propos » + bouton « Commencer ».
- /atelier, /scanner, /tarifs, /cultures → menu **différent** : « Qui sommes-nous · Atelier · ☰ (burger) · Abonnement · Créer un compte · Panier ».

→ Deux en-têtes distincts = le site paraît incohérent d'une page à l'autre. **Unifier un seul header**
sur tout le site (libellés, ordre, bouton CTA identiques).

---

## 3. 🟠 Deux footers différents

- Accueil/about/faq : footer court. Colonne « Explorer » commence par **« Palettes »**.
  Copyright : **« © 2026 WADA · Genève »**.
- atelier/scanner/tarifs/cultures : footer long (ajoute Calendrier, Panier, Affiliation, CGV,
  Confidentialité). Colonne « Explorer » commence par **« Tenues »** (même lien `/palettes`).
  Copyright : **« © 2026 Wada · D'après Sanzo Wada · 1933 »**.

À corriger : **un seul footer** partout. Et trancher :
- libellé du lien `/palettes` = « Palettes » **ou** « Tenues » (pas les deux).
- casse du nom : **« WADA »** ou « Wada » (incohérent entre les deux footers).

---

## 4. 🔴 Données palettes — numéros invalides, doublons, noms cassés (page /cultures)

Le site annonce **348 palettes** (donc numéros 001–348). Or /cultures pointe vers des numéros
**supérieurs à 348** → liens cassés / 404 probables :
- Marché à Dakar → `/palette/447`
- Promenade à Sintra → `/palette/412`
- Aube sur la pampa → `/palette/501`
- Coffee shop Melbourne → `/palette/458`
- Soir à Saint-Pétersbourg → `/palette/434`
- Café à Vienne → `/palette/367`

**Doublon** : « Café à Vienne » apparaît **deux fois** sous Autrichienne → `/palette/367` ET `/palette/216`.

**Noms de palettes cassés / mal formés** (français incorrect, semblent auto-générés) :
- « café d'Neige » (`/palette/025`)
- « voyage d'Brume » (`/palette/072`)
- « Osaka au thé » (`/palette/009`)
→ à renommer proprement (« Café de neige », etc.).

**Incohérences géographiques** (palette rangée sous la mauvaise culture) :
- Mexicaine → « Bruges en premier printemps » (Belgique), « voyage d'Brume »
- Russe → « Osaka au thé » (Japon), « Midi sur Édimbourg » (Écosse)
- Australienne → « Le Caire en printemps » (Égypte)
- Ottomane → « Lumière de Bali » (Indonésie)
- Néerlandaise → « Songe de Naples » (Italie), « Quiétude de Lisbonne » (Portugal)
- Indienne → « café d'Neige »

→ Revoir le mapping culture → palettes : n'afficher que des palettes **existantes (≤ 348)**,
sans doublon, et cohérentes avec la culture.

---

## 5. 🟠 Cohérence de marque & vocabulaire

- **Nom de l'abonnement incohérent** : la FAQ parle de **« WADA+ »** (« Qu'est-ce que WADA+ ? »),
  la page Tarifs parle de **« WADA Premium »**. Choisir un seul nom.
- **Palettes vs Tenues** : le produit est tantôt « palettes », tantôt « tenues »
  (ex. scanner : « 348 palettes prêtes » et « Voir les 348 tenues » ; atelier : « Créer une tenue · 348 tenues » → `/palettes`). Harmoniser le vocabulaire.
- **Anglais dans une UI française** (page Tarifs) : « AI Stylist personnalisé », « Closet Import
  (mon dressing complet) ». Traduire (« Styliste IA », « Import de garde-robe »).

---

## 6. 🟡 Contenu à vérifier / risques (confiance & légal)

- **Faux témoignages** (page Tarifs) : « Sophie Vidal, Architecte, Bordeaux », « Antoine Roux,
  Photographe, Paris » avec citations. S'ils sont inventés → à retirer ou remplacer par de vrais
  avis (sinon risque de tromperie). 
- **PANTONE®** (page /about) : codes affichés « 18-5017 TCX », « 19-3332 TCX », **« 07-1958 TCX »**.
  Le préfixe « 07- » n'existe pas au format Pantone TCX → code probablement inventé. Utiliser le nom
  PANTONE® avec des codes faux pose un souci d'exactitude/marque. Vérifier ou retirer la mention PANTONE®.
- **Chiffre « 80+ boutiques curées »** (/about) : à confirmer, sinon adoucir (« une sélection de boutiques »).

---

## 7. 🟡 Micro-typographie / fautes

- **Doubles espaces dans les titres** (visibles) :
  - Accueil : « Trouvez la couleur.  Trouvez votre style. »
  - /about : « idée simple :  rendre le style plus facile. »
  - /tarifs : « Simple, transparent,  annulable. »
  - /cultures : « Inspirations  du monde »
  → nettoyer les doubles espaces (souvent dus à un retour à la ligne mal géré).

---

## 8. 🟡 UX / navigation

- **Scanner — état par défaut trompeur** : la page /scanner affiche déjà « Couleur détectée #5C2018 »
  alors qu'aucune photo n'a été déposée. Afficher un état vide (« Aucune couleur scannée ») tant
  qu'il n'y a pas d'analyse.
- **Deux routes pour le « dressing »** : carte Atelier « Mon dressing » → `/garde-robe`, mais footer
  « Mes favoris » → `/favoris`. Vérifier si ce sont deux pages distinctes (risque de doublon/confusion) ;
  unifier vers une seule route.
- **Bouton « Retour »** : présent et placé différemment selon les pages (parfois avant, parfois après
  le header). Sur /atelier (le hub d'entrée depuis l'accueil), un « Retour » a peu de sens. Standardiser :
  même position partout, et pas de Retour sur les pages d'entrée.

---

## 9. ⚪ À vérifier visuellement (non contrôlable depuis le code HTML seul)

Ces points demandent un œil sur le rendu (police, couleurs, alignements, mobile) :
- **Police hors thème** : vérifier que tout le site utilise bien Fredoka (titres) + la police de
  l'identité, sans qu'une page parte sur une autre fonte. (Mentionné par toi — à repérer page par page.)
- **/palettes** (grille 348), **/palette/[n]** (détail), **/ma-tenue** (cartes tenue), **/decouverte**,
  **/compte**, **/panier** : non audités ici, à parcourir.
- **/ma-tenue** : tant que le flux MUJI n'est pas branché, les pièces montrent des aplats de couleur
  + « ~55 € » (normal, voir `WADA-integration-flux-MUJI.md` §9).
- **Responsive mobile** : header burger, footer, grilles — à tester sur téléphone.

---

## Récap des priorités

1. **Corriger les canonical** (non-www + pointant vers la racine) sur atelier/scanner/tarifs/cultures → SEO.
2. **Unifier header et footer** sur tout le site.
3. **Nettoyer les données palettes** (numéros > 348, doublons, noms cassés, mauvaises cultures).
4. Harmoniser le vocabulaire (WADA+ / Premium, palettes / tenues, anglais → français).
5. Retirer/!vérifier faux témoignages + codes PANTONE® douteux.
6. Corriger doubles espaces + état par défaut du scanner.
