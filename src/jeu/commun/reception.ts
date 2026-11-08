// Recevoir un objet, partout dans le jeu (pêche, fouille, envoi de l'écho, trouvailles reprises après un combat,
// achats, coffre, cadeaux des scènes, trouvaille de l'écho au ranch) :
// si le sac a de la place, l'objet est rangé tout de suite ; s'il est plein, la fenêtre « Le sac est plein »
// (FenetreSacPlein.tsx, montée une fois pour toutes dans main.tsx) propose de jeter une pile du sac pour lui faire
// de la place, ou de laisser l'objet. Les règles (place, jeter, ranger) vivent dans src/moteur/simulation/objets.ts.
import { useSyncExternalStore } from 'react';
import type { Etat } from '@/moteur/simulation';
import { aDeLaPlace, jeter, jeterPuisRanger, ranger } from '@/moteur/simulation/objets';

export interface DemandePlace {
  etat: Etat;
  id: string;
  qte: number;
  /** « recevoir » : la fenêtre range l'objet elle-même ; « place » : elle libère seulement un emplacement (achat, coffre). */
  mode: 'recevoir' | 'place';
  /** Phrase sous le titre (par défaut : selon le mode). */
  texte?: string;
  /** Libellé du bouton qui renonce (« Laisser », « Renoncer »…). */
  laisser?: string;
  resoudre: (ok: boolean) => void;
}

let file: DemandePlace[] = [];
const abonnes = new Set<() => void>();
const notifier = () => abonnes.forEach((f) => f());

/** La demande affichée (la première de la file), ou null. */
export const demandeCourante = (): DemandePlace | null => file[0] ?? null;
/** Une fenêtre « sac plein » attend une réponse (pour suspendre le temps, au besoin). */
export const receptionEnCours = () => file.length > 0;

/**
 * Réponse du joueur à la demande courante : `index` = la case du sac dont on jette toute la pile ; null = laisser.
 * Renvoie faux si la réponse est refusée (case vide, objet de quête) : la fenêtre reste ouverte.
 */
export function repondre(index: number | null): boolean {
  const d = file[0];
  if (!d) return false;
  let ok = false;
  if (index !== null) {
    ok = d.mode === 'recevoir' ? jeterPuisRanger(d.etat, index, d.id, d.qte) : jeter(d.etat, index) > 0;
    if (!ok) return false;
  }
  file = file.slice(1);
  notifier();
  d.resoudre(ok);
  return true;
}

function demander(d: Omit<DemandePlace, 'resoudre'>): Promise<boolean> {
  return new Promise((resoudre) => { file = [...file, { ...d, resoudre }]; notifier(); });
}

/** Range `qte` × `id` dans le sac ; s'il est plein, demande au joueur. Vrai : l'objet est dans le sac. */
export function recevoir(etat: Etat, id: string, qte = 1, options: { texte?: string; laisser?: string } = {}): Promise<boolean> {
  if (ranger(etat, id, qte) > 0) return Promise.resolve(true);
  return demander({ etat, id, qte, mode: 'recevoir', ...options });
}

/** Reçoit plusieurs objets l'un après l'autre ; renvoie ceux qu'on a laissés. */
export async function recevoirTous(etat: Etat, objets: (string | { id: string; qte: number })[]): Promise<{ id: string; qte: number }[]> {
  const laisses: { id: string; qte: number }[] = [];
  for (const o of objets) {
    const { id, qte } = typeof o === 'string' ? { id: o, qte: 1 } : o;
    if (!(await recevoir(etat, id, qte))) laisses.push({ id, qte });
  }
  return laisses;
}

/**
 * Avant une action qui rangera l'objet elle-même (achat, coffre) : s'assure qu'il a sa place, au besoin en demandant
 * au joueur de jeter une pile. Vrai : il y a désormais de la place.
 */
export function demanderPlace(etat: Etat, id: string, qte = 1, options: { texte?: string; laisser?: string } = {}): Promise<boolean> {
  if (aDeLaPlace(etat, id)) return Promise.resolve(true);
  return demander({ etat, id, qte, mode: 'place', ...options });
}

/** La demande courante, pour l'affichage. */
export function useDemandePlace(): DemandePlace | null {
  return useSyncExternalStore((f) => { abonnes.add(f); return () => { abonnes.delete(f); }; }, demandeCourante, demandeCourante);
}

/** Pour les tests : vide la file sans répondre. */
export function viderReceptions() { file = []; notifier(); }
