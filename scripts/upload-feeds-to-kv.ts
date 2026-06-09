/**
 * Upload MUJI + Suitable FR directement dans le KV Upstash.
 * Utilise la vraie lib ingestAwinCsv (même pipeline que le cron).
 *
 * Usage :
 *   npx tsx scripts/upload-feeds-to-kv.ts
 */
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { ingestAwinCsv } from "../lib/awinFeed";
import type { ProduitAwin } from "../lib/schema";
import sharp from "sharp";

/**
 * Règle ABSOLUE : jamais de mannequin.
 * Heuristique rapide : si les 4 coins de l'image ne sont pas clairs
 * (blanc ou gris très clair) → fond contextualisé → probablement mannequin.
 * Retourne true si l'image est un packshot acceptable.
 */
async function isPackshot(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WADA/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true; // fail-open : on garde l'image si fetch échoue
    const buf = Buffer.from(await res.arrayBuffer());
    const small = await sharp(buf).resize(100, 100, { fit: "fill" }).raw().toBuffer();
    const corners = [[0,0],[99,0],[0,99],[99,99]];
    let brightCorners = 0;
    for (const [x, y] of corners) {
      const idx = (y * 100 + x) * 3;
      const r = small[idx], g = small[idx+1], b = small[idx+2];
      // Fond clair = blanc, gris clair, beige
      if (r > 200 && g > 200 && b > 200) brightCorners++;
    }
    return brightCorners >= 3; // au moins 3 coins clairs = fond uniforme
  } catch {
    return true; // fail-open
  }
}

/**
 * Filtre une liste de produits : remplace l'image des mannequins par "".
 * Traite en parallèle par lots de 20 pour ne pas saturer le réseau.
 */
async function filterPackshots(products: ProduitAwin[], label: string): Promise<ProduitAwin[]> {
  console.log(`  🔍 Filtre packshot pour ${products.length} produits ${label}...`);
  const BATCH = 20;
  let filtered = 0;
  const result: ProduitAwin[] = [];
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH);
    const checks = await Promise.all(batch.map(async (p) => {
      const img = p.image || p.largeImage || "";
      if (!img) return p;
      const ok = await isPackshot(img);
      if (!ok) {
        filtered++;
        return { ...p, image: "", largeImage: "", thumb: undefined };
      }
      return p;
    }));
    result.push(...checks);
    if ((i / BATCH) % 10 === 0) process.stdout.write(`\r    ${i}/${products.length}`);
  }
  console.log(`\n  ✂️  ${filtered} images mannequin supprimées (sur ${products.length})`);
  return result;
}

const KV_URL   = "https://fit-insect-135036.upstash.io";
const KV_TOKEN = "gQAAAAAAAg98AAIgcDI0YmViZjExZDJkNGM0NmVjOTM0ODkwZWRkODFmYzU3Mw";
const CHUNK_SIZE = 900_000;

const FEEDS = [
  {
    path: "C:/Users/neman/Downloads/muji-feed.csv.gz",
    slug: "muji-france",
    label: "MUJI",
  },
  {
    path: "C:/Users/neman/Downloads/tbf-eu-feed.csv.gz",
    slug: "the-business-fashion",
    label: "The Business Fashion (EU)",
  },
  {
    path: "C:/Users/neman/Downloads/34175-78127-fr_FR-Suitable_Menswear_-_Webshop_FR.csv.gz",
    slug: "suitable-fr",
    label: "Suitable FR",
  },
  /* Brief New Era 2026-06-09 — ~25 367 casquettes. Télécharger le .csv.gz
     du flux Awin New Era dans Downloads/ puis ajuster le `path` ci-dessous.
     Le slug réel des produits est forcé à « new-era » par normalizeAwinProduct
     (peu importe le libellé marchand du flux). Le filtre packshot reste ACTIF
     (les casquettes sont des photos fond blanc → il les conserve, et écarte
     les rares photos portées). */
  {
    path: "C:/Users/neman/Downloads/19284-109521-en_FR-FR.csv.gz",
    slug: "new-era",
    label: "New Era",
  },
];

