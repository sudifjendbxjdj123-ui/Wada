# WADA — Plan demain : fix les 3 bugs + apps mobile

## Partie 1 — Les 3 bugs à fixer demain matin

Tu peux les fixer toi-même via **Claude Code**, **Cursor**, ou tout outil de coding IA. Copie-colle
chaque section ci-dessous dans ton IDE avec l'instruction.

---

### BUG 1 — Images produits qui ne s'affichent pas

**Symptôme** : les cartes produits affichent un carré vide avec un petit point d'interrogation au lieu de la photo MUJI.

**Prompt à donner à Claude Code** :

```
Dans le projet Next.js wada.style, ouvre les composants qui affichent les produits dans une tenue
(typiquement components/ProductCard.tsx ou similar). 

Le bug : les images ne s'affichent pas car on essaie de hotlinker directement depuis le site
marchand qui bloque ça.

Fais ce changement :

1. Vérifie que le composant Image utilise bien :
   <Image
     src={product.merchant_image_url || product.aw_image_url || product.large_image}
     alt={product.product_name}
     fill
     className="object-cover"
     unoptimized={true}  // important : désactive l'optimisation Vercel qui peut bloquer
   />

2. Dans next.config.js, ajoute ces domaines dans images.remotePatterns :
   {
     protocol: 'https',
     hostname: '**.productserve.com',  // Awin
   },
   {
     protocol: 'https',
     hostname: '**.thebusinessfashion.com',
   },
   {
     protocol: 'https',
     hostname: 'cdn.shopify.com',
   },
   {
     protocol: 'https',
     hostname: '**.muji.eu',
   },
   {
     protocol: 'https',
     hostname: '**.muji.com',
   }

3. Si après ça les images ne marchent toujours pas (Awin bloque parfois le hotlinking), il faut
   mettre en place le mirror vers Vercel Blob. Crée une route /api/img-proxy qui :
   - Reçoit l'URL distante
   - Télécharge l'image
   - L'upload sur Vercel Blob avec hash de l'URL comme nom
   - Retourne l'URL Blob
   Puis remplace les <Image> par cette URL.

Fais le changement 1 et 2 d'abord, teste. Si encore cassé, fais le 3.
```

---

### BUG 2 — Toutes les pièces en MUJI uniquement

**Symptôme** : le composer ne pioche jamais dans The Business Fashion (Brunello, Tom Ford, Amiri,
Birkenstock, Rick Owens, etc.) ni The Shirt Company. Seulement MUJI.

**Prompt à donner à Claude Code** :

```
Le composer de tenue (probablement dans lib/composer/compose.ts ou app/api/compose/route.ts) ne
pioche que dans la marque MUJI. Il faut qu'il pioche aussi dans The Business Fashion et The Shirt
Company.

Trouve la fonction qui filtre le pool de produits. Il y a probablement un filtre type :
  WHERE source = 'muji' 
ou 
  .filter(p => p.source === 'muji')

À supprimer ou remplacer par :
  WHERE source IN ('muji', 'tbf', 'shirtcompany', 'business_fashion', 'the_business_fashion')
ou
  const VALID_SOURCES = ['muji', 'tbf', 'shirtcompany', 'business_fashion', 'the_business_fashion'];
  .filter(p => VALID_SOURCES.includes(p.source?.toLowerCase()))

Vérifie aussi qu'il n'y a pas un filtre au niveau de l'import des produits qui exclut TBF et 
Shirt Company. Si oui, supprime-le.

Fais aussi un compte SQL/query :
  SELECT source, COUNT(*) FROM products GROUP BY source;

Pour confirmer que TBF et Shirt Company ont bien des produits en base. Si oui, le bug est juste 
dans le filtre composer. Si non, le bug est dans l'import — fais d'abord re-tourner l'import 
des deux flux.
```

---

### BUG 3 — Tenue femme proposée à un profil homme (et palette ignorée)

**Symptôme** : sur palette "Jardin de Kyoto" (anthracite/bordeaux/moutarde), le composer
affiche une chemise vert clair pour femme et un pantalon orange pour femme. Genre ignoré, palette
ignorée.

**Prompt à donner à Claude Code** :

```
Le composer doit appliquer 2 filtres durs sur le pool de produits AVANT de piocher les pièces :

1. Filtre genre :
   const userGenre = profile.genre; // 'femme' | 'homme' | 'mixte'
   pool = pool.filter(p => 
     p.genre === userGenre || 
     p.genre === 'unisex' || 
     p.genre === 'mixte'
   );

2. Filtre couleur palette :
   const paletteHexes = [palette.color1, palette.color2, palette.color3];
   pool = pool.filter(p => {
     if (!p.color_hex) return true;  // garder si couleur inconnue
     return paletteHexes.some(palHex => 
       deltaE(p.color_hex, palHex) < 60
     );
   });

Pour deltaE, fonction simple :
  function deltaE(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1,3), 16);
    const g1 = parseInt(hex1.slice(3,5), 16);
    const b1 = parseInt(hex1.slice(5,7), 16);
    const r2 = parseInt(hex2.slice(1,3), 16);
    const g2 = parseInt(hex2.slice(3,5), 16);
    const b2 = parseInt(hex2.slice(5,7), 16);
    return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
  }

Ajoute ces 2 filtres dans la fonction du composer, AVANT le pick des 5 slots.

Si après ces 2 filtres le pool est vide (palette niche, peu de produits), élargis le delta E 
de 60 à 100 et réessaie. Si vide encore, affiche un message au client "Pas encore assez de 
produits pour cette palette" plutôt que de proposer n'importe quoi.
```

