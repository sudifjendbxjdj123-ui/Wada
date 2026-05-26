/**
 * WADA — Design tokens.
 * Single source of truth for typography, spacing, animations.
 * All page-level values should reference these tokens.
 *
 * Brief charte typographique 2026-05-26 (verbatim client) :
 *   « on garde la police ronde / chubby comme signature de WADA »
 *   1. Titres = Fredoka (chubby) — partout
 *   2. Texte courant = Inter — paragraphes, listes, labels, prix
 *   3. Serif RETIRÉ COMPLÈTEMENT (décision client)
 *   - Un seul poids de chubby (pas 2-3 graisses)
 *   - Tailles maîtrisées (réduire les H1 trop gros qui font « lourd »)
 *   - Couleur encre profonde, jamais noir pur
 *   - Contraste fort chubby titres ↔ Inter fin texte
 */

const CHUBBY = "'Fredoka', 'Bagel Fat One', 'Inter', sans-serif";
const SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif";

/** Typography scale — from display down to micro-label.
 *  Tous les titres → Fredoka (chubby), un seul poids 500.
 *  Tout le corps → Inter. Plus aucun italic (était hérité du serif). */
export const typography = {
  display: {
    fontSize: 64,
    fontWeight: 500,
    lineHeight: 1.05,
    letterSpacing: "-0.015em",
    fontFamily: CHUBBY,
  },
  h1: {
    fontSize: 48,
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    fontFamily: CHUBBY,
  },
  h2: {
    fontSize: 34,
    fontWeight: 500,
    lineHeight: 1.15,
    letterSpacing: "-0.005em",
    fontFamily: CHUBBY,
  },
  h3: {
    fontSize: 22,
    fontWeight: 500,
    lineHeight: 1.25,
    fontFamily: CHUBBY,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.65,
    fontFamily: SANS,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: SANS,
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.4em",
    textTransform: "uppercase" as const,
    fontFamily: SANS,
  },
  labelSm: {
    fontSize: 9,
    letterSpacing: "0.35em",
    textTransform: "uppercase" as const,
    fontFamily: SANS,
  },
  caption: {
    fontSize: 12,
    fontFamily: SANS,
  },
} as const;

/** Spacing scale — 4px base. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  xxxl: 100,
} as const;

/** Animation tokens. */
export const motion = {
  fast: "0.15s ease",
  base: "0.2s ease",
  slow: "0.3s ease",
  hoverLift: "translateY(-3px)",
  hoverShadow: "0 6px 24px rgba(31, 27, 22, 0.10)",
} as const;

/** Z-index scale. */
export const z = {
  base: 0,
  raised: 10,
  sticky: 20,
  drawer: 100,
  modal: 200,
} as const;
