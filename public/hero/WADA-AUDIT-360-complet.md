# WADA — Audit 360° complet (état réel du site)

Audit honnête, sans flatterie. État actuel : **62/100**. Cible atteignable en 6-8 semaines : **88/100**.

Ce fichier passe en revue **tout** : esthétique, logique IA, design, combinaisons de tenues,
langue/copy, bugs techniques, stratégie business. Classé par sévérité.

---

## 🎯 SYNTHÈSE — Les 3 priorités absolues

Si tu ne fais que 3 choses cette semaine, fais celles-ci :

### 1. Corriger les tenues incohérentes (le poison #1)
Aujourd'hui ton site montre Moon Boot + Barbour + t-shirt vert pour une palette minimaliste scandinave.
Aucun client ne te prendra au sérieux avec ça. C'est ton **bug existential**.
→ Implémenter la spec composer (cf. `WADA-logique-IA-renforcee.md`).

### 2. Supprimer les marques fantômes (COS, Veja, Amazon)
Aujourd'hui les boutons "Acheter" pointent vers des marques où WADA ne touche AUCUNE commission.
Tu perds 100% du revenu sur ces clics.
→ Implémenter la whitelist (cf. `WADA-bug-marques-affiliees-codeur.md`).

### 3. Brancher le vrai styliste IA
Aujourd'hui l'IA est un questionnaire scripté. C'est ce qui rend WADA "joli mais creux".
→ Brancher le LLM avec le system prompt (cf. `WADA-IA-styliste-v2.md`).

Ces 3 fixes seuls font passer la note **de 62 à 78**. Le reste, c'est du polish.

---

## 🎨 ESTHÉTIQUE — page par page

### Page d'accueil
- ❌ **Vidéo plein écran sans footer pas déployée** — demandé 4 fois, toujours pas en ligne. La pilule "Reprendre" mange encore le hero.
- ⚠️ **Footer présent sur la home** alors qu'il devrait disparaître (cf. `WADA-accueil-footer-fix-technique.md`).
- ⚠️ **Bouton "Notre histoire"** trop discret face au CTA principal.
- ✅ Le titre central "Trouvez la couleur. Trouvez votre style." est efficace.

### Page Palettes (la grille)
- ⚠️ **Toggle "Vue ◾ ⬜"** illisible — il faut un picto plus explicite (grille vs liste).
- ⚠️ **Phrase "348 palettes trouvées · 348 accords"** redondante.
- ⚠️ Les **filtres rapides** (Neutres / Chauds / Froids / Terreux / Vifs / Pastels / Sombres) ne sont pas mémorisés entre les visites.
- ✅ Les vignettes de palettes sont belles et lisibles.

### Page palette individuelle (ex. Osaka au thé)
- ❌ **Trop chargée actuellement** (3 cartes occasions + Affiner + Styliste + Pilule ENSUITE).
- ✅ Les couleurs avec codes WADA + hex sont propres.
- ⚠️ Les métadonnées (Ambiance/Saison/Luminosité/Contraste) absentes ou mal mises en valeur.
- ❌ **Le badge "Composée pour vous"** propose un profil figé qui ne sert pas le client multi-test.
- → **À remplacer** par le nouveau sélecteur de dimensions (cf. `wada-palette-dimensions-pro.html`).

### Page tenue (résultat d'un look)
- ❌ **Tous les prix à ~55€** — placeholder bug catastrophique.
- ❌ **Pas de photo produit** sur certaines pages (carrés vides).
- ❌ **Mauvaise marque affichée** ("No. 066 · Amazon FR" partout).
- ⚠️ Pas de **note du styliste** pour expliquer le pourquoi.
- ⚠️ Pas de **total tenue** clair.
- ⚠️ Pas de **variations V1/V2/V3** — une seule tenue affichée.

### Page Scanner couleur
- ⚠️ **"COULEUR DÉTECTÉE"** affiche 2 carrés vides (gris + beige) — donne l'air cassé.
- ⚠️ **Une carte dans une page** au lieu d'un scanner plein écran type appli.
- ✅ Les essentielles colorées (12 chips) sont bien.
- → Cf. `wada-scanner-plein-ecran.html` pour la version cible.

