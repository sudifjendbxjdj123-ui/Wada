/**
 * merchantSearch — table centrale des URLs de recherche par marchand.
 *
 * Brief 2026-05-22 : « Un lien marchand ne pointe JAMAIS vers la home du
 * marchand. » Deux niveaux :
 *   1. Idéal : URL produit exacte (deep-link fiche) — passée en argument
 *      via `productUrl` si on l'a (futur flux Awin / Google Merchant).
 *   2. Fallback : URL de recherche pré-remplie (« pull blanc » déjà saisi)
 *      construite depuis `SEARCH_TEMPLATES` ci-dessous.
 *
 * Dans les deux cas, le lien final passe par `affiliate()` (Awin) pour
 * conserver la commission.
 *
 * Pour ajouter ou corriger un marchand :
 *   1. Tester l'URL de recherche sur le site (« pull blanc » dans la barre)
 *   2. Copier le pattern exact, remplacer la valeur de la query par `{query}`
 *   3. Ajouter l'entrée ici. Aucune autre modification de code requise.
 *
 * Source de vérité unique — référencé par lib/data.ts (shopOptions) et
 * par toute autre logique qui construit un lien marchand.
 */

import { affiliate } from "./affiliate";
import { buildSearchQuery } from "./garmentSynonyms";

/* ──────────────────────────────────────────────────────────────────────
   TABLE DE CONFIG — templates de recherche par marchand
   ──────────────────────────────────────────────────────────────────────
   Clé = `MerchantKey` (slug en kebab-case, sans accents)
   Valeur = template d'URL avec `{query}` qui sera remplacé par la requête
            URL-encodée (encodeURIComponent appliqué automatiquement).

   Règle de qualité : chaque URL doit avoir été TESTÉE manuellement avec
   une vraie requête (« pull blanc ») pour vérifier qu'elle atterrit sur
   des résultats — pas sur la home. Vérifiée à la date 2026-05-22. */

export type MerchantKey =
  // Chaînes mode mainstream
  | "hm" | "zara" | "uniqlo" | "mango" | "cos" | "arket" | "weekday" | "monki" | "muji"
  // Premium FR / Europe
  | "sezane" | "rouje" | "octobre-editions" | "officine-generale" | "ami-paris"
  | "apc" | "the-frankie-shop" | "soeur" | "ba-sh" | "claudie-pierlot"
  | "sandro" | "maje" | "massimo-dutti" | "polene" | "isabel-marant"
  // Sport / sneakers
  | "nike" | "adidas" | "asics" | "new-balance" | "veja" | "y-3"
  | "salomon" | "hoka" | "puma" | "reebok" | "converse" | "vans"
  // Outerwear / outdoor
  | "patagonia" | "the-north-face" | "carhartt-wip" | "stone-island" | "barbour"
  // Chaussures de marques
  | "dr-martens" | "birkenstock" | "timberland" | "clarks" | "common-projects"
  | "tods" | "loro-piana"
  // Luxe multi-marques
  | "net-a-porter" | "mr-porter" | "mytheresa" | "matchesfashion" | "farfetch"
  | "ssense" | "luisaviaroma" | "24s"
  // Seconde main / vintage
  | "vinted" | "vestiaire-collective" | "depop" | "ebay-fr" | "1stdibs"
  | "etsy"
  // Lecture / accessoires
  | "ray-ban" | "warby-parker" | "fossil";

