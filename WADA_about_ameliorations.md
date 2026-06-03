# /about — Améliorations « pour les clients » (patch prêt à appliquer)

## Diagnostic en une phrase
Aujourd'hui la page est un **manifesto littéraire** (chapitres numérotés, citations enchaînées, « Merci d'être là »…). Or les visiteurs sont des **clients** : ils veulent comprendre rapidement ce que WADA fait pour eux, voir, et essayer.

Symptômes : titre cassé, page très longue et dense, une seule image alors que WADA est une marque visuelle, CTA principal enterré en bas, bloc affiliation au mauvais endroit.

---

## 1. Titre du hero — cassé et trop bavard
**Fichier :** `app/about/page.tsx` (l. 91)

Aujourd'hui :
```tsx
WADA est né d'une <SketchUnderline color={mojo}>idée simple</SketchUnderline> :<br />rendre le style plus facile.
```
Le `:` finit une ligne, « rendre le style plus » se brise sur une autre, puis « facile. » seul. Maladroit.

Reco — h1 court et frappant + kicker descriptif :

```tsx
{/* Hero : titre court, sous-titre explicatif */}
<h1 style={{
  ...headingStyle,
  fontSize: "clamp(40px, 8vw, 92px)",
  lineHeight: 1.02,
}}>
  Rendre le style <SketchUnderline color={mojo}>plus facile.</SketchUnderline>
</h1>
<p style={{
  ...paragraphStyle, marginTop: 28, maxWidth: 600,
  marginLeft: "auto", marginRight: "auto",
  fontSize: 20,
}}>
  Pas besoin d'être expert en mode. Scannez une couleur — WADA construit la tenue qui va avec.
</p>
```

Bénéfices : titre puissant en une ligne, promesse claire en sous-titre orienté client (action + résultat).

---

## 2. Supprimer les « Chapitre 01 · L'idée » — froid et prétentieux
**Fichier :** `app/about/page.tsx` (l. 108, 141, 203, et autres `sectionLabel` "Chapitre …")

Les chapitres numérotés fonctionnent pour un livre, pas pour une marque qui veut convertir. Remplacer par des labels d'action courts, ou les retirer purement.

Exemples de substitutions :
- `Chapitre 01 · L'idée` → `L'IDÉE`
- `Chapitre 02 · Ce que fait WADA` → `CE QUE FAIT WADA`
- `Chapitre 03 · L'exemple` → `EN UN EXEMPLE`
- `Chapitre 04 · Pour tous les budgets` → `POUR TOUS LES BUDGETS`
- `Chapitre 05 · Le modèle` → `GRATUIT, SANS PIÈGE`
- `Chapitre 06 · Le chiffre du projet` → `LE CHIFFRE WADA`

Si possible, ne garder que **2-3** labels visibles ; les autres sections peuvent se passer de label. Sinon la page paraît un sommaire.

---

## 3. Section « 4 choses » — ajouter un pictogramme par carte
**Fichier :** `app/about/page.tsx` (l. 151-156 et l. 157-176)

Les chiffres romains I/II/III/IV en italique mojo sont jolis mais purement décoratifs. Un visiteur scanne — il faut un repère visuel concret par carte.

