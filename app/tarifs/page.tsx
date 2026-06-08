"use client";
import { useState } from "react";
import Link from "next/link";
import { dictionary } from "@/lib/data";
import {
  ink, paper, subtle, border, textSecondary,
  mojo, mojoSoft,
  sectionLabel,
  fontHeading, fontBody, fontLabel,
  buttonRadius, cardRadius,
} from "@/lib/styles";
import BackButton from "@/components/BackButton";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";
import WadaVisual from "@/components/WadaVisual";

/* ──────────────────────────────────────────────────────────────────────
   Boutons identiques à la home
   ────────────────────────────────────────────────────────────────────── */
const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "13px 24px", borderRadius: buttonRadius,
  fontFamily: fontLabel, fontSize: 13, fontWeight: 600,
  letterSpacing: "0.04em", textDecoration: "none",
  cursor: "pointer", border: "1px solid transparent",
  whiteSpace: "nowrap" as const, transition: "all 0.2s ease",
};
const btnPrimary = { ...btnBase, background: mojo, color: "#FFFFFF" };
const btnOutline = { ...btnBase, background: "transparent", color: ink, border: `1px solid ${ink}` };
const btnInk     = { ...btnBase, background: ink, color: "#FFFFFF" };

/* Brief UX client Partie 2 §9 (26/05) — 2 plans seulement (Découverte +
   Premium), Premium avec toggle Mensuel/Annuel.
   Avant : 3 cartes côte à côte (Découverte / Premium 1.99/mo / Annuel 17.99/an)
   → confusion (« Premium vs Annuel c'est le même produit, lequel est mieux ? »).
   Maintenant : 2 cartes, Premium expose les 2 fréquences via switch interne,
   badge -25% apparaît sur Annuel. Pattern standard (Notion, Linear, etc.).
*/
type PlanKey = "free" | "monthly" | "yearly";

interface FreePlan {
  key: "free";
  label: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  variant: "ghost";
}

interface PremiumPlan {
  key: "premium";
  label: string;
  /* Pour le toggle, on stocke les 2 facturations dans le même plan. */
  monthly: { price: string; period: string; key: "monthly" };
  yearly:  { price: string; period: string; key: "yearly"; savePct: string };
  description: string;
  features: string[];
  cta: string;
  badge?: string;
  variant: "primary";
}

const FREE_PLAN: FreePlan = {
  key: "free",
  label: "Découverte",
  price: "0 €",
  period: "pour toujours",
  description: "L'essentiel du dictionnaire, sans condition.",
  features: [
    "Les 348 palettes Sanzo Wada",
    "Scanner une couleur (illimité)",
    "Créer une tenue depuis une palette",
    "Liens d'achat illimités",
    "Sauvegarde des favoris",
  ],
  cta: "Commencer gratuitement",
  variant: "ghost",
};

const PREMIUM_PLAN: PremiumPlan = {
  key: "premium",
  label: "WADA Premium",
  monthly: { price: "1,99 €", period: "par mois · annulable", key: "monthly" },
  yearly:  { price: "17,99 €", period: "par an · soit 1,49 €/mois", key: "yearly", savePct: "−25 %" },
  description: "Tous les outils éditoriaux WADA, sans limite.",
  features: [
    "Tout le plan Découverte",
    "✨ Inspirations — le style selon six géographies du monde",
    "🎨 Explorer les couleurs par teinte (brique, indigo, sauge…)",
    "🌅 Looks du jour — une palette nouvelle chaque matin",
    "📅 Calendrier mensuel des tenues",
    "🧠 Styliste IA personnalisé",
    "👗 Import de garde-robe (votre dressing complet)",
  ],
  cta: "Essayer 7 jours offerts",
  badge: "Le plus choisi",
  variant: "primary",
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Combien coûtent les vêtements ?",
    a: "WADA ne vend rien directement. Vous êtes redirigé vers les boutiques (Vinted, Sézane, COS, Net-a-Porter…) où vous achetez au prix de la marque. WADA touche une petite commission d'affiliation — sans surcoût pour vous.",
  },
  {
    q: "Faut-il un compte pour commencer ?",
    a: "Non. Vous pouvez explorer toutes les palettes et acheter sans inscription. Le compte sert uniquement pour synchroniser vos favoris entre appareils et accéder à WADA Premium.",
  },
  {
    q: "Puis-je annuler mon abonnement ?",
    a: "Oui, à tout moment, sans justification ni question. Vos données restent accessibles et vos favoris conservés sur l'appareil.",
  },
  {
    q: "Pourquoi 348 palettes ?",
    a: "C'est le nombre exact d'accords chromatiques que Sanzo Wada a publiés dans A Dictionary of Color Combinations en 1933. WADA reprend chacun de ces accords et le traduit en tenue contemporaine.",
  },
  {
    q: "Le scanner couleur est-il vraiment illimité ?",
    a: "Oui. Le scanner reste libre d'usage pour tous, gratuit comme premium — c'est le cœur de l'outil, il ne sera jamais bridé.",
  },
];

