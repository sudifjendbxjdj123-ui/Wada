"use client";
import { useEffect, useMemo, useState } from "react";
import { dictionary, type DictionaryEntry } from "@/lib/data";

/**
 * Palette mise en avant, changée chaque jour.
 *
 * L'index dérive du quantième, sans hasard : le serveur et le client tombent
 * donc sur la même. Un Math.random() aurait produit un accord différent à
 * chaque rendu et fait clignoter la page à l'hydratation.
 *
 * Ce calcul vivait dans BoutiqueEntete. Il en sort parce que la palette est
 * désormais lue PLUS HAUT dans la page que le composant qui la calculait.
 */
export function paletteDuJour(): DictionaryEntry | null {
  if (!dictionary.length) return null;
  const jour = Math.floor(Date.now() / 86400000);
  return dictionary[jour % dictionary.length];
}

/** Version hook : `null` au premier rendu, pour que le HTML serveur et le
 *  HTML client soient identiques (la date n'existe pas au build). */
export function usePaletteDuJour(): DictionaryEntry | null {
  const [monte, setMonte] = useState(false);
  useEffect(() => setMonte(true), []);
  return useMemo(() => (monte ? paletteDuJour() : null), [monte]);
}

export type Genre = "femme" | "homme";

/** Genre mémorisé — même clé que le reste du site. Le client qui a choisi
 *  « Homme » ne veut pas le rechoisir à chaque visite. */
export function useGenreMemorise(): [Genre, (g: Genre) => void] {
  const [genre, setGenre] = useState<Genre>("femme");
  useEffect(() => {
    try {
      const g = localStorage.getItem("wada-gender");
      if (g === "homme" || g === "femme") setGenre(g);
    } catch { /* stockage indisponible : on garde le défaut */ }
  }, []);
  const choisir = (g: Genre) => {
    setGenre(g);
    try { localStorage.setItem("wada-gender", g); } catch {}
  };
  return [genre, choisir];
}
