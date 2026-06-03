# WADA — App native iOS / Android

Wrapper Capacitor 6 autour du Next.js déployé sur `https://www.wada.style`.
Le webview natif charge directement le site live → contenu toujours à jour
sans repasser par l'App Store, et toutes les routes API (Stripe, OpenAI,
Replicate) continuent de fonctionner.

## Première installation

```powershell
# 1. Installer les dépendances Capacitor (déjà dans package.json)
npm install

# 2. Ajouter les plateformes natives (à faire UNE fois)
npx cap add android
npx cap add ios    # Mac uniquement — ignore sur Windows
```

Ces commandes créent les dossiers `android/` et `ios/` à la racine du
projet (déjà exclus du typecheck TS). Le contenu est généré, ne pas
modifier à la main sauf raison précise — `npx cap sync` peut les écraser.

## Workflow de dev

```powershell
# Sync : copie la conf + plugins vers les projets natifs
npm run cap:sync

# Ouvrir Android Studio (Windows + Mac)
npm run cap:android

# Ouvrir Xcode (Mac uniquement)
npm run cap:ios

# Lancer directement sur device/emulator Android
npm run cap:run:android
```

En **mode remote URL**, l'app n'a pas besoin de `next build` pour démarrer
— elle pointe sur la prod (`https://www.wada.style`). Tu peux donc itérer
côté web (deploy Vercel) sans toucher au wrapper natif.

Pour tester un build local avant prod, éditer `capacitor.config.ts` :

```ts
server: {
  url: "http://192.168.1.X:3000", // remplacer X par ton IP locale
  cleartext: true,
},
```

Lancer `npm run dev` sur ton poste, puis `npm run cap:run:android` —
l'app charge le serveur Next.js local.

## API natives disponibles

Importer depuis `@/lib/native` :

```ts
import { isNative, takeNativePhoto, openExternal, hapticMedium, shareNative } from "@/lib/native";

// Caméra native (Scanner)
const dataUrl = await takeNativePhoto();
if (dataUrl) extractColor(dataUrl);

// Ouverture lien marchand (préserve les cookies Awin/Amazon)
await openExternal("https://www.sezane.com/...");

// Feedback tactile
await hapticMedium();

// Partage natif (palette, tenue)
await shareNative({ title: "Rosée du matin", url: "https://wada.style/palette/002" });
```

Tous les helpers fallback gracieusement sur l'équivalent web — ton code
marche partout sans branchement explicite.

## Build production

### Android (Windows + Mac)

```powershell
npm run cap:sync
npx cap open android
```

Dans Android Studio :
1. **Build → Generate Signed Bundle / APK**
2. Choisir **Android App Bundle (.aab)** pour Play Store
3. Créer / sélectionner ta keystore (à conserver précieusement)
4. Variante : `release`
5. Upload `.aab` sur **Google Play Console**

### iOS (Mac uniquement)

```bash
npm run cap:sync
npx cap open ios
```

Dans Xcode :
1. Sélectionner cible **Any iOS Device (arm64)**
2. **Product → Archive**
3. Window → Organizer → **Distribute App → App Store Connect**
4. Compte développeur Apple requis ($99/an)

## Publication App Store iOS — workflow complet

> Tu es sur Windows. iOS exige macOS + Xcode pour builder/signer.
> Trois voies possibles, classées du moins au plus cher :

### Voie 1 — GitHub Actions (gratuit pour repos publics, sinon ~$0,08/min)

Runner `macos-latest` sur GitHub Actions = Mac virtuel temporaire à
chaque push. C'est la voie recommandée si tu n'as pas de Mac.

Workflow type (`.github/workflows/ios-build.yml`) :

