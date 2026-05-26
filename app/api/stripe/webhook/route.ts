import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * GET /api/stripe/webhook — santé du webhook (vérification déploiement).
 *
 * À utiliser une fois que tu as configuré le webhook côté Stripe Dashboard +
 * la variable STRIPE_WEBHOOK_SECRET côté Vercel. Curl :
 *
 *   curl https://www.wada.style/api/stripe/webhook
 *   → { "alive": true, "configured": true }
 *
 * Ne révèle JAMAIS le secret. Indique seulement s'il est présent.
 * Stripe attend POST → il recevra 405 si Stripe tente accidentellement GET.
 */
export async function GET() {
  const hasSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const hasStripeKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasPriceMonthly = Boolean(process.env.STRIPE_PRICE_MONTHLY);
  const hasPriceYearly = Boolean(process.env.STRIPE_PRICE_YEARLY);

  return Response.json({
    alive: true,
    route: "/api/stripe/webhook",
    method: "POST (signature-verified)",
    configured: hasSecret && hasStripeKey,
    env: {
      STRIPE_SECRET_KEY: hasStripeKey,
      STRIPE_WEBHOOK_SECRET: hasSecret,
      STRIPE_PRICE_MONTHLY: hasPriceMonthly,
      STRIPE_PRICE_YEARLY: hasPriceYearly,
    },
    expected_events: [
      "checkout.session.completed",
      "customer.subscription.trial_will_end",
      "invoice.payment_failed",
      "customer.subscription.deleted",
    ],
    next_steps: hasSecret
      ? "✓ Webhook prêt. Test : Stripe Dashboard → Developers → Webhooks → ton endpoint → Send test webhook → checkout.session.completed → vérifier 200 OK."
      : "✗ STRIPE_WEBHOOK_SECRET manquant. Aller Stripe Dashboard → Developers → Webhooks → Add endpoint → copier le Signing secret → Vercel env vars.",
  });
}

/**
 * POST /api/stripe/webhook — handler des événements abonnement WADA Premium
 *
 * Brief 2026-05-22 §B10 : tester l'abonnement de bout en bout — essai
 * 7 jours, paiement, annulation, relance J-2. Le webhook est l'endroit
 * où ces transitions sont notifiées de manière fiable (vs. polling).
 *
 * ─── Configuration requise (à faire une fois) ────────────────────────
 *
 *   1. Stripe Dashboard → Developers → Webhooks → Add endpoint :
 *        URL    = https://www.wada.style/api/stripe/webhook
 *        Events = (cocher les 4 ci-dessous)
 *                 - checkout.session.completed
 *                 - customer.subscription.trial_will_end
 *                 - invoice.payment_failed
 *                 - customer.subscription.deleted
 *
 *   2. Copier le « Signing secret » (whsec_…) → Vercel env vars :
 *        STRIPE_WEBHOOK_SECRET = whsec_XXXXXXXXXXXXX
 *
 *   3. Redéployer → ce handler reçoit et vérifie chaque event.
 *
 * ─── Événements traités ──────────────────────────────────────────────
 *
 *   checkout.session.completed
 *     → Le client a souscrit (paiement ou trial). Loguer pour analytics ;
 *       en v2, envoyer un email de bienvenue.
 *
 *   customer.subscription.trial_will_end  (J-3, automatique Stripe)
 *     → Relance J-2 du brief : envoyer un email « votre essai se termine
 *       dans 3 jours » via Resend/Postmark. Stub présent ; à brancher
 *       quand le provider email sera configuré (EMAIL_API_KEY).
 *
 *   invoice.payment_failed
 *     → Échec de prélèvement (carte expirée, fonds insuffisants).
 *       Stripe relance auto 3× sur 7 jours ; on log pour debug et on
 *       prépare un email « mise à jour de votre moyen de paiement ».
 *
 *   customer.subscription.deleted
 *     → Annulation effective. On log la perte de client. En v2 : email
 *       « on regrette de vous voir partir + survey raison ».
 *
 * Sécurité : on VÉRIFIE la signature Stripe sur CHAQUE requête. Sans
 * STRIPE_WEBHOOK_SECRET, le handler retourne 503 (pas 200) pour éviter
 * que Stripe pense qu'on a bien reçu sans avoir vérifié.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET non configuré → 503");
    return new Response("Webhook secret not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  // Stripe demande le body RAW (string), pas le JSON parsé
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown signature error";
    console.error("[stripe/webhook] Signature invalide :", msg);
    return new Response(`Webhook signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  // ─── Dispatch sur l'event ──────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[stripe/webhook] Nouvelle souscription :", {
          sessionId: session.id,
          customerId: session.customer,
          customerEmail: session.customer_email,
          plan: session.metadata?.plan,
        });
        // TODO v2 : email de bienvenue + tracking analytics « subscription_started »
        break;
      }

      case "customer.subscription.trial_will_end": {
        // J-3 relance auto Stripe — c'est notre fenêtre J-2 du brief
        const sub = event.data.object as Stripe.Subscription;
        console.log("[stripe/webhook] Essai bientôt fini (J-3) :", {
          subscriptionId: sub.id,
          customerId: sub.customer,
          trialEnd: sub.trial_end
            ? new Date(sub.trial_end * 1000).toISOString()
            : null,
        });
        // TODO v2 : envoyer email « il vous reste 3 jours sur WADA Premium » via Resend/Postmark
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("[stripe/webhook] Paiement échoué :", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000).toISOString()
            : null,
        });
        // Stripe relance auto. On prépare un email d'information ; pas
        // d'action destructive (le client garde son accès pendant la
        // dunning window de Stripe, 3 tentatives sur 7 jours).
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("[stripe/webhook] Annulation effective :", {
          subscriptionId: sub.id,
          customerId: sub.customer,
          canceledAt: sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : null,
          cancellationReason: sub.cancellation_details?.reason,
        });
        // TODO v2 : email « on regrette de vous voir partir » + survey raison
        break;
      }

      default:
        // Stripe envoie plein d'autres events ; on ignore poliment.
        console.log("[stripe/webhook] Event ignoré :", event.type);
    }

    return Response.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/webhook] Erreur de traitement :", msg);
    // 200 quand même pour que Stripe n'essaie pas de retransmettre en boucle
    return Response.json({ received: true, error: msg });
  }
}
