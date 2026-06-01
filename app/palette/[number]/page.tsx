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
import { useRouter } from "next/navigation";
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
/* Vision Pt B (2026-05-31) : couche émotionnelle (perception/humeur/objectif)
   injectée juste avant le bloc « Composées pour vous » pour que les 3 cartes
   tenue prennent en compte l'envie du jour. */
/* MoodChips retiré de cette page 2026-05-31 (user feedback page noyée).
   Reste dispo sur /stylist via le même composant.
import MoodChips from "@/components/MoodChips"; */
/* Brief « Onboarding + profil + switcher » Phase 3 (2026-05-29) :
   chips de pièces dans les 3 cards filtrés par genre + badge perso
   « Composées pour vous » + propagation du profil vers /ma-tenue. */
import ProfileChip from "@/components/ProfileChip";
import { useProfile } from "@/hooks/useProfile";

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

/* Brief « Onboarding + profil + switcher » Phase 3 (2026-05-29) :
   chips de pièces filtrés par genre dans les 3 cards occasion.
   Femme : blazer fluide / mocassins / boucles dorées / pantalon fluide
   Homme : blazer / derbies / chemise / pochette de costume

   Indexation par (occasion → genre → chips[4]). Le hook useProfile
   donne le genre courant ; on lit directement la bonne ligne. */
const PIECES_BY_OCCASION: Record<
  "bureau" | "quotidien" | "soiree",
  Record<"Femme" | "Homme", string[]>
> = {
  bureau: {
    Femme: ["Blazer fluide", "Chemise", "Pantalon fluide", "Mocassins"],
    Homme: ["Blazer", "Chemise oxford", "Pantalon", "Derbies"],
  },
  quotidien: {
    Femme: ["T-shirt", "Chino", "Sneakers blanches", "Veste légère"],
    Homme: ["T-shirt", "Chino", "Sneakers", "Surchemise"],
  },
  soiree: {
    Femme: ["Pull fin", "Pantalon droit", "Escarpins cuir", "Boucles dorées"],
    Homme: ["Pull fin", "Pantalon", "Chaussures cuir", "Pochette de costume"],
  },
};

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

  /* Brief « Onboarding + profil + switcher » Phase 3 :
     Le profil filtre les chips de pièces (Femme vs Homme) et se propage
     en query param `genre` vers /ma-tenue pour que la composition tienne
     compte du genre dès le clic « Voir ce look ». */
  const { effective: prof } = useProfile();
  const profGenreParam = prof.genre.toLowerCase(); // "femme" | "homme"

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
          Réglez vos préférences — WADA compose la tenue adaptée.
        </p>
        {/* User feedback 2026-05-31 « rends cette page cohérente elle
            n'a aucun sens pour le client » : retrait du bloc de 5 lignes
            de chips ProfileQuickChips + bloc MoodChips. Sur la page
            palette, le client veut juste voir les couleurs et choisir
            un look. Le profil (genre/budget/style/saison) est déjà
            persisté dans wada.profile et utilisé en arrière-plan. Les
            mood chips restent sur /stylist où ils ont du sens (avant
            génération d'une tenue sur-mesure). Si le client veut
            personnaliser, il clique sur « dialoguez avec le styliste »
            plus bas. */}

        {/* User feedback 2026-05-31 v2 : « j'ai bien compris que tu adores
            ces trois cartes mais où est le budget, le sexe, l'envie de
            style du client ? Il y a juste 3 looks pour je ne sais pas
            qui. » Les 3 cartes anonymes sont remplacées par UN bloc
            personnalisé qui montre le profil + 1 picker d'occasion +
            1 CTA. Le client voit IMMÉDIATEMENT pour qui est composée
            la tenue et la modifie en 1 clic si besoin. */}
        <PersonalizedCompose entry={entry} />

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

        {/* Brief 2026-05-30 : accordéon « Affiner à votre style » SUPPRIMÉ.
            Devenu redondant depuis l'ajout du bloc ProfileQuickChips
            au-dessus des 3 cards d'occasion (chips Pour qui / Budget /
            Style / Saison / Tendance accessibles en 1 clic sans avoir
            à ouvrir un menu). Les anciennes REGISTRES / OCCASIONS /
            COUPES / BUDGETS (state local) sont remplacés par useProfile
            global synchronisé avec le ProfileSwitcher. */}

        {/* NextStepHint retiré (user 2026-06-01 : redondant avec le CTA
            « Voir ma tenue → » déjà présent dans PersonalizedCompose). */}

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

