"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * useStyleSignals — Vision Pt D (2026-05-31).
 *
 * Mémoire stylistique : likes / dislikes des tenues proposées par WADA,
 * agrégée pour ajuster les futures propositions sans demander à l'user.
 *
 * Modèle de signal :
 * - kind : "like" ou "dislike"
 * - reason : dimension du dislike (couleur/marque/coupe/prix/occasion)
 *            (uniquement pour les dislikes ; pour like c'est "general")
 * - target : valeur précise refusée/aimée (ex. "#6B3A32", "Brunello Cucinelli",
 *            "oversize", "premium", "soirée")
 * - context : palette/accord ref + slot concerné si applicable
 * - createdAt : timestamp pour décay éventuel (les signaux récents pèsent plus)
 *
 * Agrégation : on retient les 100 derniers signaux (suffisant pour identifier
 * les patterns sans exploser localStorage). Quand un signal apparaît N fois
 * (N=3 par défaut), il devient une « règle implicite » à respecter par le LLM.
 *
 * Stockage : localStorage "wada.signals" (V1). À porter en backend quand on
 * aura l'auth.
 */

export type SignalKind = "like" | "dislike";
export type DislikeReason = "couleur" | "marque" | "coupe" | "prix" | "occasion";

export interface StyleSignal {
  id: string;
  kind: SignalKind;
  /* "general" pour like, ou une des 5 raisons pour dislike */
  reason: "general" | DislikeReason;
  target?: string;
  /* Métadonnées de la tenue qui a généré ce signal */
  paletteRef?: string;
  paletteName?: string;
  tenueName?: string;
  pieces?: Array<{ type: string; brand?: string; price?: number; hex?: string }>;
  createdAt: number; // ms epoch
}

const STORAGE_KEY = "wada.signals";
const MAX_SIGNALS = 100;
/* Seuil à partir duquel un dislike répété devient une règle pour le LLM. */
export const SIGNAL_THRESHOLD = 3;

function isValidSignal(raw: unknown): raw is StyleSignal {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string") return false;
  if (s.kind !== "like" && s.kind !== "dislike") return false;
  if (typeof s.reason !== "string") return false;
  if (typeof s.createdAt !== "number") return false;
  return true;
}

export interface SignalAggregate {
  /* Couleurs (hex) qui ont >= SIGNAL_THRESHOLD dislikes */
  dislikedColors: string[];
  /* Marques qui ont >= SIGNAL_THRESHOLD dislikes */
  dislikedBrands: string[];
  /* Coupes/types qui ont >= SIGNAL_THRESHOLD dislikes */
  dislikedCuts: string[];
  /* Marques qui ont >= 2 likes */
  likedBrands: string[];
  /* Couleurs qui ont >= 2 likes */
  likedColors: string[];
  /* Total likes / dislikes pour barre de progression / stats */
  totalLikes: number;
  totalDislikes: number;
}

function aggregate(signals: StyleSignal[]): SignalAggregate {
  const dislikedColors: Record<string, number> = {};
  const dislikedBrands: Record<string, number> = {};
  const dislikedCuts: Record<string, number> = {};
  const likedBrands: Record<string, number> = {};
  const likedColors: Record<string, number> = {};
  let totalLikes = 0;
  let totalDislikes = 0;

  for (const s of signals) {
    if (s.kind === "like") {
      totalLikes++;
      for (const p of s.pieces || []) {
        if (p.brand) likedBrands[p.brand] = (likedBrands[p.brand] || 0) + 1;
        if (p.hex) likedColors[p.hex] = (likedColors[p.hex] || 0) + 1;
      }
    } else {
      totalDislikes++;
      if (s.reason === "couleur" && s.target) {
        dislikedColors[s.target] = (dislikedColors[s.target] || 0) + 1;
      } else if (s.reason === "marque" && s.target) {
        dislikedBrands[s.target] = (dislikedBrands[s.target] || 0) + 1;
      } else if (s.reason === "coupe" && s.target) {
        dislikedCuts[s.target] = (dislikedCuts[s.target] || 0) + 1;
      }
    }
  }

  const filterThreshold = (counts: Record<string, number>, t: number) =>
    Object.entries(counts).filter(([, c]) => c >= t).map(([k]) => k);

  return {
    dislikedColors: filterThreshold(dislikedColors, SIGNAL_THRESHOLD),
    dislikedBrands: filterThreshold(dislikedBrands, SIGNAL_THRESHOLD),
    dislikedCuts: filterThreshold(dislikedCuts, SIGNAL_THRESHOLD),
    likedBrands: filterThreshold(likedBrands, 2),
    likedColors: filterThreshold(likedColors, 2),
    totalLikes,
    totalDislikes,
  };
}

export function useStyleSignals() {
  const [signals, setSignals] = useState<StyleSignal[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setSignals([]);
        } else {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSignals(parsed.filter(isValidSignal).slice(0, MAX_SIGNALS));
          } else {
            setSignals([]);
          }
        }
      } catch {
        setSignals([]);
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

  const add = useCallback((signal: Omit<StyleSignal, "id" | "createdAt">) => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const full: StyleSignal = { ...signal, id, createdAt: Date.now() };
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: StyleSignal[] = raw && Array.isArray(JSON.parse(raw))
        ? JSON.parse(raw).filter(isValidSignal)
        : [];
      const next = [full, ...prev].slice(0, MAX_SIGNALS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSignals(next);
    } catch {}
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setSignals([]);
    } catch {}
  }, []);

  const aggregated = useMemo(() => aggregate(signals), [signals]);

  return { signals, aggregated, hydrated, add, reset };
}

/* Lecture brute serveur-safe (hors render) — utilisée par /stylist pour
   construire le payload envoyé à /api/stylist. */
export function readSignalsAggregate(): SignalAggregate {
  if (typeof window === "undefined") {
    return {
      dislikedColors: [], dislikedBrands: [], dislikedCuts: [],
      likedBrands: [], likedColors: [],
      totalLikes: 0, totalDislikes: 0,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return aggregate([]);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return aggregate([]);
    return aggregate(parsed.filter(isValidSignal));
  } catch {
    return aggregate([]);
  }
}
