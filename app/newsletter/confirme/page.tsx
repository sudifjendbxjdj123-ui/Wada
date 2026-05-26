"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ink, paper, subtle, seal, sectionLabel, fontHeading, fontBody, fontLabel } from "@/lib/styles";

/**
 * /newsletter/confirme — landing après clic sur le lien de confirmation
 * envoyé par mail. 3 états selon le query param ?status= :
 *   ok       → bienvenue, inscription validée
 *   expired  → lien expiré/déjà utilisé
 *   invalid  → token absent ou malformé
 *
 * Pas de logique d'API ici (déjà fait par /api/newsletter/confirm avant
 * la redirection). C'est purement la page de remerciement.
 */

const COPY: Record<string, { title: string; body: string }> = {
  ok: {
    title: "Inscription confirmée.",
    body:
      "Votre adresse est enregistrée. Vous recevrez la prochaine lettre dimanche — " +
      "une palette, une histoire, une tenue. Rien d'autre.",
  },
  expired: {
    title: "Lien expiré.",
    body:
      "Ce lien de confirmation n'est plus valide. Vous pouvez vous réinscrire " +
      "depuis le pied de page.",
  },
  invalid: {
    title: "Lien invalide.",
    body:
      "Le lien sur lequel vous avez cliqué est incomplet. Réessayez depuis l'email " +
      "de confirmation reçu.",
  },
};

function ConfirmeContent() {
  const params = useSearchParams();
  const status = (params.get("status") || "ok") as keyof typeof COPY;
  const copy = COPY[status] || COPY.ok;

  return (
    <section style={{
      maxWidth: 540, margin: "0 auto",
      padding: "120px 24px 80px",
      textAlign: "center",
      fontFamily: fontBody,
      color: ink,
    }}>
      <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Newsletter</p>
      <h1 style={{
        fontFamily: fontHeading,
        fontSize: 48, fontStyle: "italic", fontWeight: 400,
        lineHeight: 1.1, margin: "0 0 24px",
      }}>
        {copy.title}
      </h1>
      <p style={{
        fontSize: 17, color: subtle, lineHeight: 1.6,
        margin: "0 0 36px",
      }}>
        {copy.body}
      </p>
      <Link href="/" style={{
        display: "inline-block",
        background: ink, color: paper,
        padding: "14px 28px",
        textDecoration: "none",
        fontFamily: fontLabel,
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.3em", textTransform: "uppercase",
        borderRadius: 999,
      }}>
        Retour à l'accueil
      </Link>
    </section>
  );
}

export default function NewsletterConfirmePage() {
  return (
    <main style={{ minHeight: "100vh", background: paper }}>
      <Suspense fallback={<div style={{ padding: 120, textAlign: "center", color: subtle }}>Chargement…</div>}>
        <ConfirmeContent />
      </Suspense>
    </main>
  );
}
