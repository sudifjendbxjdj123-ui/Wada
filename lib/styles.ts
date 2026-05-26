// ════════════════════════════════════════════════════════════════════════
// WADA — Design Tokens (Relume export 2026-05-12 + esprit éditorial WADA)
// ════════════════════════════════════════════════════════════════════════
//
// Cette refonte adopte le système de schemes Relume tout en préservant
// le vocabulaire historique WADA (ink, paper, seal). Les pages anciennes
// continuent de fonctionner via les alias legacy (lignes 2-10) ; les
// nouvelles pages utilisent les tokens scheme-driven (lignes 22+).
//
// ════════════════════════════════════════════════════════════════════════

// ─── Tokens legacy (compatibilité avec les pages existantes) ────────────
export const ink = "var(--wada-ink)";
export const paper = "var(--wada-paper)";
export const subtle = "var(--wada-subtle)";
export const accent = "var(--wada-accent)";
export const seal = "var(--wada-seal)";
export const border = "var(--wada-border)";
export const textSecondary = "var(--wada-text-secondary)";
export const cardBg = "var(--wada-card-bg)";
export const cardBgStrong = "var(--wada-card-bg-strong)";

// ─── Nouveau système Relume : 4 schemes + palettes thématiques ─────────

// Neutres — gamme 0→7 (clair → sombre)
export const neutral0 = "var(--wada-neutral-0)";
export const neutral1 = "var(--wada-neutral-1)";
export const neutral2 = "var(--wada-neutral-2)";
export const neutral3 = "var(--wada-neutral-3)";
export const neutral4 = "var(--wada-neutral-4)";
export const neutral5 = "var(--wada-neutral-5)";
export const neutral6 = "var(--wada-neutral-6)";
export const neutral7 = "var(--wada-neutral-7)";

// Plum — accent secondaire (gardé en backup)
export const plum1 = "var(--wada-plum-1)";
export const plum2 = "var(--wada-plum-2)";
export const plum3 = "var(--wada-plum-3)";
export const plum4 = "var(--wada-plum-4)";
export const plum5 = "var(--wada-plum-5)";
export const plum6 = "var(--wada-plum-6)";
export const plum7 = "var(--wada-plum-7)";

// Mojo — terracotta-brique, NOUVEAU accent primaire WADA v2
// (#C44E3A — issu du nouvel export Relume basé sur wada-woad.vercel.app)
export const mojo      = "var(--wada-mojo-4)";
export const mojoSoft  = "var(--wada-mojo-1)";
export const mojoDark  = "var(--wada-mojo-6)";

// Cream Can — jaune doré
export const creamCan1 = "var(--wada-cream-can-1)";
export const creamCan2 = "var(--wada-cream-can-2)";
export const creamCan3 = "var(--wada-cream-can-3)";
export const creamCan4 = "var(--wada-cream-can-4)";
export const creamCan5 = "var(--wada-cream-can-5)";
export const creamCan6 = "var(--wada-cream-can-6)";
export const creamCan7 = "var(--wada-cream-can-7)";

// Chateau Green — vert
export const green1 = "var(--wada-green-1)";
export const green2 = "var(--wada-green-2)";
export const green3 = "var(--wada-green-3)";
export const green4 = "var(--wada-green-4)";
export const green5 = "var(--wada-green-5)";
export const green6 = "var(--wada-green-6)";
export const green7 = "var(--wada-green-7)";

// Wasabi
export const wasabi1 = "var(--wada-wasabi-1)";
export const wasabi2 = "var(--wada-wasabi-2)";
export const wasabi3 = "var(--wada-wasabi-3)";
export const wasabi4 = "var(--wada-wasabi-4)";
export const wasabi5 = "var(--wada-wasabi-5)";
export const wasabi6 = "var(--wada-wasabi-6)";
export const wasabi7 = "var(--wada-wasabi-7)";

// Tokens scheme-driven
export const schemeBg     = "var(--scheme-bg)";
export const schemeFg     = "var(--scheme-fg)";
export const schemeText   = "var(--scheme-text)";
export const schemeAccent = "var(--scheme-accent)";
export const schemeBorder = "var(--scheme-border)";

// UI tokens
export const buttonRadius = "var(--wada-button-radius)";
export const tagRadius    = "var(--wada-tag-radius)";
export const inputRadius  = "var(--wada-input-radius)";
export const cardRadius   = "var(--wada-card-radius)";
export const cardBorder   = "var(--wada-card-border)";

