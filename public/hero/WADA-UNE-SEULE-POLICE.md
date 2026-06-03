# WADA — UNE SEULE POLICE DE TITRE SUR TOUT LE SITE (pour le codeur)

## La règle, sans exception
**Tous les titres de TOUTES les pages utilisent LA MÊME police : la police ronde « chubby » (Fredoka).**
- Plus AUCUN titre en serif, nulle part (aujourd'hui « Mes favoris », « Trouvez votre couleur exacte »,
  « Quelle combinaison vous parle ? » sont en serif → à passer en chubby).
- Le **logo « WADA 和田 »** : même police chubby aussi (ou, si vous tenez au serif du logo, c'est la
  **seule** exception — à confirmer, mais par défaut : chubby partout).
- Le **texte courant** (paragraphes, labels, prix) reste dans **un seul** sans lisible (Inter). La
  chubby ne sert qu'aux titres.

## Pourquoi ça part en vrille aujourd'hui
La police est choisie **dans chaque page/composant** au lieu d'être définie **une seule fois**. Du
coup certaines pages sont en serif, d'autres en chubby → incohérent.

## Comment le faire proprement (une fois pour toutes)
- Définir **un seul style global de titres** (`h1, h2, h3, h4, h5, h6 { font-family: Fredoka; }` dans
  le CSS global / le thème) et l'appliquer partout.
- **Chercher et supprimer** toute déclaration de police **serif** (Fraunces, Georgia, serif…) sur les
  titres dans tout le code → aucune page ne doit pouvoir imposer sa propre police.
- Vérifier les composants partagés (Nav, Footer, PaletteCard, titres de section) : tous héritent de la
  même police de titre.

## Test (à faire page par page)
Accueil, Palettes, Scanner, Styliste, Favoris, Tenue, Palette détail, Cultures, Découverte, Tarifs,
À propos, FAQ, Contact, Mentions, CGV, Confidentialité, Install :
- [ ] **Le titre de chaque page est dans la MÊME police (chubby)** — zéro serif.
- [ ] Le texte courant est partout le même sans.
- [ ] Le logo est identique partout.

But : un client qui navigue ne doit JAMAIS voir deux polices de titre différentes selon la page.
