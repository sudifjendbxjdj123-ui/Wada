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
import { deltaEHex } from "@/lib/colorDistance";

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

/** Sacs volumineux/sport — pour l'accent on dé-priorise sans exclure. */
const DEPRIORITIZE_ACCENT = /\b(sac\s+(boston|de\s+sport|de\s+voyage|polochon)|sac\s+banane|sac\s+à\s+dos)/i;

/** Brief 2026-05-26 « IA pas optimale » verbatim : on voyait sortir
 *  « Parapluie compact pliable » ou « Bob en sergé de coton » sur le
 *  slot accent d'une tenue de sortie — pas du tout un accent de style.
 *  Exclusion stricte des produits utilitaires/fonctionnels pour ACCENT.
 *  Ces produits restent disponibles ailleurs (catalogue complet) mais
 *  ne sortent JAMAIS comme accessoire de tenue. */
const EXCLUDE_ACCENT = /\b(parapluie|umbrella|serviette|towel|gant(s)?\s+(de\s+ski|de\s+pluie)|cagoule|tour\s+de\s+cou|masque|porte[-\s]?cl[ée]|trousse|étui|protection|housse|sac\s+(à\s+linge|de\s+rangement)|jet|bouteille|gourde|stylo|carnet)/i;

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
const EXCLUDE_FORMAL = /\b(surv.tement|jogging|sweat\s*à?\s*capuche|à\s+capuchon|à\s+capuche|capuchon|hoodie|pyjama|sac\s+(boston|de\s+sport|de\s+voyage)|pantoufle|mule|chausson|claquette|tongs?|crocs|sandales?|deperlant|d.perlant|ripstop)/i;

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
  let filtered = catalog.filter((p) => p.enStock);

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
    /* Brief 2026-05-26 « IA pas optimale » : le slot accent ne doit JAMAIS
       renvoyer d'objet utilitaire (parapluie, gants ski, masque, porte-clé…).
       Le screenshot client montrait « Parapluie compact pliable MUJI » et
       « Bob en sergé de coton » sur l'accent d'une tenue de sortie — ridicule.
       Maintenant : un parapluie sort du catalogue accessoires côté Awin
       mais ne peut PLUS sortir comme accent de tenue. */
    if (slot === "accent" && EXCLUDE_ACCENT.test(hay)) return false;
    return true;
  });

  // Brief §2 : exclusions par registre (formal = pas de pieces casual)
  if (isFormalStyle(style)) {
    filtered = filtered.filter((p) => {
      const hay = `${p.nom} ${p.description || ""}`.toLowerCase();
      return !EXCLUDE_FORMAL.test(hay);
    });
  }

  // Recherche full-text (AND sur tokens)
  if (q && q.trim()) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    filtered = filtered.filter((p) => {
      const hay = `${p.nom} ${p.description || ""} ${p.couleurNom || ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }

  // ─── ÉTAPE 2 : scoring + tri ──────────────────────────────────────
  // Brief : type → registre → genre déjà filtrés. ΔE est LE DERNIER tri.
  // Bonus : on dé-priorise (sans exclure) les pièces accent encombrantes.
  filtered.sort((a, b) => {
    // 1. Match palette strict en tête (si palette passée)
    if (palette) {
      const aPaletteMatch = a.paletteRef === palette ? 0 : 1;
      const bPaletteMatch = b.paletteRef === palette ? 0 : 1;
      if (aPaletteMatch !== bPaletteMatch) return aPaletteMatch - bPaletteMatch;
    }

    // 2. Dépriorisation des accent encombrants
    if (slot === "accent") {
      const aDeprio = DEPRIORITIZE_ACCENT.test(a.nom.toLowerCase()) ? 1 : 0;
      const bDeprio = DEPRIORITIZE_ACCENT.test(b.nom.toLowerCase()) ? 1 : 0;
      if (aDeprio !== bDeprio) return aDeprio - bDeprio;
    }

    // 3. ΔE2000 — soit vs la couleur précise demandée (?color=<hex>,
    //    cas /stylist), soit vs la palette de référence du produit
    //    (paletteDistance, cas /ma-tenue).
    if (isValidHex && colorHex) {
      const aDist = deltaEHex(a.hex, colorHex);
      const bDist = deltaEHex(b.hex, colorHex);
      return aDist - bDist;
    }
    const aDist = a.paletteDistance ?? Infinity;
    const bDist = b.paletteDistance ?? Infinity;
    return aDist - bDist;
  });

  /* Variété par seed — brief 2026-05-28 :
     Au lieu de toujours retourner le top-1 (qui donne la MÊME tenue à
     toutes les palettes), on hash le seed et on pivote dans la fenêtre
     top-POOL_SIZE. Garde l'ordre pertinent (les meilleurs candidats au
     début) mais varie le pick selon (palette + slot + style).

     Algo :
       - Pool = top 12 candidats triés
       - Offset = (hash(seed) modulo pool.length)
       - On rotate le pool : pool[offset..] + pool[..offset]
       - On garde le sort relatif pour les positions suivantes du pool
       - slice(0, limit) sur le pool rotaté

     Sans seed → comportement legacy (pas de rotation). */
  const POOL_SIZE = 12;
  if (seed && filtered.length > 1) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    const poolSize = Math.min(POOL_SIZE, filtered.length);
    const offset = Math.abs(hash) % poolSize;
    if (offset > 0) {
      const pool = filtered.slice(0, poolSize);
      const rest = filtered.slice(poolSize);
      const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
      filtered = [...rotated, ...rest];
    }
  }

  const products: ProduitAwin[] = filtered.slice(0, limit);

  return Response.json(
    {
      products,
      total: filtered.length,
      source: "kv",
      filters_applied: {
        slot, palette, genre, style, merchant,
        formal_style: isFormalStyle(style),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
