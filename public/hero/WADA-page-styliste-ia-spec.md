# WADA — Page Styliste IA (inspirée maquette éditoriale)

Spec complète pour la page `/styliste` selon la maquette fournie.

**Durée dev estimée** : 4-6h.
**URL** : `/styliste`
**Image de référence** : maquette dans `/public/hero/` (flat lay cream + cardigan + sac noir + mocassins + bijoux dorés + branche eucalyptus).

---

## Architecture de la page

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (commun)                                          │
│  WADA 和田 | Palettes Scanner Styliste Boutique  ♡ Abonn  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────┐ ┌─────────────────────────────┐│
│  │ ← RETOUR              │ │                              ││
│  │                       │ │  [FLAT LAY HERO IMAGE]      ││
│  │ LE STYLISTE · WADA AI │ │                              ││
│  │                       │ │  Cream cardigan + sac noir   ││
│  │ Composons             │ │  + pantalon crème + mocassins││
│  │ votre tenue.          │ │  + bijoux dorés + eucalyptus││
│  │                       │ │                              ││
│  │ ┌───────────────────┐ │ │                              ││
│  │ │ WADA              │ │ │  ┌──────────────────────┐   ││
│  │ │ Dites-moi tout... │ │ │  │ Inspiration du jour  │   ││
│  │ │                   │ │ │  │ Chic minimaliste     │   ││
│  │ └───────────────────┘ │ │  │ Élégance discrète... │   ││
│  │                       │ │  └──────────────────────┘   ││
│  │ [Bureau lundi]        │ │                              ││
│  │ [J'ai un pull noir]   │ └─────────────────────────────┘│
│  │ [Soirée samedi]       │                                 │
│  │ [Surprends-moi]       │                                 │
│  │ [J'ai déjà une pièce] │                                 │
│  │                       │                                 │
│  │ ┌───────────────────┐ │                                 │
│  │ │ Décrivez... [→]   │ │                                 │
│  │ └───────────────────┘ │                                 │
│  │                       │                                 │
│  │ [Styliste] [Scanner]  │                                 │
│  │ [Palettes] [Favoris]  │                                 │
│  └──────────────────────┘                                  │
│                                                            │
├──────────────────────────────────────────────────────────┤
│  FOOTER (4 colonnes sur fond noir)                        │
└──────────────────────────────────────────────────────────┘
```

---

## 1. Layout principal

```tsx
// app/styliste/page.tsx
import { StylisteContent } from '@/components/styliste/StylisteContent';
import { StylisteHero } from '@/components/styliste/StylisteHero';

export default function StylistePage() {
  return (
    <div className="bg-[#f5efe2] min-h-screen">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-0 px-6 lg:px-12 py-6">
        <StylisteContent />
        <StylisteHero />
      </div>
    </div>
  );
}
```

**Note importante** : le fond de toute la page est `#f5efe2` (crème) — pas blanc. Ça unifie la composition gauche + droite.

---

## 2. Bouton « ← RETOUR »

```tsx
// components/styliste/BackButton.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 px-5 py-2 border border-[#1a1a1a]/15 rounded-full text-xs tracking-widest uppercase text-[#1a1a1a] hover:bg-white transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Retour
    </Link>
  );
}
```

Pilule outline subtile. Letter-spacing très large pour rappeler l'éditorial.

---

## 3. Bloc titre éditorial

```tsx
// components/styliste/StylisteTitle.tsx
export function StylisteTitle() {
  return (
    <div className="mt-10 mb-8">
      <p className="text-[11px] tracking-[0.3em] uppercase text-[#5a5a5a] mb-4">
        Le styliste · WADA AI
      </p>
      <h1 className="font-serif text-5xl lg:text-6xl leading-[1.05] text-[#1a1a1a]">
        Composons<br/>votre tenue.
      </h1>
    </div>
  );
}
```

**Typo** : titre en serif italique-able (Cormorant Garamond ou EB Garamond), poids regular ou medium, surtout pas bold. Le côté éditorial vient du contraste serif vs sans-serif partout ailleurs.

---

## 4. Card d'intro WADA

```tsx
// components/styliste/IntroCard.tsx
import { Sparkles } from 'lucide-react';

export function IntroCard() {
  return (
    <div className="bg-white rounded-2xl p-5 mb-6 max-w-md">
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#8a7a68] mb-2">
        WADA
      </p>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#1a1a1a] leading-relaxed">
          Dites-moi tout. Une occasion, une pièce, une humeur — je compose autour.
        </p>
        <Sparkles className="w-4 h-4 text-[#1a1a1a] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
      </div>
    </div>
  );
}
```

C'est la « première phrase du styliste » — chaleureuse, précise. Le sparkle évoque l'IA sans crier.

---

## 5. Chips de quick action

```tsx
// components/styliste/QuickChips.tsx
'use client';
import { useState } from 'react';

const CHIPS = [
  { label: 'Bureau lundi', prompt: 'Compose-moi une tenue pour le bureau lundi matin' },
  { label: 'J\'ai un pull noir', prompt: 'J\'ai un pull noir en col rond, autour de quoi je peux le composer ?' },
  { label: 'Soirée samedi', prompt: 'Tenue pour un dîner restaurant samedi soir' },
  { label: 'Surprends-moi', prompt: 'Surprends-moi avec une tenue inattendue mais belle', primary: true },
  { label: 'J\'ai déjà une pièce', prompt: 'Je veux te montrer une pièce que j\'ai déjà', action: 'open-photo' },
];

export function QuickChips({ onChipClick }: { onChipClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 max-w-md">
      {CHIPS.map(chip => (
        <button
          key={chip.label}
          onClick={() => onChipClick(chip.prompt)}
          className={`px-4 py-2 rounded-full text-xs transition-colors ${
            chip.primary
              ? 'bg-[#6e3b32] text-white border border-[#6e3b32] hover:bg-[#5a2f28]'
              : 'bg-transparent text-[#1a1a1a] border border-[#1a1a1a]/20 hover:bg-white'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
```

**Détails** :
- **« Surprends-moi »** est la seule chip en bordeaux WADA `#6e3b32` rempli — c'est le « bouton fun » qui invite à essayer
- Les 4 autres sont en outline subtil (border 20% noir)
- Au clic, la chip injecte un prompt dans le textarea (ou ouvre l'upload photo pour « J'ai déjà une pièce »)
- **Mobile** : chips wrap proprement

---

## 6. Input principal (textarea + Envoyer)

```tsx
// components/styliste/PromptInput.tsx
'use client';
import { useState } from 'react';
import { Send } from 'lucide-react';

export function PromptInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="relative max-w-md mb-8">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder="Décrivez ce que vous avez, ou ce que vous cherchez..."
        className="w-full pl-5 pr-32 py-4 bg-white rounded-full border border-[#1a1a1a]/10 text-sm text-[#1a1a1a] placeholder:text-[#8a7a68] focus:outline-none focus:ring-2 focus:ring-[#6e3b32]/20"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#1a1a1a] text-white rounded-full text-xs tracking-wider flex items-center gap-2 hover:bg-[#2c2c2a] disabled:opacity-50"
      >
        ENVOYER
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
```

**Détails** :
- Input pleinement arrondi (`rounded-full`), pas de coins carrés
- Bouton **ENVOYER** noir intégré à droite, avec icône avion
- Au submit (Enter ou clic), envoie le prompt au backend `/api/styliste/compose`

---

## 7. 4 feature cards (en bas de la colonne gauche)

```tsx
// components/styliste/StylisteFeatures.tsx
import { Shirt, Scan, Palette, Heart } from 'lucide-react';

const FEATURES = [
  { icon: Shirt, label: 'Styliste IA', text: 'Des tenues uniques rien que pour vous' },
  { icon: Scan, label: 'Scanner', text: 'Scannez une pièce et trouvez des idées' },
  { icon: Palette, label: 'Palettes', text: 'Harmonies de couleurs inspirantes' },
  { icon: Heart, label: 'Vos favoris', text: 'Enregistrez vos looks préférés' },
];

export function StylisteFeatures() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {FEATURES.map(feat => {
        const Icon = feat.icon;
        return (
          <div key={feat.label} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1a1a1a]/5 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-[#1a1a1a]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#1a1a1a] mb-0.5">{feat.label}</p>
              <p className="text-[11px] text-[#5a5a5a] leading-relaxed">{feat.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

Notez : icônes dans un cercle gris très clair (5% noir), pas de fond coloré. Très épuré.

---

## 8. Composant gauche complet

```tsx
// components/styliste/StylisteContent.tsx
'use client';
import { useState } from 'react';
import { BackButton } from './BackButton';
import { StylisteTitle } from './StylisteTitle';
import { IntroCard } from './IntroCard';
import { QuickChips } from './QuickChips';
import { PromptInput } from './PromptInput';
import { StylisteFeatures } from './StylisteFeatures';
import { useRouter } from 'next/navigation';

export function StylisteContent() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    // Envoie le prompt au backend et redirige vers la page de conversation
    const res = await fetch('/api/styliste/start', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
    const { session_id } = await res.json();
    router.push(`/styliste/${session_id}`);
  };

  return (
    <div className="pt-4 pb-12">
      <BackButton />
      <StylisteTitle />
      <IntroCard />
      <QuickChips onChipClick={setPrompt} />
      <PromptInput value={prompt} onChange={setPrompt} onSubmit={handleSubmit} />
      <StylisteFeatures />
    </div>
  );
}
```

---

## 9. Colonne droite — le hero flat lay

```tsx
// components/styliste/StylisteHero.tsx
import Image from 'next/image';

export function StylisteHero() {
  return (
    <div className="relative hidden lg:block">
      <div className="sticky top-8">
        <div className="aspect-[4/5] relative rounded-2xl overflow-hidden">
          <Image
            src="/hero/styliste-flatlay-cream-minimaliste.jpg"
            alt="Flat lay éditorial WADA — Chic minimaliste"
            fill
            className="object-cover"
            priority
          />

          {/* Overlay "Inspiration du jour" en bas à droite */}
          <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm rounded-xl p-4 max-w-[220px] flex items-center gap-3 shadow-sm">
            <div>
              <p className="text-[10px] tracking-wider uppercase text-[#8a7a68] mb-1">
                Inspiration du jour
              </p>
              <p className="font-medium text-sm text-[#1a1a1a] mb-1">
                Chic minimaliste
              </p>
              <p className="text-[11px] text-[#5a5a5a] leading-snug">
                Élégance discrète, tons neutres et matières naturelles.
              </p>
            </div>
            <Image
              src="/hero/styliste-inspiration-avatar.jpg"
              alt="Look minimaliste"
              width={50}
              height={70}
              className="rounded-lg object-cover flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Détails essentiels** :
- L'image hero est `sticky` quand on scroll → reste fixée en colonne droite
- L'overlay « Inspiration du jour » a un fond `bg-white/95` avec `backdrop-blur` (effet verre dépoli)
- Sur mobile (≤lg), la colonne droite est **cachée** (`hidden lg:block`) pour ne pas surcharger

---

## 10. L'image hero — génération

Prompt **Flux Pro** pour générer l'image principale :

```
Editorial flat lay product photography, top-down view, soft natural daylight casting
window shadows. On a cream linen background, arranged with deliberate negative space:
a cream-colored chunky knit cardigan folded loosely, a structured black leather handbag
with gold clasp, high-waisted pleated cream wool trousers, black leather loafers with
gold horsebit detail, three pairs of gold hoop earrings of varying sizes, and a small
sprig of eucalyptus branch in the upper right corner. Minimalist Japanese aesthetic
mixed with Wes Anderson symmetry. High-end fashion editorial style, similar to Net-a-Porter
or Mr Porter product photography. Soft natural shadows from window light, warm cream tones,
no text, no models, no hangers, no people. 4:5 portrait ratio. Photorealistic.
Professional fashion photography. Subject: chic minimalist outfit, neutral palette.
```

Coût : ~$0,04 sur Replicate.

Et pour l'avatar « Inspiration du jour » (petit portrait modèle dans l'overlay) :

```
Editorial fashion portrait, woman wearing a cream cardigan and matching beige pants,
black sunglasses, hair pulled back in a low bun, standing against a soft beige wall,
natural daylight, minimalist Japanese aesthetic, photorealistic, 4k, square crop showing
upper body.
```

Coût : ~$0,04. Total : **~$0,08 one-time**.

À stocker dans :
- `/public/hero/styliste-flatlay-cream-minimaliste.jpg`
- `/public/hero/styliste-inspiration-avatar.jpg`

---

## 11. « Inspiration du jour » — rotation

L'overlay « Inspiration du jour » devrait **changer chaque jour** (ou chaque semaine) pour
donner un effet vivant. Stocke en base une table `daily_inspirations` :

```typescript
interface DailyInspiration {
  id: string;
  date: Date;            // jour d'affichage
  title: string;         // "Chic minimaliste"
  description: string;   // "Élégance discrète..."
  flat_lay_url: string;  // image hero principale
  avatar_url: string;    // image overlay
  palette_id: string;    // palette WADA associée
  href: string;          // lien vers la palette ou la tenue
}

// Côté serveur :
const today = await db.dailyInspiration.findFirst({
  where: { date: startOfDay(new Date()) },
});
```

**Comment générer 30+ inspirations** : un script GPT-4o qui pioche dans tes 348 palettes et
génère titre + description + prompts d'image, puis Flux Pro génère les images. Coût total :
**~$3 pour 60 jours d'inspirations**. Reroulable tous les 2 mois.

---

## 12. Footer (4 colonnes sur fond noir)

```tsx
// components/Footer.tsx (peut être partagé sur tout le site)
import Link from 'next/link';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white px-6 lg:px-12 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="font-bold tracking-wider text-lg">WADA</span>
            <span className="font-serif text-base">和田</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-5 max-w-xs">
            Un dictionnaire de palettes pour composer la tenue parfaite.<br/>
            D'après Sanzo Wada (1933).
          </p>
          <div className="flex gap-3">
            <Link href="https://instagram.com/wada.style" aria-label="Instagram">
              <Instagram className="w-4 h-4 text-white/60 hover:text-white" />
            </Link>
            {/* TikTok et Pinterest icons custom */}
            <TikTokIcon />
            <PinterestIcon />
          </div>
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-4">Explorer</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/palettes" className="text-white/80 hover:text-white">Palettes</Link></li>
            <li><Link href="/scanner" className="text-white/80 hover:text-white">Scanner</Link></li>
            <li><Link href="/decouvrir" className="text-white/80 hover:text-white">Découverte</Link></li>
            <li><Link href="/cultures" className="text-white/80 hover:text-white">Cultures</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-4">Compte</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/favoris" className="text-white/80 hover:text-white">Mes favoris</Link></li>
            <li><Link href="/abonnement" className="text-white/80 hover:text-white">Abonnement</Link></li>
            <li><Link href="/a-propos" className="text-white/80 hover:text-white">À propos</Link></li>
            <li><Link href="/faq" className="text-white/80 hover:text-white">FAQ</Link></li>
            <li><Link href="/install" className="text-white/80 hover:text-white">Installer l'app</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-4">Contact</p>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:hello@wada.style" className="text-white/80 hover:text-white">hello@wada.style</a></li>
            <li><Link href="/marques" className="text-white/80 hover:text-white">Pour les marques</Link></li>
            <li><Link href="/mentions" className="text-white/80 hover:text-white">Mentions légales</Link></li>
            <li className="text-white/40">Genève</li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-white/40">
        <p>© 2026 WADA · Genève</p>
        <p className="leading-relaxed md:text-right max-w-3xl">
          Liens partenaires (Muji, The Business Fashion, The Shirt Company — via Awin) —
          WADA peut toucher une commission, sans coût supplémentaire pour vous.{' '}
          <Link href="/affiliation" className="underline">En savoir plus</Link>
        </p>
      </div>

    </footer>
  );
}
```

**Détails** :
- Fond très foncé `#0a0a0a` (presque noir mais pas pur)
- 4 colonnes desktop, 2 mobile, 1 sur très petit écran
- Labels de colonnes en petit caps blanc dilué (`text-white/40`)
- Mention affiliation Awin en bas, courte et claire (obligation légale DSA)

---

## 13. Backend — endpoint `/api/styliste/start`

```typescript
// app/api/styliste/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  const session = await auth();
  const { prompt } = await req.json();

  if (!prompt || prompt.length < 3) {
    return NextResponse.json({ error: 'Prompt trop court' }, { status: 400 });
  }

  // Créer une session de conversation styliste
  const sessionId = nanoid(12);
  await db.stylisteSession.create({
    data: {
      id: sessionId,
      user_id: session?.user?.id ?? null,
      initial_prompt: prompt,
      created_at: new Date(),
    },
  });

  return NextResponse.json({ session_id: sessionId });
}
```

Puis la page `/styliste/[session_id]` affiche la conversation avec l'IA qui propose des tenues
(en utilisant la logique de cohérence déjà spec'd dans le brief composer).

---

## 14. Mobile responsive

Sur mobile (≤lg = 1024px), la maquette s'adapte ainsi :

- **Grid passe de 2 colonnes à 1** : la colonne hero (image flat lay) **disparaît**
- Le titre éditorial occupe toute la largeur
- Les chips wrap normalement
- L'input prend toute la largeur
- Les 4 features passent en grid 2×2

```tsx
// dans StylisteContent.tsx, ajouter une version mobile du hero
{/* Affiche un mini flat lay au-dessus du formulaire sur mobile */}
<div className="lg:hidden mb-6 -mx-6 aspect-[4/3] relative rounded-xl overflow-hidden">
  <Image
    src="/hero/styliste-flatlay-cream-minimaliste.jpg"
    alt="Flat lay éditorial WADA"
    fill
    className="object-cover"
  />
</div>
```

**Sur mobile, l'overlay « Inspiration du jour » disparaît** — on garde juste l'image.

---

## 15. Animations subtiles

Pour la touche finale :

```css
/* globals.css */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Applique `fade-in` à `<StylisteTitle />`, `<IntroCard />`, `<QuickChips />`, `<PromptInput />`
avec un petit délai entre chaque (`animation-delay: 0.1s, 0.2s, 0.3s, 0.4s`).

L'effet : à l'arrivée sur la page, les éléments apparaissent **un à un, en cascade douce**.
Le client sent que le site est vivant.

---

## 16. Checklist Claude Code

```
□ Créer la route app/styliste/page.tsx
□ Créer les composants dans components/styliste/ :
  - StylisteContent.tsx
  - StylisteHero.tsx
  - BackButton.tsx
  - StylisteTitle.tsx
  - IntroCard.tsx
  - QuickChips.tsx
  - PromptInput.tsx
  - StylisteFeatures.tsx
□ Créer Footer.tsx commun (réutilisable sur toutes les pages)
□ Générer 2 images Flux Pro :
  - /public/hero/styliste-flatlay-cream-minimaliste.jpg
  - /public/hero/styliste-inspiration-avatar.jpg
□ Créer la table SQL daily_inspirations
□ Endpoint API /api/styliste/start
□ Endpoint API /api/styliste/[session_id] pour la conversation
□ Tester :
  - Desktop 1440px : 2 colonnes harmonieuses
  - Mobile 390px : 1 colonne, image au-dessus, chips wrap
  - Clic sur chip → injecte le prompt dans l'input
  - Submit (Enter ou Envoyer) → crée la session et redirige
  - Sticky behavior de l'image hero au scroll
  - Overlay "Inspiration du jour" lisible avec backdrop-blur
```

---

## 17. Pourquoi cette page est cruciale

**C'est le point d'entrée du Styliste IA**, la fonctionnalité signature de WADA. Si cette
page est belle et fluide, le client comprend immédiatement que WADA n'est pas qu'un
catalogue mais une **expérience de stylisme**.

**Les 3 éléments qui vendent l'idée** :
1. **Le titre éditorial** « Composons votre tenue. » — engage à la conversation
2. **Le flat lay hero** — montre concrètement le résultat éditorial possible
3. **L'overlay « Inspiration du jour »** — ajoute une notion de fraîcheur, de routine

Combiné avec :
- La cohérence du composer (brief séparé)
- Les notes éditoriales par pièce (brief flat lay)
- La conversation contextuelle (à venir)

→ Le Styliste IA WADA devient **le seul styliste IA mode au monde qui raconte une histoire
de couleur** au lieu de juste afficher des produits.

---

**À envoyer au codeur avec les 4 autres briefs.** Cette page est probablement la plus
visuellement aboutie du site et celle qui justifie le mieux WADA+ (abonnement).
