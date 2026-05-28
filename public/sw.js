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
/* Bump 26/05 v15 : performances IA — Edge runtime + SSE streaming.
   1. /api/stylist passe en Edge runtime → cold start ~5x plus rapide
      (~50ms Edge vs ~250ms Node, mesure Vercel)
   2. SSE streaming (Server-Sent Events) : la réponse du LLM arrive
      mot par mot dès ~200ms (TTFT gpt-4o-mini), au lieu d'attendre
      la complétion 2-3s. Latence perçue 10x inférieure.
   3. Frontend extrait le champ `reponse` du JSON partiel en cours
      de streaming → la bulle dots est remplacée en temps réel par
      le texte qui pousse. Post-processing (outfit + pourquoi +
      variation) émis dans un évènement final "complete".
   Force re-fetch JS + CSS. */
/* Bump 26/05 v16 : optimisations IA continues.
   - prompt_cache_key explicite envoyé à OpenAI → meilleure
     localisation des appels du même user sur leur serveur de cache
   - temperature 0.5 → 0.4 → sortie LLM converge plus vite (~10% TTFT)
   - palettesBlock format compact ("094:Béton & Lin [...] tags" au
     lieu de "1. No. 094 « ... »") → ~100 tokens input en moins / appel
   - stream_options.include_usage → télémetrie tokens dans le stream
   - AbortController côté client : nouveau msg pendant streaming
     annule l'ancien → plus de race condition. */
/* Bump 26/05 v17 : améliorations LOGIQUE IA :
   1. Cohérence accord sur ajustements — collecte.accord envoyé au LLM,
      gardé sur « plus chaud / sans veste / moins cher ». Plus de saut
      de palette à chaque tour.
   2. Liste avoid persistante (localStorage wada-avoid) — couleurs/pièces
      refusées par l'user mémorisées entre sessions. Le LLM ne les
      propose jamais.
   3. Anti-répétition — recentPieces (10 dernières pièces) envoyé au LLM,
      qui varie sur les ajustements rapprochés. Plus de « chemise écru »
      3 fois de suite.
   Force re-fetch JS. */
/* Bump 26/05 v18 : logique IA — recherche de tenue améliorée.
   1. Dictionnaire de 12 thèmes (pirate/gatsby/western/halloween/garden
      party/festival/rococo/beach/ski/goth/noir/zen) qui pré-filtrent
      les palettes Sanzo Wada avec des hex thématiques. Le LLM reçoit
      des candidats vraiment adaptés au thème.
   2. Profil utilisateur enrichi : morphologie traduite en consignes
      silhouette ("poire → volume haut, ajusté bas"), budget mappé
      vers des marques typiques (MUJI/Uniqlo pour accessible).
   3. Mode "surprends-moi" : query contient "hasard"/"variété"/etc →
      shuffle du top 10 palettes. Pas la même tenue à chaque appel.
   4. avoid_colors fusionné depuis collecte ET local interpreter.
   Force re-fetch JS. */
/* Bump 26/05 v19 : refonte design /scanner — signature éditoriale Wada.
   - Hero : kicker "Scanner · I" avec hairlines (style chapitres de livre)
   - Drop zone : icône aperture SVG fine remplace l'emoji ◇
   - Panel 2-col : hairline vertical médian entre upload et info
   - "Bénéfices" : numérotation 01/02/03 chiffres serif au lieu de ✓
     (signature livre Sanzo Wada où chaque accord est numéroté)
   - Essentielles : grille 12 swatches avec NOM sous chaque pastille
     (Sumi, Marine, Brique, Olive, Sauge, Terre, Cuir, Lanterne, Doré,
     Taupe, Crème, Os) — réf. swatch book. Hover lift +ombre, focus ring.
   - Mobile : essentielles passent à 6 colonnes
   Force re-fetch JS + CSS. */
/* Bump 26/05 v20 : alignement /composer sur /scanner — design unifié
   « Un vêtement » et « Une couleur ». Brief client verbatim : « il
   n'est pas comme une couleur rends le pareil ».
   - Hero centré beige uni (au lieu du dark gradient olive)
   - Kicker hairlines « Scanner · II » + H1 Fredoka centré
   - ScanModeToggle partagé (au lieu du toggle custom inline)
   - Carte panel cohérente : background, border, radius, shadow alignés
   - Étapes 01/02/03/04 numérotées (NumberedStep helper) au lieu de
     « 1. Pour qui... » texte simple → signature livre Sanzo Wada
   - Aperture SVG au lieu de ◇ emoji
   - Drop zone hairline dashed beige comme /scanner
   Force re-fetch JS. */
