"use client";
import Link from "next/link";
import BackButton from "@/components/BackButton";

/**
 * /about — Refonte 2026-05-31 (maquette user verbatim).
 *
 * Page éditoriale en 8 sections :
 *  1. Hero "Rendre le style plus facile"
 *  2. L'idée — storytelling + citation Sanzo Wada
 *  3. Ce que fait WADA — 4 actions chiffres romains
 *  4. En un exemple — 3 mini-palettes vivantes
 *  5. Les partenaires actuels — timeline budget
 *  6. Gratuit. Simple. Honnête. — grille 2×2 promesses
 *  7. Cœur du projet — 348 inspirations (climax)
 *  8. Bienvenue + CTA final
 *
 * Nav et Footer viennent du layout global — pas dupliqués ici.
 * Le BackButton existant est utilisé en lieu et place du chip "Retour".
 */

const palette = {
  cream: "#f4eee4",
  cream2: "#efe7da",
  card: "#fbf7f0",
  ink: "#2a2521",
  inkSoft: "#3d3530",
  muted: "#8c8377",
  line: "#e5dccc",
  bordeaux: "#6e3b32",
  bordeaux2: "#82473c",
  olive: "#6f7a3f",
  gold: "#c79a3c",
};

const fonts = {
  display: "'Fredoka', sans-serif",
  body: "'Inter', system-ui, sans-serif",
  /* Cormorant Garamond italique pour les climax et signatures éditoriales —
     pas chargé via Google Fonts dans le layout. Fallback serif système. */
  italic: "'Cormorant Garamond', 'Times New Roman', serif",
};

