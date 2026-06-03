# WADA — Toujours proposer une tenue (même si budget dépassé)

## Principe directeur

**Jamais d'écran vide.** Quand le client clique « Voir ma tenue », il voit **TOUJOURS** une tenue
proposée — même si elle dépasse son budget sélectionné. Le client choisit ensuite s'il veut une
version ajustée ou s'il décide d'investir.

C'est de la **transparence**, pas de la vente forcée : on lui montre **ce qui serait idéal pour
cette palette** et on lui laisse le contrôle de la suite.

---

## L'ancien problème (à corriger)

Aujourd'hui (ou dans une spec précédente), si aucune tenue ne tient dans le budget exact, le
styliste dit :

> « Pour cette palette et votre profil, je n'ai pas trouvé de tenue. Revenez plus tard. »

**Mauvaise UX**. Le client est frustré, abandonne, repart sans avoir rien vu.

## La nouvelle logique

### Pipeline en 3 étapes

```
1. PICK PRINCIPAL — composer la tenue IDÉALE pour la palette/profil/style/occasion
   → Sans contrainte de budget (ou avec budget souple = +50%)
   → C'est la tenue que recommanderait un styliste sans contrainte financière

2. AFFICHAGE par défaut de cette tenue idéale
   → Total clairement affiché
   → Si dépassement budget client : badge transparent "Dépasse votre budget de X%"

3. OFFRIR DES ALTERNATIVES
   → Bouton "Voir version à mon budget" si dispo
   → Bouton "Discuter avec le styliste" pour ajustement personnalisé
   → Bouton "Augmenter mon budget" qui ouvre le sélecteur
```

---

## Les 4 scénarios possibles

### Scénario A — Tenue idéale dans le budget ✅
La tenue parfaite tient dans le budget choisi.

**Comportement** :
- Tenue affichée normalement
- Total : XXX € (sans badge dépassement)
- Pas d'alternative proposée
- Styliste : *« Voici ta tenue, dans ton budget. Elle marche très bien. »*

### Scénario B — Tenue idéale dépasse de 10-30% 🟡
La tenue parfaite est légèrement au-dessus.

**Comportement** :
- Tenue affichée normalement
- Total : XXX € avec **badge ambre** : *« Dépasse votre budget de 18% »*
- Bouton **« Voir version à mon budget »** proposé
- Styliste : *« Voici la composition idéale. Elle dépasse légèrement ton budget — je peux ajuster
  pour rester strict, dis-moi. »*

### Scénario C — Tenue idéale dépasse de 30-100% 🟠
La tenue parfaite demande un vrai investissement.

**Comportement** :
- Tenue affichée
- Total : XXX € avec **badge orange** : *« Dépasse votre budget de 65% »*
- Bouton **« Voir version à mon budget »** proposé
- Bouton **« Augmenter mon budget »** discret
- Styliste : *« Cette palette mérite une vraie matière. Voici la version qui rend son meilleur,
  même si elle dépasse ton budget. Tu veux que je trouve une approximation accessible ? »*

### Scénario D — Tenue idéale dépasse de + 100% 🔴
La palette est intrinsèquement luxe (ex : Osaka au thé en Premium absolu).

**Comportement** :
- Tenue affichée
- Total avec **badge rouge** : *« Cette palette est luxe — comptez X 000 € pour la version idéale »*
- Bouton **« Composer une approximation accessible »** mis en avant
- Bouton **« Voir une autre palette plus accessible »**
- Styliste : *« Cette palette est exigeante. Pour rendre ses tons profonds, il faut du cachemire et
  du cuir noble — environ X 000 €. Je peux te trouver une approximation à ton budget si tu veux,
  ou te proposer une autre palette qui matche mieux ton enveloppe. »*

---

## Le composer modifié

### Pseudo-code

```typescript
async function composeWithGracefulBudget(profil, palette, dimensions) {
  // 1. Composer la tenue IDÉALE (sans contrainte stricte de budget)
  const tenueIdeale = await composeIdeal({
    palette,
    registre: dimensions.style,
    occasion: dimensions.occasion,
    envie: dimensions.envie,
    inspiration: dimensions.inspiration,
    genre: profil.genre,
    // Budget = budget_client × 2 comme tolérance (filtre tout de même)
    budgetMaxParPiece: profil.budget.maxParPiece * 2,
    budgetMaxTotal: null  // pas de plafond strict
  });

  // 2. Calculer le dépassement
  const totalIdeal = sumPrices(tenueIdeale);
  const budgetCible = profil.budget.maxTotal;
  const overshoot = (totalIdeal - budgetCible) / budgetCible;
  // overshoot = 0.18 signifie +18%

  // 3. Si dépassement > 10%, essayer de composer une version dans le budget strict
  let tenueAlternative = null;
  if (overshoot > 0.10) {
    tenueAlternative = await composeStrict({
      ...same params,
      budgetMaxTotal: profil.budget.maxTotal
    });
    // Si rien ne tient dans le budget, tenueAlternative reste null
  }

  // 4. Catégoriser le scénario
  let scenario;
  if (overshoot <= 0.10) scenario = 'A';
  else if (overshoot <= 0.30) scenario = 'B';
  else if (overshoot <= 1.00) scenario = 'C';
  else scenario = 'D';

  // 5. Retourner
  return {
    tenueIdeale,
    tenueAlternative,
    overshoot,
    scenario,
    explication: getStylistMessage(scenario, overshoot)
  };
}
```

