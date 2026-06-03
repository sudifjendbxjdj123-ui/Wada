# WADA — Pitch investisseur complet

**Confidentiel · Juin 2026 · Genève**

Document de présentation à destination d'investisseurs (business angels, pre-seed funds, family
office). Ne pas diffuser publiquement.

Contact : Nemanja Milosevic — hello@wada.style — +41 78 239 50 21

---

## 1. Executive Summary (one-pager)

**WADA** transforme les 348 palettes de couleurs du peintre japonais **Sanzo Wada** (1933) en
**tenues complètes prêtes à acheter**. Un utilisateur scanne une couleur — un mur, un coucher de
soleil, une chaussure — et WADA compose la tenue assortie autour, avec les vraies pièces des
marques partenaires. C'est entre **Pinterest et un styliste personnel**, mais avec achat
intégré et cohérence éditoriale.

**État aujourd'hui** :
- Site en production sur wada.style
- 348 palettes digitalisées et indexées
- 3 partenariats affiliation actifs : **MUJI France**, **The Business Fashion** (qui revend
  200+ marques luxe — Tom Ford, Brunello Cucinelli, Amiri, Birkenstock, Rick Owens, Jacquemus,
  Comme des Garçons…) et **The Shirt Company**
- **14 433 produits luxe homme** disponibles via TBF + 6 500 produits MUJI + 729 produits Shirt Co
- **Stripe Live activé** — peut accepter les paiements abonnement Premium
- Vidéo de lancement Wes Anderson + claymation terminée (50 sec)
- Pages légales rédigées, prêtes à publier
- 170+ livrables produits/specs accumulés en ~6 semaines

**Métrique cible 12 mois** : 50 000 visiteurs/mois, 1 500 abonnés Premium, revenu mensuel 8-15 k€.

**Demande de financement** : **80-150 k€ en pre-seed** pour 12-18 mois, dilution 8-12%.
Usage : 1 développeur full-stack senior + marketing organique + 12 partenariats marques + relations
presse.

---

## 2. Vision

> *« S'habiller ne devrait pas demander tant d'énergie. WADA enlève la décision en gardant le
> goût. »*

**La douleur** : 90% des gens passent du temps devant leur armoire sans savoir quoi mettre. Les
solutions actuelles (Pinterest, Instagram, magazines) inspirent mais ne traduisent pas en achat
concret. Les sites e-commerce mode (Lyst, Stylight) cataloguent mais sans cohérence éditoriale.
Les box stylistes (Stitch Fix US) demandent confiance et délai. Les IA mode généralistes
(ChatGPT) ne lient pas à de vrais produits.

**La solution WADA** : un système qui prend la décision pour le client, basé sur 90 ans de
théorie de la couleur de Sanzo Wada, et qui propose la tenue à acheter en 3 clics.

**Le moat** :
1. **348 palettes propriétaires** issues d'une œuvre culturelle reconnue (Sanzo Wada, 1933 —
   domaine public, mais le travail d'indexation, de naming culturel, et de mise en système est
   un asset)
2. **Composer IA cohérent** (5 garde-fous indépendants spec'd, en cours d'implémentation)
3. **Intégration profonde des flux Awin** (14k+ produits luxe homme via TBF en synchro quotidienne)
4. **Identité éditoriale forte** (chubby Fredoka + 和田 + couleurs Sanzo Wada)
5. **Bilingue FR/JP** par construction

---

## 3. Marché

### Taille du marché

**Marché de la mode en ligne (B2C)** :
- France : ~22 milliards € (Fevad 2025)
- Suisse romande : ~3 milliards €
- Europe : ~210 milliards €

**Segment éditorial + curation + achat (notre niche)** :
- Pinterest mode (en France) : ~10 millions de visiteurs uniques/mois
- Instagram mode : ~15 millions de followers actifs
- Sites éditoriaux mode (The Gentlewoman, Apartamento) : audience qualifiée mais peu monétisée

**Marché de l'affiliation mode** :
- 100% des grandes marques de mode utilisent l'affiliation (Awin, CJ, ShareASale, Tradedoubler)
- Commission moyenne mode : **5-12%** du panier
- Panier moyen mode haut/mid : **150-400 €**
- Commission moyenne par vente : **15-40 €**

