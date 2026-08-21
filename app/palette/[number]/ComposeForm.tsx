"use client";
/**
 * ComposeForm — formulaire « Composez votre tenue ».
 *
 * Questionnaire mis à jour le 2026-08-21 sur spec client. Quatre questions :
 *   1. Occasion  — Travail · Quotidien · Soirée · Voyage · Événement spécial
 *                  · Autre (champ texte)
 *   2. Univers   — Minimaliste · Élégant · Créatif · Décontracté
 *                  · Autre (champ texte)
 *   3. Pour qui  — Femme · Homme · Mixte
 *   4. Tailles   — haut XS→XXL, bas 34→54, chaussures 35→48
 *   5. Saison    — actuelle (pré-sélectionnée) · Printemps/Été
 *                  · Automne/Hiver · Mi-saison
 *   6. Budget    — curseur 100 € → 2000 €+, défaut 400 €
 *   7. Audace    — Classique · Affirmé · Éditorial, en cartes
 *   8. À éviter  — Talons · Cuir · Blanc · Motifs · Logos visibles
 *                  · Rien à signaler (pré-sélectionné), multi-choix
 *
 * Toutes les réponses descendent jusqu'au moteur (2026-08-21) : saison par le
 * profil, genre / occasion / style / budget / audace / exclusions par l'URL,
 * relayés par /ma-tenue puis /api/outfit jusqu'à /api/products. Avant ce
 * câblage, budget et audace étaient collectés puis perdus.
 *
 * « Visuel d'abord » (décision user) : les libellés de la maquette qui ne
 * sont pas reconnus par le moteur (/ma-tenue) — occasion « Voyage », univers
 * « Élégant » / « Créatif », curseur « Niveau d'audace » — sont AFFICHÉS tels
 * quels mais traduits en paramètres valides au moment du lien, pour garder la
 * composition fonctionnelle sans recâbler le moteur. L'audace reste décorative
 * (pas encore transmise) — à câbler plus tard.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import type { DictionaryEntry } from "@/lib/data";
import { cultureLabels } from "@/lib/data";
import { useProfile, TAILLES_HAUT, TAILLES_BAS, POINTURES, A_EVITER, type TailleHaut } from "@/hooks/useProfile";

const palette = {
  beige: "#F4EFE7",
  cream: "#FAF8F4",
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

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}
function hexRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

type OccasionOpt = "travail" | "quotidien" | "soiree" | "voyage" | "evenement" | "autre";
type UniversOpt = "Minimaliste" | "Élégant" | "Créatif" | "Décontracté" | "Autre";
type Genre = "Femme" | "Homme" | "Mixte";

const OCCASIONS: OccasionOpt[] = ["travail", "quotidien", "soiree", "voyage", "evenement", "autre"];
const OCC_LABEL: Record<OccasionOpt, string> = {
  travail: "Travail", quotidien: "Quotidien", soiree: "Soirée",
  voyage: "Voyage", evenement: "Événement spécial", autre: "Autre",
};
/* Traduction des libellés du questionnaire → paramètres que /ma-tenue
   reconnaît. Le moteur n'a que quatre registres d'occasion (bureau,
   quotidien, soiree, voyage n'existant pas) : on rattache chaque libellé au
   plus proche plutôt que d'inventer une valeur qui serait ignorée.
   « Autre » retombe sur quotidien, le registre le plus neutre — la précision
   saisie est affichée dans le récapitulatif mais n'est pas exploitable par le
   composeur, qui n'accepte pas de texte libre. */
const OCC_TO_PARAM: Record<OccasionOpt, string> = {
  travail: "bureau", quotidien: "quotidien", soiree: "soiree",
  voyage: "quotidien", evenement: "soiree", autre: "quotidien",
};
const UNIVERS: UniversOpt[] = ["Minimaliste", "Élégant", "Créatif", "Décontracté", "Autre"];

type SaisonOpt = "actuelle" | "ete" | "hiver" | "misaison";
const SAISON_LABEL: Record<SaisonOpt, string> = {
  actuelle: "Saison actuelle", ete: "Printemps / Été",
  hiver: "Automne / Hiver", misaison: "Mi-saison",
};
/* Valeurs du profil que /ma-tenue sait traduire en `season` pour le moteur
   (« Hiver » → hiver,automne ; « Été » → été,printemps ; « Mi-saison » →
   automne,printemps). « Saison actuelle » est résolue depuis la date. */
