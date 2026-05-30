"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import BackButton from "@/components/BackButton";
import ProfileEnriched from "@/components/ProfileEnriched";

/* ──────────────────────────────────────────────────────────────────────
   /compte — Refonte 2026-05-22 (maquette brief).
   Compte WADA persisté en localStorage (pas de backend pour l'instant).
   Préserve la logique existante : Suspense wrapper (useSearchParams),
   ?from=start → enchaîne sur /scanner après création.
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.12)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};
const SOFT = "0 12px 48px rgba(30,30,30,.08)";

type Account = { email: string; firstName?: string; createdAt: string };
type Tab = "signup" | "login";

/* Brief audit (25/05) — Suspense fallback `null` produisait un flash blanc
   pendant que useSearchParams résolve. Remplacé par un skeleton minimal
   qui occupe l'espace + indique visuellement « contenu en cours ». */
function CompteSkeleton() {
  return (
    <main style={{ minHeight: "100vh", background: "#F4EFE7", padding: "120px 24px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="wada-skeleton" style={{ height: 24, width: "40%", marginBottom: 18, borderRadius: 6 }} />
        <div className="wada-skeleton" style={{ height: 42, marginBottom: 12, borderRadius: 10 }} />
        <div className="wada-skeleton" style={{ height: 42, marginBottom: 12, borderRadius: 10 }} />
        <div className="wada-skeleton" style={{ height: 42, marginBottom: 24, borderRadius: 10 }} />
        <div className="wada-skeleton" style={{ height: 48, borderRadius: 999 }} />
      </div>
    </main>
  );
}

export default function ComptePage() {
  return (
    <Suspense fallback={<CompteSkeleton />}>
      <ComptePageInner />
    </Suspense>
  );
}

function ComptePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const cameFromStart = params?.get("from") === "start";

  const [account, setAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<Tab>("signup");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "creating">("idle");

  // Lit le compte existant au mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("wada-account") : null;
      if (raw) setAccount(JSON.parse(raw) as Account);
    } catch {
      /* localStorage corrompu — on traite comme absent */
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setStatus("invalid");
      return;
    }
    setStatus("creating");
    const acc: Account = {
      email: cleanEmail,
      firstName: firstName.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("wada-account", JSON.stringify(acc));
    } catch { /* indispo, on continue */ }
    setAccount(acc);
    if (cameFromStart) setTimeout(() => router.push("/scanner"), 350);
  };

  const handleLogout = () => {
    try { localStorage.removeItem("wada-account"); } catch {}
    setAccount(null);
    setEmail("");
    setFirstName("");
    setPassword("");
    setStatus("idle");
  };

  /* ────────────── ÉTAT 1 — Compte existant ────────────── */
  if (account) {
    const greeting = account.firstName || account.email.split("@")[0];
    return (
      <main style={mainStyle}>
                <BackButton />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "54px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <p style={kickerStyle}>Votre compte</p>
            <h1 style={titleStyle}>Bonjour {greeting}.</h1>
            <p style={subStyle}>
              Connecté avec <strong>{account.email}</strong>. Vos favoris et votre
              panier suivent automatiquement.
            </p>
          </div>
          <div style={cardStyle}>
            <Link
              href="/scanner"
              style={{ ...primaryBtnStyle, display: "block", textAlign: "center", textDecoration: "none" }}
            >
              Aller au scanner
            </Link>
            <Link
              href="/atelier"
              style={{
                display: "block", textAlign: "center", marginTop: 10,
                padding: "13px", fontFamily: fonts.sans, fontSize: 14,
                color: palette.ink, textDecoration: "none",
                border: `1px solid ${palette.line}`, borderRadius: 12, background: "#fff",
              }}
            >
              Voir l'atelier
            </Link>
            <button
              onClick={handleLogout}
              style={{
                marginTop: 18, width: "100%",
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: fonts.sans, fontSize: 11,
                letterSpacing: "0.3em", textTransform: "uppercase",
                color: palette.inkSoft,
              }}
            >
              Déconnexion
            </button>
          </div>

          {/* Vision Pt A (2026-05-31) : profil stylistique enrichi optionnel.
              Affiché uniquement si l'utilisateur est connecté pour ne pas
              brouiller le funnel onboarding. Chaque champ commit instantané. */}
          <ProfileEnriched />
        </div>
              </main>
    );
  }

  /* ────────────── ÉTAT 2 — Création / connexion ────────────── */
  const isSignup = tab === "signup";
  return (
    <main style={mainStyle}>
            <BackButton />
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "54px 24px 80px" }}>
        {/* HEAD */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <p style={kickerStyle}>Votre compte</p>
          <h1 style={titleStyle}>{isSignup ? "Créer un compte" : "Bon retour"}</h1>
          <p style={subStyle}>
            {isSignup
              ? "Synchronisez vos favoris entre vos appareils. Gratuit."
              : "Connectez-vous pour retrouver vos favoris et votre dressing."}
          </p>
        </div>

        {/* TABS */}
        <div
          style={{
            display: "flex",
            background: palette.cream,
            border: `1px solid ${palette.line}`,
            borderRadius: 999,
            padding: 5,
            marginBottom: 22,
          }}
        >
          {(["signup", "login"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 14,
                padding: 10,
                border: "none",
                background: tab === t ? palette.ink : "transparent",
                color: tab === t ? palette.cream : palette.inkSoft,
                borderRadius: 999,
                cursor: "pointer",
                fontWeight: tab === t ? 500 : 400,
                transition: "all .2s ease",
              }}
            >
              {t === "signup" ? "Créer un compte" : "Se connecter"}
            </button>
          ))}
        </div>

        {/* CARD */}
        <form onSubmit={handleSubmit} style={cardStyle}>
          {/* SSO — visuel seulement pour l'instant (pas de backend OAuth) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
            <button type="button" disabled style={ssoBtnStyle} title="Bientôt disponible">
              Continuer avec Google
            </button>
            <button type="button" disabled style={ssoBtnStyle} title="Bientôt disponible">
              Continuer avec Apple
            </button>
          </div>

          {/* DIVIDER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: palette.inkSoft,
              fontSize: 12,
              margin: "6px 0 16px",
            }}
          >
            <div style={{ flex: 1, height: 1, background: palette.line }} />
            <span>ou par e-mail</span>
            <div style={{ flex: 1, height: 1, background: palette.line }} />
          </div>

          {/* FIELDS */}
          {isSignup && (
            <>
              <label style={labelStyle}>Prénom</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Votre prénom"
                style={inputStyle}
              />
            </>
          )}
          <label style={labelStyle}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
            placeholder="vous@exemple.com"
            style={{ ...inputStyle, borderColor: status === "invalid" ? "#C13E3E" : palette.line }}
            required
          />
          <label style={labelStyle}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={inputStyle}
            // Pas obligatoire tant qu'on n'a pas de backend auth
          />
          {status === "invalid" && (
            <p style={{ color: "#C13E3E", fontSize: 12, marginTop: 8 }}>
              Adresse e-mail invalide.
            </p>
          )}
          <button type="submit" style={{ ...primaryBtnStyle, marginTop: 18 }}>
            {isSignup ? "Créer mon compte" : "Se connecter"}
          </button>
          {isSignup && (
            <p style={fineStyle}>
              En créant un compte, vous acceptez les{" "}
              <Link href="/cgv" style={{ color: palette.bordeaux }}>CGV</Link> et la{" "}
              <Link href="/confidentialite" style={{ color: palette.bordeaux }}>Confidentialité</Link>.
            </p>
          )}
        </form>

        <p
          style={{
            fontSize: 12,
            color: palette.inkSoft,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Pas besoin de compte pour explorer ni acheter. Le compte sert à
          synchroniser vos favoris et accéder à Premium.
        </p>
      </div>
          </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Styles partagés
   ────────────────────────────────────────────────────────────────────── */
const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: palette.beige,
  color: palette.ink,
  fontFamily: fonts.sans,
  lineHeight: 1.6,
};
const kickerStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.3em",
  textTransform: "uppercase",
  color: palette.bordeaux,
  fontWeight: 500,
  margin: 0,
};
const titleStyle: React.CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 700,
  fontSize: "clamp(26px, 5vw, 32px)",
  lineHeight: 1.05,
  margin: "10px 0 4px",
  color: palette.ink,
};
const subStyle: React.CSSProperties = {
  color: palette.inkSoft,
  fontSize: 14,
  margin: 0,
};
const cardStyle: React.CSSProperties = {
  background: palette.cream,
  border: `1px solid ${palette.line}`,
  borderRadius: 18,
  padding: 26,
  boxShadow: SOFT,
};
const ssoBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontFamily: fonts.sans,
  fontSize: 14,
  padding: 13,
  borderRadius: 12,
  border: `1px solid ${palette.line}`,
  background: "#fff",
  color: palette.ink,
  cursor: "not-allowed",
  opacity: 0.55,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: palette.inkSoft,
  display: "block",
  margin: "12px 0 6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: fonts.sans,
  fontSize: 15,
  padding: "13px 14px",
  borderRadius: 12,
  border: `1px solid ${palette.line}`,
  background: "#fff",
  outline: "none",
};
const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: fonts.sans,
  fontSize: 15,
  padding: 14,
  borderRadius: 999,
  background: palette.bordeaux,
  color: palette.cream,
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
};
const fineStyle: React.CSSProperties = {
  fontSize: 12,
  color: palette.inkSoft,
  textAlign: "center",
  marginTop: 14,
  lineHeight: 1.5,
};
