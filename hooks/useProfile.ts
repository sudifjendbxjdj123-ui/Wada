"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useProfile — profil utilisateur WADA.
 *
 * Brief 2026-05-29 « Onboarding + profil + switcher » :
 * Connaître le client dès le 1er accès pour que TOUTES les propositions
 * de tenues soient personnalisées (genre, gamme de prix, registre).
 *
 * Brief 2026-05-31 « Vision styliste personnel — Pt A » :
 * Profil enrichi optionnel — l'utilisateur peut compléter sur /compte
 * pour des recommandations plus fines. Aucun champ enrichi n'est requis ;
 * tout reste rétrocompatible avec les profils créés avant cet ajout.
 *
 * Stockage V1 : localStorage uniquement (clé `wada.profile`).
 * V2 (utilisateurs connectés) : sync DB côté serveur, fusion priorité serveur.
 *
 * Sync inter-onglets : storage event. Si l'user change le profil dans
 * un onglet, les autres se mettent à jour automatiquement.
 *
 * Défaut « Passer pour cette fois » : Femme · 150–400€ · Minimaliste.
 */

export type Genre = "Femme" | "Homme";
export type Budget = "< 150€" | "150–400€" | "Premium";
export type Style = "Minimaliste" | "Classique" | "Streetwear" | "Décontracté";
/* Brief 2026-05-30 : nouvelles dimensions optionnelles ajoutées au
   bloc « Composées pour vous » sur /palette/[number]. */
export type Saison = "Toute saison" | "Hiver" | "Mi-saison" | "Été";
export type Tendance = "Sobre" | "Audacieux" | "Confortable" | "Tendance";

/* Brief 2026-05-31 — Vision Pt A : champs enrichis. Tous optionnels. */
export type AgeRange = "18-25" | "25-35" | "35-50" | "50+";
export type Morphologie = "Rectangle" | "Triangle" | "Sablier" | "Rond" | "Athlétique";
export type Profession = "Créatif" | "Corporate" | "Freelance" | "Étudiant" | "Autre";
/* Niveau de formalité — slider 0 (très casual) → 4 (très habillé) */
export type FormaliteLevel = 0 | 1 | 2 | 3 | 4;

export interface Profile {
  /* Champs obligatoires (onboarding 3 questions) */
  genre: Genre;
  budget: Budget;
  style: Style;

  /* Optionnels — défaut « Toute saison / Sobre ». Le client peut
     les ajuster en 1 clic sur la page palette. */
  saison?: Saison;
  tendance?: Tendance;

  /* Optionnels enrichis (page /compte) — plus c'est rempli, mieux
     WADA propose. Affiché avec barre de progression au client. */
  age?: AgeRange;
  morphologie?: Morphologie;
  ville?: string;
  profession?: Profession;
  couleursAimees?: string[];      // hex codes
  couleursInterdites?: string[];  // hex codes
  marquesFavorites?: string[];    // noms libres
  formalite?: FormaliteLevel;
}

export const DEFAULT_PROFILE: Profile = {
  genre: "Femme",
  budget: "150–400€",
  style: "Minimaliste",
  saison: "Toute saison",
  tendance: "Sobre",
};

const STORAGE_KEY = "wada.profile";

/* Type guards : on ne fait confiance qu'aux valeurs whitelist (un user
   qui édite localStorage à la main ne casse pas l'app). */
const GENRES: Genre[] = ["Femme", "Homme"];
const BUDGETS: Budget[] = ["< 150€", "150–400€", "Premium"];
const STYLES: Style[] = ["Minimaliste", "Classique", "Streetwear", "Décontracté"];
const SAISONS: Saison[] = ["Toute saison", "Hiver", "Mi-saison", "Été"];
const TENDANCES: Tendance[] = ["Sobre", "Audacieux", "Confortable", "Tendance"];
const AGES: AgeRange[] = ["18-25", "25-35", "35-50", "50+"];
const MORPHOS: Morphologie[] = ["Rectangle", "Triangle", "Sablier", "Rond", "Athlétique"];
const PROFESSIONS: Profession[] = ["Créatif", "Corporate", "Freelance", "Étudiant", "Autre"];

