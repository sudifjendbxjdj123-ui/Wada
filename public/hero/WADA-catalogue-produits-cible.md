# WADA — Combien de produits faut-il pour répondre à TOUTES les envies ?

Analyse mathématique du catalogue minimum requis pour satisfaire l'ensemble des clients (toutes
palettes, tous genres, tous budgets, toutes envies, toutes occasions, toutes tendances).

---

## Le calcul théorique total

Pour couvrir **chaque combinaison possible** d'inputs client :

| Variable | Valeurs possibles |
|---|---|
| Palettes | 348 |
| Genres | 3 (Femme, Homme, Mixte/Unisexe) |
| Budgets | 4 (< 150€, 150-400€, 400-1000€, Premium) |
| Envies | 6 (Confortable, Élégant, Discret, Affirmé, Créatif, Intemporel) |
| Occasions | 7 (Bureau, Quotidien, Soirée, Weekend, Voyage, Rendez-vous, Cérémonie) |
| Inspirations | 4 (Tendance, Intemporel, Avant-garde, Classique revisité) |
| Saisons | 4 (Été, Mi-saison, Hiver, Toute saison) |

**Combinatoire pure** :
348 × 3 × 4 × 6 × 7 × 4 × 4 = **1 403 136 combinaisons possibles**

Si chaque combinaison nécessitait 5 pièces uniques : 7 millions de produits. **Irréaliste**.

