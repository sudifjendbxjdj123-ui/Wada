"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * useSavedOutfits — persiste les tenues composées par l'IA dans localStorage.
 *
 * Brief 2026-05-26 « ameliore tout le reste possible » :
 * Avant, composer une tenue puis fermer l'onglet = tout perdu. L'user
 * passait 2 min à dialoguer avec le styliste, validait une tenue, puis
 * impossible de la retrouver le lendemain. Cap : pas d'auth pour
 * l'instant, donc localStorage avec sync inter-onglets (storage event).
 *
 * Limite : 20 tenues max (FIFO). Au-delà, les plus anciennes tombent.
 * Cap volontaire pour éviter l'inflation localStorage (~50 KB pour 20).
 */

export interface SavedOutfit {
  /** ID unique généré au save (`outfit-{timestamp}-{rand}`). */
  id: string;
  /** Nom évocateur de la tenue (« L'Aventurier », « Le Banquier »…). */
  nomTenue: string;
  /** Référence palette Sanzo Wada (« 094 »). Optionnel si tenue compose
   *  sans accord matché. */
  accordRef?: string;
  /** Nom de la palette (« Béton & Lin »). */
  accordName?: string;
  /** Couleurs de l'accord pour affichage en mini bandes (4-5 hex). */
  accordColors: Array<{ hex: string; name: string }>;
  /** Les 5 pièces composées par l'IA. */
  pieces: Array<{
    role: string;
    type: string;
    hex: string;
    couleurNom: string;
    ancre: boolean;
    genre?: string;
  }>;
  /** Phrase de styliste qui accompagnait la tenue. */
  reponse?: string;
  /** 1 phrase couleur/matière (« Pourquoi ça marche »). */
  pourquoi?: string;
  /** Timestamp epoch ms du save. Affiché en relative time (« il y a 2h »). */
  savedAt: number;
}

const STORAGE_KEY = "wada-saved-outfits";
const MAX_OUTFITS = 20;

export function useSavedOutfits() {
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setOutfits(parsed);
      }
    } catch { /* localStorage indispo ou JSON corrompu, on continue à vide */ }

    /* Sync inter-onglets : si l'user enregistre une tenue dans un autre
       onglet, on rafraîchit la liste sans reload. */
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) setOutfits(parsed);
      } catch { /* silent */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const persist = useCallback((next: SavedOutfit[]) => {
    setOutfits(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }, []);

  /** Ajoute une tenue en tête de liste, dédupe par (nomTenue + accordRef)
   *  pour éviter les doublons exacts si l'user clique 2 fois. */
  const save = useCallback((outfit: Omit<SavedOutfit, "id" | "savedAt">): SavedOutfit => {
    const id = `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const saved: SavedOutfit = { ...outfit, id, savedAt: Date.now() };
    // Dédup : si une tenue avec même nom + même accord existe déjà, on
    // la remplace (mise à jour) au lieu de créer un doublon.
    const dedup = outfits.filter((o) =>
      !(o.nomTenue === saved.nomTenue && o.accordRef === saved.accordRef)
    );
    const next = [saved, ...dedup].slice(0, MAX_OUTFITS);
    persist(next);
    return saved;
  }, [outfits, persist]);

  const remove = useCallback((id: string) => {
    persist(outfits.filter((o) => o.id !== id));
  }, [outfits, persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { outfits, save, remove, clear, hydrated };
}
