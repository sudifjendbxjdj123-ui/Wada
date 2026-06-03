# WADA — Correctif header (couleur selon le fond)

Problème : logo + menu du header en blanc sur fond clair = illisibles.
Règle : blanc UNIQUEMENT sur le hero sombre ; foncé (#1E1E1E) partout ailleurs.

## CSS
```css
.site-header{ position:sticky; top:0; z-index:20; display:flex; align-items:center;
  justify-content:space-between; padding:14px 24px; transition:.3s; }
.site-header.float{ color:#FAF8F4; background:transparent; }
.site-header.float .abo{ border-color:rgba(250,248,244,.5); }
.site-header.solid{ color:#1E1E1E; background:rgba(244,239,231,.92);
  backdrop-filter:blur(10px); border-bottom:1px solid rgba(30,30,30,.10); }
.site-header.solid .abo{ border-color:rgba(30,30,30,.20); }
.site-header .logo, .site-header a, .site-header button{ color:inherit; }
```

## JS (bascule float/solid au scroll)
```js
const header = document.querySelector('.site-header');
function setHeader(){
  const onHero = window.scrollY < (window.innerHeight * 0.7);
  header.classList.toggle('float', onHero);
  header.classList.toggle('solid', !onHero);
}
setHeader(); window.addEventListener('scroll', setHeader, { passive:true });
```

## Règle pages internes
Pages SANS grand hero sombre (palette, scanner, tarifs, à propos…) :
header en mode `solid` par défaut → texte/logo foncés, jamais blancs.

## Test
- [ ] Header blanc sur le hero sombre uniquement.
- [ ] Header foncé (lisible) dès qu'on scrolle / sur les pages sans hero sombre.
- [ ] Logo + Abonnement + Panier toujours lisibles.
