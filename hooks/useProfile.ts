"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * useProfile — profil utilisateur WADA (genre + budget + style).
 *
 * Brief 2026-05-29 « Onboarding + profil + switcher » :
 * Connaître le client dès le 1er accès pour que TOUTES les propositions
 * de tenues soient personnalisées (genre, gamme de prix, registre).
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

export interface Profile {
  genre: Genre;
  budget: Budget;
  style: Style;
}

export const DEFAULT_PROFILE: Profile = {
  genre: "Femme",
  budget: "150–400€",
  style: "Minimaliste",
};

const STORAGE_KEY = "wada.profile";

/* Type guards : on ne fait confiance qu'aux valeurs whitelist (un user
   qui édite localStorage à la main ne casse pas l'app). */
const GENRES: Genre[] = ["Femme", "Homme"];
const BUDGETS: Budget[] = ["< 150€", "150–400€", "Premium"];
const STYLES: Style[] = ["Minimaliste", "Classique", "Streetwear", "Décontracté"];

function isValidProfile(raw: unknown): raw is Profile {
  if (!raw || typeof raw !== "object") return false;
  const p = raw as Record<string, unknown>;
  return (
    GENRES.includes(p.genre as Genre) &&
    BUDGETS.includes(p.budget as Budget) &&
    STYLES.includes(p.style as Style)
  );
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

  return { profile, effective, hydrated, save, skip, reset };
}