### Tendances qui jouent pour WADA
1. **Fatigue du scroll Pinterest** → besoin de moteurs qui décident
2. **Désir de slow fashion** → palette éditoriale > catalogue infini
3. **Boom de l'IA générative grand public** → l'idée de "mon styliste IA" devient acceptable
4. **Recherche par image (Google Lens, Pinterest Lens)** → habitude du scan
5. **Affiliation Premium** → marques luxe (Brunello, Tom Ford) acceptent enfin les programmes

---

## 4. Produit — ce qui existe AUJOURD'HUI

### Site live sur wada.style

**Pages opérationnelles** :
- Accueil avec hero vidéo
- Grille des **348 palettes** (filtres : Neutres, Chauds, Froids, Terreux, Vifs, Pastels, Sombres)
- Page palette individuelle (template appliqué aux 348)
- Scanner couleur (essentielles + upload photo)
- Scanner vêtement (en cours, sans Vision IA encore)
- Styliste IA (script, à brancher au LLM)
- Favoris
- Compte / Abonnement
- Découverte, Cultures, FAQ, À propos, Tarifs

**Infrastructure** :
- Hébergement Vercel (Next.js 14)
- Base de données Postgres (Vercel Postgres ou Supabase)
- Vercel Blob pour les images mirror
- Vercel KV (Redis) pour le cache produits
- Stripe Live (compte CHF, produit WADA+ Mensuel 1,99€ + 7 jours essai gratuit configuré)
- OpenAI API key (pour le styliste IA + vision)
- Resend ready pour les emails transactionnels

### Catalogue produits

| Marque / Source | Produits | Type | Statut |
|---|---|---|---|
| **MUJI France** | 6 542 | Basiques minimalistes japonais | ✅ Actif |
| **The Business Fashion** | 14 433 | 200+ marques luxe homme (Tom Ford, Brunello, Amiri, Birkenstock, Rick Owens, AMI Paris, Jacquemus, Comme des Garçons, Givenchy, Stone Island, Off-White, Polo Ralph Lauren…) | ✅ Actif |
| **The Shirt Company** | 729 | Chemises et chemisiers femme premium | ✅ Accepté |
| **Kastner & Öhler** | (en cours) | Multi-marques premium Suisse/Autriche | 🔄 En cours |
| **Atelier du diamant** | 26 157 | Bijouterie diamant | 🔄 Candidaté |

**Total accessible actuellement : ~22 000 produits**, en croissance.

### Identité de marque

- **Logo** : WADA 和田 (chubby Fredoka + kanji japonais)
- **Palette** : crème #f4eee4, bordeaux #6e3b32, olive #6f7a3f
- **Typographie** : Fredoka (titres) + Inter (corps)
- **Tone of voice** : éditorial, calme, cultivé (cf. system prompt styliste IA)
- **Univers** : Wes Anderson + Japon + Genève

### Contenu marketing

- **Vidéo de lancement Wes Anderson + claymation** (50 sec, format 1:1)
  Compose en 10 plans stop-motion : magasin → cliente → scan → palettes japonaises → tenue
  composée → logo 和田 au pinceau encre
- Comptes sociaux créés : Instagram, Pinterest, TikTok (@wadastyle)
- 348 palettes prêtes à indexer pour SEO

### Spécifications & livrables produit

**170+ livrables réalisés** en 6 semaines, dont :
- 5 specs IA approfondies (composer, personnalité styliste, traduction dimensions, garde-robe
  capsule, validation LLM)
- 600 lignes de code TypeScript prêt à coller pour le composer
- 20+ maquettes HTML interactives (page palette, page tenue, scanner plein écran, accueil,
  sélecteur de dimensions, etc.)
- Pages légales complètes (Mentions, CGU, CGV, Confidentialité RGPD, Cookies)
- Plan de lancement 14 jours
- Newsletter "Lettre du dimanche" #1 + calendrier éditorial 8 semaines
- Brand book partiel (couleurs, polices, ton)
- Stratégie SEO (sitemap 348 palettes, OG images, structured data)

---

## 5. Traction actuelle

**Côté business** :
- **Utilisateurs actifs** : ~0 (pas encore lancé publiquement)
- **Inscriptions** : ~0 (en attente du lancement)
- **Revenu mensuel** : 0 €
- **Marques partenaires actives** : 3 (MUJI, TBF, Shirt Co)
- **Marques en pipeline** : 5 (Sezane, Sandro, Maje, K&Ö, Net-a-Porter visés)

