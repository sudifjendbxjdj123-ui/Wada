/**
 * lib/composer/paletteIdentity.ts
 *
 * Brief 2026-06-01 « Composer IA » §1 (PaletteIdentity).
 *
 * Helper qui transforme une DictionaryEntry (lib/data.ts — 348 palettes
 * existantes avec colors[] + styles[] + seasons[] + occasions + culture)
 * en une PaletteIdentity enrichie attendue par le composer.
 *
 * Les champs non présents dans le JSON canonique sont DÉRIVÉS avec des
 * heuristiques sûres :
 *   - registre   : depuis styles[0] via styleToRegistre()
 *   - mood       : depuis culture + saison (sobre par défaut)
 *   - matieres_attendues / interdites : dérivés du registre
 *   - marques_interdites : registres incompatibles via registreCompat
 *
 * Une future migration pourra enrichir directement le JSON canonique
 * sans casser l'API (paletteIdentity() conserve la rétrocompat).
 */

import type { DictionaryEntry } from "@/lib/data";
import { styleToRegistre } from "@/lib/brandRegistre";
import type { PaletteIdentity, Registre, Mood, Saison, Occasion } from "./types";

const REGISTRE_MATIERES_ATTENDUES: Record<Registre, string[]> = {
  minimaliste:      ["coton", "laine", "lin", "jersey"],
  classique:        ["laine", "cachemire", "coton", "soie", "cuir"],
  streetwear:       ["coton", "jersey", "polyester", "nylon"],
  decontracte:      ["coton", "jersey", "lin"],
  avant_garde:      ["laine", "soie", "cuir", "cachemire"],
  outdoor:          ["nylon", "polyester", "polyamide", "goretex"],
  heritage_country: ["coton ciré", "tweed", "laine", "cuir"],
  apres_ski:        ["polyamide matelassé", "duvet", "fourrure synthétique"],
};

const REGISTRE_MATIERES_INTERDITES: Record<Registre, string[]> = {
  minimaliste:      ["polyamide matelassé", "fourrure synthétique", "vinyl"],
  classique:        ["polyester technique", "nylon ripstop", "fourrure synthétique"],
  streetwear:       [],
  decontracte:      ["fourrure synthétique"],
  avant_garde:      ["polyester technique", "fourrure synthétique"],
  outdoor:          [],
  heritage_country: ["polyester technique", "vinyl"],
  apres_ski:        [],
};

/* Mapping FR → Saison snake_case du brief composer. */
function normalizeSaison(s: string): Saison {
  const norm = s.toLowerCase();
  if (norm.includes("été") || norm.includes("ete")) return "ete";
  if (norm.includes("hiver")) return "hiver";
  if (norm.includes("mi-saison") || norm.includes("mi saison")) return "mi_saison";
  return "toute_saison";
}

/* Mapping FR → Occasion snake_case. Très approximatif (le JSON existant
   ne sépare pas systématiquement plusieurs occasions). */
function parseOccasions(raw: string): Occasion[] {
  const norm = (raw || "").toLowerCase();
  const out = new Set<Occasion>();
  if (norm.match(/bureau|conf[ée]rence|lancement/)) out.add("bureau");
  if (norm.match(/quotidien|matin|café|caf[ée]/)) out.add("quotidien");
  if (norm.match(/soir|d[îi]ner|avant-premi[èe]re/)) out.add("soiree");
  if (norm.match(/weekend|brunch|garden|d[ée]jeuner/)) out.add("weekend");
  if (norm.match(/voyage|train|airport/)) out.add("voyage");
  if (norm.match(/rendez|date/)) out.add("rendez_vous");
  if (norm.match(/c[ée]r[ée]monie|mariage/)) out.add("ceremonie");
  if (out.size === 0) out.add("quotidien");
  return Array.from(out);
}

/* Heuristique mood depuis culture + tone des couleurs. */
function inferMood(entry: DictionaryEntry): Mood {
  const desc = (entry.description || "").toLowerCase();
  if (desc.match(/cinéma|cinema|velours|laiton|carmin|noir/)) return "theatral";
  if (desc.match(/chaleur|brique|terra|cuivre|or/)) return "chaleureux";
  if (desc.match(/néon|neon|rouge vif|électrique/)) return "audacieux";
  if (desc.match(/brouillard|brume|monochrome|gris|ardoise|asphalte/)) return "calme_epure";
  return "sobre";
}

/**
 * Wrap une DictionaryEntry du dictionnaire WADA en PaletteIdentity
 * exploitable par le composer.
 */
export function paletteIdentity(entry: DictionaryEntry): PaletteIdentity {
  /* Registre : priorité au style profil utilisateur passé en surchage, sinon
     dérivé depuis styles[0]. Fallback `decontracte` (le plus permissif et
     le plus aligné avec MUJI qui est la base WADA). */
  const styleHint = entry.styles?.[0];
  const registre: Registre = styleToRegistre(styleHint) || "decontracte";

  const colors = entry.colors || [];
  const couleur_principale = colors[0]?.hex || "#9B9B96";
  const couleurs_neutres = colors.slice(1).map((c) => c.hex);

  const saisonRaw = entry.seasons || [];
  const saison: Saison[] = saisonRaw.length > 0
    ? Array.from(new Set(saisonRaw.map(normalizeSaison)))
    : ["toute_saison"];

  return {
    ref: entry.number,
    nom: entry.name,
    culture: entry.culture || "",
    registre,
    mood: inferMood(entry),
    saison,
    occasion: parseOccasions(entry.occasions || ""),
    matieres_attendues: REGISTRE_MATIERES_ATTENDUES[registre] || [],
    matieres_interdites: REGISTRE_MATIERES_INTERDITES[registre] || [],
    couleur_principale,
    couleurs_neutres,
    couleurs_interdites_hex: [],   // pas encore renseigné par palette
    marques_inspiration: [],       // pas encore renseigné par palette
    marques_interdites: [],        // dérivé via registreCompat dans filterPool
    histoire: entry.description || "",
  };
}
