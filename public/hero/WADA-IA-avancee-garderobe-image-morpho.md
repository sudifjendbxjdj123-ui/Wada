# WADA — IA avancée : garde-robe, image, morphologie, apprentissage actif

5ᵉ spec de la série IA. Couvre les **fonctionnalités différenciantes** qui transforment WADA en
véritable styliste personnel — celles qu'aucun concurrent (Lyst, Stylight, Pinterest, ChatGPT)
n'offre aujourd'hui.

À implémenter **après** les fondations (`logique-composition-tenue`, `logique-IA-renforcee`,
`styliste-personnalite`, `traduction-dimensions`).

---

## 1. Compose-moi ma semaine — capsule wardrobe intelligente

### Le problème
Un client achète une tenue WADA aujourd'hui — joli, il la porte 2 fois cette semaine. Et après ?
Il revient sur WADA pour composer une **autre** tenue, mais sans rapport avec celle d'avant. Au
final il a 7 pièces qui ne se mixent pas entre elles → garde-robe incohérente, coût élevé,
satisfaction faible.

### La solution
Quand le client demande **« compose-moi ma semaine »** (ou clique un bouton dédié), WADA propose
**5 à 7 tenues qui partagent leurs pièces**. Une vraie capsule.

### Le principe — pool partagé
Pour 5 tenues, on génère un **pool de ~12 pièces** au total, pas 25. Chaque pièce est utilisée
**dans 2-4 tenues différentes**.

Exemple pour une semaine Homme Premium / Quotidien / Minimaliste :

```
POOL DE BASE (12 pièces):
  - 2 pulls cachemire (1 écru Brunello, 1 charbon Tom Ford)
  - 2 pantalons (1 laine droit Tom Ford, 1 jean noir AMI)
  - 1 chemise blanche oxford (MUJI)
  - 1 manteau long laine (Polo Ralph Lauren)
  - 1 cardigan oversize (AMI Paris)
  - 2 paires de chaussures (Birkenstock Boston brun, mocassins cuir noir TBF)
  - 3 accents (foulard écru MUJI, ceinture cuir brun, bonnet laine MUJI)

LUNDI (Bureau formel)
  - Pull écru + pantalon laine + manteau long + mocassins + ceinture

MARDI (Bureau détendu)
  - Chemise blanche + pantalon laine + cardigan + Birkenstock + foulard

MERCREDI (Quotidien)
  - Pull écru + jean noir + manteau + mocassins + foulard

JEUDI (Bureau)
  - Pull charbon + pantalon laine + cardigan + mocassins + ceinture

VENDREDI (Casual Friday)
  - Chemise blanche + jean noir + Birkenstock + bonnet

SAMEDI (Sortie)
  - Pull charbon + jean noir + manteau + mocassins

DIMANCHE (Repos)
  - Pull écru + pantalon laine + foulard + Birkenstock
```

### L'algorithme

```python
def compose_semaine(profil, palette, contexte_semaine):
    # 1. Définir le pool cible (12 pièces ± 2)
    pool_size = 12
    
    # 2. Pour chaque slot, choisir 1-3 pièces qui se combinent bien
    pool = {
        'haut': pick_hauts(palette, profil, count=3),     # 2 pulls + 1 chemise
        'bas': pick_bas(palette, profil, count=2),         # 1 pantalon + 1 jean
        'veste': pick_vestes(palette, profil, count=2),    # 1 manteau + 1 cardigan
        'chaussures': pick_chaussures(palette, profil, count=2),
        'accent': pick_accents(palette, profil, count=3)
    }
    
    # 3. Générer 7 combinaisons (une par jour) avec contraintes
    tenues = []
    for jour in jours_semaine:
        occasion = contexte_semaine[jour]  # bureau / casual / weekend
        tenue = choisir_combinaison_pool(pool, occasion, used_recently=...)
        # Contrainte: ne pas répéter la même tenue, varier les pièces
        tenues.append(tenue)
    
    # 4. Vérifier la cohérence globale (toutes les pièces se vont ensemble)
    if not toutes_compatibles(pool):
        regenerer_pool()
    
    return {
        'pool': pool,
        'semaine': tenues,
        'cout_total': sum(p.prix for p in pool),  # PAS la somme des tenues
        'cout_par_porte': cout_total / nb_jours_porte_total
    }
```