// ─── Charte typographique WADA 2026-05-26 (brief client) ───────────────
//
// Décision client verbatim : « on garde la police ronde / chubby comme
// signature de WADA. C'est un choix d'identité assumé et différenciant. »
//
// Règle 3 rôles (pas plus) :
//   1. Titres = Fredoka (chubby ronde, posée) — partout, voix de marque
//   2. Texte courant = Inter — paragraphes, listes, labels, prix
//   3. Serif = RETIRÉ COMPLÈTEMENT (décision client : « le plus cohérent »)
//
// Logo : Fredoka (chubby, cohérent avec les titres) — pas d'exception.
//
// Premium feel :
//   - Un seul poids de chubby pour les titres (500 ou 600, pas plusieurs)
//   - Tailles maîtrisées (réduire H1 des plus gros pour ne pas faire « lourd »)
//   - Contraste fort chubby titres ↔ Inter fin texte (c'est ça le chic)
//   - Couleur encre profonde (#1E1E1E) ou bordeaux, jamais noir pur
//
// IMPORTANT : `fontSerif` est gardé comme ALIAS vers Fredoka pour ne pas
// casser les composants legacy qui l'importent — au runtime il rend
// Fredoka comme `fontHeading`. À supprimer progressivement.
export const fontHeading   = "'Fredoka', 'Bagel Fat One', 'Inter', sans-serif";
export const fontBody      = "'Inter', 'Helvetica Neue', Arial, sans-serif";
export const fontLabel     = "'Inter', 'Merriweather Sans', sans-serif";
export const fontJp        = "'Noto Serif JP', 'Fredoka', sans-serif";
export const fontSerif     = "'Fredoka', 'Inter', sans-serif"; // alias legacy → Fredoka
export const fontGrotesque = "'Inter', 'Helvetica Neue', Arial, sans-serif";

// ─── Échelle de titres standardisée (brief : « mêmes tailles partout ») ─
// Brief client : « Mêmes tailles/échelle de titres sur TOUTES les pages
// (H1 identique partout, H2 identique, etc.) ». Source de vérité ici,
// chaque page doit référencer ces tokens au lieu de hardcoder des tailles.
export const titleSizes = {
  hero:   { desktop: 64, mobile: 40 },  // hero principal (home, à propos)
  h1:     { desktop: 48, mobile: 34 },  // titre de page (« Mes favoris », « Contact »…)
  h2:     { desktop: 34, mobile: 26 },  // section
  h3:     { desktop: 22, mobile: 19 },  // sous-section
} as const;

// Marges standard autour des titres (brief : « mêmes marges au-dessus
// et sous les titres partout »).
export const titleSpacing = {
  beforeHero: 80,
  afterHero:  24,
  beforeH1:   64,
  afterH1:    20,
  beforeH2:   48,
  afterH2:    16,
  beforeH3:   32,
  afterH3:    12,
} as const;

// ─── Brief WADA officiel 2026-05 — palette source de vérité ────────────
// Ces 5 tokens viennent du brief maître. À utiliser EN PRIORITÉ dans les
// nouveaux composants. Les variables CSS sont définies dans globals.css.
export const beige    = "var(--wada-beige)";      // #F4EFE7 surface principale
export const cream    = "var(--wada-cream)";      // #FAF8F4 surface secondaire
export const olive    = "var(--wada-olive)";      // #A8B29A accent végétal
export const bordeaux = "var(--wada-bordeaux)";   // #6B3A32 accent favoris/profond
export const inkPure  = "var(--wada-ink-pure)";   // #1E1E1E texte principal

// Alias sémantiques préférés
export const surfacePrimary   = "var(--surface-primary)";
export const surfaceSecondary = "var(--surface-secondary)";
export const surfaceCard      = "var(--surface-card)";
export const textPrimary      = "var(--text-primary)";
export const accentFavorite   = "var(--accent-favorite)";
export const accentNatural    = "var(--accent-natural)";

// Ombres douces standardisées (brief : "uniquement très douces")
export const shadowSoft   = "var(--shadow-soft)";    // 0 8px 40px rgba(30,30,30,.06)
export const shadowSoft2  = "var(--shadow-soft-2)";  // 0 4px 16px rgba(30,30,30,.04)
export const shadowLift   = "var(--shadow-lift)";    // 0 12px 48px rgba(30,30,30,.08)

// ─── Sucre stylistique partagé ─────────────────────────────────────────
export const sectionLabel = {
  fontSize: 10,
  letterSpacing: "0.4em",
  textTransform: "uppercase" as const,
  color: subtle,
  fontFamily: fontLabel,
  margin: 0,
};

/* Brief charte typo 2026-05-26 : « un seul poids de chubby pour les
   titres » + « Pas de page qui repasse en serif pour ses titres ».
   sectionTitle abandonne italic (qui faisait référence à Fraunces),
   passe en Fredoka 500. Taille alignée sur titleSizes.h2.desktop. */
export const sectionTitle = {
  fontSize: 34,
  fontWeight: 500,
  margin: "12px 0 0",
  letterSpacing: "-0.005em",
  fontFamily: fontHeading,
  color: ink,
};

/* Texte courant = Inter (jamais Fredoka pour les paragraphes).
   Brief : « La chubby ne sert JAMAIS pour les blocs de texte. » */
export const editorialText = {
  fontSize: 17,
  lineHeight: 1.65,
  color: ink,
  fontFamily: fontBody,
};

export const fieldLabel = {
  display: "block",
  fontSize: 10,
  letterSpacing: "0.35em",
  textTransform: "uppercase" as const,
  color: subtle,
  marginBottom: 12,
  fontFamily: fontLabel,
};

export const subSectionTitle = {
  fontSize: 11,
  letterSpacing: "0.4em",
  textTransform: "uppercase" as const,
  color: ink,
  fontFamily: fontLabel,
  margin: "0 0 24px",
  paddingBottom: 12,
  borderBottom: `1px solid ${border}`,
};
