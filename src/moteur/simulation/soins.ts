// « Panser les blessures » au ranch : rendre à l'écho ses PV de combat, en prenant le temps qu'il faut.
// Règles (demande de l'autrice) :
//  - chaque demi-heure passée à panser rend 10 % des PV de combat maximum ;
//  - on choisit le temps passé (réglette), au plus la tranche de PV perdus arrondie à la dizaine supérieure :
//    71 à 80 % perdus → 8 demi-heures, soit 4 h au plus ; 5 % perdus → 30 min ;
//  - un écho « à bout de forces » (0 PV) redevient apte au combat dès que ses PV remontent ;
//  - les PV pleins s'écrivent `pvCombat = null` (pleine forme), comme après un somme.
// Ce n'est pas le pansement du sac : une blessure (état « blessé ») demande toujours un pansement.
// Jamais de chiffre pour le joueur : des mots (etatPlaies, plaiesApres).
import type { Caracs, Etat, Genre } from './types';

/** Une demi-heure (minutes) pour chaque dixième de PV rendu. */
export const DEMI_HEURE_PANSEMENT = 30;
/** Part des PV maximum rendue par demi-heure. */
export const PART_PAR_DEMI_HEURE = 0.1;

/** PV de combat maximum (moteur de combat : robustesse × 7, comme le prototype). */
export const pvMaxEcho = (c: Pick<Caracs, 'robustesse'>) => Math.max(1, Math.round((c.robustesse || 0) * 7));

/** Part des PV de combat perdue (0 : intact, 1 : à bout de forces). */
export function partPerdue(e: Pick<Etat, 'pvCombat' | 'caracs'>): number {
  if (e.pvCombat == null) return 0;
  return Math.max(0, Math.min(1, 1 - e.pvCombat / pvMaxEcho(e.caracs)));
}

/** Nombre maximum de demi-heures à panser : la tranche perdue arrondie à la dizaine supérieure (0 si rien à panser). */
export function demiHeuresPansement(e: Pick<Etat, 'pvCombat' | 'caracs'>): number {
  const p = partPerdue(e);
  return p <= 0 ? 0 : Math.min(10, Math.ceil(p * 10 - 1e-9));
}

const acc = (g: Genre, m: string, f: string) => (g === 'f' ? f : m);

/** L'état de ses plaies, en mots (avant de panser). */
export function etatPlaies(e: Pick<Etat, 'pvCombat' | 'caracs' | 'genre'>): string {
  const p = partPerdue(e), g = e.genre;
  if (p <= 0) return 'Ses plaies sont refermées.';
  if (p >= 1) return `À bout de forces, ${acc(g, 'il', 'elle')} est couvert${acc(g, '', 'e')} de plaies.`;
  if (p > 0.6) return `${acc(g, 'Il', 'Elle')} est bien amoché${acc(g, '', 'e')}.`;
  if (p > 0.3) return `Quelques vilaines plaies ${acc(g, 'le', 'la')} font grimacer.`;
  return 'Rien que quelques égratignures.';
}

/** Ce que seront ses plaies après `demiHeures` de soins (aperçu de la réglette, et note de fin). */
export function plaiesApres(e: Pick<Etat, 'pvCombat' | 'caracs'>, demiHeures: number): string {
  const p = partPerdue(e);
  const reste = Math.max(0, p - demiHeures * PART_PAR_DEMI_HEURE);
  if (reste <= 1e-9) return 'ses plaies seront tout à fait refermées';
  const gueri = 1 - reste / p;
  if (gueri >= 0.75) return 'ses plaies seront presque refermées';
  if (gueri >= 0.45) return 'ses plaies seront refermées à moitié';
  return 'ses plaies commenceront à peine à se refermer';
}

/** La même chose au passé, une fois les soins finis. */
export function plaiesFinies(avant: number, apres: number): string {
  if (apres <= 1e-9) return 'Ses plaies sont refermées.';
  const gueri = avant > 0 ? 1 - apres / avant : 1;
  if (gueri >= 0.75) return 'Ses plaies sont presque refermées.';
  if (gueri >= 0.45) return 'Ses plaies sont refermées à moitié…';
  return 'Ses plaies commencent à peine à se refermer…';
}

/** « 30 min », « 1 h », « 1 h 30 »… */
export function dureeDemiHeures(n: number): string {
  const h = Math.floor(n / 2), m = n % 2 ? 30 : 0;
  return h === 0 ? `${m} min` : m ? `${h} h ${m}` : `${h} h`;
}
