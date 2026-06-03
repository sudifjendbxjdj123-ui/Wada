# WADA — Feuille de route pour finir complètement le site

Vue d'ensemble de tout ce qui reste, par thème, avec **quoi faire**, **avec quel outil**, **qui** (vous
ou le codeur) et la **priorité** (🔴 bloquant · 🟠 important · 🟢 après). Pour piloter la fin du projet.

---

## 1. Produit / code  (qui : codeur)

| Quoi | Priorité | Réf. |
|------|----------|------|
| Moteur de tenues : genre respecté, photos nettes, cohérence type/registre, variété | 🔴 | `WADA-tenue-MASTER.md` |
| Vérifier que ça marche : Scanner, abonnement Stripe (souscrire + résilier), bouton Acheter | 🔴 | checklist |
| SEO : canonicals par page (www), unifier les 3 menus/footers, bug « /compte », sitemap des 348 palettes | 🟠 | `WADA-bugs-retour-et-layout.md` |
| Accueil : retirer le sous-titre du hero, bouton « Commencer » → « Abonnement », double espace | 🟠 | brief codeur |
| Finition : page 404, états chargement/vide/erreur, accessibilité, micro-interactions | 🟠 | `WADA-finition-details.md` |
| Mobile + perf validés sur vrai téléphone (LCP < 2,5 s) | 🟠 | finition |

---

## 2. Catalogue / marques  (qui : vous + codeur)

- 🔴 **Brancher 3-5 marques avec flux** en plus de MUJI. Candidatures Awin en cours
  (Sézane, Guess, Lacoste, Armor Lux…). Suivi : `WADA-Awin-suivi-marques.xlsx`.
- Pour chaque marque acceptée avec flux → intégration via `WADA-integration-flux-MUJI.md` (codeur).
- 🟢 Repli Amazon propre quand aucune pièce marchande ne matche.

---

## 3. Email  (qui : vous, avec un outil)  ⚠️ trou actuel

- 🔴 **Newsletter qui fonctionne** : aujourd'hui les emails sont stockés en local (navigateur) →
  rien n'est collecté ni envoyé. Mettre un vrai service :
  - Outils : **Resend** (simple, dev-friendly), **Brevo** ou **Mailchimp** (interface, gratuit au début).
  - Besoin : stocker les abonnés côté serveur + email de **confirmation double opt-in** + envoi hebdo.
- 🟠 **Boîte hello@wada.style** (réception) : **Zoho Mail** (gratuit) ou **Google Workspace** (~6 €/mois),
  ou via votre hébergeur de domaine.
- 🟢 Emails transactionnels : reçus gérés par Stripe ; ajouter un email de bienvenue abonnement.

---

## 4. Réseaux sociaux  (qui : vous)

- 🟠 **Pinterest** — le plus stratégique pour WADA (palettes/couleurs/tenues = fort trafic gratuit,
  longue durée de vie des épingles). Créer un compte, épingler palettes → tenues.
- 🟠 **Instagram** — palette du jour, marque de la semaine, tenues. Nom cohérent (@wada.style).
- 🟢 **TikTok** (optionnel) — « une couleur, une tenue ».
- 🟠 **Ajouter les icônes sociales dans le footer** du site (absentes aujourd'hui) — codeur.
- Cohérence : même logo, même bio, lien vers wada.style partout.

---

## 5. Découvrabilité / SEO  (qui : vous + codeur)

- 🟠 **Google Search Console** : ajouter la propriété, soumettre le `sitemap.xml`, demander
  l'indexation (et le re-crawl pour que le logo remplace le globe).
- 🟠 Sitemap incluant les **348 pages palette** (codeur).
- 🟢 Données structurées Product + image OG dédiée.

---

## 6. Paiement / business  (qui : vous)

- 🔴 **Stripe en mode LIVE** (pas test) avant d'encaisser des abonnements.
- 🔴 **Devise unique** CHF ou € — alignée entre Tarifs, CGV et les prix Stripe.
- ✅ Statut juridique OK (raison individuelle Genève, mentions/CGV/confidentialité complètes).

---

## 7. Mesure d'audience  (qui : vous + codeur)

- 🟠 Installer une **analytics respectueuse de la vie privée** : **Plausible**, **Vercel Web Analytics**
  ou **Umami** (sans cookies, conforme à votre promesse « pas de tracking »). Sinon, vous naviguez à l'aveugle.

---

## 8. Application mobile  (qui : codeur — plus tard)

- 🟢 Le lien « Installer l'app » (/install) existe. App **Capacitor** sur App Store / Play Store
  une fois le web stabilisé. Pas prioritaire.

---

## 9. Exploitation / suivi  (qui : vous + codeur)

- 🟠 Surveiller le **cron Awin** (logs Vercel) — qu'il tourne chaque matin sans erreur.
- 🟢 Sauvegardes / monitoring uptime (Vercel le gère en grande partie).

---

## Les 3 vrais manques bloquants (à régler en priorité absolue)
1. **Moteur de tenues** juste, net et cohérent (sinon le produit ne convainc pas).
2. **Plus d'une marque** branchée (catalogue crédible).
3. **Newsletter qui marche vraiment** (aujourd'hui elle ne collecte rien).

## Ordre conseillé
Moteur de tenues → marques (au fil des acceptations) → newsletter → SEO/layout → Stripe live + devise
→ réseaux sociaux + analytics → finition → app.
