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
/* Refonte maquette « Composez votre tenue » 2026-06-11 — nouveau formulaire
   4 questions (remplace l'ancien PersonalizedCompose inline plus bas). */
import ComposeForm from "./ComposeForm";

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
      
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "30px 28px" }}>
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

        {/* ═══ TÊTE COMPOSE — refonte maquette 2026-06-11 : pastille palette
            compacte (remplace les grandes cartes nuancier) + titre éditorial. */}
        <div style={{ marginTop: 22 }}>
          {/* Pastille palette compacte : 3 points + n°/culture + nom + actions */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            background: palette.cream, border: `1px solid ${palette.line}`,
            borderRadius: 16, padding: "16px 20px",
            boxShadow: "0 10px 34px -26px rgba(60,40,25,.5)", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", gap: 8 }}>
              {entry.colors.slice(0, 3).map((c, i) => (
                <i key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,.07)", display: "block" }} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <p style={{ fontFamily: fonts.display, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: palette.inkSoft, margin: 0 }}>
                No. {entry.number}{entry.culture && ` · ${cultureLabels[entry.culture] || entry.culture}`}
              </p>
              <p style={{ fontFamily: fonts.display, fontSize: 21, fontWeight: 500, color: palette.ink, margin: "2px 0 0", letterSpacing: "-0.2px" }}>
                {entry.name}
              </p>
            </div>
            <Link href="/palettes" style={{ fontFamily: fonts.sans, fontSize: 13, fontWeight: 500, color: palette.bordeaux, textDecoration: "underline", textUnderlineOffset: 3, whiteSpace: "nowrap" }}>
              Changer de palette
            </Link>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              style={{ width: 38, height: 38, borderRadius: "50%", border: `1px solid ${isFavorite ? palette.bordeaux : palette.line}`, background: isFavorite ? palette.bordeaux : "#fff", color: isFavorite ? "#fff" : palette.bordeaux, fontSize: 15, cursor: "pointer", flexShrink: 0 }}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>

          {/* Eyebrow + titre éditorial + sous-titre */}
          <p style={{ fontFamily: fonts.display, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: palette.inkSoft, margin: "40px 0 12px" }}>
            Personnalisez votre tenue
          </p>
          <h1 style={{ fontFamily: fonts.display, fontSize: "clamp(34px, 6vw, 54px)", fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.02em", margin: 0, color: palette.ink }}>
            Comment porter{" "}
            <em style={{ fontStyle: "italic", fontWeight: 500, color: [...entry.colors].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex || palette.bordeaux }}>
              {entry.name}
            </em>{" "}?
          </h1>
          <p style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 1.6, color: palette.inkSoft, margin: "18px 0 30px", maxWidth: 560 }}>
            Répondez à 4 questions, et notre styliste WADA compose votre tenue parfaite dans cette palette.
          </p>
        </div>
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
        <ComposeForm entry={entry} />

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

/* PersonalizedCompose (ancien formulaire photo 2) retiré 2026-06-11 —
   remplacé par ComposeForm (./ComposeForm.tsx, maquette photo 1). */

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
