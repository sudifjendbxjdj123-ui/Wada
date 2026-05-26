"use client";
/**
 * /partenaires — Page B2B "Pour les marques" — refonte 2026-05-20.
 *
 * Objectif : qu'une jeune marque arrive ici et veuille en être. Levier =
 * WADA est une vitrine éditoriale curatée, guidée par la couleur, qui
 * envoie des acheteurs à forte intention, modèle à la performance.
 *
 * Structure (cf. brief) :
 *   1. Hero (kicker + titre serif + sous-titre + 2 CTAs)
 *   2. Pitch + 3 chiffres clés
 *   3. Pourquoi WADA est différent (4 cards)
 *   4. Comment ça marche (4 étapes)
 *   5. Le standard de curation (quote éditoriale)
 *   6. Le modèle (3 cards transparence)
 *   7. Candidature (form bordeaux)
 *
 * Design : palette beige/cream/olive/bordeaux/ink (brief officiel).
 * Titres en serif Fraunces (casse-phrase). Inter pour le corps.
 * Pas de Title Case. Pas de MAJ sauf kickers.
 */
import { useState } from "react";
import Link from "next/link";

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#534E48",
  line: "rgba(30,30,30,.10)",
};

/* Brief charte typo 2026-05-26 : Fredoka (chubby) titres partout +
   Inter texte courant. Plus aucune référence serif (Fraunces / EB
   Garamond retirés sitewide). Le nom de clé `serif` est gardé pour
   compatibilité, mais pointe vers Fredoka. */
