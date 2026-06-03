# WADA — Logique IA composer renforcée (spec définitive)

Spec qui remplace toute version précédente. Objectif : qu'**aucune tenue absurde comme « Studio
danois avec Moon Boot + Barbour + t-shirt vert »** ne soit JAMAIS proposée.

Architecture en **5 couches** dont chacune peut rejeter la tenue. Si une couche dit non, on
recommence. Si on n'y arrive pas, on dégrade gracieusement et on est honnête avec le client.

---

## COUCHE 1 — Chaque palette a une IDENTITÉ STYLISTIQUE explicite

Chaque palette des 348 doit avoir un objet de configuration en base :

```ts
type PaletteIdentity = {
  ref: string;                  // ex. "No. 201"
  nom: string;                  // ex. "Studio danois"
  culture: string;              // ex. "Scandinave"

  registre: Registre;           // UN seul registre — pas de mix
  mood: Mood;                   // ambiance émotionnelle
  saison: Saison[];             // saisons compatibles
  occasion: Occasion[];         // occasions adaptées

  matieres_attendues: string[]; // ex. ["coton épais", "laine fine", "lin"]
  matieres_interdites: string[];// ex. ["polyester", "polyamide matelassé", "synthétique technique"]

  couleur_principale: HexColor; // la couleur forte de la palette
  couleurs_neutres: HexColor[]; // les 2-3 neutres
  couleurs_interdites_hex: HexColor[]; // ex. vert vif, fuchsia… ce qui clasherait

  marques_inspiration: string[]; // ex. ["COS", "A.P.C.", "Lemaire", "Norse Projects"]
  marques_interdites: string[];  // ex. ["Moon Boot", "Barbour", "The North Face technique"]

  histoire: string; // 1-2 phrases qui décrivent le vrai esprit de cette palette
}
```

### Exemple concret — Studio danois
```ts
{
  ref: "No. 201",
  nom: "Studio danois",
  culture: "Scandinave",
  registre: "minimaliste",
  mood: "calme_epure",
  saison: ["mi_saison", "automne", "hiver"],
  occasion: ["bureau", "quotidien", "weekend"],
  matieres_attendues: ["coton épais", "laine fine", "lin", "cachemire"],
  matieres_interdites: ["polyester technique", "polyamide matelassé", "néoprène", "vinyle"],
  couleur_principale: "#3A3530",  // charbon
  couleurs_neutres: ["#D8C8A8", "#EAE0CC"],  // bois clair, lin écru
  couleurs_interdites_hex: ["#00FF00", "#FF1493", "#FF4500"], // verts vifs, fuchsia, orange vif
  marques_inspiration: ["COS", "A.P.C.", "Lemaire", "Norse Projects", "Acne", "Margaret Howell"],
  marques_interdites: ["Moon Boot", "Barbour", "The North Face (NSE / technique)", "Stone Island",
                       "Off-White", "Palm Angels", "BAPE"],
  histoire: "Le silence chic d'un atelier de Copenhague. Tons sourds, coupes droites, matières
             nobles. Aucune pièce ne crie. Référence : COS, Lemaire, A.P.C."
}
```

À faire pour les **348 palettes**. Lourd mais une seule fois. On peut s'appuyer sur l'IA pour
pré-générer ces objets — un script qui passe les 348 palettes à Claude avec le prompt « pour cette
palette de couleurs et ce nom culturel, génère l'objet PaletteIdentity », puis vérification
humaine sur 20-30 échantillons.

---

## COUCHE 2 — Pipeline de pick en 5 étapes (dans l'ordre, pas négociable)

