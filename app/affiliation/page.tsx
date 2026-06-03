"use client";
import Link from "next/link";
import BackButton from "@/components/BackButton";

/* ──────────────────────────────────────────────────────────────────────
   /affiliation — Refonte 2026-05-22 (maquette brief).
   Page transparence client-facing. Promesse : « Vous payez le même prix. »
   Conserve le contenu juridique (cadre DGCCRF + DSA) tout en passant
   au design system Bagel Fat One + cards cream.
   ────────────────────────────────────────────────────────────────────── */
const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
  olive: "#A8B29A",
  bordeaux: "#6B3A32",
  ink: "#1E1E1E",
  inkSoft: "#6a6259",
  line: "rgba(30,30,30,.10)",
};
const fonts = {
  display: "'Fredoka', sans-serif",
  sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};
const SOFT = "0 8px 36px rgba(30,30,30,.06)";

const CARDS: Array<{ title: string; text: string }> = [
  {
    title: "Nos recommandations",
    text: "Les tenues sont composées selon la couleur et le style, jamais selon la commission. Nos conseils ne sont pas à vendre.",
  },
  {
    title: "Votre prix",
    text: "Toujours le prix de la marque. La commission est payée par le marchand, pas par vous.",
  },
  {
    title: "Vos données",
    text: "Le scanner travaille sur votre appareil ; vos favoris vous appartiennent. On ne revend rien.",
  },
  {
    title: "Votre liberté",
    text: "Vous pouvez acheter où vous voulez, comparer ailleurs, ignorer nos liens. WADA reste un guide, pas un péage.",
  },
];

export default function AffiliationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: palette.beige,
        color: palette.ink,
        fontFamily: fonts.sans,
        lineHeight: 1.65,
      }}
    >
            <BackButton />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "50px 24px 80px" }}>
        {/* HEAD */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: palette.bordeaux,
            fontWeight: 500,
            margin: 0,
          }}
        >
          Transparence
        </p>
        <h1
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: "clamp(32px, 6vw, 42px)",
            lineHeight: 1.05,
            margin: "10px 0 10px",
            color: palette.ink,
          }}
        >
          Comment WADA gagne sa vie.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: palette.inkSoft,
            maxWidth: "52ch",
            margin: 0,
          }}
        >
          Sans pub, sans abonnement obligatoire, sans vendre vos données. WADA vit
          d'une commission d'affiliation — et nous voulons que ce soit clair.
        </p>

        {/* LE PRINCIPE */}
        <h2 style={h2Style}>Le principe</h2>
        <p style={pStyle}>
          Quand WADA vous propose une pièce et que vous l'achetez chez l'un de nos
          marchands partenaires (<b>MUJI</b>, <b>The Business Fashion</b>,{" "}
          <b>The Shirt Company</b>), le marchand nous reverse une petite
          commission. <b>Vous payez exactement le même prix</b> que si vous étiez
          allé directement sur son site — aucun surcoût.
        </p>
        <p style={pStyle}>
          Nous ne proposons un bouton « Acheter » que pour des marques avec
          lesquelles nous avons un partenariat d'affiliation <b>actif et vérifié</b>.
          Si aucune de nos marques partenaires n'a la pièce idéale pour un emplacement,
          nous préférons le laisser vide plutôt que de vous envoyer vers un lien qui
          ne nous rémunère pas. Notre catalogue s'enrichit chaque semaine.
        </p>

        {/* CE QUE ÇA NE CHANGE PAS — 2×2 cards */}
        <h2 style={h2Style}>Ce que ça ne change pas</h2>
        <div
          className="wada-affil-cards"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginTop: 18,
          }}
        >
          {CARDS.map((c) => (
            <article
              key={c.title}
              style={{
                background: palette.cream,
                border: `1px solid ${palette.line}`,
                borderRadius: 14,
                padding: "18px 20px",
                boxShadow: SOFT,
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 15,
                  margin: "0 0 5px",
                  color: palette.ink,
                }}
              >
                {c.title}
              </h3>
              <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>
                {c.text}
              </p>
            </article>
          ))}
        </div>

        {/* COMMENT RECONNAÎTRE */}
        <h2 style={h2Style}>Comment reconnaître un lien affilié</h2>
        <p style={pStyle}>
          Tous nos boutons « Acheter » sont des liens d'affiliation. Ils sont
          trackés via notre réseau partenaire (Awin, Publisher 2879911) pour
          attribuer la commission. Nous l'indiquons sous chaque lien (mention
          « Lien partenaire ») par souci d'honnêteté.
        </p>

        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: palette.bordeaux,
            background: "#EDE6DA",
            border: `1px solid ${palette.line}`,
            padding: "6px 12px",
            borderRadius: 999,
            marginTop: 14,
            fontWeight: 600,
          }}
        >
          Affiliation transparente · sans surcoût
        </span>

        {/* CADRE LÉGAL — compact */}
        <h2 style={h2Style}>Cadre légal</h2>
        <p style={pStyle}>
          Conformément à la loi française (DGCCRF) et au Digital Services Act
          européen (DSA, 2024), nous déclarons l'affiliation comme une rémunération
          commerciale. Nos mentions légales détaillent éditeur, hébergeur et
          contact (
          <Link href="/mentions" style={{ color: palette.bordeaux }}>Mentions légales</Link>
          {" · "}
          <Link href="/cgv" style={{ color: palette.bordeaux }}>CGV</Link>
          {" · "}
          <Link href="/confidentialite" style={{ color: palette.bordeaux }}>Confidentialité</Link>).
        </p>

        {/* QUESTION */}
        <h2 style={h2Style}>Une question ?</h2>
        <p style={pStyle}>
          Écrivez-nous à{" "}
          <a href="mailto:hello@wada.style" style={{ color: palette.bordeaux }}>
            hello@wada.style
          </a>
          . Pour les marques qui souhaitent rejoindre WADA, voir la page{" "}
          <Link href="/partenaires" style={{ color: palette.bordeaux }}>
            Pour les marques
          </Link>
          .
        </p>
      </div>

      {/* Responsive grid : 2 cols desktop → 1 col mobile ≤520px */}
      <style jsx>{`
        @media (max-width: 520px) {
          :global(.wada-affil-cards) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

          </main>
  );
}

const h2Style: React.CSSProperties = {
  fontFamily: fonts.display,
  fontWeight: 700,
  fontSize: 22,
  margin: "34px 0 8px",
  color: palette.ink,
};
const pStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#4A443D",
  margin: "0 0 10px",
};
