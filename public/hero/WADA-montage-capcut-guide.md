# WADA — Guide de montage CapCut (vidéo lancement)

Pour assembler les 10 clips Kling sauvés dans `wada/public/hero/videos-kling/` en une vidéo
TikTok finale propre. Compte **2 à 3 heures** de montage. Tu peux le faire sur mobile ou desktop,
les étapes sont identiques.

---

## ÉTAPE 1 — Préparer CapCut

### 1.1 Créer le projet
- Ouvre CapCut, clique **« Nouveau projet »**.
- Sélectionne **Aspect ratio : 9:16** (portrait, format TikTok/Reels).
- Résolution cible : **1080×1920**.

### 1.2 Importer les 10 clips
Importe-les dans l'ordre (Plan 1 → Plan 10). Sur mobile, tu peux les transférer depuis
ton ordinateur via AirDrop, Google Drive, ou WhatsApp (à toi-même).

**Important** : tes clips Kling sont en **1920×1080 horizontal**. Dans CapCut, ils vont apparaître
avec des bandes noires en haut et en bas. Pas de panique, on règle ça à l'étape 2.

---

## ÉTAPE 2 — Recadrer chaque clip en vertical

Tous tes plans sont **centrés et symétriques** (Wes Anderson oblige), donc un crop central
fonctionne parfaitement.

### Pour chaque clip
1. Touche le clip dans la timeline pour le sélectionner.
2. Menu **« Recadrer »** (ou **Crop** en anglais).
3. Choisis **Format 9:16**.
4. Le rectangle de crop apparaît, **centré** par défaut — c'est exactement ce qu'on veut.
5. Ajuste légèrement vers le haut ou le bas si tu veux mieux cadrer le visage du personnage
   ou la lanterne japonaise du Plan 1.
6. Valide.

**Astuce** : sur certains plans (Plan 2, Plan 7) le sujet est plus bas dans l'image — descends
le rectangle de crop pour ne pas perdre les chaussures ou la cliente.

---

## ÉTAPE 3 — Ordre et durée de chaque clip

Voici la timeline finale visée. **Durée totale : ~40 secondes**.

| # | Plan | Durée à conserver | Coupe à faire |
|---|------|-------------------|---------------|
| 1 | Magasin | **4 s** | Garder du début jusqu'à `4.0s` |
| 2 | Chaussures | **3 s** | Garder du début jusqu'à `3.0s` |
| 3 | Hésitation | **3 s** | Garder du début jusqu'à `3.0s` |
| 4 | Téléphone app | **3 s** | Garder du début jusqu'à `3.0s` |
| 5 | Scan | **3 s** | Garder du début jusqu'à `3.0s` |
| 6 | Transition shōji | **2 s** | Garder du milieu (ouverture porte) |
| 7 | Monde palettes | **5 s** | Garder tout |
| 8 | Composition | **2.5 s** | **Garder seulement la fin** (de `2.5s` à `5s`) — où le personnage est habillé. Coupe le moment où le hoodie flotte vide. |
| 9 | Retour réel | **2.5 s** | Garder du début jusqu'à `2.5s` |
| 10 | Logo kanji | **4 s** | Garder tout |

