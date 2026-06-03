import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuration Capacitor pour WADA.
 *
 * Mode "remote URL" : l'app native charge directement https://www.wada.style
 * dans un webview natif. Avantages :
 *   - Pas besoin d'export statique du Next.js
 *   - Contenu mis à jour côté serveur sans repasser par l'App Store
 *   - Les routes API (Stripe, OpenAI, Replicate) continuent de fonctionner
 *
 * Les plugins natifs (caméra, partage, haptique) restent dispos via l'objet
 * `window.Capacitor` injecté automatiquement dans le webview.
 *
 * webDir pointe sur `public/` : pas un build statique de l'app, juste un
 * dossier minimal qui contient l'icône + splash de fallback. Capacitor
 * exige un webDir même en mode remote.
 */
const config: CapacitorConfig = {
  appId: "style.wada.app",
  appName: "WADA",
  webDir: "public",
  server: {
    url: "https://www.wada.style",
    cleartext: false,
    // En dev local, décommenter pour pointer sur le serveur Next.js local :
    // url: "http://192.168.1.X:3000",
    // cleartext: true,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#F4EFE6", // couleur paper WADA pour éviter le flash blanc
  },
  android: {
    backgroundColor: "#F4EFE6",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#F4EFE6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK", // texte foncé sur fond clair (paper)
      backgroundColor: "#F4EFE6",
      overlaysWebView: false,
    },
  },
};

export default config;
