# WADA — Améliorations mobile (téléphone) — pour le développeur

Objectif : rendre WADA agréable et utilisable sur téléphone (web mobile + app
Capacitor iOS/Android). Points classés par priorité, avec fichier concerné,
correctif et exemple de code. Chemins relatifs à la racine du projet.

Priorités : **CRITIQUE** (bloque l'usage) · **IMPORTANT** (gêne forte) · **SOUHAITABLE** (finition).

---

## CRITIQUE — à faire en premier

### 1. Aucun menu de navigation sur mobile
**Fichier :** components/Nav.tsx (l. 138-144)
**Problème :** à ≤880px, les liens du header sont masqués (`display:none`). Il ne reste
que le logo + le bouton « Abonnement ». Aucun hamburger, aucune bottom-nav : sur
téléphone, impossible d'atteindre Scanner, Styliste, Palettes, Garde-robe, Compte.
**Correctif recommandé :** ajouter une **barre d'onglets en bas** (pattern attendu sur
une app mobile), fixée et tenant compte du safe-area. Exemple minimal :

```tsx
// components/MobileTabBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/scanner",   label: "Scanner",  icon: "◎" },
  { href: "/palettes",  label: "Palettes", icon: "▦" },
  { href: "/stylist",   label: "Styliste", icon: "✦" },
  { href: "/compte",    label: "Compte",   icon: "○" },
];

export default function MobileTabBar() {
  const path = usePathname();
  return (
    <nav className="wada-tabbar" aria-label="Navigation mobile">
      {TABS.map(t => (
        <Link key={t.href} href={t.href}
          aria-current={path.startsWith(t.href) ? "page" : undefined}>
          <span aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

```css
/* globals.css */
.wada-tabbar { display: none; }
@media (max-width: 880px) {
  .wada-tabbar {
    display: flex; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
    justify-content: space-around;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(12px);
    border-top: 1px solid rgba(7,7,2,.08);
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  }
  .wada-tabbar a {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    font-size: 11px; color: var(--wada-ink, #1A1612); text-decoration: none;
    min-width: 44px; min-height: 44px; justify-content: center;
  }
  .wada-tabbar a[aria-current="page"] { color: #6B3A32; font-weight: 600; }
  /* éviter que le contenu passe sous la barre */
  body { padding-bottom: 64px; }
}
```
Monter `<MobileTabBar/>` dans app/layout.tsx (cf. point 9).

### 2. `viewport-fit=cover` manquant → safe-area iPhone inerte
**Fichier :** app/layout.tsx (l. 34-41, objet `viewport`)
**Problème :** l'objet `viewport` ne contient pas `viewportFit:"cover"`. Du coup, sur
iPhone à encoche / Dynamic Island, les `env(safe-area-inset-*)` valent 0 — tout le
travail de safe-area du CSS est sans effet, le Nav peut passer sous l'encoche.
**Correctif :**
```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",      // <-- AJOUT
  themeColor: "#F4EFE7",
};
```

---

## IMPORTANT

### 3. Champs de saisie < 16px : zoom auto iOS au focus
**Fichiers :** app/stylist/page.tsx (l. 757-768, fontSize 15), app/contact/page.tsx
(l. 78, 82), app/scanner/page.tsx
**Problème :** Safari iOS zoome automatiquement dès qu'on tape dans un champ dont la
police fait moins de 16px — recentrage déstabilisant.
**Correctif :** passer la taille de police des `input`/`textarea` à **≥ 16px** (1rem).
```css
input, textarea, select { font-size: 16px; }
```

### 4. Zones tactiles trop petites
**Fichiers :**
- components/InstallPrompt.tsx (l. 111-122 et 194-202) : le « ✕ » de fermeture n'a pas
  de dimensions (fontSize 18, padding ~0).
- app/scanner/page.tsx (l. 339-350) : l'`<input type="color">` fait 36×32px.
**Problème :** cibles sous le minimum tactile (44×44px) → difficiles à toucher au doigt.
**Correctif :** garantir 44×44px minimum.
```css
.close-btn, input[type="color"] {
  min-width: 44px; min-height: 44px;
}
```

### 5. InstallPrompt en position fixe sans marge de sécurité basse
**Fichier :** components/InstallPrompt.tsx (l. 96-110)
**Problème :** la carte est en `position:fixed; bottom:20` sans tenir compte de la barre
gestuelle iPhone — elle peut la chevaucher.
**Correctif :** (après le point 2)
```css
.install-prompt { bottom: max(20px, env(safe-area-inset-bottom)); }
```

### 6. Mode nuit codé mais inactivable sur mobile
**Fichiers :** components/ThemeToggle.tsx (jamais monté) ; app/layout.tsx (l. 17-25) ;
globals.css (variables `[data-theme]`)
**Problème :** tout le mode nuit existe (variables, script anti-flash, composant), mais
aucun bouton ne le déclenche, et le thème est forcé à « jour » même si le téléphone est
en sombre.
**Correctif :** monter `<ThemeToggle/>` (header ou bottom-nav) et initialiser depuis la
préférence système :
```ts
// dans THEME_INIT_SCRIPT (layout.tsx)
var t = localStorage.getItem('wada-theme');
if (t !== 'nuit' && t !== 'jour') {
  t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'nuit' : 'jour';
}
document.documentElement.setAttribute('data-theme', t);
```

### 7. Barre d'état de l'app native figée (incompatible mode nuit)
**Fichier :** capacitor.config.ts (l. 49-53)
**Problème :** la StatusBar est en dur (texte foncé). En mode nuit, le texte resterait
foncé sur fond sombre → illisible.
**Correctif :** synchroniser la StatusBar avec le thème au runtime.
```ts
import { StatusBar, Style } from "@capacitor/status-bar";
export async function syncStatusBar(theme: "jour" | "nuit") {
  await StatusBar.setStyle({ style: theme === "nuit" ? Style.Dark : Style.Light });
}
```

---

## SOUHAITABLE

### 8. InstallPrompt : 30 s d'attente + dépend de beforeinstallprompt
**Fichier :** components/InstallPrompt.tsx (l. 57-65)
**Problème :** le prompt n'apparaît qu'après 30 s et seulement sur Chrome/Android.
Beaucoup d'utilisateurs partent avant.
**Correctif :** ajouter un point d'entrée explicite « Installer l'app » (la page /install
existe déjà) dans le footer ou la bottom-nav.

### 9. Nav/Footer (et bottom-nav) à centraliser dans le layout
**Fichier :** app/layout.tsx (l. 212-230)
**Problème :** chaque page rend `<Nav/>` et `<Footer/>` manuellement (~36 fichiers). Pour
ajouter la bottom-nav du point 1 partout sans l'oublier, mieux vaut centraliser.
**Correctif :**
```tsx
// app/layout.tsx
<body className="min-h-full flex flex-col">
  <Nav />
  {children}
  <Footer />
  <MobileTabBar />     {/* visible uniquement ≤880px via CSS */}
  ...
</body>
```
Puis retirer les `<Nav/>`/`<Footer/>` des pages.

### 10. App native = webview distant (pas de vrai hors-ligne)
**Fichier :** capacitor.config.ts (l. 23-29, `server.url`) ; InstallPrompt.tsx (l. 141)
**Problème :** l'app native charge le site distant alors que le prompt promet « 348
palettes hors-ligne ». Sans réseau → page d'erreur probable.
**Correctif :** vérifier le comportement hors-ligne réel ; soit ajuster le message, soit
mettre en cache les palettes côté natif.

### 11. Accessibilité tactile : retours visuels et lecteurs d'écran
**Fichiers :** app/stylist/page.tsx (conteneur de chat l. 649-703) ; divers `outline:none`
inline (stylist l. 765, contact l. 78/82).
**Problèmes :** les messages de l'assistant ne sont pas annoncés (pas de `role="log"
aria-live="polite"`) ; des champs perdent l'indicateur de focus (utile aussi au clavier
externe sur tablette).
**Correctifs :** ajouter `role="log" aria-live="polite"` au fil de discussion ; retirer
les `outline:none` inline et laisser le focus ring global jouer.

---

## Checklist de test sur téléphone (recette)
- [ ] Sur iPhone à encoche : le header ne passe pas sous l'encoche ; la bottom-nav ne
      chevauche pas la barre gestuelle.
- [ ] Toutes les fonctionnalités sont atteignables sans repasser par l'accueil.
- [ ] Taper dans l'assistant / le formulaire de contact ne déclenche aucun zoom.
- [ ] Tous les boutons et le ✕ se touchent facilement au pouce (≥ 44px).
- [ ] Le mode nuit s'active et la barre d'état reste lisible (web + app native).
- [ ] L'InstallPrompt ne masque pas de contenu et se ferme sans difficulté.

---
_Audit en lecture seule — aucun fichier du projet n'a été modifié. Les numéros de ligne
sont indicatifs et peuvent avoir bougé depuis l'audit._
