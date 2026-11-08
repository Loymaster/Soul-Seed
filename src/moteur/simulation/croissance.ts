// Les échos sauvages grandissent aussi (ajout : dans le prototype, leur âge avançait chaque jour mais leur stade,
// leur image et leurs caractéristiques restaient ceux de la rencontre).
//
// Règle, la même qu'à leur création (generateWildEcho) :
//  - stade selon l'âge (devPhaseForAge, complété de l'adulte annoncé en commentaire) : 1–2 jours bébé,
//    3–6 enfant, 7–12 adolescent, 13 et plus adulte ;
//  - caractéristiques proportionnelles à (1 + âge / 8) : chaque jour, elles sont multipliées par
//    (1 + (âge + 1) / 8) / (1 + âge / 8) — un écho rencontré bébé et revu dix jours plus tard est aussi fort
//    qu'un écho tiré directement à cet âge ;
//  - au 20ᵉ jour (l'âge où notre écho s'éteint), il ne revient plus : il disparaît de la liste des échos connus
//    (sauf s'il est au ranch à ce moment-là ; il partira à la fin de sa visite, et disparaîtra la nuit suivante).
// Son image suit son stade (apparence() : forme de base de sa lignée, pas de branche ni de forme mêlée).
import type { EchoSauvage, Etat, Stade } from './types';
import { AGE_MORT, CLES_CARACS } from './constantes';
import { dixieme } from './outils';

/** Stade d'un écho sauvage selon son âge (en jours). */
export function stadeSauvage(ageJours: number): Stade {
  if (ageJours <= 2) return 'bebe';
  if (ageJours <= 6) return 'enfant';
  if (ageJours <= 12) return 'adolescent';
  return 'adulte';
}

/** Facteur de croissance des caractéristiques à un âge donné (generateWildEcho : × (1 + âge / 8)). */
export const facteurAge = (ageJours: number) => 1 + ageJours / 8;

/** Un jour de plus pour un écho sauvage : âge, caractéristiques, stade. Renvoie vrai s'il a changé de stade. */
export function vieillirSauvage(s: EchoSauvage): boolean {
  const ratio = facteurAge(s.ageJours + 1) / facteurAge(s.ageJours);
  s.ageJours += 1;
  for (const k of CLES_CARACS) s.caracs[k] = Math.min(999, dixieme(s.caracs[k] * ratio));
  const avant = s.stade;
  s.stade = stadeSauvage(s.ageJours);
  return s.stade !== avant;
}

/**
 * Le passage d'un jour pour tous les échos sauvages connus. Ceux qui atteignent l'âge d'AGE_MORT disparaissent
 * (sauf le visiteur du moment). Renvoie ceux qui sont partis pour de bon.
 */
export function vieillirSauvages(e: Pick<Etat, 'echosSauvages' | 'visiteur'>): EchoSauvage[] {
  for (const s of e.echosSauvages) vieillirSauvage(s);
  const partis = e.echosSauvages.filter((s) => s.ageJours >= AGE_MORT && s.id !== e.visiteur?.id);
  if (partis.length) e.echosSauvages = e.echosSauvages.filter((s) => !partis.includes(s));
  return partis;
}

const STADE_ATTEINT: Record<Stade, [string, string]> = {
  bebe: ['un bébé', 'un bébé'], enfant: ['un enfant', 'une enfant'], adolescent: ['un adolescent', 'une adolescente'], adulte: ['un adulte', 'une adulte'],
};

/** Ce qu'on remarque au retour d'un écho qui a grandi depuis sa dernière visite (vide sinon) ; note ce qu'on a vu. */
export function remarquerCroissance(s: EchoSauvage): string {
  const vu = s.stadeVu;
  s.stadeVu = s.stade;
  if (!vu || vu === s.stade) return '';
  const f = s.genre === 'f';
  return ` ${f ? 'Elle' : 'Il'} a bien grandi depuis la dernière fois : c’est maintenant ${STADE_ATTEINT[s.stade][f ? 1 : 0]}.`;
}

/** Au journal, quand un écho connu ne reviendra plus. */
export const texteAdieu = (s: EchoSauvage) =>
  `On ne reverra plus ${s.nom} : ${s.genre === 'f' ? 'elle' : 'il'} a atteint le bout de son âge, comme tous les échos.`;

