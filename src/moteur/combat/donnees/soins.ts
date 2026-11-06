// Objets de soin utilisables en combat (HEAL_ITEMS du prototype ; prix et icônes restent côté objets).
import type { EffetSoin } from '../combat';

export const SOINS_COMBAT: Record<string, { nom: string; effet: EffetSoin }> = {
  graine_vie: { nom: 'Graine de vie', effet: { part: 0.1 } },
  feuille_vie: { nom: 'Feuille de vie', effet: { part: 0.3 } },
  pierre_ardente: { nom: 'Pierre ardente', effet: { part: 0.4 } },
  rosee_astrale: { nom: 'Rosée Astrale', effet: { part: 0.5 } },
  eclat_ame: { nom: 'Éclat d’âme', effet: { part: 0.5, dureeMs: 10000 } },
  cristal_vital: { nom: 'Cristal vital', effet: { part: 1 } },
  pierre_incantatoire: { nom: 'Pierre incantatoire', effet: { purifie: true } },
};
