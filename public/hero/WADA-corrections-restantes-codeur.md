# WADA — Corrections restantes (vérifié en live, 24/05) — pour le codeur

Punch-list à jour après vérification du site en ligne. ✅ = constaté fait · ❌ = encore à faire.

> ⚠️ Constat clé : les corrections sont appliquées **page par page**, pas au niveau des composants
> globaux → ça crée des incohérences. **Corriger au niveau du `<Nav/>`, `<Footer/>`, du `<head>`
> (canonical) et de la devise — une fois, globalement — pas page par page.**

---

## ✅ Déjà fait (ne pas refaire)
- FAQ : « WADA Premium » (vocabulaire unifié sur cette page).
- Image OG réelle (`/opengraph-image`) au moins sur FAQ / pages palette.
- Lien Pinterest + balise de vérification de domaine Pinterest ajoutés.
- Bouton « ← Retour » présent sur /scanner.
- Page d'accueil beige rétablie ; MUJI shoppable.

---

## ❌ À CORRIGER — par ordre de priorité

### 1. 🔴 Navigation — il y a TROIS menus en ligne en même temps
- Accueil : « Palettes · Scanner · À propos · Commencer »
- Tarifs, Scanner, Atelier, Cultures… : « Qui sommes-nous · Atelier · ☰ »
- FAQ, Découverte : « Palettes · Scanner · Styliste · Favoris » + barre d'onglets en bas
→ **Forcer TOUTES les pages sur UN SEUL `<Nav/>` global + UN SEUL `<Footer/>` global.** Idem la
barre d'onglets mobile (partout ou nulle part).
→ **Bug** : le lien compte affiche le texte brut **« /compte »** (FAQ, Découverte) → « Compte ».

### 2. 🔴 Canonical par page (en www) — toujours cassé sur le gabarit B
- /tarifs, /scanner, /atelier, /cultures, /favoris, /decouverte, /calendrier, /stylist, /compte,
  /panier, /palettes → `canonical = https://wada.style` (sans www + racine).
→ **canonical + og:url par page en www** ; theme-color unique **#F4EFE7**. (À gérer dans le layout, globalement.)

### 3. 🔴 Devise unique — incohérence confirmée
- Tarifs **et** FAQ affichent **€** (1,99 € / 17,99 €) ; les **CGV affichent CHF**.
→ Choisir **une seule devise** (recommandé : € côté client = ce que voient les utilisateurs) et
**aligner CGV + Stripe** dessus. Une seule source de vérité pour le prix.

### 3 bis. 🟠 PANTONE® encore affiché (composant carte non unifié)
- Les cartes de palette sur les **résultats du Scanner** (et la grille /palettes, /cultures,
  /decouverte) affichent encore **« PANTONE® … TCX »** (ex. « PANTONE® 08-4572 TCX · Dune »).
  Sur /palette/[n], c'est déjà renommé « WADA … ».
→ **Un seul composant de carte palette** partout, au format renommé (WADA). Plus aucun « PANTONE® »
  sur le site. (Bonus : sur cette capture, mauvais rattachement culture — « Budapest en neige » tagué
  MAROCAINE, « Hanoï » tagué ITALIENNE → revoir le mapping culture comme dans `WADA-erreurs-site.md`.)

### 3 ter. 🔴 Mode Scanner « Un vêtement » — pas de photos + chaussure incohérente
Sur le flux « Un vêtement » (scanner sa pièce → composer autour), constaté :
- **Pas de photos** : les pièces composées s'affichent en **aplats de couleur + « VOIR DES PIÈCES → »**
  (recherche), pas de vrais produits. → **Brancher ce flux sur le même moteur que /ma-tenue**
  (`/api/products`) pour afficher de **vraies pièces MUJI avec photos**. La pièce scannée
  (« Votre pièce · À vous ») reste sans photo (c'est celle de l'utilisateur).
- **Logique chaussure/pièce incohérente** : le scan ne détecte que la **couleur**, pas le **type/usage**.
  WADA peut composer une tenue tailoring autour de **chaussures de running** → non-sens. Correction :
  après le scan, **demander à l'utilisateur le type + le style de sa pièce**
  (ex. « Vos chaussures : ville / sneakers / running / bottes ? ») et **adapter le registre** de la
  tenue en conséquence (running → casual sport, derby → habillé…). Idem pour un « pull » (fin vs hoodie).
  → Le résultat doit être cohérent avec la **vraie** pièce, pas seulement sa couleur.

### 4. 🟠 Page Tarifs — contenu
- **Retirer les faux témoignages** (« Sophie Vidal, Architecte, Bordeaux » ; « Antoine Roux,
  Photographe, Paris »).
- **Traduire l'anglais** : « AI Stylist personnalisé » → « Styliste IA personnalisé » ;
  « Closet Import » → « Import de garde-robe ».
- Corriger le **double espace** : « Simple, transparent,  annulable. »

### 5. 🟠 Accueil
- Retirer le **sous-titre du hero** (« Un dictionnaire de 348 accords chromatiques… »).
- Bouton **« Commencer » → « Abonnement »** (→ /tarifs).
- Double espace : « Trouvez la couleur.  Trouvez votre style. »

### 6. 🟠 Moteur de tenues (à valider sur écran — rendu client)  → `WADA-tenue-MASTER.md`
- Genre strict (homme → aucune pièce femme/jupe), photos nettes (`merchant_image_url` ~1280 px),
  cohérence type/registre, variété (teinte de palette par slot + tirage seedé), cartes uniformes.

### 7. 🟠 Divers
- Boutons « ← Retour » manquants : /ma-tenue, /mentions, /cgv, /confidentialite, /contact, /partenaires.
- /calendrier : date « Aujourd'hui » figée (20 mai) → date réelle.
- Scanner : « Couleur détectée #5C2018 » par défaut → état vide.
- Sitemap : inclure les 348 `/palette/[n]`.
- Footer : afficher l'icône Pinterest proprement (pas l'URL brute) ; harmoniser les liens entre pages.

### 8. 🟡 Finition  → `WADA-finition-details.md` & `WADA-mobile-corrections.md`
- 404 dédiée, squelettes de chargement, états vides/erreur, accessibilité (alt/focus/aria/h1).
- Mobile : footer accordéon, hero poster (pas de vidéo autoplay), /cultures accordéon, /palettes paginée,
  /ma-tenue 1 colonne, tap targets ≥ 44 px, champs ≥ 16px, aucune scroll horizontale.

---

## Le réflexe à garder
Beaucoup de ces bugs (3 menus, canonical, devise, footer) viennent du fait qu'ils sont traités
**page par page**. Les régler **dans les composants/layout partagés** les corrige partout d'un coup
et évite que de nouvelles pages réintroduisent l'incohérence.