function isValidProfile(raw: unknown): raw is Profile {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Record<string, unknown>;
  /* Validation stricte des 3 champs OBLIGATOIRES. Tous les nouveaux
     sont optionnels : si présents on les valide, sinon undefined OK.
     Rétrocompat avec les profils créés avant l'ajout des champs. */
  if (!GENRES.includes(p.genre as Genre)) return false;
  if (!BUDGETS.includes(p.budget as Budget)) return false;
  if (!STYLES.includes(p.style as Style)) return false;
  if (p.saison !== undefined && !SAISONS.includes(p.saison as Saison)) return false;
  if (p.tendance !== undefined && !TENDANCES.includes(p.tendance as Tendance)) return false;
  if (p.age !== undefined && !AGES.includes(p.age as AgeRange)) return false;
  if (p.morphologie !== undefined && !MORPHOS.includes(p.morphologie as Morphologie)) return false;
  if (p.profession !== undefined && !PROFESSIONS.includes(p.profession as Profession)) return false;
  if (p.ville !== undefined && typeof p.ville !== "string") return false;
  if (p.couleursAimees !== undefined && !Array.isArray(p.couleursAimees)) return false;
  if (p.couleursInterdites !== undefined && !Array.isArray(p.couleursInterdites)) return false;
  if (p.marquesFavorites !== undefined && !Array.isArray(p.marquesFavorites)) return false;
  if (p.formalite !== undefined) {
    const f = p.formalite;
    if (typeof f !== "number" || f < 0 || f > 4) return false;
  }
  return true;
}

/* Brief 2026-05-31 — Vision Pt A : barre de progression.
   8 champs enrichis comptés (saison + tendance + 6 nouveaux).
   Renvoie un % entier 0..100. */
export function profileCompleteness(p: Profile | null): number {
  if (!p) return 0;
  /* Les 3 obligatoires sont toujours présents si profile existe → 30% base. */
  let filled = 3;
  const enriched: (keyof Profile)[] = [
    "saison", "tendance",
    "age", "morphologie", "ville", "profession",
    "couleursAimees", "couleursInterdites", "marquesFavorites", "formalite",
  ];
  const TOTAL = 3 + enriched.length; // 13 champs
  for (const k of enriched) {
    const v = p[k];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "string" && v.trim().length === 0) continue;
    filled += 1;
  }
  return Math.round((filled / TOTAL) * 100);
}

export function useProfile() {
  /* profile = null pendant l'hydratation (évite mismatch SSR/CSR).
     Après mount client : soit le profil lu en localStorage, soit null
     (= user n'a jamais fait l'onboarding → composant doit décider quoi
     afficher : overlay ou app normale avec défaut). */
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* Lecture initiale + sync inter-onglets. */
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setProfile(null);
        } else {
          const parsed = JSON.parse(raw);
          setProfile(isValidProfile(parsed) ? parsed : null);
        }
      } catch {
        setProfile(null);
      } finally {
        setHydrated(true);
      }
    };
    read();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Enregistre un nouveau profil. Validation light : on accepte un
     partial pour les updates atomiques depuis le switcher (« change
     juste le budget »). */
  const save = useCallback((partial: Partial<Profile>) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: Profile = raw && isValidProfile(JSON.parse(raw))
        ? JSON.parse(raw)
        : DEFAULT_PROFILE;
      const next: Profile = { ...prev, ...partial };
      if (!isValidProfile(next)) return; // sécurité, ne devrait jamais arriver
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setProfile(next);
    } catch {}
  }, []);

  /* Pose le profil par défaut (appelé quand l'user clique « Passer pour
     cette fois » dans l'onboarding ou via un reset manuel). */
  const skip = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      setProfile(DEFAULT_PROFILE);
    } catch {}
  }, []);

  /* Reset complet (utile depuis /compte ou pour tester l'onboarding). */
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setProfile(null);
    } catch {}
  }, []);

  /* « Profil effectif » : ce que les composants utilisent pour leurs
     calculs (chips, query params, contexte LLM). Si l'user n'a pas fait
     l'onboarding (profile=null), on retourne quand même DEFAULT pour
     que l'app soit jamais bloquée — c'est la règle brief §6 « jamais
     de barrière ». L'OnboardingOverlay décidera de s'afficher
     séparément via `profile === null && hydrated`. */
  const effective: Profile = profile ?? DEFAULT_PROFILE;

  /* Brief 2026-05-31 — Vision Pt A : barre de progression sur /compte. */
  const completeness = useMemo(() => profileCompleteness(profile), [profile]);

  return { profile, effective, hydrated, save, skip, reset, completeness };
}
