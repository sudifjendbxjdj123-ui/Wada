"use client";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export function NewsletterBanner() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Entrez votre email", { variant: "info" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        showToast("✓ Merci! Vérifiez votre email 🎨", { variant: "success", duration: 3000 });
        setEmail("");
      } else {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        showToast(err.error || "Erreur lors de l'inscription", { variant: "error" });
      }
    } catch (error) {
      showToast("Erreur de connexion", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
        left: 0,
        right: 0,
        background: "linear-gradient(135deg, #1a1a1a 0%, #2a241f 100%)",
        padding: "16px 20px",
        zIndex: 45,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Text */}
        <div>
          <p
            style={{
              fontFamily: "'Fredoka'",
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 4px",
            }}
          >
            📬 Restez au courant des nouvelles collections
          </p>
          <p style={{ fontFamily: "'Inter'", fontSize: 12, color: "#ccc", margin: 0 }}>
            Recevez des exclusivités & inspirations palettes chaque semaine
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubscribe}
          style={{
            display: "flex",
            gap: 8,
            minWidth: 280,
          }}
        >
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 6,
              border: "none",
              fontFamily: "'Inter'",
              fontSize: 13,
              background: "#fff",
              color: "#1a1a1a",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 18px",
              borderRadius: 6,
              background: "#6B3A32",
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Inter'",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#7a4a3f";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#6B3A32";
            }}
          >
            {loading ? "..." : "S'abonner"}
          </button>
        </form>
      </div>
    </div>
  );
}