export default function TarifsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const demo  = dictionary.find((d) => d.number === "002") || dictionary[0];
  const demo2 = dictionary.find((d) => d.number === "003") || dictionary[1] || dictionary[0];

  const subscribe = async (plan: "monthly" | "yearly") => {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Erreur Stripe : " + (data.error || "réessayez"));
    } catch (e: unknown) {
      alert("Erreur : " + (e instanceof Error ? e.message : "inconnue"));
    } finally {
      setLoading(null);
    }
  };

  /* Brief UX client Partie 2 §9 (26/05) — état du toggle Mensuel/Annuel
     sur la carte Premium. Yearly par défaut (incite à la formule économique). */
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const onFreeCta = () => {
    window.location.href = "/palettes";
  };
  const onPremiumCta = () => {
    subscribe(billing);
  };

  return (
    <main style={{ minHeight: "100vh", fontFamily: fontBody, background: paper, color: ink }}>
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
            <BackButton />
      <div id="main-content" />

      {/* ══════════════════════════════════════════════════════════════════
          1. HERO — fond Mojo soft, titre éditorial centré
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: mojoSoft, padding: "96px 5% 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Tarifs</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{
              fontFamily: fontHeading, fontSize: 80, fontWeight: 500,
              lineHeight: 1.04, letterSpacing: "-0.02em", margin: 0,
              fontStyle: "italic", color: ink,
            }}>
              Simple, <SketchUnderline color={mojo}>transparent</SketchUnderline>,<br />annulable.
            </h1>
            <p style={{
              fontFamily: fontBody, fontSize: 18, lineHeight: 1.7,
              color: textSecondary, margin: "28px auto 0", maxWidth: 620,
            }}>
              Les 348 palettes sont gratuites, pour toujours. WADA Premium ajoute la mémoire
              de style, le calendrier mensuel et l'accès anticipé. Annulable à tout moment.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2. PRICING TABLE — 3 plans sur fond Mojo soft (continue)
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: mojoSoft, padding: "0 5% 96px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <Reveal>
            {/* Brief UX client Partie 2 §9 (26/05) — 2 plans au lieu de 3 :
                Découverte + Premium. Premium expose les 2 fréquences via
                un toggle sur la carte (pattern Notion/Linear). Grid 2 cols
                au lieu de 3, plus respirant + plus standard SaaS. */}
            <div className="wada-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
              {/* ─── CARTE 1 : DÉCOUVERTE (gratuite) ─── */}
              <article className="wada-lift" style={{
                padding: "48px 32px 36px",
                background: paper,
                border: `1px solid ${border}`,
                borderRadius: cardRadius,
                display: "flex", flexDirection: "column",
                position: "relative",
                minHeight: 560,
              }}>
                <p style={{ ...sectionLabel, marginBottom: 18, color: ink, fontWeight: 600 }}>{FREE_PLAN.label}</p>
                <h2 style={{
                  fontFamily: fontHeading, fontSize: 64, fontStyle: "italic", fontWeight: 500,
                  margin: "0 0 6px", lineHeight: 0.95, letterSpacing: "-0.025em", color: ink,
                }}>
                  {FREE_PLAN.price}
                </h2>
                <p style={{ fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic", margin: "0 0 22px" }}>
                  {FREE_PLAN.period}
                </p>
                <p style={{
                  fontFamily: fontHeading, fontSize: 17, color: textSecondary,
                  fontStyle: "italic", margin: "0 0 28px", lineHeight: 1.5, letterSpacing: "-0.005em",
                }}>
                  {FREE_PLAN.description}
                </p>
                <ul style={{
                  listStyle: "none", padding: 0, margin: "0 0 32px",
                  fontFamily: fontBody, fontSize: 15, lineHeight: 1.7, color: textSecondary, flex: 1,
                }}>
                  {FREE_PLAN.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                        background: mojoSoft, color: mojo,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: fontLabel, fontSize: 10, fontWeight: 700, marginTop: 3,
                      }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onFreeCta}
                  style={{
                    ...btnOutline, justifyContent: "center", padding: "15px 20px",
                  }}
                >
                  <span>{FREE_PLAN.cta}</span>
                  <HandArrow size={22} color={ink} />
                </button>
              </article>

              {/* ─── CARTE 2 : PREMIUM (toggle Mensuel/Annuel) ─── */}
              <article className="wada-lift" style={{
                padding: "48px 32px 36px",
                background: paper,
                border: `2px solid ${mojo}`,
                borderRadius: cardRadius,
                display: "flex", flexDirection: "column",
                position: "relative",
                minHeight: 560,
              }}>
                {/* Badge "Le plus choisi" centré en haut */}
                {PREMIUM_PLAN.badge && (
                  <span style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: mojo, color: "#FFFFFF",
                    padding: "7px 18px", fontSize: 10, letterSpacing: "0.28em",
                    textTransform: "uppercase", fontFamily: fontLabel, fontWeight: 700,
                    borderRadius: 6,
                  }}>
                    {PREMIUM_PLAN.badge}
                  </span>
                )}

                <p style={{ ...sectionLabel, marginBottom: 18, color: mojo, fontWeight: 600 }}>
                  {PREMIUM_PLAN.label}
                </p>

                {/* Toggle Mensuel / Annuel — pill-style avec actif bordeaux */}
                <div role="tablist" aria-label="Choisir la fréquence de facturation" style={{
                  display: "inline-flex", padding: 4, gap: 4,
                  background: mojoSoft, borderRadius: 999,
                  marginBottom: 22, alignSelf: "flex-start",
                }}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={billing === "monthly"}
                    onClick={() => setBilling("monthly")}
                    style={{
                      padding: "8px 18px", borderRadius: 999, border: "none",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      fontFamily: fontLabel, letterSpacing: "0.04em",
                      background: billing === "monthly" ? mojo : "transparent",
                      color: billing === "monthly" ? "#FFFFFF" : ink,
                      transition: "all 0.2s ease",
                    }}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={billing === "yearly"}
                    onClick={() => setBilling("yearly")}
                    style={{
                      padding: "8px 18px", borderRadius: 999, border: "none",
                      cursor: "pointer", fontSize: 13, fontWeight: 600,
                      fontFamily: fontLabel, letterSpacing: "0.04em",
                      background: billing === "yearly" ? mojo : "transparent",
                      color: billing === "yearly" ? "#FFFFFF" : ink,
                      transition: "all 0.2s ease",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >
                    Annuel
                    {/* Badge -25% qui apparaît sur l'option Annuel */}
                    <span style={{
                      background: billing === "yearly" ? "rgba(255,255,255,.22)" : ink,
                      color: "#FFFFFF",
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      padding: "2px 6px", borderRadius: 4,
                    }}>
                      {PREMIUM_PLAN.yearly.savePct}
                    </span>
                  </button>
                </div>

                <h2 style={{
                  fontFamily: fontHeading, fontSize: 64, fontStyle: "italic", fontWeight: 500,
                  margin: "0 0 6px", lineHeight: 0.95, letterSpacing: "-0.025em", color: ink,
                }}>
                  {PREMIUM_PLAN[billing].price}
                </h2>
                <p style={{ fontFamily: fontBody, fontSize: 13, color: subtle, fontStyle: "italic", margin: "0 0 22px" }}>
                  {PREMIUM_PLAN[billing].period}
                </p>

                <p style={{
                  fontFamily: fontHeading, fontSize: 17, color: textSecondary,
                  fontStyle: "italic", margin: "0 0 28px", lineHeight: 1.5, letterSpacing: "-0.005em",
                }}>
                  {PREMIUM_PLAN.description}
                </p>

                <ul style={{
                  listStyle: "none", padding: 0, margin: "0 0 32px",
                  fontFamily: fontBody, fontSize: 15, lineHeight: 1.7, color: textSecondary, flex: 1,
                }}>
                  {PREMIUM_PLAN.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                        background: mojo, color: "#FFFFFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: fontLabel, fontSize: 10, fontWeight: 700, marginTop: 3,
                      }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onPremiumCta}
                  disabled={loading === billing}
                  style={{
                    ...btnPrimary, justifyContent: "center", padding: "15px 20px",
                    opacity: loading === billing ? 0.6 : 1,
                    cursor: loading === billing ? "wait" : "pointer",
                  }}
                >
                  <span>{loading === billing ? "…" : PREMIUM_PLAN.cta}</span>
                  {loading !== billing && <HandArrow size={22} color="#FFFFFF" />}
                </button>
              </article>
            </div>

            <p style={{
              textAlign: "center", marginTop: 36,
              fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.3em",
              textTransform: "uppercase", color: subtle, fontWeight: 600,
            }}>
              Paiement sécurisé Stripe · aucun engagement
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3. POURQUOI WADA — 3 reasons sur fond paper
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 64px" }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Pourquoi WADA</p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 56, fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 16px",
                fontStyle: "italic", color: ink,
              }}>
                Un <SketchUnderline color={mojo}>investissement</SketchUnderline> dans votre style.
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 17, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
                Le prix d'un café par mois pour cesser d'acheter des vêtements qui ne vous vont pas.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="wada-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
              <ReasonCard
                glyph="✦"
                title="Annulable"
                desc="À tout moment, sans question ni justification. Vos favoris restent sur votre appareil."
              />
              <ReasonCard
                glyph="◆"
                title="Scanner libre"
                desc="Le scanner couleur reste gratuit pour tous, à vie. Premium ajoute la personnalisation."
              />
              <ReasonCard
                glyph="◇"
                title="Aucun spam"
                desc="Une lettre du dimanche, c'est tout. Pas de relance, pas de push intempestif."
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4. TESTIMONIALS — 2 voix sur fond Mojo soft
          ══════════════════════════════════════════════════════════════════ */}
      {/* Brief P0 confiance 2026-05-28 : les témoignages nominatifs ont été
          retirés (faux avis = perte de confiance + risque légal). Remplacés
          par 3 éléments factuels vérifiables : la source historique du
          dictionnaire, le volume éditorial, la promesse zéro friction. */}
      <section style={{ background: mojoSoft, padding: "96px 5%" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 64px" }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Repères</p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 56, fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 16px",
                fontStyle: "italic", color: ink,
              }}>
                Une bibliothèque, <SketchUnderline color={mojo}>vraiment</SketchUnderline>.
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div
              className="wada-testimonials-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 40,
                maxWidth: 1080,
                margin: "0 auto",
              }}
            >
              <FactCard
                kicker="Source"
                title="Sanzo Wada · 1933"
                body="Le dictionnaire historique des accords chromatiques, traduit en tenues à porter."
              />
              <FactCard
                kicker="Catalogue"
                title="348 palettes"
                body="Toutes accessibles, gratuitement, avec leur tenue prête à acheter."
              />
              <FactCard
                kicker="Promesse"
                title="Sans inscription"
                body="Le scanner et l'achat fonctionnent sans compte. Le Premium ne déverrouille que la mémoire."
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5. FAQ — accordion sur fond paper
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ ...sectionLabel, color: mojo, marginBottom: 16, fontWeight: 600 }}>Encore une question</p>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 52, fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0,
                fontStyle: "italic", color: ink,
              }}>
                Cinq <SketchUnderline color={mojo}>réponses</SketchUnderline> brèves.
              </h2>
            </div>
          </Reveal>

          <Reveal>
            <div>
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  style={{
                    borderBottom: `1px solid ${border}`,
                    padding: "24px 0",
                  }}
                >
                  <summary style={{
                    cursor: "pointer",
                    fontFamily: fontHeading,
                    fontSize: 20,
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: ink,
                    listStyle: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    letterSpacing: "-0.01em",
                  }}>
                    <span style={{ flex: 1 }}>{f.q}</span>
                    {/* Brief 2026-06-07 (polish) — l'indicateur « + » restait
                        « + » même question ouverte. Il tourne maintenant à 45°
                        (→ « × ») via CSS quand le <details> est ouvert, pour
                        refléter l'état. inline-block requis pour le transform. */}
                    <span className="wada-faq-toggle" style={{
                      fontFamily: fontHeading, fontSize: 24, color: mojo,
                      lineHeight: 1, fontWeight: 500, flexShrink: 0,
                      display: "inline-block",
                    }}>
                      +
                    </span>
                  </summary>
                  <p style={{
                    marginTop: 16,
                    fontFamily: fontBody, fontSize: 16,
                    color: textSecondary, lineHeight: 1.7,
                    paddingRight: 40,
                  }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
            <p style={{
              textAlign: "center", marginTop: 48,
              fontFamily: fontBody, fontSize: 15, color: textSecondary,
              fontStyle: "italic",
            }}>
              Autre question ?{" "}
              <Link href="/contact" style={{ color: ink, textDecoration: "none" }}>
                <SketchUnderline color={mojo}>Écrivez-nous</SketchUnderline>
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          6. CTA marbré — identique home
          ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "0 5% 96px" }}>
        <Reveal>
          <div style={{
            position: "relative",
            maxWidth: 1280, margin: "0 auto",
            borderRadius: cardRadius, overflow: "hidden",
            isolation: "isolate",
          }}>
            <div style={{ position: "absolute", inset: 0, zIndex: -2 }}>
              <WadaVisual
                kind="texture-paper"
                colors={[demo.colors[0]?.hex || "#1F1B16", demo2.colors[0]?.hex || mojo, demo.colors[demo.colors.length - 1]?.hex || "#F4EFE6"]}
                minHeight={520}
              />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "rgba(31, 27, 22, 0.62)", zIndex: -1 }} />
            <div style={{ padding: "104px 32px", textAlign: "center", color: "#FFFFFF" }}>
              <h2 style={{
                fontFamily: fontHeading, fontSize: 56, fontWeight: 500,
                lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 20px",
                fontStyle: "italic", color: "#FFFFFF",
              }}>
                Sept jours <SketchUnderline color="#FFFFFF">offerts</SketchUnderline>. Aucune carte.
              </h2>
              <p style={{ fontFamily: fontBody, fontSize: 19, color: "rgba(255,255,255,0.85)", margin: "0 auto 32px", maxWidth: 560, lineHeight: 1.5 }}>
                Essayez Premium sans engagement. Annulez en un clic si ça ne vous parle pas.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => subscribe("monthly")}
                  disabled={loading === "monthly"}
                  style={{ ...btnPrimary, cursor: loading === "monthly" ? "wait" : "pointer", opacity: loading === "monthly" ? 0.6 : 1 }}
                >
                  <span>{loading === "monthly" ? "…" : "Essayer Premium"}</span>
                  {loading !== "monthly" && <HandArrow size={26} color="#FFFFFF" />}
                </button>
                <Link href="/palettes" style={{ ...btnOutline, color: "#FFFFFF", borderColor: "#FFFFFF" }}>
                  Découvrir d'abord
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

          </main>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   COMPOSANTS LOCAUX
   ════════════════════════════════════════════════════════════════════════ */
