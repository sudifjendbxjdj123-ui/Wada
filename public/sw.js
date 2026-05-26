/**
 * WADA — Service Worker
 * ─────────────────────────────────────────────────────────────────────────
 * Stratégie : "stale-while-revalidate" pour les assets statiques
 * (fonts, images, CSS, JS), "network-first" pour les pages HTML.
 *
 * Permet :
 *   - Installation comme app native (Add to Home Screen)
 *   - Lecture des palettes hors-ligne (catalogue mis en cache)
 *   - Démarrage instantané sur retour
 *   - Pas de spinner pour les ressources déjà chargées
 *
 * Le SW est volontairement minimal — pas de Workbox, pas de précache
 * agressif. On préfère qu'il "apprenne" au fur et à mesure de la navigation.
 *
 * Versioning : à chaque modif du SW, incrémenter CACHE_VERSION. Les
 * anciens caches sont purgés au prochain "activate".
 * ─────────────────────────────────────────────────────────────────────── */

/* Brief Nav doublon (26/05) — bump version : sans ça, les clients qui ont
   installé la PWA ou cachent agressivement gardent le HTML d'AVANT la
   centralisation du Nav (task #62 du 24/05). Résultat visible : Nav rendu
   2 fois (l'ancien dans la page + le nouveau dans le layout). Bumper la
   version force le SW à purger tous les anciens caches au prochain
   activate (cf. handler ligne 39+). */
/* Bump 26/05 v3 : décongestion header mobile (Compte + ThemeToggle
   sortis du header, mis dans MobileTabBar + drawer). Force les clients
   à re-télécharger la nouvelle structure Nav. */
/* Bump 26/05 v4 : brief UX client — 6 fixes (kicker / CTA / total tenue /
   couleur label / 3 variantes différenciées / wording). Force re-fetch
   du JS chez les clients pour qu'ils voient les nouveaux libellés et
   composants au prochain lancement. */
/* Bump 26/05 v5 : brief UX client Partie 2 — typo serif sitewide (17
   fichiers refactorés), tarifs 2 plans avec toggle Mensuel/Annuel,
   contraste form Partenaires, libellés cultures. Force re-fetch JS. */
/* Bump 26/05 v6 : brief UX client verbatim « tu ma remis les palettes
   Pantones efface les pour de bon ». Refonte PaletteCardMatisse :
   suppression cellules organiques cut-out + mini-cartes crème
   superposées (aesthetic Pantone collé Matisse). Remplacé par bandes
   pleines éditoriales. + Fix /ma-tenue couleur label : pastille + nom
   viennent maintenant du VRAI produit MUJI (couleurHex/couleurNom),
   plus de désaccord entre label affiché et photo réelle. */
/* Bump 26/05 v7 : brief charte typographique — on GARDE la chubby
   (Fredoka) comme voix de marque, on RETIRE serif (Fraunces + EB
   Garamond) sitewide. Refactor de ~150 fontFamily inline + tokens
   centraux + globals.css + Logo + layout. Hero H1 fontSize 72→56
   (brief : « réduire les plus gros pour ne pas faire lourd »).
   Force re-fetch CSS+JS chez tous les clients pour qu'ils voient
   la nouvelle typo dès le prochain lancement. */
/* Bump 26/05 v8 : brief client « Unifier les cartes de palette sur
   tout le site avec le style « propre » de la grille /palettes ».
   PaletteCardMatisse SUPPRIMÉ (fichier deleted). Un seul composant
   <PaletteCard> partagé partout : /palettes, /scanner, /cultures,
   /favoris, /about, WadaVisual. ♡ favori intégré dans la card via
   useFavorites(), plus de bouton ✕ externe sur /favoris. */
/* Bump 26/05 v9 : brief client « la vidéo du mannequin en plein écran,
   qui tourne en boucle » + « Retirer le footer de la page d'accueil
   uniquement ». Home refactor : <video autoplay muted loop playsinline
   poster="…webp"> 100svh × 100vw, object-fit cover, safe-areas
   respectées, body::before/after masqués via classe wada-home-immersive.
   ConditionalFooter wrapper filtre le footer global sur "/". Autres
   pages inchangées. Force re-fetch HTML pour que les clients voient
   la nouvelle home + l'absence de footer en arrivant. */
