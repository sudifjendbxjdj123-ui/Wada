import { confirmByToken } from "@/lib/newsletterStore";
import { sendWelcome } from "@/lib/newsletterEmail";

/**
 * GET /api/newsletter/confirm?token=... — confirme un opt-in newsletter.
 *
 * Redirige vers /newsletter/confirme?status=ok|expired pour une page de
 * remerciement propre. On NE répond pas JSON parce que ce lien est cliqué
 * depuis l'email, dans un navigateur — l'utilisateur attend une page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return Response.redirect(new URL("/newsletter/confirme?status=invalid", req.url), 302);
  }

  const sub = await confirmByToken(token);
  if (!sub) {
    return Response.redirect(new URL("/newsletter/confirme?status=expired", req.url), 302);
  }

  // Envoie le mail de bienvenue (best-effort, on n'attend pas le succès
  // pour rediriger l'utilisateur).
  void sendWelcome(sub.email, sub.token);

  return Response.redirect(new URL("/newsletter/confirme?status=ok", req.url), 302);
}
