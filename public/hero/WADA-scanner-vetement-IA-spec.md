# WADA — Scanner vêtement intelligent (spec technique codeur)

## Le but

Permettre au client de **scanner une pièce qu'il possède déjà** (ex. ses Veja Campo grises), et que
WADA :
1. Reconnaisse la pièce (type, marque, modèle, couleur, registre)
2. Pose 2-3 questions de contexte (occasion, budget)
3. **Compose une tenue complète autour** de cette pièce, en utilisant les produits réels des
   marques Awin connectées (MUJI, TBF, etc.)
4. Affiche la tenue avec la pièce du client en haut, et 4 autres pièces achetables

C'est la feature qui rend WADA **vraiment unique**. Pinterest Lens ou Lyst trouvent des images
similaires ou les mêmes Veja ailleurs. WADA compose une tenue **autour de ce que le client possède
déjà**.

---

## Vue d'ensemble du flux

```
[1] Scanner plein écran (cf. wada-scanner-plein-ecran.html, mode "Un vêtement")
       ↓ photo capturée
[2] Upload image vers Vercel Blob (temporaire, 1h TTL)
       ↓ URL de l'image
[3] Appel API Vision (Claude Vision ou GPT-4o-mini Vision)
       ↓ JSON : type, marque, modèle, couleur, registre
[4] Affichage immédiat : "J'ai vu : Veja Campo gris/blanc - sneakers casual"
       ↓ confirmation client
[5] Styliste IA pose 2 questions chips : occasion + budget
       ↓ réponses
[6] Composer génère 4 pièces autour de l'ancre (cf. WADA-logique-composition-tenue.md)
       ↓
[7] Affichage tenue : Veja (ancre, en haut, badge "Ta pièce") + 4 cartes produits Awin
```

---

## Choix du modèle Vision

Deux options recommandées :

### Option A : **GPT-4o-mini Vision** (recommandée — déjà disponible)
- Clé `OPENAI_API_KEY` déjà dans Vercel
- Modèle : `gpt-4o-mini`
- Coût : **~$0,0001 par image** (négligeable, même à 10 000 scans/mois = $1)
- Latence : 1-3 secondes
- Qualité : excellente pour identifier marques mode, modèles, couleurs

### Option B : **Claude Vision** (alternative)
- Nécessite `ANTHROPIC_API_KEY`
- Modèle : `claude-haiku-4-5` (rapide, bon marché)
- Coût similaire, latence similaire
- Bonne qualité aussi

**Choix par défaut : GPT-4o-mini** (déjà dispo, pas de nouvelle clé).

---

## Prompt système pour la Vision API

```
Tu es un expert mode chargé d'analyser une photo d'un seul vêtement.

À partir de la photo, identifie :
- type : un mot précis (sneakers, chemise, blazer, jean, pull, robe, bottines, t-shirt, manteau...)
- slot : haut | bas | veste | chaussures | accent
- marque : nom de la marque visible si identifiable (Veja, Nike, MUJI, Levi's...), sinon null
- modele : nom du modèle si reconnaissable (V-10, Campo, 501, ...), sinon null
- couleur_principale : le nom (français) + le hex approximatif
- couleur_secondaire : si présente, sinon null
- registre : classique | streetwear | minimaliste | decontracte | sport
- genre : femme | homme | mixte
- caracteristiques : array de mots-clés courts (low-top, cuir, denim, oversize, cachemire, fluide...)
- saison : ete | mi-saison | hiver | toute_saison

Réponds en JSON STRICT, rien d'autre :
{
  "type": "...",
  "slot": "...",
  "marque": "..." | null,
  "modele": "..." | null,
  "couleur_principale": { "nom": "...", "hex": "#RRGGBB" },
  "couleur_secondaire": { "nom": "...", "hex": "#RRGGBB" } | null,
  "registre": "...",
  "genre": "...",
  "caracteristiques": ["...", "..."],
  "saison": "..."
}

Si la photo n'est pas un vêtement reconnaissable, renvoie :
{ "error": "non_reconnu", "raison": "..." }
```

