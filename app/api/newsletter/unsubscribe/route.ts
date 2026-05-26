import { unsubscribeByToken } from "@/lib/newsletterStore";

/**
 * GET /api/newsletter/unsubscribe?token=... — désinscription en un clic.
 *
 * Redirige vers /newsletter/desinscrit?status=ok|invalid pour une page de
 * confirmation. Pas de prompt « êtes-vous sûr » : un seul clic, c'est la
 * règle (RGPD + best practice ESP — sinon les utilisateurs frustrés marquent
 * les mails comme spam, et c'est la délivrabilité globale qui souffre).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token || token.length < 16) {
    return Response.redirect(new URL("/newsletter/desinscrit?status=invalid", req.url), 302);
  }

  const ok = await unsubscribeByToken(token);
  return Response.redirect(
    new URL(`/newsletter/desinscrit?status=${ok ? "ok" : "expired"}`, req.url),
    302,
  );
}
