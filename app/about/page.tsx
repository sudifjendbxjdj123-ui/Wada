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
/* Brief client 2026-05-26 : un seul composant PaletteCard partout —
   l'ancien PaletteCardMatisse (décoratif Matisse cut-out / Pantone) est
   supprimé. À propos utilise maintenant la même carte propre que la
   grille /palettes. */
import PaletteCard from "@/components/PaletteCard";

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
  /* Brief §4 (2026-05-29) : 3 palettes contrastées pour la section
     « En un exemple » — illustre mieux la diversité des 348 accords
     qu'une seule palette douce. Mix : doux (002 Rosée du matin) +
     neutre/minéral (094 Béton & Lin) + saturé (071) pour montrer
     l'amplitude chromatique du dictionnaire. fallback dictionary[0]
     si un n° manque (data sain attendu). */
  const showcase = ["002", "094", "071"]
    .map((n) => dictionary.find((d) => d.number === n))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

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
            {/* Brief client 2026-05-29 §1 : titre cassé (« : rendre… plus »
                + « facile. » seul). Remplacé par une promesse courte et
                frappante en 1 ligne + sous-titre orienté bénéfice client
                (action → résultat). */}
            <h1 style={{
              ...headingStyle,
              fontSize: "clamp(40px, 8vw, 92px)",
              lineHeight: 1.02,
            }}>
              Rendre le style <SketchUnderline color={mojo}>plus facile.</SketchUnderline>
            </h1>
            <p style={{
              ...paragraphStyle, marginTop: 28, maxWidth: 600,
              marginLeft: "auto", marginRight: "auto",
              fontSize: 20,
            }}>
              Pas besoin d'être expert en mode. Scannez une couleur — WADA construit la tenue qui va avec.
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
            {/* Brief §2 : labels « Chapitre 0X · Y » remplacés par
                labels courts (ou retirés). Ne garder que 2-3 labels
                visibles pour ne pas faire « sommaire de livre ». */}
            <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>L'IDÉE</p>
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
            {/* Brief §7 ton client : « Et là, déclic. » retiré.
                « C'est comme ça qu'est né WADA » → « C'est l'idée fondatrice de WADA ». */}
            <p style={paragraphStyle}>
              Si des couleurs fonctionnent ensemble, alors une tenue
              construite autour de ces couleurs fonctionne aussi.
            </p>
            <p style={{ ...phraseStyle, color: mojo, fontSize: 26, marginTop: 28 }}>
              C'est l'idée fondatrice de WADA.
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
            {/* Brief §2 : « Chapitre 02 · Ce que fait WADA » → « CE QUE FAIT WADA ». */}
            <p style={{ ...sectionLabel, color: seal, marginBottom: 18, textAlign: "center" }}>CE QUE FAIT WADA</p>
            <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)", margin: "0 auto 36px", textAlign: "center", maxWidth: 700 }}>
              WADA transforme chaque palette en quatre choses.
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
              marginTop: 40,
            }}>
              {/* Brief §3 : pictos SVG au lieu de I/II/III/IV italiques —
                  repère visuel concret par carte, scannable au coup d'œil. */}
              {[
                {
                  label: "Une tenue complète",
                  desc: "Composée pour fonctionner ensemble, du haut aux chaussures.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4l-3 2 1 4 2-1v11h8V9l2 1 1-4-3-2-2 2h-4z" />
                    </svg>
                  ),
                },
                {
                  label: "Des idées de style",
                  desc: "Adaptées à votre humeur, à votre saison, à votre culture.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" />
                    </svg>
                  ),
                },
                {
                  label: "Des vêtements réels",
                  desc: "Choisis dans une sélection de boutiques curées, du vintage au luxe.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l3-4h12l3 4-9 12-9-12z" />
                      <path d="M3 8h18" />
                    </svg>
                  ),
                },
                {
                  label: "Des liens d'achat",
                  desc: "Directs, transparents, sans intermédiaire.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="20" r="1.4" />
                      <circle cx="17" cy="20" r="1.4" />
                      <path d="M3 4h2l3 12h11l2-8H6" />
                    </svg>
                  ),
                },
              ].map((it) => (
                <div key={it.label} style={{
                  background: paper, border: `1px solid ${border}`, borderRadius: cardRadius,
                  padding: "24px 22px",
                }}>
                  <div style={{ color: mojo, marginBottom: 14 }}>{it.icon}</div>
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
            {/* Brief §7 : « Vous scannez une couleur, WADA aide à construire
                le reste » → « Vous scannez une couleur. La tenue arrive. »
                Plus net, plus orienté bénéfice. */}
            <p style={{
              ...phraseStyle, textAlign: "center",
              fontSize: 22, marginTop: 44, color: ink,
              maxWidth: 600, marginLeft: "auto", marginRight: "auto",
            }}>
              Vous scannez une couleur. La tenue arrive.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          BRIEF §5 : CTA intermédiaire — ne pas attendre la fin de page.
          Pill plein largeur immédiatement après la section « 4 choses ».
          Le CTA en bandeau noir final reste pour ceux qui ont tout lu.
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "48px 5% 24px", textAlign: "center" }}>
        <Link
          href="/scanner"
          style={{
            ...btnPrimary,
            padding: "16px 32px",
            fontSize: 14,
            letterSpacing: "0.06em",
          }}
          data-wada-btn
        >
          <span>Essayer WADA · Scanner une couleur</span>
          <HandArrow size={22} color="#FFFFFF" />
        </Link>
        <p style={{ fontSize: 13, color: textSecondary, marginTop: 14, fontFamily: fontBody }}>
          Gratuit, sans inscription.
        </p>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. UNE PALETTE DEVIENT UNE TENUE — exemple visuel
          Brief §4 (2026-05-29) : 1 palette pour illustrer 348 = sous-
          vendeur. Maintenant 3 palettes contrastées côte à côte (Rosée
          du matin / Béton & Lin / une 3e plus saturée). C'est la SEULE
          preuve visuelle de la promesse — elle doit en mettre plein la
          vue. Texte court à gauche, grille 3 cards à droite/dessous.
          ════════════════════════════════════════════════════════════ */}
      <section style={{ background: paper, padding: "96px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
              <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>EN UN EXEMPLE</p>
              <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4vw, 44px)", margin: "0 0 18px", lineHeight: 1.1 }}>
                Une palette, une tenue, des pièces à acheter.
              </h2>
              <p style={{ ...paragraphStyle, marginTop: 14 }}>
                Multiplié par 348.
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
              marginTop: 32,
            }}>
              {showcase.map((p) => (
                <PaletteCard key={p.number} entry={p} />
              ))}
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
              <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>POUR TOUS LES BUDGETS</p>
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
              <p style={{ ...sectionLabel, color: seal, marginBottom: 18 }}>GRATUIT, SANS PIÈGE</p>
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
            {/* Brief §7 : « Merci d'être là » → « Bienvenue dans le
                dictionnaire » (orienté accueil/utilisateur, pas auto-
                congrat). Tagline plus directe sur l'indépendance. */}
            <h2 style={{ ...headingStyle, fontSize: "clamp(28px, 4.5vw, 44px)", marginBottom: 28 }}>
              Bienvenue dans le dictionnaire.
            </h2>
            <p style={{ ...paragraphStyle, fontSize: 17 }}>
              WADA est indépendant. Pas d'investisseur, pas de pub. Juste les couleurs et vous.
            </p>
            <p style={{
              fontFamily: fontLabel, fontSize: 11, letterSpacing: "0.4em",
              textTransform: "uppercase", color: subtle, margin: "44px 0 0", fontWeight: 600,
            }}>
              Genève · 2026
            </p>
            {/* Brief §6 : bloc affiliation déplacé en lien discret ici.
                Plus de gros encart « Vous gérez un programme d'affiliation ? »
                en bas de page qui parasitait le message client. */}
            <p style={{ fontSize: 12, color: subtle, marginTop: 8, fontFamily: fontBody }}>
              Vous êtes une marque ?{" "}
              <Link href="/partenaires" style={{ color: subtle, textDecoration: "underline" }}>
                Devenir partenaire
              </Link>
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

      {/* ═══ POUR LES MARQUES PARTENAIRES — supprimé brief §6 (2026-05-29).
          Le gros encart « Vous gérez un programme d'affiliation ? » brouillait
          le message client. Remplacé par 1 lien discret dans la section closing
          ci-dessus (« Vous êtes une marque ? Devenir partenaire »). */}

          </main>
  );
}
