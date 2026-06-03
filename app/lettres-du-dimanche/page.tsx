import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Lettres du dimanche — WADA",
  description: "La lettre éditoriale de WADA : palettes, marques et l'art d'habiller son quotidien.",
};

const LETTRES = [
  {
    numero: 1,
    date: "1er juin 2026",
    titre: "Studio du peintre et le silence",
    extrait: "Gris de fer, pâtine, vermillon. Comment habiller la mélancolie créative sans tomber dans le cliché de l'artiste bohème.",
    slug: "studio-du-peintre",
  },
];

export default function LettresDuDimanchePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F4", fontFamily: "'Inter', sans-serif" }}>
      <header style={{ padding: "40px 24px 28px", borderBottom: "0.5px solid #e8dfd0", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#8a7a68", marginBottom: 10 }}>
          Éditorial
        </p>
        <h1 style={{ fontFamily: "'Fredoka'", fontSize: 36, fontWeight: 500, margin: "0 0 10px", color: "#2c2c2a" }}>
          Lettres du dimanche
        </h1>
        <p style={{ fontSize: 14, color: "#8a7a68", lineHeight: 1.6, margin: 0 }}>
          Chaque dimanche, une palette Sanzō Wada devient le fil conducteur d'une réflexion sur la mode, le style et l'identité.
        </p>
      </header>

      <section style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 80px" }}>
        {LETTRES.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#8a7a68" }}>
            <p style={{ fontFamily: "'Fredoka'", fontSize: 22 }}>La première lettre arrive ce dimanche.</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {LETTRES.map((l) => (
              <li key={l.slug} style={{ borderBottom: "0.5px solid #e8dfd0", padding: "28px 0" }}>
                <p style={{ fontSize: 12, color: "#8a7a68", margin: "0 0 6px" }}>
                  N°{l.numero} · {l.date}
                </p>
                <h2 style={{ fontFamily: "'Fredoka'", fontSize: 22, fontWeight: 500, margin: "0 0 8px", color: "#2c2c2a" }}>
                  {l.titre}
                </h2>
                <p style={{ fontSize: 14, color: "#6a5e52", lineHeight: 1.6, margin: "0 0 14px" }}>
                  {l.extrait}
                </p>
                <Link href={`/lettres-du-dimanche/${l.slug}`} style={{
                  fontSize: 13, color: "#6e3b32", textDecoration: "underline",
                }}>
                  Lire →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
