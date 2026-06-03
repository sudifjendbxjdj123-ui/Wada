# 🚨 Brief codeur — Fix urgent du composer de tenue WADA

Salut. Ce brief remplace toutes les discussions précédentes. Lis-le en 5 minutes, implémente-le
en 2-3 jours. Si tu as une question, écris-moi directement avant de coder.

---

## Le problème

Aujourd'hui, le composer propose **n'importe quoi**. Exemple récent :
- Client : *« j'ai un pull noir, voyage, décontracté »*
- IA propose : pull noir + **short de bain à imprimé crocodile** + **cardigan femme** + sneakers
  Veja (pas affiliée) + bonnet en laine
- Score réel : 15/100. Aucun client n'achète ça.

C'est inacceptable.

---

## La cause

Le composer fait actuellement : *« prendre 5 produits du flux qui matchent le genre et le budget »*.
C'est tout. Pas de cohérence, pas de filtres réels.

---

## La correction — 3 règles à implémenter

### Règle 1 : Une marque = un registre. Pas de mix.

Crée un fichier `lib/composer/brandRegistre.ts` :

```typescript
export const BRAND_TO_REGISTRE: Record<string, string> = {
  // Classique
  'Brunello Cucinelli': 'classique',
  'Tom Ford': 'classique',
  'Polo Ralph Lauren': 'classique',
  'Loro Piana': 'classique',
  'Canali': 'classique',
  'Zegna': 'classique',
  'Eton': 'classique',
  'The Shirt Company': 'classique',

  // Streetwear
  'Off-White': 'streetwear',
  'Palm Angels': 'streetwear',
  'Stone Island': 'streetwear',
  'AMI Paris': 'streetwear',
  'Rick Owens': 'streetwear',
  'NEIGHBORHOOD': 'streetwear',
  'BAPE': 'streetwear',
  'ICECREAM': 'streetwear',

  // Avant-garde
  'Comme des Garçons': 'avant_garde',
  'Comme des Garçons SHIRT': 'avant_garde',
  'Yohji Yamamoto': 'avant_garde',
  'Jacquemus': 'avant_garde',
  'Givenchy': 'avant_garde',
  'Alexander McQueen': 'avant_garde',

  // Décontracté
  'MUJI': 'decontracte',
  'Birkenstock': 'decontracte',
  'Uniqlo': 'decontracte',

  // Heritage (à NE PAS mixer avec minimaliste/streetwear)
  'Barbour': 'heritage',

  // Outdoor (à NE PAS mixer avec classique/minimaliste)
  'The North Face': 'outdoor',
  'Patagonia': 'outdoor',

  // Après-ski (à NE PAS mixer avec autre chose)
  'Moon Boot': 'apres_ski',
};

export function getRegistre(brand: string): string | null {
  return BRAND_TO_REGISTRE[brand] ?? null;
}
```

### Règle 2 : Filtres durs sur le pool, AVANT le pick.

Dans ton composer principal (`lib/composer/compose.ts` ou équivalent), ajoute ces filtres EN
PREMIER :

```typescript
function filterPool(products, palette, profile, occasion) {
  return products.filter(p => {
    // FILTRE 1 : Stock
    if (!p.in_stock) return false;

    // FILTRE 2 : Genre (le plus important)
    if (p.genre !== profile.genre &&
        p.genre !== 'mixte' &&
        p.genre !== 'unisexe') return false;

    // FILTRE 3 : Budget
    if (p.prix_eur > profile.budgetMaxParPiece) return false;

    // FILTRE 4 : Registre compatible
    const reg = getRegistre(p.brand_name);
    if (!reg) return false; // marque inconnue = rejet
    if (reg !== palette.registre) return false;

    // FILTRE 5 : Occasion compatible (cf. table ci-dessous)
    if (!isProductOkForOccasion(p, occasion)) return false;

    // FILTRE 6 : Affilié WADA (whitelist)
    const affiliated = ['MUJI', 'The Business Fashion', 'The Shirt Company'];
    if (!affiliated.includes(p.source)) return false;

    return true;
  });
}
```

### Règle 3 : Table occasion → slots autorisés