### Appel API (Node.js / pseudo)

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT_VISION },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Analyse ce vêtement.' },
        { type: 'image_url', image_url: { url: blobImageUrl } }
      ]
    }
  ],
  response_format: { type: 'json_object' },
  max_tokens: 400
});
const result = JSON.parse(response.choices[0].message.content);
```

---

## Adaptation du composer pour gérer une "pièce ancre"

Le composer actuel pioche 5 pièces (haut, bas, veste, chaussures, accent) sans contrainte.

**Avec une pièce ancre**, le composer :

1. **Verrouille le slot de l'ancre** : si l'ancre est `slot: "chaussures"`, le composer ne propose
   PAS de chaussures (le client a les siennes). Il pioche seulement les 4 autres slots.

2. **Adapte le registre** à celui de l'ancre. Si l'ancre est Veja (registre `sport-casual`), le
   composer filtre les produits sur **decontracte / casual** + un peu de **minimaliste**. Pas de
   tailoring strict avec des baskets.

3. **Adapte la palette de couleurs** : la couleur de l'ancre devient une des 3 couleurs principales
   de la tenue. Les autres pièces sont choisies en cohérence (neutres + 1 couleur d'accent
   complémentaire).

4. **Adapte la saison** : si l'ancre est été (tongs, lin), le composer privilégie l'été pour les
   autres pièces.

### Pseudo-code

```typescript
function composeAroundAnchor(anchor: AnalyzedItem, context: { occasion, budget }) {
  const slotsToFill = ALL_SLOTS.filter(s => s !== anchor.slot);
  const targetRegistre = anchor.registre;
  const palette = derivePaletteFromColor(anchor.couleur_principale);

  const tenue = { [anchor.slot]: anchor };

  for (const slot of slotsToFill) {
    const candidates = productPool
      .filter(p => p.slot === slot)
      .filter(p => p.registre === targetRegistre || isCompatible(p.registre, targetRegistre))
      .filter(p => p.genre === anchor.genre || p.genre === 'mixte')
      .filter(p => p.prix_eur <= context.budget.maxParPiece)
      .filter(p => matchOccasion(p, context.occasion))
      .filter(p => colorMatchesPalette(p.couleur, palette));

    tenue[slot] = pickBest(candidates);
  }

  return tenue;
}
```

---

## UI / écrans à prévoir

### 1. Scanner plein écran (mode "Un vêtement")
Référence visuelle : `wada-scanner-plein-ecran.html` (phone 2)
- Mire rectangulaire pour cadrer la pièce
- Bouton de capture central
- Pas de timer, capture immédiate

### 2. Loading + identification
Pendant 1-3 sec après capture :
```
[Photo prise en arrière plan flouté]
[Pulsation centrale]
"J'analyse ta pièce..."
```

### 3. Confirmation de l'identification
Modal qui slide depuis le bas :
```
J'ai vu :
[Petite image de la pièce]   Veja Campo gris
                              Sneakers low-top · Casual
