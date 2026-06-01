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
/* Bump v35 29/05 : refonte /about orientée client (brief 8 points).
   §1 hero raccourci en 1 ligne + sous-titre bénéfice. §2 « Chapitre 0X »
   abandonnés au profit de labels courts (L'IDÉE / CE QUE FAIT WADA /
   EN UN EXEMPLE / POUR TOUS LES BUDGETS / GRATUIT, SANS PIÈGE). §3
   pictos SVG (cintre/étoile/étiquette/panier) au lieu de I/II/III/IV.
   §4 3 palettes contrastées (002/094/071) au lieu d'1 seule. §5 CTA
   intermédiaire après la section « 4 choses » (pas que celui en bas
   de page). §6 bloc affiliation supprimé → 1 lien discret dans closing.
   §7 copy retravaillée : « Bienvenue dans le dictionnaire » au lieu
   de « Merci d'être là », « La tenue arrive » au lieu de « WADA aide
   à construire le reste ». Force re-fetch HTML. */
/* Bump v36 29/05 : brief client « appli efficace » §2 + §7 partiel.
   MobileTabBar refondue : 5 tabs au lieu de 4 (Accueil + Palettes +
   SCANNER central surélevé bordeaux 56×56 + Styliste + Favoris).
   Icônes SVG propres au lieu des glyphes ◎▦✦○. Le Compte sort de
   la tabbar (déjà dans drawer mobile).
   /favoris état vide soigné : icône cœur visuelle + UN seul CTA
   principal « Scanner ma première couleur » + lien secondaire
   discret vers palettes (plus 2 boutons de même poids).
   Force re-fetch HTML pour pousser la nouvelle structure tabbar. */
/* Bump v37 29/05 : brief « appli efficace » §3 — bande Reprends ta
   tenue sur home. Nouveau hook useLastPalette qui persiste la dernière
   palette visitée (localStorage `wada-last-palette`). /palette/[number]
   l'enregistre via useEffect. Home monte <ResumeBanner /> : pill
   flottante crème+blur en top, priorise tenue sauvée > palette visitée,
   dismissable session-only. Force re-fetch HTML pour pousser la home
   + tracking palette. */
/* Bump v38 29/05 : brief « appli efficace » §6 — repères « Ensuite : … »
   pour transformer le site en flux narratif. Nouveau composant
   NextStepHint posé sur /palette/[number] (« Choisissez un look pour
   voir la tenue à acheter ») et /ma-tenue (« Garder cette tenue · Voir
   mes favoris »). Plus jamais de cul-de-sac : chaque écran indique
   l'étape suivante. + §9 micro audit libellés : « Commencer le scanner »
   → « Scanner une couleur » sur /install pour cohérence avec home/tabbar.
   Force re-fetch HTML. */
/* Bump v39 29/05 : fix « la vidéo ne démarre pas parfois sur l'appli ».
   La home Capacitor/iOS rate parfois autoPlay (Low Power Mode, onglet
   en background au mount, BFcache retour, réseau lent). Ajout d'un
   useEffect avec play() programmatique au mount + retry sur events
   canplay, loadeddata, visibilitychange, pageshow (BFcache iOS). Si
   tous les retries ratent, le poster reste affiché (pas de page morte).
   Force re-fetch HTML pour pousser le fix aux clients PWA. */
/* Bump v40 29/05 : fix « chaussure blanche au lieu de noire » sur
   /ma-tenue. /api/products avait un tri ΔE mais aucun seuil max + la
   rotation seed POOL_SIZE=12 piochait parfois dans le fond du pool
   un produit catastrophiquement éloigné de la consigne. Ajout d'une
   garde double dans route.ts : plafond ΔE ≤ 60 + garde luminance
   (consigne sombre L<28 refuse L>62, consigne claire L>75 refuse
   L<35). Fallback gracieux si pool vide. Le bug ne touchait que les
   réponses API → pas besoin de purger le cache HTML, mais on bump
   pour invalider le SW cache des call /api/products. */
