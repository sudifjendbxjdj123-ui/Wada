# WADA — Setup iCloud+ Custom Email Domain pour hello@wada.style

Guide complet, étape par étape, pour envoyer ET recevoir depuis hello@wada.style via
iCloud Mail.

**Durée totale** : 30-45 min de manipulation + 15 min à 24h d'attente DNS
**Coût** : 0,99 €/mois (iCloud+ minimum, peut-être déjà chez toi)

---

## Étape 0 — Avant de commencer

**Choses à avoir sous la main** :
- Ton iPhone ou Mac
- Ton ordinateur (recommandé : Mac ou PC pour copier-coller les DNS)
- Tes identifiants iCloud
- Tes identifiants du registrar de wada.style (où tu as acheté le domaine)

**Où as-tu acheté wada.style ?** Si tu ne te souviens plus :
- Cherche dans tes mails (Gmail, iCloud) : `wada.style`, `domain renewal`, `domain registration`
- Vérifie tes relevés bancaires : OVH, Gandi, Namecheap, GoDaddy, Cloudflare, Vercel ?
- Ou tape `who.is/whois/wada.style` dans Google → la page indique le registrar

**Important** : ne fais PAS cette manip 1h avant un événement important. Pendant la transition,
ton email peut être indisponible pendant 15min-1h.

---

## Étape 1 — Vérifier que tu as iCloud+ (2 min)

iCloud+ = la version payante d'iCloud, démarre à 0,99 €/mois.

**Sur iPhone** :
1. Ouvre **Réglages**
2. Tape sur **ton nom** tout en haut
3. Tape sur **iCloud**
4. Regarde ce qui s'affiche :
   - Si tu vois **« Gérer le stockage de compte »** avec « iCloud+ » → tu l'as déjà ✅
   - Si tu vois juste **« 5 Go »** → tu es sur le gratuit, faut upgrader

**Si tu n'as pas iCloud+** :
1. Dans la même page → **« Mettre à niveau vers iCloud+ »**
2. Choisis **« 50 Go pour 0,99 €/mois »** (le tier minimum)
3. Confirme avec Face ID / Touch ID
4. C'est activé immédiatement

---

## Étape 2 — Ajouter wada.style comme domaine personnalisé (5 min)

**Sur Mac** (plus pratique pour copier les DNS ensuite) :
1. Ouvre **Safari**
2. Va sur **icloud.com**
3. Connecte-toi avec ton Apple ID
4. Clique sur ton **avatar/initiales** en haut à droite
5. Clique sur **« Paramètres iCloud »** ou **« Gérer mon Apple ID »**
6. Dans la barre latérale, va à **« iCloud Mail »** puis **« Domaine personnalisé »**

**Ou sur iPhone** :
1. **Réglages** → **ton nom** → **iCloud** → **iCloud Mail**
2. Tape sur **« Domaine personnalisé »**

7. Clique sur **« Ajouter un domaine »**
8. Choisis **« Vous uniquement »** (sauf si tu veux partager avec une équipe — tu peux ajouter
   des gens plus tard)
9. Tape **wada.style** dans le champ
10. Confirme

---

## Étape 3 — Créer les adresses email (5 min)

Apple va te demander quelles adresses tu veux créer sur wada.style.

**Ajoute toutes ces adresses d'un coup** (l'ajout ultérieur est aussi possible) :

```
hello@wada.style       → adresse principale
contact@wada.style     → formulaire de contact site
support@wada.style     → service client / questions abonnés
presse@wada.style      → journalistes mode
partners@wada.style    → marques affiliées (Net-a-Porter, Sezane…)
factu@wada.style       → factures Stripe, Vercel, Awin
newsletter@wada.style  → expéditeur de la Lettre du dimanche
nem@wada.style         → ton perso WADA
```

**Astuce** : Apple permet **un nombre illimité d'adresses** sur ton domaine. Ne sois pas
radin — chaque alias t'aide à filtrer/trier ce qui arrive.

---

## Étape 4 — Récupérer les DNS records d'Apple (2 min)

Une fois les adresses ajoutées, Apple t'affiche **un écran avec 5-6 enregistrements DNS** que
tu dois ajouter chez ton registrar.

Ils ressembleront à :

