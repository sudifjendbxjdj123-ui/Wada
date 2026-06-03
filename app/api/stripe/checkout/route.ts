import Stripe from "stripe";

export const runtime = "nodejs";

/* Init lazy — évite crash build quand STRIPE_SECRET_KEY absent en CI. */
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as any });
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "STRIPE_SECRET_KEY missing in .env.local" },
        { status: 500 }
      );
    }

    const { plan } = await req.json(); // "monthly" or "yearly"

    const priceId =
      plan === "yearly"
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return Response.json(
        { error: `Price ID not configured for plan "${plan}"` },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      `https://${req.headers.get("host")}` ||
      "https://wada.style";

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 7-day free trial on the subscription
      subscription_data: {
        trial_period_days: 7,
      },
      // Where to redirect after payment
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?payment=cancelled`,
      // Allow promo codes
      allow_promotion_codes: true,
      // Locale
      locale: "fr",
      // Metadata for tracking
      metadata: {
        plan,
        source: "wada-website",
      },
    });

    if (!session.url) {
      return Response.json(
        { error: "No checkout URL returned by Stripe" },
        { status: 500 }
      );
    }

    return Response.json({ url: session.url });
  } catch (error: any) {
    console.error("[stripe/checkout] Error:", error);
    return Response.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
