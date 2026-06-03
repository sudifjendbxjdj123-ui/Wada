# WADA — Supprimer le profil persistant (pour le codeur)

## Le constat

Un profil persistant (avec genre / budget / style mémorisés) ne sert PAS la majorité des cas
d'usage. Un client peut vouloir :
- Composer pour lui
- Puis pour sa femme
- Puis tester une sortie
- Puis tester décontracté
- Puis un look pour offrir

Lui demander de **modifier son profil 5 fois** crée plus de friction que d'aide. Le profil est
une fausse bonne idée à ce stade.

## Ce qu'il faut SUPPRIMER partout sur le site

❌ La **pastille profil** dans la barre de nav (le rond bordeaux avec « H » + point vert)
❌ L'**overlay d'onboarding** au premier accès (« 3 questions pour personnaliser tes tenues »)
❌ Le **switcher rapide** (modal qui s'ouvrait quand on cliquait sur la pastille)
❌ Le **badge perso** sur la page palette (« Composée pour vous · Femme · 150–400€ · Minimaliste »)
❌ La mémoire `wada.profile` dans localStorage ou en DB (ou la garder vide / inutilisée)
❌ Toutes les références au profil dans le pied de page, les menus, les libellés

## Le nouveau flux

Chaque génération de tenue est **fraîche** :

1. Le client arrive sur une palette (ex. Mirage du désert).
2. Il voit la palette + nom + métadonnées + UN bouton **« Composer une tenue → »**.
3. Au clic, il va dans le **Styliste IA** avec la palette pré-chargée comme contexte.
4. Le styliste lui pose **2-3 questions rapides** (chips) — uniquement celles qui comptent :
   - Pour qui ? (Femme / Homme / Mixte)
   - Quelle occasion ? (Bureau / Quotidien / Soirée / Weekend / Voyage)
   - Quel budget ? (< 150€ / 150–400€ / Premium)
5. Le styliste compose la tenue et l'affiche. Fini.

Le client peut recomposer une autre tenue (même palette, autres réponses) en 3 secondes — sans rien
modifier dans un profil. C'est l'esprit « moteur de proposition », pas « profil enregistré ».

## La nav nettoyée

**AVANT** :
```
[Logo] [Palettes Scanner Styliste Favoris]  [Abonnement] [Avatar profil ●]
```

**APRÈS** :
```
[Logo] [Palettes Scanner Styliste Favoris]  [Abonnement]
```

C'est tout. La pastille profil disparaît.

À la place, on peut mettre une **petite icône compte** (👤) qui mène à une page « Mon compte »
basique (mes favoris, mon abonnement, mes infos de paiement) — mais SANS notion de profil de style.

## La page palette nettoyée

```
[Hero]
  ├─ Palette card
  └─ Meta block
      ├─ Kicker (No. + culture)
      ├─ Titre + description italique
      ├─ Bloc métadonnées (Ambiance/Saison/Luminosité/Contraste)
      ├─ UN bouton bordeaux « Composer une tenue → »
      └─ Mini-actions (favori + Pinterest)

[Prev/Next discrets]
[Mini-lien styliste]
[Footer]
```

Plus de badge perso. Plus de switcher. Plus rien à configurer sur cette page.

## L'interface du Styliste IA

Quand le client arrive avec une palette (depuis le bouton « Composer une tenue »), la première bulle
du styliste est :

> « Tu pars sur **Mirage du désert** — superbe choix. Dis-moi en 3 secondes pour qui c'est. »
>
> [Femme] [Homme] [Mixte]

Puis :
> « Quelle occasion ? »
>
> [Bureau] [Quotidien] [Soirée] [Weekend] [Voyage]

Puis :
> « Quel budget ? »
>
> [< 150€] [150–400€] [Premium]

Et ensuite la tenue est composée. **3 questions, 6 secondes, et c'est parti.**

Le client peut tout recommencer avec un autre genre / occasion / budget en cliquant juste « Composer
une autre tenue » dans le styliste. Pas besoin de changer un profil.

## Conséquences sur les fichiers existants

Les fichiers ci-dessous sont **à mettre de côté** ou à archiver (ils décrivaient le profil persistant
qu'on supprime maintenant) :

- ❌ `WADA-profil-onboarding-spec.md` — toute la partie onboarding + switcher devient obsolète.
- ❌ `wada-onboarding-palette.html` — la démo onboarding n'est plus le bon modèle.
- ❌ `wada-palette-finale.html` — la version avec badge perso n'est plus à suivre.

Le fichier `WADA-IA-styliste-v2.md` reste d'actualité MAIS le système prompt doit être ajusté pour
que le styliste **demande ces 3 questions de base à chaque conversation** s'il n'a pas l'info,
plutôt que de supposer un profil pré-existant.

## Référence visuelle à jour

- `wada-palette-mirage.html` — à utiliser comme nouveau modèle (à corriger : retirer le badge perso
  « Composée pour vous » qui n'y a plus sa place, et changer le bouton en « Composer une tenue »).
- Pour le styliste : maquette à refaire dans la prochaine passe (chips question + bulle réponse,
  3 étapes max, puis tenue affichée).

## Ce que ça gagne

- **Zéro friction d'entrée** : pas d'onboarding, le client peut tester WADA sans engagement.
- **Flexibilité totale** : il génère 10 tenues différentes en 1 minute, pour 10 contextes différents.
- **Code plus simple** : une feature en moins à maintenir.
- **Conversion plus rapide** : moins d'étapes entre « j'arrive » et « je vois ma tenue ».

C'est plus aligné avec ce que WADA doit être : un **moteur d'inspiration et de proposition**, pas un
service personnalisé qui demande qu'on s'y engage.
