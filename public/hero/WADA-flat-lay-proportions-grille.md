# WADA — Proportions réelles et grille spatiale du flat lay

Spec à donner au codeur pour que le flat lay respecte les vraies tailles des pièces (un cardigan
fait 70 cm, des mocassins 28 cm) et suive un plan spatial cohérent au lieu d'aligner tout
sur une grille uniforme.

---

## Le principe

Toutes les pièces sont **dessinées à l'échelle 1**, comme si on les posait vraiment côte à côte sur
une table de 240×240 cm. Le canvas final est **1200×1200 pixels = 240×240 cm réels**, donc
**1 cm = 5 pixels**.

Cette règle garantit que :

- Un cardigan paraît plus grand qu'un polo, qui paraît plus grand que des chaussures
- Une robe longue prend toute la hauteur, un short prend un tiers
- Des boutons de manchette restent **minuscules** (et non « gros bijou flou »)
- L'œil du client perçoit la tenue comme une **vraie composition**, pas comme un puzzle abstrait

---

## Tailles réelles par type de pièce

### Mesures observées dans le retail moyen (taille L/40 homme, 38/M femme)

| Type | Largeur réelle | Hauteur réelle | Pixels (×5) |
|---|---|---|---|
| Manteau long (Brunello, Tom Ford) | 75 cm | 110 cm | 375 × 550 |
| Manteau court / blazer | 70 cm | 80 cm | 350 × 400 |
| Cardigan / pull | 65 cm | 70 cm | 325 × 350 |
| Veste de costume | 70 cm | 75 cm | 350 × 375 |
| Chemise / polo (déposée à plat) | 55 cm | 70 cm | 275 × 350 |
| T-shirt | 50 cm | 65 cm | 250 × 325 |
| Robe courte | 50 cm | 90 cm | 250 × 450 |
| Robe longue | 55 cm | 130 cm | 275 × 650 |
| Pantalon / jean | 40 cm | 105 cm | 200 × 525 |
| Short | 40 cm | 45 cm | 200 × 225 |
| Jupe midi | 50 cm | 70 cm | 250 × 350 |
| Mocassins / derbies (paire) | 28 cm | 12 cm | 140 × 60 |
| Sneakers (paire) | 30 cm | 13 cm | 150 × 65 |
| Bottes (paire) | 30 cm | 35 cm | 150 × 175 |
| Sac à main | 30 cm | 25 cm | 150 × 125 |
| Ceinture (enroulée) | 18 cm | 18 cm | 90 × 90 |
| Boutons de manchette / bagues | 4 cm | 4 cm | 20 × 20 |
| Montre | 6 cm | 6 cm | 30 × 30 |
| Foulard (plié) | 25 cm | 25 cm | 125 × 125 |
| Lunettes | 14 cm | 5 cm | 70 × 25 |

### Marge d'air autour des objets

