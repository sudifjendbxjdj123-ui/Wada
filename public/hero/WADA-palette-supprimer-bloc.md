# WADA — Page palette : supprimer le bloc « Comment porter » (pour le codeur)

## Ce qu'il faut supprimer

Sur la page palette (ex. `/palettes/[id]`), supprimer **TOUT** le bloc qui suit le hero
(palette + titre + description) :

1. ❌ La section **« Comment porter [nom de la palette] ? »** avec les 3 cartes (Tailoring classique
   / Casual chic / Tenue habillée) — chips de pièces + boutons « Voir ce look ».

2. ❌ La ligne **« Ou dialoguez avec le styliste pour une tenue sur-mesure autour de cette palette. »**

3. ❌ La pilule du bas **« ENSUITE · Choisissez un look pour voir la tenue à acheter → »**

## Ce qui reste sur la page palette

- Nav (haut)
- Bouton Retour
- **HERO** : palette card (3-4 couleurs avec codes WADA et hex) + titre + description courte
- (Optionnel selon design) : bloc métadonnées Ambiance / Saison / Luminosité / Contraste
- Mini icones favori + Pinterest
- Badge perso (« Composée pour vous · Femme · 150-400€ · Minimaliste »)
- Prev / Next palettes (discret)
- Footer

## Pourquoi cette suppression

Les 3 cartes Tailoring / Casual / Soirée étaient abstraites et redondantes — le client ne sait
pas ce qu'elles veulent dire tant que WADA ne le connaît pas vraiment. Le chemin vers une tenue
passera désormais par :
- Le **styliste IA** (dans l'onglet Styliste) qui pose les bonnes questions et compose vraiment
- Le **scanner** (couleur ou vêtement) qui amène directement à une palette → tenue

La page palette redevient ce qu'elle doit être : **une page éditoriale qui présente une harmonie de
couleurs**, point. Le client la sauvegarde en favori, ou il va voir le styliste depuis la nav.

## Le badge perso et le bouton « Voir ma tenue » ?

Si tu veux garder UN seul appel à l'action vers la tenue (sans les 3 cartes), tu peux mettre **un
seul bouton bordeaux** « Voir ma tenue → » sous la description, qui amène à la page tenue composée
pour le profil actif. Mais ce n'est pas obligatoire — le client peut aussi simplement aimer la
palette, la garder, et générer la tenue plus tard via le styliste.

À discuter avec Nem. Par défaut, **on enlève les 3 cartes** et on laisse le client utiliser la
nav (Scanner / Styliste) pour la suite.

## Avant / après visuel

**AVANT** (trop chargé) :
```
[Hero palette + titre]
[3 cartes Tailoring/Casual/Soirée avec chips + boutons]
[Ligne « Ou dialoguez avec le styliste »]
[Pilule « ENSUITE : choisissez un look »]
[Prev/Next]
[Footer]
```

**APRÈS** (épuré) :
```
[Hero palette + titre + métadonnées + icônes favori/Pinterest]
[Badge perso]
[Optionnel : 1 bouton « Voir ma tenue → »]
[Prev/Next]
[Footer]
```

C'est tout. Page deux fois plus courte, beaucoup plus respirante, et le parcours vers la tenue est
clarifié (passer par le styliste ou le scanner).
