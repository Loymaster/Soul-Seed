// Coffre de Maïko, puis entrepôt (dropIntoSlot / depositResources du prototype).
// Les objets passent librement du sac au coffre (une pile entière à la fois) ; les ressources portées
// se déposent toutes d'un coup, dans la limite du plafond de l'entrepôt, et ne se retirent pas.
import type { Etat } from '../simulation/types';
import { ranger } from '../simulation/objets';
import { CASES_COFFRE, PLAFOND_COFFRE, RESSOURCES, niveauEntrepot, type Monde, type Ressource } from './index';

export const casesCoffre = (m: Monde) => CASES_COFFRE[niveauEntrepot(m)];
export const plafondCoffre = (m: Monde) => PLAFOND_COFFRE[niveauEntrepot(m)];
export const nomCoffre = (m: Monde) => (niveauEntrepot(m) > 0 ? 'L’entrepôt' : 'Le coffre de Maïko');

/** Agrandit le coffre si l'entrepôt a grandi (les objets déjà rangés restent à leur place). */
export function ajusterCoffre(m: Monde) {
  const n = casesCoffre(m);
  while (m.coffre.objets.length < n) m.coffre.objets.push(null);
}

/** Dépose la pile de la case `index` du sac dans le coffre. */
export function deposerObjet(e: Etat, m: Monde, index: number): { ok: boolean; raison?: string } {
  ajusterCoffre(m);
  const c = e.inventaire[index];
  if (!c) return { ok: false };
  const pile = m.coffre.objets.find((x) => x?.id === c.id);
  if (pile) pile.qte += c.qte;
  else {
    const libre = m.coffre.objets.findIndex((x) => !x);
    if (libre < 0) return { ok: false, raison: `${nomCoffre(m)} est plein.` };
    m.coffre.objets[libre] = { id: c.id, qte: c.qte };
  }
  e.inventaire[index] = null;
  return { ok: true };
}

/** Reprend la pile de la case `index` du coffre dans le sac. */
export function reprendreObjet(e: Etat, m: Monde, index: number): { ok: boolean; raison?: string; sacPlein?: boolean } {
  const c = m.coffre.objets[index];
  if (!c) return { ok: false };
  if (!ranger(e, c.id, c.qte)) return { ok: false, sacPlein: true, raison: 'Le sac est plein.' };
  m.coffre.objets[index] = null;
  return { ok: true };
}

/** Dépose toutes les ressources portées ; renvoie les ressources dont la place est pleine (le reste demeure dans le sac). */
export function deposerRessources(m: Monde): { deposees: Partial<Record<Ressource, number>>; pleines: Ressource[] } {
  const plafond = plafondCoffre(m);
  const deposees: Partial<Record<Ressource, number>> = {};
  const pleines: Ressource[] = [];
  for (const r of RESSOURCES) {
    const porte = m.ressources[r] ?? 0;
    if (!porte) continue;
    const stock = m.coffre.ressources[r] ?? 0;
    const q = Math.max(0, Math.min(porte, plafond - stock));
    if (q < porte) pleines.push(r);
    if (!q) continue;
    m.coffre.ressources[r] = stock + q;
    m.ressources[r] = porte - q;
    deposees[r] = q;
  }
  return { deposees, pleines };
}

/** Ressources disponibles pour Ash : celles du coffre, puis celles portées. */
export const ressourcesDisponibles = (m: Monde, r: Ressource) => (m.coffre.ressources[r] ?? 0) + (m.ressources[r] ?? 0);
