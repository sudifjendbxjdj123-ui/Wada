# WADA — Ce qu'il reste à faire (audit, mai 2026)

Classé par priorité. Pour chaque item : ce que c'est, pourquoi ça compte, qui le fait.

---

## 🔴 URGENT — avant ouverture au public

### 1. Vérifier wada.style sur Awin
Sans ça, les marques ne valident pas tes candidatures. Meta tag à ajouter par le codeur.
👉 **Codeur** — fichier `WADA-Awin-verification.md` déjà prêt.

### 2. Brancher l'IA Styliste pour de vrai
Aujourd'hui l'assistant est un questionnaire scripté. Il faut connecter un vrai LLM avec le system prompt WADA pour qu'il discute comme un vrai styliste.
👉 **Codeur** — fichier `WADA-IA-styliste-v2.md` déjà prêt (clé `OPENAI_API_KEY` déjà dans Vercel).

### 3. Mini-profil + switcher (personnalisation)
Sans connaître le client (femme/homme, budget, style), les propositions n'ont aucun sens. Onboarding 3 questions + switcher rapide.
👉 **Codeur** — maquette `wada-palette-finale.html` prête à reproduire.

### 4. Page d'accueil : vidéo plein écran sans footer
Tu l'as demandé plusieurs fois, ce n'est toujours pas déployé. Footer rendu globalement → il faut un composant conditionnel.
👉 **Codeur** — fichier `WADA-accueil-footer-fix-technique.md` déjà prêt.

### 5. UNE seule police de titre partout (Fredoka)
Aujourd'hui certaines pages sont encore en serif. Faut un style global `h1..h6 { font-family: Fredoka }` et supprimer toutes les déclarations serif.
👉 **Codeur** — fichier `WADA-UNE-SEULE-POLICE.md` déjà prêt.

### 6. Pages légales obligatoires
Mentions légales, CGV (conditions de vente / d'utilisation), politique de confidentialité, bandeau cookies RGPD. Sans ça, tu es en infraction en France.
👉 **Toi + codeur** — je peux te rédiger les textes, le codeur met en ligne.

### 7. Paiement Stripe pour l'abonnement Premium
1,99€/mois ou 17,99€/an. Sans système de paiement, l'abonnement n'existe pas.
👉 **Codeur** — Stripe + webhook + gestion abonnement (lié au compte utilisateur).

### 8. Authentification basique
Pour les favoris, le profil, l'abonnement. Email + magic link suffit (pas besoin de mot de passe).
👉 **Codeur** — Resend ou Clerk ou NextAuth.

---

## 🟡 IMPORTANT — avant d'annoncer le lancement

### 9. Plus de marques acceptées sur Awin
Aujourd'hui MUJI confirmée. Les autres candidatures (Lacoste, Suitsupply, Smallable, adidas, JW PEI, etc.) sont en attente. Suivre, relancer, accepter celles qui répondent.
👉 **Toi** — tableau `WADA-Awin-suivi-marques.xlsx` à tenir à jour.

### 10. Présence Instagram + Pinterest active
WADA = visuel. Pas de présence = pas de découverte organique. Quelques premiers posts/pins pour démarrer.
👉 **Toi** — je peux te préparer 10 idées de posts et de pins.

### 11. Analytics (savoir ce qui se passe)
Vercel Analytics (gratuit, en 1 clic) ou Plausible (payant, plus éthique). Pour savoir combien de visiteurs, d'où, sur quelles pages, combien de clics vers MUJI.
👉 **Codeur** — 10 minutes à activer.

### 12. SEO de base
- Sitemap.xml avec les 348 URL de palettes
- Balise canonical correcte sur chaque page (en `https://wada.style/...`)
- OG image dynamique par palette (preview Facebook/Twitter)
- Données structurées Product sur les pages tenue
👉 **Codeur** — pas long, gros impact pour le référencement Google.

### 13. Emails transactionnels (Resend)
Quand un client s'inscrit, paie l'abonnement, change de profil → un email. Aujourd'hui aucun email part.
👉 **Codeur** — Resend gratuit jusqu'à 100 emails/jour.

### 14. Newsletter « Lettre du dimanche »
Une palette + une tenue chaque dimanche, par email. C'est le canal de fidélisation principal pour ce type de produit.
👉 **Toi + codeur** — Resend ou Buttondown pour l'envoi, toi tu écris la lettre.

### 15. Cohérence sitewide (les bugs récurrents)
- Devise (€ partout, pas CHF qui traîne)
- Libellés bruts type "/compte" affichés
- Mêmes mots partout (Abonnement, pas Commencer)
- Nav identique sur toutes les pages
- PaletteCard unique (plus de variantes)
👉 **Codeur** — fichier `WADA-bugs-retour-et-layout.md` déjà prêt.

### 16. Configurer le paiement Awin (Payoneer/SEPA)
Quand tu commenceras à toucher des commissions, il faut un canal de paiement configuré.
👉 **Toi** — dans Awin > Compte > Paiements.

---

## 🟢 APRÈS LE LANCEMENT — pour grandir

### 17. Profils multiples ("Moi / Ma femme / Pour offrir")
Plus tard, permettre de sauvegarder plusieurs profils et basculer en 1 clic. Le switcher actuel suffit pour démarrer.

### 18. Calendrier WADA
La fonction calendrier dont tu avais parlé (une palette par jour, événements liés aux couleurs). À développer une fois la base solide.

### 19. Section Cultures détaillée
Les 348 palettes ont des origines culturelles (japonaise, anglaise, française…). Enrichir le contenu Culture par Culture, avec mini-articles.

### 20. Monitoring (Sentry)
Pour être alerté quand le site plante chez un utilisateur. Gratuit jusqu'à 5 000 erreurs/mois.
👉 **Codeur** — quand le trafic devient sérieux.

### 21. Press kit + outreach
Quand tu lances, contacter des médias mode (Marie Claire, Madame Figaro, Sortir à Genève…). Un press kit propre (photos, description, citations) à préparer.
👉 **Toi** — je peux te le rédiger.

### 22. Apps mobiles natives (iOS/Android)
La PWA suffit largement pour démarrer. Une app native sera utile si tu dépasses 10 000 utilisateurs actifs.

---

## Ce qui est DÉJÀ FAIT (rappel)

- Domaine wada.style en production sur Vercel
- Flux MUJI intégré (Awin → Blob → tenue) — photos qui marchent
- Pages principales en place (Accueil, Palettes, Scanner couleur, Scanner vêtement, Styliste, Favoris, Découverte, Cultures, Tarifs, À propos, FAQ, Contact, Install)
- Identité visuelle (palette WADA, Fredoka, 和田)
- Spec complète pour l'IA styliste (à brancher)
- Spec onboarding + profil (à coder)
- Tableau de suivi des marques Awin (18 marques listées)
- Messages de candidature préparés (générique FR/EN, premium, homme)

---

## Priorité absolue maintenant

Si tu veux que WADA soit vraiment utilisable et lancé proprement :

1. Vérifier wada.style sur Awin (codeur, 10 min)
2. Brancher l'IA styliste (codeur, 1-2h)
3. Onboarding + profil (codeur, demi-journée)
4. Pages légales (toi + codeur, 1 journée)
5. Stripe + auth (codeur, 1-2 jours)

Avec ces 5 chantiers terminés, WADA passe de "joli prototype" à "vrai produit utilisable et monétisable".

Tu veux que je détaille un de ces points, ou que je rédige les pages légales / le press kit / les premiers posts ?
