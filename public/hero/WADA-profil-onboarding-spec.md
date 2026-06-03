# WADA — Onboarding + profil + switcher (spec codeur)

But : connaître le client (genre, budget, style) **dès le premier accès**, mémoriser, et permettre
de le changer à tout moment en 2 secondes. Sans ça, toutes les propositions de tenue sont
abstraites et le client ne se sent jamais concerné.

Maquette de référence : `wada-palette-finale.html` (et `wada-onboarding-palette.html`).

---

## 1. Modèle de profil

Un profil utilisateur a 3 champs minimum :

```ts
type Profile = {
  genre: 'Femme' | 'Homme';
  budget: '< 150€' | '150–400€' | 'Premium';
  style: 'Minimaliste' | 'Classique' | 'Streetwear' | 'Décontracté';
};
```

Stockage :
- **Utilisateur connecté** → dans la base (table `users` ou `profiles`), modifiable côté serveur.
- **Utilisateur non connecté** → `localStorage` (clé `wada.profile`), pour ne pas redemander à chaque visite.
- À la connexion / création de compte, fusionner le profil local avec le profil serveur (priorité au serveur).

## 2. Onboarding au premier accès

Au tout premier chargement (pas de `wada.profile` en localStorage ET pas de profil serveur), afficher un
**overlay plein écran** (z-index élevé, fond crème) avec 3 questions :

1. Pour qui ? (Femme | Homme)
2. Budget par tenue ? (< 150€ | 150–400€ | Premium)
3. Style ? (Minimaliste | Classique | Streetwear | Décontracté)

Règles UX :
- 3 questions, **maximum 10 secondes** pour répondre.
- Boutons grands, chubby, un clic = sélection (pas de validation).
- Le bouton **Commencer** ne s'active que quand les 3 sont répondues.
- Un lien discret **« Passer pour cette fois »** sous le bouton — si cliqué, profil par défaut
  appliqué (Femme · 150–400€ · Minimaliste), modifiable plus tard.
- L'overlay disparaît avec une transition douce.

Cf. la section onboarding de `wada-palette-finale.html` pour le rendu exact.

## 3. Indicateurs visibles du profil sur le site

Deux indicateurs visibles partout :

### Pastille profil dans la nav (en haut à droite)
- Avatar rond bordeaux avec l'initiale du genre (« F » ou « H »).
- Libellé en clair : `Femme · 150–400€ · Minimaliste`.
- Petit chevron qui suggère qu'on peut cliquer.
- Au clic → ouvre le **switcher** (cf. point 4).

### Badge perso sur les pages palette/tenue
- Petit badge ambre : *« Composées pour vous · Femme · 150–400€ · Minimaliste »*.
- Cliquable pareil → ouvre le switcher.

Ces deux indicateurs montrent au client que TOUT ce qu'il voit est filtré pour lui.

## 4. Switcher rapide (modal léger)

Un modal centré (overlay sombre + carte beige), pas une page entière :

- Titre : « Changer le profil ».
- 3 **segmented controls** (un par dimension) — un clic = sélection, modification visible immédiatement.
- Bouton « Appliquer → » et un X en haut.

Au changement d'une dimension :
- Le badge perso et la pastille nav se mettent à jour en direct.
- Les propositions de tenues (chips des 3 cartes occasion + tenue finale) se recalculent.
- Pas de rechargement de page : tout est React state.

Le switcher est accessible **depuis n'importe quelle page** via la pastille nav. Sur les pages
palette/tenue, il l'est aussi via le badge perso.

## 5. Conséquences sur les pages

### Page palette
- Les 3 cartes occasion (Bureau / Quotidien / Soirée) restent.
- Mais les **chips de pièces** dans chaque carte sont filtrés par genre :
  - Femme : Blazer fluide, Mocassins, Boucles dorées, etc.
  - Homme : Blazer, Derbies, Pochette, etc.
- Le budget influence la marque ou la gamme de prix des pièces proposées :
  - `< 150€` → MUJI, basiques abordables
  - `150–400€` → marques milieu de gamme
  - `Premium` → marques haut de gamme
- Le style influence les coupes/registres (un Minimaliste reçoit moins de motifs, un Streetwear
  plus de sneakers, etc.).

### Page tenue
- Affiche directement la tenue composée pour le profil actif (genre + budget + style).
- Toutes les pièces (haut, bas, veste, chaussures, accent) sont du bon genre.
- Les prix collent au budget.
- Le badge perso reste visible — un clic, le client peut tout recomposer pour un autre profil.

### Page styliste IA
- Quand l'utilisateur ouvre le styliste, le profil est **automatiquement injecté** dans le contexte
  du LLM (avec la liste des accords Sanzo Wada). Le styliste sait déjà qui parle.

## 6. Comportements à respecter

- **Profil persistant** : un client qui revient une semaine plus tard retrouve son profil.
- **Switcher non destructif** : changer de profil ne supprime pas les favoris.
- **Mode invité** : un visiteur qui n'a pas fini l'onboarding peut quand même utiliser le site avec
  le profil par défaut. L'onboarding peut être relancé via un lien dans le compte.
- **Multiples profils (plus tard)** : prévoir dans le modèle qu'un user puisse avoir plusieurs
  profils nommés (« Moi », « Ma femme »…). Pour le V1, un seul profil suffit.
- **Aucune barrière** : jamais bloquer une page tant que l'onboarding n'est pas fait. Le profil par
  défaut suffit toujours à rendre la page utilisable.

## 7. Tests d'acceptation

- [ ] Au 1er accès, l'overlay onboarding s'affiche.
- [ ] Les 3 réponses activent « Commencer ».
- [ ] Le profil est sauvé en localStorage (+ DB si connecté).
- [ ] La pastille nav et le badge perso affichent le profil correct.
- [ ] Cliquer sur l'un ou l'autre ouvre le switcher.
- [ ] Changer une dimension met à jour pastille + badge + chips/tenue, sans recharger.
- [ ] Au prochain accès, l'overlay onboarding **ne s'affiche pas** (profil mémorisé).
- [ ] Sur mobile, l'overlay et le switcher sont utilisables au pouce.

---

Cf. `wada-palette-finale.html` pour le rendu visuel attendu (onboarding + switcher + page palette
avec badge perso + chips filtrées par genre).