export default function AboutPage() {
  return (
    <main style={{
      background: palette.cream,
      color: palette.ink,
      fontFamily: fonts.body,
      lineHeight: 1.55,
      WebkitFontSmoothing: "antialiased",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 22px" }}>
        <BackButton fallback="/" />

        {/* ═══════════════════════════════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: "60px 0 50px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            background:
              "radial-gradient(circle at 30% 20%, rgba(202,164,121,.12), transparent 60%), " +
              "radial-gradient(circle at 70% 80%, rgba(110,59,50,.08), transparent 60%)",
          }} />
          <div style={kickerStyle}>À propos</div>
          <h1 style={{
            fontFamily: fonts.display,
            fontSize: "clamp(40px, 9vw, 58px)",
            lineHeight: 1.04,
            letterSpacing: "-0.5px",
            marginBottom: 18,
            fontWeight: 600,
          }}>
            Rendre le style{" "}
            <em style={{
              fontStyle: "normal",
              color: palette.bordeaux,
              fontWeight: 500,
            }}>
              plus facile
            </em>
            .
          </h1>
          <p style={{
            fontSize: 16,
            color: palette.inkSoft,
            maxWidth: "34ch",
            margin: "0 auto",
          }}>
            Pas besoin d&apos;être expert. Vous scannez une couleur — WADA construit la tenue qui va avec.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            L'IDÉE — storytelling avec citation
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "60px 0 30px" }}>
          <div style={kickerStyle}>L&apos;idée</div>
          <h2 style={{
            fontFamily: fonts.display,
            fontSize: 30,
            lineHeight: 1.1,
            marginBottom: 20,
            fontWeight: 500,
            letterSpacing: "-0.3px",
          }}>
            Tout est parti d&apos;un problème très simple.
          </h2>
          <p style={ideeParaStyle}>
            Passer trop de temps devant son armoire sans savoir quoi mettre. Tester, hésiter, renoncer.
          </p>

          <div style={{
            fontFamily: fonts.display,
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.3,
            color: palette.bordeaux,
            margin: "34px 0",
            padding: "0 8px",
            position: "relative",
            letterSpacing: "-0.3px",
          }}>
            <span style={{ opacity: 0.4, fontSize: 32, lineHeight: 1 }}>« </span>
            Pourquoi s&apos;habiller doit-il toujours demander autant d&apos;énergie ?
            <span style={{ opacity: 0.4, fontSize: 32, lineHeight: 1 }}> »</span>
          </div>

          <p style={ideeParaStyle}>
            Quelques semaines plus tard, la découverte d&apos;un ancien livre du peintre japonais{" "}
            <b style={{ color: palette.ink, fontWeight: 600 }}>Sanzo Wada</b>. En 1933, il y avait réuni{" "}
            <b style={{ color: palette.ink, fontWeight: 600 }}>348 combinaisons de couleurs</b> pensées pour fonctionner naturellement ensemble.
          </p>
          <p style={ideeParaStyle}>
            Si des couleurs fonctionnent ensemble, alors une tenue construite autour de ces couleurs fonctionne aussi.
          </p>

          <p style={{
            fontFamily: fonts.display,
            color: palette.bordeaux,
            fontSize: 21,
            fontWeight: 500,
            lineHeight: 1.3,
            marginTop: 32,
            letterSpacing: "-0.2px",
          }}>
            C&apos;est l&apos;idée fondatrice de WADA.
          </p>
        </section>

        <Divider />

        {/* ═══════════════════════════════════════════════════════════════════
            CE QUE FAIT WADA — 4 actions chiffres romains
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "30px 0 50px" }}>
          <div style={{ ...kickerStyle, textAlign: "center" }}>Ce que fait WADA</div>
          <h2 style={secTitleStyle}>
            Chaque palette devient{" "}
            <em style={emRomanStyle}>quatre choses</em>.
          </h2>

          {ACTIONS.map((a, i) => (
            <div key={a.num} style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr",
              gap: 20,
              alignItems: "start",
              marginBottom: i === ACTIONS.length - 1 ? 0 : 36,
              paddingBottom: i === ACTIONS.length - 1 ? 0 : 36,
              borderBottom: i === ACTIONS.length - 1 ? "none" : `1px solid ${palette.line}`,
            }}>
              <div style={{
                fontFamily: fonts.display,
                fontWeight: 500,
                fontSize: 38,
                lineHeight: 1,
                color: palette.bordeaux,
                opacity: 0.5,
                textAlign: "right",
                letterSpacing: "-0.02em",
              }}>
                {a.num}
              </div>
              <div>
                <h3 style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  fontWeight: 500,
                  marginBottom: 8,
                  letterSpacing: "-0.2px",
                }}>
                  {a.title}
                </h3>
                <p style={{
                  fontSize: 15,
                  color: palette.inkSoft,
                  lineHeight: 1.55,
                }}>
                  {a.desc}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>{/* /wrap */}

      {/* ═══════════════════════════════════════════════════════════════════
          EN UN EXEMPLE — palettes mini, sort du wrap pour gagner le full-width
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: palette.card,
        padding: "60px 22px",
        borderTop: `1px solid ${palette.line}`,
        borderBottom: `1px solid ${palette.line}`,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ ...kickerStyle, textAlign: "center" }}>En un exemple</div>
          <h2 style={secTitleStyle}>
            Une palette, une tenue,{" "}
            <em style={emRomanStyle}>des pièces à acheter</em>.
          </h2>

          <div style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 30,
          }}>
            {SAMPLE_PALETTES.map((p) => (
              <MiniPalette key={p.nom} palette={p} />
            ))}
          </div>

          <p style={{
            textAlign: "center",
            marginTop: 30,
            fontSize: 16,
            color: palette.inkSoft,
          }}>
            Multiplié par{" "}
            <b style={{
              fontFamily: fonts.display,
              color: palette.bordeaux,
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: "-0.02em",
            }}>
              348
            </b>
            .
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 22px" }}>

        {/* ═══════════════════════════════════════════════════════════════════
            LES PARTENAIRES — timeline budget
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "60px 0 30px" }}>
          <div style={{ ...kickerStyle, textAlign: "center" }}>Les partenaires actuels</div>
          <h2 style={secTitleStyle}>
            Une sélection qui{" "}
            <em style={emRomanStyle}>grandit chaque semaine</em>.
          </h2>

          <div>
            {PARTNERS.map((p, i) => (
              <div key={p.tag} style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 22,
                alignItems: "start",
                padding: "24px 0",
                borderBottom: i === PARTNERS.length - 1 ? "none" : `1px solid ${palette.line}`,
              }}>
                <div style={{
                  fontFamily: fonts.display,
                  fontWeight: 500,
                  fontSize: 12,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: palette.bordeaux,
                  textAlign: "right",
                  paddingTop: 6,
                }}>
                  {p.tag}
                </div>
                <div>
                  <h4 style={{
                    fontFamily: fonts.display,
                    fontSize: 17,
                    fontWeight: 500,
                    marginBottom: 6,
                  }}>
                    {p.title}
                  </h4>
                  <p style={{
                    fontSize: 14,
                    color: palette.inkSoft,
                    marginBottom: 6,
                  }}>
                    {p.desc}
                    {p.cta && (
                      <>
                        {" "}
                        <Link href="/contact" style={{ color: palette.bordeaux, textDecoration: "underline" }}>
                          {p.cta}
                        </Link>
                        .
                      </>
                    )}
                  </p>
                  <span style={{
                    fontSize: 12.5,
                    color: palette.muted,
                    fontFeatureSettings: "'tnum'",
                  }}>
                    <b style={{ color: palette.ink, fontWeight: 600 }}>{p.range}</b>
                    {p.unit ? ` ${p.unit}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>{/* /wrap */}

      {/* ═══════════════════════════════════════════════════════════════════
          PROMESSES — grille 2x2 full-width
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: "linear-gradient(180deg, #f7f0e2, #f4eee4)",
        marginTop: 60,
        padding: "60px 22px",
        borderTop: `1px solid ${palette.line}`,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ ...kickerStyle, textAlign: "center" }}>Gratuit, sans piège</div>
          <h2 style={secTitleStyle}>
            Gratuit. <em style={emRomanStyle}>Simple</em>. Honnête.
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            marginTop: 30,
          }}>
            {PROMISES.map((p) => (
              <div key={p.num} style={{
                background: "#fff",
                border: `1px solid ${palette.line}`,
                borderRadius: 18,
                padding: 22,
              }}>
                <span style={{
                  fontFamily: fonts.italic,
                  fontSize: 24,
                  fontStyle: "italic",
                  color: palette.bordeaux,
                  marginBottom: 8,
                  display: "block",
                  lineHeight: 1,
                }}>
                  {p.num}
                </span>
                <h4 style={{
                  fontFamily: fonts.display,
                  fontSize: 14.5,
                  fontWeight: 500,
                  marginBottom: 6,
                  lineHeight: 1.2,
                }}>
                  {p.title}
                </h4>
                <p style={{
                  fontSize: 12.5,
                  color: palette.inkSoft,
                  lineHeight: 1.5,
                }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 22px" }}>

        {/* ═══════════════════════════════════════════════════════════════════
            CŒUR DU PROJET — climax monumental
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{
          padding: "80px 0 60px",
          textAlign: "center",
          position: "relative",
        }}>
          <div style={{ ...kickerStyle, textAlign: "center" }}>Le cœur du projet</div>
          <div style={{
            fontFamily: fonts.display,
            fontSize: "clamp(64px, 16vw, 110px)",
            lineHeight: 0.95,
            fontWeight: 600,
            letterSpacing: "-2px",
            color: palette.ink,
          }}>
            348
          </div>
          <div style={{
            fontFamily: fonts.italic,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(64px, 16vw, 110px)",
            lineHeight: 0.95,
            letterSpacing: "-2px",
            color: palette.bordeaux,
          }}>
            inspirations.
          </div>
          <p style={{
            fontSize: 15.5,
            color: palette.inkSoft,
            margin: "30px auto 0",
            maxWidth: "34ch",
          }}>
            Chaque accord de couleurs devient une silhouette prête à porter. Des palettes inspirées du livre original de 1933, adaptées à aujourd&apos;hui.
          </p>
        </section>
      </div>{/* /wrap */}

      {/* ═══════════════════════════════════════════════════════════════════
          BIENVENUE — full-width sur fond carte
          ═══════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "50px 22px 30px",
        textAlign: "center",
        background: palette.card,
        borderTop: `1px solid ${palette.line}`,
        borderBottom: `1px solid ${palette.line}`,
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: fonts.italic,
            fontStyle: "italic",
            fontSize: 38,
            lineHeight: 1.1,
            marginBottom: 16,
            color: palette.ink,
            letterSpacing: "-0.3px",
            fontWeight: 500,
          }}>
            Bienvenue dans le dictionnaire.
          </h2>
          <p style={{
            fontSize: 15,
            color: palette.inkSoft,
            maxWidth: "32ch",
            margin: "0 auto 16px",
          }}>
            WADA est indépendant. Pas d&apos;investisseur, pas de pub. Juste les couleurs et vous.
          </p>
          <div style={{
            marginTop: 30,
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: palette.muted,
            fontWeight: 600,
          }}>
            Genève · 2026
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 22px" }}>
        {/* ═══════════════════════════════════════════════════════════════════
            CTA FINAL
            ═══════════════════════════════════════════════════════════════════ */}
        <section style={{ padding: "70px 0 40px", textAlign: "center" }}>
          <h3 style={{
            fontFamily: fonts.italic,
            fontStyle: "italic",
            fontSize: 26,
            fontWeight: 500,
            marginBottom: 14,
            color: palette.ink,
            letterSpacing: "-0.3px",
          }}>
            Découvrez les palettes WADA.
          </h3>
          <p style={{
            fontSize: 14.5,
            color: palette.inkSoft,
            marginBottom: 24,
            maxWidth: "30ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Le dictionnaire complet, pensé pour vous aider à mieux vous habiller au quotidien.
          </p>
          <Link
            href="/palettes"
            style={{
              background: palette.bordeaux,
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "14px 26px",
              fontFamily: fonts.display,
              fontSize: 15,
              fontWeight: 500,
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Explorer les palettes &nbsp;→
          </Link>
          <Link
            href="/scanner"
            style={{
              background: "#fff",
              color: palette.bordeaux,
              border: `1px solid ${palette.bordeaux}`,
              borderRadius: 14,
              padding: "13px 24px",
              fontFamily: fonts.display,
              fontSize: 14.5,
              fontWeight: 500,
              display: "inline-block",
              textDecoration: "none",
              marginLeft: 10,
            }}
          >
            Scanner une couleur
          </Link>
        </section>
      </div>
    </main>
  );
}

/* ────────────────────── helpers visuels ─────────────────────── */
function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${palette.line}, transparent)`,
      margin: "50px 0",
    }} />
  );
}

interface SamplePalette {
  nom: string;
  culture: string;
  colors: [string, string, string];
}

function MiniPalette({ palette: p }: { palette: SamplePalette }) {
  return (
    <div style={{
      width: 118,
      background: "#fff",
      border: `1px solid ${palette.line}`,
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <div style={{ height: 76, display: "flex" }}>
        {p.colors.map((c, i) => (
          <span key={i} style={{ flex: 1, background: c }} aria-hidden />
        ))}
      </div>
      <div style={{
        padding: "10px 12px 0",
        fontFamily: fonts.display,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.2,
      }}>
        {p.nom}
      </div>
      <div style={{
        fontSize: 9.5,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.muted,
        padding: "0 12px 10px",
        fontWeight: 600,
      }}>
        {p.culture}
      </div>
    </div>
  );
}

/* ────────────────────── data inline ─────────────────────── */
const ACTIONS = [
  {
    num: "I",
    title: "Une tenue complète",
    desc: "Composée pour fonctionner ensemble, du haut aux chaussures. Cinq pièces, un seul registre.",
  },
  {
    num: "II",
    title: "Des idées de style",
    desc: "Adaptées à votre humeur, à votre saison, à votre culture, à votre journée.",
  },
  {
    num: "III",
    title: "Des vêtements réels",
    desc: "Issus d'une sélection de boutiques cotées, du vintage au luxe. Aucune image inventée.",
  },
  {
    num: "IV",
    title: "Des liens d'achat directs",
    desc: "Transparents, sans intermédiaire caché. Vous achetez chez la marque, au même prix.",
  },
];

const SAMPLE_PALETTES: SamplePalette[] = [
  { nom: "Rosée du matin", culture: "Française", colors: ["#c9d0d8", "#d4c8b4", "#1c2030"] },
  { nom: "Béton & Lin",   culture: "Urbaine",   colors: ["#8a8472", "#d9c9a8", "#7b2d26"] },
  { nom: "Riviera",        culture: "Italienne", colors: ["#1f3a4a", "#dccab0", "#5e6b3c"] },
];

const PARTNERS = [
  {
    tag: "L'essentiel",
    title: "MUJI",
    desc: "Basiques minimalistes japonais, le vestiaire du quotidien.",
    range: "20 – 150 €",
    unit: "par pièce",
  },
  {
    tag: "La chemise",
    title: "The Shirt Company",
    desc: "Chemises et chemisiers femme premium, taillés à Londres.",
    range: "95 – 200 €",
    unit: "par pièce",
  },
  {
    tag: "L'investissement",
    title: "Tom Ford · Brunello Cucinelli · Amiri",
    desc: "Plus de 200 maisons de luxe homme via The Business Fashion : Rick Owens, Loro Piana, Jacquemus, Comme des Garçons, Acne, AMI Paris…",
    range: "200 – 2 000 €",
    unit: "par pièce",
  },
  {
    tag: "À venir",
    title: "Sezane · Sandro · Maje · Net-a-Porter…",
    desc: "D'autres marques rejoignent WADA chaque semaine. Vous voulez la vôtre ?",
    cta: "Écrivez-nous",
    range: "Catalogue en croissance",
    unit: "",
  },
];

const PROMISES = [
  { num: "i",   title: "Site gratuit",        desc: "Palettes, scanner, recommandations — sans abonnement." },
  { num: "ii",  title: "Pas de pub intrusive",desc: "Aucun pop-up, aucune surcharge, pas de tracking publicitaire." },
  { num: "iii", title: "Liens transparents",  desc: "Vous achetez chez la marque, au prix marchand. WADA touche parfois une commission." },
  { num: "iv",  title: "Abonnement optionnel",desc: "Pour aller plus loin : recommandations personnalisées et calendrier de tenues." },
];

/* ────────────────────── styles partagés ─────────────────────── */
const kickerStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 11,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: palette.bordeaux,
  fontWeight: 600,
  marginBottom: 18,
};

const secTitleStyle: React.CSSProperties = {
  fontFamily: fonts.display,
  fontSize: "clamp(28px, 6vw, 38px)",
  lineHeight: 1.1,
  letterSpacing: "-0.3px",
  textAlign: "center",
  marginBottom: 34,
  fontWeight: 500,
};

const emRomanStyle: React.CSSProperties = {
  fontStyle: "normal",
  color: palette.bordeaux,
  fontWeight: 500,
};

const ideeParaStyle: React.CSSProperties = {
  fontSize: 15.5,
  color: palette.inkSoft,
  marginBottom: 18,
  maxWidth: "38ch",
};
