# WADA — Améliorations « expérience client » (pour le codeur)

Regard d'un client qui découvre le site. Le site est déjà bon (menu unifié, vraies photos de tenue
grandes et nettes, genre respecté, scanner avec type de pièce, codes WADA, réassurance, états vides
soignés). Ici : les **vraies frictions** qui empêchent l'expérience d'être fluide et instinctive —
pas des corrections cosmétiques. Classé par impact client.

---

## 1. La première impression ne montre pas ce que fait WADA
**Constat client** : sur l'accueil, je lis « Trouvez la couleur. Trouvez votre style. » puis…
plus rien (hero + footer). Je ne **vois** pas la magie (une couleur → une tenue achetable). Je dois
cliquer « Entrer dans l'atelier » à l'aveugle, vers un mot abstrait.
**Améliorations** :
- Ajouter **une bande légère et élégante sous le hero** (pas les anciennes sections lourdes) : soit
  un **aperçu de 4-5 palettes** cliquables, soit **un exemple « couleur → tenue »** en 1 visuel.
  Montrer = comprendre en 3 secondes.
- Rendre le **bouton principal plus concret** : « Scanner une couleur » ou « Explorer les palettes »
  (l'action cœur) plutôt que « Entrer dans l'atelier » (abstrait). Garder « Notre histoire » en second.
- **Kicker « INSPIRÉ DE SANZO WADA · 1933 »** : en rouge foncé sur la photo, **illisible**. Le passer
  en clair (ou sur le voile) pour qu'on le lise.

## 2. Le « hub Atelier » fait doublon avec le menu
**Constat client** : le menu donne déjà Palettes / Scanner / Styliste / Favoris. Le bouton d'accueil
m'envoie vers « L'atelier » qui propose… les **mêmes 4 entrées**. C'est un clic en trop.
**Amélioration** : soit l'accueil mène **directement** à l'action cœur (Scanner ou Palettes), soit
garder l'Atelier mais l'assumer comme **page d'entrée unique** (et alors alléger la redondance). Éviter
que le client passe par 2 menus pour la même chose.

## 3. La page tenue — ce qui manque à un acheteur
La page est belle. Mais en tant qu'acheteur :
- **Pas de total** : je vois 44,95 + 119 + 34,95 + 199 + 14,95… je veux le **prix total de la tenue**
  affiché (« La tenue complète : ~413 € »), et idéalement un **filtre budget** visible ici.
- **« + 3 autres marchands » n'est pas cliquable** : je veux **voir** les alternatives (souvent moins
  chères). Le rendre **dépliable** (liste des autres options/prix).
- **Étiquette couleur ≠ produit réel** : « HAUT · CRÈME » mais la chemise est **grise** ;
  « VESTE · OLIVE » mais le sweat est **anthracite/vert foncé». L'étiquette doit refléter la **vraie
  couleur du produit choisi**, sinon le client est dérouté.
- **Cohérence registre** : « tailoring net » mais chaussures = **sneakers** et accent = **tote en
  coton**. Acceptable en smart casual, mais si on annonce « tailoring », viser derbies/mocassins +
  ceinture/petite maroquinerie pour que le client sente que c'est vraiment pensé.
- Tout est **MUJI** : ça ressemble à un catalogue MUJI, pas à une curation multi-marques. → priorité
  business : brancher 2-3 marques de plus (en cours). En attendant, le repli Amazon doit montrer une
  vraie alternative.