const fonts = {
  serif: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const shadow = "0 8px 40px rgba(30,30,30,.06)";

export default function PartenairesPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    website: "",
    email: "",
    category: "",
    affiliateNetwork: "",
    universe: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // V1 : pas d'endpoint serveur. On compose un mailto vers hello@wada.style
    // avec les champs préremplis. À remplacer par un POST /api/partners/apply
    // quand le compte mail Zoho sera totalement opérationnel.
    const subject = encodeURIComponent(`Candidature partenaire — ${form.brand}`);
    const body = encodeURIComponent(
      `Marque : ${form.brand}\n` +
      `Site : ${form.website}\n` +
      `Email : ${form.email}\n` +
      `Catégorie : ${form.category}\n` +
      `Réseau d'affiliation : ${form.affiliateNetwork}\n` +
      `Univers : ${form.universe || "—"}\n\n` +
      `(Envoyé depuis le formulaire wada.style/partenaires)`
    );
    window.location.href = `mailto:hello@wada.style?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  return (
    <main style={{
      fontFamily: fonts.sans,
      background: palette.beige,
      color: palette.ink,
      lineHeight: 1.7,
      WebkitFontSmoothing: "antialiased",
    }}>
      
      {/* Brief audit 2026-05-28 : bouton retour standardisé (toutes les
          pages internes hors accueil ont leur ← Retour en haut à gauche). */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 5% 0" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            color: palette.ink, textDecoration: "none",
            fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            padding: "8px 14px",
            border: `1px solid ${palette.line}`, borderRadius: 999,
            background: "rgba(255,255,255,0.6)",
          }}
        >
          <span aria-hidden style={{ fontSize: 14, letterSpacing: 0 }}>←</span>
          <span>Retour</span>
        </Link>
      </div>

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section style={{
        position: "relative",
        minHeight: "74vh",
        display: "flex", alignItems: "center",
        overflow: "hidden",
      }}>
        {/* Background animé bordeaux → olive */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(120deg, #2e2a27, ${palette.bordeaux} 60%, ${palette.olive})`,
          animation: "wada-partenaires-drift 16s ease-in-out infinite alternate",
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(30,30,30,.28), rgba(107,58,50,.34))",
        }} />

        <div style={{
          position: "relative", zIndex: 2,
          color: palette.cream,
          maxWidth: 1040, margin: "0 auto",
          padding: "0 32px", width: "100%",
        }}>
          <Kicker color="rgba(250,248,244,.85)">Pour les marques</Kicker>
          <h1 style={{
            fontFamily: fonts.serif, fontWeight: 300,
            fontSize: "clamp(38px, 6vw, 60px)",
            lineHeight: 1.04,
            margin: "16px 0 12px",
            maxWidth: "15ch",
          }}>
            Vos pièces, présentées par la couleur juste.
          </h1>
          <p style={{
            fontSize: 18,
            maxWidth: "46ch",
            color: "rgba(250,248,244,.92)",
          }}>
            WADA traduit 348 accords de Sanzo Wada en tenues à acheter. Quand une palette
            appelle votre vêtement, nous l'y plaçons — devant des acheteurs qui cherchaient
            exactement cette teinte.
          </p>
          <div style={{ marginTop: 30, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a href="#candidature" style={btnPrimary()}>Devenir marque partenaire</a>
            <Link href="/palettes" style={btnGhost()}>Voir un exemple de placement</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. PITCH + STATS ═══════════════════ */}
      <section style={{ padding: "80px 0", textAlign: "center" }}>
        <div style={wrap}>
          <Kicker>Une découverte par la couleur, pas par la pub</Kicker>
          <p style={{
            fontFamily: fonts.serif, fontWeight: 300,
            fontSize: "clamp(22px, 3vw, 30px)",
            maxWidth: "24ch",
            margin: "14px auto 0",
            lineHeight: 1.25,
          }}>
            WADA n'interrompt personne. Il répond à une intention — et votre marque est la
            réponse.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 48,
          }}>
            <StatCard num="348" lbl="palettes éditoriales où apparaître" />
            <StatCard num="0 €" lbl="frais de référencement — performance only" />
            <StatCard num="100%" lbl="liens trackés affiliation officielle" />
          </div>
          <p style={{
            fontSize: 12, color: palette.inkSoft, marginTop: 18, fontStyle: "italic",
          }}>
            Données trafic / conversion publiées en transparence dès les premiers mois
            d'activité partenaire.
          </p>
        </div>
      </section>

      {/* ═══════════════════ 3. WHY ═══════════════════ */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={wrap}>
          <SectionHead kicker="Pourquoi WADA" title="Une vitrine, pas une bannière." />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 22, marginTop: 36,
          }}>
            <FeatureCard
              title="Contexte éditorial"
              desc="Votre pièce apparaît dans une tenue composée, une culture, une palette — un cadre désirable, jamais un encart publicitaire."
            />
            <FeatureCard
              title="Audience à intention"
              desc="L'utilisateur arrive par une couleur précise qu'il aime. Le trafic est qualifié, pas du volume froid."
            />
            <FeatureCard
              title="Sans risque"
              desc="Modèle à la performance : vous ne payez que sur les ventes réellement générées. Aucun coût de référencement."
            />
            <FeatureCard
              title="Curation exigeante"
              desc="Être sur WADA, c'est rejoindre une sélection — un gage de qualité qui valorise votre marque autant qu'il vous expose."
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. STEPS ═══════════════════ */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={wrap}>
          <SectionHead kicker="Comment ça marche" title="Quatre étapes, sans friction." />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 18, marginTop: 36,
          }}>
            <Step n="01" title="Vous candidatez" desc="Marque, site, catégorie, réseau d'affiliation. Un formulaire court." />
            <Step n="02" title="On intègre vos liens" desc="Via votre programme existant (Awin, Rakuten…) ou des liens directs." />
            <Step n="03" title="Vos pièces entrent" desc="Associées aux accords qui leur vont : tenues, cultures, Découverte." />
            <Step n="04" title="Vous suivez" desc="Clics, ventes, commissions — dans un tableau de bord clair." />
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. STANDARD ═══════════════════ */}
      <section style={{
        padding: "80px 0",
        background: palette.cream,
        borderTop: `1px solid ${palette.line}`,
        borderBottom: `1px solid ${palette.line}`,
      }}>
        <div style={wrap}>
          <div style={{ textAlign: "center" }}>
            <Kicker>Le standard</Kicker>
          </div>
          <p style={{
            fontFamily: fonts.serif, fontWeight: 300,
            fontSize: "clamp(20px, 2.6vw, 26px)",
            maxWidth: "30ch",
            margin: "18px auto 0",
            textAlign: "center",
            lineHeight: 1.3,
          }}>
            « WADA met en lumière des maisons qui ont un point de vue. Si votre marque a une
            vraie identité de couleur et de matière, elle a sa place ici. »
          </p>
        </div>
      </section>

      {/* ═══════════════════ 6. MODEL ═══════════════════ */}
      <section style={{ padding: "80px 0" }}>
        <div style={wrap}>
          <SectionHead kicker="Le modèle" title="Transparent, et sans risque." />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20, marginTop: 36,
          }}>
            <ModelCard title="Référencement gratuit" desc="Aucun frais pour apparaître dans les palettes." />
            <ModelCard title="Commission à la vente" desc="WADA ne gagne que sur les ventes qu'il génère, via l'affiliation." />
            <ModelCard title="Sans engagement" desc="Vous restez libre, retrait possible à tout moment." />
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. CANDIDATURE ═══════════════════ */}
      <section id="candidature" style={{ padding: "0 0 96px" }}>
        <div style={wrap}>
          <div style={{
            background: palette.bordeaux,
            color: palette.cream,
            borderRadius: 28,
            padding: "clamp(32px, 4vw, 48px)",
          }}>
            <Kicker color="rgba(250,248,244,.8)">Candidature</Kicker>
            <h2 style={{
              fontFamily: fonts.serif, fontWeight: 300,
              fontSize: "clamp(26px, 4vw, 34px)",
              margin: "8px 0 6px",
            }}>
              Rejoignez la sélection.
            </h2>
            <p style={{ color: "rgba(250,248,244,.85)", marginBottom: 26 }}>
              Dites-nous qui vous êtes. On revient vers vous sous 5 jours ouvrés.
            </p>

            {submitted ? (
              <div style={{
                padding: "24px 20px",
                background: "rgba(250,248,244,.10)",
                border: "1px solid rgba(250,248,244,.25)",
                borderRadius: 16,
              }}>
                <p style={{ fontFamily: fonts.serif, fontSize: 22, marginBottom: 8 }}>
                  Merci.
                </p>
                <p style={{ color: "rgba(250,248,244,.85)" }}>
                  Votre client mail s'est ouvert avec la candidature préremplie. Envoyez-le
                  — on revient vers vous sous 5 jours ouvrés.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
                maxWidth: 680,
              }}>
                <input required placeholder="Nom de la marque *" style={inputStyle()} value={form.brand} onChange={onChange("brand")} />
                <input required type="url" placeholder="Site web *" style={inputStyle()} value={form.website} onChange={onChange("website")} />
                <input required type="email" placeholder="Email de contact *" style={inputStyle()} value={form.email} onChange={onChange("email")} />
                <select style={inputStyle()} value={form.category} onChange={onChange("category")} required>
                  <option value="">Catégorie…</option>
                  <option value="pret-a-porter">Prêt-à-porter</option>
                  <option value="maroquinerie">Maroquinerie</option>
                  <option value="chaussures">Chaussures</option>
                  <option value="accessoires">Accessoires</option>
                  <option value="bijoux">Bijoux</option>
                  <option value="parfum">Parfum</option>
                </select>
                <input placeholder="Réseau d'affiliation (Awin, Rakuten… ou « à mettre en place »)" style={{ ...inputStyle(), gridColumn: "1 / -1" }} value={form.affiliateNetwork} onChange={onChange("affiliateNetwork")} />
                <input placeholder="Un mot sur votre univers (facultatif)" style={{ ...inputStyle(), gridColumn: "1 / -1" }} value={form.universe} onChange={onChange("universe")} />
                <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                  <button type="submit" style={{
                    fontFamily: fonts.sans, fontSize: 15,
                    padding: "15px 32px", borderRadius: 999,
                    background: palette.cream, color: palette.bordeaux,
                    border: "none", cursor: "pointer", fontWeight: 600,
                    transition: "transform .4s cubic-bezier(.22,1,.36,1), opacity .4s cubic-bezier(.22,1,.36,1)",
                  }}>
                    Envoyer ma candidature
                  </button>
                </div>
                <p style={{
                  gridColumn: "1 / -1",
                  fontSize: 13, color: "rgba(250,248,244,.8)", marginTop: 4,
                }}>
                  Candidature gratuite · sans engagement · réponse sous 5 jours ouvrés
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      
      {/* Animation hero */}
      <style jsx>{`
        @keyframes wada-partenaires-drift {
          from { filter: brightness(0.92); }
          to   { filter: brightness(1.06); }
        }
      `}</style>
    </main>
  );
}

