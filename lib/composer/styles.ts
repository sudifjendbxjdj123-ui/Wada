/**
 * lib/composer/styles.ts
 *
 * Brief 2026-06-02 « WADA Composer cohérent » — Spec finale.
 * 10 macro-styles couvrant toute la taxonomie mode (Panaprium).
 *
 * NOTE : Ce type coexiste avec BrandRegistre (8 valeurs basées sur la MARQUE).
 * MacroStyle est basé sur la PIÈCE elle-même (son vibe, son occasion).
 * Un blazer de marque "classique" peut avoir macro_style "academia" ou "soiree"
 * selon son design. Le bridging BrandRegistre → MacroStyle est dans bridgeStyle.ts.
 */

export type MacroStyle =
  | "minimaliste"   // A — clean, tailored, timeless (COS, Lemaire, MUJI)
  | "romantique"    // B — flowy, pastel, lace (Sézane, Sandro)
  | "streetwear"    // C — cozy, relaxed, athleisure (Carhartt, Stüssy, Nike)
  | "boheme"        // D — flowy, layered, eclectic (Isabel Marant)
  | "edgy"          // E — leather, dark, rebel (Acne, All Saints)
  | "academia"      // F — tweed, bookish, preppy (Polo RL, Brooks Brothers)
  | "country"       // G — denim, plaid, rugged (Levi's, Wrangler)
  | "soiree"        // H — sparkle, satin, statement (Rotate, Galvan)
  | "plage"         // I — light, linen, breezy (Zimmermann, Faithfull)
  | "sport";        // J — stretch, technical (Lululemon, On Running)

export const ALL_MACRO_STYLES: MacroStyle[] = [
  "minimaliste", "romantique", "streetwear", "boheme", "edgy",
  "academia", "country", "soiree", "plage", "sport",
];

/** Mots-clés dans le nom produit → détection du macro-style. */
export const STYLE_KEYWORDS: Record<MacroStyle, RegExp> = {
  minimaliste: /\b(clean|tailored|épuré|sobre|basique|essentiel|timeless|straight|slim)\b/i,
  romantique:  /\b(flowy|fluide|dentelle|lace|floral|ruffle|romantique|volant|chiffon)\b/i,
  streetwear:  /\b(hoodie|sweat|jogger|bomber|cargo|cap|snapback|oversize|graphic|logo)\b/i,
  boheme:      /\b(bohème|boho|kimono|crochet|macramé|franges|layered|folk|peasant)\b/i,
  edgy:        /\b(perfecto|cuir|leather|moto|punk|rock|rivet|clouté|biker|studded)\b/i,
  academia:    /\b(tweed|blazer|col\s+roulé|oxord|prep|college|herringbone|elbow)\b/i,
  country:     /\b(denim|plaid|carreaux|western|cowboy|wrangler|flannel|ranch)\b/i,
  soiree:      /\b(paillette|satin|velours|soirée|gala|cocktail|brillant|sparkle|sequin)\b/i,
  plage:       /\b(lin|linen|bain|maillot|beach|surf|tropical|estival|plage|caftan)\b/i,
  sport:       /\b(sport|running|gym|fitness|training|stretch|compression|athletic|performance|nba|nfl|mlb|nhl|mls|football|basketball|baseball|hockey|soccer|bulls|broncos|lakers|dodgers|giants|patriots|braves|yankees|steelers|cowboys|heat)\b/i,
};

/** Couleurs typiques par style (pour le scoring couleur). */
export const STYLE_NEUTRAL_COLORS = new Set([
  "noir", "blanc", "beige", "marine", "gris", "taupe", "crème", "ivoire",
  "écru", "anthracite", "black", "white", "navy", "grey", "gray", "cream",
]);
