# WADA — Rendre le site plus instinctif, épuré et « appli efficace » (pour le codeur)

But : un client doit comprendre quoi faire en **3 secondes**, sans réfléchir, sur n'importe quel
écran. Moins de texte, moins de choix, plus d'air. On vise une **sensation d'application**, pas de
site. Maquette de référence : `wada-app-epure.html` (+ `wada-scanner-v2.html`, `wada-scanner-vetement-v2.html`).

---

## 1. Une seule action évidente par écran
La règle la plus importante. Chaque écran a **UNE** action principale, mise en avant (gros bouton
bordeaux), et tout le reste est secondaire (liens discrets, ghost buttons).
- Accueil → « Scanne une couleur ».
- Scanner → « Prendre une photo ».
- Palette → « Composer cette tenue ».
- Tenue → « Voir / acheter les pièces ».
Si un écran a deux boutons de même poids visuel, c'est une erreur : un seul plein, l'autre en contour.

## 2. Navigation type appli : barre d'onglets en bas (mobile)
Sur mobile, remplacer la nav du haut par une **tab bar fixe en bas** (toujours visible, au pouce) :
**Accueil · Palettes · Scanner · Styliste · Favoris**. Le Scanner est le bouton central, surélevé et
bordeaux (l'action cœur du produit). La nav du haut ne garde que le logo + compte + jour/nuit.
- Avantage praticabilité : 0 clic pour changer de section, depuis n'importe où.
- Sur desktop : garder la nav haute, mais une seule version partout (pas 3 variantes selon la page).

## 3. Toujours une sortie : retour + reprise
- Bouton **Retour** présent et identique sur toutes les pages internes (déjà bon sur Scanner).
- Sur l'accueil, une bande **« Reprends ta tenue »** qui ramène le client là où il s'était arrêté
  (dernière palette / tenue en cours). Un client ne doit jamais repartir de zéro.
- Jamais de cul-de-sac : chaque écran propose l'étape suivante.

## 4. Réduire le texte, augmenter l'air
- Couper les sous-titres explicatifs longs ; une ligne courte suffit.
- Espacements généreux et **constants** (système d'espacement : 8 / 16 / 24 / 32).
- Supprimer les éléments décoratifs qui n'aident pas à agir (doubles pastilles « couleur détectée »,
  blocs marketing au milieu d'un parcours, etc.).

## 5. Un seul composant par type, partout
- **Une seule carte palette** (PaletteCard) réutilisée sur Accueil, Palettes, Favoris, résultats Scanner.
  Même format, même code WADA (pas de PANTONE), même coins arrondis.
- **Une seule carte produit** (photo qui REMPLIT la carte en `object-fit:cover`, nom, prix, marque).
- **Une seule police de titre** (Fredoka) sur tout le site ; texte courant en Inter. Zéro serif.
- Mêmes rayons (16–24px), mêmes ombres douces, même palette de couleurs partout.

## 6. Le parcours cœur doit être un « flux », pas des pages isolées
Scan couleur (ou pièce) → palettes assorties → tenue à acheter. À chaque étape, montrer **ce qui vient
après** (ex. « Ensuite : palettes → ta tenue »). Le client doit sentir qu'il avance dans un tunnel
clair, pas qu'il navigue dans un site.

## 7. États clairs (jamais de page « morte »)
- **Chargement** : squelettes (formes grises animées), pas de page blanche.
- **Vide** : un message + l'action pour démarrer (ex. Favoris vide → « Scanne ta première couleur »).
- **Détecté** : un seul aperçu net (pastille + nom + code), bouton d'action qui s'active.
- **Erreur** : message court + bouton « réessayer », jamais de jargon technique.

## 8. Rapidité ressentie
- Réactions instantanées au tap (états pressés, transitions courtes 120–180ms).
- Images en `cover`, dimensionnées, lazy-load ; la home ne doit pas « sauter » au chargement.
- Le Scanner affiche la couleur détectée immédiatement, sans rechargement de page.

## 9. Cohérence des libellés et de la monnaie
- Mêmes mots partout (« Abonnement », pas tantôt « Commencer »).
- Prix dans **une seule monnaie** affichée correctement (€), alignés à droite dans les listes.
- Corriger les libellés bruts type « /compte » qui s'affichent à l'écran.

---

## Checklist praticabilité (à cocher page par page)
- [ ] Une seule action principale visible immédiatement.
- [ ] Tab bar en bas présente (mobile) et identique partout.
- [ ] Bouton retour + étape suivante toujours accessibles.
- [ ] Cartes (palette/produit) issues d'UN seul composant.
- [ ] Une seule police de titre (chubby), zéro serif.
- [ ] États chargement / vide / erreur soignés.
- [ ] Aucun texte inutile ; espacements constants.
- [ ] Monnaie et libellés cohérents.

Objectif final : un client ouvre WADA, comprend en 3 secondes, et atteint sa tenue en quelques taps —
comme une appli, pas comme un site.