```typescript
const OCCASION_SLOTS: Record<string, string[]> = {
  bureau:     ['chemise', 'blazer', 'pantalon_costume', 'derbies', 'mocassins', 'pull_fin'],
  quotidien:  ['t_shirt', 'chemise', 'pull', 'pantalon', 'jean', 'sneakers', 'mocassins'],
  soiree:     ['chemise', 'pull_fin', 'blazer', 'pantalon_costume', 'mocassins_cuir'],
  weekend:    ['t_shirt', 'sweat', 'pull', 'jean', 'chino', 'sneakers'],
  voyage:     ['t_shirt', 'pull', 'chemise', 'pantalon', 'chino', 'sneakers_confort', 'mocassins'],
  ceremonie:  ['chemise_blanche', 'costume', 'pantalon_laine', 'derbies_cuir', 'mocassins_verni'],
};

// PIÈCES INTERDITES selon l'occasion
const FORBIDDEN_TYPES: Record<string, string[]> = {
  bureau:    ['short', 'short_bain', 'survetement', 'sneakers_sport'],
  quotidien: ['short_bain', 'tenue_ceremonie'],
  soiree:    ['short', 'short_bain', 'sneakers_sport'],
  weekend:   ['costume_3_pieces', 'cravate', 'short_bain'],
  voyage:    ['short_bain', 'tenue_ceremonie', 'sneakers_sport'], // pas de short de bain !
  ceremonie: ['short', 'sneakers', 'jean', 't_shirt'],
};

function isProductOkForOccasion(product, occasion) {
  const allowed = OCCASION_SLOTS[occasion] ?? [];
  const forbidden = FORBIDDEN_TYPES[occasion] ?? [];

  // Détecter le type depuis product_name
  const name = product.product_name.toLowerCase();

  // Si le nom contient un mot interdit → rejet
  for (const ban of forbidden) {
    const keyword = ban.replace('_', ' ');
    if (name.includes(keyword) || name.includes(ban)) return false;
  }

  return true;
}
```

---

## Test obligatoire avant déploiement

Lance ce test localement. Si l'output ne ressemble pas à ce qui suit, **ne déploie pas**.

```typescript
// Test 1 — Voyage homme décontracté avec pull noir comme ancre
const input = {
  profile: { genre: 'homme', budget: '150-400', budgetMaxParPiece: 300 },
  occasion: 'voyage',
  palette: {
    nom: 'Pluie de Tokyo',
    registre: 'decontracte',
    couleur_principale: '#1c2030'
  },
  ancre: { slot: 'haut', type: 'pull', couleur: 'noir' }
};

const tenue = await compose(input);
console.log(tenue);

// Sortie ATTENDUE (exemple) :
// {
//   haut: { type: 'pull noir', source: 'ancre client' },
//   bas: { brand: 'MUJI', type: 'chino', couleur: 'sable', prix: 70 },
//   veste: { brand: 'MUJI', type: 'surchemise laine', couleur: 'gris', prix: 85 },
//   chaussures: { brand: 'Birkenstock', source: 'TBF', type: 'Boston suede', couleur: 'brun', prix: 165 },
//   accent: { brand: 'MUJI', type: 'bonnet laine côtelée', couleur: 'gris foncé', prix: 25 },
//   total: 345,
//   score: ≥ 80
// }

// Sortie INACCEPTABLE :
// - Toute pièce dont type contient "short de bain"
// - Toute pièce où brand_name n'est pas dans la whitelist
// - Toute pièce dont genre = 'femme' (vu que profile.genre = 'homme')
// - Plus de 2 registres différents dans la tenue
```

---

## Definition of Done

La feature est terminée quand TOUS ces points sont validés :

- [ ] La table `BRAND_TO_REGISTRE` contient au moins les 30 marques principales
- [ ] Le filtre dur sur le pool tourne en moins de 100ms même avec 14 000 produits
- [ ] Pour 10 paires (palette, profile) tests, aucune tenue ne contient :
  - Une pièce d'un autre genre que le profil
  - Une marque non affiliée (Veja, COS, Zara, etc.)
  - Un short de bain en occasion "voyage" ou "bureau"
  - Plus d'un registre différent
- [ ] Le score moyen sur ces 10 tests est ≥ 75/100
- [ ] Le panier affiche les **vrais prix** du flux (fin du placeholder `~55 €`)
- [ ] Les photos produits sont affichées (mirror Blob, pas hotlink)
- [ ] Les boutons « Acheter » pointent vers le **vrai aw_deep_link** Awin

---

## Délai

3 jours ouvrés. Si tu as besoin de plus, écris-moi avec une raison précise (ex : *« le flux TBF
n'a pas la colonne X »*, *« il manque telle info »*).

Si après 3 jours rien n'est en ligne et que tu n'as pas écrit pour clarifier, je considère que
le projet ne progresse pas et je trouve un autre dev. Pas de reproches — juste la réalité.

---

## Pourquoi c'est urgent

Tant que ce composer propose des absurdités :
- Aucun client ne s'abonnera au Premium 1,99 €/mois
- Aucune marque partenaire ne renouvelle son intérêt
- Aucune commission Awin n'est touchée (les clics partent sur des marques fantômes)
- La vidéo de lancement Wes Anderson devient inutile (elle envoie sur un produit cassé)

Ce composer est le **cœur économique du site**. Il doit marcher. C'est non-négociable.

---

## Si tu veux plus de détails

Tous les fichiers de spec sont dans le dossier `hero/` :
- `WADA-composer-CODE-PRET.ts.md` → le code TypeScript complet en 600 lignes
- `WADA-logique-IA-renforcee.md` → la spec détaillée
- `WADA-tenues-coherentes-preuve.md` → 6 exemples de tenues correctement composées

Mais tu n'as pas besoin de tout lire. Ce brief contient le **minimum vital** pour fixer le bug.

Code. Teste. Déploie. C'est tout.

Merci.

— Nemanja