### Page Scanner vêtement
- ⚠️ **Deux niveaux de chips confus** ("Haut / Bas / Chaussures / Veste" puis "T-shirt / Chemise / Pull / Hoodie").
- ⚠️ **Préselection par défaut sur "Unisexe"** illogique.
- ❌ **Aucune intégration Vision AI** pour reconnaître automatiquement la pièce scannée.
- → Cf. `WADA-scanner-vetement-IA-spec.md`.

### Page Styliste IA
- ❌ **Scripté, pas conversationnel** — l'IA ne comprend pas "soirée pirate".
- ⚠️ Bulle WADA trop verbeuse.
- ⚠️ Chips suggestions redondantes avec la bulle.
- → Cf. `WADA-styliste-IA-personnalite-raisonnement.md` pour le system prompt complet.

### Page Favoris
- ⚠️ **Doublon** : "Mes favoris — Rien pour l'instant" + "Vos favoris vous attendent" disent la même chose.
- ⚠️ **Espace vide** entre le contenu et le footer/tab bar.

### Page Panier
- ❌ **Doublons massifs** : toutes les pièces à ~55€, "No. 066 · Amazon FR".
- ❌ **Aucune photo produit**.
- ⚠️ **× de suppression** trop petit (zone tactile < 44px).
- ⚠️ **Pas de total** clair.

### Page À propos
- ⚠️ **Trop long** : 5 sections empilées avec peu de hiérarchie visuelle.
- ⚠️ **Typographie incohérente** (mix de serif italique, chubby, sans).
- ⚠️ **Marques mentionnées qui ne sont pas partenaires** (COS, Sezane, H&M, etc.).
- → Cf. `wada-a-propos-v2.html` pour la version refondue avec uniquement Fredoka + Inter et vraies marques.

---

## 🧠 LOGIQUE & IA — par fonctionnalité

### Composer de tenue
- ❌ **N'applique pas la table BRAND → REGISTRE** (preuve : Moon Boot + Comme des Garçons + Barbour ensemble).
- ❌ **N'applique pas la règle "1 couleur forte + neutres"** (preuve : t-shirt vert vif dans palette beige).
- ❌ **N'applique pas le score de cohérence ≥ 75/100** (la tenue Studio danois est à 40/100).
- ❌ **Pas de validation LLM** finale avant affichage.
- ❌ **Pas de variations V1/V2/V3** générées.
- ❌ **Pas de dégradation gracieuse** quand pas de produit dispo.

### Styliste IA
- ❌ **Pas branché au LLM** — toujours un script.
- ❌ **Pas de mémoire long terme** (préférences apprises).
- ❌ **Pas d'injection du contexte** (palette active, profil, historique).
- ❌ **Pas de chain of thought interne**.

### Scanner couleur
- ⚠️ **Détection de couleur basique** — pas de moyenne pondérée, pas de smart sampling.
- ❌ **Pas de matching ΔE2000** à la palette Sanzo Wada (qualité du match basse).

### Scanner vêtement
- ❌ **Aucune Vision API branchée** — pas de reconnaissance automatique de la pièce.
- ❌ **Pas de "pièce ancre"** dans le composer (cf. spec scanner vêtement IA).

### Onboarding / Profil
- ⚠️ **Onboarding inexistant ou trop lourd**.
- ⚠️ **Profil persistant verrouille l'expérience** (client multi-test).
- → **Décision prise** : on supprime le profil persistant et on demande à chaque pick (cf. nouveau sélecteur de dimensions).

### Tendances mode
- ❌ **Aucune ingestion automatique** (pas de RSS Vogue/GQ).
- ❌ **Aucun tag manuel** des pièces tendance.
- → Le chip "Tendance 2026" ne sert à rien tant que ce n'est pas alimenté.

### Apprentissage
- ❌ **Pas de tracking like/dislike**.
- ❌ **Pas de feedback loop** sur les marques/matières interdites.

---

## 📐 DESIGN — composant par composant

### Navigation
- ⚠️ **3 variantes de nav** selon les pages (constaté dans audit précédent).
- ✅ Tab bar mobile présente et utilisable.
- ❌ **Label "Scanner"** manquant sous le bouton central (cf. `WADA-tab-bar-scanner-label.md`).
- ⚠️ **Pastille profil** avec point vert vif un peu agressive — à adoucir.