/* ───────────────────── Helpers UI ───────────────────── */

const wrap: React.CSSProperties = { maxWidth: 1040, margin: "0 auto", padding: "0 32px" };

function Kicker({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      fontSize: 11, letterSpacing: "0.32em",
      textTransform: "uppercase",
      color: color || palette.olive,
      fontWeight: 500, margin: 0,
    }}>
      {children}
    </p>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <Kicker>{kicker}</Kicker>
      <h2 style={{
        fontFamily: fonts.serif, fontWeight: 300,
        fontSize: "clamp(28px, 4vw, 36px)",
        margin: "8px 0 6px",
        lineHeight: 1.15,
      }}>
        {title}
      </h2>
    </div>
  );
}

function StatCard({ num, lbl }: { num: string; lbl: string }) {
  return (
    <div style={{
      background: palette.cream,
      border: `1px solid ${palette.line}`,
      borderRadius: 20,
      padding: 28,
      boxShadow: shadow,
    }}>
      <div style={{
        fontFamily: fonts.serif, fontWeight: 300,
        fontSize: 40, color: palette.bordeaux, lineHeight: 1,
      }}>
        {num}
      </div>
      <div style={{ fontSize: 13, color: palette.inkSoft, marginTop: 6 }}>
        {lbl}
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      background: palette.cream,
      border: `1px solid ${palette.line}`,
      borderRadius: 20,
      padding: 26,
      boxShadow: shadow,
    }}>
      <h3 style={{
        fontFamily: fonts.serif, fontWeight: 400,
        fontSize: 21, marginBottom: 8, color: palette.ink,
      }}>
        {title}
      </h3>
      <p style={{ color: palette.inkSoft, fontSize: 15, lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div>
      <div style={{
        fontFamily: fonts.serif, fontSize: 30, fontWeight: 300,
        color: palette.olive, lineHeight: 1,
      }}>
        {n}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 500, margin: "8px 0 6px", color: palette.ink }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: palette.inkSoft, lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function ModelCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{
      textAlign: "center",
      padding: 26,
      border: `1px solid ${palette.line}`,
      borderRadius: 20,
      background: palette.cream,
    }}>
      <h3 style={{
        fontFamily: fonts.serif, fontWeight: 400,
        fontSize: 20, marginBottom: 6, color: palette.ink,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, color: palette.inkSoft }}>{desc}</p>
    </div>
  );
}