Reco : remplacer le bloc `<p>{it.num}</p>` par un petit pictogramme (SVG inline ou caractère) :
- I (Tenue complète)   → 👕 ou un mini-pictogramme cintre
- II (Idées de style)  → ✦ ou un asterisme
- III (Vêtements réels)→ 🏷️ ou une mini étiquette prix
- IV (Liens d'achat)   → → (flèche) ou un panier

Exemple (en SVG, plus clean qu'emoji) :
```tsx
const ICONS: Record<string, JSX.Element> = {
  "I":   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 7l3-3h8l3 3-3 3v10H8V10L5 7z"/></svg>,
  "II":  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2v20M2 12h20"/></svg>,
  "III": <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 10l9-7 9 7v11H3z"/></svg>,
  "IV":  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
};
// puis dans la card, à la place du <p>{it.num}</p> :
<div style={{ color: mojo, marginBottom: 14 }}>{ICONS[it.num]}</div>
```
Garde le label en italique mojo si tu y tiens, mais le pictogramme l'emporte côté lisibilité.

---

## 4. Section « Une palette devient une tenue » — 3 exemples au lieu d'1
**Fichier :** `app/about/page.tsx` (l. 193-... la section qui montre uniquement « Rosée du matin »)

Une seule palette pour illustrer « 348 palettes » est sous-vendeur. Montre **3 palettes contrastées** côte à côte (par ex. Rosée du matin, Béton & Lin, et une 3e plus saturée). C'est la SEULE preuve visuelle de la promesse — elle doit en mettre plein la vue.

```tsx
const showcase = ["002", "094", "071"]
  .map((n) => dictionary.find((d) => d.number === n))
  .filter((p): p is NonNullable<typeof p> => Boolean(p));

<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 20,
  marginTop: 32,
}}>
  {showcase.map((p) => (
    <PaletteCard key={p.number} entry={p} />
  ))}
</div>
```

Et garde un texte court à côté/dessus : « Une palette, une tenue, des pièces à acheter. Multiplié par 348. »

---

## 5. Remonter le CTA principal — ne pas attendre la fin
**Fichier :** `app/about/page.tsx` (le bandeau noir « Découvrez les palettes WADA »)

Aujourd'hui le CTA est en bas de page (≈ 8e scroll). Beaucoup de visiteurs ne descendent pas jusque-là. Reco : **dupliquer un CTA discret après la section 3 (4 choses)** — un seul bouton plein largeur, pas d'image, pas de copy redondant :

```tsx
<section style={{ background: paper, padding: "48px 5% 24px", textAlign: "center" }}>
  <Link href="/scanner" style={btnPrimary}>Essayer WADA · Scanner une couleur</Link>
  <p style={{ fontSize: 13, color: textSecondary, marginTop: 12 }}>Gratuit, sans inscription.</p>
</section>
```
Le CTA en bandeau noir final reste pour ceux qui ont tout lu — pas de redondance gênante.

---

## 6. Déplacer/dégrader le bloc « Vous gérez un programme d'affiliation ? »
**Fichier :** `app/about/page.tsx` (tout en bas, juste avant le footer)

Sur une page **destinée aux clients**, un encadré qui interpelle les marques publicitaires brouille le message et donne l'impression d'une marque qui cherche d'abord à monétiser.

Reco : retirer ce bloc de `/about` et le déplacer vers la page `/partenaires` (qui existe déjà). En remplacement sur /about, mettre un simple lien discret dans la zone « Genève · 2026 » :

```tsx
<p style={{ fontSize: 12, color: subtle, marginTop: 8 }}>
  Vous êtes une marque ?{" "}
  <Link href="/partenaires" style={{ color: subtle, textDecoration: "underline" }}>
    Devenir partenaire
  </Link>
</p>
```

---

## 7. Ton — passer du « je » manifesto au « vous » client
Quelques retouches de copy qui changent tout :

| Avant | Après |
|---|---|
| « Et là, déclic. » | (retirer) |
| « C'est comme ça qu'est né WADA. » | « C'est l'idée fondatrice de WADA. » |
| « Merci d'être là. » | « Bienvenue dans le dictionnaire. » |
| « WADA est encore indépendant, construit petit à petit avec beaucoup d'attention. » | « WADA est indépendant. Pas d'investisseur, pas de pub. Juste les couleurs et vous. » |
| « Vous scannez une couleur, WADA aide à construire le reste. » | « Vous scannez une couleur. La tenue arrive. » |

Plus court, plus net, plus orienté bénéfice.

---

## 8. Mobile — vérifier que la grille passe à 1 colonne
La section « Une palette devient une tenue » utilise `gridTemplateColumns: "1fr 1fr"` (l. 198) avec une classe `wada-hero-grid`. Vérifier dans `globals.css` que `.wada-hero-grid` passe bien à `1fr` sous 720px — sinon l'image et le texte se compriment sur mobile.

```css
@media (max-width: 720px) {
  .wada-hero-grid { grid-template-columns: 1fr !important; }
}
```

---

## Priorité d'application
1. **#1 (titre) + #2 (chapitres)** — gros impact visuel immédiat, 10 minutes.
2. **#4 (3 palettes) + #5 (CTA remonté)** — convertit mieux, 30 minutes.
3. **#3 (pictogrammes) + #6 (affiliation déplacée) + #7 (copy)** — finitions, 1 heure.
4. **#8 (mobile)** — à valider sur téléphone.

Une fois appliqué, faire `npm run build` puis ouvrir `/about` sur mobile et desktop pour valider visuellement.

---
_Patch livré séparément (et non appliqué directement) parce que `app/about/page.tsx` est dans une zone récemment réécrite par le dev et que l'environnement de cette session ne peut pas vérifier le `npm run build`. À intégrer puis builder._
