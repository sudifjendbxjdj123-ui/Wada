# WADA × MUJI — Intégration du flux produits Awin (pour le codeur)

Objectif : afficher les vêtements MUJI (photo, nom, couleur, prix) sur WADA, avec un bouton
« Acheter » qui pointe vers le **lien d'affiliation tracké** (commission éditeur 2879911).

Source : flux Awin **Create-a-Feed**, MUJI France (advertiser 84713), langue FR.
Format : CSV (UTF-8), séparateur `,` (ou `|`), compression gzip. ~3 746 produits, tous en stock, EUR.

---

## 1. URLs

- **Liste des flux** (pour savoir QUAND re-télécharger, via `last_updated`) :
  `https://ui.awin.com/productdata-darwin-download/publisher/2879911/<clé>/1/feedList`
- **Flux produit** : l'« URL de téléchargement manuelle » donnée à la dernière étape de
  Create-a-Feed (à coller ici par Nem). Elle contient l'ID éditeur 2879911 + l'ID de flux.
  → Télécharger le `.csv.gz`, décompresser, parser.

Mise à jour : 1×/jour suffit (le flux est régénéré quotidiennement, `last_updated` le confirme).

---

## 2. Colonnes du flux → champs WADA

| Champ WADA            | Colonne Awin                         | Note |
|-----------------------|--------------------------------------|------|
| `id`                  | `aw_product_id`                      | identifiant stable Awin |
| `variant_id`          | `merchant_product_id`                | varie par taille |
| `title`               | `product_name`                       | |
| `description`         | `description`                        | |
| `brand`               | `brand_name` (souvent vide) → "MUJI" | mettre "MUJI" par défaut |
| `price`               | `search_price` + `currency`          | ex. 34.95 EUR |
| `price_display`       | `display_price`                      | déjà formaté |
| `image`               | `aw_image_url`                       | 200×200, détouré fond blanc |
| `thumb`               | `aw_thumb_url`                       | 70×70 |
| `colour_name`         | `colour`                             | en français (ex. « Bleu Marine Foncé ») |
| `category`            | `category_name`                      | ex. « Men's Tops » |
| `buy_url`             | `aw_deep_link`                       | **lien tracké** — ne jamais réécrire |
| `in_stock`            | `in_stock` / `is_for_sale`           | 1 = afficher |
| `updated_at`          | `last_updated`                       | pour la synchro |

`merchant_product_category_path` est **vide** dans ce flux → se fier à `category_name`.

---

## 3. Dédoublonnage (important)

Le flux liste **une ligne par taille** (3 746 lignes ≈ 386 modèles × couleurs × tailles).
- **Produit affichable** = regrouper par `(product_name, colour)` → 1 carte.
- Les tailles deviennent une liste d'options sous le produit (chaque `merchant_product_id`
  = une taille ; garder `in_stock` par taille si dispo plus tard).
- Pour la carte : prendre la 1re ligne du groupe (photo, prix, lien identiques au sein du groupe).

→ ~1 210 cartes uniques au total.

---

## 4. Filtrer « vêtements uniquement »

Toutes les `category_name` de ce flux sont déjà des vêtements :
`Men's/Women's Tops, Trousers, Outerwear, Footwear, Accessories, Dresses & Skirts,
Underwear, Nightwear`.
- Garder tout pour le catalogue, OU exclure `Underwear` / `Nightwear` de l'affichage public
  si vous voulez rester « tenue de ville ».
- Mapper les catégories EN → FR pour l'UI (table dans le générateur de démo).

---

## 5. Couleur → accord Sanzo Wada (le cœur de WADA)

1. `colour` (FR) → **hex** : table de correspondance par mots-clés (gérer les modificateurs
   « clair / foncé / cendré / pâle » et les motifs « Rayures / Carreaux / Motifs » = teinte de
   base + drapeau `pattern`). Une table de départ (~120 nuances → hex) est fournie dans
   `gen_muji_demo2.py` (fonction `color_to_hex`).
2. hex → **Lab**, puis **ΔE2000** vers chaque couleur des 348 accords → garder l'accord le plus proche.
3. Stocker sur le produit : `palette_ref` (ex. No. 094) + `palette_distance`.
→ Permet : « montre-moi les pièces MUJI qui vont avec cet accord » et le matching de l'assistant IA.

