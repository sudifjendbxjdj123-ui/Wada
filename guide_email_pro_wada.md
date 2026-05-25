# Créer hello@wada.style avec Zoho Mail (gratuit) — guide pas à pas

Objectif : disposer d'une vraie boîte mail professionnelle **hello@wada.style**, gratuite,
hébergée chez Zoho Mail (plan « Forever Free » : 1 domaine, 5 Go, jusqu'à 5 utilisateurs).

Durée : ~20 min de manipulation + 1 à 24 h de propagation DNS.

> ⚠️ **À lire avant de commencer.** Les valeurs MX / SPF / DKIM dépendent du **centre de
> données** que Zoho t'attribue à l'inscription (Europe, US, Inde…). Ce guide donne les
> valeurs **Europe** (recommandé depuis la Suisse). **Vérifie toujours les valeurs exactes
> affichées dans ta console Zoho** (Admin Console → Domains → DNS Mapping / Email
> Configuration) : ce sont elles qui font foi.

---

## Étape 0 — Trouver où sont gérés les DNS de wada.style

C'est l'étape la plus importante : les enregistrements DNS doivent être ajoutés **là où
pointent les serveurs de noms (nameservers)** du domaine, pas forcément là où tu l'as acheté.

Le site WADA est déployé sur **Vercel**. Deux cas possibles :

- **Cas A — les DNS sont chez Vercel** (domaine acheté via Vercel, ou nameservers délégués à
  Vercel). → Tu ajouteras les enregistrements dans Vercel : *Project → Settings → Domains*,
  ou *vercel.com → ton compte → Domains → wada.style → DNS Records*.
- **Cas B — les DNS sont chez ton registrar** (OVH, Gandi, Namecheap, GoDaddy, Infomaniak…).
  → Tu ajouteras les enregistrements dans l'espace DNS de ce registrar.

**Comment savoir ?** Fais un « nameserver lookup » sur https://www.zoho.com/toolkit/ns-lookup.html
(ou whois). Si les NS contiennent `vercel-dns.com` → Cas A. Sinon → Cas B (le nom du
fournisseur apparaît).

C'est dans cet espace-là que se passeront toutes les étapes DNS ci-dessous.

---

## Étape 1 — Créer le compte Zoho et ajouter le domaine

1. Va sur https://www.zoho.com/mail/ et choisis le plan **Forever Free** (tout en bas de la
   page des tarifs : « Forever Free Plan »). Inscris-toi.
2. Pendant l'inscription, choisis l'option **« Add an existing domain »** (et non « acheter un
   nouveau domaine »).
3. Saisis **wada.style**.
4. Sélectionne le **centre de données Europe** si l'option t'est proposée (cohérent avec une
   base en Suisse, RGPD).

---

## Étape 2 — Vérifier la propriété du domaine (enregistrement TXT/CNAME)

Zoho va te demander de prouver que le domaine t'appartient. Il te fournit **une valeur unique**
(propre à ton compte) à ajouter en DNS. La méthode TXT est la plus simple.