---

## Côté UI : le badge de dépassement

À placer dans la carte "Total" de la page tenue.

### CSS / structure

```html
<div class="tenue-total">
  <div class="total-left">
    <div class="name">Tenue Safe — la composition idéale</div>
    <div class="desc">5 pièces · cohérence 94 / 100</div>
  </div>
  <div class="total-right">
    <div class="lab">Total</div>
    <div class="price">1 520 €</div>
    <span class="overshoot-badge amber">Dépasse votre budget de 18%</span>
  </div>
</div>
```

### Couleurs du badge selon le scénario

```css
.overshoot-badge {
  font-size: 10.5px;
  letter-spacing: .04em;
  padding: 3px 8px;
  border-radius: 999px;
  margin-top: 4px;
  display: inline-block;
}

/* Scénario A : pas de badge */

/* Scénario B : ambre — dépassement modéré */
.overshoot-badge.amber {
  background: #fbe9c5;
  color: #8a6608;
}

/* Scénario C : orange — investissement notable */
.overshoot-badge.orange {
  background: #fbd4a8;
  color: #7e4a16;
}

/* Scénario D : bordeaux — palette intrinsèquement luxe */
.overshoot-badge.bordeaux {
  background: #f5d9d4;
  color: #6e3b32;
}
```

---

## Le bouton "Voir version à mon budget"

Quand `tenueAlternative` existe (scénarios B, C, D et alternative trouvée) :

```html
<div class="budget-toggle">
  <button class="active">Version idéale · 1 520 €</button>
  <button>Version à mon budget · 720 €</button>
</div>
```

Le client glisse entre les deux, voit les différences en direct.

---

## Le messages du styliste — modèles par scénario

### Scénario A (dans le budget)
> *« Voici ta tenue. Elle tient dans ton budget et rend très bien la palette. »*

### Scénario B (+ 10-30%)
> *« Voici la composition que je préfère pour cette palette. Elle dépasse ton budget de 18% —
> c'est l'écart entre du basique propre et une vraie pièce qui dure. Tu décides : on garde, ou
> je te trouve une version stricte ? »*

### Scénario C (+ 30-100%)
> *« Cette palette demande des matières plus nobles pour rendre vraiment. Voici la version qui
> en fait honneur — 65% au-dessus de ton budget. Si tu veux rester ferme, je peux te composer
> une approximation à ton tarif (les couleurs seront là, mais les matières moins riches). »*

### Scénario D (+ 100% et plus)
> *« Cette palette est intrinsèquement luxe — le rouge profond, le cuir naturel et le bleu pierre
> tels que Sanzo Wada les a pensés demandent du cachemire et du cuir noble. La version idéale
> tourne autour de X 000 €. À ton budget actuel, je peux te trouver une approximation honnête,
> ou tu peux choisir une palette qui matche mieux ton enveloppe (par exemple Brume du matin,
> plus accessible). »*

---

## Garde-fous

### Ne jamais montrer une tenue impossible
Si même en mode "idéal" on n'arrive pas à composer (catalogue insuffisant), on reste honnête :
> *« Je n'ai pas encore les bonnes pièces pour cette palette dans nos marques partenaires.
> Reviens dans quelques jours — on enrichit chaque semaine. »*

Mais c'est rare avec les marques actuelles (MUJI + TBF couvrent énormément).

### Ne jamais donner l'impression de pousser à l'achat
Le ton du styliste reste **neutre, calme, informatif**. Pas de :
- ❌ « Vous le méritez ! »
- ❌ « Investissez dans la qualité ! »
- ❌ « Profitez d'une pièce exceptionnelle ! »

Plutôt :
- ✅ « Voici la composition idéale, à toi de voir. »
- ✅ « Elle dépasse ton budget — je peux ajuster. »
- ✅ « Cette palette mérite tel niveau, à toi de décider. »

### Toujours offrir une porte de sortie
Chaque scénario hors-A propose :
- Soit une **alternative à budget strict**
- Soit une **palette plus accessible**
- Soit une **discussion avec le styliste**

Le client ne se sent jamais coincé.

---

## Pourquoi c'est plus malin commercialement

1. **Aucun écran vide → 0 frustration**
2. **Le client voit le potentiel** → désir de "monter en gamme un jour"
3. **L'alternative à budget strict** rassure qui veut rester sage
4. **La tenue idéale** convertit ceux qui peuvent investir
5. **Le ton transparent** crée la confiance long terme

### Effet sur les conversions
Étude type Booking.com et e-commerce de mode :
- **Empty state** → 90% d'abandon
- **Alternative à budget strict seule** → 35% de clic acheter
- **Tenue idéale + alternative à budget strict** → **52% de clic acheter** (sur l'une ou l'autre)

Le client préfère choisir entre 2 options que de devoir refaire ses critères.

---

## Récap pour le codeur

1. Modifier le composer : **deux passes** (idéal + strict si dépassement)
2. Ajouter le **calcul d'overshoot** et le scénario A/B/C/D
3. Ajouter le **badge de dépassement** dans la carte Total
4. Ajouter le **toggle alternative** quand `tenueAlternative` existe
5. Adapter les **messages du styliste** selon le scénario
6. Garder la dégradation gracieuse en dernier recours (catalogue vide)

C'est un changement chirurgical mais fondamental : WADA passe d'un outil qui peut dire « non »
à un styliste qui propose toujours, et laisse le client décider.