/* Bump 26/05 v10 : brief client « l'assistant IA doit VRAIMENT
   comprendre ». /stylist saisie libre re-branchée sur le LLM
   gpt-4o-mini (route /api/stylist) au lieu du script hardcoded qui
   répondait « Notée. De quelle couleur est-elle ? » sur n'importe
   quelle demande. SYSTEM_PROMPT_V2 mis à jour : si l'utilisateur
   donne un thème (soirée pirate), une occasion (mariage juin), un
   mood — le LLM COMPOSE directement, ne demande plus la couleur en
   automatique. Force re-fetch JS pour que les clients aient le
   nouveau callLLM() côté frontend. */
/* Bump 26/05 v11 : brief client « UNE SEULE POLICE DE TITRE SUR TOUT
   LE SITE ». Règle CSS globale h1-h6 { font-family: Fredoka
   !important } posée dans globals.css → AUCUNE page ne peut imposer
   sa propre police de titre. Plus sweep ~46 lignes de titres legacy
   qui traînaient encore fontFamily inline (Inter sur les titres,
   fontStyle italic sur Fredoka qui produirait un faux-italique).
   Garantie : un client navigant entre 17 pages voit la même Fredoka
   chubby sur tous les titres. */
/* Bump 26/05 v12 : brief « Le Styliste IA version Claude WADA ».
   SYSTEM_PROMPT_V2 refait à neuf (ton conversationnel, règle d'or
   « réponds D'ABORD », nouveaux exemples : pirate / entretien créatif
   / pull noir / aide-moi / hors-sujet). Schéma de sortie enrichi :
   `pourquoi` (1 phrase couleur/matière) + `variation` (1 idée plus
   audacieuse, optionnelle) + `genre` par slot pour le matching
   produit. Frontend : indicateur « Le styliste réfléchit… » pendant
   l'appel LLM (effet streaming). Force re-fetch JS pour propager
   les nouveaux champs et l'UI. */
/* Bump 26/05 v13 : améliorations stylist conversationnel :
     1. Historique de chat envoyé au LLM (le styliste se souvient des
        tours précédents → ajustements cohérents type « sans la veste »,
        « plus chaud », « moins cher »)
     2. Chip cliquable « Essayer la variation » : si le LLM propose une
        idée audacieuse, un clic la lance comme nouveau prompt (pas
        besoin de retaper)
     3. Animation 3 dots qui pulsent en cascade pendant l'appel LLM
        (remplace l'italique statique, plus lively)
   Force re-fetch JS + CSS pour propager les 3 changements. */
/* Bump 26/05 v14 : itération qualité stylist :
     1. Vraies palettes Sanzo Wada passées au LLM (top 10 pré-calculées
        par findBestPalettesWithFallback) → fini les refs hallucinées
        type « No. 168 » inventées. Le LLM CHOISIT parmi les 348 vraies.
     2. nom_tenue : le LLM nomme la tenue (« L'Aventurier », « Le
        Banquier », « Le Dimanche ») → affiché en kicker au-dessus
        des cards outfit. Plus mémorable que « accord No. 094 ».
     3. Pastilles couleur visibles dans « Pourquoi ça marche » — 4-5
        ronds qui montrent l'accord Sanzo Wada utilisé. Théorie de
        la couleur + démonstration visuelle dans la même bulle.
   Force re-fetch JS pour propager les 3 changements. */
const CACHE_VERSION = "wada-v14-2026-05-26";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// Assets critiques précachés à l'install (icônes, manifest, page offline)
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // On ne cache que les GET (POST = mutations, on laisse passer)
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Ne pas intercepter les requêtes vers d'autres origines (Unsplash, Amazon, Awin)
  // sauf si on veut les cacher — pour l'instant on laisse passer
  if (url.origin !== self.location.origin) return;

  // Stratégie pages HTML : network-first (toujours essayer le réseau, fallback cache)
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Stratégie assets statiques : stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

/* Message handler — permet au site de demander un skip waiting (mise à jour
   immédiate sans refresh manuel). */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
