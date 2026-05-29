"use client";
/**
 * /palette/[number] — Page palette individuelle (refonte 2026-05-20 v3).
 *
 * Brief mockup éditorial épuré :
 *   1. Hero 2 colonnes : palette swatches (3-5 bandes verticales avec Pantone
 *      code + nom + hex) | info (numéro·culture, titre serif, description,
 *      3 attrs, 2 actions Composer/Heart)
 *   2. Perso section : 4 questions chips (Registre / Occasion / Coupe / Budget)
 *      + summary + CTA "Voir ma tenue"
 *   3. Trust section : 4 colonnes (curation, sans inscription, affiliation,
 *      348 palettes)
 *   4. Pnav (palette navigation) : banner sombre prev/next entre palettes
 *
 * Disparu : grille des 5 pièces + drawer marchands (déplacés sur /composer
 * et /ma-tenue). Cette page est maintenant la fiche éditoriale pure.
 */
import Link from "next/link";
import { useState, useEffect, useMemo, use } from "react";
import { dictionary, cultureLabels, type DictionaryEntry } from "@/lib/data";
import { wadaRefCode as refCode } from "@/lib/utils";
import { showToast } from "@/lib/toast";
/* Brief « appli efficace » §3 (2026-05-29) : « un client ne doit jamais
   repartir de zéro ». On enregistre chaque visite de palette pour que
   la home affiche une bande « Reprends — {nom palette} ». */
import { useLastPalette } from "@/hooks/useLastPalette";
/* Brief « appli efficace » §6 (2026-05-29) : repère « Ensuite : … »
   pour montrer la prochaine étape du tunnel WADA. */
import NextStepHint from "@/components/NextStepHint";

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
  body: "'Inter', sans-serif",
};

const shadow = "0 12px 48px rgba(30,30,30,.09)";
const ease = "cubic-bezier(.22,1,.36,1)";

/* refCode (référence couleur format WADA) est désormais importé depuis
   lib/utils.ts (cf. brief « Remplacer PANTONE » 25/05) — implémentation
   centralisée + réutilisée par les composants /generateur et /about. */

/* Calcule la luminance d'un hex (0-255) pour choisir un texte clair ou sombre dessus */
function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

const REGISTRES = ["Minimal", "Classique", "Old money", "Streetwear"];
const OCCASIONS = ["Bureau", "Quotidien", "Sorties", "Voyage"];
const COUPES = ["Près du corps", "Standard", "Ample"];
const BUDGETS = ["≤ 200€", "200–500€", "≥ 500€"];

