// Épitaphe de la carte « Mémoire des échos » : choisie selon la vie de l'écho, par ordre de priorité.
// Première version : la cause de la disparition, un haut fait, sinon le stade atteint.
// (La liste complète des accomplissements reste à écrire : voir A-FAIRE.md.)
import { accord, type Etat } from '@/moteur/simulation';

interface Regle { si: (e: Etat) => boolean; texte: (e: Etat) => string }

const il = (e: Etat) => accord(e, 'Il', 'Elle');

/** De la plus prioritaire à la moins prioritaire : la première qui s'applique l'emporte. */
const REGLES: Regle[] = [
  { si: (e) => e.mort === 'vieillesse', texte: (e) => `${il(e)} a vécu chaque saison jusqu’à la dernière.` },
  { si: (e) => e.garryVaincu, texte: (e) => `${il(e)} a affronté plus grand ${accord(e, 'que lui', 'qu’elle')}, et n’a jamais renoncé.` },
  { si: (e) => e.mort === 'combat' || e.mort === 'blessure', texte: (e) => `${il(e)} s’est ${accord(e, 'battu', 'battue')} jusqu’au bout.` },
  { si: (e) => e.mort === 'maladie', texte: (e) => `Même ${accord(e, 'affaibli', 'affaiblie')}, ${il(e).toLowerCase()} cherchait encore votre regard.` },
  { si: (e) => e.mort === 'faim', texte: () => 'Le ventre vide, mais le cœur plein de vous.' },
  { si: (e) => e.stade === 'bebe', texte: () => 'Une vie brève, mais une lueur que vous n’oublierez pas.' },
  { si: () => true, texte: (e) => `${il(e)} a grandi à vos côtés, un jour après l’autre.` },
];

export function epitaphe(e: Etat): string {
  return (REGLES.find((r) => r.si(e)) ?? REGLES[REGLES.length - 1]).texte(e);
}
