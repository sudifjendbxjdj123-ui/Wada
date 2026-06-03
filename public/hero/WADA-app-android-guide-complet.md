# WADA — Guide complet : app Android (PWA + Google Play)

Procédure pas-à-pas pour transformer wada.style en app Android installable, puis la publier
dans le Google Play Store.

**Durée totale estimée** : 1 semaine de calendaire, ~10-15h de travail réel
**Coût total** : 25 € (Google Play developer fee, une seule fois)

---

## Vue d'ensemble du plan

```
Phase 1 — Setup PWA (3-4h)              → site installable depuis Chrome
   ↓
Phase 2 — Préparation assets (2-3h)      → icônes + screenshots Play Store
   ↓
Phase 3 — TWA via Bubblewrap (2-3h)      → APK signé prêt à publier
   ↓
Phase 4 — Soumission Google Play (1-2h)  → fiche app + upload APK
   ↓
Phase 5 — Validation Google (1-7 jours)  → review automatique + humaine
   ↓
Phase 6 — Live sur Play Store
```

---

## Phase 1 — Setup PWA (Progressive Web App)

C'est l'étape qui transforme wada.style en app installable depuis Chrome Android.

### 1.1 — Installer next-pwa

Dans ton projet WADA, à la racine :

```bash
npm install next-pwa
```

### 1.2 — Configurer next.config.mjs

Remplacer ton `next.config.mjs` actuel par :

```javascript
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.productserve.com' },
      { protocol: 'https', hostname: '**.thebusinessfashion.com' },
      { protocol: 'https', hostname: '**.muji.eu' },
      { protocol: 'https', hostname: '**.muji.com' },
      { protocol: 'https', hostname: '**.suitable.fr' },
      { protocol: 'https', hostname: '**.kastner-oehler.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
};

export default withPWA(nextConfig);
```

### 1.3 — Placer le manifest.json