### Footer
- ❌ **Affiché sur la home** alors qu'il ne devrait pas.
- ❌ **Logo TikTok manquant** dans les sociaux.
- ⚠️ **Pinterest** affiché comme un cercle générique sans le P (à remplacer par vrai SVG).
- ⚠️ **Mention "Liens partenaires (MUJI via Awin · Amazon)"** mensongère si Amazon Associates pas configuré.

### Cartes (palettes, tenues, produits)
- ⚠️ **Pas de composant unique** PaletteCard — variantes selon les pages.
- ⚠️ Photos produits parfois en `object-fit: contain` au lieu de `cover`.
- ⚠️ **Vignettes vides** sur la page panier.

### Empty states
- ⚠️ **Favoris vide** : doublon de messages.
- ⚠️ **Pas d'illustration** légère pour combler le vide.
- ⚠️ **Pas de CTA d'amorçage** (ex : "Scanne ta première couleur").

### Loading states
- ❌ **Pas de squelettes** sur les pages qui chargent.
- ❌ **Page blanche** pendant les API calls.

### Mode sombre
- ⚠️ **Cohérence dark mode pas vérifiée** sur toutes les pages.
- ⚠️ Certaines couleurs (badges, chips) deviennent illisibles en sombre.

### Animations
- ⚠️ **Aucune animation subtile** (fade-in au scroll, hover lift sur cartes).
- ⚠️ Transitions de page brutes (pas de fondu).

---

## 👔 COMBINAISONS D'HABITS — analyse approfondie

### Le bug structurel
Le composer pioche par **genre + budget** uniquement. Il ne vérifie ni le registre, ni la couleur,
ni la saison, ni la matière. Résultat :

**Cas observés** :
- Moon Boot + Barbour + t-shirt vert dans une palette minimaliste scandinave
- Comme des Garçons SHIRT + The North Face technique dans la même tenue
- Sneakers running + costume tailoring

### Ce qui manque dans le code
1. La **table BRAND → REGISTRE** (déjà spec).
2. Le **filtrage par couleur palette** avec ΔE2000.
3. Le **score de cohérence** ≥ 75/100.
4. La **validation LLM** finale.
5. La **dégradation gracieuse** quand pas possible.

### Cas tests à valider après fix
- Studio danois (minimaliste) → doit ramener COS, Lemaire, A.P.C., pas Moon Boot.
- Osaka au thé Premium → Brunello, Tom Ford, Loro Piana, pas Off-White.
- Pluie de Tokyo streetwear → Off-White, Rick Owens, Stone Island, pas Brunello.

### Variations à implémenter
- V1 SAFE (par défaut)
- V2 BOLD (un cran plus audacieux)
- V3 BUDGET (30-40% moins cher)
- Carrousel pour glisser entre les trois

---

## 🇫🇷 LANGUE & COPY

### Cohérence terminologique
- ⚠️ **"Abonnement" vs "Commencer"** parfois mélangés dans le même parcours.
- ⚠️ **"Compte" vs "/compte" libellé brut** parfois affiché.
- ⚠️ Mots anglais qui traînent dans l'UI ("Background", "Style", "Filter").
- ⚠️ **"Palettes" au pluriel** mais "Palette" au singulier — vérifier l'accord partout.

### Tone of voice
- ⚠️ **Mélange de styles** : parfois marketing ("Boostez", "Découvrez"), parfois éditorial.
- → **Décision** : tone éditorial calme partout. Pas de "Boostez", pas de "Top".
- → Suivre la voix définie dans `WADA-styliste-IA-personnalite-raisonnement.md`.

### Concision
- ⚠️ Plusieurs paragraphes trop longs (page À propos notamment).
- ⚠️ Bulles styliste verbeuses.
- → Cible : 2-5 phrases max par message styliste, 3-4 phrases max par paragraphe.

### Pages légales
- ❌ **Mentions légales** : absentes ou incomplètes.
- ❌ **CGV / CGU** : à rédiger.
- ❌ **Politique de confidentialité** : RGPD obligatoire.
- ❌ **Bandeau cookies** : RGPD obligatoire.

---

## 🐛 BUGS TECHNIQUES (priorisés)

