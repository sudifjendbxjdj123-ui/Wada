"use client";
/**
 * useHistory — TIER 3 undo/redo history management
 * Hook pour gérer l'historique des actions (undo/redo) avec persistent storage.
 * Utile pour l'éditeur de tenue, les ajustements de palette, etc.
 *
 * Usage:
 *   const { state, undo, redo, push, canUndo, canRedo } = useHistory(initialState);
 *   // Quand l'utilisateur fait une action:
 *   push(newState);
 *   // Pour annuler:
 *   undo();
 */

import { useCallback, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(
  initialState: T,
  storageKey?: string
): {
  state: T;
  push: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryState<T>;
} {
  const [history, setHistory] = useState<HistoryState<T>>(() => {
    // Try to restore from localStorage if storageKey provided
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // Silent fail on JSON parse error
      }
    }

    return {
      past: [],
      present: initialState,
      future: [],
    };
  });

  // Persist to localStorage when history changes
  const persistHistory = useCallback(
    (newHistory: HistoryState<T>) => {
      setHistory(newHistory);
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(newHistory));
        } catch {
          // Silent fail if storage is full
        }
      }
    },
    [storageKey]
  );

  const push = useCallback(
    (newState: T) => {
      persistHistory({
        past: [...history.past, history.present],
        present: newState,
        future: [],
      });
    },
    [history.past, history.present, persistHistory]
  );

  const undo = useCallback(() => {
    if (history.past.length === 0) return;

    const newPast = history.past.slice(0, -1);
    const newPresent = history.past[history.past.length - 1];

    persistHistory({
      past: newPast,
      present: newPresent,
      future: [history.present, ...history.future],
    });
  }, [history, persistHistory]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;

    const newFuture = history.future.slice(1);
    const newPresent = history.future[0];

    persistHistory({
      past: [...history.past, history.present],
      present: newPresent,
      future: newFuture,
    });
  }, [history, persistHistory]);

  const clear = useCallback(() => {
    persistHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState, persistHistory]);

  return {
    state: history.present,
    push,
    undo,
    redo,
    clear,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    history,
  };
}
