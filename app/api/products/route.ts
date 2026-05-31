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
import type { ProduitAwin } from "@/lib/schema";
import { deltaEHex, hexToLab } from "@/lib/colorDistance";
import { dictionary } from "@/lib/data";
import { styleToRegistre, brandToRegistreOrFallback } from "@/lib/brandRegistre";
import { detectSeason, isSeasonCompatible } from "@/lib/seasonDetect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 8;

/* ──────────────────────────────────────────────────────────────────────
   PATTERNS D'EXCLUSION par slot et par registre — brief §1-2
   ────────────────────────────────────────────────────────────────────── */

/** Sous-types « chaussures » qu'on NE veut PAS dans une tenue de ville :
 *  pantoufles, mules, chaussons, claquettes d'intérieur. */
const EXCLUDE_SHOES_SUBTYPES = /\b(pantoufle|mule|chausson|slipper|sandales?\s+d['']int|claquette)/i;

/** Le slot « haut » ne doit pas renvoyer de robes ni de combinaisons
 *  (on n'a pas de slot dédié robe pour l'instant). */
const EXCLUDE_HAUT_SUBTYPES = /\b(robe[\s-]*chemise|robe[\s-]*top|robe\s+en|robe\s+à|combinaison|jumpsuit|salopette)/i;

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
const EXCLUDE_VESTE_SUBTYPES = /\b(shirt[\s-]?jacket|overshirt|chemise[\s-]?veste|chemise\s+\w+\s+manche|sleeveless|sans\s+manches?|cotton\s+vest|tank[\s-]?(top|vest)|cami(sole)?|d[ée]bardeur|undershirt|under[\s-]?vest|sous[\s-]?v[êe]tement|gilet\s+sans\s+manches?|waistcoat)/i;

/** Sacs volumineux/sport — pour l'accent on dé-priorise sans exclure. */
const DEPRIORITIZE_ACCENT = /\b(sac\s+(boston|de\s+sport|de\s+voyage|polochon)|sac\s+banane|sac\s+à\s+dos)/i;

/** Brief 2026-05-26 « IA pas optimale » verbatim : on voyait sortir
 *  « Parapluie compact pliable » ou « Bob en sergé de coton » sur le
 *  slot accent d'une tenue de sortie — pas du tout un accent de style.
 *  Exclusion stricte des produits utilitaires/fonctionnels pour ACCENT.
 *  Ces produits restent disponibles ailleurs (catalogue complet) mais
 *  ne sortent JAMAIS comme accessoire de tenue. */
const EXCLUDE_ACCENT = /\b(parapluie|umbrella|serviette|towel|gant(s)?\s+(de\s+ski|de\s+pluie)|cagoule|tour\s+de\s+cou|masque|porte[-\s]?cl[ée]|trousse|étui|protection|housse|sac\s+(à\s+linge|de\s+rangement)|jet|bouteille|gourde|stylo|carnet)/i;

/** Brief 2026-05-30 — accent à motifs RETIRÉ.
 *  Cas client : sur palette Encre/Noyer/Os (neutres sobres), un Burberry
 *  duffle bag "check-pattern" est ressorti — visuellement carreaux verts
 *  sapin + crème + noir + jaune moutarde, donc 4 couleurs imprévues
 *  hors palette. Notre matching couleur ne sait pas analyser les motifs.
 *  Solution : exclure les produits à pattern explicite du slot accent. */
const EXCLUDE_ACCENT_PATTERN = /\b(check[\s-]?pattern|checked|tartan|plaid|stripe[ds]?|striped|printed|graphic|paisley|floral|camouflage|leopard|zebra)\b/i;