**Côté produit** :
- Site déployé et navigable
- Infrastructure technique en place (Stripe Live, Awin Publisher 2879911, comptes sociaux)
- Catalogue 22 000+ produits accessibles
- Vidéo de lancement prête

**Côté éditorial** :
- 348 palettes documentées
- Histoire et culture de chaque palette indexées (en cours)
- Vision claire et différenciante

**Honnêteté** : WADA est en **pré-lancement**. Le moment est celui de la dernière ligne droite
avant la mise en production publique. C'est précisément à ce moment qu'un investissement est
critique pour accélérer l'exécution.

---

## 6. Business model

### Source de revenu 1 — Affiliation (principal)

- Commission par vente affiliée : **5-12%** selon les marques
- Cookie duration : 30 jours (standard Awin)
- Pas de coût pour le client (prix identique au site marchand)
- Modèle prouvé (Lyst, Stylight, magazines mode)

**Projection unitaire** :
- Panier moyen WADA estimé : **300 €** (mix luxe TBF + mid-MUJI)
- Commission moyenne : **8%** = **24 €/vente**
- Taux de conversion visiteur → cliqueur Awin : **3-5%**
- Taux de conversion cliqueur → acheteur : **5-10%** (moyennes Awin secteur)

### Source de revenu 2 — Abonnement Premium

- **WADA+ Mensuel** : 1,99 €/mois (7 jours essai gratuit)
- **WADA+ Annuel** : 17,99 €/an (équivalent 1,50 €/mois)
- Fonctionnalités Premium :
  - Compositions illimitées
  - Cultures détaillées
  - Sauvegardes illimitées
  - Calendrier hebdomadaire (Compose ma semaine)
  - Style transfer depuis image
  - Newsletter étendue

**Marge** : ~92% (déductions Stripe 2,9% + ~2-3% infrastructure / serveur)

### Source de revenu 3 (futur) — Placements de marque éditoriaux

À horizon 18-24 mois, quand WADA a une audience qualifiée. Format : *« Marques d'ici »* ou
*« Palette du mois »* avec mise en avant rémunérée. Tarif estimé : 500-2000 € / placement /
semaine.

---

## 7. Projections financières

### Scénario conservateur (12 mois après lancement)

| Métrique | Mois 3 | Mois 6 | Mois 12 |
|---|---|---|---|
| Visiteurs uniques / mois | 1 500 | 5 000 | 15 000 |
| Clics affiliation / mois | 45 | 200 | 600 |
| Ventes affiliées / mois | 3 | 15 | 50 |
| Revenu affiliation / mois | 72 € | 360 € | 1 200 € |
| Abonnés Premium | 5 | 25 | 100 |
| Revenu Premium / mois | 10 € | 50 € | 200 € |
| **Revenu total / mois** | **82 €** | **410 €** | **1 400 €** |
| **Cumul annuel** | — | — | **~6 500 €** |

### Scénario réaliste (avec un dev + marketing)

| Métrique | Mois 3 | Mois 6 | Mois 12 |
|---|---|---|---|
| Visiteurs uniques / mois | 8 000 | 30 000 | 80 000 |
| Clics affiliation / mois | 320 | 1 500 | 4 800 |
| Ventes affiliées / mois | 25 | 120 | 480 |
| Revenu affiliation / mois | 600 € | 2 880 € | 11 500 € |
| Abonnés Premium | 50 | 300 | 1 500 |
| Revenu Premium / mois | 100 € | 600 € | 3 000 € |
| **Revenu total / mois** | **700 €** | **3 480 €** | **14 500 €** |
| **Cumul annuel** | — | — | **~85 000 €** |

### Scénario optimiste (viral + presse + bonne exécution)

| Métrique | Mois 3 | Mois 6 | Mois 12 |
|---|---|---|---|
| Visiteurs uniques / mois | 25 000 | 100 000 | 300 000 |
| Clics affiliation / mois | 1 000 | 5 000 | 18 000 |
| Ventes affiliées / mois | 100 | 500 | 1 800 |
| Revenu affiliation / mois | 2 400 € | 12 000 € | 43 200 € |
| Abonnés Premium | 200 | 1 500 | 6 000 |
| Revenu Premium / mois | 400 € | 3 000 € | 12 000 € |
| **Revenu total / mois** | **2 800 €** | **15 000 €** | **55 200 €** |
| **Cumul annuel** | — | — | **~330 000 €** |

