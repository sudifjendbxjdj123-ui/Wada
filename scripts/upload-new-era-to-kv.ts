/**
 * upload-new-era-to-kv.ts — chargement one-shot du flux New Era dans le KV.
 *
 * Brief New Era 2026-06-09. ~25 367 lignes → ~5 500 cartes après dédup
 * (modèle × couleur). Réutilise la VRAIE lib ingestAwinCsv (mêmes règles
 * que le cron) + readAllProducts/writeAllProducts (mêmes clés KV
 * `wada:products:meta` + `chunk:N`).
 *
 * IMPORTANT — ne touche QUE New Era : on lit le catalogue existant, on
 * retire les éventuels produits slug=new-era, on ré-ajoute le flux frais,
 * et on préserve intégralement MUJI / TBF / Suitable.
 *
 * Filtre packshot : SKIP pour New Era (comme TBF). Les images résolues
 * pointent sur les rendus Shopify « _3QL » (produit seul sur fond blanc,
 * pas de mannequin) → conformes à la règle « jamais de mannequin ». Éviter
 * 5 500 fetches réseau fragiles.
 *
 * Secrets : KV_REST_API_URL + KV_REST_API_TOKEN lus depuis .env.local
 * (jamais hardcodés). L'URL du flux Awin n'est PAS utilisée ici (on lit le
 * .csv.gz déjà téléchargé) → aucune clé API en jeu.
 *
 * Usage :
 *   npx tsx scripts/upload-new-era-to-kv.ts
 */
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

/* Charge .env.local dans process.env (tsx ne le fait pas tout seul). */
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

const FEED_PATH = "C:/Users/neman/Downloads/19284-109521-en_FR-FR.csv.gz";

async function main() {
  const { ingestAwinCsv } = await import("../lib/awinFeed");
  const { readAllProducts, writeAllProducts } = await import("../lib/productStore");

  console.log("📦 New Era — lecture du flux", FEED_PATH);
  const csv = gunzipSync(readFileSync(FEED_PATH)).toString("utf-8");
  const { products: fresh, stats } = ingestAwinCsv(csv);
  console.log(`  Parsés: ${fresh.length} cartes (${JSON.stringify(stats)})`);

  const byCat: Record<string, number> = {};
  for (const p of fresh) byCat[p.categorie] = (byCat[p.categorie] || 0) + 1;
  console.log("  Par catégorie:", byCat);

  const slugs = new Set(fresh.map((p) => p.marchandSlug));
  if (slugs.size !== 1 || !slugs.has("new-era")) {
    throw new Error(`Slugs inattendus dans le flux New Era: ${[...slugs].join(", ")} — abandon (sécurité).`);
  }

  console.log("\n📖 Lecture du catalogue KV existant…");
  const existing = await readAllProducts();
  console.log(`  ${existing.length} produits actuels`);
  if (existing.length === 0) {
    throw new Error("KV vide — abandon (on refuse d'écraser un catalogue vide par erreur).");
  }

  // Préserve TOUT sauf un éventuel ancien new-era (réimport idempotent).
  const retained = existing.filter((p) => p.marchandSlug !== "new-era");
  console.log(`  Conservés (MUJI/TBF/Suitable…): ${retained.length}`);

  // Préserve imageLocal déjà mirrorés pour les New Era réimportés (idempotence).
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
  console.log(`\n💾 Écriture KV (${merged.length} produits = ${retained.length} + ${fresh.length} New Era)…`);
  const res = await writeAllProducts(merged);
  if (!res.ok) {
    console.error("❌ Échec écriture KV:", res.errors);
    process.exit(1);
  }
  console.log(`\n✅ Terminé : ${res.chunks} chunks, ${(res.total_bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   New Era ajouté: ${fresh.length} | Total KV: ${merged.length}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
