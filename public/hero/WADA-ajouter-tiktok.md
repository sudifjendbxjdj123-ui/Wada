# WADA — Ajouter le logo TikTok dans le footer (pour le codeur)

Le compte TikTok WADA est créé : **https://www.tiktok.com/@wadastyle**

À ajouter dans le footer, dans la zone des icônes sociaux, **à côté d'Instagram et Pinterest** (donc 3 logos en tout).

## Code à coller

Mettre cette ligne juste après le lien Pinterest (dans `<div class="socials">` ou équivalent) :

```html
<a href="https://www.tiktok.com/@wadastyle" aria-label="TikTok" target="_blank" rel="noopener">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" role="img" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z"/>
  </svg>
</a>
```

Avec `fill="currentColor"`, le logo prend automatiquement la couleur du texte du footer (beige clair sur fond noir), comme les deux autres icônes — visuellement cohérent.

## Ordre conseillé des 3 logos dans le footer

De gauche à droite : **Instagram · TikTok · Pinterest**

(Ou n'importe quel ordre, mais que ce soit le même partout sur le site.)

## Test après déploiement

- [ ] Le logo TikTok s'affiche bien dans le footer, à la même taille que Instagram et Pinterest.
- [ ] Au clic, il ouvre `https://www.tiktok.com/@wadastyle` dans un nouvel onglet.
- [ ] Sur mobile, les 3 logos restent alignés et au même rythme.

C'est tout.
