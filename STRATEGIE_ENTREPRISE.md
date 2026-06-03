# 🏢 SETUP ENTREPRISE — WADA

*Document opérationnel — mai 2026*

---

## 🎯 OBJECTIF

Mettre en place la structure juridique, bancaire et comptable la plus simple possible pour facturer Stripe, déclarer l'affiliation et payer les charges légales.

---

## ⚖️ STATUT JURIDIQUE — QUE CHOISIR ?

### Option A — **Micro-entreprise** ⭐ Recommandé pour démarrer

| Avantages | Inconvénients |
|-----------|---------------|
| ✅ Création gratuite en 10 min sur autoentrepreneur.urssaf.fr | ❌ Plafond CA : 77 700 € (services BIC mixte) |
| ✅ Comptabilité ultra-simple (livre des recettes) | ❌ Pas de TVA récupérable (vous ne facturez pas TVA, pas de récup non plus) |
| ✅ Cotisations sociales : 21,2% du CA encaissé seulement | ❌ Pas de déduction des frais (logiciels, hébergement, etc.) |
| ✅ Pas d'IS, vous gardez tout (impôt sur le revenu) | ❌ Si gros CA + nombreux frais → désavantageux |
| ✅ Versement libératoire option (1,7%) si revenus < seuil | |

**Pour WADA :** parfait tant que CA < 77 700 €/an (soit ~6 400 €/mois).
Au-delà, basculer en SASU.

### Option B — **SASU** (pour plus tard, si scaling)

| Avantages | Inconvénients |
|-----------|---------------|
| ✅ Pas de plafond CA | ❌ Création coûteuse (300-1 000 € avec un comptable) |
| ✅ TVA récupérable | ❌ Compta complète (bilan, compte de résultat) — comptable obligé (~1 800 €/an) |
| ✅ Image plus pro pour partenariats | ❌ Cotisations sociales seulement sur la rémunération versée |
| ✅ Possible de se verser des dividendes | ❌ Plus de paperasse (statuts, AG annuelle…) |

**Quand basculer ?** Quand vous dépassez 50 000 €/an de revenus + avez des frais déductibles importants.

---

## 📝 CRÉATION D'UNE MICRO-ENTREPRISE — ÉTAPE PAR ÉTAPE

### 1. Préparer les infos
- Pièce d'identité
- Justificatif de domicile (- de 3 mois)
- IBAN d'un compte bancaire (perso ou pro)

### 2. S'inscrire en ligne
URL : **https://www.autoentrepreneur.urssaf.fr** (ou via Guichet Unique)