/* Bump v41 29/05 : renfort vidéo cold start PWA iOS. Le fix v39 ne
   suffisait pas pour le tout premier launch de l'app (iOS Safari
   standalone refuse parfois autoplay même avec muted+playsInline).
   Ajout de 3 garde-fous : (1) backoff retry 5 tentatives à 100ms /
   300ms / 800ms / 2s / 5s, (2) first-tap fallback — pointerdown ou
   touchstart sur document tente play() au 1er user gesture (iOS
   autorise toujours play après gesture), (3) check après 6s
   v.played.length === 0 → dernière tentative. Force re-fetch HTML
   pour pousser le patch aux PWA installées. */
/* Bump v42 29/05 : vidéo home abandonnée, image fixe à la place.
   La vidéo femme-wada-bg.mp4 (22 Mo) restait figée sur le poster
   en PWA iOS standalone même après 3 layers de fix (retry events +
   backoff + first-tap + check played). Le décodage 22 Mo dépasse le
   budget mémoire/CPU iOS Safari standalone cold start. Le poster
   .webp (152 Ko, 145× plus léger) devient le visuel principal — look
   immersif conservé, démarrage instantané, zéro bug. Force re-fetch
   HTML pour pousser le patch aux PWA installées. */
/* Bump v43 29/05 : vidéo home remise en progressive enhancement.
   Brief « remet la vidéo » : l'image .webp charge toujours en fond
   (z-index 0, 152 Ko instantané). La vidéo .mp4 monte par-dessus
   (z-index 1, opacity 0 → 1 sur event `playing`). Si la vidéo ne
   joue jamais (PWA iOS, Low Power Mode, etc.), l'image reste visible —
   zéro bug perçu côté client. Retries identiques v41 (backoff, canplay,
   visibilitychange, pageshow, first-tap). Force re-fetch HTML. */
/* Bump v44 29/05 : audit final « une seule police de titre partout ».
   Confirmation : tous les h1/h2/h3 du source utilisent Fredoka.
   Règle globale h1-h6 → Fredoka !important en place. OG image (seul
   « serif » restant) basculée sur sans-serif. Si certains clients
   voient encore du serif sur Mes favoris / Trouvez votre couleur /
   Quelle combinaison vous parle ? → c'était du cache SW pré-v43.
   Ce bump force re-fetch HTML pour qu'ils voient le code à jour. */
/* Bump v45 29/05 : brief « Onboarding + profil + switcher ».
   - hooks/useProfile : type Profile {genre,budget,style}, localStorage
     `wada.profile`, sync inter-onglets, défaut Femme · 150–400€ · Minimaliste
   - OnboardingOverlay : 3 questions plein écran au 1er accès, bouton
     « Passer » pose le défaut, transition douce à la sortie
   - ProfileBadge dans Nav : avatar bordeaux F/H + label + chevron,
     caché label ≤880px (mobile)
   - ProfileSwitcher modal : 3 segmented controls, modif live (state
     React + storage event sync), bouton Appliquer ferme
   - Logo TikTok ajouté au Footer (Instagram · TikTok · Pinterest)
   - Vidéo home : audit final, fontFamily OG → sans-serif
   Force re-fetch HTML pour pousser overlay/badge aux clients. */
/* Bump v46 29/05 : intégration code TBF (The Business Fashion) côté
   parser. Extension lib/awinFeed.ts SANS casser MUJI :
   - filter brand_name "(do not use)*" exclu
   - inferCategoryFromProductName : fallback slot par mots-clés du nom
     si category_name est vide (cas TBF)
   - GBP → EUR : conversion ×1.17 si currency=GBP, tag devise=EUR
   - genre=homme par défaut pour TBF (luxury menswear, Fashion:suitable_for vide)
   - dedup clé enrichie (marque, nom, couleur)
   Le cron est déjà multi-feeds via AWIN_DATAFEED_URLS. Pour activer TBF :
   ajouter {"slug":"the-business-fashion","url":"<URL TBF>"} dans la var
   d'env Vercel. Aucun changement front. */