### L'argument commercial (à expliquer au client)
> « 12 pièces partageables = 7 tenues différentes. Coût total : 2 400€ (vs 4 800€ si tu achetais
> 7 tenues distinctes). **Tu économises 50%** tout en ayant une garde-robe cohérente. »

C'est ce qui transforme WADA d'un moteur de tenue ponctuelle en **plateforme de garde-robe long
terme** — et justifie l'abonnement Premium.

### UI suggérée
Page dédiée `/semaine` :
- Image grille 7 jours × 1 tenue, avec les pièces partagées surlignées d'un point coloré
- Bouton « Voir le pool complet (12 pièces) »
- Total à acheter + total économisé vs tenues distinctes

---

## 2. Style transfer depuis une image de référence

### Le cas d'usage
Le client trouve une photo Instagram d'un look qu'il aime (un ami, un acteur, un mannequin). Il
upload l'image dans WADA et dit : **« habille-moi comme ça mais à mon budget et avec mes
marques »**.

### Le pipeline

```
1. CLIENT UPLOAD une image
2. WADA envoie l'image au LLM Vision (Claude / GPT-4o Vision)
3. Le LLM extrait les caractéristiques stylistiques :
   - Registre dominant (minimaliste / streetwear / classique / ...)
   - Palette de couleurs (3 couleurs principales)
   - Coupes (oversize / ajusté / fluide)
   - Matières apparentes (cachemire / denim / cuir / ...)
   - Silhouette globale (longue / courte / structurée / fluide)
   - Mood (calme / affirmé / casual / habillé)
4. WADA traduit ces caractéristiques en paramètres composer
5. WADA compose une tenue qui CAPTURE l'esprit (sans copier les marques) :
   - Filtres : registre = registre détecté
   - Couleurs cibles = palette extraite (mappée vers la palette Sanzo Wada la plus proche)
   - Coupes = mêmes coupes
   - Budget = budget du client (pas celui de la photo)
   - Marques = marques WADA disponibles dans le bon registre
6. Affichage avec mention :
   « Inspirée de ta référence. J'ai gardé l'esprit (couleurs + coupe + registre)
     mais adapté à ton budget et à nos marques. »
```

### Prompt système pour l'extraction visuelle

```
Tu analyses une photo de tenue. Renvoie un JSON STRICT :
{
  "registre": "minimaliste" | "streetwear" | "classique" | "avant-garde" | ...,
  "palette_couleurs": [{"hex": "#...", "nom": "..."}, ...] (3 max),
  "coupes_dominantes": ["oversize", "droit", "fluide", "ajusté"...],
  "matieres_apparentes": ["cachemire", "denim brut", "cuir", "lin"...],
  "silhouette": "longue et fluide" | "structurée courte" | ...,
  "mood": "calme" | "affirmé" | "casual" | "habille" | ...,
  "elements_signature": ["surchemise oversize", "pantalon large", ...] (à reproduire si possible)
}
```

### Garde-fous
- Si l'image montre du contenu inapproprié → refuser poliment
- Si l'image n'est pas une tenue → demander « peux-tu m'envoyer une photo de tenue précise ? »
- Si la palette détectée est radicalement hors profil du client → proposer en alternative au lieu
  d'imposer

### UX
> « Envoie-moi une photo qui te fait envie — Instagram, Pinterest, magazine — et je m'inspire de
> l'esprit pour te composer une version adaptée à toi. »

C'est la fonction qui va générer le plus de **viralité TikTok** : « envoyez-nous votre look
préféré, WADA vous habille pareil ».