/* Bump 26/05 v21 : épuration radicale /scanner + /composer.
   Brief client : « trop d'information, plus ludique plus instinctif ».
   - Hero : kicker chapitre I/II hairlines RETIRÉ
   - H1 court : « Quelle couleur ? » / « Quelle pièce ? »
   - Sous-titre 1 ligne italique : « Une photo, ou une teinte parmi
     les essentielles » / « Une photo, et WADA compose autour »
   - Toggle en TÊTE (entrée directe dans le mode)
   - Colonne marketing 01/02/03 RETIRÉE (Précision/Sans inscription/
     348 palettes) — c'était de la landing page, pas un outil
   - 12 essentielles fusionnées DANS le panel principal (grille 6 cols
     desktop, 4 cols mobile) → 1 seule carte, deux chemins visibles
     simultanément : photo OU tap teinte
   - /composer : NumberedStep 01/02/03/04 → MiniLabel uppercase
     discret. Le formulaire EST son propre label.
   - Drop zone /composer : pas de mention « JPG/PNG max 8 Mo »
   Force re-fetch JS + CSS. */
/* Bump 26/05 v22 : refonte UX /palette/[number] — action principale claire.
   Brief client : « voir la tenue est perdu au milieu de tout ».
   - Hero épuré : retire les 3 features pills (Matières naturelles /
     Couleurs exclusives / Fabriqué avec soin) qui étaient du marketing
   - Retire le bouton solo « Voir la tenue » noir dans la colonne droite
     (faisait DOUBLON avec les 3 cards « Choisissez votre look »)
   - ♡ + Pinterest réduits (42px au lieu de 48) — actions secondaires
   - Les 3 cards de look DEVIENNENT l'action principale :
     · kicker bordeaux fort « Voir cette palette en tenue »
     · H2 plus grand (clamp 28-36px)
     · Sous-titre italique « 3 façons de porter [palette] aujourd'hui »
     · Chaque card a maintenant un CTA pill bordeaux pleine largeur
       « Voir ce look → » au lieu d'un petit lien texte
     · Padding card 20/22, hover lift -4px + shadow renforcée
   - Retire les 4 pills marketing (Curation lente / Sans inscription /
     Affiliation transparente / 348 palettes) qui étaient de la landing
     page B2C
   - « Affiner à votre style » reste comme optionnel collapsible
   Force re-fetch JS + CSS. */
/* Bump 26/05 v23 : fix 3 bugs logique IA repérés en live :
   1. Le LLM ne demandait PAS la couleur quand l'user disait « j'ai
      des Nike » sans préciser → passait à « pour quelle occasion ? »
      en composant à l'aveugle. Nouveau bloc CAS ANCRE SANS COULEUR
      dans le system prompt : tour 1 = question couleur obligatoire
      avec options ["Blanches", "Noires", "Beige/Sable", "Une autre"].
   2. Le slot ACCENT proposait des parapluies et bobs MUJI sur des
      tenues de sortie → catastrophique. Nouvelle section DÉFINITION
      STRICTE DU SLOT ACCENT dans le prompt (whitelist foulard/ceinture
      /lunettes/casquette/sac/pochette) + nouveau filtre EXCLUDE_ACCENT
      dans /api/products qui bloque parapluie/gants ski/masque/porte-
      clé/trousse/etc.
   3. Les ajustements (« plus chaud », « moins cher ») renvoyaient une
      tenue 95% identique. Nouvelle règle VARIATION SUR AJUSTEMENT :
      changer AU MOINS 2 slots non-ancre, OU la matière dominante, OU
      la couleur signature.
   Force re-fetch JS. */
/* Bump 26/05 v24 : polish UX stylist :
   1. Écran d'accueil : 5 quick-start chips concrètes (Bureau lundi,
      J'ai un pull noir, Soirée samedi, Surprends-moi, J'ai déjà une
      pièce). Un clic = prompt direct au LLM. Plus de message vague.
   2. nom_tenue prominent : kicker LA TENUE + titre Fredoka 22px
      au lieu d'un mini-kicker 10px isolé. Vraie identité de la
      composition.
   3. Chip « Recommencer » dans les ajustements : reset complet sans
      recharger la page. Utile pour changer de scénario.
   Force re-fetch JS. */
