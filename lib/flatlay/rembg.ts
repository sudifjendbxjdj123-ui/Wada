/**
 * lib/flatlay/rembg.ts
 * Background removal via Replicate (RMBG-1.4 — 851-labs/background-remover).
 * Coût : ~$0.001 par image. REPLICATE_API_TOKEN déjà dans Vercel.
 */

import Replicate from "replicate";

const MODEL = "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc";

export async function removeBackground(imageUrl: string): Promise<Buffer> {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN manquante");

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const output = (await replicate.run(MODEL, {
    input: { image: imageUrl, format: "png" },
  })) as unknown as string;

  if (!output || typeof output !== "string") throw new Error("Replicate: output invalide");

  const imgRes = await fetch(output);
  if (!imgRes.ok) throw new Error(`Replicate fetch cutout: ${imgRes.status}`);

  return Buffer.from(await imgRes.arrayBuffer());
}

export async function removeBackgroundBatch(urls: string[]): Promise<(Buffer | null)[]> {
  return Promise.all(
    urls.map((url) =>
      removeBackground(url).catch((err) => {
        console.error("[rembg] failed for", url.slice(0, 80), err.message);
        return null;
      }),
    ),
  );
}
