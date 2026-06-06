/**
 * POST /api/vision-filter
 *
 * Filtre GPT-4o-mini Vision sur un batch de produits KV.
 * Détecte et vide les images : vue de dos, gros plan, lifestyle coupé.
 *
 * Body : { batch: number, batchSize: number }
 * Response : { processed, rejected, done }
 *
 * Usage : appeler en boucle avec batch=0, 1, 2...
 * Sécurité : header Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { readAllProducts, writeAllProducts } from "@/lib/productStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55;

/* Instanciation paresseuse : le constructeur OpenAI jette si la clé est
   absente. En la créant à la 1re requête (et non au chargement du module),
   le build (collecte des pages) ne dépend plus de OPENAI_API_KEY. */
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

async function visionCheck(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  try {
    const res = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 40,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Is this fashion product image acceptable? Answer JSON: {"ok":true/false}
ok=true: full garment visible, front view, neutral/white background
ok=false: back view, close-up detail only, partial body cut-off, extreme lifestyle`,
          },
          { type: "image_url", image_url: { url: imageUrl, detail: "low" } },
        ],
      }],
      response_format: { type: "json_object" },
    });
    const data = JSON.parse(res.choices[0].message.content || "{}");
    return !!data.ok;
  } catch {
    return true; // fail-open
  }
}

export async function POST(req: NextRequest) {
  /* Auth */
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { batch = 0, batchSize = 50 } = await req.json().catch(() => ({}));

  const all = await readAllProducts();
  const start = batch * batchSize;
  const end = Math.min(start + batchSize, all.length);
  const slice = all.slice(start, end);

  let rejected = 0;

  const updated = await Promise.all(
    slice.map(async (p) => {
      const url = p.largeImage || p.image || "";
      if (!url) return p;
      const ok = await visionCheck(url);
      if (!ok) {
        rejected++;
        return { ...p, image: "", largeImage: "", thumb: undefined };
      }
      return p;
    }),
  );

  // Remplace le slice dans le tableau complet
  const newAll = [...all.slice(0, start), ...updated, ...all.slice(end)];
  await writeAllProducts(newAll);

  const done = end >= all.length;
  return NextResponse.json({
    batch,
    start,
    end,
    total: all.length,
    processed: slice.length,
    rejected,
    done,
  }, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
