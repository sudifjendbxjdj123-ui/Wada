# 📋 WADA — Plan de fonctionnalités

> Document de référence des fonctionnalités à développer pour WADA, classées par priorité.

---

## 📖 LE LIVRE QUI INSPIRE TOUT

**WADA** est une application de mode héritière directe d'un livre japonais publié en 1933 :
**« A Dictionary of Color Combinations »** (色彩辞典 — *Shikisai Jiten*) par **Sanzo Wada** (1883–1967), peintre, créateur de costumes, théoricien de la couleur.

Ce livre, devenu culte chez les designers, contient **348 combinaisons de couleurs** — chacune nommée, numérotée, et présentée sur une page comme une œuvre miniature. Wada y enseigne une philosophie : *la beauté naît de l'harmonie de quelques couleurs choisies, pas de l'accumulation*.

### Ce que WADA reprend du livre

| Le livre | L'application |
|----------|---------------|
| 348 combinaisons numérotées | Dictionnaire d'entrées numérotées (No. 142, No. 087, etc.) |
| Chaque combinaison a un nom poétique | Chaque palette nommée (« Storm & Sunset », « Library »…) |
| Trois couleurs par page | Trois couleurs par palette WADA |
| Approche méditative et lente | UX qui invite à pauser et composer plutôt qu'à scroller |
| Esthétique japonaise sobre | Touches kanji, sceau hanko rouge, palette papier crème |
| Respect des artisans et matières | Conseils textiles, marques curées, mode éthique mise en avant |

### La promesse WADA

> Reprendre l'enseignement de Sanzo Wada — l'art d'assembler quelques couleurs avec intention — et le traduire pour la garde-robe contemporaine.
>
> Plus une application qui dit *« achète ça »*, mais qui dit *« voici une harmonie, à toi de la porter »*.

---

### 🎯 LE PRINCIPE FONDAMENTAL

**WADA n'est PAS un moteur de recherche de vêtements.**
**WADA EST un guide, ancré dans le livre de Sanzo Wada.**

L'utilisateur ne doit jamais avoir l'impression de chercher au hasard. Il est **accompagné, conseillé, éduqué** par le savoir condensé du livre. À chaque interaction :

| Mauvaise expérience | Bonne expérience WADA |
|---------------------|----------------------|
| « Voici 200 vestes, débrouille-toi » | « D'après le livre, ces 3 palettes te vont — voici comment les porter » |
| Liste infinie à scroller | Sélection curée de 4 entrées du dictionnaire |
| L'utilisateur cherche par mot-clé | L'utilisateur est guidé par couleur, occasion, culture |
| Achat impulsif | Composition réfléchie, souvent achat seconde main |
| « Tu pourrais acheter ça » | « Voici l'harmonie — tu décides ensuite où et comment l'incarner » |

**Chaque feature de l'application doit honorer ce principe : l'utilisateur est guidé par le livre, jamais lâché dans une recherche libre.**

---

## 🟢 1. CORE FEATURES (obligatoire)

### 1.1 Le Dictionnaire (cœur du produit)

L'œuvre principale héritée du livre :

- **Entrées numérotées** dans l'esprit des 348 combinaisons originales
- Chaque entrée contient :
  - Un **numéro** (No. 142, No. 213…)
  - Un **nom poétique** (Storm & Sunset, Library, Coastal…)
  - **Trois couleurs** avec nom et hex
  - Une **description sensorielle** courte
  - Une **composition vestimentaire** (top, bottom, outer, shoes, accent)
  - Les **occasions** où la porter
  - La **culture d'inspiration** (italienne, japonaise, anglaise…)

> Objectif long terme : atteindre les **348 entrées** comme dans le livre original.

### 1.2 Scan vêtement

- Upload d'une image
- Détection automatique :
  - Couleur dominante
  - Catégorie (top, pants, shoes…)
- Retour : suggestions de palettes WADA qui s'accordent avec la couleur

