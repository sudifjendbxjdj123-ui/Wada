"use client";
import Link from "next/link";
import { useState } from "react";
import { ink, paper, subtle, seal, border, sectionLabel } from "@/lib/styles";

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const body = encodeURIComponent(message + "\n\n— envoyé via wada.style/contact");
    const subj = encodeURIComponent(subject || "Message depuis WADA");
    window.location.href = `mailto:hello@wada.style?subject=${subj}&body=${body}`;
  };

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            {/* Brief audit 2026-05-28 : back button standardisé. */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 5% 0" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: ink, textDecoration: "none",
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${border}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>
      <div className="wada-container" style={{ padding: "20px 32px 80px" }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          // Glass wrapper crème pour lisibilité texte au-dessus de la vidéo
          background: "rgba(244,239,230,0.92)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 16,
          padding: "32px 36px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
        }}>

          <header style={{ textAlign: "center", padding: "80px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Nous écrire</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, fontStyle: "italic", lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>
              Contact
            </h1>
            <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, maxWidth: 480, margin: "24px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              Une question, une suggestion, une marque à proposer ? Nous répondons sous 48 heures.
            </p>
          </header>

          {/* COORDONNÉES */}
          <section style={{ marginBottom: 60, paddingBottom: 60, borderBottom: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ ...sectionLabel, marginBottom: 16 }}>Email</p>
            <a href="mailto:hello@wada.style" style={{ fontSize: 28, fontStyle: "italic", color: ink, textDecoration: "none", fontFamily: "'Inter', sans-serif", borderBottom: `1px solid ${border}` }}>
              hello@wada.style
            </a>
          </section>

          {/* FORMULAIRE */}
          <section style={{ marginBottom: 60 }}>
            <h2 style={{ fontSize: 28, fontStyle: "italic", fontWeight: 400, margin: "0 0 32px", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>
              Ou écrivez-nous directement
            </h2>
            <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: subtle, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Sujet</label>
                {/* Brief audit M2 : fontSize ≥16 évite le zoom iOS au focus.
                    A2 : outline:none retiré, le focus ring global a11y joue. */}
                <input type="text" placeholder="Une question, une marque à proposer…" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: "14px 18px", fontSize: 16, fontFamily: "'Inter', sans-serif", fontStyle: "italic", border: `1px solid ${border}`, background: "rgba(255,255,255,0.5)", color: ink }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: subtle, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Message</label>
                <textarea required placeholder="Bonjour…" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} style={{ width: "100%", padding: "14px 18px", fontSize: 16, fontFamily: "'Inter', sans-serif", fontStyle: "italic", border: `1px solid ${border}`, background: "rgba(255,255,255,0.5)", color: ink, resize: "vertical" }} />
              </div>
              <button type="submit" style={{ background: ink, color: paper, border: "none", padding: "18px 24px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Inter', sans-serif", marginTop: 8 }}>
                Envoyer →
              </button>
              <p style={{ fontSize: 12, color: subtle, fontStyle: "italic", textAlign: "center", marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                Le bouton ouvrira votre application mail avec le message pré-rempli.
              </p>
            </form>
          </section>

          {/* LIEN FAQ */}
          <section style={{ paddingTop: 40, borderTop: `1px solid ${border}`, textAlign: "center" }}>
            <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", margin: "0 0 24px", fontFamily: "'Inter', sans-serif" }}>
              La réponse à votre question est peut-être déjà dans la FAQ.
            </p>
            <Link href="/faq" style={{ background: "transparent", color: ink, border: `1px solid ${ink}`, padding: "14px 28px", fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", textDecoration: "none", fontFamily: "'Inter', sans-serif", display: "inline-block" }}>
              Voir la FAQ →
            </Link>
          </section>

        </div>
              </div>
    </main>
  );
}
