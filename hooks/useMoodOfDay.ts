"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * useMoodOfDay — Vision Pt B (2026-05-31).
 *
 * Stocke la sélection « perception / humeur / objectif » du jour.
 * À l'inverse du profil persistant (useProfile), ces dimensions sont
 * éphémères — elles décrivent l'envie du moment, pas la personnalité.
 *
 * Expiration : la sélection reset automatiquement à 00h00 (changement
 * de date locale). On stocke la date avec la sélection ; au mount, si
 * la date stockée ≠ aujourd'hui, on réinitialise.
 *
 * Sync inter-onglets via storage event (idem useProfile).
 */

export type Perception =
  | "Élégant"
  | "Créatif"
  | "Accessible"
  | "Autoritaire"
  | "Séduisant"
  | "Mystérieux";

export type Humeur = "Énergique" | "Calme" | "Confiant" | "Discret";

export type Objectif =
  | "Travail"
  | "Sortir"
  | "Voyage"
  | "Dîner"
  | "Journée normale"
  | "Rendez-vous";

export interface MoodOfDay {
  perception?: Perception;
  humeur?: Humeur;
  objectif?: Objectif;
  /* Date locale ISO YYYY-MM-DD utilisée pour invalider à minuit. */
  date?: string;
}

const STORAGE_KEY = "wada.mood";

const PERCEPTIONS: Perception[] = [
  "Élégant", "Créatif", "Accessible", "Autoritaire", "Séduisant", "Mystérieux",
];
const HUMEURS: Humeur[] = ["Énergique", "Calme", "Confiant", "Discret"];
const OBJECTIFS: Objectif[] = [
  "Travail", "Sortir", "Voyage", "Dîner", "Journée normale", "Rendez-vous",
];

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValid(raw: unknown): raw is MoodOfDay {
  if (!raw || typeof raw !== "object") return false;
  const m = raw as Record<string, unknown>;
  if (m.perception !== undefined && !PERCEPTIONS.includes(m.perception as Perception)) return false;
  if (m.humeur !== undefined && !HUMEURS.includes(m.humeur as Humeur)) return false;
  if (m.objectif !== undefined && !OBJECTIFS.includes(m.objectif as Objectif)) return false;
  if (m.date !== undefined && typeof m.date !== "string") return false;
  return true;
}

export function useMoodOfDay() {
  const [mood, setMood] = useState<MoodOfDay>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          setMood({});
        } else {
          const parsed = JSON.parse(raw);
          if (!isValid(parsed)) {
            setMood({});
          } else if (parsed.date !== todayISO()) {
            /* Périmé : on garde le local storage mais on ne l'expose pas.
               L'utilisateur reverra les chips vierges au prochain appel. */
            setMood({});
          } else {
            setMood(parsed);
          }
        }
      } catch {
        setMood({});
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

  const save = useCallback((partial: Partial<MoodOfDay>) => {
    try {
      const next: MoodOfDay = { ...mood, ...partial, date: todayISO() };
      if (!isValid(next)) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMood(next);
    } catch {}
  }, [mood]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMood({});
    } catch {}
  }, []);

  return { mood, hydrated, save, reset };
}

/* Utilitaire serveur-safe (lecture brute sans hook). Utilisé par le
   payload envoyé à /api/stylist pour injecter dans le prompt. */
export function readMoodOfDay(): MoodOfDay {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) return {};
    if (parsed.date !== todayISO()) return {};
    return parsed;
  } catch {
    return {};
  }
}
