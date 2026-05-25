# Forward `hello@wada.style` vers Gmail (gratuit, sans Zoho) — guide pas à pas

**Objectif :** tout email envoyé à `hello@wada.style` (et n'importe quel autre alias
`*@wada.style`) arrive dans **ta boîte Gmail personnelle**. Tu n'as pas de boîte à
gérer côté wada.style — c'est juste un transfert.

**Outil retenu :** [ImprovMX](https://improvmx.com) — gratuit, plan "Free" permet
**25 alias illimités**, 10 emails/heure, transfert vers n'importe quelle adresse.
Pas de carte bleue à donner, pas d'enregistrement de compte obligatoire (mais
recommandé pour le dashboard).

> Alternatives équivalentes si ImprovMX ne te plaît pas :
> - **ForwardEmail.net** — open-source, même principe, gratuit.
> - **Cloudflare Email Routing** — gratuit aussi, mais demande de migrer les
>   nameservers du domaine sur Cloudflare (plus de friction).

---

## Étape 0 — Où sont les DNS de wada.style ?

Le forward = ajouter 2 enregistrements DNS (1 MX + 1 TXT/SPF). Il faut savoir
chez qui modifier la zone DNS :

- **Domaine acheté chez OVH / Gandi / Namecheap / Hostinger** → DNS chez eux.
- **Domaine acheté chez Vercel directement** → DNS chez Vercel
  (dashboard.vercel.com → wada.style → Settings → Domains → DNS Records).
- **Tu ne sais plus** → fais un `whois wada.style` ou va sur
  https://www.whois.com/whois/wada.style → champ "Registrar".

Garde l'onglet DNS ouvert, tu y reviens à l'étape 3.

---

## Étape 1 — Crée un compte ImprovMX (optionnel mais recommandé)

1. Va sur https://improvmx.com
2. Clique **« Get started »** en haut à droite.
3. Crée un compte avec ton Gmail perso (celui où tu veux recevoir).
4. Skip toutes les invites payantes — le free tier suffit largement.

> Sans compte, tu peux quand même configurer le forward depuis la page d'accueil
> en tapant juste le domaine + email destination, mais tu n'auras pas de
> dashboard pour modifier les alias plus tard.

---

## Étape 2 — Ajoute le domaine `wada.style` à ImprovMX

Dans le dashboard ImprovMX :

1. **« Add a new domain »** → tape `wada.style`.
2. ImprovMX te montre les enregistrements DNS à ajouter (cf. étape 3).
3. Configure le premier alias :
   - **Alias :** `hello`
   - **Forward to :** ton Gmail perso (ex. `tonprenom@gmail.com`)
4. Tu peux ajouter d'autres alias tout de suite (gratuit jusqu'à 25) :
   - `contact` → ton Gmail
   - `support` → ton Gmail
   - `partners` → ton Gmail
   - ou un **catch-all `*`** qui forward TOUS les emails non-définis.

---

## Étape 3 — Ajoute les enregistrements DNS

Va dans la console DNS de wada.style (chez Vercel / OVH / Gandi / ...).

**Supprime d'abord tout ancien enregistrement MX** (s'il y en a un de Zoho ou
d'un essai précédent — ils entrent en conflit).

Puis ajoute exactement ceci :

| Type | Host / Nom | Valeur                                                    | Priorité | TTL  |
|------|------------|-----------------------------------------------------------|----------|------|
| MX   | `@` (ou vide / `wada.style`) | `mx1.improvmx.com`                          | **10**   | Auto |
| MX   | `@` (ou vide / `wada.style`) | `mx2.improvmx.com`                          | **20**   | Auto |
| TXT  | `@` (ou vide / `wada.style`) | `v=spf1 include:spf.improvmx.com ~all`      | —        | Auto |

> **⚠️ SPF :** si tu as DÉJÀ un enregistrement SPF (par exemple parce que tu
> utilises Resend pour la newsletter), ne crée pas un 2e enregistrement
> séparé — fusionne dans le SPF existant :
>
> ```
> v=spf1 include:spf.improvmx.com include:resend.com ~all
> ```
>
> Un seul SPF par domaine, c'est la règle. Plusieurs = tout invalide.

---

## Étape 4 — Vérifie

Revenir dans ImprovMX, clique **« Verify »** sur le domaine. La propagation DNS
prend de 5 minutes à quelques heures (rarement plus de 30 min).

Une fois vert, **teste** :

1. Depuis ton tél / une boîte tierce, envoie un mail à `hello@wada.style`.
2. Le mail doit arriver dans ta Gmail perso, avec ImprovMX comme intermédiaire
   (visible dans les en-têtes).

---

## Étape 5 — (Bonus) Pouvoir RÉPONDRE depuis `hello@wada.style`

Le forward te fait **recevoir**. Pour **envoyer** depuis `hello@wada.style`
(répondre à un client, écrire à un partenaire), 2 options :

### Option A — Gmail "Send as" + SMTP ImprovMX (gratuit jusqu'à 10/jour)

Le plan Free ImprovMX inclut le **SMTP sortant limité à 10 emails/jour**.

1. Dans ImprovMX dashboard → ton domaine → onglet **« SMTP »** → génère un
   mot de passe SMTP.
2. Dans Gmail → ⚙ Paramètres → **Comptes** → **« Ajouter une autre adresse
   e-mail »** :
   - Nom : `WADA`
   - Adresse : `hello@wada.style`
   - Décoche « Traiter comme alias ».
3. SMTP suivant :
   - Serveur : `smtp.improvmx.com`
   - Port : `587`
   - Login : `hello@wada.style`
   - Password : celui généré à l'étape 1
   - TLS activé
4. Gmail envoie un code de confirmation → vérifie → c'est bon.

Désormais quand tu réponds, choisis l'expéditeur `hello@wada.style` dans le menu.

### Option B — SMTP via Resend (que tu utilises déjà pour la newsletter)

Si tu veux **plus de 10 emails/jour** sortants, branche Gmail sur SMTP Resend :
- Serveur : `smtp.resend.com`
- Port : `465`
- Login : `resend`
- Password : ta `RESEND_API_KEY`

Plan gratuit Resend = 3 000 emails/mois, largement suffisant.

> ⚠️ Pour que Resend laisse envoyer comme `hello@wada.style`, il faut **vérifier
> le domaine wada.style dans Resend** (DKIM + DMARC). C'est un peu plus long mais
> ça verrouille la délivrabilité et c'est ce dont la newsletter aura besoin
> de toute façon.

---

## Récap final

| Action | Où | Effet |
|---|---|---|
| 2 MX + 1 TXT (SPF) ImprovMX | Console DNS wada.style | hello@wada.style → ton Gmail |
| Alias `hello` dans ImprovMX | Dashboard improvmx.com | Mapping email |
| (Optionnel) Send-as Gmail + SMTP | Gmail Settings | Pouvoir répondre comme hello@wada.style |

**Temps total :** 10-15 min, propagation incluse.
**Coût :** 0 €.
**À renouveler :** rien, c'est durable tant qu'ImprovMX existe (et ils existent
depuis 2017, fondés en France, profitable).

---

## Et le guide Zoho alors ?

Le fichier `guide_email_pro_wada.md` reste dans le projet pour référence, mais
ce guide-ci (forward) est la voie recommandée pour ton cas :
- Tu lis tes mails dans Gmail (interface que tu connais déjà)
- Aucune nouvelle inbox à surveiller
- 0 € au lieu de "Forever Free" Zoho qui peut devenir payant si tes besoins
  changent (tu paies dès le 6e utilisateur ou si tu veux IMAP/POP).
