# WADA — Flat lay AI : générer une image éditoriale par tenue

## L'idée

Au lieu de 5 photos produits cassées de marques différentes (qui font visuellement désordonné),
WADA génère **UNE image éditoriale flat lay** qui montre toutes les pièces ensemble, vues du dessus,
dans un style cohérent.

C'est ce que font Net-a-Porter, Mr Porter, Vogue Shopping. Ça transforme la perception du site :

- **Avant** : 5 photos disparates (différents fonds, différentes qualités, certaines cassées)
- **Après** : une image hero unifiée + les 5 cartes produits cliquables en dessous pour acheter

---

## 3 approches techniques (du plus simple au plus poussé)

### Approche 1 — AI 100% générée (recommandée pour démarrer)

**Le principe** : on génère une image entièrement créée par une IA, qui ressemble à un flat lay
éditorial avec les types de pièces décrites. **Pas les pièces exactes**, mais des pièces
représentatives, dans le bon style.

**Outils** :
- **Flux Schnell** sur Replicate : **~$0,001 par image** (1 millième de dollar)
- **Flux Pro** sur Replicate : ~$0,04 par image (qualité supérieure)
- **DALL-E 3** via OpenAI : ~$0,04 par image
- **Stable Diffusion XL** via Replicate : $0,001-0,01 par image

**Temps** : 2-10 secondes par image

**Cache** : on stocke l'image générée pour chaque tenue dans Vercel Blob. Une seule génération par
tenue, pas de re-génération aux visites suivantes.

**Coût total à scale** :
- 1000 tenues affichées/mois = $1 à $40 selon le modèle
- 10 000 tenues/mois = $10 à $400 selon le modèle
- Négligeable

### Approche 2 — Composite des vraies images produits

**Le principe** : on télécharge les vraies photos produits, on enlève leurs fonds (background
removal API), et on les compose ensemble sur un fond crème dans une grille flat lay.

**Outils** :
- **remove.bg** API : $0,002 par image
- **Photoroom API** : $0,002 par image
- Ou solution open-source : `rembg` (gratuit, à héberger)
- Composition via **Sharp** (Node.js, gratuit) ou **Canvas API**

**Pros** : les vraies pièces sont montrées
**Cons** : nécessite que les images source marchent (or on a vu qu'elles ne marchent pas
toujours) + le rendu peut être figé/maladroit

### Approche 3 — Hybride (le meilleur des deux mondes)

**Le principe** : on génère par IA le **fond + l'ambiance** (texture lin crème, lumière douce
naturelle), et on superpose les vraies pièces (background-removed) dessus à des positions précises.

**Pros** : rendu cohérent + vraies pièces visibles
**Cons** : plus complexe à coder

---

## Recommandation pour WADA

**À court terme (cette semaine) : Approche 1 — AI 100% générée**

Pourquoi :
- **Pas cher** (~$1/mois pour le volume actuel)
- **Rapide à coder** (1-2 jours)
- **Résout immédiatement le bug des photos cassées**
- **Look éditorial premium instantané**
- Le client comprend que c'est représentatif (la mention « inspiration » suffit)

**À moyen terme (dans 3-6 mois) : Approche 3 — Hybride**

