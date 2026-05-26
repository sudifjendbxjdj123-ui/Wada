import Replicate from "replicate";

export const runtime = "nodejs";
export const maxDuration = 90;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return Response.json(
        { error: "REPLICATE_API_TOKEN is missing in .env.local" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // Editorial flat-lay enrichment — pousse FLUX vers du catalogue produit
    // premium (COS / Arket / Lemaire) plutôt qu'un shoot mannequin.
    // Le client a explicitement demandé : pas de corps, pas de mains, juste
    // la tenue complète arrangée à plat.
    const editorialPrompt = `${prompt}, professional flat lay editorial product photography, complete outfit including jacket, top, pants, and shoes arranged on a clean neutral cream background, ghost mannequin / invisible mannequin style, NO model, NO body, NO face, NO hands, NO legs, NO feet, NO skin visible, garments only laid flat in editorial arrangement, soft natural studio lighting from above, slight shadows for depth, shot on medium format camera, photorealistic fabric detail with visible weave and natural drape, high-end e-commerce catalog aesthetic, minimalist composition, COS Lemaire Arket visual reference`;

    console.log("[generate-image] Prompt:", editorialPrompt);

    // FLUX schnell — fast & cheap, 4 inference steps. Fire 4 in parallel.
    const generateOne = () =>
      replicate.run("black-forest-labs/flux-schnell", {
        input: {
          prompt: editorialPrompt,
          aspect_ratio: "3:4",
          num_outputs: 1,
          num_inference_steps: 4,
          output_format: "webp",
          output_quality: 90,
          go_fast: true,
          megapixels: "1",
        },
      });

    // Génération réduite à 1 image au lieu de 4 — évite le rate limit
    // Replicate quand le crédit du compte est sous $5 (burst limité à 1/min).
    // Quand le crédit dépasse $5, on peut repasser à 4 parallèles pour la
    // galerie d'images alternatives.
    const results = await Promise.all([
      generateOne(),
    ]);

    const images: string[] = [];

    for (const output of results) {
      const items = Array.isArray(output) ? output : [output];

      for (const item of items) {
        if (typeof item === "string") {
          images.push(item);
          continue;
        }

        if (item && typeof (item as any).url === "function") {
          const url = (item as any).url();
          images.push(url instanceof URL ? url.toString() : String(url));
          continue;
        }

        if (item instanceof ReadableStream) {
          const reader = item.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
          }
          const blob = new Blob(chunks as BlobPart[], { type: "image/webp" });
          const buffer = Buffer.from(await blob.arrayBuffer());
          const base64 = buffer.toString("base64");
          images.push(`data:image/webp;base64,${base64}`);
          continue;
        }
      }
    }

    if (images.length === 0) {
      return Response.json(
        { error: "No image was generated" },
        { status: 500 }
      );
    }

    console.log("[generate-image] Returning", images.length, "image(s)");

    return Response.json({ images });
  } catch (error: any) {
    console.error("[generate-image] Error:", error);
    return Response.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