```yaml
name: iOS Build
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx cap sync ios
      - name: Import signing certificate
        env:
          IOS_P12: ${{ secrets.IOS_P12_BASE64 }}
          IOS_P12_PASS: ${{ secrets.IOS_P12_PASSWORD }}
        run: |
          echo "$IOS_P12" | base64 -d > cert.p12
          security create-keychain -p "" build.keychain
          security import cert.p12 -k build.keychain -P "$IOS_P12_PASS" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain
      - name: Build .ipa
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace -scheme App -configuration Release \
            -archivePath build/App.xcarchive archive
          xcodebuild -exportArchive -archivePath build/App.xcarchive \
            -exportOptionsPlist ExportOptions.plist -exportPath build/
      - name: Upload to App Store Connect
        env:
          APP_STORE_API_KEY: ${{ secrets.APP_STORE_API_KEY_BASE64 }}
        run: |
          xcrun altool --upload-app -f ios/App/build/App.ipa \
            --type ios --apiKey ABC123 --apiIssuer XYZ-UUID
```

Secrets nécessaires (GitHub → Settings → Secrets) :
- `IOS_P12_BASE64` — certificat distribution exporté du Keychain (base64)
- `IOS_P12_PASSWORD` — mot de passe du .p12
- `APP_STORE_API_KEY_BASE64` — clé API App Store Connect (Users & Access
  → Keys → générer une App Manager key)

### Voie 2 — Mac cloud à la demande (~10€/mois)