---

## Partie 2 — Apps iOS et Android

Soyons honnêtes sur ce sujet. Tu as **3 options**, du plus rapide au plus coûteux.

### Option 1 — PWA (Progressive Web App) — RECOMMANDÉE pour démarrer

**Coût** : ~0€ et 1 journée de dev
**Délai** : demain soir tu peux installer WADA comme app sur ton iPhone

**Ce que c'est** :
Le site wada.style devient **installable** sur le bureau du téléphone. Quand l'utilisateur visite
wada.style sur Safari iPhone, une option *"Ajouter à l'écran d'accueil"* apparaît. Une fois ajoutée,
l'app WADA s'ouvre en plein écran (sans barre Safari), fonctionne en partie hors-ligne, peut
recevoir des notifications push. **L'UX est quasi-identique à une vraie app native**.

**Tu y gagnes** :
- Aucun frais Apple/Google (économise 99€/an + 25€)
- Pas besoin de re-coder l'app dans un autre langage
- Mises à jour instantanées (pas besoin de valider chaque update par Apple)
- Compatible iOS + Android avec le même code
- Lancement immédiat

**Tu y perds** :
- Pas dans l'App Store officiel (donc pas de découvrabilité organique)
- Pas d'Apple Pay natif (mais Stripe marche très bien dans le navigateur)
- Pas certaines fonctions natives avancées (mais tu n'en as pas besoin)

**Comment l'activer (à dire à ton codeur ou à Claude Code)** :

```
Convertis wada.style en PWA. Ajoute :

1. Un fichier manifest.json dans /public avec :
   {
     "name": "WADA",
     "short_name": "WADA",
     "description": "348 palettes de Sanzo Wada en tenues à acheter",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#f4eee4",
     "theme_color": "#6e3b32",
     "icons": [
       { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }

2. Un service worker simple via next-pwa :
   npm install next-pwa
   Et configurer dans next.config.js :
   const withPWA = require('next-pwa')({ dest: 'public' });
   module.exports = withPWA({ /* config Next.js */ });

3. Une bannière "Installer l'app" qui apparaît sur mobile au 2ème visite, simple JS qui détecte
   l'event 'beforeinstallprompt' et affiche un bouton.

4. Crée les icônes 192x192 et 512x512 depuis ton logo WADA (peux le faire en 5 min sur Figma 
   ou avec un tool comme realfavicongenerator.net).

Total : ~3-4 heures de dev. Teste sur ton iPhone avec Safari : visite wada.style, partage > 
"Ajouter à l'écran d'accueil". L'icône doit apparaître et l'app s'ouvrir plein écran.
```

### Option 2 — React Native — pour une vraie app dans l'App Store

**Coût** : 99€/an Apple + 25€ Google + 4-8 semaines de dev (toi ou un freelance ~5-10k€)
**Délai** : 2-3 mois avant publication

**Ce que c'est** : tu codes une fois en React Native (proche de React que tu utilises déjà), et tu
publies une vraie app native sur l'App Store et Google Play.

**Tu y gagnes** :
- Présence officielle dans les stores (découvrabilité, crédibilité)
- Apple Pay / Google Pay natifs
- Notifications push natives plus puissantes
- Reconnaissance "vraie marque" pour le grand public

**Tu y perds** :
- Cher en dev
- Chaque mise à jour doit être validée par Apple (1-7 jours)
- 30% de commission Apple sur tout achat in-app (donc à éviter, garde Stripe en web pour
  l'abonnement)

**Quand l'envisager** : quand WADA a 10 000+ utilisateurs actifs/mois et un revenu mensuel
qui justifie l'investissement.

### Option 3 — Native pure (Swift + Kotlin)

**Coût** : 99€/an Apple + 25€ Google + 3-6 mois de dev (15-30k€ en freelance)
**Délai** : 4-6 mois

À éviter pour l'instant. Trop cher pour le stade. Réservé pour quand WADA serait une "real
business" avec équipe dédiée.

---

## Mon vrai conseil

**Demain** :
1. Fixes les 3 bugs avec Claude Code via les 3 prompts ci-dessus (compte 2-4h)
2. Active le PWA pour avoir WADA "comme une app" sur iPhone (compte 3-4h)

**Total demain : 1 journée intense**, et tu auras une vraie expérience app + 3 bugs critiques
résolus.

**Dans 3-6 mois** :
Si WADA décolle (10k utilisateurs/mois), tu lances la version React Native qui ira dans les
stores. Mais pas avant — le PWA suffit largement pour valider que des gens veulent vraiment
utiliser WADA au quotidien.

---

## Pour les icônes app

Tu peux les générer en 5 minutes :

1. Va sur **realfavicongenerator.net**
2. Upload ton logo WADA (carré, fond crème, 和田 ou W en bordeaux)
3. Il te génère un pack complet (favicon, icons 192/512, manifest, etc.)
4. Télécharge et place dans `/public` du projet

Si tu n'as pas de logo carré prêt, demande à un designer freelance sur **Fiverr** un pack icônes
app pour ~30€, livré en 24h. Cherche "app icon design".

---

Bonne nuit. Demain tu fixes 3 bugs + tu installes WADA sur ton iPhone comme une vraie app. Pas
besoin du codeur claude pour ça — Claude Code (l'outil) fait tout via les prompts ci-dessus.