/* Bump 26/05 v25 : accord-card cliquable dans le chat styliste.
   La bulle nom_tenue devient une vraie carte Sanzo Wada :
     · Kicker LA TENUE + nom Fredoka 22px
     · 4-5 bandes de couleur pleines (accord visible)
     · Footer : « Sanzo Wada · No. XXX » + nom + « Voir l'accord → »
   Clic sur la carte → /palette/[number]. Pont éditorial direct
   entre la tenue composée par l'IA et la page palette source.
   Force re-fetch JS. */
/* Bump 26/05 v26 : 2 bugs logique IA fixés sur screenshot live.
   1. GENDER CONSISTENCY : observé en live = T-shirt pour homme +
      Pantalon pour femme + Pull pour femme dans la MÊME tenue.
      Fix end-to-end :
      · lib/outfitComposer : OutfitSlot type ajoute genre?: string
      · /api/stylist : propage s.genre du LLM → composed_outfit.slots[].genre,
        fallback userPrefs.gender si LLM oublie
      · OutfitPiece type frontend ajoute genre?
      · handleComplete extrait dominantGenre (1er slot LLM avec genre OU
        state.genre OU localStorage wada-gender) et l'applique en fallback
      · OutfitBubble useMujiForSlot prend effectiveGenre = piece.genre
        || prop genre → filtre /api/products correctement
      · System prompt : nouvelle section GENRE CONSISTENT ACROSS TOUTE
        LA TENUE — si genre inconnu, DEMANDE-le avant de composer
   2. « UNE AUTRE » COULEUR : observé en live = user clique « Une autre »,
      LLM compose au pif avec couleur inventée. Fix : si réponse user =
      « Une autre », tour 2 = question follow-up « Précisez la couleur »
      avec options suggestions étendues. JAMAIS de composition à l'aveugle.
   Force re-fetch JS. */
/* Bump 26/05 v27 : fix /composer — mismatch couleur palette vs habit.
   Brief client (screenshot) : « erreur entre les couleurs palettes et
   les couleurs des habits ». Sur l'accord Terracotta/Moutarde/Olive :
   - Pantalon brun foncé étiqueté « Camel » (palette intent)
   - Manteau écru étiqueté « Moutarde »
   - Sneakers blanches étiquetées « Camel »
   - Sac noir étiqueté « Moutarde »
   Bug : useComposerMuji prenait nom/prix/image/url du produit MUJI
   mais PAS couleurNom/hex. Du coup la card affichait slot.colorName
   (palette intent) au lieu de la couleur RÉELLE du produit.
   Fix : useComposerMuji renvoie maintenant couleurNom + couleurHex
   du produit Awin. ComposerSlotCard affiche en priorité ces valeurs
   avec une pastille couleur cohérente, fallback slot.colorName seulement
   si pas de produit MUJI matché. Même fix que /ma-tenue (commit
   précédent) maintenant appliqué sur /composer.
   Force re-fetch JS. */
/* Bump 26/05 v28 : save outfit + view sur /favoris.
   Brief client « ameliore tout le reste possible » (gap UX majeur :
   composer une tenue dans /stylist et la perdre était frustrant).
   - Nouveau hook useSavedOutfits (localStorage wada-saved-outfits,
     20 max FIFO, sync inter-onglets via storage event)
   - /stylist : chip primary « Garder cette tenue » dans les
     ajustements après outfit + toast confirmation
   - /favoris refondue : section « Palettes » + section « Mes tenues »
     côte à côte. Cards SavedOutfitCard avec :
     · mini-bandes de l'accord (cliquables vers /palette/[ref])
     · kicker LA TENUE + nom Fredoka
     · ref Sanzo Wada + nom accord
     · liste 5 pièces avec pastille couleur + role + type
     · bouton ✕ retirer
     · relative time « il y a 2h » / « hier » / date
   Force re-fetch JS + HTML. */
/* Bump 26/05 v29 : fix matching description LLM ↔ produit Awin.
   Brief client suite à note 75/100 : « description LLM dit Chemise
   fluide beige mais produit Awin renvoyé est un Pull col rond ».
   Cause : /api/products était appelé avec slot+color+style+genre mais
   PAS le type précis. Solution :
   1. Nouveau helper extractTypeKeyword(libellé, slot) côté serveur
      avec une whitelist de mots-clés par slot (polo, t-shirt, chemise,
      pull, hoodie pour haut ; pantalon, jean, chino pour bas ;
      blazer, manteau, veste, bomber, trench pour veste ; sneakers,
      derbies, mocassins, bottes pour chaussures ; foulard, ceinture,
      casquette, pochette, sac pour accent)
   2. OutfitSlot type ajoute typeKeyword?: string
   3. /api/stylist propage le keyword extrait dans composed_outfit.slots
   4. OutfitPiece + handleComplete absorbent le keyword
   5. useMujiForSlot accepte typeKeyword param, l'envoie comme q= à
      /api/products → filtre full-text AND sur les tokens restreint
      aux produits dont le nom contient ce mot
   6. Seed inclut le keyword pour que 2 types différents (Chemise →
      Pull sur ajustement) donnent vraiment 2 produits différents
   Force re-fetch JS. */