const SAISON_TO_PROFIL: Record<SaisonOpt, string> = {
  actuelle: "", ete: "Été", hiver: "Hiver", misaison: "Mi-saison",
};
function saisonDuJour(): "Été" | "Hiver" | "Mi-saison" {
  const m = new Date().getMonth(); // 0 = janvier
  if (m >= 4 && m <= 7) return "Été";        // mai → août
  if (m >= 10 || m <= 1) return "Hiver";     // novembre → février
  return "Mi-saison";                         // mars-avril, septembre-octobre
}

type AudaceOpt = "classique" | "affirme" | "editorial";
/* Le moteur ne connaît que le vocabulaire `envie` de /api/products.
   « Classique — valeurs sûres, intemporel » correspond exactement à
   `intemporel`, qui écarte les marques streetwear récentes et les pièces
   estampillées « tendance 2026 ». `affirme` n'applique aucune exclusion : il
   ouvre le champ. Affirmé et Éditorial partagent donc le même filtre — le
   moteur ne les distingue pas encore, seul le libellé change. */
const AUDACE: Array<{ cle: AudaceOpt; titre: string; desc: string; envie: string; partAccent: number }> = [
  /* `partAccent` = place donnée à la couleur la plus saturée de la palette
     dans la vignette. Le visuel se lit ainsi : discret chez Classique, à
     parité chez Affirmé, dominant chez Éditorial. On joue sur les PROPORTIONS
     et non sur le nombre de teintes, sans quoi deux niveaux se ressemblent
     dès qu'une palette n'a que trois couleurs — comme la n°195. */
  { cle: "classique", titre: "Classique", desc: "Valeurs sûres, intemporel", envie: "intemporel", partAccent: 0.12 },
  { cle: "affirme",   titre: "Affirmé",   desc: "Du caractère, sans excès",  envie: "affirme",    partAccent: 0.4 },
  { cle: "editorial", titre: "Éditorial", desc: "Pièces fortes, assumées",   envie: "affirme",    partAccent: 0.72 },
];

/* Saturation approchée (0-1) — sert à désigner la couleur « accent » de la
   palette, celle qui porte le caractère. */
function saturation(hex: string): number {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, bl = (n & 255) / 255;
  const max = Math.max(r, g, bl), min = Math.min(r, g, bl);
  return max === 0 ? 0 : (max - min) / max;
}
const UNIV_TO_STYLE: Record<UniversOpt, string> = {
  Minimaliste: "Minimal", "Élégant": "Old money", "Créatif": "Streetwear",
  "Décontracté": "Décontracté", Autre: "Minimal",
};

