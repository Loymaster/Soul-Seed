// Choix des techniques (techniqueUseChance, pickTechnique, pickTechniqueRanged du prototype).
import type { Aleatoire, Combattant, RoleTechnique } from './types';
import { TECHNIQUES } from './donnees/techniques';

/** Chance de tenter une technique plutôt qu'un coup simple : 12 % + intelligence / 900 (+ autonomie / 300 pour l'écho du joueur). */
export function chanceTechnique(c: Combattant) {
  let chance = 0.12 + (c.caracs.intelligence || 0) / 900;
  if (c.dispositions) chance += (c.dispositions.autonomie || 0) / 300;
  return Math.max(0.08, Math.min(0.9, chance));
}

const piocher = <T>(l: T[], rng: Aleatoire) => l[Math.floor(rng() * l.length)];

/**
 * Technique choisie au moment de partir à l'attaque, ou null (coup simple).
 * Les rôles cachés sont pondérés : prévention en début de combat et vie haute, défense quand la vie baisse,
 * agression pour achever un adversaire affaibli et à mesure que le combat dure.
 */
export function choisirTechnique(c: Combattant, cible: Combattant | null, t: number, rng: Aleatoire): string | null {
  if (c.techniqueForcee) { const n = c.techniqueForcee; c.techniqueForcee = null; return n; }
  if (!c.techniques.length) return null;
  if (rng() > chanceTechnique(c)) { c.doitFrapper = false; return null; }
  const ordreAttaque = c.ordre?.type === 'attaque';
  const doitFrapper = c.doitFrapper || ordreAttaque;
  const s = Math.max(0, t / 1000);
  const vieSoi = c.pvMax ? c.pv / c.pvMax : 1;
  const vieCible = cible && cible.pvMax ? cible.pv / cible.pvMax : 1;
  const poids: Record<RoleTechnique, number> = {
    prevention: Math.max(0.05, 1 - s / 10) * (0.4 + vieSoi * 0.6),
    defense: (1 - vieSoi) * 1.6 + (s > 25 ? 0.4 : 0),
    agression: 0.8 + (1 - vieCible) * 1.6 + Math.min(1, s / 40),
  };
  const parRole: Record<RoleTechnique, string[]> = { prevention: [], defense: [], agression: [] };
  for (const n of c.techniques) {
    const f = TECHNIQUES[n];
    if (!f) continue;
    // Après un soutien, ou sous l'ordre « Attaque », il faut frapper.
    if (doitFrapper && f.sansDegats) continue;
    // Sous l'ordre « Attaque » : corps à corps (ou zone) seulement.
    if (ordreAttaque && f.distance && !f.zone) continue;
    parRole[f.role].push(n);
  }
  const roles = (['prevention', 'defense', 'agression'] as const).filter(r => parRole[r].length);
  if (!roles.length) { c.doitFrapper = false; return null; }
  const total = roles.reduce((a, r) => a + poids[r], 0);
  let x = rng() * total;
  let role = roles[roles.length - 1];
  for (const r of roles) { if (x < poids[r]) { role = r; break; } x -= poids[r]; }
  const choisie = piocher(parRole[role], rng);
  c.doitFrapper = !!TECHNIQUES[choisie]?.sansDegats;
  return choisie;
}

/** Sous l'ordre « Reste à distance » : 85 % de chances de prendre une technique à distance s'il y en a une. */
export function choisirTechniqueDistance(c: Combattant, cible: Combattant | null, t: number, rng: Aleatoire): string | null {
  if (c.techniqueForcee) { const n = c.techniqueForcee; c.techniqueForcee = null; return n; }
  if (!c.techniques.length) return null;
  let aDistance = c.techniques.filter(n => TECHNIQUES[n]?.distance);
  if (c.doitFrapper) aDistance = aDistance.filter(n => !TECHNIQUES[n].sansDegats);
  if (aDistance.length && rng() < 0.85) {
    const choisie = piocher(aDistance, rng);
    c.doitFrapper = !!TECHNIQUES[choisie].sansDegats;
    return choisie;
  }
  return choisirTechnique(c, cible, t, rng);
}
