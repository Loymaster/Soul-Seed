// Ce que le combat laisse à l'écho (applyCombatOutcome du prototype) : progrès, or, émotions, blessure.
// Le bilan est calculé ici ; `Simulation.terminerCombat(bilan)` l'applique à la partie.
import type { Caracs, CleCarac, Emotions, Lignee, Stade } from '../simulation/types';
import { CLES_CARACS } from '../simulation/constantes';
import type { Aleatoire, Resultat } from './types';

export interface BilanCombat {
  resultat: Exclude<Resultat, 'fuite'>;
  /** Progrès de chaque caractéristique (à ajouter, plafond 999). */
  progres: Caracs;
  or: number;
  emotions: Partial<Emotions>;
  humeur: number;
  /** La défaite a blessé l'écho. */
  blessure: boolean;
  /** PV restants, à reporter dans la partie. */
  pv: number | null;
}

export interface OptionsBilan {
  /** Chance d'être blessé en cas de défaite (1/3 d'ordinaire ; 1/2 contre Garry ou Phil et Hibert, 1/4 contre Lady Roger). */
  risqueBlessure?: number;
  /** Multiplicateur et bonus d'or des combats marquants (× 4 contre Phil et Hibert ; × 4 + 10 contre Garry). */
  or?: { facteur: number; bonus: number };
}

/** Gain des deux caractéristiques tirées au sort après une victoire, selon le stade de l'adversaire. */
const GAIN_STADE: Record<Stade, number> = { bebe: 2, enfant: 3.5, adolescent: 5, adulte: 6.5 };
/** Âge supposé d'un adversaire sans âge connu. */
const AGE_STADE: Record<Stade, number> = { bebe: 2, enfant: 4, adolescent: 8, adulte: 13 };
const OR_STADE: Record<Stade, number> = { bebe: 1, enfant: 2, adolescent: 4, adulte: 6 };

export function bilanCombat(
  resultat: Exclude<Resultat, 'fuite'>,
  caracs: Caracs,
  adversaire: { stade: Stade; lignee: Lignee; ageJours: number | null; branche?: boolean } | null,
  pv: number | null,
  rng: Aleatoire,
  o: OptionsBilan = {},
): BilanCombat {
  const victoire = resultat === 'victoire';
  const stade = adversaire?.stade ?? 'bebe';
  // Toujours +1 partout, victoire ou défaite : l'expérience du combat.
  const progres = {} as Caracs;
  for (const k of CLES_CARACS) progres[k] = 1;
  if (victoire) {
    for (let i = 0; i < 2; i++) progres[CLES_CARACS[Math.floor(rng() * CLES_CARACS.length)]] += GAIN_STADE[stade];
    // La plus faible progresse de 2, la plus forte de 1 (premières à égalité).
    let basse: CleCarac = CLES_CARACS[0], haute: CleCarac = CLES_CARACS[0];
    for (const k of CLES_CARACS) {
      if ((caracs[k] || 0) < (caracs[basse] || 0)) basse = k;
      if ((caracs[k] || 0) > (caracs[haute] || 0)) haute = k;
    }
    progres[basse] += 2;
    progres[haute] += 1;
  }
  // Or (victoire) : âge de l'adversaire + 2 s'il est sombre + 4 s'il est d'une branche + 1/2/4/6 selon son stade.
  let or = 0;
  if (victoire && adversaire) {
    const sombre = adversaire.lignee === 'sombre' || adversaire.lignee === 'neutre-sombre';
    or = Math.round((adversaire.ageJours ?? AGE_STADE[stade]) + (sombre ? 2 : 0) + (adversaire.branche ? 4 : 0) + OR_STADE[stade]);
    if (o.or) or = or * o.or.facteur + o.or.bonus;
  }
  return {
    resultat, progres, or, pv,
    emotions: victoire ? { joie: 15, colere: 10, peur: -10, tristesse: -5 } : { colere: 15, tristesse: 15, peur: 10, joie: -15 },
    humeur: victoire ? 15 : -10,
    blessure: !victoire && rng() < (o.risqueBlessure ?? 1 / 3),
  };
}
