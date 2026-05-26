"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ink, paper, subtle, seal, sectionLabel, fontHeading, fontBody, fontLabel } from "@/lib/styles";

/**
 * /newsletter/desinscrit — landing après clic sur le lien d'unsubscribe
 * (un clic, pas de prompt — RGPD + best practice).
 *
 * États ?status= :
 *   ok       → désinscription effective
 *   expired  → token invalide (déjà désinscrit ou jamais existé)
 *   invalid  → token absent
 */

const COPY: Record<string, { title: string; body: string }> = {
  ok: {
    title: "Désinscription confirmée.",
    body:
      "Votre adresse est retirée de la liste. Vous ne recevrez plus de mail de WADA. " +
      "Si c'est un au-revoir : merci d'avoir essayé.",
  },
  expired: {
    title: "Lien déjà utilisé.",
    body:
      "Ce lien de désinscription n'est plus actif — soit vous êtes déjà désinscrit, " +
      "soit le token n'existe plus.",
  },
  invalid: {
    title: "Lien invalide.",
    body:
      "Le lien sur lequel vous avez cliqué est incomplet. Si vous voulez vous " +
      "désinscrire, ré-ouvrez l'un de nos emails et cliquez sur « se désinscrire ».",
  },
};

function DesinscritContent() {
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

export default function NewsletterDesinscritPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper }}>
      <Suspense fallback={<div style={{ padding: 120, textAlign: "center", color: subtle }}>Chargement…</div>}>
        <DesinscritContent />
      </Suspense>
    </main>
  );
}
