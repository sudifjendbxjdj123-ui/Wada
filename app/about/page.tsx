"use client";
import Link from "next/link";
import { dictionary } from "@/lib/data";
import {
  ink, paper, subtle, border, textSecondary, cardBg,
  mojo, mojoSoft, seal,
  sectionLabel,
  fontBody, fontLabel,
  buttonRadius, cardRadius,
} from "@/lib/styles";
import BackButton from "@/components/BackButton";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";
import Reveal from "@/components/Reveal";
import PaletteCardMatisse from "@/components/PaletteCardMatisse";

// Police titres unifiée brief 2026-05-21 : Bagel Fat One sitewide
// (cohérence d'identité avec /, /atelier, /palettes, /palette/[n], /stylist).
// Le serif italique reste sur les CITATIONS et le corps long, pas les titres.
const fontDisplay = "'Fredoka', sans-serif";

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

const headingStyle = {
  // Bagel Fat One (chubby/rounded) au lieu de Fraunces serif italique.
  // Cohérence avec le reste du site (brief mobile 2026-05-21).
  fontFamily: fontDisplay, fontWeight: 700, fontStyle: "normal" as const,
  letterSpacing: "0.005em", color: ink, margin: 0, lineHeight: 1.05,
};
const paragraphStyle = {
  fontFamily: fontBody, fontSize: 18, lineHeight: 1.75,
  color: textSecondary, margin: "0 0 18px",
};
const phraseStyle = {
  fontFamily: fontBody, fontStyle: "italic" as const, fontSize: 26, fontWeight: 500,
  lineHeight: 1.45, color: ink, margin: "0 0 18px", letterSpacing: 0,
};