function ReasonCard(props: { glyph: string; title: string; desc: string }) {
  return (
    <article className="wada-lift" style={{
      background: paper,
      borderRadius: cardRadius,
      border: `1px solid ${border}`,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: mojoSoft, color: mojo,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: fontHeading, fontSize: 22, fontStyle: "italic", fontWeight: 600,
        marginBottom: 4,
      }}>
        {props.glyph}
      </div>
      <h3 style={{
        fontFamily: fontHeading, fontSize: 26, fontWeight: 500,
        lineHeight: 1.2, letterSpacing: "-0.01em", margin: 0,
        fontStyle: "italic", color: ink,
      }}>
        {props.title}
      </h3>
      <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
        {props.desc}
      </p>
    </article>
  );
}

/** FactCard — remplace TestimonialV2 sur /tarifs (brief P0 2026-05-28).
 *  Cartes factuelles vérifiables au lieu d'avis nominatifs inventés.
 *  Conservé visuellement proche pour ne pas casser la grille. */
function FactCard(props: { kicker: string; title: string; body: string }) {
  return (
    <article style={{ textAlign: "center", padding: "0 16px" }}>
      <p style={{
        fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
        letterSpacing: "0.32em", textTransform: "uppercase",
        color: mojo, margin: "0 0 14px",
      }}>
        {props.kicker}
      </p>
      <h3 style={{
        fontFamily: fontHeading, fontSize: 32, fontStyle: "italic", fontWeight: 500,
        lineHeight: 1.1, color: ink, margin: "0 0 18px",
      }}>
        {props.title}
      </h3>
      <p style={{
        fontFamily: fontBody, fontSize: 15.5,
        color: textSecondary, margin: 0, lineHeight: 1.55,
      }}>
        {props.body}
      </p>
    </article>
  );
}

function TestimonialV2(props: { quote: string; name: string; role: string; accentColor: string }) {
  return (
    <article style={{ textAlign: "center", padding: "0 16px" }}>
      <p style={{
        fontFamily: fontHeading,
        fontSize: 24, fontStyle: "italic", fontWeight: 500,
        lineHeight: 1.45, color: ink, margin: "0 0 36px",
        letterSpacing: "-0.005em",
      }}>
        « {props.quote} »
      </p>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: props.accentColor, color: paper,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px",
        fontFamily: fontHeading, fontSize: 22, fontStyle: "italic", fontWeight: 500,
        border: `2px solid ${border}`,
      }}>
        {props.name.charAt(0)}
      </div>
      <p style={{ fontFamily: fontLabel, fontSize: 13, fontWeight: 600, margin: 0, color: ink, letterSpacing: "0.02em" }}>
        {props.name}
      </p>
      <p style={{ fontFamily: fontBody, fontSize: 13, color: subtle, margin: "2px 0 0", fontStyle: "italic" }}>
        {props.role}
      </p>
    </article>
  );
}