## 4. Cohérence de marque — la police d'affichage
**Constat client** : WADA vise l'élégance éditoriale (Sanzo Wada, quiet luxury, Genève). Or la grande
police **très ronde/bubble** (« Mes favoris », « Une pièce que vous avez », « L'atelier WADA ») fait
**ludique/enfantin** et jure un peu avec le contenu raffiné et le logo serif. 
**DÉCISION PRISE** : on **garde la police chubby** (choix d'identité assumé). L'harmonie vient donc de
la **cohérence**, pas du changement : titres en chubby partout, serif soit retiré soit limité à UN
usage défini, texte en sans lisible. Détails dans `WADA-typographie.md`. (Aujourd'hui ça hésite à
cause du mélange chubby/serif au hasard — c'est ça qu'on règle.)

## 5. Page palette — les « 3 façons de la porter » se ressemblent
**Constat client** : « Ce look / Plus décontracté / Plus habillé » montrent les **mêmes 3 barres de
couleur** → je ne vois pas en quoi ils diffèrent. **Amélioration** : un mini-indice visuel par variante
(icône/pièce type, ou une silhouette différente) pour donner envie de cliquer.

## 6. Petits accrocs de confiance / copie
- **« 348 palettes · Mises à jour chaque semaine »** (grille) : le dictionnaire de 1933 est **fixe**.
  Dire « mises à jour chaque semaine » est trompeur → reformuler (« 348 accords intemporels » ; le
  « chaque semaine » concerne la Découverte/Calendrier, pas les palettes).
- **Icônes header (profil, lune)** sans libellé : ajouter une infobulle/`aria-label` (« Compte »,
  « Thème sombre »).

## 7. Fluidité globale (rythme)
- Plusieurs pages = un bloc de contenu puis un **grand vide** avant le footer noir (accueil, stylist,
  favoris). Ça fait « page courte/inachevée ». → réduire le vide ou ajouter un élément discret
  (citation, aperçu) pour un rythme plus plein et équilibré.

---

## En résumé — les 5 qui changeront le plus l'expérience client
1. **Montrer la magie dès l'accueil** (aperçu palettes/exemple) + CTA concret + kicker lisible.
2. **Prix total + « autres marchands » dépliables** sur la tenue.
3. **Étiquette couleur = vraie couleur du produit** (cohérence).
4. **Trancher la typographie** (une seule logique : éditoriale OU ronde, pas les deux).
5. **Plus d'une marque** (en cours) pour que la curation soit crédible.

Ce ne sont pas des corrections « pour corriger » : chacune lève une vraie hésitation que ressent un
visiteur, et rend le parcours plus évident et plus désirable.

---

# Partie 2 — autres pages (Cultures, Tarifs, À propos, FAQ, Install, Contact, Partenaires, Mentions)

✅ **Déjà bien corrigé** (constaté) : Cultures en **accordéon** (fini le mur), **faux témoignages
retirés** de Tarifs, **anglais traduit** (« Styliste IA », « Import de garde-robe »), page **Install**
claire et soignée, pages légales complètes. Beau travail.

## 8. LA TYPOGRAPHIE — le point d'harmonie n°1 (visible sur TOUTES ces pages)
**Constat client** : sur chaque page, le grand titre est dans une police **très ronde / « bubble »**
(« Inspirations du monde », « Simple, transparent, annulable », « WADA est né d'une idée simple »,
« Questions fréquentes », « Contact », « Vos pièces présentées… »). À côté, le **logo**, les **noms de
palette** et les **Mentions légales** sont en **serif élégant**. Résultat : le site **hésite** entre
joyeux/enfantin et raffiné/éditorial.
**Pourquoi ça compte** : WADA vend de l'élégance (Sanzo Wada, quiet luxury, Genève). La police bubble
tire vers le ludique et **dévalorise** le positionnement premium. C'est, à mon avis de client, le
**plus gros levier d'harmonie** du site.
**DÉCISION** : on **garde la police chubby** pour les titres (identité WADA). Donc : la rendre
**cohérente** — titres chubby sur TOUTES les pages (y compris Mentions/Contact qui repassent en serif
aujourd'hui), serif retiré ou limité à un seul usage, texte en sans. Voir `WADA-typographie.md`.

## 9. Page Tarifs — clarifier Premium vs Annuel
**Constat client** : il y a **3 colonnes** : Découverte (0€), WADA Premium (1,99€/mois), WADA Annuel
(17,99€/an). Mais « Premium » et « Annuel », c'est **le même produit**, juste facturé différemment →
ça crée une hésitation (« lequel est mieux ? »).
**Amélioration** : 2 plans seulement — **Découverte** et **Premium** — avec un **interrupteur
Mensuel / Annuel** sur la carte Premium (le « -25% » apparaît sur Annuel). Plus clair, plus standard,
plus rassurant.

## 10. Devise — toujours incohérente
Tarifs en **€** (1,99 € / 17,99 €) mais Mentions/CGV en **CHF**. → aligner sur une seule devise,
cohérente avec Stripe (rappel des fichiers précédents).

## 11. Page Partenaires — formulaire peu lisible
**Constat** : le formulaire de candidature (sur fond bordeaux) a des **champs très peu contrastés**
(placeholders à peine visibles). **Correction** : champs avec fond clair / bordure nette, labels
visibles → un partenaire doit pouvoir remplir sans effort.

## 12. Cultures — « Pièces emblématiques » renvoient vers Google Shopping
**Constat client** : dans une culture, « Costume trois-pièces → », « Richelieus → » ouvrent une
**recherche Google Shopping** générique. C'est un peu brutal (on quitte l'univers WADA pour une page
de résultats). **Amélioration** : à terme, lier vers une **palette/tenue WADA** ou des produits
affiliés ; a minima, libeller clairement (« chercher → ») pour ne pas surprendre.

## En résumé Partie 2 — par impact
1. **Trancher la typographie** (serif partout pour les titres) → le vrai saut d'harmonie/premium.
2. **Tarifs : 2 plans + bascule Mensuel/Annuel** (clarté).
3. **Devise unique** (Tarifs ↔ CGV ↔ Stripe).
4. **Formulaire Partenaires lisible** (contraste).
5. Cultures : adoucir/clarifier les liens « Pièces emblématiques ».
