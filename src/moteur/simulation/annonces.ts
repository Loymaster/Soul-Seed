// Ce que la simulation annonce à tout le jeu, quel que soit l'écran qui la fait tourner (ranch, village, exploration,
// scène, combat) : une évolution, un écroulement de fatigue. Le jeu (src/jeu/main.tsx) l'écoute pour jouer la séquence d'évolution par-dessus
// n'importe quel écran ; le ranch la joue lui-même.
// Et une horloge suspendue : tant qu'une séquence plein écran (l'évolution) se joue, aucune minute ne passe,
// quelle que soit la simulation qui essaie d'avancer (Simulation.minute ne fait rien).
import type { Etat, Stade } from './types';

export interface AnnonceEvolution {
  etat: Etat;
  de: Stade;
  vers: Stade;
  /** l'image de l'ancienne forme (chemin du catalogue) */
  avant: string;
  /** l'image de la nouvelle forme */
  apres: string;
}

const auditeurs = new Set<(a: AnnonceEvolution) => void>();

/** S'abonner aux évolutions (renvoie de quoi se désabonner). */
export function ecouterEvolutions(f: (a: AnnonceEvolution) => void): () => void {
  auditeurs.add(f);
  return () => { auditeurs.delete(f); };
}

export function annoncerEvolution(a: AnnonceEvolution) {
  for (const f of [...auditeurs]) { try { f(a); } catch { /* un auditeur en défaut n'arrête pas la simulation */ } }
}

/** L'écho s'est écroulé de fatigue et a dormi `heures` heures (le voile du sommeil se joue, où que l'on soit). */
export interface AnnonceEffondrement { etat: Etat; heures: number }
const auditeursSommeil = new Set<(a: AnnonceEffondrement) => void>();
export function ecouterEffondrements(f: (a: AnnonceEffondrement) => void): () => void {
  auditeursSommeil.add(f);
  return () => { auditeursSommeil.delete(f); };
}
export function annoncerEffondrement(a: AnnonceEffondrement) {
  for (const f of [...auditeursSommeil]) { try { f(a); } catch { /* sans effet sur la simulation */ } }
}

let suspensions = 0;
/** Arrête l'horloge de toutes les simulations ; renvoie de quoi la relancer (une seule fois). */
export function suspendreTemps(): () => void {
  suspensions++;
  let fait = false;
  return () => { if (!fait) { fait = true; suspensions = Math.max(0, suspensions - 1); } };
}
export const tempsSuspendu = () => suspensions > 0;
