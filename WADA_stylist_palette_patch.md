# Styliste IA — relier la composition aux 348 accords Sanzo Wada (patch prêt à appliquer)

## Le problème (cœur de la demande)
La page `/stylist` (machine à états client, `app/stylist/page.tsx`) compose à partir
d'une table figée `STYLES` : les slots support (haut/bas/chaussures/accent) ont des
**couleurs en dur** (`écru / sable / cuir / brun`), identiques quelle que soit la couleur
choisie. La couleur de l'utilisateur ne remplit qu'**un seul** slot (la veste en mode FULL,
ou l'ancre en mode ANCHOR).

→ Conséquence : **les 348 accords de Sanzo Wada ne sont jamais utilisés.** Le styliste ne
s'appuie pas sur les palettes — alors que c'est la promesse centrale de WADA.

## Le correctif
Faire dériver les couleurs des slots support d'un **vrai accord Wada** qui contient (ou
s'accorde avec) la couleur choisie. On garde les *types* de vêtements de `STYLES`
(« Chemise oxford », « Mocassins »…) mais on remplace leurs *couleurs* par celles de
l'accord. La couleur demandée reste la pièce signature.

Bénéfices : cohérence chromatique réelle (harmonies Wada, pas 4 hex figés), variété (348
accords au lieu de 4), et on peut **afficher le n° d'accord** (« Accord No. 094 — Béton &
Lin ») → renforce la promesse produit.

---

## 1. Imports à ajouter en tête de `app/stylist/page.tsx`
```ts
import { dictionary, type DictionaryEntry } from "@/lib/data";
import { analyzeColor } from "@/lib/colorEngine";
```

## 2. Helpers à ajouter (près des autres helpers, avant `export default function`)
```ts
/** Distance angulaire entre deux teintes (0-180). */
function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b);
  return d > 180 ? 360 - d : d;
}

/** Choisit l'accord Sanzo Wada qui contient le mieux la couleur signature
 *  et colle au style demandé. C'est ici qu'on rebranche les 348 palettes. */
function accordForColor(signatureHex: string, style: string | null): DictionaryEntry {
  const sig = analyzeColor(signatureHex);
  const styleKey = (style || "").toLowerCase().replace(/\s+/g, "-");
  let best = dictionary[0];
  let bestScore = -Infinity;
  for (const e of dictionary) {
    let colorScore = 0;
    for (const c of e.colors) {
      const m = analyzeColor(c.hex);
      if (sig.temperature === "neutral" || sig.saturationLevel === "low") {
        // signature neutre → on matche sur la clarté entre neutres
        if (m.saturationLevel === "low") {
          colorScore = Math.max(colorScore, 1 - Math.abs(m.lightness - sig.lightness));
        }
      } else if (m.saturation > 0.12) {
        // signature colorée → proximité de teinte
        colorScore = Math.max(colorScore, 1 - hueDist(m.hue, sig.hue) / 180);
      }
    }
    const styleScore = e.styles?.some((st) => {
      const k = st.toLowerCase().replace(/\s+/g, "-");
      return k.includes(styleKey) || (styleKey && styleKey.includes(k));
    }) ? 0.3 : 0;
    const score = colorScore + styleScore;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return best;
}

/** Répartit les couleurs d'un accord sur les slots support
 *  (haut clair, bas médian, chaussures sombre, accent chaud). */
function supportColorsFromAccord(accord: DictionaryEntry) {
  const cols = accord.colors.map((c) => ({ hex: c.hex, name: c.name, m: analyzeColor(c.hex) }));
  if (cols.length === 0) return null;
  const byLight = [...cols].sort((a, b) => b.m.lightness - a.m.lightness);
  const lightest = byLight[0];
  const darkest = byLight[byLight.length - 1];
  const mid = byLight[Math.floor(byLight.length / 2)];
  const warm = cols.find((c) => c.m.temperature === "warm") || darkest;
  return {
    haut:   { hex: lightest.hex, nom: lightest.name },
    bas:    { hex: mid.hex,      nom: mid.name },
    chauss: { hex: darkest.hex,  nom: darkest.name },
    accent: { hex: warm.hex,     nom: warm.name },
  };
}
```