/** Pyjama/lingerie/maillot de bain — exclus partout. */
const EXCLUDE_ALWAYS = /\b(pyjama|peignoir|short\s+de\s+bain|maillot\s+de\s+bain|sous[\s-]?v.tement|bain)/i;

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
  const limitRaw = parseInt(url.searchParams.get("limit") || "", 10);
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const catalog = await readAllProducts();
  if (catalog.length === 0) {
    return Response.json({ products: [], total: 0, source: "empty" });
  }

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
  let filtered = catalog.filter((p) => {
    if (!p.enStock) return false;
    const imageUrl = p.imageLocal || p.largeImage || p.image || "";
    if (!imageUrl || imageUrl === "-") return false;
    if (/noimage\.(gif|png|jpe?g|webp)/i.test(imageUrl)) return false;
    /* Bug client 2026-05-30 : URL deep-link en mode preview Shopify
       (draft non publié) → 404 publique. Le pclick.php Awin résout
       côté serveur vers shopifypreview.com qu'on peut détecter à
       l'inverse via le champ image (cdn.shopify.com hash distinctif)
       ou plus précisément via la deep-link finale. Comme aw_deep_link
       passe par awin1.com (redirection serveur), on ne peut pas
       détecter la cible finale sans hit HTTP. À DÉFAUT on regarde si
       l'image hash contient un pattern de preview Shopify (`*.shopify
       preview.com`) — rare mais sentinelle utile. */
    if (/shopifypreview\.com/i.test(imageUrl) || /shopifypreview\.com/i.test(p.urlProduit || "")) return false;
    return true;
  });

  // Brief §1 : strict slot match
  if (slot) filtered = filtered.filter((p) => p.categorie === slot);
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
     (lib/brandRegistre.brandToRegistreOrFallback). */
  const targetRegistre = styleToRegistre(style);
  if (targetRegistre) {
    filtered = filtered.filter((p) => {
      const productRegistre = p.brandRegistre || brandToRegistreOrFallback(p.marque || p.marchand);
      return productRegistre === targetRegistre;
    });
  }

  /* Fix 2026-05-31 (user screenshot « Strong Will T-shirt » sur tenue
     Minimal) : quand style = Minimaliste, on EXCLUT en plus tout produit
     avec un graphique voyant / logo XL / texte imprimé / motif visible.
     Le test : EXCLUDE_ACCENT_PATTERN s'applique à TOUS les slots (pas
     juste accent). En plus, on exclut explicitement les noms contenant
     "graphic" / "print" / "logo" / "embroider" / "appliqué" / texte slogan. */
  const isMinimaliste = (style || "").toLowerCase().includes("minimal");
  if (isMinimaliste) {
    const MINIMAL_FORBIDDEN = /\b(graphic|graphique|print(ed)?|imprim[ée]e?|logo\s+(t-shirt|tee|sweat)|big\s+logo|all[\s-]?over|patch(work)?|embroider|broderie|appliqu[ée]|slogan|tag(line)?|patterned|motif)/i;
    filtered = filtered.filter((p) => {
      const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
      if (EXCLUDE_ACCENT_PATTERN.test(hay)) return false;
      if (MINIMAL_FORBIDDEN.test(hay)) return false;
      return true;
    });
  }

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
  const REGISTRE_CAP: Record<string, number> = {
    minimaliste: 700,
    streetwear: 400,
    decontracte: 250,
  };
  const registreCap = targetRegistre ? REGISTRE_CAP[targetRegistre] : null;
  const effectiveMaxPrice = maxPrice ?? registreCap ?? null;
  if (effectiveMaxPrice !== null) {
    filtered = filtered.filter((p) => p.prix <= effectiveMaxPrice);
  }

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

  // ─── ÉTAPE 2 : scoring + tri ──────────────────────────────────────
  filtered.sort((a, b) => {
    // 1. Dépriorisation des accent encombrants
    if (slot === "accent") {
      const aDeprio = DEPRIORITIZE_ACCENT.test(a.nom.toLowerCase()) ? 1 : 0;
      const bDeprio = DEPRIORITIZE_ACCENT.test(b.nom.toLowerCase()) ? 1 : 0;
      if (aDeprio !== bDeprio) return aDeprio - bDeprio;
    }

    // 2. ΔE2000 — soit vs couleur précise demandée (?color=<hex>,
    //    cas /stylist), soit vs min(couleurs de la palette demandée),
    //    soit vs paletteDistance du produit (cas sans palette).
    if (isValidHex && colorHex) {
      const aDist = deltaEHex(a.hex, colorHex);
      const bDist = deltaEHex(b.hex, colorHex);
      return aDist - bDist;
    }
    if (palette && slotTargetColor) {
      /* Sort par distance vers la couleur ASSIGNÉE à ce slot (pas
         toutes les couleurs de la palette). Force la diversité
         chromatique : haut prend la dominante, bas la secondaire,
         veste la signature, etc. */
      const aDist = distanceToSlotTarget(a.hex);
      const bDist = distanceToSlotTarget(b.hex);
      return aDist - bDist;
    }
    const aDist = a.paletteDistance ?? Infinity;
    const bDist = b.paletteDistance ?? Infinity;
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
  const filteredForOutput = colorValid.length > 0 ? colorValid : filtered;

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

  const products: ProduitAwin[] = finalList.slice(0, limit);

  return Response.json(
    {
      products,
      total: finalList.length,
      source: "kv",
      filters_applied: {
        slot, palette, genre, style, merchant,
        formal_style: isFormalStyle(style),
        /* Visibilité debug : utile pour diagnostiquer les cas où la
           garde couleur a rejeté beaucoup de produits (pool clipped). */
        color_guard_kept: colorValid.length,
        color_guard_dropped: filtered.length - colorValid.length,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
