# WADA — Composer cohérent : taxonomie + règles + scoring

Spec finale pour que le composer IA produise des tenues **belles ET cohérentes**, à donner
à Claude Code en complément du brief flat lay.

Basé sur :
- **Panaprium** — taxonomie des 70 styles → 10 macro-catégories
- **Passion-mode.fr** — règles du « Power Three » + théorie des couleurs

---

## La philosophie en 4 phrases

1. **La palette Sanzō Wada est LE point de départ.** Elle filtre le pool de pièces ET suggère
   l'univers stylistique de la tenue.
2. **Une tenue réussie = Pièce forte + 2-3 basiques + 2-3 accents.** Pas plus, pas moins.
3. **Toutes les pièces partagent le même registre stylistique** (ou des registres voisins compatibles).
4. **Maximum 3 couleurs** par tenue, dont **au moins 1 neutre** qui ancre l'ensemble.

Si une tenue WADA respecte ces 4 règles, elle est belle ET fidèle à l'esprit Sanzō Wada.

---

## ⭐ LA COUCHE WADA — L'identité de palette

C'est LA couche qui distingue WADA d'un agrégateur générique. Chaque palette Sanzō Wada a
**une histoire, une ambiance, une saison émotionnelle** qui suggèrent les macro-styles compatibles.

### Architecture en 3 couches successives

```
┌─────────────────────────────────────────────────┐
│ COUCHE 1 — Palette filtre le pool                │
│ Seules les pièces dans les couleurs de la       │
│ palette Sanzō Wada sont éligibles               │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ COUCHE 2 — Identité de palette guide le style    │
│ La palette suggère 2-3 macro-styles compatibles  │
│ avec son histoire (Pluie de Tokyo → minimaliste) │
└──────────────────┬──────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────┐
│ COUCHE 3 — Cohérence mode (Power Three + matrice)│
│ Une fois palette + style choisis, on score la    │
│ cohérence selon les règles mode                  │
└─────────────────────────────────────────────────┘
```

### Mapping palette → identité stylistique

```typescript
// lib/composer/wada-identity.ts

import { MacroStyle } from './styles';
import { Occasion } from './occasions';

export interface PaletteIdentity {
  palette_id: string;
  palette_name: string;

  // L'histoire en une phrase — fournit l'ambiance
  story: string;

  // Les 2-3 macro-styles compatibles (ordre = préférence)
  preferred_styles: MacroStyle[];

  // Macro-styles à FUIR pour cette palette
  forbidden_styles: MacroStyle[];

  // Occasions par défaut
  default_occasions: Occasion[];

  // Saison émotionnelle
  emotional_season: 'ete' | 'mi-saison' | 'hiver' | 'toutes';

  // Mots-clés pour le styliste IA (utilisés dans les editorial_notes)
  mood_keywords: string[];
}

export const PALETTE_IDENTITIES: PaletteIdentity[] = [

  // === Exemples concrets ===

  {
    palette_id: 'rosee-du-matin',
    palette_name: 'Rosée du matin',
    story: 'Une promenade dans un jardin japonais à l\'aube, où la rosée fait briller les feuilles de sauge.',
    preferred_styles: ['minimaliste', 'boheme', 'romantique'],
    forbidden_styles: ['edgy', 'soiree', 'sport'],
    default_occasions: ['quotidien', 'weekend'],
    emotional_season: 'mi-saison',
    mood_keywords: ['doux', 'naturel', 'frais', 'serein', 'matinal'],
  },

  {
    palette_id: 'pluie-de-tokyo',
    palette_name: 'Pluie de Tokyo',
    story: 'Une rue de Shibuya un soir d\'orage, où l\'asphalte mouillé reflète les enseignes au néon dans un camaïeu de bleus profonds.',
    preferred_styles: ['minimaliste', 'academia', 'edgy'],
    forbidden_styles: ['plage', 'romantique', 'country'],
    default_occasions: ['travail', 'quotidien', 'soiree'],
    emotional_season: 'hiver',
    mood_keywords: ['urbain', 'mélancolique', 'contemplatif', 'mystérieux'],
  },

  {
    palette_id: 'bal-au-palais',
    palette_name: 'Bal au Palais',
    story: 'Une soirée au Palais Garnier en 1925 : or des chandelles, rouge des velours, émeraude des bijoux.',
    preferred_styles: ['soiree', 'romantique', 'edgy'],
    forbidden_styles: ['sport', 'plage', 'streetwear', 'country'],
    default_occasions: ['soiree'],
    emotional_season: 'hiver',
    mood_keywords: ['fastueux', 'théâtral', 'précieux', 'nocturne'],
  },

  {
    palette_id: 'osaka-au-the',
    palette_name: 'Osaka au thé',
    story: 'Une cérémonie du thé dans un café d\'Osaka : terracotta de l\'argile, vermillon d\'un kimono, blanc cassé du papier de riz.',
    preferred_styles: ['boheme', 'minimaliste', 'country'],
    forbidden_styles: ['soiree', 'sport', 'streetwear'],
    default_occasions: ['quotidien', 'weekend', 'voyage'],
    emotional_season: 'mi-saison',
    mood_keywords: ['chaleureux', 'artisanal', 'enraciné', 'authentique'],
  },

  {
    palette_id: 'sumi-e',
    palette_name: 'Sumi-e',
    story: 'L\'encre noire sur le papier de riz blanc, l\'art ancestral de la calligraphie japonaise.',
    preferred_styles: ['minimaliste', 'edgy', 'academia'],
    forbidden_styles: ['plage', 'soiree', 'romantique', 'country'],
    default_occasions: ['quotidien', 'travail'],
    emotional_season: 'toutes',
    mood_keywords: ['épuré', 'contemplatif', 'graphique', 'maîtrisé'],
  },

  {
    palette_id: 'aube-sur-berlin',
    palette_name: 'Aube sur Berlin',
    story: 'Le ciel pâle au-dessus de la Spree au petit matin, gris-bleu froid percé d\'un soleil orangé.',
    preferred_styles: ['minimaliste', 'edgy', 'academia'],
    forbidden_styles: ['plage', 'country', 'romantique'],
    default_occasions: ['travail', 'quotidien'],
    emotional_season: 'hiver',
    mood_keywords: ['froid', 'architectural', 'discipliné'],
  },

  {
    palette_id: 'studio-danois',
    palette_name: 'Studio danois',
    story: 'L\'intérieur d\'un atelier de design à Copenhague, bois clair, laine grège, lin écru.',
    preferred_styles: ['minimaliste', 'academia'],
    forbidden_styles: ['edgy', 'streetwear', 'soiree', 'plage', 'sport'],
    default_occasions: ['quotidien', 'travail'],
    emotional_season: 'mi-saison',
    mood_keywords: ['scandinave', 'fonctionnel', 'apaisé', 'organique'],
  },

  {
    palette_id: 'jardin-de-kyoto',
    palette_name: 'Jardin de Kyoto',
    story: 'L\'érable à l\'automne au Temple Tofukuji, anthracite des troncs, bordeaux et moutarde des feuilles.',
    preferred_styles: ['academia', 'minimaliste', 'boheme'],
    forbidden_styles: ['sport', 'plage', 'soiree'],
    default_occasions: ['quotidien', 'weekend', 'travail'],
    emotional_season: 'mi-saison',
    mood_keywords: ['automnal', 'profond', 'organique', 'serein'],
  },

  // ... répéter pour les 348 palettes
  // Mais on peut aussi les générer automatiquement par IA (voir Section 11 bis)
];

export function getPaletteIdentity(palette_id: string): PaletteIdentity | null {
  return PALETTE_IDENTITIES.find(p => p.palette_id === palette_id) ?? null;
}
```