export default function AboutPage() {
  const rosée = dictionary.find((d) => d.number === "002") || dictionary[0];

  return (
    <main className="wada-page-opaque" style={{ minHeight: "100vh", fontFamily: fontBody, background: paper, color: ink }}>
      <a href="#main-content" className="wada-skip-link">Aller au contenu</a>
            <BackButton />
      <div id="main-content" />

      {/* ════════════════════════════════════════════════════════════
          1. HERO — manifesto d'ouverture, centré, court
          ════════════════════════════════════════════════════════════ */}
      {/* Hero éditorial avec moodboard-4 en fond (architecture travertin,
          ombre d'arbre — beaucoup de vide, ambiance Loewe/COS). Voile clair
          .55→.85 pour préserver la lisibilité du texte ink. Fade-to-paper
          en bas pour transition douce vers la prose suivante. */}
      <section
        className="wada-media-bg wada-paper-grain wada-fade-to-cream"
        style={{
          padding: "96px 5% 120px",
          // @ts-ignore CSS var
          "--media-image": "url(/hero/moodboard-4.webp)",
          minHeight: 460,
        } as React.CSSProperties}
      >
        <div className="wada-media-scrim wada-media-scrim-light" />
        <div className="wada-media-content" style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: mojo, marginBottom: 24, fontWeight: 700, fontSize: 11, letterSpacing: "0.5em" }}>
              À propos
            </p>
            <h1 style={{
              ...headingStyle,
              fontSize: "clamp(36px, 7vw, 84px)",
              lineHeight: 1.05,
            }}>
              {/* Brief audit live 2026-05-27 : retire le saut de ligne JSX
                  après <br/> qui ajoutait un espace indent indésirable
                  (« : rendre » → « :  rendre »). */}
              WADA est né d'une <SketchUnderline color={mojo}>idée simple</SketchUnderline> :<br />rendre le style plus facile.
            </h1>
            <p style={{ ...paragraphStyle, marginTop: 36, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
              Pas besoin d'être expert en mode. Pas besoin de passer des heures
              devant son armoire. WADA aide simplement à trouver des couleurs
              et des vêtements qui vont bien ensemble.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. L'IDÉE — récit d'origine, prose éditoriale narrow column
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>Chapitre 01 · L'idée</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 32px" }}>
              Tout est parti d'un problème très simple.
            </h2>
            <p style={paragraphStyle}>
              Passer trop de temps devant son armoire sans savoir quoi mettre.
            </p>
            <p style={phraseStyle}>
              « Pourquoi s'habiller doit-il toujours demander autant d'énergie ? »
            </p>
            <p style={paragraphStyle}>
              Quelques semaines plus tard, découverte d'un ancien livre du peintre
              japonais <strong style={{ color: ink, fontStyle: "italic" }}>Sanzo Wada</strong>.
              En 1933, il avait réuni <strong style={{ color: ink }}>348 combinaisons
              de couleurs</strong> pensées pour fonctionner naturellement ensemble.
            </p>
            <p style={paragraphStyle}>
              Et là, déclic. Si des couleurs fonctionnent ensemble, alors une
              tenue construite autour de ces couleurs fonctionne aussi.
            </p>
            <p style={{ ...phraseStyle, color: mojo, fontSize: 26, marginTop: 28 }}>
              C'est comme ça qu'est né WADA.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. CE QUE FAIT WADA — bullet list courte
          ════════════════════════════════════════════════════════════ */}
      <section className="wada-paper-grain" style={{ background: cardBg, padding: "80px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: seal, marginBottom: 18, textAlign: "center" }}>Chapitre 02 · Ce que fait WADA</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)", margin: "0 auto 36px", textAlign: "center", maxWidth: 700 }}>
              WADA transforme chaque palette en quatre choses.
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
              marginTop: 40,
            }}>
              {[
                { num: "I",   label: "Une tenue complète",    desc: "Composée pour fonctionner ensemble, du haut aux chaussures." },
                { num: "II",  label: "Des idées de style",    desc: "Adaptées à votre humeur, à votre saison, à votre culture." },
                { num: "III", label: "Des vêtements réels",   desc: "Choisis dans une sélection de boutiques curées, du vintage au luxe." },
                { num: "IV",  label: "Des liens d'achat",     desc: "Directs, transparents, sans intermédiaire." },
              ].map((it) => (
                <div key={it.num} style={{
                  background: paper, border: `1px solid ${border}`, borderRadius: cardRadius,
                  padding: "24px 22px",
                }}>
                  <p style={{
                    fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                    fontSize: 22, color: mojo, margin: "0 0 12px", letterSpacing: 0,
                  }}>
                    {it.num}
                  </p>
                  <h3 style={{
                    fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                    fontSize: 20, color: ink, margin: "0 0 10px", letterSpacing: "-0.01em",
                  }}>
                    {it.label}
                  </h3>
                  <p style={{ fontFamily: fontBody, fontSize: 14, color: textSecondary, lineHeight: 1.55, margin: 0 }}>
                    {it.desc}
                  </p>
                </div>
              ))}
            </div>
            <p style={{
              ...phraseStyle, textAlign: "center",
              fontSize: 22, marginTop: 44, color: ink,
              maxWidth: 600, marginLeft: "auto", marginRight: "auto",
            }}>
              Vous scannez une couleur, WADA aide à construire le reste.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. UNE PALETTE DEVIENT UNE TENUE — exemple visuel
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "center",
            }} className="wada-hero-grid">
              <div>
                <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>Chapitre 03 · L'exemple</p>
                <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 40px)", margin: "0 0 18px", lineHeight: 1.1 }}>
                  Une palette devient une tenue.
                </h2>
                <p style={{
                  fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                  fontSize: 28, color: mojo, margin: "0 0 12px", letterSpacing: "-0.01em",
                }}>
                  {rosée.name}
                </p>
                <p style={{
                  fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.3em",
                  textTransform: "uppercase", color: subtle, margin: "0 0 24px", fontWeight: 600,
                }}>
                  {rosée.colors.map((c) => c.name).join(" · ")}
                </p>
                <p style={paragraphStyle}>
                  Une palette douce inspirée du dictionnaire original de Sanzo
                  Wada — transformée en tenue moderne, portable, shoppable.
                </p>
              </div>
              <div style={{
                background: paper, border: `1px solid ${border}`, borderRadius: cardRadius,
                overflow: "hidden",
                boxShadow: "var(--wada-shadow-3)",
              }}>
                <PaletteCardMatisse entry={rosée} height={420} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. POUR TOUS LES BUDGETS — 4 tiers, grille
          ════════════════════════════════════════════════════════════ */}
      <section className="wada-paper-grain" style={{ background: mojoSoft, padding: "96px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
              <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>Chapitre 04 · Pour tous les budgets</p>
              <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)" }}>
                Chaque palette s'adapte à votre budget.
              </h2>
              <p style={{ ...paragraphStyle, marginTop: 18 }}>
                Quatre niveaux de prix, du vintage 5 € au luxe quiet. Vous choisissez.
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 18,
            }}>
              {[
                {
                  label: "Seconde main",
                  brands: "Vinted · Vestiaire Collective",
                  desc: "Pour trouver des pièces uniques, moins chères et plus durables.",
                  range: "5–80 €",
                },
                {
                  label: "Accessible",
                  brands: "Zara · H&M · Uniqlo",
                  desc: "Des basiques simples et faciles à porter au quotidien.",
                  range: "20–150 €",
                },
                {
                  label: "Durable",
                  brands: "COS · Sézane · Massimo Dutti",
                  desc: "De meilleures matières, des coupes intemporelles.",
                  range: "80–400 €",
                },
                {
                  label: "Investissement",
                  brands: "Polène · Lemaire · Khaite",
                  desc: "Des pièces plus rares qu'on garde longtemps.",
                  range: "300–2000 €",
                },
              ].map((tier) => (
                <div key={tier.label} style={{
                  background: paper, border: `1px solid ${border}`, borderRadius: cardRadius,
                  padding: "26px 24px 24px",
                }}>
                  <p style={{
                    fontFamily: fontLabel, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.35em", textTransform: "uppercase",
                    color: mojo, margin: "0 0 14px",
                  }}>
                    {tier.label}
                  </p>
                  <p style={{
                    fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                    fontSize: 18, color: ink, margin: "0 0 14px", lineHeight: 1.25, letterSpacing: "-0.01em",
                  }}>
                    {tier.brands}
                  </p>
                  <p style={{ fontFamily: fontBody, fontSize: 13, color: textSecondary, lineHeight: 1.55, margin: "0 0 14px" }}>
                    {tier.desc}
                  </p>
                  <p style={{
                    fontFamily: fontLabel, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em",
                    color: ink, margin: 0,
                  }}>
                    {tier.range}
                    <span style={{ fontFamily: fontBody, fontSize: 11, color: subtle, fontStyle: "italic", letterSpacing: "0.02em", marginLeft: 8, fontWeight: 400 }}>
                      fourchette
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. LE MODÈLE — gratuit + monétisation transparente
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>Chapitre 05 · Le modèle</p>
              <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)" }}>
                Gratuit et <SketchUnderline color={mojo}>simple</SketchUnderline>.
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                {
                  num: "01",
                  title: "Le site reste gratuit",
                  desc: "Les palettes, le scanner et les recommandations restent accessibles sans abonnement.",
                },
                {
                  num: "02",
                  title: "Pas de publicité intrusive",
                  desc: "Pas de pop-ups partout. Pas d'expérience surchargée. Pas de tracking publicitaire.",
                },
                {
                  num: "03",
                  title: "Des liens affiliés transparents",
                  desc: "Quand vous achetez via certains liens, WADA peut recevoir une petite commission, sans coût supplémentaire pour vous. C'est ce qui permet au projet d'exister.",
                },
                {
                  num: "04",
                  title: "Un abonnement optionnel",
                  desc: "Pour aller plus loin : recommandations personnalisées, calendrier de tenues, nouvelles palettes en avant-première.",
                },
              ].map((item) => (
                <div key={item.num} style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 24,
                  paddingBottom: 24,
                  borderBottom: `1px solid ${border}`,
                  alignItems: "start",
                }}>
                  <span style={{
                    fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                    fontSize: 32, color: mojo, lineHeight: 1, marginTop: 2,
                  }}>
                    {item.num}
                  </span>
                  <div>
                    <h3 style={{
                      fontFamily: fontBody, fontStyle: "italic", fontWeight: 500,
                      fontSize: 22, color: ink, margin: "0 0 10px", letterSpacing: "-0.01em",
                    }}>
                      {item.title}
                    </h3>
                    <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, lineHeight: 1.65, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. LE DICTIONNAIRE — 348 palettes
          ════════════════════════════════════════════════════════════ */}
      <section className="wada-paper-grain" style={{ background: cardBg, padding: "96px 5%", borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>Le cœur du projet</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.04 }}>
              348 palettes.<br />348 inspirations.
            </h2>
            <p style={{ ...paragraphStyle, marginTop: 28 }}>
              Chaque accord de couleurs devient une silhouette prête à porter.
              Des palettes inspirées du livre original de 1933, adaptées à aujourd'hui.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          8. CLOSING — merci + lieu/année
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4.5vw, 44px)", marginBottom: 28 }}>
              Merci d'être là.
            </h2>
            <p style={{ ...paragraphStyle, fontSize: 17 }}>
              WADA est encore indépendant, construit petit à petit avec beaucoup
              d'attention. Et ce n'est que le début.
            </p>
            <p style={{
              fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.4em",
              textTransform: "uppercase", color: subtle, margin: "44px 0 0", fontWeight: 600,
            }}>
              Genève · 2026
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          9. CTA FINAL
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "0 5% 96px" }}>
        <Reveal>
          <div style={{
            background: ink, color: paper,
            maxWidth: 1100, margin: "0 auto",
            padding: "80px 32px",
            borderRadius: cardRadius,
            textAlign: "center",
            boxShadow: "var(--wada-shadow-4)",
          }}>
            <p style={{ ...sectionLabel, color: mojo, marginBottom: 18, fontWeight: 700, letterSpacing: "0.5em" }}>
              La suite
            </p>
            <h2 className="wada-text-3d-paper" style={{
              ...headingStyle, color: paper,
              fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 20,
            }}>
              Découvrez les palettes WADA.
            </h2>
            <p style={{
              fontFamily: fontBody, fontSize: 18, color: "rgba(244, 239, 230, 0.85)",
              lineHeight: 1.6, margin: "0 auto 36px", maxWidth: 560,
            }}>
              Le dictionnaire complet, pensé pour vous aider à mieux vous habiller
              au quotidien.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/palettes" style={btnPrimary} data-wada-btn>
                <span>Explorer les palettes</span>
                <HandArrow size={22} color="#FFFFFF" />
              </Link>
              <Link href="/scanner" style={{ ...btnOutline, color: paper, borderColor: paper }} data-wada-btn>
                <span>Scanner une couleur</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ POUR LES MARQUES PARTENAIRES ═══
          Encart court qui redirige les Account Managers Awin et les
          responsables affiliation des marques vers /partenaires.
          Discret, en bas, signal pro pour qui sait quoi chercher. */}
      <section style={{ background: paper, padding: "64px 5% 96px", borderTop: `1px solid ${border}` }}>
        <div style={{
          maxWidth: 880, margin: "0 auto",
          padding: "32px 36px",
          background: "rgba(196,78,58,0.05)",
          border: `1px solid ${border}`,
          borderRadius: 16,
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.4em", textTransform: "uppercase",
            color: mojo, margin: "0 0 14px",
          }}>
            Pour les marques partenaires
          </p>
          <h3 style={{
            fontFamily: fontBody, fontSize: 26, fontWeight: 500,
            fontStyle: "italic", margin: "0 0 14px", color: ink,
            letterSpacing: "-0.01em",
          }}>
            Vous gérez un programme d'affiliation ?
          </h3>
          <p style={{
            fontFamily: fontBody, fontSize: 15, color: textSecondary,
            margin: "0 auto 22px", maxWidth: 560, lineHeight: 1.6,
          }}>
            Audience cible, méthodes de promotion, engagements éditoriaux —
            tout est détaillé pour les Account Managers et responsables affiliés.
          </p>
          <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/partenaires"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px",
                background: ink, color: paper,
                fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.25em", textTransform: "uppercase",
                textDecoration: "none", borderRadius: 999,
              }}
            >
              Pour les marques →
            </Link>
            <Link
              href="/affiliation"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px",
                background: "transparent", color: ink,
                border: `1px solid ${ink}`,
                fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.25em", textTransform: "uppercase",
                textDecoration: "none", borderRadius: 999,
              }}
            >
              Affiliation transparence
            </Link>
          </div>
        </div>
      </section>

          </main>
  );
}
