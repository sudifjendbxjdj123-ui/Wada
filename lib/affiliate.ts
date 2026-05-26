/**
 * WADA — Affiliation Awin
 * ─────────────────────────────────────────────────────────────────────────
 * Wrapper qui transforme un lien marchand brut en lien de tracking Awin.
 *
 * Configuration (2 variables d'env, voir .env.local.example) :
 *
 *   NEXT_PUBLIC_AWIN_PUBLISHER_ID = 2879911    (ton Publisher ID Awin)
 *   AWIN_MERCHANT_IDS = {"Sézane":"12345",...}  (JSON, marques acceptées)
 *
 * Pas de variable = fonctionnement transparent : affiliate() retourne
 * l'URL d'origine. Le site fonctionne identiquement, juste sans commission.
 *
 * Pour ajouter une marque nouvellement acceptée sur Awin :
 *   1. Ouvrir Awin → Annuaire des annonceurs → cliquer la marque
 *   2. Noter le Merchant ID (un nombre 5-6 chiffres)
 *   3. Mettre à jour AWIN_MERCHANT_IDS sur Vercel (Settings → Env Vars)
 *   4. Redéployer — aucun changement de code requis
 *
 * Format Awin :
 *   https://www.awin1.com/cread.php?awinmid=<MID>&awinaffid=<PID>&p=<URL>
 * ─────────────────────────────────────────────────────────────────────── */

const AWIN_PUBLISHER_ID =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AWIN_PUBLISHER_ID) || "";

/**
 * Map des Merchant IDs Awin par marque — lue depuis l'env var AWIN_MERCHANT_IDS.
 *
 * Avantage de la version env-driven : tu rajoutes une marque acceptée sans
 * toucher au code. Sur Vercel → Settings → Env Vars → modifier la valeur
 * de AWIN_MERCHANT_IDS → redéployer. Zéro déploiement de code.
 *
 * Si le JSON est mal formé ou la variable absente, on retombe sur un dict
 * vide et `affiliate()` retourne l'URL d'origine pour tous les liens.
 */
function loadMerchantIds(): Record<string, string> {
  const raw = (typeof process !== "undefined" && process.env?.AWIN_MERCHANT_IDS) || "";
  if (!raw || raw === "{}") return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    if (typeof console !== "undefined") {
      console.warn("[affiliate] AWIN_MERCHANT_IDS n'est pas un JSON valide, ignoré");
    }
    return {};
  }
}

const merchantIds: Record<string, string> = loadMerchantIds();

/**
 * Encapsule une URL marchande dans un lien de tracking Awin.
 * Si le Publisher ID ou le Merchant ID manquent, retourne l'URL d'origine.
 *
 * @param url   URL produit/recherche brute (ex : https://www.sezane.com/...)
 * @param brand Label de la marque tel qu'utilisé dans `shopOptions` (ex : "Sézane")
 * @returns     URL Awin ou URL d'origine
 */
export function affiliate(url: string, brand: string): string {
  if (!AWIN_PUBLISHER_ID) return url;
  const mid = merchantIds[brand];
  if (!mid) return url;
  return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${AWIN_PUBLISHER_ID}&p=${encodeURIComponent(url)}`;
}

/** True si la marque a un partenariat Awin actif (Publisher ID + Merchant ID). */
export function isAffiliated(brand: string): boolean {
  return Boolean(AWIN_PUBLISHER_ID && merchantIds[brand]);
}

/** Liste plate des marques Awin actuellement actives — utile pour /admin. */
export function activeAwinMerchants(): string[] {
  if (!AWIN_PUBLISHER_ID) return [];
  return Object.keys(merchantIds);
}

/** Publisher ID Awin si configuré, sinon string vide. */
export function getAwinPublisherId(): string {
  return AWIN_PUBLISHER_ID;
}