### Hypothèses sous-jacentes

- Acquisition principalement organique (TikTok, Pinterest, presse mode, bouche-à-oreille)
- Mix 60% mid-market, 40% Premium luxe (panier moyen pondéré ~300 €)
- Pas de levée Series A — autofinancement post-lancement
- Une marque ajoutée par mois en moyenne (= 12 nouvelles partenaires à 12 mois)

---

## 8. Coûts (12 mois)

### Coûts engagés à ce jour

| Poste | Montant |
|---|---|
| Domaine wada.style | ~50 € (acheté il y a quelques mois) |
| Vercel hobby tier | 0 € (gratuit) |
| Stripe (frais variables) | 2,9 % par transaction |
| OpenAI API (tests) | ~30 € |
| Comptes sociaux | 0 € |
| Vidéo Wes Anderson (Kling AI + CapCut) | 0 € (créée en interne) |
| **Total engagé** | **~80 €** |

### Coûts récurrents prévisionnels (mensuel)

| Poste | Coût mensuel |
|---|---|
| Vercel Pro (production) | 20 € |
| Vercel Postgres / Blob / KV | ~30 € |
| OpenAI API (styliste + vision) | ~80 € (montera avec usage) |
| Resend (emails) | 0 € jusqu'à 3 000 mails/mois, puis 20 € |
| Stripe (frais variables) | 2,9 % du revenu |
| Apple Developer (si app native) | ~8 €/mois (99 €/an) |
| Google Play | ~2 €/mois (25 € one-time) |
| **Sous-total infra** | **~140 €/mois** |

### Coûts non-récurrents

| Poste | Montant |
|---|---|
| Relecture juridique avocat (CGV/RGPD) | ~200 € |
| Logo + brand kit final | déjà fait (interne) |
| App icons (Fiverr) | 30 € |
| **Sous-total ponctuel** | **~230 €** |

### Coûts marketing (organique)

- Création vidéos TikTok : interne (gratuit, mais demande du temps)
- Posts Instagram/Pinterest : interne
- Newsletter (Resend) : ~0 € jusqu'à 3 000 abonnés
- Pas de pub payante prévue en année 1

### Coûts humains

| Profil | Coût | Justification |
|---|---|---|
| Fondateur (Nemanja) | Salaire différé / equity | Plein temps sur le projet |
| Développeur full-stack senior | **4 000-6 000 €/mois** ou freelance ~600 €/jour × 8 jours/mois | Pivot critique du projet |
| Stratégie / marketing | 0 € (Nemanja) | À internaliser |
| Designer freelance ponctuel | 500-1 000 €/mois | Pour soigner les visuels |

**Total coûts opérationnels mensuels (avec 1 dev)** : **4 700-7 200 €/mois**
**Total annuel** : **56 000-86 000 €**

---

## 9. Demande de financement

### Demande pre-seed : **80 000 - 150 000 €**

**Usage des fonds** :

| Poste | Montant | Pourcentage |
|---|---|---|
| Développeur full-stack senior (12 mois) | 60 000 € | 50% |
| Marketing organique (création contenu, freelance vidéo, influence) | 18 000 € | 15% |
| Infrastructure (Vercel, OpenAI, Resend, Stripe) | 4 800 € | 4% |
| Légal + comptabilité + assurance | 6 000 € | 5% |
| Outreach marques + déplacements | 6 000 € | 5% |
| App native iOS + Android (mois 4-6) | 15 000 € | 12% |
| Salaire fondateur réduit | 10 200 € | 9% |
| **Total** | **120 000 €** | **100%** |

### Dilution proposée

- **Pre-seed** : 80-150 k€ pour **8-12% du capital**
- Valorisation pre-money : **~1 M€**
- Pacte d'actionnaires standard (BSA-AIR ou simple agreement) pour minimiser les frais juridiques

### Pourquoi maintenant ?

