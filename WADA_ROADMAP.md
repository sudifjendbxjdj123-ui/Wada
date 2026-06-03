# WADA · Roadmap Stratégique Complète

*Dernière mise à jour : mai 2026*

---

## 🎯 Ce qui est FAIT aujourd'hui dans le site

✅ Hero clair : "Find the colors that go together, and where to buy them"
✅ Section "How it works" en 3 étapes
✅ 6 inspirations culturelles (English, French, Japanese, African, Indian, Mexican) avec figurines crayonnées
✅ Color Scanner fonctionnel (sélecteur HTML5 + matching algorithmique des palettes)
✅ Système freemium : 2 scans gratuits puis paywall premium 2,99€/mois
✅ Le Cabinet (formulaire enrichi + résultats avec illustrations crayon)
✅ 20 entrées du dictionnaire avec compositions complètes
✅ Boutons "Acheter" sur chaque pièce → Vinted / Zalando / H&M / Zara (recherches pré-filtrées en français)
✅ Page pricing avec plans Free vs Premium
✅ Footer minimal moderne (4 colonnes)
✅ Touches japonaises subtiles (和田 + 色彩辞典 + sceau hanko rouge)
✅ Sélecteur de langues (placeholder)

---

## 🚧 CE QUI RESTE À CONSTRUIRE (par priorité)

### 🥇 PHASE 1 — FONCTIONNALITÉS TECHNIQUES MANQUANTES (3-6 semaines)

