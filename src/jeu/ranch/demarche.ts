// Profil de déplacement de l'écho et bruit de ses pas.
// La démarche (bipède, quadrupède…) viendra de la fiche de chaque forme ; en attendant : bipède.
import type { Etat, Stade } from '@/moteur/simulation';

export type Demarche = 'bipede' | 'quadrupede' | 'sautillant' | 'flottant' | 'rampant';

/** Taille de référence de chaque stade (m), multipliée par le facteur propre à l'individu (DEV_PHASE_SIZE_FACTOR × 0,9 m). */
export const TAILLE_STADE: Record<Stade, number> = { bebe: 0.45, enfant: 0.675, adolescent: 0.9, adulte: 1.035 };

export interface Profil {
  demarche: Demarche;
  taille: number;
  poids: number;
  /** Durée d'un cycle de pas complet (s). */
  cycle: number;
  /** Vitesse au sol (px/s dans le repère 1280 × 800). */
  vitesse: number;
  /** Instants des appuis dans un cycle (0–1) ; null : déplacement continu (flottant, rampant). */
  motif: number[] | null;
  /** Facteur d'affichage : l'image de référence correspond à 90 cm. */
  echelle: number;
}

export function profilEcho(e: Pick<Etat, 'stade' | 'taille' | 'poids'>, demarche: Demarche = 'bipede', allure = 1): Profil {
  const taille = TAILLE_STADE[e.stade] * e.taille;
  const poids = e.poids;
  const grandeur = Math.sqrt(Math.max(0.2, taille) / 0.9);
  const rythme = 1 / allure;
  const base = { bipede: 0.64, quadrupede: 0.6, sautillant: 0.62, flottant: 1.4, rampant: 0.9 }[demarche];
  const cycle = base * grandeur * Math.pow(Math.max(1, poids) / 20, 0.08) * rythme;
  const vitesse = { bipede: 62, quadrupede: 80, sautillant: 70, flottant: 48, rampant: 34 }[demarche] * grandeur / rythme;
  const motif = { bipede: [0, 0.5], quadrupede: [0, 0.12, 0.5, 0.62], sautillant: [0.02], flottant: null, rampant: null }[demarche];
  return { demarche, taille, poids, cycle, vitesse, motif, echelle: Math.max(0.45, Math.min(2.4, taille / 0.9)) };
}

/** Volume des pas : maximal au premier plan, plus faible quand l'écho s'éloigne vers le fond. */
export function volumePas(y: number) {
  const proche = Math.max(0, Math.min(1, (y - 235) / 135));
  return 1.15 * (0.18 + 0.82 * Math.pow(proche, 1.4));
}
