# WADA — Rendre le site parfait pour les clients (plan d'excellence)

Le site fonctionne (pages en place, photos MUJI shoppables, paiement Stripe). Ce document vise le
cran au-dessus : **clarté, confiance, fluidité d'achat, finition**. Classé par priorité.
(Complémentaire de `WADA-erreurs-site.md` — bugs — et `WADA-tenue-rendu-MUJI.md` — qualité des tenues.)

---

## P0 — Confiance (à régler en priorité : sans ça, un client hésite à acheter)

1. **Retirer les faux témoignages** (/tarifs). De faux avis nominatifs = perte de confiance + risque
   légal. Soit de vrais avis (avec accord), soit on remplace par des éléments factuels :
   « Inspiré de Sanzo Wada (1933) », « 348 palettes », « Sans inscription ».
2. **PANTONE®** (/about) : retirer la marque ® et les codes s'ils ne sont pas officiels. Garder le
   nom de la teinte + la pastille suffit et reste élégant.
3. **Chiffres vérifiables uniquement** : « 80+ boutiques » → garder si vrai, sinon « une sélection de
   boutiques ». Pas de métrique inventée.
4. **Divulgation d'affiliation visible** (déjà dans le footer ✅) — la garder claire sur les pages
   tenue/produit aussi.
5. **Réassurance d'achat** : sur la page tenue et le panier, afficher en clair « Paiement sécurisé
   Stripe », « Achat directement chez le marchand », « Prix identique pour vous ». Lien Mentions
   légales / CGV / Confidentialité accessibles (déjà présents).
6. **Pages légales complètes** : CGV, Mentions, Confidentialité, Contact — vérifier qu'elles ne sont
   pas vides et qu'elles ont un vrai contenu (un client sérieux les regarde).

---

## P1 — Parcours & clarté (l'expérience qui fait revenir)

7. **Hero d'accueil = une promesse + une action claire.** Un seul bouton principal (« Scanner une
   couleur » ou « Entrer dans l'atelier »), le secondaire en retrait. Le visiteur doit comprendre en
   5 secondes : *je pars d'une couleur → j'obtiens une tenue à acheter.*
8. **Le parcours-or sans friction** : Scanner/Palette → Tenue → Achat. Limiter les clics, garder le
   fil visible (fil d'Ariane léger). « Composer une tenue » ouvre bien la **grille des palettes**
   (pas l'upload photo — ça, c'est le Scanner).
9. **Page tenue = la vitrine** : appliquer `WADA-tenue-rendu-MUJI.md` (pièces cohérentes en type +
   registre + genre, photos lisibles). Ajouter : « Pourquoi ça marche » (1 phrase couleur), et les
   **4 niveaux de budget** (seconde main → luxe) déjà décrits dans /about, rendus cliquables.
10. **Vocabulaire unifié** partout : « palettes » vs « tenues », « WADA Premium » vs « WADA+ ».
    Choisir et appliquer (cf. bug list).
11. **États vides / chargement / erreur** soignés : Scanner sans photo = état vide explicite ;
    grille en cours de chargement = squelettes ; tenue sans produit MUJI = repli propre (pas un trou).
12. **Recherche / filtres palettes** : pouvoir filtrer les 348 palettes (clair/sombre, chaud/froid,
    occasion), avec pagination fluide. C'est le cœur du produit — il doit être agréable à explorer.

---

## P2 — Personnalisation & rétention (ce qui crée l'habitude)

13. **Profil qui sert vraiment** : genre, budget, style. Il doit **filtrer** les tenues et les
    produits (genre cohérent, budget respecté). Aujourd'hui le genre se mélange — le profil corrige ça.
14. **Assistant IA (les 2 modes)** : « j'ai déjà une pièce » et « compose-moi une tenue complète »,
    avec questions guidées + « pourquoi ça marche » + ajustements. (Maquette : `wada-assistant-conversation.html`.)
15. **Mon dressing / favoris** : une seule route (cf. bug `/garde-robe` vs `/favoris`), sauvegarde des
    tenues, reprise facile. C'est le moteur de retour.
16. **Newsletter « la lettre du dimanche »** : capture d'email discrète (pas de pop-up agressif),
    une palette + une tenue par semaine. Rétention douce, cohérente avec le ton.
17. **Calendrier de tenues** (Premium) : un petit plus qui justifie l'abonnement.

---

## P3 — Performance, mobile, accessibilité (la finition pro)

18. **Vitesse** : images MUJI servies depuis le cache WADA (déjà prévu) + `loading="lazy"` ;
    compresser/limiter les vidéos de fond (poster systématique, pas d'autoplay lourd sur mobile).
    Viser un bon score Lighthouse (LCP < 2,5 s).
19. **Mobile d'abord** : header simple, footer compact/accordéon, cibles tactiles ≥ 44 px, grilles à
    2 colonnes, pas de débordement horizontal. Tester sur un vrai téléphone.
20. **Accessibilité** : contraste texte/fond suffisant (surtout texte clair sur photo → garder le
    voile), `alt` sur toutes les images (= nom produit), focus visible au clavier, titres hiérarchisés.
21. **Cohérence visuelle** : un seul système de police (titres ronds + serif d'accent), un seul accent
    de couleur, espacements et cartes homogènes sur toutes les pages. Pas de page qui « dépareille ».

---

## P4 — Visibilité (être trouvé et bien partagé)

22. **SEO par page** : titres + descriptions + canonicals propres et **par page** (en www) — déjà
    corrigé sur plusieurs pages, vérifier les autres. Sitemap + robots OK.
23. **Données structurées** : Schema.org `Product` sur les pièces (nom, prix, image, dispo) et
    `WebSite`/`Organization` sur l'accueil → meilleurs résultats Google.
24. **Aperçu de partage** : image OG dédiée (pas seulement un SVG) pour que les liens WADA soient
    beaux sur les réseaux/messageries.
25. **Logo dans Google** : forcer le re-crawl (Search Console) pour que le globe laisse place au logo WADA.

---

## Ordre conseillé (impact / effort)

1. P0 entier (confiance) — rapide, fort impact.
2. #9 page tenue + #13 genre/profil (cœur produit).
3. #7–#8 clarté du parcours + #10 vocabulaire.
4. #18–#19 perf + mobile.
5. Le reste au fil de l'eau.

But final : un visiteur arrive, comprend en 5 s, explore une palette avec plaisir, obtient une tenue
cohérente et belle, voit de vraies pièces achetables à son budget, et a **confiance** pour cliquer
« Acheter ». C'est ça, « parfait pour les clients ».