/** Templates testés 2026-05-22. `{query}` sera remplacé par encodeURIComponent(q). */
const SEARCH_TEMPLATES: Record<MerchantKey, string> = {
  // ─── Chaînes mode mainstream ────────────────────────────────────────
  "hm":             "https://www2.hm.com/fr_fr/search-results.html?q={query}",
  "zara":           "https://www.zara.com/fr/fr/search?searchTerm={query}",
  "uniqlo":         "https://www.uniqlo.com/fr/fr/search?q={query}",
  "mango":          "https://shop.mango.com/fr/recherche?kw={query}",
  "cos":            "https://www.cos.com/fr_eur/search.html?q={query}",
  "arket":          "https://www.arket.com/fr_eur/search-results.html?q={query}",
  "weekday":        "https://www.weekday.com/fr_eur/search.html?q={query}",
  "monki":          "https://www.monki.com/fr_eur/search.html?q={query}",
  // Muji — approuvé sur Awin (brief 2026-05-24). Recherche FR avec query param.
  // Quand le MID Muji sera ajouté à AWIN_MERCHANT_IDS, affiliate() wrappera.
  "muji":           "https://www.muji.com/fr/fr/search?q={query}",

  // ─── Premium FR / Europe ────────────────────────────────────────────
  "sezane":             "https://www.sezane.com/fr/recherche?q={query}",
  "rouje":              "https://www.rouje.com/fr/search?q={query}",
  "octobre-editions":   "https://octobre-editions.com/search?q={query}",
  "officine-generale":  "https://www.officinegenerale.com/search?q={query}",
  "ami-paris":          "https://www.amiparis.com/fr/search?q={query}",
  "apc":                "https://www.apc.fr/fr/search?q={query}",
  "the-frankie-shop":   "https://thefrankieshop.com/search?q={query}",
  "soeur":              "https://www.soeur.fr/search?q={query}",
  "ba-sh":              "https://ba-sh.com/fr/search?q={query}",
  "claudie-pierlot":    "https://fr.claudiepierlot.com/fr/recherche?q={query}",
  "sandro":             "https://fr.sandro-paris.com/fr/search?q={query}",
  "maje":               "https://fr.maje.com/fr/search?q={query}",
  "massimo-dutti":      "https://www.massimodutti.com/fr/search?q={query}",
  "polene":             "https://www.polene-paris.com/search?q={query}",
  "isabel-marant":      "https://www.isabelmarant.com/fr/search?q={query}",

  // ─── Sport / sneakers ───────────────────────────────────────────────
  "nike":               "https://www.nike.com/fr/w?q={query}",
  "adidas":             "https://www.adidas.fr/search?q={query}",
  "asics":              "https://www.asics.com/fr/fr-fr/search?q={query}",
  "new-balance":        "https://www.newbalance.fr/fr/search/?q={query}",
  "veja":               "https://www.veja-store.com/fr/search?q={query}",
  "y-3":                "https://www.y-3.com/fr-fr/search?q={query}",
  "salomon":            "https://www.salomon.com/fr-fr/search?q={query}",
  "hoka":               "https://www.hoka.com/fr/fr/search?q={query}",
  "puma":               "https://eu.puma.com/fr/fr/search?q={query}",
  "reebok":             "https://www.reebok.fr/search?q={query}",
  "converse":           "https://www.converse.com/fr/fr/search?q={query}",
  "vans":               "https://www.vans.fr/fr-fr/search?q={query}",

  // ─── Outerwear / outdoor ────────────────────────────────────────────
  "patagonia":          "https://eu.patagonia.com/fr/fr/search/?q={query}",
  "the-north-face":     "https://www.thenorthface.fr/recherche.html?q={query}",
  "carhartt-wip":       "https://www.carhartt-wip.com/fr/search?q={query}",
  "stone-island":       "https://www.stoneisland.com/fr/search?q={query}",
  "barbour":            "https://www.barbour.com/fr/search?q={query}",

  // ─── Chaussures ─────────────────────────────────────────────────────
  "dr-martens":         "https://www.drmartens.com/fr/fr/search?q={query}",
  "birkenstock":        "https://www.birkenstock.com/fr/search?q={query}",
  "timberland":         "https://www.timberland.fr/recherche?q={query}",
  "clarks":             "https://www.clarks.fr/search?q={query}",
  "common-projects":    "https://www.commonprojects.com/search?q={query}",
  "tods":               "https://www.tods.com/fr-fr/search?q={query}",
  "loro-piana":         "https://fr.loropiana.com/fr/search?q={query}",

  // ─── Luxe multi-marques ─────────────────────────────────────────────
  "net-a-porter":       "https://www.net-a-porter.com/en-fr/shop/search?keywords={query}",
  "mr-porter":          "https://www.mrporter.com/en-fr/mens/search?keywords={query}",
  "mytheresa":          "https://www.mytheresa.com/fr-fr/search?q={query}",
  "matchesfashion":     "https://www.matchesfashion.com/search?q={query}",
  "farfetch":           "https://www.farfetch.com/fr/shopping/search/items.aspx?q={query}",
  "ssense":             "https://www.ssense.com/fr-fr/search?q={query}",
  "luisaviaroma":       "https://www.luisaviaroma.com/fr-fr/search?TermKey={query}",
  "24s":                "https://www.24s.com/fr-fr/search?q={query}",

  // ─── Seconde main / vintage ─────────────────────────────────────────
  "vinted":             "https://www.vinted.fr/catalog?search_text={query}",
  "vestiaire-collective": "https://www.vestiairecollective.com/search/?q={query}",
  "depop":              "https://www.depop.com/search/?q={query}",
  "ebay-fr":            "https://www.ebay.fr/sch/i.html?_nkw={query}",
  "1stdibs":            "https://www.1stdibs.com/search/?q={query}",
  "etsy":               "https://www.etsy.com/search?q={query}",

  // ─── Lunettes / accessoires ─────────────────────────────────────────
  "ray-ban":            "https://www.ray-ban.com/france/search?q={query}",
  "warby-parker":       "https://www.warbyparker.com/search?q={query}",
  "fossil":             "https://www.fossil.com/fr-fr/search?q={query}",
};

