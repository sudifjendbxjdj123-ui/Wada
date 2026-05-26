/**
 * newsletterEmail — envoi via Resend.
 *
 * Brief P2 (24/05) : graceful degradation. Si RESEND_API_KEY est absent,
 * on log le mail qu'on AURAIT envoyé et on retourne true (le flux UI
 * continue normalement, comme si l'email était parti). Quand l'env var
 * est posée, le SDK Resend prend le relais et envoie réellement.
 *
 * Configuration requise (env vars Vercel) :
 *   RESEND_API_KEY              → clé API du compte Resend
 *   RESEND_FROM                 → expéditeur (ex. "WADA <hello@wada.style>")
 *                                 nécessite un domaine vérifié dans Resend
 *
 * Si RESEND_FROM absent on tombe sur le default `onboarding@resend.dev`
 * qui marche pour les tests mais N'EST PAS la marque WADA en réception.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.wada.style";

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendViaResend({ to, subject, html, text }: SendOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "WADA <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("[newsletter] RESEND_API_KEY absent — email NOT sent (graceful):", {
      to,
      subject,
      preview: text.slice(0, 80),
    });
    return true; // graceful — pas une erreur, juste pas configuré
  }

  // Import dynamique pour éviter de charger le SDK dans les bundles client.
  try {
    const { Resend } = await import("resend");
    const client = new Resend(apiKey);
    const result = await client.emails.send({ from, to, subject, html, text });
    if (result.error) {
      console.error("[newsletter] Resend error:", result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[newsletter] Resend SDK threw:", err);
    return false;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   TEMPLATES — sobres, alignés au ton « lettre du dimanche »
   ────────────────────────────────────────────────────────────────────── */

/** Mail de confirmation (double opt-in). */
export async function sendConfirmation(email: string, token: string): Promise<boolean> {
  const confirmUrl = `${BASE_URL}/api/newsletter/confirm?token=${token}`;
  const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${token}`;
  return sendViaResend({
    to: email,
    subject: "Confirmez votre inscription à WADA",
    text:
      `Bonjour,\n\n` +
      `Vous avez demandé à recevoir « La lettre du dimanche » de WADA.\n` +
      `Cliquez sur le lien ci-dessous pour confirmer votre inscription :\n\n` +
      `${confirmUrl}\n\n` +
      `Si ce n'est pas vous, ignorez ce message.\n\n` +
      `— WADA · wada.style\n` +
      `Désinscription en un clic : ${unsubUrl}\n`,
    html:
      `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A1612;">` +
      `<p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#6B3A32;margin:0 0 8px;">WADA</p>` +
      `<h1 style="font-family:Inter,Helvetica,Arial,sans-serif;font-weight:600;font-size:26px;letter-spacing:-0.01em;margin:0 0 18px;">Confirmez votre inscription</h1>` +
      `<p style="font-size:15px;line-height:1.55;margin:0 0 24px;">Vous avez demandé à recevoir <em>La lettre du dimanche</em> de WADA. Pour valider votre inscription, un seul clic :</p>` +
      `<p style="margin:0 0 28px;"><a href="${confirmUrl}" style="display:inline-block;background:#1A1612;color:#F4EFE7;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Inter,sans-serif;font-size:13px;font-weight:600;letter-spacing:.04em;">Je confirme</a></p>` +
      `<p style="font-size:13px;color:#6a6259;line-height:1.55;margin:0 0 16px;">Si vous n'avez rien demandé, ignorez ce mail — aucune inscription ne sera créée.</p>` +
      `<hr style="border:none;border-top:1px solid #E8DDC9;margin:28px 0;"/>` +
      `<p style="font-size:11px;color:#9b948a;line-height:1.5;margin:0;">WADA · le dictionnaire des couleurs et de la mode · <a href="https://www.wada.style" style="color:#9b948a;">wada.style</a><br/>` +
      `Désinscription en un clic : <a href="${unsubUrl}" style="color:#9b948a;">se désinscrire</a></p>` +
      `</div>`,
  });
}

/** Mail de bienvenue après confirmation. Court, pas envahissant. */
export async function sendWelcome(email: string, token: string): Promise<boolean> {
  const unsubUrl = `${BASE_URL}/api/newsletter/unsubscribe?token=${token}`;
  return sendViaResend({
    to: email,
    subject: "Bienvenue dans la lettre du dimanche",
    text:
      `Bienvenue.\n\n` +
      `Votre inscription est confirmée. Vous recevrez la prochaine lettre dimanche : ` +
      `une palette, une histoire, une tenue. Rien d'autre.\n\n` +
      `— WADA\n` +
      `Désinscription en un clic : ${unsubUrl}\n`,
    html:
      `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A1612;">` +
      `<p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#6B3A32;margin:0 0 8px;">WADA</p>` +
      `<h1 style="font-family:Inter,Helvetica,Arial,sans-serif;font-weight:600;font-size:26px;letter-spacing:-0.01em;margin:0 0 18px;">Bienvenue.</h1>` +
      `<p style="font-size:15px;line-height:1.55;margin:0 0 16px;">Votre inscription est confirmée. Vous recevrez la prochaine lettre dimanche : une palette, une histoire, une tenue. Rien d'autre — pas de relance, pas de spam.</p>` +
      `<hr style="border:none;border-top:1px solid #E8DDC9;margin:28px 0;"/>` +
      `<p style="font-size:11px;color:#9b948a;line-height:1.5;margin:0;">WADA · wada.style · ` +
      `Désinscription en un clic : <a href="${unsubUrl}" style="color:#9b948a;">se désinscrire</a></p>` +
      `</div>`,
  });
}
