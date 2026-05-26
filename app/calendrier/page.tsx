"use client";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { dictionary, cultureLabels } from "@/lib/data";
import { ink, paper, subtle, seal, border, sectionLabel, textSecondary, cardBg } from "@/lib/styles";
import BackButton from "@/components/BackButton";

const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const dayNames = ["L", "M", "M", "J", "V", "S", "D"];

// Choisit déterministiquement une palette pour un jour donné
function paletteForDate(date: Date) {
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  return dictionary[seed % dictionary.length];
}

export default function CalendrierPage() {
  /* Brief audit 2026-05-28 : la page est prerender statique → `new Date()`
     au moment du build était FIGÉ (HTML servi disait « mercredi 20 mai »
     alors qu'on était le 24). Fix :
       1. State `today` initialisé via useState(() => new Date()) ; côté SSR
          c'est la date du build, mais côté client useState initial run AVANT
          la 1ère render → date réelle au load.
       2. useEffect au mount qui setToday(new Date()) — couvre le cas où
          la page est restée ouverte au-delà de minuit. */
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    setToday(new Date());
  }, []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const monthData = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstWeekday = (first.getDay() + 6) % 7; // Lundi = 0
    const days: ({ day: number; date: Date; palette: typeof dictionary[0] } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({ day: d, date, palette: paletteForDate(date) });
    }
    return days;
  }, [year, month]);

  const todayPalette = paletteForDate(today);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <main style={{ minHeight: "100vh", background: paper, color: ink, fontFamily: "'Inter', sans-serif" }}>
            <BackButton />
      <div className="wada-container" style={{ padding: "0 32px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* HEADER */}
          <header style={{ textAlign: "center", padding: "80px 0 48px" }}>
            <p style={{ ...sectionLabel, marginBottom: 18, color: seal }}>Calendrier</p>
            <h1 className="wada-hero-title wada-text-3d-ink" style={{ fontSize: 56, fontWeight: 400, letterSpacing: "-0.01em", margin: 0, fontStyle: "italic", lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>
              Une palette<br/>par jour
            </h1>
            <p style={{ fontSize: 16, color: subtle, fontStyle: "italic", marginTop: 24, maxWidth: 540, margin: "24px auto 0", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
              Une combinaison de couleurs choisie pour chaque jour de l'année.
            </p>
          </header>

          {/* PALETTE DU JOUR — grand bandeau */}
          <section style={{ marginBottom: 80 }}>
            <Link href={`/palette/${todayPalette.number}`} style={{ textDecoration: "none", color: ink }}>
              <article className="wada-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: cardBg, border: `1px solid ${border}`, transition: "transform 0.3s ease", cursor: "pointer" }}
                onMouseEnter={(ev) => { ev.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ padding: "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: `1px solid ${border}` }}>
                  <p style={{ ...sectionLabel, marginBottom: 14, color: seal }}>Aujourd'hui · {today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                  <h2 style={{ fontSize: 48, fontStyle: "italic", fontWeight: 400, margin: "0 0 12px", lineHeight: 1.05, fontFamily: "'Inter', sans-serif" }}>{todayPalette.name}</h2>
                  <p style={{ fontSize: 14, color: subtle, fontStyle: "italic", margin: "0 0 24px", fontFamily: "'Inter', sans-serif" }}>No. {todayPalette.number} · {todayPalette.culture && (cultureLabels[todayPalette.culture] || todayPalette.culture)}</p>
                  <p style={{ fontSize: 16, color: textSecondary, lineHeight: 1.7, fontStyle: "italic", margin: "0 0 24px", fontFamily: "'Inter', sans-serif" }}>{todayPalette.description}</p>
                  <p style={{ fontSize: 11, letterSpacing: "0.4em", textTransform: "uppercase", color: ink, fontFamily: "'Inter', sans-serif", margin: 0 }}>Voir la tenue →</p>
                </div>
                <div className="wada-palette-bands" style={{ display: "flex", minHeight: 280 }}>
                  {todayPalette.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
                </div>
              </article>
            </Link>
          </section>

          {/* CALENDRIER MOIS */}
          <section style={{ marginBottom: 80 }}>
            {/* Navigation mois */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: `1px solid ${border}` }}>
              <button onClick={prevMonth} aria-label="Mois précédent" style={{ background: "transparent", border: "none", cursor: "pointer", color: ink, fontSize: 24, padding: 8, fontFamily: "'Inter', sans-serif" }}>←</button>
              <h2 style={{ fontSize: 32, fontStyle: "italic", fontWeight: 400, margin: 0, fontFamily: "'Inter', sans-serif" }}>
                {monthNames[month]} {year}
              </h2>
              <button onClick={nextMonth} aria-label="Mois suivant" style={{ background: "transparent", border: "none", cursor: "pointer", color: ink, fontSize: 24, padding: 8, fontFamily: "'Inter', sans-serif" }}>→</button>
            </div>

            {/* Entêtes jours */}
            <div className="wada-cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
              {dayNames.map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: subtle, fontFamily: "'Inter', sans-serif", padding: 8 }}>{d}</div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="wada-cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {monthData.map((cell, i) => {
                if (!cell) return <div key={i} />;
                const isToday = cell.date.toDateString() === today.toDateString();
                return (
                  <Link key={i} href={`/palette/${cell.palette.number}`} style={{ textDecoration: "none", color: ink }}>
                    <div style={{ position: "relative", aspectRatio: "1 / 1", border: `1px solid ${isToday ? ink : border}`, cursor: "pointer", transition: "transform 0.2s ease", overflow: "hidden" }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.transform = "scale(1.05)"; ev.currentTarget.style.zIndex = "5"; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.transform = "scale(1)"; ev.currentTarget.style.zIndex = "auto"; }}>
                      <div style={{ position: "absolute", inset: 0, display: "flex" }}>
                        {cell.palette.colors.map((c) => (<div key={c.hex} style={{ flex: 1, background: c.hex }} />))}
                      </div>
                      <div style={{ position: "absolute", top: 4, left: 6, fontSize: 12, color: "white", fontFamily: "'Inter', sans-serif", textShadow: "0 1px 4px rgba(0,0,0,0.4)", fontWeight: isToday ? 700 : 400 }}>
                        {cell.day}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: subtle, fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>
              Cliquez sur un jour pour voir la palette et la tenue.
            </p>
          </section>

        </div>
              </div>
    </main>
  );
}
