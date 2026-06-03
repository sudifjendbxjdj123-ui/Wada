# WADA — Bugs : boutons retour manquants + un groupe de pages resté sur l'ancien layout

Audit live du 24/05. Découverte importante : **tout un groupe de pages n'a pas reçu les correctifs**
(menu/footer unifiés + canonical). Détails et corrections ci-dessous.

---

## 1. 🔴 Un groupe de pages est resté sur l'ANCIEN layout + canonical cassé

Le site a **deux gabarits** en ligne en même temps :

- **Gabarit A (corrigé)** — accueil, /about, /faq, /palette/[n] :
  header court (Palettes · Scanner · À propos + Commencer), footer court,
  canonical **par page en www** ✅, theme-color `#F4EFE7`.
- **Gabarit B (PAS corrigé)** — toutes les pages à fond vidéo :
  **/atelier, /scanner, /cultures, /tarifs, /favoris, /decouverte, /panier, /compte, /calendrier, /stylist**
  (au moins). Elles ont encore :
  - l'**ancien menu long** : « Qui sommes-nous · Atelier · ☰ · Abonnement · Créer un compte · Panier »
  - l'**ancien footer long** : « © 2026 Wada · D'après Sanzo Wada » (et libellé « Tenues » au lieu de « Palettes »)
  - **canonical = `https://wada.style`** → NON-www **ET** pointant vers la racine (pas la page) ❌
  - `og:url = https://wada.style`, theme-color `#F4EFE6`

→ La « fusion Nav/Footer unique » et la correction des canonicals **n'ont pas été appliquées à ces
pages**. À faire : **brancher TOUTES ces pages sur le `<Nav/>` et le `<Footer/>` globaux** (gabarit A),
et générer un **canonical par page en www** (`https://www.wada.style/<page>`) + `og:url` idem +
theme-color unique `#F4EFE7`.

C'est le correctif le plus important : il règle d'un coup l'incohérence visuelle ET le SEO de ~10 pages.

---

## 2. 🟠 Boutons « Retour » — incohérents / manquants

État constaté :
- ✅ Présent : /about, /faq, /atelier, /scanner, /cultures, /tarifs, /favoris, /decouverte, /palette/[n].
- ❌ **/ma-tenue** : pas de bouton retour (page rendue côté client, le shell n'en montre pas). Or c'est
  une **page profonde** (on y arrive depuis une palette → « Voir la tenue »). Elle **doit** avoir un
  « ← Retour » qui ramène à la palette d'origine (ou à la grille). **À ajouter.**
- ❌ **/panier** : à vérifier (rendu client, shell vide) — doit avoir un retour vers la page précédente.
- Accueil : pas de retour = normal ✅.

⚠️ **Régression à surveiller** : après la migration des pages vers le layout global, le bouton
« ← Retour » a **disparu de /scanner** (constaté en live). Vérifier qu'il est **préservé sur TOUTES
les pages hors accueil** lors du rebranchement sur le `<Nav/>` global — ne pas le perdre au passage.

Règle à appliquer partout :
- **Toute page autre que l'accueil** a un « ← Retour » à la **même position** (en haut à gauche du
  contenu), même style. Pages à vérifier en priorité : **/scanner**, /ma-tenue, /mentions, /cgv,
  /confidentialite, /contact, /partenaires.
- Idéalement, « Retour » = `history.back()` avec repli vers une page parente logique
  (ex. /ma-tenue → la palette ; /palette/[n] → /palettes ; /scanner → /atelier).

---

## 3. 🟠 Vocabulaire encore incohérent (resté sur certaines pages)

- **/faq** affiche toujours « Qu'est-ce que **WADA+** ? » et « accéder à **WADA+** » → passer à
  **WADA Premium** côté client (cohérent avec /tarifs). Décision déjà actée.
