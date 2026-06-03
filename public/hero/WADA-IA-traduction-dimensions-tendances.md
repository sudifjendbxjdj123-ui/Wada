# WADA — Logique IA : traduction des dimensions UI, variations, tendances, conflits

Cette spec **complète** `WADA-logique-IA-renforcee.md` et `WADA-styliste-IA-personnalite-raisonnement.md`.
Elle répond à 4 questions concrètes que le codeur va se poser dès qu'il branche le nouveau
sélecteur de dimensions :

1. **Comment chaque chip du sélecteur se traduit en filtre / boost algorithmique** ?
2. **Comment WADA sait ce qui est tendance** et comment l'intègre-t-il ?
3. **Comment gérer les conflits** entre dimensions (« élégant » + « < 150€ ») ?
4. **Comment générer 3 variations** d'une même tenue (safe / bold / budget) ?

---

## 1. Traduction des chips du sélecteur en paramètres composer

Le sélecteur de la page palette a 5 dimensions. Voici **précisément** comment chaque chip
modifie le pick.

### Dimension : Pour qui

| Chip | Filtre composer |
|---|---|
| **Femme** | `genre ∈ {femme, mixte, unisexe}` |
| **Homme** | `genre ∈ {homme, mixte, unisexe}` |
| **Mixte** | `genre ∈ {femme, homme, mixte, unisexe}` ET silhouette équilibrée (pas trop féminine ni masculine) |
| **Unisexe** | `genre ∈ {mixte, unisexe}` uniquement — pas de pièce strictement genrée |

### Dimension : Votre envie aujourd'hui

C'est la couche émotionnelle qui distingue WADA. Chaque chip déclenche des **règles précises** sur
les pièces.

#### `Confortable`
- Coupes amples (oversize, droit, large) +20 au score
- Matières souples (jersey, coton épais, cachemire) +15
- Chaussures basses ou plates (sneakers, mocassins) +10
- Exclure : chaussures à talons, chemises ajustées, vestes structurées rigides

#### `Élégant`
- Silhouette structurée (blazer, pantalon droit, robe coupée) +20
- Matières nobles (laine fine, soie, cachemire, cuir lisse) +15
- Cohérence stricte de palette (1 forte + 4 neutres) +15
- Exclure : sweat, jogging, sneakers de sport, motifs voyants

#### `Discret`
- Couleur principale de la palette **n'est PAS portée par la pièce dominante** — restée en accent
- Aucun logo apparent (filtrer `brand_visible_logo` du flux si dispo) +15
- Toutes les pièces dans les 3 couleurs neutres de la palette
- Exclure : marques streetwear, accessoires statement

#### `Affirmé`
- Couleur principale de la palette **portée par UNE grosse pièce** (manteau, robe, blazer) +20
- Accessoire fort (sac structuré, bijou marqué) +15
- Coupe nette et précise (pas de flou)
- Autoriser : motifs sobres mais présents (rayures, carreaux)

