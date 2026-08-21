/**
 * lib/composer/rolesCouleurs.ts
 *
 * QUELLE COULEUR DE LA PALETTE VA SUR QUELLE PIÈCE — et pourquoi.
 *
 * Brief client 2026-08-21 : « montrer visuellement la relation entre la
 * palette et les vêtements. L'utilisateur comprend immédiatement que les
 * couleurs Sanzō Wada ne sont pas juste une décoration en haut de l'écran :
 * elles sont réellement utilisées pour construire sa tenue. C'est
 * précisément ce qui peut différencier WADA d'un simple AI outfit generator. »
 *
 * Et le défaut qu'il pointe dans la foulée : la page annonce trois teintes,
 * puis affiche une pièce sans dire laquelle elle porte. Le client se demande
 * légitimement pourquoi on lui montre du noir après lui avoir promis du lait,
 * de la sauge et de la mousse.
 *
 * Le moteur SAIT tout ça — chaque slot porte déjà sa couleur. Il ne le disait
 * simplement à personne.
 */

import type { RegistreOutfit, SlotKey } from "@/lib/registreEngine";

export type RoleCouleur = "dominante" | "secondaire" | "accent";

export type PlaceCouleur = {
  slot: SlotKey;
  /** Libellé du slot, pour affichage : « Haut », « Bas »… */
  libelleSlot: string;
  hex: string;
  /** Nom lisible de la teinte, tel que le moteur l'a dérivé du hex. */
  nom: string;
  role: RoleCouleur;
};

const LIBELLE_SLOT: Record<SlotKey, string> = {
  haut: "Haut", bas: "Bas", veste: "Veste",
  chaussures: "Chaussures", accent: "Accessoire",
};

const LIBELLE_ROLE: Record<RoleCouleur, string> = {
  dominante: "Couleur principale",
  secondaire: "Couleur secondaire",
  accent: "Accent",
};

export function libelleRole(role: RoleCouleur): string {
  return LIBELLE_ROLE[role];
}

/**
 * Attribue un rôle à la teinte de chaque pièce.
 *
 * La règle 2 du brief — « 1 couleur dominante + 1 secondaire + 1 accent » —
 * décrit des SURFACES, pas des pièces. On la lit donc ainsi :
 *   dominante  : la teinte portée par le plus de vêtements
 *   accent     : la teinte du slot accessoire, quand elle ne sert qu'à lui
 *   secondaire : le reste
 *
 * Cas particulier : quand l'accessoire reprend une teinte déjà portée (ce que
 * le brief appelle « continuer la tenue »), ce n'est plus un accent — c'est un
 * rappel. Il hérite alors du rôle de la teinte qu'il reprend, sinon la page
 * afficherait un « Accent » sur une couleur qui couvre la moitié de la tenue.
 */
export function rolesCouleurs(outfit: RegistreOutfit): PlaceCouleur[] {
  const vetements = outfit.slots.filter((s) => s.slot !== "accent");
  const accent = outfit.slots.find((s) => s.slot === "accent");

  /* Combien de vêtements portent chaque teinte. */
  const compte = new Map<string, number>();
  for (const s of vetements) compte.set(s.color.hex, (compte.get(s.color.hex) ?? 0) + 1);

  let dominante: string | null = null;
  let meilleur = 0;
  for (const [hex, n] of compte) {
    if (n > meilleur) { meilleur = n; dominante = hex; }
  }

  const hexAccent = accent?.color.hex ?? null;
  /* L'accent n'est un accent que s'il est propre à l'accessoire. */
  const accentExclusif = hexAccent !== null && !compte.has(hexAccent);

  const roleDe = (hex: string, slot: SlotKey): RoleCouleur => {
    if (slot === "accent" && accentExclusif) return "accent";
    if (hex === dominante) return "dominante";
    return "secondaire";
  };

  return outfit.slots.map((s) => ({
    slot: s.slot,
    libelleSlot: LIBELLE_SLOT[s.slot],
    hex: s.color.hex,
    nom: s.color.name,
    role: roleDe(s.color.hex, s.slot),
  }));
}

/**
 * La légende palette → vêtements : une entrée par TEINTE (pas par pièce),
 * avec la liste des pièces qui la portent.
 *
 *   Lait     → Haut
 *   Sauge    → Bas
 *   Mousse   → Veste · Chaussures
 */
export type LigneLegende = {
  hex: string;
  nom: string;
  role: RoleCouleur;
  pieces: string[];
};

export function legendePalette(outfit: RegistreOutfit): LigneLegende[] {
  const places = rolesCouleurs(outfit);
  const parHex = new Map<string, LigneLegende>();

  for (const p of places) {
    const ligne = parHex.get(p.hex);
    if (ligne) {
      ligne.pieces.push(p.libelleSlot);
      /* Une teinte dominante le reste même si un accessoire la reprend. */
      if (p.role === "dominante") ligne.role = "dominante";
    } else {
      parHex.set(p.hex, { hex: p.hex, nom: p.nom, role: p.role, pieces: [p.libelleSlot] });
    }
  }

  /* Ordre de lecture : dominante, puis secondaires, puis accent — c'est
     l'ordre dans lequel on décrit une tenue à voix haute. */
  const rang: Record<RoleCouleur, number> = { dominante: 0, secondaire: 1, accent: 2 };
  return [...parHex.values()].sort((a, b) => rang[a.role] - rang[b.role]);
}
