import type { Aleatoire, Etat, Genre } from './types';

export const borne = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
/** Arrondi au dixième, comme le prototype. */
export const dixieme = (v: number) => Math.round(v * 10) / 10;
export const centieme = (v: number) => Math.round(v * 100) / 100;

/** Heure totale écoulée depuis le début (jour × 24 + heure), unité des minuteries du prototype. */
export const heureTotale = (e: Pick<Etat, 'jour' | 'minute'>) => e.jour * 24 + Math.floor(e.minute / 60);
export const heureDuJour = (e: Pick<Etat, 'minute'>) => Math.floor(e.minute / 60);
/** Âge en jours (1 le jour de la naissance). */
export const ageJours = (e: Pick<Etat, 'jour' | 'naissance'>) => e.jour - e.naissance + 1;

export function piocher<T>(liste: readonly T[], rng: Aleatoire): T {
  return liste[Math.floor(rng() * liste.length)];
}

/** Accord en genre : accord(e, 'content', 'contente'). */
export function accord(e: { genre: Genre }, m: string, f: string) {
  return e.genre === 'f' ? f : m;
}

/**
 * Remplace les marques d'accord du prototype : « {nom} », « (e) », « il/elle », « lui/elle ».
 * Ex. « {nom} se blottit contre vous, visiblement apaisé(e). »
 */
export function accorderTexte(texte: string, e: { genre: Genre; nom: string }) {
  const f = e.genre === 'f';
  return texte
    .split('{nom}').join(e.nom)
    .replace(/\(e\)/g, f ? 'e' : '')
    .replace(/il\/elle/g, f ? 'elle' : 'il')
    .replace(/Il\/Elle/g, f ? 'Elle' : 'Il')
    .replace(/lui\/elle/g, f ? 'elle' : 'lui');
}

/** Générateur déterministe (mulberry32), pour les tests et les rejeux. */
export function aleatoireFixe(graine: number): Aleatoire {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