function btnPrimary(): React.CSSProperties {
  return {
    fontFamily: fonts.sans, fontSize: 15,
    padding: "15px 32px", borderRadius: 999,
    background: palette.bordeaux, color: palette.cream,
    border: "none", cursor: "pointer", textDecoration: "none",
    display: "inline-block", fontWeight: 500,
    transition: "transform .4s cubic-bezier(.22,1,.36,1)",
  };
}

function btnGhost(): React.CSSProperties {
  return {
    fontFamily: fonts.sans, fontSize: 15,
    padding: "15px 32px", borderRadius: 999,
    background: "transparent", color: palette.cream,
    border: "1px solid rgba(250,248,244,.5)",
    cursor: "pointer", textDecoration: "none",
    display: "inline-block", fontWeight: 500,
  };
}

function inputStyle(): React.CSSProperties {
  /* Brief UX client Partie 2 §11 (26/05) — Le form était sur fond bordeaux
     avec champs translucide (rgba 0.08) et bordure quasi invisible (0.25) :
     les placeholders ne se voyaient pas. Un partenaire qui veut postuler
     ne sait pas où taper. Maintenant : fond crème solide + bordure foncée
     + texte ink → contraste WCAG AA, lisible quel que soit le bg.
     fontSize: 16 (au lieu de 14) évite aussi le zoom iOS au focus. */
  return {
    fontFamily: fonts.sans,
    fontSize: 16,
    padding: "14px 16px",
    borderRadius: 12,
    border: `1.5px solid ${palette.ink}`,
    background: palette.cream,
    color: palette.ink,
    outline: "none",
    width: "100%",
  };
}
