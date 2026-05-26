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
const CACHE_VERSION = "wada-v7-2026-05-26";
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
