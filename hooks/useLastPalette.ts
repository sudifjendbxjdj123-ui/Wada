"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * useLastPalette — persiste la dernière palette visitée dans localStorage.
 *
 * Brief « appli efficace » §3 (2026-05-29) : « un client ne doit jamais
 * repartir de zéro ». La home affiche une bande "Reprends ta tenue" qui
 * ramène vers la dernière palette visitée OU la dernière tenue sauvée.
 *
 * Côté écriture : appel `record(number, name)` dans /palette/[number].
 * Côté lecture : `last` (objet ou null) lu au mount + sync inter-onglets.
 *
 * Stockage minimal : { number: "094", name: "Béton & Lin", at: timestamp }.
 * On garde uniquement la PLUS récente (pas un historique) pour ne pas
 * surcharger localStorage et ne pas avoir à gérer une dedup/FIFO.
 */

export interface LastPalette {
  number: string;
  name: string;
  /** Timestamp epoch ms. Utile pour TTL futur si on veut expirer. */
  at: number;
}

const STORAGE_KEY = "wada-last-palette";

export function useLastPalette() {
  const [last, setLast] = useState<LastPalette | null>(null);
  /* hydrated : évite le flash entre render serveur (null) et hydratation
     client (valeur localStorage). Les composants attendent `hydrated` avant
     d'afficher quoi que ce soit qui dépende de l'état. */
  const [hydrated, setHydrated] = useState(false);

  /* Lecture initiale + sync inter-onglets. */
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setLast(null);
          return;
        }
        const parsed = JSON.parse(raw) as LastPalette;
        if (parsed && typeof parsed.number === "string" && typeof parsed.name === "string") {
          setLast(parsed);
        }
      } catch {
        setLast(null);
      } finally {
        setHydrated(true);
      }
    };
    read();
    /* storage event = sync entre onglets. Si l'user visite une palette
       dans un autre onglet, la home se met à jour automatiquement. */
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) read();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Enregistre la palette courante. Appelé depuis /palette/[number]/page.tsx
     dans un useEffect. Pas de set si même que le précédent (évite des
     écritures inutiles + storage event spam). */
  const record = useCallback((number: string, name: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev = raw ? (JSON.parse(raw) as LastPalette) : null;
      if (prev?.number === number) return;
      const next: LastPalette = { number, name, at: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setLast(next);
    } catch {}
  }, []);

  /* Reset (utile si on veut un bouton « effacer mon historique » ou si
     l'utilisateur dismiss définitivement la bande Resume). */
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLast(null);
    } catch {}
  }, []);

  return { last, hydrated, record, clear };
}
