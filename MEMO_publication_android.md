# WADA — Publication sur Google Play (Android)

> Playbook complet pour mettre l'app WADA sur Google Play Store.
> iOS reporté (pas de Mac dispo, budget non engagé sur Apple Dev $99/an).
> Estimation : **1-2 jours de travail** + **24-72h de review Google**.

---

## 🎯 Ce qu'on publie

Une **app Android wrapper Capacitor** autour de `https://www.wada.style`. Le webview natif charge le site live, donc :
- ✅ Contenu toujours à jour sans repasser par Google Play
- ✅ Toutes les routes API (Stripe, Resend, etc.) fonctionnent
- ✅ Plugins natifs : Caméra (Scanner), Partage, Haptique, Browser
- ⚠️ Apparence « web wrappée » — Google peut être strict sur les apps qui n'ajoutent rien au web. La caméra Scanner est notre argument valeur native.

---

## ✅ Déjà fait côté code

- Capacitor 6 installé + 8 plugins (camera, browser, share, haptics, splash, status bar, app, core)
- `capacitor.config.ts` : appId `style.wada.app`, app name « WADA »
- Mode remote URL : `server.url = https://www.wada.style`
- Dossier `android/` scaffolded (généré via `npx cap add android`)
- **Permissions Android ajoutées** (26/05) : INTERNET + ACCESS_NETWORK_STATE + CAMERA + `<uses-feature camera required=false>`
- Splash screen configuré : couleur paper #F4EFE6, durée 1500ms
- Status bar : style DARK (texte foncé sur fond clair)
- PWA manifest + icons existent dans `public/`

---

## ⏸️ À FAIRE côté toi (chronologique)

### Étape 1 — Compte Google Play Console ($25, 30 min)

