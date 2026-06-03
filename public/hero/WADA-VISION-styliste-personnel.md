# WADA — Vision : un vrai styliste personnel numérique

> « Aujourd'hui, je te recommande le look Osaka au thé. Il fait 18°C à Genève, tu as une réunion à
> 14h, et cette palette correspond à ton style minimaliste. »

C'est ça la vraie destination de WADA. Pas un moteur de recommandation. Un **styliste personnel
qui connaît son client**.

Ce fichier décompose la vision en 3 horizons, du plus immédiat au plus long-terme.

---

## HORIZON 1 — Faisable dans les 6 semaines (Vagues 2-3)

Ce qui peut être implémenté tout de suite, sans technologie complexe.

### A. Profil utilisateur enrichi
Actuellement 3 champs (genre / budget / style). À étendre, mais **par étapes** pour ne pas casser
l'onboarding 10 secondes.

**Onboarding initial (3 questions, garder rapide)** :
- Pour qui ? (Femme / Homme)
- Budget par pièce ? (< 150€ / 150-400€ / Premium)
- Style ? (Minimaliste / Classique / Streetwear / Décontracté)

**Profil enrichi (page « Mon profil », à compléter quand le client veut)** :
- Âge (tranche : 18-25 / 25-35 / 35-50 / 50+)
- Taille / morphologie (rectangle / triangle / sablier / rond)
- Ville (pour la météo plus tard)
- Profession (créatif / corporate / freelance / étudiant)
- Couleurs aimées (chips multi-select)
- Couleurs interdites (chips multi-select)
- Marques favorites (autocomplete depuis la base d'annonceurs)
- Niveau de formalité habituel (slider casual ↔ très habillé)

L'utilisateur peut ignorer tout sauf les 3 obligatoires. Mais plus il remplit, **mieux WADA le sert** —
on lui dit ça explicitement avec une barre de progression « Profil 60% complété — débloque des
recommandations plus fines ».

### B. La couche émotionnelle (« comment tu veux être perçu aujourd'hui »)
C'est la grande différence qu'aucun concurrent ne fait. Au moment de générer une tenue, demander :

**Comment veux-tu être perçu ?** (un seul choix, optionnel)
- 🎯 Élégant
- 🎨 Créatif
- 🤝 Accessible
- 👔 Autoritaire
- 💫 Séduisant
- 🌑 Mystérieux

**Quelle est ton humeur ?** (optionnel)
- ⚡ Énergique
- 🌊 Calme
- 🔥 Confiant
- 🌫 Discret

**Quel est ton objectif aujourd'hui ?** (optionnel)
- 💼 Travail
- 🥂 Sortir le soir
- ✈️ Voyage
- 🍷 Dîner
- ☕ Journée normale
- ❤️ Rendez-vous

Ces 3 dimensions sont **injectées dans le prompt du styliste IA** comme contexte. Le styliste compose
alors une tenue qui **respecte le profil** ET **honore l'humeur du jour**.

Implémentation : ces choix sont des chips cliquables qui apparaissent **juste avant la génération
de la tenue**, soit dans le styliste IA, soit comme étape « préciser ton envie » sur les pages
palette/tenue.

### C. L'explication du « pourquoi »
Aujourd'hui WADA dit : « Voici une tenue ». Demain WADA dit :

> « Pour ta réunion de 14h, je propose un blazer Brunello en cuir naturel — la palette **Osaka au thé**
> souligne ta posture élégante sans en faire trop. Le pantalon Tom Ford en bleu pierre allonge la
> silhouette. Total : 1 480€, dans ton budget Premium. »

L'IA explique :
- Pourquoi **cette palette**
- Pourquoi **ces pièces** (matière, coupe, marque, prix)
- Pourquoi **ça te correspond** (profil + humeur + occasion)

Implémentation : un champ `explanation` dans la sortie JSON du styliste, affiché juste sous la tenue.

### D. La mémoire stylistique (likes / dislikes)
Après chaque tenue proposée, deux boutons :

```
👍 J'aime cette tenue    👎 Pas pour moi
```

Si dislike :
> « Qu'est-ce qui ne va pas ? »
> - 🚫 La couleur
> - 🚫 La marque
> - 🚫 La coupe
> - 🚫 Le prix
> - 🚫 L'occasion ne correspond pas

WADA stocke ces signaux dans le profil utilisateur et **ajuste les futures propositions** :
- 3 dislikes sur le Vermillon → ne plus proposer Vermillon dominant
- 2 likes sur Brunello Cucinelli → favoriser cette marque
- Dislike récurrent sur les sneakers → privilégier les mocassins/bottines

C'est ce qui fait la différence entre « bête algorithme » et « il me connaît ». Après 3 semaines
d'utilisation, le système devient personnellement pertinent.

---

## HORIZON 2 — Mois 2 à 4 (après les Vagues 2-3)

Plus complexe à implémenter, demande des intégrations externes.

### E. Météo locale → recommandation contextuelle
Quand l'utilisateur ouvre WADA et qu'il a renseigné sa ville :

1. Récupérer la météo du jour via une API (OpenWeather, gratuit jusqu'à 1000 requêtes/jour).
2. Filtrer les pièces proposées par compatibilité :
   - Pluie → manteau imperméable, bottines
   - Froid (< 10°C) → laine, cachemire, doudoune
   - Chaud (> 25°C) → lin, coton léger
3. Afficher en haut : « Aujourd'hui à Genève : 18°C, ciel couvert — j'ai pensé à une mi-saison. »

C'est **immédiatement utile** au client. Effet « waouh » garanti à la première utilisation.

### F. Surveillance des tendances mode
Ne pas scraper TikTok / Instagram (techniquement complexe + légalement gris). Mais :

1. **Flux RSS / API officielles** de Vogue, GQ, Highsnobiety, Hypebeast.
2. **Manuellement** : Nem (ou un freelance) note 1 fois par mois les 5 tendances du moment
   (couleurs montantes, silhouettes, matières, marques émergentes). Ces données enrichissent le prompt
   du styliste IA.
3. Pinterest a une API publique pour les tendances mode. À explorer.

Le styliste IA peut alors dire :
> « Cette tenue est dans ton style minimaliste, mais j'ai aussi ajouté une touche de vert sauge —
> couleur très portée ce printemps. »

### G. Calendrier / agenda (optionnel, demande permission)
Si l'utilisateur connecte son Google Calendar :
- WADA voit qu'il a « Réunion client » de 9h à 11h, « Déjeuner perso » à 13h, « Pas de soirée prévue ».
- WADA propose UNE tenue qui couvre cette journée type (smart-casual qui passe en réunion mais pas
  trop formel pour le déjeuner).

C'est très puissant mais demande :
- Connexion OAuth Google Calendar
- Traitement RGPD (consentement explicite, possibilité de déconnexion)
- Logique de planification (« mix de contraintes » dans le prompt styliste)

À faire seulement si ça marche bien sans, et qu'on a des utilisateurs qui le demandent.

---

## HORIZON 3 — 6 mois et plus (l'expérience magique)

### H. La garde-robe virtuelle
L'utilisateur photographie les pièces qu'il possède déjà. WADA :
- Catégorise (haut / bas / chaussures…)
- Détecte la couleur dominante
- Mémorise tout dans son armoire numérique

Puis : « Pour le look Osaka au thé, **tu as déjà** un pantalon en laine qui matche. Il te manque
juste un pull cachemire — voici 3 options. »

C'est le **graal absolu** d'un styliste IA. Très complexe :
- Reconnaissance d'images (modèle ML entraîné mode)
- Stockage utilisateur (photos)
- Algorithme de mix « possédé + à acheter »

À tenter quand WADA aura ~10k utilisateurs réguliers — pas avant.

### I. La « tenue du jour » automatique
L'expérience ultime décrite dans la vision :

```
[L'utilisateur ouvre WADA]

→ Tenue du jour
→ 18°C à Genève, ciel couvert
→ Tu as : réunion 14h, déjeuner libre, pas de sortie
→ Humeur habituelle : calme, minimaliste
→ Tendance : pantalons larges (en cours d'adoption)

Aujourd'hui, je te recommande :
LOOK « Osaka au thé »
[Pull Brunello, Pantalon Tom Ford large, Mocassins Canali, Tote Paul Smith]

[Voir la tenue] [Une autre idée] [Garder pour plus tard]
```

Aucune recherche. Aucun filtre. Juste un styliste qui sait.

C'est ça la destination. Le reste, ce sont des étapes.

---

## Ce que ça change vs la concurrence

| Concurrent | Ce qu'ils font | Ce que WADA fera |
|---|---|---|
| **Pinterest Lens** | Tu poses une image, ils trouvent des produits similaires. | WADA part d'une couleur, compose une tenue cohérente, avec explication. |
| **Stitch Fix** | Box mensuelle, choix humain + algorithme. Très US. | Pas d'achat physique, instantané, basé sur 348 palettes historiques. |
| **Lyst / Stylight** | Catalogue mode multi-marques avec recherche. | WADA est éditorial, pas un moteur de recherche. Tu cherches PAS, on te propose. |
| **Vinted / Vestiaire** | Marketplace seconde main. | WADA n'est pas marketplace. Affiliation pure, tenue complète. |
| **ChatGPT « habille-moi »** | Conversation générique, pas de produits réels. | WADA = vrais produits, vrais prix, vrais liens d'achat. |

L'angle WADA unique : **palette éditoriale + styliste IA personnel + achat réel**, le tout dans un
parcours fluide. Aucun concurrent ne réunit les trois.

---

## Roadmap d'implémentation

```
SEMAINE 3-5 (Vague 2)       → A (profil enrichi)
SEMAINE 6-8                  → B (couche émotionnelle) + C (explicabilité) + D (likes/dislikes)
MOIS 2                       → E (météo locale)
MOIS 3-4                     → F (tendances mode via flux/manuel)
MOIS 5-6                     → G (calendrier optionnel) [si pertinent]
MOIS 6-12                    → H (garde-robe virtuelle) + I (tenue du jour)
```

Avec les horizons 1 et 2 (4 mois de travail), WADA est déjà **très loin devant** tous les concurrents
listés. L'horizon 3 sécurise la différenciation à long terme.

---

## Ce que toi (Nem) gagnes avec cette vision

Tu n'es plus en concurrence avec un moteur de recommandation. Tu vends une **relation**. Le client
qui passe 3 semaines à liker / disliker, qui voit ses tenues s'affiner, qui se sent compris, **ne
quitte pas WADA pour aller chez un concurrent**. C'est la rétention la plus forte qu'on puisse
construire dans la mode.

Et le storytelling devient simple : « Le styliste personnel qui apprend qui tu es. »

---

## Prochaine étape concrète

Quand le codeur aura fini la Vague 2 (composer + onboarding + IA styliste), on lui passe **ce
fichier** comme cap. Il commence par les points A à D (faisables sur la base existante). On
construit la couche météo (E) en mois 2. Et la roadmap suit naturellement.

Le piège à éviter : ne pas vouloir tout faire d'un coup. Le client qui voit un produit qui apprend
ses goûts, qui explique ses choix, qui parle climat local — c'est déjà magique. Pas besoin du
calendrier ni de la garde-robe pour briller.
