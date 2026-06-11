/**
 * GET /api/products
 *
 * Brief Muji 2026-05-28 (cohérence matching tenue) :
 *   Ordre de sélection : TYPE de pièce → REGISTRE → GENRE → puis ΔE couleur
 *   en dernier (la couleur départage, elle ne décide plus seule).
 *
 * Query params :
 *   slot     - haut | bas | veste | chaussures | accent (un seul)
 *   palette  - numéro Sanzo Wada cible (« 094 »)
 *   genre    - homme | femme | unisexe (filtre + neutre unisexe toujours OK)
 *   style    - registre WADA : Classique | Minimal | "Old money" |
 *              Décontracté | Streetwear | Tailoring. Active une liste
 *              d'exclusions de sous-types incohérents (jogging si formel,
 *              pantoufles si chaussures de ville…).
 *   q        - recherche full-text dans nom + description
 *   merchant - slug marchand (« muji-france »)
 *   limit    - max résultats (défaut 8, max 50)
 *
 * Filtres d'exclusion automatiques (brief §1-2) :
 *   slot=chaussures        → exclut pantoufles / mules / chaussons
 *   slot=haut              → exclut robes / combinaisons (hors slot dédié)
 *   slot=accent            → dé-priorise sacs de sport / Boston / voyage
 *   style ∈ {Classique, Old money, Tailoring}
 *                          → exclut survêtement, jogging, hoodie, pyjama,
 *                            sac de sport, mules, pantoufles partout
 *
 * Source : Vercel KV (chunks via lib/productStore).
 * Cache : 5 min CDN.
 */
import { readAllProducts } from "@/lib/productStore";
import { visitorCountry, filterByGeo } from "@/lib/products/visibility";
import type { ProduitAwin } from "@/lib/schema";
import { deltaEHex, hexToLab } from "@/lib/colorDistance";
import { dictionary } from "@/lib/data";
import { styleToRegistre, brandToRegistreOrFallback } from "@/lib/brandRegistre";
import { detectSeason, isSeasonCompatible } from "@/lib/seasonDetect";
/* Brief URGENT 2026-06-01 Nemanja — Règle 3 : occasion → FORBIDDEN_TYPES
   + whitelist source affiliée. Module lib/composer/occasionRules.ts. */
import { isAffiliated, isProductOkForOccasion } from "@/lib/composer/occasionRules";
import { isCompatibleWithOutfit } from "@/lib/composer/microTypes";
/* Brief 2026-06-02 « Composer cohérent » : taxonomie MacroStyle + kill-switches
   paires interdites + profil stylistique palette → filtre sur les pièces candidates. */
import { inferMacroStyle } from "@/lib/composer/bridgeStyle";
import { checkForbiddenStyles } from "@/lib/composer/compatibility";
import { getPaletteStyleProfile } from "@/lib/composer/paletteStyleMap";
/* Brief 2026-06-07 « pas de mannequin, pas de photos de dos » : score d'image
   ajouté au ΔE couleur dans le tri pour préférer les packshots propres. */
import { imageQualityPenalty, isLikelyBackView } from "@/lib/imageQuality";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 8;

/* ──────────────────────────────────────────────────────────────────────
   PATTERNS D'EXCLUSION par slot et par registre — brief §1-2
   ────────────────────────────────────────────────────────────────────── */

/** Sous-types « chaussures » qu'on NE veut PAS dans une tenue de ville :
 *  pantoufles, mules, chaussons, claquettes d'intérieur. */
const EXCLUDE_SHOES_SUBTYPES = /\b(pantoufle|mule|chausson|slipper|sandales?\s+d['']int|claquette)/i;

/** Le slot « haut » ne doit pas renvoyer de robes ni de combinaisons
 *  (on n'a pas de slot dédié robe pour l'instant). */
const EXCLUDE_HAUT_SUBTYPES = /\b(robe[\s-]*chemise|robe[\s-]*top|robe\s+en|robe\s+à|combinaison|jumpsuit|salopette|brassière|brassiere|crop[\s-]?top|bustier|bikini\s+top|soutien[\s-]?gorge)/i;

/** Brief 2026-05-30 — le slot « veste » ne doit pas renvoyer une simple
 *  chemise/overshirt/shirt-jacket. Cas client : tenue avec haut chemise
 *  MUJI + veste shirt-jacket OBJECTS IV LIFE → double chemise visuelle
 *  illogique. Une vraie veste est un blazer / manteau / parka / leather
 *  jacket / cardigan. Les overshirts vont en slot=haut (alternative au
 *  pull/sweat), pas en slot=veste outerwear.
 *
 *  Brief 2026-05-31 (user screenshot Forêt en hiver) : ajout filtres
 *  pour exclure les « vest » sleeveless (cotton vest, tank vest) et
 *  les sous-vêtements (camisole, débardeur, undershirt, sans manches).
 *  En anglais « vest » = gilet/débardeur (≠ « veste » FR = jacket).
 *  Une veste WADA doit avoir des manches longues, point. */
const EXCLUDE_VESTE_SUBTYPES = /\b(shirt[\s-]?jacket|overshirt|chemise[\s-]?veste|chemise\s+\w+\s+manche|sleeveless|sans\s+manches?|cotton\s+vest|tank[\s-]?(top|vest)|cami(sole)?|d[ée]bardeur|undershirt|under[\s-]?vest|sous[\s-]?v[êe]tement|gilet\s+sans\s+manches?|waistcoat|noeud\s+papillon|bow[\s-]?tie|cravate|necktie|pocket\s+square|pochette\s+de\s+costume|bouton\s+de\s+manchette|cufflink|bretelles|braces?)/i;

/** Sacs volumineux/sport — pour l'accent on dé-priorise sans exclure. */
const DEPRIORITIZE_ACCENT = /\b(sac\s+(boston|de\s+sport|de\s+voyage|polochon)|sac\s+banane|sac\s+à\s+dos)/i;

/** Brief 2026-05-26 « IA pas optimale » verbatim : on voyait sortir
 *  « Parapluie compact pliable » ou « Bob en sergé de coton » sur le
 *  slot accent d'une tenue de sortie — pas du tout un accent de style.
 *  Exclusion stricte des produits utilitaires/fonctionnels pour ACCENT.
 *  Ces produits restent disponibles ailleurs (catalogue complet) mais
 *  ne sortent JAMAIS comme accessoire de tenue. */
const EXCLUDE_ACCENT = /\b(parapluie|umbrella|serviette|towel|gant(s)?\s+(de\s+ski|de\s+pluie)|cagoule|tour\s+de\s+cou|masque|porte[-\s]?cl[ée]|trousse|étui|protection|housse|sac\s+(à\s+linge|de\s+rangement)|jet|bouteille|gourde|stylo|carnet|bouton\s+de\s+manchette|cufflink|manchette|noeud\s+papillon|bow[\s-]?tie|pochette\s+de\s+costume|pocket\s+square|bretelles|braces?|suspenders|cravate|necktie|herringbone\s+tie|soie\s+cravate)/i;

/** Brief 2026-05-30 — accent à motifs RETIRÉ.
 *  Cas client : sur palette Encre/Noyer/Os (neutres sobres), un Burberry
 *  duffle bag "check-pattern" est ressorti — visuellement carreaux verts
 *  sapin + crème + noir + jaune moutarde, donc 4 couleurs imprévues
 *  hors palette. Notre matching couleur ne sait pas analyser les motifs.
 *  Solution : exclure les produits à pattern explicite du slot accent. */
const EXCLUDE_ACCENT_PATTERN = /\b(check[\s-]?pattern|checked|tartan|plaid|stripe[ds]?|striped|printed|graphic|paisley|floral|camouflage|leopard|zebra)\b/i;

/** Pyjama/lingerie/maillot de bain — exclus partout. */
const EXCLUDE_ALWAYS = /\b(pyjama|peignoir|short\s+de\s+bain|maillot\s+de\s+bain|sous[\s-]?v[eê]tement|bain|satin\s+lyocell|lyocell\s+satin|string\b|tanga\b|boxer\s+slip|caleçon|culotte\s+de\s+sport|slip\b)/i;