async function kvGet(key: string): Promise<unknown> {
  const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const json = await res.json() as { result?: string };
  return json.result ? JSON.parse(json.result) : null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  const res = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "text/plain" },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`KV SET ${key}: ${res.status} — ${txt.slice(0,200)}`);
  }
}

async function writeAllToKV(products: ProduitAwin[]): Promise<void> {
  const chunks: ProduitAwin[][] = [];
  let cur: ProduitAwin[] = [], sz = 0;
  for (const p of products) {
    const s = JSON.stringify(p).length + 1;
    if (sz + s > CHUNK_SIZE && cur.length > 0) { chunks.push(cur); cur = []; sz = 0; }
    cur.push(p); sz += s;
  }
  if (cur.length > 0) chunks.push(cur);

  console.log(`  ${chunks.length} chunks, ${products.length} produits total`);
  for (let i = 0; i < chunks.length; i++) {
    await kvSet(`wada:products:chunk:${i}`, chunks[i]);
    process.stdout.write(`\r  Chunk ${i+1}/${chunks.length}`);
  }
  console.log();
  await kvSet("wada:products:index", {
    chunks: chunks.length,
    total: products.length,
    updated: new Date().toISOString(),
  });
}

async function readAllFromKV(): Promise<ProduitAwin[]> {
  const index = await kvGet("wada:products:index") as { chunks?: number } | null;
  if (!index?.chunks) return [];
  const chunks = await Promise.all(
    Array.from({ length: index.chunks }, (_, i) => kvGet(`wada:products:chunk:${i}`))
  );
  return (chunks.flat() as ProduitAwin[]).filter(Boolean);
}

async function main() {
  const allNew: ProduitAwin[] = [];

  for (const feed of FEEDS) {
    console.log(`\n📦 ${feed.label} (${feed.slug})`);
    try {
      const buf = gunzipSync(readFileSync(feed.path));
      const csv = buf.toString("utf-8");
      const { products, stats } = ingestAwinCsv(csv);
      console.log(`  Parsés: ${products.length} produits (${JSON.stringify(stats)})`);
      /* Filtre packshot : actif pour MUJI et Suitable FR.
         DÉSACTIVÉ pour TBF : leur catalogue n'a que des photos éditoriales
         (pas de packshot disponible dans le feed). Le filtre supprimait
         401 images TBF → leur catalogue devenait invisible.
         On préfère afficher les images éditoriales TBF que rien du tout. */
      const skipPackshot = feed.slug === "the-business-fashion";
      const clean = skipPackshot ? products : await filterPackshots(products, feed.label);
      allNew.push(...clean);
    } catch (e) {
      console.error(`  ❌ Erreur: ${e}`);
    }
  }

  console.log(`\n📖 Lecture KV existant...`);
  const existing = await readAllFromKV();
  console.log(`  ${existing.length} produits actuels`);

  // Garde uniquement ce qui n'est pas dans les slugs qu'on réingère
  const slugsToReplace = new Set(FEEDS.map(f => f.slug));
  const retained = existing.filter(p => !slugsToReplace.has(p.marchandSlug || ""));
  console.log(`  Gardés (autres sources): ${retained.length}`);

  // Préserve imageLocal
  const prevById = new Map<string, ProduitAwin>();
  for (const p of existing) prevById.set(p.id, p);
  let reused = 0;
  for (let i = 0; i < allNew.length; i++) {
    const prev = prevById.get(allNew[i].id);
    if (prev?.imageLocal && prev.image === allNew[i].image) {
      allNew[i] = { ...allNew[i], imageLocal: prev.imageLocal };
      reused++;
    }
  }
  console.log(`  Images réutilisées: ${reused}`);

  const merged = [...retained, ...allNew];
  console.log(`\n💾 Écriture KV (${merged.length} produits)...`);
  await writeAllToKV(merged);

  console.log(`\n✅ Terminé !`);
  console.log(`  MUJI + Suitable FR: ${allNew.length}`);
  console.log(`  Autres (conservés): ${retained.length}`);
  console.log(`  Total KV: ${merged.length}`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
