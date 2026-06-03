# WADA — Prompts COURTS pour Kling AI (mode pâte à modeler intégral)

Tous en anglais (Kling marche mieux comme ça). **Tous les plans en stop-motion claymation** —
esthétique pâte à modeler du premier au dernier plan, façon *Isle of Dogs* / *Fantastic Mr. Fox*
de Wes Anderson. Sweet spot 50-80 mots par prompt.

Format vertical à régler **dans l'interface Kling** (9:16), pas dans le texte. Idem durée.

## Réglages Kling à faire AVANT de coller le prompt

- **Aspect ratio** : sélectionner **9:16 (Portrait)** dans l'interface
- **Duration** : 5s ou 10s selon le plan
- **Quality** : Standard si gratuit, Pro si tu as des crédits
- **Mode** : Text-to-Video (ou Image-to-Video si tu as une image de référence)

---

## Les 10 prompts courts — TOUS EN CLAYMATION

### Plan 1 — Magasin (5s)
```
Stop motion claymation, Wes Anderson style, symmetric vertical frame. A miniature clay shoe
boutique with pastel pink and sage walls, wooden shelves, a tiny Japanese paper lantern. A clay
figure of a young woman with dark hair, white shirt, beige pants walks toward camera, stops at a
display. Visible clay texture, charming imperfections, warm lighting, dollhouse aesthetic.
```

### Plan 2 — Paire de chaussures (5s)
```
Stop motion claymation, Wes Anderson style, symmetric close-up. A pair of tiny grey clay sneakers
on a small wooden pedestal in a miniature clay shop. A clay hand enters from the right, picks up
the right shoe slowly. Pastel mint clay background, visible texture, soft warm lighting,
charming retro shoe shop aesthetic.
```

### Plan 3 — L'hésitation (5s)
```
Stop motion claymation, Wes Anderson style, centered medium close-up. A clay figure of a young
woman with dark hair, white shirt, holding a small grey clay sneaker. Deadpan clay expression,
her head tilts left then right slowly, one eyebrow rises. Pastel sage clay background, visible
clay texture, warm lighting, charming.
```

### Plan 4 — Sortie du téléphone (5s)
```
Stop motion claymation, Wes Anderson style, symmetric overhead shot. Two clay hands hold a tiny
clay smartphone on a cream pastel background. The phone screen shows a soft beige WADA app
interface with a bordeaux Scanner button. A thumb gently taps it. Visible clay texture,
dollhouse feel, soft warm light.
```

### Plan 5 — Le scan (5s)
```
Stop motion claymation, Wes Anderson style. View of a tiny clay smartphone in scanning mode. The
camera frames grey clay sneakers, a rectangular target frame pulses. A Japanese ink brush stroke
in black sumi-e calligraphy sweeps across the screen from left to right. Soft chime moment,
charming clay texture.
```

### Plan 6 — Transition shōji (5s)
```
Stop motion claymation transition, Wes Anderson style, vertical. Camera zooms into a tiny clay
smartphone screen. A Japanese sliding paper door (shōji) made of clay slides open horizontally
from the center, revealing another miniature clay world inside. Dolly-zoom, perfect symmetry,
magical Isle of Dogs feel.
```

### Plan 7 — Monde claymation des palettes (10s)
```
Stop motion claymation, Wes Anderson style. A tiny clay woman with dark hair, white shirt, beige
pants stands center, holding grey clay sneakers. Three Japanese folding fans made of clay float
around her, each fan shows 3 coloured stripes: warm tones (terracotta, cream, brown), cool tones
(stone blue, pearl grey, off-white), soft tones (powder pink, sage, sand). Pastel cream
miniature world, charming, symmetric.
```

### Plan 8 — La composition magique (10s)
```
Stop motion claymation, Wes Anderson style. A tiny clay woman in a cream miniature room. A
Japanese clay fan with grey, off-white, black stripes breaks apart. The colours transform into
clay clothes: a grey clay hoodie floats onto her shoulders, off-white clay cargo pants wrap her
legs, a small black clay cap descends on her head. Visible clay texture, soft animation,
charming symmetric.
```

### Plan 9 — Retour réel (5s)
```
Stop motion claymation, Wes Anderson style, centered medium shot. A clay figure of a young
woman with dark hair, white shirt, beige pants, holding a tiny clay smartphone in a clay shoe
boutique. Deadpan turning into a subtle half-smile, she makes a small 5-degree head bow Japanese
style. Visible clay texture, warm pastel lighting.
```