Une fois que les images produits sont fiables (via mirror Blob déjà spec'd), passer en hybride
pour montrer les VRAIES pièces dans un cadre cohérent.

---

## Spec d'implémentation — Approche 1 (AI flat lay)

### Architecture

```
1. Le composer génère la tenue (5 pièces avec types, couleurs, marques)
2. On construit un prompt à partir des 5 pièces
3. On appelle Replicate (Flux Schnell)
4. On reçoit l'URL de l'image générée
5. On la mirror sur Vercel Blob
6. On la stocke en base associée à la tenue (clé: outfit_id)
7. À l'affichage : on lit directement depuis Blob (instantané)
```

### Le prompt système (à mettre dans le code)

```typescript
function buildFlatLayPrompt(outfit: Outfit, palette: Palette): string {
  const pieces = outfit.pieces.map(p => {
    return `${p.type} ${p.couleur_nom ?? ''}`.trim();
  }).join(', ');

  const paletteHexes = palette.colors.map(c => c.hex).join(', ');

  return `Editorial flat lay product photography, top-down view, soft natural daylight.
On a textured cream linen background with subtle wrinkles, an outfit is arranged:
${pieces}.
The pieces are spaced gracefully, not overlapping, with a balanced composition.
Color palette: ${paletteHexes}.
Minimalist Japanese aesthetic mixed with Wes Anderson symmetry.
High-end fashion editorial style, similar to Net-a-Porter or Mr Porter product photography.
Soft shadows, warm tones, no text, no models, no hangers, no people.
Square 1:1 composition. Photorealistic. Professional fashion photography.`;
}
```

### Appel API Replicate (Node.js / TypeScript)

```typescript
// app/api/flat-lay/route.ts
import Replicate from 'replicate';
import { put } from '@vercel/blob';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function generateFlatLay(outfit, palette) {
  // 1. Vérifier le cache (clé = hash des pièces)
  const cacheKey = `flatlay-${outfit.id}.jpg`;
  const cached = await getFromBlob(cacheKey);
  if (cached) return cached;

  // 2. Construire le prompt
  const prompt = buildFlatLayPrompt(outfit, palette);

  // 3. Appeler Flux Schnell (le moins cher)
  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    {
      input: {
        prompt,
        aspect_ratio: "1:1",
        output_format: "jpg",
        output_quality: 85,
        num_inference_steps: 4,  // Schnell = très rapide
      }
    }
  );

  const imageUrl = output[0]; // URL temporaire de Replicate

  // 4. Mirror sur Vercel Blob (URL permanente)
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const { url } = await put(cacheKey, blob, {
    access: 'public',
    addRandomSuffix: false,
  });

  // 5. Stocker en base pour la tenue
  await db.outfit.update({
    where: { id: outfit.id },
    data: { flat_lay_url: url }
  });

  return url;
}
```

### Côté UI (composant React)

```tsx
// components/OutfitFlatLay.tsx
export function OutfitFlatLay({ outfit, palette }: Props) {
  const flatLayUrl = outfit.flat_lay_url; // déjà généré, cached

  if (!flatLayUrl) {
    return <div className="flatlay-loading">Composition en cours...</div>;
  }

  return (
    <div className="outfit-hero">
      <img
        src={flatLayUrl}
        alt={`Tenue ${outfit.name}`}
        className="flatlay-image"
      />
      <p className="flatlay-caption">
        Inspiration visuelle — détail des pièces ci-dessous
      </p>
    </div>
  );
}
```

### Mise en page page tenue (suggestion)

```
┌─────────────────────────────────────┐
│  Bouton retour                       │
├─────────────────────────────────────┤
│                                      │
│   Nom de la palette                  │
│   "Rosée du matin"                   │
│   Lait · Sauge tendre · Mousse       │
│                                      │
├─────────────────────────────────────┤
│                                      │
│   ┌───────────────────────────┐     │
│   │                            │     │
│   │   IMAGE FLAT LAY HERO      │     │
│   │   (1:1 square, 600x600)    │     │
│   │   AI-générée               │     │
│   │                            │     │
│   └───────────────────────────┘     │
│   "Inspiration visuelle — détail     │
│   des pièces ci-dessous"             │
│                                      │
├─────────────────────────────────────┤
│   3 variations : Safe / Bold / Bud   │
├─────────────────────────────────────┤
│   Total : ~830 €                     │
├─────────────────────────────────────┤
│   Carte pièce 1 : long-sleeve polo  │
│   Carte pièce 2 : jeans              │
│   Carte pièce 3 : cardigan           │
│   Carte pièce 4 : mocassins          │
│   Carte pièce 5 : boutons manchette  │
└─────────────────────────────────────┘
```

L'image hero **remplace les 5 photos individuelles cassées en haut**. Les **cartes en dessous gardent les boutons "Acheter"** avec les vrais liens.

---

## Coûts détaillés

### Volume estimé après lancement

| Mois | Tenues affichées | Tenues uniques générées | Coût Flux Schnell |
|---|---|---|---|
| 1 | 500 | 250 | $0.25 |
| 3 | 5 000 | 2 000 | $2 |
| 6 | 30 000 | 8 000 | $8 |
| 12 | 100 000 | 25 000 | $25 |

**Hypothèses** :
- 1 tenue unique = 1 image générée (cached à vie ensuite)
- 60% de réutilisation entre visites
- Régénération si la tenue change (variation V1/V2/V3 = 3 images max par tenue)

### Total Replicate / mois

**Coût annuel estimé** : **$50-100 max** pour Flux Schnell, **$1 000-2 000** pour Flux Pro
qualité top.

Tu peux commencer en Schnell ($0,001/image) puis upgrader vers Flux Pro quand le revenu le permet.

---

## Compatible avec ce que tu as déjà

Tu as déjà `REPLICATE_API_TOKEN` dans Vercel (je l'ai vu dans tes variables d'environnement). C'est
déjà configuré.

**Étapes pour Claude Code demain** :

1. Donne-lui ce prompt :

```
Ajoute à WADA une fonction generateFlatLay() qui :

1. Prend en input une tenue composée (5 pièces avec type, couleur, marque) et la palette associée.

2. Vérifie en cache (Vercel Blob, clé = `flatlay-${outfit.id}.jpg`) si l'image existe déjà.
   Si oui, renvoie l'URL Blob directement.

3. Sinon, construit un prompt Flux Schnell basé sur les 5 pièces et la palette :
   - Style : flat lay éditorial vue du dessus
   - Fond : lin crème texturé
   - Composition : minimaliste Wes Anderson + Japanese
   - Format : 1:1 carré
   - Pas de personne, pas de cintre, pas de texte

4. Appelle Replicate avec le modèle "black-forest-labs/flux-schnell" (le moins cher).

5. Récupère l'URL de l'image temporaire, la télécharge, la mirror sur Vercel Blob avec un nom
   unique basé sur outfit.id.

6. Stocke l'URL Blob dans la table outfit en base (champ flat_lay_url).

7. Renvoie l'URL.

Crée aussi un composant React <OutfitFlatLay /> qui affiche cette image en hero de la page tenue,
au-dessus des cartes produits individuelles. Si l'image n'est pas encore générée, affiche un
placeholder "Composition en cours..." avec spinner doux.

La variable REPLICATE_API_TOKEN est déjà configurée dans Vercel.
```

Compte ~3-5 heures de dev. Une fois en place, ton site change de niveau visuel d'un coup.

---

## Bonus — exemples de prompts par palette

Tu peux varier le style selon la palette pour renforcer l'identité éditoriale.

### Palette Pluie de Tokyo
```
... soft mist atmosphere, slate blue and warm leather tones, rainy day urban editorial ...
```

### Palette Brume du matin
```
... soft morning light, sage green and cream tones, minimal Scandinavian editorial ...
```

### Palette Osaka au thé
```
... warm afternoon light, terracotta and vermillion accents, Japanese tea ceremony aesthetic ...
```

Le styliste IA peut générer automatiquement ces variations en injectant dans le prompt
l'**histoire** déjà associée à chaque palette (cf. `WADA-logique-IA-renforcee.md` section
PaletteIdentity).

---

## Conclusion

Cette fonctionnalité te donne :

✅ Une **identité visuelle premium** au niveau Net-a-Porter / Mr Porter
✅ La **fin des photos cassées** sur la page tenue (le hero remplace les 5 images cassées)
✅ Une **cohérence éditoriale forte** (même style de photographie pour toutes les tenues)
✅ Un **avantage concurrentiel visible** (aucun concurrent ne fait ça pour des compositions
   multi-marques)
✅ Un coût très bas (~$5-50/mois pour démarrer)

C'est **la fonctionnalité qui rendra WADA visuellement professionnel** en 3-5h de dev, sans
toucher au composer ni au reste.

**À implémenter demain ou cette semaine**, en parallèle des 3 bugs critiques.
