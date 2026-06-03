# WADA — L'assistant IA doit VRAIMENT comprendre (pour le codeur)

## Le problème (constaté en live)
L'utilisateur écrit : « **j'ai une soirée à thème pirate, tu me conseilles quoi ?** »
L'assistant répond : « **Notée. De quelle couleur est-elle ?** » + des pastilles de couleur.
→ Il **ignore la demande** et applique un **script figé** (couleur → style → occasion), quelle que
soit la phrase tapée. Ce n'est pas une IA : c'est un questionnaire rigide. Un vrai styliste ne
répond jamais « de quelle couleur ? » à « que mettre pour une soirée pirate ».

## La cause
Le champ texte libre n'est pas relié à un vrai modèle de langage : tout passe par des règles
scriptées qui reposent une question type. La saisie libre n'est pas comprise ni interprétée.

## La correction
1. **Brancher un vrai LLM** derrière l'assistant (la clé `OPENAI_API_KEY` est déjà dans Vercel),
   piloté par le **system prompt WADA** (fichier `wada-assistant-system-prompt.md`).
2. L'assistant doit **lire et comprendre le message** (thème, occasion, humeur, pièce possédée,
   contraintes) et **répondre pertinemment** :
   - Ex. « soirée pirate » → proposer un **vrai look thématique cohérent** (chemise ample écru/blanc
     cassé, rayures type marinière, pantalon sombre, ceinture large, bottes, foulard/bandana…) +
     **rattacher à une palette Sanzo Wada** adaptée, puis composer la tenue achetable.
3. **Poser une question seulement si une info manque vraiment**, et **une seule** — jamais un
   « de quelle couleur ? » automatique sur une demande déjà claire (un thème/occasion suffit pour
   proposer).
4. Les **pastilles/chips** peuvent rester comme **suggestions rapides contextuelles**, pas comme une
   barrière obligatoire avant toute réponse.
5. Garder le ton WADA (calme, cultivé, 2-4 phrases) et la règle « une seule couleur forte + neutres ».

## Exemples de comportement attendu
- « soirée pirate » → propose un look pirate moderne + palette + tenue. (PAS « de quelle couleur ? »)
- « j'ai un mariage en juin, je suis un homme » → propose une tenue de mariage homme été, sans
  redemander l'occasion.
- « j'ai un pull noir » → reconnaît la pièce ancre, demande au plus la couleur si utile, puis compose.
- « je ne sais pas quoi mettre demain au bureau » → propose directement un look bureau.

## Test
- [ ] Taper « soirée à thème pirate, tu me conseilles quoi ? » → l'IA propose un **vrai look pirate**
  + une palette, sans répondre « de quelle couleur ? ».
- [ ] Taper 3-4 demandes libres différentes → réponses **pertinentes et différentes**, pas le même script.
