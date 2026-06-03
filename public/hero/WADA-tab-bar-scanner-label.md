# WADA — Ajouter le label « Scanner » sous le bouton central (pour le codeur)

## Le problème

Sur la barre d'onglets mobile, tous les onglets ont leur libellé sous l'icône :
- 🏠 **Accueil**
- ⊞ **Palettes**
- ⦿ *(pas de label)* ← anomalie
- ✦ **Styliste**
- ♥ **Favoris**

Le bouton central Scanner (bordeaux, surélevé) n'a pas de texte. Ça casse le rythme visuel et rend
le rôle du bouton moins évident pour un nouveau visiteur.

## Le fix

Ajouter le label `Scanner` sous le bouton central, dans la même typographie que les autres tabs,
en gardant le bouton lui-même surélevé.

## HTML / CSS proposé

```html
<nav class="tabs">
  <a class="tab" href="/">
    <span class="ic">🏠</span>
    <span class="lbl">Accueil</span>
  </a>
  <a class="tab" href="/palettes">
    <span class="ic">⊞</span>
    <span class="lbl">Palettes</span>
  </a>

  <a class="tab scan" href="/scanner">
    <span class="ic-scan">⦿</span>
    <span class="lbl scan-lbl">Scanner</span>
  </a>

  <a class="tab" href="/styliste">
    <span class="ic">✦</span>
    <span class="lbl">Styliste</span>
  </a>
  <a class="tab" href="/favoris">
    <span class="ic">♥</span>
    <span class="lbl">Favoris</span>
  </a>
</nav>
```

```css
.tabs {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  background: rgba(244, 238, 228, 0.96);
  backdrop-filter: blur(14px);
  border-top: 1px solid #e5dccc;
  padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
  z-index: 30;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  text-decoration: none;
  color: #8c8377;
  font-size: 10.5px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}

.tab .ic { font-size: 20px; line-height: 1; }
.tab .lbl { font-size: 10.5px; letter-spacing: 0.02em; }
.tab.on { color: #6e3b32; }

/* Le bouton Scanner : surélevé MAIS avec label en dessous */
.tab.scan {
  margin-top: -22px; /* surélève le bouton */
}
.tab.scan .ic-scan {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: #6e3b32;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 22px;
  box-shadow: 0 8px 20px -6px rgba(110, 59, 50, 0.6);
  border: 4px solid #f4eee4; /* anneau crème qui détache du fond */
}
.tab.scan .scan-lbl {
  color: #6e3b32; /* bordeaux pour rappeler l'icône */
  font-weight: 600; /* léger renforcement */
  margin-top: 6px; /* léger écart entre le rond et le mot */
}
```

## Le rendu attendu

```
🏠        ⊞       ⦿       ✦        ♥
Accueil  Palettes  ●     Styliste  Favoris
                Scanner
```

Le mot **Scanner** est en bordeaux (la même couleur que le rond), légèrement plus gras que les
autres labels (poids 600 vs 500). C'est subtil mais ça équilibre le bouton qui est plus gros, et
ça crée une hiérarchie visuelle : Scanner = action principale.

## Pourquoi en bordeaux et un peu plus gras

- Le bouton est déjà visuellement plus important (surélevé, bordeaux).
- Mettre le label en bordeaux aussi rappelle qu'il s'agit du même élément (continuité visuelle).
- Le léger renforcement de graisse (600) compense la position légèrement plus basse du mot
  (à cause du surélèvement du bouton) pour qu'il reste bien lisible.

## Tests

- [ ] Le mot « Scanner » apparaît bien sous le bouton central sur iPhone et Android.
- [ ] Le label « Scanner » est en bordeaux (#6e3b32), poids 600.
- [ ] Les 4 autres labels (Accueil, Palettes, Styliste, Favoris) gardent leur poids 500 en gris.
- [ ] Sur petit écran (iPhone SE), rien ne déborde et tout reste alignné.
- [ ] L'icône Scanner reste surélevée, mais le label est en position basse standard.
- [ ] La safe area iOS (env(safe-area-inset-bottom)) est bien gérée — pas de label collé contre la
  zone tactile du iPhone.

Petit fix, gros impact sur la lisibilité.