## 3. `buildFull` — utiliser les couleurs de l'accord
Remplacer le corps de `buildFull` par :
```ts
function buildFull(s: State): OutfitPiece[] {
  const setStyles = STYLES[s.style || "Classique"];
  const sigHex = s.couleurHex || COULEURS[s.couleur || "Beige"] || "#C7A06A";
  const accord = accordForColor(sigHex, s.style);
  const sup = supportColorsFromAccord(accord);

  const pieces: OutfitPiece[] = [
    { badge: "Proposé",   role: "Haut",       type: setStyles.haut[0],   hex: sup?.haut.hex   ?? setStyles.haut[1],   couleurNom: sup?.haut.nom   ?? "écru",  ancre: false },
    { badge: "Proposé",   role: "Bas",        type: setStyles.bas[0],    hex: sup?.bas.hex    ?? setStyles.bas[1],    couleurNom: sup?.bas.nom    ?? "sable", ancre: false },
    { badge: "Proposé",   role: "Chaussures", type: setStyles.chauss[0], hex: sup?.chauss.hex ?? setStyles.chauss[1], couleurNom: sup?.chauss.nom ?? "cuir",  ancre: false },
    { badge: "Signature", role: "Veste",      type: setStyles.veste[0],  hex: setStyles.veste[1],  couleurNom: "neutre", ancre: false },
    { badge: "Touche",    role: "Accent",     type: setStyles.accent[0], hex: sup?.accent.hex ?? setStyles.accent[1], couleurNom: sup?.accent.nom ?? "brun",  ancre: false },
  ];
  // La veste = pièce signature dans la couleur choisie
  const vesteIdx = pieces.findIndex((p) => p.role === "Veste");
  if (vesteIdx !== -1 && s.couleur && s.couleurHex) {
    pieces[vesteIdx] = {
      ...pieces[vesteIdx],
      type: `${pieces[vesteIdx].type} ${s.couleur.toLowerCase()}`,
      hex: s.couleurHex,
      couleurNom: s.couleur,
    };
  }
  return pieces;
}
```
Faire **exactement la même substitution** dans `buildAnchor` pour l'objet `base`
(remplacer les `setStyles.X[1]` / `couleurNom` des slots NON-ancre par `sup?.X.hex` /
`sup?.X.nom`). Le slot ancre garde la couleur réelle de la pièce du client.

## 4. Afficher l'accord (renforce la promesse Wada)
Dans `compose`, récupérer l'accord pour l'annoncer et nourrir « Pourquoi ça marche » :
```ts
const sigHex = s.couleurHex || COULEURS[s.couleur || "Beige"] || "#C7A06A";
const accord = accordForColor(sigHex, s.style);
// …dans le addBot de composition, ajouter :
//   `… le ${s.couleur} en signature. Accord <b>No. ${accord.number} — ${accord.name}</b>.`
```
Idéalement, stocker `accord.number` dans le `State` pour le réafficher après ajustement.

---

## 5. Améliorations des QUESTIONS (machine à états)
Petites retouches à fort impact, dans les `setChips([...])` :

- **Occasion contextuelle au style** (au lieu d'une liste figée) :
```ts
const OCCASIONS_PAR_STYLE: Record<string, string[]> = {
  "Streetwear":   ["Tous les jours", "Sortir entre amis", "Voyage", "Concert"],
  "Old money":    ["Bureau", "Déjeuner", "Réception", "Week-end"],
  "Classique":    ["Bureau", "Dîner", "Cérémonie", "Week-end"],
  "Décontracté":  ["Tous les jours", "Brunch", "Voyage", "Balade"],
  "Minimal":      ["Bureau", "Dîner", "Galerie", "Tous les jours"],
};
// au moment de demander l'occasion :
setChips((OCCASIONS_PAR_STYLE[s.style || "Classique"] || ["Bureau","Dîner","Voyage","Week-end"]).map(l => ({ label: l })));
```

- **Nuances de couleur** : quand l'utilisateur choisit une famille (« Bleu »), proposer des
  nuances (« Marine », « Pétrole », « Bleu clair ») plutôt que de passer directement au
  style — plus précis pour choisir l'accord.

- **Validation** : commencer la question suivante en confirmant (« Du bordeaux, parfait — …»).

- **Saison** (optionnelle) : ne la demander que si l'occasion est saisonnière (mariage,
  voyage) ; elle affine le choix d'accord (`accordForColor` peut prendre la saison en bonus
  comme le style).

---

## Vérification (à faire côté dev — non réalisable depuis l'outil)
```bash
npm run build      # confirme types + compilation
```
Tester : choisir une couleur forte (ex. bordeaux) → les slots support doivent prendre des
couleurs de l'accord (et non plus écru/sable/cuir figés), et le n° d'accord doit s'afficher.

> Note : ce patch est livré séparément (et non appliqué en direct) parce que `app/stylist/page.tsx`
> est en cours de réécriture par le dev et que l'environnement de cette session ne permet pas
> de vérifier la compilation. À intégrer puis `npm run build`.

---
## Déjà appliqué par moi (vérifié sur le code réel, build à confirmer)
- `lib/colorEngine.ts` : `UserIntent.target_color_hex` + scoring qui favorise les accords
  contenant la couleur demandée (utile à tout consommateur du moteur, ex. recherche texte).
- `app/api/stylist/route.ts` : helper `colorNameToHex` + passage de la couleur dans `intent`,
  et améliorations du `SYSTEM_PROMPT_V2` (options contextuelles, cohérence couleur↔accord,
  saison si pertinente, validation). Ce chemin LLM sert encore aux consommateurs de l'API.