---

## 3. Conscience de la morphologie (fit + flatteur)

### Pourquoi c'est important
Une même tenue n'a pas le même rendu sur une morphologie rectangle et une morphologie pyramide
inversée. Aujourd'hui WADA propose les mêmes coupes à tout le monde — c'est statistique, pas
personnel.

### Le profil morpho à collecter (optionnel)

```ts
type Morphologie = {
  silhouette: 'rectangle' | 'triangle' | 'sablier' | 'rond' | 'V' | 'A',
  taille_haut: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
  taille_bas: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
  pointure: number,
  hauteur_cm: number,         // optionnel
  preferences_fit: 'pres-du-corps' | 'flatteur' | 'ample' | 'oversize-total'
};
```

### Comment ça influence le pick

#### Morphologie Rectangle (pas de courbe marquée)
- **Bonus** : ceintures, pièces structurées qui créent du volume
- **Malus** : pièces droites sans structure
- Vestes : préférer celles avec ceinture ou taille marquée
- Chemises : col ouvert ou en V pour casser la ligne

#### Morphologie Triangle (hanches plus larges)
- **Bonus** : hauts structurés, épaules marquées, vestes courtes
- **Malus** : pantalons baggy, jupes en A
- Veste : ouverte sur l'avant pour allonger
- Chaussures : montantes pour équilibrer

#### Morphologie Sablier
- **Bonus** : pièces qui suivent la silhouette, taille marquée
- **Malus** : oversize total qui efface les courbes
- Pas trop de couches superposées

#### Morphologie Ronde
- **Bonus** : verticalité (cols en V, rayures fines verticales), pièces fluides qui glissent
- **Malus** : motifs horizontaux, pièces très moulantes ou très flottantes
- Tissus structurés > flottants

#### Morphologie V (épaules > hanches)
- **Bonus** : pantalons larges ou évasés, pièces du bas avec volume
- **Malus** : vestes à grosses épaulettes, hauts oversize
- Équilibrer haut/bas

#### Morphologie A
- Inverse du V — donner du volume en haut, équilibrer

### Implementation concrète
Ajouter dans le score composer :
```
+10 si la coupe respecte la morphologie déclarée
-10 si la coupe est défavorable
```

Le styliste annonce subtilement quand pertinent :
> « J'ai pris le manteau ceinturé plutôt que le droit — il marque ta taille sans en faire trop. »

### Garde-fou
- Ne **jamais** présenter ça comme « ce qui te va » mais comme « ce qui te valorise selon toi »
- Le client peut désactiver la morpho-awareness s'il préfère.
- Pas de jugement esthétique sur le corps.

---

## 4. Apprentissage actif — questions ciblées

### Le problème
Le système apprend des likes/dislikes (passif). Mais c'est lent — il faut ~30 interactions pour
modeler vraiment un client.

### La solution
Le styliste pose **occasionnellement** une question ciblée qui maximise l'apprentissage. Pas tout
le temps — sinon ça devient un sondage. Une fois sur 5-10 tenues.

### Le critère pour poser une question
On pose si :
- Le profil est encore flou (< 10 interactions)
- Le pick algorithmique a une **forte incertitude** sur une dimension
- Le client semble en exploration (test plusieurs profils)

### Exemples de questions intelligentes

#### Question discriminante sur la couleur
> « Ces deux pulls cachemire — l'un en taupe, l'autre en bordeaux profond. Lequel des deux te
> ressemble plus ? »
> [Voir taupe] [Voir bordeaux]

Le système apprend si le client préfère les neutres ou les couleurs profondes.

#### Question sur le confort vs élégance
> « Si tu devais choisir une seule paire de chaussures pour toute la semaine — mocassins ou
> sneakers blanches ? »

Apprend la pondération confort/élégance.

