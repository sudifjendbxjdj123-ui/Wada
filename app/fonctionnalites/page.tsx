"use client";
import { dictionary } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary } from "@/lib/styles";
import Reveal from "@/components/Reveal";
import FeatureGrid3 from "@/components/FeatureGrid3";
import ValueSection from "@/components/ValueSection";
import PaletteMarquee from "@/components/PaletteMarquee";
import Testimonials from "@/components/Testimonials";
import OutfitAvatar from "@/components/OutfitAvatar";
import FinalCTA from "@/components/FinalCTA";
import { avatarVariationFor } from "@/lib/utils";

/**
 * Page /fonctionnalites — vitrine produit détaillée.
 *
 * Reprend tous les blocs qui étaient sur la home et qui méritent leur propre
 * page : Pourquoi 348, Trois gestes, défilé du dictionnaire, 3 sections valeur,
 * témoignages, CTA. Chaque clic depuis la home arrive ici plutôt que de
 * scroller dix sections.
 */
export default function FonctionnalitesPage() {
  const demoPalette = dictionary.find((d) => d.number === "087") || dictionary[0];
  const top    = demoPalette.composition.find((c) => c.piece === "Top");
  const bottom = demoPalette.composition.find((c) => c.piece === "Bottom");
  const shoes  = demoPalette.composition.find((c) => c.piece === "Shoes");
  const colorFor = (item?: string) => {
    if (!item) return demoPalette.colors[0].hex;
    return (demoPalette.colors.find((c) => item.toLowerCase().includes(c.name.toLowerCase().split(" ")[0])) || demoPalette.colors[0]).hex;
  };
  const avatar = avatarVariationFor(demoPalette);

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
      
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* HEADER PAGE */}
          <header style={{ textAlign: "center", padding: "80px 0 40px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Fonctionnalités</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.05, fontFamily: "'Fredoka', sans-serif" }}>
              Ce que Wada<br />sait faire.
            </h1>
            <p style={{ fontSize: 17, color: textSecondary, fontStyle: "italic", marginTop: 28, maxWidth: 600, margin: "28px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.7 }}>
              Trois gestes, trois questions auxquelles Wada répond. Tout part du
              dictionnaire de Sanzo Wada (1933) — 348 accords de couleurs validés
              depuis presque un siècle.
            </p>
          </header>

          {/* 3 CAPACITÉS — FeatureGrid3 */}
          <Reveal>
            <FeatureGrid3 />
          </Reveal>

          {/* SANZO WADA — Pourquoi 348 ? */}
          <Reveal>
            <section style={{ margin: "100px auto 80px", maxWidth: 920, padding: "0 32px", textAlign: "center" }}>
              <p style={{ ...sectionLabel, color: seal, marginBottom: 16 }}>Pourquoi 348 ?</p>
              <h2 className="wada-section-title" style={{ fontSize: 34, fontWeight: 500, margin: "0 0 24px", fontFamily: "'Fredoka', sans-serif", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                Vous ne vous trompez plus de couleurs.
              </h2>
              <p style={{ fontSize: 17, color: textSecondary, lineHeight: 1.75, margin: "0 auto 18px", fontFamily: "'Inter', sans-serif", maxWidth: 640 }}>
                L'erreur la plus commune au matin : choisir une couleur, constater
                plus tard qu'elle ne va avec rien. Chaque tenue WADA suit l'un des{" "}
                <strong>348 accords chromatiques recensés par Sanzo Wada en 1933</strong>
                {" "}— des couleurs qui marchent ensemble, validées depuis presque un siècle.
              </p>
              <p style={{ fontSize: 17, color: textSecondary, lineHeight: 1.75, margin: "0 auto", fontFamily: "'Inter', sans-serif", maxWidth: 640 }}>
                Le dictionnaire reste utilisé chez les architectes, les costumiers
                et les stylistes — vous y avez accès en un clic.
              </p>
            </section>
          </Reveal>

          {/* MARQUEE — défilement du dictionnaire */}
          <Reveal>
            <PaletteMarquee />
          </Reveal>

          {/* 3 BLOCS VALEUR */}
          <Reveal>
            <ValueSection
              label="I · Le gain"
              title="Oubliez les heures perdues à chercher."
              description="Trois minutes, une palette, une tenue cohérente. Plus de matin à fouiller la garde-robe, plus d'onglets à ouvrir à dix-huit heures. Wada décide pour vous — sans choisir à votre place."
              ctaLabel="Voir le catalogue"
              ctaHref="/palettes"
              visual={(
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
                  {[dictionary[0], dictionary[12], dictionary[24]].filter(Boolean).map((p) => (
                    <div key={p.number} style={{ background: paper, border: `1px solid ${border}`, padding: 10 }}>
                      <p style={{ fontSize: 8, letterSpacing: "0.35em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", margin: "0 0 6px" }}>No. {p.number}</p>
                      <div style={{ display: "flex", height: 30, border: `1px solid ${border}` }}>
                        {p.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
                      </div>
                      <p style={{ fontSize: 11, fontStyle: "italic", margin: "6px 0 0", fontFamily: "'Inter', sans-serif" }}>{p.name}</p>
                    </div>
                  ))}
                </div>
              )}
            />
          </Reveal>

          <Reveal>
            <ValueSection
              reverse
              label="II · L'expression"
              title="Votre palette devient votre signature."
              description="Une fois que vous avez trouvé l'accord chromatique qui vous ressemble, il revient — dans une autre tenue, une autre saison, une autre boutique. Wada se souvient et propose la même justesse."
              ctaLabel="Essayer le stylist"
              ctaHref="/stylist"
              visual={(
                <OutfitAvatar
                  height={300}
                  top={top    ? { type: "blazer",   color: colorFor(top.item) }    : undefined}
                  bottom={bottom ? { type: "trousers", color: colorFor(bottom.item) } : undefined}
                  shoes={shoes  ? { type: "loafer",   color: colorFor(shoes.item) }  : undefined}
                  hairStyle={avatar.hairStyle}
                  skinTone={avatar.skinTone}
                  morphology={avatar.morphology}
                />
              )}
            />
          </Reveal>

          <Reveal>
            <ValueSection
              label="III · L'achat"
              title="De la couleur à la commande en secondes."
              description="Cliquez sur la tenue, choisissez votre boutique — Vinted, Sézane, COS, Net-a-Porter. Wada vous y conduit, vous achetez, vous portez. Aucun compte, aucun panier captif."
              ctaLabel="Voir les boutiques"
              ctaHref="/cultures"
              visual={(
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 260 }}>
                  {[
                    { label: "Vinted",        sub: "Seconde main",  stars: 5 },
                    { label: "COS",           sub: "Premium",       stars: 5 },
                    { label: "Zara",          sub: "Prêt-à-porter", stars: 3 },
                    { label: "Net-a-Porter",  sub: "Luxe",          stars: 5 },
                    { label: "Sézane",        sub: "Premium FR",    stars: 5 },
                  ].map((b) => (
                    <div key={b.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: paper, border: `1px solid ${border}`, padding: "10px 14px" }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", margin: 0, fontFamily: "'Inter', sans-serif" }}>{b.label}</p>
                        <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: subtle, margin: "2px 0 0", fontFamily: "'Inter', sans-serif" }}>{b.sub}</p>
                      </div>
                      <span style={{ fontSize: 10, color: seal, letterSpacing: 0 }}>{"★".repeat(b.stars)}</span>
                    </div>
                  ))}
                </div>
              )}
            />
          </Reveal>

          {/* TÉMOIGNAGES */}
          <Reveal>
            <Testimonials />
          </Reveal>

        </div>

        {/* FINAL CTA */}
        <Reveal>
          <FinalCTA />
        </Reveal>

              </div>
    </main>
  );
}
