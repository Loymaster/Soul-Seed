// Les déjections au ranch : leur taille suit celle de l'écho qui les a laissées.
// L'image de la maquette (56 × 52) a été dessinée à côté d'un écho Enfant (échelle d'affichage 0,75) ;
// une déjection est donc à l'échelle (échelle de l'écho ÷ 0,75), et suit la perspective du sol comme l'écho.
// L'échelle de l'écho vient de profilEcho (demarche.ts : taille du stade × taille propre à l'individu),
// au stade où il l'a laissée (un bébé devenu enfant ne fait pas grossir ses anciennes crottes).
import type { Dejection, Etat } from '@/moteur/simulation';
import { profilEcho } from './demarche';
import { perspective } from './visiteur';

/** Taille de l'image de la maquette, et échelle de l'écho à côté duquel elle a été dessinée. */
export const DEJECTION_REFERENCE = { l: 56, h: 52, echelle: 0.75 } as const;
/** Bornes de lisibilité (une déjection de bébé reste cliquable, celle d'un grand adulte ne mange pas le décor). */
const BORNES = { min: 0.5, max: 1.7 } as const;

/** Échelle d'une déjection pour un écho d'échelle d'affichage `echelleEcho`, posée à la profondeur `piedY`. */
export function echelleDejection(echelleEcho: number, piedY?: number): number {
  const k = echelleEcho / DEJECTION_REFERENCE.echelle;
  // perspective : la ligne des pieds de l'écho est à +232 sous le coin de son cadre
  const p = piedY == null ? 1 : perspective(piedY - 232);
  return Math.max(BORNES.min, Math.min(BORNES.max, k * p));
}

/**
 * Où et à quelle taille dessiner une déjection (repère 1280 × 800) : l'image garde le bas-centre de la maquette,
 * la zone cliquable (64 × 60) reste centrée sur l'image.
 */
export function placerDejection(d: Dejection, e: Pick<Etat, 'stade' | 'taille' | 'poids'>) {
  const x0 = Math.round(250 + d.x * 760), y0 = Math.round(430 + d.y * 160);
  const { l: L, h: H } = DEJECTION_REFERENCE;
  const pied = y0 + H;
  const echelle = profilEcho({ stade: d.stade ?? e.stade, taille: e.taille, poids: e.poids }).echelle;
  const k = echelleDejection(echelle, pied);
  const l = Math.round(L * k), h = Math.round(H * k);
  const x = Math.round(x0 + (L - l) / 2), y = pied - h;
  return { x, y, l, h, z: 100 + y0 - 200, bx: Math.round(x + l / 2 - 32 + 4), by: Math.round(y + h / 2 - 30 + 4), echelle: k };
}
