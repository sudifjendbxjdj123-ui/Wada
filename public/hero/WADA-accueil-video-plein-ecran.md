# WADA — Page d'accueil : vidéo mannequin plein écran, sans footer (pour le codeur)

Changement limité à la **page d'accueil (`/`)** — sur **ordinateur, mobile ET application installée
(PWA)**. **Aucune modification sur les autres pages.**

## Ce qu'il faut faire
1. **Retirer le footer** de la page d'accueil uniquement (le bloc noir : logo WADA / Explorer /
   Compte / Contact / ligne affiliation).
2. À la place, l'accueil = **la vidéo du mannequin en plein écran, qui tourne en boucle** :
   - `<video autoplay muted loop playsinline poster="…webp">` — `muted` + `playsinline` sont
     **obligatoires** pour l'autoplay sur iOS et Android.
   - **Plein écran** : hauteur `100svh`, `object-fit: cover` (la vidéo couvre tout l'écran).
   - **Poster** (image `.webp`) affiché immédiatement avant le chargement de la vidéo.
   - Respecter les **safe areas** (encoche en haut, barre en bas) pour le titre et les boutons posés
     par-dessus → rien ne doit être masqué/coupé.
3. **Mobile / app** : si la vidéo est trop lourde, servir une **version compressée** + le poster ;
   mais elle doit **tourner** (pas rester figée sur l'image).

## Ce qu'il NE faut PAS faire
- Ne pas toucher aux **autres pages** : elles **gardent le footer** tel quel (Palettes, Scanner,
  Tenue, Cultures, etc.), sur tous les formats.
- Ne pas remettre le footer sur l'accueil.

## Test
- [ ] Accueil ordinateur : vidéo plein écran en boucle, **pas de footer**.
- [ ] Accueil mobile (navigateur) : vidéo qui tourne (autoplay), titre/boutons lisibles, safe areas OK.
- [ ] Accueil dans l'app installée (PWA) : même rendu.
- [ ] Une autre page (ex. /palettes) : footer toujours présent, inchangé.
