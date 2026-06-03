# WADA — Finition : les détails qui font le « parfait » (pour le codeur)

Le site fonctionne et les gros chantiers sont cadrés ailleurs (`WADA-BRIEF-CODEUR.md`,
`WADA-tenue-MASTER.md`). Ce fichier couvre la **couche de finition** — les détails qui séparent
« bien » de « parfait ». Constats live + recommandations.

---

## 1. 🔴 Navigation — il y a TROIS menus différents (constaté en live)

- Gabarit A : « Palettes · Scanner · À propos » + bouton « Commencer ».
- Gabarit B : « Qui sommes-nous · Atelier · ☰ » + Abonnement/Créer un compte/Panier.
- **Gabarit C (/decouverte)** : « Palettes · Scanner · Styliste · Favoris » + « /compte » + Abonnement,
  **avec une barre d'onglets en bas** (◎ Scanner ▦ Palettes ✦ Styliste ○ Compte) absente ailleurs.

Actions :
- **Un seul `<Nav/>` global** sur 100 % des pages (libellés, ordre, CTA identiques).
- **Bug visible** : le lien compte affiche le texte brut **« /compte »** → remplacer par « Compte »
  (ou une icône), avec le bon `href`.
- **Barre d'onglets mobile** : soit sur toutes les pages, soit aucune — pas seulement /decouverte.
- **Footer** : harmoniser les liens (certaines pages ont « Calendrier » / « Installer l'app », d'autres non).

---

## 2. États : 404, chargement, vide, erreur

- **Page 404 dédiée** : à vérifier qu'elle existe et qu'elle est jolie (titre WADA, message doux,
  bouton « Retour à l'accueil » + « Voir les palettes »). Une 404 brute = mauvaise impression.
- **Chargement** : les pages rendues côté client (/ma-tenue, /palettes, /stylist, /panier, /compte)
  doivent afficher des **squelettes** (placeholders animés), jamais une page blanche.
- **Vide** : favoris vide, panier vide, recherche sans résultat → message + action (« Découvrez les
  palettes → »). (Scanner « Aucune couleur scannée » est déjà bon ✅.)
- **Erreur** : si un flux/produit ne charge pas → message clair + repli, pas un trou.

---

## 3. Micro-textes (microcopy)

- Boutons : verbes d'action clairs et cohérents (« Voir la tenue », « Scanner une couleur »,
  « Acheter sur MUJI »). Éviter les libellés vagues.
- Confirmations : après « Ajouter à mon dressing » → petit toast « Ajouté à vos favoris ✓ ».
- Newsletter : garder le ton (« une seule lettre par semaine, pas de spam ») — déjà très bien ✅.
- Liens d'achat : un mini-label « lien partenaire » discret près des boutons Acheter (transparence).

---

## 4. Accessibilité

- **Contraste** : texte clair sur photo/vidéo → garder un voile suffisant (hero, cartes).
- **`alt`** sur toutes les images = nom du produit / description utile (pas vide).
- **Focus clavier visible** (outline) sur liens, boutons, champs ; navigation Tab logique.
- **Un seul `<h1>` par page** + hiérarchie de titres correcte.
- Boutons/icônes sans texte (☰, panier, ◎▦✦○) → ajouter un `aria-label`.
- Cibles tactiles ≥ 44×44 px sur mobile.

---

## 5. Micro-interactions (le « soin »)

- Hover discret sur les cartes (translateY -3px + image scale 1.03, transition 0.25s).
- Transitions douces sur les changements d'état (filtres palettes, onglets Scanner).
- Le cercle « crayon » animé au clic sur le CTA (déjà prévu) — vérifier qu'il est en place.
- Pas de « saut » de layout au chargement des images (réserver l'espace via aspect-ratio).

---

## 6. Cohérence visuelle finale

- **Une seule police d'accent + une seule couleur d'accent** sur tout le site (vérifier qu'aucune
  page ne dépareille).
- Rayons, ombres, espacements homogènes (cartes 16px, mêmes gaps).
- Favicon + logo identiques partout (onglet, partage, app).

---

## 7. Confiance — micro-détails

- Près du prix / panier : « Paiement sécurisé Stripe · Prix identique chez le marchand » (réassurance déjà ajoutée — la garder visible).
- Divulgation affiliation présente sur les pages produit aussi (pas seulement le footer).
- Liens externes marchands : `target="_blank" rel="noopener nofollow sponsored"`.

---

## Checklist finition
- [ ] Un seul header + un seul footer partout ; barre d'onglets cohérente ; corriger le label « /compte »
- [ ] Page 404 soignée
- [ ] Squelettes de chargement sur les pages client-rendered
- [ ] États vides/erreur avec action
- [ ] `alt`, focus visible, `aria-label`, un seul H1/page
- [ ] Hover/transitions douces, pas de saut de layout
- [ ] Police/couleur d'accent uniques ; rayons/ombres homogènes
- [ ] Réassurance + divulgation affiliation sur les pages produit