> ⚠️ **Important :** scan **illimité** pour tous les utilisateurs (y compris Free).

### 1.3 Outfit Generator (Cabinet)

- L'utilisateur précise : style, occasion, saison, budget, couleurs préférées
- L'algorithme score les entrées du dictionnaire selon la pertinence
- Retourne **4 entrées** (4 pages du dictionnaire) qui correspondent au moment

### 1.4 Catalogue produits (vêtements)

Chaque pièce mentionnée dans une composition doit contenir :

| Champ | Type | Obligatoire |
|-------|------|-------------|
| `id` | string | ✅ |
| `name` | string | ✅ |
| `category` | string | ✅ |
| `style` | string | ✅ |
| `image` | URL | ✅ |
| `price` | number | optionnel |
| `affiliate_link` | URL | ✅ |
| `wada_entry` | string (No.) | optionnel |

### 1.5 Shopping

Trois niveaux d'action sur chaque pièce :

- **« Shop this item »** → redirige vers `affiliate_link`
- **« Shop the full look »** → ouvre tous les liens d'une entrée WADA
- **« Add to Panier »** → enregistre dans le panier WADA

---

## 🟡 2. ENGAGEMENT

### 2.1 Daily Wada Entry

- Une **entrée du dictionnaire** mise en avant chaque jour sur la page d'accueil
- Comme une « page du jour » du livre — invite à la contemplation

### 2.2 Outfit Score

- Note simple sur 10
- Calculée selon la cohérence chromatique (logique inspirée des principes Wada)

### 2.3 Budget Mode

- Choix d'un budget par l'utilisateur (50 € / 100 € / 300 €)
- Filtrage des pièces selon ce prix

---

## 🟠 3. PERSONNALISATION

### 3.1 AI Personal Stylist (Wada-inspired)

- Stockage des préférences utilisateur :
  - Styles favoris
  - Palette de couleurs préférées
  - Cultures qui résonnent (japonaise, française, africaine…)
- Influence directe sur la sélection d'entrées du dictionnaire

### 3.2 Historique

- Sauvegarde des entrées explorées et compositions générées

### 3.3 Favoris

- Marquer les entrées préférées du dictionnaire avec ♥
- Construction d'un **dictionnaire personnel** au fil du temps

---

## 🔵 4. FEATURES AVANCÉES

### 4.1 Scan avancé (optionnel)

- Détection enrichie :
  - Style général
  - Type précis du vêtement (col, coupe, matière)

### 4.2 Closet Import (mon dressing)

- Upload de plusieurs vêtements à la fois
- Stockage en base utilisateur
- L'IA propose alors les **entrées Wada** réalisables avec ce que tu possèdes déjà

### 4.3 Second-hand mode

- Bouton **« Find second-hand »** sur chaque pièce
- Redirection dynamique vers :
  - Vinted
  - eBay
  - Vestiaire Collective
- Aligné avec la philosophie Wada : *moins, mais mieux*

---

## 🟣 5. EXPÉRIENCE

### 5.1 World Style Map (Premium)

- Carte interactive des inspirations culturelles présentes dans le dictionnaire :
  - 🇫🇷 Paris (couture)
  - 🇯🇵 Tokyo (wabi-sabi)
  - 🇬🇧 Londres (Savile Row)
  - 🇮🇳 Jaipur (block-print)
  - 🇲🇽 Oaxaca (textiles indigènes)
  - 🇳🇬 Lagos (wax-print)
  - 🇮🇹 Rome (sprezzatura)
- Chaque zone → entrées Wada qui en sont inspirées

### 5.2 Monthly Outfit Calendar

- Calendrier mensuel
- Possibilité d'assigner une entrée Wada à un jour précis
- Vue « Quelle palette pour quel jour ? »

### 5.3 Wada Reading Room (long terme)

- Pages éditoriales sur Sanzo Wada, son livre, son influence
- Articles courts sur la théorie des couleurs
- Renforce le positionnement éducatif et différenciant