/** Pour les registres « habillés » (tailoring, classique, old money) :
 *  exclut les pièces casual qui jurent visuellement.
 *  NOTE : on ne bannit PAS les sneakers/t-shirts car en Classique soft
 *  (smart casual) sneakers blanches en cuir + tee plein sont OK.
 *
 *  Brief « Page Tenue maître » P1-3 (24/05) — ajouts :
 *    - `sandales?` (sans qualifier) : auparavant on n'excluait que les
 *      sandales d'intérieur via EXCLUDE_SHOES_SUBTYPES ; en registre
 *      habillé toute sandale jure → on les exclut maintenant. */
const EXCLUDE_FORMAL = /\b(surv.tement|jogging|sweat\s*à?\s*capuche|à\s+capuchon|à\s+capuche|capuchon|hoodie|pyjama|sac\s+(boston|de\s+sport|de\s+voyage)|pantoufle|mule|chausson|claquette|tongs?|crocs|sandales?|deperlant|d.perlant|ripstop|track[\s-]?pants?|track[\s-]?suit|joggers?|cargo[\s-]?pants?)/i;

/** Brief 2026-05-31 v8 (user bug Studio danois) : exclusion absolue
 *  des sous-types OUTDOOR / APRÈS-SKI / TECHNIQUES pour tous registres
 *  mode (sauf si on créé un registre dédié plus tard).
 *  Cible : NSE (North Face Standard Equipment), down jackets, snow boots,
 *  Moon Boot, GORE-TEX, parka, quilted heritage, technique imperméable. */
const EXCLUDE_OUTDOOR = /\b(nse|gore[\s-]?tex|down\s+jacket|doudoune|parka|after[\s-]?ski|après[\s-]?ski|snow\s+boot|moon\s*boot|quilted\s+(jacket|coat)|hiking\s+(boot|shoe)|technique\s+imperméable|imperm[ée]able|waterproof|wind[\s-]?breaker|coupe[\s-]?vent\s+technique|ripstop|hard[\s-]?shell|soft[\s-]?shell|insulated|thermal|primaloft|fleece|polartec|fonctionnel)/i;

const FORMAL_STYLES = new Set([
  "classique",
  "old money",
  "tailoring",
  "tailoring net",
  "formel",
  "luxe discret",
  "bourgeoisie",
]);

function isFormalStyle(style: string | null): boolean {
  if (!style) return false;
  return FORMAL_STYLES.has(style.toLowerCase().trim());
}

/* ──────────────────────────────────────────────────────────────────────
   PERF 2026-06-11 (« attente trop longue ») — POOL DE BASE PRÉ-FILTRÉ + CACHÉ
   ──────────────────────────────────────────────────────────────────────
   La page /ma-tenue lance 5 appels /api/products simultanés. Chacun refaisait,
   AVANT le filtre slot : filterByGeo(~70k) + le filtre enStock/image (2 regex
   par produit sur ~70k). Multiplié par 5 appels sérialisés sur l'event-loop
   Node → mur mesuré ~4,8–5,5s.

   On calcule ce pool de base UNE fois par (géo × 60s) et on le PARTITIONNE par
   slot. Un appel slot=haut démarre alors d'un bucket de quelques milliers de
   produits déjà filtrés (stock + image + shopifypreview), au lieu de re-dériver
   depuis 70k. `all` reste l'union (cas sans slot). Le contenu est identique à
   l'ancien `initialPool` filtré par slot — donc fallback registre inchangé. */
type BasePool = { bySlot: Map<string, ProduitAwin[]>; all: ProduitAwin[] };
let _basePoolCache: { key: string; at: number; pool: BasePool } | null = null;
/* PERF 2026-06-11 (keep-warm) : 60s → 10 min, aligné sur le cache catalogue
   (productStore CATALOG_TTL_MS). Le pool de base dérive du catalogue journalier ;
   un TTL court forçait un re-filtrage géo+stock du catalogue à chaque minute même
   sur instance chaude. 10 min garde l'instance pleinement chaude entre deux pings
   keep-warm. */
const BASE_POOL_TTL_MS = 600_000;

function getBasePool(catalog: ProduitAwin[], country: string | null): BasePool {
  const key = country === "CH" ? "CH" : "other";
  if (_basePoolCache && _basePoolCache.key === key && Date.now() - _basePoolCache.at < BASE_POOL_TTL_MS) {
    return _basePoolCache.pool;
  }
  const geo = filterByGeo(catalog, country);
  const all: ProduitAwin[] = [];
  const bySlot = new Map<string, ProduitAwin[]>();
  for (const p of geo) {
    if (!p.enStock) continue;
    const imageUrl = p.imageLocal || p.largeImage || p.image || "";
    if (!imageUrl || imageUrl === "-") continue;
    if (/noimage\.(gif|png|jpe?g|webp)/i.test(imageUrl)) continue;
    if (/shopifypreview\.com/i.test(imageUrl) || /shopifypreview\.com/i.test(p.urlProduit || "")) continue;
    all.push(p);
    const cat = p.categorie || "";
    const bucket = bySlot.get(cat);
    if (bucket) bucket.push(p);
    else bySlot.set(cat, [p]);
  }
  const pool: BasePool = { bySlot, all };
  _basePoolCache = { key, at: Date.now(), pool };
  return pool;
}

