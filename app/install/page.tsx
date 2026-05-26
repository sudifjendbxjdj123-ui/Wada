import Link from "next/link";
import {
  ink, paper, subtle, seal, mojo, mojoSoft, border,
  sectionLabel, textSecondary, cardBg,
  fontHeading, fontBody, fontLabel,
} from "@/lib/styles";
import HandArrow from "@/components/HandArrow";
import SketchUnderline from "@/components/SketchUnderline";

export const metadata = {
  title: "Installer WADA",
  description: "Installez WADA sur votre écran d'accueil — 348 palettes hors-ligne, scanner natif, démarrage instantané.",
};

const btnBase = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "13px 24px", borderRadius: 12,
  fontFamily: fontLabel, fontSize: 12, fontWeight: 600,
  letterSpacing: "0.05em", textDecoration: "none", cursor: "pointer",
  border: "1px solid transparent", whiteSpace: "nowrap" as const,
  transition: "all 0.2s ease",
};
const btnPrimary = { ...btnBase, background: ink, color: paper };
const btnOutline = { ...btnBase, background: "transparent", color: ink, border: `1px solid ${ink}` };

/**
 * /install — guide complet pour installer WADA comme app native.
 *
 * Trois plateformes documentées : iOS Safari, Android Chrome, Desktop Chrome/Edge.
 * Plus la liste des bénéfices (hors-ligne, scanner natif, démarrage instantané).
 */
export default function InstallPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: fontBody }}>
      
      {/* HERO */}
      <section style={{ background: mojoSoft, padding: "80px 5% 96px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ ...sectionLabel, color: mojo, marginBottom: 18, fontWeight: 600 }}>
            App installable
          </p>
          <h1 style={{
            fontFamily: fontHeading, fontSize: 56, fontWeight: 500,
            lineHeight: 1.05, letterSpacing: "-0.01em", margin: 0,
            color: ink,
          }}>
            WADA, sur votre <SketchUnderline color={mojo}>écran d'accueil</SketchUnderline>.
          </h1>
          <p style={{
            fontFamily: fontBody, fontSize: 18, lineHeight: 1.7,
            color: textSecondary, margin: "28px auto 0", maxWidth: 540,
          }}>
            Installez WADA comme une vraie app. Plus rapide, hors-ligne, plein écran —
            le dictionnaire des couleurs toujours à portée de pouce.
          </p>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section style={{ background: paper, padding: "80px 5%" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="wada-install-benefits" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            <Benefit glyph="◇" label="Hors-ligne"          desc="348 palettes consultables sans réseau, après une première visite." />
            <Benefit glyph="✦" label="Démarrage instantané" desc="Plus de spinner — l'app s'ouvre immédiatement comme une vraie." />
            <Benefit glyph="○" label="Plein écran"          desc="Pas d'URL bar, pas de bouton retour — focus sur le contenu." />
            <Benefit glyph="↺" label="Sans inscription"     desc="Aucun compte, aucune donnée gardée. Le site reste anonyme." />
          </div>
        </div>
      </section>

      {/* 3 PLATEFORMES */}
      <section style={{ background: cardBg, padding: "96px 5%", borderTop: `1px solid ${border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ ...sectionLabel, color: seal, marginBottom: 14, fontWeight: 600 }}>Trois plateformes</p>
            <h2 style={{
              fontFamily: fontHeading, fontSize: 48, fontWeight: 500,
              lineHeight: 1.05, letterSpacing: "-0.02em", margin: 0,
              fontStyle: "italic", color: ink,
            }}>
              Comment installer.
            </h2>
          </div>

          <div className="wada-install-platforms" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
            <PlatformGuide
              icon="🍎"
              name="iOS Safari"
              steps={[
                'Ouvrez wada.style dans Safari',
                'Appuyez sur le bouton "Partager" en bas',
                'Faites défiler et choisissez "Sur l\'écran d\'accueil"',
                'Confirmez avec "Ajouter"',
              ]}
            />
            <PlatformGuide
              icon="🤖"
              name="Android Chrome"
              steps={[
                'Ouvrez wada.style dans Chrome',
                'Une bannière "Installer" apparaît en bas',
                'Ou allez dans le menu ⋮ → "Installer l\'application"',
                'Confirmez avec "Installer"',
              ]}
            />
            <PlatformGuide
              icon="💻"
              name="Desktop Chrome / Edge"
              steps={[
                'Visitez wada.style dans Chrome ou Edge',
                'Cliquez sur l\'icône "Installer" dans la barre d\'adresse (à droite)',
                'Ou menu ⋮ → "Installer WADA"',
                'L\'app s\'ouvre dans sa propre fenêtre',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: paper, padding: "96px 5%", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: fontHeading, fontSize: 44, fontWeight: 500,
            lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 20px",
            fontStyle: "italic", color: ink,
          }}>
            Prêt à installer ?
          </h2>
          <p style={{ fontFamily: fontBody, fontSize: 16, color: textSecondary, margin: "0 0 36px", lineHeight: 1.6 }}>
            Suivez l'une des trois méthodes ci-dessus depuis l'appareil sur lequel vous voulez installer WADA.
            Vous pouvez désinstaller à tout moment — sans compte, sans suivi.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scanner" style={btnPrimary}>
              <span>Commencer le scanner</span>
              <HandArrow size={24} color={paper} />
            </Link>
            <Link href="/palettes" style={btnOutline}>
              Voir les palettes
            </Link>
          </div>
        </div>
      </section>

          </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Sous-composants
   ────────────────────────────────────────────────────────────────────── */

function Benefit({ glyph, label, desc }: { glyph: string; label: string; desc: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p aria-hidden style={{ fontSize: 40, color: mojo, margin: "0 0 14px", lineHeight: 1 }}>{glyph}</p>
      <p style={{
        fontFamily: fontLabel, fontSize: 11, fontWeight: 700,
        letterSpacing: "0.25em", textTransform: "uppercase",
        color: ink, margin: "0 0 10px",
      }}>
        {label}
      </p>
      <p style={{ fontFamily: fontBody, fontSize: 14, color: textSecondary, margin: 0, lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

function PlatformGuide({ icon, name, steps }: { icon: string; name: string; steps: string[] }) {
  return (
    <article style={{
      background: paper, border: `1px solid ${border}`,
      padding: 28, borderRadius: 16,
    }}>
      <p aria-hidden style={{ fontSize: 36, margin: "0 0 14px", lineHeight: 1 }}>{icon}</p>
      <h3 style={{
        fontFamily: fontHeading, fontSize: 22, fontStyle: "italic", fontWeight: 500,
        margin: "0 0 18px", color: ink, lineHeight: 1.2, letterSpacing: "-0.01em",
      }}>
        {name}
      </h3>
      <ol style={{
        fontSize: 13, color: textSecondary, paddingLeft: 0,
        listStyle: "none", margin: 0, lineHeight: 1.7,
      }}>
        {steps.map((step, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: fontHeading, fontSize: 14, fontStyle: "italic",
              color: mojo, fontWeight: 600, minWidth: 18,
            }}>
              {i + 1}.
            </span>
            <span dangerouslySetInnerHTML={{ __html: step }} />
          </li>
        ))}
      </ol>
    </article>
  );
}
