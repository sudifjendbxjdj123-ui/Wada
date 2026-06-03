# WADA — Brief codeur unique (tout regroupé, par priorité)

Point d'entrée unique. Objectif : passer le site de « fonctionnel » à « prêt pour les clients »
(de ~68/100 à 80+). Chaque bloc renvoie à une fiche détaillée déjà présente dans le dossier `hero`.
Faites dans l'ordre P0 → P1 → P2.

✅ Déjà fait (ne pas défaire) : MUJI shoppable (flux Awin live), visuel généré IA retiré de la page
tenue, cartes agrandies, bande de réassurance, page d'accueil beige rétablie, favicon, pages légales.

---

## 🔴 P0 — Bloquants (le cœur du produit + la confiance)

### 1. Moteur de tenues  → détail : `WADA-tenue-MASTER.md`
- **Genre** : filtrer strictement (Homme → homme/unisexe ; aucune jupe/pièce femme dans une tenue homme).
  Passer `genre` à `/api/products` sur TOUS les slots (le champ `Men's/Women's` du flux est ignoré aujourd'hui).
- **Photos nettes** : mirrorer `merchant_image_url` (~1280 px) vers le Blob, pas la vignette 200 px (floue).
- **Cohérence type/registre** : chaussures = vraies chaussures (pas sandales/pantoufles en tailoring) ;
  accent = ceinture/foulard (pas sac de sport).
- **Variété** : une teinte de la palette par slot + tirage déterministe (palette+slot+style) → des
  palettes différentes donnent des tenues différentes (aujourd'hui toujours les mêmes produits).
- **Cartes** : ratio 4/5 uniforme, image edge-to-edge, nom 2 lignes, grille propre (CSS dans la fiche).

### 2. Plus d'une marque
- Intégrer 2-3 flux Awin en plus de MUJI au fur et à mesure des acceptations (Sézane, Guess, Lacoste…)
  via la fiche `WADA-integration-flux-MUJI.md` (même pipeline). Repli Amazon propre sinon.

### 3. Confiance
- Retirer les **faux témoignages** (/tarifs).
- **Devise unique** : CGV en CHF vs Tarifs en € → aligner sur la devise réelle des prix Stripe.
- Vérifier que PANTONE® est retiré partout (déjà fait sur les pages palette ; vérifier /about).

---

## 🟠 P1 — Importants (SEO, navigation, mobile)  → détail : `WADA-bugs-retour-et-layout.md`

### 4. Layout + SEO (gros impact)
- **11 pages restées sur l'ancien gabarit** (atelier, scanner, cultures, tarifs, favoris, decouverte,
  calendrier, stylist, compte, panier, palettes) → les rebrancher sur le `<Nav/>` + `<Footer/>` GLOBAUX.
- **Canonical + og:url par page en www** sur ces pages (actuellement `https://wada.style` = faux),
  theme-color unique `#F4EFE7`.
- **Sitemap** : inclure les 348 URLs `/palette/[n]` (la grille est rendue côté client → invisible pour Google).
- Données structurées `Product` + vraie image OG + demander un re-crawl Google (logo).

### 5. Boutons retour & header
- « ← Retour » sur toutes les pages hors accueil, même position/style (manque : /scanner, /ma-tenue,
  /mentions, /cgv, /confidentialite, /contact, /partenaires). Régression à surveiller lors de la migration.
- Header : remplacer le bouton **« Commencer »** par **« Abonnement »** → `/tarifs`.
- Hero accueil : retirer le sous-titre peu lisible (« Un dictionnaire de 348 accords… »).

### 6. Vocabulaire & contenu
- Unifier « palettes » vs « tenues » et « WADA+ » → « WADA Premium » (côté client).
- /calendrier : corriger la date « Aujourd'hui » (figée au 20 mai).

### 7. Mobile & perf
- Tester sur vrai téléphone (header, footer, grilles, cartes, tap targets ≥ 44 px).
- Images lazy + cache, vidéos de fond légères (poster). Viser LCP < 2,5 s.

---

## 🟢 P2 — Après (amélioration continue)  → détail : `WADA-MASTER-ameliorations.md`
- Assistant IA peaufiné (2 modes : pièce existante / tenue complète) — fiche `wada-assistant-system-prompt.md`.
- Newsletter « lettre du dimanche » (capture douce, pas de pop-up agressif).
- États vides/chargement/erreur soignés partout.
- Mesure d'audience respectueuse de la vie privée.

---

## À vérifier que ça marche (tests bout en bout)
- [ ] Scanner : couleur photographiée → teinte détectée → bonne palette.
- [ ] Abonnement Stripe : souscrire ET résilier.
- [ ] Bouton « Acheter » → lien MUJI tracké (commission attribuée).
- [ ] Homme → 100 % pièces homme/unisexe.
- [ ] 3-4 palettes différentes → tenues visiblement différentes.

## Fiches détaillées (dossier hero)
- `WADA-tenue-MASTER.md` — moteur de tenues (P0-1) **← le plus important**
- `WADA-integration-flux-MUJI.md` — brancher un flux marchand (P0-2)
- `WADA-bugs-retour-et-layout.md` — SEO, layout, boutons retour (P1)
- `WADA-MASTER-ameliorations.md` — excellence/confiance (P0-3 + P2)
- `WADA-checklist-lancement.md` — pilotage global à cocher
- `WADA-Awin-suivi-marques.xlsx` — marques affiliées (côté business, pas codeur)

**Ordre conseillé : 1 (tenue) → 3 (confiance) → 4 (SEO) → 2 (marques au fil des acceptations) → 5/6/7 → P2.**
