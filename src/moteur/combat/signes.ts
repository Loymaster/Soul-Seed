// Ce que le joueur perçoit d'un combattant : sa posture, l'allure de sa vie, ses statuts. Jamais de chiffre.
import type { Combattant, Statut } from './types';
import { STATUTS_NEGATIFS, STATUTS_POSITIFS } from './constantes';

export type PostureCombat = 'ko' | 'sonne' | 'esquive' | 'pare' | 'frappe' | 'elan' | 'marche' | 'garde';
/** Allure générale, d'après la part de vie restante (paliers : 75 %, 40 %, 15 %). */
export type AllureCombat = 'vaillant' | 'entame' | 'eprouve' | 'chancelant' | 'ko';

export interface SignesCombat {
  posture: PostureCombat;
  allure: AllureCombat;
  /** Statuts actifs, dans un ordre stable (positifs puis négatifs). */
  statuts: { statut: Statut; positif: boolean }[];
  /** La jauge de vie est à montrer (juste après un coup ou un soin). */
  vieVisible: boolean;
  /** Part de vie restante, pour une jauge dessinée (jamais affichée en chiffre). */
  vie: number;
  regard: 1 | -1;
}

export function lireSignesCombat(c: Combattant, t: number): SignesCombat {
  const part = c.pvMax ? c.pv / c.pvMax : 0;
  const allure: AllureCombat = c.ko ? 'ko' : part > 0.75 ? 'vaillant' : part > 0.4 ? 'entame' : part > 0.15 ? 'eprouve' : 'chancelant';
  let posture: PostureCombat;
  if (c.ko) posture = 'ko';
  else if (c.sonneJusqua > t || (c.statuts.etourdissement && c.statuts.etourdissement.fin > t)) posture = 'sonne';
  else if (c.esquiveJusqua > t) posture = 'esquive';
  else if (c.paradeJusqua > t) posture = 'pare';
  else if (c.frappeJusqua > t) posture = 'frappe';
  else if (c.deplacement === 'attaque') posture = 'elan';
  else if (c.deplacement !== 'attente') posture = 'marche';
  else posture = 'garde';
  const statuts: SignesCombat['statuts'] = [];
  for (const s of [...STATUTS_POSITIFS, ...STATUTS_NEGATIFS]) {
    const v = c.statuts[s] as { fin?: number } | undefined;
    if (v && (v.fin == null || v.fin > t)) statuts.push({ statut: s, positif: (STATUTS_POSITIFS as readonly string[]).includes(s) });
  }
  return { posture, allure, statuts, vieVisible: c.vieVisibleJusqua > t, vie: Math.max(0, Math.min(1, part)), regard: c.regard };
}
