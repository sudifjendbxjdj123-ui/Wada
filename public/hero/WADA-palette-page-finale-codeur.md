# WADA — Page palette : refonte définitive (pour le codeur)

## Le constat
La page palette actuelle (ex. Mirage du désert) empile **5 façons différentes** de faire la même
chose :
1. Le filtre « Affinez en 1 clic » (Pour qui / Budget / Style / Saison / Tendance)
2. Le champ libre « Décrivez ce que vous voulez »
3. Le bloc « Ton envie aujourd'hui » (perçu / humeur / objectif)
4. Les 3 cartes Au bureau / Au quotidien / En soirée
5. La ligne « Ou dialoguez avec le styliste »
6. La pilule « ENSUITE · Choisissez un look »

C'est trop. Le client est paralysé.

## Ce que la page doit être

Une page **éditoriale**. On présente une harmonie de couleurs. **UNE seule action** vers la tenue.
Le reste appartient au styliste.

## Maquette de référence
`wada-palette-mirage.html` — à ouvrir dans un navigateur pour voir le rendu attendu.

## Structure finale

```
[NAV : logo + 4 liens nav | abonnement contour + avatar profil]

[Bouton Retour]

[HERO 2 colonnes]
  ├─ GAUCHE : Palette card (3 swatches avec codes WADA + hex)
  └─ DROITE :
       ├─ Kicker "No. 201 · Marocaine"
       ├─ Titre "Mirage du désert"
       ├─ Description italique courte
       ├─ Bloc métadonnées (Ambiance / Saison / Luminosité / Contraste)
       ├─ Badge perso "Composée pour vous · [profil]"  ← cliquable → switcher
       ├─ Bouton UNIQUE bordeaux "Voir ma tenue →"
       └─ Mini-actions (favori + Pinterest)

[Prev / Next palettes en texte discret, pas en bandeau noir]

[Petit lien : "Tenue sur-mesure ? Parler au styliste"]

[Footer]
```

## Ce qu'il faut SUPPRIMER

❌ Le bloc « Composées pour vous — Affinez en 1 clic » avec ses chips Pour qui / Budget / Style /
Saison / Tendance.
   → Pourquoi : c'est le rôle du **profil utilisateur** (qui s'édite via le switcher accessible
   depuis le badge ou la pastille de la nav). Ne pas dupliquer.

❌ Le champ libre « Ex. je veux un style sobre pour un mariage… ».
   → Pourquoi : c'est le rôle du **styliste IA** (page dédiée). La page palette n'est pas un chat.

❌ Le bloc « Ton envie aujourd'hui » (Comment veux-tu être perçu / Ton humeur / Ton objectif).
   → Pourquoi : ces questions appartiennent au **flux du styliste IA** ou à un moment juste avant la
   génération de tenue, pas à la page palette qui est éditoriale.

❌ Les 3 cartes « Au bureau / Au quotidien / En soirée » avec chips.
   → Pourquoi : abstrait. Sans contexte, ces mots ne disent rien au client. Le styliste fait
   beaucoup mieux ce job.

❌ La ligne « Ou dialoguez avec le styliste pour une tenue sur-mesure ».
   → Pourquoi : déplacée en mini-lien discret tout en bas de la page. Une seule fois suffit.

❌ La pilule « ENSUITE · Choisissez un look ».
   → Pourquoi : redondante avec le bouton « Voir ma tenue » du hero.

## Ce qu'il faut GARDER ou AJOUTER

✅ **Le bloc métadonnées Ambiance/Saison/Luminosité/Contraste** — c'est ce qui donne du sens éditorial
à la palette. À garder, juste sous la description.

✅ **Le badge perso** « Composée pour vous · [Genre] · [Budget] · [Style] » — cliquable, ouvre le
switcher pour modifier le profil instantanément.

✅ **UN bouton primaire « Voir ma tenue → »** — le SEUL appel à l'action principal. Mène à la page
tenue composée pour le profil actif (cohérente avec la palette).

✅ **Mini-actions** (favori + Pinterest) — petits boutons ronds discrets sous le CTA.

✅ **Prev/Next palettes** — version épurée (deux liens texte, pas un bandeau noir massif).

✅ **Mini-lien styliste** en bas de page pour ceux qui veulent du sur-mesure.

## Le parcours après cette refonte

Le client arrive sur une palette → il voit la palette + son nom + ses métadonnées + le profil actif
→ il clique « Voir ma tenue ». Une tenue composée pour SON profil ET cette palette apparaît
(cf. spec composition de tenue).

S'il veut autre chose : il va dans le **Styliste** (via la nav) où il peut décrire son envie en
langage naturel, ajuster son humeur, son objectif, etc. C'est LÀ que tout ce qui était empilé sur la
palette doit vivre.

## Récap visuel : avant / après

**AVANT (page actuelle)** : 6 sections empilées, ~2500px de hauteur, le client scrolle et ne sait pas
où agir.

**APRÈS (page refondue)** : 2-3 sections en tout, ~900px de hauteur, le client voit la palette,
voit ce qui lui est proposé, clique. Une décision, une action.

Référence visuelle : `wada-palette-mirage.html`.
