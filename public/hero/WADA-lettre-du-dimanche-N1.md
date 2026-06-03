# WADA — Lettre du dimanche · Édition #1 (template + premier numéro)

La "Lettre du dimanche" est ta newsletter hebdomadaire. Envoyée chaque dimanche soir vers
**19h-20h** (heure où les gens lisent leurs emails personnels et planifient leur semaine).

Ce document contient :
1. La **structure type** (à réutiliser pour chaque édition)
2. Le **premier numéro complet** prêt à envoyer

---

## Structure type d'une "Lettre du dimanche"

Chaque numéro suit ce squelette en 5 sections, ~5 minutes de lecture :

```
1. INTRO COURTE — une phrase d'ambiance, une émotion, un fait du moment.
2. LA PALETTE — UNE palette mise en avant cette semaine + son histoire.
3. LA TENUE — UN look composé autour de cette palette, 5 pièces, achetables.
4. LA RÉFÉRENCE CULTURELLE — un livre, film, lieu, œuvre lié à la palette.
5. LA CITATION FINALE — une phrase courte, mémorable, qui résume l'esprit.

P.S. — un petit mot personnel, optionnel.
```

Ton : calme, cultivé, jamais commercial. Comme une amie styliste qui partage ce qu'elle a aimé
cette semaine. Pas de "OFFRES SPÉCIALES !", pas de boutons "ACHETEZ MAINTENANT !", pas de
points d'exclamation.

---

## Édition #1 — version prête à envoyer

### Objet de l'email (3 options à tester)

```
Option A (poétique) : Dimanche · Pluie de Tokyo
Option B (curieux) :  Une palette qu'on regarde rarement
Option C (intime) :   La lettre #1, et pourquoi ça commence ici
```

Mon préféré : **A**. Court, calme, intrigant.

### Pre-header (visible dans l'aperçu de la boîte mail)

```
Trois couleurs sourdes, une silhouette urbaine, un livre à offrir.
```

### Corps du mail

---

**Dimanche · Pluie de Tokyo**

Bonjour,

C'est le premier numéro de la *Lettre du dimanche*. Une fois par semaine, je vous écrirai
depuis Genève pour partager une palette du dictionnaire de Sanzo Wada, la tenue qu'elle me
suggère, une référence qui me fait penser à elle, et une citation que je garde dans un carnet.

Pas de promotion, pas de bons plans. Juste une lecture lente, à boire avec ce qui reste de
votre café du dimanche.

---

**和田 No. 037 — Pluie de Tokyo**

Trois teintes qui parlent à voix basse.

Un bleu pierre profond, un cuir naturel chaud, un vermillon presque éteint. Sanzo Wada
l'a publiée en 1933, dans la troisième planche de son dictionnaire. Il l'appelait simplement
*pluie urbaine* — l'idée que les couleurs d'une ville sous la pluie tournent au sourd, au
mat, au respiré.

C'est une palette qui ne crie pas. Le bleu reste contenu, le cuir réchauffe sans appeler
l'attention, le vermillon n'est qu'un point. Trois couleurs qui s'écoutent.

[Voir la palette sur wada.style → 和田 No. 037]

---

**La tenue de la semaine — Casual chic urbain**

Cinq pièces, pensées pour un quotidien qui glisse entre le bureau, le café et la rue.

— **Le haut** : un pull col rond en laine fine, ton cuir naturel. Brunello Cucinelli.
  C'est la pièce qui réchauffe tout.

— **Le bas** : un pantalon droit en laine, bleu pierre. Tom Ford. Coupé pour tomber bien
  sur le mocassin.

— **La veste** : une surchemise oversize, bleu nuit. AMI Paris. Portée ouverte la plupart
  du temps.

— **Les chaussures** : des Boston en suède brun. Birkenstock. Vous direz que c'est étonnant
  pour une tenue habillée — c'est précisément l'idée. Le confort qui rend l'élégance
  vivable.

— **L'accent** : un foulard fin en laine, ton vermillon profond. MUJI. Une seule touche
  forte, le reste reste calme.

Total autour de **1 500 €**. Une vraie tenue à porter trois ou quatre fois par semaine,
sans s'en lasser.

[Voir la tenue complète et acheter les pièces sur wada.style →]

---

**La référence — "Le pays des illuminations" de Junichiro Tanizaki**

Si vous ne l'avez jamais lu, *Éloge de l'ombre* tient en cinquante pages et change la
manière dont on regarde une pièce. Tanizaki y défend l'idée que la beauté japonaise n'est
pas dans le brillant mais dans la patine, l'ombre, le sourd. Exactement ce que cette
palette met en images.