```
TYPE    NOM            VALEUR                                              PRIORITÉ
MX      @              mx01.mail.icloud.com                                10
MX      @              mx02.mail.icloud.com                                10
TXT     @              "apple-domain=Hd83lk2j9KLm0qzY"                     —
TXT     @              "v=spf1 include:icloud.com ~all"                    —
TXT     sig1._domainkey "v=DKIM1; k=rsa; p=MIGfMA0GC..."                   —
```

**Garde cette page ouverte** dans un onglet, tu vas avoir besoin de copier ces valeurs.

---

## Étape 5 — Aller chez ton registrar (5 min)

Va sur le site de ton registrar (OVH, Gandi, Namecheap, Cloudflare, Vercel, Google Domains, etc.)
et connecte-toi.

Cherche dans le menu :
- **« Domaines »** ou **« Mes domaines »**
- Sélectionne **wada.style**
- Trouve **« DNS »**, **« Zone DNS »**, **« DNS Management »**, ou **« Gérer la zone DNS »**

Le terme exact varie selon le registrar — mais c'est toujours dans la gestion du domaine.

---

## Étape 6 — Supprimer les anciens enregistrements MX (3 min) ⚠️

C'est l'étape **critique**. Avant d'ajouter les nouveaux MX d'Apple, tu dois **supprimer**
ceux qui font fonctionner le forwarding actuel vers ton iCloud perso.

**Comment les identifier** : ce sont les enregistrements de type **MX** qui pointent vers
autre chose que `mx01.mail.icloud.com` et `mx02.mail.icloud.com`.

Selon ton registrar, ils peuvent pointer vers :
- `forwarding.registrar.com` ou similaire
- `mailcheap.com`
- `mx.improvmx.com`
- `cloudflare.com`
- Etc.

**Avant de les supprimer** :
1. **Prends une capture d'écran** de TOUS tes enregistrements DNS actuels (pour pouvoir revenir
   en arrière en cas de problème)
2. Note précieusement les valeurs au cas où

**Action** : supprime UNIQUEMENT les enregistrements de type **MX**. **NE TOUCHE PAS** aux
autres (A, AAAA, CNAME, TXT existants — sauf instruction explicite ci-dessous).

---

## Étape 7 — Ajouter les enregistrements Apple (10 min)

Maintenant tu ajoutes un par un les enregistrements qu'Apple t'a donnés.

### Enregistrement 1 — Premier MX

| Champ | Valeur |
|---|---|
| Type | MX |
| Nom / Host | @ (ou laisse vide, ou tape `wada.style`) |
| Valeur / Cible | mx01.mail.icloud.com |
| Priorité | 10 |
| TTL | Auto / 3600 |

### Enregistrement 2 — Deuxième MX

| Champ | Valeur |
|---|---|
| Type | MX |
| Nom / Host | @ |
| Valeur | mx02.mail.icloud.com |
| Priorité | 10 |
| TTL | Auto / 3600 |

### Enregistrement 3 — Vérification Apple (TXT)

| Champ | Valeur |
|---|---|
| Type | TXT |
| Nom / Host | @ |
| Valeur | apple-domain=XXXXXXX (la valeur exacte affichée par Apple) |
| TTL | Auto |

### Enregistrement 4 — SPF (TXT)

⚠️ **Vérifie s'il existe déjà un SPF record (commence par `v=spf1`)** sur ton domaine. Si oui,
tu le **modifies** au lieu d'en ajouter un nouveau.

| Champ | Valeur |
|---|---|
| Type | TXT |
| Nom / Host | @ |
| Valeur | v=spf1 include:icloud.com include:_spf.resend.com ~all |
| TTL | Auto |

Note : j'ai inclus aussi `_spf.resend.com` pour que tes mails transactionnels Resend
continuent à fonctionner. C'est important !

### Enregistrement 5 — DKIM (TXT)