```
Input: PaletteIdentity + Profil utilisateur (genre, budget, style)
       + Occasion (depuis le styliste IA)

Étape A — FILTRE DUR sur le pool de produits
  → Garder uniquement les produits qui passent TOUS les filtres :
     - genre compatible
     - prix ≤ plafond budget
     - registre du produit == registre de la palette
     - marque du produit ∉ marques_interdites
     - matière du produit ∉ matieres_interdites
     - matière du produit ∈ matieres_attendues (au moins une match)
     - couleur du produit dans le delta E < 30 d'une des couleurs de la palette
     - couleur du produit ∉ couleurs_interdites_hex (delta E < 25)
     - saison du produit compatible avec palette.saison

  → Si après filtre, pool < 20 produits par slot, ÉLARGIR :
     - autoriser registres adjacents (cf. table compatibilité ci-dessous)
     - mais log un warning "catalogue insuffisant pour cette palette"

Étape B — RÉPARTITION DES COULEURS sur les 5 slots
  Selon la règle d'or « 1 couleur forte + neutres » :
  - haut       → couleur_principale OU neutre clair
  - bas        → neutre profond ou contrasté
  - veste      → neutre chaud (ou couleur principale si haut neutre)
  - chaussures → neutre profond (brun naturel, noir, crème selon palette)
  - accent     → LA couleur forte si pas déjà placée + 1 autre neutre

  → Une seule pièce porte la couleur forte. Le reste = neutres.

Étape C — PICK candidat pour chaque slot
  Pour chaque slot, classer les candidats restants par score interne :
  - +30 si marque ∈ marques_inspiration de la palette
  - +20 si matière ∈ matieres_attendues
  - +15 si prix dans la tranche moyenne du budget (pas le min, pas le max)
  - +10 si in_stock = true ET stock > 5
  - -50 si produit déjà choisi récemment pour ce profil (variété)

  Prendre le mieux noté de chaque slot.

Étape D — SCORE GLOBAL de cohérence (cf. table ci-dessous)
  Calcul du score 0-100. Si < 75/100, retour à l'étape C avec exclusion du pire produit
  et nouveau pick. Maximum 5 tentatives.

Étape E — VALIDATION FINALE par LLM (Claude haiku ou GPT-4o-mini)
  On envoie la tenue composée au LLM avec ce prompt :

  "Tu es un styliste senior. Voici une palette WADA et une tenue proposée pour un client.
  Évalue en 1 mot : COHÉRENT ou INCOHÉRENT. Si incohérent, dis en 1 phrase ce qui cloche.

  Palette : [nom + couleurs + registre + mood + histoire]
  Profil : [genre + budget + style]
  Occasion : [...]
  Tenue : [5 pièces avec marque + nom + couleur + matière + prix]"

  → Si LLM répond INCOHÉRENT, on retourne à l'étape C (exclusion du produit cité + nouveau pick).
  → Si LLM répond COHÉRENT, on affiche la tenue.

  → Si après 3 essais le LLM dit toujours INCOHÉRENT : dégradation gracieuse (cf. couche 5).
```

---

## COUCHE 3 — Table BRAND → REGISTRE détaillée

À tenir en config. Chaque marque ET chaque sous-marque doit être taguée.

### Minimaliste / Scandinave
```yaml
minimaliste:
  - COS
  - A.P.C.
  - Lemaire
  - Margaret Howell
  - Norse Projects
  - Acne Studios
  - Jil Sander
  - Maison Margiela (ligne principale uniquement)
  - The Row
  - Auralee
  - Studio Nicholson
```

### Classique / Tailoring
```yaml
classique:
  - Brunello Cucinelli
  - Tom Ford
  - Canali
  - Zegna
  - Ermenegildo Zegna
  - Loro Piana
  - Paul Smith
  - Polo Ralph Lauren
  - Eton
  - Hugo Boss
  - Suitsupply
  - The Shirt Company
  - Hawes & Curtis
```

### Streetwear / Casual chic
```yaml
streetwear:
  - Amiri
  - Rick Owens
  - Off-White
  - Palm Angels
  - AMI Paris
  - Stone Island
  - ICECREAM
  - Billionaire Boys Club
  - NEIGHBORHOOD
  - A BATHING APE
  - Anti Social Social Club
  - BAPE
  - Comme des Garçons PLAY (oui, c'est la ligne streetwear de CdG)
```

### Avant-garde japonaise / Mode déconstruite
```yaml
avant_garde:
  - Comme des Garçons (ligne principale)
  - Comme des Garçons SHIRT
  - Yohji Yamamoto
  - Issey Miyake
  - Junya Watanabe
  - Sacai
  - Undercover
```

### Outdoor technique
```yaml
outdoor:
  - The North Face (NSE / Black Series)
  - Arc'teryx
  - Patagonia
  - Salomon (gamme outdoor)
  - Snow Peak
```

### Heritage anglais / Country
```yaml
heritage_country:
  - Barbour
  - Burberry (ligne heritage)
  - Mackintosh
  - Aquascutum
```

### Après-ski / Sport d'hiver
```yaml
apres_ski:
  - Moon Boot
  - Mountain Hardwear
```

### Décontracté / Basique
```yaml
decontracte:
  - MUJI
  - Uniqlo
  - American Vintage
  - Armor Lux
  - Faguo
  - Birkenstock
```

### Marques à TOUJOURS rejeter
```yaml
toujours_rejeter:
  - "(do not use)" prefix dans brand_name
  - marques avec custom_X champs marqués "obsolete" ou "discontinued"
```

---

## COUCHE 4 — Table de compatibilité entre registres