À lire un dimanche soir, à la lampe basse.

---

**Une citation — pour la semaine qui commence**

> *« Il faut s'habiller pour être oublié. »*
> — Christian Lacroix

---

P.S. — Si vous lisez ce premier numéro, c'est probablement parce que vous me connaissez ou
parce que vous avez cliqué très tôt sur WADA. Merci. Le projet en est à ses débuts. Si vous
avez une réaction, une critique, une suggestion, répondez simplement à ce mail — j'écris ces
lettres moi-même, je vous lirai.

À dimanche prochain.

— Nemanja
Genève

---

[Désabonnement] · [Mes favoris] · [Mon compte] · wada.style

---

## Mise en page email — recommandations techniques

### Service d'envoi
**Resend** est le mieux pour démarrer. Gratuit jusqu'à 100 emails/jour, 3 000/mois. Bonne
délivrabilité. Templates HTML simples. API propre pour ton codeur.

### Format
- **Largeur** : 600px maximum (standard email)
- **Police** : Inter pour le corps, Fredoka pour les titres (chargées depuis Google Fonts)
- **Couleurs** : fond crème `#f4eee4`, texte `#2a2521`, accents bordeaux `#6e3b32`
- **Images** : 1 max — l'image de la palette (3 swatches juxtaposés)
- **Liens** : soulignés en bordeaux, jamais en bleu
- **Boutons** : pas de gros boutons CTA agressifs. Juste des liens textes.

### Code HTML simplifié

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f4eee4; color: #2a2521; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    h2 { font-family: Fredoka, Arial, sans-serif; font-weight: 500; }
    a { color: #6e3b32; text-decoration: underline; }
    .palette-swatches { display: flex; gap: 4px; margin: 20px 0; }
    .palette-swatches i { flex: 1; height: 60px; border-radius: 4px; }
    .signature { color: #8c8377; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- contenu de la lettre -->
  </div>
</body>
</html>
```

### Boutons de désabonnement
RGPD oblige : un lien de désabonnement en pied de chaque email. Resend l'ajoute
automatiquement, mais vérifie que c'est visible.

---

## Calendrier éditorial — les 8 premières lettres

Pour gagner du temps les prochains dimanches, voici une **structure de 8 semaines** :

| Sem. | Palette en avant | Référence culturelle | Thème |
|---|---|---|---|
| 1 | Pluie de Tokyo | Tanizaki — Éloge de l'ombre | Le sourd élégant |
| 2 | Brume du matin | Sofia Coppola — Marie-Antoinette | Le doux scandinave |
| 3 | Bal au Palais | Visconti — Le Guépard | Le doré italien |
| 4 | Murmure d'Anvers | Margiela — la maison blanche | Le minimaliste belge |
| 5 | Osaka au thé | Hokusai — La grande vague | Le japonais sourd |
| 6 | Crépuscule sur Nara | Kawabata — Pays de neige | L'écru et le silence |
| 7 | Le Caire au printemps | Edward Said — Out of Place | Le terracotta urbain |
| 8 | Rosée du matin | Brassaï — Paris la nuit | Le gris bleu parisien |

Une thématique par semaine, jamais répétée. Ça structure ton année éditoriale.

---

## Stratégie de croissance

### Comment construire ta liste d'abonnés (sans pub)

1. **Bouton d'inscription clair** sur la home et le footer wada.style.
2. **Pop-up délicat** au 2ᵉ scan d'une couleur (pas dès l'arrivée — c'est intrusif).
3. **Footer du site** : "Recevez la Lettre du dimanche" avec un champ email simple.
4. **Mention dans chaque post Instagram / TikTok** : "Plus de palettes chaque dimanche → wada.style/lettre"
5. **Pied du mail de bienvenue** quand un client crée un compte WADA.

### Métrique cible
- **Taux d'ouverture** : 35-50% (très bon pour une newsletter mode lifestyle)
- **Taux de clic** : 5-10%
- **Taux de désabonnement** : < 1%

Si tes chiffres sont en-dessous, c'est probablement le ton (trop commercial) ou la fréquence
(jamais plus d'une fois par semaine).

---

## Conclusion

Cette lettre est ce qui transforme WADA d'**un site qu'on visite parfois** en **un rendez-vous
hebdomadaire**. C'est la rétention la plus solide qu'un site éditorial puisse construire.

Envoie le premier numéro **le dimanche 7 juin à 19h**, à 5-10 amis pour test. Si ça leur plaît,
mets en place la liste publique et démarre la collecte d'emails.

À ta première dimanche.
