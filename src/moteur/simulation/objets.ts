// Objets du sac : aliments (donnees/aliments.ts) et objets divers (repris de HEAL_ITEMS / ITEM_LABELS).
import type { Aliment, CaseInventaire, Etat } from './types';
import { ALIMENTS } from './donnees/aliments';

export interface ObjetDivers {
  id: string;
  nom: string;
  prix: number;
  icone: string;
  /** Ce que l'objet fait au ranch ; absent = utilisable seulement en combat ou plus tard. */
  usage?: 'pansement' | 'medicament' | 'appat';
  description: string;
}

export const OBJETS_DIVERS: ObjetDivers[] = [
  { id: 'bandage', nom: 'Pansement', prix: 10, icone: 'objets/divers/pansement.png', usage: 'pansement', description: 'Referme une blessure.' },
  { id: 'medicament', nom: 'Médicament', prix: 25, icone: 'objets/divers/medicament.png', usage: 'medicament', description: 'Guérit une maladie et protège un temps.' },
  { id: 'graine_vie', nom: 'Graine de vie', prix: 15, icone: 'objets/divers/graine-vie.png', description: 'Rend un peu de vigueur pendant un combat.' },
  { id: 'feuille_vie', nom: 'Feuille de vie', prix: 40, icone: 'objets/divers/feuille-vie.png', description: 'Rend de la vigueur pendant un combat.' },
  { id: 'rosee_astrale', nom: 'Rosée astrale', prix: 75, icone: 'objets/divers/rosee-astrale.png', description: 'Rend beaucoup de vigueur pendant un combat.' },
  { id: 'cristal_vital', nom: 'Cristal vital', prix: 180, icone: 'objets/divers/cristal-vital.png', description: 'Rend toute sa vigueur pendant un combat.' },
  { id: 'eclat_ame', nom: 'Éclat d’âme', prix: 90, icone: 'objets/divers/eclat-ame.png', description: 'Une vigueur qui revient peu à peu, en combat.' },
  { id: 'pierre_incantatoire', nom: 'Pierre incantatoire', prix: 35, icone: 'objets/divers/pierre-incantatoire.png', description: 'Dissipe un sort, en combat.' },
  { id: 'appat_echo', nom: 'Appât à écho', prix: 45, icone: 'objets/divers/appat-echo.png', usage: 'appat', description: 'Attire un écho sauvage au ranch.' },
  { id: 'repousse', nom: 'Repousse', prix: 30, icone: 'objets/divers/repousse.png', description: 'Tient les échos agressifs à distance en exploration.' },
  { id: 'pierre_ardente', nom: 'Pierre ardente', prix: 55, icone: 'objets/divers/pierre-ardente.png', description: 'Une chaleur qui revigore, en combat.' },
];

const PAR_ID_ALIMENT = new Map(ALIMENTS.map(a => [a.id, a]));
const PAR_ID_DIVERS = new Map(OBJETS_DIVERS.map(o => [o.id, o]));

export const aliment = (id: string): Aliment | undefined => PAR_ID_ALIMENT.get(id);
export const objetDivers = (id: string): ObjetDivers | undefined => PAR_ID_DIVERS.get(id);

export function descriptionObjet(id: string): { nom: string; icone: string; description: string } | null {
  const a = aliment(id);
  if (a) return { nom: a.nom, icone: a.icone, description: a.categories.join(' · ') };
  const o = objetDivers(id);
  return o ? { nom: o.nom, icone: o.icone, description: o.description } : null;
}

/** Retire une unité de la case ; renvoie faux si la case est vide. */
export function consommer(e: Etat, index: number): boolean {
  const c = e.inventaire[index];
  if (!c) return false;
  e.inventaire[index] = c.qte > 1 ? { ...c, qte: c.qte - 1 } : null;
  return true;
}

/** Ajoute des objets (empile d'abord, puis cases libres). Renvoie le nombre réellement rangé. */
export function ranger(e: Etat, id: string, qte = 1): number {
  let reste = qte;
  const pile = e.inventaire.find((c): c is CaseInventaire => !!c && c.id === id);
  if (pile) { pile.qte += reste; return qte; }
  const libre = e.inventaire.findIndex(c => !c);
  if (libre === -1) return 0;
  e.inventaire[libre] = { id, qte: reste };
  reste = 0;
  return qte - reste;
}

export const trouverObjet = (e: Etat, id: string) => e.inventaire.findIndex(c => c?.id === id);
