# WADA — Tout ce que le codeur peut coder MAINTENANT

Liste filtrée : uniquement les tâches **réalisables tout de suite**, sans dépendre d'une action
business (acceptation de marque, Stripe live, compte réseau social…). Classé par priorité.
Les détails CSS/logique sont dans les fiches citées. La liste « dépend de vous » est à la fin.

---

## 🔴 P0 — Le cœur du produit

### 1. Moteur de tenues  → `WADA-tenue-MASTER.md`
- **Genre strict** : passer `genre` à `/api/products` sur TOUS les slots ; Homme → homme/unisexe
  uniquement (aucune jupe/pièce femme). Utiliser le champ `Men's/Women's` du flux.
- **Photos nettes** : mirrorer `merchant_image_url` (~1280 px) vers le Blob (pas la vignette 200 px).
- **Cohérence type/registre** : chaussures = vraies chaussures (exclure sandales/pantoufles en
  tailoring) ; accent = ceinture/foulard (pas sac de sport) ; filtrer par mots-clés du `product_name`.
- **Variété** : une teinte de la palette par slot + tirage déterministe (palette+slot+style) ;
  pas de doublon entre slots.
- **Cartes** : ratio 4/5 uniforme, image edge-to-edge, nom 2 lignes, grille propre (CSS fourni).

---

## 🟠 P1 — SEO, navigation, accueil  → `WADA-bugs-retour-et-layout.md`

### 2. SEO / layout
- **Canonical + og:url par page, en www** sur les 11 pages « gabarit B » (atelier, scanner, cultures,
  tarifs, favoris, decouverte, calendrier, stylist, compte, panier, palettes). theme-color unique `#F4EFE7`.
- **Unifier les 3 menus** en un seul `<Nav/>` global + un seul `<Footer/>` global, sur toutes les pages.
  Barre d'onglets mobile : partout ou nulle part.
- **Bug** : lien compte affiché « /compte » (sur /decouverte) → « Compte ».
- **Sitemap** : inclure les 348 URLs `/palette/[n]`.
- Données structurées `Product` (nom, prix, image, dispo) + vraie image OG (pas un SVG).

### 3. Accueil
- Retirer le sous-titre du hero (« Un dictionnaire de 348 accords chromatiques… »).
- Remplacer le bouton **« Commencer »** par **« Abonnement »** (→ /tarifs).
- Corriger le double espace : « Trouvez la couleur.  Trouvez votre style. »

### 4. Boutons retour
- « ← Retour » présent et homogène sur toutes les pages hors accueil (manque /ma-tenue, /mentions,
  /cgv, /confidentialite, /contact, /partenaires) — ne pas le perdre lors de l'unification du Nav.

### 5. Vocabulaire
- « palettes » vs « tenues » : un seul libellé. « WADA+ » → « WADA Premium » côté client.
- /calendrier : corriger la date « Aujourd'hui » (figée — la lier à la date réelle).

---

## 🟠 P1 — Finition  → `WADA-finition-details.md`
- **Page 404** dédiée (jolie, avec retour accueil + voir palettes).
- **Squelettes de chargement** sur les pages client-rendered (/ma-tenue, /palettes, /stylist, /panier, /compte).
- **États vides/erreur** avec action (favoris vide, panier vide, recherche sans résultat).
- **Accessibilité** : `alt` partout, focus clavier visible, `aria-label` sur icônes (☰, panier, ◎▦✦○),
  un seul `<h1>` par page, cibles tactiles ≥ 44 px.
- **Micro-interactions** : hover doux, transitions, réserver l'espace image (aspect-ratio) pour éviter
  les sauts de layout.
- **Perf** : images lazy + cache, vidéos de fond avec poster (pas d'autoplay lourd mobile).

---

## 🟢 P2 — Préparation (codable maintenant, activable ensuite)

### 6. Newsletter — backend réel (aujourd'hui les emails ne sont stockés qu'en local)
- Construire l'**endpoint d'inscription** + **stockage serveur** des abonnés (KV/DB) + flux
  **double opt-in** (email de confirmation, désinscription en 1 clic).
- Brancher l'envoi sur un **ESP via API** (Resend recommandé). → le codeur prépare l'intégration ;
  il lui faudra juste la **clé API** (env var) que vous fournirez (voir « dépend de vous »).

### 7. Analytics respectueuse
- Ajouter **Vercel Web Analytics** (un toggle) ou **Plausible** (sans cookies, conforme à la promesse
  « pas de tracking publicitaire »). Codable tout de suite.

### 8. Réseaux sociaux (structure)
- Ajouter les **emplacements d'icônes sociales** dans le footer (Pinterest, Instagram), liens à
  remplir quand les comptes existeront. Peut être préparé maintenant (liens en attente).

### 9. Confiance
- Retirer les **faux témoignages** (/tarifs).
- Vérifier que PANTONE® est retiré partout (déjà fait sur les pages palette).
- Rendre la **devise cohérente** dans le code (Tarifs/CGV) — la valeur finale (CHF ou €) dépend de la
  config Stripe que vous fixerez (voir « dépend de vous »).

---

## ⛔ NE dépend PAS du codeur (à vous de fournir / décider)
- **URLs de flux** des nouvelles marques (après acceptation Awin) → vous les donnez, il intègre.
- **Clé API de l'ESP** (Resend/Brevo) pour activer l'envoi de la newsletter.
- **Stripe en mode LIVE** + choix de la **devise** (CHF ou €) → décision + config compte.
- **Comptes réseaux sociaux** (Pinterest/Instagram) → vous les créez, il met les liens.
- **Google Search Console** (soumission sitemap, re-crawl) → côté vous.

---

## Ordre conseillé pour le codeur
1 (tenue) → 2 (SEO/layout) → 3 (accueil) → 4 (retour) → 5 (vocabulaire) → finition → 6/7/8/9 (préparation).
