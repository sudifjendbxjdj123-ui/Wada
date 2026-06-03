# WADA — Diagnostic de ta vidéo Kling et plan de correction

## Ce que j'ai vu (analyse frame par frame)

J'ai extrait 5 frames de ta vidéo pour analyser. Voilà ce qui s'est passé :

**Format** : 1280×720 horizontal (16:9) — ❌ on voulait 9:16 vertical pour TikTok
**Durée** : 5 secondes (OK)
**Style** : 2D flat cartoon, lignes noires, monochrome gris — ❌ on voulait claymation pâte à modeler
**Sujet** : une rue avec plein d'hommes en cartoon style noir et blanc, dont un en couleurs (rouge/bleu/vert) au centre — ❌ aucun rapport avec le scénario WADA
**Fin** : un texte « Wada » suivi d'inscriptions illisibles « Wada Honrr Voargohay » — ❌ typique fail texte IA
**Watermark** : « KlingAI 3.0 » en bas à droite

---

## Ce qui a foiré (5 problèmes)

### 1. Tu as utilisé un preset de style « 2D flat » dans Kling
Le nom du fichier le dit : `kling_..._作品_2D_flat_gr_...`. Tu as probablement cliqué sur un
**preset 2D flat illustration** au lieu de partir d'un Text-to-Video brut. Résultat : tout le
contenu a été forcé en illustration cartoon noir et blanc, complètement à l'opposé de la
claymation.

**Fix** : repars en mode **Text-to-Video standard**, sans preset de style. Le claymation doit
venir du PROMPT, pas d'un filtre Kling.

### 2. Tu as gardé le format horizontal 16:9
La vidéo fait 1280×720, donc paysage. Pour TikTok / Reels / Shorts, il FAUT du vertical.

**Fix** : dans l'interface Kling, sélectionne explicitement **9:16 (Portrait)** avant de lancer
la génération.

### 3. Le prompt n'a pas été assez spécifique
Le résultat montre une rue avec plein d'hommes (un truc générique de banlieue) au lieu du magasin
de chaussures avec UNE jeune femme. Soit le prompt était trop court, soit Kling l'a mal compris.

**Fix** : prompt explicite avec « ONE young woman », « indoor vintage shoe boutique », « no other
people in the frame ».

### 4. Le texte « Wada » à la fin est rendu comme une bouillie illisible
C'est le **fail classique des IA vidéo avec du texte** — elles ne savent pas écrire correctement.
Pour le logo final, il NE FAUT PAS générer le texte avec Kling.

**Fix** : génère juste un fond crème + le kanji **和田** (que Kling rend mieux que les mots) au
pinceau, puis **ajoute le texte « WADA » et « D'après Sanzo Wada · 1933 » en post-production dans
CapCut**. C'est mille fois plus propre.

### 5. Le rendu Kling 3.0 a fait des choix bizarres
On voit des hommes en monochrome avec des touches de couleur (rouge, bleu, vert) — Kling a
essayé de représenter « WADA color » comme des personnages multicolores au lieu d'une palette de
couleurs. Confusion du prompt.

---

## Le prompt corrigé pour le Plan 1 (à essayer en priorité)

À copier-coller dans Kling, mode **Text-to-Video** (PAS de preset 2D), aspect ratio **9:16**,
durée **5s** :

```
Stop motion claymation, Aardman style, Wallace and Gromit aesthetic. Inside a tiny pastel
miniature shoe boutique. One single young woman made of clay (mid-20s, dark brown hair, white
clay shirt, beige clay pants) walks slowly toward the camera, alone, no other people. Wooden
clay shelves with rows of small clay shoes. Soft pastel pink and sage green walls. Warm dim
lighting. Symmetric framing. Visible clay texture, handmade imperfections, charming. 5 seconds.
```

### Negative prompt (champ séparé dans Kling)
```
crowd, multiple people, men, modern style, 2D flat illustration, line drawing, cartoon, anime,
realistic, photorealistic, 3D render, CGI, smooth surfaces, blurry, watermark, text, letters,
words, modern clothing
```

### Réglages Kling à vérifier avant de cliquer Generate
- ✅ Aspect ratio : **9:16 (Portrait / Vertical)**
- ✅ Duration : **5s**
- ✅ Mode : **Text-to-Video** (pas Image-to-Video, pas Style Preset)
- ❌ Surtout **ne pas cocher** des styles préfinis comme « 2D flat », « anime », « cartoon »

---

## Test à faire MAINTENANT

1. Va sur Kling AI
2. Crée une nouvelle génération **Text-to-Video** (vide, pas de preset)
3. Règle l'aspect ratio sur **9:16**
4. Colle le prompt corrigé ci-dessus
5. Colle le negative prompt dans son champ
6. Génère

**Si le rendu est en claymation et vertical** → on continue avec les 9 autres plans.
**Si c'est encore en 2D ou en horizontal** → on regarde ensemble les options Kling, il y a un
réglage caché qui force le style.

---

## Plan B si Kling continue à galérer

Si après 2-3 essais Kling persiste à donner du 2D plat ou du n'importe quoi :

### Option 1 — Bascule sur **Pika 2** (`pika.art`)
- Spécialisé claymation/stop-motion
- Gratuit aussi
- Comprend « Aardman style » immédiatement
- Mieux pour ton cas précis

### Option 2 — Essaie **Runway Gen-4** (10€ pour 1 mois)
- Le meilleur pour le contrôle stylistique fin
- Si tu veux vraiment du Wes Anderson, c'est lui
- Tu peux te désabonner après 1 mois

### Option 3 — Approche hybride
- Génère des **images fixes claymation** avec Midjourney ou DALL-E (super stables en claymation)
- Anime ces images dans Kling en mode **Image-to-Video**
- Tu contrôles le style à 100%

---

## Conclusion honnête

Ton premier essai Kling t'a donné un résultat très éloigné de ce qu'on cherche. C'est **complètement
normal** avec l'IA vidéo gratuite — les 2-3 premiers essais sont souvent ratés, et il faut affiner
le prompt + les réglages.

Mais l'erreur principale est **claire et facile à corriger** : tu as activé un preset « 2D flat »
qui a tout cassé. Désactive-le, mets le bon aspect ratio, colle le prompt corrigé, et tu devrais
voir une vraie claymation Wes Anderson.

Relance et envoie-moi le résultat — on ajuste si besoin avant de partir sur les 10 plans.
