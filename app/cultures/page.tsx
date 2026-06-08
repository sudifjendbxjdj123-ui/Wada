"use client";
import Link from "next/link";
import { cultures, dictionary, enc } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import BackButton from "@/components/BackButton";
import ExternalLink from "@/components/ExternalLink";
/* Brief client 2026-05-26 : un seul composant PaletteCard partout —
   les mini-vignettes inline (3 bandes 110px sans culture ni ♡) sont
   remplacées par le PaletteCard partagé pour cohérence sitewide. */
import PaletteCard from "@/components/PaletteCard";

export default function CulturesPage() {
  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <BackButton />
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          <header style={{ textAlign: "center", padding: "80px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Voyage</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, lineHeight: 1, fontFamily: "'Fredoka', sans-serif" }}>
              Inspirations<br/>du monde
            </h1>
            <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, maxWidth: 560, margin: "24px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              Différentes cultures et les jeunes marques qui les portent aujourd'hui.
            </p>
          </header>

          {cultures.map((cult, cultIdx) => {
            const cultPalettes = dictionary.filter((d) => d.culture === cult.key).slice(0, 3);
            return (
              /* Brief audit (25/05) — accordéon natif HTML5 <details>/<summary>.
                 Pas de JS, accessible par défaut, ferme/ouvre au clic ou touche
                 Entrée. La 1ère culture est ouverte par défaut (`open`) pour
                 que l'utilisateur voie tout de suite à quoi ça ressemble. Sur
                 mobile, scroll vertical massif → résolu : on commence avec
                 1 panneau ouvert (~600px) + 7 résumés cliquables (~100px) au
                 lieu de 8×~900px de mur de texte. */
              <details
                key={cult.key}
                open={cultIdx === 0}
                className="wada-culture-accordion"
                style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${border}` }}
              >
                <summary style={{
                  cursor: "pointer",
                  listStyle: "none",
                  textAlign: "center",
                  padding: "32px 0 28px",
                  outline: "none",
                }}>
                  <p style={{ ...sectionLabel, color: seal, marginBottom: 10 }}>{cult.region}</p>
                  <h2 style={{ fontSize: 44, fontWeight: 400, margin: 0, lineHeight: 1.1, fontFamily: "'Fredoka', sans-serif" }}>{cult.name}</h2>
                  <p style={{ fontSize: 15, color: textSecondary, fontStyle: "italic", marginTop: 12, fontFamily: "'Inter', sans-serif" }}>{cult.craft}</p>
                  {/* Brief 2026-06-07 (fix) — l'indicateur dépendait de
                      `cultIdx` (figé) et non de l'état réel ouvert/fermé :
                      il MENTAIT dès que l'utilisateur ouvrait une autre
                      culture ou repliait la 1ère. Désormais on rend les deux
                      libellés et on les bascule en CSS selon `details[open]`,
                      donc l'indicateur reflète toujours l'état réel. */}
                  <span aria-hidden style={{
                    display: "inline-block",
                    marginTop: 18,
                    fontSize: 11,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: subtle,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    <span className="wada-acc-label-closed">▸ Découvrir</span>
                    <span className="wada-acc-label-open">▾ Replier</span>
                  </span>
                </summary>

                <div className="wada-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, paddingTop: 24 }}>

                  {/* Vêtements emblématiques */}
                  <div>
                    <p style={{ ...sectionLabel, marginBottom: 18 }}>Pièces emblématiques</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {/* Brief UX client Partie 2 §12 (26/05) — les pastilles
                          envoyaient sans prévenir vers une page de résultats
                          Google Shopping : effet « on quitte WADA brutalement ».
                          Maintenant le libellé annonce clairement « Chercher
                          en ligne » + icône loupe → l'utilisateur sait qu'il
                          va sortir du site, pas une fausse promesse de
                          page WADA. À terme : remplacer par recherche
                          interne /palettes filtrée par garment. */}
                      {cult.garments.map((g) => (
                        <ExternalLink
                          key={g}
                          href={`https://www.google.com/search?tbm=shop&q=${enc(g)}`}
                          title={`Chercher « ${g} » en ligne`}
                          aria-label={`Chercher « ${g} » en ligne sur Google Shopping`}
                          style={{ fontSize: 13, fontStyle: "italic", color: ink, padding: "10px 16px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.5)", textDecoration: "none", fontFamily: "'Inter', sans-serif", transition: "border-color 0.2s ease", display: "inline-flex", alignItems: "center", gap: 6 }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = ink; }}
                          onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = border; }}
                        >
                          {g}
                          <span aria-hidden style={{ fontSize: 11, opacity: 0.55, fontStyle: "normal", letterSpacing: "0.02em" }}>
                            · chercher ↗
                          </span>
                        </ExternalLink>
                      ))}
                    </div>
                    {cultPalettes.length > 0 && (
                      <div style={{ marginTop: 32 }}>
                        <p style={{ ...sectionLabel, marginBottom: 18 }}>Palettes WADA</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {cultPalettes.map((p) => (
                            <PaletteCard key={p.number} entry={p} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Marques inspirées */}
                  <div>
                    <p style={{ ...sectionLabel, marginBottom: 18 }}>Jeunes marques inspirées</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {cult.brands.map((b) => (
                        <ExternalLink key={b.name} href={b.url} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "baseline", padding: "16px 20px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.5)", textDecoration: "none", color: ink, transition: "border-color 0.2s ease" }}
                          onMouseEnter={(ev) => { ev.currentTarget.style.borderColor = ink; }}
                          onMouseLeave={(ev) => { ev.currentTarget.style.borderColor = border; }}>
                          <div>
                            <div style={{ fontSize: 18, fontStyle: "italic", color: ink, fontFamily: "'Inter', sans-serif" }}>{b.name}</div>
                            <div style={{ fontSize: 12, color: subtle, fontFamily: "'Inter', sans-serif", fontStyle: "italic", marginTop: 2 }}>{b.desc}</div>
                          </div>
                          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: seal, fontFamily: "'Inter', sans-serif" }}>Voir →</div>
                        </ExternalLink>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            );
          })}

        </div>
              </div>
    </main>
  );
}
