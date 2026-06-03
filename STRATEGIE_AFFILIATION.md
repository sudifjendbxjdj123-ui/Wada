# 💰 STRATÉGIE AFFILIATION — WADA

*Document opérationnel — mai 2026*

---

## 🎯 PRINCIPE

WADA touche une commission sur chaque vente générée par ses liens. **Pas de surcoût** pour l'utilisateur (la commission sort de la marge de la marque, pas du prix final).

**Commission moyenne :** 3% à 12% selon les programmes.
**Cookie de tracking :** 7 à 30 jours selon les marques.

---

## 📋 ÉTAT ACTUEL DES LIENS DANS WADA

| Type | Nombre de marques | Statut affiliation |
|------|-------------------|-------------------|
| Liens directs (Vinted, Zara, ASOS, Zalando) | 5 | ❌ Non affiliés |
| Liens Google Search (rest of marques) | 75+ | ❌ Pas trackable |
| **OBJECTIF** : passer 80% des liens en affiliés | | 🎯 |

---

## 🏆 PROGRAMMES À INTÉGRER EN PRIORITÉ

### Phase 1 — Plateformes globales (à demander en premier)

| Programme | Marques couvertes | Commission | Cookie | Difficulté |
|-----------|-------------------|------------|--------|------------|
| **Awin** | Massimo Dutti, Ba&sh, Sandro, Maje, Etam, La Redoute, Sézane, Promod, Spartoo… | 3-10% | 30 jours | ⭐⭐ Modérée |
| **Affilae** | Polène, Soeur, Sézane, Officine Générale, Realisation Par, Loulou Studio, jeunes marques FR | 8-15% | 30 jours | ⭐ Facile |
| **Awin** (UK) | ASOS, Selfridges, Net-a-Porter, Mr Porter, Matchesfashion, Farfetch | 3-8% | 30 jours | ⭐⭐ |
| **Rakuten Advertising** | Macy's, Nordstrom, Adidas | 4-12% | 30 jours | ⭐⭐⭐ |
| **Skimlinks** (auto) | 35 000+ marchands automatiquement | 1-8% | Variable | ⭐ Facile |
| **Lemonade** (FR) | Petites marques européennes émergentes | 5-12% | 30 jours | ⭐ |

### Phase 2 — Programmes directs (un par marque)

