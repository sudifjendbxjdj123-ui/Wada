# WADA — Bug critique : tenue « Studio danois » totalement incohérente (pour le codeur)

## Captures du bug

Page : tenue **« Studio danois »** générée pour la palette **« Bois clair · Lin écru · Charbon »**.

**Description annoncée** :
> Vestiaire minimal au quotidien : épuré, lignes nettes, sans excès. Coupe regular, palette beige
> doré, crème, noir.
> Registre : Minimal · Coupe : standard · Matières : coton épais + laine fine · Réf : COS

**Tenue proposée par le composer** :

| Slot | Pièce | Marque | Prix | Couleur dans le flux |
|---|---|---|---|---|
| Haut | cotton T-shirt | **Comme des Garçons SHIRT** | 114,73€ | **GREEN** (vert vif) |
| Bas | NSE trousers | **The North Face** | 199,77€ | white (technique synthétique) |
| Veste | diamond-quilted corduroy-collar jacket | **Barbour** | 199,77€ | black (heritage anglais) |
| Chaussures | Icon padded logo-band boots | **Moon Boot** | 218,66€ | brown (après-ski) |
| Accent | La Casquette baseball cap | **Jacquemus** | 139,02€ | white (streetwear luxe) |

**Total : ~872€**

## Pourquoi c'est catastrophique

### Erreur 1 — Couleur totalement hors palette
La palette annoncée est **Bois clair · Lin écru · Charbon** (3 tons neutres terreux).
Le t-shirt proposé est **VERT VIF**. Aucune des 3 couleurs de la palette n'est verte. C'est même
le contraire d'une couleur neutre.

→ La règle « 1 couleur forte + neutres » n'est PAS appliquée.

### Erreur 2 — Mélange de 5 registres incompatibles
Une tenue cohérente a UN registre. Ici on a **CINQ registres différents** dans une même tenue :

