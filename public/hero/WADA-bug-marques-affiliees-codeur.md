# WADA — Bug critique : retirer toutes les marques non affiliées des recommandations

## Le problème observé (capture mobile « Béton & Lin »)

La tenue propose 4 pièces :
- Haut : Hoodie oversized **COS** · ~55€
- Bas : Cargo large **COS** · ~55€
- Chaussures : Sneakers running **Veja** · ~55€
- Accent : Casquette baseball **Amazon** · ~55€

Et le bouton dit « Lien partenaire — prix identique chez le marchand ».

**Deux problèmes graves** :

### Problème 1 : Aucune de ces 3 marques n'est partenaire affilié
- **COS** : pas de programme Awin FR connu (ils ont leur propre programme limité, mais pas via toi)
- **Veja** : pas de programme affilié grand public
- **Amazon** : tu n'as pas (encore ?) configuré Amazon Associates avec ton tag `wadastyle-21`

Conséquences :
1. Le client clique « Acheter », achète, **WADA ne touche RIEN**.
2. Le libellé « Lien partenaire » est **trompeur** (RGPD/transparence des plateformes).
3. Le positionnement éditorial premium est dilué par Amazon (qui sort un random produit no-name).

### Problème 2 : Tous les prix sont à `~55€` (placeholder)
Hoodie COS = 55€, Cargo COS = 55€, Sneakers Veja = 55€, Casquette Amazon = 55€. Aucune chance.
Le composer affiche un prix factice partout au lieu du vrai prix du flux Awin. Bug pur.

---

## La correction à appliquer

### Règle 1 — WHITELIST stricte des marques affiliées

Le composer ne pioche QUE dans une liste blanche de marques où WADA a un partenariat affiliation
actif et **validé**. À maintenir en config (ex. `lib/affiliate-brands.ts`) :

```typescript
export const AFFILIATE_BRANDS = {
  // Awin Publisher 2879911
  awin: [
    'MUJI',                    // ID 84713 — actif
    'The Shirt Company',       // ID 115010 — actif
    'The Business Fashion',    // ID 78164 (UE) — actif
    'Atelier du diamant',      // si accepté
    'ANITA & ZAHA',            // si accepté
    // Toutes les marques sous le multi-marchand TBF (Brunello, Tom Ford, Amiri, etc.)
    // — celles-ci sont OK car le lien d'achat passe par TBF en deep_link
  ],
  amazon: [
    // Vide pour l'instant — à activer SI Amazon Associates wadastyle-21 est configuré
    // et que la conformité RGPD/affichage est faite
  ],
  direct: [
    // marques avec contrat direct (aucune pour l'instant)
  ]
};
```

**Règle absolue** : si un produit n'a pas de `merchant_id` correspondant à une marque whitelistée,
**il n'est PAS proposé**. Point.

### Règle 2 — Pour TBF (multi-marques), la marque AFFICHÉE peut être différente

TBF revend Brunello, Tom Ford, Amiri, etc. Quand le composer pioche un produit Brunello dans le flux
TBF, on affiche bien **« Brunello Cucinelli »** (la vraie marque, depuis `brand_name`) MAIS le lien
d'achat passe par TBF via `aw_deep_link`. C'est juste à clarifier dans le code : la marque affichée
≠ la source affiliée.

### Règle 3 — Si un slot n'a aucun produit affilié pertinent, ne pas le remplir

Mieux vaut une tenue à **4 pièces** qu'une tenue à 5 dont 1 est bidon. Si pour la palette + le
registre + la couleur cible le composer ne trouve aucun produit chez les marques whitelistées, il
laisse le slot vide et le styliste dit :

> « J'ai composé 4 pièces. Pour l'accent, aucune de nos marques partenaires n'a la pièce parfaite —
> reviens plus tard, on enrichit le catalogue chaque semaine. »

C'est plus honnête et ça pousse le client à revenir.

### Règle 4 — Bug prix `~55€` à corriger

Source : sans doute un fallback dans le code quand le composer n'a pas réussi à récupérer le `search_price`
du produit. À auditer côté codeur :

1. Le flux Awin contient bien `search_price` (vérifié, c'est le cas).
2. Le composer doit utiliser ce champ **réel** par produit, pas un default.
3. Conversion devise si flux en GBP → conversion EUR avec taux à jour (cf. spec TBF).
4. Si vraiment aucun prix dispo, afficher « Prix sur le site » (lien vers le marchand) plutôt que
   « ~55€ » qui n'a aucun sens.

### Règle 5 — Le libellé sous le bouton doit refléter la vérité

Aujourd'hui : « Lien partenaire — prix identique chez le marchand. »

Si le produit n'est pas réellement affilié → on n'aurait jamais dû arriver là (cf. règle 1). Avec la
whitelist, ce libellé devient toujours vrai.

Mais pour transparence RGPD, ajouter une **page Affiliation** accessible depuis le footer qui
explique :
- Quelles marques sont partenaires
- Comment WADA touche une commission
- Que le prix client reste identique
- Que la sélection éditoriale n'est PAS influencée par la commission

---

## Conséquences sur les tenues affichées tout de suite

Avec uniquement MUJI + TBF + Shirt Company (les 3 marques actives aujourd'hui), les tenues seront
plus **homogènes** :

- Pour un profil **Premium Homme** → presque tout en TBF (Tom Ford, Brunello, Loro Piana, etc.)
- Pour un profil **Premium Femme** → Shirt Company pour les chemises, sinon rien (manque femme luxe)
- Pour un profil **< 150€** → tout en MUJI

C'est un peu monotone au début, mais **honnête**. Au fur et à mesure que les nouvelles marques
acceptent (Sezane, Sandro, Maje, etc.), la variété arrive automatiquement.

---

## Checklist du fix

- [ ] Créer le fichier `AFFILIATE_BRANDS` whitelist en config
- [ ] Le composer filtre les produits par appartenance à cette whitelist AVANT toute autre logique
- [ ] Pour TBF : afficher la vraie marque (`brand_name`), mais lien d'achat via TBF
- [ ] Si slot sans candidat dispo → ne pas le remplir, signaler honnêtement
- [ ] Corriger le bug `~55€` (utiliser le vrai `search_price` du flux)
- [ ] Conversion GBP → EUR pour TBF
- [ ] Page Affiliation accessible depuis le footer (transparence RGPD)
- [ ] Supprimer les anciennes recommandations COS / Veja / Amazon de toutes les pages

---

## Pourquoi c'est URGENT

Aujourd'hui un client qui voit une tenue WADA + bouton « Acheter » + libellé « Lien partenaire » :

1. Pense qu'il achète via toi, donc te soutient
2. Clique, achète chez COS / Veja / Amazon
3. Tu ne touches RIEN
4. Le libellé est mensonger (= souci RGPD pour les plateformes de recommandation)

Et techniquement, si tu lances ton abonnement Premium dans cet état, un utilisateur peut légitimement
se plaindre qu'il paye 1,99€/mois pour des recommandations… sans aucune commission qui revient à
WADA et donc sans modèle économique transparent.

À régler avant tout lancement public.
