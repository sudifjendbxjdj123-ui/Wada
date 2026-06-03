# WADA — Audit UX / Design / Mobile — améliorations pour le développeur

Document technique • 24 mai 2026
Périmètre : Navigation, Design, Mobile, Accessibilité

## Comment lire ce document
Chaque amélioration porte un code (ex. N1, D3, M2), un niveau de priorité et le fichier concerné avec le numéro de ligne quand c'est possible. Traiter dans l'ordre : d'abord les **CRITIQUES** (bloquent l'usage), puis les **IMPORTANTS**, puis les **SOUHAITABLES**. Chemins relatifs à la racine du projet.

Priorités :
- **CRITIQUE** — bloque ou casse l'usage
- **IMPORTANT** — dégrade fortement l'expérience
- **SOUHAITABLE** — amélioration / finition

## En bref — les 3 chantiers prioritaires
1. **Navigation étranglée.** Le menu principal ne donne accès à aucune fonctionnalité (scanner, styliste, palettes, garde-robe…) et il n'existe aucun menu mobile : sur téléphone, l'utilisateur ne peut pas naviguer. Point le plus urgent pour une app dont la cible est mobile.
2. **Pas de source de vérité pour le design.** Trois systèmes de couleurs/typo coexistent, la police d'affichage « Fredoka » n'est jamais chargée sur l'accueil et le scanner, et la couleur d'accent change selon les pages (bordeaux / mojo / plum). Identité visuelle incohérente d'une page à l'autre.
3. **Socle mobile non finalisé.** Le réglage qui active les marges de sécurité iPhone (encoche / barre gestuelle) est absent, plusieurs zones tactiles sont trop petites, et le mode nuit — entièrement codé — n'est activable par aucun bouton.

---

## 1. Navigation & parcours utilisateur

### N1 — Le menu principal ne donne accès à aucune fonctionnalité — CRITIQUE
- **Fichier :** components/Nav.tsx (l. 27-29, 58-136)
- **Problème :** Le header ne contient que « Qui sommes-nous », le logo et un bouton « Abonnement ». Aucun lien vers Scanner, Styliste, Palettes, Composer, Garde-robe, Favoris ou Compte.
- **Impact :** Sur toute page intérieure, impossible de passer d'une fonctionnalité à l'autre ; il faut revenir en arrière jusqu'à /atelier. Les fonctions premium n'ont aucune entrée de navigation visible.
- **Reco :** Ajouter dans le Nav des liens vers les parcours clés (Scanner / Composer / Styliste / Palettes) + une entrée Compte/Favoris. Desktop : barre de liens ; mobile : menu (voir N3).

### N2 — La page d'accueil est un cul-de-sac à une seule porte — CRITIQUE
- **Fichier :** app/page.tsx (l. 57-202, commentaire l. 193-197)
- **Problème :** La home a été réduite à un hero + footer. Le seul chemin vers les outils est le bouton « Entrer dans l'atelier » ; le 2e CTA mène à /about. Les sections de découverte des fonctionnalités ont été supprimées.
- **Impact :** Un visiteur n'aperçoit aucune des fonctionnalités phares (scanner, palettes, IA). Tout repose sur un bouton au label métaphorique (« atelier ») peu explicite — perte de conversion et de découvrabilité.
- **Reco :** Réintroduire sur la home une grille « que faire » (Scanner / Composer / Styliste / Palettes) et un aperçu de palettes, ou compenser en enrichissant le Nav (N1).

### N3 — Aucun menu mobile : navigation morte sur téléphone — CRITIQUE
- **Fichier :** components/Nav.tsx (l. 138-144)
- **Problème :** À ≤880px, la règle @media masque les liens (display:none). Il ne reste que le logo + le bouton Abonnement. Aucun composant de menu mobile (hamburger, drawer, bottom-nav) n'existe dans le projet.
- **Impact :** Sur mobile — la cible principale d'une app Capacitor iOS/Android — aucun moyen d'atteindre les fonctionnalités depuis le header. Cassure UX critique.
- **Reco :** Ajouter un bouton hamburger ouvrant un panneau listant tous les parcours, OU une barre d'onglets en bas (Scanner / Palettes / Styliste / Compte), pattern attendu sur une app mobile.