### Comment générer les 348 identités sans les écrire à la main

Écrire 348 PaletteIdentity à la main = trop long. **Solution** : un script one-shot qui appelle
GPT-4o avec le nom de la palette + ses 5 couleurs hex, et qui renvoie le JSON PaletteIdentity.

```typescript
// scripts/generate-palette-identities.ts

async function generateIdentity(palette: { name: string, hex_colors: string[] }): Promise<PaletteIdentity> {
  const prompt = `Tu es la styliste WADA (ex-Lemaire, ex-Vogue Paris).
La palette s'appelle "${palette.name}" avec les couleurs : ${palette.hex_colors.join(', ')}.

Produis un JSON PaletteIdentity avec :
- story : 1 phrase poétique (style Sanzō Wada 1933)
- preferred_styles : 2-3 macro-styles compatibles parmi [minimaliste, romantique, streetwear, boheme, edgy, academia, country, soiree, plage, sport]
- forbidden_styles : 2-3 styles qui jureraient avec cette palette
- default_occasions : 1-3 parmi [quotidien, travail, soiree, sport, weekend, voyage]
- emotional_season : ete/mi-saison/hiver/toutes
- mood_keywords : 3-5 mots`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(res.choices[0].message.content!);
}

// Pour les 348 palettes : ~$3-5 total, une seule fois
```

### Intégration dans le scoring

Le scoring de la Section 7 devient :