/* ──────────────────────────────────────────────────────────────────────
   ROUTE
   ────────────────────────────────────────────────────────────────────── */

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot");
  const palette = url.searchParams.get("palette");
  /* Brief audit live 2026-05-28 — bug genre non respecté :
     L'UI passait parfois « Femme »/« Homme » (capitalisé, depuis les chips
     du /stylist) alors que l'API attendait « femme »/« homme ». Résultat :
     le test `genre === "homme"` échouait → AUCUN filtre genre appliqué.
     Fix défensif : on normalise systématiquement en lowercase. */
  const genre = url.searchParams.get("genre")?.toLowerCase().trim() || null;
  const style = url.searchParams.get("style");
  const q = url.searchParams.get("q");
  const merchant = url.searchParams.get("merchant");
  /* Brief 2026-05-28 (intégration MUJI dans /stylist) :
     ?color=<hex> — couleur cible PRÉCISE (la couleur de la pièce du slot,
     pas d'une palette globale). Active un tri par ΔE2000 ascendant entre
     le hex demandé et le hex de chaque produit. Utile pour /stylist où
     chaque pièce a son propre hex (haut crème, bas sable, veste signature…). */
  const colorHex = url.searchParams.get("color");
  const isValidHex = colorHex && /^#?[0-9a-f]{6}$/i.test(colorHex.trim());
  /* Brief 2026-05-28 (variété tenues) :
     ?seed=<str> — chaîne de hash déterministe pour piocher un produit
     DIFFÉRENT dans le top-N de chaque slot/palette. Sans seed, on prend
     toujours le #1 → tous les slots de toutes les palettes affichent
     les MÊMES produits. Avec seed, deux palettes différentes tombent sur
     des produits différents même pour des couleurs proches.
     ?excludeIds=<csv> — IDs produits à exclure (dedup intra-tenue). */
  const seed = url.searchParams.get("seed");
  const excludeIdsRaw = url.searchParams.get("excludeIds");
  const excludeIds = excludeIdsRaw ? new Set(excludeIdsRaw.split(",").filter(Boolean)) : null;
  /* Brief 2026-06-01 MICRO_TYPES : noms des pièces déjà sélectionnées dans
     la tenue. Transmis par /ma-tenue en JSON encodé URI. Utilisé pour
     vérifier la cohérence intra-tenue (short + cardigan = NO).
     Format : ?selectedNames=Chemise%20MUJI|Pull%20en%20laine */
  const selectedNamesRaw = url.searchParams.get("selectedNames");
  const selectedNames: { nom: string }[] = selectedNamesRaw
    ? selectedNamesRaw.split("|").filter(Boolean).map((n) => ({ nom: decodeURIComponent(n) }))
    : [];
  /* Brief 2026-05-30 § 3 + 7 : saison + budget plafond.
     ?season=<comma-list> — saisons palette (« hiver,automne ») : filtre les
       produits dont la matière/coupe ne colle pas (pas de cachemire en été,
       pas de lin en hiver). Utilise lib/seasonDetect.
     ?maxPrice=<euros> — plafond prix par pièce selon le profil :
       < 150€ → 150, 150–400€ → 400, Premium → pas envoyé. */
  const seasonParam = url.searchParams.get("season");
  const paletteSeasons = seasonParam ? seasonParam.split(",").map((s) => s.trim()).filter(Boolean) : null;
  const maxPriceRaw = parseFloat(url.searchParams.get("maxPrice") || "");
  const maxPrice = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : null;

  /* Brief 2026-06-07 COHÉRENCE DE TIER — ?tierCap=<euros> : plafond DUR
     imposé par /ma-tenue quand une pièce est un outlier de prix dans la
     tenue (> 5× la médiane des autres). Distinct de maxPrice : il n'est PAS
     soumis à la majoration +50% du soft-cap budget des slots non-MUJI, car
     c'est une contrainte de cohérence d'ensemble, pas de budget profil. */
  const tierCapRaw = parseFloat(url.searchParams.get("tierCap") || "");
  const tierCap = Number.isFinite(tierCapRaw) && tierCapRaw > 0 ? tierCapRaw : null;

  /* Brief 2026-06-01 « Logique IA dimensions UI » §1 — chip ENVIE.
     6 valeurs : confortable | elegant | discret | affirme | creatif | intemporel
     Chacune applique des règles précises sur matières / coupes / marques.
     Si non spécifié → pas de filtre envie (comportement legacy). */
  const envie = (url.searchParams.get("envie") || "").toLowerCase().trim() || null;
  /* §1 — chip INSPIRATION. 4 valeurs : tendance | intemporel | avant-garde | classique-revisite
     Filtre additionnel sur les marques/tags. */
  const inspiration = (url.searchParams.get("inspiration") || "").toLowerCase().trim() || null;
  /* Brief URGENT 2026-06-01 Nemanja — Règle 3 : occasion → FORBIDDEN_TYPES.
     Empêche short_bain/sneakers_sport/cravate en mauvaise occasion. */
  const occasion = (url.searchParams.get("occasion") || "").toLowerCase().trim() || null;
  const limitRaw = parseInt(url.searchParams.get("limit") || "", 10);
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const offsetRaw = parseInt(url.searchParams.get("offset") || "0", 10);
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

  /* Filtres boutique : famille couleur + fourchette prix */
  const couleurFamille = url.searchParams.get("couleurFamille")?.toLowerCase().trim() || null;
  const prixMinRaw = parseFloat(url.searchParams.get("prixMin") || "");
  const prixMaxRaw = parseFloat(url.searchParams.get("prixMax") || "");
  const prixMin = Number.isFinite(prixMinRaw) && prixMinRaw >= 0 ? prixMinRaw : null;
  const prixMax = Number.isFinite(prixMaxRaw) && prixMaxRaw > 0 ? prixMaxRaw : null;

  /* Mapping famille couleur → mots-clés (doit rester en sync avec CategoryPage) */
  const COULEUR_KEYWORDS: Record<string, string[]> = {
    noir:   ["noir","black","anthracite","charbon","ébène","onyx","graphite"],
    blanc:  ["blanc","white","crème","cream","ivoire","ivory","écru","ecru","off-white","nacre","lait","cassé"],
    gris:   ["gris","grey","gray","argent","silver","acier","perle","ciment","ardoise","souris"],
    beige:  ["beige","camel","sable","nude","grège","taupe","nougat","naturel","lin","chanvre","paille","blé","champagne","dune"],
    marron: ["marron","brun","brown","tabac","cognac","noisette","chocolat","caramel","tan","havane","moka","café","châtaigne","ocre"],
    bleu:   ["bleu","blue","marine","navy","indigo","cobalt","saphir","cyan","ciel","azur","denim","électrique","nuit"],
    vert:   ["vert","green","kaki","khaki","olive","sauge","sage","forêt","forest","émeraude","menthe","militaire","bouteille","chasseur","pistache","mousse"],
    rouge:  ["rouge","red","bordeaux","burgundy","carmin","cramoisi","vermeil","grenat","cerise","fraise","rubis","brique"],
    rose:   ["rose","pink","blush","poudré","framboise","corail","coral","saumon","salmon","pêche","layette","fushia","fuchsia"],
    jaune:  ["jaune","yellow","moutarde","mustard","doré","or","gold","citron","curry","safran","ambre","miel"],
    orange: ["orange","rouille","rust","terre cuite","brique","cannelle","roux","cuivre","paprika"],
    violet: ["violet","purple","mauve","lilas","aubergine","lavande","prune","parme","améthyste","myrtille"],
  };

  /* Visibilité géographique (2026-06-09) : K&Ö = CH uniquement. On filtre le
     catalogue selon le pays visiteur (x-vercel-ip-country) AVANT tout matching
     pour que K&Ö n'entre jamais dans le pool hors Suisse. */
  const country = visitorCountry(req.headers);
  const catalog = await readAllProducts();
  if (catalog.length === 0) {
    return Response.json({ products: [], total: 0, source: "empty" });
  }

  /* Brief 2026-06-01 §3 — Conflits + transparence : si le composer doit
     assouplir une dimension pour trouver un produit (ex. fallback registre,
     élargissement adjacence), on track ici lesquelles. La UI affiche un
     message honnête au client (« j'ai dû élargir aux marques classiques
     pour rester dans le budget »). */
  const relaxedDimensions: string[] = [];

  // ─── ÉTAPE 1 : filtres durs (stock, slot, genre, marchand, type) ──
  /* Brief 2026-05-30 — drop des produits SANS image utilisable.
     TBF renvoie parfois `image="https://images2.productserve.com/noimage.gif"`
     comme placeholder pour les produits dont le marchand n'a pas fourni
     de visuel. Ces produits affichent une zone blanche côté UI →
     mauvaise expérience. On les filtre en amont du tri/sélection.

     Brief 2026-05-30 — drop URLs Shopify preview (404 publiques).
     Certains produits TBF ont un aw_deep_link qui résout vers une URL
     Shopify preview du type `v5z6tq0g857k49tq-2683651.shopifypreview.com`
     — ces URLs sont des previews internes Shopify (drafts non publiés)
     qui rendent 404 pour les utilisateurs publics. On filtre les URLs
     produit contenant `shopifypreview.com` pour ne plus jamais envoyer
     un client sur une page 404. */
  /* PERF 2026-06-11 : on démarre du bucket pré-filtré (géo + stock + image OK
     + pas shopifypreview) du slot demandé, calculé UNE fois par (géo × 60s)
     dans getBasePool et partitionné par slot. Sans slot, on prend l'union
     `all`. Le filtre stock/image (2 regex/produit sur ~70k) ne tourne donc
     plus à chaque requête — c'était le coût fixe sérialisé sur les 5 appels
     simultanés de /ma-tenue. */
  const basePool = getBasePool(catalog, country);
  let filtered = slot ? (basePool.bySlot.get(slot) || []).slice() : basePool.all.slice();

  /* Fix 2026-05-31 v3 : pool de base (stock + image OK + pas shopifypreview)
     pour CE slot, avant tout filtre métier. Sert au fallback registre plus
     bas (cf. « FALLBACK REGISTRE »). Identique à l'ancien initialPool ensuite
     filtré par slot — le fallback re-filtre déjà par slot, donc inchangé. */
  const initialPool = filtered.slice();

  /* Brief URGENT 2026-06-01 Nemanja — Règle 1 : WHITELIST SOURCES.
     Seules les marques affiliées (MUJI / TBF / Suitable FR) passent. Les
     produits qui auraient pu transiter via d'autres marchands sont rejetés
     — pas de commission, pas de fiabilité. */
  filtered = filtered.filter((p) => isAffiliated(p.marchandSlug || ""));

  /* ─── PERF 2026-06-11 (« attente trop longue ») — filtres discriminants EN PREMIER.
     La page /ma-tenue lance 5 appels simultanés ; chacun refait tout le matching
     sur ~36k produits → ils se sérialisent sur l'event-loop Node (mesuré : 5,5s mur,
     dernière carte 5,3s). Les passes coûteuses qui suivent (inferMacroStyle par
     produit pour la palette + selectedNames, longues chaînes de regex) tournaient
     sur le catalogue ENTIER avant le filtre slot. On déplace ici slot/marchand/
     excludeIds/genre — qui réduisent le pool ~5× (un slot ≈ quelques milliers) —
     pour que tout le reste opère sur l'ensemble réduit. Résultat identique (filtres
     conjonctifs, l'ordre ne change que le coût) ; initialPool (fallback) capturé
     plus haut, donc inchangé. */
  /* slot déjà appliqué via le bucket getBasePool (cf. plus haut). */
  if (merchant) filtered = filtered.filter((p) => p.marchandSlug === merchant);
  // Brief 2026-05-28 (dedup intra-tenue) : exclure les produits déjà
  // sélectionnés sur les autres slots de la même tenue.
  if (excludeIds) filtered = filtered.filter((p) => !excludeIds.has(p.id));
  // Brief §3 : genre identique sur toute la tenue (+ unisexe accepté).
  // Brief « Page Tenue maître » P0-1 (24/05) : depuis l'ajout du sentinel
  // `inconnu` dans ProductGenre, les produits sans tag explicite ne
  // passent plus ce filtre (avant ils étaient classés "unisexe" par défaut
  // et leakaient dans les deux genres).
  if (genre === "homme" || genre === "femme") {
    filtered = filtered.filter((p) => p.genre === genre || p.genre === "unisexe");
    /* Fix 2026-05-31 v3 (user feedback « pas de muji tbf ») : la regex
       v2 filtrait trop large — « pour homme » bannissait « Pour homme.
       Pour femme. Mixte. » dans une description marketing générique, et
       « men » matchait « menswear » de TBF (qui est menswear-focused) sur
       une recherche femme légitime. Maintenant on n'exclut que si le
       NOM (pas description) contient une marque genre explicite. */
    const OPPOSITE_GENDER_NAME = genre === "homme"
      ? /\b(women's?|womens|woman's?|womenswear|pour\s+femme|f[ée]minin)\b/i
      : /\b(men's?|mens|man's?|menswear|pour\s+homme|masculin)\b/i;
    filtered = filtered.filter((p) => {
      /* Test sur le nom UNIQUEMENT. La description bilingue marketing
         contient souvent « pour homme et femme » ou « menswear collection »
         et déclenchait des exclusions intempestives. */
      return !OPPOSITE_GENDER_NAME.test(p.nom);
    });
  }

  /* Brief URGENT 2026-06-01 Nemanja — Règle 3 : FORBIDDEN_TYPES par occasion.
     Rejette short_bain / sneakers_sport / cravate / costume_ceremonie / etc.
     quand l'occasion ne les autorise pas. Match par mots-clés dans product_name. */
  if (occasion) {
    filtered = filtered.filter((p) => isProductOkForOccasion(p.nom, occasion));
  }

  /* Brief 2026-06-02 « Composer cohérent » — Couche 2 : identité de palette.
     La palette a des styles préférés et interdits (cf. lib/composer/paletteStyleMap).
     On exclut les produits dont le macro-style est dans `forbidden` pour cette palette.
     Exemple : palette "Bal au Palais" (or/rouge/émeraude) interdit streetwear →
     un hoodie BAPE sera rejeté même si sa couleur matche la palette. */
  const paletteEntry = palette ? dictionary.find((d) => d.number === palette) : null;
  if (paletteEntry) {
    const paletteProfile = getPaletteStyleProfile(paletteEntry.name);
    if (paletteProfile.forbidden.length > 0) {
      filtered = filtered.filter((p) => {
        const ms = inferMacroStyle(p.nom, p.brandRegistre ?? null);
        return !paletteProfile.forbidden.includes(ms);
      });
    }
  }

  /* Brief 2026-06-02 — Couche 3 : kill-switch macro-styles pièces déjà sélectionnées.
     Si selectedNames contient des pièces, on vérifie qu'aucune combinaison de
     macro-styles n'est dans FORBIDDEN_STYLE_PAIRS. Plus précis que MICRO_TYPES
     (qui travaille sur le type de pièce) car ça détecte streetwear+soirée
     même si les types individuels sont OK. */
  if (selectedNames.length > 0) {
    const existingStyles = selectedNames.map((s) =>
      inferMacroStyle(s.nom, null)
    );
    filtered = filtered.filter((p) => {
      const pStyle = inferMacroStyle(p.nom, p.brandRegistre ?? null);
      const combined = [...existingStyles, pStyle];
      return checkForbiddenStyles(combined) === null;
    });
  }

  // Brief §1 : exclusions de sous-types par slot
  filtered = filtered.filter((p) => {
    const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
    // exclusions globales (pyjama, sous-vêtement, maillot)
    if (EXCLUDE_ALWAYS.test(hay)) return false;
    // exclusions par slot
    if (slot === "chaussures" && EXCLUDE_SHOES_SUBTYPES.test(hay)) return false;
    if (slot === "haut" && EXCLUDE_HAUT_SUBTYPES.test(hay)) return false;
    /* Brief 2026-05-30 : veste ≠ chemise (pas de double layering). */
    if (slot === "veste" && EXCLUDE_VESTE_SUBTYPES.test(hay)) return false;
    /* Brief 2026-05-26 « IA pas optimale » : le slot accent ne doit JAMAIS
       renvoyer d'objet utilitaire (parapluie, gants ski, masque, porte-clé…).
       Le screenshot client montrait « Parapluie compact pliable MUJI » et
       « Bob en sergé de coton » sur l'accent d'une tenue de sortie — ridicule.
       Maintenant : un parapluie sort du catalogue accessoires côté Awin
       mais ne peut PLUS sortir comme accent de tenue. */
    if (slot === "accent" && EXCLUDE_ACCENT.test(hay)) return false;
    /* Brief 2026-05-30 : pas d'accent à motifs (carreaux/tartan/printed/
       paisley/etc.) — ajoute des couleurs imprévues hors palette. */
    if (slot === "accent" && EXCLUDE_ACCENT_PATTERN.test(hay)) return false;
    return true;
  });

  // Brief §2 : exclusions par registre (formal = pas de pieces casual)
  if (isFormalStyle(style)) {
    filtered = filtered.filter((p) => {
      const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
      return !EXCLUDE_FORMAL.test(hay);
    });
  }

  /* Brief 2026-05-30 « logique de composition cohérente » §1 :
     filtrer par REGISTRE de marque pour ne JAMAIS mélanger Brunello
     Cucinelli (classique) avec Amiri (streetwear) dans une même tenue.
     Mapping du style profil utilisateur → registre catalogue via
     styleToRegistre(). Une marque non-classée fallback en `classique`
     (lib/brandRegistre.brandToRegistreOrFallback).

     Fix 2026-05-31 v5 (user feedback « toujours que MUJI où sont les
     produits TBF rajoute les aussi ») : sur les slots à bias non-MUJI
     (bas / veste / chaussures), on ÉLARGIT le filtre registre aux
     registres ADJACENTS pour laisser passer TBF. Cas concret : user
     en Décontracté → strict registre = decontracte → seul MUJI
     (Birkenstock/Armor Lux) → pool 100% MUJI → bias non-MUJI échoue.
     Avec adjacence : on accepte aussi minimaliste (Lemaire/Jacquemus/
     CDG) et classique (Brunello/Tom Ford) sur ces slots → TBF revient.
     Le slot reste filtré strict registre pour haut/accent (sobriété). */
  const targetRegistre = styleToRegistre(style);
  /* NON_MUJI_BIAS_SLOTS conservé pour la logique de soft cap budget plus
     bas — ces slots acceptent un +50% du maxPrice pour laisser passer
     TBF / Suitable / luxury qui dépassent souvent le ticket basique. */
  const NON_MUJI_BIAS_SLOTS = new Set(["bas", "veste", "chaussures"]);
  /* Brief URGENT 2026-06-01 Nemanja — Règle 2 « Une marque = un registre.
     Pas de mix ». Le filtre devient STRICT : on n'accepte que les produits
     dont brandRegistre === targetRegistre. Plus d'adjacency permissive.
     Conséquence assumée : palette minimaliste n'aura PAS MUJI (decontracte)
     sauf si l'utilisateur choisit explicitement l'univers « Décontracté ».
     Le nouveau sélecteur palette demande l'univers en clair — c'est lui
     qui pilote la cohérence cross-pièces. */
  if (targetRegistre) {
    filtered = filtered.filter((p) => {
      const productRegistre = p.brandRegistre || brandToRegistreOrFallback(p.marque || p.marchand);
      return productRegistre === targetRegistre;
    });
  }

  /* Fix 2026-05-31 v2 (user screenshot « Puncture M A-Stabbing Women
     shirt » Yohji 2604€ sur tenue Classique) : les exclusions graphique /
     print / slogan s'appliquent maintenant à TOUS les styles, pas juste
     Minimaliste. Un blazer Classique ne doit JAMAIS être un t-shirt à
     dessin imprimé avec « Stabbing » dans le titre. Les seules tenues
     qui acceptent un graphique = Streetwear (logos sneakers OK) et
     Décontracté (motifs textiles légers OK), mais pour le slot HAUT on
     préfère toujours du sobre. */
  const isMinimaliste = (style || "").toLowerCase().includes("minimal");
  const isClassique = (style || "").toLowerCase().includes("classique");
  /* Liste élargie : tout ce qui dénote un visuel marqué / texte / dessin
     central / nom artistique provocateur (« Stabbing », « Puncture »,
     « Bleeding », « Suicide » — fréquents chez Yohji / Comme des
     Garçons / Junya). */
  const VISUAL_FORBIDDEN = /\b(graphic|graphique|print(ed)?|imprim[ée]e?|logo\s+(t-shirt|tee|sweat)|big\s+logo|all[\s-]?over|patch(work)?|embroider|broderie|appliqu[ée]|slogan|tag(line)?|patterned|motif|stabbing|puncture|bleeding|skull|dripping|crucifix|cross\s+print|bondage)/i;

  filtered = filtered.filter((p) => {
    const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
    /* Fix 2026-05-31 v3 (user feedback « pas de muji tbf ») : la v2
       appliquait EXCLUDE_ACCENT_PATTERN (rayures/printed/striped/floral)
       à TOUS les slots en Minimal+Classique → vidait beaucoup de MUJI/TBF
       (un t-shirt MUJI « rayé » est parfaitement Minimaliste). Rollback :
       EXCLUDE_ACCENT_PATTERN reste appliqué SEULEMENT au slot=accent
       (cf. boucle plus haut). VISUAL_FORBIDDEN reste sur tous slots
       Minimal+Classique car les noms artistiques provocants (« Stabbing »,
       « Skull », « Bondage ») sont vraiment incompatibles avec ces
       registres, et ils sont peu communs dans MUJI/TBF basiques. */
    if ((isMinimaliste || isClassique) && VISUAL_FORBIDDEN.test(hay)) return false;
    /* Fix 2026-05-31 v8 (user bug Studio danois : Moon Boot + North Face
       NSE + Barbour quilted dans une tenue Minimal) : exclusion absolue
       des sous-types outdoor / après-ski / techniques sur TOUS les
       registres mode. Une tenue WADA n'est jamais une tenue de rando. */
    if (EXCLUDE_OUTDOOR.test(hay)) return false;

    /* Brief 2026-06-01 « Logique IA dimensions » §1 — règles ENVIE :
       chaque chip envie applique ses exclusions précises sur le pool.
       Les boosts (score +20 etc.) ne sont pas appliqués ici (ils
       affectent le sort, pas le filtre). Voir tri ΔE plus bas. */
    if (envie === "elegant") {
      /* Exclure sweat, jogging, sneakers de sport, motifs voyants. */
      if (/\b(sweat[\s-]?shirt|jogging|joggers?|sneaker(s)?\s+(de\s+)?sport|running|trainer|track[\s-]?suit)\b/i.test(hay)) return false;
      if (/\b(neon|fluo|graphic|imprim[ée]e?\s+voyant|tartan|carreaux\s+voyants)\b/i.test(hay)) return false;
    }
    if (envie === "confortable") {
      /* Exclure chaussures à talons, chemises ajustées strictes, vestes
         structurées rigides (blazer ajusté formel). */
      if (/\b(escarpins?|talons?|stilettos?|high[\s-]?heel)\b/i.test(hay)) return false;
      if (/\b(blazer\s+(structuré|rigide|cintré)|veste\s+(structurée|rigide|formelle))\b/i.test(hay)) return false;
      if (/\b(chemise\s+(ajustée|slim\s+fit|fitted))\b/i.test(hay)) return false;
    }
    if (envie === "discret") {
      /* Aucun logo apparent. On exclut explicitement les pièces avec
         "logo" / "monogram" / "branding" dans le nom. */
      if (/\b(logo\s+\w+|monogram|branded|with\s+logo)\b/i.test(hay)) return false;
      /* Pas de marques streetwear statement (gardé en fallback même
         si le bias merchant ne s'applique pas). */
      const m = (p.marque || p.marchand || "").toLowerCase();
      if (/(off[\s-]?white|palm\s+angels|bape|amiri|rick\s+owens|heron\s+preston|kidsuper)/i.test(m)) return false;
    }
    if (envie === "intemporel") {
      /* Exclure les marques streetwear récentes (< 15 ans) et les
         tendances datées « pour 2026 », « cette saison ». */
      const m = (p.marque || p.marchand || "").toLowerCase();
      if (/(off[\s-]?white|palm\s+angels|bape|amiri|jacquemus|heron\s+preston|kidsuper|44\s+label|heliot\s+emil|y\/?project|we11done)/i.test(m)) return false;
      if (/\b(tendance\s+(2025|2026)|saison\s+(\d{4}|en\s+cours)|capsule|drop|limited[\s-]?edition)\b/i.test(hay)) return false;
    }
    /* affirme : pas d'exclusion (on autorise tout, on boostera la
       pièce statement au sort). Idem créatif. */
    return true;
  });

  /* Brief 2026-05-30 §3 : filtrer par saison palette.
     Cachemire/laine épaisse interdits pour palette « été »,
     lin/coton léger interdits pour palette « hiver ». Détection
     par regex sur nom+description (lib/seasonDetect). */
  if (paletteSeasons && paletteSeasons.length > 0) {
    filtered = filtered.filter((p) => {
      const productSeason = detectSeason(p.nom, p.description || "");
      return isSeasonCompatible(productSeason, paletteSeasons);
    });
  }

  /* Brief 2026-05-30 §7 : plafond prix par pièce selon profil budget.
     Un user « < 150€ » ne doit voir AUCUNE pièce > 150€. Garantit que le
     total tenue (5 × 150 = 750€ max) reste dans la fourchette annoncée.

     Fix 2026-05-31 (user screenshot 996€ mocassins + 624€ sac sur tenue
     Minimal en mode Premium) : même en Premium (pas de maxPrice), on
     applique un soft cap par registre :
       - Minimaliste : 700€/pièce (quiet luxury sobre)
       - Streetwear  : 400€/pièce (tenue casual autour de sneakers)
       - Décontracté : 250€/pièce (MUJI / basiques)
       - Classique   : pas de cap (tailoring premium peut atteindre 1500€)

     Cas concret : user scanne ses Veja Campo (streetwear), registre Vision
     applique Streetwear → ne ressort pas une veste Lemaire 673€ ou un
     jean Jacquemus 503€ qui font total 1600€ alors que les Veja valent
     150€. Coherent total ≤ ~1500€ pour 4 pièces (~400 × 4). */
  /* Fix 2026-05-31 v2 (user screenshot Yohji 2604€ sur tenue Classique) :
     même Classique a maintenant un cap (1500€/pièce). 2604€ pour un seul
     vêtement est aberrant — quiconque shoppe à ce niveau passe par une
     boutique, pas par une app. Si l'user veut vraiment du Brioni à 3000€,
     il configure son profil Premium et les caps disparaissent. */
  /* Fix 2026-05-31 v4 (user feedback « il n'y a que des habits Muji pas
     de variation avec TBF ») : les caps v3 étaient calibrés sur MUJI
     (25-150€) et excluaient mécaniquement TBF qui démarre à ~150€ et
     monte. Conséquence : un user en registre Décontracté ne voyait
     QUE MUJI car le cap 250€/pièce bloquait tout le reste.
     Caps relevés pour laisser passer TBF milieu-de-gamme :
       Décontracté : 250 → 600  (TBF basics passe)
       Streetwear  : 400 → 800  (TBF sneakers / outerwear passe)
       Minimaliste : 700 → 1000 (Lemaire / Jacquemus passe)
       Classique   : 2000 inchangé (Brunello milieu de gamme) */
  /* Prix plafond par pièce selon le registre — quand aucun maxPrice n'est
     fourni par le sélecteur. Brief 2026-06-02 (user) : streetwear baissé
     de 800€ à 300€ pour éviter Y-3/Off-White à 800€+ sur une tenue courante.
     Le catalogue TBF streetwear a aussi des marques à 50-200€ (Carhartt,
     Adidas, neighborhood) qui passeront ce filtre. */
  /* Caps budget par registre. Valeurs restaurées (2026-06-03) :
     le cap à 300€ excluait trop de TBF pour Classique/Décontracté.
     On revient à des caps plus larges qui laissent passer la vraie sélection. */
  const REGISTRE_CAP: Record<string, number> = {
    minimaliste: 1000,
    streetwear: 500,
    decontracte: 600,
    classique: 2000,
    avant_garde: 500,
    heritage_country: 400,
    outdoor: 400,
    apres_ski: 300,
  };
  const registreCap = targetRegistre ? REGISTRE_CAP[targetRegistre] : null;
  /* Fix 2026-05-31 v5 (user feedback « sur ordinateur je reçois des
     marques de TBF, sur téléphone que MUJI ») : sur les slots à bias
     non-MUJI (bas / veste / chaussures), on autorise un dépassement de
     50% du maxPrice profil. Pourquoi : un user en budget "150-400€"
     (maxPrice=400) voit son cap appliqué uniformément → TBF qui démarre
     à ~150-200€ mais culmine à 500-700€ sur ces slots est totalement
     exclu. En autorisant +50% (cap effectif 600€), les TBF basics
     passent sur bas/veste/chaussures (où le coût « justifié » est le
     plus accepté par les users), tandis que haut + accent restent à
     maxPrice strict (basique MUJI). Cap final = min(soft, registreCap)
     pour ne pas exploser le budget total. */
  const isNonMujiSlot = slot && NON_MUJI_BIAS_SLOTS.has(slot);
  let effectiveMaxPrice = maxPrice ?? registreCap ?? null;
  if (effectiveMaxPrice !== null && maxPrice !== null && isNonMujiSlot) {
    const softCap = Math.round(maxPrice * 1.5);
    effectiveMaxPrice = registreCap !== null ? Math.min(softCap, registreCap) : softCap;
  }
  if (effectiveMaxPrice !== null) {
    filtered = filtered.filter((p) => p.prix <= effectiveMaxPrice!);
  }

  /* Brief 2026-06-07 COHÉRENCE DE TIER — plafond DUR final (jamais majoré).
     Appliqué après effectiveMaxPrice pour ramener une pièce outlier dans le
     tier de la tenue. Fail-open : si le plafond vide le pool, on garde le
     pool pré-tierCap (mieux une pièce un peu chère qu'un slot vide). */
  if (tierCap !== null) {
    const underTier = filtered.filter((p) => p.prix <= tierCap);
    if (underTier.length > 0) filtered = underTier;
  }

  /* Filtre couleur famille (boutique) */
  if (couleurFamille && COULEUR_KEYWORDS[couleurFamille]) {
    const kws = COULEUR_KEYWORDS[couleurFamille];
    filtered = filtered.filter((p) => {
      const cn = (p.couleurNom || "").toLowerCase();
      const nm = (p.nom || "").toLowerCase();
      return kws.some((k) => cn.includes(k) || nm.includes(k));
    });
  }

  /* Filtre fourchette prix (boutique) */
  if (prixMin !== null) filtered = filtered.filter((p) => (p.prix ?? 0) >= prixMin!);
  if (prixMax !== null) filtered = filtered.filter((p) => (p.prix ?? 0) <= prixMax!);

  // Recherche full-text (AND sur tokens)
  if (q && q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter((p) => {
      const hay = `${p.nom} ${p.description || ""} ${p.couleurNom || ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  /* ─── Fix 2026-05-30 v2 « couleurs pas dans la palette » ────────────
     Constat client : sur une palette anthracite/beige doré/vert profond,
     la tenue affichait gris clair + écru + anthracite — 2 produits sur
     la même couleur, vert profond absent. Cause : sort min(ΔE) toutes
     couleurs confondues → tous les slots convergent vers la couleur la
     plus matchable du catalogue.

     Nouveau : on assigne UNE couleur cible PAR SLOT. Pour une palette
     (couleur[0], couleur[1], couleur[2]) :
       - haut       → couleur[0]   (dominante de palette)
       - bas        → couleur[1]   (secondaire)
       - veste      → couleur[2]   (signature, généralement la plus
                                    saturée/sombre)
       - chaussures → couleur la plus FONCÉE (min luminance L)
       - accent     → couleur signature ou la plus rare

     Résultat : la tenue distribue les 3 couleurs de la palette sur les
     5 slots au lieu de toutes graviter sur 1 couleur. */
  const paletteColors = palette
    ? (dictionary.find((d) => d.number === palette)?.colors.map((c) => c.hex) || [])
    : [];

  function darkestColor(): string | null {
    if (paletteColors.length === 0) return null;
    let darkest = paletteColors[0];
    let minL = hexToLab(paletteColors[0])[0];
    for (const c of paletteColors.slice(1)) {
      const L = hexToLab(c)[0];
      if (L < minL) { minL = L; darkest = c; }
    }
    return darkest;
  }

  /** Couleur cible pour ce slot — null si pas de palette. */
  const slotTargetColor: string | null = (() => {
    if (paletteColors.length === 0) return null;
    const c0 = paletteColors[0];
    const c1 = paletteColors[1] || c0;
    const c2 = paletteColors[2] || c1;
    switch (slot) {
      case "haut":       return c0;
      case "bas":        return c1;
      case "veste":      return c2;
      case "chaussures": return darkestColor() || c2;
      case "accent":     return c2;
      default:           return c0;
    }
  })();

  function distanceToSlotTarget(productHex: string): number {
    if (!slotTargetColor) return Infinity;
    return deltaEHex(productHex, slotTargetColor);
  }

  /* Fix 2026-05-31 v3 (user feedback « pas de muji tbf ») — FALLBACK
     REGISTRE : si après tous les filtres on a 0 produit ET qu'on avait
     un targetRegistre, on retire le filtre registre et on rejoue. Mieux
     vaut un produit cohérent en couleur+slot+genre+saison (même hors
     registre strict) qu'une carte vide « Aucune marque partenaire ».
     Le tri ΔE qui suit gardera quand même les plus proches en couleur. */
  if (filtered.length === 0 && targetRegistre && initialPool) {
    const fallback = initialPool.filter((p) => {
      if (slot && p.categorie !== slot) return false;
      if (merchant && p.marchandSlug !== merchant) return false;
      if (excludeIds && excludeIds.has(p.id)) return false;
      if (genre === "homme" || genre === "femme") {
        if (p.genre !== genre && p.genre !== "unisexe") return false;
        const OPP = genre === "homme"
          ? /\b(women's?|womens|woman's?|womenswear|pour\s+femme|f[ée]minin)\b/i
          : /\b(men's?|mens|man's?|menswear|pour\s+homme|masculin)\b/i;
        if (OPP.test(p.nom)) return false;
      }
      const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
      if (EXCLUDE_ALWAYS.test(hay)) return false;
      if (slot === "chaussures" && EXCLUDE_SHOES_SUBTYPES.test(hay)) return false;
      if (slot === "haut" && EXCLUDE_HAUT_SUBTYPES.test(hay)) return false;
      if (slot === "veste" && EXCLUDE_VESTE_SUBTYPES.test(hay)) return false;
      if (slot === "accent" && EXCLUDE_ACCENT.test(hay)) return false;
      if (slot === "accent" && EXCLUDE_ACCENT_PATTERN.test(hay)) return false;
      /* On garde VISUAL_FORBIDDEN même en fallback (Stabbing/Skull
         restent inacceptables, ce n'est pas une question de registre). */
      if ((isMinimaliste || isClassique) && VISUAL_FORBIDDEN.test(hay)) return false;
      if (effectiveMaxPrice !== null && p.prix > effectiveMaxPrice) return false;
      return true;
    });
    if (fallback.length > 0) {
      console.log(
        `[/api/products] fallback registre activé pour slot=${slot} (target=${targetRegistre}) — ${fallback.length} produits trouvés`,
      );
      filtered = fallback;
      relaxedDimensions.push("registre");
    }
  }

  // ─── ÉTAPE 2 : scoring + tri ──────────────────────────────────────
  /* Brief 2026-06-07 « pas de mannequin, pas de photos de dos » :
     distance EFFECTIVE = ΔE couleur + pénalité d'image (ΔE-équivalent).
     Une vue de dos (+45) coule au fond du pool ; un shoot mannequin (+12)
     passe derrière un packshot de couleur comparable. La couleur reste le
     critère dominant — un packshot à mauvaise couleur ne remonte pas pour
     autant (+12 << écart couleur d'un vrai mismatch). */
  filtered.sort((a, b) => {
    // 1. Dépriorisation des accent encombrants
    if (slot === "accent") {
      const aDeprio = DEPRIORITIZE_ACCENT.test(a.nom.toLowerCase()) ? 1 : 0;
      const bDeprio = DEPRIORITIZE_ACCENT.test(b.nom.toLowerCase()) ? 1 : 0;
      if (aDeprio !== bDeprio) return aDeprio - bDeprio;
    }

    // 2. ΔE2000 + pénalité image — soit vs couleur précise demandée
    //    (?color=<hex>, cas /stylist), soit vs couleur assignée au slot
    //    (palette), soit vs paletteDistance du produit (cas sans palette).
    const aImg = imageQualityPenalty(a);
    const bImg = imageQualityPenalty(b);
    if (isValidHex && colorHex) {
      const aDist = deltaEHex(a.hex, colorHex) + aImg;
      const bDist = deltaEHex(b.hex, colorHex) + bImg;
      return aDist - bDist;
    }
    if (palette && slotTargetColor) {
      /* Sort par distance vers la couleur ASSIGNÉE à ce slot (pas
         toutes les couleurs de la palette). Force la diversité
         chromatique : haut prend la dominante, bas la secondaire,
         veste la signature, etc. */
      const aDist = distanceToSlotTarget(a.hex) + aImg;
      const bDist = distanceToSlotTarget(b.hex) + bImg;
      return aDist - bDist;
    }
    const aDist = (a.paletteDistance ?? Infinity) + aImg;
    const bDist = (b.paletteDistance ?? Infinity) + bImg;
    return aDist - bDist;
  });

  /* ─── Fix 2026-05-29 « chaussure blanche au lieu de noire » ───
     Bug client : la rotation seed POOL_SIZE=12 piochait parfois dans
     le fond du pool un produit avec ΔE très éloigné de la consigne
     (ex. chaussure blanche pour une consigne noir). Cause : aucun
     plafond ΔE, aucun garde-fou luminance. Quand le catalogue Muji
     est pauvre sur un slot/genre donné, le top-12 contenait des
     candidats trop divergents.

     Fix double :
       1. PLAFOND ΔE absolu : on rejette tout candidat avec
          ΔE > MAX_DELTA_E (60 = différence visible massive).
       2. GARDE LUMINANCE : si la consigne est sombre (L<28) on rejette
          les candidats clairs (L>62) et inversement. Empêche les
          mismatchs noir↔blanc même quand ΔE LAB est faussement bas
          (cas rare mais qui survient sur des produits aux couleurs
          neutres mal taggées).

     Fallback : si le pool valide est VIDE après ces gardes, on prend
     quand même le meilleur candidat disponible (sort par ΔE) plutôt
     que renvoyer une liste vide. Mieux vaut un mauvais match qu'aucun. */
  const MAX_DELTA_E = 60;
  /* Calcul du L de la consigne pour la garde luminance. Si pas de
     colorHex valide → on saute la garde (palette-driven, ΔE-only). */
  const targetL = isValidHex && colorHex
    ? hexToLab(colorHex.trim())[0]
    : null;

  function passesColorGuard(p: ProduitAwin): boolean {
    if (!isValidHex || !colorHex) return true; // pas de consigne couleur précise
    const dE = deltaEHex(p.hex, colorHex);
    if (dE > MAX_DELTA_E) return false;
    if (targetL !== null) {
      const [productL] = hexToLab(p.hex);
      /* Consigne sombre (noir / anthracite / marine profond) refuse clair. */
      if (targetL < 28 && productL > 62) return false;
      /* Consigne claire (blanc / crème / écru) refuse sombre. */
      if (targetL > 75 && productL < 35) return false;
    }
    return true;
  }

  const colorValid = filtered.filter(passesColorGuard);

  /* ─── Garde couleur STRICTE par slot (Trou 1 — Brief 2026-06-01) ───
     Le filtre passesColorGuard s'applique seulement quand ?color=<hex>
     est passé explicitement. Sur les appels via /ma-tenue, c'est
     slotTargetColor qui est utilisé pour le SORT — mais pas pour filtrer.
     Conséquence : un short gris (ΔE=50 vs sauge) passe et se retrouve
     en slot=bas d'une palette pastel sauge.

     Fix : on applique un filtre ΔE < SLOT_COLOR_THRESHOLD (30) par rapport
     à la couleur cible du slot QUAND on a une palette + un slot définis.
     Si aucun produit ne passe le seuil strict, on relâche à 50 puis à la
     liste complète (fail-open → Trou 1 partiellement résolu même quand le
     catalogue est pauvre sur une couleur précise). */
  const SLOT_COLOR_THRESHOLD_STRICT = 30;
  const SLOT_COLOR_THRESHOLD_RELAXED = 50;

  let filteredForOutput: typeof filtered;
  if (palette && slotTargetColor && colorValid.length > 0) {
    const strictSlot = colorValid.filter(
      (p) => deltaEHex(p.hex, slotTargetColor) < SLOT_COLOR_THRESHOLD_STRICT,
    );
    if (strictSlot.length > 0) {
      filteredForOutput = strictSlot;
    } else {
      // Relâche à 50
      const relaxedSlot = colorValid.filter(
        (p) => deltaEHex(p.hex, slotTargetColor) < SLOT_COLOR_THRESHOLD_RELAXED,
      );
      filteredForOutput = relaxedSlot.length > 0 ? relaxedSlot : colorValid;
    }
  } else {
    filteredForOutput = colorValid.length > 0 ? colorValid : filtered;
  }

  /* ─── Filtre MICRO_TYPES intra-tenue (Trou 2 — Brief 2026-06-01) ───
     Rejette les produits dont le micro-type est incompatible avec les
     pièces déjà sélectionnées dans la tenue courante.
     Ex : short déjà sélectionné → cardigan rejeté pour slot=veste.
     N'est actif que si selectedNames est transmis par le client. */
  if (selectedNames.length > 0) {
    const microFiltered = filteredForOutput.filter((p) =>
      isCompatibleWithOutfit(p.nom, selectedNames),
    );
    /* Fail-open : si le filtre micro-type vide le pool, on garde l'original
       (pas de pièce = pire que pièce imparfaite). */
    if (microFiltered.length > 0) {
      filteredForOutput = microFiltered;
    }
  }

  /* Variété par seed — brief 2026-05-28 :
     Au lieu de toujours retourner le top-1 (qui donne la MÊME tenue à
     toutes les palettes), on hash le seed et on pivote dans la fenêtre
     top-POOL_SIZE. Garde l'ordre pertinent (les meilleurs candidats au
     début) mais varie le pick selon (palette + slot + style).

     Sans seed → comportement legacy (pas de rotation).

     Maj 29/05 : rotation appliquée APRÈS le filtre couleur ci-dessus,
     donc le pool varié ne contient que des candidats couleur-valides. */
  const POOL_SIZE = 12;
  let finalList = filteredForOutput;
  if (seed && finalList.length > 1) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    const poolSize = Math.min(POOL_SIZE, finalList.length);
    const offset = Math.abs(hash) % poolSize;
    if (offset > 0) {
      const pool = finalList.slice(0, poolSize);
      const rest = finalList.slice(poolSize);
      const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
      finalList = [...rotated, ...rest];
    }
  }

  /* Fix 2026-05-31 v6 (user feedback v3 « non je suis désolé mais il
     n'y a toujours pas TBF sur le téléphone seulement MUJI peu importe
     ce que je mets ») : bias merchant AGGRESSIF. Avant : on cherchait
     un substitut non-MUJI dans top-12 avec tolérance ΔE. Maintenant :
     dès qu'un produit non-MUJI existe dans TOUT le pool valide, on le
     promeut en tête, peu importe le ΔE. La proximité couleur reste un
     critère SECONDAIRE — entre 2 candidats non-MUJI, on prend le plus
     proche en couleur. Mais entre MUJI parfait et TBF moyen, TBF gagne.

     Pourquoi ce radical ? L'user voit MUJI sur 5/5 slots malgré nos
     ajustements précédents (caps relevés, adjacence, soft cap +50%).
     Soit le ΔE MUJI est systématiquement meilleur (probable car MUJI
     a un catalogue plus dense sur les neutres), soit TBF n'existe pas
     pour cette combo couleur/genre/saison. On force le mix pour les 3
     slots non-MUJI-bias quand c'est physiquement possible.

     Diagnostic merchant log : on stocke les counts pour debug. */
  const merchantCounts: Record<string, number> = {};
  for (const p of finalList) {
    const m = (p.marque || p.marchand || "inconnu").toLowerCase();
    merchantCounts[m] = (merchantCounts[m] || 0) + 1;
  }

  if (slot && finalList.length > 1 && limit === 1) {
    const PREFER_MUJI: Record<string, boolean> = {
      haut: true,
      bas: false,
      veste: false,
      chaussures: false,
      accent: true,
    };
    const isMuji = (p: ProduitAwin) => /muji/i.test(p.marque || p.marchand || "");
    const wantsMuji = PREFER_MUJI[slot];
    const head = finalList[0];
    if (head && isMuji(head) !== wantsMuji) {
      /* Recherche AGGRESSIVE : 1ère occurrence dans TOUT le pool
         (plus de cap top-12, plus de tolérance ΔE). Si y'a un
         non-MUJI dispo, on le sort.
         Brief 2026-06-07 : on NE swap PAS vers une vue de dos. Si le
         seul candidat du bon marchand est une photo de dos, mieux vaut
         garder la tête de liste (déjà triée packshot-first) que d'imposer
         une photo de dos juste pour la diversité marchand. */
      const swapIndex = finalList.findIndex((p, i) => {
        if (i === 0) return false;
        if (isLikelyBackView(p)) return false;
        return isMuji(p) === wantsMuji;
      });
      if (swapIndex > 0) {
        const swap = finalList[swapIndex];
        finalList = [swap, ...finalList.filter((_, i) => i !== swapIndex)];
        console.log(
          `[/api/products] bias merchant slot=${slot} : swap ${head.marque} → ${swap.marque} (pool size ${finalList.length})`,
        );
      } else {
        console.log(
          `[/api/products] bias merchant slot=${slot} : aucun candidat non-MUJI dispo dans pool (${finalList.length}), merchants=${JSON.stringify(merchantCounts)}`,
        );
      }
    }
  }

  /* Brief 2026-06-01 — Proxy image : les CDNs partenaires (suitableshop.net,
     shopify.com) bloquent les requêtes depuis wada.style via hotlink protection
     (contrôle du header Referer). Solution : on passe les URLs d'image par
     /api/img qui fetche côté serveur sans Referer. imageLocal (Vercel Blob)
     n'a pas ce problème → on garde l'URL directe. */
  /* Test 2026-06-02 : cdn.suitableshop.net répond 200 sans Referer (curl).
     On retire le proxy pour Suitable FR → images chargées directement.
     Si ça casse (hotlink), on le remet. images2.productserve.com → 403 → toujours proxifié. */
  const IMG_PROXY_HOSTS = new Set([
    "images2.productserve.com",
  ]);
  function proxyImageUrl(url: string | undefined): string {
    if (!url) return "";
    try {
      const host = new URL(url).hostname;
      if (IMG_PROXY_HOSTS.has(host)) {
        return `/api/img?u=${encodeURIComponent(url)}`;
      }
    } catch {}
    return url;
  }

  /* Dédup par nom de base — supprime les doublons de même produit en
     couleurs/tailles différentes (même marque + nom de base similaire).
     Évite d'afficher 4× la "Chemise en chanvre MUJI" avec des variantes. */
  const dedupSeen = new Set<string>();
  const deduped: typeof finalList = [];
  for (const p of finalList) {
    // Normalise : retire taille/couleur/variant en fin de nom
    const baseName = (p.nom || "")
      .replace(/\s+(taille|size)\s+\S+$/i, "")
      .replace(/\s+(XS|S|M|L|XL|XXL|XXXL|W\d+|H\d+|\d{2,3}\s*cm)$/i, "")
      .replace(/\s+(noir|blanc|beige|marine|gris|rouge|bleu|vert|kaki|anthracite|écru|ivoire|olive|bordeaux|camel|sable|crème)$/i, "")
      .toLowerCase().trim();
    const key = `${(p.marque || "").toLowerCase().slice(0, 20)}-${baseName.slice(0, 40)}`;
    if (!dedupSeen.has(key)) {
      dedupSeen.add(key);
      deduped.push(p);
    }
  }

  const products: ProduitAwin[] = deduped.slice(offset, offset + limit).map((p) => ({
    ...p,
    image: p.imageLocal ? p.imageLocal : proxyImageUrl(p.image),
    largeImage: p.imageLocal ? p.imageLocal : proxyImageUrl(p.largeImage || p.image),
  }));

  return Response.json(
    {
      products,
      total: deduped.length,
      source: "kv",
      filters_applied: {
        slot, palette, genre, style, merchant,
        formal_style: isFormalStyle(style),
        /* Visibilité debug : utile pour diagnostiquer les cas où la
           garde couleur a rejeté beaucoup de produits (pool clipped). */
        color_guard_kept: colorValid.length,
        color_guard_dropped: filtered.length - colorValid.length,
        merchant_counts: merchantCounts,
        /* Brief 2026-06-01 §3 : dimensions assouplies par le composer
           pour trouver un produit. La UI peut surfacer un message
           transparent style « j'ai dû élargir aux marques classiques
           pour respecter le budget ». */
        relaxed_dimensions: relaxedDimensions,
        envie: envie || null,
        inspiration: inspiration || null,
      },
    },
    {
      headers: {
        /* Fix 2026-06-06 « rapidité » : le cache CDN avait été abaissé à
           10s pour un debug ponctuel (mai). Chaque hit rechargeait alors
           tout le catalogue KV (~1-2 Mo) + ~40 filtres → lenteur sur
           mobile et sous charge. On restaure un cache CDN sain : 5 min de
           fraîcheur + 1 h de stale-while-revalidate. Le catalogue ne change
           qu'au cron quotidien (4h), donc 5 min est largement assez frais. */
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        /* Visibilité géo (K&Ö = CH only) : le résultat dépend du pays
           visiteur → le CDN doit cacher PAR pays, sinon il sert le résultat
           filtré d'un pays à un autre. */
        "Vary": "x-vercel-ip-country",
      },
    },
  );
}