**Total : 32 secondes** (parfait pour TikTok — l'algorithme préfère les vidéos courtes).

### Pour couper un clip dans CapCut
- Sélectionne le clip.
- Bouge la tête de lecture (le trait vertical blanc) à l'endroit où tu veux couper.
- Touche **« Split »** (ou les ciseaux 🔪).
- Sélectionne la partie à supprimer.
- Touche **« Delete »** (la corbeille 🗑️).

---

## ÉTAPE 4 — Ajouter les transitions

Entre chaque clip, ajoute une transition douce pour que l'enchaînement soit fluide.

### Recommandations par transition
- **Plan 1 → 2** : Cross-fade rapide (0.3s)
- **Plan 2 → 3** : Cross-fade rapide
- **Plan 3 → 4** : Cut sec (pas de transition — l'effet « elle sort son téléphone » est plus net sans)
- **Plan 4 → 5** : Cross-fade rapide
- **Plan 5 → 6** : Zoom-in (pour donner l'impression qu'on entre dans l'écran)
- **Plan 6 → 7** : Cross-fade rapide (l'ouverture shōji enchaîne sur le monde des palettes)
- **Plan 7 → 8** : Cut sec
- **Plan 8 → 9** : Zoom-out (sortir du monde claymation)
- **Plan 9 → 10** : Fade to white, puis le logo apparaît

### Comment ajouter une transition dans CapCut
1. Touche le petit carré entre deux clips dans la timeline.
2. Sélectionne **« Transition »** dans le menu.
3. Choisis l'effet (Cross-fade, Zoom, Fade to white…).
4. Règle la durée (0.3s pour Cross-fade rapide, 0.5s pour Zoom, 0.7s pour Fade to white).

---

## ÉTAPE 5 — Ajouter les textes de chapitres (bilingue FR/JP)

Les textes apparaissent en surimpression sur certains plans.

### Texte 1 — sur Plan 2 (1ère seconde du plan)
```
Chapitre I — La Trouvaille
第一章 · 出会い
```

### Texte 2 — sur Plan 7 (1ère seconde du plan)
```
Chapitre II — Le Choix
第二章 · 選び
```

### Texte 3 — sur Plan 8 (au moment où la casquette descend)
```
Chapitre III — La Tenue
第三章 · 装い
```

### Texte 4 — sur Plan 9 (dernière seconde)
```
WADA — l'art de s'habiller en couleur
```

### Réglages typographiques pour chaque texte
- **Police** : Fredoka (si dispo dans CapCut), sinon **Cormorant Garamond** (serif élégant Wes Anderson) ou **Playfair Display**.
- **Couleur** : Crème blanc cassé (#F4EEE4) avec une ombre portée légère pour contraste.
- **Position** : Centré, en haut de l'écran (à 15-20% du bord supérieur).
- **Taille** : Texte principal en gros (60-80pt), kanji en plus petit dessous (35-45pt).
- **Animation** : Apparition en fondu rapide (0.3s), restent visibles 1.5s, disparaissent en fondu rapide.

### Comment ajouter du texte dans CapCut
1. Place la tête de lecture à l'endroit où le texte doit apparaître.
2. Touche **« Text »** dans le menu du bas → **« Add text »**.
3. Tape le contenu (utilise un copier-coller pour les kanji).
4. Règle police, taille, couleur, position.
5. Ajuste la durée d'affichage en étirant les bords de la barre du texte dans la timeline.

---

## ÉTAPE 6 — Ajouter la musique

### Choisir la musique
Dans CapCut, va dans **« Audio »** → **« Sounds »** ou **« Music »**.

Cherche des termes comme :
- `wes anderson`
- `whimsical instrumental`
- `playful piano`
- `marimba quirky`

CapCut a une bibliothèque gratuite qui marche. Sinon, télécharge d'abord ton morceau depuis
**YouTube Audio Library** (gratuit, sans droits) ou **Artlist** (payant mais légal pour TikTok),
puis importe-le dans CapCut.

**Suggestions de pistes** :
- *« Quirky Whimsy »* (YouTube Audio Library)
- *« Marimba Playful »* (CapCut library)
- N'importe quel morceau d'Alexandre Desplat tagué « Wes Anderson » (mais attention aux droits)

### Régler le volume musique
- Volume principal : **70%** (pour laisser de la place aux sons d'effets).
- Fondu d'entrée : **0.5s** au début.
- Fondu de sortie : **1s** à la fin (pour finir en douceur sur le logo).

---

## ÉTAPE 7 — Ajouter les effets sonores

### Sons à ajouter (téléchargeables gratuitement sur Freesound.org ou Pixabay)

| Moment | Son | Recherche Freesound |
|--------|-----|---------------------|
| Plan 5 (moment du scan) | Chime cristallin | `crystal chime` ou `camera shutter vintage` |
| Plan 6 (ouverture shōji) | Glissement bois doux | `wooden sliding door` |
| Plan 7 (apparition palettes) | « Pop » magique | `magic pop` ou `sparkle` |
| Plan 8 (chaque vêtement qui se pose) | Petit taiko discret | `taiko drum hit soft` |
| Plan 10 (kanji tracé) | Coup de pinceau encre | `ink brush stroke` |

### Comment ajouter un son dans CapCut
1. Importe le son dans la bibliothèque (depuis ton téléphone/ordi).
2. Place la tête de lecture au moment voulu.
3. **« Audio »** → **« Sounds »** → choisis ton son.
4. Volume du son d'effet : **100%** (plein volume pour qu'on l'entende par-dessus la musique).
5. Ajuste sa position et sa durée dans la timeline.

---

## ÉTAPE 8 — Étalonner les couleurs (filtre global)

Pour donner l'unité Wes Anderson à toute la vidéo :

1. Sélectionne tous les clips (long press, puis « Sélectionner tout »).
2. Menu **« Adjust »** ou **« Filters »**.
3. Applique :
   - **Warmth** : +10 (teinte chaude)
   - **Saturation** : -10 (couleurs un peu désaturées, comme dans Wes Anderson)
   - **Brightness** : +5 (légère luminosité)
   - **Contrast** : +5
4. CapCut propose aussi des filtres préfaits, cherche **« Vintage »** ou **« Film »** — certains
   collent parfaitement à l'esthétique recherchée.

---

## ÉTAPE 9 — Vérifier le rendu final

Lance la prévisualisation du début à la fin. Vérifie :

- [ ] Tous les clips sont en 9:16 vertical
- [ ] Aucune bande noire visible
- [ ] Les transitions sont fluides (pas de saut brutal)
- [ ] Les textes de chapitres apparaissent au bon moment
- [ ] La musique se finit en douceur sur le logo
- [ ] Les sons d'effets sont audibles mais pas trop forts
- [ ] Le logo final (Plan 10) reste visible 3-4 secondes
- [ ] La durée totale est ~30-40 secondes

---

## ÉTAPE 10 — Exporter

1. Touche **« Export »** en haut à droite.
2. Réglages :
   - Résolution : **1080p**
   - Frame rate : **30 fps**
   - Quality : **Recommended** (équilibre poids/qualité)
   - Format : **MP4**
3. Lance l'export. Compte 2-5 minutes selon la longueur.

---

## ÉTAPE 11 — Publier

### TikTok
1. Ouvre TikTok, touche le **+** en bas.
2. Importe la vidéo depuis ta galerie.
3. **N'utilise PAS** les filtres TikTok (ils écraseraient l'étalonnage Wes Anderson).
4. Ajoute la description :
   ```
   348 palettes. 1 dictionnaire. Ta tenue. 🎨
   Découvre WADA — wada.style

   #wadastyle #aiartfashion #stopmotion #sanzowada #moodboardstyle #ootdinspo
   ```
5. Cover : choisis une frame du Plan 7 (les éventails) — la plus visuelle.
6. Publie.

### Instagram Reels
Même fichier. Dans Instagram, Reels → Importer → Adapter description.

### Pinterest Idea Pin
Pareil. Format vertical, garde la même description.

---

## Conseil final

Ne cherche pas la perfection. Une **première version « 80% »** publiée vaut mieux qu'une version
« 100% » jamais finie. Tu peux toujours faire une **v2** dans 2 mois avec les améliorations que tu
auras apprises au passage.

Et surtout : **prends une capture de chaque étape** pour la prochaine vidéo. Tu réutiliseras
exactement le même process.

Bonne création 🎬