Dans ton espace DNS (Cas A ou B de l'étape 0), ajoute :

| Type | Nom / Host | Valeur | TTL |
|------|------------|--------|-----|
| TXT  | @ (ou wada.style) | `zoho-verification=zbXXXXXXXX.zmverify.zoho.eu` *(copie la valeur EXACTE depuis Zoho)* | Auto / 3600 |

Puis, dans Zoho, clique **« Verify ».** (Si ça échoue, attends 10-30 min : la propagation DNS
prend un peu de temps.)

---

## Étape 3 — Créer la boîte hello@wada.style

Une fois le domaine vérifié, Zoho propose de créer le premier compte.

- Crée l'utilisateur **hello** → l'adresse devient **hello@wada.style**.
- Note bien le mot de passe : c'est ta boîte principale.

> Astuce : tu peux ensuite ajouter des **alias** gratuits sur cette même boîte
> (ex. contact@, support@) sans consommer d'utilisateur : *Admin Console → Users → hello →
> Mail Accounts → Add Email Alias*.

---

## Étape 4 — Recevoir les e-mails : enregistrements MX

C'est ce qui dirige le courrier entrant vers Zoho. **Supprime d'abord tout ancien
enregistrement MX** existant pour éviter les conflits, puis ajoute :

| Type | Nom / Host | Valeur (serveur) | Priorité |
|------|------------|------------------|----------|
| MX   | @ (ou vide) | `mx.zoho.eu`  | 10 |
| MX   | @ (ou vide) | `mx2.zoho.eu` | 20 |
| MX   | @ (ou vide) | `mx3.zoho.eu` | 50 |

> 🇺🇸 Si Zoho t'a placé sur le **centre de données US**, remplace par `mx.zoho.com`,
> `mx2.zoho.com`, `mx3.zoho.com` (mêmes priorités). **Vérifie dans la console Zoho.**

---

## Étape 5 — Envoyer proprement : SPF, DKIM, DMARC

Ces trois enregistrements TXT évitent que tes mails partent en spam et que ton domaine soit
usurpé. **Fortement recommandés.**

### SPF
| Type | Nom / Host | Valeur |
|------|------------|--------|
| TXT  | @ (ou wada.style) | `v=spf1 include:zoho.eu ~all` |

> (Centre de données US : `v=spf1 include:zoho.com ~all`.) S'il existe déjà un SPF, ne crée
> pas un 2e enregistrement : fusionne le `include:zoho.eu` dans l'existant.

### DKIM
La valeur DKIM est **générée par Zoho et propre à ton compte**. Dans
*Admin Console → Domains → wada.style → DKIM*, clique **Add** : Zoho t'affiche un sélecteur
(souvent `zmail` ou `1525…`) et une longue clé publique.

| Type | Nom / Host | Valeur |
|------|------------|--------|
| TXT  | `zmail._domainkey` *(le sélecteur exact donné par Zoho)* | `v=DKIM1; k=rsa; p=MIGfMA0...` *(la clé exacte donnée par Zoho)* |

Ensuite, reviens dans Zoho et clique **Verify** sur le DKIM.

### DMARC (optionnel mais conseillé)
| Type | Nom / Host | Valeur |
|------|------------|--------|
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@wada.style; fo=1` |

> `p=none` = mode observation (aucun mail bloqué, tu reçois juste des rapports). Une fois sûr
> que tout est bon, tu pourras passer à `p=quarantine` puis `p=reject`.

---

## Étape 6 — Vérifier et utiliser

1. Attends la propagation (souvent < 1 h, jusqu'à 24 h max).
2. Contrôle les enregistrements avec https://www.zoho.com/toolkit/ (MX Lookup, DNS Lookup).
3. Envoie un e-mail de test **depuis** une autre adresse **vers** hello@wada.style, et un
   **depuis** hello@wada.style vers une Gmail → vérifie qu'il n'atterrit pas en spam.
4. Accès à la boîte :
   - Web : https://mail.zoho.eu (ou mail.zoho.com selon le DC)
   - Mobile : application **Zoho Mail** (iOS / Android)
   - Client classique (Apple Mail, Outlook) : possible, mais **IMAP/POP n'est pas inclus dans
     le plan gratuit** — l'accès se fait surtout via le web et l'app Zoho.

---

## Récapitulatif des enregistrements DNS (centre de données Europe)

| Type | Nom / Host | Valeur | Priorité |
|------|------------|--------|----------|
| TXT  | @ | `zoho-verification=…zmverify.zoho.eu` *(propre à toi)* | — |
| MX   | @ | `mx.zoho.eu`  | 10 |
| MX   | @ | `mx2.zoho.eu` | 20 |
| MX   | @ | `mx3.zoho.eu` | 50 |
| TXT  | @ | `v=spf1 include:zoho.eu ~all` | — |
| TXT  | `zmail._domainkey` | `v=DKIM1; k=rsa; p=…` *(propre à toi)* | — |
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@wada.style; fo=1` | — |

---

## Notes importantes

- **Le site fonctionne déjà avec hello@wada.style** (affichée comme contact + dans le balisage
  JSON-LD du layout). Cette config rend cette adresse réellement opérationnelle.
- **Formulaire de contact du site :** si /contact envoie un mail vers hello@wada.style depuis
  un hébergeur, vérifie qu'il route bien en « remote / externe » (sinon le mail peut être
  livré localement et ne jamais arriver dans Zoho).
- **Ne garde qu'un seul fournisseur de mail** : si d'anciens MX existent (registrar, autre
  service), supprime-les pour éviter les conflits de livraison.
- **Valeurs exactes = console Zoho.** Ce guide donne le schéma ; les chaînes de vérification
  et la clé DKIM sont générées spécifiquement pour ton compte.