- **MacinCloud** (https://www.macincloud.com) — VNC vers vrai Mac mini,
  $1/h pay-as-you-go ou ~$30/mois
- **MacStadium** — pro, plus cher
- **AWS EC2 mac1.metal** — flexible mais $1/h + 24h min

Tu te connectes en VNC/RDP, ouvres Xcode, suis la voie native ci-dessus.

### Voie 3 — Acheter un Mac mini d'occasion (~400€ une fois)

Mac mini M1 2020 d'occasion fait largement le travail. Amorti dès la
2ème année si tu publies plusieurs apps.

## Étapes App Store Connect (peu importe la voie de build)

1. **Apple Developer Program** — https://developer.apple.com/programs/
   $99/an. Inscription : 24-48h de validation.

2. **App Store Connect** — https://appstoreconnect.apple.com/
   - "My Apps" → "+" → New App
   - **Bundle ID** : `style.wada.app` (doit correspondre exactement à
     `appId` dans `capacitor.config.ts`)
   - **Platform** : iOS
   - **Name** : WADA
   - **Primary Language** : Français
   - **SKU** : `wada-001` (interne, libre)

3. **Fiche app** — sous "App Information" :
   - Catégorie principale : Lifestyle (ou Shopping)
   - Catégorie secondaire : Reference (dictionnaire)
   - Privacy Policy URL : `https://www.wada.style/confidentialite`
   - Marketing URL : `https://www.wada.style`

4. **Screenshots requis** (App Store Connect → Version → Media) :
   - **6.7"** (iPhone 16 Pro Max) : 3 minimum, 1290×2796 px
   - **6.5"** (iPhone 14 Plus) : 3 minimum, 1242×2688 px (peut hériter
     du 6.7" si proportions OK)
   - **5.5"** (iPhone 8 Plus) : optionnel mais recommandé, 1242×2208 px
   - **iPad 13"** : si tu cibles iPad, 2064×2752 px

   Astuce : capture l'app depuis Xcode Simulator → File → Save Screen,
   ou utilise `xcrun simctl io booted screenshot`.

5. **Privacy questionnaire** — App Store Connect demande de déclarer :
   - **Identifiers** : non (pas d'IDFA collecté)
   - **Purchases** : oui (paiements Stripe — déclarer comme "Other
     financial info, linked, app functionality, not for tracking")
   - **Photos** : oui (scanner couleur — "User content, not linked,
     app functionality, not for tracking")
   - **Camera** : oui (même justification que Photos)
   - **Tracking** : non (aucun SDK tiers traque l'utilisateur)

6. **Build à attacher** — uploader le .ipa via `xcrun altool` ou
   Transporter app. Il apparaît dans la section Build après ~30min
   de traitement Apple.

7. **Submit for Review** — préciser :
   - Test account : créer un compte test sur wada.style avec un panier
     pré-rempli (les reviewers Apple le testeront)
   - Notes pour reviewer : « WADA est un dictionnaire de palettes de
     couleurs. Pour tester le Scanner, autoriser l'accès caméra puis
     pointer n'importe quel objet coloré. Le panier redirige vers des
     marchands tiers (Vinted, Sézane) — pas d'achat in-app à proprement
     parler, donc pas d'IAP à valider. »
   - **Durée moyenne de review** : 24-72h en 2026. Possible reject sur :
     - Manque de permission strings (cf. NSCameraUsageDescription plus haut)
     - Pas assez de "native feel" (Apple peut rejeter les apps qui sont
       de simples wrappers web — mitigé ici par l'usage de la caméra
       native, des haptiques et du share natif)
     - Liens d'affiliation non déclarés → préciser dans les notes que
       les liens sortants sont du marketing affilié honnête

## Bundle ID & App ID Apple

L'`appId` dans `capacitor.config.ts` doit matcher exactement le Bundle
ID enregistré chez Apple Developer (Certificates → Identifiers).

Format : reverse-DNS du domaine. `style.wada.app` est valide
(et conforme à la convention `tld.brand.product`).

Si tu prévois plusieurs apps WADA plus tard (par ex. WADA Pro), réserve
`style.wada` comme préfixe et utilise `style.wada.app.consumer`,
`style.wada.app.pro` etc.

## Limites Apple à connaître avant de cocher Submit

- **Mode WebView "thin wrapper" rejeté** : Apple §4.2 exige des
  fonctionnalités natives au-delà du simple webview. WADA est OK car
  on utilise Camera native, Haptics, Share, Browser SFSafari. Bien le
  mentionner dans les notes du reviewer.
- **Liens d'affiliation visibles** : §3.2.1 — autorisés s'ils ne
  contournent pas l'in-app purchase. Comme WADA ne vend rien _dans_
  l'app, les liens vers Vinted/Sézane sont OK.
- **Page d'inscription** : si tu as `/compte`, Apple va vérifier qu'il
  y a une option **Sign in with Apple** dès qu'il y a un autre social
  login (Google, Facebook). Si juste email/password, pas requis.

## Icônes & splash

Capacitor lit les assets dans :
- `android/app/src/main/res/mipmap-*` pour les icônes Android
- `ios/App/App/Assets.xcassets/AppIcon.appiconset` pour iOS

Outil recommandé pour générer les sets : `@capacitor/assets`.

```powershell
npm install --save-dev @capacitor/assets
# Place icon.png (1024x1024) et splash.png (2732x2732) dans assets/
npx capacitor-assets generate --iconBackgroundColor "#F4EFE6" --splashBackgroundColor "#F4EFE6"
```

La couleur `#F4EFE6` correspond au `paper` WADA — évite le flash blanc
au cold start.

## Permissions natives

Déclarations à ajouter manuellement (une fois) :

**iOS** — `ios/App/App/Info.plist` :
```xml
<key>NSCameraUsageDescription</key>
<string>Pour scanner les couleurs depuis votre appareil photo.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Pour analyser les couleurs des photos de votre bibliothèque.</string>
```

**Android** — `android/app/src/main/AndroidManifest.xml` :
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## Limites connues

- **iOS uniquement sur Mac.** Pas de cross-build Xcode depuis Windows.
  Solutions : louer un Mac cloud (MacinCloud, MacStadium) le temps du
  build, ou utiliser un CI macOS (GitHub Actions `macos-latest`).
- **Mode remote URL = besoin d'internet.** Pour offline-first, il
  faudrait basculer en `output: "export"` dans `next.config.ts` et
  shipper le site bundlé — perte des routes API serveur.
- **App Store review.** Apple exige souvent un compte de test pour
  examiner l'app. Documenter les flows Stripe / Stylist dans la fiche
  reviewer pour éviter un reject.

## Stack confirmée

- Capacitor `^6.2.0` (core + ios + android)
- Plugins : Camera, Browser, Haptics, Share, Splash, Status Bar, App
- Next.js `16.2.4` côté web (inchangé)
- Tous les helpers natifs sont **lazy-imported** dans `lib/native.ts` →
  le bundle web ne tire jamais le code Capacitor.