#### Question sur le registre
> « Tu te reconnais plus dans : un dîner avec amis chez quelqu'un, ou un dîner au restaurant
> étoilé ? »

Apprend le niveau de formalité préféré.

#### Question sur l'investissement
> « Tu préfères 5 pulls à 80€ ou 1 pull à 400€ ? »

Apprend le rapport quantité/qualité.

### Sortie de la question
Les réponses **mettent à jour le profil long-terme** :
```ts
profil.preferences_apprises.budget_strategy = 'qualite_rare';
profil.preferences_apprises.couleurs_aimees.push('bordeaux');
profil.preferences_apprises.formality_level += 0.2;
```

### Le ton du styliste
La question est **conversationnelle**, pas un formulaire. Pas de « répondez aux questions
suivantes ». C'est une vraie question qu'une vraie styliste pose à son client.

---

## 5. Remplacement intelligent (out-of-stock, sold out)

### Le problème
Un client like une tenue, clique « Acheter » → la pièce est en rupture chez le marchand. UX
cassée.

### La solution
Avant d'afficher une tenue, le composer vérifie **en temps réel** la disponibilité via le flux.
Si une pièce est sold out **MAIS qu'elle est dans une tenue déjà composée** ou en favori, le
styliste propose **un remplacement automatique** avec une notification douce :