[ ✓ C'est bien ça ] [ ✗ Non, autre chose ]
```

Si "Non", proposer de rescanner ou de saisir manuellement.

### 4. Questions de contexte (chips Styliste)
```
Cool ! Pour quelle occasion tu veux les porter ?
[Bureau] [Quotidien] [Soirée] [Weekend] [Voyage]

Et ton budget pour la tenue (hors les Veja) ?
[< 150€] [150-400€] [Premium]
```

### 5. Affichage de la tenue
Référence : structure similaire à `wada-tenue-tbf.html`, avec :
- **En haut** : carte "Ta pièce" avec l'image scannée + badge vert "Ancre"
- **En dessous** : 4 cartes produits Awin (haut, bas, veste, accent)
- **Total** : somme des 4 pièces à acheter (sans compter l'ancre)
- **Note du styliste** : 1-2 phrases d'explication ("Cette tenue valorise tes Veja sans les écraser,
  dans des tons neutres qui...")

---

## Cas limites à gérer

### A. Marque non reconnaissable
La Vision renvoie `"marque": null`. C'est OK, on continue avec type + couleur + registre. Le client
peut éventuellement préciser la marque manuellement.

### B. Pièce non identifiée du tout
La Vision renvoie `{"error": "non_reconnu"}`. Afficher : « Je n'ai pas pu identifier cette pièce.
Réessaye avec une photo plus claire, ou décris-la moi en mots dans le Styliste. »

### C. Plusieurs pièces dans la photo
La Vision identifie le sujet principal. Si ambiguïté, on prend la plus grande / plus centrée.
Avenir : permettre au client de tap sur l'objet à scanner.

### D. Couleur non pure (motif)
La Vision renvoie la couleur dominante. Si motif fort, ajouter `"caracteristiques": ["imprimé"]`
et le composer évite d'ajouter une autre pièce à motif.

### E. Aucune marque connectée ne match le registre
Si le client scanne du Streetwear ultra niche et qu'on n'a que MUJI + TBF, le composer pioche dans
ce qu'il a de plus compatible et le styliste avertit : « Pour respecter parfaitement ton style, il
me manque encore quelques marques. Voici la meilleure proposition possible avec nos partenaires
actuels. »

---

## Cache & performance

- **Cacher les résultats d'analyse** par hash de l'image : si le client scanne deux fois la même
  pièce, on lit le cache (pas de nouvel appel Vision).
- **TTL du cache** : 30 jours (les pièces ne changent pas, mais la base produits évolue).
- **Stockage des images** : sur Vercel Blob, TTL 24h (l'image n'a pas à être conservée durablement).

---

## Coût estimé

| Volume / mois | Coût Vision API | Coût Blob | Total / mois |
|---|---|---|---|
| 1 000 scans | $0,10 | gratuit | $0,10 |
| 10 000 scans | $1,00 | ~$0,50 | $1,50 |
| 100 000 scans | $10 | ~$5 | $15 |

Négligeable jusqu'à plusieurs centaines de milliers d'utilisateurs.

---

## Étapes d'implémentation (ordre)

1. **Mettre en place le scanner plein écran** (cf. maquette `wada-scanner-plein-ecran.html`).
2. **Endpoint `/api/scan-garment`** :
   - Reçoit l'image (multipart ou URL Blob)
   - Appelle OpenAI Vision avec le prompt système
   - Renvoie le JSON parsé
3. **Affichage de la confirmation** (modal slide).
4. **Adapter le composer** pour gérer une `anchor` :
   - Verrouille le slot
   - Adapte le registre / couleur / saison
   - Pioche les 4 autres slots normalement
5. **Endpoint `/api/compose-around-anchor`** :
   - Entrée : ancre + occasion + budget
   - Sortie : tenue (4 pièces + ancre)
6. **Page de résultat** (cf. structure `wada-tenue-tbf.html`, badge "Ancre" sur la pièce scannée).
7. **Cache des analyses** par hash image.
8. **Tests utilisateurs** : scan d'au moins 20 pièces différentes (sneakers, pulls, vestes,
   chemises) pour vérifier la robustesse.

---

## Tests d'acceptation

- [ ] Scanner Veja Campo grise → reconnu correctement, registre `casual`, slot `chaussures`.
- [ ] Tenue composée autour des Veja → 4 pièces, registre cohérent, pas de tailoring strict.
- [ ] Total affiché ne compte PAS les Veja (juste les 4 pièces à acheter).
- [ ] Badge "Ancre" / "Ta pièce" bien visible sur la pièce scannée.
- [ ] Scanner un blazer Brunello → reconnu en `classique`, slot `veste`, et tenue composée en
  classique (pas de sneakers).
- [ ] Scanner une chemise blanche basique → tenue avec un bas + chaussures + veste + accent qui
  matchent.
- [ ] Scanner un objet non vêtement (chat, café) → message d'erreur clair.
- [ ] Recharger la page → l'analyse précédente n'est pas perdue (sauvée en session ou favoris).

---

## Impact stratégique

Cette feature transforme WADA d'un **moteur de proposition** en **vrai styliste personnel**. Aucun
concurrent ne le fait (vérifié : Pinterest Lens, Lyst, Stylight, ChatGPT — aucun ne compose une
tenue autour d'une pièce du client avec achat réel intégré).

C'est probablement **le point différenciant le plus fort** que WADA peut construire à court terme,
et le sujet sur lequel la presse mode acceptera de parler.

Estimation : 3-5 jours de dev pour la feature complète, sur la base du scanner plein écran déjà
maquetté. À placer en Vague 2-3 du plan global.
