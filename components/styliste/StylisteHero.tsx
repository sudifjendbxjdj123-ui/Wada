"use client";
/**
 * StylisteHero — Colonne droite de /styliste.
 * Flat lay éditorial sticky + overlay « Inspiration du jour ».
 * Caché sur mobile (≤1024px).
 */

/* Inspirations qui tournent chaque jour (basées sur la semaine) */
const DAILY_INSPIRATIONS = [
  { title: "Chic minimaliste", text: "Élégance discrète, tons neutres et matières naturelles.", palette: "Studio danois" },
  { title: "Caramel & marine", text: "Le mariage inattendu du camel et du bleu nuit.", palette: "Pluie de Tokyo" },
  { title: "Terracotta & crème", text: "Chaleur méditerranéenne, coupes amples et légères.", palette: "Osaka au thé" },
  { title: "Monochrome gris", text: "De l'ardoise au caillou, une tenue graphique assumée.", palette: "Brume du matin" },
  { title: "Vert & bordeaux", text: "Les couleurs forêt qui habillent sans effort le quotidien.", palette: "Jardin de Kyoto" },
  { title: "Noir & ivoire", text: "Le classique qui ne se démode jamais, porté avec précision.", palette: "Sumi-e" },
  { title: "Camel & blanc", text: "Légèreté estivale, coupes épurées et bijoux dorés.", palette: "Riviera" },
];

export function StylisteHero() {
  /* Rotation simple basée sur le jour de la semaine */
  const day = typeof window !== "undefined" ? new Date().getDay() : 0;
  const inspiration = DAILY_INSPIRATIONS[day % DAILY_INSPIRATIONS.length];

  return (
    <div className="wada-styliste-hero-col" style={{ display: "none", paddingTop: 24, paddingBottom: 60 }}>
      <div style={{ position: "sticky", top: 32 }}>
        {/* Flat lay éditorial — placeholder crème avec typographie WADA */}
        <div style={{
          aspectRatio: "4/5",
          background: "linear-gradient(145deg, #ddd5c4 0%, #c9beab 40%, #b8a99a 100%)",
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Placeholder éditorial — à remplacer par /public/hero/styliste-flatlay-cream-minimaliste.jpg */}
          <div style={{ textAlign: "center", opacity: 0.35 }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 64, color: "#3a2d25", margin: 0 }}>和田</p>
            <p style={{
              fontFamily: "'Inter'", fontSize: 11, letterSpacing: "0.3em",
              textTransform: "uppercase", color: "#3a2d25", marginTop: 8,
            }}>
              flat lay éditorial
            </p>
          </div>

          {/* Overlay « Inspiration du jour » */}
          <div style={{
            position: "absolute", bottom: 16, right: 16,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 14,
            padding: "14px 16px",
            maxWidth: 220,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}>
            <p style={{
              fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "#8a7a68", margin: "0 0 6px", fontFamily: "'Inter'", fontWeight: 600,
            }}>
              Inspiration du jour
            </p>
            <p style={{
              fontSize: 14, fontWeight: 600, color: "#1a1a1a",
              fontFamily: "'Fredoka'", margin: "0 0 4px",
            }}>
              {inspiration.title}
            </p>
            <p style={{
              fontSize: 11, color: "#5a5a5a", lineHeight: 1.45,
              fontFamily: "'Inter'", margin: "0 0 8px",
            }}>
              {inspiration.text}
            </p>
            <p style={{
              fontSize: 10, color: "#6e3b32", fontFamily: "'Inter'",
              fontWeight: 600, letterSpacing: "0.05em", margin: 0,
            }}>
              Palette : {inspiration.palette}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .wada-styliste-hero-col {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