Renseigner :
- **Activité principale** : "Edition de logiciels applicatifs et services informatiques en ligne"
- **Code APE** : 6312Z (Portails internet) ou 5821Z (Edition de jeux et logiciels système)
- **Activité secondaire** : "Intermédiation en commerce" (pour l'affiliation)
- **Nom commercial** : WADA
- **Date de début d'activité** : J+0 (effet immédiat)

### 3. Recevoir le SIRET (5-10 jours ouvrés)

### 4. Activer le compte URSSAF
- Configurer la déclaration trimestrielle ou mensuelle
- **Choisir versement libératoire** si revenus < 27 478 € (2024). C'est 1,7% au lieu d'IR à 11% sur cette tranche.

### 5. Mettre à jour les Mentions légales WADA
Remplacer `[à compléter après immatriculation]` par votre vrai SIRET dans `app/mentions/page.tsx` et `app/cgv/page.tsx`.

---

## 🏦 COMPTE BANCAIRE PRO

**Obligation :** uniquement si CA > 10 000 €/an pendant 2 ans consécutifs. **Mais fortement recommandé** dès le départ pour séparer.

### Comparatif

| Banque | Frais | Avantages | Inconvénients |
|--------|-------|-----------|---------------|
| **Qonto** | 9 €/mois | Compta intégrée, IBAN FR, super UX | Le plus cher |
| **Shine** | 7,90 €/mois | Inclus assurances, simple | UX moyenne |
| **Hello Bank Pro** | 10,50 €/mois | BNP derrière, fiable | Banque traditionnelle |
| **N26 Business Standard** | Gratuit | IBAN allemand (peut bloquer Stripe) | Pas optimal pour FR |
| **Revolut Business** | Gratuit (Free) | Multi-devises | Compte UK, peut compliquer |

**Recommandation :** **Qonto Solo** à 9 €/mois. Tout est intégré (Stripe, factures, exports compta).

---

## 💼 OUTILS COMPTA — INDISPENSABLES

### Pour micro-entreprise

| Outil | Prix | Usage |
|-------|------|-------|
| **Tiime** | Gratuit (basique) | Facturation + pré-compta |
| **Indy** | 12 €/mois | Compta auto (lit les transactions bancaires) |
| **Henrri** | Gratuit | Devis, factures, suivi |

**Recommandation :** **Indy** pour automatiser au max.

### Documents à conserver pendant 10 ans (obligation légale)
- Factures Stripe (mensuelles)
- Relevés affiliation (Awin, Affilae, etc.)
- Factures de frais (hébergement Vercel, domaine, outils)
- Relevés bancaires

---

## 💸 FISCALITÉ — CE QU'IL FAUT DÉCLARER

### Mensuellement / Trimestriellement
- **URSSAF** (cotisations sociales) : déclarer le CA encaissé sur autoentrepreneur.urssaf.fr → paiement automatique de 21,2%

### Annuellement
- **Déclaration de revenus 2042-C-PRO** (mai)
- Reporter le CA total dans la case BIC (régime micro-BIC, abattement 50% appliqué automatiquement)

### Cotisation foncière des entreprises (CFE)
- Exonération la première année
- Ensuite : ~225 €/an minimum à payer en décembre

---

## 📊 SIMULATION DE REVENUS NETS

### Hypothèse : 30 000 € de CA / an (Stripe + affiliation)

| Poste | Montant |
|-------|---------|
| **CA brut** | 30 000 € |
| Cotisations URSSAF (21,2% du CA) | -6 360 € |
| Versement libératoire IR (1,7%) | -510 € |
| Frais d'outils (Vercel, Qonto, Indy, domain…) | -600 € |
| **Net en poche** | **22 530 €** soit ~1 880 €/mois |

### Hypothèse : 70 000 € de CA / an (cap micro)

| Poste | Montant |
|-------|---------|
| **CA brut** | 70 000 € |
| URSSAF | -14 840 € |
| Versement libératoire | -1 190 € |
| Frais | -1 200 € |
| **Net** | **52 770 €** soit ~4 400 €/mois |

→ À ce stade, basculer en SASU pour optimiser.

---

## 🛡️ ASSURANCES UTILES

### RC Pro (Responsabilité Civile Professionnelle)
- Couvre les dommages causés à un client (ex : recommandation d'achat erronée)
- ~150-300 €/an
- Recommandée si vous monétisez via abonnement

### Cyber-assurance
- Couvre piratage, vol de données
- ~200-400 €/an
- Pas obligatoire mais utile si Stripe + données clients

**Comparateurs :** Hiscox, Acheel, Wakam, Stello.

---

## 📜 OBLIGATIONS RGPD CONCRÈTES

Vous traitez des données personnelles (newsletter, Stripe). À mettre en place :

1. ✅ **Politique de confidentialité** : déjà sur `wada.style/confidentialite`
2. ✅ **Mentions légales** : déjà sur `wada.style/mentions`
3. **Registre des traitements** (PDF interne, à demander si contrôle CNIL)
4. **DPA avec Stripe** (signé automatiquement à la création du compte)
5. **DPA avec Vercel** (signé automatiquement)

---

## ✅ CHECKLIST DE LANCEMENT

### Semaine 1
- [ ] S'inscrire sur autoentrepreneur.urssaf.fr
- [ ] Choisir versement libératoire IR
- [ ] Ouvrir compte Qonto Solo (5 jours)
- [ ] Lier le compte Qonto à Stripe
- [ ] Mettre à jour Mentions légales WADA avec SIRET

### Semaine 2-4
- [ ] Recevoir SIRET (5-10 jours)
- [ ] S'inscrire sur Indy (12 €/mois)
- [ ] Configurer numérotation factures (auto via Stripe)
- [ ] Souscrire RC Pro (Hiscox, ~200 €/an)

### Mois 2
- [ ] Première déclaration URSSAF mensuelle (même si CA = 0)
- [ ] Vérifier que les cotisations sont prélevées

---

## 🆘 RESSOURCES UTILES

- **URSSAF micro :** https://www.autoentrepreneur.urssaf.fr
- **Guichet Unique :** https://procedures.inpi.fr
- **Service-Public Pro :** https://entreprendre.service-public.fr
- **Comparateur banques pro :** https://www.bpifrance-creation.fr
- **Communauté Indie Hackers FR :** https://discord.gg/indiehackers-fr
- **Bpifrance création :** support gratuit pour créateurs

---

*Document à actualiser après création effective de la structure.*