export default function PalettePage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const entry = useMemo(() => dictionary.find((d) => d.number === number), [number]);

  /* Navigation prev/next dans le dictionnaire — SANS wrap-around.
     Avant : sur palette 001, prev = dernier (348). Le saut « 348 → 012 »
     a fait croire à un bug. Désormais on ne wrap plus : sur la 1ère
     palette, prev=null (le bloc se cache) ; sur la dernière, next=null. */
  const { prev, next } = useMemo(() => {
    if (!entry) return { prev: null, next: null };
    const idx = dictionary.findIndex((d) => d.number === number);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? dictionary[idx - 1] : null,
      next: idx < dictionary.length - 1 ? dictionary[idx + 1] : null,
    };
  }, [number, entry]);

  const [isFavorite, setIsFavorite] = useState(false);
  const [registre, setRegistre] = useState("Classique");
  const [occasion, setOccasion] = useState("Bureau");
  const [coupe, setCoupe] = useState("Standard");
  const [budget, setBudget] = useState("≤ 200€");

  /* Charge favoris depuis localStorage */
  useEffect(() => {
    if (!entry) return;
    try {
      const fv = localStorage.getItem("wada-favorites");
      if (fv) {
        const list: string[] = JSON.parse(fv);
        setIsFavorite(list.includes(entry.number));
      }
    } catch {}
  }, [entry]);

  /* Brief « appli efficace » §3 : enregistre la palette visitée pour la
     bande Resume de la home. Hook gère lui-même la dedup (pas d'écriture
     si même n° que la dernière visite). */
  const { record: recordPalette } = useLastPalette();
  useEffect(() => {
    if (!entry) return;
    recordPalette(entry.number, entry.name);
  }, [entry, recordPalette]);

  const toggleFavorite = () => {
    if (!entry) return;
    try {
      const fv = localStorage.getItem("wada-favorites");
      const list: string[] = fv ? JSON.parse(fv) : [];
      const wasFav = isFavorite;
      const next = wasFav
        ? list.filter((n) => n !== entry.number)
        : [...list, entry.number];
      localStorage.setItem("wada-favorites", JSON.stringify(next));
      setIsFavorite(!wasFav);
      /* Brief finition (24/05) §3 — confirmation visuelle de l'action :
         avant, seul le bouton ♡→♥ changeait, ce qui pouvait passer
         inaperçu (clic accidentel ou hors champ visuel). Toast en bas
         centre, fade in/out 0.25s, lu poliment par les lecteurs d'écran. */
      showToast(
        wasFav ? "Retiré de vos favoris" : "Ajouté à vos favoris ✓",
        { variant: wasFav ? "info" : "success" },
      );
    } catch {}
  };

  if (!entry) {
    return (
      <main style={{ minHeight: "100vh", background: palette.beige, padding: "120px 32px" }}>
                <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontFamily: fonts.display, fontSize: 36 }}>Palette introuvable</h1>
          <Link href="/palettes" style={{ marginTop: 20, display: "inline-block" }}>← Retour au dictionnaire</Link>
        </div>
              </main>
    );
  }

  /* Build summary phrase pour la perso */
  const summaryAdvice = (() => {
    const reg = registre.toLowerCase();
    const occ = occasion.toLowerCase();
    const cp = coupe.toLowerCase();
    const bud = budget;
    let advice = "tailoring soft, lignes nettes, accessoires discrets";
    if (reg === "minimal") advice = "coupes épurées, monochromes, accessoires ton sur ton";
    else if (reg === "old money") advice = "matières nobles (laine, soie, cachemire), tomber impeccable";
    else if (reg === "streetwear") advice = "oversized, sneakers premium, accent textile";
    return `${registre} · ${occ} · coupe ${cp} · budget ${bud === "≤ 200€" ? "accessible" : bud === "200–500€" ? "moyen" : "premium"} — ${advice}.`;
  })();

  return (
    <main style={{
      fontFamily: fonts.sans,
      background: palette.beige,
      color: palette.ink,
      lineHeight: 1.6,
      minHeight: "100vh",
      WebkitFontSmoothing: "antialiased",
    }}>
      
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "30px 28px" }}>
        {/* Retour */}
        <Link href="/palettes" style={{
          display: "inline-flex", gap: 8,
          fontFamily: fonts.sans, fontSize: 12,
          letterSpacing: "0.16em", textTransform: "uppercase",
          background: palette.cream,
          border: `1px solid ${palette.line}`,
          borderRadius: 999, padding: "9px 16px",
          cursor: "pointer", color: palette.ink,
          textDecoration: "none",
        }}>
          ← Retour
        </Link>

        {/* ═══════════════════ HERO 2 COLONNES ═══════════════════
            Brief client 2026-05-26 « ameliore plus intuitif » : on
            compacte la palette card (padding 26→20, font 23→19) pour
            que les 3 looks soient visibles plus vite. La colonne droite
            gagne en respiration et hiérarchie. */}
        <div className="wada-palette-hero" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 50,
          alignItems: "stretch",
          marginTop: 20,
        }}>
          {/* LEFT — palette card avec swatches WADA, compactée */}
          <div style={{
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: shadow,
            border: `1px solid ${palette.line}`,
            alignSelf: "start",
          }}>
            {entry.colors.map((c, i) => {
              const lum = luminance(c.hex);
              const txt = lum < 140 ? "#fbf1ea" : "#2a1f16";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "20px 22px",
                    background: c.hex,
                    color: txt,
                  }}
                >
                  <div>
                    <p style={{
                      fontSize: 9, letterSpacing: "0.2em",
                      textTransform: "uppercase", opacity: 0.7,
                    }}>
                      {refCode(c.hex)}
                    </p>
                    <p style={{
                      fontFamily: fonts.display, fontWeight: 600,
                      fontSize: 19, marginTop: 3, letterSpacing: "-0.005em",
                    }}>
                      {c.name}
                    </p>
                  </div>
                  <p style={{ fontSize: 10, opacity: 0.78, letterSpacing: "0.04em" }}>
                    {c.hex.toUpperCase()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* RIGHT — info épurée
              Brief client 2026-05-26 « rends la plus pertinente, on
              comprend pas le voir la tenue perdu au milieu ».
              On retire : les 3 features pills (matières/couleurs/soin =
              marketing) ET le bouton solo « Voir la tenue » qui faisait
              doublon avec les 3 cards « Choisissez votre look » plus
              bas. Maintenant : kicker + nom + 1 phrase italique + ♡ + P
              dans une rangée discrète. L'action principale (voir une
              tenue) est entièrement portée par les 3 cards de look. */}
          <div>
            <p style={{
              fontFamily: fonts.display, fontWeight: 600,
              fontSize: 13, color: palette.bordeaux,
              letterSpacing: "0.02em",
            }}>
              No. {entry.number}
              {entry.culture && ` · ${cultureLabels[entry.culture] || entry.culture}`}
            </p>
            <h1 style={{
              fontFamily: fonts.display, fontWeight: 700,
              fontSize: "clamp(36px, 5vw, 50px)",
              lineHeight: 1.02, margin: "8px 0",
              letterSpacing: "-0.01em",
            }}>
              {entry.name}
            </h1>
            <p style={{
              fontFamily: fonts.body, fontStyle: "italic",
              fontSize: 18, color: palette.inkSoft,
              maxWidth: "32ch",
              margin: "10px 0 24px",
            }}>
              {entry.description}
            </p>

            {/* ♡ favori + Pinterest : actions secondaires discrètes,
                petites tailles. Plus de gros CTA bordeaux ici. */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                style={{
                  width: 42, height: 42, borderRadius: "50%",
                  border: `1px solid ${isFavorite ? palette.bordeaux : palette.line}`,
                  background: isFavorite ? palette.bordeaux : palette.cream,
                  color: isFavorite ? "#fff" : palette.bordeaux,
                  fontSize: 16, cursor: "pointer",
                  transition: `all 0.2s ${ease}`,
                }}
              >
                {isFavorite ? "♥" : "♡"}
              </button>
              {/* Brief client 2026-05-27 « mets le vrai logo Pinterest » —
                  avant on avait juste un « P » texte bordeaux (placeholder).
                  Maintenant : vrai pictogramme officiel Pinterest (cercle
                  rouge #E60023 + glyphe « P » blanc), proportions et tracé
                  fidèles à brand.pinterest.com (path SVG simplifié, libre
                  d'utilisation pour boutons "Save"/"Pin it"). */}
              <a
                href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(`https://www.wada.style/palette/${entry.number}`)}&media=${encodeURIComponent(`https://www.wada.style/palette/${entry.number}/opengraph-image`)}&description=${encodeURIComponent(
                  `${entry.name} — accord No. ${entry.number} du dictionnaire Sanzo Wada. ${entry.colors.map((c) => c.name).join(", ")}. La tenue qui va avec cette palette sur WADA. #palette #couleur #tenue #mode #SanzoWada`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Épingler cette palette sur Pinterest"
                title="Épingler sur Pinterest"
                style={{
                  width: 42, height: 42, borderRadius: "50%",
                  border: `1px solid ${palette.line}`,
                  background: palette.cream,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: `all 0.2s ${ease}`,
                  overflow: "hidden",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="#E60023"
                  aria-hidden
                >
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.137.893 2.738a.36.36 0 0 1 .083.343c-.091.378-.293 1.193-.333 1.361-.053.218-.173.265-.4.16-1.494-.696-2.428-2.879-2.428-4.633 0-3.772 2.74-7.235 7.895-7.235 4.144 0 7.366 2.953 7.366 6.899 0 4.117-2.595 7.43-6.199 7.43-1.211 0-2.348-.629-2.738-1.372l-.745 2.84c-.269 1.04-.997 2.345-1.485 3.139C9.572 23.812 10.766 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* ═══════════════════ 3 LOOKS — action principale ═══════════════════
            Brief client 2026-05-26 : « voir la tenue est perdu au milieu de
            tout ». L'ancien CTA solo dans la colonne droite faisait doublon
            avec ces 3 variantes. On en a fait L'ACTION principale :
            titre plus grand, kicker bordeaux, cards plus aérées, CTA
            « Voir ce look → » explicite et bordeaux sur chaque card.
            Sémantique d'override (cf. /ma-tenue lit ?style= & ?occasion=) :
              - classique  → style=Classique, occasion=quotidien
              - casual     → style=Minimal,   occasion=quotidien
              - dressy     → style=Old money, occasion=sorties */}
        {/* Section action principale — refonte intuitive 2026-05-27.
            Brief client : « savoir quel type de tenue le client veut ».
            Avant : titres abstraits (« Ce look » / « Plus décontracté »
            / « Plus habillé ») obligeaient à lire la desc pour comprendre.
            Maintenant chaque card mène avec une PASTILLE OCCASION
            explicite (Au bureau / Au quotidien / En soirée) puis un nom
            de tenue + 4 chips de pièces concrètes. Le client choisit
            en 2 secondes selon son besoin réel. */}
        <h2 style={{
          textAlign: "center", fontFamily: fonts.display, fontWeight: 700,
          fontSize: "clamp(26px, 3.4vw, 34px)", margin: "48px 0 10px",
          color: palette.ink, letterSpacing: "-0.01em",
        }}>
          Comment porter <em style={{ fontStyle: "italic", fontWeight: 600 }}>{entry.name.toLowerCase()}</em> ?
        </h2>
        <p style={{
          textAlign: "center", fontSize: 14, color: palette.inkSoft,
          margin: "0 auto 26px", maxWidth: 480,
        }}>
          Choisissez l'occasion — WADA compose la tenue adaptée.
        </p>
        <div className="wada-palette-variants" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
        }}>
          {/* 3 occasions distinctes — visuellement et sémantiquement.
              Query param `occasion` aligné sur le contexte réel pour que
              /ma-tenue puisse l'utiliser dans la composition. */}
          <VariantCard
            href={`/ma-tenue?palette=${entry.number}&style=Classique&occasion=bureau`}
            occasion="Au bureau"
            occasionIcon="briefcase"
            title="Tailoring classique"
            desc="Blazer impeccable, chemise et derbies — autorité tranquille."
            pieces={["Blazer", "Chemise", "Pantalon", "Derbies"]}
            previewColors={entry.colors.slice(0, 4).map((c) => c.hex)}
            variant="classique"
          />
          <VariantCard
            href={`/ma-tenue?palette=${entry.number}&style=Minimal&occasion=quotidien`}
            occasion="Au quotidien"
            occasionIcon="sun"
            title="Casual chic"
            desc="Tee, chino et sneakers — confortable sans négliger l'allure."
            pieces={["T-shirt", "Chino", "Sneakers", "Veste légère"]}
            previewColors={entry.colors.slice(0, 4).map((c) => c.hex)}
            variant="decontracte"
          />
          <VariantCard
            href={`/ma-tenue?palette=${entry.number}&style=Old%20money&occasion=sorties`}
            occasion="En soirée"
            occasionIcon="moon"
            title="Tenue habillée"
            desc="Pièces nobles, accent sombre — pour un dîner ou une sortie."
            pieces={["Pull fin", "Pantalon", "Chaussures cuir", "Accessoire"]}
            previewColors={entry.colors.slice(0, 4).map((c) => c.hex)}
            variant="habille"
          />
        </div>

        {/* ═══ STYLISTE IA — alternative aux 3 looks fixes ═══
            Brief client 2026-05-26 « ameliore plus intuitif » : pour
            ceux qui veulent du sur-mesure plutôt qu'un des 3 looks
            pré-composés, on les invite à dialoguer avec le styliste
            IA. Ligne discrète sous les cards. */}
        <p style={{
          textAlign: "center", fontSize: 14,
          color: palette.inkSoft, fontStyle: "italic",
          margin: "26px 0 0",
        }}>
          Ou{" "}
          <Link
            href={`/stylist?palette=${entry.number}`}
            style={{
              color: palette.bordeaux, fontWeight: 600,
              textDecoration: "underline", textDecorationThickness: 1,
              textUnderlineOffset: 3,
              fontStyle: "normal",
            }}
          >
            dialoguez avec le styliste
          </Link>{" "}
          pour une tenue sur-mesure autour de cette palette.
        </p>

        {/* ═══════════════════ AFFINER — replié optionnel (brief 2026-05-27) ═══
            La perso (registre + occasion + coupe + budget) reste accessible
            mais n'est plus le bloc principal du parcours. <details> = HTML
            natif, pas de JS, ouvrable au clavier (a11y native). */}
        <details className="wada-palette-affine" style={{
          margin: "32px 0 0",
          background: palette.cream,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          overflow: "hidden",
        }}>
          <summary style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "18px 22px",
            cursor: "pointer",
            listStyle: "none",
          }}>
            <span style={{
              fontFamily: fonts.display, fontWeight: 600,
              fontSize: 18, color: palette.ink,
            }}>
              Affiner à votre style
            </span>
            <span style={{ fontSize: 13, color: palette.inkSoft }}>
              Optionnel — ouvrir ▾
            </span>
          </summary>

          <div style={{ padding: "0 22px 22px" }}>
            <p style={{ fontSize: 13, color: palette.inkSoft, marginBottom: 14 }}>
              WADA ajuste la tenue à votre profil (registre, occasion, coupe, budget).
            </p>

            <div className="wada-perso-rows" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 36px",
            }}>
              <PersoRow label="Registre" options={REGISTRES} value={registre} onChange={setRegistre} />
              <PersoRow label="Occasion" options={OCCASIONS} value={occasion} onChange={setOccasion} />
              <PersoRow label="Coupe" options={COUPES} value={coupe} onChange={setCoupe} />
              <PersoRow label="Budget" options={BUDGETS} value={budget} onChange={setBudget} />
            </div>

            <div style={{
              marginTop: 20,
              borderTop: `1px solid ${palette.line}`,
              paddingTop: 16,
              display: "flex", alignItems: "center", gap: 14,
              flexWrap: "wrap",
            }}>
              <p style={{
                fontFamily: fonts.body, fontStyle: "italic",
                fontSize: 14, color: palette.inkSoft,
                flex: 1, minWidth: 240,
              }}>
                {summaryAdvice}
              </p>
              <Link href={`/ma-tenue?palette=${entry.number}&style=${encodeURIComponent(registre)}&occasion=${encodeURIComponent(occasion.toLowerCase())}`} style={{
                fontFamily: fonts.sans, fontSize: 13,
                padding: "11px 20px", borderRadius: 999,
                background: palette.ink, color: palette.cream,
                border: "none", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 8,
                fontWeight: 500,
              }}>
                <span>Voir la tenue affinée</span>
                <span aria-hidden style={{ fontSize: 14 }}>→</span>
              </Link>
            </div>
          </div>
        </details>

        {/* Brief « appli efficace » §6 — repère « Ensuite : … » qui
            indique que choisir un look mène à la tenue à acheter.
            Vise les utilisateurs qui ont scrollé jusqu'ici sans
            cliquer sur les 3 cards (peut-être hésitants) — on
            réaffirme la direction du tunnel. */}
        <NextStepHint
          label="Choisissez un look pour voir la tenue à acheter"
          href={`/ma-tenue?palette=${entry.number}&style=Classique&occasion=bureau`}
        />

        {/* Section TRUST (4 pills Curation/Sans inscription/Affiliation/
            348 palettes) RETIRÉE — brief client 2026-05-26 « rends la
            plus pertinente, trop d'information ». Ces 4 pills étaient
            de la landing page B2C, pas une info utile sur cette palette
            spécifique. Garde-fous confidentialité + transparence affilié
            restent visibles dans le footer global. */}

        {/* ═══════════════════ PNAV — prev/next dark banner ═══════════════════
            Bug fix 2026-05-21 : on n'affiche le lien que si la palette
            existe vraiment (plus de wrap 348 → 012). Sur la 1ère/dernière
            palette, on n'a qu'un seul côté. */}
        {(prev || next) && (
          <section style={{
            position: "relative",
            margin: "54px 0 0",
            borderRadius: 20,
            overflow: "hidden",
            color: palette.cream,
          }}>
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #4a5240, #6a6452)",
            }} />
            <div aria-hidden style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, rgba(20,22,18,.66), rgba(20,22,18,.5), rgba(20,22,18,.66))",
            }} />
            <div style={{
              position: "relative", zIndex: 2,
              display: "flex", justifyContent: "space-between",
              padding: 28, gap: 14, flexWrap: "wrap",
            }}>
              {prev ? (
                <Link href={`/palette/${prev.number}`} style={pnavLinkStyle("left")}>
                  <span style={pnavSubStyle}>← Précédente · No. {prev.number}</span>
                  <span style={pnavTitleStyle}>{prev.name}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/palette/${next.number}`} style={pnavLinkStyle("right")}>
                  <span style={pnavSubStyle}>Suivante · No. {next.number} →</span>
                  <span style={pnavTitleStyle}>{next.name}</span>
                </Link>
              ) : <span />}
            </div>
          </section>
        )}
      </div>

      
      <style jsx>{`
        @media (max-width: 820px) {
          :global(.wada-palette-hero) {
            grid-template-columns: 1fr !important;
            gap: 26px !important;
          }
          :global(.wada-perso-rows) {
            grid-template-columns: 1fr !important;
          }
          :global(.wada-palette-trust) {
            grid-template-columns: 1fr 1fr !important;
          }
          :global(.wada-palette-variants) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ──────────────────────────── Helpers UI ──────────────────────────── */

function PersoRow({ label, options, value, onChange }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p style={{
        fontSize: 11, letterSpacing: "0.14em",
        textTransform: "uppercase", color: palette.olive,
        marginBottom: 8, fontWeight: 500,
      }}>
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              style={{
                fontFamily: fonts.sans, fontSize: 13,
                padding: "8px 14px", borderRadius: 10,
                border: `1px solid ${active ? palette.ink : palette.line}`,
                background: active ? palette.ink : palette.beige,
                color: active ? palette.cream : palette.inkSoft,
                cursor: "pointer",
                transition: `all 0.22s ${ease}`,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrustItem({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div>
      <p style={{
        fontSize: 11, letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.bordeaux, fontWeight: 500,
        marginBottom: 5,
      }}>
        <span aria-hidden style={{ marginRight: 6 }}>{icon}</span>
        {label}
      </p>
      <p style={{ fontSize: 13, color: palette.inkSoft, lineHeight: 1.55 }}>
        {desc}
      </p>
    </div>
  );
}

/**
 * VariantCard — une des 3 cartes « 3 façons de la porter ».
 * Brief 2026-05-27 §1 clarté : donner du choix sans surcharger.
 * Preview = mini bandes horizontales des couleurs de l'accord (relie
 * visuellement la variante à la palette parente).
 */
/**
 * Brief UX client (26/05) — silhouettes SVG par variante pour qu'un
 * coup d'œil suffise à comprendre la différence entre les 3 cards.
 * Géométrie minimale, monochrome currentColor pour épouser le thème.
 */
function VariantSilhouette({ variant }: { variant: "classique" | "decontracte" | "habille" }) {
  const common = { width: 28, height: 28, viewBox: "0 0 28 28", fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (variant === "classique") {
    // Blazer : col en V + revers structurés
    return (
      <svg {...common} aria-hidden>
        <path d="M14 4l-5 4-3 16h16l-3-16-5-4z" />
        <path d="M14 4l0 8" />
        <path d="M9 8l5 4 5-4" />
      </svg>
    );
  }
  if (variant === "decontracte") {
    // T-shirt : manches courtes
    return (
      <svg {...common} aria-hidden>
        <path d="M9 6l-4 3 2 4 2-1v12h10v-12l2 1 2-4-4-3-3 2h-4l-3-2z" />
      </svg>
    );
  }
  // habille : robe longue / manteau / coupe ajustée
  return (
    <svg {...common} aria-hidden>
      <path d="M14 4l-4 3v3l-2 14h12l-2-14v-3l-4-3z" />
      <path d="M14 4l0 22" />
    </svg>
  );
}

/**
 * Bandes de couleur — l'affichage change par variante :
 *   - classique : 4 bandes égales et collées (structuré)
 *   - decontracte : 3 bandes plus larges avec espacement (relax)
 *   - habille : 5 bandes très fines (raffiné, premium)
 */
function VariantColorStrip({ variant, colors }: { variant: "classique" | "decontracte" | "habille"; colors: string[] }) {
  if (variant === "decontracte") {
    return (
      <div aria-hidden style={{ display: "flex", height: 84, gap: 6, padding: "0 6px" }}>
        {colors.slice(0, 3).map((hex, i) => (
          <span key={i} style={{ flex: 1, background: hex, borderRadius: 6 }} />
        ))}
      </div>
    );
  }
  if (variant === "habille") {
    return (
      <div aria-hidden style={{ display: "flex", height: 84 }}>
        {colors.slice(0, 5).concat([colors[0]]).map((hex, i) => (
          <span key={i} style={{ flex: 1, background: hex, borderRight: i < 5 ? "1px solid rgba(0,0,0,.05)" : undefined }} />
        ))}
      </div>
    );
  }
  // classique
  return (
    <div aria-hidden style={{ display: "flex", height: 84 }}>
      {colors.slice(0, 4).map((hex, i) => (
        <span key={i} style={{ flex: 1, background: hex }} />
      ))}
    </div>
  );
}

/**
 * OccasionIcon — pictogramme contextuel (mallette/soleil/lune) qui dit
 * INSTANTANÉMENT à quelle situation correspond la tenue. Brief client
 * 2026-05-27 « savoir quel type de tenue le client veut » : avant la
 * silhouette vêtement seule était ambiguë, maintenant la double signa-
 * lisation (occasion + silhouette) verrouille le sens.
 */
function OccasionIcon({ kind }: { kind: "briefcase" | "sun" | "moon" }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "briefcase") {
    return (
      <svg {...common} aria-hidden>
        <rect x="2" y="5" width="12" height="9" rx="1.5" />
        <path d="M6 5V3.5A1 1 0 0 1 7 2.5h2a1 1 0 0 1 1 1V5" />
        <path d="M2 9h12" />
      </svg>
    );
  }
  if (kind === "sun") {
    return (
      <svg {...common} aria-hidden>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden>
      <path d="M13.2 9.7A5.5 5.5 0 1 1 6.3 2.8a4.5 4.5 0 0 0 6.9 6.9z" />
    </svg>
  );
}

function VariantCard({ href, occasion, occasionIcon, title, desc, pieces, previewColors, variant }: {
  href: string;
  occasion: string;
  occasionIcon: "briefcase" | "sun" | "moon";
  title: string;
  desc: string;
  pieces: string[];
  previewColors: string[];
  variant: "classique" | "decontracte" | "habille";
}) {
  /* Brief client 2026-05-27 — intuitivité MAX :
     1. Pastille OCCASION en haut (« Au bureau » + icône mallette) =
        le client comprend en 1 coup d'œil à quelle situation ça sert.
     2. Titre nom-de-tenue plus parlant (« Tailoring classique » au
        lieu de « Ce look »).
     3. Chips de pièces concrètes (Blazer · Chemise · …) = le client
        sait ce qu'il va recevoir avant même de cliquer.
     4. CTA pill bordeaux conservé — action évidente. */
  return (
    <Link
      href={href}
      className="wada-variant-card"
      style={{
        display: "flex", flexDirection: "column",
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 8px 30px rgba(30,30,30,.07)",
        textDecoration: "none",
        color: "inherit",
        transition: `transform 0.3s ${ease}, box-shadow 0.3s ${ease}`,
      }}
    >
      <VariantColorStrip variant={variant} colors={previewColors} />
      <div style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Pastille OCCASION — la signalisation primaire de la card.
            Position en haut, isolée, hyper lisible. */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          alignSelf: "flex-start",
          fontFamily: fonts.sans, fontSize: 10.5, fontWeight: 600,
          letterSpacing: "0.14em", textTransform: "uppercase",
          color: palette.bordeaux,
          background: "rgba(107,58,50,.07)",
          padding: "5px 10px", borderRadius: 999,
          marginBottom: 12,
        }}>
          <OccasionIcon kind={occasionIcon} />
          {occasion}
        </span>

        {/* Titre + silhouette vêtement (signalisation secondaire) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: palette.bordeaux, marginBottom: 6 }}>
          <VariantSilhouette variant={variant} />
          <h3 style={{
            fontFamily: fonts.display, fontWeight: 600,
            fontSize: 19, color: palette.ink, margin: 0,
            letterSpacing: "-0.005em",
          }}>
            {title}
          </h3>
        </div>
        <p style={{
          fontSize: 13.5, color: palette.inkSoft,
          margin: "4px 0 14px", lineHeight: 1.5,
        }}>
          {desc}
        </p>

        {/* Chips PIÈCES — le client voit AVANT de cliquer ce qu'il
            recevra. Plus de surprise, choix éclairé. */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 5,
          margin: "0 0 18px", flex: 1, alignContent: "flex-start",
        }}>
          {pieces.map((p) => (
            <span
              key={p}
              style={{
                fontFamily: fonts.sans, fontSize: 11.5,
                color: palette.inkSoft,
                background: palette.beige,
                border: `1px solid ${palette.line}`,
                padding: "3px 9px", borderRadius: 6,
                letterSpacing: "0.005em",
              }}
            >
              {p}
            </span>
          ))}
        </div>

        {/* CTA pill bordeaux pleine largeur — l'action est ÉVIDENTE. */}
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          background: palette.bordeaux, color: palette.cream,
          padding: "12px 18px", borderRadius: 999,
          fontFamily: fonts.sans, fontSize: 14, fontWeight: 500,
          letterSpacing: "0.01em",
          transition: `background 0.2s ${ease}`,
        }}>
          Voir ce look
          <span aria-hidden style={{ fontSize: 15 }}>→</span>
        </span>
      </div>
    </Link>
  );
}

function pnavLinkStyle(align: "left" | "right"): React.CSSProperties {
  return {
    background: "transparent",
    color: palette.cream,
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: fonts.sans,
    display: "flex", flexDirection: "column",
    textAlign: align,
    flex: 1,
    alignItems: align === "right" ? "flex-end" : "flex-start",
  };
}

const pnavSubStyle: React.CSSProperties = {
  fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
  opacity: 0.8,
};

const pnavTitleStyle: React.CSSProperties = {
  fontFamily: fonts.display, fontWeight: 600,
  fontSize: 21, marginTop: 4,
};