/* Bump v47 29/05 : Phase 3 « Onboarding + profil + switcher » —
   intégration du profil dans les pages :
   - components/ProfileChip : badge « Composées pour vous · {profil} »,
     clic ouvre le switcher.
   - /palette/[number] : ProfileChip au-dessus des 3 cards. Chips pièces
     filtrées par genre via PIECES_BY_OCCASION (Femme : blazer fluide /
     mocassins / boucles ; Homme : blazer / derbies / pochette). Genre
     propagé en query param vers /ma-tenue.
   - /ma-tenue : lit wada.profile en priorité (genre, style, budget en
     seuil numérique), fallback sur les anciennes clés wada-gender/prefs.
   - /stylist : userPrefs() lit wada.profile en priorité avant les clés
     legacy, injecte automatiquement le profil dans la collecte LLM.
   Force re-fetch HTML pour pousser les changements client. */
/* Bump v48 30/05 : refonte Nav épurée (brief maquette HTML).
   - Logo passe à gauche avec les liens (au lieu de centré absolu).
   - Icône Compte + ThemeToggle + LangButton retirés du header
     desktop, regroupés dans un nouveau composant ProfileMenu (avatar
     38×38 + point vert + dropdown avec Compte / Favoris / Changer
     style / Thème / Langue).
   - Avatar tooltip au hover : « Femme · 150–400€ · Minimaliste ».
   - Bouton Abonnement passe en GHOST (contour bordeaux + transparent),
     moins agressif que le plein.
   - ResumeBanner repassé du pill centré en haut (mangeait l'image
     hero) au toast discret bas-droit, fond noir charbon + kanji 和
     dans vignette dégradée or. Visible mais non envahissant.
   Force re-fetch HTML pour pousser la nouvelle structure. */
/* Bump v49 30/05 : brief « logique de composition tenue cohérente »
   §1 (registre unique). Plus jamais de Brunello + Amiri + Stone Island
   dans la même tenue.
   - lib/brandRegistre.ts : table 130+ marques → 4 registres (classique
     / streetwear / minimaliste / decontracte). Mapping style profil
     utilisateur → registre catalogue. MUJI = decontracte, Brunello
     Cucinelli = classique, Amiri = streetwear, Jacquemus = minimaliste.
   - ProduitAwin étendu avec champ brandRegistre.
   - lib/awinFeed.ts tag chaque produit ingéré.
   - /api/products filtre par registre quand style fourni : un user
     « Classique » ne voit QUE du classique (Brunello/Tom Ford/Zegna…),
     pas du streetwear ou du minimaliste.
   Force re-fetch HTML. */
/* Bump v50 30/05 : finition VAGUE 2 — saison + budget + score
   cohérence (brief tenue cohérente §3 + §7 + score).
   - lib/seasonDetect : détecte saison produit depuis nom/desc (cashmere/
     wool → hiver ; linen/silk/cotton léger → été ; reste → polyvalent).
   - lib/coherenceScore : score 0-100 d'une tenue selon 8 critères
     pondérés (slots remplis 20 + registre unique 15 + 1 couleur forte
     15 + saison 10 + budget 10 + genre 10 + matières 10 + images 10).
   - /api/products : nouveaux params ?season=hiver,automne et
     ?maxPrice=150 pour filtrer en amont du sort.
   - /ma-tenue et /stylist propagent automatiquement maxPrice depuis
     wada.profile (< 150€ → 150, 150–400€ → 400, Premium → pas envoyé).
   Force re-fetch HTML. */
/* Bump v51 30/05 : sur /palette/[number], chips interactifs pour les
   3 dimensions du profil (Pour qui / Budget / Style) au-dessus des
   3 cards d'occasion. Plus de badge passif « Composées pour vous · …»
   qui obligeait à ouvrir un menu — maintenant 1 clic sur la page
   change le profil. Sync inter-onglets via storage event : les 3 cards
   et leurs query params (genre/style/maxPrice) se mettent à jour
   automatiquement. Force re-fetch HTML. */
/* Bump v52 30/05 : sur /palette/[number] :
   - Accordéon « Affiner à votre style » SUPPRIMÉ (redondant avec le
     bloc de chips au-dessus).
   - 2 nouvelles dimensions ajoutées au bloc « Composées pour vous » :
     Saison (Toute saison / Hiver / Mi-saison / Été) + Tendance (Sobre
     / Audacieux / Confortable / Tendance). Le client a maintenant 5
     axes ajustables en 1 clic.
   - Profile type étendu : saison? + tendance? (optionnels, rétrocompat).
   - /ma-tenue propage la saison à l'API products (?season=).
   Force re-fetch HTML. */