- **Tout est prêt techniquement** sauf le composer IA à brancher (3 jours de dev)
- **Stripe Live actif** : peut accepter les paiements ce soir
- **22 000 produits accessibles** via 3 partenaires affiliation
- **Vidéo de lancement faite** : peut être publiée demain
- **Pages légales rédigées** : conformité RGPD prête
- L'investissement permet d'**accélérer 4 mois de travail en 6 semaines** et de capturer
  l'audience avant les concurrents (qui n'existent pas dans cette niche éditoriale)

### Sortie envisagée

- Pas de sortie pré-mature visée
- Horizon 5-7 ans pour considérer une acquisition par un acteur mode (Pinterest, Vogue,
  Mr Porter, ou un retailer suisse type Globus) ou une Series A
- Potentiel de scaling international à terme (multilingue : déjà bilingue FR/JP par construction,
  EN/DE/ES extensible)

---

## 10. Équipe

### Fondateur

**Nemanja Milosevic** (1992, Genève)
- Vision produit et exécution complète depuis 6 semaines
- 170+ livrables réalisés en solo (avec assistance IA)
- Maîtrise du sourcing partenaires (3 marques actives, 5 en pipeline)
- Bilingue FR/EN
- Présent à Genève (avantage culturel et géographique pour Suisse/France)

### Postes à pourvoir avec le financement

- **1 développeur full-stack senior** (TypeScript, Next.js, Stripe, IA) — priorité 1
- **1 freelance designer / vidéo** ponctuel pour contenus mensuels
- Éventuellement un partenaire éditorial / styliste à 6-12 mois

### Conseil consultatif visé