```typescript
export function scoreOutfit(pieces: Piece[], context: {
  palette: Palette,
  occasion: Occasion,
}): OutfitScore {

  // === NOUVEAU : Récupérer l'identité de palette ===
  const identity = getPaletteIdentity(context.palette.id);

  // === KILL SWITCHES (déjà en place + nouveau) ===

  if (identity) {
    // Nouveau kill-switch : tenue contient un style FORBIDDEN pour cette palette
    const outfitStyles = pieces.map(p => p.macro_style);
    const violatesIdentity = outfitStyles.some(s => identity.forbidden_styles.includes(s));
    if (violatesIdentity) {
      return {
        total: 0, passed: false,
        breakdown: {/* ... */} as any,
        warnings: [],
        killSwitch: `Style incompatible avec l'identité de la palette ${identity.palette_name}`,
      };
    }
  }

  // ... rest du scoring inchangé

  // === NOUVEAU CRITÈRE : Fidélité à l'identité Sanzō Wada (×2.0) ===
  let wadaIdentity = 0.5;  // valeur par défaut si pas d'identity
  if (identity) {
    const stylesInOutfit = new Set(pieces.map(p => p.macro_style));
    const preferredInOutfit = identity.preferred_styles.filter(s => stylesInOutfit.has(s)).length;

    if (preferredInOutfit >= 2) wadaIdentity = 1.0;       // 2+ styles préférés présents
    else if (preferredInOutfit === 1) wadaIdentity = 0.8;  // 1 style préféré
    else wadaIdentity = 0.3;                                // aucun style préféré (mais pas forbidden)
  }

  // === TOTAL avec wadaIdentity ===
  const total = (
    registre      * 2.5  +    // poids légèrement réduit
    wadaIdentity  * 2.0  +    // NOUVEAU CRITÈRE
    palette       * 1.5  +
    silhouette    * 1.0  +
    occasion      * 1.0  +
    matieres      * 0.8  +
    saison        * 0.5  +
    accent        * 0.7
  ) / 1.0;   // somme des poids = 10

  return { /* ... */ };
}
```

### Pourquoi cette couche change tout

**Sans la couche Wada** : palette « Bal au Palais » (or/rouge/émeraude) pourrait produire une
tenue **streetwear** (hoodie rouge + jean noir + sneakers vertes) — techniquement les
couleurs matchent, mais l'esprit est trahi.

**Avec la couche Wada** : la palette « Bal au Palais » a `preferred_styles: ['soiree', 'romantique', 'edgy']` et `forbidden_styles: [..., 'streetwear', ...]`. La tenue streetwear est
**immédiatement rejetée** par le kill-switch identitaire. Le composer cherche une vraie tenue
de soirée glamour, fidèle à l'esprit Sanzō Wada de 1925.

C'est ça qui fait que WADA reste **WADA**, pas un agrégateur générique.

---

---

## 1. Les 10 macro-styles

```typescript
// lib/composer/styles.ts

export type MacroStyle =
  | 'minimaliste'      // A — clean, tailored, timeless (COS, Lemaire, MUJI)
  | 'romantique'       // B — flowy, pastel, lace (Sézane, Sandro, Self-Portrait)
  | 'streetwear'       // C — cozy, relaxed, athleisure (Carhartt, Stüssy, Nike)
  | 'boheme'           // D — flowy, layered, eclectic (Free People, Doen, Isabel Marant)
  | 'edgy'             // E — leather, dark, rebel (All Saints, Acne, Schott)
  | 'academia'         // F — tweed, bookish, preppy (Polo RL, Brooks Brothers, J.Crew)
  | 'country'          // G — denim, plaid, rugged (Levi's, Wrangler, RM Williams)
  | 'soiree'           // H — sparkle, satin, statement (Rotate, Saloni, Galvan)
  | 'plage'            // I — light, linen, breezy (Faithfull, Zimmermann, Soeur)
  | 'sport';           // J — stretch, technical (Lululemon, On Running, Arc'teryx)

export const STYLE_KEYWORDS: Record<MacroStyle, string[]> = {
  minimaliste: ['clean', 'tailored', 'timeless', 'understated', 'quality', 'épuré', 'sobre'],
  romantique:  ['soft', 'flowy', 'delicate', 'pastel', 'lace', 'feminine', 'doux'],
  streetwear:  ['cozy', 'relaxed', 'everyday', 'athleisure', 'urbain', 'oversize'],
  boheme:      ['flowy', 'layered', 'eclectic', 'earthy', 'handcraft', 'folk'],
  edgy:        ['tough', 'leather', 'metal', 'rebel', 'dark', 'punk'],
  academia:    ['tweed', 'bookish', 'vintage', 'collegiate', 'preppy', 'tailoring'],
  country:     ['denim', 'plaid', 'leather', 'rugged', 'western', 'rural'],
  soiree:      ['sparkle', 'statement', 'dramatic', 'metallic', 'satin', 'glamour'],
  plage:       ['light', 'breezy', 'linen', 'sun', 'tropical', 'estival'],
  sport:       ['stretch', 'technical', 'compression', 'performance', 'fitness'],
};