/* Bump v53 30/05 : bouton « Acheter sur MUJI » dynamique → « Acheter
   sur {marchand} » qui reflète le vrai marchand affilié (MUJI / The
   Business Fashion). Avant, un produit Brunello affichait « Acheter
   sur MUJI » → confusion utilisateur qui croyait MUJI et atterrissait
   chez TBF.
   Note sur le bug « redirige vers la home » : le test direct curl du
   lien Awin pclick.php redirige bien vers la page produit TBF. Si
   l'user voit la home, c'est probablement que le cookie de session
   Awin n'a pas été posé (Safari ITP / navigation privée / bloqueurs
   3rd party). Aucun fix code possible côté nous — c'est Awin → TBF qui
   fallback à la home quand la session manque. Le label correct
   évite au moins la confusion produit. Force re-fetch HTML. */
/* Bump v54 30/05 : champ texte libre ajouté au bloc « Composées pour
   vous » de /palette/[number]. Le client peut maintenant écrire ce
   qu'il veut (« je veux un style sobre », « j'ai un mariage juin »,
   « il fait froid mais envie de couleur ») → redirige vers /stylist
   avec ?q= pré-rempli. /stylist lit le param au mount et envoie
   directement le message au LLM (skip écran d'accueil chips). Force
   re-fetch HTML pour pousser la nouvelle UI. */
/* Bump v55 30/05 : refonte hero /scanner et /composer (inspiration
   mockup « Cosmetic Safety Scanner »). Titres Fredoka 76px max +
   bulle conversationnelle crème avec queue + sparkles décoratifs.
   /scanner : « Scannez une couleur » + bulle « Photographiez un mur,
   une fleur, un tissu… » /composer : « Scannez un vêtement » + bulle
   « Photographiez une pièce que vous aimez… ». Drop zone allégée
   (titre redondant retiré). Force re-fetch HTML. */
/* Bump v56 31/05 : 4 points critiques audit mobile iPhone.
   §1 Reprends — déjà en bas-droit depuis v51, ce bump force le client
       cache stale à recharger.
   §2+§3 PANIER — chaque item fetch maintenant /api/products pour
       afficher image carrée 80×80 + vraie marque + vrai prix (au lieu
       du swatch couleur + hint "~80€" générique). Bouton « Acheter
       sur {marchand} » dynamique. Skeleton shimmer pendant le fetch.
   §4 Tab bar / footer — fond tabbar passé de rgba 0.96 → opaque solide
       (#F4EFE7 clair, #14120E sombre). Body padding-bottom 64px+safe-
       area. Footer margin-bottom safe-area. Plus de transparence
       qui faisait remonter le footer noir.
   Force re-fetch HTML pour pousser tout aux iPhone. */
const CACHE_VERSION = "wada-v99-2026-06-01-ingest-csv-suitable";
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

  /* Fix 2026-05-31 v3 (user feedback « pas d'image et pas les muji,
     tbf » uniquement sur mobile) : le SW cachait /api/products et
     /api/img en stale-while-revalidate → l'iPhone servait en boucle
     les anciennes réponses cassées (slots vides, images 404) même
     après les fixes serveur. Maintenant on BYPASS le cache pour
     toutes les routes /api/* — network-only, jamais de stale.
     Le serveur reste rapide (KV cache côté Vercel), pas besoin
     de doubler côté SW. */
  if (url.pathname.startsWith("/api/")) {
    /* Pour /api/img on tente un cache court (5 min) — les images
       de produit ne changent pas mais on évite de servir des 404
       pour la vie. On le fait UNIQUEMENT si la réponse est OK ;
       si erreur, on supprime du cache. */
    if (url.pathname.startsWith("/api/img")) {
      event.respondWith(
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
          } else {
            caches.open(STATIC_CACHE).then((c) => c.delete(req));
          }
          return res;
        }).catch(() => caches.match(req).then((cached) => cached || Response.error()))
      );
      return;
    }
    /* Toutes les autres routes /api/* : network-only, jamais en cache.
       /api/products, /api/stylist, /api/scan-garment sont dynamiques :
       leur sortie dépend du profil + état conversation + image. Les
       cacher casse l'expérience. */
    event.respondWith(fetch(req));
    return;
  }

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
