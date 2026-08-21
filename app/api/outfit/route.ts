/**
 * POST /api/outfit
 *
 * Brief 2026-06-11 (« attente trop longue ») — ENDPOINT TENUE UNIQUE.
 *
 * Contexte : la page /ma-tenue montait 5 cartes qui lançaient 5 requêtes
 * /api/products SIMULTANÉES. En production serverless, ces 5 requêtes
 * tombent sur des instances FROIDES distinctes ; chacune paie un cold start
 * (~5s : boot + lecture KV des ~350 chunks) → mur ~5–6s, cartes qui
 * apparaissent une par une.
 *
 * Ici : UNE seule requête → UNE instance → UN cold start → on lit le
 * catalogue une fois et on compose les 5 slots dans la foulée. Pour ne RIEN
 * changer à la logique de matching (battle-tested, des dizaines de briefs),
 * on RÉUTILISE le handler GET de /api/products en interne (in-process, pas
 * de HTTP) une fois par slot. Le pool de base géo+stock+slot est caché
 * (getBasePool, 60s) → seul le premier slot paie la lecture, les suivants
 * sont chauds. On accumule selectedNames + excludeIds de façon SÉQUENTIELLE
 * (dans l'ordre de composition) — plus déterministe que l'accumulation
 * « eventually consistent » côté client d'avant.
 *
 * Body JSON :
 *   {
 *     slots: [{ slot, color?, seed?, tierCap? }],   // ordre de composition (slot ancre exclu)
 *     palette?, genre?, style?, season?, occasion?, envie?,
 *     anchorNames?: string[]                          // types déjà « portés » (la pièce scannée)
 *   }
 * Réponse : { slots: [{ slot, product }] }  (product = produit formaté /api/products, ou null)
 */
import { GET as productsGET } from "../products/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SlotSpec = { slot: string; color?: string; seed?: string; tierCap?: number };
type OutfitBody = {
  slots?: SlotSpec[];
  palette?: string;
  genre?: string;
  style?: string;
  season?: string;
  occasion?: string;
  envie?: string;
  /* Ajout 2026-08-21 — questionnaire /palette/[number] : plafond de prix par
     pièce et exclusions (« une chose à éviter »). Relayés tels quels. */
  maxPrice?: string;
  exclude?: string;
  anchorNames?: string[];
};

const SLOT_KEYS = new Set(["haut", "bas", "veste", "chaussures", "accent"]);

/* Mêmes étages de relâchement que l'ancien client (useMujiProduct) : si la
   requête stricte ne renvoie rien, on retire d'abord occasion/season/envie/
   selectedNames, puis aussi style. Garantit qu'un slot n'est jamais vide
   quand un produit cohérent existe à contraintes assouplies. */
const RELAX_STAGES: string[][] = [
  ["occasion", "season", "envie", "selectedNames"],
  ["occasion", "season", "envie", "selectedNames", "style"],
];

export async function POST(req: Request) {
  let body: OutfitBody;
  try {
    body = (await req.json()) as OutfitBody;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const slots = Array.isArray(body.slots) ? body.slots.filter((s) => s && SLOT_KEYS.has(s.slot)) : [];
  if (slots.length === 0) {
    return Response.json({ slots: [] });
  }

  /* Paramètres partagés à tous les slots (identiques à ce que chaque carte
     passait individuellement). */
  const shared: Record<string, string> = {};
  if (body.palette) shared.palette = body.palette;
  if (body.genre) shared.genre = body.genre;
  if (body.style) shared.style = body.style;
  if (body.season) shared.season = body.season;
  if (body.occasion) shared.occasion = body.occasion;
  if (body.envie) shared.envie = body.envie;
  /* Ajout 2026-08-21 : budget plafond et exclusions du questionnaire
     (/palette/[number]). Relayés tels quels vers /api/products, qui les
     interprète — cet endpoint ne fait que passer-plat. */
  if (body.maxPrice) shared.maxPrice = body.maxPrice;
  if (body.exclude) shared.exclude = body.exclude;

  /* Accumulateurs séquentiels — cohérence intra-tenue + dédup produit. */
  const selectedNames: string[] = Array.isArray(body.anchorNames)
    ? body.anchorNames.filter((n) => typeof n === "string" && n.trim())
    : [];
  const excludeIds: string[] = [];

  /* Appelle le handler GET de /api/products en interne pour un jeu de params.
     On forwarde les headers d'origine (x-vercel-ip-country) pour que la
     visibilité géo (K&Ö = CH only) soit identique à un appel direct. */
  async function callProducts(sp: URLSearchParams) {
    const internalReq = new Request(`https://internal/api/products?${sp.toString()}`, {
      headers: req.headers,
    });
    const res = await productsGET(internalReq);
    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") {
      console.error(`[/api/outfit] Invalid products API response:`, data);
      return null;
    }
    const dataObj = data as Record<string, unknown>;
    if (!Array.isArray(dataObj.products)) {
      console.error(`[/api/outfit] Invalid products API response:`, data);
      return null;
    }
    return (dataObj.products[0] as Record<string, unknown> | undefined) || null;
  }

  const results: Array<{ slot: string; product: Record<string, unknown> | null }> = [];

  for (const s of slots) {
    const base = new URLSearchParams({ slot: s.slot, limit: "1", ...shared });
    if (s.color) base.set("color", s.color);
    if (s.seed) base.set("seed", s.seed);
    if (typeof s.tierCap === "number" && s.tierCap > 0) base.set("tierCap", String(Math.round(s.tierCap)));
    if (selectedNames.length) {
      base.set("selectedNames", selectedNames.map((n) => encodeURIComponent(n)).join("|"));
    }
    if (excludeIds.length) base.set("excludeIds", excludeIds.join(","));

    let product = await callProducts(base);

    // Relâchement progressif si le slot ne renvoie rien (parité avec l'ancien client).
    if (!product) {
      for (const drop of RELAX_STAGES) {
        const sp = new URLSearchParams(base);
        for (const k of drop) sp.delete(k);
        product = await callProducts(sp);
        if (product) break;
      }
    }

    results.push({ slot: s.slot, product });

    if (product) {
      const type = typeof product.type === "string" && product.type
        ? product.type
        : typeof product.nom === "string" ? product.nom : "";
      if (type) selectedNames.push(type);
      const id = product.id as string | undefined;
      if (id) excludeIds.push(id);
    }
  }

  return Response.json(
    { slots: results },
    {
      headers: {
        /* Même politique CDN que /api/products : 5 min frais + 1 h SWR, varié
           par pays (la sélection dépend de la visibilité géo K&Ö). La réponse
           varie aussi avec le body POST — le CDN ne cache pas les POST par
           défaut, donc c'est surtout indicatif ; la vraie économie est le cold
           start unique. */
        "Cache-Control": "no-store",
        "Vary": "x-vercel-ip-country",
      },
    },
  );
}
