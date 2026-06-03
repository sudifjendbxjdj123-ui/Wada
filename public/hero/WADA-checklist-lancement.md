# WADA — Checklist de lancement

État : le site est en ligne et fonctionnel. Cette checklist liste ce qui reste avant qu'il soit
« vraiment prêt pour les clients ». À cocher au fur et à mesure. Classé : 🔴 bloquant · 🟠 important ·
🟢 après lancement.

---

## 🔴 Bloquants (à faire avant de pousser aux clients)

### A. Moteur de tenues — le cœur du produit  → fichier `WADA-tenue-MASTER.md`
- [ ] **Genre respecté** : Homme → 100 % homme/unisexe (aucune jupe/robe/pièce femme).
- [ ] **Photos nettes** : mirrorer `merchant_image_url` (~1280 px), plus la vignette 200 px floue.
- [ ] **Cohérence type/registre** : chaussures = vraies chaussures (pas sandales/pantoufles en
      tailoring) ; accent = ceinture/foulard (pas sac de sport).
- [ ] **Variété** : une teinte de palette par slot + tirage seedé → des palettes différentes donnent
      des tenues différentes.
- [ ] **Cartes propres** : ratio 4/5 uniforme, image edge-to-edge, nom 2 lignes, grille soignée.

### B. Assez de vrais produits
- [ ] Au moins **2-3 marques avec flux** en plus de MUJI (Sézane, Guess, Lacoste… une fois acceptées
      sur Awin) → intégrer chaque flux comme MUJI (fiche `WADA-integration-flux-MUJI.md`).
- [ ] Repli Amazon propre quand aucune pièce marchande ne matche.

### C. Vérifier que les fonctions marchent vraiment (bout en bout)
- [ ] **Scanner** : photographier/déposer une couleur → détecte la teinte → propose la bonne palette.
- [ ] **Abonnement Stripe** : souscrire ET résilier fonctionnent (test réel).
- [ ] **Bouton « Acheter »** : ouvre bien le lien MUJI tracké (commission attribuée).

---

## 🟠 Importants (juste avant ou juste après le lancement)

### D. SEO / visibilité  → fichier `WADA-bugs-retour-et-layout.md`
- [ ] Rebrancher les 11 pages « gabarit B » sur le Nav/Footer globaux + **canonical par page en www**
      (atelier, scanner, cultures, tarifs, favoris, decouverte, calendrier, stylist, compte, panier, palettes).
- [ ] **Sitemap** : inclure les 348 URLs `/palette/[n]` (grille rendue côté client).
- [ ] Données structurées Product + vraie image de partage (OG) + re-crawl Google (logo).

### E. Confiance
- [ ] Retirer les **faux témoignages** (/tarifs).
- [ ] **Devise unique** : CGV en CHF vs Tarifs en € → aligner sur la devise réelle des prix Stripe.
- [ ] PANTONE® douteux retiré (déjà fait sur les pages palette — vérifier /about).

### F. Boutons retour & finitions
- [ ] « ← Retour » présent et cohérent sur toutes les pages hors accueil (manque /scanner, /ma-tenue,
      /mentions, /cgv, /confidentialite, /contact, /partenaires).
- [ ] Header : bouton « Commencer » remplacé par **« Abonnement »** (→ /tarifs).
- [ ] Hero accueil : retirer le sous-titre peu lisible.

### G. Mobile & perf
- [ ] Tout tester sur un **vrai téléphone** (header, footer, grilles, cartes, tap targets ≥ 44 px).
- [ ] Images lazy + cache, vidéos de fond légères (poster). Viser LCP < 2,5 s.

---

## 🟢 Après le lancement (amélioration continue)

- [ ] Assistant IA peaufiné (2 modes : pièce existante / tenue complète).
- [ ] Calendrier : corriger la date « Aujourd'hui ».
- [ ] Newsletter « lettre du dimanche » (capture douce).
- [ ] Plus de marques Awin (tableau `WADA-Awin-suivi-marques.xlsx`).
- [ ] Mesure d'audience respectueuse de la vie privée (pour savoir ce qui marche).
- [ ] Vocabulaire unifié (palettes/tenues, WADA Premium).

---

## En résumé
Le site **fonctionne** déjà. Pour qu'il soit **« prêt clients »**, deux choses comptent avant tout :
**(1) la tenue générée doit être juste, nette et cohérente**, et **(2) il faut plus d'une marque**.
Réglez A + B, validez C, puis D-E-F-G, et vous êtes prêt à pousser WADA pour de vrai.
