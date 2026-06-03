# ⚠️ URGENT — CORRECTION CRITIQUE : Home vs /boutique

## Le problème actuel

Tu as mis le nouveau design (« Les pièces incontournables du moment » + cards Nouveautés
/ Vêtements / Chaussures / Sacs / Accessoires / Marques + grille produits MUJI) **sur la
page d'accueil (`/`)**.

**Ce n'est PAS ce qui était demandé.** Ce design devait aller **uniquement sur `/boutique`**.

---

## Ce qu'il faut faire MAINTENANT

### Étape 1 — RESTAURER la page d'accueil (/) à son état précédent

La page `/` doit retrouver son design original :

```
URL = /
Contenu attendu :
  - Header avec logo WADA 和田 + nav (Palettes / Scanner / Styliste / Boutique)
  - Vidéo HERO Hannya mask (Wes Anderson) plein écran
  - Texte overlay :
      « INSPIRÉ DE SANZŌ WADA · 1933 »
      « Trouvez la couleur. Trouvez votre style. »
  - 2 CTA :
      [Scanner une couleur →]  (bordeaux rempli)
      [Notre histoire]          (outline blanc)
```

C'est l'identité éditoriale de WADA. **Elle ne doit JAMAIS être remplacée par un catalogue
produit.**

**Si la version précédente est dans Git** : `git revert` ou `git checkout` du commit
précédent pour `app/page.tsx`.

**Si elle n'est plus disponible** : utiliser le code suivant :

```tsx
// app/page.tsx — VERSION CORRECTE À RESTAURER

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="relative h-[calc(100vh-80px)] overflow-hidden bg-black">

        {/* Vidéo hero plein écran */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/wada-hannya-hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay sombre subtil */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Contenu hero */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase mb-6 opacity-90">
            Inspiré de Sanzō Wada · 1933
          </p>
          <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-10 font-medium">
            Trouvez la couleur.<br/>
            Trouvez votre style.
          </h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/scanner"
              className="px-7 py-3.5 bg-[#6e3b32] text-white rounded-full text-sm hover:bg-[#5a2f28] transition-colors"
            >
              Scanner une couleur →
            </Link>
            <Link
              href="/a-propos"
              className="px-7 py-3.5 bg-transparent border border-white text-white rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              Notre histoire
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
```

### Étape 2 — DÉPLACER le nouveau design sur /boutique

Tout ce que tu viens de coder pour la home (« Les pièces incontournables du moment »
+ « Nos sélections » + « Nouveautés » + 3 features cards) doit être déplacé dans :

```
app/boutique/page.tsx
```

**Concrètement** :
1. Crée le dossier `app/boutique/` si pas déjà existant
2. Crée `app/boutique/page.tsx`
3. Déplace tout le code que tu avais mis dans `app/page.tsx` vers `app/boutique/page.tsx`
4. Restaure `app/page.tsx` selon l'Étape 1

```tsx
// app/boutique/page.tsx — LE NOUVEAU DESIGN VA ICI, PAS SUR /

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BoutiqueHero } from '@/components/boutique/BoutiqueHero';
import { BoutiqueSelections } from '@/components/boutique/BoutiqueSelections';
import { BoutiqueNouveautes } from '@/components/boutique/BoutiqueNouveautes';
import { BoutiqueFeatures } from '@/components/boutique/BoutiqueFeatures';

export default function BoutiquePage() {
  return (
    <>
      <Header />
      <main className="bg-[#f5efe2] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <BoutiqueHero />
          <BoutiqueSelections />
          <BoutiqueNouveautes />
          <BoutiqueFeatures />
        </div>
      </main>
      <Footer />
    </>
  );
}
```

### Étape 3 — Vérifier que la nav pointe bien

Dans le composant `Header.tsx` (ou équivalent), vérifie que l'item « Boutique » de la nav
pointe bien vers `/boutique` :

```tsx
<Link href="/boutique">Boutique</Link>   // ✅ CORRECT
```

PAS :

```tsx
<Link href="/">Boutique</Link>           // ❌ FAUX
```

Et le logo WADA 和田 pointe toujours vers `/` (la home éditoriale) :

```tsx
<Link href="/">
  <span>WADA 和田</span>
</Link>
```

---

## ⚠️ DEUXIÈME PROBLÈME — Les photos avec mannequins

Sur le design boutique actuel, je vois des photos produits **AVEC mannequins** :
- Le modèle homme en chemise bleue + pantalon gris (MUJI)
- La femme en t-shirt noir + pantalon crème (MUJI)
- La femme en short bleu pâle (MUJI)

**C'est contraire à la règle absolue** définie dans le brief précédent
`WADA-navigation-categories-lyst-style.md` (section « RÈGLE IMAGES PRODUITS — ABSOLUE ET
NON NÉGOCIABLE »).

### Rappel de la règle

✅ **Packshot pur uniquement** (le vêtement seul, à plat ou suspendu sans contexte)
✅ **Vue de face**, fond uniforme (blanc, gris clair, ou neutre)

❌ **JAMAIS de mannequin** (vivant ou silhouette)
❌ **JAMAIS de vue de dos** ou 3/4

### Ce qu'il faut faire

1. Lancer le script `scripts/clean-product-images.ts` qui doit déjà être créé selon le brief
   précédent (sélection automatique de l'image packshot via heuristique + GPT-4o-mini Vision)

2. Si le script n'existe pas encore, le créer en se basant sur la section « Comment filtrer
   les images du flux » du brief `WADA-navigation-categories-lyst-style.md`

3. Mettre à jour TOUS les produits affichés sur `/boutique` pour utiliser uniquement les
   images packshot validées (`product.image_url` doit pointer vers une image SANS mannequin)

Si un produit n'a aucune image packshot disponible dans le flux Awin, **le désactiver**
plutôt que d'afficher une photo avec mannequin.

---

## Résumé de ce qu'il faut faire

```
□ ÉTAPE 1 — Restaurer la page d'accueil :
  - git revert ou réécrire app/page.tsx
  - Vidéo Hannya mask, "Trouvez la couleur. Trouvez votre style."
  - 2 CTA : Scanner / Notre histoire

□ ÉTAPE 2 — Créer la page /boutique :
  - Créer app/boutique/page.tsx
  - Y mettre le nouveau design (hero "Les pièces incontournables" + sections)

□ ÉTAPE 3 — Vérifier le routing :
  - Logo WADA → href="/"
  - Lien "Boutique" → href="/boutique"

□ ÉTAPE 4 — Filtrer les images :
  - Lancer scripts/clean-product-images.ts
  - Désactiver les produits qui n'ont aucune image sans mannequin
  - Toutes les images affichées doivent être packshots de face uniquement

□ ÉTAPE 5 — Tester :
  - Aller sur wada.style/ → voir la vidéo Hannya + "Trouvez la couleur"
  - Cliquer "Boutique" dans le nav → arriver sur wada.style/boutique
  - Voir le design "Les pièces incontournables" sur /boutique
  - Vérifier qu'aucune image produit ne montre un mannequin
  - Cliquer sur le logo WADA → revenir sur la home
```

---

## En une phrase

**La home (`/`) c'est l'âme WADA — la vidéo Hannya et le storytelling Sanzō Wada.**
**La boutique (`/boutique`) c'est le shopping — le design Mango-style.**
**Les deux mondes existent en parallèle. La nav permet de naviguer entre les deux.**

---

## Important

Cette correction est **prioritaire absolue**. Tant que la home est cassée, tout WADA est
cassé en termes d'identité de marque. Il faut faire cette correction **avant tout autre
développement**.

Dis-moi quand c'est fait — je vérifierai sur le site live.