---

## 6. Images

- `aw_image_url` = 200×200 (suffisant en grille carrée ; c'est ce qu'utilise la démo).
- ⚠️ L'URL contient une clé `k=…` qui peut **signer** les paramètres : ne pas réécrire `w`/`h`
  à l'aveugle (risque d'image cassée). Pour du plus grand, **régénérer le flux** avec une taille
  d'image plus grande, ou **proxy/cache** côté WADA (recommandé : télécharger + servir depuis votre
  CDN, ça évite les ruptures si MUJI change une URL).
- Toujours `loading="lazy"` + `alt` = nom du produit.

---

## 7. Lien d'achat & conformité

- Bouton « Acheter sur MUJI » → `aw_deep_link`, avec
  `target="_blank" rel="noopener nofollow sponsored"`.
- **Divulgation d'affiliation obligatoire** : mention visible (« Liens partenaires — WADA peut
  toucher une commission »), cf. page Affiliation.
- Ne jamais reconstruire le lien soi-même : le `aw_deep_link` porte déjà l'ID éditeur + tracking.

---

## 8. Import — squelette Python (cron quotidien)

```python
import csv, gzip, io, urllib.request

FEED_URL = "https://…/manual-download-url.csv.gz"   # URL Create-a-Feed (à remplir)

def fetch_rows(url):
    raw = urllib.request.urlopen(url, timeout=60).read()
    data = gzip.decompress(raw).decode("utf-8")
    return list(csv.DictReader(io.StringIO(data)))

def to_product(group):                 # group = lignes même (name,colour)
    r = group[0]
    return {
        "id": r["aw_product_id"],
        "title": r["product_name"],
        "brand": r["brand_name"] or "MUJI",
        "price": float(r["search_price"]), "currency": r["currency"],
        "image": r["aw_image_url"], "thumb": r["aw_thumb_url"],
        "colour_name": r["colour"],
        "category": r["category_name"],
        "buy_url": r["aw_deep_link"],
        "sizes": [g["merchant_product_id"] for g in group],
        "in_stock": any(g["in_stock"] == "1" for g in group),
        # "hex": color_to_hex(r["colour"]), "palette_ref": nearest_wada(hex),
    }

rows = fetch_rows(FEED_URL)
groups = {}
for r in rows:
    if r.get("is_for_sale") != "1":          # ou in_stock
        continue
    groups.setdefault((r["product_name"], r["colour"]), []).append(r)
products = [to_product(g) for g in groups.values()]
# upsert(products) dans la base WADA, puis mapper couleur → accord Sanzo Wada
```

## 9. Page Tenue / résultat — AFFICHER LA PHOTO (et non un aplat de couleur)

Actuellement, sur la page d'une tenue, chaque pièce montre un **bloc de couleur de la palette**
+ un prix factice « ~55 € ». C'est un placeholder. À remplacer par les vraies données produit :

Pour chaque emplacement (Haut, Bas, Veste, Chaussures, Accent) :
1. Le moteur de tenue choisit un **vrai produit** (MUJI via le flux, sinon repli Amazon).
2. **Remplacer le bloc de couleur en haut de la carte par la PHOTO du produit** (`image_local`,
   l'image hébergée par WADA — cf. §6). Garder la pastille de couleur en petit, à côté du nom.
3. Remplacer « ~55 € » par le **vrai prix** (`search_price` + `currency`).
4. Remplacer le nom générique (« Chemise oxford ») par le **vrai nom produit** du flux.
5. Bouton « Acheter » = `aw_deep_link` (lien MUJI tracké). Si pas de produit MUJI pour ce slot,
   garder le repli Amazon (recherche) — mais sans photo produit dans ce cas.

Résultat attendu : la carte affiche photo réelle + vrai nom + vraie couleur + vrai prix + bouton d'achat.
Tant que cette étape n'est pas faite, c'est NORMAL de voir des aplats de couleur et « ~55 € ».

Réf. associées : `wada-amazon-repli-snippet.md` (repli Amazon quand pas de produit MUJI),
`wada-recherche-vetements.md` (matching pièce ↔ produit), `wada-page-affiliation.html` (divulgation).