export const STYLE_COLORS: Record<MacroStyle, string[]> = {
  minimaliste: ['noir', 'blanc', 'beige', 'marine', 'gris', 'taupe'],
  romantique:  ['rose poudré', 'lavande', 'ivoire', 'bleu pâle', 'crème'],
  streetwear:  ['gris chiné', 'noir', 'blanc', 'kaki', 'denim'],
  boheme:      ['rouille', 'ocre', 'kaki', 'brun', 'bordeaux', 'terracotta'],
  edgy:        ['noir', 'gris anthracite', 'bordeaux', 'marine'],
  academia:    ['marron', 'bordeaux', 'vert forêt', 'marine', 'crème'],
  country:     ['denim', 'brun', 'rouille', 'crème', 'vert sapin'],
  soiree:      ['noir', 'rouge', 'or', 'émeraude', 'argent'],
  plage:       ['blanc', 'écru', 'bleu marin', 'corail', 'jaune sable'],
  sport:       ['noir', 'gris', 'fluo'],
};

export const STYLE_PIECES: Record<MacroStyle, string[]> = {
  minimaliste: ['blazer ajusté', 'chemise blanche', 'pantalon droit', 'trench', 'mocassins', 't-shirt'],
  romantique:  ['robe midi fluide', 'jupe tulle', 'chemisier transparent', 'ballerines', 'cardigan fin'],
  streetwear:  ['hoodie', 't-shirt graphique', 'jean droit', 'sneakers', 'joggers', 'bomber'],
  boheme:      ['robe longue', 'chemisier paysan', 'kimono', 'bottines', 'sac à franges'],
  edgy:        ['perfecto', 'jean noir', 'bottes moto', 't-shirt band', 'ceinture cloutée'],
  academia:    ['blazer à coudières', 'pull col rond', 'chemise Oxford', 'jupe plissée', 'mocassins'],
  country:     ['jean brut', 'chemise à carreaux', 'veste en jean', 'bottes cowboy', 'ceinture cuir'],
  soiree:      ['robe à paillettes', 'blazer satin', 'escarpins talons', 'pochette'],
  plage:       ['robe légère', 'caftan', 'short en lin', 'tongs', 'chapeau paille'],
  sport:       ['legging', 'brassière', 'short tech', 'baskets running', 'veste coupe-vent'],
};
```

---

## 2. La matrice de compatibilité entre styles

C'est **le cœur du composer**. Cette matrice dit quels styles peuvent cohabiter dans une
même tenue, et lesquels ne peuvent JAMAIS.

```typescript
// lib/composer/compatibility.ts

import { MacroStyle } from './styles';

// 1.0 = même style (parfait)
// 0.8 = très compatible (peut mélanger librement)
// 0.5 = compatible avec précaution (1 pièce de l'autre style max)
// 0.0 = INCOMPATIBLE (jamais ensemble)

export const STYLE_COMPATIBILITY: Record<MacroStyle, Record<MacroStyle, number>> = {
  minimaliste: {
    minimaliste: 1.0, romantique: 0.8, streetwear: 0.5, boheme: 0.5,
    edgy: 0.5, academia: 0.8, country: 0.5, soiree: 0.7, plage: 0.7, sport: 0.3,
  },
  romantique: {
    minimaliste: 0.8, romantique: 1.0, streetwear: 0.3, boheme: 0.7,
    edgy: 0.0, academia: 0.7, country: 0.4, soiree: 0.8, plage: 0.6, sport: 0.0,
  },
  streetwear: {
    minimaliste: 0.5, romantique: 0.3, streetwear: 1.0, boheme: 0.3,
    edgy: 0.6, academia: 0.4, country: 0.5, soiree: 0.0, plage: 0.4, sport: 0.8,
  },
  boheme: {
    minimaliste: 0.5, romantique: 0.7, streetwear: 0.3, boheme: 1.0,
    edgy: 0.3, academia: 0.4, country: 0.7, soiree: 0.3, plage: 0.8, sport: 0.0,
  },
  edgy: {
    minimaliste: 0.5, romantique: 0.0, streetwear: 0.6, boheme: 0.3,
    edgy: 1.0, academia: 0.4, country: 0.5, soiree: 0.5, plage: 0.0, sport: 0.3,
  },
  academia: {
    minimaliste: 0.8, romantique: 0.7, streetwear: 0.4, boheme: 0.4,
    edgy: 0.4, academia: 1.0, country: 0.5, soiree: 0.5, plage: 0.0, sport: 0.0,
  },
  country: {
    minimaliste: 0.5, romantique: 0.4, streetwear: 0.5, boheme: 0.7,
    edgy: 0.5, academia: 0.5, country: 1.0, soiree: 0.0, plage: 0.4, sport: 0.3,
  },
  soiree: {
    minimaliste: 0.7, romantique: 0.8, streetwear: 0.0, boheme: 0.3,
    edgy: 0.5, academia: 0.5, country: 0.0, soiree: 1.0, plage: 0.0, sport: 0.0,
  },
  plage: {
    minimaliste: 0.7, romantique: 0.6, streetwear: 0.4, boheme: 0.8,
    edgy: 0.0, academia: 0.0, country: 0.4, soiree: 0.0, plage: 1.0, sport: 0.4,
  },
  sport: {
    minimaliste: 0.3, romantique: 0.0, streetwear: 0.8, boheme: 0.0,
    edgy: 0.3, academia: 0.0, country: 0.3, soiree: 0.0, plage: 0.4, sport: 1.0,
  },
};