/**
 * PersonalizedCompose — refonte 2026-06-01 (mockup « Composer ma tenue »).
 *
 * 4 sections + résumé palette + CTA :
 *   1. Pour quelle occasion ? (Au bureau / Au quotidien / En soirée)
 *   2. Quel univers ? (Minimaliste / Classique / Streetwear / Décontracté)
 *   3. Budget tenue — slider 100€ → 1500€+ (granulaire)
 *   4. Pour qui ? (Femme / Homme / Mixte)
 *   5. Résumé palette (3 swatches + name + recap meta + Modifier)
 *   6. CTA bordeaux pleine largeur
 *
 * Différences vs v3 (chips compactes) :
 *   - BUDGET passe en slider numérique → paramètre maxPrice exact (avant
 *     bucket "< 150€"/"150–400€"/"Premium" → maxPrice 150/400/null).
 *   - GENRE ajoute « Mixte » qui s'envoie en `genre=unisexe` (API accepte).
 *   - Cartes plus aérées, résumé visuel des choix avant CTA.
 *
 * État :
 *   - Pré-rempli depuis useProfile (genre/style)
 *   - Modifs occasion + univers + budget restent LOCALES (one-shot
 *     composition session). Le profil n'est PAS écrasé — l'utilisateur
 *     peut tester un look précis sans changer ses préférences globales.
 *   - Genre est aussi local (Mixte n'existe pas dans le profil).
 *
 * URL params transmis à /ma-tenue : palette, occasion, style, genre, maxPrice.
 */
type Occasion = "bureau" | "quotidien" | "soiree";
type Univers = "Minimaliste" | "Classique" | "Streetwear" | "Décontracté";
type Genre = "Femme" | "Homme" | "Mixte";