### Plan 10 — Logo final (5s)
```
Stop motion claymation style, minimalist cream pastel background. A Japanese ink brush made of
clay draws the kanji "和田" in fluid black sumi-e calligraphy. After it completes, the word
"WADA" fades in below in a rounded chubby clay font. Below: "D'après Sanzo Wada · 1933" in
elegant clay serif. Peaceful, warm light, charming clay imperfections.
```

---

## Pourquoi tout en claymation = meilleure décision

Quand tout est en pâte à modeler du début à la fin :
- **Cohérence visuelle parfaite** : pas de cassure entre les plans réels et les plans claymation
- **Plus distinctif** : aucune marque mode ne fait ça → tu sors immédiatement du flot
- **Plus facile à générer par IA** : les modèles vidéo gèrent mieux UN seul style cohérent
- **Plus partageable** : le claymation crée un attachement émotionnel (Wallace & Gromit, Isle of
  Dogs, Coraline → tout le monde adore ce style)
- **Plus simple à monter** : pas de transition réel/animé compliquée à gérer

Référence visuelle : *Isle of Dogs* (2018) de Wes Anderson — tout est en stop-motion claymation,
y compris les humains, et c'est magnifique.

---

## Astuces Kling spécifiques

### Si le rendu n'est pas claymation assez fort
Renforce avec ces mots-clés en fin de prompt :
```
visible clay texture, soft handmade imperfections, stop motion animation, frame by frame, plasticine
```

### Si Kling rend trop "3D moderne" au lieu de claymation
- Bascule sur **Pika 2** pour ces plans (meilleur en claymation)
- Ou ajoute en début de prompt : `Aardman style` (le studio Wallace & Gromit)
- Évite les mots : `realistic`, `photorealistic`, `cinematic` (qui poussent vers le réel)

### Negative prompt (champ séparé dans Kling)
À coller dans le champ "Negative prompt" pour les 10 plans :
```
realistic, photorealistic, 3D render, CGI, smooth surfaces, blurry, low quality, distorted, extra
fingers, watermark, text overlay, modern elements, neon colors, harsh lighting
```

### Cohérence du personnage (la clay woman)
Pour les plans 1, 2, 3, 5, 9 où elle apparaît :
1. Génère d'abord le **plan 1** dans Kling
2. **Capture d'écran** d'une frame où elle est bien visible
3. Pour les plans suivants, mode **Image-to-Video** avec cette image en référence
4. Garde le même prompt, change juste l'action

Sans ça, elle changera de look entre les plans. Avec ça, c'est cohérent.

### Durée recommandée
- **5 secondes** pour les plans 1, 2, 3, 4, 5, 6, 9, 10
- **10 secondes** pour les plans 7 et 8 (où il faut voir le mouvement claymation se développer)

### Combien de générations par jour avec Kling gratuit
~5-10 clips par jour. Donc :
- **Jour 1** : plans 1, 2, 3, 4 (et 1-2 régénérations si pas bon)
- **Jour 2** : plans 5, 6, 7
- **Jour 3** : plans 8, 9, 10

3 jours patients = toute la vidéo générée gratuitement.

---

## Récap des 10 prompts en une vue

| # | Plan | Durée | Mode Kling | Notes |
|---|------|-------|------------|-------|
| 1 | Magasin claymation | 5s | Text-to-Video | Génère en premier (référence personnage) |
| 2 | Chaussures claymation | 5s | Text-to-Video | |
| 3 | Hésitation | 5s | Image-to-Video (réf. plan 1) | |
| 4 | Téléphone clay | 5s | Text-to-Video | |
| 5 | Scan | 5s | Text-to-Video | |
| 6 | Transition shōji | 5s | Text-to-Video | |
| 7 | Monde claymation | 10s | Text-to-Video ou **Pika 2** | |
| 8 | Composition | 10s | Text-to-Video ou **Pika 2** | |
| 9 | Retour réel claymation | 5s | Image-to-Video (réf. plan 1) | |
| 10 | Logo final | 5s | Text-to-Video | |

Total : 10 clips, ~60 secondes brut, à raccourcir à 30-45s dans CapCut.

Lance le **plan 1** maintenant et dis-moi le rendu. Si la clay woman te plaît, on continue. Sinon
on ajuste le prompt avant de gaspiller des crédits sur les suivants.