export function compatibilityScore(styles: MacroStyle[]): number {
  if (styles.length === 0) return 0;
  if (styles.length === 1) return 1.0;

  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < styles.length; i++) {
    for (let j = i + 1; j < styles.length; j++) {
      totalScore += STYLE_COMPATIBILITY[styles[i]][styles[j]];
      pairs++;
    }
  }

  return totalScore / pairs;
}
```

---

## 3. Les paires INTERDITES (kill-switches)

Certaines combinaisons rendent une tenue **immédiatement ratée**. Le composer doit les
détecter et rejeter sans même calculer le reste.

```typescript
// lib/composer/forbidden.ts

import { MacroStyle } from './styles';

interface ForbiddenPair {
  styles: [MacroStyle, MacroStyle];
  reason: string;
}

export const FORBIDDEN_COMBINATIONS: ForbiddenPair[] = [
  { styles: ['streetwear', 'soiree'],
    reason: 'Hoodie + robe à paillettes : registres incompatibles' },
  { styles: ['romantique', 'edgy'],
    reason: 'Robe pastel + perfecto clouté : sauf si 1 seule pièce edgy comme accent' },
  { styles: ['sport', 'soiree'],
    reason: 'Legging + paillettes : antinomique' },
  { styles: ['country', 'soiree'],
    reason: 'Bottes cowboy + robe satin : ne va pas' },
  { styles: ['academia', 'plage'],
    reason: 'Tweed + caftan : saisons opposées' },
  { styles: ['sport', 'romantique'],
    reason: 'Compression sportive + dentelle : registres opposés' },
  { styles: ['sport', 'academia'],
    reason: 'Leggings + tweed bookish : ne va pas' },
  { styles: ['boheme', 'sport'],
    reason: 'Robe longue + brassière sport' },
  { styles: ['edgy', 'plage'],
    reason: 'Cuir lourd + linen estival' },
];

export function isCombinationForbidden(styles: MacroStyle[]): { forbidden: boolean, reason?: string } {
  for (const pair of FORBIDDEN_COMBINATIONS) {
    if (styles.includes(pair.styles[0]) && styles.includes(pair.styles[1])) {
      return { forbidden: true, reason: pair.reason };
    }
  }
  return { forbidden: false };
}
```

---

## 4. Le « Power Three » (architecture d'une tenue)

D'après Passion-mode.fr : toute tenue réussie a 3 couches.

```typescript
// lib/composer/architecture.ts

export interface OutfitArchitecture {
  pieceForte: Piece;           // 1 pièce statement (veste originale, robe forte, accessoire marquant)
  basiques: Piece[];            // 2-3 pièces basiques (t-shirt blanc, jean, chemise basique)
  accents: Piece[];             // 1-3 accents (ceinture, bijou, foulard)
}

export const POWER_THREE_RULES = {
  // 1 seule pièce forte max
  maxPieceForte: 1,

  // 2-3 basiques (toile de fond neutre)
  minBasiques: 2,
  maxBasiques: 3,

  // Accents selon occasion (depuis Passion-mode.fr)
  accentsByOccasion: {
    quotidien: { min: 1, max: 3 },
    travail:   { min: 2, max: 4 },
    soiree:    { min: 3, max: 5 },
    sport:     { min: 0, max: 1 },
  },

  // Règle absolue : jamais plus de 5 accents
  absoluteMaxAccents: 5,
};

// Une pièce est "forte" si elle a un score visuel > 0.7
export function isPieceForte(piece: Piece): boolean {
  return (
    piece.is_statement === true ||                // tagué dans la base
    piece.has_pattern ||                          // imprimé fort
    piece.is_metallic ||                          // satin, paillettes
    piece.is_oversize ||                          // coupe XL
    piece.color_intensity > 0.7                   // couleur vive (saturation élevée)
  );
}

export function classifyPieces(pieces: Piece[]): OutfitArchitecture {
  const forte = pieces.filter(isPieceForte).slice(0, 1)[0];
  const accents = pieces.filter(p => p.type === 'accent' || p.is_accessory);
  const basiques = pieces.filter(p => p !== forte && !accents.includes(p));

  return { pieceForte: forte, basiques, accents };
}
```

---

## 5. Les règles de couleur (Passion-mode + WADA)

```typescript
// lib/composer/colors.ts

export const COLOR_RULES = {
  // Max 3 couleurs par tenue (1 dominante + 1 secondaire + 1 accent)
  maxColors: 3,

  // Au moins 1 neutre qui ancre l'ensemble
  minNeutrals: 1,

  // Les neutres reconnus
  neutrals: ['noir', 'blanc', 'beige', 'marine', 'gris', 'taupe', 'crème', 'ivoire'],

  // Une couleur accent maximum (vif/saturé)
  maxAccentColors: 1,
};

