# WADA — Audit complet (mobile + ordinateur) & corrections : viser 100 %

Document unique et exhaustif. Tout ce qui a été trouvé sur le site en ligne (21 pages auditées),
desktop **et** mobile, avec la correction de chaque point. Classé : 🔴 bloquant · 🟠 important · 🟡 finition.
Donné au codeur, c'est la feuille pour atteindre « 100 % optimal ».

> Note : moi (Claude) je ne peux pas modifier l'app en ligne — ceci est la liste de corrections pour
> le codeur. Les points « moteur de tenues » sont rendus côté client : à valider sur écran après correction.

---

## 1. NAVIGATION & STRUCTURE  🔴
- **3 menus (header) différents** selon les pages (accueil ≠ scanner ≠ découverte) → **un seul
  `<Nav/>` global** partout (libellés, ordre, CTA identiques).
- **2-3 footers différents** → **un seul `<Footer/>` global**. Harmoniser les liens (Calendrier,
  « Installer l'app », CGV, Confidentialité présents seulement sur certaines pages). Copyright
  identique partout (« WADA », pas « Wada »). Libellé du lien `/palettes` = un seul mot (Palettes OU Tenues).
- **Bug label** : sur /decouverte le lien compte affiche le texte brut **« /compte »** → « Compte ».
- **Barre d'onglets bas** présente seulement sur /decouverte → la mettre partout ou nulle part.
- **Boutons « ← Retour »** : présents/cohérents sur toutes les pages hors accueil. Manquent :
  /ma-tenue, /mentions, /cgv, /confidentialite, /contact, /partenaires (scanner = OK). Même position/style.
- **Header** : remplacer le bouton **« Commencer »** par **« Abonnement »** (→ /tarifs).

## 2. SEO / TECHNIQUE  🔴/🟠
- **Canonicals cassés** sur 11 pages « gabarit B » (atelier, scanner, cultures, tarifs, favoris,
  decouverte, calendrier, stylist, compte, panier, palettes) : `canonical = https://wada.style`
  (sans www + racine). → **canonical + og:url par page, en www**. theme-color unique **#F4EFE7**.
- **/palettes** : grille rendue côté client → liens des 348 palettes absents du HTML (Google ne les
  voit pas). → indexer + **sitemap incluant les 348 `/palette/[n]`**.
- **Titres/descriptions génériques** sur tout le gabarit B → titres + meta **par page**
  (Scanner, Atelier, Cultures, Favoris, Découverte, Stylist, Panier, Compte, Tarifs…).
- /ma-tenue : meta description mentionne encore « photo éditoriale IA » (visuel retiré) → mettre à jour.
- Données structurées **Product** (nom, prix, image, dispo) + vraie **image OG** (pas un SVG).

## 3. PAGE D'ACCUEIL  🟠
- Retirer le **sous-titre du hero** (« Un dictionnaire de 348 accords chromatiques… ») — peu lisible.
- Corriger le **double espace** : « Trouvez la couleur.  Trouvez votre style. »
- Bouton header → « Abonnement » (cf. §1).

## 4. MOTEUR DE TENUES (le cœur)  🔴  → détail `WADA-tenue-MASTER.md`
- **Genre non respecté** : Homme → on propose T-shirt/jupe/écharpe femme. Filtrer strictement
  (homme/unisexe) sur tous les slots ; aucune jupe/robe en tenue homme.
- **Photos floues** : on agrandit la vignette 200 px → mirrorer **`merchant_image_url`** (~1280 px).
- **Cohérence type/registre** : chaussures = vraies chaussures (pas sandales/pantoufles en tailoring) ;
  accent = ceinture/foulard (pas sac de sport).
- **Aucune variété** : toutes les palettes donnent les mêmes produits → une teinte de palette par slot
  + tirage déterministe (palette+slot+style) ; pas de doublon.
- **Cartes** : ratio 4/5 uniforme, image edge-to-edge, nom 2 lignes, grille propre.

## 5. CONTENU / DONNÉES  🟠
- **Faux témoignages** (/tarifs) → retirer (ou vrais avis).
- **PANTONE®** : retiré sur les pages palette ✓ ; vérifier /about (retirer ® + codes douteux).
- **« 80+ boutiques »** (/about) → « une sélection de boutiques » si non vérifiable.
- **Vocabulaire** : « palettes » vs « tenues » ; « WADA+ » → « WADA Premium » côté client.
- **/cultures** : vérifier le mapping culture→palette (cohérence géographique) et les noms.
- **/calendrier** : date « Aujourd'hui » figée (20 mai) → date réelle + bon jour de semaine.
- **Scanner** : « Couleur détectée #5C2018 » par défaut → état vide tant qu'aucune photo.

## 6. DEVISE & PAIEMENT  🔴
- **Incohérence devise** : CGV en **CHF** vs Tarifs en **€**. → une seule devise, alignée sur la
  devise réelle des prix **Stripe**.
- Vérifier le **parcours Stripe** de bout en bout : souscrire ET résilier WADA Premium.

## 7. NEWSLETTER  🔴 (ne marche pas aujourd'hui)
- Les emails sont stockés **en local** (navigateur) → rien n'est collecté/envoyé. → backend réel :
  endpoint d'inscription + stockage serveur + **double opt-in** + envoi via ESP (Resend/Brevo).

## 8. MOBILE (téléphone)  🟠  → détail `WADA-mobile-corrections.md`
- **Une seule nav mobile** (barre d'onglets partout) + corriger « /compte ».
- **Footer en accordéon** compact (aujourd'hui = mur de 12-15 liens).
- **Hero** : image poster sur mobile, pas de vidéo autoplay (data/batterie/perf).
- **Pages surchargées** : /cultures en accordéon par culture ; /palettes paginée ; /ma-tenue 1 colonne.
- **Aucune scroll horizontale** ; cibles tactiles ≥ 44 px ; champs de saisie ≥ 16px (sinon iOS zoome).
- Panneau Scanner : s'empiler verticalement sur mobile.

## 9. FINITION  🟡  → détail `WADA-finition-details.md`
- **Page 404** dédiée et soignée.
- **Squelettes de chargement** sur les pages client-rendered (/ma-tenue, /palettes, /stylist, /panier, /compte).
- **États vides / erreur** avec action (favoris, panier, recherche).
- **Accessibilité** : `alt` partout, focus clavier visible, `aria-label` sur icônes (☰, panier, ◎▦✦○),
  un seul `<h1>` par page.
- **Micro-interactions** : hover doux, transitions, réserver l'espace image (aspect-ratio) → pas de saut.
- **Perf** : images lazy + cache, vidéos poster ; viser LCP < 2,5 s (Lighthouse).

## 10. À VÉRIFIER QUE ÇA MARCHE (tests bout en bout)
- [ ] Scanner : photo → teinte détectée → bonne palette.
- [ ] Abonnement Stripe : souscrire + résilier.
- [ ] Bouton « Acheter » → lien marchand tracké.
- [ ] Homme → 100 % pièces homme/unisexe.
- [ ] 3-4 palettes différentes → tenues visiblement différentes.
- [ ] Aucune scroll horizontale sur mobile ; footer accordéon ; nav unique.

---

## CHECKLIST MAÎTRE (cocher au fur et à mesure)
**Bloquant 🔴**
- [ ] Nav unique + Footer unique (desktop & mobile) ; label « /compte » corrigé
- [ ] Canonicals par page en www (11 pages) + sitemap 348 palettes
- [ ] Moteur de tenues : genre + photos nettes + cohérence + variété + cartes
- [ ] Devise unique alignée Stripe ; parcours abonnement testé
- [ ] Newsletter backend réel (double opt-in + ESP)

**Important 🟠**
- [ ] Accueil : sous-titre retiré, bouton « Abonnement », double espace corrigé
- [ ] Boutons retour sur toutes les pages hors accueil
- [ ] Titres/descriptions par page ; données structurées + OG image
- [ ] Faux témoignages retirés ; PANTONE /about ; « 80+ boutiques » adouci ; vocabulaire unifié
- [ ] Mobile : hero poster, /cultures accordéon, /palettes paginée, /ma-tenue 1 col, tap targets, 16px
- [ ] /calendrier date réelle ; scanner état vide

**Finition 🟡**
- [ ] 404 + squelettes + états vides/erreur
- [ ] Accessibilité (alt, focus, aria, h1) ; micro-interactions ; perf LCP < 2,5 s
