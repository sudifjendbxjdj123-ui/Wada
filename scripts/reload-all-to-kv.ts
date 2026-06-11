/**
 * reload-all-to-kv.ts — RECONSTRUCTION COMPLÈTE du catalogue KV depuis les
 * flux locaux (récupération d'incident 2026-06-10).
 *
 * Contexte : le cron quotidien a tronqué le catalogue (Suitable 18k→2,8k,
 * New Era 5,5k→0). Ce script réingère TOUS les flux depuis les .csv.gz
 * locaux et réécrit le KV proprement (schéma meta + chunks), remplaçant
 * intégralement le catalogue par un jeu complet et cohérent.
 *
 * Secrets KV : lus depuis .env.local. Pas de filtre packshot (comme le cron).
 *
 * Usage : NODE_OPTIONS=--max-old-space-size=8192 npx tsx scripts/reload-all-to-kv.ts
 */
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  try {
    for (const line of readFileSync(".env.local", "utf-8").split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch { console.warn("⚠️  .env.local introuvable"); }
}
loadEnvLocal();

const FEEDS: Array<{ label: string; path: string; expectSlug: string }> = [
  { label: "MUJI",      path: "C:/Users/neman/Downloads/muji-feed.csv.gz", expectSlug: "muji-france" },
  { label: "TBF",       path: "C:/Users/neman/Downloads/tbf-eu-feed.csv.gz", expectSlug: "the-business-fashion" },
  { label: "Suitable",  path: "C:/Users/neman/Downloads/34175-78127-fr_FR-Suitable_Menswear_-_Webshop_FR.csv.gz", expectSlug: "suitable-fr" },
  { label: "New Era",   path: "C:/Users/neman/Downloads/19284-109521-en_FR-FR.csv.gz", expectSlug: "new-era" },
  { label: "K&Ö",       path: "C:/Users/neman/Downloads/22142-51707-de_CH-Kastner_____hler_Standard_Produktdatenfeed_CH.csv.gz", expectSlug: "kastner-ohler" },
];

async function main() {
  const { ingestAwinCsv } = await import("../lib/awinFeed");
  const { readAllProducts, writeAllProducts } = await import("../lib/productStore");

  const all: import("../lib/schema").ProduitAwin[] = [];
  const byMerchant: Record<string, number> = {};

  for (const feed of FEEDS) {
    process.stdout.write(`\n📦 ${feed.label} … `);
    try {
      const csv = gunzipSync(readFileSync(feed.path)).toString("utf-8");
      const { products } = ingestAwinCsv(csv);
      // garde-fou : on s'attend à un seul slug par flux
      for (const p of products) byMerchant[p.marchandSlug || "?"] = (byMerchant[p.marchandSlug || "?"] || 0) + 1;
      all.push(...products);
      console.log(`${products.length} cartes`);
    } catch (e) {
      console.error(`❌ ${e instanceof Error ? e.message : e}`);
      throw new Error(`Flux ${feed.label} illisible — on ABANDONNE pour ne pas écrire un catalogue incomplet.`);
    }
  }

  console.log("\nPar marchand:", byMerchant);
  console.log(`Total à écrire: ${all.length}`);

  // Sécurité : on refuse d'écrire un catalogue manifestement incomplet.
  if (all.length < 50000) {
    throw new Error(`Total ${all.length} < 50000 — suspect, on n'écrit PAS.`);
  }

  // Lecture de l'existant pour préserver les imageLocal déjà mirrorés.
  console.log("\n📖 Lecture existant (préserve imageLocal)…");
  const prev = await readAllProducts();
  const prevById = new Map(prev.map((p) => [p.id, p]));
  let reused = 0;
  for (let i = 0; i < all.length; i++) {
    const pr = prevById.get(all[i].id);
    if (pr?.imageLocal && pr.image === all[i].image) { all[i] = { ...all[i], imageLocal: pr.imageLocal }; reused++; }
  }
  console.log(`  imageLocal réutilisés: ${reused}`);

  console.log(`\n💾 Écriture KV (${all.length} produits)…`);
  const res = await writeAllProducts(all);
  if (!res.ok) { console.error("❌ Échec:", res.errors); process.exit(1); }
  console.log(`\n✅ Terminé : ${res.chunks} chunks, ${(res.total_bytes / 1024 / 1024).toFixed(1)} MB, ${all.length} produits`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
