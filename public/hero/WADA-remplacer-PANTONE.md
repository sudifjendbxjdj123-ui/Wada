# WADA — Remplacer « PANTONE® » par le format WADA (pour le codeur)

But : supprimer **tous** les libellés « PANTONE® … TCX » du site et afficher partout le **format WADA**
déjà en place sur les pages /palette/[n].

---

## Le problème
Plusieurs endroits affichent encore les couleurs sous forme **« PANTONE® 08-4572 TCX · Dune »** :
- **Résultats du Scanner** (cartes de palettes accordées)
- la **grille /palettes**
- **/cultures** et **/decouverte**
- la page **/about** (chapitre « Une palette devient une tenue », « PANTONE® 18-5017 TCX »…)

Or, sur les pages **/palette/[n]**, ce format a déjà été renommé en **« WADA … »**
(ex. constaté en live sur /palette/042 :
`WADA 212-0184-1853 · Or pâle · #D4B888`).

→ Il existe donc **deux composants de carte** : un à jour (WADA) et un ancien (PANTONE). Il faut
unifier.

---

## La correction
1. **Un seul composant de carte palette** dans tout le projet (ex. `<PaletteCard>`), réutilisé par :
   page palette, résultats Scanner, grille, Cultures, Découverte.
2. Ce composant affiche le **format WADA** pour chaque teinte :
   - `WADA <code>` (le même code généré que sur /palette/[n])
   - le **nom** de la couleur (Or pâle, Crème, Bleu montagne…)
   - le **hex** (#D4B888…)
   - **plus aucune** mention « PANTONE® » ni « TCX ».
3. Faire une **recherche globale** dans le code des chaînes `PANTONE`, `TCX`, `®` → supprimer/remplacer
   partout (composants, pages, données, /about).
4. Vérifier qu'aucune **donnée** (JSON/CSV des palettes) ne stocke « PANTONE » comme label affiché.

---

## Pourquoi c'est important
- **Cohérence** : aujourd'hui une même palette s'affiche différemment selon la page (PANTONE vs WADA).
- **Marque** : « PANTONE® » est une marque déposée, et les codes affichés (ex. « 07-1958 TCX ») ne
  sont pas des références Pantone réelles → utiliser un **code maison « WADA »** évite tout problème
  de marque et reste cohérent avec votre identité.

---

## Test
- [ ] Rechercher « PANTONE » dans tout le code → 0 résultat affiché côté client.
- [ ] Scanner une couleur → les cartes de résultats montrent le format **WADA** (comme /palette/[n]).
- [ ] /palettes, /cultures, /decouverte, /about → format WADA partout, identique.