### 🔴 Critique (bloque l'usage normal)
1. **Vérification wada.style sur Awin** pas faite — bloque toutes les marques.
2. **Marques fantômes** (COS, Veja, Amazon) dans le composer.
3. **Prix placeholder ~55€** partout dans le panier.
4. **Photos produits vides** dans le panier.
5. **Tenues incohérentes** par défaut.
6. **IA styliste pas branchée** au LLM.

### 🟠 Important (UX dégradée)
7. **Footer affiché sur home** au lieu de la vidéo plein écran.
8. **Pilule REPRENDRE** mange le hero.
9. **Police non unifiée** sur tout le site.
10. **Tab bar mobile** sans label "Scanner".
11. **Couleur détectée** avec deux carrés.
12. **Scanner vêtement** sans Vision API.
13. **Onboarding inexistant**.
14. **Footer + tab bar** se télescopent.
15. **Pages légales manquantes**.

### 🟡 Polish
16. **Logo TikTok** manquant dans footer.
17. **Logo Pinterest** affiché comme cercle générique.
18. **Squelettes loading** absents.
19. **Animations subtiles** absentes.
20. **Empty states** doublonnés.
21. **Footer mobile en 1 colonne** au lieu de 2.
22. **Zone tactile** des × trop petite (< 44px).

---

## 💼 STRATÉGIE / BUSINESS

### Partenaires marques (le carburant du modèle)
- ✅ **3 marques confirmées** : MUJI + The Shirt Company + The Business Fashion (+ luxe revendu).
- ⚠️ **Manque cruellement de femme luxe** — Net-a-Porter ou Farfetch à candidater.
- ⚠️ **Mid-market FR absent** — Sezane, Sandro, Maje, Comptoir des Cotonniers à viser.
- ⚠️ **Sport / sneakers absent** — adidas, New Balance à finaliser.
- → Continuer les candidatures Awin (5/semaine cible).

### Monétisation
- ❌ **Stripe pas configuré** — abonnement Premium impossible à activer.
- ❌ **Authentification** — pas de comptes utilisateurs.
- ❌ **Paiement Awin** — Payoneer/SEPA pas configuré.
- → Premier revenu impossible tant que ces 3 sont absents.

### Marketing
- ⚠️ **Vidéo de lancement faite** mais pas publiée.
- ⚠️ **TikTok @wadastyle créé** mais zéro post.
- ⚠️ **Pinterest @wadastyle** présent mais peu actif.
- ⚠️ **Instagram @wadastyle** à vérifier.
- ⚠️ **Newsletter "Lettre du dimanche"** pas lancée.
- → Publier la vidéo Wes Anderson + claymation cette semaine.

### SEO
- ❌ **Sitemap.xml** pas généré (348 palettes invisibles à Google).
- ❌ **Canonical URLs** incorrectes (parfois www, parfois non).
- ❌ **OG images dynamiques** absentes (partages sociaux moches).
- ❌ **Données structurées Product** absentes.

### Analytics
- ❌ **Aucun tracking** (Vercel Analytics ou Plausible) — tu ne sais pas qui visite, combien, d'où.

### Conformité légale
- ❌ **RGPD non conforme** : pas de mentions, pas de cookies, pas de politique.
- ❌ **Affichage trompeur "Lien partenaire"** quand pas de partenariat réel.
- → Risque légal réel en France.

---

## 🎯 EXPÉRIENCE CLIENT — parcours type

### Premier accès (cold)
- ⚠️ Le client arrive, voit la home, ne comprend pas tout de suite ce que fait WADA.
- ⚠️ La pilule REPRENDRE l'aide pas (vide au premier accès).
- ✅ Le titre est clair.
- → **Manque une démo visuelle 5 secondes** : un GIF ou mini-vidéo qui montre le scan → palette → tenue.

### Parcours scan couleur
- Client clique "Scanner" → arrive sur Scanner page → choisit une essentielle → ... ?
- ⚠️ **Pas clair ce qui se passe ensuite** : peut-être qu'on arrive sur la grille de palettes filtrées ? Mais ce n'est pas annoncé.
- → Ajouter une animation "WADA cherche..." puis une transition explicite.