Chaque pièce doit avoir **30-50 px de respiration** entre elle et la suivante. Ne pas coller les
silhouettes l'une contre l'autre (sauf overlap intentionnel pour effet « en train d'être enfilé »).

---

## La grille spatiale 3×3

Le canvas 1200×1200 est divisé en **3 zones horizontales** et **3 colonnes** :

```
        col gauche       col centre      col droite
        (0-400)          (400-800)       (800-1200)
       ┌───────────────┬───────────────┬───────────────┐
zone 1 │               │               │               │
hero   │   VESTE       │   VESTE       │   HAUT        │
0-560  │   (étalée)    │   (étalée)    │               │
       ├───────────────┼───────────────┼───────────────┤
zone 2 │               │               │               │
core   │   BAS         │   (vide ou    │   CHAUSSURES  │
560-860│   (vertical)  │    accessoire)│               │
       ├───────────────┼───────────────┼───────────────┤
zone 3 │               │               │               │
foot   │   (vide)      │   CHAUSSURES  │   ACCENT      │
860-   │               │               │   (petit)     │
1200   │               │               │               │
       └───────────────┴───────────────┴───────────────┘
```

### Zone 1 (haut) — Le hero

C'est **la pièce la plus visuelle** de la tenue. En général :
- L'**outerwear** s'il y en a (manteau, blazer, cardigan)
- Sinon **le haut principal** s'étire ici

Elle occupe **50-65% de la largeur** du canvas en colonnes 1-2.

Le **haut** (polo, chemise, t-shirt) prend la colonne 3 à côté.

### Zone 2 (milieu) — Le core

C'est où vit le **bas** (jean, pantalon, jupe) — **vertical, étiré sur 2 zones** si c'est un
pantalon long, ou compact en zone 2 seule si c'est un short.

Les **chaussures** se posent en colonne 3, **à côté** du bas — ou en zone 3 si on veut une
composition plus aérée.

### Zone 3 (bas) — Les pieds & accents

C'est où vont :
- **Les chaussures** (si pas placées en zone 2)
- **Les accents** : bijoux, montre, lunettes, ceinture
- Optionnellement **un prop** : brindille d'eucalyptus, papier plié, tasse à café (signature WADA)

---

## Templates de layout selon la composition

### Template A — Tenue avec manteau (homme casual chic)

```
Pièces : manteau + chemise + jean + derbies + montre
```

| Slot | Position canvas | Taille | Justification |
|---|---|---|---|
| Manteau | (160, 80) | 380×440 | Hero supérieur, centré gauche |
| Chemise | (640, 130) | 330×340 | Droite du manteau, légèrement décalée |
| Jean | (220, 540) | 220×520 | Sous manteau, vertical |
| Derbies | (640, 720) | 240×120 | Sous chemise |
| Montre | (840, 920) | 60×60 | Coin bas-droite |

### Template B — Tenue robe (femme)

```
Pièces : robe + cardigan + boots + sac + boucles d'oreilles
```

| Slot | Position | Taille | Justification |
|---|---|---|---|
| Robe | (200, 80) | 280×800 | Hero central, tout en hauteur |
| Cardigan | (560, 100) | 380×400 | Posé à côté comme superposition |
| Boots | (560, 580) | 220×280 | Sous cardigan |
| Sac | (820, 920) | 240×200 | Coin bas-droite |
| Bijoux | (820, 200) | 80×80 | Petit en haut-droite |

### Template C — Tenue casual unisexe (le cas WADA actuel : Rosée du matin)

```
Pièces : cardigan + polo + jean + mocassins + boutons de manchette
```

| Slot | Position | Taille | Justification |
|---|---|---|---|
| Cardigan | (110, 130) | 520×440 | Hero supérieur étalé bras ouverts |
| Polo | (795, 185) | 330×335 | À droite, plus petit |
| Jean | (175, 615) | 320×550 | Sous le cardigan, vertical |
| Mocassins | (580, 845) | 360×100 | Centre-droite, paire alignée |
| Boutons | (790, 1015) | 110×100 | Coin bas-droite, mini |

### Template D — Total look streetwear

```
Pièces : hoodie + t-shirt + cargo + sneakers + cap
```

| Slot | Position | Taille | Justification |
|---|---|---|---|
| Hoodie | (140, 100) | 460×460 | Hero gauche |
| T-shirt | (640, 130) | 360×420 | À droite |
| Cargo | (220, 600) | 280×500 | Sous hoodie |
| Sneakers | (620, 700) | 300×140 | Sous t-shirt |
| Cap | (760, 920) | 200×120 | Coin |

---

## Règles de redimensionnement automatique

Le codeur n'a pas besoin de coder tous les templates à la main. Une fonction
**`pickTemplate(outfit)`** suffit :

```typescript
interface Piece {
  slot: 'haut' | 'bas' | 'veste' | 'chaussures' | 'accent';
  type: string;  // 'cardigan' | 'manteau' | 'robe' | 'jean' | 'short' | etc.
}

const REAL_SIZES_CM = {
  manteau_long:    { w: 75,  h: 110 },
  manteau_court:   { w: 70,  h: 80  },
  cardigan:        { w: 65,  h: 70  },
  blazer:          { w: 70,  h: 75  },
  polo:            { w: 55,  h: 70  },
  tshirt:          { w: 50,  h: 65  },
  robe_courte:     { w: 50,  h: 90  },
  robe_longue:     { w: 55,  h: 130 },
  jean:            { w: 40,  h: 105 },
  pantalon:        { w: 40,  h: 105 },
  short:           { w: 40,  h: 45  },
  jupe:            { w: 50,  h: 70  },
  mocassins:       { w: 28,  h: 12  },
  sneakers:        { w: 30,  h: 13  },
  bottes:          { w: 30,  h: 35  },
  sac:             { w: 30,  h: 25  },
  ceinture:        { w: 18,  h: 18  },
  cufflinks:       { w: 4,   h: 4   },
  montre:          { w: 6,   h: 6   },
  foulard:         { w: 25,  h: 25  },
  lunettes:        { w: 14,  h: 5   },
};

const CM_TO_PX = 5;  // 1 cm = 5 px sur canvas 1200×1200

function getRealSize(pieceType: string): { w: number, h: number } {
  const cm = REAL_SIZES_CM[pieceType] ?? { w: 50, h: 50 };
  return { w: cm.w * CM_TO_PX, h: cm.h * CM_TO_PX };
}
```

### Algorithme de placement automatique

```typescript
function layoutFlatLay(pieces: Piece[]): LayoutPosition[] {
  // 1. Trier les pièces par taille décroissante (le hero d'abord)
  const sorted = [...pieces].sort((a, b) => {
    const sa = getRealSize(a.type);
    const sb = getRealSize(b.type);
    return (sb.w * sb.h) - (sa.w * sa.h);
  });

  // 2. Identifier le hero (la pièce la plus grande, généralement outerwear)
  const hero = sorted[0];

  // 3. Placement selon des règles fixes :
  const positions: LayoutPosition[] = [];

  // Hero en haut-gauche
  const heroSize = getRealSize(hero.type);
  positions.push({
    piece: hero,
    x: 110,
    y: 130,
    w: heroSize.w,
    h: heroSize.h,
  });

  // Haut (si distinct du hero) à droite du hero
  const top = pieces.find(p => p.slot === 'haut' && p !== hero);
  if (top) {
    const s = getRealSize(top.type);
    positions.push({
      piece: top,
      x: 110 + heroSize.w + 60,  // 60px de respiration
      y: 200,
      w: s.w,
      h: s.h,
    });
  }

  // Bas sous le hero
  const bottom = pieces.find(p => p.slot === 'bas');
  if (bottom) {
    const s = getRealSize(bottom.type);
    positions.push({
      piece: bottom,
      x: 175,
      y: 130 + heroSize.h + 60,
      w: s.w,
      h: s.h,
    });
  }

  // Chaussures à côté du bas
  const shoes = pieces.find(p => p.slot === 'chaussures');
  if (shoes) {
    const s = getRealSize(shoes.type);
    positions.push({
      piece: shoes,
      x: 580,
      y: 850,
      w: s.w,
      h: s.h,
    });
  }

  // Accent en bas à droite, petit
  const accent = pieces.find(p => p.slot === 'accent');
  if (accent) {
    const s = getRealSize(accent.type);
    positions.push({
      piece: accent,
      x: 850,
      y: 1020,
      w: s.w,
      h: s.h,
    });
  }

  return positions;
}
```

---

## Règles de polish (à respecter même en mode automatique)

### 1. Centre de gravité décalé en haut-gauche

Le **regard naturel** entre par le **haut-gauche** (point d'attention naturel en culture
occidentale). Le hero doit toujours être là, pas centré géométriquement parfait.

### 2. Asymétrie maîtrisée

Ne **jamais centrer rigoureusement** une pièce. Décaler de 10-30 px crée du dynamisme.
La symétrie parfaite paraît rigide et « catalogue » — l'asymétrie paraît « éditorial ».

### 3. Coins libres

Laisser **au moins 1 coin du canvas sans aucun objet** (en général le coin haut-droit ou
bas-gauche). Le vide donne de l'air à la composition. Net-a-Porter fait toujours ça.

### 4. Pas de rotation aléatoire

Les pièces sont **toutes orientées verticalement**, comme posées droites sur la table. Inclinations
seulement pour les chaussures (légèrement diagonales = ~5°) ou pour un foulard (jusqu'à 15°).

### 5. Ombres uniformes

Toutes les pièces partagent **la même source de lumière** : `dx=2, dy=5, blur=3, opacity=0.22`.
Évite l'effet « collage » où chaque pièce a sa propre ombre incohérente.

### 6. Marge bord canvas

Toujours laisser **au moins 60 px de marge** entre la pièce la plus extérieure et le bord du
canvas. Sans marge, les pièces paraissent « rognées ».

---

## Bonus — Les props éditoriaux (à ajouter à terme)

Pour passer du **bon** à l'**éditorial**, on peut ajouter un **prop secondaire** par tenue
selon la palette :

| Palette | Prop suggéré |
|---|---|
| Rosée du matin (vert sauge) | Brindille d'eucalyptus, posée à 15° |
| Pluie de Tokyo (bleu pluie) | Origami pliée, lettre japonaise |
| Osaka au thé (terracotta) | Petite tasse en céramique |
| Brume du matin (lait + sauge) | Page de livre cornée |
| Sumi-e (encre + papier) | Pinceau calligraphique posé |
| Bal au Palais (or + rouge) | Plume dorée, peigne d'écaille |

Le prop est **minuscule** (~80-120 px) et placé dans un coin libre. Il **ne distrait pas** mais
**signe la composition**. C'est ce qui transforme un flat lay produit en *moodboard de styliste*.

---

## Implémentation pour Claude Code demain

Ajoute cette spec au prompt d'implémentation du composite :

```
4. Avant la composition, calculer les positions des pièces via la fonction layoutFlatLay() :

   const REAL_SIZES_CM = { manteau_long: {w:75, h:110}, cardigan: {w:65, h:70}, ... }
   const CM_TO_PX = 5  // canvas 1200×1200 = 240×240 cm

   Pour chaque pièce :
   - Récupérer la taille réelle en cm depuis REAL_SIZES_CM[piece.type]
   - Convertir en pixels (× CM_TO_PX)
   - Placer selon le template C (tenue casual unisexe) par défaut :
     · Hero (la plus grosse pièce) en (110, 130)
     · Haut à droite du hero, espace 60px
     · Bas sous le hero, espace 60px
     · Chaussures en (580, 845)
     · Accent en (850, 1020)

5. Si la composition contient :
   - un manteau (plus grand qu'un cardigan) : utiliser template A
   - une robe : utiliser template B
   - un hoodie streetwear : utiliser template D
   - sinon : template C par défaut

6. Lors du resize dans Sharp, garder TOUJOURS l'aspect ratio (fit:'inside') pour ne
   pas déformer les pièces. Si une image est plus large que la zone allouée, elle
   est centrée dans cette zone.
```

---

## Test visuel rapide

Pour valider que le rendu est cohérent, après chaque génération de flat lay, affiche
**un test 1×1** :

```
Pièce | Taille pixel | Taille réelle | OK ?
─────────────────────────────────────────────
Cardigan | 325×350 px | 65×70 cm | ✓
Polo | 275×350 px | 55×70 cm | ✓
Jean | 200×525 px | 40×105 cm | ✓
Mocassins | 140×60 px | 28×12 cm | ✓
Boutons | 20×20 px | 4×4 cm | ✓
```

Si les boutons font plus de 50px ou les chaussures plus de 200px, **c'est qu'on a perdu l'échelle** —
le résultat ne sera pas crédible.

---

## Conclusion

**Avant** : pièces toutes à la même taille → effet catalogue, peu pro
**Après** : pièces à l'échelle 1, asymétrie maîtrisée, coin libre → effet éditorial Net-a-Porter

Ce changement est **gratuit** (pas de coût ajouté) et transforme drastiquement la perception du
site. C'est **le détail qui fait la différence** entre WADA et un agrégateur ordinaire.

L'implémentation tient en ~80 lignes de TypeScript (table des tailles + fonction
layoutFlatLay + 4 templates). À ajouter au prompt Claude Code demain en même temps que
l'implémentation Photoroom.
