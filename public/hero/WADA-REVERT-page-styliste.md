# REVERT — Page Styliste

## Demande

**Annule la refonte de la page `/styliste` que tu viens d'implémenter.**
**Restaure la version qui existait avant.**

La version actuelle (« Composons votre tenue. » avec placeholder vide à droite) **ne convient
pas**. On revient en arrière.

---

## Comment procéder

### Option 1 — Git revert (recommandée)

Si la version précédente est dans Git :

```bash
git log app/styliste/page.tsx
# Identifier le commit AVANT la refonte
git revert <commit-hash-de-la-refonte>
# Ou checkout le fichier au commit précédent
git checkout <commit-précédent> -- app/styliste/page.tsx
```

Pareil pour tous les fichiers créés pour la refonte :
- `app/styliste/page.tsx`
- `components/styliste/StylisteContent.tsx`
- `components/styliste/StylisteHero.tsx`
- `components/styliste/BackButton.tsx`
- `components/styliste/StylisteTitle.tsx`
- `components/styliste/IntroCard.tsx`
- `components/styliste/QuickChips.tsx`
- `components/styliste/PromptInput.tsx`
- `components/styliste/StylisteFeatures.tsx`

### Option 2 — Suppression manuelle

Si Git ne fonctionne pas ou la version précédente est perdue :

1. **Supprime** tous les fichiers du dossier `components/styliste/` que tu viens de créer
2. **Restaure** `app/styliste/page.tsx` à l'ancienne version (avant cette refonte)
3. **Supprime** les images générées qui ne servent plus :
   - `/public/hero/styliste-flatlay-cream-minimaliste.jpg`
   - `/public/hero/styliste-inspiration-avatar.jpg`
4. **Supprime** la table DB `daily_inspirations` si tu l'as créée
5. **Supprime** l'endpoint `/api/styliste/start` si tu l'as créé

### Option 3 — Si la version précédente n'existe plus

Si vraiment tu ne peux pas retrouver l'ancienne version, **dis-le-moi** directement plutôt que
d'essayer de la reconstruire. On verra ensemble quoi faire.

---

## À retenir

Ce qui ne va pas dans la version actuelle :
- L'image flat lay à droite est juste un placeholder beige avec « 和田 FLAT LAY ÉDITORIAL » écrit
  dessus — vide, sans contenu
- L'overlay « Inspiration du jour » montre du texte mais sans contexte visuel
- Le rendu général paraît inachevé / brouillon

On préfère retrouver la version qui existait avant, qui était fonctionnelle.

---

## Une fois reverté

Confirme-moi simplement :

```
✅ Page /styliste restaurée à version précédente
```

On reprendra la refonte plus tard, mieux préparée, avec une vraie image hero (pas un
placeholder).

---

## Priorité

Cette revert est à faire **avant tout autre développement**.

Toutes les autres tâches en cours (boutique, navigation, etc.) peuvent attendre 30 minutes
le temps de remettre /styliste dans son état stable.

Merci.