- 1 expert mode (ex. ancien acheteur d'un grand magasin)
- 1 expert e-commerce (ex. ancien Lyst / Mr Porter)
- 1 expert IA produit (ex. ancien Stitch Fix)

---

## 11. Roadmap 12 mois

### Mois 1 (juin 2026) — Lancement minimum viable
- Fixer les 3 bugs critiques (composer, photos, genre)
- Publier vidéo Wes Anderson sur TikTok + Instagram + Pinterest
- Activer pages légales
- Premier numéro newsletter "Lettre du dimanche"
- Premiers tests utilisateurs (10 amis)
- Première facturation Premium effective (~10 abonnés)

### Mois 2-3 — Stabilisation et premiers retours
- Implémenter le composer IA complet (cf. specs livrées)
- Brancher la vision API pour le scanner vêtement
- Newsletter hebdomadaire effective
- Premiers 1 500-5 000 visiteurs/mois
- 2 nouvelles marques (Sezane visée, Sandro visée)
- Premières commissions Awin perçues

### Mois 4-6 — Scaling produit
- App PWA installable iOS + Android
- Vraies projections financières basées sur data réelle
- 3 nouvelles marques (Net-a-Porter ou Farfetch côté femme luxe)
- Premier coverage presse mode (Madame Figaro, Vogue, Sortir à Genève)
- 30 000 visiteurs/mois
- 300 abonnés Premium

### Mois 7-9 — App native + croissance
- App native iOS + Android (React Native via Expo)
- Implémentation "Compose ma semaine"
- Style transfer depuis image
- 50 000 visiteurs/mois
- 800 abonnés Premium

### Mois 10-12 — Préparation Series A ou rentabilité
- 80 000+ visiteurs/mois
- 1 500+ abonnés Premium
- Revenu mensuel > 10 000 €
- Décision : Series A ou autofinancement
- Préparation expansion internationale (DE, EN)

---

## 12. Risques et atténuations

| Risque | Probabilité | Impact | Atténuation |
|---|---|---|---|
| Composer IA cassé empêche la conversion | Moyenne | Critique | Specs prêtes + code TypeScript + plan de fix immédiat |
| Marque partenaire majeure se retire | Faible | Modéré | 3 actives + pipeline diversifié, modèle Awin standard |
| Concurrent lance un produit similaire | Faible | Modéré | Moat éditorial Sanzo Wada + 348 palettes propriétaires |
| Apple/Google App Store refuse l'app | Moyenne | Faible | PWA en backup, contournements connus |
| Conformité RGPD problématique | Faible | Modéré | Pages légales rédigées, à valider par avocat |
| Bug de paiement Stripe | Faible | Modéré | Mode test exhaustivement utilisé, webhook configuré |
| Audience ne convertit pas en abonnement | Moyenne | Modéré | Site reste gratuit, abonnement = upsell, modèle freemium classique |
| Dev unique = bus factor élevé | Élevée | Critique | Documentation exhaustive + code TypeScript reproductible |

---

## 13. Annexes

### A. Liste des spécifications déjà rédigées

- `WADA-logique-composition-tenue.md` — Règles de composition
- `WADA-logique-IA-renforcee.md` — Pipeline 8 couches
- `WADA-styliste-IA-personnalite-raisonnement.md` — Persona styliste + system prompt LLM
- `WADA-IA-traduction-dimensions-tendances.md` — UI → algorithme
- `WADA-IA-avancee-garderobe-image-morpho.md` — Features différenciantes
- `WADA-composer-CODE-PRET.ts.md` — 600 lignes TypeScript prêtes à coller
- `WADA-pages-legales-completes.md` — Tous les textes juridiques
- `WADA-toujours-proposer-tenue.md` — UX dégradation gracieuse
- `WADA-flux-TBF-message-codeur.md` — Intégration The Business Fashion
- `WADA-tenues-coherentes-preuve.md` — 6 exemples de tenues composées à la main
- `WADA-lettre-du-dimanche-N1.md` — Newsletter prête à envoyer
- ...plus 160+ autres documents (specs, maquettes HTML, mails partenaires, mockups vidéo)

### B. Maquettes HTML interactives produites

20+ maquettes navigables, dont :
- Page accueil épurée
- Page palette dimensions pro
- Page tenue avec V1/V2/V3 carrousel
- Scanner plein écran type app
- Sélecteur tenue (4 dimensions + résumé + CTA)
- À propos refondue
- Comparatif visuel avant/après pour chaque page

### C. Vidéo de lancement

50 secondes, format 1:1, stop-motion claymation + Wes Anderson :
- 10 plans cohérents
- Génération via Kling AI + assemblage CapCut
- Disponible en MP4, prête à publier sur TikTok / Instagram / Pinterest

### D. Comptes sociaux configurés

- TikTok : `@wadastyle`
- Instagram : `@wadastyle`
- Pinterest : `pinterest.com/wadastyle/`

### E. Partenariats Awin confirmés

- Publisher ID : **2879911**
- MUJI France (Advertiser 84713) — actif
- The Business Fashion (Advertiser 78164) — actif
- The Shirt Company (Advertiser 115010) — accepté
- + candidatures en cours : Atelier du diamant, Kastner & Öhler

### F. Infrastructure technique

- Stack : Next.js 14 + TypeScript + Postgres + Stripe + OpenAI
- Hébergement : Vercel
- Stockage : Vercel Blob (images mirror) + Vercel KV (cache)
- Domaine : wada.style (avec www.wada.style en redirection)
- Stripe : compte CHF en mode Live activé, webhook configuré
- Awin Publisher : vérifié et opérationnel

---

## 14. Conclusion

WADA est à un point d'inflexion rare : **toute la structure produit, technique et stratégique est en
place**, le marché est mûr (fatigue des moteurs de recherche, désir de curation, normalisation de
l'IA), les partenariats clés sont signés (3 marques actives, 200+ marques de luxe revendues via
TBF), et le projet a une **identité visuelle unique** dans le paysage mode francophone.

Ce qu'il reste à faire pour atteindre un revenu mensuel récurrent autour de 10-15 k€ dans 12 mois
n'est pas une question de *quoi*, mais de *vitesse d'exécution*. Un investissement pre-seed
permettrait d'engager un développeur senior pour finaliser le produit en 3-4 semaines au lieu de
3-4 mois, et de capturer l'audience pendant la fenêtre d'opportunité de lancement.

**Le risque pour un investisseur n'est pas l'idée, ni le produit, ni le marché. C'est uniquement
la vitesse d'exécution.** L'investissement résout exactement ce point.

---

**Contact**

Nemanja Milosevic
Fondateur — WADA
hello@wada.style
+41 78 239 50 21
Rue des Vollandes 66, 1207 Genève

[wada.style](https://wada.style) · [Instagram](https://instagram.com/wadastyle) ·
[TikTok](https://tiktok.com/@wadastyle) · [Pinterest](https://pinterest.com/wadastyle)

---

*Document préparé le 1er juin 2026. Données actualisables sur demande.*
