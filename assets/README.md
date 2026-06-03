# WADA — Sources visuelles app native

Ce dossier contient les **masters SVG** pour générer toutes les icônes
et splash screens nécessaires aux apps iOS et Android.

## Fichiers

| Fichier | Taille | Usage |
|---|---|---|
| `icon.svg` | 1024×1024 | App icon master (iOS + Android non-adaptatif + PWA) |
| `icon-foreground.svg` | 1024×1024 | Android adaptive — couche logo (rognable) |
| `icon-background.svg` | 1024×1024 | Android adaptive — couche fond (toujours visible) |
| `splash.svg` | 2732×2732 | Splash screen au cold start (toutes plateformes) |

## Génération automatique des PNG

`@capacitor/assets` lit les SVG ci-dessus et produit **toutes** les
variantes iOS (1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20)
et Android (mdpi → xxxhdpi, adaptive xml inclus).

```powershell
# Installation (une seule fois)
npm install --save-dev @capacitor/assets

# Génération
npx capacitor-assets generate --iconBackgroundColor "#F4EFE6" --splashBackgroundColor "#F4EFE6"
```

La commande remplace automatiquement les assets dans :
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- `ios/App/App/Assets.xcassets/Splash.imageset/`
- `android/app/src/main/res/mipmap-*/`
- `android/app/src/main/res/drawable*/splash.png`

Relance `npx cap sync` après pour propager dans les projets natifs.

## Si la prévisualisation SVG diffère du PNG final

Certains rendeurs SVG → PNG ignorent les `<filter>` (le grain papier).
Si le grain ne ressort pas après export, ouvrir le SVG dans Inkscape
ou utiliser `rsvg-convert` (libRSVG) qui supporte les filtres.

Alternative : aplatir le grain en raster directement dans le SVG ou
le retirer pour un rendu plus prévisible (la DA tient même sans).

## Customisation rapide

Les couleurs centrales viennent du livre de Sanzo Wada — modifiables
dans chaque SVG :

| Couleur | Hex | Rôle |
|---|---|---|
| Cream paper | `#F4EFE6` | Fond, signature WADA |
| Bordeaux | `#5C2018` | Bande 1 du logomark |
| Olive | `#5C5A3C` | Bande 2 |
| Indigo | `#1B4A6B` | Bande 3 |
| Encre | `#1F1B16` | Cadre, texte |

Si tu veux pousser sur **Mojo** (`#C44E3A`) comme accent dominant (par
exemple pour un fond d'icône plus terracotta), remplace le fond cream
dans `icon.svg` et `icon-background.svg`.
