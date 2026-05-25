# WADA — Email pro hello@wada.style : état LIVE (mai 2026)

> Document de référence après mise en service. Mis à jour le 25 mai 2026.
> **Toute future modif email/DNS doit lire ce fichier d'abord.**

---

## TL;DR — Ce qui est en place et qui marche

**`hello@wada.style`** est une **adresse pro qui reçoit pour de vrai**.
Tout email envoyé à `hello@wada.style` (ou n'importe quel autre alias créé)
est **forwardé** vers la boîte iCloud personnelle du fondateur :

```
Quelqu'un → hello@wada.style → ImprovMX → nemanjamilosevic@icloud.com
```

- **Coût** : 0 €/mois (ImprovMX Free tier)
- **Limite** : 25 alias gratuits, 10 emails/heure (suffisant pour le démarrage)
- **Setup** : terminé, propagé, testé
- **Pas de boîte autonome à surveiller** : tout arrive dans iCloud Mail
- **Pas de Zoho** : abandonné en cours de route (token verification orphelin
  supprimé des DNS)

---

## Architecture complète

| Brique | Provider | Où on gère |
|---|---|---|
| **Domaine `wada.style`** | Namecheap | https://ap.www.namecheap.com → Domain List |
| **DNS** (carnet d'adresses du domaine) | Namecheap | Domain → Advanced DNS |
| **Hébergement site** | Vercel | Records A `@` 216.198.79.1 + CNAME `www` |
| **Email forward** | ImprovMX | https://improvmx.com/dashboard |
| **Email destination** | iCloud Mail | nemanjamilosevic@icloud.com |
| **Email transactionnel** (newsletter, etc.) | Resend (SDK installé, clé API à poser) | dans le code, cf. `lib/newsletterEmail.ts` |

---

## DNS de wada.style — état actuel

À vérifier à tout moment via :
```bash
nslookup -type=MX wada.style 8.8.8.8
nslookup -type=TXT wada.style 8.8.8.8
nslookup -type=A wada.style 8.8.8.8
```

**Records des animateurs (Host Records)** sur Namecheap :

| Type | Host | Value | Rôle |
|---|---|---|---|
| A | @ | 216.198.79.1 | Site Vercel (wada.style → page d'accueil) |
| CNAME | www | cname.vercel-dns.com. | Site Vercel (www.wada.style) |
| TXT | @ | `v=spf1 include:spf.improvmx.com ~all` | SPF, autorise ImprovMX à envoyer pour le domaine |

**Paramètres du courrier — MX personnalisé** sur Namecheap :

| Type | Host | Value | Priority |
|---|---|---|---|
| MX | @ | mx1.improvmx.com | 10 |
| MX | @ | mx2.improvmx.com | 20 |

**Records supprimés en cours de setup** (ne pas réintroduire) :
- ❌ 5 anciens MX `eforward1-5.registrar-servers.com` (forward natif Namecheap, désactivé)
- ❌ TXT `zoho-verification=zb19196957.zmverify.zoho.eu` (tentative Zoho abandonnée)
- ❌ TXT `v=spf1 include:spf.efwd.registrar-servers.com ~all` (SPF Namecheap, remplacé)

---

## Aliases actifs sur ImprovMX

Dashboard : https://improvmx.com/dashboard → wada.style

| Alias | Forward to | Statut |
|---|---|---|
| `hello@wada.style` | nemanjamilosevic@icloud.com | ✅ Actif |

**Pour ajouter d'autres aliases** (gratuit jusqu'à 25 au total) :
- Connexion ImprovMX → wada.style → champ « Nouveau pseudonyme »
- Exemples utiles : `contact@`, `support@`, `partenaires@`, `presse@`, `legal@`,
  `noreply@` (utile pour les futurs envois Resend)

---

## Ce qui marche aujourd'hui

- ✅ **Recevoir** tout email envoyé à hello@wada.style
- ✅ **Forwarder** automatiquement vers iCloud
- ✅ **Mentions légales / contact / footer / FAQ / CGV / etc.** du site pointent
  tous sur `hello@wada.style` (cf. code : la chaîne est cherchée partout dans
  `app/` et `components/`)

## Ce qui ne marche PAS encore (à faire si besoin)

### 1. Envoyer DEPUIS `hello@wada.style`

Aujourd'hui c'est juste du forward. Pour répondre à un partenaire et que son
client mail voie `hello@wada.style` dans le champ « From », il faut :

**Option A — SMTP ImprovMX (limite 10 mails/jour, plan Free)**
1. ImprovMX dashboard → wada.style → onglet **« SMTP »** → générer un mot de passe
2. Mail iCloud (sur Mac) ou iPhone Mail → ajouter un compte → SMTP :
   - Serveur : `smtp.improvmx.com`
   - Port : `587` (STARTTLS)
   - Login : `hello@wada.style`
   - Password : celui généré à l'étape 1

**Option B — SMTP Resend (plus généreux, 3 000 mails/mois free)**
- Nécessite d'abord la **vérification de domaine dans Resend** (DKIM, DMARC, etc.)
- Une fois fait, brancher Mail iCloud sur :
  - Serveur : `smtp.resend.com`
  - Port : `465` (SSL)
  - Login : `resend`
  - Password : `RESEND_API_KEY`

### 2. Activer vraiment la Newsletter du dimanche

Le code est en place (cf. tasks #72, fichiers `lib/newsletterStore.ts`,
`lib/newsletterEmail.ts`, routes `/api/newsletter/{subscribe,confirm,unsubscribe}`).
Pour qu'elle envoie réellement :

1. **Créer un compte Resend** → https://resend.com → onglet **Domains** → ajouter `wada.style`
2. Resend te donnera **3 records DNS** à ajouter sur Namecheap (DKIM + Return-Path) :
   - 1× CNAME `resend._domainkey` → `<token>.dkim.amazonses.com`
   - 1× TXT (Return-Path / bounce)
   - 1× MX ou TXT pour le retour SPF
   ⚠️ Ces records s'ajoutent EN PLUS de ceux d'ImprovMX, sans les remplacer.
3. **Fusionner le SPF** : remplacer la valeur actuelle `v=spf1 include:spf.improvmx.com ~all` par :
   ```
   v=spf1 include:spf.improvmx.com include:amazonses.com ~all
   ```
   (Un seul SPF par domaine, sinon les deux s'invalident.)
4. **Poser sur Vercel** les env vars :
   - `RESEND_API_KEY` = clé du compte Resend
   - `RESEND_FROM` = `WADA <hello@wada.style>` (ou `noreply@wada.style` si tu
     veux séparer les transactionnels des mails humains)
5. **Redeploy** Vercel (les env vars sont lues côté serveur, le code se met à jour
   automatiquement → sendConfirmation et sendWelcome envoient pour de vrai).

### 3. DMARC (durcissement délivrabilité)

Pas indispensable mais fortement recommandé une fois l'envoi actif. Ajouter
dans Namecheap → Advanced DNS :

| Type | Host | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@wada.style; pct=100` |

`p=none` au début (mode monitoring, ne rejette rien). On peut durcir en
`p=quarantine` puis `p=reject` une fois confirmé que tout envoi légitime passe.

---

## Tests de vérification (à lancer en cas de doute)

```bash
# 1. Les MX pointent bien sur ImprovMX
nslookup -type=MX wada.style 8.8.8.8
# Attendu : mx1.improvmx.com (10), mx2.improvmx.com (20). Aucun eforward.

# 2. Le SPF est unique et correct
nslookup -type=TXT wada.style 8.8.8.8 | grep spf1
# Attendu : 1 seul record `v=spf1 include:spf.improvmx.com ~all`

# 3. Le site est intact
curl -sI https://www.wada.style | head -3
# Attendu : HTTP/2 200

# 4. Test bout-en-bout : envoyer un mail à hello@wada.style depuis n'importe
# quelle adresse (gmail, etc.) → il doit arriver dans nemanjamilosevic@icloud.com
# dans la minute, max 2 min.
```

---

## Points de fragilité à surveiller

1. **ImprovMX expire-t-il les comptes inactifs ?** Vérifié leur ToS : non, tant
   qu'on se logge au moins une fois par an. Loguer dans le dashboard ≥ 1 fois
   par an pour être tranquille.
2. **Limite 10 mails/heure** : si on commence à envoyer des invitations
   partenaires en masse depuis `hello@wada.style`, on se fait throttle. Soit
   on échelonne, soit on passe sur ImprovMX Premium (9 $/mo) ou Resend SMTP.
3. **Si on change Namecheap → autre registrar** : penser à porter les records
   ImprovMX (MX + SPF) sur le nouveau DNS. ImprovMX accepte n'importe quel DNS
   tant que les MX pointent sur leurs serveurs.
4. **Si on quitte Vercel** : penser à mettre à jour le record A `@` et le
   CNAME `www`. Les emails ne sont PAS impactés (MX gérés séparément).

---

## Historique des tentatives

- **mai 2026 — Zoho** : tentative abandonnée. Le token de vérification
  `zoho-verification=zb19196957.zmverify.zoho.eu` a été posé puis le setup
  interrompu. Token supprimé des DNS le 25 mai 2026.
- **mai 2026 — Namecheap email forwarding** : forwarding natif activé par défaut
  à l'achat du domaine. Désactivé le 25 mai 2026 (passage en « Custom MX »).
- **25 mai 2026 — ImprovMX** : compte créé, domaine vérifié, alias `hello` actif,
  test bout-en-bout réussi. **C'est l'état actuel.**

---

## Liens utiles

- ImprovMX dashboard : https://improvmx.com/dashboard
- Namecheap DNS : https://ap.www.namecheap.com → wada.style → Manage → Advanced DNS
- Vérification SPF en ligne : https://mxtoolbox.com/SuperTool.aspx?action=spf%3awada.style
- Vérification MX en ligne : https://mxtoolbox.com/SuperTool.aspx?action=mx%3awada.style
- Guide complet original : `guide_email_forward_wada.md`
- Code newsletter (Resend) : `lib/newsletterStore.ts`, `lib/newsletterEmail.ts`,
  `app/api/newsletter/`