| Marque | Comment s'inscrire | Commission |
|--------|---------------------|------------|
| **Vinted** | Pas de programme officiel — utiliser leurs liens directs (gratuit, pas de commission) | 0% |
| **Vestiaire Collective** | Affilae | 7% |
| **H&M** | Awin (programme H&M) | 5% |
| **Zara** | Pas de programme — Inditex refuse | 0% |
| **Bershka, Pull&Bear, Stradivarius** | Inditex refuse aussi | 0% |
| **Uniqlo** | Inscription via [g.uniqlo.com](https://g.uniqlo.com) | 6% |
| **Net-a-Porter / Mr Porter** | Awin > YOOX Net-a-Porter Group | 8% |
| **Farfetch** | Programme direct via [farfetch.com/affiliate](https://www.farfetch.com/affiliate-program) | 7% |
| **Mytheresa** | Awin | 8% |
| **SSENSE** | Programme Rakuten | 5% |
| **Amazon (sur Amazon Fashion)** | Amazon Partners (déjà inscrit : `wadastyle-21`) | 4-10% |
| **Polène** | Email direct hello@polene-paris.com (mentionner WADA) | 10-15% |
| **Sézane** | Programme via Affilae ou direct | 8% |
| **Maje, Sandro, Claudie Pierlot** | Awin (groupe SMCP) | 7% |
| **Lemaire, Officine Générale** | Email direct | À négocier |

### Phase 3 — Marques de luxe (plus tard, audience nécessaire)

- **Louis Vuitton, Hermès, Chanel** : pas de programme d'affiliation
- **Gucci, Saint Laurent, Bottega Veneta** : programmes via Skimlinks / Mytheresa
- **Cucinelli, Loro Piana** : programmes directs (à négocier dès 50k visiteurs/mois)

---

## 📧 TEMPLATE EMAIL POUR DEMANDER UN PROGRAMME DIRECT

```
Objet : Demande de partenariat affiliation — WADA × [Marque]

Bonjour [Prénom],

Je m'appelle Nemanja, fondateur de WADA (https://wada.style),
une application web qui propose un dictionnaire de palettes de
couleurs inspiré du livre de Sanzo Wada (1933).

Audience actuelle : [X] visiteurs uniques par mois, principalement
[FR/EU], 25-40 ans, avec un fort intérêt pour la mode éditoriale.

J'ai déjà mis [Marque] en avant sur notre catalogue (page exemple :
https://wada.style/palette/142). Vous arrivez en 4ème position dans
nos clics sortants ce mois-ci.

Je souhaiterais rejoindre votre programme d'affiliation pour
remplacer les liens Google Search actuels par vos liens trackés.

Pouvez-vous m'orienter vers la bonne personne ou la procédure
d'inscription ?

Belle journée,
Nemanja
hello@wada.style
+33 [téléphone]
```

---

## 🛠️ MISE EN PLACE TECHNIQUE

Une fois inscrit à un programme, les liens d'affiliation ressemblent à :
```
https://www.awin1.com/cread.php?awinmid=12345&awinaffid=YOUR_ID&clickref=&p=https%3A%2F%2Fwww.massimodutti.com%2F...
```

**Comment intégrer dans WADA :**

1. **Stocker les IDs d'affiliation dans `.env.local`** :
   ```
   AWIN_PUBLISHER_ID=123456
   AFFILAE_PUBLISHER_ID=789
   AMAZON_PARTNER_ID=wadastyle-21
   ```

2. **Wrapper les URLs dans `lib/data.ts` `shopOptions`** :
   ```typescript
   const awin = (mid: string, target: string) =>
     `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${process.env.NEXT_PUBLIC_AWIN_ID}&p=${encodeURIComponent(target)}`;

   const links = [
     { label: "Massimo Dutti", url: awin("12345", "https://massimodutti.com/...") },
     // ...
   ];
   ```

3. **Fallback gracieux** : si pas d'ID configuré, garder le lien direct ou Google Search.

---

## 📊 TABLEAU DE BORD À CRÉER

Créer un Google Sheet `WADA - Affiliation Tracker` avec colonnes :

| Date | Programme | Marque | Clics | Conversions | Revenus | Notes |
|------|-----------|--------|-------|-------------|---------|-------|
| 2026-05-15 | Awin | Massimo Dutti | 24 | 1 | 8,50 € | Première vente |

**Sources de data :**
- Dashboard Awin (export CSV mensuel)
- Dashboard Affilae
- Amazon Partners report
- Stripe (pour les abonnements WADA+)

---

## 🎯 OBJECTIFS DE REVENUS

| Mois | Visiteurs uniques/mois | Clics sortants/mois | Conversions | Revenus affiliation |
|------|------------------------|---------------------|-------------|---------------------|
| 1-2 | 500 | 200 | 5 | 30 € |
| 3-4 | 2 000 | 800 | 20 | 150 € |
| 6 | 5 000 | 2 000 | 60 | 500 € |
| 12 | 20 000 | 8 000 | 300 | 2 500 € |
| 24 | 50 000 | 20 000 | 800 | 8 000 € |

**Hypothèses :** taux de clic sortant 40%, conversion 2,5%, panier moyen 150€, commission moyenne 8%.

---

## ⚠️ POINTS DE VIGILANCE LÉGAUX

- **Mention obligatoire :** indiquer dans la page Mentions légales et CGV que le site contient des liens d'affiliation. ✅ Déjà fait.
- **Cookies :** les cookies d'affiliation sont traceurs — vérifier conformité RGPD (peut nécessiter consentement si on tracke côté serveur).
- **Comptabilité :** les revenus d'affiliation sont des revenus commerciaux à déclarer (BIC en micro-entreprise, IS si SASU).

---

## ✅ CHECKLIST DE LANCEMENT

### Semaine 1
- [ ] S'inscrire sur **Awin** (validation 7-15 jours)
- [ ] S'inscrire sur **Affilae**
- [ ] S'inscrire sur **Skimlinks** (le plus rapide)
- [ ] Activer **Amazon Partners** (déjà fait : `wadastyle-21`)

### Semaine 2-4
- [ ] Recevoir les approbations
- [ ] Récupérer son Publisher ID pour chaque
- [ ] Stocker dans `.env.local`
- [ ] Mettre à jour `shopOptions` dans `lib/data.ts`
- [ ] Tester les liens : ils doivent rediriger correctement ET tracker

### Mois 2-6
- [ ] Démarcher les jeunes marques en direct (Polène, Sézane, Soeur)
- [ ] Mettre en place le Google Sheet de tracking
- [ ] Reporting mensuel

---

*Document à actualiser tous les 3 mois.*