/* ──────────────────────────────────────────────────────────────────────
   API — buildMerchantUrl
   ────────────────────────────────────────────────────────────────────── */

export interface MerchantUrlInput {
  /** Slug du marchand (clé de SEARCH_TEMPLATES). */
  brand: MerchantKey;
  /** Pièce avec ses caractéristiques pour construire la requête. */
  piece: {
    type: string;          // « pull », « jean droit », « cargo large »…
    couleurNom?: string;   // « blanc », « olive »…
    genre?: string;        // « homme », « femme », vide pour unisexe
  };
  /** Deep-link produit exact, si fourni (priorité 1 sur la recherche). */
  productUrl?: string;
  /** Label de la marque tel qu'utilisé dans Awin (« Sézane », « COS »…)
      pour le wrapping d'affiliation. */
  affiliateBrand?: string;
}

/**
 * Construit l'URL marchand finale, wrappée Awin si configuré.
 *
 *   1. Si productUrl est fourni → on l'utilise tel quel (deep-link fiche)
 *   2. Sinon → on construit la recherche depuis SEARCH_TEMPLATES[brand]
 *      en remplaçant {query} par encodeURIComponent("type couleur genre")
 *   3. On wrappe le tout dans affiliate() pour préserver la commission
 */
export function buildMerchantUrl({
  brand,
  piece,
  productUrl,
  affiliateBrand,
}: MerchantUrlInput): string {
  // 1. Deep-link produit si fourni
  let dest = productUrl;

  // 2. Sinon, recherche pré-remplie depuis le template.
  //    Brief §5 : utilise les synonymes FR/EN pour construire la requête
  //    primaire (« pull blanc homme »). Les synonymes étendus (sweater,
  //    maille…) ne sont pas utilisés ici car le marchand ne supporte pas
  //    forcément l'opérateur OR — ils servent au matching local du flux
  //    produit (lib/productMatching.ts) quand on aura le catalogue.
  if (!dest) {
    const { primary } = buildSearchQuery(piece);
    const template = SEARCH_TEMPLATES[brand];
    if (!template) {
      // Ne jamais retourner une home : on retombe sur une recherche Google
      // ciblée site:brand qui amène au moins à des résultats produits.
      return affiliate(
        `https://www.google.com/search?q=${encodeURIComponent(primary)}+site:${brand}.com`,
        affiliateBrand || brand
      );
    }
    dest = template.replace("{query}", encodeURIComponent(primary));
  }

  // 3. Wrappe via Awin pour la commission
  return affiliate(dest, affiliateBrand || brand);
}

/**
 * Variante simple : construit une URL de recherche depuis (brand, queryString)
 * sans encodage particulier. Pratique pour les cas legacy.
 */
export function buildSearchUrl(brand: MerchantKey, query: string): string {
  const template = SEARCH_TEMPLATES[brand];
  if (!template) {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}+site:${brand}.com`;
  }
  return template.replace("{query}", encodeURIComponent(query));
}

/** Liste plate des marchands disponibles — utile pour debug/admin. */
export function listMerchants(): MerchantKey[] {
  return Object.keys(SEARCH_TEMPLATES) as MerchantKey[];
}

/** Test rapide : assert qu'AUCUN template ne pointe vers une home (pas de query string). */
export function assertNoHomepageUrls(): { ok: boolean; offenders: MerchantKey[] } {
  const offenders: MerchantKey[] = [];
  for (const [key, tpl] of Object.entries(SEARCH_TEMPLATES) as Array<[MerchantKey, string]>) {
    // Une URL "homepage" n'aurait pas de {query} marker
    if (!tpl.includes("{query}")) offenders.push(key);
  }
  return { ok: offenders.length === 0, offenders };
}
