# WADA — Logique de composition d'une tenue cohérente (spec codeur)

## Le problème observé

Les tenues actuelles n'ont **pas de logique** : on retrouve un pull cachemire Brunello (luxe classique)
associé à un jean Amiri déchiré (streetwear) et à des baskets Asics (sport). Chaque pièce est belle
seule, mais ensemble la tenue est incohérente — un vrai styliste ne mettrait jamais ces 3 pièces.

La cause : l'algorithme filtre sur **genre + budget** uniquement. Il ne vérifie pas **la cohérence
de registre**, **l'équilibre des couleurs**, **la cohérence saison/matière**, ni **la pertinence à
l'occasion**.

Ce fichier décrit les règles à implémenter pour transformer le composer en vrai styliste.

---

## Les 8 règles de cohérence (à appliquer DANS L'ORDRE)

### 1. RÉGISTRE — la règle non négociable
Une tenue a UN registre. On ne mélange pas. Les 4 registres :
- **Classique / Tailoring** — Brunello Cucinelli, Tom Ford, Canali, Zegna, Loro Piana, Paul Smith, Polo Ralph Lauren, Eden Park, Suitsupply
- **Streetwear / Casual chic** — Amiri, Rick Owens, Off-White, Palm Angels, AMI Paris, Stone Island, ICECREAM, Billionaire Boys Club, NEIGHBORHOOD, A BATHING APE
- **Minimaliste / Architectural** — Jacquemus, Lemaire (si dispo), Comme des Garçons, Ann Demeulemeester, Cos (si dispo), Acne
- **Décontracté / Basique** — MUJI, Armor Lux, American Vintage, Faguo

**À implémenter** : ajouter une colonne `registre` à chaque produit importé, mappée depuis `brand_name`
(table de correspondance ci-dessous). Le composer ne mélange JAMAIS deux registres dans une même tenue.

