# WADA — Vos étapes à vous (pas-à-pas)

Les 5 choses que le codeur ne peut pas faire à votre place. Pour chacune : quoi faire, étape par
étape, et **quoi donner au codeur** à la fin. Aucune compétence technique requise — suivez les clics.

---

## 1. Ajouter de nouvelles marques (Awin)  ⏱️ 10 min / marque

But : avoir 3-5 marques en plus de MUJI, avec leur flux produit.

1. Sur **ui.awin.com** → **Annuaire des annonceurs** (Advertiser Directory).
2. Filtres : Secteur = **Commerce de détail** · Région = **Europe › France** · Flux produit = **Oui** ·
   Paiement = **Vert** · Étalon-or coché.
3. Cherchez vos cibles : **Sézane, Balzac Paris, Sessùn, American Vintage, Saint James, Bobbies, Aigle…**
4. Ouvrez la marque → **Join Programme** (Rejoindre) → collez le message ≤ 250 caractères
   (modèle dans le tableau `WADA-Awin-suivi-marques.xlsx`).
5. Quand la marque vous **accepte** : Boîte à outils → **Créer-un-Flux** → format CSV, compression
   gzip → copiez **l'URL de téléchargement manuelle**.
6. **À donner au codeur** : cette URL (il l'ajoute comme MUJI). Mettez à jour le statut dans le tableau.

---

## 2. Activer la newsletter (clé d'emailing)  ⏱️ 15 min

But : que « la lettre du dimanche » collecte et envoie vraiment des emails (aujourd'hui elle ne fait rien).

Outil conseillé : **Resend** (gratuit jusqu'à ~3 000 emails/mois, simple).
1. Allez sur **resend.com** → créez un compte (avec hello@wada.style si possible).
2. Section **Domains** → ajoutez **wada.style** → Resend vous donne des **enregistrements DNS** à
   copier chez votre fournisseur de domaine (là où vous avez acheté wada.style). Collez-les.
   (Ça permet d'envoyer depuis @wada.style sans tomber en spam.)
3. Section **API Keys** → **Create API Key** → copiez la clé (commence par `re_...`).
4. **À donner au codeur** : cette **clé API** (il la met en variable d'env `RESEND_API_KEY` et
   branche l'inscription + l'email de confirmation double opt-in).
*(Alternative sans technique : Brevo ou Mailchimp, avec une interface pour écrire/envoyer la newsletter.)*

---

## 3. Stripe en mode LIVE + choix de la devise  ⏱️ 20 min

But : pouvoir encaisser réellement les abonnements (aujourd'hui c'est en mode test).

1. Sur **dashboard.stripe.com** → complétez l'**activation du compte** : infos entreprise (raison
   individuelle, Genève), pièce d'identité, **IBAN** pour recevoir les paiements. *(Vous seul saisissez
   ces données bancaires/identité — jamais le codeur, jamais moi.)*
2. **Choix de la devise** : votre CGV sont en **CHF** et vous êtes à Genève → le plus simple et
   cohérent est de tout mettre en **CHF**. (Si vous visez surtout la France, vous pouvez choisir **€**,
   mais alors corrigez aussi les CGV.) **Décidez une seule devise.**
3. Dans **Produits** → vérifiez/créez les prix **WADA Premium** : 1,99 / mois et 17,99 / an dans la
   devise choisie.
4. Basculez le tableau de bord en **mode Live** (interrupteur en haut) → récupérez les **clés Live**
   (`pk_live_...` et `sk_live_...`).
5. **À donner au codeur** : la **devise choisie** + confirmer que les clés Live + les IDs de prix Live
   sont bien dans Vercel (variables `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`,
   `STRIPE_PRICE_MONTHLY/YEARLY`).

---

## 4. Créer les réseaux sociaux  ⏱️ 20 min

But : présence + trafic gratuit, et liens dans le footer du site.

1. **Pinterest** (le plus utile pour WADA) → **pinterest.com** → créez un **compte entreprise** →
   nom « WADA », @wada, bio + lien **wada.style**. (Idéal pour épingler palettes → tenues.)
2. **Instagram** → créez **@wada.style** (ou proche si pris) → compte **professionnel** → bio + lien.
3. *(Optionnel : TikTok, même nom.)*
4. **À donner au codeur** : les **URLs de vos profils** → il ajoute les icônes dans le footer.

---

## 5. Google Search Console (être trouvé sur Google)  ⏱️ 10 min

But : que Google indexe vos 348 palettes et affiche votre logo (au lieu du globe).

1. Allez sur **search.google.com/search-console** → **Ajouter une propriété** → choisissez
   « Préfixe d'URL » → `https://www.wada.style`.
2. **Vérification** : la méthode la plus simple si le site est sur Vercel = ajouter l'enregistrement
   **DNS** fourni chez votre fournisseur de domaine (comme à l'étape 2 pour Resend). *(Le codeur peut aussi
   verser un fichier de vérification si besoin.)*
3. Une fois vérifié → menu **Sitemaps** → soumettez `https://www.wada.style/sitemap.xml`.
4. **Inspection d'URL** → tapez `https://www.wada.style/` → **Demander une indexation**.
5. Rien à donner au codeur (sauf si la vérification par fichier est nécessaire). Résultat (logo,
   indexation) sous quelques jours.

---

## Récap — ce que vous transmettez au codeur au fil de l'eau
- Les **URLs de flux** des marques acceptées (étape 1).
- La **clé API Resend** (étape 2).
- La **devise choisie** + confirmation des clés Stripe **Live** (étape 3).
- Les **URLs de vos réseaux sociaux** (étape 4).

## Ordre conseillé (demain)
1. Newsletter (Resend) — débloque un manque réel. 2. Stripe Live + devise — pour encaisser.
3. Search Console — pour être trouvé. 4. Réseaux sociaux. 5. Marques Awin (en continu).
