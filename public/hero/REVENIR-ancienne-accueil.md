# WADA — Revenir à l'ancienne page d'accueil

**But :** annuler la refonte d'accueil inspirée du kit et remettre l'ancienne page d'accueil.

## La bonne version (à remettre)
- Fichier de référence : **`site-abouti.html`** (titre « WADA — version aboutie »).
- C'est la page d'accueil **beige chaleureuse** : hero avec le mannequin + voile léger,
  bloc **Atelier** (4 cartes), grille **Palettes** (cartes 3 bandes), manifeste, footer discret.
- Police d'origine (Fredoka pour les titres ronds + Fraunces en accent), identité beige/olive/bordeaux.

## La version à retirer (la nouvelle, NON désirée)
- Fichier : **`wada-accueil-inspire.html`**.
- Reconnaissable à : hero **vidéo** plein écran, section « Trois gestes, une garde-robe juste »,
  les 3 blocs « Oubliez les heures… / Votre palette… / De la couleur… », « Comment ça marche »,
  bande « Commencez à construire votre style », accent **prune** + polices Fraunces/Merriweather.
- → **Ne pas l'utiliser comme page d'accueil. La retirer / dépublier.**

## Ce que le codeur doit faire
1. Rebrancher la route d'accueil (`/`) sur le design **`site-abouti.html`** (l'ancien), pas sur la version inspirée du kit.
2. Supprimer ou dépublier `wada-accueil-inspire.html` (et ne plus le référencer dans la nav/sitemap).
3. Vérifier que le reste du site (Palettes, Scanner, Tenues, etc.) n'est pas impacté.
4. Garder les correctifs **hors accueil** déjà validés (favicon, header lisible float/solid,
   fond unique) — on ne revient PAS sur ceux-là, seulement sur le design de la page d'accueil.

## Test
- [ ] La page `/` affiche de nouveau l'accueil beige avec l'Atelier et les palettes.
- [ ] Plus aucune trace de la version « Trois gestes / Comment ça marche / hero vidéo prune ».
- [ ] Header lisible, favicon, et pages internes inchangés.
