/**
 * upload-ko-to-kv.ts — chargement one-shot du flux Kastner & Öhler (K&Ö) dans le KV.
 *
 * Brief K&Ö 2026-06-09. 76 317 lignes → ~38 600 cartes après filtrage
 * (is_for_sale=1, hors beauté/enfant/lingerie/bain) + dédup. Réutilise la
 * VRAIE lib ingestAwinCsv (mêmes règles que le cron) + readAllProducts/
 * writeAllProducts (mêmes clés KV `wada:products:meta` + `chunk:N`).
 *
 * Ne touche QUE K&Ö : préserve MUJI / TBF / Suitable / New Era.
 *
 * Filtre packshot : SKIP (décision user « tout garder » — K&Ö est un grand
 * magasin, ~40-50% de photos portées ; filtrer perdrait la moitié du
 * catalogue). On garde l'image dispo, comme pour TBF.
 *
 * Spécificités gérées dans normalizeAwinProduct : allemand (catégories,
 * couleurs, genre Herren/Damen), CHF→EUR, exclusion beauté/enfant.
 *
 * Mémoire : le flux est gros (76k lignes × 48 colonnes) → lancer avec un tas
 * augmenté :
 *   NODE_OPTIONS=--max-old-space-size=8192 npx tsx scripts/upload-ko-to-kv.ts
 *
 * Secrets : KV_REST_API_URL + KV_REST_API_TOKEN lus depuis .env.local.
 * L'URL du flux Awin n'est PAS utilisée ici (.csv.gz déjà téléchargé).
 */
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    console.warn("⚠️  .env.local introuvable — on compte sur l'environnement.");
  }
}
loadEnvLocal();

const FEED_PATH = "C:/Users/neman/Downloads/22142-51707-de_CH-Kastner_____hler_Standard_Produktdatenfeed_CH.csv.gz";
const SLUG = "kastner-ohler";

async function main() {
  const { ingestAwinCsv } = await import("../lib/awinFeed");
  const { readAllProducts, writeAllProducts } = await import("../lib/productStore");

  console.log("📦 K&Ö — lecture du flux", FEED_PATH);
  const csv = gunzipSync(readFileSync(FEED_PATH)).toString("utf-8");
  const { products: fresh, stats } = ingestAwinCsv(csv);
  console.log(`  Parsés: ${fresh.length} cartes (${JSON.stringify(stats)})`);

  const byCat: Record<string, number> = {};
  for (const p of fresh) byCat[p.categorie] = (byCat[p.categorie] || 0) + 1;
  console.log("  Par catégorie:", byCat);

  const slugs = new Set(fresh.map((p) => p.marchandSlug));
  if (slugs.size !== 1 || !slugs.has(SLUG)) {
    throw new Error(`Slugs inattendus dans le flux K&Ö: ${[...slugs].join(", ")} — abandon (sécurité).`);
  }

  console.log("\n📖 Lecture du catalogue KV existant…");
  const existing = await readAllProducts();
  console.log(`  ${existing.length} produits actuels`);
  if (existing.length === 0) {
    throw new Error("KV vide — abandon (on refuse d'écraser un catalogue vide par erreur).");
  }

  const retained = existing.filter((p) => p.marchandSlug !== SLUG);
  console.log(`  Conservés (autres marchands): ${retained.length}`);

  // Préserve imageLocal déjà mirrorés pour les K&Ö réimportés (idempotence).
  const prevById = new Map(existing.map((p) => [p.id, p]));
  let reused = 0;
  for (let i = 0; i < fresh.length; i++) {
    const prev = prevById.get(fresh[i].id);
    if (prev?.imageLocal && prev.image === fresh[i].image) {
      fresh[i] = { ...fresh[i], imageLocal: prev.imageLocal };
      reused++;
    }
  }
  if (reused) console.log(`  Images réutilisées: ${reused}`);

  const merged = [...retained, ...fresh];
  console.log(`\n💾 Écriture KV (${merged.length} produits = ${retained.length} + ${fresh.length} K&Ö)…`);
  const res = await writeAllProducts(merged);
  if (!res.ok) {
    console.error("❌ Échec écriture KV:", res.errors);
    process.exit(1);
  }
  console.log(`\n✅ Terminé : ${res.chunks} chunks, ${(res.total_bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   K&Ö ajouté: ${fresh.length} | Total KV: ${merged.length}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
