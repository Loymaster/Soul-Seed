// Techniques qu'un écho peut connaître selon son stade et sa lignée (getTechniquePool, arenaTechniquePool,
// aiTechniquesFor, checkTechniqueUnlocks du prototype).
import type { Graine, Lignee, ResultatEvolution, Stade } from '../simulation/types';
import type { Aleatoire } from './types';
import { MAX_TECHNIQUES, SEUILS_TECHNIQUES } from './constantes';
import {
  POOL_ADOLESCENT, POOL_ADULTE, POOL_BRANCHE, POOL_BRANCHE_ADULTE, POOL_ENFANT, POOL_FRAGMENT, POOL_MELEE,
} from './donnees/techniques';

const LETTRE: Record<Graine, string> = { joy: 'J', wrath: 'W', sorrow: 'S', fear: 'F', disgust: 'D' };

/** Code court de lignée : lettre de la graine, préfixe D pour la forme sombre, N / DN pour les neutres. */
export function codeLignee(graine: Graine, lignee: Lignee) {
  if (lignee === 'neutre') return 'N';
  if (lignee === 'neutre-sombre') return 'DN';
  return (lignee === 'sombre' ? 'D' : '') + LETTRE[graine];
}

export interface OptionsPool {
  /**
   * Pools adultes propres (adulte, branche adulte, mêlé). Le jeu du prototype ne s'en servait qu'en mode Arène :
   * un adulte y gardait les techniques de son adolescence.
   */
  poolsAdultes?: boolean;
}

export function poolTechniques(
  e: { stade: Stade; graine: Graine; lignee: Lignee; evolution: ResultatEvolution | null },
  o: OptionsPool = {},
): string[] {
  const { stade, evolution: r } = e;
  if (stade === 'bebe') return [];
  const code = codeLignee(e.graine, e.lignee);
  if (stade === 'enfant') return POOL_ENFANT[code] ?? [];
  if (r?.genre === 'fragment') return POOL_FRAGMENT[r.code] ?? [];
  if (stade === 'adulte' && o.poolsAdultes) {
    if (r?.genre === 'branche-adulte') return POOL_BRANCHE_ADULTE[r.code] ?? [];
    if (r?.genre === 'melee') return POOL_MELEE[r.code] ?? [];
    if (r?.genre !== 'branche') return POOL_ADULTE[code] ?? [];
  }
  // Une branche adulte garde le pool de sa branche adolescente (même code).
  if (r?.genre === 'branche' || r?.genre === 'branche-adulte') return POOL_BRANCHE[r.code] ?? [];
  return POOL_ADOLESCENT[code] ?? [];
}

/** Techniques d'un adversaire : 2 au stade Enfant, 3 ensuite, tirées dans son pool. */
export function techniquesAdversaire(pool: string[], stade: Stade, rng: Aleatoire): string[] {
  if (stade === 'bebe' || !pool.length) return [];
  const n = Math.min(stade === 'enfant' ? 2 : MAX_TECHNIQUES, pool.length);
  // Mélange de Fisher-Yates (le prototype triait au hasard, ce qui biaise le tirage).
  const l = pool.slice();
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l.slice(0, n);
}

/**
 * Apprentissage : chaque seuil d'intelligence franchi pour la première fois apprend une technique du pool
 * pas encore connue. Un seuil franchi sans rien à apprendre est perdu (pas de rattrapage, comme le prototype).
 */
export function apprendreTechniques(
  intelligence: number, seuilsPasses: number[], connues: string[], pool: string[], rng: Aleatoire,
): { seuilsPasses: number[]; connues: string[]; apprises: string[] } {
  const passes = seuilsPasses.slice();
  const sues = connues.slice();
  const apprises: string[] = [];
  for (const s of SEUILS_TECHNIQUES) {
    if (intelligence < s || passes.includes(s)) continue;
    passes.push(s);
    const possibles = pool.filter(n => !sues.includes(n));
    if (!possibles.length) continue;
    const n = possibles[Math.floor(rng() * possibles.length)];
    sues.push(n);
    apprises.push(n);
  }
  return { seuilsPasses: passes, connues: sues, apprises };
}

/** Techniques équipées utilisables (aucune au stade Bébé, trois au plus). */
export function techniquesEquipees(stade: Stade, equipees: string[], connues: string[]) {
  if (stade === 'bebe') return [];
  return equipees.filter(n => connues.includes(n)).slice(0, MAX_TECHNIQUES);
}

export type TechniquesEcho = { connues: string[]; equipees: string[]; seuils: number[] };

/**
 * Choisir ou laisser une technique pour le combat (toggleEquipFromMenu du prototype) : on retire toujours une
 * technique emportée ; on n'en prend une que si elle est apprise, qu'elle fait partie des affinités de sa forme
 * actuelle (son pool) et qu'il en emporte moins de trois. Aucune au stade Bébé.
 */
export function basculerTechnique(
  t: TechniquesEcho, nom: string, stade: Stade, pool: string[],
): { ok: true; techniques: TechniquesEcho; equipee: boolean } | { ok: false; cause: 'inconnue' | 'bebe' | 'affinites' | 'plein' } {
  if (t.equipees.includes(nom)) return { ok: true, equipee: false, techniques: { ...t, equipees: t.equipees.filter((n) => n !== nom) } };
  if (!t.connues.includes(nom)) return { ok: false, cause: 'inconnue' };
  if (stade === 'bebe') return { ok: false, cause: 'bebe' };
  if (!pool.includes(nom)) return { ok: false, cause: 'affinites' };
  if (t.equipees.length >= MAX_TECHNIQUES) return { ok: false, cause: 'plein' };
  return { ok: true, equipee: true, techniques: { ...t, equipees: [...t.equipees, nom] } };
}

/**
 * Ce qui reste à apprendre : chaque seuil d'intelligence pas encore franchi apprendra une technique, tant que son
 * pool actuel en contient d'inconnues. `ecart` : ce qui manque d'intelligence jusqu'au prochain seuil (caché :
 * l'affichage le traduit en mots).
 */
export function techniquesADecouvrir(intelligence: number, t: TechniquesEcho, pool: string[]): { nombre: number; ecart: number | null } {
  const restants = SEUILS_TECHNIQUES.filter((s) => !t.seuils.includes(s) && intelligence < s);
  const inconnues = pool.filter((n) => !t.connues.includes(n)).length;
  return { nombre: Math.min(restants.length, inconnues), ecart: restants.length && inconnues ? restants[0] - intelligence : null };
}