```
                    | minimaliste | classique | streetwear | avant-garde | outdoor | heritage | apres-ski | decontracte
minimaliste         |     ✅      |    ⚠️     |     ⚠️     |     ⚠️     |   ❌    |   ❌     |    ❌     |     ✅
classique           |     ⚠️      |    ✅     |     ❌     |     ❌     |   ❌    |   ⚠️     |    ❌     |     ⚠️
streetwear          |     ⚠️      |    ❌     |     ✅     |     ⚠️     |   ⚠️    |   ❌     |    ⚠️     |     ⚠️
avant-garde         |     ⚠️      |    ❌     |     ⚠️     |     ✅     |   ❌    |   ❌     |    ❌     |     ❌
outdoor             |     ❌      |    ❌     |     ⚠️     |     ❌     |   ✅    |   ⚠️     |    ⚠️     |     ⚠️
heritage            |     ❌      |    ⚠️     |     ❌     |     ❌     |   ⚠️    |   ✅     |    ❌     |     ⚠️
apres-ski           |     ❌      |    ❌     |     ⚠️     |     ❌     |   ⚠️    |   ❌     |    ✅     |     ❌
decontracte         |     ✅      |    ⚠️     |     ⚠️     |     ❌     |   ⚠️    |   ⚠️     |    ❌     |     ✅
```

Lecture :
- ✅ → peut se combiner librement
- ⚠️ → autorisé seulement si pool de la palette est insuffisant ET avec warning interne
- ❌ → jamais ensemble

**Exemple Studio danois (minimaliste)** :
- ✅ minimaliste + minimaliste + minimaliste + minimaliste + minimaliste → idéal
- ⚠️ minimaliste + 1 pièce classique en élargissement → OK
- ❌ minimaliste + outdoor (North Face) → REJET
- ❌ minimaliste + heritage (Barbour) → REJET
- ❌ minimaliste + apres-ski (Moon Boot) → REJET

C'est la table qui aurait DOIT bloquer la tenue catastrophique de l'exemple Studio danois.

---

## COUCHE 5 — Score de cohérence (calcul détaillé)

```
score = 0

// REGISTRE
+25 si toutes les pièces appartiennent au registre cible de la palette
+15 si 4/5 pièces sont du registre cible (1 pièce en élargissement compatible)
0   si moins de 4/5 → DISQUALIFIANT

// COULEUR
+15 si une seule pièce porte la couleur principale et les autres sont neutres
+10 si 2 pièces avec couleurs « pop »
0   si 3+ pièces avec couleurs vives → DISQUALIFIANT

+10 si toutes les couleurs sont dans la palette (delta E < 30)
0   si une seule couleur est hors palette → -10
-30 si une couleur est dans couleurs_interdites_hex

// SAISON
+10 si toutes les pièces matchent la saison de la palette
+5  si 4/5 matchent
0   sinon

// OCCASION
+10 si toutes les pièces sont adaptées à l'occasion
+5  si 4/5
0   sinon

// MATIÈRE
+10 si toutes les matières sont dans matieres_attendues
0   sinon
-20 si une matière est dans matieres_interdites → DISQUALIFIANT (régénérer)

// MARQUES INSPIRATION
+10 si au moins 2 pièces sont de marques_inspiration de la palette
+5  si 1 pièce

// BUDGET
+10 si total de la tenue dans la tranche budget du profil
0   si total dépasse le plafond → DISQUALIFIANT

TOTAL : sur 100
SEUIL D'AFFICHAGE : 75/100
```

Si score < 75 → regenerate avec exclusion du produit le plus pénalisant.

---

## COUCHE 6 — Validation finale par LLM (étape critique)

C'est le filet de sécurité ultime. Même si le score algorithmique passe, un LLM relit et peut
rejeter.

### Prompt système du validateur

```
Tu es un styliste senior employé chez WADA. Tu valides chaque tenue avant qu'elle soit montrée
au client.

Tes critères stricts :
1. Toutes les pièces appartiennent au même registre stylistique.
2. Maximum UNE couleur forte dans la tenue ; le reste = neutres assortis à la palette.
3. La tenue respecte la saison annoncée.
4. La tenue est cohérente avec l'occasion.
5. La tenue respecte l'esprit de la palette (son nom et son histoire).
6. Aucune pièce ne clashe avec une autre (pas de mix outdoor + tailoring, pas d'après-ski + t-shirt,
   pas de neon + neutres terreux, etc.)

Tu réponds STRICTEMENT en JSON :
{
  "verdict": "COHERENT" | "INCOHERENT",
  "raison": "1 phrase courte si INCOHERENT, vide sinon",
  "piece_la_plus_problematique": "slot:type" si INCOHERENT, null sinon
}

Aucun autre texte. Pas d'explications hors JSON.
```

### Input envoyé