/* Bump 26/05 v30 : /palette/[number] plus intuitif et compact.
   Brief client (screenshot /palette/009 Osaka au thé) : « ameliore
   cette page rends la plus intuitif pour le client la mise en page
   tout ».
   1. Palette card compactée : padding 26→20, font 23→19, RefCode
     0.18em→0.2em. Hauteur totale -25%, les 3 looks remontent dans
     le viewport (visibles dès le 1er coup d'œil sur desktop large).
   2. Section header fusionnée : avant 3 lignes (kicker bordeaux
     « VOIR CETTE PALETTE EN TENUE » + H2 « Choisissez votre look »
     + sous-titre italique « 3 façons de porter... aujourd'hui »).
     Après : 1 seule H2 directe « Comment porter osaka au thé ? »
     avec le nom de palette en italique inline. Gain : ~80px de
     hauteur, message plus clair.
   3. Margin top section action : 72px → 48px. Cards plus proches
     du hero, scroll réduit.
   4. Nouveau CTA texte sous les 3 cards : « Ou dialoguez avec le
     styliste pour une tenue sur-mesure autour de cette palette. »
     → Link bordeaux underline /stylist?palette=XXX. Donne une
     porte de sortie pour ceux qui veulent du LLM custom au lieu
     des 3 looks fixes.
   5. Affiner section : margin 40px → 32px.
   Force re-fetch HTML. */
/* Bump v31 27/05 : brief client « savoir quel type de tenue le client
   veut ». Refonte intuitive des 3 cards de la page palette :
   1. Pastille OCCASION en haut de chaque card (« Au bureau » + icône
     mallette / « Au quotidien » + soleil / « En soirée » + lune) — le
     client comprend la situation cible en 1 coup d'œil.
   2. Titres descriptifs : « Tailoring classique » / « Casual chic » /
     « Tenue habillée » au lieu de « Ce look » / « Plus décontracté » /
     « Plus habillé » (abstraits).
   3. Chips PIÈCES (Blazer · Chemise · Pantalon · Derbies) en dessous
     de la desc — le client sait ce qu'il recevra avant de cliquer.
   4. Sous-titre H2 ajouté : « Choisissez l'occasion — WADA compose la
     tenue adaptée » : la question implicite devient explicite.
   5. Query param occasion aligné : bureau/quotidien/sorties pour que
     /ma-tenue compose correctement.
   Force re-fetch HTML. */
/* Bump v32 28/05 : brief client « le logo Pinterest n'est pas bien
   mets le vrai ». Bouton « P » texte bordeaux (placeholder) remplacé
   par le vrai logo officiel Pinterest (SVG cercle rouge #E60023 +
   glyphe blanc, path fidèle à brand.pinterest.com). Force re-fetch
   HTML pour que les clients voient le nouveau pictogramme. */
/* Bump v33 28/05 : brief client « le site offre-t-il la traduction
   pour les anglais ? » → ajout d'un bouton EN dans le Nav (desktop
   right side + drawer mobile). Pas d'i18n complet (348 palettes
   éditoriales = plusieurs semaines), à la place proxy officiel
   Google translate.goog : www-wada-style.translate.goog/<path>
   ?_x_tr_sl=fr&_x_tr_tl=en. Gratuit, fonctionne sur 100 % du site,
   barre Google native pour revenir en FR. Force re-fetch HTML pour
   que les clients voient le nouveau bouton dans le header. */
/* Bump v34 28/05 : fix « Can't translate this page » sur le proxy
   translate.goog. Le client-side router Next 16 envoie des payloads
   RSC binaires que Google Translate ne sait pas traduire → erreur
   au moindre clic sur un lien interne. Patch : script dans <head>
   qui détecte *.translate.goog et force window.location.assign sur
   tous les liens internes → full reload → Google ré-intercepte la
   page HTML. Force re-fetch HTML pour pousser le patch. */
const CACHE_VERSION = "wada-v34-2026-05-28";
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
