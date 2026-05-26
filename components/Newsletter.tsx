"use client";
import { useState } from "react";

/**
 * Newsletter — bloc inscription mail (refonte 2026-05-23, maquette brief).
 *
 * Card sombre (ink) avec formulaire cream, double opt-in mention. Quand
 * un service d'envoi (Resend, Mailjet…) sera connecté, remplacer le
 * setStatus("ok") par un fetch vers l'API + envoi du mail de confirmation.
 *
 * Variante : `compact` → card plus petite, sans le bloc « Presque fini ».
 */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};
const SOFT = "0 10px 40px rgba(30,30,30,.07)";

interface NewsletterProps {
  /** Variante d'affichage. `default` = card complète ; `compact` = sans titre H2. */
  variant?: "default" | "compact";
  /** Identifie d'où vient l'inscription (« footer », « tarifs », « inscription-page »…)
   *  pour les futures analyses cohorte côté backend. */
  source?: string;
}

export default function Newsletter({ variant = "default", source }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "ok" | "loading" | "error">("idle");

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setStatus("invalid");
      return;
    }
    /* Brief P2 newsletter (24/05) : passage du localStorage à un VRAI
       backend (POST /api/newsletter/subscribe → KV + double opt-in via
       Resend si RESEND_API_KEY est configurée, graceful sinon). */
    setStatus("loading");
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, source }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      setStatus("ok");
      setEmail("");
      /* Conserve aussi un trace locale (utile aux outils dev + au cas où
         le backend est encore vide en attendant la config ESP/KV). */
      try {
        const raw = localStorage.getItem("wada-newsletter") || "[]";
        const list: string[] = JSON.parse(raw);
        if (!list.includes(v)) list.push(v);
        localStorage.setItem("wada-newsletter", JSON.stringify(list));
      } catch { /* indispo */ }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      style={{
        maxWidth: 620,
        margin: "0 auto",
        background: palette.ink,
        color: palette.beige,
        borderRadius: 24,
        padding: variant === "compact" ? "34px 30px" : "44px 40px",
        textAlign: "center",
        boxShadow: SOFT,
      }}
      aria-label="Inscription à la newsletter WADA"
    >
      {status === "ok" ? (
        <>
          <div style={{ fontSize: 30, color: palette.olive }}>✦</div>
          <h2
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 28,
              margin: "10px 0 8px",
              color: palette.beige,
            }}
          >
            Presque fini !
          </h2>
          <p
            style={{
              color: "rgba(244,239,231,.85)",
              fontSize: 15,
              maxWidth: "42ch",
              margin: "0 auto 8px",
              lineHeight: 1.55,
            }}
          >
            On vous a envoyé un e-mail de confirmation. Cliquez le lien dedans pour
            valider votre inscription — c'est la dernière étape.
          </p>
        </>
      ) : (
        <>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: palette.olive,
              fontWeight: 500,
              margin: 0,
            }}
          >
            La lettre du dimanche
          </p>
          {variant !== "compact" && (
            <h2
              style={{
                fontFamily: fonts.display,
                fontWeight: 700,
                fontSize: "clamp(22px, 4vw, 30px)",
                margin: "12px 0 8px",
                color: palette.beige,
                lineHeight: 1.1,
              }}
            >
              Une couleur, une histoire,
              <br />
              chaque dimanche.
            </h2>
          )}
          <p
            style={{
              color: "rgba(244,239,231,.85)",
              fontSize: 15,
              maxWidth: "42ch",
              margin: variant === "compact" ? "8px auto 18px" : "0 auto 22px",
              lineHeight: 1.55,
            }}
          >
            Une seule lettre par semaine : la palette du moment, une jeune maison,
            une idée de tenue. Rien d'autre — pas de relance, pas de spam.
          </p>

          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              gap: 8,
              maxWidth: 420,
              margin: "0 auto",
              background: "rgba(244,239,231,.1)",
              border: `1px solid ${
                status === "invalid" ? "#C13E3E" : "rgba(244,239,231,.3)"
              }`,
              borderRadius: 999,
              padding: "6px 6px 6px 18px",
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              placeholder="vous@exemple.com"
              required
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                outline: "none",
                fontFamily: fonts.sans,
                fontSize: 15,
                color: palette.beige,
                minWidth: 0,
              }}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                fontFamily: fonts.sans,
                fontSize: 14,
                background: palette.beige,
                color: palette.ink,
                border: "none",
                borderRadius: 999,
                padding: "12px 22px",
                cursor: status === "loading" ? "wait" : "pointer",
                opacity: status === "loading" ? 0.6 : 1,
                whiteSpace: "nowrap",
                fontWeight: 500,
              }}
            >
              {status === "loading" ? "Inscription…" : "S'abonner"}
            </button>
          </form>
          {status === "invalid" && (
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#FF8A8A",
                fontStyle: "italic",
              }}
            >
              Cette adresse ne semble pas valide.
            </p>
          )}
          {status === "error" && (
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#FF8A8A",
                fontStyle: "italic",
              }}
            >
              Souci côté serveur — réessayez dans un instant.
            </p>
          )}
          <p
            style={{
              fontSize: 12,
              color: "rgba(244,239,231,.65)",
              marginTop: 16,
              lineHeight: 1.55,
            }}
          >
            Double opt-in : vous recevrez un e-mail pour confirmer. Désinscription
            en un clic, à tout moment.
          </p>
        </>
      )}
    </section>
  );
}
