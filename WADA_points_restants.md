# WADA — État final de l'audit (vérifié sur le code réel, 2026-05-24)

Revue complète menée directement sur les fichiers actuels (Read/Grep). Résultat :
**la quasi-totalité de l'audit UX/Design/Mobile est appliquée et vérifiée.**

## ✅ Corrigé et vérifié

| Code | Point | Preuve dans le code |
|------|-------|---------------------|
| N1/N3 | Nav avec liens + hamburger + drawer mobile | components/Nav.tsx (399 l.) |
| N3+ | Barre d'onglets mobile (bottom tab bar) | components/MobileTabBar.tsx, monté dans layout l. 261 |
| N4 | Nav/Footer centralisés (plus de doublon) | app/layout.tsx l. 250-252 ; aucune page ne les rend |
| N7 | Icône Compte dans le Nav | components/Nav.tsx |
| M1 | viewportFit: "cover" | app/layout.tsx l. 55 |
| M2 | Champs ≥ 16px en mobile | app/globals.css l. 978, 1161 |
| M3 | Boutons ✕ InstallPrompt en 44×44 | components/InstallPrompt.tsx l. 126, 214 |
| M4 | Input couleur scanner en 44×44 | app/scanner/page.tsx l. 370 |
| M5 | InstallPrompt bottom = max(20px, safe-area) | components/InstallPrompt.tsx l. 106 |
| M7 | Message hors-ligne ajusté (claims tenables) | components/InstallPrompt.tsx l. 148-156 |
| D1 | Police Fredoka chargée | app/layout.tsx (lien Google Fonts) — **appliqué ce jour** |
| D3 | ThemeToggle monté + init prefers-color-scheme | app/layout.tsx l. 26-30 ; Nav l. 232 |
| D5 | Accent unifié bordeaux #6B3A32 (plus de plum) | components/Nav.tsx l. 33 |
| D6 | Stack ::before wash / main / ::after grain | app/globals.css l. 866-894, 1621-1629 |
| D7 | Polices superflues retirées | app/layout.tsx l. 171-178 |
| A1 | aria-live sur l'assistant | app/stylist/page.tsx |
| A3 | Hover/focus Nav en CSS + cibles 44px | components/Nav.tsx l. 256-285 |

## ⏳ Seul point de fond restant

### D2 — Une seule source de tokens de design
Plusieurs définitions de couleurs/typo coexistent encore : `lib/tokens.ts`,
`lib/styles.ts`, et des objets `palette = {...}` / `display: "..."` écrits en dur en tête
de plusieurs pages (app/page.tsx, app/atelier, app/stylist, etc.).

Ce n'est **pas un bug bloquant** — juste de la dette de cohérence. Reco : désigner UNE
source de vérité (idéalement les variables CSS `--wada-*` de globals.css, déjà thémables
jour/nuit) et y faire référence partout, en supprimant progressivement les objets locaux.
Chantier à faire page par page, sans urgence.

## Vérification non réalisable depuis l'outil

Un vrai `npm run build` / `tsc` n'a pas pu être lancé ici (l'environnement shell de la
session lisait un instantané périmé du projet, pas les fichiers à jour). À faire en local
pour confirmer l'absence d'erreur de compilation :

```bash
npm run build
```

Puis recette sur un vrai iPhone : Nav sous l'encoche, drawer + tab bar, mode nuit + barre
d'état, aucun zoom au focus des champs.

---
_Note actuelle estimée : ~90/100 sur l'axe UX/Design/Mobile. Il ne reste que D2 (refacto
de cohérence) et la vérification par build. Tous les points critiques et importants sont
traités._
