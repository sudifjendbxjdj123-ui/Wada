import type { Metadata, Viewport } from "next";
import "./globals.css";
/* Brief 2026-05-31 (user feedback screenshot scanner) :
   Nav + Footer + MobileTabBar globaux gênent l'expérience full-screen
   caméra sur /scanner et /composer. Wrappers conditionnels qui rendent
   null sur ces routes — vrai mode app native style Snapchat/Google Lens. */
import ConditionalNav from "@/components/ConditionalNav";
/* Brief client 2026-05-26 : footer retiré de la home (et UNIQUEMENT
   de la home). ConditionalFooter lit usePathname() et rend null sur
   "/" pour libérer toute la hauteur pour la vidéo mannequin plein
   écran. Les autres pages gardent le Footer normal. */
import ConditionalFooter from "@/components/ConditionalFooter";
import ConditionalTabBar from "@/components/ConditionalTabBar";
import PageHueAccent from "@/components/PageHueAccent";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPrompt from "@/components/InstallPrompt";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Toast from "@/components/Toast";
/* Brief 2026-05-29 « Onboarding + profil + switcher » : overlay 3
   questions au premier accès. Le composant ne rend rien si le profil
   existe déjà — donc safe à monter globalement, le user existant ne
   voit JAMAIS l'overlay. */
import OnboardingOverlay from "@/components/OnboardingOverlay";
/* Brief P2 (24/05) — Vercel Web Analytics : zéro cookie, conforme à la
   promesse « pas de tracking publicitaire ». Coexiste avec GoogleAnalytics
   (qui peut être désactivé plus tard si on veut un setup pur sans-cookie). */
import { Analytics } from "@vercel/analytics/next";
// Brief 2026-05-27 « plus de fonds empilés » : RouteBackgroundVideo retiré
// du rendu global. C'est cette couche fixe inset:0 qui apparaissait à la
// fois en haut ET derrière le footer (= les 2 « fonds empilés »). Chaque
// page garde son propre hero IMAGE confiné dans une section overflow:hidden
// (home, atelier, stylist). Partout ailleurs : beige solide.

// Script anti-flash : lit localStorage["wada-theme"] et pose data-theme
// sur <html> AVANT le paint. Évite le flicker jour→nuit au reload.
// Inline raw string → injecté via dangerouslySetInnerHTML (next.js refuse
// les <script> dans <head> avec children).
// Brief audit mobile (24/05) §6 : si l'utilisateur n'a jamais choisi
// explicitement un thème, on suit la préférence système via
// prefers-color-scheme. Cohérence iOS/Android où le mode sombre est
// souvent celui du téléphone, pas un réglage de l'app.
const THEME_INIT_SCRIPT = `
(function(){try{
  var t = localStorage.getItem('wada-theme');
  if (t !== 'nuit' && t !== 'jour') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'nuit' : 'jour';
  }
  document.documentElement.setAttribute('data-theme', t);
}catch(e){
  document.documentElement.setAttribute('data-theme','jour');
}})();
`;

/* Fix 2026-05-28 — bug « Can't translate this page » sur translate.goog :
   le proxy Google Translate ne sait pas traduire les payloads RSC de Next
   16 (les navigations client-side renvoient un flux React Server
   Components binaire, pas du HTML). Résultat : clic sur n'importe quel
   lien dans la version traduite → page vide « Can't translate this page ».
   Fix : si on détecte qu'on est sur un host *.translate.goog, on
   intercepte tous les clics sur liens internes au capture phase et on
   force window.location.assign() — full reload. Google ré-intercepte
   alors la page HTML normalement et la traduction se met à jour.
   Inline dans <head> pour être actif AVANT que le client router
   hydrate les Link. */
const TRANSLATE_PROXY_FIX = `
(function(){try{
  if (!/\\.translate\\.goog$/.test(location.hostname)) return;
  document.addEventListener('click', function(e){
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    // Ne traite que les liens internes (/, /palettes, etc.)
    if (href[0] !== '/' || href.indexOf('//') === 0) return;
    e.preventDefault();
    // Garde le host translate.goog en utilisant location.assign
    // sur le path uniquement — Google re-traduira la nouvelle page.
    location.assign(href);
  }, true);
}catch(e){}})();
`;

