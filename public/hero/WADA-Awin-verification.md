# WADA — Vérification Awin des URL promotionnelles

Publisher Awin : **2879911**.
Deux URL à vérifier sur le compte Awin de WADA :
1. `https://wada.style` → **le codeur s'en occupe** (méthode 1 ci-dessous).
2. `https://www.pinterest.com/wadastyle/` → **non faisable techniquement** — voir section 2.

---

## 1) Vérification wada.style (pour le codeur)

Choisir UNE des deux méthodes ci-dessous, la méthode A est plus simple.

### Méthode A — Meta tag dans le `<head>` (recommandée)

Dans `app/layout.tsx`, ajouter le meta tag dans le head de la page d'accueil. Soit en direct dans le JSX :

```tsx
<head>
  <meta name="verification" content="cfbd7592e46a6b1f6395564209269fb4" />
  {/* ... reste du head ... */}
</head>
```

Soit (plus propre) via l'API metadata Next.js dans `app/layout.tsx` :

```ts
export const metadata: Metadata = {
  // ... métadonnées existantes ...
  other: {
    'verification': 'cfbd7592e46a6b1f6395564209269fb4',
  },
}
```

**Important** : ce meta tag doit être présent sur la page d'accueil `https://wada.style/`. Awin vérifie en chargeant la home.

### Méthode B — Fichier HTML à la racine (alternative)

Télécharger depuis Awin le fichier `cfbd7592e46a6b1f6395564209269fb4.html` (le lien est dans le tableau de bord Awin > Profil promotionnel) et le placer dans le dossier **`public/`** du projet Next.js (PAS dans `public/hero/`, directement dans `public/`).

Après déploiement, vérifier que ce lien répond : `https://wada.style/cfbd7592e46a6b1f6395564209269fb4.html`.

### Test de validation (après déploiement Vercel)

- Méthode A : ouvrir `https://wada.style/`, faire « Voir le code source », chercher `cfbd7592e46a6b1f6395564209269fb4`. Il doit apparaître dans le `<head>`.
- Méthode B : ouvrir directement `https://wada.style/cfbd7592e46a6b1f6395564209269fb4.html` — la page doit s'afficher (et pas un 404).

Une fois ce test OK, Nem va sur Awin et clique **« Verify Site »**.

---

## 2) Vérification Pinterest (https://www.pinterest.com/wadastyle/) — pour Nem

**Le codeur ne peut rien faire ici.** Pinterest n'autorise pas l'ajout de meta tags personnalisés sur un profil, ni l'upload d'un fichier HTML à la racine de `pinterest.com`. Les deux méthodes proposées par Awin sont donc inapplicables sur cette URL.

Trois options pour gérer ça :

**Option 1 — Laisser cette URL non vérifiée**
Awin n'exige généralement pas la vérification des profils sociaux. La marque la plus importante à vérifier est `wada.style` (le vrai site éditorial). On peut tout à fait laisser Pinterest non vérifié et continuer à promouvoir.

**Option 2 — Supprimer l'URL Pinterest du profil promotionnel**
Dans Awin > Compte > URL promotionnelles, retirer `https://www.pinterest.com/wadastyle/`. Si elle n'est plus dans le profil, Awin n'en demandera plus la vérification. Si Pinterest devient un canal important plus tard, on pourra réfléchir à un autre format (par ex. en demandant à Awin de valider manuellement).

**Option 3 — Demander une vérification manuelle à Awin**
Contacter le support Awin (depuis le tableau de bord > Soutien) avec un message court du type :
> Bonjour, je ne peux pas insérer le meta tag de vérification sur ma page Pinterest (Pinterest n'autorise pas le HTML personnalisé sur un profil public). Pouvez-vous valider manuellement l'URL https://www.pinterest.com/wadastyle/ ? Je suis propriétaire du compte sous le même nom WADA. Merci.

Le support Awin valide souvent manuellement les profils sociaux après vérification de leur côté.

---

## Récap pour Nem

- Transmettre ce fichier au codeur pour la partie **wada.style**.
- Pour Pinterest : choisir l'**option 1** (la plus simple : laisser tel quel), ou l'**option 3** (contacter le support pour validation manuelle) si tu veux que tout soit propre dans le profil Awin.
- Une fois `wada.style` vérifié sur Awin, plus aucune marque ne demandera de re-vérifier pour ce domaine.
