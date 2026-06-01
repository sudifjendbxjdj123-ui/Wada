/**
 * POST /api/cron/ingest-csv
 *
 * Endpoint one-shot : ingère un CSV.gz uploadé directement (multipart/form-data).
 * Conçu pour importer un flux Awin téléchargé localement sans avoir besoin
 * de l'URL Awin avec la clé API (utile après rotation de clé).
 *
 * Sécurité : header Authorization: Bearer <CRON_SECRET> requis.
 *
 * Usage :
 *   curl -X POST https://wada.style/api/cron/ingest-csv \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -F "file=@/path/to/34175-78127-fr_FR-Suitable.csv.gz;type=application/gzip" \
 *     -F "slug=suitable-fr"
 *
 * Le CSV est parsé + normalisé + mergé avec le KV existant (conserve les
 * imageLocal déjà mirrorés). Les produits MUJI / TBF déjà dans le KV
 * sont préservés — on ajoute/met à jour seulement les produits du slug
 * fourni.
 */

import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "node:zlib";
import { ingestAwinCsv } from "@/lib/awinFeed";
import { readAllProducts, writeAllProducts } from "@/lib/productStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  /* Auth */
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  /* Parse multipart */
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Impossible de parser le formulaire. Utilisez multipart/form-data." }, { status: 400 });
  }

  const slug = (formData.get("slug") as string | null)?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Champ 'slug' manquant (ex: suitable-fr)" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Champ 'file' manquant (CSV ou CSV.gz)" }, { status: 400 });
  }

  /* Lire + décompresser */
  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  let csv: string;
  try {
    const isgz = buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b;
    csv = isgz ? gunzipSync(buf).toString("utf-8") : buf.toString("utf-8");
  } catch (e) {
    return NextResponse.json({ error: `Décompression échouée: ${String(e)}` }, { status: 400 });
  }

  console.log(`[ingest-csv] slug=${slug} fileSize=${buf.length} csvLen=${csv.length}`);

  /* Parse + normalize */
  const { products: newProducts, stats } = ingestAwinCsv(csv);
  console.log(`[ingest-csv] parsés: ${newProducts.length} produits (stats: ${JSON.stringify(stats)})`);

  if (newProducts.length === 0) {
    return NextResponse.json({ ok: false, error: "Aucun produit parsé depuis le CSV", stats });
  }

  /* Charge le KV existant et retire les anciens produits de ce slug
     (mise à jour au lieu d'append brut). */
  const previousAll = await readAllProducts();
  const previousById = new Map<string, (typeof previousAll)[0]>();
  for (const p of previousAll) previousById.set(p.id, p);

  /* Conserve les imageLocal déjà mirrorés pour ce slug. */
  let imagesReused = 0;
  for (let i = 0; i < newProducts.length; i++) {
    const p = newProducts[i];
    const prev = previousById.get(p.id);
    if (prev?.imageLocal && prev.image === p.image) {
      newProducts[i] = { ...p, imageLocal: prev.imageLocal };
      imagesReused++;
    }
  }

  /* Merge : garde tout sauf les anciens produits du même slug, puis
     ajoute les nouveaux. */
  const retained = previousAll.filter((p) => p.marchandSlug !== slug);
  const merged = [...retained, ...newProducts];

  console.log(`[ingest-csv] KV avant: ${previousAll.length} / après merge: ${merged.length} (+${newProducts.length} ${slug}, -${previousAll.length - retained.length} anciens)`);

  const storage = await writeAllProducts(merged);

  return NextResponse.json({
    ok: storage.ok,
    slug,
    products_added: newProducts.length,
    images_reused: imagesReused,
    total_kv: merged.length,
    storage,
    stats,
  });
}
