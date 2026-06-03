# WADA — Priorités codeur (à faire dans cet ordre)

Bonjour. Voici les **5 chantiers prioritaires** pour passer WADA de prototype à produit lançable.
Chaque chantier a son fichier détaillé. Ordre conseillé d'exécution (du plus rapide au plus gros).

---

## 1. ⚡ Vérification wada.style sur Awin — **10 min**

Sans ça, les marques en attente ne valident pas WADA. C'est juste un meta tag à ajouter dans le
`<head>` de `app/layout.tsx`.

👉 **Fichier détaillé** : `WADA-Awin-verification.md`

---

## 2. 🎯 Page d'accueil : vidéo plein écran SANS footer — **1-2h**

Demandé plusieurs fois, jamais déployé. Le `<Footer/>` est rendu globalement dans le layout → il
faut le rendre **conditionnel** (composant client avec `usePathname`).

👉 **Fichier détaillé** : `WADA-accueil-footer-fix-technique.md`

---

## 3. 🔤 UNE seule police de titre partout (Fredoka) — **1-2h**

Aujourd'hui certaines pages sont en serif, d'autres en chubby → incohérent. Définir un seul style
global `h1..h6 { font-family: Fredoka }` et supprimer toutes les déclarations serif sur les titres.

👉 **Fichier détaillé** : `WADA-UNE-SEULE-POLICE.md`

---

## 4. 🧠 Brancher l'IA Styliste pour de vrai — **2-4h**

Aujourd'hui l'assistant est un questionnaire scripté. Il faut connecter un vrai LLM avec le system
prompt WADA pour qu'il **discute** comme un styliste, comprenne « soirée pirate », « j'ai un pull
noir », « budget 100€ », etc. La clé `OPENAI_API_KEY` est déjà dans Vercel.

À faire :
- Endpoint API qui appelle le LLM avec le system prompt + l'historique du chat.
- Streaming de la réponse.
- Sortie JSON structurée (mode question / mode tenue) → l'UI affiche bulle + tenue.
- Pour la tenue, attacher les vrais produits MUJI/Awin à partir de `type+couleurNom+genre`.
- Injecter le profil utilisateur (genre/budget/style) dans le contexte.

👉 **Fichier détaillé** : `WADA-IA-styliste-v2.md` (contient le system prompt complet)

---

## 5. 👤 Mini-profil + onboarding + switcher rapide — **demi-journée à 1 jour**

Sans connaître le client (Femme/Homme, budget, style), aucune proposition n'a de sens. Un
onboarding 3 questions au 1er accès, profil mémorisé, switcher pour le changer en 2 secondes
depuis n'importe quelle page. Le profil filtre toutes les propositions (genre des pièces, gamme
de prix, registre).

👉 **Fichier détaillé** : `WADA-profil-onboarding-spec.md`
👉 **Maquette interactive** : `wada-palette-finale.html` (ouvrir dans un navigateur pour voir le
   rendu attendu — onboarding, page palette personnalisée, switcher)

---

## Au-delà des 5 chantiers — à garder en tête

Une fois ces 5 priorités terminées, les chantiers importants suivants sont :

- **Paiement Stripe** + **authentification** (pour l'abonnement Premium 1,99€/mois).
- **Pages légales** (mentions légales, CGV, confidentialité, bandeau cookies RGPD) — je rédige les
  textes côté Nem, à intégrer.
- **SEO de base** : sitemap.xml avec les 348 palettes, canonical correct sur chaque page, OG
  images dynamiques.
- **Analytics** : Vercel Analytics ou Plausible.
- **Cohérence sitewide** : devise (€ partout), libellés (Abonnement, pas Commencer), nav identique
  sur toutes les pages, PaletteCard unique. Cf. `WADA-bugs-retour-et-layout.md`.

Le fichier `WADA-praticabilite-app.md` synthétise les principes UX à appliquer sur **tout** le
site (une seule action par écran, tab bar mobile, états vides/chargement, etc.) — à utiliser comme
guide général.

---

## Maquettes visuelles à consulter

Toutes les maquettes sont des HTML autonomes, à ouvrir dans un navigateur :

- `wada-palette-finale.html` — page palette avec onboarding + perso (référence pour le chantier 5).
- `wada-scanner-v2.html` — page Scanner couleur refaite (plus claire, états soignés).
- `wada-scanner-vetement-v2.html` — page Scanner vêtement avec ancre + chaussures cohérentes.
- `wada-app-epure.html` — vision « app efficace » avec tab bar en bas, accueil simplifié.
- `wada-onboarding-palette.html` — version alternative onboarding + page palette épurée.

---

## Récap : par où commencer ce matin

Si tu as 30 minutes : **chantier 1 (vérification Awin)**.
Si tu as une demi-journée : **chantiers 1 + 2 + 3** (vérification + accueil + police).
Si tu as 2-3 jours : **les 5 chantiers**, dans cet ordre.

Merci, et n'hésite pas à demander si quelque chose n'est pas clair dans un fichier.