Heureusement, **les produits se réutilisent** entre combinaisons (un blazer noir slim convient à
des dizaines de palettes, de profils, d'occasions). Le vrai chiffre est beaucoup plus bas.

---

## Le calcul réaliste avec recouvrement

Pour avoir **toujours au moins 5 pièces viables par slot par contexte** (le minimum pour offrir
du choix + variations V1/V2/V3) :

### Par registre stylistique

Tu as **5 registres** principaux : Minimaliste, Classique, Streetwear, Avant-garde, Décontracté.

Pour chaque registre, il te faut un catalogue minimum de :

| Slot | Pièces nécessaires (par registre, par genre) |
|---|---|
| Haut | 200-300 |
| Bas | 150-200 |
| Veste | 150-250 |
| Chaussures | 100-150 |
| Accent | 100-200 |
| **Sous-total par registre par genre** | **~700-1 100** |

**Total par registre** (×3 genres) : **~2 100-3 300 pièces**
**Total tous registres** (×5 registres) : **~10 500-16 500 pièces minimum**

### Couches supplémentaires

**Pour couvrir aussi les tendances actuelles** : +20-30% de roulement (les pièces "tendance 2026"
tournent vite, il faut un flux constant) → **+2 000-5 000 pièces**

**Pour couvrir les budgets extrêmes** :
- Premium (400€+) : besoin de marques luxe (Brunello, Tom Ford, etc.)
- < 150€ : besoin de marques accessibles (MUJI, Uniqlo)
- → environ **+5 000 pièces pour bien couvrir les extrémités**

**Pour couvrir les occasions rares** (cérémonie, voyage tropical, etc.) : **+1 000-2 000 pièces**

---

## Les 3 paliers de catalogue

### 🥉 Palier MVP (couvre ~75% des demandes) — 20 000-30 000 produits

À ce niveau, **WADA peut satisfaire la majorité des combinaisons standards**. Quelques cas niches
ne trouvent pas la pièce parfaite — le styliste fait au mieux ou dégrade gracieusement.

**Cas tordus non couverts** :
- Femme cérémonie luxe créatrice
- Homme avant-garde japonais < 150€
- Streetwear premium pour quinquagénaire
- Etc.

### 🥈 Palier production (couvre ~90% des demandes) — 50 000-80 000 produits

À ce niveau, le composer trouve presque toujours une tenue cohérente, même pour des contextes
inhabituels. La satisfaction client est très haute.

C'est le **palier où Lyst, Stylight et Lookbooks se situent**.

### 🥇 Palier excellence (couvre 99%) — 150 000-300 000 produits

À ce niveau, WADA peut rivaliser avec **Net-a-Porter, Mr Porter, Farfetch**. Le système peut
gérer même les demandes pointues (vintage, marques émergentes, looks expérimentaux).

C'est l'objectif à 3-5 ans.

---

## Où en es-tu maintenant ?

### Catalogue actuel WADA

| Source | Produits | Couverture |
|---|---|---|
| MUJI France | ~6 500 | Décontracté mixte (unisexe), budget accessible |
| The Business Fashion | ~14 400 | Luxe Homme principalement, multi-registres |
| The Shirt Company | ~730 | Premium Femme niche (chemises uniquement) |
| **Total accessible** | **~21 600** | |

### Analyse de couverture par segment

| Segment | Catalogue actuel | Couverture | Verdict |
|---|---|---|---|
| Homme · Luxe · Classique | ~3 000 (TBF Tom Ford, Brunello, etc.) | ✅ 85% | Très bien |
| Homme · Luxe · Streetwear | ~2 500 (TBF Off-White, Rick Owens, etc.) | ✅ 80% | Bien |
| Homme · Mid-market | ~1 000 (MUJI + Polo Ralph Lauren) | ⚠️ 35% | Insuffisant |
| Homme · Budget < 150€ | ~3 000 (MUJI homme) | ✅ 70% | Acceptable |
| Femme · Luxe | ~1 500 (Jacquemus, Acne via TBF) | ⚠️ 25% | **Très insuffisant** |
| Femme · Mid-market | ~1 500 (MUJI femme) | ❌ 15% | **Insuffisant grave** |
| Femme · Premium chemises | 729 (Shirt Co) | ✅ 90% (niche) | Niche couverte |
| Femme · Budget < 150€ | ~3 000 (MUJI femme) | ✅ 60% | Acceptable |
| Tendances 2026 | ~0 (rien de tagué tendance) | ❌ 0% | **Manquant** |
| Mixte / Unisexe | ~5 000 (MUJI principalement) | ✅ 65% | Acceptable |

**Score global de couverture : ~40-45%** → tu es **à mi-chemin du palier MVP**.

---

## Ce qu'il te manque pour atteindre 75% (palier MVP)

### Priorité 1 — Femme luxe (gros gap)

**Cible** : Net-a-Porter ou Farfetch via Awin

- **Net-a-Porter** : ~150 000 produits, mode femme premium et luxe (Saint Laurent, Gucci,
  Bottega Veneta, The Row, etc.)
- **Farfetch** : multi-marques mixte, ~500 000 produits au global, dont ~150-200 000 femme

À candidater dès lundi. Si une seule de ces deux marques accepte, **ton catalogue double**.

### Priorité 2 — Femme mid-market FR (gap qualitatif)

**Cibles** :
- **Sezane** (~1 500 produits, esthétique parisienne, très WADA-friendly)
- **Sandro** (~2 000 produits)
- **Maje** (~1 800 produits)
- **Comptoir des Cotonniers** (~1 000 produits)
- **American Vintage** (~2 000 produits)

Total potentiel : **+8 000 produits femme mid-market**. Couverture femme mid passe de 15% à ~70%.

### Priorité 3 — Tendances tournantes

**Cibles** :
- **ASOS** (~30 000 produits, fast fashion mais utile pour tendances <30€)
- **About You** (~50 000 produits, mid à premium, Allemand)
- **Boohoo Group** (Boohoo, PrettyLittleThing, etc.) (~20 000 produits, ultra fast)

Ces sources tournent en quasi-temps réel sur les tendances. **+50 000-100 000 produits** instantanés.

### Priorité 4 — Compléter homme mid

**Cibles** :
- **Suitsupply** (~2 000 produits, tailoring accessible)
- **Eden Park** (~1 000 produits)
- **Lacoste** (~3 000 produits)
- **Armor Lux** (~1 500 produits)

Total : **+7 500 produits homme mid-market**.

### Priorité 5 — Niches stratégiques

- **Birkenstock** (déjà via TBF, OK)
- **Decathlon** (sport, ~5 000 produits)
- **Atelier du diamant** (bijouterie, déjà en pipeline)
- **Kastner & Öhler** (en cours)

---

## Roadmap catalogue 12 mois

### Mois 1-3 (court terme) — Atteindre le palier MVP

Candidate à **3-5 marques** parmi :
- Sezane (priorité 1)
- Net-a-Porter ou Farfetch (priorité 1)
- ASOS (priorité 2)
- Sandro / Maje (priorité 3)
- Suitsupply (priorité 4)

**Cible : 50 000-70 000 produits, couverture ~75%**

### Mois 4-6 (moyen terme) — Atteindre le palier production

Continuer à candidater à :
- About You
- Lacoste
- Mango (si dispo Awin)
- Birkenstock (si pas déjà via TBF)
- 2-3 marques niches (Kuishi, Atelier du diamant pour les bijoux)

**Cible : 100 000-150 000 produits, couverture ~88%**

### Mois 7-12 (long terme) — Diversification

Ajouter 1-2 sources internationales :
- Yoox (luxe + outlet, gros volume femme)
- Vestiaire Collective (seconde main premium)
- + 5 marques éditoriales niches

**Cible : 200 000-300 000 produits, couverture 95%+**

---

## Réponse directe à ta question

**Pour répondre à TOUTES les envies des clients à un bon niveau :**

- Strict minimum (palier MVP) : **30 000 produits**
- Niveau production confortable : **80 000 produits**
- Niveau excellence (rivaliser Net-a-Porter) : **200 000+ produits**

**Tu en as actuellement ~22 000.** Il te manque **~8 000-60 000 produits** selon ton ambition.

**Bonne nouvelle** : il te suffit d'ajouter **3-5 marques bien choisies** dans les 6 prochains mois
pour passer de 22k à 80k+ produits, parce que les multi-marques (Net-a-Porter, Farfetch, Yoox)
apportent 20-150k produits d'un seul partenariat.

**Plan d'action concret cette semaine** :

1. **Candidate à Net-a-Porter** sur Awin (cible : +150 000 produits femme luxe)
2. **Candidate à Sezane** (cible : +1 500 produits femme FR éditorial)
3. **Candidate à ASOS** (cible : +30 000 produits multi-genres mid)
4. **Finalise Kastner & Öhler** (en cours, +probablement 5 000-10 000 produits)

Si tu valides ces 4 candidatures (et que la moitié sont acceptées dans le mois), tu passes de
22 000 à **100 000+ produits** d'un coup, soit du palier MVP au palier production en 4 semaines.

C'est la stratégie de croissance la plus rapide. **Tu n'as pas besoin de plus de marques, tu as
besoin des bonnes marques** — celles qui agrègent des centaines de sous-marques.

---

## Conclusion

Pour satisfaire **la quasi-totalité des clients** sur toutes les combinaisons (palette × genre ×
budget × envie × occasion × tendance) :

- **Strict minimum lançable** : 30 000 produits
- **Confortable et professionnel** : 80 000 produits
- **Excellence et leader** : 200 000+ produits

**Tu es à 22 000 aujourd'hui = ~45% du palier MVP, ~28% du palier production.**

Avec **4 candidatures bien ciblées cette semaine** (Net-a-Porter, Sezane, ASOS, K&Ö finalisée),
tu peux atteindre le **palier production en 4-6 semaines** sans rien faire d'autre côté technique.

C'est ce qui ferait la plus grosse différence dans la qualité de l'expérience client, plus que
n'importe quel fix bug ou nouvelle feature.