```json
{
  "palette": {
    "nom": "Studio danois",
    "registre": "minimaliste",
    "mood": "calme_epure",
    "histoire": "Le silence chic d'un atelier de Copenhague. Tons sourds...",
    "couleurs": ["#3A3530", "#D8C8A8", "#EAE0CC"]
  },
  "profil": {
    "genre": "Homme",
    "budget": "Premium",
    "style": "Minimaliste"
  },
  "occasion": "Quotidien",
  "tenue": [
    {"slot": "haut", "type": "T-shirt", "marque": "Comme des Garçons SHIRT", "couleur": "vert", "matiere": "coton", "prix_eur": 114},
    {"slot": "bas", "type": "Pantalon technique", "marque": "The North Face", "couleur": "blanc", "matiere": "polyester", "prix_eur": 199},
    {"slot": "veste", "type": "Veste matelassée", "marque": "Barbour", "couleur": "noir", "matiere": "polyamide matelassé", "prix_eur": 199},
    {"slot": "chaussures", "type": "Après-ski", "marque": "Moon Boot", "couleur": "marron", "matiere": "synthétique", "prix_eur": 218},
    {"slot": "accent", "type": "Casquette", "marque": "Jacquemus", "couleur": "blanc", "matiere": "coton", "prix_eur": 139}
  ]
}
```

### Output attendu pour CET exemple

```json
{
  "verdict": "INCOHERENT",
  "raison": "Mix de 5 registres incompatibles (avant-garde + outdoor + heritage + après-ski + streetwear) avec couleur vive hors palette minimaliste scandinave.",
  "piece_la_plus_problematique": "chaussures:Moon Boot après-ski"
}
```

Le LLM bloque, on regénère sans Moon Boot, puis sans Barbour, etc.

### Coût
GPT-4o-mini ~ $0,0001 par tenue. À 1000 tenues/jour = $0,10/jour. Négligeable.

---

## COUCHE 7 — Dégradation gracieuse

Si après **5 tentatives** le pipeline n'arrive pas à produire une tenue qui passe le score ET la
validation LLM, on ne triche pas. Le styliste WADA dit honnêtement :

```
Bulle styliste à afficher :

"Pour cette palette précise et votre profil, je n'ai pas trouvé de tenue à la hauteur
dans notre catalogue actuel. On enrichit nos marques partenaires chaque semaine —
revenez bientôt, ou essayez une autre palette."

[Bouton] Voir une palette proche
[Bouton] Ajuster mon profil
```

C'est BIEN MIEUX qu'afficher une tenue absurde. Le client préfère un "non" honnête à une
proposition ridicule.

---

## COUCHE 8 — Apprentissage continu

Tracker en base :

```sql
table outfit_validation_log (
  outfit_id, palette_ref, score_algo, llm_verdict, llm_reason,
  user_action ENUM('liked', 'disliked', 'ignored', 'clicked_to_buy'),
  timestamp
)
```

Toutes les semaines :
1. Regarder les tenues `disliked` par les clients.
2. Pour chaque dislike, demander au LLM "qu'est-ce qui clochait dans cette tenue ?"
3. Mettre à jour les **matieres_interdites** / **marques_interdites** des palettes concernées.
4. Mettre à jour la table BRAND → REGISTRE si une marque est mal classifiée.

C'est ça qui rend WADA vraiment intelligent au fil du temps.

---

## RÉCAP — Ordre d'implémentation pour le codeur

### Sprint 1 (1 semaine)
1. Créer la table `palette_identity` en base avec les 10 premières palettes config à la main.
2. Implémenter le pipeline 5 étapes (A à E).
3. Implémenter la table BRAND → REGISTRE.
4. Implémenter le score de cohérence (couche 5).

### Sprint 2 (1 semaine)
5. Implémenter la validation LLM finale (couche 6).
6. Implémenter la dégradation gracieuse (couche 7).
7. Générer les `palette_identity` pour les 338 palettes restantes via script LLM + revue humaine.

### Sprint 3 (continu)
8. Implémenter le tracking `outfit_validation_log` (couche 8).
9. Boucle hebdomadaire de mise à jour des palettes selon les dislikes.

---

## Test d'acceptation final

La tenue catastrophique de l'exemple **Studio danois** doit être :
- ❌ rejetée à l'étape A (filtre dur) à cause de **matieres_interdites = polyamide matelassé**
- ❌ rejetée à l'étape A à cause de **marques_interdites = Moon Boot, Barbour, North Face NSE**
- ❌ rejetée à l'étape A à cause de **couleur t-shirt vert ∉ couleurs palette**
- ❌ rejetée à l'étape D (score < 75)
- ❌ rejetée à l'étape E (LLM dit INCOHÉRENT)

**5 garde-fous indépendants** doivent bloquer cette tenue. C'est ça qu'on appelle un système
robuste.

Et la **bonne** tenue (COS T-shirt écru + Lemaire pantalon beige + Norse Projects surchemise
charbon + Common Projects mocassins brun + Lemaire foulard écru) doit scorer **95+/100** et être
validée immédiatement.

C'est l'objectif.
