import type { Aliment, Regime } from './types';

/** isRegimeCompatible : les nodules conviennent à tous ; un carnivore accepte aussi les produits animaliers et les sucreries. */
export function regimeCompatible(regime: Regime, a: Aliment) {
  if (a.categories.includes('Nodule')) return true;
  if (regime === 'Carnivore') return a.categories.some(c => c === 'Poisson' || c === 'Viande' || c === 'Produits animaliers' || c === 'Sucreries');
  if (regime === 'Végétarien') return !a.categories.some(c => c === 'Poisson' || c === 'Viande');
  return true;
}
