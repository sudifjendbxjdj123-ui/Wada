import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageUrl = response?.data?.[0]?.url;

    if (!imageUrl) {
      console.error("No image returned:", response);
      return new Response(
        JSON.stringify({ error: "no image returned" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("IMAGE ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "image failed",
      }),
      { status: 500 }
    );
  }
}