### 2. UNE COULEUR FORTE + NEUTRES — la règle d'or de la couleur
Une tenue WADA s'appuie sur une palette Sanzo Wada de 3 couleurs (ex. Vermillon + Cuir naturel + Bleu pierre).
Règle de composition :
- **1 couleur forte** (la plus saturée de la palette) → portée par UNE pièce maximum (l'accent ou une grosse pièce)
- **Reste de la tenue** → couleurs neutres ou tons assortis (sable, taupe, écru, noir, cuir naturel…)

Sinon on a 3 pièces qui crient toutes en même temps. Le but : la couleur forte attire l'œil sur UN
point, le reste soutient.

**À implémenter** : par tenue, n'attribuer la couleur la plus saturée qu'à UN slot. Les 4 autres slots
piochent dans les neutres / tons accordés.

### 3. SAISON + MATIÈRE — cohérence physique
On ne propose pas du cachemire en juillet ni du lin en décembre. Mapping minimum :
- **Hiver** (Nov-Mars) → laine, cachemire, mohair, cuir épais, denim épais. **Pas de** lin, soie, popeline fine.
- **Été** (Juin-Août) → coton léger, lin, soie. **Pas de** laine, cachemire, denim épais.
- **Mi-saison** → coton, laine légère, denim, jersey. Polyvalent.

Si la palette est étiquetée « Saison : Automne / Hiver » (cf. les métadonnées du flux ou de la palette),
le composer filtre les pièces hiver et exclut les pièces été.

**À implémenter** : utiliser le champ `Fashion:material` quand dispo, sinon inférer depuis le nom
(« cashmere », « linen », « wool »). Marquer chaque pièce avec sa saisonnalité.

### 4. OCCASION → SLOT COMPATIBILITY — la pertinence
Chaque occasion détermine les types de pièces autorisées :

| Occasion | Haut autorisé | Bas autorisé | Veste autorisée | Chaussures autorisées | Accent |
|---|---|---|---|---|---|
| **Bureau / Tailoring** | chemise, polo, pull fin, blouse, top soie | pantalon costume, jupe crayon, chino | blazer, manteau structuré, trench | derbies, mocassins, escarpins, bottines cuir | montre cuir, ceinture, pochette, bijou discret |
| **Quotidien / Casual** | T-shirt épais, sweat, chemise oxford, polo, knit | jean droit, chino, jupe midi, jogging haut de gamme | overshirt, blouson, veste légère | sneakers blanches/crème, derbies, mocassins | bracelet, casquette, sac toile, écharpe |
| **Soirée / Habillé** | pull cachemire, chemise soie, top satin, blouse fluide | pantalon laine, jupe noire, robe | blazer fluide, manteau long, veste smoking | mocassins cuir, escarpins, bottines cuir fines | bague, foulard, pochette, bijou précieux |
| **Weekend / Décontracté** | T-shirt, sweat, hoodie, polo | jean, jogging, short, jupe | parka, bombers, doudoune, gilet | sneakers, bottines, slip-on | casquette, sac à dos, montre sport |

**Règle dure** : ne JAMAIS proposer une basket de running pour une tenue tailoring. Ne JAMAIS proposer
un costume pour une tenue weekend. Si une pièce du flux ne colle à AUCUN slot autorisé pour
l'occasion, on l'écarte.

### 5. SILHOUETTE — équilibre proportions
Une silhouette équilibrée alterne **oversize/structuré** et **ajusté**. On ne fait pas oversize en haut
ET oversize en bas (sauf parti pris streetwear assumé).

Règles simples :
- Pull oversize → pantalon droit ou slim, pas baggy
- Chemise ajustée → pantalon droit ou large, pas slim
- Manteau long → privilégier la jambe fine en dessous pour ne pas noyer la silhouette

**À implémenter** : tagger les pièces `coupe: oversize | droit | slim` quand l'info est dispo, et
appliquer un check de compatibilité.

### 6. GENRE — cohérence absolue
Toutes les pièces d'une tenue doivent être du **même genre**. Pas d'exception. Si le flux n'indique
pas le genre (cas TBF où `suitable_for` est vide), inférer depuis le mot dans le nom (`men's`,
`women's`, `unisex`) ou utiliser la valeur par défaut du marchand (TBF = Homme).

### 7. BUDGET — cohérence des prix
Si le profil dit « < 150€ », **aucune pièce de la tenue ne doit dépasser 150€**. Sinon le client
voit un total à 800€ alors qu'il a demandé « petit budget ». Le composer doit additionner les 5 slots
avant d'afficher et vérifier que ça reste dans la tranche du profil :
- `< 150€` → tenue totale max ~400-500€ (les 5 pièces ne doivent pas dépasser 150€ chacune)
- `150-400€` → pièces moyennes ~50-200€, total ~500-1500€
- `Premium` → pas de plafond, mais essayer de ne pas dépasser 5000€ pour une tenue daily

### 8. COULEUR DE PALETTE → SLOT — attribution intelligente
Sur 3 couleurs de palette + neutres, comment les répartir sur 5 slots ?

**Méthode** :
1. **Haut** = couleur principale (la plus claire ou la plus chaleureuse) ou neutre
2. **Bas** = neutre profond (taupe, noir, marine, kaki, brun)
3. **Veste** = couleur principale (sinon neutre chaud)
4. **Chaussures** = neutre profond (cuir brun, noir, crème)
5. **Accent** = LA couleur forte de la palette (le pop)

Donc dans Osaka au thé (Vermillon · Cuir naturel · Bleu pierre) :
- Haut → Cuir naturel (chaud, mid-tone)
- Bas → Bleu pierre (profond, ancre)
- Veste → Cuir naturel ou neutre chaud
- Chaussures → cuir brun naturel
- Accent → Vermillon (foulard, bracelet, pochette)

C'est cette logique qui donne une **vraie** tenue Wada — la palette se déploie avec rythme, pas en
trois pavés de couleur disposés au hasard.

---

## Table de correspondance BRAND → REGISTRE (V1)

À mettre en dur dans le code (ou en config). À enrichir au fur et à mesure des marques.

```yaml
classique:
  - Brunello Cucinelli
  - Tom Ford
  - Canali
  - Ermenegildo Zegna
  - Zegna
  - Loro Piana
  - Paul Smith
  - Polo Ralph Lauren
  - Hugo Boss
  - Eton
  - Sezane
  - Sandro
  - Maje
  - The Kooples
  - Suitsupply
  - The Shirt Company

streetwear:
  - Amiri
  - Rick Owens
  - Off-White
  - Palm Angels
  - AMI Paris
  - Stone Island
  - ICECREAM
  - Billionaire Boys Club
  - NEIGHBORHOOD
  - A BATHING APE
  - Anti Social Social Club
  - Boris Bidjan Saberi
  - Bianca Saunders
  - CHARLES JEFFREY LOVERBOY

minimaliste:
  - Jacquemus
  - Lemaire
  - Comme des Garçons
  - COMME DES GARÇONS SHIRT
  - COMME DES GARÇONS PLAY
  - Ann Demeulemeester
  - Cos
  - Acne Studios

decontracte:
  - MUJI
  - Armor Lux
  - American Vintage
  - Faguo
  - Eden Park
  - Birkenstock
```

Pour les marques inconnues : fallback sur `classique` (le moins risqué) ou rejeter avec un log pour
ajout manuel à la table.

---

## Algorithme du composer (pseudo-code)

```
function composer(profil, palette, occasion):
  # 1. Filtrer par genre
  pool = produits.where(genre == profil.genre OR genre == 'unisex')

  # 2. Filtrer par registre (mappé depuis brand_name)
  pool = pool.where(registre == profil.style)

  # 3. Filtrer par budget (chaque pièce < plafond du profil)
  pool = pool.where(prix_eur <= profil.budget_max_piece)

  # 4. Filtrer par saison (matching palette.saison <=> piece.saison)
  pool = pool.where(saison_compatible(palette.saison))

  # 5. Filtrer par occasion → slot autorisé
  pool = pool.where(slot in slots_autorises[occasion])

  # 6. Pour chaque slot (haut, bas, veste, chaussures, accent) :
  for slot in [haut, bas, veste, chaussures, accent]:
    couleur_cible = palette.couleur_pour_slot(slot)   # cf. règle 8
    candidats = pool.where(slot == slot AND couleur_proche(couleur_cible, deltaE < 30))
    tenue[slot] = candidats.pick_best()   # variété, prix juste, image dispo

  # 7. Vérifier la cohérence finale
  if not coherent(tenue):
    return retry()

  return tenue
```

---

## Score de cohérence (à calculer après composition)

Pour chaque tenue, calculer un score 0-100. Si score < 70, ne pas afficher au client.

```
score = 0
+ 20 si tous slots remplis
+ 15 si registre unique (toutes pièces même registre)
+ 15 si UNE seule couleur forte (les autres sont neutres)
+ 10 si toutes pièces compatibles saison palette
+ 10 si toutes pièces compatibles occasion
+ 10 si gender == profil.genre
+ 10 si toutes pièces ≤ budget_max_piece
+ 10 si matériaux cohérents (pas lin+cachemire)
```

Si une tenue n'atteint pas 70, refaire un autre pick. Si après 5 essais on n'y arrive pas, dégrader
gracieusement (afficher 4 pièces au lieu de 5, ou montrer le styliste qui dit « cette occasion + cette
palette + ce budget n'a pas pu donner de tenue, voulez-vous élargir un critère ? »).

---

## Exemples — BIEN vs MAL

### ❌ MAL (la tenue actuelle, sans logique)
- Profil : Homme · Premium · Classique
- Palette : Osaka au thé (Vermillon, Cuir naturel, Bleu pierre)
- Tenue proposée :
  - Pull cachemire **Brunello Cucinelli** (classique) ✅
  - Jean déchiré **Amiri** (streetwear) ❌ — incohérent
  - Veste **Stone Island** (streetwear) ❌
  - Sneakers **Asics** (sport) ❌
  - Bracelet **Off-White** (streetwear) ❌
- Résultat : 1/5 pièces cohérentes. Score : ~25/100. Ne devrait PAS s'afficher.

### ✅ BIEN (avec les règles appliquées)
- Profil : Homme · Premium · Classique
- Palette : Osaka au thé (Vermillon, Cuir naturel, Bleu pierre)
- Occasion : Bureau
- Tenue proposée :
  - **Haut** : Pull cachemire col rond **Brunello Cucinelli**, ton cuir naturel
  - **Bas** : Pantalon laine **Tom Ford**, bleu pierre
  - **Veste** : Manteau cachemire **Loro Piana**, cuir naturel
  - **Chaussures** : Mocassins cuir **Canali**, brun naturel
  - **Accent** : Pochette **Paul Smith**, vermillon (LE pop)
- Résultat : registre unique (Classique), une couleur forte (vermillon en accent), neutres équilibrés,
  cohérent saison hiver, occasion bureau respectée. Score : ~95/100.

---

## Récap pour le codeur

1. **Implémenter la table BRAND → REGISTRE** (config YAML/JSON).
2. **Tagger chaque produit importé** avec son registre, saison, slot.
3. **Refondre l'algorithme du composer** selon le pseudo-code ci-dessus.
4. **Calculer un score de cohérence** et rejeter les tenues < 70.
5. **Ne JAMAIS mélanger les registres** dans une même tenue.
6. **Respecter la règle d'or couleur** : 1 forte + neutres.

Une fois ces 6 points en place, les tenues WADA ne seront plus des piles de pièces — elles seront de
vraies compositions de styliste, comme on les voit chez Mr Porter ou Lyst.
