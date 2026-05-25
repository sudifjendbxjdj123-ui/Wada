import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { style, budget, occasion } = await req.json();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are WADA, a luxury fashion stylist.

Create a full outfit in this structure:

1. Outfit name
2. Top
3. Bottom
4. Shoes
5. Accessories
6. Brands
7. Style explanation
8. Color palette

Style must match: Old Money, Quiet Luxury, Minimal Chic, Street Luxury.
Be elegant and realistic.
`,
        },
        {
          role: "user",
          content: `Style: ${style}, Budget: ${budget}, Occasion: ${occasion}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;

    return new Response(
      JSON.stringify({ result: text }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("GENERATE ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "generate failed",
      }),
      { status: 500 }
    );
  }
}