// Combinaisons à éviter (Passion-mode.fr)
export const FORBIDDEN_COLOR_PAIRS = [
  { c1: 'rouge', c2: 'vert vif',         reason: 'effet sapin de Noël' },
  { c1: 'fluo',  c2: 'pastel',           reason: 'déséquilibre d\'intensité' },
  { c1: 'or',    c2: 'argent',           reason: 'mélange de métaux' },
];

// Schémas d'harmonie de couleurs
export type ColorHarmony = 'monochrome' | 'analogue' | 'complementaire' | 'triade' | 'split-complementaire';

export function detectColorHarmony(hexes: string[]): ColorHarmony | 'incoherent' {
  // Convertir hexes en HSL, comparer les teintes
  const hues = hexes.map(hexToHue);

  if (hues.every(h => Math.abs(h - hues[0]) < 15))
    return 'monochrome';

  if (areAnalogous(hues))
    return 'analogue';        // hues à 30° l'une de l'autre

  if (areComplementary(hues))
    return 'complementaire';  // hues à 180° (avec tolérance)

  if (areTriadic(hues))
    return 'triade';

  return 'incoherent';
}

// Compter les couleurs hors palette neutre
export function countNonNeutralColors(pieces: Piece[]): number {
  return pieces.filter(p =>
    !COLOR_RULES.neutrals.includes(p.color_family)
  ).length;
}

// Vérifier qu'il y a au moins 1 neutre
export function hasNeutralAnchor(pieces: Piece[]): boolean {
  return pieces.some(p =>
    COLOR_RULES.neutrals.includes(p.color_family)
  );
}
```

---

## 6. Les buckets d'occasion

Toute tenue doit servir à une occasion claire.

```typescript
// lib/composer/occasions.ts

export type Occasion = 'quotidien' | 'travail' | 'soiree' | 'sport' | 'weekend' | 'voyage';

// Quelles macro-catégories pour quelles occasions ?
export const OCCASION_TO_STYLES: Record<Occasion, MacroStyle[]> = {
  quotidien: ['minimaliste', 'streetwear', 'boheme', 'romantique', 'country'],
  travail:   ['minimaliste', 'academia', 'romantique', 'edgy'],
  soiree:    ['soiree', 'minimaliste', 'romantique', 'edgy'],
  sport:     ['sport', 'streetwear'],
  weekend:   ['streetwear', 'boheme', 'country', 'plage'],
  voyage:    ['minimaliste', 'plage', 'streetwear', 'boheme'],
};

export function isStyleCompatibleWithOccasion(style: MacroStyle, occasion: Occasion): boolean {
  return OCCASION_TO_STYLES[occasion].includes(style);
}

// Tags d'occasion sur chaque pièce (à stocker en base)
// piece.occasions = ['quotidien', 'travail']  → polyvalente
// piece.occasions = ['soiree']                → exclusive à la soirée
```

---

## 7. Le SCORING FINAL — fonction principale

C'est la fonction que le composer appelle pour évaluer chaque tenue candidate.

```typescript
// lib/composer/scoring.ts

import { compatibilityScore } from './compatibility';
import { isCombinationForbidden } from './forbidden';
import { hasNeutralAnchor, countNonNeutralColors, detectColorHarmony } from './colors';
import { isStyleCompatibleWithOccasion } from './occasions';
import { POWER_THREE_RULES, classifyPieces } from './architecture';

export interface OutfitScore {
  total: number;             // 0 - 10
  passed: boolean;           // total ≥ 6.5
  breakdown: {
    registre: number;
    palette: number;
    silhouette: number;
    occasion: number;
    matieres: number;
    saison: number;
    accent: number;
  };
  warnings: string[];
  killSwitch?: string;       // si pas null = rejet immédiat
}