Le fichier `WADA-manifest.json` que je viens de créer doit être **renommé en
`manifest.json`** et placé dans **/public/** (à la racine, pas dans /hero/).

Donc :
- `C:\Users\neman\wada\public\manifest.json` ✅
- PAS dans `/public/hero/`

### 1.4 — Lier le manifest dans le layout

Dans ton `app/layout.tsx` (ou `pages/_app.tsx`), ajouter dans le `<head>` :

```tsx
export const metadata = {
  // ... ton metadata existant
  manifest: '/manifest.json',
  themeColor: '#6e3b32',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WADA',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#6e3b32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};
```

### 1.5 — Bannière d'installation (optionnel mais recommandé)

Crée `components/InstallPrompt.tsx` :

```tsx
'use client';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Afficher la bannière seulement à la 2ème visite
      const visits = parseInt(localStorage.getItem('wada_visits') || '0');
      if (visits >= 2) {
        setShowBanner(true);
      }
      localStorage.setItem('wada_visits', String(visits + 1));
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-[#4a3d2a] text-[#f4eee4] p-4 rounded-lg shadow-lg flex items-center justify-between z-50 md:max-w-md md:mx-auto">
      <div>
        <p className="font-serif text-lg">Installer WADA</p>
        <p className="text-sm opacity-80">Garder tes palettes à portée de doigt</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setShowBanner(false)}
          className="px-3 py-2 text-sm opacity-70"
        >
          Plus tard
        </button>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-[#f4eee4] text-[#4a3d2a] rounded font-medium text-sm"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
```

À ajouter dans ton layout principal.

### 1.6 — Test local

```bash
npm run build
npm start
```

Va sur ton site avec Chrome Desktop → DevTools → Application → Manifest. Tu dois voir
le manifest WADA correctement chargé. Erreurs courantes :
- Icônes manquantes → suivre Phase 2 ci-dessous
- start_url invalide → vérifier la valeur

---

## Phase 2 — Préparation des assets visuels

C'est la phase **la plus importante visuellement**. Une mauvaise icône = -50% d'installations.

### 2.1 — Icônes (à générer)

Il te faut **4 icônes PNG** dans `/public/icons/` :

| Fichier | Taille | Usage |
|---|---|---|
| icon-192.png | 192×192 | Home screen Android standard |
| icon-512.png | 512×512 | Splash screen + Play Store |
| icon-maskable-192.png | 192×192 | Adaptive icon Android (avec safe zone 80% au centre) |
| icon-maskable-512.png | 512×512 | Adaptive icon haute résolution |

**Outils pour les générer rapidement** :

**Option A — RealFaviconGenerator (recommandé, gratuit, 5 minutes)**
1. Va sur realfavicongenerator.net
2. Upload ton logo WADA (PNG 512×512 minimum, fond crème ou transparent)
3. Configure :
   - Background color : `#f4eee4`
   - Theme color : `#6e3b32`
   - Maskable safe zone : ✅ activée
4. Télécharge le pack → place les fichiers dans /public/

**Option B — PWA Builder (gratuit, par Microsoft)**
1. pwabuilder.com/imageGenerator
2. Upload ton logo
3. Génère automatiquement toutes les tailles
4. Télécharge

**Option C — Tu n'as pas de logo carré**
- Fiverr : cherche « app icon design » → ~25-50 € → livraison 24-48h
- Demande : logo WADA carré, fond crème (#f4eee4), caractères 和田 ou « W » en bordeaux
  (#6e3b32), style minimaliste japonais

### 2.2 — Screenshots Play Store

Google Play exige **au moins 2 screenshots**. Recommandé : 6-8 screenshots.

Format requis :
- Téléphone : 1080 × 1920 px (portrait)
- Tablette : 1200 × 1920 px (optionnel)

À capturer :
1. Page d'accueil avec grille palettes
2. Page palette (Rosée du matin par ex)
3. Page tenue avec flat lay
4. Page composer
5. Page styliste IA en conversation
6. Page abonnement WADA+

**Outil** : Chrome DevTools → mode mobile (iPhone 12 Pro 390×844 → exporter en 1080×1920
via screenshot fullpage Firefox), ou simplement capture sur ton iPhone et redimensionnement.

### 2.3 — Feature graphic

Image de présentation en haut de la fiche Play Store.
- **Taille** : 1024 × 500 px
- **Style** : visuel hero WADA avec slogan « 348 palettes. 348 tenues. »
- **À créer** : Figma ou Canva, fond crème + photo flat lay + texte serif

### 2.4 — Icon haute résolution Play Store

- **Taille** : 512 × 512 px PNG
- C'est la même que icon-512.png — réutilisable

---

## Phase 3 — TWA via Bubblewrap

TWA (**Trusted Web Activity**) = wrapper Android natif qui contient ton PWA. Google
fournit l'outil **Bubblewrap** pour le générer en CLI.

### 3.1 — Installer Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

Si erreur permissions sur Windows : `npm install -g @bubblewrap/cli --force` ou en
PowerShell admin.

### 3.2 — Initialiser le projet TWA

```bash
mkdir wada-android
cd wada-android
bubblewrap init --manifest=https://wada.style/manifest.json
```

Bubblewrap va te poser ~15 questions. Voici les bonnes réponses :

```
Application name: WADA
Application short name: WADA
Application launcher name: WADA
Display mode: standalone
Orientation: portrait
Theme color: #6e3b32
Background color: #f4eee4
Start url: /
Icon URL: https://wada.style/icons/icon-512.png
Maskable icon URL: https://wada.style/icons/icon-maskable-512.png

Package name: style.wada.app
   (convention inversée — DOIT être unique, commencer par ton domaine inversé)

App version (versionCode): 1
App version name: 1.0.0

Signing key creation: Yes (créer une nouvelle clé)
   ⚠️ IMPORTANT : sauvegarde cette clé dans Bitwarden ! Sans elle tu ne pourras
   plus publier de mises à jour de l'app !

Key store password: (génère un mot de passe fort, sauve dans Bitwarden)
Key alias: wada-key
Key password: (idem)
```

### 3.3 — Build du bundle

```bash
bubblewrap build
```

Bubblewrap :
1. Télécharge Android SDK + Java JDK si pas installés
2. Compile ton TWA
3. Produit 2 fichiers :
   - `app-release-signed.apk` (APK pour test direct sur ton téléphone)
   - `app-release-bundle.aab` (Android App Bundle, requis pour Play Store)

### 3.4 — Vérification Digital Asset Links

Pour que ton TWA fonctionne sans barre de navigateur (mode standalone vrai), Google
exige que tu prouves que tu possèdes wada.style.

Bubblewrap génère un fichier `assetlinks.json` automatiquement. Tu dois le placer à :

```
https://wada.style/.well-known/assetlinks.json
```

Concrètement : copie le fichier généré dans `/public/.well-known/assetlinks.json` de
ton projet Next.js.

Test : `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://wada.style&relation=delegate_permission/common.handle_all_urls`

Doit retourner ton app comme « linked ».

### 3.5 — Test sur ton téléphone

Avant de soumettre à Google, **teste l'APK sur ton vrai téléphone Android** :

1. Active le mode développeur sur ton Android (Paramètres → À propos → tap 7× sur
   « Numéro de build »)
2. Autorise les sources inconnues
3. Transfère `app-release-signed.apk` sur ton téléphone (USB, Drive, mail)
4. Installe-le → ouvre → vérifie que :
   - L'icône WADA apparaît bien
   - Le splash screen crème + bordeaux s'affiche
   - L'app s'ouvre **sans la barre Chrome** (sinon Digital Asset Links a échoué)
   - La navigation fonctionne
   - Tu peux te connecter (login/signup ok)

---

## Phase 4 — Soumission à Google Play

### 4.1 — Créer un compte Google Play Developer

1. Va sur **play.google.com/console/signup**
2. Paie les **25 €** (one-time, à vie)
3. Vérifie ton identité (carte d'identité, ~24h de review)
4. Configure ton profil developer :
   - Nom developer : « WADA » ou « Nemanja Milošević »
   - Email contact public : contact@wada.style ou support@
   - Site web : https://wada.style

### 4.2 — Créer une nouvelle app

Dans Play Console :
1. **Toutes les apps** → **Créer une app**
2. **Nom** : WADA
3. **Langue par défaut** : Français (France)
4. **Type** : App
5. **Gratuit/Payant** : Gratuit (le freemium se gère via WADA+ dans l'app, hors achat in-app)
6. Accepte les déclarations Google Play

### 4.3 — Remplir la fiche store

C'est la partie **longue** — Google demande beaucoup d'infos. Voici les éléments
indispensables pour WADA :

**Description courte** (80 caractères max) :
> Mode et couleurs. 348 palettes de Sanzō Wada en tenues à acheter.

**Description longue** (4000 caractères max) :

```
WADA est la première plateforme mode au monde qui traduit les 348 palettes
chromatiques de l'artiste japonais Sanzō Wada (1933) en tenues complètes
prêtes à acheter.

— Découvre 348 palettes uniques —
Chaque palette raconte une histoire : la Rosée du matin, la Pluie de Tokyo,
le Bal au Palais, l'Aube sur Berlin. Sanzō Wada, peintre et créateur de
costumes pour le Théâtre Kabuki, a documenté ces harmonies dans son livre
culte « Sanzo Wada's 348 colors ».

— Compose une tenue en un clic —
Notre IA stylistique transforme chaque palette en garde-robe cohérente
multi-marques. Cardigan sauge + jean mousse + mocassins cuir, et la magie opère.

— Sélection éditoriale premium —
WADA travaille avec des marques sélectionnées : AMI Paris, Brunello Cucinelli,
Tom Ford, MUJI, Birkenstock, Suitable, et plus de 50 maisons. Chaque tenue
est composée par un styliste IA entraîné par des stylistes humains.

— Flat lay shoppable —
Visualise ta tenue complète posée à plat avant achat. Survole chaque pièce
pour découvrir la marque, le prix, et acheter en un clic via nos partenaires.

— WADA+ Abonnement —
1,99 €/mois : compositions illimitées, garde-robe virtuelle, lettres
hebdomadaires de notre styliste, accès anticipé aux nouvelles palettes.

— Made in France —
Conçu et développé à Genève par une équipe passionnée de mode, de couleur
et d'IA. Site français — bientôt international.

348 palettes. 348 tenues. Une infinité d'histoires.
Bienvenue dans WADA.
```

**Catégorie** : Lifestyle (catégorie principale) + Shopping (secondaire)

**Tags** : mode, fashion, palette, couleur, IA, styliste, tenue, outfit, sanzo wada

**Coordonnées** :
- Email : contact@wada.style
- Site web : https://wada.style
- Politique de confidentialité : https://wada.style/confidentialite (**OBLIGATOIRE**)

**Évaluation du contenu** :
- Audience cible : 18+
- Pas de violence, pas de sexe, pas d'achats in-app (les achats vont vers les sites partenaires)
- Catégorie : Lifestyle

**Sécurité des données** :
Cochez les sections selon ce que tu collectes :
- Activité utilisateur ✅ (analytics)
- Adresse e-mail ✅ (compte)
- Mode de paiement ✅ (Stripe pour WADA+)
- Nom ✅ (compte)
- Pas de localisation précise, pas de contacts, pas de fichiers personnels

### 4.4 — Upload du bundle

1. **Production** → **Créer une nouvelle release**
2. Upload le fichier `app-release-bundle.aab` généré par Bubblewrap
3. Notes de version : « Première version de WADA. Découvre 348 palettes de Sanzō Wada
   traduites en tenues prêtes à acheter. »
4. **Examiner la version** → **Démarrer le déploiement en production**

### 4.5 — Examen Google

Délai de review : **1-7 jours** en moyenne.

Google vérifie :
- Conformité aux politiques (mode/shopping = OK)
- Sécurité de l'app (TWA bien configuré)
- Fonctionnalité (l'app se lance, ne crash pas)
- Cohérence fiche store / réalité de l'app

Si **refusé** : Google envoie un mail avec les raisons. Corrige et resoumets.

Causes de refus courantes pour TWA :
- Digital Asset Links non vérifiable
- Politique de confidentialité manquante ou inaccessible
- Description trompeuse
- Crashes au lancement

### 4.6 — Publication

Une fois approuvée, l'app passe **en revue interne** (visible dans Play Console) puis
**publiée sur Google Play**.

Délai de propagation après approbation : **2-3 heures** avant visibilité publique.

URL de ton app : **play.google.com/store/apps/details?id=style.wada.app**

---

## Phase 5 — Marketing post-lancement

### 5.1 — Lien sur ton site

Ajoute un bouton **« Télécharger sur Google Play »** sur ton site, en respectant les
guidelines Google :

```html
<a href="https://play.google.com/store/apps/details?id=style.wada.app">
  <img
    src="https://play.google.com/intl/en_us/badges/static/images/badges/fr_badge_web_generic.png"
    alt="Disponible sur Google Play"
    width="200"
  />
</a>
```

Image officielle : play.google.com/intl/en_us/badges/

### 5.2 — Annonce réseaux sociaux

Publie sur Instagram, TikTok, LinkedIn :
- Story Instagram : « WADA est sur Google Play ! 📱✨ Lien dans la bio »
- Post LinkedIn : annonce pro avec capture de l'app
- TikTok : vidéo 15s du déballage app

### 5.3 — Newsletter

Envoie une « Lettre du dimanche » spéciale : « WADA est enfin dans ta poche ».

---

## Récapitulatif des coûts

| Item | Coût | Fréquence |
|---|---|---|
| Google Play Developer fee | 25 € | Une fois à vie |
| Icônes (si Fiverr) | 25-50 € | Une fois |
| Bubblewrap + outils | 0 € | Gratuit |
| Hébergement (déjà payé) | 0 € | Vercel existant |
| **TOTAL** | **25-75 €** | Une fois |

---

## Récapitulatif du temps

| Phase | Temps réel |
|---|---|
| Phase 1 — Setup PWA (next-pwa, manifest) | 3-4h |
| Phase 2 — Préparation assets (icônes + screenshots) | 2-3h |
| Phase 3 — Bubblewrap (TWA) + test | 2-3h |
| Phase 4 — Soumission Play Store | 1-2h |
| Phase 5 — Marketing | 1-2h |
| **TOTAL travail** | **9-14h** |
| Attente review Google | 1-7 jours |

**Recommandation** : étale sur 1 semaine pour ne pas brûler tes neurones.

---

## Prompt prêt pour Claude Code

Si tu veux que Claude Code fasse les phases 1 et 2 :

```
Configure WADA en PWA installable :

1. Installe next-pwa :
   npm install next-pwa

2. Configure next.config.mjs avec withPWA wrapper (voir code dans
   WADA-app-android-guide-complet.md section 1.2)

3. Crée /public/manifest.json en utilisant le contenu de WADA-manifest.json
   (déjà fourni dans le dossier hero/)

4. Ajoute dans app/layout.tsx :
   - export const metadata avec manifest, themeColor, appleWebApp
   - export const viewport avec themeColor

5. Crée components/InstallPrompt.tsx avec la bannière d'installation
   (code fourni section 1.5 du guide)

6. Crée le dossier /public/icons/ et place-y :
   - icon-192.png (192×192)
   - icon-512.png (512×512)
   - icon-maskable-192.png (192×192, safe zone 80% centre)
   - icon-maskable-512.png (512×512)

   Si je n'ai pas encore les icônes, utilise un placeholder uni
   #6e3b32 avec le texte "W" centré en blanc, taille 60% du canvas.

7. Test : npm run build && npm start
   Va sur Chrome → DevTools → Application → Manifest. Doit afficher
   "WADA" sans erreur.

8. Test installation : depuis Chrome mobile (ou émulateur), va sur
   wada.style → Menu → "Ajouter à l'écran d'accueil". L'icône doit
   apparaître et l'app s'ouvrir plein écran sans barre Chrome.
```

---

## En cas de blocage

**Problème : l'app s'ouvre avec la barre Chrome (pas standalone)**
→ Digital Asset Links pas vérifié. Voir Phase 3.4.

**Problème : Bubblewrap fail à l'install**
→ Vérifier Node.js ≥ 18, JDK 17 installé, Android SDK accessible.

**Problème : Google refuse la fiche**
→ Lire le mail de refus précis. Causes courantes : politique de confidentialité
absente, screenshots manquants, description vide.

**Problème : icône moche sur l'écran d'accueil**
→ Refaire avec maskable safe zone à 80% du centre.

**Problème : PWA ne fonctionne pas en local**
→ next-pwa désactive le service worker en dev. Tester avec `npm run build && npm start`.

---

## Et après ?

Une fois WADA dans Google Play :

1. **Surveille les avis** : réponds aux 5 étoiles ET aux 1 étoiles dans les 24h
2. **Updates régulières** : 1 update toutes les 2-4 semaines maintient l'app visible
   dans Play Store
3. **Optimisation ASO** (App Store Optimization) : tests A/B sur les screenshots,
   variations de description, mots-clés
4. **Reviews stratégie** : demande à tes premiers utilisateurs WADA+ de laisser
   un avis (booste l'algorithme Play Store)

**Cible 90 jours après publication** :
- 500 installations
- 4,2+ étoiles moyenne
- Top 100 catégorie Lifestyle France

---

## Et pour iOS ?

Le pendant iOS d'un TWA n'existe pas officiellement chez Apple. Pour iOS, tu auras
besoin :

**Option A** — PWA installable depuis Safari (gratuit, immédiat) : les utilisateurs
ajoutent ton site à l'écran d'accueil via Safari → « Partager » → « Sur l'écran
d'accueil ». Pas dans App Store mais fonctionne comme une app.

**Option B** — Capacitor (Ionic) wrapping ton site Next.js en iOS native : ~1-2
semaines de dev + 99 €/an Apple Developer + soumission App Store.

**Option C** — React Native vraie native : 4-8 semaines de dev.

Recommandation : commence Android (1 semaine, 25 €). iOS dans 2-3 mois quand WADA
a validé sa traction.

---

Tu as toutes les cartes en main. Allez Nem — dans 1 semaine, WADA est dans la poche
de tes premiers utilisateurs Android.
