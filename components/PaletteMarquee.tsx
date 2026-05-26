"use client";
import Link from "next/link";
import { dictionary } from "@/lib/data";
import { ink, subtle, sectionLabel, seal } from "@/lib/styles";

/**
 * PaletteMarquee — défilement vertical infini des palettes du dictionnaire.
 *
 * Inspiré de la zone "thanks scroller" d'Oryzo : un mouvement lent,
 * contemplatif, qui ne demande rien à l'utilisateur. Ici on montre la
 * largeur du catalogue WADA — 348 entrées — sans pagination ni grille.
 *
 * Chaque ligne : numéro + trois bandes de couleur + nom italique. La piste
 * est doublée pour assurer une boucle visuelle parfaite. Un masque
 * `linear-gradient` fade les bords haut et bas pour qu'aucun item ne
 * disparaisse abruptement.
 *
 * Vitesse : 90 secondes pour un cycle complet — assez lent pour que l'œil
 * lise sans courir, assez rapide pour qu'on sente le mouvement.
 */
export default function PaletteMarquee() {
  // 60 palettes — assez pour remplir l'écran sans alourdir le DOM
  const items = dictionary.slice(0, 60);
  const doubled = [...items, ...items]; // boucle continue

  return (
    <section
      aria-label="Aperçu du dictionnaire"
      style={{
        margin: "120px auto",
        maxWidth: 760,
        padding: "0 24px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{ ...sectionLabel, marginBottom: 12, color: seal }}>
          348 combinaisons
        </p>
        <h2
          className="wada-section-title"
          style={{
            fontSize: 32,
            fontStyle: "italic",
            fontWeight: 400,
            margin: 0,
            fontFamily: "'Fredoka', sans-serif",
            letterSpacing: "-0.01em",
            color: ink,
          }}
        >
          Le dictionnaire défile.
        </h2>
      </div>

      <div className="wada-marquee-mask">
        <div className="wada-marquee-track">
          {doubled.map((p, i) => (
            <Link
              key={`${p.number}-${i}`}
              href={`/palette/${p.number}`}
              className="wada-marquee-row"
              aria-label={`Palette No. ${p.number} — ${p.name}`}
            >
              <span className="wada-marquee-num">No. {p.number}</span>
              <div className="wada-marquee-bands">
                {p.colors.map((c) => (
                  <span key={c.hex} style={{ background: c.hex }} />
                ))}
              </div>
              <span className="wada-marquee-name">{p.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: 32,
          fontSize: 11,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: subtle,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Cliquez sur une ligne pour entrer dans la palette
      </p>
    </section>
  );
}