#### 1. Authentification + Compte utilisateur
**Outils :** [Clerk](https://clerk.com) ou [Auth.js](https://authjs.dev) (gratuits jusqu'à 10k users)
**Pourquoi :** sans compte, impossible de tracker les scans/abonnements/favoris
**Effort :** 1 semaine

#### 2. Paiements & abonnements (Stripe)
**Outils :** [Stripe Subscriptions](https://stripe.com/billing) — 2,9% + 0,30€ par transaction
**Effort :** 1 semaine
**Setup :**
- Créer un produit "WADA Premium" à 2,99€/mois
- Webhook Stripe → mise à jour DB de l'abonnement
- Gating côté serveur (pas juste localStorage)

#### 3. Base de données
**Outils :** [Supabase](https://supabase.com) (PostgreSQL gratuit jusqu'à 500MB) ou [Vercel Postgres](https://vercel.com/storage/postgres)
**Tables minimales :**
- `users` (id, email, premium_until, created_at)
- `scans` (id, user_id, color_hex, created_at)
- `favorites` (id, user_id, entry_number, created_at)
**Effort :** 1 semaine

#### 4. Vrai scanner de couleur (caméra + OCR)
**Outils :** API navigateur `MediaDevices.getUserMedia()` + librairie [color-thief](https://lokeshdhakar.com/projects/color-thief/)
**Comment :** l'utilisateur prend une photo, on extrait la couleur dominante
**Effort :** 2-3 jours
**Plus avancé :** Google Cloud Vision API ou [Hugging Face](https://huggingface.co) pour reconnaissance vêtement

#### 5. Système d'affiliation réel
**Programmes à rejoindre (ordre d'approbation) :**
1. **Awin** — Zalando, ASOS, Sephora, La Redoute (gratuit, approbation 1-2 semaines)
2. **Affilae** — H&M, Vinted, Sandro (français, ~1 semaine)
3. **Amazon Partenaires** — large catalogue (instantané, mais 3% commission)
4. **rewardStyle / LTK** — fashion premium (plus sélectif)
**Effort :** 2-3 semaines incluant approbations

#### 6. Multi-langues (i18n)
**Outils :** [next-intl](https://next-intl-docs.vercel.app/) avec routes localisées (`/fr`, `/en`, `/ja`...)
**Langues prioritaires (10 plus grand marché mode) :**
1. Anglais (US, UK)
2. Français (FR, CA, BE, CH)
3. Espagnol (ES, MX, AR)
4. Allemand (DE, AT, CH)
5. Italien (IT)
6. Japonais (JP)
7. Portugais (BR, PT)
8. Néerlandais (NL, BE)
9. Hindi (IN)
10. Arabe (UAE, SA)
**Effort :** 1 jour de mise en place + 2-4 semaines de traductions

---

### 🥈 PHASE 2 — DIFFÉRENCIATION PRODUIT (1-3 mois)

#### Avatar / Wardrobe Builder interactif
- SVG mannequin avec slots cliquables (haut, bas, sous-vêtement, chaussures, accessoires)
- L'utilisateur compose en cliquant sur des pièces → l'avatar se met à jour
- Sauvegarde des looks dans le compte
**Effort :** 2-3 semaines

#### Mode "Inspiration traditionnelle" enrichi
- Pour chaque culture : 5-10 entrées spécifiques au pays
- Mini-articles éducatifs sur l'histoire du costume
- Photos d'archives (Wikimedia Commons gratuit)

#### IA générative pour palettes personnalisées
- Au lieu de matching dans 20 entrées prédéfinies, génère à la volée
- Outil : Claude API (Anthropic) ou OpenAI GPT — ~0,001€ par génération
- "Génère-moi une palette inspirée du Maroc pour un mariage en automne"

#### Mode mobile natif
- PWA d'abord (installable depuis le navigateur, push notifications)
- Plus tard : React Native pour App Store / Play Store

---

### 🥉 PHASE 3 — SCALE INTERNATIONAL (3-12 mois)

#### Géolocalisation des magasins physiques
- API Google Places : trouve les magasins de mode autour de l'utilisateur
- "Pour cette palette Old Money, le Massimo Dutti le plus proche est à 1,2 km"

#### Photos de produits réelles
- Option payante : SerpAPI Google Shopping (~50€/mois pour 5000 requêtes)
- Affiche de vraies photos de produits sous chaque pièce

#### Marketplace utilisateurs
- Les utilisateurs partagent leurs propres compositions
- Système de likes / suivi
- Featured looks de la semaine

---

## 💰 MODÈLE ÉCONOMIQUE COMPLET

### Revenus directs (récurrents)

| Source | Prix | Audience cible | Revenu/mois (1 000 users) |
|--------|------|----------------|---------------------------|
| **Premium subscription** | 2,99 €/mois | 5-10 % conversion | 150 – 300 € |
| **Annual plan** | 24,99 €/an (–30 %) | 30 % des premium | bonus |
| **WADA Pro** (stylistes) | 14,99 €/mois | usage pro, sauvegardes illimitées, export PDF | 50 – 100 € |

### Revenus indirects (variables)

| Source | Marge | Potentiel |
|--------|-------|-----------|
| **Affiliation Awin (Zalando, ASOS)** | 3 – 8 % | 200 – 800 €/mois (10k visites) |
| **Affiliation Amazon** | 3 % | 100 – 400 €/mois |
| **Affiliation H&M / Vinted** | 5 – 10 % | 150 – 500 €/mois |
| **Sponsored palettes** (à terme) | 500 – 2 000 €/sponsor | dès 50k visites/mois |

### Projections sur 12 mois (réalistes)

- **Mois 1-3** : 500 – 2 000 visiteurs/mois, 0 € premium, 50-200 € affiliation
- **Mois 4-6** : 5 000 – 20 000 visiteurs, 50-300 € premium, 300-800 € affiliation
- **Mois 7-12** : 50 000 – 100 000 visiteurs, 500-2 000 € premium, 1 500-5 000 € affiliation

**Total an 1 réaliste :** entre 5 000 € et 30 000 € de revenus si SEO + réseaux sociaux suivis

---

## 📈 PLAN DE CROISSANCE (RENDRE WADA CONNU)

### Mois 1-3 : Fondations

#### SEO technique (gratuit, fait une seule fois)
- Sitemap XML + robots.txt
- Schema.org markup pour les palettes (rich snippets Google)
- Open Graph tags pour partage social (chaque palette devient partageable avec aperçu visuel)
- Page speed > 90 Lighthouse
- Backlinks naturels via inscription sur :
  - Product Hunt
  - Indie Hackers
  - It's Nice That ([itsnicethat.com/submit](https://www.itsnicethat.com))
  - Designer News
  - r/SideProject

#### Contenu organique
- **TikTok / Instagram Reels** — comptes inspirés de [@dailyfashionhistory](https://www.tiktok.com/@dailyfashionhistory) :
  - 1 vidéo/jour : "Today's palette: Storm & Sunset → 3 ways to wear it"
  - Format : montage rapide, voix off, musique tendance
  - Objectif : 10k followers en 3 mois
- **Pinterest** — *énorme pour la mode*, sous-utilisé par les apps :
  - Chaque palette = 1 pin avec image + lien
  - Objectif : 500k vues/mois en 6 mois

#### Newsletter
- Outil : [Buttondown](https://buttondown.email) (gratuit jusqu'à 100 abonnés)
- Format : 1 palette par semaine, le dimanche
- Cible 1 000 abonnés en 3 mois

### Mois 4-6 : Acquisition payante (test)

- **Meta Ads (Instagram)** : 5-10 €/jour ciblant 25-40 ans intéressés mode
- **TikTok Ads** : creative boostée
- **Google Ads** : mots-clés "color palette outfit", "what to wear with..."

Budget test : 300 €. Si CPA < 2 €/inscription, scaler. Sinon arrêter.

### Mois 7-12 : Partenariats

- **Influenceurs micro** (10k-100k followers) — accord : produit gratuit + commission
- **Bloggers mode** (Medium, Substack) — guest posts
- **Podcasts** (mode, design, lifestyle)
- **Pop-up à Paris / Berlin / Tokyo** — événements physiques avec curation locale
- **Collab avec une marque** — capsule "WADA × [marque]" pour buzz

### Mois 12+ : Presse

- Pitch à Vogue, Kinfolk, It's Nice That, Apartamento, Wallpaper*
- Demande de couverture quand tu as 100k+ utilisateurs et un angle (genre : "the app inspired by a 1933 Japanese book")

---

## 🌍 STRATÉGIE INTERNATIONALE

### Pays prioritaires (par taille marché mode + facilité)

| Rang | Pays | Population | Pourquoi prioritaire |
|------|------|------------|---------------------|
| 1 | 🇫🇷 France | 68M | Marché mode #1 EU, lancement local |
| 2 | 🇺🇸 US | 333M | Plus grand marché mode mondial |
| 3 | 🇯🇵 Japon | 125M | Affinité culturelle Wada (origine du livre) |
| 4 | 🇬🇧 UK | 67M | Anglais + culture mode forte |
| 5 | 🇮🇹 Italie | 59M | Capitale mondiale style |
| 6 | 🇩🇪 Allemagne | 84M | Plus gros marché EU + Zalando est allemand |
| 7 | 🇪🇸 Espagne | 47M | Zara/Mango natif |
| 8 | 🇧🇷 Brésil | 215M | Marché mode émergent |
| 9 | 🇮🇳 Inde | 1.4B | Énorme potentiel + culture textile riche |
| 10 | 🇲🇽 Mexique | 130M | Marché latam grossissant |

**Tactique :** lance en français + anglais d'abord, puis ajoute 1 langue/mois selon tractions.

### Adaptation locale par pays

Chaque marché doit avoir :
- **Langue traduite**
- **Devise locale** (€, $, £, ¥, R$, ₹...)
- **Magasins locaux dans les liens d'affiliation** (Macy's aux US, John Lewis au UK, Falabella au Mexique)
- **Inspirations culturelles natives** (kimono pour le JP, sari pour l'IN, kente pour le GH)

---

## 🛠️ STACK TECHNIQUE RECOMMANDÉE

| Besoin | Outil | Coût | Pourquoi |
|--------|-------|------|----------|
| Hébergement | **Vercel** (Hobby) | 0 € | Optimisé Next.js, scaling auto |
| Domaine | wada.app ou wada.style | ~30 €/an | court, mémorable |
| DB | **Supabase** | 0 → 25 € | PostgreSQL + Auth gratuits |
| Auth | **Clerk** | 0 → 25 € | drop-in social login |
| Paiements | **Stripe** | 2,9 % + 0,30 € | standard mondial |
| Email | **Resend** | 0 → 20 € | newsletter + transactionnel |
| Analytics | **Plausible** | 9 €/mois | RGPD-compliant, simple |
| Erreurs | **Sentry** | 0 → 26 € | monitoring prod |
| Multi-langues | **next-intl** | 0 € | librairie open source |
| Images stock | **Unsplash API** | 0 € | pour culture/landing |
| Color extract | **color-thief** | 0 € | extraction couleur d'image |
| Search produits | **SerpAPI** | 50 €/mois | (optionnel, plus tard) |

**Coût total mensuel pour démarrer :** ~30 € (Plausible + domaine étalé)
**Coût à 10k MAU :** ~120 € / mois

---

## 🎁 BONUS — IDÉES ADDITIONNELLES

### Partenariats win-win
- **Vinted** : positionner WADA comme "le styliste qui t'aide à acheter d'occasion"
- **Vestiaire Collective** : pour le segment premium
- **Magasins indépendants** : intégrer petits créateurs locaux

### Contenu viral potentiel
- **"Ton outfit selon ton signe astrologique"** — utilise Wada
- **"Ton outfit selon ton MBTI"**
- **"Quelle palette WADA es-tu ?"** — quiz Buzzfeed-style → SEO + social

### Programme ambassadeurs
- Donne 50 % de commission affiliation aux premiers 100 utilisateurs
- Ils partagent → trafic + conversion

### B2B (potentiel énorme à terme)
- API WADA pour boutiques : "afficher la palette WADA à côté de chaque produit"
- White-label pour stylistes professionnels

---

## ✅ CHECKLIST DE LANCEMENT — PHASE 1 (3 mois)

- [ ] Setup auth (Clerk)
- [ ] Setup DB (Supabase)
- [ ] Setup Stripe Premium 2,99 €
- [ ] Vrai scanner photo (color-thief + camera API)
- [ ] Inscription Awin + Affilae + Amazon Partenaires
- [ ] Multi-langues : FR + EN + ES
- [ ] Domaine + déploiement Vercel
- [ ] Plausible Analytics installé
- [ ] Sitemap + Open Graph + Schema.org
- [ ] Compte TikTok @wada.app (1 vidéo/jour)
- [ ] Compte Pinterest @wada.app (5 pins/jour)
- [ ] Newsletter Buttondown active
- [ ] Première soumission Product Hunt

---

## 📞 PROCHAINES ÉTAPES IMMÉDIATES

1. **Acheter le domaine** (wada.app, wada.style ou wada.fashion)
2. **Déployer sur Vercel** (gratuit, 5 minutes)
3. **Setup compte Stripe** + créer produit Premium
4. **S'inscrire à Awin et Amazon Partenaires** (approbation prend 1-2 semaines)
5. **Créer comptes TikTok et Instagram @wada.app**

Quand tu es prêt, on peut attaquer ces 5 étapes ensemble une par une.

---

*Document vivant — à mettre à jour après chaque phase.*