1. Va sur **https://play.google.com/console/signup**
2. Connexion avec **ton compte Google personnel** (pas hello@wada.style sauf si tu y as connecté Google Workspace, ce qui n'est pas le cas)
3. Choisis **« Compte développeur »** (pas Organisation, sauf si tu as une vraie société immatriculée)
4. Paie **$25 one-shot** (carte bancaire)
5. Vérification identité : passport ou ID national (24-48h pour validation)
6. Renseigne :
   - **Nom du développeur** : `WADA` (visible publiquement sur la fiche)
   - **Email de contact** : `hello@wada.style`
   - **Site web** : `https://www.wada.style`
   - **Adresse** : 66 Rue des Vollandes, 1207 Genève, Suisse

→ Une fois validé, tu peux créer la première app.

### Étape 2 — Installer Android Studio sur ton Acer (gratuit, 1h)

Pour générer le build signé qu'on uploadera, il faut Android Studio :

1. Download : https://developer.android.com/studio
2. Install (~3.5 GB, accepte les composants par défaut)
3. Au premier lancement, télécharge le SDK Android (auto)
4. Pas besoin de comprendre Java/Kotlin — on utilisera juste Build → Generate Signed Bundle

### Étape 3 — Préparer les assets graphiques (1-2h)

**Required par Google Play** :

| Asset | Dimensions | Format | Source |
|---|---|---|---|
| **Icône app** | 512×512 | PNG transparent | `public/wada-favicon-512.png` ✓ (existe) |
| **Icône hi-res Play Store** | 1024×1024 | PNG transparent | À générer (upscale du 512 OU export Figma) |
| **Feature graphic** | 1024×500 | PNG/JPG | À créer (bandeau marketing en haut de la fiche Play Store) |
| **Screenshots téléphone** | 9:16 vertical, min 320px largeur | PNG/JPG | À capturer depuis l'app sur ton téléphone (min 2, max 8) |
| **Screenshots tablette** | 16:9 ou 9:16, min 1024px | PNG/JPG | Optionnel mais recommandé |

**Suggestions WADA pour les screenshots** :
1. Hero accueil (mannequin + titre)
2. Page palette (3 couleurs + tenue)
3. Scanner ouvert (couleur détectée)
4. Page Tenue avec produits MUJI
5. Stylist avec un message
6. Footer / Cultures (densité éditoriale)

→ Pour les capturer : ouvre l'app PWA WADA sur ton iPhone, va sur chaque page, screenshot, transfère sur ton Acer.

### Étape 4 — Générer le Keystore (5 min, à FAIRE UNE FOIS et garder précieusement)

Le keystore signe le `.aab` upload. **Si tu le perds, tu ne peux plus mettre à jour ton app sur Google Play**. Backup obligatoire.

Dans un terminal sur ton Acer :

```powershell
cd C:\Users\neman\wada\android\app
keytool -genkey -v -keystore wada-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wada
```

(Le binaire `keytool` est installé avec Android Studio, dans `C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe`. Adapte le path si keytool n'est pas dans le PATH.)

Réponds aux questions :
- Mot de passe keystore : **choisis un truc fort et NOTE-LE** (gestionnaire de mdp)
- Nom complet : `Nemanja Milosevic`
- Unité orga : `WADA`
- Organisation : `WADA`
- Ville : `Geneva`
- État/Province : `Geneva`
- Code pays (2 lettres) : `CH`

**⚠️ Backup le `wada-release-key.jks` IMMÉDIATEMENT** dans iCloud Drive / un cloud sécurisé. Sans lui, impossible de mettre à jour l'app. Note aussi le mot de passe dans 1Password / iCloud Keychain.

### Étape 5 — Build l'AAB signé (15 min)

1. Ouvre **Android Studio** → **File** → **Open** → sélectionne `C:\Users\neman\wada\android\`
2. Laisse Gradle sync (1-2 min au 1er lancement)
3. Menu **Build** → **Generate Signed Bundle / APK**
4. Sélectionne **« Android App Bundle »** (AAB) — c'est le format requis par Google Play
5. **Key store path** : navigue vers `C:\Users\neman\wada\android\app\wada-release-key.jks`
6. Entre le mot de passe + alias `wada`
7. Build Variant : **release**
8. Clique **Create**
9. Fichier final : `C:\Users\neman\wada\android\app\release\app-release.aab`

### Étape 6 — Créer la fiche Google Play (1h)

Sur **Google Play Console** → **Créer une application** :

| Champ | Valeur recommandée |
|---|---|
| **Nom de l'app** | `WADA — Couleurs & Style` |
| **Langue par défaut** | Français (France) |
| **Type** | App |
| **Gratuit ou payant** | Gratuit |
| **Catégorie** | Lifestyle (ou Shopping en secondaire) |
| **Étiquettes** | mode, couleur, palette, stylisme, MUJI, Sanzo Wada |

**Description courte (80 chars)** :
```
348 palettes Sanzo Wada (1933) traduites en tenues à porter.
```

**Description longue (4000 chars max)** : *(voir fichier `MEMO_publication_android_description.md` à créer si besoin, OU adapter de la bio de wada.style)*

**Privacy policy URL** : `https://www.wada.style/confidentialite` ✓ (existe déjà)

**Contact** : `hello@wada.style`

**Audience** : 13+ ans (par défaut — pas de contenu adulte)

**Content rating** : passe le questionnaire (5 min, simple) → WADA = PEGI 3 / G normalement (pas de violence, pas de jeux d'argent, pas de contenu sensible).

### Étape 7 — Upload AAB + Submit (15 min)

1. Sur la fiche app → **Production** → **Créer une nouvelle version**
2. Upload `app-release.aab`
3. Notes de version (notes de mise à jour) : `Version initiale de WADA — Couleurs & Style.`
4. Upload screenshots + feature graphic + icon 1024
5. Vérifie la checklist Google Play (tous les ⓘ rouge en haut)
6. **« Soumettre pour examen »**

→ Review Google : **24h - 7 jours** (souvent 24-48h pour une première soumission claire).

---

## 🚨 Risques à anticiper

### Rejet possible « WebView wrapper »

Google peut rejeter une app qui n'est qu'un webview pointant sur un site. Notre défense :
1. **Caméra native** : le Scanner WADA utilise `@capacitor/camera` (vraie caméra device, pas web)
2. **Partage natif** : `@capacitor/share` (system share sheet)
3. **Haptique** : `@capacitor/haptics` (vibration au scan)
4. **Splash screen** : visuel WADA propre, pas le splash blanc par défaut

Dans la fiche Play, **insiste sur ces points** dans la description longue :
> « Scanner caméra natif — détecte la couleur d'un vêtement réel »
> « Partage natif vers Instagram, Pinterest, WhatsApp »
> « Mode hors-ligne (palettes consultables sans réseau) » *(à condition d'ajouter un fallback service worker pour les palettes)*

### Privacy & permissions

- Tu déclares `CAMERA` dans le manifest → Google demandera une justification courte (« Scanner couleur d'un vêtement »).
- Politique de confidentialité **obligatoire** → `/confidentialite` existe ✓.
- Data Safety form : remplir que tu collectes email (newsletter) + utilises Stripe (paiement). Tu ne vends pas de données → coche les bonnes cases.

---

## 🔄 Mises à jour futures

Avec Capacitor en mode remote URL, **99% des changements WADA ne nécessitent PAS de mise à jour Play Store** : tu pushes sur Vercel, l'app charge la nouvelle version au prochain lancement.

Tu n'as besoin de re-publier l'app QUE si :
- Tu modifies `capacitor.config.ts` (appId, plugins, splash)
- Tu ajoutes/retires une permission dans le manifest
- Tu upgrades Capacitor à une version majeure
- Tu modifies l'icône ou le splash visuels

Pour une mise à jour :
1. Bump `versionCode` (entier) + `versionName` (string) dans `android/app/build.gradle`
2. Rebuild AAB signé (mêmes étapes que ci-dessus)
3. Upload sur Play Console → nouvelle version
4. Review 1-3 jours

---

## 📂 Fichiers de référence

| Fichier | Rôle |
|---|---|
| `capacitor.config.ts` | Config app (appId, name, remote URL, plugins) |
| `android/app/src/main/AndroidManifest.xml` | Permissions + features |
| `android/app/wada-release-key.jks` | Keystore signature (À BACKUPER) |
| `android/app/release/app-release.aab` | Build final à uploader |
| `public/wada-favicon-512.png` | Icône source |
| `CAPACITOR.md` | Workflow dev Capacitor général |

---

## TL;DR pour démarrer aujourd'hui

1. **Inscris-toi sur Google Play Console** ($25) — https://play.google.com/console/signup
2. **Installe Android Studio** sur ton Acer (download + install ≈ 1h)
3. **Reviens me dire** « Google Play créé + Android Studio installé »
4. Je te guide pour les étapes 3-7 (assets, keystore, build, upload)

Pas la peine de tout faire d'un coup. C'est OK de prendre 2-3 jours pour caler les étapes 1-2 d'abord.