### N4 — Nav et Footer dupliqués page par page au lieu d'être dans le layout — IMPORTANT
- **Fichier :** app/layout.tsx (l. 212-230)
- **Problème :** Chaque page importe et affiche `<Nav/>` et `<Footer/>` manuellement (≈ 36 fichiers). Le RootLayout ne les rend pas.
- **Impact :** Risque d'incohérence (une page peut oublier le header), maintenance lourde, et c'est ce qui oblige chaque page à gérer son propre bouton retour.
- **Reco :** Remonter `<Nav/>` et `<Footer/>` dans app/layout.tsx autour de `{children}`, puis supprimer les imports par page.

### N5 — Libellé trompeur : « Mon dressing » mène aux favoris, et /garde-robe est orpheline — IMPORTANT
- **Fichier :** app/atelier/page.tsx (l. 90-99)
- **Problème :** La tuile « Mon dressing » (« votre mémoire vestimentaire ») pointe vers /favoris. La vraie page /garde-robe existe mais n'est atteignable nulle part.
- **Impact :** L'utilisateur croit ouvrir sa garde-robe et tombe sur les favoris ; une page entière reste inaccessible.
- **Reco :** Clarifier la cible : séparer Favoris et Garde-robe, ou renommer la tuile et la relier à /garde-robe.

### N6 — Parcours « Composer » incohérent — IMPORTANT
- **Fichier :** app/atelier/page.tsx (l. 64-78)
- **Problème :** La tuile « Composer une tenue » pointe vers /palettes (et non /composer), alors que /composer existe et est censé être accessible depuis le scanner.
- **Impact :** Deux pages aux rôles flous (composer vs palettes) ; parcours non linéaire et déroutant.
- **Reco :** Unifier le flux et aligner le libellé sur sa destination réelle.

### N7 — Aucun point d'entrée « Compte / Connexion » dans le header — SOUHAITABLE
- **Fichier :** components/Nav.tsx (l. 116) — /compte existe
- **Problème :** Le seul bouton d'action permanent pousse à l'abonnement ; pas d'accès à /compte ni à la connexion.
- **Impact :** L'utilisateur connecté n'a pas d'accès rapide à son espace personnel.
- **Reco :** Ajouter une icône/lien Compte dans le Nav.

---

## 2. Design & cohérence visuelle

### D1 — La police d'affichage « Fredoka » n'est jamais chargée — CRITIQUE
- **Fichier :** app/page.tsx (l. 45) et app/scanner/page.tsx (l. 34) ; absente de app/layout.tsx (l. 144-159) et de globals.css
- **Problème :** Sur l'accueil et le scanner, les titres demandent « Fredoka » en premier choix, mais aucune feuille de style ne la charge ; le navigateur retombe sur « Bagel Fat One » (style très différent). Sur les autres pages, Fredoka n'est qu'un 2e repli, donc l'impact se concentre sur ces deux pages.
- **Impact :** Les titres de l'accueil et du scanner — les deux pages les plus vues — ne s'affichent pas dans la police prévue ; le rendu typographique réel diverge de l'intention design.
- **Reco :** Soit charger Fredoka (Google Fonts) comme les autres polices, soit retirer toutes les références à Fredoka et assumer Bagel Fat One. Trancher une seule police d'affichage.

### D2 — Trois systèmes de design parallèles qui se contredisent — CRITIQUE
- **Fichier :** lib/tokens.ts, lib/styles.ts, app/globals.css + palettes inline (app/page.tsx l. 32-42, atelier l. 18-27, stylist l. 111-119)
- **Problème :** Coexistent : (1) lib/tokens.ts (typo EB Garamond/Inter), (2) lib/styles.ts (tokens « Relume » : mojo, plum, cream… + Bagel Fat One + Fraunces), (3) des palettes écrites en dur dans chaque page (mêmes beige/bordeaux/olive recopiés). Trois familles de couleurs se superposent.
- **Impact :** Aucune source de vérité : un changement de couleur de marque doit être fait à des dizaines d'endroits, avec un risque élevé de divergence visuelle entre pages.
- **Reco :** Converger vers UN seul jeu de tokens (par ex. les variables CSS --wada-*) et bannir les objets `palette = {…}` écrits en dur dans les pages.