export default function ComposeForm({ entry }: { entry: DictionaryEntry }) {
  const { effective, hydrated } = useProfile();
  const [occasion, setOccasion] = useState<OccasionOpt>("quotidien");
  const [univers, setUnivers] = useState<UniversOpt>("Élégant");
  const [genre, setGenre] = useState<Genre>("Homme");
  /* Précisions libres quand « Autre » est coché (spec 2026-08-21). */
  const [occasionAutre, setOccasionAutre] = useState("");
  const [universAutre, setUniversAutre] = useState("");
  /* Tailles — vides par défaut : on ne devine pas la morphologie du client. */
  const [tailleHaut, setTailleHaut] = useState<TailleHaut | "">("");
  const [tailleBas, setTailleBas] = useState("");
  const [pointure, setPointure] = useState("");
  const [saison, setSaison] = useState<SaisonOpt>("actuelle");
  const [budget, setBudget] = useState<number>(400);
  const [audace, setAudace] = useState<AudaceOpt>("affirme");
  /* Liste vide = « Rien à signaler », l'option pré-sélectionnée. */
  const [aEviter, setAEviter] = useState<string[]>([]);

  /* Pré-remplissage depuis le profil (genre / budget / style le plus proche). */
  useEffect(() => {
    if (!hydrated) return;
    if (effective.genre === "Femme" || effective.genre === "Homme") setGenre(effective.genre);
    /* Tailles déjà renseignées lors d'une visite précédente. */
    if (effective.tailleHaut) setTailleHaut(effective.tailleHaut);
    if (effective.tailleBas) setTailleBas(effective.tailleBas);
    if (effective.pointure) setPointure(effective.pointure);
    if (Array.isArray(effective.aEviter) && effective.aEviter.length) setAEviter(effective.aEviter);
    if (effective.budget === "< 150€") setBudget(150);
    else if (effective.budget === "150–400€") setBudget(400);
    else if (effective.budget === "Premium") setBudget(1200);
    const s = effective.style;
    if (s === "Minimaliste") setUnivers("Minimaliste");
    else if (s === "Décontracté") setUnivers("Décontracté");
    else if (s === "Streetwear") setUnivers("Créatif");
    else if (s) setUnivers("Élégant");
  }, [hydrated, effective.style, effective.genre, effective.budget, effective.tailleHaut, effective.tailleBas, effective.pointure, effective.aEviter]);

  if (!hydrated) return <div style={{ height: 820 }} aria-hidden />;

  /* Accent = couleur de palette la plus FONCÉE → toujours visible sur fond
     clair (bordures, cases cochées, curseurs), et teinte l'élément actif. */
  const accent = [...entry.colors].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex || palette.bordeaux;
  const accentTint = hexRgba(accent, 0.1);

  const genreParam = genre === "Femme" ? "femme" : genre === "Homme" ? "homme" : "unisexe";
  const audaceDef = AUDACE.find((a) => a.cle === audace)!;
  const composeHref =
    `/ma-tenue?palette=${entry.number}` +
    `&style=${encodeURIComponent(UNIV_TO_STYLE[univers])}` +
    `&occasion=${OCC_TO_PARAM[occasion]}` +
    `&genre=${genreParam}` +
    `&maxPrice=${budget >= 2000 ? 100000 : budget}` +
    `&envie=${audaceDef.envie}` +
    (aEviter.length ? `&exclude=${aEviter.join(",")}` : "");

  /* Les tailles sont enregistrées dans le profil au moment de composer :
     c'est de la donnée client stable, pas un paramètre d'une tenue. Elles
     re-préremplissent le formulaire aux visites suivantes.
     NOTE : le composeur ne filtre pas encore par taille. */
  const persistReponses = () => {
    const patch: Record<string, unknown> = {};
    if (genre === "Femme" || genre === "Homme") patch.genre = genre;
    if (tailleHaut) patch.tailleHaut = tailleHaut;
    if (tailleBas) patch.tailleBas = tailleBas;
    if (pointure) patch.pointure = pointure;
    patch.aEviter = aEviter;
    /* La saison choisie est lue par /ma-tenue depuis le profil : c'est le
       seul canal existant pour cette dimension. */
    patch.saison = SAISON_TO_PROFIL[saison] || saisonDuJour();
    patch.budget = budget < 150 ? "< 150€" : budget <= 400 ? "150–400€" : "Premium";
    if (Object.keys(patch).length === 0) return;
    try {
      const brut = localStorage.getItem("wada.profile");
      const actuel = brut ? JSON.parse(brut) : {};
      localStorage.setItem("wada.profile", JSON.stringify({ ...actuel, ...patch }));
    } catch { /* stockage indisponible : on compose quand même */ }
  };

  /* ── styles ── */
  const qCard: React.CSSProperties = {
    background: "#fff", border: `1px solid ${palette.line}`, borderRadius: 18,
    padding: "22px 22px 24px", boxShadow: "0 10px 34px -24px rgba(60,40,25,.45)",
    display: "flex", flexDirection: "column",
  };
  const qHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, marginBottom: 16 };
  const qBadge: React.CSSProperties = {
    width: 26, height: 26, borderRadius: "50%", background: palette.ink, color: "#fff",
    display: "grid", placeItems: "center", fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, flexShrink: 0,
  };
  const qTitle: React.CSSProperties = { fontFamily: fonts.display, fontSize: 16.5, fontWeight: 500, color: palette.ink, margin: 0 };
  const sumRow: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "11px 0", borderTop: `1px solid ${palette.line}`, fontSize: 13.5,
  };

  const choiceRow = (active: boolean, onClick: () => void, label: string) => (
    <button
      key={label} type="button" onClick={onClick} aria-pressed={active}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        padding: "12px 15px", borderRadius: 11,
        border: `1.5px solid ${active ? accent : palette.line}`,
        background: active ? accentTint : "#fff", cursor: "pointer",
        fontFamily: fonts.sans, fontSize: 14.5, fontWeight: active ? 600 : 500,
        color: palette.ink, textAlign: "left", transition: "all .15s", marginBottom: 8,
      }}
    >
      <span aria-hidden style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        border: `1.5px solid ${active ? accent : "rgba(0,0,0,.26)"}`,
        background: active ? accent : "transparent",
        display: "grid", placeItems: "center", color: "#fff", fontSize: 11, fontWeight: 700,
      }}>{active ? "✓" : ""}</span>
      <span>{label}</span>
    </button>
  );

  /* Champ « Précisez… » des options « Autre ». */
  const champTexte: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", marginTop: 2, padding: "12px 15px",
    borderRadius: 11, border: `1.5px solid ${accent}`, background: "#fff",
    fontFamily: fonts.sans, fontSize: 14.5, color: palette.ink, outline: "none",
  };

  const sliderStyle = (pct: number): React.CSSProperties => ({
    width: "100%", height: 6, borderRadius: 999,
    background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #e7e0d4 ${pct}%, #e7e0d4 100%)`,
    WebkitAppearance: "none", appearance: "none", outline: "none", cursor: "pointer",
  });

  return (
    <div>
      <div className="wada-q-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* 1 — Occasion */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>1</span><h3 style={qTitle}>Pour quelle occasion&nbsp;?</h3></div>
          {OCCASIONS.map((o) => choiceRow(occasion === o, () => setOccasion(o), OCC_LABEL[o]))}
          {occasion === "autre" && (
            <input
              type="text" value={occasionAutre} onChange={(e) => setOccasionAutre(e.target.value)}
              placeholder="Précisez…" aria-label="Précisez l'occasion"
              style={champTexte}
            />
          )}
        </div>

        {/* 2 — Univers */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>2</span><h3 style={qTitle}>Quel univers&nbsp;?</h3></div>
          {UNIVERS.map((u) => choiceRow(univers === u, () => setUnivers(u), u))}
          {univers === "Autre" && (
            <input
              type="text" value={universAutre} onChange={(e) => setUniversAutre(e.target.value)}
              placeholder="Précisez…" aria-label="Précisez l'univers"
              style={champTexte}
            />
          )}
        </div>

        {/* 3 — Pour qui */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>3</span><h3 style={qTitle}>Pour qui&nbsp;?</h3></div>
          {(["Femme", "Homme", "Mixte"] as Genre[]).map((g) =>
            choiceRow(genre === g, () => setGenre(g), g),
          )}
        </div>

        {/* 4 — Vos tailles (pleine largeur) */}
        <div style={{ ...qCard, gridColumn: "1 / -1" }}>
          <div style={qHead}><span style={qBadge}>4</span><h3 style={qTitle}>Vos tailles</h3></div>
          <div className="wada-tailles" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {([
              ["Haut", tailleHaut, (v: string) => setTailleHaut(v as TailleHaut | ""), TAILLES_HAUT as readonly string[]],
              ["Bas", tailleBas, setTailleBas, TAILLES_BAS],
              ["Chaussures", pointure, setPointure, POINTURES],
            ] as [string, string, (v: string) => void, readonly string[]][]).map(([label, valeur, set, options]) => (
              <label key={label} style={{ display: "block" }}>
                <span style={{
                  display: "block", marginBottom: 7, fontFamily: fonts.sans, fontSize: 12,
                  fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: palette.inkSoft,
                }}>
                  {label}
                </span>
                <select
                  value={valeur}
                  onChange={(e) => set(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 13px", borderRadius: 11,
                    border: `1.5px solid ${valeur ? accent : palette.line}`,
                    background: valeur ? accentTint : "#fff",
                    fontFamily: fonts.sans, fontSize: 14.5, fontWeight: valeur ? 600 : 500,
                    color: palette.ink, cursor: "pointer", appearance: "none",
                    WebkitAppearance: "none", MozAppearance: "none",
                  }}
                >
                  <option value="">—</option>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>

        {/* 5 — Saison */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>5</span><h3 style={qTitle}>Pour quelle saison&nbsp;?</h3></div>
          {(["actuelle", "ete", "hiver", "misaison"] as SaisonOpt[]).map((sa) =>
            choiceRow(saison === sa, () => setSaison(sa),
              sa === "actuelle" ? `${SAISON_LABEL[sa]} · ${saisonDuJour()}` : SAISON_LABEL[sa]),
          )}
        </div>

        {/* 6 — Budget total */}
        <div style={qCard}>
          <div style={qHead}><span style={qBadge}>6</span><h3 style={qTitle}>Budget total</h3></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 12, color: palette.inkSoft, marginBottom: 10 }}>
            <span>100&nbsp;€</span><span>2000&nbsp;€+</span>
          </div>
          <input
            type="range" min={100} max={2000} step={50} value={budget}
            onChange={(e) => setBudget(parseInt(e.target.value))}
            className="wada-slider" style={sliderStyle(((budget - 100) / 1900) * 100)}
            aria-label="Budget total"
          />
          <div style={{ textAlign: "center", marginTop: 16, fontFamily: fonts.display, fontSize: 30, fontWeight: 500, color: accent, letterSpacing: "-0.5px", lineHeight: 1 }}>
            {budget >= 2000 ? "2000 €+" : `~ ${budget} €`}
          </div>
        </div>

        {/* 7 — Niveau d'audace (pleine largeur, en cartes) */}
        <div style={{ ...qCard, gridColumn: "1 / -1" }}>
          <div style={qHead}><span style={qBadge}>7</span><h3 style={qTitle}>Niveau d&apos;audace</h3></div>
          <div className="wada-audace" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {AUDACE.map((a) => {
              const actif = audace === a.cle;
              return (
                <button
                  key={a.cle} type="button" onClick={() => setAudace(a.cle)} aria-pressed={actif}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
                    padding: 14, borderRadius: 13, cursor: "pointer", textAlign: "left",
                    border: `1.5px solid ${actif ? accent : palette.line}`,
                    background: actif ? accentTint : "#fff", transition: "all .15s",
                  }}
                >
                  {/* Visuel : un extrait de la palette dont la richesse croît
                      avec le niveau — deux teintes sourdes pour Classique,
                      l'accord complet pour Éditorial. Construit depuis les
                      couleurs de CETTE palette, pas une image générique. */}
                  <span aria-hidden style={{ display: "flex", width: "100%", height: 34, borderRadius: 7, overflow: "hidden", marginBottom: 6 }}>
                    {(() => {
                      const tries = [...entry.colors].sort((c1, c2) => saturation(c2.hex) - saturation(c1.hex));
                      const accentCouleur = tries[0]?.hex || accent;
                      const reste = tries.slice(1);
                      const partReste = (1 - a.partAccent) / Math.max(1, reste.length);
                      return [
                        ...reste.map((c, i) => (
                          <i key={i} style={{ flexGrow: partReste, flexBasis: 0, background: c.hex, display: "block" }} />
                        )),
                        <i key="accent" style={{ flexGrow: a.partAccent, flexBasis: 0, background: accentCouleur, display: "block" }} />,
                      ];
                    })()}
                  </span>
                  <span style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 500, color: palette.ink }}>{a.titre}</span>
                  <span style={{ fontFamily: fonts.sans, fontSize: 12, lineHeight: 1.35, color: palette.inkSoft }}>{a.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 8 — Une chose à éviter (pleine largeur, multi-choix) */}
        <div style={{ ...qCard, gridColumn: "1 / -1" }}>
          <div style={qHead}>
            <span style={qBadge}>8</span>
            <h3 style={qTitle}>Une chose à éviter&nbsp;?</h3>
            <span style={{ fontFamily: fonts.sans, fontSize: 12, color: palette.inkSoft }}>facultatif</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {A_EVITER.map((e) => {
              const actif = aEviter.includes(e.cle);
              return (
                <button
                  key={e.cle} type="button" aria-pressed={actif}
                  onClick={() => setAEviter(actif ? aEviter.filter((x) => x !== e.cle) : [...aEviter, e.cle])}
                  style={{
                    padding: "10px 16px", borderRadius: 999, cursor: "pointer",
                    border: `1.5px solid ${actif ? accent : palette.line}`,
                    background: actif ? accentTint : "#fff",
                    fontFamily: fonts.sans, fontSize: 14, fontWeight: actif ? 600 : 500, color: palette.ink,
                  }}
                >
                  {e.label}
                </button>
              );
            })}
            {/* « Rien à signaler » est l'inverse des autres : le cocher vide la
                liste, et il s'allume dès qu'elle est vide. */}
            <button
              type="button" aria-pressed={aEviter.length === 0}
              onClick={() => setAEviter([])}
              style={{
                padding: "10px 16px", borderRadius: 999, cursor: "pointer",
                border: `1.5px solid ${aEviter.length === 0 ? accent : palette.line}`,
                background: aEviter.length === 0 ? accentTint : "#fff",
                fontFamily: fonts.sans, fontSize: 14, fontWeight: aEviter.length === 0 ? 600 : 500, color: palette.ink,
              }}
            >
              Rien à signaler
            </button>
          </div>
        </div>
      </div>

      {/* Votre sélection */}
      <div style={{ background: palette.cream, border: `1px solid ${palette.line}`, borderRadius: 18, padding: "24px 26px", marginTop: 22 }}>
        <p style={{ fontFamily: fonts.display, fontSize: 11, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: palette.inkSoft, margin: "0 0 8px" }}>
          Votre sélection
        </p>
        <h3 style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: 500, color: palette.ink, margin: "0 0 12px", letterSpacing: "-0.3px" }}>
          {entry.name}
        </h3>
        <div style={{ display: "flex", gap: 7, marginBottom: 6 }}>
          {entry.colors.slice(0, 3).map((c, i) => (
            <i key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c.hex, border: "1px solid rgba(0,0,0,.06)", display: "block" }} />
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          {([
            ["Occasion", occasion === "autre" && occasionAutre.trim()
              ? occasionAutre.trim() : OCC_LABEL[occasion]],
            ["Univers", univers === "Autre" && universAutre.trim()
              ? universAutre.trim() : univers],
            ["Pour", genre],
            ["Tailles", [tailleHaut, tailleBas, pointure].filter(Boolean).join(" · ") || "Non renseignées"],
            ["Saison", saison === "actuelle" ? `Actuelle · ${saisonDuJour()}` : SAISON_LABEL[saison]],
            ["Budget", budget >= 2000 ? "2000 €+" : `~ ${budget} €`],
            ["Audace", audaceDef.titre],
            ["À éviter", aEviter.length
              ? A_EVITER.filter((e) => aEviter.includes(e.cle)).map((e) => e.label).join(" · ")
              : "Rien à signaler"],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={sumRow}>
              <span style={{ color: palette.inkSoft, fontFamily: fonts.sans }}>{k}</span>
              <span style={{ color: palette.ink, fontWeight: 500, fontFamily: fonts.display }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link href={composeHref} onClick={persistReponses} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        width: "100%", boxSizing: "border-box", background: palette.ink, color: "#fff",
        borderRadius: 14, padding: "18px", fontFamily: fonts.display, fontSize: 16.5, fontWeight: 500,
        marginTop: 18, textDecoration: "none", boxShadow: "0 14px 34px -16px rgba(30,30,30,.6)",
      }}>
        Voir ma tenue
        <em style={{ fontStyle: "italic", fontWeight: 400, opacity: 0.72 }}>{entry.name}</em>
        <span aria-hidden>→</span>
      </Link>
      <p style={{ textAlign: "center", marginTop: 16, fontFamily: fonts.sans, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: palette.inkSoft }}>
        Rapide · Personnalisé · Sans engagement
      </p>

      <style jsx>{`
        :global(.wada-slider::-webkit-slider-thumb) {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2px solid ${accent}; cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,.18); transition: transform .14s;
        }
        :global(.wada-slider::-webkit-slider-thumb:hover) { transform: scale(1.12); }
        :global(.wada-slider::-moz-range-thumb) {
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 2px solid ${accent}; cursor: pointer;
        }
        @media (max-width: 680px) {
          :global(.wada-q-grid) { grid-template-columns: 1fr !important; }
        }
        /* Les trois sélecteurs de taille tiennent côte à côte jusqu'à ~420px ;
           en dessous ils passent l'un sous l'autre pour rester tapables. */
        @media (max-width: 420px) {
          :global(.wada-tailles) { grid-template-columns: 1fr !important; }
          :global(.wada-audace) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