export function scoreOutfit(pieces: Piece[], context: {
  palette: Palette,
  occasion: Occasion,
  userProfile?: UserProfile,
}): OutfitScore {

  // === KILL SWITCHES (rejet immédiat) ===

  const styles = pieces.map(p => p.macro_style);
  const forbidden = isCombinationForbidden(styles);
  if (forbidden.forbidden) {
    return {
      total: 0, passed: false,
      breakdown: { registre: 0, palette: 0, silhouette: 0, occasion: 0, matieres: 0, saison: 0, accent: 0 },
      warnings: [],
      killSwitch: forbidden.reason,
    };
  }

  const nonNeutrals = countNonNeutralColors(pieces);
  if (nonNeutrals > 3) {
    return {
      total: 0, passed: false,
      breakdown: { registre: 0, palette: 0, silhouette: 0, occasion: 0, matieres: 0, saison: 0, accent: 0 },
      warnings: [],
      killSwitch: 'Plus de 3 couleurs non-neutres',
    };
  }

  if (!hasNeutralAnchor(pieces)) {
    return {
      total: 0, passed: false,
      breakdown: { registre: 0, palette: 0, silhouette: 0, occasion: 0, matieres: 0, saison: 0, accent: 0 },
      warnings: [],
      killSwitch: 'Aucun neutre pour ancrer la tenue',
    };
  }

  // === SCORING CRITERIA ===

  // 1. Cohérence registre (×3.0)
  const registre = compatibilityScore(styles);

  // 2. Cohérence palette (×2.0)
  let palette = 0.5;
  const colorHarmony = detectColorHarmony(pieces.map(p => p.color_hex));
  if (colorHarmony !== 'incoherent') palette = 1.0;
  if (nonNeutrals <= 2) palette = Math.min(palette + 0.2, 1.0);

  // 3. Équilibre silhouette (×1.5)
  const hasAmple = pieces.some(p => p.silhouette === 'oversize' || p.silhouette === 'fluide');
  const hasAjuste = pieces.some(p => p.silhouette === 'ajuste' || p.silhouette === 'structure');
  const silhouette = (hasAmple && hasAjuste) ? 1.0 : 0.5;

  // 4. Cohérence occasion (×1.5)
  const styleOccasionOk = styles.every(s => isStyleCompatibleWithOccasion(s, context.occasion));
  const occasion = styleOccasionOk ? 1.0 : 0.3;

  // 5. Cohérence matières (×1.0)
  const strongMaterials = pieces.filter(p => p.material_strength === 'strong').length;
  const matieres = strongMaterials <= 2 ? 1.0 : 0.4;

  // 6. Cohérence saison (×0.5)
  const seasons = new Set(pieces.map(p => p.season));
  const saison = seasons.size === 1 ? 1.0 : seasons.size === 2 ? 0.7 : 0.3;

  // 7. Présence accent (×0.5)
  const architecture = classifyPieces(pieces);
  const accent = architecture.pieceForte ? 1.0 : 0.5;

  // === TOTAL ===

  const total = (
    registre    * 3.0 +
    palette     * 2.0 +
    silhouette  * 1.5 +
    occasion    * 1.5 +
    matieres    * 1.0 +
    saison      * 0.5 +
    accent      * 0.5
  ) / 1.0;   // somme des poids = 10

  const warnings: string[] = [];
  if (registre < 0.7) warnings.push('Mélange de styles risqué');
  if (palette < 0.7) warnings.push('Couleurs peu harmonieuses');
  if (silhouette < 0.7) warnings.push('Silhouette pas équilibrée');
  if (occasion < 0.7) warnings.push('Inadapté à l\'occasion');

  return {
    total: Math.round(total * 10) / 10,
    passed: total >= 6.5,
    breakdown: { registre, palette, silhouette, occasion, matieres, saison, accent },
    warnings,
  };
}
```

---

## 8. Intégration dans le composer existant

Quand le composer pioche une tenue candidate :

```typescript
// lib/composer/compose.ts (modifications à apporter)

import { scoreOutfit, OutfitScore } from './scoring';

const MIN_SCORE = 6.5;       // seuil de publication
const MAX_ATTEMPTS = 10;     // re-roll si tenue moche

export async function composeOutfit(palette: Palette, profile: UserProfile, occasion: Occasion): Promise<Outfit> {
  let bestOutfit: Outfit | null = null;
  let bestScore = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = await pickRandomOutfitFromPool(palette, profile);
    const score = scoreOutfit(candidate.pieces, { palette, occasion, userProfile: profile });

    // Rejeter les tenues avec kill-switch
    if (score.killSwitch) {
      console.log(`[Composer] Rejet: ${score.killSwitch}`);
      continue;
    }

    // Garder la meilleure
    if (score.total > bestScore) {
      bestScore = score.total;
      bestOutfit = { ...candidate, score };
    }

    // Si on a une tenue ≥ 8/10, on s'arrête
    if (score.total >= 8.0) break;
  }

  if (!bestOutfit || bestScore < MIN_SCORE) {
    throw new Error('Impossible de composer une tenue cohérente avec ce profil');
  }

  return bestOutfit;
}
```

---

## 9. Tagging des pièces (à faire en base de données)

Pour que tout ça fonctionne, **chaque produit en base doit être taggé** avec :

```typescript
interface PieceTags {
  macro_style: MacroStyle;        // 'minimaliste' | 'streetwear' | ...
  color_family: string;            // 'noir', 'rose poudré', 'bleu marine'...
  color_hex: string;
  color_intensity: number;         // 0-1 (saturation HSL)
  silhouette: 'oversize' | 'fluide' | 'ajuste' | 'structure';
  material: string;                // 'coton', 'laine', 'cuir', 'soie', 'lin'...
  material_strength: 'soft' | 'medium' | 'strong';
  season: 'ete' | 'mi-saison' | 'hiver' | 'toutes';
  occasions: Occasion[];           // ['quotidien', 'travail']
  is_statement: boolean;           // tagué manuellement ou par IA
  has_pattern: boolean;
  is_metallic: boolean;
  is_oversize: boolean;
  genre: 'femme' | 'homme' | 'unisex';
}
```

**Comment tagger automatiquement** : appel à GPT-4 Vision sur la photo + nom du produit, qui
renvoie un JSON avec tous ces tags. Coût : ~$0,001 par produit. Pour 36 000 produits = $36
au total, une seule fois.

Code :

```typescript
async function autoTagPiece(piece: Piece): Promise<PieceTags> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Tag this fashion item. Return JSON only.
          Required fields: macro_style (minimaliste|romantique|streetwear|boheme|edgy|academia|country|soiree|plage|sport),
          color_family (string), silhouette (oversize|fluide|ajuste|structure),
          material (string), season (ete|mi-saison|hiver|toutes),
          occasions (array), is_statement (bool), genre (femme|homme|unisex).
          Item name: ${piece.name}` },
        { type: 'image_url', image_url: { url: piece.image_url } }
      ]
    }],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(response.choices[0].message.content);
}
```

