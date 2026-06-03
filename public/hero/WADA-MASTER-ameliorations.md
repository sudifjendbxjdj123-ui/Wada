# WADA — Fichier maître d'améliorations (pour le codeur)

Objectif : faire passer le site de ~68/100 à **80+/100**, niveau « prêt à pousser aux clients ».
Ce fichier est **autonome** : il contient tout, dans l'ordre de priorité, avec les décisions
déjà tranchées (le codeur n'attend rien de Nem). Chaque point a une action concrète.

> Décisions éditoriales déjà prises (appliquer telles quelles) :
> 1. Faux témoignages → **retirer**.
> 2. PANTONE® → **retirer la mention ® et les codes** (garder nom + pastille).
> 3. « 80+ boutiques » → **« une sélection de boutiques »**.
> 4. `/garde-robe` et `/favoris` → **fusionner sur `/favoris`** (« Mon dressing »), rediriger l'autre.
> 5. Underwear / Nightwear → **rester exclus** de l'affichage public.

---

## P0 — Confiance (rapide, fort impact sur la conversion)

1. **Page /tarifs — retirer les témoignages inventés** (Sophie Vidal, Antoine Roux…). Remplacer par
   des éléments factuels et vrais : « Inspiré de Sanzo Wada (1933) », « 348 palettes », « Sans
   inscription », « Liens transparents ». Pas de noms/avis fabriqués.
2. **Page /about — PANTONE®** : retirer la marque ® et les codes TCX (souvent inexacts). Garder
   uniquement le **nom de la teinte + la pastille de couleur**.
3. **Chiffres vrais uniquement** : remplacer « 80+ boutiques curées » par « une sélection de
   boutiques » (sauf si le chiffre est réellement vérifiable).
4. **Réassurance d'achat** (pages tenue, produit, panier) : afficher « Paiement sécurisé (Stripe) »,
   « Achat directement chez le marchand », « Même prix pour vous ». Garder la divulgation
   d'affiliation (déjà dans le footer).
5. **Pages légales** : vérifier que CGV, Mentions légales, Confidentialité, Contact ont un vrai
   contenu (pas de page vide).

---

## P1 — Page Tenue : la vitrine (le plus gros gain visuel)

6. **Retirer le visuel généré par IA en haut** (le grand flat-lay + son appel de génération). Il fait
   doublon avec les vraies pièces et n'est plus cohérent. **Garder** : titre de la palette, ligne de
   teintes, « Direction artistique » + attributs (Registre/Coupe/Matières/Réf). Option : une fine
   bande de pastilles couleur à la place.
7. **Mettre les vraies photos MUJI en vedette** : agrandir fortement les cartes (image **4/5 ou 1/1**),
   **fond de carte clair uniforme** (`#FBF9F5`) + `object-fit: contain` + padding (produits lisibles
   même sur fond sombre). Grille **2 colonnes desktop / 1 mobile**. Hiérarchie : photo → rôle·couleur
   → nom (2 lignes max) → MUJI → prix → « Acheter sur MUJI ».
8. **Cohérence des pièces** — ajouter 3 filtres AVANT le tri par couleur (ΔE en dernier) :
   - **Type** : un Haut = un haut (pas une robe) ; Chaussures = vraies chaussures (exclure
     pantoufles / mules / sandales d'intérieur hors registre détente) ; Accent = ceinture/foulard/
     petite maroquinerie (pas un sac de sport).
   - **Registre** : Classique/Tailoring/Old money → exclure survêtement, jogging, pantoufles, sweat,
     sac de sport, pyjama. Décontracté → casual autorisé.
   - **Genre** : toute la tenue dans le même genre (ou unisexe) — passer `genre` à `/api/products`
     pour **tous** les slots. (Aujourd'hui on mélange pièces femme et homme.)
9. **Photos lisibles** : écarter les vignettes trop sombres (préférer `large_image` / autre vue /
   autre variante couleur proche). Cadrage homogène.

---

## P2 — Clarté & cohérence (parcours et vocabulaire)

10. **Vocabulaire unifié partout** :
    - « palettes » **ou** « tenues » pour le lien `/palettes` (choisir un seul libellé).
    - « WADA Premium » partout côté client (garder « WADA+ » seulement comme SKU technique interne).
11. **Hero d'accueil = une action principale claire** : un bouton primaire fort (« Entrer dans
    l'atelier » ou « Scanner une couleur »), le secondaire en retrait. Promesse lisible en 5 s.
12. **Parcours-or fluide** : Scanner/Palette → Tenue → Achat, fil d'Ariane léger. « Composer une
    tenue » ouvre la **grille des palettes** (l'upload photo, c'est le Scanner — ne pas confondre).
13. **Fusionner dressing/favoris** sur `/favoris` (« Mon dressing »), rediriger `/garde-robe`.
14. **États vides / chargement / erreur** soignés : Scanner sans photo = état vide explicite ; grilles
    = squelettes au chargement ; tenue sans produit MUJI = repli propre (pas de trou).

---

## P3 — Performance, mobile, accessibilité

15. **Vitesse** : images MUJI servies depuis le cache WADA + `loading="lazy"` ; vidéos de fond avec
    poster, pas d'autoplay lourd sur mobile. Viser LCP < 2,5 s (Lighthouse).
16. **Mobile d'abord** : header simple, footer compact/accordéon, cibles tactiles ≥ 44 px, grilles
    2 colonnes, aucun débordement horizontal. Tester sur un vrai téléphone.
17. **Accessibilité** : contraste suffisant (texte clair sur photo → garder le voile), `alt` = nom
    produit sur toutes les images, focus clavier visible, titres hiérarchisés (un seul H1/page).

---

## P4 — Visibilité (SEO & partage)

18. **SEO par page** : titres + descriptions + `canonical` **par page** en www (vérifier que toutes
    les pages suivent, pas seulement quelques-unes). Sitemap + robots OK.
19. **Données structurées** : Schema.org `Product` sur les pièces (nom, prix, image, dispo),
    `WebSite`/`Organization` sur l'accueil.
20. **Image de partage** : vraie image OG (pas seulement un SVG) pour de beaux liens sur réseaux/
    messageries.
21. **Logo Google** : demander un re-crawl (Search Console) pour remplacer le globe par le logo WADA.

---

## Checklist finale

- [ ] P0 confiance appliqué (témoignages, PANTONE, chiffres, réassurance, pages légales)
- [ ] Page tenue : visuel généré retiré, vraies photos agrandies et en avant
- [ ] Tenue cohérente : filtres type + registre + genre avant couleur ; photos lisibles
- [ ] Vocabulaire unifié (palettes/tenues, WADA Premium)
- [ ] Dressing/favoris fusionnés
- [ ] Mobile + perf validés sur téléphone
- [ ] SEO par page + Product schema + OG image + re-crawl Google

Cible après cette passe : **~80-82/100** — site pro, cohérent, et donnant confiance pour acheter.