> « Le pull Brunello que tu as gardé n'est plus dispo. Je te trouve la version la plus proche
> que j'ai. »
>
> [Carte du remplacement : marque + nom + prix + similarité 92%]
>
> [Garder le remplacement] [Voir d'autres options] [Pas important, on oublie]

### Comment trouver le bon remplacement
Score de similarité entre 2 produits :

```
similarité = 0
+ 30 si même slot
+ 25 si même registre
+ 20 si couleur similaire (delta E < 20)
+ 15 si même type (pull, pantalon, etc.)
+ 10 si même matière dominante
+ 0 à 10 selon proximité de prix
```

Si score >= 70, on propose. Sinon on dit « pas de remplacement direct, voici 3 alternatives à
considérer ».

---

## 6. Wishlist intelligente — proposer des ajouts au fil du temps

### L'idée
WADA observe la garde-robe achetée d'un client. Au bout de 3-5 achats, il identifie **les pièces
manquantes** pour compléter une vraie garde-robe minimaliste.

### Exemples de suggestions au fil du temps

#### Après 3 hauts mais 0 manteau d'hiver
> « Tu as une belle base de pulls. Si tu veux compléter, un manteau long laine couleur cuir
> naturel ouvrirait beaucoup de combinaisons. J'en ai 3 dans tes marques. »

#### Après 2 chaussures formelles mais 0 sneakers
> « Tu as deux paires habillées. Pour les jours plus relax, des sneakers blanches simples te
> donneraient un troisième registre. »

#### Après 5 hauts et 1 bas
> « Tu as cinq hauts mais un seul pantalon. Si tu en ajoutes un autre, tu doubles tes combinaisons
> possibles. »

### Le timing
- Pas plus d'**une suggestion par semaine** (sinon ça devient harcelant)
- Dans une **notification email** ou push, jamais en interrompant le scan/styliste
- Toujours formulée comme **opportunité**, jamais comme manque

---

## 7. Reconnaissance des "moments clés" du client

### Quoi
WADA détecte des **dates importantes** (déclarées par le client ou inférées) et propose des
tenues adaptées **à l'avance**.

### Sources
- Le client renseigne dans son profil : un mariage le 15 juin, un voyage à Tokyo en octobre
- Calendrier Google connecté (optionnel, RGPD)
- Patterns observés : « cette personne va à 3 dîners par mois → proposer pour le prochain »

### Notification proactive
> « Ton mariage est dans 3 semaines. Tu veux qu'on commence à composer ta tenue ? J'ai 4 idées. »

C'est ce qui transforme WADA d'**outil utilisé sur demande** en **présence proactive bienveillante**.

---

## 8. Système de "confiance du styliste"

### Le score interne
Pour chaque tenue proposée, le styliste a une **confidence interne** entre 0 et 100 :

```
confidence = (
  fit_palette          * 0.25   // à quel point ça matche la palette
  + fit_profil         * 0.20   // à quel point ça matche le profil
  + fit_historique     * 0.15   // proximité avec ce que le client a déjà aimé
  + cohérence_outfit   * 0.20   // score de cohérence interne
  + dispo_stock        * 0.10   // toutes les pièces en stock
  + validation_llm     * 0.10   // verdict LLM coherent
)
```

### Comment c'est utilisé
- Si **confidence >= 85** : affiche en V1 (safe) — pas d'hésitation
- Si **confidence 75-85** : affiche normalement mais essaie V2 (bold) plus prudent
- Si **confidence < 75** : ne montre PAS au client. Régénère.

### Et le client ?
Le score n'est pas affiché directement (ça serait flippant). Mais le **ton du styliste** s'adapte :
- Haute confiance : « Voici ta tenue. »
- Confiance moyenne : « Voici une proposition, dis-moi ce que tu en penses. »
- Confiance basse : ne devrait jamais arriver — sinon dégradation gracieuse.

---

## 9. Récap : ce que ces fonctionnalités apportent

| Feature | Impact | Effort dev | Quand |
|---|---|---|---|
| Compose la semaine | **★★★★★** — justifie l'abo Premium | Gros (2-3 sem) | Q2 |
| Style transfer image | **★★★★★** — viralité TikTok | Moyen (1-2 sem) | Q2 |
| Morphologie | ★★★ — credibility | Moyen (1 sem) | Q3 |
| Apprentissage actif | ★★★★ — rétention | Petit (3-5 jours) | Q2 |
| Remplacement OOS | ★★★ — UX critique | Petit (3 jours) | Q2 |
| Wishlist intelligente | ★★★★ — re-engagement | Moyen (1 sem) | Q3 |
| Moments clés | ★★★ — proactivité | Moyen (1 sem) | Q3 |
| Confidence score | ★★★★ — qualité produit | Petit (3 jours) | Q2 |

---

## 10. Ce qui distingue WADA après ces features

| Concurrent | Ce qu'ils font | Ce que WADA fera en plus |
|---|---|---|
| **Pinterest Lens** | Trouve des images similaires | + compose une tenue achetable + adaptation budget |
| **Lyst / Stylight** | Catalogue mode | + cohérence éditoriale + garde-robe complète |
| **Stitch Fix** | Box mensuelle humaine | + instantané + 348 palettes historiques + capsule |
| **ChatGPT « habille-moi »** | Conversation générique | + vrais produits + apprentissage long terme + morpho |
| **Vinted** | Marketplace seconde main | (pas même domaine) |
| **Mr Porter / Net-a-Porter** | E-shop luxe | + composition + capsule + edito Sanzo Wada |

Aucun concurrent ne fait :
- Palette éditoriale + composition
- Capsule wardrobe partagée
- Style transfer depuis image
- Conscience morpho
- Apprentissage actif conversationnel

C'est l'**ensemble de ces différenciations** qui justifie une plateforme dédiée et un abonnement.

---

## Conclusion

Avec cette 5ᵉ spec, WADA dispose de **toute la matière** pour devenir un produit IA mode unique.

L'ordre d'implémentation recommandé :
1. **D'abord** : les fondations (specs 1 à 4) — composer cohérent, marques affiliées, styliste branché
2. **Ensuite** : **compose la semaine** + **style transfer image** — 2 différenciateurs majeurs
3. **Plus tard** : apprentissage actif, morpho, wishlist intelligente
4. **Long terme** : moments clés, calendrier proactif

Avec ces fonctionnalités, WADA ne sera plus comparé à un Lyst ou un ChatGPT — il sera comparé à
un **vrai styliste personnel** qui connaît son client.
