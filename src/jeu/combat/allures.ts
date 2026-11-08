// L'allure d'un combattant à l'écran (table src/jeu/commun/allures.ts) : classes CSS (allures.css),
// élévation des volants et durée d'un cycle de déplacement. Rien ici ne touche au moteur de combat.
import { allureDe, classesAllure, enLAir, type Demarche } from '../commun/allures';

/** Durée d'un cycle de déplacement en combat (s), plus vive qu'au ranch. */
const CYCLE: Record<Demarche, number> = { bipede: 0.46, quadrupede: 0.36, sautillant: 0.42, rampant: 0.62, flottant: 1.1, vole: 0.34, nage: 0.95, immobile: 1 };
const CARRURE = { leger: 0.88, moyen: 1, lourd: 1.2 } as const;

export interface AllureCombat { classes: string; altitude: number; cycle: number }

/** @param chemin image du combattant (sous public/assets) ; @param hauteur hauteur affichée de l'image (px) */
export function allureCombat(chemin: string | undefined, hauteur: number): AllureCombat {
  const a = allureDe(chemin);
  if (!a) return { classes: '', altitude: 0, cycle: 0.35 };
  return {
    classes: classesAllure(a),
    altitude: enLAir(a.demarche) ? Math.round(a.hauteur * hauteur * 0.7) : 0,
    cycle: +(CYCLE[a.demarche] * a.cadence * CARRURE[a.carrure]).toFixed(3),
  };
}
