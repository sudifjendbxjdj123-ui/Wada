# WADA — Supprimer la pilule REPRENDRE (consigne codeur)

## Ce qu'il faut supprimer

La pilule **« 和 REPRENDRE → [nom de palette] »** qui flotte sur la page d'accueil et qui masque
une partie du bouton « Scanner une couleur » du hero.

Aussi présente en bas (mobile) au-dessus de la tab bar — à supprimer pareil.

## Pourquoi on l'enlève

1. Elle **mange le hero** sur desktop et mobile.
2. Elle est **vide au premier accès** (rien à reprendre quand on découvre WADA) — inutile.
3. Elle crée un **deuxième CTA** qui parasite l'action principale.
4. Elle pose des problèmes de positionnement réglés depuis plusieurs itérations.

Mieux vaut un accueil **propre et lisible** que cette pilule mal placée.

## Concrètement à supprimer dans le code

Chercher dans `components/` ou équivalent un composant `<ResumePill />`, `<ReprendrePill />`,
`<LastVisitedPill />` ou similaire. Le supprimer **complètement** :
- Du JSX de `app/page.tsx` (la home)
- Du layout si jamais il est rendu globalement
- Et son fichier de composant

Supprimer aussi :
- Les **state / hooks** associés (ex : `useLastPalette`, lecture de `localStorage.wada.last_palette`)
- Les **CSS** correspondants (classes `.resume-pill`, `.reprendre`, etc.)
- Les **tests** liés s'il y en a

## Ce qu'on garde

- Le hero vidéo plein écran (cf. `WADA-accueil-footer-fix-technique.md`)
- Le titre + sous-titre + 2 boutons (Scanner / Notre histoire)
- Rien d'autre

## L'idée derrière

L'accueil WADA doit être **émotionnel et clair** : une vidéo qui captive, un titre net, deux
boutons. Pas de pilule qui flotte, pas de mémoire de session affichée. Si plus tard on veut une
fonction "reprendre", elle ira dans la **page Compte** ou dans un **onglet Favoris**, pas en surimpression du hero.

## Test après suppression

- [ ] Sur la home desktop : aucune pilule visible. Le hero est entier.
- [ ] Sur la home mobile : aucune pilule visible. La tab bar du bas reste propre.
- [ ] Aucune autre page n'utilise ce composant (vérifier les imports).
- [ ] Le `localStorage.wada.last_palette` n'est plus écrit (puisque inutile).
- [ ] Aucun warning console après suppression.

5 minutes de boulot. À faire avant tout autre fix sur la home, ça nettoie la base.