function PersonalizedCompose({ entry }: { entry: DictionaryEntry }) {
  const { effective, hydrated } = useProfile();
  const [occasion, setOccasion] = useState<Occasion>("quotidien");
  const [univers, setUnivers] = useState<Univers>("Classique");
  const [genre, setGenre] = useState<Genre>("Homme");
  const [budget, setBudget] = useState<number>(450);

  /* Re-sync au hydrate : on prend les valeurs du profil comme défaut. */
  useEffect(() => {
    if (!hydrated) return;
    if (effective.style && ["Minimaliste", "Classique", "Streetwear", "Décontracté"].includes(effective.style)) {
      setUnivers(effective.style as Univers);
    }
    if (effective.genre === "Femme" || effective.genre === "Homme") {
      setGenre(effective.genre);
    }
    /* Budget profil → valeur slider raisonnable */
    if (effective.budget === "< 150€") setBudget(150);
    else if (effective.budget === "150–400€") setBudget(400);
    else if (effective.budget === "Premium") setBudget(1000);
  }, [hydrated, effective.style, effective.genre, effective.budget]);

  if (!hydrated) {
    return <div style={{ height: 600, marginBottom: 26 }} aria-hidden />;
  }

  const genreParam = genre === "Femme" ? "femme" : genre === "Homme" ? "homme" : "unisexe";
  const composeHref = `/ma-tenue?palette=${entry.number}&style=${encodeURIComponent(univers)}&occasion=${occasion}&genre=${genreParam}&maxPrice=${budget >= 1500 ? "" : budget}`;

  /* ─────────── Styles ─────────── */
  const cardStyle: React.CSSProperties = {
    background: "#fbf7f0",
    border: `1px solid ${palette.line}`,
    borderRadius: 24,
    padding: "34px clamp(20px,4vw,40px)",
    maxWidth: 780,
    margin: "0 auto",
    boxShadow: "0 18px 50px -28px rgba(60,40,25,.45)",
  };
  const secTitle: React.CSSProperties = {
    fontFamily: fonts.display, fontSize: 12.5, fontWeight: 600,
    letterSpacing: "0.22em", textTransform: "uppercase",
    color: palette.bordeaux, marginBottom: 14,
  };
  const divider: React.CSSProperties = {
    height: 1, background: "rgba(0,0,0,.07)", margin: "30px 0 26px",
  };

  /* Cartes type "Occasion" et "Pour qui" — icône + label, check badge actif */
  const occCardStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#f7e9e3" : "#fff",
    border: `1.5px solid ${active ? palette.bordeaux : palette.line}`,
    borderRadius: 16,
    padding: "22px 16px",
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
    fontFamily: fonts.display,
    transition: "all 0.18s",
    color: active ? palette.bordeaux : palette.ink,
  });
  const occIconStyle: React.CSSProperties = {
    width: 36, height: 36, margin: "0 auto 10px",
    display: "grid", placeItems: "center",
  };
  const occLabelStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 14, fontWeight: active ? 600 : 500,
  });
  const checkBadge: React.CSSProperties = {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: "50%",
    background: palette.bordeaux, color: "#fff",
    display: "grid", placeItems: "center", fontSize: 11,
  };

  /* Chips type "Univers" — plus compacts, fill bordeaux actif */
  const univChipStyle = (active: boolean): React.CSSProperties => ({
    background: active ? palette.bordeaux : "#fff",
    color: active ? "#fff" : palette.ink,
    border: `1.5px solid ${active ? palette.bordeaux : palette.line}`,
    borderRadius: 14,
    padding: "14px 10px",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: fonts.display, fontSize: 14, fontWeight: 500,
    transition: "all 0.18s",
  });

  /* Slider */
  const pct = ((budget - 100) / (1500 - 100)) * 100;

  /* ─────────── Données affichage ─────────── */
  const occasionLabel = occasion === "bureau" ? "bureau" : occasion === "quotidien" ? "quotidien" : "soirée";
  const summaryColors = entry.colors.slice(0, 3);

  return (
    <div style={cardStyle} className="wada-compose-card">

      {/* ═══════ 1. Pour quelle occasion ? ═══════ */}
      <div style={secTitle}>Pour quelle occasion&nbsp;?</div>
      <div className="wada-occ-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { v: "bureau" as const,    label: "Au bureau",    icon: <BriefcaseIcon /> },
          { v: "quotidien" as const, label: "Au quotidien", icon: <UserIcon /> },
          { v: "soiree" as const,    label: "En soirée",    icon: <GlassIcon /> },
        ].map((o) => {
          const active = occasion === o.v;
          return (
            <button key={o.v} type="button" onClick={() => setOccasion(o.v)} style={occCardStyle(active)}>
              <div style={{ ...occIconStyle, color: active ? palette.bordeaux : palette.inkSoft }}>{o.icon}</div>
              <div style={occLabelStyle(active)}>{o.label}</div>
              {active && <span style={checkBadge} aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>

      <div style={divider} />

      {/* ═══════ 2. Quel univers ? ═══════ */}
      <div style={secTitle}>Quel univers&nbsp;?</div>
      <div className="wada-univ-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {(["Minimaliste", "Classique", "Streetwear", "Décontracté"] as Univers[]).map((u) => {
          const active = univers === u;
          return (
            <button key={u} type="button" onClick={() => setUnivers(u)} style={univChipStyle(active)}>
              <span style={{ width: 22, height: 22, display: "grid", placeItems: "center" }}>{UNIVERS_ICON[u]}</span>
              {u}
            </button>
          );
        })}
      </div>

      <div style={divider} />

      {/* ═══════ 3. Budget tenue ═══════ */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
        <div style={{ ...secTitle, marginBottom: 0 }}>Budget tenue</div>
        <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.inkSoft, fontWeight: 500 }}>(total)</span>
        <span
          title="Budget total estimé pour les 5 pièces de la tenue"
          style={{
            width: 18, height: 18, borderRadius: "50%",
            border: `1px solid ${palette.inkSoft}`,
            color: palette.inkSoft, fontSize: 11,
            display: "grid", placeItems: "center", cursor: "help",
          }}
        >i</span>
      </div>
      <div style={{ position: "relative", padding: "0 4px", marginBottom: 18 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: fonts.sans, fontSize: 12,
          color: palette.inkSoft, marginBottom: 8,
        }}>
          <span>100€</span>
          <span>1500€+</span>
        </div>
        <input
          type="range" min={100} max={1500} step={50}
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value))}
          className="wada-budget-slider"
          style={{
            width: "100%", height: 8, borderRadius: 999,
            background: `linear-gradient(to right, ${palette.bordeaux} 0%, ${palette.bordeaux} ${pct}%, #efe7da ${pct}%, #efe7da 100%)`,
            WebkitAppearance: "none", appearance: "none",
            outline: "none", cursor: "pointer",
          }}
        />
      </div>
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <div style={{
          fontFamily: fonts.display, fontSize: 30, fontWeight: 500,
          color: palette.bordeaux, lineHeight: 1, letterSpacing: "-0.5px",
        }}>
          {budget >= 1500 ? "1500 €+" : `${budget} €`}
        </div>
        <div style={{ fontFamily: fonts.sans, fontSize: 13, color: palette.inkSoft, marginTop: 6 }}>
          Budget estimé pour la tenue complète
        </div>
      </div>

      <div style={divider} />

      {/* ═══════ 4. Pour qui ? ═══════ */}
      <div style={secTitle}>Pour qui&nbsp;?</div>
      <div className="wada-occ-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { v: "Femme" as const, icon: <WomanIcon /> },
          { v: "Homme" as const, icon: <ManIcon /> },
          { v: "Mixte" as const, icon: <MixIcon /> },
        ].map((g) => {
          const active = genre === g.v;
          return (
            <button key={g.v} type="button" onClick={() => setGenre(g.v)} style={occCardStyle(active)}>
              <div style={{ ...occIconStyle, color: active ? palette.bordeaux : palette.inkSoft }}>{g.icon}</div>
              <div style={occLabelStyle(active)}>{g.v}</div>
              {active && <span style={checkBadge} aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>

      {/* ═══════ 5. Résumé palette ═══════ */}
      <div className="wada-summary-grid" style={{
        background: palette.beige,
        border: `1.5px solid ${palette.line}`,
        borderRadius: 18,
        padding: "22px 24px",
        marginTop: 30,
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 18,
        alignItems: "center",
      }}>
        <div className="wada-sum-pal" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {summaryColors.map((c, i) => (
            <i key={i} style={{
              width: 38, height: 14, borderRadius: 4, display: "block",
              border: "1px solid rgba(0,0,0,0.05)",
              background: c.hex,
            }} />
          ))}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: fonts.display, fontSize: 10.5, fontWeight: 600,
            letterSpacing: "0.22em", textTransform: "uppercase",
            color: palette.inkSoft, marginBottom: 4,
          }}>
            Votre sélection
          </div>
          <div style={{
            fontFamily: fonts.display, fontSize: 26, fontWeight: 500,
            letterSpacing: "-0.3px", marginBottom: 10, lineHeight: 1.1,
          }}>
            {entry.name}
          </div>
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            fontSize: 13, color: palette.inkSoft,
            fontFamily: fonts.sans, marginBottom: 6,
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              Style <b style={{ marginLeft: 3, color: palette.ink, fontWeight: 500 }}>{univers.toLowerCase()}</b>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              Usage <b style={{ marginLeft: 3, color: palette.ink, fontWeight: 500 }}>{occasionLabel}</b>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              Budget&nbsp;: <b style={{ marginLeft: 3, color: palette.ink, fontWeight: 500 }}>
                {budget >= 1500 ? "1500 €+" : `${budget} €`}
              </b>
            </span>
          </div>
          <div style={{ fontSize: 12, color: palette.inkSoft, marginTop: 8 }}>
            5 pièces sélectionnées
          </div>
        </div>
        <Link
          href={`/compte`}
          className="wada-modif-btn"
          style={{
            background: "#fff",
            border: `1px solid ${palette.line}`,
            borderRadius: 11,
            padding: "9px 14px",
            fontFamily: fonts.display, fontSize: 13, fontWeight: 500,
            color: palette.ink,
            display: "inline-flex", alignItems: "center", gap: 6,
            textDecoration: "none",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={13} height={13}>
            <path d="M12 20h9M16 4l4 4-11 11H5v-4z" />
          </svg>
          Modifier
        </Link>
      </div>

      {/* ═══════ 6. CTA primaire ═══════ */}
      <Link
        href={composeHref}
        style={{
          display: "block", width: "100%",
          background: palette.bordeaux,
          color: "#fff",
          borderRadius: 16,
          padding: 18,
          fontFamily: fonts.display, fontSize: 17, fontWeight: 500,
          marginTop: 18,
          textAlign: "center",
          textDecoration: "none",
          boxShadow: "0 10px 30px -10px rgba(110,59,50,0.5)",
          transition: "all 0.18s",
        }}
      >
        Voir ma tenue&nbsp;→
      </Link>

      {/* Foot message */}
      <p style={{
        textAlign: "center", marginTop: 22,
        fontSize: 13.5, color: palette.inkSoft,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <span style={{ color: palette.bordeaux, fontSize: 14 }}>✦</span>
        <span>
          <b style={{ fontFamily: fonts.display, fontWeight: 500, color: palette.ink }}>WADA</b>
          {" "}compose pour vous une tenue harmonieuse et adaptée à votre style.
        </span>
      </p>

      <style jsx>{`
        :global(.wada-budget-slider::-webkit-slider-thumb) {
          -webkit-appearance: none;
          appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: ${palette.bordeaux};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(110,59,50,0.4);
          transition: transform 0.14s;
        }
        :global(.wada-budget-slider::-webkit-slider-thumb:hover) {
          transform: scale(1.1);
        }
        :global(.wada-budget-slider::-moz-range-thumb) {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: ${palette.bordeaux};
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(110,59,50,0.4);
        }
        @media (max-width: 680px) {
          :global(.wada-occ-grid) {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          :global(.wada-univ-grid) {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          :global(.wada-summary-grid) {
            grid-template-columns: auto 1fr !important;
            gap: 14px !important;
          }
          :global(.wada-summary-grid .wada-modif-btn) {
            grid-column: 1 / -1 !important;
            justify-self: end !important;
            margin-top: 6px !important;
          }
          :global(.wada-sum-pal) {
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ──────────── Icônes inline (stroke 1.6-1.8) ──────────── */
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const GlassIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <path d="M8 3h8M12 13v8M7 21h10M8 3l1.5 5h5L16 3M8 3a4 4 0 0 0 8 0" />
  </svg>
);
const WomanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <circle cx="12" cy="8" r="5" />
    <path d="M12 13v8M9 18h6" />
  </svg>
);
const ManIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
const MixIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={24} height={24}>
    <circle cx="9" cy="10" r="3.5" />
    <circle cx="15" cy="10" r="3.5" />
    <path d="M4 21c0-3 2.5-5.5 5-5.5M20 21c0-3-2.5-5.5-5-5.5" />
  </svg>
);
const UNIVERS_ICON: Record<Univers, React.ReactNode> = {
  Minimaliste: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={18} height={18}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  Classique: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <path d="M7 4h10l-1 5-2 4h-4l-2-4-1-5z" />
      <path d="M9 13v8M15 13v8" />
    </svg>
  ),
  Streetwear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width={18} height={18}>
      <path d="M4 16c0-5 4-9 8-9s8 4 8 9" />
      <path d="M4 16h16" />
    </svg>
  ),
  Décontracté: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={18} height={18}>
      <path d="M8 5l-3 4 3 3v8h8v-8l3-3-3-4-2 2h-4l-2-2z" />
    </svg>
  ),
};

/**
 * ProfileQuickChips — DÉPRÉCATÉ 2026-05-31 v3. Remplacé par
 * PersonalizedCompose au-dessus. Définition conservée pour
 * rétrocompatibilité (référencée nulle part dans le rendu actuel).
 */
function ProfileQuickChips({ paletteNumber }: { paletteNumber: string }) {
  const { effective, save, hydrated } = useProfile();
  const router = useRouter();
  /* Brief 2026-05-30 : « propose un endroit texte où le client peut
     écrire ce qu'il veut ». Champ libre qui redirige vers /stylist avec
     ?q= pré-rempli. Le styliste IA lit le param au mount et démarre
     directement la conversation (pas d'écran d'accueil intermédiaire). */
  const [freeText, setFreeText] = useState("");

  const submitFreeText = () => {
    const text = freeText.trim();
    if (!text) return;
    router.push(`/stylist?palette=${encodeURIComponent(paletteNumber)}&q=${encodeURIComponent(text)}`);
  };

  if (!hydrated) {
    // Skeleton pour éviter le saut de hauteur après hydratation
    return <div style={{ height: 220, marginBottom: 22 }} aria-hidden />;
  }

  const rowStyle: React.CSSProperties = {
    display: "flex", flexWrap: "wrap", gap: 8,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: fonts.sans, fontSize: 11, fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: palette.inkSoft, marginRight: 6,
  };
  const chipBase: React.CSSProperties = {
    fontFamily: fonts.sans, fontSize: 13, fontWeight: 500,
    padding: "8px 14px", borderRadius: 999,
    cursor: "pointer", border: "1px solid",
    transition: `all 0.16s ${ease}`,
    background: "transparent",
  };
  const chipActive: React.CSSProperties = {
    background: palette.bordeaux, color: palette.cream,
    borderColor: palette.bordeaux,
  };
  const chipIdle: React.CSSProperties = {
    background: palette.cream, color: palette.ink,
    borderColor: palette.line,
  };

  return (
    <div
      style={{
        background: palette.cream,
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        padding: "22px 22px 16px",
        marginBottom: 22,
        maxWidth: 720,
        margin: "0 auto 22px",
      }}
      aria-label="Affinez votre tenue"
    >
      <p style={{
        textAlign: "center",
        fontFamily: fonts.sans, fontSize: 11, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: palette.bordeaux, margin: "0 0 16px",
      }}>
        Composées pour vous — affinez en 1 clic
      </p>

      {/* Pour qui ? */}
      <div style={rowStyle}>
        <span style={labelStyle}>Pour qui&nbsp;?</span>
        {(["Femme", "Homme"] as const).map((g) => {
          const active = effective.genre === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => save({ genre: g })}
              aria-pressed={active}
              style={{ ...chipBase, ...(active ? chipActive : chipIdle) }}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Budget */}
      <div style={rowStyle}>
        <span style={labelStyle}>Budget&nbsp;?</span>
        {(["< 150€", "150–400€", "Premium"] as const).map((b) => {
          const active = effective.budget === b;
          return (
            <button
              key={b}
              type="button"
              onClick={() => save({ budget: b })}
              aria-pressed={active}
              style={{ ...chipBase, ...(active ? chipActive : chipIdle) }}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* Style */}
      <div style={rowStyle}>
        <span style={labelStyle}>Style&nbsp;?</span>
        {(["Minimaliste", "Classique", "Streetwear", "Décontracté"] as const).map((s) => {
          const active = effective.style === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => save({ style: s })}
              aria-pressed={active}
              style={{ ...chipBase, ...(active ? chipActive : chipIdle) }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Saison — propage à l'API products via ?season=
          (lib/seasonDetect filtre cachemire/laine vs lin/soie). */}
      <div style={rowStyle}>
        <span style={labelStyle}>Saison&nbsp;?</span>
        {(["Toute saison", "Hiver", "Mi-saison", "Été"] as const).map((s) => {
          const active = (effective.saison || "Toute saison") === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => save({ saison: s })}
              aria-pressed={active}
              style={{ ...chipBase, ...(active ? chipActive : chipIdle) }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Tendance / Vibe — affecte le ton de la curation. Stocké dans
          le profil pour usage futur (filtrage matières, contexte LLM
          styliste). « Tendance » = mode actuelle / streetwear de saison.
          « Sobre » = quiet luxury. « Audacieux » = pièces signature
          marquées. « Confortable » = matières souples, coupes amples. */}
      <div style={rowStyle}>
        <span style={labelStyle}>Tendance&nbsp;?</span>
        {(["Sobre", "Audacieux", "Confortable", "Tendance"] as const).map((t) => {
          const active = (effective.tendance || "Sobre") === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => save({ tendance: t })}
              aria-pressed={active}
              style={{ ...chipBase, ...(active ? chipActive : chipIdle) }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* ─── Champ texte libre ─── Brief 2026-05-30
          Pour les demandes plus précises qui ne rentrent pas dans les
          chips (ex. « je veux un style sobre pour un mariage en juin »,
          « j'ai un pull noir, compose autour », « il fait froid mais
          envie de couleur »). Au submit → /stylist?palette={n}&q={text}
          → le styliste IA voit la query au mount et compose direct. */}
      <div style={{
        marginTop: 18,
        paddingTop: 16,
        borderTop: `1px dashed ${palette.line}`,
      }}>
        <p style={{
          ...labelStyle,
          textAlign: "center",
          marginBottom: 10,
          marginRight: 0,
        }}>
          Ou décrivez ce que vous voulez
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); submitFreeText(); }}
          style={{
            display: "flex", gap: 8,
            maxWidth: 520, margin: "0 auto",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Ex. je veux un style sobre pour un mariage…"
            aria-label="Demande libre au styliste"
            style={{
              flex: "1 1 240px",
              minWidth: 220,
              padding: "12px 16px",
              borderRadius: 999,
              border: `1px solid ${palette.line}`,
              background: palette.beige,
              color: palette.ink,
              fontFamily: fonts.sans,
              fontSize: 14,
              outline: "none",
            }}
            onFocus={(ev) => { ev.currentTarget.style.borderColor = palette.bordeaux; }}
            onBlur={(ev) => { ev.currentTarget.style.borderColor = palette.line; }}
          />
          <button
            type="submit"
            disabled={!freeText.trim()}
            style={{
              padding: "12px 20px",
              borderRadius: 999,
              border: "none",
              background: freeText.trim() ? palette.bordeaux : "rgba(107,58,50,0.35)",
              color: palette.cream,
              fontFamily: fonts.sans,
              fontSize: 13.5,
              fontWeight: 600,
              letterSpacing: "0.02em",
              cursor: freeText.trim() ? "pointer" : "not-allowed",
              transition: `background 0.18s ${ease}`,
              whiteSpace: "nowrap",
            }}
          >
            Composer&nbsp;→
          </button>
        </form>
        <p style={{
          textAlign: "center",
          fontSize: 11.5, color: palette.inkSoft,
          margin: "10px 0 0",
          fontStyle: "italic",
          fontFamily: fonts.sans,
        }}>
          Le styliste IA compose une tenue sur-mesure autour de cette palette.
        </p>
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