- **Comme des Garçons SHIRT** → registre `avant-garde japonais` (mode déconstruite)
- **The North Face NSE** → registre `outdoor technique` (rando, montagne)
- **Barbour** → registre `heritage anglais campagne` (chasse, country)
- **Moon Boot** → registre `après-ski / années 70` (sport d'hiver)
- **Jacquemus baseball cap** → registre `streetwear luxe contemporain`

Aucune de ces 5 maisons ne s'habille ensemble. Un styliste qui propose ça est viré sur le champ.

→ La table `BRAND → REGISTRE` du fichier `WADA-logique-composition-tenue.md` n'est PAS appliquée.

### Erreur 3 — Incohérence climatique et matières
- **Moon Boot** = chaussures de neige (-10°C, ski)
- **T-shirt manches longues coton + Barbour matelassé** = mi-saison/automne
- Mais l'étiquette annonce « matières : coton épais + laine fine » alors qu'il y a **du synthétique**
  (North Face NSE = polyester) et **du polyamide matelassé** (Barbour)

→ Aucune cohérence matière/saison.

### Erreur 4 — Incohérence avec la « direction artistique » annoncée
La page elle-même annonce :
- « Vestiaire **minimal** au quotidien »
- « épuré, lignes nettes, **sans excès** »
- « Réf : **COS** »

Or les pièces proposées sont :
- Moon Boots à logo géant (anti-minimal)
- Barbour matelassé country (anti-minimal)
- T-shirt vert vif (anti-épuré)
- Casquette Jacquemus (anti-COS)

**Aucune de ces pièces n'est dans l'esprit Scandinavian minimal** annoncé. COS = clean lines,
neutres, intemporel. Le composer fait l'inverse de ce qu'il affiche.

### Erreur 5 — Aucun score de validation
La spec `WADA-logique-composition-tenue.md` prévoit un **score de cohérence ≥ 70/100** avant
affichage. Cette tenue scorerait facilement **< 30/100** :

- Registre unique : ❌ 0/15
- 1 couleur forte + neutres : ❌ 0/15 (vert vif + blanc + noir + marron + blanc = 4 couleurs)
- Saison cohérente : ❌ 0/10 (Moon Boots vs t-shirt manches longues)
- Occasion respectée : ❌ 0/10 (rien ne va ensemble)
- Genre cohérent : ✅ 10/10 (tout homme)
- Budget : ✅ 10/10 (~870€ correspond à Premium)
- Matériaux cohérents : ❌ 0/10 (polyester + polyamide + cuir + matelassé)
- Tous slots remplis : ✅ 20/20

**Score : 40/100** → **À REJETER**, et le composer aurait dû refaire un autre pick.

## Ce que le codeur DOIT implémenter (réf. spec déjà livrée)

Cf. fichier `WADA-logique-composition-tenue.md` qui détaille tout. Les 4 corrections critiques :

### 1. Appliquer la table BRAND → REGISTRE
Chaque marque importée du flux TBF doit être taguée avec son registre. Le composer ne mélange pas.

Pour une tenue « Studio danois / minimaliste », piocher UNIQUEMENT dans :
- **Minimaliste** : Jacquemus (le t-shirt OUI, pas la casquette), Lemaire, Acne Studios, Comme des
  Garçons (oui, mais pas en vert vif), Cos, Norse Projects, A.P.C.
- **Décontracté minimal** : MUJI, Uniqlo

### 2. Appliquer la règle 1 couleur forte + neutres
Pour palette **Bois clair · Lin écru · Charbon** :
- 1 pièce dans la couleur forte (charbon ou bois clair)
- 4 pièces dans les neutres assortis (écru, beige, blanc cassé, brun naturel)
- **JAMAIS de vert vif, rouge, bleu pop** pour cette palette

### 3. Filtrer par saison + matières cohérentes
Si l'étiquette dit « matières : coton épais + laine fine » → exclure les pièces synthétiques
(polyester North Face), les matelassés (Barbour), les après-ski (Moon Boot).

### 4. Calculer et vérifier le score
Avant d'afficher la tenue, calculer le score. Si < 70/100, refaire le pick. Si on n'y arrive pas
après 5 essais, **dégrader gracieusement** : afficher 3-4 pièces seulement, et le styliste dit
honnêtement « Pour cette palette + ce profil, voici la meilleure proposition avec nos partenaires
actuels — on enrichit le catalogue chaque semaine ».

## Exemple de ce que ça DEVRAIT donner

Pour la palette **Bois clair · Lin écru · Charbon** / **Studio danois minimaliste** :

| Slot | Pièce idéale | Marque type | Couleur cible |
|---|---|---|---|
| Haut | T-shirt col rond coton épais | COS, Cos, Norse Projects, Lemaire | Écru ou blanc cassé |
| Bas | Pantalon droit laine légère | Lemaire, Acne, A.P.C. | Bois clair (beige sable) |
| Veste | Surchemise en laine | Norse Projects, Lemaire | Charbon (LA couleur forte) |
| Chaussures | Mocassins cuir ou derbies | Common Projects, Lemaire | Brun naturel |
| Accent | Foulard fin laine | Lemaire, Acne | Écru ou charbon |

**Total estimé** : 600-1500€ selon profil Premium.

C'est ÇA un vestiaire minimal scandinave. Pas un mix Moon Boot + Jacquemus + Barbour.

## Action immédiate pour le codeur

1. Implémenter la table `BRAND → REGISTRE` (cf. spec composer existante).
2. Faire en sorte que **chaque palette** ait son **registre cible** (Studio danois → minimaliste,
   Bal au Palais → classique, etc.) — utiliser le champ « Registre : Minimal » qui apparaît déjà
   dans la description.
3. Filtrer le pool de produits sur ce registre AVANT le pick.
4. Filtrer par compatibilité couleur palette (delta E < 30).
5. Filtrer par compatibilité matière annoncée.
6. Calculer le score final. Si < 70, refaire.
7. Si pas possible avec les marques actuelles → afficher 3 pièces + message honnête.

## Pourquoi c'est URGENT

Si tu lances l'abonnement Premium WADA aujourd'hui avec ce composer, le client paye 1,99€/mois
pour des tenues comme **t-shirt vert vif + Moon Boot + Barbour**. Aucun client ne renouvelle.

À régler avant tout lancement public et avant tout effort marketing (la pub TikTok qu'on vient de
finir ne sert à rien si l'app montre des tenues qui n'ont aucun sens).

---

Cf. fichier `WADA-logique-composition-tenue.md` pour la spec complète. Cf. fichier
`WADA-bug-marques-affiliees-codeur.md` pour le bug connexe sur les marques non-affiliées.