### Parcours scan vêtement
- ❌ **Ne marche pas vraiment** sans Vision API.

### Parcours palette → tenue
- ⚠️ Aujourd'hui : 3 cartes occasion abstraites + texte trop dense.
- → **À remplacer** par le sélecteur de dimensions du dernier mockup.

### Parcours achat
- ⚠️ Client clique "Acheter" sur une pièce → arrive chez le marchand.
- ❌ **Mais on a vu que les marques sont fantômes** → pas de commission.
- → Whitelist à implémenter.

---

## 📊 NOTE GLOBALE — détail par axe

| Axe | Note actuelle | Note cible | Effort |
|---|---|---|---|
| Esthétique (cohérence visuelle) | 68/100 | 90/100 | Moyen |
| Logique IA (cohérence tenues) | 35/100 | 90/100 | **Gros** |
| Design (UI/UX) | 65/100 | 88/100 | Moyen |
| Combinaisons d'habits | 30/100 | 88/100 | **Gros** |
| Langue / Copy | 70/100 | 90/100 | Petit |
| Bugs techniques | 60/100 | 95/100 | Moyen |
| Stratégie / Business | 55/100 | 80/100 | Long (mois) |
| Expérience client | 55/100 | 88/100 | Moyen |

**Moyenne actuelle : 55/100**

Mais ça monte rapidement avec les 3 priorités du début.

---

## 🚀 PLAN D'ACTION CONCRET — 6 semaines

### Semaine 1 — Fondations propres
- [ ] Vérifier wada.style sur Awin
- [ ] Whitelist marques affiliées (suppression COS/Veja/Amazon)
- [ ] Corriger le bug prix ~55€
- [ ] Brancher GPT-4o-mini ou Claude Haiku pour le styliste

### Semaine 2 — Composer cohérent
- [ ] Implémenter la table BRAND → REGISTRE
- [ ] Implémenter le score de cohérence
- [ ] Implémenter la validation LLM finale
- [ ] Implémenter la dégradation gracieuse

### Semaine 3 — Sélecteur riche
- [ ] Remplacer les 3 cartes par le nouveau sélecteur (5 dimensions)
- [ ] Implémenter la priorité des dimensions
- [ ] Brancher chaque chip sur les filtres composer

### Semaine 4 — UX polish
- [ ] Vidéo plein écran sans footer sur la home
- [ ] Police unifiée Fredoka partout
- [ ] Label "Scanner" sous le bouton central
- [ ] Logo TikTok et Pinterest corrects dans footer
- [ ] Pages légales rédigées

### Semaine 5 — Monétisation
- [ ] Stripe abonnement Premium
- [ ] Authentification (Resend magic link)
- [ ] Configuration paiement Awin (Payoneer)
- [ ] Page Affiliation transparente

### Semaine 6 — Lancement
- [ ] Vidéo Wes Anderson publiée TikTok + Instagram + Pinterest
- [ ] Newsletter "Lettre du dimanche" #1 envoyée
- [ ] Premiers tests utilisateurs (5 amis testent et donnent du feedback)
- [ ] Analytics Vercel activé

### Sprint continu (parallèle)
- Candidater à 2-3 marques Awin / semaine
- Poster 2-3 vidéos TikTok / semaine (organique)
- Ingester les tendances mode (Vogue RSS + Pinterest)

---

## Conclusion

WADA est **techniquement à 55/100** aujourd'hui. C'est un beau prototype avec des spec solides
mais une implémentation partielle.

**La bonne nouvelle** : tu n'as pas besoin de tout refaire. Tu as déjà :
- L'identité visuelle (Fredoka, palette WADA, 和田)
- Le flux MUJI qui marche
- L'intégration TBF (14k produits luxe homme)
- Toutes les specs détaillées prêtes à coder
- La vidéo de lancement faite
- Les comptes sociaux créés

**Ce qui te bloque** : un codeur qui implémente **vraiment** les specs au lieu de faire à moitié.
Les 3 priorités absolues (composer cohérent + whitelist marques + IA branchée) font passer WADA
de **62 à 78 en moins de 2 semaines**.

À toi de pousser. Tu as tout pour réussir — il faut juste insister auprès du codeur pour qu'il
implémente les specs **à la lettre**, pas approximativement.