| Champ | Valeur |
|---|---|
| Type | TXT |
| Nom / Host | sig1._domainkey |
| Valeur | (toute la chaîne v=DKIM1... qu'Apple affiche) |
| TTL | Auto |

⚠️ La valeur DKIM est **très longue** (200+ caractères). Copie-la **en entier** sans
espaces ni retours à la ligne.

### Enregistrement 6 — DMARC (recommandé, à ajouter à la main)

Ce n'est pas dans la liste Apple mais c'est important pour la délivrabilité :

| Champ | Valeur |
|---|---|
| Type | TXT |
| Nom / Host | _dmarc |
| Valeur | v=DMARC1; p=quarantine; rua=mailto:hello@wada.style |
| TTL | Auto |

---

## Étape 8 — Sauvegarder et attendre (15min à 24h)

1. Sauvegarde tous les nouveaux enregistrements chez ton registrar
2. Retourne sur la page Apple « Domaine personnalisé »
3. Clique sur **« Vérifier »** ou **« Terminer »**

**Délai de propagation DNS** :
- En général : **15-30 minutes**
- Maximum : **24 heures** (rare)

Si la vérification échoue immédiatement, **attends 30 min puis réessaie**. C'est normal.

**Comment tester manuellement** :
- Va sur **mxtoolbox.com**
- Tape `wada.style` → vérifie les MX records
- Tu dois voir `mx01.mail.icloud.com` et `mx02.mail.icloud.com`
- Si tu vois encore les anciens MX → DNS pas encore propagé, attends

---

## Étape 9 — Configurer l'app Mail (5 min)

Une fois Apple validé le domaine :

**Sur iPhone** :
1. Ouvre l'app **Mail**
2. Tap sur **« Boîtes »** en haut à gauche
3. Tu dois voir ton compte iCloud
4. **Composer un nouveau mail** → tap sur le champ **« De »** (From)
5. Tu peux maintenant choisir hello@wada.style comme expéditeur

**Sur Mac** :
1. Ouvre **Mail**
2. **Composer** un nouveau message
3. Dans le champ **« De »** (From), choisis hello@wada.style

**Régler hello@wada.style comme expéditeur PAR DÉFAUT** :
- **Mac Mail** → Préférences → Composition → « Envoyer le nouveau courrier depuis » → choisir hello@wada.style
- **iPhone Mail** : Réglages → Mail → Compte par défaut → choisir hello@wada.style

---

## Étape 10 — Tests de validation (5 min)

### Test 1 — Envoyer un mail
1. Compose un nouveau mail depuis hello@wada.style
2. Envoie-toi à ton Gmail perso ou ton iCloud perso
3. Vérifie que :
   - L'expéditeur est bien `hello@wada.style` (pas ton iCloud perso)
   - Le mail arrive **en boîte de réception** (pas en spam)
   - Le contenu est intact

### Test 2 — Recevoir un mail
1. Depuis ton Gmail perso, envoie un mail à `hello@wada.style`
2. Vérifie qu'il arrive dans ton iCloud Mail
3. Idéalement, dans un dossier séparé « WADA » (à configurer)

### Test 3 — Vérifier les autres alias
1. Envoie un mail à `contact@wada.style` depuis ton Gmail
2. Vérifie qu'il arrive aussi dans la même boîte
3. Répète pour `presse@`, `partners@`, etc.

### Test 4 — Vérifier que Resend marche toujours
1. Va sur **resend.com/domains**
2. Vérifie que `wada.style` est toujours en statut « Verified »
3. Sinon, les nouveaux SPF/DKIM ont peut-être cassé Resend → tu dois re-vérifier le domaine
4. Test : depuis ton site WADA, déclenche un mail transactionnel (signup test, mot de passe oublié, etc.) → vérifie qu'il arrive

---

## Étape 11 — Configurer Mail comme un pro (15 min, optionnel)

### Signature professionnelle

**Mac** : Mail → Préférences → Signatures → Nouveau

```
Nemanja Milošević
Fondateur, WADA

348 palettes. 348 tenues.
wada.style · @wada.style sur Instagram

Genève
```

**iPhone** : Réglages → Mail → Signature → « Par compte » → choisir hello@wada.style → écrire
la signature.

### Filtres / Règles automatiques

**Mac Mail** : Préférences → Règles → Ajouter une règle

Exemples utiles :
- Si destinataire = partners@wada.style → marquer « Partenaires » + couleur verte
- Si destinataire = presse@wada.style → marquer « Presse » + son spécial
- Si destinataire = factu@wada.style → archiver auto + marquer « Factures »
- Si destinataire = newsletter@wada.style → ignorer (c'est juste pour l'envoi)

### Réponse automatique de lancement

**Sur Mac** :
1. Mail → Préférences → Règles → Ajouter une règle
2. Description : « Réponse auto WADA »
3. Conditions : « Destinataire » contient « @wada.style »
4. Actions : « Répondre au message » → écrire :

```
Bonjour,

Merci pour ton message — il est bien arrivé chez WADA.

Je traite chaque mail personnellement, je te réponds sous 24-48h.

À très vite,
Nemanja
```

---

## Étape 12 — Sécuriser (5 min, CRITIQUE)

### Active la 2FA sur Apple ID

Si pas déjà actif :
1. Réglages iPhone → ton nom → Connexion et sécurité
2. Active **« Identification à deux facteurs »**
3. Note ton **numéro de téléphone de confiance**
4. Conserve les codes de récupération dans **Bitwarden**

Ton Apple ID est maintenant la **clé maître** de tout ton WADA — il faut la protéger comme telle.

### Vérifie SPF/DKIM/DMARC

Va sur **mxtoolbox.com** :
1. Onglet **« SuperTool »** → tape `wada.style`
2. Vérifie :
   - **SPF** : valid ✅
   - **DKIM** (sélecteur sig1) : valid ✅
   - **DMARC** : valid ✅
3. Si une erreur → relis l'étape 7 et corrige

---

## En cas de problème

### Mes mails sortants vont en spam

→ Vérifie SPF/DKIM/DMARC via mxtoolbox.com
→ Attends 24-48h supplémentaires pour la réputation domain
→ Évite les mots-clés spammy (« gratuit », « cliquez ici », « URGENT »)

### Apple refuse de valider le domaine

→ Vérifie que les MX pointent bien vers Apple via mxtoolbox.com
→ L'enregistrement TXT « apple-domain= » doit être exact (copier-coller sans modif)
→ Attends 30 min de plus puis recommence

### Je ne reçois plus rien

→ Tes MX records sont peut-être mal configurés
→ Restaure tes anciens MX records (la capture d'écran de l'étape 6 !)
→ Réessaie l'étape 7 en suivant méticuleusement

### Resend ne fonctionne plus

→ Va sur resend.com/domains → re-vérifie le domaine
→ Si SPF est cassé, modifie-le pour ajouter `include:_spf.resend.com`
→ DKIM Resend (resend._domainkey) doit toujours être présent

### Comment annuler et revenir en arrière

→ Restaure les MX records d'origine (capture d'écran de l'étape 6)
→ Supprime hello@wada.style dans iCloud Custom Domain
→ Le forwarding initial reprend après 15-30 min

---

## Récapitulatif des actions

```
✅ Étape 1 — Vérifier iCloud+ (2 min)
✅ Étape 2 — Ajouter wada.style dans iCloud (5 min)
✅ Étape 3 — Créer les 8 adresses (5 min)
✅ Étape 4 — Noter les DNS Apple (2 min)
✅ Étape 5 — Aller chez ton registrar (5 min)
✅ Étape 6 — Supprimer anciens MX + screenshot (3 min) ⚠️
✅ Étape 7 — Ajouter 6 enregistrements DNS (10 min)
✅ Étape 8 — Sauvegarder et attendre (15 min - 24h)
✅ Étape 9 — Configurer Mail iPhone/Mac (5 min)
✅ Étape 10 — Tester (5 min)
✅ Étape 11 — Polish (signature, filtres, etc.) (15 min)
✅ Étape 12 — Sécurité (2FA + audit) (5 min)
```

**Total temps actif** : ~60 min
**Total temps avec attente DNS** : 1h-24h

---

## Une fois fait

Tu peux écrire à :
- **Net-a-Porter**, **Sezane**, **ASOS** depuis `partners@wada.style` (très pro)
- **Vogue**, **Numéro**, **Beaux Arts** depuis `presse@wada.style`
- Tes premiers clients depuis `hello@wada.style`
- Tes mails de facturation arrivent triés sur `factu@wada.style`

Tu as une **infrastructure mail digne d'une marque pro**, pour 0,99 €/mois.

---

Tu peux faire ça demain matin café à la main, 1h chrono. Si tu bloques à une étape, tu me dis
laquelle et je te débloque.

Bonne nuit Nem.
