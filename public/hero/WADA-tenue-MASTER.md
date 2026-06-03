# WADA — Page Tenue : fichier maître (tout en un, pour le codeur)

Regroupe tous les correctifs de la page tenue / des cartes produit MUJI : **genre, netteté des
photos, cohérence type/registre, variété, présentation**. Classé par priorité. Remplace les fichiers
séparés (variete / rendu-MUJI / photos-en-avant / présentation).

✅ Déjà fait (constaté en live) : visuel généré IA retiré du haut, cartes agrandies, bande de
réassurance (Paiement sécurisé / Achat direct / Prix identique). Ne pas revenir dessus.

---

## P0 — 1. GENRE respecté (bug critique)

Constaté : l'utilisateur choisit **« Homme »** et reçoit un **T-shirt femme, une jupe midi, une
écharpe femme**. Le filtre genre n'est pas appliqué (ni sur /ma-tenue ni sur /stylist).

- Transmettre le genre (Homme/Femme/Unisexe) à **`/api/products` pour CHAQUE slot** et **filtrer
  strictement** : Homme → produits homme + unisexe ; Femme → femme + unisexe. Jamais l'autre genre.
- Respecter le **type selon le genre** : **aucune jupe ni robe** dans une tenue homme.
- Utiliser le champ catégorie MUJI (`Men's …` / `Women's …`) pour le filtre — il est ignoré aujourd'hui.
- Test : demander « Homme » → 100 % des pièces homme ou unisexe.

## P0 — 2. NETTETÉ des photos (images floues)

Constaté : les grandes cartes affichent la vignette **200 px** (`aw_image_url`) agrandie → flou.

- À l'étape de **mirroring vers Vercel Blob**, télécharger depuis **`merchant_image_url`** (CDN MUJI,
  ~1280 px) au lieu de `aw_image_url` (200 px). Le serveur récupère l'image côté serveur → pas de
  hotlink, et on sert la version nette depuis le Blob.
- Repli sur `aw_image_url` si `merchant_image_url` est vide.

---

## P1 — 3. COHÉRENCE type / registre

Constaté : sandales/pantoufles dans une tenue « tailoring net », imperméable/sac de sport en accent.

Ajouter des filtres **type** et **registre** AVANT le tri couleur :
- **haut** = haut (pas une robe) · **bas** = pantalon/jupe selon genre · **veste** = outerwear ·
  **chaussures** = vraies chaussures (exclure pantoufles/mules/sandales d'intérieur hors registre
  détente) · **accent** = ceinture/foulard/petite maroquinerie (pas un sac de sport).
- **Registre** : Classique / Tailoring / Old money → exclure survêtement, jogging, pantoufles, sweat,
  sac de sport, pyjama. Décontracté → casual autorisé.
- Repérer ces sous-types par mots-clés dans `product_name` (« survêtement », « pantoufle », « mule »,
  « sac de sport », « pyjama »…).

## P1 — 4. VARIÉTÉ (mêmes pièces sur toutes les palettes)

Constaté : deux palettes très différentes donnent **exactement les mêmes produits**.

- **Assigner une teinte de la palette à chaque slot** et matcher le produit le plus proche de CETTE
  teinte (plus de couleur générique). Le label couleur doit refléter la **couleur réelle** du produit.
- **Variété** : piocher dans le **top-N plus proches** (8-12) avec un tirage **déterministe par
  (palette + slot + style)** → stable au rechargement, mais différent d'une palette à l'autre.
- Pas de doublon entre slots. Le profil (genre/budget) et les 3 styles changent le pool.
- Test : 3-4 palettes très différentes → tenues visiblement différentes.

---

## P2 — 5. PRÉSENTATION / mise en page des cartes

Constaté : cadrages mélangés, image n'occupant pas toute la carte, hauteurs inégales, trou sur la 5ᵉ pièce.

```css
.piece-card .photo{ width:100%; aspect-ratio:4/5; background:#FBF9F5; overflow:hidden;
  border-radius:16px 16px 0 0; }
.piece-card .photo img{ width:100%; height:100%; object-fit:cover; object-position:center 20%; display:block; }
.piece-card{ border-radius:16px; background:#FBF9F5; box-shadow:0 8px 30px rgba(30,30,30,.06);
  display:flex; flex-direction:column; }
.piece-card .name{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
```
- Toutes les images : **même ratio (3/4 ou 4/5)**, `object-fit:cover`, fond `#FBF9F5`, **edge-to-edge**.
  ⚠️ **L'image doit REMPLIR la carte** (`width:100%` + `cover`). NE PAS utiliser `object-fit:contain`
  ni une petite image centrée → ça laisse de grandes marges vides (constaté en live : photos trop
  petites flottant dans une carte vide). `cover` + source 1280 px = photo grande et nette.
- Nom produit sur **2 lignes max** → hauteurs de cartes identiques.
- Grille : 1ʳᵉ pièce en **vedette pleine largeur** + 4 en 2×2 (ou centrer la 5ᵉ carte seule) ;
  **1 colonne sur mobile**.
- Finitions : coins 16px, ombre légère, hover discret ; conserver la bande de pastilles de palette
  et la hiérarchie carte (rôle·couleur → nom → MUJI → prix → « Acheter sur MUJI »).

---

## Ordre conseillé
1. **Genre** (P0-1) — sinon un homme voit une jupe et part.
2. **Netteté** (P0-2) — `merchant_image_url` haute déf.
3. **Type / registre** (P1-3) puis **Variété** (P1-4).
4. **Présentation** (P2-5).

## Checklist
- [ ] Genre filtré sur tous les slots (homme = 100 % homme/unisexe ; pas de jupe homme)
- [ ] Photos nettes (source `merchant_image_url` ~1280 px mirrorée)
- [ ] Chaussures ≠ sandales/pantoufles, accent ≠ sac de sport (registres habillés)
- [ ] Palettes différentes → tenues différentes (couleur par slot + tirage seedé)
- [ ] Cartes uniformes 4/5, image edge-to-edge, nom 2 lignes, grille propre
