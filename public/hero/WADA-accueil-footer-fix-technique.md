# WADA — Retirer le footer SUR L'ACCUEIL : fix technique (pour le codeur)

## Pourquoi « ça ne marche pas »
Le `<Footer/>` est rendu **globalement** (dans `app/layout.tsx` ou un layout partagé qui enveloppe
toutes les pages). Donc il s'affiche **partout, y compris sur `/`**. Bumper le service worker
(v8 → v9) **ne retire pas le footer** — ça ne fait que rafraîchir le cache. Il faut une **condition**
dans le code.

## Le fix (Next.js App Router)
**Objectif** : footer affiché sur toutes les pages **SAUF** `/` (l'accueil), qui devient une vidéo
plein écran.

### Option A — condition dans le layout (simple)
Rendre le footer conditionnellement selon la route. Comme `usePathname` est client, isoler dans un
petit composant client :
```tsx
// components/ConditionalFooter.tsx
"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;   // pas de footer sur l'accueil
  return <Footer />;
}
```
Puis dans `app/layout.tsx`, remplacer `<Footer />` par `<ConditionalFooter />`.

### Option B — route group (plus propre)
Mettre l'accueil dans un groupe avec son **propre layout sans footer**
(`app/(home)/layout.tsx` qui ne rend ni footer ni le `<Nav/>` si on veut le plein écran), et garder
le layout global (avec footer) pour le reste.

## L'accueil plein écran
Sur `/`, la page = **vidéo mannequin plein écran en boucle**, pas de footer :
```tsx
<section style={{height:"100svh"}}>
  <video autoPlay muted loop playsInline poster="/hero/femme-wada-bg-photo.webp"
         style={{width:"100%",height:"100%",objectFit:"cover"}}>
    <source src="/hero/femme-wada-bg.mp4" type="video/mp4" />
  </video>
  {/* titre + 2 boutons en overlay, dans la safe area */}
</section>
```

## Vérifier que c'est VRAIMENT déployé (sinon on tourne en rond)
1. Commit + push (ou `vercel --prod`).
2. Sur Vercel → Deployments : le **dernier déploiement** doit être « Ready » et **postérieur** à la modif.
3. Tester en **navigation privée** (sans cache) : `/` = vidéo plein écran **sans footer**, et une autre
   page (ex. `/palettes`) = footer **présent**.
4. Pour les clients déjà installés (PWA) : le bump SW v8→v9 + `skipWaiting()`/`clients.claim()` +
   HTML en **network-first** assure qu'ils voient la nouvelle home au prochain lancement.

## Récap
- Le footer est GLOBAL → il faut le **rendre conditionnel** (option A ou B), pas juste bumper le SW.
- Accueil `/` = vidéo plein écran, sans footer ; toutes les autres pages gardent le footer.
- Confirmer le déploiement (Vercel Ready + test navigation privée) avant de conclure.
