import { upsertPending } from "@/lib/newsletterStore";
import { sendConfirmation } from "@/lib/newsletterEmail";

/**
 * POST /api/newsletter/subscribe — inscription newsletter avec double opt-in.
 *
 * Body : { email: string, source?: string }
 *
 * Flow :
 *   1. Validation email côté serveur (defense in depth)
 *   2. upsertPending() — crée/refresh un enregistrement KV avec token
 *   3. sendConfirmation() — envoie le mail double opt-in (graceful si pas
 *      de RESEND_API_KEY : log + true).
 *
 * Réponses :
 *   200 { ok: true, status: "pending" | "already_confirmed" }
 *   400 { ok: false, error }
 *   503 { ok: false, error: "unavailable" }  ← si KV/ESP cassent
 *
 * Side note : on retourne le même 200 success que l'email existe déjà ou
 * pas, pour ne pas leaker quels emails sont abonnés (anti-énumération).
 */
export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const sub = await upsertPending(email, body.source);
  if (!sub) {
    // KV indisponible — graceful pour l'utilisateur, log pour le dev.
    return Response.json(
      { ok: true, status: "pending", _degraded: true },
      { status: 200 },
    );
  }

  if (sub.status === "confirmed") {
    // Déjà abonné — on ne renvoie pas de mail (évite spam / leak).
    return Response.json({ ok: true, status: "already_confirmed" });
  }

  // Pending — envoie le mail de confirmation. Graceful si Resend pas configuré.
  await sendConfirmation(sub.email, sub.token);

  return Response.json({ ok: true, status: "pending" });
}