---

## 🔴 6. SOCIAL / VIRAL

### 6.1 Share feature

- Partage d'une entrée Wada via lien ou Open Graph preview
- Format : *« No. 142 — Storm & Sunset · découverte sur WADA »*

### 6.2 Viral entries (optionnel)

- Affichage des entrées Wada les plus partagées / sauvegardées
- Section « What the world is wearing today »

---

## 💰 7. MONÉTISATION

### 7.1 Affiliation (revenu principal)

- Chaque pièce contient un `affiliate_link`
- Toute redirection passe par ce lien
- Programmes recommandés : Awin (Zalando, ASOS), Amazon Partenaires, Affilae

### 7.2 Abonnement (freemium)

#### Plan FREE

- Scan illimité
- Accès complet au dictionnaire (les 348 entrées à terme)
- Compositions limitées (ex : 5 par jour)
- AI Stylist basique
- Shopping complet
- Inspirations culturelles : **2 essais gratuits**

#### Plan PREMIUM (2,99 €/mois)

- Compositions illimitées
- AI Stylist avancé
- Recommandations personnalisées
- Budget Mode avancé
- Monthly Calendar
- Closet Import
- World Style Map complète
- Wada Reading Room
- Sauvegarde illimitée des favoris
- Second-hand optimisé

### 7.3 Paywall

- Déclenchement après usage des fonctionnalités avancées
- Popup d'upgrade clair, élégant, non agressif (cohérent avec l'esprit lent du livre)

---

## ⚙️ TECH STACK

**Frontend :**
- React / Next.js (App Router)

**Backend :**
- Node.js (API Routes Next.js ou serveur séparé)

**Base de données :**
- SQLite ou JSON pour le MVP
- Évolutif vers PostgreSQL (Supabase recommandé)

**Authentification :**
- Clerk ou Auth.js

**Paiements :**
- Stripe Subscriptions

---

## 🎯 OBJECTIF FINAL

Construire WADA comme **l'application de mode la plus inspirée** au monde —
le pont vivant entre un livre japonais de 1933 et la garde-robe contemporaine.

WADA combine :

1. Un **dictionnaire vivant** des combinaisons de couleurs (héritage du livre)
2. Un **AI fashion stylist** qui pense en palettes, pas en pièces
3. Un **moteur de scan vêtements** précis
4. Un **générateur de compositions** personnalisé
5. Une **plateforme de shopping affilié** rémunératrice
6. Un **outil de découverte de styles culturels** mondialement inspiré

---

## 🚀 PRIORITÉ DE DÉVELOPPEMENT

1. **Le Dictionnaire + Outfit Generator + Shopping** (la fondation, esprit du livre)
2. **Daily Wada Entry + Budget Mode** (engagement quotidien)
3. **Affiliation** (revenus dès le premier utilisateur)
4. **Personnalisation + Favoris** (rétention long terme)
5. **World Style Map + Reading Room** (différenciation éditoriale)

---

## 📐 PRINCIPES DE DÉVELOPPEMENT

- ✅ **Honorer Sanzo Wada** : l'esthétique, la philosophie, le rythme
- ✅ Code **propre, modulaire et scalable**
- ✅ Ne **jamais casser** les fonctionnalités existantes
- ✅ Toujours **prévoir l'évolution** future
- ✅ **Lent par défaut** : préférer la profondeur à la quantité
- ✅ Garder le design éditorial (papier crème, sérif, sceau hanko)

---

## 📚 RÉFÉRENCES & RESPECT

- **Sanzo Wada** (1883–1967) — peintre, designer de costumes japonais
- **A Dictionary of Color Combinations** (色彩辞典, 1933) — l'œuvre fondatrice
- **Sanzo Wada Foundation** — pour vérification d'usage commercial du nom à long terme
- Inspiration secondaire : *Werner's Nomenclature of Colours*, Pantone Color Institute

---

*Document version 2.0 — mai 2026*