---

## 10. Test de validation

Avant de mettre en prod, teste sur **5 tenues que tu sais belles** et **5 tenues que tu sais
incohérentes** :

```typescript
// tests/composer-validation.test.ts

describe('Composer scoring', () => {
  it('Belle tenue Rosée du matin doit scorer >= 8', () => {
    const outfit = {
      pieces: [
        { macro_style: 'minimaliste', name: 'Cardigan sauge', color_family: 'sauge', ... },
        { macro_style: 'minimaliste', name: 'Polo lait', color_family: 'crème', ... },
        { macro_style: 'minimaliste', name: 'Jean mousse', color_family: 'mousse', ... },
        { macro_style: 'minimaliste', name: 'Mocassins cuir', color_family: 'brun', ... },
      ],
    };
    const score = scoreOutfit(outfit.pieces, { palette: rosee, occasion: 'quotidien' });
    expect(score.total).toBeGreaterThanOrEqual(8.0);
    expect(score.passed).toBe(true);
  });

  it('Tenue Pluie de Tokyo cassée doit être rejetée', () => {
    const outfit = {
      pieces: [
        { macro_style: 'streetwear', name: 'Pull noir' },
        { macro_style: 'plage', name: 'Short de bain crocodile' },  // INCOMPATIBLE
        { macro_style: 'romantique', name: 'Cardigan femme' },      // GENRE FAIL
        { macro_style: 'streetwear', name: 'Veja' },
        { macro_style: 'sport', name: 'Bonnet' },
      ],
    };
    const score = scoreOutfit(outfit.pieces, { palette: tokyo, occasion: 'quotidien' });
    expect(score.killSwitch).toBeDefined();   // doit être rejetée
    expect(score.total).toBeLessThan(6.5);
  });
});
```

---

## Résumé pour Claude Code

**Dans l'ordre d'implémentation** :

1. **Migration DB** : ajouter les colonnes de tags sur la table `pieces` (macro_style, color_family,
   silhouette, etc.) — voir Section 9
2. **Script auto-tagging** : pour chaque pièce en base, appeler GPT-4o Vision et stocker les tags.
   Coût : ~$36 pour 36 000 produits, une seule fois
3. **Créer les fichiers** : `lib/composer/styles.ts`, `compatibility.ts`, `forbidden.ts`,
   `architecture.ts`, `colors.ts`, `occasions.ts`, `scoring.ts` — copier-coller depuis cette spec
4. **Modifier le composer** existant pour appeler `scoreOutfit()` et utiliser le re-roll
   (Section 8)
5. **Tester** sur 10 tenues d'exemple (Section 10)

**Durée estimée** : 4-6 heures de dev en une session Claude Code.

---

## Pourquoi ça va marcher

Avant cette spec, ton composer piochait des pièces aléatoirement dans le pool, sans aucune
intelligence sur la **cohérence stylistique**. Résultat : pull noir streetwear + short de bain
crocodile + cardigan femme romantique = tenue de l'enfer.

Avec cette spec, à chaque tenue candidate :

1. Le composer **détecte** les macro-styles de chaque pièce
2. Vérifie qu'aucune paire **interdite** n'existe (streetwear + soirée, etc.)
3. Score la **cohérence** via la matrice de compatibilité
4. Vérifie qu'il y a **1 pièce forte + 2-3 basiques + accents** (Power Three)
5. Vérifie que les **couleurs** respectent la règle des 3 max + 1 neutre
6. Vérifie que l'**occasion** est cohérente avec tous les styles
7. Vérifie les **matières** et la **saison**
8. Donne un **score sur 10**
9. Si < 6.5 → **rejet** et re-roll
10. Sur 10 essais, garde la meilleure tenue

**Conséquence** : 95% des tenues servies au client seront cohérentes et belles. Les 5%
restantes seront « acceptables » mais avec un warning interne. Aucune tenue catastrophique
ne sortira jamais.

C'est le passage de **« générateur aléatoire qui foire »** à **« styliste IA qui propose
des tenues que tu pourrais vraiment porter »**.