- Footer du gabarit B : lien libellé **« Tenues »** alors que le gabarit A dit **« Palettes »** (même
  route /palettes). Unifier sur un seul libellé une fois le footer global appliqué (point #1).

---

## 4. 🟡 /ma-tenue — meta description périmée

`meta description` = « …photo éditoriale IA… ». Comme on retire le visuel généré (cf.
`WADA-tenue-photos-en-avant.md`), mettre à jour : « Votre tenue complète — 5 pièces réelles, photos,
prix et achat direct chez le marchand. »

---

## 5. 🟡 Pages rendues côté client (à vérifier en SEO)

/ma-tenue et /panier renvoient un shell quasi vide en HTML initial (« On vous prépare ça… »), le
contenu arrive en JS. Acceptable pour des pages personnalisées, mais : s'assurer qu'un **état de
chargement** propre s'affiche (pas une page blanche) et que le **bouton retour** est rendu dès le shell.

---

## Résumé pour le codeur (à coller)

1. **Brancher /atelier, /scanner, /cultures, /tarifs, /favoris, /decouverte, /panier, /compte,
   /calendrier, /stylist sur le `<Nav/>` + `<Footer/>` GLOBAUX** (elles sont restées sur l'ancien
   gabarit long). Vérifier qu'aucune page n'utilise encore l'ancien header/footer.
2. **Canonical + og:url par page en www** sur tout ce groupe (actuellement `https://wada.style` → faux),
   theme-color unique `#F4EFE7`.
3. **Ajouter « ← Retour » sur /ma-tenue** (retour vers la palette) et vérifier /panier ; standardiser
   position + style sur toutes les pages hors accueil.
4. **/faq : « WADA+ » → « WADA Premium »** ; unifier le libellé footer « Tenues » → « Palettes ».
5. **/ma-tenue : meta description** mise à jour (retirer « photo éditoriale IA »).

---

## Complément d'audit (pages /stylist, /mentions)

- ✅ **/mentions** : contenu légal complet et sérieux (éditeur, hébergeur Vercel, Stripe, affiliation
  Awin `2879911` + Amazon `wadastyle-21`, droit suisse). Rien à corriger sur le fond. **Mais** :
  pas de bouton « ← Retour » → l'ajouter (règle de standardisation du point #2).
- 🟠 **/stylist** (l'assistant IA) : canonical cassé (gabarit B, `https://wada.style`), **aucun contenu
  en HTML initial** (page 100 % rendue côté client) et **titre/description génériques**. À corriger :
  rattacher au gabarit A + canonical par page en www + **titre dédié** (« Assistant IA — composez votre
  tenue · WADA ») et description propre. Vérifier qu'un état de chargement s'affiche avant le chat.
- 🟡 **Titres/descriptions dédiés** pour les pages encore génériques (toutes celles du gabarit B
  héritent du titre « WADA — Le dictionnaire des couleurs et de la mode » et de la description par
  défaut). Donner à chaque page un `<title>` + `meta description` spécifiques (Scanner, Atelier,
  Cultures, Favoris, Découverte, Calendrier, Stylist, Panier, Compte, Tarifs).

### Complément — /calendrier
- 🟠 **Date du jour fausse/figée** : la page affiche « Aujourd'hui · mercredi 20 mai » alors que la
  date réelle est plus tard (24 mai). Le « Aujourd'hui » n'est pas synchronisé avec la vraie date du
  jour → corriger pour qu'il pointe toujours sur la date courante (et le bon jour de semaine).
- Gabarit B confirmé (canonical cassé, ancien menu/footer) → même correctif que #1.
- Le calendrier saute certains numéros de palette (278, 281, 285…) : **normal** (numéros non
  séquentiels, on mappe le N-ième accord existant). Pas un bug.

### Complément — /palettes, /compte, /partenaires, /affiliation

- 🔴 **/palettes (LA grille des 348 — page la plus importante pour le SEO)** : canonical cassé
  (`https://wada.style`, gabarit B) **et grille rendue côté client** → les liens des 348 palettes ne
  sont **pas dans le HTML** (le moteur de recherche ne voit pas les cartes). À corriger : canonical
  propre par page en www + **s'assurer que les 348 URLs `/palette/[n]` sont dans le `sitemap.xml`**
  (sinon Google ne découvre pas les palettes via cette page). Idéalement, rendre la grille
  indexable (SSR/SSG d'au moins les liens).
- 🟠 **/compte** : gabarit B (canonical cassé), rendu client (shell vide), titre générique. Même correctif.
- ✅ **/partenaires** : gabarit A, beau contenu B2B (formulaire de candidature). **Manque le bouton
  « ← Retour »** → l'ajouter (comme /mentions).
- ✅ **/affiliation** : gabarit A, contenu clair et conforme (DSA/DGCCRF), Retour présent. RAS.
  (Petit point : la page cite COS/Sézane/Net-a-Porter en exemples — OK tant que c'est illustratif et
  pas présenté comme des partenariats déjà actifs ; aujourd'hui seuls MUJI + Amazon le sont.)

### Bilan gabarit B (canonical cassé + ancien menu/footer) — liste consolidée
**/atelier, /scanner, /cultures, /tarifs, /favoris, /decouverte, /calendrier, /stylist, /compte,
/panier, /palettes.** → toutes à rebrancher sur le Nav/Footer globaux + canonical par page en www.
(Pages déjà OK : accueil, /about, /faq, /mentions, /affiliation, /partenaires, /palette/[n].)

### Complément final — /cgv, /confidentialite, /contact

- ✅ **/cgv** : complète (12 articles), gabarit A, canonical OK.
- ✅ **/confidentialite** : excellente (nLPD + RGPD, cookies, droits, conservation, sous-traitants),
  gabarit A.
- ✅ **/contact** : OK, gabarit A. Le formulaire ouvre l'app mail (mailto) — simple mais fonctionne ;
  un vrai formulaire avec envoi serveur serait un plus (optionnel).
- Ces 3 pages + /mentions + /partenaires **n'ont pas de bouton « ← Retour »** → l'ajouter pour
  cohérence (elles ne s'appuient que sur les liens croisés en bas).

### 🔴 Incohérence de devise (CHF vs €) — IMPORTANT

- **/cgv** affiche les prix de l'abonnement en **CHF** : « WADA+ Mensuel 1.99 CHF », « Annuel 17.99 CHF ».
- La page **/tarifs** (et la communication) affiche les mêmes montants en **€** (1,99 € / 17,99 €).
- → Choisir **une seule devise**, cohérente partout, et qui **correspond à la devise réelle des prix
  Stripe** (`STRIPE_PRICE_MONTHLY/YEARLY`). Sinon le client voit un prix puis est débité dans une autre
  devise → confusion + litige possible. (L'éditeur étant à Genève, le CHF est légitime, mais il faut
  l'aligner sur Stripe ET sur /tarifs.)

---

## ✅ Audit terminé (21 pages)

**Pages OK (gabarit A, canonical propre, contenu solide)** : accueil, /about, /faq, /palette/[n],
/mentions, /cgv, /confidentialite, /contact, /affiliation, /partenaires.

**Pages à corriger (gabarit B — canonical cassé + ancien menu/footer)** : /palettes, /atelier,
/scanner, /cultures, /tarifs, /favoris, /decouverte, /calendrier, /stylist, /compte, /panier.

**Top priorités issues de cet audit complet :**
1. Rebrancher les 11 pages « gabarit B » sur Nav/Footer globaux + canonical par page en www (gros impact SEO, surtout /palettes).
2. Sitemap : inclure les 348 URLs /palette/[n] (grille rendue côté client).
3. Devise unique CHF/€ alignée sur Stripe.
4. Bouton « ← Retour » sur /ma-tenue (+ /mentions, /cgv, /confidentialite, /contact, /partenaires) et standardisation.
5. /calendrier : corriger la date « Aujourd'hui ».
6. Titres + descriptions dédiés sur toutes les pages du gabarit B ; /faq « WADA+ » → « WADA Premium ».