/* Direction artistique typographique WADA — brief charte 2026-05-26 :
 *   Fredoka         — TITRES + LOGO (chubby ronde, voix de marque)
 *   Inter           — TEXTE COURANT (paragraphes, labels, prix, navigation)
 *   Noto Serif JP   — caractères 和田 dans le wordmark (kanji uniquement)
 *
 * Serif (Fraunces / EB Garamond) RETIRÉ COMPLÈTEMENT — décision client
 * « le plus cohérent ». L'@import dans globals.css ne charge plus que les
 * 3 familles ci-dessus.
 */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Brief 2026-05-27 favicon WADA : theme-color aligné sur le beige du
  // manifest (#F4EFE7), évite tout flash de mauvais ton dans Chrome mobile.
  themeColor: "#F4EFE7",
  // Brief audit 2026-05-28 M1 — CRITIQUE :
  // Sans viewportFit:"cover", les env(safe-area-inset-*) restent à 0 sur
  // iPhone à encoche / Dynamic Island. Tout le travail safe-area dans
  // globals.css ne servait à RIEN. Activé maintenant — le Nav, le footer
  // et les boutons fixed respectent désormais les marges de sécurité iOS.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wada.style"),
  title: {
    default: "WADA — Le dictionnaire des couleurs et de la mode",
    template: "%s · WADA",
  },
  description:
    "Trouvez la palette qui vous va vraiment. Scannez une couleur, recevez la tenue qui l'incarne, achetez chaque pièce en un clic. Inspiré du livre de Sanzo Wada (1933).",
  applicationName: "WADA",
  keywords: [
    "Sanzo Wada", "palette de couleurs", "dictionnaire couleur",
    "mode", "stylisme", "outfit", "tenue", "vintage",
    "jeunes marques", "color combinations",
  ],
  authors: [{ name: "WADA" }],
  creator: "WADA",
  publisher: "WADA",
  // Canonical par défaut = home. Chaque page enfant DOIT définir son
  // propre canonical via son layout.tsx (cf. lib/pageMetadata.ts) pour
  // éviter que ce "/" soit interprété comme "cette page est un doublon
  // de l'accueil". Les pages publiques principales ont leur layout.tsx.
  alternates: { canonical: "/" },
  // Brief 2026-05-27 favicon WADA : nouveau site.webmanifest dédié, qui
  // référence les PNG WADA dédiées (logo barres bordeaux/bleu/olive/noir).
  manifest: "/site.webmanifest",
  icons: {
    /* Brief 2026-05-27 « favicon WADA dans onglet + Google » :
       ordre des balises injectées par Next.js (= ordre que les briefs
       browsers attendent) :
         1. /favicon.ico  (multi-tailles 16/32/48) → IE, vieux Chrome, Google
         2. /wada-favicon-32.png    → Chrome/Firefox onglet HD
         3. /favicon.svg           → modernes (scalable, gardé en fallback)
         4. /wada-favicon-180.png  → Apple touch icon (home iOS)
         5. /wada-favicon-192/512.png → PWA manifest references */
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/wada-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/wada-favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/wada-favicon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [
      { url: "/wada-favicon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    title: "WADA",
    statusBarStyle: "default",
    capable: true,
  },
  openGraph: {
    title: "WADA — Le dictionnaire des couleurs et de la mode",
    description:
      "Scannez une couleur, recevez la tenue qui l'incarne, achetez en un clic. Inspiré de Sanzo Wada (1933).",
    // ⚠️ Pas de `url` au root layout (cf. canonical ci-dessus) — chaque page
    // définit son og:url via son layout.tsx + lib/pageMetadata.ts
    siteName: "WADA",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "https://www.wada.style/opengraph-image",
        width: 1200,
        height: 630,
        alt: "WADA — Le dictionnaire des couleurs et de la mode",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WADA — Le dictionnaire des couleurs et de la mode",
    description: "Scannez une couleur, recevez la tenue qui l'incarne, achetez en un clic.",
    images: ["https://www.wada.style/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <head>
        {/* ─── Anti-flash thème (brief 2026-05-26 §2) ───
            Pose data-theme="jour|nuit" sur <html> AVANT le paint, en lisant
            localStorage. Doit être en TOUT PREMIER dans <head> (avant le
            CSS) pour qu'aucune frame ne soit rendue avec le mauvais thème. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {/* Fix proxy Google Translate (bug « Can't translate this page »
            au changement de page). Doit être chargé AVANT l'hydratation
            du router Next.js pour intercepter les clics au capture phase
            avant que <Link> ne les attrape. */}
        <script dangerouslySetInnerHTML={{ __html: TRANSLATE_PROXY_FIX }} />

        {/* Brief charte typo 2026-05-26 — 3 polices et c'est tout :
              Fredoka (titres + logo) · Inter (texte) · Noto Serif JP (kanji)
            Fraunces, EB Garamond, DM Serif Text, Bagel Fat One et Abril
            Fatface ne sont plus chargées (serif retiré, brief client).
            Bagel Fat One gardé en fallback inline (au cas où Fredoka tarde)
            mais pas téléchargé. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;500;700&display=swap"
        />
        {/* Awin publisher domain verification — wada.style claim.
            Token fourni par Awin (2026-05-20). Le format exact du tag Awin
            n'étant pas documenté côté client, on couvre les variantes
            connues pour maximiser la détection par le crawler Awin.
            Brief Awin (25/05) — interface verificationOptions demande
            explicitement le nom `verification` (sans préfixe) → ajouté. */}
        <meta name="verification" content="cfbd7592e46a6b1f6395564209269fb4" />
        <meta name="awin" content="cfbd7592e46a6b1f6395564209269fb4" />
        <meta name="awin-verification" content="cfbd7592e46a6b1f6395564209269fb4" />
        <meta name="awin_verification" content="cfbd7592e46a6b1f6395564209269fb4" />

        {/* Brief Pinterest claim (25/05) — token de revendication du domaine
            wada.style fourni par Pinterest sur le formulaire Catalogues →
            Revendiquer un site Web. Permet à Pinterest de vérifier que tu
            es propriétaire du site, débloque les statistiques + active les
            Rich Pins automatiquement. */}
        <meta name="p:domain_verify" content="176b0052a47fb1af638568a35432ec3f" />
        <meta name="awin-publisher-validation" content="cfbd7592e46a6b1f6395564209269fb4" />

        {/* ─── JSON-LD Organization (brief SEO 2026-05-23) ───
            Permet à Google d'afficher des sitelinks + logo organisationnel
            dans les résultats de recherche, et alimente le Knowledge Graph. */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "WADA",
            "alternateName": "WADA.style",
            "url": "https://www.wada.style",
            "logo": "https://www.wada.style/wada-favicon-512.png",
            "description": "Le dictionnaire de couleurs Sanzo Wada (1933) traduit en tenues à porter et à acheter. 348 accords chromatiques, 64 marchands partenaires.",
            "founder": { "@type": "Person", "name": "Nemanja Milosevic" },
            "foundingDate": "2026",
            "foundingLocation": { "@type": "Place", "name": "Genève, Suisse" },
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "hello@wada.style",
              "contactType": "customer support",
              "availableLanguage": ["French", "English"],
            },
          })}}
        />

        {/* ─── JSON-LD WebSite (search box dans les SERP) ─── */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "WADA",
            "url": "https://www.wada.style",
            "potentialAction": {
              "@type": "SearchAction",
              "target": { "@type": "EntryPoint", "urlTemplate": "https://www.wada.style/stylist?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          })}}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <PageHueAccent />
        {/* Brief 2026-05-27 « plus de fonds empilés » :
            <RouteBackgroundVideo /> retiré — c'était lui qui posait une
            image en position:fixed inset:0 qui transparaissait derrière
            le contenu ET derrière le footer (les deux « fonds empilés »
            visibles dans le screenshot). Le body est désormais opaque
            (cf. globals.css : --wada-paper en jour / nuit). Les heroes
            de /, /atelier, /stylist restent confinés dans leur section
            avec overflow:hidden — l'image n'apparaît QUE là. */}
        {/* Refonte 2026-05-21 : <BackButton/> n'est plus rendu globalement
            ici (il était en position:fixed et chevauchait menu mobile,
            footer, toggles). Il est maintenant rendu en flux par <Nav/>
            sur chaque page. */}
        {/* Audit N4 (24/05) : Nav + Footer centralisés ici, plus copiés
            dans chaque page. Économise 32 imports + ~38 occurrences JSX
            et garantit qu'une refonte future ne soit pas oubliée sur une
            page. Nav reste sticky (body est l'ancêtre scrollant). */}
        <ConditionalNav />
        {children}
        <ConditionalFooter />
        {/* Audit mobile (24/05) §1 : barre d'onglets bottom-nav fixée,
            visible uniquement ≤880px via .wada-tabbar { display:none }.
            Accès permanent aux 4 outils principaux au pouce, le drawer
            hamburger du Nav reste pour le reste.
            Brief 2026-05-31 : retiré de /scanner et /composer (full-screen
            caméra), c'est notre propre UI qui occupe le bas. */}
        <ConditionalTabBar />
        {/* Brief finition (24/05) — Toast global. Écoute l'événement
            `wada-toast` sur window ; n'importe quel composant peut appeler
            `showToast("Ajouté à vos favoris ✓")` depuis `@/lib/toast`. */}
        <Toast />
        {/* Onboarding overlay : ne rend rien si profile déjà en localStorage. */}
        <OnboardingOverlay />
        <Analytics />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