### D3 — Le mode nuit est entièrement codé mais activable par aucun bouton — CRITIQUE
- **Fichier :** components/ThemeToggle.tsx (jamais importé/rendu) ; layout.tsx (l. 17-25), globals.css (l. 43-70, 575-606)
- **Problème :** Tout existe : script anti-flash, variables [data-theme="jour|nuit"], composant ThemeToggle fonctionnel. Mais le bouton de bascule n'est rendu sur aucune page, et le thème est forcé à « jour » même si l'utilisateur préfère le sombre.
- **Impact :** Le mode nuit est inaccessible : un effort de développement complet reste inutilisable par l'utilisateur.
- **Reco :** Monter `<ThemeToggle/>` dans le Nav et initialiser le thème depuis prefers-color-scheme au premier chargement.

### D4 — Le composant Button standard est quasi inutilisé ; chaque page réinvente ses boutons — IMPORTANT
- **Fichier :** components/Button.tsx vs boutons inline (home l. 140-189, tarifs l. 23-33, scanner, stylist)
- **Problème :** Le Button partagé (primary/secondary/ghost) existe, mais les pages créent leurs propres boutons avec des rayons (999 vs 14px vs 6.25rem), des couleurs (bordeaux #6B3A32 vs mojo #C44E3A vs plum #8B2F6E) et des tailles différentes.
- **Impact :** L'accent primaire change de couleur selon la page ; l'utilisateur ne reconnaît pas « le bouton WADA ». Identité de marque diffuse.
- **Reco :** Standardiser tous les boutons via Button.tsx (ou des classes utilitaires) et fixer UNE couleur d'accent primaire.

### D5 — La couleur du bouton du menu (plum) ne correspond à rien d'autre sur le site — IMPORTANT
- **Fichier :** components/Nav.tsx (l. 24-25 : PLUM = #8B2F6E)
- **Problème :** Le bouton « Abonnement » du header est plum/violet, alors que les CTA des pages sont bordeaux (#6B3A32) ou mojo (#C44E3A). Un commentaire de lib/styles.ts indique pourtant que plum n'est qu'un « backup ».
- **Impact :** Le bouton le plus visible (présent sur toutes les pages) emploie une couleur qui n'apparaît nulle part ailleurs — incohérence chromatique frappante.
- **Reco :** Aligner le bouton du Nav sur l'accent primaire retenu (bordeaux ou mojo).

### D6 — Deux règles body::before contradictoires + grain en z-index 9999 — IMPORTANT
- **Fichier :** app/globals.css (l. 502-511 puis l. 856-868)
- **Problème :** Deux déclarations body::before se chevauchent : la 2e (lavis de couleur) écrase la 1re (grain papier) car un seul pseudo-élément existe. Le grain papier en z-index:9999 + mix-blend-mode:multiply recouvre toute la page, UI comprise.
- **Impact :** L'effet grain est probablement perdu ou imprévisible, et un overlay plein écran à z-index très élevé peut interférer avec le rendu et le contraste.
- **Reco :** Fusionner en un seul body::before (ou utiliser ::before et ::after) et abaisser le z-index.

### D7 — Trop de familles de polices chargées — SOUHAITABLE
- **Fichier :** app/globals.css (l. 7) + layout.tsx (l. 151-159)
- **Problème :** Sont chargées : DM Serif Display, DM Serif Text, Cormorant Garamond, Fraunces, EB Garamond, Inter, Noto Serif JP, Bagel Fat One, Abril Fatface, Merriweather Sans. Beaucoup de fontes pour un site qui devrait tenir sur 2-3 familles.
- **Impact :** Poids réseau inutile et risque de FOUT (texte qui change d'apparence au chargement).
- **Reco :** Auditer l'usage réel et supprimer les polices non utilisées (Cormorant, Abril, DM Serif probablement redondantes).

---

## 3. Mobile & responsive

### M1 — viewport-fit=cover absent : les marges de sécurité iPhone sont inertes — CRITIQUE
- **Fichier :** app/layout.tsx (l. 34-41, objet viewport)
- **Problème :** L'objet viewport définit width/scale/themeColor mais PAS viewportFit:"cover". Or globals.css (l. ≈2797-2811) s'appuie entièrement sur env(safe-area-inset-*) pour le Nav et le bouton retour.
- **Impact :** Sans viewport-fit=cover, les env(safe-area-inset-*) valent 0 sur iPhone à encoche : tout le travail de safe-area est sans effet et le Nav peut passer sous l'encoche / la Dynamic Island.
- **Reco :** Ajouter viewportFit:"cover" à l'objet viewport.

### M2 — Champs de saisie < 16px : zoom automatique iOS au focus — IMPORTANT
- **Fichier :** app/stylist/page.tsx (l. 757-768, fontSize 15), app/contact/page.tsx (l. 78, 82), app/scanner/page.tsx
- **Problème :** Plusieurs `<input>`/`<textarea>` ont une taille de police de 15px. Safari iOS zoome automatiquement sur un champ dont la police est < 16px dès qu'on le touche.
- **Impact :** Sur iPhone, taper dans l'assistant ou le formulaire de contact déclenche un zoom intempestif et un recentrage déstabilisant.
- **Reco :** Passer la taille de police des champs de saisie à ≥ 16px (ou 1rem).

### M3 — Bouton de fermeture de l'InstallPrompt trop petit — IMPORTANT
- **Fichier :** components/InstallPrompt.tsx (l. 111-122 ; modale iOS l. 194-202)
- **Problème :** Le « ✕ » de fermeture n'a pas de dimensions explicites (fontSize 18, padding ≈ 0) ; idem le ✕ de la modale iOS.
- **Impact :** Cible tactile < 44×44px, difficile à toucher — frustration pour fermer un prompt affiché par-dessus le contenu.
- **Reco :** Garantir une zone tactile minimale de 44×44px (width/height + padding).

### M4 — Le sélecteur de couleur du scanner est trop petit (36×32px) — IMPORTANT
- **Fichier :** app/scanner/page.tsx (l. 339-350, `<input type="color">`)
- **Problème :** L'input color du « choix précis de la couleur » mesure 36×32px, sous le minimum tactile recommandé.
- **Impact :** Difficile à activer au doigt sur l'écran principal du scanner, qui est une fonctionnalité cœur.
- **Reco :** Agrandir la cible à ≥ 44×44px.

### M5 — InstallPrompt en position fixe sans marge de sécurité basse — IMPORTANT
- **Fichier :** components/InstallPrompt.tsx (l. 96-110)
- **Problème :** La carte d'installation est en position:fixed; bottom:20; right:20 sans env(safe-area-inset-bottom).
- **Impact :** Sur iPhone avec barre gestuelle, le prompt peut chevaucher cette barre (aggravé par M1 qui neutralise déjà le safe-area).
- **Reco :** Utiliser bottom: max(20px, env(safe-area-inset-bottom)) une fois M1 corrigé.

### M6 — InstallPrompt : 30s d'attente + dépendance à beforeinstallprompt — SOUHAITABLE
- **Fichier :** components/InstallPrompt.tsx (l. 57-65)
- **Problème :** Le prompt n'apparaît qu'après 30s et seulement si l'événement beforeinstallprompt a été capté (Chrome/Android). Beaucoup d'utilisateurs partent avant.
- **Impact :** Faible taux d'installation ; opportunité manquée d'ancrage de l'app.
- **Reco :** Ajouter un point d'entrée explicite « Installer l'app » (la page /install existe déjà — la relier dans le footer ou le menu).

### M7 — L'app native charge le site distant : pas de vrai mode hors-ligne malgré la promesse — SOUHAITABLE
- **Fichier :** capacitor.config.ts (l. 23-29, server.url = https://www.wada.style) ; InstallPrompt.tsx (l. 141)
- **Problème :** L'app native est un webview pointant vers l'URL distante, alors que l'InstallPrompt promet « 348 palettes hors-ligne ».
- **Impact :** Sans connexion, l'app native risque d'afficher une page d'erreur : promesse marketing non tenue.
- **Reco :** Vérifier le comportement hors-ligne réel du wrapper ; ajuster le message ou ajouter un cache natif.

### M8 — Barre d'état Capacitor figée en texte foncé, incompatible mode nuit — SOUHAITABLE
- **Fichier :** capacitor.config.ts (l. 49-53)
- **Problème :** La StatusBar est configurée en dur (style DARK = texte foncé sur fond clair). Si le mode nuit (D3) était activé, le texte resterait foncé sur fond sombre.
- **Impact :** Barre d'état illisible en mode nuit sur l'app native.
- **Reco :** Synchroniser dynamiquement le style de la StatusBar avec le thème actif via le plugin Capacitor.

---

## 4. Accessibilité

### A1 — Les messages de l'assistant ne sont pas annoncés aux lecteurs d'écran — IMPORTANT
- **Fichier :** app/stylist/page.tsx (l. 649-703, 411-424)
- **Problème :** Le contenu du bot est inséré via dangerouslySetInnerHTML, et le conteneur de chat n'a ni role="log" ni aria-live="polite".
- **Impact :** Les lecteurs d'écran n'annoncent pas les nouveaux messages : la conversation est inaccessible aux personnes non-voyantes.
- **Reco :** Ajouter role="log" aria-live="polite" au conteneur des bulles ; préférer du JSX au HTML brut.

### A2 — outline:none en ligne sur des champs : focus clavier invisible — IMPORTANT
- **Fichier :** app/globals.css (l. 622-635) + inline (stylist l. 765, contact l. 78/82)
- **Problème :** Le focus repose sur :focus-visible, mais plusieurs champs ont outline:"none" en ligne ; ils perdent tout indicateur de focus si :focus-visible ne s'applique pas.
- **Impact :** Navigation au clavier dégradée : on ne voit plus quel champ est sélectionné.
- **Reco :** Retirer les outline:none en ligne sur les inputs et laisser le focus ring global jouer.

### A3 — Liens du Nav : états hover/focus gérés en JS uniquement — IMPORTANT
- **Fichier :** components/Nav.tsx (l. 69-84, 131-132)
- **Problème :** Les liens gèrent le survol via onMouseEnter/Leave en JS (opacité), sans état :focus/:hover en CSS : au clavier, aucun retour visuel sur les liens texte.
- **Impact :** Les utilisateurs au clavier ne savent pas quel lien est focalisé ; l'effet d'opacité réduit aussi le contraste.
- **Reco :** Gérer hover et focus en CSS et garantir un contraste AA dans tous les états.

### A4 — Glyphes décoratifs sans traitement aria cohérent — SOUHAITABLE
- **Fichier :** app/scanner/page.tsx (l. 243, 207/270), app/atelier/page.tsx (l. 180), app/tarifs
- **Problème :** De nombreux glyphes Unicode/emoji servent d'icônes ; certains sont aria-hidden, d'autres non (ex. l'emoji appareil photo lu à voix haute avant le libellé du bouton).
- **Impact :** Lecture parasite et incohérente par les lecteurs d'écran.
- **Reco :** Harmoniser : aria-hidden sur tous les glyphes purement décoratifs.

### A5 — Zone de dépôt du scanner : un `<label>` natif serait plus robuste — SOUHAITABLE
- **Fichier :** app/scanner/page.tsx (l. 212-219)
- **Problème :** La zone de dépôt est un `<div role="button" tabIndex=0>` qui ouvre le sélecteur de fichier (correct au clavier), mais un `<label>` lié à l'input serait plus fiable pour l'accessibilité.
- **Impact :** Sémantique perfectible pour les technologies d'assistance.
- **Reco :** Envisager un `<label>` lié à l'input file.

---

## Ce qui fonctionne déjà bien
Le socle technique n'est pas en cause — plusieurs bonnes pratiques sont déjà en place et méritent d'être conservées : la gestion de prefers-reduced-motion (animations réduites pour les personnes sensibles au mouvement), un skip-link de navigation, un focus ring de marque, un retour tactile :active sur mobile, et un balisage SEO/JSON-LD soigné. Le problème principal n'est pas le manque d'effort, mais l'incohérence et le code mort (ThemeToggle non monté, Fredoka non chargée, page /garde-robe orpheline).

---

## Plan d'action suggéré
Ordre de traitement recommandé, du plus rentable au plus fin :

| Priorité | Points | Effet attendu |
|---|---|---|
| 1. CRITIQUES | N1, N2, N3, D1, D2, D3, M1 | Déverrouille la navigation (surtout mobile), fige l'identité visuelle, rend le mode nuit utilisable. |
| 2. IMPORTANTS | N4-N6, D4-D6, M2-M5, A1-A3 | Homogénéise les parcours et les boutons, corrige les zones tactiles et l'accessibilité clavier. |
| 3. SOUHAITABLES | N7, D7, M6-M8, A4-A5 | Finitions : perf des polices, installation, mode nuit natif, détails a11y. |

_Audit en lecture seule — aucun fichier du projet n'a été modifié._