#### `Créatif`
- Une pièce sortie du registre dominant autorisée (1 chip de l'avant-garde) +15
- Mix de matières (cuir + lin par ex.) +10
- Couleur secondaire utilisée en plus de la principale
- Marques inspiration : avant-garde japonaise (CdG, Yohji, Lemaire)

#### `Intemporel`
- Marques `inspiration` qui ont 30+ ans d'âge (Brunello, Lemaire, A.P.C., MUJI, Loro Piana) +20
- Exclure : marques streetwear récentes (< 15 ans)
- Coupes droites, neutres, sans clin d'œil saisonnier
- Aucune pièce qualifiée de « tendance 2026 »

### Dimension : Inspiration mode

C'est la couche tendances. Voir section 2 ci-dessous pour comment alimenter ce signal.

| Chip | Filtre composer |
|---|---|
| **Tendance 2026** | Filtrer pool de produits sur `tagged_trends_2026 = true`. +25 au score pour ces pièces. |
| **Intemporel** | Inverse — exclure `tagged_trends_2026`. +20 pour pièces marquées `tagged_classic`. |
| **Avant-garde** | Pool restreint aux marques `registre = avant_garde`. Autorise couleurs/silhouettes non-conventionnelles. |
| **Classique revisité** | Pool = marques `registre = classique` + une seule pièce d'élargissement (twist). |

### Dimension : L'occasion

Chaque occasion = liste de slots autorisés + registre cible. Voir tableau dans
`WADA-logique-composition-tenue.md`. Récap :

| Occasion | Registre cible | Chaussures autorisées | Exclus |
|---|---|---|---|
| Bureau | classique / minimaliste | derbies, mocassins, escarpins | sneakers de sport, basket running |
| Quotidien | minimaliste / décontracté | sneakers blanches, mocassins, derbies | escarpins, bottes hautes habillées |
| Soirée | classique / élégant | mocassins cuir, escarpins, bottines cuir fines | sneakers, bottes outdoor |
| Weekend | décontracté / streetwear | sneakers, mocassins | costume strict, escarpins |
| Voyage | décontracté / minimaliste | sneakers confortables, slip-on | escarpins, derbies cuir verni |
| Rendez-vous | élégant / créatif | escarpins, mocassins, bottines | sneakers de sport |
| Cérémonie | classique strict | mocassins cuir verni, escarpins | tout le reste |

### Dimension : Budget

| Chip | Plafond par pièce | Plafond tenue totale | Marques autorisées |
|---|---|---|---|
| **< 150€** | 150€ | 600€ | MUJI principalement |
| **150–400€** | 400€ | 1500€ | MUJI + Shirt Company + entrée TBF |
| **400–1000€** | 1000€ | 3500€ | Sélection complète TBF (Brunello entry, Tom Ford, etc.) |
| **Premium** | aucun | aucun (mais < 15 000€ par bon sens) | TBF haute (Loro Piana, Tom Ford, Brunello, Amiri) |

---

## 2. Le système de tendances mode (alimentation)

Comment WADA sait ce qui est **« Tendance 2026 »** ? Voici 4 sources combinées.

### Source A — Tags manuels par Nem (1× par mois)
Nem (ou un freelance styliste) ajoute en base, chaque mois, **les 8-10 tendances dominantes** :

```yaml
trends_2026_q2:
  - "pantalon large taille haute"      # mots-clés à matcher dans product_name
  - "knit côtelé"
  - "ton chocolat / cacao"             # couleurs à matcher dans flux
  - "ballerines plates"
  - "tee-shirt blanc épais"
  - "manteau long ceinturé"
  - "couleur olive / sauge militaire"
  - "bijou en or massif"
```

Le système scanne le pool de produits, tague `tagged_trends_2026 = true` ceux qui matchent au
moins un mot-clé ou couleur.

### Source B — Vogue / GQ / Highsnobiety RSS
Script CRON qui lit les flux RSS des magazines mode majeurs **chaque semaine**, extrait les pièces
mentionnées, et alimente la liste `trends_2026`.

```javascript
// pseudo
const sources = [
  'https://www.vogue.com/feed',
  'https://www.gq.com/feed',
  'https://www.highsnobiety.com/feed'
];

for (const url of sources) {
  const feed = await fetchRss(url);
  for (const article of feed.items) {
    const trends = await extractTrendKeywordsWithLLM(article.title, article.summary);
    appendToTrendsDb(trends);
  }
}
```

### Source C — Pinterest Trends API
Pinterest publie chaque semaine ses **« Pinterest Predicts »** et ses recherches montantes en mode.
API gratuite pour publishers.

### Source D — Boucle d'apprentissage interne
Quand un client like une tenue WADA contenant une pièce avec certaines caractéristiques, on tague
ces caractéristiques comme « à booster ». À l'inverse, dislike → à minorer.

### Stockage en base

```sql
CREATE TABLE trend_tags (
  id UUID PRIMARY KEY,
  keyword VARCHAR(100),           -- "pantalon large taille haute"
  category ENUM('coupe','couleur','matiere','marque','style'),
  source ENUM('manual','vogue','gq','hsnob','pinterest','feedback'),
  weight FLOAT,                   -- 0.0 à 1.0 (importance)
  added_at TIMESTAMP,
  expires_at TIMESTAMP            -- les tendances expirent (typiquement 3-6 mois)
);

CREATE TABLE product_trend_tags (
  product_id UUID,
  trend_id UUID,
  match_score FLOAT              -- 0.0 à 1.0
);
```

Quand le composer pioche une pièce, si elle a au moins 1 `product_trend_tags`, elle est éligible
au chip « Tendance 2026 ».

---

## 3. Gestion des conflits entre dimensions

Le client peut choisir des dimensions **contradictoires** :
- « Élégant » + « Confortable »
- « Élégant » + « < 150€ »
- « Avant-garde » + « Cérémonie »
- « Tendance 2026 » + « Intemporel »

Le système doit gérer ces conflits **avec priorité claire** et **transparence**.

### Priorité des dimensions (la règle d'or)

```
1. GENRE         → règle absolue, jamais ignorée
2. OCCASION      → règle quasi-absolue (la chaussure de cérémonie ne peut pas être sneakers)
3. BUDGET        → règle absolue (sinon on viole la promesse au client)
4. INSPIRATION   → règle modérée (peut être assouplie si pool insuffisant)
5. ENVIE         → règle souple (le styliste essaie d'honorer au mieux)
```

En cas de conflit, on respecte par ordre décroissant. Et **le styliste l'annonce dans sa bulle** :

> « J'ai composé une tenue Bureau / Élégant / 150€. J'ai dû mettre des chaussures plates au lieu
> d'escarpins pour rester dans le budget — dis-moi si tu préfères monter en gamme. »

### Conflits classiques et résolution

#### Conflit : Élégant + < 150€
- **Priorité au budget** → les pièces ne dépassent pas 150€.
- **Le composer adapte** : descend sur MUJI au lieu de TBF, garde les coupes élégantes mais en
  basiques. Pas de blazer Tom Ford à 1500€ — mais une chemise blanche MUJI bien coupée +
  pantalon laine MUJI fait l'affaire pour évoquer l'élégance dans le budget.
- **Le styliste annonce** : « Tu veux élégant à petit budget — je joue sur les coupes propres et
  les matières mates. Brunello attendra. »

#### Conflit : Élégant + Confortable
- **Pas vraiment un conflit** — les deux peuvent coexister. Penser : Lemaire / Margaret Howell.
- **Le composer choisit** : matières souples ET coupes structurées. Pull cachemire ample + pantalon
  laine fluide + mocassins.

#### Conflit : Avant-garde + Cérémonie
- **Priorité à l'occasion** (cérémonie = formel).
- **Le composer adapte** : pioche dans `registre = classique strict` mais privilégie les marques
  avant-garde qui font du formel (Yohji Yamamoto costume, Jil Sander, etc.).

#### Conflit : Tendance 2026 + Intemporel
- **C'est mutuellement exclusif.** Le client a coché les deux par erreur ou pour tester.
- **Le styliste demande** : « Tu cherches plutôt une tenue qui résiste au temps, ou qui suit ce
  qui se porte maintenant ? »

---

## 4. Variations multiples (V1, V2, V3)

Quand le client clique « Composer ma tenue », au lieu de proposer **UNE** tenue, on propose
**trois variations** qui couvrent un spectre :

### V1 — La SAFE (par défaut)
- Respecte parfaitement les 5 dimensions choisies
- Pioche dans le centre du pool (marques inspiration, prix moyen)
- Score de cohérence visé : 90+/100

### V2 — La BOLD (légèrement audacieuse)
- Une dimension est poussée d'un cran (ex : si "Élégant" → "Très élégant" avec une pièce statement)
- Pioche une marque légèrement hors zone de confort (CdG au lieu de Lemaire)
- Score de cohérence visé : 80+/100 (un peu de prise de risque assumée)

### V3 — La BUDGET (l'optimisation prix)
- Même registre / même couleur / même occasion que V1
- Mais pioche les pièces les **moins chères** qui matchent
- Total visé : 30-40% moins cher que V1
- Score de cohérence visé : 75+/100 (parfois plus simple, plus basique)

### Présentation au client

Au lieu d'une seule tenue affichée, montrer un carrousel de 3 cartes :

```
[V1 — Composée pour vous · 1 280€ ]  [V2 — Plus audacieuse · 1 450€]  [V3 — Plus accessible · 720€]
```

Le client glisse pour voir les 3, choisit celle qu'il préfère, et c'est sur celle-là qu'il agit
(like, achat, ajustement).

### Comportement « Une autre tenue »

Si le client clique « Une autre tenue » sur V1, on lui donne **une nouvelle V1** (autre pick safe)
+ une nouvelle V2 + une nouvelle V3. Le composer exclut les produits déjà montrés pour éviter la
répétition.

---

## 5. Cold start — pas d'historique du client

Premier accès, aucun like, aucun dislike, aucune préférence. Comment le composer décide ?

### Profil par défaut au cold start
```ts
const defaultProfile = {
  genre: undefined,         // demandé en obligatoire
  budget: '150-400€',       // milieu confortable
  envie: 'Élégant',         // safe et flatteur
  occasion: 'Quotidien',
  inspiration: 'Intemporel' // ne s'engage pas sur les tendances qui peuvent dater
};
```

### Premier message du styliste
> « Bienvenue. Pour bien démarrer, dis-moi juste : c'est pour qui et quel budget. Le reste, on
> ajuste ensuite. »

Une seule question, deux dimensions. Pas d'onboarding lourd.

### Apprentissage en 3 tenues
Après 3 tenues proposées, on a déjà des signaux (clic, scroll, ajout favori). Le composer peut
commencer à personnaliser.

---

## 6. Mémoire courte vs mémoire longue

### Mémoire courte (session)
Conservée pendant 30 min après la dernière action :
- Profil actif (genre / budget / envie / occasion / inspiration)
- Palette active
- Tenue dernièrement affichée
- Dernières dislikes (pour ne pas re-proposer)

### Mémoire longue (compte utilisateur)
Conservée à vie :
- Préférences apprises (couleurs aimées/rejetées, marques aimées/rejetées, registre dominant)
- Tenues sauvées en favoris
- Tenues achetées (signal fort de "ça lui plaît vraiment")
- Profil personnel (taille, morphologie, ville si renseignées)

### Quand utiliser quoi ?
- À chaque pick : **mémoire courte** prime, mais **mémoire longue** ajoute des biais doux
  (+5 si la marque est aimée, -10 si rejetée).
- Quand le client refait l'onboarding : **mémoire longue** pré-remplit.
- Quand on génère une variation V2 (bold) : on regarde la **mémoire longue** pour savoir jusqu'où
  on peut pousser.

---

## 7. Gestion des cas spéciaux

### Le client se contredit (ex : likes streetwear mais dit « minimaliste »)
Le styliste **prend ce qu'il dit MAINTENANT** (sélecteur actuel) et ignore l'historique
contradictoire pour cette tenue précise. Mais il garde un petit drapeau « profil ambigu » qui peut
faire émerger une question :

> « Je remarque que tu aimes habituellement le streetwear, mais aujourd'hui tu vises minimaliste.
> Tu changes de cap, ou c'est pour une occasion précise ? »

### Le client ne sait pas ce qu'il veut
> « Je sais pas, propose-moi un truc. »

→ Composer V1 par défaut avec le profil par défaut + une question subtile en bulle :
> « OK — je pars sur une tenue minimaliste de jour, milieu de gamme. Tu me dis si je dévie. »

### Le client veut quelque chose d'impossible
> « Un blazer Brunello à 50€. »

→ Le styliste est honnête et propose une alternative :
> « Brunello commence à 600€. Si tu veux le look à 50€, je te trouve un blazer MUJI dans la
> même silhouette. Tu veux que je tente ? »

### Le client demande une marque qui n'est pas dans le catalogue
> « Une tenue avec du Sézane. »

→ Le styliste est honnête :
> « Sézane rejoint WADA bientôt — pas encore disponible. En attendant je peux te composer une
> tenue dans le même esprit (féminin chic à la française) avec nos marques actuelles. »

---

## 8. Métriques de qualité (à tracker)

Pour savoir si l'IA s'améliore, mesurer :

```sql
-- Taux d'engagement par tenue
SELECT 
  AVG(CASE WHEN user_action = 'liked' THEN 1 ELSE 0 END) AS like_rate,
  AVG(CASE WHEN user_action = 'clicked_to_buy' THEN 1 ELSE 0 END) AS click_rate,
  AVG(CASE WHEN user_action = 'disliked' THEN 1 ELSE 0 END) AS dislike_rate
FROM outfit_validation_log
WHERE created_at > NOW() - INTERVAL 30 DAY;
```

**Objectifs cibles** :
- Like rate ≥ 40%
- Click-to-buy rate ≥ 8%
- Dislike rate ≤ 15%

**Si dislike rate > 15%** : analyser les raisons via le LLM (« qu'est-ce qui clochait ? ») et
ajuster les marques_interdites / matieres_interdites des palettes concernées.

**Si like rate < 30%** : le composer est trop conservateur. Augmenter la variation, pousser plus
de V2 (bold) dans le carrousel.

**Si click-to-buy rate < 5%** : les pièces sont peut-être trop chères ou pas pertinentes. Revoir
les filtres budget.

---

## 9. Vitesse de réponse — UX en temps réel

Cible : **première tenue affichée en moins de 2 secondes** après clic.

### Pipeline rapide
1. **Filtre dur** sur pool produit en mémoire (Redis) : ~50ms
2. **Pick algorithmique** des 5 pièces : ~100ms
3. **Score de cohérence** : ~10ms
4. **Affichage immédiat** de la tenue (sans validation LLM)
5. **Validation LLM en background** : 1-3s. Si rejette, animation discrète "j'affine..." et
   remplacement par V1' propre.

### Streaming des explications
La bulle styliste est **streamée** au fur et à mesure que le LLM génère. Le client voit le texte
apparaître mot par mot, comme une vraie conversation.

### Fallback si LLM lent
Si le LLM ne répond pas en 5s, on affiche une explication par défaut basée sur les règles
algorithmiques :
> « Pour Osaka au thé en quotidien élégant : pull cachemire ton cuir naturel, pantalon laine bleu
> pierre, vermillon en accent. Une seule couleur forte, le reste en neutres. »

C'est moins riche qu'une réponse LLM mais ça ne bloque pas l'expérience.

---

## 10. Récap pour le codeur

### Sprint 4 (1 semaine)
1. Implémenter la table `dimension_to_filter_params` en config (la traduction de section 1).
2. Brancher chaque chip du sélecteur sur ces paramètres dans le composer.
3. Implémenter la priorité des dimensions et les annonces de conflit du styliste.

### Sprint 5 (1 semaine)
4. Mettre en place le pipeline V1/V2/V3 avec carrousel UI.
5. Implémenter le tracking métriques.
6. Implémenter la mémoire courte (session) vs longue (compte).

### Sprint 6 (continu)
7. Brancher les sources de tendances (Nem manuel + Vogue RSS + Pinterest).
8. Brancher l'apprentissage par feedback (like/dislike → ajustement automatique des biais).
9. Optimiser la vitesse de réponse pour atteindre < 2s perçu.

---

## Conclusion

Avec cette spec en plus des précédentes (`WADA-logique-IA-renforcee.md`,
`WADA-styliste-IA-personnalite-raisonnement.md`), le codeur a **tout ce qui est nécessaire** pour
construire un styliste IA qui :

- Comprend chaque chip du sélecteur précisément
- Sait ce qui est tendance (alimentation continue)
- Gère les conflits avec transparence
- Propose 3 variations à chaque tenue
- Apprend à partir des comportements clients
- Répond vite (< 2s perçu)
- Ne propose jamais d'aberration (5 garde-fous indépendants)

C'est ça qui transforme WADA en **vrai produit IA de mode**, pas en moteur de recommandation.
