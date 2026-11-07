// Passerelles entre la simulation et le combat : l'écho du joueur, un écho sauvage.
import type { EchoSauvage, Etat } from '../simulation/types';
import { CLES_CARACS } from '../simulation/constantes';
import { ageJours } from '../simulation/outils';
import type { Aleatoire } from './types';
import type { DescriptionCombattant } from './combat';
import { poolTechniques, techniquesAdversaire, techniquesEquipees } from './pools';

/**
 * À bout de forces : l'écho est tombé au dernier combat (0 PV de combat) et ne s'est pas encore reposé.
 * Il ne peut plus se battre (une rencontre ne laisse que s'éclipser) jusqu'à un somme (tente, ranch) ou le réconfort de Myhra.
 */
export const aBoutDeForces = (e: Pick<Etat, 'pvCombat'>) => e.pvCombat != null && e.pvCombat <= 0;

/** L'écho du joueur, tel qu'il entre en combat (malade, PV restants, lien et émotions compris). */
export function descriptionDepuisEtat(e: Etat): DescriptionCombattant {
  const t = e.techniques ?? { connues: [], equipees: [], seuils: [] };
  return {
    nom: e.nom || 'Votre écho', genre: e.genre, graine: e.graine, lignee: e.lignee, stade: e.stade,
    evolution: e.evolution, ageJours: ageJours(e), caracs: { ...e.caracs },
    techniques: techniquesEquipees(e.stade, t.equipees, t.connues),
    pv: e.pvCombat ?? null, malade: e.malade, taille: e.taille,
    dispositions: {
      attachement: e.attachement, affection: e.affection, humeur: e.humeur,
      colere: e.emotions.colere, peur: e.emotions.peur, autonomie: e.autonomie,
    },
  };
}

/**
 * Un écho sauvage en adversaire, avec des techniques tirées dans son pool.
 * `renfort` multiplie ses caractéristiques (le combat « enfant » du prototype : × 1,2 à 1,4).
 */
export function descriptionSauvage(s: EchoSauvage, rng: Aleatoire, renfort?: { min: number; max: number }): DescriptionCombattant {
  const caracs = { ...s.caracs };
  if (renfort) for (const k of CLES_CARACS) caracs[k] = Math.round(caracs[k] * (renfort.min + rng() * (renfort.max - renfort.min)) * 10) / 10;
  const pool = poolTechniques({ stade: s.stade, graine: s.graine, lignee: s.lignee, evolution: null });
  return {
    nom: s.nom, genre: s.genre, graine: s.graine, lignee: s.lignee, stade: s.stade, evolution: null,
    ageJours: s.ageJours, caracs, techniques: techniquesAdversaire(pool, s.stade, rng),
  };
}
